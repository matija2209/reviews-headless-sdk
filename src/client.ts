import {
  ReviewsSDKConfig,
  ReviewFilters,
  CreateReviewData,
  UpdateReviewData,
  CreateReviewRequest,
  UpdateReviewRequest,
  DeleteReviewRequest,
  ApproveReviewRequest,
  ReviewsAPIResponse,
  SingleReviewAPIResponse,
  DeleteReviewAPIResponse,
} from './types';
import { ReviewsSDKError, handleAPIError, handleNetworkError, validateConfig } from './errors';

export class ReviewsSDK {
  private config: ReviewsSDKConfig;

  constructor(config: ReviewsSDKConfig) {
    validateConfig(config);
    
    this.config = {
      timeout: 30000, // Default 30 second timeout
      ...config,
    };
  }

  /**
   * Private method to make HTTP requests to the API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Parse response
      let data;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      // Handle non-2xx responses
      if (!response.ok) {
        handleAPIError(response, data);
      }

      return data as T;
    } catch (error) {
      // Re-throw SDK errors
      if (error instanceof ReviewsSDKError) {
        throw error;
      }
      
      // Handle network/fetch errors
      handleNetworkError(error as Error);
    }
  }

  /**
   * READ: Get reviews by product ID with optional filtering
   */
  async getByProduct(
    productId: string,
    filters: ReviewFilters = {}
  ): Promise<ReviewsAPIResponse> {
    if (!productId) {
      throw new ReviewsSDKError(
        'Product ID is required',
        'VALIDATION_ERROR',
        'Please provide a valid product ID'
      );
    }

    const params = new URLSearchParams({
      productId,
      page: (filters.page || 1).toString(),
      limit: (filters.limit || 5).toString(),
      sortBy: filters.sortBy || 'submittedAt',
      sortOrder: filters.sortOrder || 'desc',
      isApproved: 'true', // Only get approved reviews by default
    });

    // Add rating filter if specified
    if (filters.rating !== 'all' && filters.rating) {
      params.append('exactRating', filters.rating.toString());
    }

    return this.request<ReviewsAPIResponse>(`/api/v1/reviews?${params}`);
  }

  /**
   * READ: Get single review by ID
   */
  async getById(reviewId: string): Promise<SingleReviewAPIResponse> {
    if (!reviewId) {
      throw new ReviewsSDKError(
        'Review ID is required',
        'VALIDATION_ERROR',
        'Please provide a valid review ID'
      );
    }

    return this.request<SingleReviewAPIResponse>(`/api/v1/reviews/${reviewId}`);
  }

  /**
   * CREATE: Submit new review
   * Note: productHandle is optional - API will look it up from Shopify automatically
   */
  async create(data: CreateReviewData): Promise<SingleReviewAPIResponse> {
    // Validate required fields
    if (!data.productId) {
      throw new ReviewsSDKError(
        'Product ID is required',
        'VALIDATION_ERROR',
        'Please provide a valid product ID'
      );
    }

    // Validate productId is numeric only
    if (!/^\d+$/.test(data.productId)) {
      throw new ReviewsSDKError(
        'Product ID must be numeric only (e.g., "9686783951190")',
        'VALIDATION_ERROR',
        'Do not use full Shopify GID format. Use numeric ID only.'
      );
    }

    if (!data.customerName) {
      throw new ReviewsSDKError(
        'Customer name is required',
        'VALIDATION_ERROR',
        'Please provide a customer name'
      );
    }

    if (!data.rating) {
      throw new ReviewsSDKError(
        'Rating is required',
        'VALIDATION_ERROR',
        'Please provide a rating'
      );
    }

    // Validate rating is a string between "1" and "5"
    const ratingNum = parseInt(data.rating, 10);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      throw new ReviewsSDKError(
        'Rating must be a string between "1" and "5"',
        'VALIDATION_ERROR',
        'Please provide a valid rating'
      );
    }

    const requestData: CreateReviewRequest = {
      ...data,
      intent: 'create',
    };

    return this.request<SingleReviewAPIResponse>('/api/v1/reviews', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
  }

  /**
   * UPDATE: Update existing review
   */
  async update(
    reviewId: string,
    data: UpdateReviewData
  ): Promise<SingleReviewAPIResponse> {
    if (!reviewId) {
      throw new ReviewsSDKError(
        'Review ID is required',
        'VALIDATION_ERROR',
        'Please provide a valid review ID'
      );
    }

    if (Object.keys(data).length === 0) {
      throw new ReviewsSDKError(
        'Update data is required',
        'VALIDATION_ERROR',
        'Please provide at least one field to update'
      );
    }

    const requestData: UpdateReviewRequest = {
      ...data,
      intent: 'update',
    };

    return this.request<SingleReviewAPIResponse>(`/api/v1/reviews/${reviewId}`, {
      method: 'PATCH',
      body: JSON.stringify(requestData),
    });
  }

  /**
   * DELETE: Delete review
   */
  async delete(reviewId: string): Promise<DeleteReviewAPIResponse> {
    if (!reviewId) {
      throw new ReviewsSDKError(
        'Review ID is required',
        'VALIDATION_ERROR',
        'Please provide a valid review ID'
      );
    }

    const requestData: DeleteReviewRequest = {
      intent: 'delete',
    };

    return this.request<DeleteReviewAPIResponse>(`/api/v1/reviews/${reviewId}`, {
      method: 'DELETE',
      body: JSON.stringify(requestData),
    });
  }

  /**
   * APPROVE: Approve review (admin operation)
   */
  async approve(reviewId: string): Promise<SingleReviewAPIResponse> {
    if (!reviewId) {
      throw new ReviewsSDKError(
        'Review ID is required',
        'VALIDATION_ERROR',
        'Please provide a valid review ID'
      );
    }

    const requestData: ApproveReviewRequest = {
      intent: 'approve',
    };

    return this.request<SingleReviewAPIResponse>(`/api/v1/reviews/${reviewId}/approve`, {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
  }

  /**
   * Get all reviews (admin operation) - useful for admin panels
   */
  async getAll(filters: ReviewFilters = {}): Promise<ReviewsAPIResponse> {
    const params = new URLSearchParams({
      page: (filters.page || 1).toString(),
      limit: (filters.limit || 10).toString(),
      sortBy: filters.sortBy || 'submittedAt',
      sortOrder: filters.sortOrder || 'desc',
    });

    // Don't filter by isApproved for admin view
    if (filters.rating !== 'all' && filters.rating) {
      params.append('exactRating', filters.rating.toString());
    }

    return this.request<ReviewsAPIResponse>(`/api/v1/reviews/admin?${params}`);
  }

  /**
   * Get pending reviews (admin operation)
   */
  async getPending(filters: ReviewFilters = {}): Promise<ReviewsAPIResponse> {
    const params = new URLSearchParams({
      page: (filters.page || 1).toString(),
      limit: (filters.limit || 10).toString(),
      sortBy: filters.sortBy || 'submittedAt',
      sortOrder: filters.sortOrder || 'desc',
      isApproved: 'false', // Only pending reviews
    });

    return this.request<ReviewsAPIResponse>(`/api/v1/reviews?${params}`);
  }

  /**
   * LIST: Alias for getByProduct() - more intuitive naming
   * Fetches approved reviews for a specific product
   */
  async list(
    productId: string,
    filters: ReviewFilters = {}
  ): Promise<ReviewsAPIResponse> {
    return this.getByProduct(productId, filters);
  }
}