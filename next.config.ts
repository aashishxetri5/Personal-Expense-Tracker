import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // `typedRoutes` is deliberately left off: most links here are built at runtime
  // from the selected month and the active filters, so a static route type
  // cannot check them and would only add casts.
};

export default nextConfig;
