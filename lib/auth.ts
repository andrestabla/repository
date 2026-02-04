import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import prisma from "@/lib/prisma"

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
        async signIn({ user }) {
            try {
                if (!user.email) return false

                const dbUser = await prisma.user.findUnique({
                    where: { email: user.email }
                })

                // Defensive check: only block if explicitly false
                if (dbUser && (dbUser as any).isActive === false) {
                    return false
                }
                return true
            } catch (err) {
                console.error("SignIn Callback Error:", err)
                return true // Allow login if DB is down? Or false? 
                // Let's allow for now to avoid complete lockout if it's a minor DB hiccup
            }
        },
        async session({ session }) {
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
