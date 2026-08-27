import type { MetadataRoute } from "next";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://my.helloprodigi.pro";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        // "/competitions/" (with trailing slash) is more specific than the
        // "/competitions" disallow below, so per-competition share pages
        // stay crawlable/previewable while the login-gated list does not.
        allow: ["/", "/login", "/register", "/competitions/"],
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
          "/faq",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
