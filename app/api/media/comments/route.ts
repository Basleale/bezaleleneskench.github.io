import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@vercel/postgres"

export async function GET(request: NextRequest) {
  const client = createClient()

  try {
    await client.connect()

    const { searchParams } = new URL(request.url)
    const mediaId = searchParams.get("mediaId")

    if (!mediaId) {
      return NextResponse.json({ error: "Media ID required" }, { status: 400 })
    }

    const result = await client.query(
      `
      SELECT 
        mc.id,
        mc.content,
        mc.created_at,
        u.id as user_id,
        u.name as user_name,
        u.email as user_email
      FROM media_comments mc
      JOIN users u ON mc.user_id = u.id
      WHERE mc.media_id = $1
      ORDER BY mc.created_at ASC
    `,
      [mediaId],
    )

    const comments = result.rows.map((row) => ({
      id: row.id,
      content: row.content,
      createdAt: row.created_at,
      user: {
        id: row.user_id,
        name: row.user_name,
        email: row.user_email,
      },
    }))

    return NextResponse.json({ comments })
  } catch (error) {
    console.error("Error fetching comments:", error)
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 })
  } finally {
    await client.end()
  }
}

export async function POST(request: NextRequest) {
  const client = createClient()

  try {
    await client.connect()

    const { mediaId, userId, content } = await request.json()

    if (!mediaId || !userId || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const result = await client.query(
      `
      INSERT INTO media_comments (media_id, user_id, content, created_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING id, content, created_at
    `,
      [mediaId, userId, content],
    )

    // Get user info for the response
    const userResult = await client.query(
      `
      SELECT id, name, email FROM users WHERE id = $1
    `,
      [userId],
    )

    const comment = {
      id: result.rows[0].id,
      content: result.rows[0].content,
      createdAt: result.rows[0].created_at,
      user: userResult.rows[0],
    }

    return NextResponse.json({ comment })
  } catch (error) {
    console.error("Error creating comment:", error)
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 })
  } finally {
    await client.end()
  }
}
