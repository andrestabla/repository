import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import Sidebar from '@/components/Sidebar'

const inter = Inter({ subsets: ['latin'], variable: '--font-main' })
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' })

export const metadata: Metadata = {
  title: '4Shine • Methodology Builder (Internal)',
  description: 'Sistema de registro y generación de metodología 4Shine.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className={`${inter.variable} ${jetbrainsMono.variable} antialiased h-screen overflow-hidden`}>
        <div className="grid grid-cols-[250px_1fr] h-full">
          <Sidebar />
          <main className="overflow-y-auto p-10 bg-bg text-text">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
