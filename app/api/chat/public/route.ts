import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    const messages = await sql`
      SELECT id, content, sender_id, sender_name, message_type, voice_url, created_at
      FROM public_messages 
      ORDER BY created_at ASC 
      LIMIT 50
    `

    return NextResponse.json({ messages })
  } catch (error) {
    console.error("Error fetching public messages:", error)
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { content, sender_id, sender_name, message_type } = await request.json()

    const result = await sql`
      INSERT INTO public_messages (content, sender_id, sender_name, message_type)
      VALUES (${content}, ${sender_id}, ${sender_name}, ${message_type})
      RETURNING id, created_at
    `

    return NextResponse.json({ success: true, message: result[0] })
  } catch (error) {
    console.error("Error sending public message:", error)
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
  }
}
