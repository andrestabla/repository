
'use client'

import { SessionProvider } from "next-auth/react"
import AuditTracker from "./AuditTracker"

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <AuditTracker />
            {children}
        </SessionProvider>
    )
}
