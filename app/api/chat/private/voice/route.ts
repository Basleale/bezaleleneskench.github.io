import { type NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get("audio") as File
    const sender_id = formData.get("sender_id") as string
    const sender_name = formData.get("sender_name") as string
    const recipient_id = formData.get("recipient_id") as string
    const recipient_name = formData.get("recipient_name") as string

    if (!audioFile) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 })
    }

    // Upload to Vercel Blob
    const blob = await put(`voice-messages/private/${Date.now()}-${sender_id}-${recipient_id}.webm`, audioFile, {
      access: "public",
    })

    // Save to database
    const result = await sql`
      INSERT INTO private_messages (content, sender_id, sender_name, recipient_id, recipient_name, message_type, voice_url)
      VALUES ('Voice message', ${sender_id}, ${sender_name}, ${recipient_id}, ${recipient_name}, 'voice', ${blob.url})
      RETURNING id, created_at
    `

    return NextResponse.json({ success: true, message: result[0] })
  } catch (error) {
    console.error("Error sending voice message:", error)
    return NextResponse.json({ error: "Failed to send voice message" }, { status: 500 })
  }
}
