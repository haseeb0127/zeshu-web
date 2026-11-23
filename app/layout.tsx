import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import PwaBoot from "./components/PwaBoot";
import { CustomerLanguageProvider } from "./components/CustomerLanguageProvider";
import ZeshuAssistantWidget from "./components/ZeshuAssistantWidget";
import OptionalLayoutFeatureBoundary from "./components/OptionalLayoutFeatureBoundary";
import DepartmentFrame from "./components/DepartmentFrame";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#FCFCF9",
  colorScheme: "light",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://zeshu.in"),
  title: {
    default: "Zeshu — Local Shopping & Everyday Services in Jagtial",
    template: "%s | Zeshu",
  },
  applicationName: "Zeshu",
  description:
    "Explore local groceries in Jagtial, restaurant table requests, scheduled transport quotes, fashion, home services and recharge or bill discovery. Availability depends on verified partners.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/zeshu-glossy-icon.png", sizes: "512x512", type: "image/png" }],
    apple: "/zeshu-glossy-icon.png",
  },
  appleWebApp: {
    capable: true,
    title: "Zeshu",
    statusBarStyle: "black-translucent",
  },
  // Do NOT place a homepage canonical here: route metadata inherits parent
  // fields, which would otherwise mark /dine, /fashion, /move, etc. as duplicates
  // of /. Each search-facing department defines its own canonical.
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    siteName: "Zeshu",
    title: "Zeshu — Local Shopping & Everyday Services in Jagtial",
    description:
      "Need it? Zeshu it. Shop local essentials and explore dining requests, scheduled transport quotes, fashion and everyday services.",
    images: [{
      url: "/zeshu-glossy-icon.png",
      width: 512,
      height: 512,
      alt: "Zeshu official logo",
      type: "image/png",
    }],
  },
};

// Use only real Zeshu identities and actual accessible assets.
// Social sameAs handles will be added after ownership and public URLs are verified.
const organizationWebsiteJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://zeshu.in/#organization",
      name: "Zeshu",
      alternateName: "Zeshu.in",
      url: "https://zeshu.in/",
      logo: {
        "@type": "ImageObject",
        url: "https://zeshu.in/zeshu-glossy-icon.png",
        width: 512,
        height: 512,
      },
      areaServed: {
        "@type": "AdministrativeArea",
        name: "Jagtial district, Telangana, India",
      },
    },
    {
      "@type": "WebSite",
      "@id": "https://zeshu.in/#website",
      url: "https://zeshu.in/",
      name: "Zeshu",
      publisher: { "@id": "https://zeshu.in/#organization" },
    },
  ],
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationWebsiteJsonLd).replace(/</g, "\\u003c"),
          }}
        />
  <OptionalLayoutFeatureBoundary feature="pwa"><PwaBoot /></OptionalLayoutFeatureBoundary>
  <CustomerLanguageProvider><DepartmentFrame>{children}</DepartmentFrame><OptionalLayoutFeatureBoundary feature="assistant"><ZeshuAssistantWidget /></OptionalLayoutFeatureBoundary></CustomerLanguageProvider>
</body>
    </html>
  );
}
