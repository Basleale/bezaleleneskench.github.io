import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@vercel/postgres"

export async function GET() {
  const client = createClient()

  try {
    await client.connect()

    const result = await client.query(`
      SELECT 
        pm.id,
        pm.content,
        pm.voice_url,
        pm.type,
        pm.created_at,
        u.id as sender_id,
        u.name as sender_name
      FROM public_messages pm
      JOIN users u ON pm.sender_id = u.id
      ORDER BY pm.created_at ASC
      LIMIT 100
    `)

    const messages = result.rows.map((row) => ({
      id: row.id,
      content: row.content,
      voiceUrl: row.voice_url,
      type: row.type,
      createdAt: row.created_at,
      senderId: row.sender_id,
      senderName: row.sender_name,
    }))

    return NextResponse.json({ messages })
  } catch (error) {
    console.error("Error fetching public messages:", error)
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
  } finally {
    await client.end()
  }
}

export async function POST(request: NextRequest) {
  const client = createClient()

  try {
    await client.connect()

    const { senderId, content, type } = await request.json()

    const result = await client.query(
      `
      INSERT INTO public_messages (sender_id, content, type, created_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING id, content, type, created_at
    `,
      [senderId, content, type],
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
      content: result.rows[0].content,
      type: result.rows[0].type,
      createdAt: result.rows[0].created_at,
      senderId: userResult.rows[0].id,
      senderName: userResult.rows[0].name,
    }

    return NextResponse.json({ message })
  } catch (error) {
    console.error("Error creating public message:", error)
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
  } finally {
    await client.end()
  }
}
