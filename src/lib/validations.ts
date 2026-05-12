import { z } from "zod";

// Auth
export const authSchema = z.object({
  phone: z.string().min(10).max(10).regex(/^[6-9]\d{9}$/, "Invalid Indian mobile number"),
  otp: z.string().length(6).optional(),
});

// Listing
export const createListingSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100),
  description: z.string().max(500).optional(),
  price: z.number().min(1, "Price must be at least ₹1").max(50000),
  category: z.enum(["tops", "bottoms", "shoes", "bags", "accessories"]),
  condition: z.enum(["new", "like_new", "good", "fair"]),
  images: z.array(z.string().url()).min(1, "At least one image required").max(5),
  college: z.string().min(2),
});

export const updateListingSchema = createListingSchema.partial().extend({
  status: z.enum(["active", "sold", "removed"]).optional(),
});

// Transaction
export const createTransactionSchema = z.object({
  listing_id: z.string().uuid(),
  amount: z.number().positive(),
});

export const confirmHandoffSchema = z.object({
  transaction_id: z.string().uuid(),
  handoff_code: z.string().length(6),
});

// Review
export const createReviewSchema = z.object({
  transaction_id: z.string().uuid(),
  reviewee_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(300).optional(),
});

// Report
export const createReportSchema = z.object({
  listing_id: z.string().uuid(),
  reason: z.enum(["spam", "fake", "inappropriate", "scam", "other"]),
  details: z.string().max(300).optional(),
});

// Types inferred from schemas
export type AuthInput = z.infer<typeof authSchema>;
export type CreateListingInput = z.infer<typeof createListingSchema>;
export type UpdateListingInput = z.infer<typeof updateListingSchema>;
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type ConfirmHandoffInput = z.infer<typeof confirmHandoffSchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type CreateReportInput = z.infer<typeof createReportSchema>;