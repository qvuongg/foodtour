/** Public configuration validation shared by Vite and the browser. Never include values in errors. */
type Environment = Record<string, unknown>;

export interface PublicSupabaseConfig {
  url: string;
  key: string;
  keyKind: "anon-jwt" | "publishable";
}

function jwtRole(value: string): unknown {
  const parts = value.split(".");
  if (parts.length !== 3 || parts.some((part) => !/^[A-Za-z0-9_-]+$/.test(part))) return undefined;
  try {
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(payload.padEnd(Math.ceil(payload.length / 4) * 4, "="))).role;
  } catch {
    return undefined;
  }
}

function containsServerCredential(value: string): boolean {
  if (value.includes("sb_secret_")) return true;
  // Also catch credentials accidentally embedded in JSON, a URL or a Bearer header.
  return (value.match(/[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g) ?? [])
    .some((token) => jwtRole(token) === "service_role");
}

function configFromEnvironment(env: Environment): PublicSupabaseConfig | null {
  const urlValue = typeof env.VITE_SUPABASE_URL === "string" ? env.VITE_SUPABASE_URL.trim() : "";
  const key = typeof env.VITE_SUPABASE_ANON_KEY === "string" ? env.VITE_SUPABASE_ANON_KEY.trim() : "";
  if (!urlValue && !key) return null;
  if (!urlValue || !key) throw new Error("Public Supabase configuration requires both a URL and a public key.");

  let url: URL;
  try {
    url = new URL(urlValue);
  } catch {
    throw new Error("Public Supabase URL is invalid.");
  }
  const localHttp = url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if ((url.protocol !== "https:" && !localHttp) || url.username || url.password || url.search || url.hash || url.pathname !== "/") {
    throw new Error("Public Supabase URL must be an HTTPS origin (or a local development origin).");
  }

  const keyKind = /^sb_publishable_[A-Za-z0-9_-]+$/.test(key)
    ? "publishable"
    : jwtRole(key) === "anon" ? "anon-jwt" : null;
  if (!keyKind) throw new Error("Public Supabase key must be an anon JWT or a publishable key.");
  return { url: url.origin, key, keyKind };
}

/** Fail development/build before Vite can expose server credentials through import.meta.env. */
export function assertSafePublicEnvironment(env: Environment): void {
  const privateValues = Object.entries(env)
    .filter(([name, value]) => !name.startsWith("VITE_") && /(?:SECRET|PRIVATE|SERVICE_ROLE|ADMIN_KEY|ACCESS_TOKEN|PASSWORD)/i.test(name)
      && typeof value === "string" && value.trim().length > 0)
    .map(([, value]) => (value as string).trim());
  for (const [name, value] of Object.entries(env)) {
    if (!name.startsWith("VITE_") || typeof value !== "string") continue;
    if (containsServerCredential(value) || privateValues.some((privateValue) => value.trim() === privateValue
      || (privateValue.length >= 16 && value.includes(privateValue)))) {
      throw new Error("Unsafe public environment: VITE_ variables must never contain server credentials.");
    }
  }
  configFromEnvironment(env);
}

/** Defense in depth: disable DB access for absent/invalid public configuration, without a project fallback. */
export function readPublicSupabaseConfig(env: Environment): PublicSupabaseConfig | null {
  try {
    assertSafePublicEnvironment(env);
    return configFromEnvironment(env);
  } catch {
    return null;
  }
}

export function publicSupabaseHeaders(config: PublicSupabaseConfig): Record<string, string> {
  return {
    apikey: config.key,
    // Publishable API keys are not JWTs. Supabase's gateway handles anon authorization via apikey.
    ...(config.keyKind === "anon-jwt" ? { Authorization: `Bearer ${config.key}` } : {}),
  };
}
