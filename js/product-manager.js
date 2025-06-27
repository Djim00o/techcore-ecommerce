/**
 * TechCore Product Manager
 * Handles product display, filtering, and dynamic content loading
 */
class ProductManager {
    constructor() {
        this.apiClient = window.apiClient || new APIClient();
        this.products = [];
        this.categories = [];
        this.filters = {
            category: null,
            priceRange: null,
            brand: null,
            rating: null,
            search: null
        };
        this.sortBy = 'featured';
        this.currentPage = 1;
        this.productsPerPage = 12;
    }

    async init() {
        await this.loadCategories();
        await this.loadProducts();
        this.bindEvents();
    }

    async loadCategories() {
        try {
            const response = await this.apiClient.getCategories();
            if (response.success) {
                this.categories = response.data;
            }
        } catch (error) {
            console.error('Failed to load categories:', error);
            this.categories = this.getFallbackCategories();
        }
    }

    async loadProducts(params = {}) {
        try {
            const queryParams = {
                page: this.currentPage,
                limit: this.productsPerPage,
                sort: this.sortBy,
                ...this.filters,
                ...params
            };

            // Remove null values
            Object.keys(queryParams).forEach(key => {
                if (queryParams[key] === null || queryParams[key] === '') {
                    delete queryParams[key];
                }
            });

            const response = await this.apiClient.getProducts(queryParams);
            if (response.success) {
                this.products = response.data.products || response.data;
                this.totalProducts = response.data.total || this.products.length;
                this.renderProducts();
                this.updatePagination();
            }
        } catch (error) {
            console.error('Failed to load products:', error);
            this.showError('Failed to load products. Please try again.');
        }
    }

    renderProducts() {
        const container = document.getElementById('productsGrid') || 
                         document.getElementById('featuredProducts') ||
                         document.querySelector('.products-grid');
        
        if (!container) return;

        if (this.products.length === 0) {
            container.innerHTML = this.getEmptyStateHTML();
            return;
        }

        container.innerHTML = this.products.map(product => this.createProductCard(product)).join('');
        this.bindProductEvents();
    }

    createProductCard(product) {
        const isOnSale = product.originalPrice && product.originalPrice > product.price;
        const isNew = this.isNewProduct(product);
        const discountPercent = isOnSale ? 
            Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;
        
        const tags = this.getProductTags(product, isOnSale, isNew, discountPercent);
        const rating = this.calculateAverageRating(product.reviews);
        
        return `
            <div class="product-card" data-product-id="${product._id}">
                <div class="product-image-container">
                    <img src="${this.getProductImage(product)}" 
                         alt="${product.name}" 
                         class="product-image"
                         loading="lazy"
                         onerror="this.src='https://images.unsplash.com/photo-1591488320449-011701bb6704?w=400'">
                    
                    ${tags.length > 0 ? `
                        <div class="product-tags">
                            ${tags.map(tag => `<span class="product-tag product-tag-${tag.type}">${tag.text}</span>`).join('')}
                        </div>
                    ` : ''}
                    
                    <div class="product-actions">
                        <button class="product-action-btn wishlist-btn" 
                                onclick="productManager.toggleWishlist('${product._id}', this)"
                                title="Add to Wishlist">
                            <i class="fas fa-heart"></i>
                        </button>
                        <button class="product-action-btn quick-view-btn" 
                                onclick="productManager.showQuickView('${product._id}')"
                                title="Quick View">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </div>
                
                <div class="product-info">
                    <div class="product-category">${this.getCategoryName(product.category)}</div>
                    <h3 class="product-name">
                        <a href="product.html?id=${product._id}">${product.name}</a>
                    </h3>
                    
                    ${rating > 0 ? `
                        <div class="product-rating">
                            ${this.generateStarRating(rating)}
                            <span class="rating-count">(${product.reviews?.length || 0})</span>
                        </div>
                    ` : ''}
                    
                    <div class="product-price">
                        <span class="current-price">$${product.price.toFixed(2)}</span>
                        ${isOnSale ? `
                            <span class="original-price">$${product.originalPrice.toFixed(2)}</span>
                            <span class="discount-percent">-${discountPercent}%</span>
                        ` : ''}
                    </div>
                    
                    <div class="product-stock">
                        ${product.stock > 0 ? 
                            `<span class="in-stock"><i class="fas fa-check"></i> In Stock (${product.stock})</span>` :
                            `<span class="out-of-stock"><i class="fas fa-times"></i> Out of Stock</span>`
                        }
                    </div>
                    
                    <button class="btn btn-primary add-to-cart-btn" 
                            onclick="productManager.addToCart('${product._id}')"
                            ${product.stock === 0 ? 'disabled' : ''}>
                        <i class="fas fa-shopping-cart"></i>
                        ${product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                    </button>
                </div>
            </div>
        `;
    }

    getProductTags(product, isOnSale, isNew, discountPercent) {
        const tags = [];
        
        if (isNew) {
            tags.push({ type: 'new', text: 'NEW' });
        }
        
        if (isOnSale) {
            tags.push({ type: 'sale', text: `${discountPercent}% OFF` });
        }
        
        if (product.featured) {
            tags.push({ type: 'featured', text: 'FEATURED' });
        }
        
        if (product.stock > 0 && product.stock <= 5) {
            tags.push({ type: 'limited', text: 'LIMITED STOCK' });
        }
        
        if (product.isPopular) {
            tags.push({ type: 'popular', text: 'POPULAR' });
        }
        
        return tags.slice(0, 2); // Limit to 2 tags to avoid clutter
    }

    isNewProduct(product) {
        if (!product.createdAt) return false;
        const productDate = new Date(product.createdAt);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return productDate > thirtyDaysAgo;
    }

    getProductImage(product) {
        if (product.images && product.images.length > 0) {
            return product.images[0].url || product.images[0];
        }
        return product.image || this.getDefaultImage(product.category);
    }

    getDefaultImage(category) {
        const defaultImages = {
            'graphics-cards': 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=400',
            'processors': 'https://images.unsplash.com/photo-1555617981-dac3880eac6e?w=400',
            'motherboards': 'https://images.unsplash.com/photo-1562976540-906b13717cd1?w=400',
            'memory': 'https://images.unsplash.com/photo-1541029071515-84cc54f84dc5?w=400',
            'storage': 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=400',
            'cooling': 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=400'
        };
        return defaultImages[category] || 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=400';
    }

    getCategoryName(categorySlug) {
        const category = this.categories.find(cat => cat.slug === categorySlug || cat._id === categorySlug);
        return category ? category.name : this.formatCategoryName(categorySlug);
    }

    formatCategoryName(slug) {
        return slug.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }

    calculateAverageRating(reviews) {
        if (!reviews || reviews.length === 0) return 0;
        const total = reviews.reduce((sum, review) => sum + review.rating, 0);
        return total / reviews.length;
    }

    generateStarRating(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        
        let stars = '';
        
        // Full stars
        for (let i = 0; i < fullStars; i++) {
            stars += '<i class="fas fa-star"></i>';
        }
        
        // Half star
        if (hasHalfStar) {
            stars += '<i class="fas fa-star-half-alt"></i>';
        }
        
        // Empty stars
        for (let i = 0; i < emptyStars; i++) {
            stars += '<i class="far fa-star"></i>';
        }
        
        return `<div class="stars" data-rating="${rating.toFixed(1)}">${stars}</div>`;
    }

    getEmptyStateHTML() {
        return `
            <div class="empty-state">
                <div class="empty-state-icon">
                    <i class="fas fa-search"></i>
                </div>
                <h3>No Products Found</h3>
                <p>We couldn't find any products matching your criteria.</p>
                <button class="btn btn-primary" onclick="productManager.clearFilters()">
                    Clear Filters
                </button>
            </div>
        `;
    }

    async addToCart(productId) {
        if (!window.authManager.requireAuth()) return;
        
        try {
            const response = await this.apiClient.addToCart(productId, 1);
            if (response.success) {
                window.authManager.showSuccessToast('Product added to cart!');
                this.updateCartCount();
            }
        } catch (error) {
            console.error('Add to cart error:', error);
            window.authManager.showErrorToast('Failed to add product to cart');
        }
    }

    async toggleWishlist(productId, button) {
        if (!window.authManager.requireAuth()) return;
        
        try {
            const isInWishlist = button.classList.contains('active');
            
            if (isInWishlist) {
                await this.apiClient.removeFromWishlist(productId);
                button.classList.remove('active');
                window.authManager.showSuccessToast('Removed from wishlist');
            } else {
                await this.apiClient.addToWishlist(productId);
                button.classList.add('active');
                window.authManager.showSuccessToast('Added to wishlist');
            }
            
            this.updateWishlistCount();
        } catch (error) {
            console.error('Wishlist error:', error);
            window.authManager.showErrorToast('Failed to update wishlist');
        }
    }

    showQuickView(productId) {
        // Implement quick view modal
        window.location.href = `product.html?id=${productId}`;
    }

    updateCartCount() {
        // Update cart count in header
        const cartCount = document.getElementById('cartCount');
        if (cartCount && window.authManager.isLoggedIn()) {
            this.apiClient.getCart().then(response => {
                if (response.success) {
                    const totalItems = response.data.items.reduce((sum, item) => sum + item.quantity, 0);
                    cartCount.textContent = totalItems;
                }
            }).catch(console.error);
        }
    }

    updateWishlistCount() {
        // Update wishlist count in header
        const wishlistCount = document.getElementById('wishlistCount');
        if (wishlistCount && window.authManager.isLoggedIn()) {
            this.apiClient.getWishlist().then(response => {
                if (response.success) {
                    wishlistCount.textContent = response.data.length;
                }
            }).catch(console.error);
        }
    }

    bindEvents() {
        // Sort dropdown
        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.sortBy = e.target.value;
                this.loadProducts();
            });
        }

        // Filter events
        this.bindFilterEvents();
    }

    bindFilterEvents() {
        // Price range filters
        document.querySelectorAll('input[name="price"]').forEach(input => {
            input.addEventListener('change', (e) => {
                this.filters.priceRange = e.target.checked ? e.target.value : null;
                this.loadProducts();
            });
        });

        // Brand filters
        document.querySelectorAll('input[name="brand"]').forEach(input => {
            input.addEventListener('change', (e) => {
                this.filters.brand = e.target.checked ? e.target.value : null;
                this.loadProducts();
            });
        });

        // Rating filters
        document.querySelectorAll('input[name="rating"]').forEach(input => {
            input.addEventListener('change', (e) => {
                this.filters.rating = e.target.checked ? e.target.value : null;
                this.loadProducts();
            });
        });
    }

    bindProductEvents() {
        // Add click tracking for analytics
        document.querySelectorAll('.product-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('button')) {
                    const productId = card.dataset.productId;
                    this.trackProductView(productId);
                }
            });
        });
    }

    trackProductView(productId) {
        // Add to recently viewed
        let recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
        recentlyViewed = recentlyViewed.filter(id => id !== productId);
        recentlyViewed.unshift(productId);
        recentlyViewed = recentlyViewed.slice(0, 10); // Keep only last 10
        localStorage.setItem('recentlyViewed', JSON.stringify(recentlyViewed));
    }

    clearFilters() {
        this.filters = {
            category: null,
            priceRange: null,
            brand: null,
            rating: null,
            search: null
        };
        
        // Clear UI
        document.querySelectorAll('input[type="checkbox"], input[type="radio"]').forEach(input => {
            input.checked = false;
        });
        
        this.loadProducts();
    }

    updatePagination() {
        const totalPages = Math.ceil(this.totalProducts / this.productsPerPage);
        const paginationContainer = document.querySelector('.pagination-numbers');
        
        if (!paginationContainer || totalPages <= 1) return;

        let paginationHTML = '';
        
        // Previous button
        const prevBtn = document.querySelector('.pagination-btn.prev');
        if (prevBtn) {
            prevBtn.disabled = this.currentPage === 1;
        }
        
        // Next button
        const nextBtn = document.querySelector('.pagination-btn.next');
        if (nextBtn) {
            nextBtn.disabled = this.currentPage === totalPages;
        }
        
        // Page numbers
        for (let i = 1; i <= Math.min(totalPages, 5); i++) {
            paginationHTML += `
                <button class="pagination-number ${i === this.currentPage ? 'active' : ''}" 
                        onclick="productManager.goToPage(${i})">
                    ${i}
                </button>
            `;
        }
        
        if (totalPages > 5) {
            paginationHTML += '<span class="pagination-dots">...</span>';
            paginationHTML += `
                <button class="pagination-number" onclick="productManager.goToPage(${totalPages})">
                    ${totalPages}
                </button>
            `;
        }
        
        paginationContainer.innerHTML = paginationHTML;
    }

    goToPage(page) {
        this.currentPage = page;
        this.loadProducts();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    showError(message) {
        window.authManager.showErrorToast(message);
    }

    getFallbackCategories() {
        return [
            { _id: 'graphics-cards', name: 'Graphics Cards', slug: 'graphics-cards' },
            { _id: 'processors', name: 'Processors', slug: 'processors' },
            { _id: 'motherboards', name: 'Motherboards', slug: 'motherboards' },
            { _id: 'memory', name: 'Memory', slug: 'memory' },
            { _id: 'storage', name: 'Storage', slug: 'storage' },
            { _id: 'cooling', name: 'Cooling', slug: 'cooling' }
        ];
    }
}

// Initialize global product manager
window.productManager = new ProductManager(); 