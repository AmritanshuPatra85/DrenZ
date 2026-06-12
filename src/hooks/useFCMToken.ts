import { useEffect } from 'react'
import { getMessagingInstance, getToken, VAPID_KEY } from '@/lib/firebase'
import { createClient } from '@/lib/supabase/client'

export function useFCMToken() {
  useEffect(() => {
    async function init() {
      try {
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') return

        const messaging = await getMessagingInstance()
        if (!messaging) return

        const token = await getToken(messaging, { vapidKey: VAPID_KEY })
        if (!token) return

        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        await supabase
          .from('users')
          .update({ fcm_token: token })
          .eq('id', user.id)
      } catch (err) {
        console.error('FCM init error:', err)
      }
    }

    init()
  }, [])
}