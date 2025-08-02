import { NextResponse } from "next/server"
import { AuthStorage } from "@/lib/auth-storage"

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const user = await AuthStorage.validateUser(email, password)

    // Don't return password hash
    const { passwordHash, ...userWithoutPassword } = user

    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
    })
  } catch (error: any) {
    console.error("Signin error:", error)
    return NextResponse.json({ error: error.message || "Failed to sign in" }, { status: 400 })
  }
}
