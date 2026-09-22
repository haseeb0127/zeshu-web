import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import PwaBoot from "./components/PwaBoot";
import { CustomerLanguageProvider } from "./components/CustomerLanguageProvider";

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
  themeColor: "#0B6F47",
  colorScheme: "light",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://zeshu.in"),
  title: "Zeshu",
  applicationName: "Zeshu",
  description: "Jagtial fast delivery and India-wide digital services with Zeshu.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/zeshu-icon.svg",
    apple: "/zeshu-icon.svg",
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
  <CustomerLanguageProvider>{children}</CustomerLanguageProvider>
</body>
    </html>
  );
}
