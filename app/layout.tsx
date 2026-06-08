import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AV Marketing Budget",
  description: "All Volleyball internal marketing budget. Live, persisted, on-brand.",
  robots: { index: false, follow: false },
  icons: { icon: "/logo.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
