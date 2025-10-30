import type { Metadata } from "next";
import { Geist, JetBrains_Mono } from "next/font/google";
import 'rsuite/dist/rsuite-no-reset.min.css';
import "./globals.css";
import { CustomProvider } from "rsuite";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});


const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CREP",
  description: "CePro Repro Exams Planning, tool to manage exams planning, maintained by CePro, used by Repro @ EPFL.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${jetBrainsMono.variable} antialiased`}
      >
        <CustomProvider>{children}</CustomProvider>
      </body>
    </html>
  );
}
