export type { Database } from "./database.types";

// Listing
export type Listing = {
  id: string;
  seller_id: string;
  title: string;
  description: string | null;
  price: number;
  category: "tops" | "bottoms" | "shoes" | "bags" | "accessories";
  condition: "new" | "like_new" | "good" | "fair";
  images: string[];
  college: string;
  status: "active" | "sold" | "removed";
  is_boosted: boolean;
  boost_expires_at: string | null;
  views: number;
  created_at: string;
};

// User
export type User = {
  id: string;
  alias: string;
  college: string;
  phone: string;
  student_id_url: string | null;
  is_verified: boolean;
  is_banned: boolean;
  rating: number;
  total_reviews: number;
  created_at: string;
};

// Transaction
export type Transaction = {
  id: string;
  listing_id: string | null;
  buyer_id: string | null;
  seller_id: string | null;
  amount: number;
  platform_fee: number;
  seller_payout: number;
  status: "pending" | "paid" | "completed" | "disputed" | "refunded";
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  handoff_code: string | null;
  handoff_confirmed_at: string | null;
  created_at: string;
};

// Conversation
export type Conversation = {
  id: string;
  listing_id: string | null;
  buyer_id: string | null;
  seller_id: string | null;
  last_message_at: string;
  created_at: string;
};

// Message
export type Message = {
  id: string;
  conversation_id: string | null;
  sender_id: string | null;
  content: string;
  is_read: boolean;
  created_at: string;
};

// Review
export type Review = {
  id: string;
  transaction_id: string | null;
  reviewer_id: string | null;
  reviewee_id: string | null;
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string | null;
  created_at: string;
};

// API Request/Response types
export type ApiResponse<T> = {
  data: T | null;
  error: string | null;
};

export type PaginatedResponse<T> = {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
};

export type CreateListingRequest = {
  title: string;
  description?: string;
  price: number;
  category: Listing["category"];
  condition: Listing["condition"];
  images: string[];
  college: string;
};

export type CreateTransactionRequest = {
  listing_id: string;
  amount: number;
};

export type ConfirmHandoffRequest = {
  transaction_id: string;
  handoff_code: string;
};