import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    // The geography moved twice (D-113, then D-118's re-ruling): the browse
    // surface is now /bits; /notes is the notes ROOM (written pieces). Old
    // bookmarks keep landing somewhere sensible. And find → search (2026-08-29):
    // /find (with any ?tag=/?q=) redirects to /search.
    return [
      { source: "/inbox", destination: "/bits", permanent: true },
      { source: "/find", destination: "/search", permanent: true },
    ];
  },
};

export default nextConfig;
