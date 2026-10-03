import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Krishank Kureti — CS / AI Engineer",
  description: "A portfolio of systems, experiments, and things worth making.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
