import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"

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
        async session({ session, token }) {
            return session
        },
    },
}
