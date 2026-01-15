import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import Shell from '@/components/Shell'

const inter = Inter({ subsets: ['latin'], variable: '--font-main' })
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' })

export const metadata: Metadata = {
  title: '4Shine • Methodology Builder (Internal)',
  description: 'Sistema de registro y generación de metodología 4Shine.',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await getServerSession(authOptions)

  return (
    <html lang="es">
      <body className={`${inter.variable} ${jetbrainsMono.variable} antialiased h-screen overflow-hidden`}>
        <Shell session={session}>
          {children}
        </Shell>
      </body>
    </html>
  )
}
