import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "PayTrack",
  description: "Upload, confirm and track your Australian payslips",
  icons: {
    icon: [{ url: "/brand/paytrack-favicon.png", type: "image/png" }],
    apple: "/brand/paytrack-favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        {/* Applies the saved theme before first paint so the page never flashes
            the wrong palette on load. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("paytrack-theme");if(t==="dark"||t==="light")document.documentElement.dataset.theme=t}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
