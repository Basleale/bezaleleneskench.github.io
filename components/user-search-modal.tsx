"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Loader2, Users } from "lucide-react"

interface User {
  id: string
  name: string
  email: string
  profilePicture?: string
}

interface UserSearchModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectUser: (user: User) => void
  currentUser: any
}

export function UserSearchModal({ isOpen, onClose, onSelectUser, currentUser }: UserSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchUsers()
    }
  }, [isOpen])

  useEffect(() => {
    if (searchQuery.trim()) {
      searchUsers()
    } else {
      fetchUsers()
    }
  }, [searchQuery])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/users")
      if (response.ok) {
        const data = await response.json()
        // Filter out current user
        const filteredUsers = data.users.filter((user: User) => user.id !== currentUser?.id)
        setUsers(filteredUsers)
      }
    } catch (error) {
      console.error("Error fetching users:", error)
    } finally {
      setLoading(false)
    }
  }

  const searchUsers = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/users?search=${encodeURIComponent(searchQuery)}`)
      if (response.ok) {
        const data = await response.json()
        // Filter out current user
        const filteredUsers = data.users.filter((user: User) => user.id !== currentUser?.id)
        setUsers(filteredUsers)
      }
    } catch (error) {
      console.error("Error searching users:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectUser = (user: User) => {
    onSelectUser(user)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-400" />
            Find Users
          </DialogTitle>
        </DialogHeader>

        {/* Search Input */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-gray-700/50 border-gray-600 text-white placeholder-gray-400"
          />
        </div>

        {/* Users List */}
        <ScrollArea className="max-h-96">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p>No users found</p>
              {searchQuery && <p className="text-sm">Try a different search term</p>}
            </div>
          ) : (
            <div className="space-y-2">
              {users.map((user) => (
                <Button
                  key={user.id}
                  onClick={() => handleSelectUser(user)}
                  variant="ghost"
                  className="w-full justify-start p-3 h-auto hover:bg-gray-700/50"
                >
                  <Avatar className="h-10 w-10 mr-3">
                    <AvatarImage src={user.profilePicture || "/placeholder.svg"} />
                    <AvatarFallback className="bg-gradient-to-r from-gray-700 via-slate-600 to-red-800 text-white">
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <p className="font-medium text-white">{user.name}</p>
                    <p className="text-sm text-gray-400">{user.email}</p>
                  </div>
                </Button>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
