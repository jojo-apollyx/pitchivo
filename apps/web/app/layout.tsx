import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import JsonLd from "./json-ld";
import { GlobalThemeLoader } from "@/components/global-theme-loader";
import "./../globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL("https://pitchivo.com"),
  title: {
    default: "Pitchivo - AI-Powered B2B Outreach for Ingredient Suppliers",
    template: "%s | Pitchivo",
  },
  description:
    "Transform ingredient specs into AI-generated product pages. Reach verified buyers with smart cold email campaigns. Track analytics, manage RFQs, and close deals faster. Perfect for food ingredients, supplements, and chemical suppliers.",
  keywords: [
    "B2B outreach",
    "ingredient suppliers",
    "AI product pages",
    "cold email campaigns",
    "buyer database",
    "RFQ management",
    "food ingredients",
    "dietary supplements",
    "B2B sales automation",
    "supplier platform",
    "ingredient marketing",
    "export platform",
  ],
  authors: [{ name: "Pitchivo" }],
  creator: "Pitchivo",
  publisher: "Pitchivo",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://pitchivo.com",
    siteName: "Pitchivo",
    title: "Pitchivo - AI-Powered B2B Outreach for Ingredient Suppliers",
    description:
      "Turn your ingredient specs into AI-generated product pages and reach verified buyers instantly. Smart campaigns, precision tracking, real RFQs.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Pitchivo - AI for B2B Outreach",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pitchivo - AI-Powered B2B Outreach",
    description:
      "Turn ingredient specs into AI-generated product pages. Reach verified buyers instantly.",
    images: ["/og-image.png"],
    creator: "@pitchivo",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/web-app-manifest-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/web-app-manifest-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/web-app-manifest-192x192.png", sizes: "192x192", type: "image/png" }],
  },
  manifest: "/manifest.json",
  alternates: {
    canonical: "https://pitchivo.com",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <JsonLd />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        
        {/* Apple Touch Icon */}
        <link rel="apple-touch-icon" href="/web-app-manifest-192x192.png" />
        
        {/* iOS meta tags for PWA */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Pitchivo" />
        
        {/* Microsoft Tiles */}
        <meta name="msapplication-TileColor" content="#00FA9A" />
        <meta name="msapplication-TileImage" content="/web-app-manifest-192x192.png" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
      </head>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <GlobalThemeLoader />
          {children}
          <Toaster position="top-center" richColors />
        </ThemeProvider>
        
        {/* Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) {
                      console.log('ServiceWorker registration successful');
                    },
                    function(err) {
                      console.log('ServiceWorker registration failed: ', err);
                    }
                  );
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}

