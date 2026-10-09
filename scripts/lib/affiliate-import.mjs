/** Shared, fail-closed affiliate import rules. No environment access or implicit writes. */
const SOURCE_HOSTS = new Set(['shopeefood.vn', 'www.shopeefood.vn']);
const AFFILIATE_HOSTS = new Set(['shope.ee', 's.shopee.vn', 'spf.shopee.vn']);

function officialUrl(value, hosts, label) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${label}: missing URL`);
  const raw = value.trim();
  let url;
  try { url = new URL(raw); } catch { throw new Error(`${label}: invalid URL`); }
  if (url.protocol !== 'https:' || !hosts.has(url.hostname) || url.username || url.password || url.port || /[\\\u0000-\u0020\u007f]/u.test(raw)) {
    throw new Error(`${label}: requires an approved HTTPS host, without credentials, port or whitespace`);
  }
  if (url.pathname === '/') throw new Error(`${label}: missing destination path`);
  return { raw, url };
}

export function canonicalRestaurantUrl(value) {
  const { url } = officialUrl(value, SOURCE_HOSTS, 'Original URL');
  // Only restaurant listing paths. Collection/search/affiliate landing URLs have other importers.
  const parts = url.pathname.replace(/\/+$/, '').split('/').filter(Boolean);
  const nonRestaurantRoutes = new Set(['bo-suu-tap', 'food', 'now-food', 'collection', 'collection-list', 'search', 'danh-sach-dia-diem-giao-tan-noi']);
  if (parts.length !== 2 || parts.some(part => nonRestaurantRoutes.has(decodeURIComponent(part).toLowerCase()))) {
    throw new Error('Original URL: expected a city/restaurant listing path');
  }
  return `https://shopeefood.vn/${parts.join('/')}`;
}

export function validateAffiliateUrl(value) {
  return officialUrl(value, AFFILIATE_HOSTS, 'Affiliate URL').raw;
}

export function normalizeMappings(rows) {
  const unique = new Map();
  const errors = [];
  for (const [index, row] of rows.entries()) {
    const source = row.source || `row ${index + 1}`;
    try {
      const original_url = canonicalRestaurantUrl(row.original_url);
      const affiliate_url = validateAffiliateUrl(row.affiliate_url);
      const previous = unique.get(original_url);
      if (previous && previous.affiliate_url !== affiliate_url) throw new Error('conflicting affiliate links for the same canonical restaurant');
      if (!previous) unique.set(original_url, { original_url, affiliate_url, source });
    } catch (error) { errors.push({ source, reason: error.message }); }
  }
  if (!unique.size && !errors.length) errors.push({ reason: 'No converted affiliate mappings found' });
  return { mappings: [...unique.values()], errors };
}

/** RFC 4180-style CSV, including quoted commas, escaped quotes and multiline cells. */
export function parseCsv(text) {
  const rows = []; let row = []; let cell = ''; let quoted = false; let closed = false;
  const input = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (quoted) {
      if (char === '"' && input[i + 1] === '"') { cell += '"'; i++; }
      else if (char === '"') { quoted = false; closed = true; }
      else cell += char;
    } else if (char === ',' || char === '\n' || char === '\r') {
      row.push(cell); cell = ''; closed = false;
      if (char !== ',') { if (row.some(value => value.trim())) rows.push(row); row = []; if (char === '\r' && input[i + 1] === '\n') i++; }
    } else if (char === '"' && !cell && !closed) quoted = true;
    else { if (closed || char === '"') throw new Error('Malformed CSV quoting'); cell += char; }
  }
  if (quoted) throw new Error('Unclosed CSV quote');
  if (cell || row.length || closed) { row.push(cell); if (row.some(value => value.trim())) rows.push(row); }
  return rows;
}

export function serializeCsv(rows) {
  return rows.map(row => row.map(value => /[",\r\n]/.test(String(value)) ? `"${String(value).replaceAll('"', '""')}"` : String(value)).join(',')).join('\n') + '\n';
}

function headerKey(value) { return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replaceAll('đ', 'd').toLowerCase().trim(); }
export function mappingColumns(header) {
  const names = header.map(headerKey);
  const original = names.findIndex(name => ['original_url', 'original url', 'lien ket goc', 'link shopeefood goc'].includes(name));
  const affiliate = names.findIndex(name => ['affiliate_url', 'affiliate url', 'converted link', 'lien ket chuyen doi'].includes(name) || name.startsWith('link affiliate'));
  if (original < 0 || affiliate < 0) throw new Error('CSV must have named original and affiliate/converted-link columns');
  return { original, affiliate };
}

export function mappingsFromCsv(text, source) {
  const rows = parseCsv(text); if (!rows.length) throw new Error('Empty CSV');
  const columns = mappingColumns(rows[0]);
  const mappings = []; let skipped = 0;
  rows.slice(1).forEach((row, index) => {
    const affiliate_url = row[columns.affiliate]?.trim();
    if (!affiliate_url) { skipped++; return; }
    mappings.push({ original_url: row[columns.original]?.trim(), affiliate_url, source: `${source}:${index + 2}` });
  });
  return { mappings, skipped };
}

export function planImport(mappings, restaurants, { replaceExisting = false } = {}) {
  const index = new Map();
  for (const row of restaurants) {
    try {
      const key = canonicalRestaurantUrl(row.original_url);
      index.set(key, [...(index.get(key) || []), row]);
    } catch { /* Unrelated, invalid stored URLs cannot match an import. */ }
  }
  const changes = []; const unchanged = []; const errors = [];
  for (const mapping of mappings) {
    const matches = index.get(mapping.original_url) || [];
    if (matches.length !== 1) { errors.push({ source: mapping.source, original_url: mapping.original_url, reason: `Expected exactly one restaurant; found ${matches.length}` }); continue; }
    const row = matches[0];
    if (typeof row.id !== 'string' || !row.id.trim()) { errors.push({ original_url: mapping.original_url, reason: 'Missing stable restaurant ID' }); continue; }
    if (row.affiliate_url === mapping.affiliate_url) { unchanged.push({ id: row.id, original_url: mapping.original_url }); continue; }
    if (row.affiliate_url && !replaceExisting) { errors.push({ original_url: mapping.original_url, reason: 'Existing affiliate differs; review and pass --replace-existing to replace intentionally' }); continue; }
    if (row.affiliate_url) {
      try { validateAffiliateUrl(row.affiliate_url); }
      catch { errors.push({ original_url: mapping.original_url, reason: 'Existing affiliate URL is invalid; reconcile manually before replacement' }); continue; }
    }
    changes.push({ id: row.id, original_url: row.original_url, canonical_url: mapping.original_url, previous_affiliate_url: row.affiliate_url ?? null, affiliate_url: mapping.affiliate_url, source: mapping.source, status: 'planned' });
  }
  return { changes, unchanged, errors };
}

function queryValue(value) { return `"${String(value).replaceAll('\\', '\\\\').replaceAll('"', '\\"')}"`; }

export function createRestaurantStore({ url, key, headers: suppliedHeaders, fetchImpl = fetch }) {
  const base = new URL(url);
  if (base.protocol !== 'https:' || base.username || base.password || base.pathname !== '/' || base.search || base.hash) throw new Error('Invalid Supabase HTTPS project URL');
  const headers = suppliedHeaders || { apikey: key, Authorization: `Bearer ${key}` };
  async function request(params, options = {}) {
    const endpoint = new URL('/rest/v1/restaurants', base);
    endpoint.search = new URLSearchParams(params).toString();
    let response;
    try { response = await fetchImpl(endpoint, { ...options, headers: { ...headers, ...options.headers }, signal: AbortSignal.timeout(30000) }); }
    catch { throw new Error('Database request failed; no response details logged'); }
    if (!response.ok) throw new Error(`Database request failed (HTTP ${response.status})`);
    let rows;
    try { rows = await response.json(); } catch { throw new Error('Database returned invalid JSON'); }
    if (!Array.isArray(rows)) throw new Error('Database returned an unexpected result shape');
    return rows;
  }
  return {
    async readAll() {
      const rows = []; let offset = 0;
      // Do not stop at a short page: the server may cap its limit below ours.
      while (true) {
        const page = await request({ select: 'id,original_url,affiliate_url', order: 'id.asc', offset: String(offset), limit: '1000' });
        if (!page.length) break;
        rows.push(...page); offset += page.length;
        if (offset > 1000000) throw new Error('Unexpected dataset size; aborted before writes');
      }
      if (new Set(rows.map(row => row.id)).size !== rows.length) throw new Error('Unstable or duplicate database rows; retry preflight');
      return rows;
    },
    async apply(change) {
      // Compare-and-set protects against concurrent crawls/imports. Never match a prefix.
      const rows = await request({ id: `eq.${queryValue(change.id)}`, original_url: `eq.${queryValue(change.original_url)}`, affiliate_url: change.previous_affiliate_url === null ? 'is.null' : `eq.${queryValue(change.previous_affiliate_url)}`, select: 'id,original_url,affiliate_url' }, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json', Prefer: 'return=representation' }, body: JSON.stringify({ affiliate_url: change.affiliate_url })
      });
      if (rows.length !== 1 || rows[0].id !== change.id || rows[0].original_url !== change.original_url || rows[0].affiliate_url !== change.affiliate_url) throw new Error('Write verification failed: expected exactly one matching changed row; stop and reconcile report');
      const verified = await request({ id: `eq.${queryValue(change.id)}`, select: 'id,original_url,affiliate_url' });
      if (verified.length !== 1 || verified[0].original_url !== change.original_url || verified[0].affiliate_url !== change.affiliate_url) throw new Error('Read-back verification failed; stop and reconcile report');
    }
  };
}

export async function executePlan(plan, store, { apply = false, onProgress = async () => {} } = {}) {
  if (plan.errors.length) throw new Error(`Preflight blocked: ${plan.errors.length} conflict(s); no writes performed`);
  if (!apply) return { verified: 0, dryRun: true };
  let verified = 0;
  for (const change of plan.changes) {
    // A crash/network error can happen after the server commits: record this before sending.
    change.status = 'pending_verification'; await onProgress();
    try { await store.apply(change); change.status = 'verified'; verified++; await onProgress(); }
    catch (error) { change.status = 'requires_reconciliation'; await onProgress(); throw error; }
  }
  return { verified, dryRun: false };
}
