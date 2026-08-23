import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const jakartaSans = Plus_Jakarta_Sans({
  variable: "--font-jakarta-sans",
  subsets: ["latin"],
});

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://my.helloprodigi.pro";
const title = "MyProdigi by DTC PRODIGI";
const description = "Compete, connect, and grow with MyProdigi";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title,
  description,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MyProdigi",
  },
  icons: {
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title,
    description,
    url: baseUrl,
    siteName: "MyProdigi",
    images: [{ url: "/icon-512x512.png", width: 512, height: 512 }],
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary",
    title,
    description,
    images: ["/icon-512x512.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#0f0f14",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${jakartaSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster position="bottom-right" toastOptions={{ duration: 3000, className: 'rounded-xl text-sm font-medium shadow-lg' }} />
      </body>
    </html>
  );
}
