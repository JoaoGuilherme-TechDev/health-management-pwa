import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import ClientLayout from "./clientLayout"
import { useEffect } from "react"

const geist = Geist({ 
  subsets: ["latin"],
  display: 'swap',
})

const geistMono = Geist_Mono({ 
  subsets: ["latin"],
  display: 'swap',
})

export const metadata: Metadata = {
  title: "HealthCare+ - Gerenciamento de Saúde",
  description: "Sistema completo de gerenciamento de saúde para pacientes e profissionais médicos.",
  generator: "v0.app",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-icon.png",
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js')
        .then(registration => {
          console.log('✅ Service Worker registered with scope:', registration.scope)
        })
        .catch(error => {
          console.error('❌ Service Worker registration failed:', error)
        })
    }
  }, [])
  
  return (
    <html lang="pt-BR" className={`${geist.className}`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="HealthCare+" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
        {/* Fallback para favicon */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
      </head>
      <ClientLayout>{children}</ClientLayout>
    </html>
  )
}
