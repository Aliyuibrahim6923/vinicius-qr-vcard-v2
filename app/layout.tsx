import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Vinicius Group", template: "%s | Vinicius Group" },
  description: "Official Vinicius Group digital contact cards."
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#191a1b" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
