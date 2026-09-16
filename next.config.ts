import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Vercel's image optimizer is off.
    //
    // Every /_next/image request was returning 402
    // OPTIMIZED_IMAGE_REQUEST_PAYMENT_REQUIRED once the plan's transformation
    // allowance ran out, which broke every remote image on the site at once:
    // contender artwork, avatars, arena posters. Serving the uploads directly
    // costs nothing and cannot run out.
    //
    // The trade is that nothing is resized or re-encoded on the way out, so
    // uploads have to arrive small. ImageUpload downscales to 1200px WebP in
    // the browser before it stores anything, which keeps a contender image
    // around 100-200KB, roughly what the optimizer was producing anyway.
    //
    // To turn optimization back on after upgrading the plan, delete this line.
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'api.dicebear.com' },
      // Contender uploads land in Supabase Storage. Without this every
      // uploaded image silently fails to render in next/image.
      { protocol: 'https', hostname: '*.supabase.co', pathname: '/storage/v1/object/public/**' }
    ]
  }
};

export default nextConfig;
