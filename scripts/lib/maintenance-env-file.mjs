import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

/** Shell configuration wins, even when the dotenv file uses another alias of the same setting. */
export function loadMaintenanceEnvFile(filePath = resolve(".env.local"), env = process.env) {
  if (!existsSync(filePath)) return;
  const skipAliases = new Set();
  for (const aliases of [
    ["SUPABASE_SECRET_KEY", "SUPABASE_SERVICE_ROLE_KEY"],
    ["SUPABASE_URL", "VITE_SUPABASE_URL"],
  ]) {
    if (aliases.some((key) => env[key] !== undefined)) aliases.forEach((key) => skipAliases.add(key));
  }
  for (const line of readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index < 1) continue;
    const key = trimmed.slice(0, index).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key) || skipAliases.has(key) || env[key] !== undefined) continue;
    let value = trimmed.slice(index + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    env[key] = value;
  }
}
