/**
 * TechCore API Client
 * Handles all communication with the backend API
 */
class APIClient {
    constructor() {
        this.baseURL = 'http://localhost:5234/api';
        this.token = localStorage.getItem('authToken');
    }

    // Helper method to make API requests
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        
        // Always get fresh token from localStorage to handle multiple instances
        const currentToken = localStorage.getItem('authToken');
        if (currentToken) {
            this.token = currentToken;
        }
        
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        // Add auth token if available
        if (this.token) {
            config.headers['Authorization'] = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Authentication methods
    async login(email, password) {
        const data = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        
        if (data.success) {
            this.token = data.token;
            localStorage.setItem('authToken', this.token);
            localStorage.setItem('user', JSON.stringify(data.user));
        }
        
        return data;
    }

    async register(userData) {
        const data = await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
        
        if (data.success) {
            this.token = data.token;
            localStorage.setItem('authToken', this.token);
            localStorage.setItem('user', JSON.stringify(data.user));
        }
        
        return data;
    }

    async logout() {
        try {
            await this.request('/auth/logout', { method: 'POST' });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            this.token = null;
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            localStorage.removeItem('cart');
        }
    }

    // Product methods
    async getProducts(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return await this.request(`/products${queryString ? `?${queryString}` : ''}`);
    }

    async getProduct(id) {
        return await this.request(`/products/${id}`);
    }

    async getFeaturedProducts() {
        return await this.request('/products?featured=true&limit=8');
    }

    async getProductsByCategory(category, params = {}) {
        return await this.request(`/products?category=${category}&${new URLSearchParams(params)}`);
    }

    // Categories methods
    async getCategories() {
        return await this.request('/categories');
    }

    async getFeaturedCategories() {
        return await this.request('/categories?featured=true');
    }

    // Cart methods
    async getCart() {
        return await this.request('/cart');
    }

    async addToCart(productId, quantity = 1) {
        return await this.request('/cart/add', {
            method: 'POST',
            body: JSON.stringify({ productId, quantity })
        });
    }

    async updateCartItem(productId, quantity) {
        return await this.request('/cart/update', {
            method: 'PUT',
            body: JSON.stringify({ productId, quantity })
        });
    }

    async removeFromCart(productId) {
        return await this.request(`/cart/remove/${productId}`, {
            method: 'DELETE'
        });
    }

    async clearCart() {
        return await this.request('/cart/clear', {
            method: 'DELETE'
        });
    }

    // Wishlist methods
    async getWishlist() {
        return await this.request('/wishlist');
    }

    async addToWishlist(productId) {
        return await this.request('/wishlist/add', {
            method: 'POST',
            body: JSON.stringify({ productId })
        });
    }

    async removeFromWishlist(productId) {
        return await this.request(`/wishlist/remove/${productId}`, {
            method: 'DELETE'
        });
    }

    // Search methods
    async searchProducts(query, filters = {}) {
        const params = new URLSearchParams({ q: query, ...filters });
        return await this.request(`/search?${params}`);
    }

    async getSearchSuggestions(query) {
        return await this.request(`/search/suggestions?q=${encodeURIComponent(query)}`);
    }

    // Order methods
    async getOrders() {
        return await this.request('/orders');
    }

    async createOrder(orderData) {
        return await this.request('/orders', {
            method: 'POST',
            body: JSON.stringify(orderData)
        });
    }

    async getOrder(orderId) {
        return await this.request(`/orders/${orderId}`);
    }

    // Review methods
    async getProductReviews(productId, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return await this.request(`/reviews/product/${productId}${queryString ? `?${queryString}` : ''}`);
    }

    async addReview(productId, reviewData) {
        return await this.request(`/products/${productId}/reviews`, {
            method: 'POST',
            body: JSON.stringify(reviewData)
        });
    }

    // User methods
    async getProfile() {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user._id) {
            return await this.request(`/users/${user._id}`);
        }
        throw new Error('No user logged in');
    }

    async updateProfile(userData) {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user._id) {
            return await this.request(`/users/${user._id}`, {
                method: 'PUT',
                body: JSON.stringify(userData)
            });
        }
        throw new Error('No user logged in');
    }

    // Utility methods
    isLoggedIn() {
        return !!this.token && !!localStorage.getItem('user');
    }

    getCurrentUser() {
        return JSON.parse(localStorage.getItem('user') || 'null');
    }

    async healthCheck() {
        try {
            const response = await fetch('http://localhost:5234/health');
            return await response.json();
        } catch (error) {
            console.error('Health check failed:', error);
            return { success: false, error: error.message };
        }
    }
}

// Create global instance
const apiClient = new APIClient();

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIClient;
} 