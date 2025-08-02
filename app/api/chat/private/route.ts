import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const user1 = searchParams.get("user1")
    const user2 = searchParams.get("user2")

    if (!user1 || !user2) {
      return NextResponse.json({ error: "Missing user parameters" }, { status: 400 })
    }

    const messages = await sql`
      SELECT id, content, sender_id, sender_name, recipient_id, recipient_name, message_type, voice_url, created_at
      FROM private_messages 
      WHERE (sender_id = ${user1} AND recipient_id = ${user2}) 
         OR (sender_id = ${user2} AND recipient_id = ${user1})
      ORDER BY created_at ASC 
      LIMIT 50
    `

    return NextResponse.json({ messages })
  } catch (error) {
    console.error("Error fetching private messages:", error)
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { content, sender_id, sender_name, recipient_id, recipient_name, message_type } = await request.json()

    const result = await sql`
      INSERT INTO private_messages (content, sender_id, sender_name, recipient_id, recipient_name, message_type)
      VALUES (${content}, ${sender_id}, ${sender_name}, ${recipient_id}, ${recipient_name}, ${message_type})
      RETURNING id, created_at
    `

    return NextResponse.json({ success: true, message: result[0] })
  } catch (error) {
    console.error("Error sending private message:", error)
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
  }
}
