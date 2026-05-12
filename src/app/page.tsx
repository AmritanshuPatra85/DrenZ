import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function LandingPage() {
  const supabase = createClient();

  const { data: listings } = await supabase
    .from("listings")
    .select("*")
    .eq("status", "active")
    .limit(8);

  return (
    <main className="min-h-screen bg-brand-dark text-white">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4">
        <span className="text-brand-yellow font-bold text-2xl tracking-widest uppercase">
          DRENZ
        </span>
        <Link
          href="/login"
          className="bg-white text-black text-sm font-medium px-4 py-2 rounded-full"
        >
          Join Campus
        </Link>
      </nav>

      {/* Hero */}
      <section className="px-6 py-10">
        <div className="bg-brand-card rounded-3xl p-8 min-h-[400px] relative overflow-hidden">
          <span className="border border-white/30 text-white text-xs px-3 py-1 rounded-full mb-6 inline-block">
            KIIT
          </span>
          <h1 className="text-5xl font-black uppercase leading-tight">
            WEAR IT.<br />
            <span className="text-brand-yellow">PASS IT.</span><br />
            LIST IT.
          </h1>
          <p className="text-white/60 text-sm mt-4 max-w-xs">
            Keep the campus cycle moving with curated fashion that gets worn,
            passed on, and listed again with trust.
          </p>



          {/* CTA */}
          <Link
            href="/login"
            className="mt-8 inline-block bg-brand-yellow text-black font-semibold px-8 py-4 rounded-2xl w-full text-center"
          >
            Join your campus →
          </Link>
        </div>
      </section>

      {/* Ticker */}
      <div className="bg-brand-ticker text-black text-xs font-bold py-2 px-4 flex gap-6 overflow-hidden whitespace-nowrap">
        {["ZERO SCAMS", "QUALITY VERIFIED", "KIIT", "STUDENT ID VERIFIED", "CAMPUS PICKUP"].map((item) => (
          <span key={item}>+ {item}</span>
        ))}
      </div>

      {/* Category Pills */}
      <section className="px-6 mt-6">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {["All", "Tops", "Bottoms", "Shoes", "Bags", "Accessories"].map((cat) => (
            <button
              key={cat}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                cat === "All"
                  ? "bg-black text-white"
                  : "bg-white/10 text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Listings Grid */}
      <section className="px-6 mt-6 grid grid-cols-2 gap-4 pb-24">
        {listings?.map((listing) => (
          <div key={listing.id} className="bg-white/5 rounded-2xl overflow-hidden">
            <div className="bg-white/10 h-40 flex items-center justify-center">
              <span className="text-4xl">👕</span>
            </div>
            <div className="p-3">
              <span className="text-green-400 text-xs font-bold">VERIFIED</span>
              <p className="text-white text-sm font-medium mt-1">{listing.title}</p>
              <p className="text-brand-yellow font-bold mt-1">₹{listing.price}</p>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}