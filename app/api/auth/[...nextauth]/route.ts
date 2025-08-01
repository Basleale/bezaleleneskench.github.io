import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: "793260875569-tucbsbsp30n0urs3eer98sjcieo4j2r5.apps.googleusercontent.com",
      clientSecret: "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",
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // TODO: Add your database logic here to verify user credentials
        // For now, this is a placeholder that accepts any email/password
        // You should replace this with actual database verification

        const user = {
          id: "1",
          email: credentials.email,
          name: credentials.email.split("@")[0],
        }

        return user
      },
    }),
  ],
  pages: {
    signIn: "/",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // Redirect to dashboard after successful authentication
      if (url.startsWith("/")) return `${baseUrl}/dashboard`
      else if (new URL(url).origin === baseUrl) return url
      return `${baseUrl}/dashboard`
    },
  },
})

export { handler as GET, handler as POST }
