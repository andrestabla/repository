import type { Metadata } from 'next'
import './globals.css'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import Shell from '@/components/Shell'
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: '4Shine • Methodology Builder (Internal)',
  description: 'Sistema de registro y generación de metodología 4Shine.',
}

import { Providers } from '@/components/Providers'

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await getServerSession(authOptions)

  return (
    <html lang="es">
      <body className={`antialiased h-screen overflow-hidden`}>
        <Providers>
          <Shell session={session}>
            {children}
            <Toaster richColors position="bottom-right" />
          </Shell>
        </Providers>
      </body>
    </html>
  )
}
