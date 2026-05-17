"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";

const ADMIN_EMAIL = "amritanshupatra01@gmail.com";
const TABS = ["Users", "Listings", "Transactions", "Disputes"];

export default function AdminPage() {
  const router = useRouter();
  const [tab, setTab] = useState("Users");
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.email !== ADMIN_EMAIL) {
        router.push("/");
        return;
      }
      setAuthorized(true);
      setLoading(false);
    };
    checkAuth();
  }, []);

  useEffect(() => {
    if (!authorized) return;
    loadData();
  }, [tab, authorized]);

  const loadData = async () => {
    setDataLoading(true);
    let result: any[] = [];

    if (tab === "Users") {
      const { data } = await supabase
        .from("admin_users")
        .select("*")
        .order("created_at", { ascending: false });
      result = data ?? [];
    } else if (tab === "Listings") {
      const { data } = await supabase
        .from("listings")
        .select("id, title, price, status, category, created_at, seller:users(alias)")
        .order("created_at", { ascending: false })
        .limit(50);
      result = data ?? [];
    } else if (tab === "Transactions") {
      const { data } = await supabase
        .from("transactions")
        .select("id, amount, status, created_at, listing:listings(title)")
        .order("created_at", { ascending: false })
        .limit(50);
      result = data ?? [];
    } else if (tab === "Disputes") {
      const { data } = await supabase
        .from("disputes")
        .select("id, status, created_at, transaction:transactions(amount)")
        .order("created_at", { ascending: false })
        .limit(50);
      result = data ?? [];
    }

    setData(result);
    setDataLoading(false);
  };

  const toggleBan = async (userId: string, isBanned: boolean) => {
    await supabase.from("users").update({ is_banned: !isBanned }).eq("id", userId);
    loadData();
  };

  const removeListing = async (listingId: string) => {
    if (!confirm("Remove this listing?")) return;
    await supabase.from("listings").update({ status: "removed" }).eq("id", listingId);
    loadData();
  };

  if (loading) return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center">
      <p className="text-white/30">Loading…</p>
    </main>
  );

  if (!authorized) return null;

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-5xl mx-auto px-4 py-6">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-brand-yellow">drenZ Admin</h1>
            <p className="text-white/40 text-sm">Logged in as {ADMIN_EMAIL}</p>
          </div>
          <button
            onClick={() => { supabase.auth.signOut(); router.push("/"); }}
            className="text-white/40 text-sm border border-white/10 px-4 py-2 rounded-xl"
          >
            Sign out
          </button>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors ${
                tab === t ? "bg-brand-yellow text-black" : "bg-white/10 text-white/60"
              }`}
            >{t}</button>
          ))}
        </div>

        {dataLoading ? (
          <p className="text-white/30 text-sm">Loading…</p>
        ) : data.length === 0 ? (
          <p className="text-white/30 text-sm">No data found.</p>
        ) : (
          <div className="space-y-3">

            {tab === "Users" && data.map((u: any) => (
              <div key={u.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {u.avatar_url && (
                    <img src={u.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                  )}
                  <div>
                    <p className="text-white font-semibold text-sm">{u.full_name ?? u.alias ?? "No name"}</p>
                    <p className="text-white/50 text-xs">{u.email}</p>
                    <p className="text-white/40 text-xs">{u.phone ?? "No phone"} · {u.alias ?? "No alias"} · {u.college}</p>
                    <p className="text-white/20 text-xs">{new Date(u.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleBan(u.id, u.is_banned)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 ${
                    u.is_banned ? "bg-green-900 text-green-400" : "bg-red-900 text-red-400"
                  }`}
                >
                  {u.is_banned ? "Unban" : "Ban"}
                </button>
              </div>
            ))}

            {tab === "Listings" && data.map((l: any) => (
              <div key={l.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-white font-semibold text-sm">{l.title}</p>
                  <p className="text-white/40 text-xs">₹{l.price} · {l.category} · {l.status}</p>
                  <p className="text-white/40 text-xs">by {l.seller?.alias ?? "unknown"}</p>
                </div>
                {l.status === "active" && (
                  <button onClick={() => removeListing(l.id)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-red-900 text-red-400 shrink-0">
                    Remove
                  </button>
                )}
              </div>
            ))}

            {tab === "Transactions" && data.map((t: any) => (
              <div key={t.id} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <p className="text-white font-semibold text-sm">{t.listing?.title ?? "Unknown listing"}</p>
                <p className="text-white/40 text-xs">₹{t.amount / 100} · {t.status}</p>
                <p className="text-white/20 text-xs">{new Date(t.created_at).toLocaleDateString()}</p>
              </div>
            ))}

            {tab === "Disputes" && data.map((d: any) => (
              <div key={d.id} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <p className="text-white font-semibold text-sm">Dispute #{d.id.slice(0, 8)}</p>
                <p className="text-white/40 text-xs">Status: {d.status}</p>
                <p className="text-white/20 text-xs">{new Date(d.created_at).toLocaleDateString()}</p>
              </div>
            ))}

          </div>
        )}
      </div>
    </main>
  );
}