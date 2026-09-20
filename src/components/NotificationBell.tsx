"use client";

import { useEffect, useState, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";

/* ── SVG Icons ── */

function BellIcon({ active }: { active?: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={active ? "text-[#E5FF00]" : ""}
    >
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function PaymentIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <path d="M1 10h22" />
    </svg>
  );
}

function HandshakeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.42 4.58a5.4 5.4 0 00-7.65 0l-.77.78-.77-.78a5.4 5.4 0 00-7.65 7.65l.78.77L12 20.65l7.65-7.65.77-.77a5.4 5.4 0 000-7.65z" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function DefaultNotifIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  );
}

function getIcon(type: string) {
  switch (type) {
    case "listing_liked":    return <HeartIcon />;
    case "new_message":      return <MessageIcon />;
    case "item_sold":        return <CheckCircleIcon />;
    case "payment_received": return <PaymentIcon />;
    case "offer_received":   return <HandshakeIcon />;
    case "offer_accepted":   return <CheckCircleIcon />;
    case "meetup_reminder":  return <PinIcon />;
    default:                 return <DefaultNotifIcon />;
  }
}

/* ── Component ── */

export default function NotificationBell() {
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchNotifications = useCallback(async () => {
    const res = await fetch("/api/notifications");
    const data = await res.json();
    setNotifications(data.notifications ?? []);
    setUnread(
      data.notifications?.filter((n: any) => !n.is_read).length ?? 0
    );
  }, []);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const setupRealtime = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      channel = supabase
        .channel(`notifications:${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            fetchNotifications();
          }
        )
        .subscribe();
    };

    void fetchNotifications();
    void setupRealtime();

    return () => {
      if (channel) {
        void supabase.removeChannel(channel);
      }
    };
  }, [fetchNotifications, supabase]);

  const markAllRead = async () => {
    await fetch("/api/notifications", { method: "PATCH" });
    setUnread(0);
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, is_read: true }))
    );
  };

  const handleToggle = () => {
    const nextOpen = !open;
    setOpen(nextOpen);
    if (nextOpen) markAllRead();
  };

  return (
    <div className="relative">
      {/* ── Bell button ── */}
      <button
        onClick={handleToggle}
        aria-label="Notifications"
        className={`
          relative flex items-center justify-center w-9 h-9 rounded-full
          transition-colors duration-200
          ${open ? "text-[#F5F5F5]" : "text-[#686D72]"}
          hover:text-[#BFC3C7]
        `}
      >
        <BellIcon active={unread > 0} />

        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center h-[16px] min-w-[16px] rounded-full bg-[#E5FF00] px-[4px] text-[9px] font-bold leading-none text-[#080808]">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 top-10 w-80 sm:w-[340px] bg-[#111111] border border-[#292929] rounded-xl shadow-[0_8px_40px_rgba(0,0,0,0.6)] z-50 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#292929]">
              <span className="text-[10px] font-semibold tracking-[0.2em] text-[#BFC3C7] uppercase">
                Notifications
              </span>
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-[10px] tracking-[0.1em] text-[#E5FF00] hover:text-[#F2FF4A] transition-colors duration-200"
                >
                  MARK READ
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                /* ── Empty state ── */
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                  <div className="text-[#686D72] opacity-30">
                    <BellIcon />
                  </div>
                  <p className="text-[11px] tracking-[0.16em] text-[#686D72] uppercase">
                    No notifications yet
                  </p>
                  <p className="text-[10px] text-[#686D72]/60">
                    You&apos;re all caught up.
                  </p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`
                      px-4 py-3 border-b border-[#292929]/50 flex items-start gap-3
                      transition-colors duration-200
                      ${!n.is_read ? "bg-[#E5FF00]/[0.03]" : ""}
                    `}
                  >
                    {/* Icon */}
                    <div
                      className={`
                        mt-0.5 flex items-center justify-center w-7 h-7 rounded-full shrink-0
                        ${!n.is_read ? "bg-[#E5FF00]/10 text-[#E5FF00]" : "bg-[#292929]/50 text-[#686D72]"}
                      `}
                    >
                      {getIcon(n.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium text-[#F5F5F5] leading-snug">
                        {n.title}
                      </p>
                      <p className="text-[11px] text-[#969696] mt-0.5 leading-relaxed line-clamp-2">
                        {n.body}
                      </p>
                      <p className="text-[10px] text-[#686D72] mt-1 tracking-wide">
                        {new Date(n.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>

                    {/* Unread indicator */}
                    {!n.is_read && (
                      <div className="w-1.5 h-1.5 rounded-full bg-[#E5FF00] shrink-0 mt-2" />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}