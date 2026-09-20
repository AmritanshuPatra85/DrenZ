"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/* ── Inline SVG icons ── */

function HomeIcon({ active }: { active?: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill={active ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 10.5L12 3l9 7.5V20a1.5 1.5 0 01-1.5 1.5h-4a1 1 0 01-1-1v-4.5a1 1 0 00-1-1h-3a1 1 0 00-1 1V20.5a1 1 0 01-1 1h-4A1.5 1.5 0 013 20V10.5z" />
    </svg>
  );
}

function SearchIcon() {
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
    >
      <circle cx="10.5" cy="10.5" r="7" />
      <path d="M15.5 15.5L21 21" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function MessagesIcon() {
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
    >
      <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
    </svg>
  );
}

function ProfileIcon({ active }: { active?: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill={active ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="8" r="4.5" />
      <path d="M4 21v-1a6 6 0 0112 0v1" />
    </svg>
  );
}

/* ── Icon map ── */
const iconMap: Record<string, React.FC<{ active?: boolean }>> = {
  home: HomeIcon,
  search: SearchIcon,
  sell: PlusIcon,
  messages: MessagesIcon,
  profile: ProfileIcon,
};

/* ── Navigation config (UNGHANGED labels/hrefs) ── */
const tabs = [
  { href: "/home",     label: "Home",     icon: "home",     isPlus: false },
  { href: "/search",   label: "Search",   icon: "search",   isPlus: false },
  { href: "/sell",     label: "",         icon: "sell",     isPlus: true  },
  { href: "/messages", label: "Messages", icon: "messages", isPlus: false },
  { href: "/profile",  label: "Profile",  icon: "profile",  isPlus: false },
];

/* ── Component ── */
export default function BottomNav({ unreadCount = 0 }: { unreadCount?: number }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main navigation"
      className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pointer-events-none md:hidden"
    >
      <div
        className="
          pointer-events-auto mx-auto flex max-w-lg items-end justify-around
          rounded-2xl border border-[#292929]
          bg-[#0D0D0D]/95 backdrop-blur-md
          px-2 pt-2.5 pb-2
          shadow-[0_-2px_24px_rgba(0,0,0,0.6)]
        "
      >
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          const IconComp = iconMap[tab.icon];

          /* ── Sell / Plus button ── */
          if (tab.isPlus) {
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-label="Create listing"
                className="
                  -mt-5 flex h-11 w-11 items-center justify-center
                  rounded-full bg-[#E5FF00] text-[#080808]
                  shadow-[0_2px_16px_rgba(229,255,0,0.2)]
                  transition-all duration-200
                  hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(229,255,0,0.3)]
                  active:scale-90
                "
              >
                <IconComp />
              </Link>
            );
          }

          /* ── Regular tab ── */
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-label={tab.label}
              className={`
                group relative flex flex-1 flex-col items-center gap-0.5
                py-1 transition-colors duration-200
                ${isActive ? "text-[#E5FF00]" : "text-[#686D72]"}
              `}
            >
              <span
                className="
                  transition-transform duration-200
                  group-hover:scale-110
                "
              >
                <IconComp active={isActive} />
              </span>

              <span
                className={`
                  text-[10px] tracking-wide
                  transition-colors duration-200
                  ${isActive ? "text-[#F5F5F5]" : "text-[#686D72]"}
                `}
              >
                {tab.label}
              </span>

              {/* Active indicator */}
              {isActive && (
                <span className="absolute -top-0.5 left-1/2 h-[2px] w-4 -translate-x-1/2 rounded-full bg-[#E5FF00]" />
              )}

              {/* Messages badge */}
              {tab.href === "/messages" && unreadCount > 0 && (
                <span
                  className="
                    absolute -top-0.5 right-2 flex h-[16px] min-w-[16px]
                    items-center justify-center rounded-full
                    bg-[#E5FF00] px-[5px] text-[9px] font-bold
                    leading-none text-[#080808]
                  "
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}