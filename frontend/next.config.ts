import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    // Determine backend destination:
    // In Docker container, use http://backend:8080 or process.env.BACKEND_URL
    // In local development, use http://127.0.0.1:8080
    const backendTarget =
      process.env.BACKEND_URL ||
      process.env.INTERNAL_BACKEND_URL ||
      "http://127.0.0.1:8080";

    return [
      {
        source: "/api/:path*",
        destination: `${backendTarget.replace(/\/api$/, "")}/api/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${backendTarget.replace(/\/api$/, "")}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
