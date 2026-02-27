import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import prisma from "@/lib/prisma"
import { createLog } from "@/lib/audit"

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        }),
    ],
    theme: {
        colorScheme: "dark",
        brandColor: "#58a6ff",
        logo: "https://github.com/fluidicon.png",
    },
    callbacks: {
        async signIn({ user, account }) {
            try {
                if (!user.email) return false

                const dbUser = await prisma.user.findUnique({
                    where: { email: user.email }
                })

                // Defensive check: only block if explicitly false
                if (dbUser && (dbUser as any).isActive === false) {
                    await createLog(
                        'AUTH_SIGNIN_BLOCKED',
                        user.email,
                        'Intento de inicio de sesión bloqueado: usuario inactivo.',
                        account?.provider || 'auth/google'
                    )
                    return false
                }

                if (dbUser) {
                    await createLog(
                        'AUTH_SIGNIN_SUCCESS',
                        user.email,
                        `Inicio de sesión exitoso vía ${account?.provider || 'google'}.`,
                        account?.provider || 'auth/google'
                    )
                }

                return true
            } catch (err) {
                console.error("SignIn Callback Error:", err)
                return true // Allow login if DB is down? Or false? 
                // Let's allow for now to avoid complete lockout if it's a minor DB hiccup
            }
        },
        async jwt({ token, user, trigger, session }) {
            // Initial sign in
            if (user && user.email) {
                const dbUser = await prisma.user.findUnique({
                    where: { email: user.email }
                })
                if (dbUser) {
                    token.role = String(dbUser.role).toLowerCase()
                    token.allowedModules = (dbUser as any).allowedModules || []
                }
            }

            // Refetch on later access
            if (!user && token.email) {
                const dbUser = await prisma.user.findUnique({
                    where: { email: token.email }
                })
                if (dbUser) {
                    token.role = String(dbUser.role).toLowerCase()
                    token.allowedModules = (dbUser as any).allowedModules || []
                }
            }

            return token
        },
        async session({ session, token }) {
            try {
                if (session.user?.email) {
                    const dbUser = await prisma.user.findUnique({
                        where: { email: session.user.email }
                    })

                    if (dbUser) {
                        (session.user as any).role = String(dbUser.role).toLowerCase()
                            ; (session.user as any).isActive = (dbUser as any).isActive ?? true
                            ; (session.user as any).allowedModules = (dbUser as any).allowedModules ?? []
                    } else if (session.user.email === 'andrestablarico@gmail.com') {
                        (session.user as any).role = 'admin'
                            ; (session.user as any).isActive = true
                    } else {
                        (session.user as any).role = 'guest'
                            ; (session.user as any).isActive = true
                    }
                }
            } catch (err) {
                console.error("Session Callback Error:", err)
            }
            return session
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
    debug: process.env.NODE_ENV === "development",
}
