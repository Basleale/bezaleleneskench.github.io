import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@vercel/postgres"

export async function GET(request: NextRequest) {
  const client = createClient()

  try {
    await client.connect()

    const { searchParams } = new URL(request.url)
    const user1 = searchParams.get("user1")
    const user2 = searchParams.get("user2")

    if (!user1 || !user2) {
      return NextResponse.json({ error: "Both user IDs required" }, { status: 400 })
    }

    const result = await client.query(
      `
      SELECT 
        pm.id,
        pm.content,
        pm.voice_url,
        pm.type,
        pm.created_at,
        u.id as sender_id,
        u.name as sender_name
      FROM private_messages pm
      JOIN users u ON pm.sender_id = u.id
      WHERE (pm.sender_id = $1 AND pm.receiver_id = $2) 
         OR (pm.sender_id = $2 AND pm.receiver_id = $1)
      ORDER BY pm.created_at ASC
      LIMIT 100
    `,
      [user1, user2],
    )

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
    console.error("Error fetching private messages:", error)
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
  } finally {
    await client.end()
  }
}

export async function POST(request: NextRequest) {
  const client = createClient()

  try {
    await client.connect()

    const { senderId, receiverId, content, type } = await request.json()

    const result = await client.query(
      `
      INSERT INTO private_messages (sender_id, receiver_id, content, type, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING id, content, type, created_at
    `,
      [senderId, receiverId, content, type],
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
    console.error("Error creating private message:", error)
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
  } finally {
    await client.end()
  }
}
