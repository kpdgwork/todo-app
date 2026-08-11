import type { Metadata } from "next";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "FocusFlow — your day, in focus",
  description: "A calm, focused todo app.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
