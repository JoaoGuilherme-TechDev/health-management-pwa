import type { Metadata, Viewport } from "next"
import { Montserrat, Raleway, Lato, Playfair_Display } from "next/font/google"
import "./globals.css"
import ClientLayout from "./clientLayout"
import { ThemeProvider } from "@/components/theme-provider"

const montserrat = Montserrat({ 
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-montserrat',
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
})

const raleway = Raleway({ 
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-raleway',
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
})

const lato = Lato({ 
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-lato',
  weight: ["100", "300", "400", "700", "900"],
})

const playfair = Playfair_Display({
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-playfair',
  weight: ["400", "500", "600", "700", "800", "900"],
})

export const metadata: Metadata = {
  title: "Dra. Estefânia Rappelli - Nutrologia e Performance",
  description: "Acompanhamento médico especializado em nutrologia e performance.",
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
  return (
    <html lang="pt-BR" className={`${montserrat.variable} ${raleway.variable} ${lato.variable} ${playfair.variable}`} suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Dra. Estefânia Rappelli" />
        <link rel="apple-touch-icon" href="/icon.svg" />
        {/* Fallback para favicon */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
      </head>
      <ClientLayout>{children}</ClientLayout>
    </html>
  )
}
