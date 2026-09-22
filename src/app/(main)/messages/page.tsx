"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"

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

function ConversationSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="bg-[#111111] border border-[#292929] rounded-xl p-3 animate-pulse"
        >
          <div className="flex items-start gap-3">
            <div className="w-14 h-14 rounded-lg bg-[#292929] shrink-0" />

            <div className="flex-1 min-w-0 space-y-2 pt-0.5">
              <div className="flex items-center justify-between">
                <div className="h-3 w-24 bg-[#292929] rounded" />
                <div className="h-2 w-16 bg-[#292929] rounded" />
              </div>

              <div className="h-2.5 w-32 bg-[#292929] rounded" />
              <div className="h-3 w-full bg-[#292929] rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyState({ tab }: { tab: string }) {
  const label =
    tab === "buying"
      ? "No buying conversations yet."
      : tab === "selling"
        ? "No selling conversations yet."
        : "Your buying and selling conversations will appear here."

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <svg
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#686D72"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="opacity-25 mb-5"
      >
        <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
      </svg>

      <p className="text-[11px] font-semibold tracking-[0.2em] text-[#686D72] uppercase mb-2">
        NO CONVERSATIONS
      </p>

      <p className="text-sm text-[#969696] max-w-xs leading-relaxed">
        {label}
      </p>
    </div>
  )
}

export default function MessagesPage() {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()

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

    return conversations.filter(
      (conversation) => conversation.buyerId === myUserId
    )
  }, [conversations, myUserId])

  const sellingConversations = useMemo(() => {
    if (!myUserId) {
      return []
    }

    return conversations.filter(
      (conversation) => conversation.sellerId === myUserId
    )
  }, [conversations, myUserId])

  const visibleConversations = useMemo(() => {
    if (activeTab === "buying") {
      return buyingConversations
    }

    if (activeTab === "selling") {
      return sellingConversations
    }

    return conversations
  }, [
    activeTab,
    buyingConversations,
    conversations,
    sellingConversations,
  ])

  const renderConversationList = (rows: ConversationItem[]) => {
    if (loading) {
      return <ConversationSkeleton />
    }

    if (errorText) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#e55555"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mb-4 opacity-50"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>

          <p className="text-[11px] font-semibold tracking-[0.2em] text-[#686D72] uppercase mb-2">
            CONVERSATIONS UNAVAILABLE
          </p>

          <p className="text-sm text-[#e55555]/80 max-w-xs leading-relaxed">
            {errorText}
          </p>
        </div>
      )
    }

    if (rows.length === 0) {
      return <EmptyState tab={activeTab} />
    }

    return (
      <div className="space-y-2">
        {rows.map((conversation) => {
          const isBuying =
            myUserId != null && conversation.buyerId === myUserId

          const alias = isBuying
            ? conversation.sellerAlias
            : conversation.buyerAlias

          const preview = getPreviewText(conversation)

          const timestamp = formatTimestamp(
            conversation.lastMessage?.createdAt ?? null
          )

          const contextLabel = isBuying ? "BUYING" : "SELLING"

          return (
            <Link
              key={conversation.id}
              href={`/chat/${conversation.id}`}
              className="block bg-[#111111] border border-[#292929] rounded-xl p-3 transition-all duration-200 hover:border-[#686D72]/30 hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5FF00]/30"
            >
              <div className="flex items-start gap-3">
                {/* Listing image */}
                <div className="w-14 h-14 shrink-0 rounded-lg overflow-hidden border border-[#292929] bg-[#151515]">
                  {conversation.listing.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={conversation.listing.thumbnail}
                      alt={conversation.listing.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#686D72"
                        strokeWidth="1"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect
                          x="3"
                          y="3"
                          width="18"
                          height="18"
                          rx="2"
                        />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <path d="M21 15l-5-5L5 21" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Conversation content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex items-center gap-2">
                      <p className="truncate text-[13px] font-semibold text-[#F5F5F5]">
                        @{alias}
                      </p>

                      <span className="shrink-0 text-[9px] font-semibold tracking-[0.12em] text-[#686D72] uppercase border border-[#292929] rounded px-1.5 py-px">
                        {contextLabel}
                      </span>
                    </div>

                    <span className="shrink-0 text-[10px] text-[#686D72] tracking-wide">
                      {timestamp}
                    </span>
                  </div>

                  <p className="mt-1 truncate text-[11px] text-[#969696]">
                    {conversation.listing.title}
                  </p>

                  <p className="mt-1 truncate text-[13px] text-[#BFC3C7]">
                    {preview}
                  </p>
                </div>

                {/* Unread count */}
                {conversation.unreadCount > 0 ? (
                  <span className="ml-1 shrink-0 min-w-[22px] h-[22px] flex items-center justify-center rounded bg-[#E5FF00] px-1.5 text-[11px] font-bold text-[#080808]">
                    {conversation.unreadCount > 99
                      ? "99+"
                      : conversation.unreadCount}
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
    <main className="min-h-screen bg-[#080808] text-[#F5F5F5] pb-24">
      {/* Header */}
      <header className="border-b border-[#292929]">
        <div className="mx-auto max-w-3xl flex items-center justify-between px-4 py-5 md:px-8">
          <button
            onClick={() => router.back()}
            aria-label="Go back"
            className="flex items-center gap-2 text-[10px] tracking-[0.16em] text-[#686D72] hover:text-[#E5FF00] transition-colors duration-200 uppercase"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            BACK
          </button>

          <span className="text-[10px] tracking-[0.25em] text-[#686D72] uppercase">
            DRENZ / SOCIAL
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 pt-8 md:px-8">
        {/* Title */}
        <div className="mb-6">
          <h1 className="text-xl lg:text-2xl font-bold tracking-tight">
            MESSAGES
          </h1>

          <p className="mt-1 text-[10px] tracking-[0.18em] text-[#686D72] uppercase">
            Buying + Selling Conversations
          </p>
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as TabValue)}
        >
          <TabsList className="w-full justify-start h-auto p-0 bg-transparent border-b border-[#292929] rounded-none">
            <TabsTrigger
              value="all"
              className="flex-1 rounded-none bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-[#E5FF00] data-[state=active]:shadow-none text-[11px] font-semibold tracking-[0.14em] uppercase text-[#686D72] hover:text-[#BFC3C7] px-0 pb-3 pt-1 relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-[#292929] data-[state=active]:after:bg-[#E5FF00] transition-colors duration-200"
            >
              All
            </TabsTrigger>

            <TabsTrigger
              value="buying"
              className="flex-1 rounded-none bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-[#E5FF00] data-[state=active]:shadow-none text-[11px] font-semibold tracking-[0.14em] uppercase text-[#686D72] hover:text-[#BFC3C7] px-0 pb-3 pt-1 relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-[#292929] data-[state=active]:after:bg-[#E5FF00] transition-colors duration-200"
            >
              Buying
            </TabsTrigger>

            <TabsTrigger
              value="selling"
              className="flex-1 rounded-none bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-[#E5FF00] data-[state=active]:shadow-none text-[11px] font-semibold tracking-[0.14em] uppercase text-[#686D72] hover:text-[#BFC3C7] px-0 pb-3 pt-1 relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-[#292929] data-[state=active]:after:bg-[#E5FF00] transition-colors duration-200"
            >
              Selling
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="all"
            className="mt-4"
          >
            {renderConversationList(conversations)}
          </TabsContent>

          <TabsContent
            value="buying"
            className="mt-4"
          >
            {renderConversationList(buyingConversations)}
          </TabsContent>

          <TabsContent
            value="selling"
            className="mt-4"
          >
            {renderConversationList(sellingConversations)}
          </TabsContent>
        </Tabs>

        {/* Conversation count */}
        {!loading && !errorText && visibleConversations.length > 0 ? (
          <p className="mt-4 text-center text-[10px] text-[#686D72] tracking-[0.16em] uppercase">
            {String(visibleConversations.length).padStart(2, "0")} Conversation
            {visibleConversations.length === 1 ? "" : "s"}
          </p>
        ) : null}
      </div>

      <BottomNav
        unreadCount={conversations.reduce(
          (total, item) => total + item.unreadCount,
          0
        )}
      />
    </main>
  )
}