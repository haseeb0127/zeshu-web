import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const CLOUDFLARE_BUILD_CHECK_SUPABASE_URL = "https://build-check.supabase.co";
const CLOUDFLARE_BUILD_CHECK_SUPABASE_KEY = "build-check-anon-key";
const ZESHU_STAGING_SUPABASE_URL = "https://xdzgdhupfgsdyzellpqq.supabase.co";
const ZESHU_STAGING_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_SQcjikOTZSoHEh19UNqOpg_ad0o7G7i";

const configuredSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const configuredSupabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

const publicSupabaseUrl =
  !configuredSupabaseUrl || configuredSupabaseUrl === CLOUDFLARE_BUILD_CHECK_SUPABASE_URL
    ? ZESHU_STAGING_SUPABASE_URL
    : configuredSupabaseUrl;

const publicSupabaseKey =
  !configuredSupabaseKey || configuredSupabaseKey === CLOUDFLARE_BUILD_CHECK_SUPABASE_KEY
    ? ZESHU_STAGING_SUPABASE_PUBLISHABLE_KEY
    : configuredSupabaseKey;

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: publicSupabaseUrl,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: publicSupabaseKey,
  },
};

export default nextConfig;
