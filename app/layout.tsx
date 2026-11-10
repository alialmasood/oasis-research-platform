import type { Metadata } from "next";
import { Cairo, Inter } from "next/font/google";
import "./globals.css";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  process.env.NEXTAUTH_URL?.replace(/\/$/, "") ||
  "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "منصة البحث العلمي - جامعة البصرة",
    template: "%s | منصة البحث العلمي",
  },
  description:
    "واحة الباحث — منصة البحث العلمي لجامعة البصرة. صمّمها وبنىها من الصفر علي حسين مزهر المسعود (Ali Hussein Mezher Almasood).",
  authors: [
    { name: "علي حسين مزهر المسعود" },
    { name: "Ali Hussein Mezher Almasood" },
  ],
  creator: "Ali Hussein Mezher Almasood",
  icons: {
    icon: "/ooiissiiss.png",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body
        className={`${cairo.variable} ${inter.variable} font-sans antialiased overflow-y-scroll`}
        style={{ scrollbarGutter: "stable" }}
      >
        {children}
      </body>
    </html>
  );
}
