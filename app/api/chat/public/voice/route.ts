import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@vercel/postgres"
import { put } from "@vercel/blob"

export async function POST(request: NextRequest) {
  const client = createClient()

  try {
    await client.connect()

    const formData = await request.formData()
    const audioFile = formData.get("audio") as File
    const senderId = formData.get("senderId") as string

    if (!audioFile || !senderId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Upload audio to Vercel Blob
    const blob = await put(`voice-messages/${Date.now()}-${audioFile.name}`, audioFile, {
      access: "public",
    })

    // Save message to database
    const result = await client.query(
      `
      INSERT INTO public_messages (sender_id, voice_url, type, created_at)
      VALUES ($1, $2, 'voice', NOW())
      RETURNING id, voice_url, type, created_at
    `,
      [senderId, blob.url],
    )

    // Get sender info
    const userResult = await client.query(
      `
      SELECT id, name FROM users WHERE id = $1
    `,
      [senderId],
    )

    const message = {
      id: result.rows[0].id,
      voiceUrl: result.rows[0].voice_url,
      type: result.rows[0].type,
      createdAt: result.rows[0].created_at,
      senderId: userResult.rows[0].id,
      senderName: userResult.rows[0].name,
    }

    return NextResponse.json({ message })
  } catch (error) {
    console.error("Error creating voice message:", error)
    return NextResponse.json({ error: "Failed to send voice message" }, { status: 500 })
  } finally {
    await client.end()
  }
}
