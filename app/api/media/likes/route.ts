import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@vercel/postgres"

export async function GET(request: NextRequest) {
  const client = createClient()

  try {
    await client.connect()

    const { searchParams } = new URL(request.url)
    const mediaId = searchParams.get("mediaId")
    const userId = searchParams.get("userId")

    if (!mediaId) {
      return NextResponse.json({ error: "Media ID required" }, { status: 400 })
    }

    // Get like count
    const countResult = await client.query(
      `
      SELECT COUNT(*) as count FROM media_likes WHERE media_id = $1
    `,
      [mediaId],
    )

    // Check if user liked
    let userLiked = false
    if (userId) {
      const userResult = await client.query(
        `
        SELECT id FROM media_likes WHERE media_id = $1 AND user_id = $2
      `,
        [mediaId, userId],
      )
      userLiked = userResult.rows.length > 0
    }

    return NextResponse.json({
      count: Number.parseInt(countResult.rows[0].count),
      userLiked,
    })
  } catch (error) {
    console.error("Error fetching likes:", error)
    return NextResponse.json({ error: "Failed to fetch likes" }, { status: 500 })
  } finally {
    await client.end()
  }
}

export async function POST(request: NextRequest) {
  const client = createClient()

  try {
    await client.connect()

    const { mediaId, userId, action } = await request.json()

    if (action === "like") {
      await client.query(
        `
        INSERT INTO media_likes (media_id, user_id, created_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (media_id, user_id) DO NOTHING
      `,
        [mediaId, userId],
      )
    } else if (action === "unlike") {
      await client.query(
        `
        DELETE FROM media_likes 
        WHERE media_id = $1 AND user_id = $2
      `,
        [mediaId, userId],
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating like:", error)
    return NextResponse.json({ error: "Failed to update like" }, { status: 500 })
  } finally {
    await client.end()
  }
}
