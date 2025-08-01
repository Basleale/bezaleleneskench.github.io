"use client"

import { useState, useEffect } from "react"

interface MediaItem {
  id: string
  name: string
  originalName?: string
  type: "image" | "video"
  extension?: string
  url: string
  blobUrl?: string
  size: number
  uploadedAt: string
  uploadedBy: string
  tags: string[]
}

export function useMedia() {
  const [media, setMedia] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)

  const fetchMedia = async () => {
    try {
      console.log("Fetching media...")
      const response = await fetch("/api/media", {
        cache: "no-store", // Ensure we always get fresh data
      })
      const data = await response.json()
      console.log(`Fetched ${data.media?.length || 0} media items`)

      setMedia(data.media || [])
    } catch (error) {
      console.error("Failed to fetch media:", error)
      setMedia([])
    } finally {
      setLoading(false)
    }
  }

  const uploadFiles = async (files: File[]) => {
    console.log(`Starting upload of ${files.length} files`)

    const formData = new FormData()
    files.forEach((file) => {
      formData.append("files", file)
    })

    try {
      // Upload files to blob storage
      console.log("Uploading to blob storage...")
      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.statusText}`)
      }

      const uploadData = await uploadResponse.json()
      console.log(`Upload response:`, uploadData)

      // Refresh media list to show new uploads
      await fetchMedia()
      return uploadData.files
    } catch (error) {
      console.error("Upload failed:", error)
      throw error
    }
  }

  const deleteMedia = async (ids: string[]) => {
    try {
      await fetch("/api/media", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      })

      await fetchMedia()
    } catch (error) {
      console.error("Delete failed:", error)
      throw error
    }
  }

  const updateTags = async (mediaId: string, tags: string[]) => {
    try {
      const response = await fetch("/api/media", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaId, tags }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.message || "Tags not supported")
      }

      // Refresh media list
      await fetchMedia()
    } catch (error) {
      console.error("Tag update failed:", error)
      throw error
    }
  }

  useEffect(() => {
    fetchMedia()
  }, [])

  return {
    media,
    loading,
    uploadFiles,
    deleteMedia,
    updateTags,
    refetch: fetchMedia,
  }
}
