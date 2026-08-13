import NextAuth, { DefaultSession } from "next-auth"
import Google from "next-auth/providers/google"
import connectDB from "./mongodb"
import User from "@/models/User"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      profile: any
    } & DefaultSession["user"]
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          await connectDB()
          
          const existingUser = await User.findOne({ email: user.email })
          
          if (!existingUser) {
            await User.create({
              name: user.name || "",
              email: user.email || "",
              image: user.image || undefined,
              profile: {
                skills: [],
              },
              googleTokens: {
                accessToken: account.access_token || undefined,
                refreshToken: account.refresh_token || undefined,
              },
            })
          } else {
            existingUser.name = user.name || existingUser.name
            existingUser.image = user.image || existingUser.image
            if (account.access_token) {
              existingUser.googleTokens.accessToken = account.access_token
            }
            if (account.refresh_token) {
              existingUser.googleTokens.refreshToken = account.refresh_token
            }
            await existingUser.save()
          }
          
          return true
        } catch (error) {
          console.error("Error in signIn callback:", error)
          return false
        }
      }
      return true
    },
    async session({ session, token }) {
      if (session.user) {
        try {
          await connectDB()
          const dbUser = await User.findOne({ email: session.user.email })
          if (dbUser) {
            session.user.id = dbUser._id.toString()
            session.user.profile = dbUser.profile
          }
        } catch (error) {
          console.error("Error in session callback:", error)
        }
      }
      return session
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  session: {
    strategy: "jwt",
  },
})
