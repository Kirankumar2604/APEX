import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "PrescriptionNet - Patient Sovereign Health",
  description:
    "Patient-Sovereign, Signature-Verified Prescription Intelligence Network. Your Health Data. Your Control. Your Signature.",
  keywords: [
    "prescription",
    "patient sovereignty",
    "health data",
    "ECDSA signatures",
    "medication safety",
    "fraud detection",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{ backgroundColor: "#0f172a", color: "#f1f5f9" }}
      >
        {children}
      </body>
    </html>
  );
}
