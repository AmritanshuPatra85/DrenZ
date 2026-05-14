"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"

import BottomNav from "@/components/BottomNav"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClient } from "@/lib/supabase/client"

type ConversationItem = {
  id: string
  buyerId: string | null
  sellerId: string | null
  buyerAlias: string
  sellerAlias: string
  listing: {
    id: string | null
    title: string
    thumbnail: string | null
    sellerId: string | null
  }
  lastMessage: {
    content: string
    createdAt: string | null
  } | null
  unreadCount: number
}

type ConversationsApiResponse = {
  conversations?: ConversationItem[]
  error?: string
}

type TabValue = "all" | "buying" | "selling"

const formatTimestamp = (value: string | null) => {
  if (!value) {
    return ""
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ""
  }

  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    day: "numeric",
  }).format(date)
}

const getPreviewText = (conversation: ConversationItem) => {
  const text = conversation.lastMessage?.content?.trim()
  if (text) {
    return text
  }
  return `Start chat about ${conversation.listing.title}`
}

export default function MessagesPage() {
  const supabase = useMemo(() => createClient(), [])
  const [activeTab, setActiveTab] = useState<TabValue>("all")
  const [myUserId, setMyUserId] = useState<string | null>(null)
  const [conversations, setConversations] = useState<ConversationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [errorText, setErrorText] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    const loadConversations = async () => {
      setLoading(true)
      setErrorText(null)

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        setMyUserId(user?.id ?? null)

        const response = await fetch("/api/conversations", {
          method: "GET",
          signal: controller.signal,
        })

        const result = (await response.json().catch(() => ({}))) as ConversationsApiResponse
        if (!response.ok) {
          setErrorText(result.error ?? "Failed to load conversations.")
          setConversations([])
          return
        }

        setConversations(result.conversations ?? [])
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          return
        }
        setErrorText("Network error while loading conversations.")
        setConversations([])
      } finally {
        setLoading(false)
      }
    }

    void loadConversations()

    return () => {
      controller.abort()
    }
  }, [supabase])

  const buyingConversations = useMemo(() => {
    if (!myUserId) {
      return []
    }
    return conversations.filter((conversation) => conversation.buyerId === myUserId)
  }, [conversations, myUserId])

  const sellingConversations = useMemo(() => {
    if (!myUserId) {
      return []
    }
    return conversations.filter((conversation) => conversation.sellerId === myUserId)
  }, [conversations, myUserId])

  const visibleConversations = useMemo(() => {
    if (activeTab === "buying") {
      return buyingConversations
    }
    if (activeTab === "selling") {
      return sellingConversations
    }
    return conversations
  }, [activeTab, buyingConversations, conversations, sellingConversations])

  const renderConversationList = (rows: ConversationItem[]) => {
    if (loading) {
      return <p className="px-1 py-6 text-center text-sm text-white/60">Loading conversations...</p>
    }

    if (errorText) {
      return <p className="px-1 py-6 text-center text-sm text-red-300">{errorText}</p>
    }

    if (rows.length === 0) {
      return <p className="px-1 py-6 text-center text-sm text-white/60">No conversations yet.</p>
    }

    return (
      <div className="space-y-2">
        {rows.map((conversation) => {
          const isBuying = myUserId != null && conversation.buyerId === myUserId
          const alias = isBuying ? conversation.sellerAlias : conversation.buyerAlias
          const preview = getPreviewText(conversation)
          const timestamp = formatTimestamp(conversation.lastMessage?.createdAt ?? null)

          return (
            <Link
              key={conversation.id}
              href={`/chat/${conversation.id}`}
              className="block rounded-2xl border border-white/5 bg-brand-card p-3 transition hover:border-brand-yellow/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-yellow/30"
            >
              <div className="flex items-start gap-3">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-black/20">
                  {conversation.listing.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={conversation.listing.thumbnail}
                      alt={conversation.listing.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[10px] text-white/60">
                      No image
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-white">{alias}</p>
                    <span className="shrink-0 text-[11px] text-white/60">{timestamp}</span>
                  </div>

                  <p className="mt-0.5 truncate text-xs text-white/60">{conversation.listing.title}</p>
                  <p className="mt-1 truncate text-sm text-white/85">{preview}</p>
                </div>

                {conversation.unreadCount > 0 ? (
                  <span className="ml-1 shrink-0 rounded-full bg-brand-yellow px-2 py-0.5 text-[11px] font-bold text-black">
                    {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
                  </span>
                ) : null}
              </div>
            </Link>
          )
        })}
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-brand-dark px-3 pb-24 pt-5 text-white sm:px-4">
      <div className="mx-auto w-full max-w-3xl">
        <h1 className="text-xl font-bold text-white">Messages</h1>
        <p className="mt-1 text-xs text-white/60">Track all buying and selling conversations.</p>

        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as TabValue)}
          className="mt-4"
        >
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="buying">Buying</TabsTrigger>
            <TabsTrigger value="selling">Selling</TabsTrigger>
          </TabsList>

          <TabsContent value="all">{renderConversationList(conversations)}</TabsContent>
          <TabsContent value="buying">{renderConversationList(buyingConversations)}</TabsContent>
          <TabsContent value="selling">{renderConversationList(sellingConversations)}</TabsContent>
        </Tabs>

        {!loading && !errorText && visibleConversations.length > 0 ? (
          <p className="mt-3 text-center text-xs text-white/60">
            Showing {visibleConversations.length} conversation
            {visibleConversations.length === 1 ? "" : "s"}
          </p>
        ) : null}
      </div>

      <BottomNav unreadCount={conversations.reduce((total, item) => total + item.unreadCount, 0)} />
    </main>
  )
}
