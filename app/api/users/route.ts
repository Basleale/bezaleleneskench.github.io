import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@vercel/postgres"

export async function GET(request: NextRequest) {
  const client = createClient()

  try {
    await client.connect()

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")

    let query = `
      SELECT id, name, email, created_at
      FROM users
    `
    let params: any[] = []

    if (search) {
      query += ` WHERE name ILIKE $1 OR email ILIKE $1`
      params = [`%${search}%`]
    }

    query += ` ORDER BY name ASC LIMIT 50`

    const result = await client.query(query, params)

    const users = result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      createdAt: row.created_at,
    }))

    return NextResponse.json({ users })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  } finally {
    await client.end()
  }
}
