import { type NextRequest, NextResponse } from "next/server"
import { AuthStorage } from "@/lib/auth-storage"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    try {
      // Find user by email in blob storage
      const user = await AuthStorage.findUserByEmail(email)

      if (!user) {
        return NextResponse.json({ error: "No account found with this email address" }, { status: 401 })
      }

      // Check password
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash)
      if (!isPasswordValid) {
        return NextResponse.json({ error: "Incorrect password" }, { status: 401 })
      }

      // Return user data (excluding password)
      const userWithoutPassword = {
        id: user.id,
        name: user.name,
        email: user.email,
      }

      return NextResponse.json({ user: userWithoutPassword }, { status: 200 })
    } catch (error) {
      console.error("Auth storage error:", error)
      return NextResponse.json({ error: "Authentication service error. Please try again." }, { status: 500 })
    }
  } catch (error) {
    console.error("Sign in error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
