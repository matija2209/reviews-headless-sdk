// SDK Configuration
export interface ReviewsSDKConfig {
  apiKey: string;
  baseUrl: string;
  timeout?: number;
}

// Filter types
export interface ReviewFilters {
  rating?: number | "all";
  sortBy?: "submittedAt" | "rating";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

// Request Types for CRUD operations
export interface CreateReviewRequest {
  productId: string; // Numeric ID only (e.g., "9686783951190")
  productHandle?: string; // Optional - API will look it up automatically
  rating: string; // Must be string "1" to "5"
  title?: string;
  customerName: string;
  customerEmail?: string;
  description?: string; // Optional field
  intent: 'create';
}

export interface UpdateReviewRequest {
  rating?: string;
  title?: string;
  description?: string;
  intent: 'update';
}

export interface DeleteReviewRequest {
  intent: 'delete';
}

export interface ApproveReviewRequest {
  intent: 'approve';
}

// API Response Types (matching your current API)
export interface APIReview {
  id: string;
  productId: string;
  rating: number;
  title: string;
  description: string; // Note: API uses 'description' not 'content'
  customerName: string;
  customerEmail?: string;
  customerId?: string;
  isApproved: boolean; // Note: API uses 'isApproved' not 'isVerified'
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewsAPIResponse {
  success: boolean;
  data: {
    reviews: APIReview[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
  };
  timestamp: string;
}

export interface SingleReviewAPIResponse {
  success: boolean;
  data: {
    review: APIReview;
  };
  timestamp: string;
}

export interface DeleteReviewAPIResponse {
  success: boolean;
  data: {
    deleted: boolean;
    reviewId: string;
  };
  timestamp: string;
}

export interface ReviewsErrorResponse {
  error: {
    code: string;
    message: string;
    details?: string;
    timestamp: string;
    path: string;
  };
}

// Utility types for better DX
export type CreateReviewData = Omit<CreateReviewRequest, 'intent'>;
export type UpdateReviewData = Omit<UpdateReviewRequest, 'intent'>;