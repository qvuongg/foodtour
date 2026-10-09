/** Explicit HTTPS origin for private maintenance requests; never include supplied values in errors. */
export function getMaintenanceUrl(env = process.env) {
  const value = (env.SUPABASE_URL ?? env.VITE_SUPABASE_URL ?? "").trim();
  if (!value) throw new Error("Maintenance requires SUPABASE_URL or VITE_SUPABASE_URL.");
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error("Maintenance Supabase URL is invalid.");
  }
  if (url.protocol !== "https:" || url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
    throw new Error("Maintenance Supabase URL must be an HTTPS origin without credentials, path, query or fragment.");
  }
  return url.origin;
}
