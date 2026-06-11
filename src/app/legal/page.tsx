export default function LegalPage() {
  return (
    <main className="min-h-screen bg-brand-dark text-white px-6 py-10 max-w-2xl mx-auto">
      <h1 className="text-brand-yellow font-black text-3xl mb-2">drenZ</h1>
      <p className="text-white/50 text-sm mb-10">Legal Documents — Last updated: June 2026</p>

      {/* Terms and Conditions */}
      <section className="mb-10">
        <h2 className="text-white font-bold text-xl mb-4">Terms and Conditions</h2>
        <div className="text-white/60 text-sm space-y-3 leading-relaxed">
          <p>drenZ is a peer-to-peer campus fashion marketplace exclusively for verified students of KIIT University, Bhubaneswar.</p>
          <p><strong className="text-white">Eligibility:</strong> Only students with a valid @kiit.ac.in email address may register and use drenZ.</p>
          <p><strong className="text-white">Listings:</strong> Sellers are responsible for accurate description of items. Misleading listings will result in account suspension.</p>
          <p><strong className="text-white">Payments:</strong> All payments are processed securely via Razorpay. drenZ holds payment until the physical handoff is confirmed by both parties using the handoff code.</p>
          <p><strong className="text-white">Identity:</strong> User identities are masked until payment is confirmed. Real names are revealed only for the purpose of completing the meetup.</p>
          <p><strong className="text-white">Prohibited:</strong> NSFW content, fake listings, harassment, and any activity violating KIIT's code of conduct is strictly prohibited.</p>
          <p><strong className="text-white">Account Suspension:</strong> drenZ reserves the right to suspend or terminate accounts that violate these terms.</p>
          <p>By using drenZ, you agree to these terms.</p>
        </div>
      </section>

      {/* Privacy Policy */}
      <section className="mb-10">
        <h2 className="text-white font-bold text-xl mb-4">Privacy Policy</h2>
        <div className="text-white/60 text-sm space-y-3 leading-relaxed">
          <p>drenZ collects and processes the following data to provide its services:</p>
          <p><strong className="text-white">Data we collect:</strong> Your KIIT email address, WhatsApp number, chosen alias, listing photos, and transaction history.</p>
          <p><strong className="text-white">How we use it:</strong> To facilitate transactions, verify student identity, send notifications, and improve the platform.</p>
          <p><strong className="text-white">Identity masking:</strong> Your real identity is never shown to other users until a payment is confirmed. Your alias is your public identity on drenZ.</p>
          <p><strong className="text-white">Data sharing:</strong> We do not sell your data to third parties. Payment data is processed by Razorpay under their privacy policy.</p>
          <p><strong className="text-white">Data storage:</strong> All data is stored securely on Supabase servers with row-level security policies.</p>
          <p><strong className="text-white">Deletion:</strong> You may request account deletion by contacting us at drenz.kiit@gmail.com</p>
        </div>
      </section>

      {/* Shipping Policy */}
      <section className="mb-10">
        <h2 className="text-white font-bold text-xl mb-4">Shipping Policy</h2>
        <div className="text-white/60 text-sm space-y-3 leading-relaxed">
          <p>drenZ is a <strong className="text-white">campus-only, in-person marketplace</strong>. There is no shipping involved.</p>
          <p>All transactions are completed via physical meetup between buyer and seller on KIIT campus at a mutually agreed location.</p>
          <p>The handoff is confirmed using a secure 4-digit code displayed in the app. Payment is released to the seller only after the buyer confirms receipt using this code.</p>
          <p>drenZ does not support delivery or courier services.</p>
        </div>
      </section>

      {/* Cancellation and Refunds */}
      <section className="mb-10">
        <h2 className="text-white font-bold text-xl mb-4">Cancellation and Refund Policy</h2>
        <div className="text-white/60 text-sm space-y-3 leading-relaxed">
          <p><strong className="text-white">Before payment:</strong> Buyers may cancel an order at any time before completing payment with no charges.</p>
          <p><strong className="text-white">After payment:</strong> Once payment is made, the transaction enters a 24-hour meetup window.</p>
          <p><strong className="text-white">Mutual cancellation:</strong> Both buyer and seller may mutually agree to cancel. On confirmation by both parties, a full refund is initiated within 5-7 business days.</p>
          <p><strong className="text-white">Auto-refund:</strong> If the meetup does not happen within 24 hours of payment, the system automatically initiates a full refund to the buyer.</p>
          <p><strong className="text-white">Disputes:</strong> If a buyer receives an item significantly different from the listing, they may raise a dispute within the app. drenZ will review and resolve within 48 hours.</p>
          <p><strong className="text-white">Refund timeline:</strong> Approved refunds are processed within 5-7 business days to the original payment method.</p>
        </div>
      </section>

      {/* Contact Us */}
      <section className="mb-10">
        <h2 className="text-white font-bold text-xl mb-4">Contact Us</h2>
        <div className="text-white/60 text-sm space-y-3 leading-relaxed">
          <p>For any queries, disputes, or support:</p>
          <p><strong className="text-white">Email:</strong> drenz.kiit@gmail.com</p>
          <p><strong className="text-white">Platform:</strong> drenZ — Campus Fashion Marketplace</p>
          <p><strong className="text-white">Address:</strong> KIIT University, Bhubaneswar, Odisha — 751024</p>
          <p>We typically respond within 24 hours on working days.</p>
        </div>
      </section>

    </main>
  );
}