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
            if (!user.email) return false

            // 1. Check if user exists in DB
            const dbUser = await prisma.user.findUnique({
                where: { email: user.email }
            })

            // 2. Allow if exists OR matches bootstrap admin
            if (dbUser) return true
            if (user.email === 'andrestablarico@gmail.com') return true

            return false // Deny access
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
                }
            }
            return session
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
    debug: process.env.NODE_ENV === "development",
}
