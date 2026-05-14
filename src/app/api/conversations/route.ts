import { NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"

type ConversationApiItem = {
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

export async function GET() {
  const supabase = createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: conversations, error: conversationsError } = await supabase
    .from("conversations")
    .select(
      "id, buyer_id, seller_id, last_message_at, listing:listings(id, title, images, seller_id), buyer:users!conversations_buyer_id_fkey(alias), seller:users!conversations_seller_id_fkey(alias)"
    )
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .order("last_message_at", { ascending: false, nullsFirst: false })

  if (conversationsError) {
    return NextResponse.json(
      { error: "Failed to load conversations" },
      { status: 500 }
    )
  }

  const conversationIds = (conversations ?? []).map((conversation) => conversation.id)

  const lastMessageByConversation = new Map<
    string,
    { content: string; createdAt: string | null }
  >()
  const unreadCountByConversation = new Map<string, number>()

  if (conversationIds.length > 0) {
    const { data: messages, error: messagesError } = await supabase
      .from("messages")
      .select("id, conversation_id, content, created_at, is_read, sender_id")
      .in("conversation_id", conversationIds)
      .order("created_at", { ascending: false })

    if (messagesError) {
      return NextResponse.json(
        { error: "Failed to load conversation messages" },
        { status: 500 }
      )
    }

    for (const message of messages ?? []) {
      if (!message.conversation_id) {
        continue
      }

      if (!lastMessageByConversation.has(message.conversation_id)) {
        lastMessageByConversation.set(message.conversation_id, {
          content: message.content,
          createdAt: message.created_at,
        })
      }

      const isUnread = message.is_read === false && message.sender_id !== user.id
      if (isUnread) {
        const previousCount = unreadCountByConversation.get(message.conversation_id) ?? 0
        unreadCountByConversation.set(message.conversation_id, previousCount + 1)
      }
    }
  }

  const responseItems: ConversationApiItem[] = (conversations ?? []).map(
    (conversation) => {
      const buyer = Array.isArray(conversation.buyer)
        ? conversation.buyer[0]
        : conversation.buyer
      const seller = Array.isArray(conversation.seller)
        ? conversation.seller[0]
        : conversation.seller
      const listing = Array.isArray(conversation.listing)
        ? conversation.listing[0]
        : conversation.listing

      return {
        id: conversation.id,
        buyerId: conversation.buyer_id,
        sellerId: conversation.seller_id,
        buyerAlias: buyer?.alias ?? "Buyer",
        sellerAlias: seller?.alias ?? "Seller",
        listing: {
          id: listing?.id ?? null,
          title: listing?.title ?? "Listing",
          thumbnail: listing?.images?.[0] ?? null,
          sellerId: listing?.seller_id ?? null,
        },
        lastMessage: lastMessageByConversation.get(conversation.id) ?? null,
        unreadCount: unreadCountByConversation.get(conversation.id) ?? 0,
      }
    }
  )

  return NextResponse.json({ conversations: responseItems })
}
