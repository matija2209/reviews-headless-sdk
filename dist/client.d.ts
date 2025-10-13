import { ReviewsSDKConfig, ReviewFilters, CreateReviewData, UpdateReviewData, ReviewsAPIResponse, SingleReviewAPIResponse, DeleteReviewAPIResponse } from './types';
export declare class ReviewsSDK {
    private config;
    constructor(config: ReviewsSDKConfig);
    /**
     * Private method to make HTTP requests to the API
     */
    private request;
    /**
     * READ: Get reviews by product ID with optional filtering
     */
    getByProduct(productId: string, filters?: ReviewFilters): Promise<ReviewsAPIResponse>;
    /**
     * READ: Get single review by ID
     */
    getById(reviewId: string): Promise<SingleReviewAPIResponse>;
    /**
     * CREATE: Submit new review
     * Note: productHandle is optional - API will look it up from Shopify automatically
     */
    create(data: CreateReviewData): Promise<SingleReviewAPIResponse>;
    /**
     * UPDATE: Update existing review
     */
    update(reviewId: string, data: UpdateReviewData): Promise<SingleReviewAPIResponse>;
    /**
     * DELETE: Delete review
     */
    delete(reviewId: string): Promise<DeleteReviewAPIResponse>;
    /**
     * APPROVE: Approve review (admin operation)
     */
    approve(reviewId: string): Promise<SingleReviewAPIResponse>;
    /**
     * Get all reviews (admin operation) - useful for admin panels
     */
    getAll(filters?: ReviewFilters): Promise<ReviewsAPIResponse>;
    /**
     * Get pending reviews (admin operation)
     */
    getPending(filters?: ReviewFilters): Promise<ReviewsAPIResponse>;
    /**
     * LIST: Alias for getByProduct() - more intuitive naming
     * Fetches approved reviews for a specific product
     */
    list(productId: string, filters?: ReviewFilters): Promise<ReviewsAPIResponse>;
}
