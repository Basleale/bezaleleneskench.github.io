import { type NextRequest, NextResponse } from "next/server"
import { BlobStorage } from "@/lib/blob-storage"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const mediaId = searchParams.get("mediaId")

    if (!mediaId || !mediaId.trim()) {
      return NextResponse.json({ error: "Valid Media ID required" }, { status: 400 })
    }

    const likes = await BlobStorage.getLikes(mediaId)
    return NextResponse.json({ likes, count: likes.length })
  } catch (error) {
    console.error("Error fetching likes:", error)
    return NextResponse.json({ error: "Failed to fetch likes" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { mediaId, userId, userName, action } = await request.json()

    if (!mediaId || !mediaId.trim()) {
      return NextResponse.json({ error: "Valid Media ID required" }, { status: 400 })
    }

    if (!userId || !userId.trim()) {
      return NextResponse.json({ error: "Valid User ID required" }, { status: 400 })
    }

    if (!userName || !userName.trim()) {
      return NextResponse.json({ error: "Valid User Name required" }, { status: 400 })
    }

    if (action === "unlike") {
      await BlobStorage.removeLike(mediaId.trim(), userId.trim())
    } else {
      await BlobStorage.addLike({
        mediaId: mediaId.trim(),
        userId: userId.trim(),
        userName: userName.trim(),
      })
    }

    const likes = await BlobStorage.getLikes(mediaId)
    return NextResponse.json({ likes, count: likes.length })
  } catch (error) {
    console.error("Error updating like:", error)
    return NextResponse.json({ error: "Failed to update like" }, { status: 500 })
  }
}
