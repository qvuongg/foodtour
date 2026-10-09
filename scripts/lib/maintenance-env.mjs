/** Private credentials for maintenance scripts. Never fall back to a VITE_* key. */
function isServiceRoleJwt(key) {
  try {
    const parts = key.split(".");
    if (parts.length !== 3) return false;
    return JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")).role === "service_role";
  } catch {
    return false;
  }
}

function assertPrivateKey(key) {
  if (!/^sb_secret_[A-Za-z0-9_-]+$/.test(key) && !isServiceRoleJwt(key)) {
    // Never include a supplied credential in diagnostics.
    throw new Error("Maintenance requires a Supabase secret key or service_role key; public/invalid keys are rejected.");
  }
  return key;
}

export function getMaintenanceKey(env = process.env, { required = false } = {}) {
  const key = (env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  if (!key) {
    if (required) throw new Error("Missing SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY for maintenance.");
    return "";
  }
  return assertPrivateKey(key);
}

export function getMaintenanceHeaders(key) {
  assertPrivateKey(key);
  // Opaque secret keys belong in apikey, not the JWT-only Authorization header.
  return key.startsWith("sb_secret_")
    ? { apikey: key }
    : { apikey: key, Authorization: `Bearer ${key}` };
}
