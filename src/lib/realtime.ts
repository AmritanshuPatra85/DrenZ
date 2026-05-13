import { createBrowserClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

export type TypingPayload = {
  user_id: string
  typing: boolean
}

export function subscribeToConversation(
  conversationId: string,
  onNewMessage: (message: any) => void,
  onTyping: (payload: TypingPayload) => void
): RealtimeChannel {
  const supabase = createBrowserClient()

  const channel = supabase
    .channel(`conversation:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => onNewMessage(payload.new)
    )
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState<TypingPayload>()
      const typingUsers = Object.values(state)
        .flat()
        .filter((p) => p.typing)
      typingUsers.forEach(onTyping)
    })
    .subscribe()

  return channel
}

export function unsubscribeFromConversation(channel: RealtimeChannel) {
  channel.unsubscribe()
}

export async function sendTypingIndicator(
  channel: RealtimeChannel,
  userId: string,
  typing: boolean
) {
  await channel.track({ user_id: userId, typing })
}