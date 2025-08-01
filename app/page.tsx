"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import AuthForm from "@/components/auth-form"

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === "loading") return

    if (status === "authenticated") {
      router.push("/dashboard")
    } else {
      setIsLoading(false)
    }
  }, [status, router])

  if (isLoading || status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-red-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    return <AuthForm />
  }

  return null
}
