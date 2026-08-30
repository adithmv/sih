import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Migrant Health & Claim ID",
  description:
    "Access your migrant worker health identity and insurance claims.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
