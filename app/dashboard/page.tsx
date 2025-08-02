"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useMedia } from "@/hooks/use-media"
import { UploadProgress } from "@/components/upload-progress"
import { TaggingModal } from "@/components/tagging-modal"
import { ProfileModal } from "@/components/profile-modal"
import { ChatModal } from "@/components/chat-modal"
import {
  Search,
  Upload,
  ExternalLink,
  Download,
  Tag,
  X,
  Camera,
  Video,
  Loader2,
  LogOut,
  User,
  Settings,
  Heart,
  MessageCircle,
  Send,
  Mic,
  Users,
  Compass,
} from "lucide-react"
import Link from "next/link"

const quickAccessUsers = [
  { id: "bas", name: "Bas", initials: "BA" },
  { id: "sha", name: "Sha", initials: "SH" },
  { id: "nate", name: "Nate", initials: "NA" },
  { id: "simon", name: "Simon", initials: "SI" },
  { id: "felaw", name: "Felaw", initials: "FE" },
]

interface MediaUser {
  id: string
  name: string
  email: string
  profilePicture?: string
}

export default function DashboardPage() {
  const [user, setUser] = useState<MediaUser | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedMedia, setExpandedMedia] = useState<any>(null)
  const [uploadProgress, setUploadProgress] = useState<{ name: string; progress: number }[]>([])
  const [taggingMedia, setTaggingMedia] = useState<any>(null)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [isChatModalOpen, setIsChatModalOpen] = useState(false)
  const [selectedChatUser, setSelectedChatUser] = useState<any>(null)
  const [likedMedia, setLikedMedia] = useState<Set<string>>(new Set())
  const [comments, setComments] = useState<{ [key: string]: any[] }>({})
  const [newComment, setNewComment] = useState("")
  const [commentingMedia, setCommentingMedia] = useState<string | null>(null)

  const { media, loading, uploadFiles, updateTags, mutate } = useMedia()
  const { toast } = useToast()
  const router = useRouter()

  // Auto-refresh every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      mutate()
    }, 5000)

    return () => clearInterval(interval)
  }, [mutate])

  useEffect(() => {
    const currentUser = localStorage.getItem("currentUser")
    if (currentUser) {
      setUser(JSON.parse(currentUser))
    } else {
      router.push("/")
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("currentUser")
    toast({
      title: "Signed out",
      description: "You have been signed out successfully.",
    })
    router.push("/")
  }

  const handleUpload = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/*,video/*"
    input.multiple = true
    input.onchange = async (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || [])
      if (files.length === 0) return

      const progressFiles = files.map((file) => ({ name: file.name, progress: 0 }))
      setUploadProgress(progressFiles)

      try {
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) =>
            prev.map((file) => ({
              ...file,
              progress: Math.min(file.progress + Math.random() * 30, 95),
            })),
          )
        }, 500)

        await uploadFiles(files)

        clearInterval(progressInterval)
        setUploadProgress((prev) => prev.map((file) => ({ ...file, progress: 100 })))

        setTimeout(() => {
          setUploadProgress([])
          toast({
            title: "Upload successful",
            description: `${files.length} file${files.length > 1 ? "s" : ""} uploaded successfully`,
          })
        }, 1000)
      } catch (error) {
        setUploadProgress([])
        toast({
          title: "Upload failed",
          description: "There was an error uploading your files",
          variant: "destructive",
        })
      }
    }
    input.click()
  }

  const handleMediaClick = (mediaItem: any) => {
    setExpandedMedia(mediaItem)
  }

  const handleDownload = async (mediaItem: any) => {
    try {
      const response = await fetch(mediaItem.url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = mediaItem.name
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      toast({
        title: "Download failed",
        description: "There was an error downloading the file",
        variant: "destructive",
      })
    }
  }

  const handleLike = (mediaId: string) => {
    setLikedMedia((prev) => {
      const newLiked = new Set(prev)
      if (newLiked.has(mediaId)) {
        newLiked.delete(mediaId)
      } else {
        newLiked.add(mediaId)
      }
      return newLiked
    })
  }

  const handleComment = (mediaId: string) => {
    if (!newComment.trim()) return

    const comment = {
      id: Date.now().toString(),
      text: newComment,
      author: user?.name || "Anonymous",
      timestamp: new Date().toISOString(),
    }

    setComments((prev) => ({
      ...prev,
      [mediaId]: [...(prev[mediaId] || []), comment],
    }))

    setNewComment("")
    setCommentingMedia(null)
  }

  const handleChatUser = (chatUser: any) => {
    setSelectedChatUser(chatUser)
    setIsChatModalOpen(true)
  }

  const filteredMedia = media.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some((tag) =>
        quickAccessUsers
          .find((user) => user.id === tag)
          ?.name.toLowerCase()
          .includes(searchQuery.toLowerCase()),
      ),
  )

  const recentMedia = filteredMedia.slice(0, 3)

  const handleTagsUpdate = async (mediaId: string, tags: string[]) => {
    try {
      await updateTags(mediaId, tags)
      toast({
        title: "Tags updated",
        description: "Media has been tagged successfully",
      })
    } catch (error) {
      toast({
        title: "Tagging failed",
        description: "There was an error updating the tags",
        variant: "destructive",
      })
    }
  }

  const handleProfileUpdate = (updatedUser: MediaUser) => {
    setUser(updatedUser)
    localStorage.setItem("currentUser", JSON.stringify(updatedUser))
    toast({
      title: "Profile updated",
      description: "Your profile has been updated successfully",
    })
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-red-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-red-950">
      {/* Header */}
      <header className="flex items-center justify-between p-4">
        <Button
          onClick={handleUpload}
          variant="outline"
          size="icon"
          className="bg-transparent border-gray-600 hover:bg-gray-800"
          disabled={uploadProgress.length > 0}
        >
          {uploadProgress.length > 0 ? (
            <Loader2 className="h-4 w-4 text-white animate-spin" />
          ) : (
            <Upload className="h-4 w-4 text-white" />
          )}
        </Button>

        <div className="flex items-center gap-4">
          <Link href="/all-media">
            <Button className="bg-gradient-to-r from-gray-700 via-slate-600 to-red-800 hover:from-gray-600 hover:via-slate-500 hover:to-red-700 text-white px-6">
              All Media
            </Button>
          </Link>

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.profilePicture || "/placeholder.svg"} alt={user.name} />
                  <AvatarFallback className="bg-gradient-to-r from-gray-700 via-slate-600 to-red-800 text-white">
                    {user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-gray-800 border-gray-700" align="end" forceMount>
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="font-medium text-white">{user.name}</p>
                  <p className="w-[200px] truncate text-sm text-gray-400">{user.email}</p>
                </div>
              </div>
              <DropdownMenuSeparator className="bg-gray-700" />
              <DropdownMenuItem
                className="text-gray-300 hover:bg-gray-700 hover:text-white cursor-pointer"
                onClick={() => setIsProfileModalOpen(true)}
              >
                <User className="mr-2 h-4 w-4" />
                <span>Edit Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-gray-300 hover:bg-gray-700 hover:text-white cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-700" />
              <DropdownMenuItem
                className="text-red-400 hover:bg-gray-700 hover:text-red-300 cursor-pointer"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main Content with Tabs */}
      <div className="px-4 pb-8">
        <Tabs defaultValue="explore" className="w-full">
          <div className="flex justify-center mb-8">
            <TabsList className="bg-gray-800/50 border border-gray-700">
              <TabsTrigger value="explore" className="text-gray-300 data-[state=active]:text-white">
                <Compass className="h-4 w-4 mr-2" />
                Explore
              </TabsTrigger>
              <TabsTrigger value="chat" className="text-gray-300 data-[state=active]:text-white">
                <MessageCircle className="h-4 w-4 mr-2" />
                Chat
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="explore">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Left Side - Recent */}
              <div className="flex-1">
                {/* Title and Search */}
                <div className="text-center mb-8">
                  <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6">Eneskench Summit</h1>

                  <div className="relative max-w-md mx-auto">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      type="text"
                      placeholder="search by name or tag"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-gray-800/50 border-gray-600 text-white placeholder-gray-400"
                    />
                  </div>
                </div>

                {/* Recent Section */}
                <div>
                  <h2 className="text-2xl font-semibold text-white mb-4">Recent</h2>

                  {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                      {[...Array(3)].map((_, i) => (
                        <div
                          key={i}
                          className="bg-gray-800/50 rounded-lg overflow-hidden border border-gray-700 animate-pulse"
                        >
                          <div className="aspect-square bg-gray-700"></div>
                          <div className="p-3">
                            <div className="h-4 bg-gray-700 rounded mb-2"></div>
                            <div className="h-3 bg-gray-700 rounded w-2/3"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : recentMedia.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="mb-4">
                        <Upload className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-medium text-white mb-2">No media files yet</h3>
                        <p className="text-gray-400 mb-6">Upload some images or videos to get started</p>
                      </div>

                      <Button onClick={handleUpload} className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Media
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                      {recentMedia.map((mediaItem) => (
                        <Card
                          key={mediaItem.id}
                          className="bg-gray-800/50 border-gray-700 hover:border-purple-500 transition-colors"
                        >
                          <div
                            className="relative aspect-square cursor-pointer"
                            onClick={() => handleMediaClick(mediaItem)}
                          >
                            {mediaItem.type === "image" ? (
                              <img
                                src={mediaItem.url || "/placeholder.svg"}
                                alt={mediaItem.name}
                                className="w-full h-full object-cover rounded-t-lg"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.style.display = "none"
                                  target.nextElementSibling?.classList.remove("hidden")
                                }}
                              />
                            ) : (
                              <video
                                src={mediaItem.url}
                                className="w-full h-full object-cover rounded-t-lg"
                                onError={(e) => {
                                  const target = e.target as HTMLVideoElement
                                  target.style.display = "none"
                                  target.nextElementSibling?.classList.remove("hidden")
                                }}
                              />
                            )}

                            <div className="hidden w-full h-full bg-gradient-to-br from-gray-800 via-slate-700 to-gray-900 flex items-center justify-center absolute inset-0 rounded-t-lg">
                              {mediaItem.type === "image" ? (
                                <div className="text-center">
                                  <Camera className="h-12 w-12 text-gray-500 opacity-30 mx-auto mb-2" />
                                  <div className="text-gray-500 text-sm font-medium">Image</div>
                                </div>
                              ) : (
                                <div className="text-center">
                                  <Video className="h-12 w-12 text-gray-500 opacity-30 mx-auto mb-2" />
                                  <div className="text-gray-500 text-sm font-medium">Video</div>
                                </div>
                              )}
                            </div>

                            {mediaItem.type === "video" && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="bg-black/50 rounded-full p-3">
                                  <div className="w-0 h-0 border-l-[12px] border-l-white border-y-[8px] border-y-transparent ml-1"></div>
                                </div>
                              </div>
                            )}
                          </div>

                          <CardContent className="p-3">
                            <div className="flex items-center justify-between mb-2">
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDownload(mediaItem)
                                }}
                                size="sm"
                                variant="ghost"
                                className="text-gray-400 hover:text-white hover:bg-gray-700 p-2"
                              >
                                <Download className="h-3 w-3" />
                              </Button>

                              <Button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setTaggingMedia(mediaItem)
                                }}
                                size="sm"
                                variant="ghost"
                                className="text-gray-400 hover:text-white hover:bg-gray-700 p-2"
                              >
                                <Tag className="h-3 w-3" />
                              </Button>
                            </div>

                            {/* Like and Comment Section */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleLike(mediaItem.id)
                                  }}
                                  size="sm"
                                  variant="ghost"
                                  className={`p-2 ${likedMedia.has(mediaItem.id) ? "text-red-500" : "text-gray-400 hover:text-red-500"}`}
                                >
                                  <Heart className={`h-4 w-4 ${likedMedia.has(mediaItem.id) ? "fill-current" : ""}`} />
                                </Button>

                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setCommentingMedia(mediaItem.id)
                                  }}
                                  size="sm"
                                  variant="ghost"
                                  className="text-gray-400 hover:text-white hover:bg-gray-700 p-2"
                                >
                                  <MessageCircle className="h-4 w-4" />
                                </Button>
                              </div>

                              <div className="text-xs text-gray-400">
                                {comments[mediaItem.id]?.length || 0} comments
                              </div>
                            </div>

                            {/* Comment Input */}
                            {commentingMedia === mediaItem.id && (
                              <div className="mt-2 flex gap-2">
                                <Input
                                  placeholder="Add a comment..."
                                  value={newComment}
                                  onChange={(e) => setNewComment(e.target.value)}
                                  className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 text-sm"
                                  onKeyPress={(e) => {
                                    if (e.key === "Enter") {
                                      handleComment(mediaItem.id)
                                    }
                                  }}
                                />
                                <Button
                                  onClick={() => handleComment(mediaItem.id)}
                                  size="sm"
                                  className="bg-purple-600 hover:bg-purple-700"
                                >
                                  <Send className="h-3 w-3" />
                                </Button>
                              </div>
                            )}

                            {/* Comments Display */}
                            {comments[mediaItem.id] && comments[mediaItem.id].length > 0 && (
                              <div className="mt-2 space-y-1 max-h-20 overflow-y-auto">
                                {comments[mediaItem.id].map((comment) => (
                                  <div key={comment.id} className="text-xs">
                                    <span className="text-purple-400 font-medium">{comment.author}:</span>
                                    <span className="text-gray-300 ml-1">{comment.text}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Side - Quick Access */}
              <div className="lg:w-80">
                <div className="bg-gray-800/30 rounded-lg p-6 border border-gray-700">
                  <h3 className="text-xl font-semibold text-white mb-4">Quick Access</h3>

                  <div className="space-y-3">
                    {quickAccessUsers.map((quickUser) => (
                      <div
                        key={quickUser.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-gray-700/50 hover:bg-gray-700 transition-colors group"
                      >
                        <Link href={`/user/${quickUser.id}`} className="flex items-center gap-3 flex-1">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-gradient-to-r from-gray-700 via-slate-600 to-red-800 text-white text-sm">
                              {quickUser.initials}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-white font-medium">{quickUser.name}</span>
                        </Link>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleChatUser(quickUser)}
                            size="sm"
                            variant="ghost"
                            className="text-gray-400 hover:text-white p-1"
                          >
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                          <Link href={`/user/${quickUser.id}`}>
                            <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white p-1">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="chat">
            <div className="max-w-4xl mx-auto">
              <div className="bg-gray-800/30 rounded-lg p-6 border border-gray-700">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Start a Conversation
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {quickAccessUsers.map((chatUser) => (
                    <Card
                      key={chatUser.id}
                      className="bg-gray-700/50 border-gray-600 hover:bg-gray-700 transition-colors cursor-pointer"
                      onClick={() => handleChatUser(chatUser)}
                    >
                      <CardContent className="p-4 text-center">
                        <Avatar className="h-12 w-12 mx-auto mb-3">
                          <AvatarFallback className="bg-gradient-to-r from-gray-700 via-slate-600 to-red-800 text-white">
                            {chatUser.initials}
                          </AvatarFallback>
                        </Avatar>
                        <h4 className="text-white font-medium mb-2">{chatUser.name}</h4>
                        <div className="flex justify-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            <MessageCircle className="h-3 w-3 mr-1" />
                            Text
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            <Mic className="h-3 w-3 mr-1" />
                            Voice
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <UploadProgress files={uploadProgress} />

      {/* Fullscreen Media Modal */}
      {expandedMedia && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-full">
            <Button
              onClick={() => setExpandedMedia(null)}
              size="icon"
              variant="ghost"
              className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white"
            >
              <X className="h-4 w-4" />
            </Button>

            <div className="relative">
              {expandedMedia.type === "image" ? (
                <img
                  src={expandedMedia.url || "/placeholder.svg"}
                  alt={expandedMedia.name}
                  className="max-w-full max-h-[80vh] object-contain rounded-lg"
                />
              ) : (
                <video src={expandedMedia.url} controls className="max-w-full max-h-[80vh] object-contain rounded-lg" />
              )}
            </div>

            <div className="mt-4 text-center">
              <h3 className="text-white text-xl font-medium">{expandedMedia.name}</h3>
              <p className="text-gray-400 text-sm mt-1">
                by {expandedMedia.uploadedBy} • {new Date(expandedMedia.uploadedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <TaggingModal
        isOpen={!!taggingMedia}
        onClose={() => setTaggingMedia(null)}
        mediaItem={taggingMedia}
        onTagsUpdate={handleTagsUpdate}
      />

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={user}
        onUpdate={handleProfileUpdate}
      />

      <ChatModal
        isOpen={isChatModalOpen}
        onClose={() => {
          setIsChatModalOpen(false)
          setSelectedChatUser(null)
        }}
        user={selectedChatUser}
        currentUser={user}
      />
    </div>
  )
}
