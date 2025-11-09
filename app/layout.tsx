import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono, Audiowide, Comic_Neue } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })
const aurora = Audiowide({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-aurora",
})
const comicFont = Comic_Neue({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-comic",
})

export const metadata: Metadata = {
  title: "v0 App",
  description: "Created with v0",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${aurora.className} ${comicFont.variable} font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
