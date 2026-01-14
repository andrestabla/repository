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
            // Allow all Google accounts to sign in.
            // Access control happens at the session level (RBAC).
            return true
        },
        async session({ session }) {
            if (session.user?.email) {
                const dbUser = await prisma.user.findUnique({
                    where: { email: session.user.email }
                })

                if (dbUser) {
                    (session.user as any).role = dbUser.role
                } else if (session.user.email === 'andrestablarico@gmail.com') {
                    (session.user as any).role = 'admin'
                } else {
                    // User authenticated with Google but not in DB -> Guest
                    (session.user as any).role = 'guest'
                }
            }
            return session
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
    debug: process.env.NODE_ENV === "development",
}
