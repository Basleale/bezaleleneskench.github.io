import { type NextRequest, NextResponse } from "next/server"
import { AuthStorage } from "@/lib/auth-storage"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 })
    }

    try {
      // Check if user already exists
      const existingUser = await AuthStorage.findUserByEmail(email)

      if (existingUser) {
        return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 })
      }

      // Hash password
      const saltRounds = 12
      const passwordHash = await bcrypt.hash(password, saltRounds)

      // Create new user
      const newUser = await AuthStorage.createUser(name, email, passwordHash)

      // Return user data (excluding password)
      const userWithoutPassword = {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
      }

      return NextResponse.json({ user: userWithoutPassword }, { status: 201 })
    } catch (error) {
      console.error("Auth storage error:", error)

      if (error instanceof Error && error.message === "User with this email already exists") {
        return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 })
      }

      return NextResponse.json({ error: "Authentication service error. Please try again." }, { status: 500 })
    }
  } catch (error) {
    console.error("Sign up error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
