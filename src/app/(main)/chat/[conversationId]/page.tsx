"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RealtimeChannel } from "@supabase/supabase-js";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

type ChatPageProps = {
  params: {
    conversationId: string;
  };
};

type ListingPreview = {
  id: string;
  title: string;
  price: number;
  imageUrl: string | null;
};

type MessageRow = {
  id: string;
  senderId: string | null;
  senderAlias: string;
  content: string;
  createdAt: string;
  isRead: boolean;
};

type PresencePayload = {
  userId: string;
  alias: string;
  isTyping: boolean;
  updatedAt: string;
};

type MessageApiResponse = {
  message?: {
    id: string;
    sender_id: string | null;
    content: string;
    created_at: string | null;
    is_read: boolean | null;
    sender_alias?: string | null;
  };
  error?: string;
};

const QUICK_REPLIES = ["Is this available?", "Can you do lower?", "Can we meet today?"];
const TIME_FORMATTER = new Intl.DateTimeFormat("en-IN", {
  hour: "numeric",
  minute: "2-digit",
});

const EMPTY_LISTING: ListingPreview = {
  id: "unknown-listing",
  title: "Listing",
  price: 0,
  imageUrl: null,
};

const formatPrice = (value: number) => `₹${new Intl.NumberFormat("en-IN").format(value)}`;

const formatTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return TIME_FORMATTER.format(date);
};

export default function ChatConversationPage({ params }: ChatPageProps) {
  const { conversationId } = params;
  const supabase = useMemo(() => createClient(), []);
  const listEndRef = useRef<HTMLDivElement | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [conversationReady, setConversationReady] = useState(false);
  const [isChannelSubscribed, setIsChannelSubscribed] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [composerValue, setComposerValue] = useState("");
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [listing, setListing] = useState<ListingPreview>(EMPTY_LISTING);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [myAlias, setMyAlias] = useState("You");
  const [otherTypingAlias, setOtherTypingAlias] = useState<string | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);

  const trackTypingState = useCallback(
    async (isTyping: boolean) => {
      if (!channelRef.current || !myUserId || !isChannelSubscribed) {
        return;
      }

      try {
        await channelRef.current.track({
          userId: myUserId,
          alias: myAlias,
          isTyping,
          updatedAt: new Date().toISOString(),
        } satisfies PresencePayload);
      } catch {
        // Intentionally ignore transient realtime/presence tracking failures.
      }
    },
    [isChannelSubscribed, myAlias, myUserId]
  );

  const updateTypingFromPresence = useCallback(() => {
    if (!channelRef.current) {
      setOtherTypingAlias(null);
      return;
    }

    const presenceState = channelRef.current.presenceState<PresencePayload>();
    const peers = Object.values(presenceState).flat();
    const activePeer = peers.find((peer) => peer.userId !== myUserId && peer.isTyping);
    setOtherTypingAlias(activePeer?.alias ?? null);
  }, [myUserId]);

  useEffect(() => {
    const loadConversation = async () => {
      setConversationReady(false);
      setErrorText(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.id) {
        setMyUserId(user.id);
      }

      const myAliasPromise = user?.id
        ? supabase.from("users").select("alias").eq("id", user.id).maybeSingle()
        : Promise.resolve({ data: null, error: null });

      const conversationPromise = supabase
        .from("conversations")
        .select("id, buyer_id, seller_id, listing:listings(id, title, price, images)")
        .eq("id", conversationId)
        .maybeSingle();

      const messagesPromise = supabase
        .from("messages")
        .select("id, sender_id, content, created_at, is_read, sender:users!messages_sender_id_fkey(alias)")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      const [myAliasResult, conversationResult, messagesResult] = await Promise.all([
        myAliasPromise,
        conversationPromise,
        messagesPromise,
      ]);

      if (myAliasResult.data?.alias) {
        setMyAlias(myAliasResult.data.alias);
      }

      if (!conversationResult.data) {
        setErrorText("Conversation not found.");
      } else {
        const conversationListing = Array.isArray(conversationResult.data.listing)
          ? conversationResult.data.listing[0]
          : conversationResult.data.listing;

        setListing({
          id: conversationListing?.id ?? EMPTY_LISTING.id,
          title: conversationListing?.title ?? EMPTY_LISTING.title,
          price: conversationListing?.price ?? EMPTY_LISTING.price,
          imageUrl: conversationListing?.images?.[0] ?? null,
        });
      }

      if (!messagesResult.error) {
        const mappedMessages: MessageRow[] = (messagesResult.data ?? []).map((message) => {
          const sender = Array.isArray(message.sender) ? message.sender[0] : message.sender;
          const senderAlias = sender?.alias ?? "Unknown";
          const createdAt = message.created_at ?? new Date().toISOString();
          return {
            id: message.id,
            senderId: message.sender_id,
            senderAlias,
            content: message.content,
            createdAt,
            isRead: Boolean(message.is_read),
          };
        });

        setMessages(mappedMessages);
      }

      setConversationReady(true);
    };

    void loadConversation();
  }, [conversationId, supabase]);

  useEffect(() => {
    if (!conversationReady) {
      return;
    }

    const channel = supabase.channel(`conversation:${conversationId}`, {
      config: {
        presence: {
          key: myUserId ?? `anon-${conversationId}`,
        },
      },
    });

    channelRef.current = channel;
    setIsChannelSubscribed(false);

    channel
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      }, async (payload) => {
        const rawMessage = payload.new as {
          id?: string;
          sender_id?: string | null;
          content?: string;
          created_at?: string | null;
          is_read?: boolean | null;
        };

        if (!rawMessage.id || !rawMessage.content) {
          return;
        }

        let senderAlias = "Unknown";
        if (rawMessage.sender_id) {
          const { data: sender } = await supabase
            .from("users")
            .select("alias")
            .eq("id", rawMessage.sender_id)
            .maybeSingle();
          senderAlias = sender?.alias ?? senderAlias;
        }

        const nextMessage: MessageRow = {
          id: rawMessage.id,
          senderId: rawMessage.sender_id ?? null,
          senderAlias,
          content: rawMessage.content,
          createdAt: rawMessage.created_at ?? new Date().toISOString(),
          isRead: Boolean(rawMessage.is_read),
        };

        setMessages((previous) => {
          if (previous.some((message) => message.id === nextMessage.id)) {
            return previous;
          }
          return [...previous, nextMessage];
        });
      })
      .on("presence", { event: "sync" }, () => updateTypingFromPresence())
      .on("presence", { event: "join" }, () => updateTypingFromPresence())
      .on("presence", { event: "leave" }, () => updateTypingFromPresence())
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          setIsChannelSubscribed(true);
          await trackTypingState(false);
          updateTypingFromPresence();
        }
      });

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (channelRef.current) {
        void channelRef.current.untrack();
      }
      void supabase.removeChannel(channel);
      channelRef.current = null;
      setIsChannelSubscribed(false);
    };
  }, [conversationId, conversationReady, myUserId, supabase, trackTypingState, updateTypingFromPresence]);

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, otherTypingAlias]);

  const handleComposerChange = async (value: string) => {
    setComposerValue(value);
    if (!myUserId || !channelRef.current) {
      return;
    }

    const hasText = value.trim().length > 0;
    await trackTypingState(hasText);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (hasText) {
      typingTimeoutRef.current = setTimeout(() => {
        void trackTypingState(false);
      }, 1500);
    }
  };

  const handleSend = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const content = composerValue.trim();
    if (!content || isSending) {
      return;
    }

    setIsSending(true);
    setErrorText(null);

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
      });

      const result = (await response.json().catch(() => ({}))) as MessageApiResponse;

      if (!response.ok) {
        setErrorText(result.error ?? "Message failed to send.");
        return;
      }

      if (result.message?.id) {
        const createdMessage: MessageRow = {
          id: result.message.id,
          senderId: result.message.sender_id ?? myUserId,
          senderAlias: result.message.sender_alias ?? myAlias,
          content: result.message.content,
          createdAt: result.message.created_at ?? new Date().toISOString(),
          isRead: Boolean(result.message.is_read),
        };

        setMessages((previous) => {
          if (previous.some((message) => message.id === createdMessage.id)) {
            return previous;
          }
          return [...previous, createdMessage];
        });
      }

      setComposerValue("");
      await trackTypingState(false);
    } catch {
      setErrorText("Network error while sending message.");
    } finally {
      setIsSending(false);
    }
  };

  const threadContent = (
    <>
      {messages.map((message) => {
        const isMine = Boolean(myUserId && message.senderId === myUserId);
        return (
          <article
            key={message.id}
            className={`w-full max-w-[86%] rounded-2xl px-3 py-2 ${
              isMine ? "ml-auto bg-brand-yellow text-black" : "mr-auto bg-brand-card text-white"
            }`}
          >
            <p className={`text-xs font-semibold ${isMine ? "text-black/80" : "text-white/70"}`}>
              {message.senderAlias}
            </p>
            <p className="mt-1 text-sm leading-relaxed">{message.content}</p>
            <div className={`mt-2 flex items-center justify-end gap-2 text-[11px] ${isMine ? "text-black/80" : "text-white/60"}`}>
              <span>{formatTime(message.createdAt)}</span>
              <span>{message.isRead ? "Seen" : "Sent"}</span>
            </div>
          </article>
        );
      })}

      {otherTypingAlias && (
        <div className="mr-auto inline-flex items-center gap-2 rounded-2xl bg-brand-card px-3 py-2 text-white">
          <span className="text-xs text-white/70">{otherTypingAlias}</span>
          <span className="inline-flex items-center gap-1">
            <span className="size-1.5 animate-bounce rounded-full bg-white [animation-delay:0ms]" />
            <span className="size-1.5 animate-bounce rounded-full bg-white [animation-delay:150ms]" />
            <span className="size-1.5 animate-bounce rounded-full bg-white [animation-delay:300ms]" />
          </span>
        </div>
      )}
      <div ref={listEndRef} />
    </>
  );

  return (
    <main className="min-h-screen bg-brand-dark text-white">
      <div className="mx-auto w-full max-w-3xl">
        <div className="sticky top-0 z-20 border-b border-white/10 bg-brand-dark/95 px-3 pb-3 pt-3 backdrop-blur">
          <Card className="overflow-hidden border-white/10 bg-brand-card">
            <div className="flex items-center gap-3 p-3">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-black/20">
                {listing.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={listing.imageUrl}
                    alt={listing.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-white/70">
                    No image
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{listing.title}</p>
                <p className="mt-1 text-sm font-bold text-brand-yellow">{formatPrice(listing.price)}</p>
              </div>
            </div>
          </Card>
        </div>

        <section className="flex flex-col gap-2 px-3 pb-44 pt-2">{threadContent}</section>

        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-brand-card px-3 pb-4 pt-3">
          <div className="mx-auto w-full max-w-3xl">
            <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
              {QUICK_REPLIES.map((reply) => (
                <Button
                  key={reply}
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="h-8 shrink-0 rounded-full bg-white/10 px-3 text-xs text-white hover:bg-white/20"
                  onClick={() => void handleComposerChange(reply)}
                >
                  {reply}
                </Button>
              ))}
            </div>

            <form className="flex items-center gap-2" onSubmit={handleSend}>
              <Input
                value={composerValue}
                onChange={(event) => void handleComposerChange(event.target.value)}
                onBlur={() => void trackTypingState(false)}
                placeholder="Type a message"
                className="h-10 border-white/10 bg-brand-card text-white placeholder:text-white/50 focus-visible:border-brand-yellow focus-visible:ring-brand-yellow/30"
                maxLength={500}
              />
              <Button
                type="submit"
                className="h-10 rounded-xl bg-brand-yellow px-4 text-sm font-semibold text-black hover:bg-brand-yellow/90 disabled:opacity-60"
                disabled={!composerValue.trim() || isSending}
              >
                {isSending ? "Sending..." : "Send"}
              </Button>
            </form>

            {errorText && <p className="mt-2 text-xs text-red-300">{errorText}</p>}
          </div>
        </div>
      </div>
    </main>
  );
}
