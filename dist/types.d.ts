export interface ReviewsSDKConfig {
    apiKey: string;
    baseUrl: string;
    timeout?: number;
}
export interface ReviewFilters {
    rating?: number | "all";
    sortBy?: "submittedAt" | "rating";
    sortOrder?: "asc" | "desc";
    page?: number;
    limit?: number;
}
export interface CreateReviewRequest {
    productId: string;
    productHandle?: string;
    rating: string;
    title?: string;
    customerName: string;
    customerEmail?: string;
    description?: string;
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
export interface APIReview {
    id: string;
    productId: string;
    rating: number;
    title: string;
    description: string;
    customerName: string;
    customerEmail?: string;
    customerId?: string;
    isApproved: boolean;
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
export type CreateReviewData = Omit<CreateReviewRequest, 'intent'>;
export type UpdateReviewData = Omit<UpdateReviewRequest, 'intent'>;
