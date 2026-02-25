import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"

export const metadata: Metadata = {
  title: "Ayurveda Admin Dashboard",
  description: "Admin dashboard for Ayurvedic e-commerce platform",
  generator: "v0.app",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
}

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`antialiased ${inter.className}`}>
        {children}
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
