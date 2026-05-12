"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/home",     label: "Home",     icon: "🏠" },
  { href: "/search",   label: "Search",   icon: "🔍" },
  { href: "/sell",     label: "",         icon: "➕", isPlus: true },
  { href: "/messages", label: "Messages", icon: "💬" },
  { href: "/profile",  label: "Profile",  icon: "👤" },
];

export default function BottomNav({ unreadCount = 0 }: { unreadCount?: number }) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#0d0d08] border-t border-white/10 flex items-center justify-around px-2 pb-4 pt-2 z-50">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;

        if (tab.isPlus) {
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="bg-brand-yellow rounded-full w-12 h-12 flex items-center justify-center text-xl -translate-y-3 shadow-[0_4px_14px_rgba(245,166,35,0.5)]"
            >
              {tab.icon}
            </Link>
          );
        }

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="flex flex-col items-center gap-1 relative min-w-[48px]"
          >
            <span className="text-xl">{tab.icon}</span>
            <span className={`text-[10px] ${isActive ? "text-brand-yellow font-bold" : "text-white/40"}`}>
              {tab.label}
            </span>

            {isActive && (
              <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-brand-yellow" />
            )}

            {tab.href === "/messages" && unreadCount > 0 && (
              <span className="absolute -top-1 right-1 bg-red-500 text-white text-[9px] font-black rounded-full px-1 min-w-[16px] text-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

