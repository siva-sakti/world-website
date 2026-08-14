import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    // The loose-notes surface was renamed inbox → notes (D-113, owner ruling);
    // old bookmarks/history keep working.
    return [{ source: "/inbox", destination: "/notes", permanent: true }];
  },
};

export default nextConfig;
