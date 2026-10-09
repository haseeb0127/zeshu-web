import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import PwaBoot from "./components/PwaBoot";
import { CustomerLanguageProvider } from "./components/CustomerLanguageProvider";
import ZeshuAssistantWidget from "./components/ZeshuAssistantWidget";

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
  title: "Zeshu",
  applicationName: "Zeshu",
  description: "Zeshu brings Jagtial shopping, Telangana Move & Courier, India-wide digital services, marketplace discovery and support into one simple platform.",
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
  <PwaBoot />
  <CustomerLanguageProvider>{children}<ZeshuAssistantWidget /></CustomerLanguageProvider>
</body>
    </html>
  );
}
