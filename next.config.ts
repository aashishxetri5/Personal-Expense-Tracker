import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // `typedRoutes` is deliberately left off: most links here are built at runtime
  // from the selected month and the active filters, so a static route type
  // cannot check them and would only add casts.

  experimental: {
    // Keep visited pages in the client cache for a minute, so going back to a
    // page or a month renders instantly. Every write calls
    // `revalidatePath("/", "layout")`, which clears this cache, so an edit is
    // never hidden behind a stale copy.
    staleTimes: { dynamic: 60 },
  },
};

export default nextConfig;
