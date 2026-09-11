import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseHostname = supabaseUrl ? new URL(supabaseUrl).hostname : null;

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Four photos of 5,242,880 bytes plus multipart overhead and text fields.
      bodySizeLimit: "21mb",
    },
  },
  images: {
    // Signed post photos are served by the Supabase Storage host.
    remotePatterns: supabaseHostname
      ? [
          {
            protocol: "https",
            hostname: supabaseHostname,
            pathname: "/storage/v1/object/sign/**",
          },
        ]
      : [],
  },
};

export default nextConfig;
