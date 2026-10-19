import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "신나는 인공지능과 윤리 탐험",
  description:
    "신나는 인공지능과 윤리 탐험 교재를 마무리하며 마을을 탐험하는 어린이 교육용 웹 게임",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#173f43",
  // A bright picture-book game: browsers' forced dark modes (Whale, Chrome flags) must not darken it.
  colorScheme: "only light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
