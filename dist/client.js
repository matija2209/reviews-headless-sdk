"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewsSDK = void 0;
const errors_1 = require("./errors");
class ReviewsSDK {
    config;
    constructor(config) {
        (0, errors_1.validateConfig)(config);
        this.config = {
            timeout: 30000, // Default 30 second timeout
            ...config,
        };
    }
    /**
     * Private method to make HTTP requests to the API
     */
    async request(endpoint, options = {}) {
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
            }
            catch {
                data = null;
            }
            // Handle non-2xx responses
            if (!response.ok) {
                (0, errors_1.handleAPIError)(response, data);
            }
            return data;
        }
        catch (error) {
            // Re-throw SDK errors
            if (error instanceof errors_1.ReviewsSDKError) {
                throw error;
            }
            // Handle network/fetch errors
            (0, errors_1.handleNetworkError)(error);
        }
    }
    /**
     * READ: Get reviews by product ID with optional filtering
     */
    async getByProduct(productId, filters = {}) {
        if (!productId) {
            throw new errors_1.ReviewsSDKError('Product ID is required', 'VALIDATION_ERROR', 'Please provide a valid product ID');
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
        return this.request(`/api/v1/reviews?${params}`);
    }
    /**
     * READ: Get single review by ID
     */
    async getById(reviewId) {
        if (!reviewId) {
            throw new errors_1.ReviewsSDKError('Review ID is required', 'VALIDATION_ERROR', 'Please provide a valid review ID');
        }
        return this.request(`/api/v1/reviews/${reviewId}`);
    }
    /**
     * CREATE: Submit new review
     * Note: productHandle is optional - API will look it up from Shopify automatically
     */
    async create(data) {
        // Validate required fields
        if (!data.productId) {
            throw new errors_1.ReviewsSDKError('Product ID is required', 'VALIDATION_ERROR', 'Please provide a valid product ID');
        }
        // Validate productId is numeric only
        if (!/^\d+$/.test(data.productId)) {
            throw new errors_1.ReviewsSDKError('Product ID must be numeric only (e.g., "9686783951190")', 'VALIDATION_ERROR', 'Do not use full Shopify GID format. Use numeric ID only.');
        }
        if (!data.customerName) {
            throw new errors_1.ReviewsSDKError('Customer name is required', 'VALIDATION_ERROR', 'Please provide a customer name');
        }
        if (!data.rating) {
            throw new errors_1.ReviewsSDKError('Rating is required', 'VALIDATION_ERROR', 'Please provide a rating');
        }
        // Validate rating is a string between "1" and "5"
        const ratingNum = parseInt(data.rating, 10);
        if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
            throw new errors_1.ReviewsSDKError('Rating must be a string between "1" and "5"', 'VALIDATION_ERROR', 'Please provide a valid rating');
        }
        const requestData = {
            ...data,
            intent: 'create',
        };
        return this.request('/api/v1/reviews', {
            method: 'POST',
            body: JSON.stringify(requestData),
        });
    }
    /**
     * UPDATE: Update existing review
     */
    async update(reviewId, data) {
        if (!reviewId) {
            throw new errors_1.ReviewsSDKError('Review ID is required', 'VALIDATION_ERROR', 'Please provide a valid review ID');
        }
        if (Object.keys(data).length === 0) {
            throw new errors_1.ReviewsSDKError('Update data is required', 'VALIDATION_ERROR', 'Please provide at least one field to update');
        }
        const requestData = {
            ...data,
            intent: 'update',
        };
        return this.request(`/api/v1/reviews/${reviewId}`, {
            method: 'PATCH',
            body: JSON.stringify(requestData),
        });
    }
    /**
     * DELETE: Delete review
     */
    async delete(reviewId) {
        if (!reviewId) {
            throw new errors_1.ReviewsSDKError('Review ID is required', 'VALIDATION_ERROR', 'Please provide a valid review ID');
        }
        const requestData = {
            intent: 'delete',
        };
        return this.request(`/api/v1/reviews/${reviewId}`, {
            method: 'DELETE',
            body: JSON.stringify(requestData),
        });
    }
    /**
     * APPROVE: Approve review (admin operation)
     */
    async approve(reviewId) {
        if (!reviewId) {
            throw new errors_1.ReviewsSDKError('Review ID is required', 'VALIDATION_ERROR', 'Please provide a valid review ID');
        }
        const requestData = {
            intent: 'approve',
        };
        return this.request(`/api/v1/reviews/${reviewId}/approve`, {
            method: 'POST',
            body: JSON.stringify(requestData),
        });
    }
    /**
     * Get all reviews (admin operation) - useful for admin panels
     */
    async getAll(filters = {}) {
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
        return this.request(`/api/v1/reviews/admin?${params}`);
    }
    /**
     * Get pending reviews (admin operation)
     */
    async getPending(filters = {}) {
        const params = new URLSearchParams({
            page: (filters.page || 1).toString(),
            limit: (filters.limit || 10).toString(),
            sortBy: filters.sortBy || 'submittedAt',
            sortOrder: filters.sortOrder || 'desc',
            isApproved: 'false', // Only pending reviews
        });
        return this.request(`/api/v1/reviews?${params}`);
    }
    /**
     * LIST: Alias for getByProduct() - more intuitive naming
     * Fetches approved reviews for a specific product
     */
    async list(productId, filters = {}) {
        return this.getByProduct(productId, filters);
    }
}
exports.ReviewsSDK = ReviewsSDK;
