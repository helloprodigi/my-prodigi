import type { MetadataRoute } from "next";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://my.helloprodigi.pro";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/login", "/register", "/faq"],
        disallow: [
          "/api/",
          "/dashboard",
          "/home",
          "/matchmaking",
          "/competitions",
          "/achievements",
          "/library",
          "/notifications",
          "/onboarding",
          "/aslab-onboarding",
          "/aslab-proker",
          "/my-divisi",
          "/myshift",
          "/agenda",
          "/absensi",
          "/profile",
          "/team-invite",
          "/admin",
          "/scan-absensi",
          "/forgotPassword",
          "/request-reset",
          "/verify-otp",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
