import { NextResponse } from "next/server"
import { AuthStorage } from "@/lib/auth-storage"

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 })
    }

    const user = await AuthStorage.createUser(name, email, password)

    // Don't return password hash
    const { passwordHash, ...userWithoutPassword } = user

    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
    })
  } catch (error: any) {
    console.error("Signup error:", error)
    return NextResponse.json({ error: error.message || "Failed to create account" }, { status: 400 })
  }
}
