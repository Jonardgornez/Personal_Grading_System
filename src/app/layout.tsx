import type { Metadata } from "next";

import "./globals.css";
import { ToastProvider } from "@/context/ToastProvider";

export const metadata: Metadata = {
  title: "GradeSync",
  description: "Grading and attendance management for NORSU faculty",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={` h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
