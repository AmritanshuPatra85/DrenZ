import Razorpay from "razorpay";

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export function calculateFees(price: number) {
  const platformFee = Math.round(price * 0.05 * 100) / 100; // 5% fee
  const sellerPayout = Math.round((price - platformFee) * 100) / 100;
  return { platformFee, sellerPayout };
}

export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}