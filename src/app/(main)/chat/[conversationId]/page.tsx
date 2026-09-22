"use client"

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { RealtimeChannel } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"

type ChatPageProps = {
  params: {
    conversationId: string
  }
}

type ListingPreview = {
  id: string
  title: string
  price: number
  imageUrl: string | null
}

type MessageRow = {
  id: string
  senderId: string | null
  senderAlias: string
  content: string
  createdAt: string
  isRead: boolean
}

type PresencePayload = {
  userId: string
  alias: string
  isTyping: boolean
  updatedAt: string
}

type MessageApiResponse = {
  message?: {
    id: string
    sender_id: string | null
    content: string
    created_at: string | null
    is_read: boolean | null
    sender_alias?: string | null
  }
  error?: string
}

const QUICK_REPLIES = ["Is this available?", "Can you do lower?", "Can we meet today?"]
const TIME_FORMATTER = new Intl.DateTimeFormat("en-IN", {
  hour: "numeric",
  minute: "2-digit",
})

const EMPTY_LISTING: ListingPreview = {
  id: "unknown-listing",
  title: "Listing",
  price: 0,
  imageUrl: null,
}

const formatPrice = (value: number) => `₹${new Intl.NumberFormat("en-IN").format(value)}`

const formatTime = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ""
  }

  return TIME_FORMATTER.format(date)
}

function ChatSkeleton() {
  return (
    <div className="flex flex-col gap-3 px-3 pt-4 pb-44">
      <div className="ml-auto w-[70%] animate-pulse">
        <div className="rounded-xl bg-[#292929] h-14 w-full" />
      </div>
      <div className="mr-auto w-[65%] animate-pulse">
        <div className="rounded-xl bg-[#292929] h-20 w-full" />
      </div>
      <div className="ml-auto w-[55%] animate-pulse">
        <div className="rounded-xl bg-[#292929] h-12 w-full" />
      </div>
    </div>
  )
}

export default function ChatConversationPage({ params }: ChatPageProps) {
  const { conversationId } = params
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const listEndRef = useRef<HTMLDivElement | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [conversationReady, setConversationReady] = useState(false)
  const [isChannelSubscribed, setIsChannelSubscribed] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [composerValue, setComposerValue] = useState("")
  const [messages, setMessages] = useState<MessageRow[]>([])
  const [listing, setListing] = useState<ListingPreview>(EMPTY_LISTING)
  const [myUserId, setMyUserId] = useState<string | null>(null)
  const [myAlias, setMyAlias] = useState("You")
  const [otherTypingAlias, setOtherTypingAlias] = useState<string | null>(null)
  const [errorText, setErrorText] = useState<string | null>(null)

  const trackTypingState = useCallback(
    async (isTyping: boolean) => {
      if (!channelRef.current || !myUserId || !isChannelSubscribed) {
        return
      }

      try {
        await channelRef.current.track({
          userId: myUserId,
          alias: myAlias,
          isTyping,
          updatedAt: new Date().toISOString(),
        } satisfies PresencePayload)
      } catch {
        // Intentionally ignore transient realtime/presence tracking failures.
      }
    },
    [isChannelSubscribed, myAlias, myUserId]
  )

  const updateTypingFromPresence = useCallback(() => {
    if (!channelRef.current) {
      setOtherTypingAlias(null)
      return
    }

    const presenceState = channelRef.current.presenceState<PresencePayload>()
    const peers = Object.values(presenceState).flat()
    const activePeer = peers.find((peer) => peer.userId !== myUserId && peer.isTyping)
    setOtherTypingAlias(activePeer?.alias ?? null)
  }, [myUserId])

  useEffect(() => {
    const loadConversation = async () => {
      setConversationReady(false)
      setErrorText(null)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user?.id) {
        setMyUserId(user.id)
      }

      const myAliasPromise = user?.id
        ? supabase.from("users").select("alias").eq("id", user.id).maybeSingle()
        : Promise.resolve({ data: null, error: null })

      const conversationPromise = supabase
        .from("conversations")
        .select("id, buyer_id, seller_id, listing:listings(id, title, price, images)")
        .eq("id", conversationId)
        .maybeSingle()

      const messagesPromise = supabase
        .from("messages")
        .select("id, sender_id, content, created_at, is_read, sender:users!messages_sender_id_fkey(alias)")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })

      const [myAliasResult, conversationResult, messagesResult] = await Promise.all([
        myAliasPromise,
        conversationPromise,
        messagesPromise,
      ])

      if (myAliasResult.data?.alias) {
        setMyAlias(myAliasResult.data.alias)
      }

      if (!conversationResult.data) {
        setErrorText("Conversation not found.")
      } else {
        const conversationListing = Array.isArray(conversationResult.data.listing)
          ? conversationResult.data.listing[0]
          : conversationResult.data.listing

        setListing({
          id: conversationListing?.id ?? EMPTY_LISTING.id,
          title: conversationListing?.title ?? EMPTY_LISTING.title,
          price: conversationListing?.price ?? EMPTY_LISTING.price,
          imageUrl: conversationListing?.images?.[0] ?? null,
        })
      }

      if (!messagesResult.error) {
        const mappedMessages: MessageRow[] = (messagesResult.data ?? []).map((message) => {
          const sender = Array.isArray(message.sender) ? message.sender[0] : message.sender
          const senderAlias = sender?.alias ?? "Unknown"
          const createdAt = message.created_at ?? new Date().toISOString()
          return {
            id: message.id,
            senderId: message.sender_id,
            senderAlias,
            content: message.content,
            createdAt,
            isRead: Boolean(message.is_read),
          }
        })

        setMessages(mappedMessages)
      }

      setConversationReady(true)
    }

    void loadConversation()
  }, [conversationId, supabase])

  useEffect(() => {
    if (!conversationReady) {
      return
    }

    const channel = supabase.channel(`conversation:${conversationId}`, {
      config: {
        presence: {
          key: myUserId ?? `anon-${conversationId}`,
        },
      },
    })

    channelRef.current = channel
    setIsChannelSubscribed(false)

    channel
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      }, async (payload) => {
        const rawMessage = payload.new as {
          id?: string
          sender_id?: string | null
          content?: string
          created_at?: string | null
          is_read?: boolean | null
        }

        if (!rawMessage.id || !rawMessage.content) {
          return
        }

        let senderAlias = "Unknown"
        if (rawMessage.sender_id) {
          const { data: sender } = await supabase
            .from("users")
            .select("alias")
            .eq("id", rawMessage.sender_id)
            .maybeSingle()
          senderAlias = sender?.alias ?? senderAlias
        }

        const nextMessage: MessageRow = {
          id: rawMessage.id,
          senderId: rawMessage.sender_id ?? null,
          senderAlias,
          content: rawMessage.content,
          createdAt: rawMessage.created_at ?? new Date().toISOString(),
          isRead: Boolean(rawMessage.is_read),
        }

        setMessages((previous) => {
          if (previous.some((message) => message.id === nextMessage.id)) {
            return previous
          }
          return [...previous, nextMessage]
        })
      })
      .on("presence", { event: "sync" }, () => updateTypingFromPresence())
      .on("presence", { event: "join" }, () => updateTypingFromPresence())
      .on("presence", { event: "leave" }, () => updateTypingFromPresence())
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          setIsChannelSubscribed(true)
          await trackTypingState(false)
          updateTypingFromPresence()
        }
      })

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      if (channelRef.current) {
        void channelRef.current.untrack()
      }
      void supabase.removeChannel(channel)
      channelRef.current = null
      setIsChannelSubscribed(false)
    }
  }, [conversationId, conversationReady, myUserId, supabase, trackTypingState, updateTypingFromPresence])

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [messages, otherTypingAlias])

  const handleComposerChange = async (value: string) => {
    setComposerValue(value)
    if (!myUserId || !channelRef.current) {
      return
    }

    const hasText = value.trim().length > 0
    await trackTypingState(hasText)

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    if (hasText) {
      typingTimeoutRef.current = setTimeout(() => {
        void trackTypingState(false)
      }, 1500)
    }
  }

  const handleSend = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const content = composerValue.trim()
    if (!content || isSending) {
      return
    }

    setIsSending(true)
    setErrorText(null)

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationId,
          content,
        }),
      })

      const result = (await response.json().catch(() => ({}))) as MessageApiResponse

      if (!response.ok) {
        setErrorText(result.error ?? "Message failed to send.")
        return
      }

      if (result.message?.id) {
        const createdMessage: MessageRow = {
          id: result.message.id,
          senderId: result.message.sender_id ?? myUserId,
          senderAlias: result.message.sender_alias ?? myAlias,
          content: result.message.content,
          createdAt: result.message.created_at ?? new Date().toISOString(),
          isRead: Boolean(result.message.is_read),
        }

        setMessages((previous) => {
          if (previous.some((message) => message.id === createdMessage.id)) {
            return previous
          }
          return [...previous, createdMessage]
        })
      }

      setComposerValue("")
      await trackTypingState(false)
    } catch {
      setErrorText("Network error while sending message.")
    } finally {
      setIsSending(false)
    }
  }

  const threadContent = (
    <>
      {messages.map((message) => {
        const isMine = Boolean(myUserId && message.senderId === myUserId)
        return (
          <article
            key={message.id}
            className={`w-full max-w-[82%] sm:max-w-[76%] rounded-xl px-3.5 py-2.5 ${
              isMine
                ? "ml-auto bg-[#E5FF00] text-[#080808]"
                : "mr-auto bg-[#151515] border border-[#292929] text-[#F5F5F5]"
            }`}
          >
            <p className={`text-[11px] font-medium tracking-wide ${isMine ? "text-[#080808]/50" : "text-[#686D72]"}`}>
              @{message.senderAlias}
            </p>
            <p className="mt-1 text-[13px] leading-relaxed">{message.content}</p>
            <div className={`mt-1.5 flex items-center justify-end gap-1.5 text-[10px] ${isMine ? "text-[#080808]/45" : "text-[#686D72]"}`}>
              <span>{formatTime(message.createdAt)}</span>
              {isMine && <span>{message.isRead ? "Seen" : "Sent"}</span>}
            </div>
          </article>
        )
      })}

      {otherTypingAlias && (
        <div className="mr-auto inline-flex items-center gap-2 rounded-xl bg-[#151515] border border-[#292929] px-3.5 py-2.5">
          <span className="text-[11px] text-[#969696]">@{otherTypingAlias}</span>
          <span className="inline-flex items-center gap-[3px]">
            <span className="w-1 h-1 rounded-full bg-[#686D72] animate-bounce [animation-delay:0ms]" />
            <span className="w-1 h-1 rounded-full bg-[#686D72] animate-bounce [animation-delay:150ms]" />
            <span className="w-1 h-1 rounded-full bg-[#686D72] animate-bounce [animation-delay:300ms]" />
          </span>
        </div>
      )}
      <div ref={listEndRef} />
    </>
  )

  return (
    <main className="min-h-screen bg-[#080808] text-[#F5F5F5]">
      <div className="mx-auto w-full max-w-3xl">
        {/* ── Sticky header ── */}
        <div className="sticky top-0 z-20 bg-[#080808] border-b border-[#292929]">
          {/* Top row: back + label */}
          <div className="flex items-center justify-between px-3 py-3 sm:px-4">
            <button
              onClick={() => router.back()}
              aria-label="Go back"
              className="flex items-center gap-2 text-[10px] tracking-[0.16em] text-[#686D72] hover:text-[#E5FF00] transition-colors duration-200 uppercase"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              BACK
            </button>
            <span className="text-[10px] tracking-[0.25em] text-[#686D72] uppercase">
              DRENZ / CHAT
            </span>
          </div>

          {/* Listing info */}
          <div className="flex items-center gap-3 px-3 pb-3 sm:px-4">
            <div className="w-[52px] h-[52px] shrink-0 rounded-lg overflow-hidden border border-[#292929] bg-[#111111]">
              {listing.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={listing.imageUrl}
                  alt={listing.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#686D72" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="M21 15l-5-5L5 21" />
                  </svg>
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-[#F5F5F5]">
                {listing.title}
              </p>
              <p className="mt-0.5 text-sm font-bold text-[#E5FF00]">
                {formatPrice(listing.price)}
              </p>
            </div>
          </div>
        </div>

        {/* ── Thread / Loading / Error ── */}
        {!conversationReady ? (
          <ChatSkeleton />
        ) : errorText === "Conversation not found." ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 pb-44 text-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#686D72" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="opacity-25 mb-5">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p className="text-[11px] font-semibold tracking-[0.2em] text-[#686D72] uppercase mb-2">
              CONVERSATION UNAVAILABLE
            </p>
            <p className="text-sm text-[#969696]">{errorText}</p>
          </div>
        ) : (
          <section className="flex flex-col gap-2 px-3 pb-44 pt-4 sm:px-4">
            {threadContent}
          </section>
        )}

        {/* ── Fixed composer ── */}
        <div className="fixed inset-x-0 bottom-0 z-30 bg-[#080808] border-t border-[#292929] px-3 pb-4 pt-3 sm:px-4">
          <div className="mx-auto w-full max-w-3xl">
            {/* Error alert */}
            {errorText && errorText !== "Conversation not found." && (
              <div className="mb-2.5 flex items-start gap-2 px-2.5 py-2 rounded-lg bg-[#2a1215] border border-[#3d1a1a]">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#e55555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-px">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <div>
                  <p className="text-[9px] font-semibold tracking-[0.15em] text-[#e55555]/60 uppercase">
                    MESSAGE FAILED
                  </p>
                  <p className="text-[11px] text-[#e55555] mt-0.5">{errorText}</p>
                </div>
              </div>
            )}

            {/* Quick replies */}
            <div className="mb-2.5 flex gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {QUICK_REPLIES.map((reply) => (
                <button
                  key={reply}
                  type="button"
                  onClick={() => void handleComposerChange(reply)}
                  className="h-7 shrink-0 rounded-lg bg-[#111111] border border-[#292929] px-3 text-[11px] font-medium text-[#969696] hover:border-[#686D72]/30 hover:text-[#BFC3C7] transition-colors duration-200"
                >
                  {reply}
                </button>
              ))}
            </div>

            {/* Composer form */}
            <form className="flex items-center gap-2" onSubmit={handleSend}>
              <input
                type="text"
                value={composerValue}
                onChange={(event) => void handleComposerChange(event.target.value)}
                onBlur={() => void trackTypingState(false)}
                placeholder="Type a message..."
                maxLength={500}
                className="flex-1 h-10 rounded-lg bg-[#111111] border border-[#292929] px-3.5 text-[13px] text-[#F5F5F5] placeholder-[#686D72] outline-none transition-colors duration-200 focus:border-[#E5FF00]/30 focus:shadow-[0_0_0_3px_rgba(229,255,0,0.05)]"
              />
              <button
                type="submit"
                disabled={!composerValue.trim() || isSending}
                className="group h-10 w-10 shrink-0 rounded-lg bg-[#E5FF00] text-[#080808] flex items-center justify-center transition-all duration-200 hover:bg-[#F2FF4A] active:scale-[0.95] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#E5FF00] disabled:active:scale-100"
              >
                {isSending ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-200 group-hover:translate-x-0.5">
                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                  </svg>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  )
}