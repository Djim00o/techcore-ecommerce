// Product Detail Page JavaScript
class ProductDetail {
    constructor() {
        this.apiClient = window.apiClient || new APIClient();
        this.currentProduct = null;
        this.currentImageIndex = 0;
        this.zoomLevel = 1;
        this.reviewRating = 0;
        this.quantity = 1;
        this.init();
    }

    async init() {
        try {
            // Get product ID from URL
            const urlParams = new URLSearchParams(window.location.search);
            const productId = urlParams.get('id') || urlParams.get('slug');
            
            if (!productId) {
                this.showError('Product ID not found in URL');
                return;
            }
            
            await this.loadProduct(productId);
            this.initializeEventListeners();
            this.initializeTabs();
            this.loadRecentlyViewed();
            
        } catch (error) {
            console.error('Error initializing product page:', error);
            this.showError('Failed to load product details');
        }
    }

    async loadProduct(productId) {
        try {
            this.showLoadingState();
            
            const response = await this.apiClient.getProduct(productId);
            
            if (!response.success || !response.data) {
                throw new Error(response.message || 'Product not found');
            }
            
            this.currentProduct = response.data;
            this.renderProduct(this.currentProduct);
            this.updateBreadcrumbs(this.currentProduct);
            this.loadRelatedProducts(this.currentProduct.category);
            
            // Track product view
            this.trackProductView(this.currentProduct._id || this.currentProduct.id);
            
            this.hideLoadingState();
            
        } catch (error) {
            console.error('Error loading product:', error);
            this.hideLoadingState();
            this.showError('Failed to load product details. Product may not exist.');
        }
    }

    renderProduct(product) {
        // Update page title
        document.title = `${product.name} - TechCore`;
        
        // Render product images
        this.renderProductImages(product.images || []);
        
        // Render product info
        this.renderProductInfo(product);
        
        // Render specifications
        if (product.specifications) {
            this.renderSpecifications(product.specifications);
        }
        
        // Render reviews
        if (product.reviews) {
            this.renderReviews(product.reviews, product.rating);
        }
    }

    renderProductImages(images) {
        const mainImage = document.getElementById('mainImage');
        const thumbnailContainer = document.getElementById('thumbnailImages');
        const badges = document.getElementById('productBadges');
        
        if (images && images.length > 0) {
            // Set main image
            const primaryImage = images.find(img => img.isPrimary) || images[0];
            const imageUrl = primaryImage.url || primaryImage;
            
            if (mainImage) {
                mainImage.src = imageUrl;
                mainImage.alt = primaryImage.alt || this.currentProduct.name;
            }
            
            // Clear and populate thumbnails
            if (thumbnailContainer) {
                thumbnailContainer.innerHTML = '';
                images.forEach((image, index) => {
                    const imageUrl = image.url || image;
                    const thumbnail = document.createElement('img');
                    thumbnail.src = imageUrl;
                    thumbnail.alt = image.alt || `${this.currentProduct.name} view ${index + 1}`;
                    thumbnail.className = `thumbnail ${index === 0 ? 'active' : ''}`;
                    thumbnail.addEventListener('click', () => this.changeMainImage(index));
                    thumbnailContainer.appendChild(thumbnail);
                });
            }
        } else {
            // Use default image
            const defaultImage = this.getDefaultImage(this.currentProduct.category);
            if (mainImage) {
                mainImage.src = defaultImage;
                mainImage.alt = this.currentProduct.name;
            }
        }
        
        // Render product badges
        if (badges) {
            this.renderProductBadges(badges);
        }
    }

    getDefaultImage(category) {
        const defaultImages = {
            'graphics-cards': 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=800',
            'processors': 'https://images.unsplash.com/photo-1555617981-dac3880eac6e?w=800',
            'motherboards': 'https://images.unsplash.com/photo-1562976540-906b13717cd1?w=800',
            'memory': 'https://images.unsplash.com/photo-1541029071515-84cc54f84dc5?w=800',
            'storage': 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=800',
            'cooling': 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=800'
        };
        return defaultImages[category] || 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=800';
    }

    renderProductBadges(container) {
        const badges = [];
        
        if (this.currentProduct.isNew) {
            badges.push('<span class="product-badge badge-new">New</span>');
        }
        
        if (this.currentProduct.originalPrice && this.currentProduct.originalPrice > this.currentProduct.price) {
            const discount = Math.round(((this.currentProduct.originalPrice - this.currentProduct.price) / this.currentProduct.originalPrice) * 100);
            badges.push(`<span class="product-badge badge-sale">${discount}% Off</span>`);
        }
        
        if (this.currentProduct.isFeatured) {
            badges.push('<span class="product-badge badge-featured">Featured</span>');
        }
        
        if (this.currentProduct.isBestseller) {
            badges.push('<span class="product-badge badge-bestseller">Bestseller</span>');
        }
        
        container.innerHTML = badges.join('');
    }

    renderProductInfo(product) {
        // Product name
        const productName = document.getElementById('productName');
        if (productName) productName.textContent = product.name;
        
        // Product brand
        const productBrand = document.getElementById('productBrand');
        if (productBrand) productBrand.textContent = product.brand || '';
        
        // Product SKU
        const productSku = document.getElementById('productSku');
        if (productSku) productSku.textContent = product.sku || product._id;
        
        // Product rating
        const ratingContainer = document.getElementById('productRating');
        if (ratingContainer && product.rating) {
            this.renderRating(ratingContainer, product.rating);
        }
        
        // Product price
        const priceContainer = document.getElementById('productPrice');
        if (priceContainer) {
            const isOnSale = product.originalPrice && product.originalPrice > product.price;
            let priceHTML = `<span class="current-price">${this.formatPrice(product.price)}</span>`;
            
            if (isOnSale) {
                priceHTML += `<span class="original-price">${this.formatPrice(product.originalPrice)}</span>`;
                const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
                priceHTML += `<span class="discount-badge">${discount}% Off</span>`;
            }
            
            priceContainer.innerHTML = priceHTML;
        }
        
        // Product availability
        const availabilityContainer = document.getElementById('productAvailability');
        if (availabilityContainer) {
            const inStock = product.stock > 0;
            availabilityContainer.innerHTML = `
                <span class="availability-status ${inStock ? 'in-stock' : 'out-of-stock'}">
                    <i class="fas fa-${inStock ? 'check' : 'times'}"></i>
                    ${inStock ? `In Stock (${product.stock} available)` : 'Out of Stock'}
                </span>
            `;
        }
        
        // Product description
        const descriptionContainer = document.getElementById('productDescription');
        if (descriptionContainer) {
            descriptionContainer.innerHTML = product.description || product.shortDescription || '';
        }
        
        // Product features
        if (product.features) {
            this.renderFeatures(product.features);
        }
        
        // Update quantity controls
        this.updateQuantityControls(product.stock);
        
        // Update add to cart button
        this.updateAddToCartButton(product.stock > 0);
    }

    renderFeatures(features) {
        const featuresContainer = document.getElementById('productFeatures');
        if (featuresContainer && features.length > 0) {
            const featuresHTML = features.map(feature => 
                `<li><i class="fas fa-check"></i> ${feature}</li>`
            ).join('');
            featuresContainer.innerHTML = `<ul class="features-list">${featuresHTML}</ul>`;
        }
    }

    renderSpecifications(specifications) {
        const specsContainer = document.getElementById('productSpecifications');
        if (specsContainer && specifications.length > 0) {
            const specsHTML = specifications.map(spec => 
                `<tr>
                    <td class="spec-name">${spec.name}</td>
                    <td class="spec-value">${spec.value}</td>
                </tr>`
            ).join('');
            specsContainer.innerHTML = `
                <table class="specifications-table">
                    <tbody>${specsHTML}</tbody>
                </table>
            `;
        }
    }

    renderReviews(reviews, rating) {
        const reviewsContainer = document.getElementById('productReviews');
        const ratingBreakdown = document.getElementById('ratingBreakdown');
        
        if (!reviewsContainer) return;
        
        if (reviews.length === 0) {
            reviewsContainer.innerHTML = `
                <div class="no-reviews">
                    <p>No reviews yet. Be the first to review this product!</p>
                    <button class="btn btn-primary" onclick="productDetail.openReviewModal()">
                        Write a Review
                    </button>
                </div>
            `;
            return;
        }
        
        // Render rating breakdown
        if (ratingBreakdown && rating) {
            this.renderRatingBreakdown(rating.distribution, rating.count);
        }
        
        // Render individual reviews
        const reviewsHTML = reviews.map(review => this.createReviewHTML(review)).join('');
        reviewsContainer.innerHTML = `
            <div class="reviews-header">
                <h3>Customer Reviews (${reviews.length})</h3>
                <button class="btn btn-outline" onclick="productDetail.openReviewModal()">
                    Write a Review
                </button>
            </div>
            <div class="reviews-list">${reviewsHTML}</div>
        `;
    }

    renderRatingBreakdown(distribution, totalCount) {
        if (!distribution) return '';
        
        const breakdown = Object.entries(distribution)
            .sort(([a], [b]) => b - a)
            .map(([stars, count]) => {
                const percentage = totalCount > 0 ? (count / totalCount) * 100 : 0;
                return `
                    <div class="rating-row">
                        <span class="stars-label">${stars} star${stars !== '1' ? 's' : ''}</span>
                        <div class="rating-bar">
                            <div class="rating-fill" style="width: ${percentage}%"></div>
                        </div>
                        <span class="rating-count">${count}</span>
                    </div>
                `;
            }).join('');
        
        return `<div class="rating-breakdown">${breakdown}</div>`;
    }

    createReviewHTML(review) {
        const reviewDate = new Date(review.date || review.createdAt).toLocaleDateString();
        const stars = this.generateStarsHTML(review.rating);
        
        return `
            <div class="review-item">
                <div class="review-header">
                    <div class="reviewer-info">
                        <span class="reviewer-name">${review.user?.name || 'Anonymous'}</span>
                        ${review.user?.verified ? '<span class="verified-badge">Verified Purchase</span>' : ''}
                    </div>
                    <div class="review-meta">
                        <div class="review-rating">${stars}</div>
                        <span class="review-date">${reviewDate}</span>
                    </div>
                </div>
                ${review.title ? `<h4 class="review-title">${review.title}</h4>` : ''}
                <p class="review-comment">${review.comment}</p>
                <div class="review-actions">
                    <button class="helpful-btn" onclick="productDetail.markHelpful('${review.id || review._id}')">
                        <i class="fas fa-thumbs-up"></i>
                        Helpful (${review.helpful || 0})
                    </button>
                </div>
            </div>
        `;
    }

    renderRating(container, rating) {
        const averageRating = typeof rating === 'object' ? rating.average : rating;
        const reviewCount = typeof rating === 'object' ? rating.count : 0;
        
        if (averageRating > 0) {
            const stars = this.generateStarsHTML(averageRating);
            container.innerHTML = `
                <div class="product-rating">
                    <div class="stars">${stars}</div>
                    <span class="rating-text">${averageRating.toFixed(1)} out of 5</span>
                    ${reviewCount > 0 ? `<span class="review-count">(${reviewCount} reviews)</span>` : ''}
                </div>
            `;
        }
    }

    generateStarsHTML(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        
        let stars = '';
        
        for (let i = 0; i < fullStars; i++) {
            stars += '<i class="fas fa-star"></i>';
        }
        
        if (hasHalfStar) {
            stars += '<i class="fas fa-star-half-alt"></i>';
        }
        
        for (let i = 0; i < emptyStars; i++) {
            stars += '<i class="far fa-star"></i>';
        }
        
        return stars;
    }

    updateBreadcrumbs(product) {
        const breadcrumbs = document.getElementById('breadcrumbs');
        if (breadcrumbs) {
            const categoryName = this.getCategoryDisplayName(product.category);
            breadcrumbs.innerHTML = `
                <a href="index.html">Home</a>
                <i class="fas fa-chevron-right"></i>
                <a href="category.html?cat=${product.category}">${categoryName}</a>
                <i class="fas fa-chevron-right"></i>
                <span>${product.name}</span>
            `;
        }
    }

    getCategoryDisplayName(category) {
        const categoryMap = {
            'graphics-cards': 'Graphics Cards',
            'processors': 'Processors',
            'motherboards': 'Motherboards',
            'memory': 'Memory',
            'storage': 'Storage',
            'cooling': 'Cooling',
            'laptops': 'Laptops',
            'accessories': 'Accessories'
        };
        return categoryMap[category] || category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    async loadRelatedProducts(category) {
        try {
            const response = await this.apiClient.getProducts({
                category: category,
                limit: 4,
                exclude: this.currentProduct._id || this.currentProduct.id
            });
            
            if (response.success && response.data) {
                const products = response.data.products || response.data;
                this.renderRelatedProducts(products);
            }
        } catch (error) {
            console.error('Failed to load related products:', error);
        }
    }

    renderRelatedProducts(products) {
        const relatedContainer = document.getElementById('relatedProducts');
        if (!relatedContainer || products.length === 0) return;
        
        const productsHTML = products.map(product => this.createProductCardHTML(product)).join('');
        relatedContainer.innerHTML = `
            <h3>Related Products</h3>
            <div class="related-products-grid">${productsHTML}</div>
        `;
    }

    createProductCardHTML(product) {
        const productImage = this.getProductImage(product);
        const isOnSale = product.originalPrice && product.originalPrice > product.price;
        
        return `
            <div class="product-card" onclick="window.location.href='product.html?id=${product._id || product.id}'">
                <div class="product-image">
                    <img src="${productImage}" alt="${product.name}" loading="lazy">
                    ${product.isNew ? '<span class="badge badge-new">New</span>' : ''}
                    ${isOnSale ? '<span class="badge badge-sale">Sale</span>' : ''}
                </div>
                <div class="product-info">
                    <h4 class="product-name">${product.name}</h4>
                    <div class="product-price">
                        <span class="current-price">${this.formatPrice(product.price)}</span>
                        ${isOnSale ? `<span class="original-price">${this.formatPrice(product.originalPrice)}</span>` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    getProductImage(product) {
        if (product.images && product.images.length > 0) {
            return product.images[0].url || product.images[0];
        }
        return product.image || this.getDefaultImage(product.category);
    }

    loadRecentlyViewed() {
        const recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
        if (recentlyViewed.length > 0) {
            // Load recently viewed products from API
            // Implementation would depend on your API structure
        }
    }

    initializeEventListeners() {
        // Quantity controls
        const quantityInput = document.getElementById('quantity');
        const decreaseBtn = document.getElementById('decreaseQuantity');
        const increaseBtn = document.getElementById('increaseQuantity');
        
        if (quantityInput) {
            quantityInput.addEventListener('change', () => this.validateQuantity());
        }
        
        if (decreaseBtn) {
            decreaseBtn.addEventListener('click', () => this.decrementQuantity());
        }
        
        if (increaseBtn) {
            increaseBtn.addEventListener('click', () => this.incrementQuantity());
        }
        
        // Add to cart button
        const addToCartBtn = document.getElementById('addToCartBtn');
        if (addToCartBtn) {
            addToCartBtn.addEventListener('click', () => this.addToCart());
        }
        
        // Wishlist button
        const wishlistBtn = document.getElementById('wishlistBtn');
        if (wishlistBtn) {
            wishlistBtn.addEventListener('click', () => this.toggleWishlist());
        }
        
        // Image zoom
        const mainImage = document.getElementById('mainImage');
        if (mainImage) {
            mainImage.addEventListener('click', () => this.openImageZoom());
        }
        
        // Share button
        const shareBtn = document.getElementById('shareBtn');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => this.shareProduct());
        }
    }

    initializeTabs() {
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabContents = document.querySelectorAll('.tab-content');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabId = button.dataset.tab;
                
                // Remove active class from all tabs
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));
                
                // Add active class to clicked tab
                button.classList.add('active');
                const targetContent = document.getElementById(tabId);
                if (targetContent) {
                    targetContent.classList.add('active');
                }
            });
        });
    }

    changeMainImage(index) {
        const mainImage = document.getElementById('mainImage');
        const thumbnails = document.querySelectorAll('.thumbnail');
        const images = this.currentProduct.images || [];
        
        if (images[index] && mainImage) {
            const imageUrl = images[index].url || images[index];
            mainImage.src = imageUrl;
            this.currentImageIndex = index;
            
            // Update thumbnail active state
            thumbnails.forEach((thumb, i) => {
                thumb.classList.toggle('active', i === index);
            });
        }
    }

    updateQuantityControls(maxStock) {
        const quantityInput = document.getElementById('quantity');
        const decreaseBtn = document.getElementById('decreaseQuantity');
        const increaseBtn = document.getElementById('increaseQuantity');
        
        if (quantityInput) {
            quantityInput.max = maxStock;
            quantityInput.disabled = maxStock === 0;
        }
        
        if (decreaseBtn) {
            decreaseBtn.disabled = this.quantity <= 1 || maxStock === 0;
        }
        
        if (increaseBtn) {
            increaseBtn.disabled = this.quantity >= maxStock || maxStock === 0;
        }
    }

    updateAddToCartButton(inStock) {
        const addToCartBtn = document.getElementById('addToCartBtn');
        if (addToCartBtn) {
            addToCartBtn.disabled = !inStock;
            addToCartBtn.innerHTML = inStock ? 
                '<i class="fas fa-shopping-cart"></i> Add to Cart' : 
                '<i class="fas fa-times"></i> Out of Stock';
        }
    }

    validateQuantity() {
        const quantityInput = document.getElementById('quantity');
        if (quantityInput) {
            let value = parseInt(quantityInput.value);
            const max = parseInt(quantityInput.max);
            
            if (isNaN(value) || value < 1) value = 1;
            if (value > max) value = max;
            
            this.quantity = value;
            quantityInput.value = value;
            this.updateQuantityControls(max);
        }
    }

    incrementQuantity() {
        const quantityInput = document.getElementById('quantity');
        if (quantityInput) {
            const max = parseInt(quantityInput.max);
            if (this.quantity < max) {
                this.quantity++;
                quantityInput.value = this.quantity;
                this.updateQuantityControls(max);
            }
        }
    }

    decrementQuantity() {
        if (this.quantity > 1) {
            this.quantity--;
            const quantityInput = document.getElementById('quantity');
            if (quantityInput) {
                quantityInput.value = this.quantity;
                const max = parseInt(quantityInput.max);
                this.updateQuantityControls(max);
            }
        }
    }

    async addToCart() {
        if (!window.authManager.requireAuth()) return;
        
        try {
            const response = await this.apiClient.addToCart(
                this.currentProduct._id || this.currentProduct.id, 
                this.quantity
            );
            
            if (response.success) {
                window.authManager.showSuccessToast(`Added ${this.quantity} item(s) to cart!`);
                this.updateCartCount();
            } else {
                throw new Error(response.message || 'Failed to add to cart');
            }
        } catch (error) {
            console.error('Add to cart error:', error);
            window.authManager.showErrorToast('Failed to add product to cart');
        }
    }

    updateCartCount() {
        if (window.authManager.isLoggedIn()) {
            this.apiClient.getCart().then(response => {
                if (response.success) {
                    const cartCount = document.getElementById('cartCount');
                    if (cartCount) {
                        const totalItems = response.data.items.reduce((sum, item) => sum + item.quantity, 0);
                        cartCount.textContent = totalItems;
                    }
                }
            }).catch(console.error);
        }
    }

    async toggleWishlist() {
        if (!window.authManager.requireAuth()) return;
        
        const wishlistBtn = document.getElementById('wishlistBtn');
        if (!wishlistBtn) return;
        
        try {
            const isInWishlist = wishlistBtn.classList.contains('active');
            
            if (isInWishlist) {
                await this.apiClient.removeFromWishlist(this.currentProduct._id || this.currentProduct.id);
                wishlistBtn.classList.remove('active');
                wishlistBtn.innerHTML = '<i class="far fa-heart"></i> Add to Wishlist';
                window.authManager.showSuccessToast('Removed from wishlist');
            } else {
                await this.apiClient.addToWishlist(this.currentProduct._id || this.currentProduct.id);
                wishlistBtn.classList.add('active');
                wishlistBtn.innerHTML = '<i class="fas fa-heart"></i> In Wishlist';
                window.authManager.showSuccessToast('Added to wishlist');
            }
            
            this.updateWishlistCount();
        } catch (error) {
            console.error('Wishlist error:', error);
            window.authManager.showErrorToast('Failed to update wishlist');
        }
    }

    updateWishlistCount() {
        if (window.authManager.isLoggedIn()) {
            this.apiClient.getWishlist().then(response => {
                if (response.success) {
                    const wishlistCount = document.getElementById('wishlistCount');
                    if (wishlistCount) {
                        wishlistCount.textContent = response.data.length;
                    }
                }
            }).catch(console.error);
        }
    }

    setReviewRating(rating) {
        this.reviewRating = rating;
        const stars = document.querySelectorAll('.review-rating-input .star');
        stars.forEach((star, index) => {
            star.classList.toggle('active', index < rating);
        });
    }

    async submitReview(e) {
        e.preventDefault();
        
        if (!window.authManager.requireAuth()) return;
        
        const formData = new FormData(e.target);
        const reviewData = {
            productId: this.currentProduct._id || this.currentProduct.id,
            rating: this.reviewRating,
            title: formData.get('title'),
            comment: formData.get('comment')
        };
        
        if (!reviewData.rating || reviewData.rating < 1) {
            window.authManager.showErrorToast('Please select a rating');
            return;
        }
        
        try {
            const response = await this.apiClient.addReview(reviewData);
            if (response.success) {
                window.authManager.showSuccessToast('Review submitted successfully!');
                this.closeReviewModal();
                // Reload product to show new review
                await this.loadProduct(this.currentProduct._id || this.currentProduct.id);
            }
        } catch (error) {
            console.error('Review submission error:', error);
            window.authManager.showErrorToast('Failed to submit review');
        }
    }

    async markHelpful(reviewId) {
        try {
            const response = await this.apiClient.markReviewHelpful(reviewId);
            if (response.success) {
                // Reload reviews to show updated helpful count
                await this.loadProduct(this.currentProduct._id || this.currentProduct.id);
            }
        } catch (error) {
            console.error('Mark helpful error:', error);
        }
    }

    openReviewModal() {
        const modal = document.getElementById('reviewModal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    closeReviewModal() {
        const modal = document.getElementById('reviewModal');
        if (modal) {
            modal.style.display = 'none';
            // Reset form
            const form = modal.querySelector('form');
            if (form) form.reset();
            this.reviewRating = 0;
            this.setReviewRating(0);
        }
    }

    openImageZoom() {
        const zoomModal = document.getElementById('imageZoomModal');
        const zoomImage = document.getElementById('zoomImage');
        
        if (zoomModal && zoomImage) {
            const mainImage = document.getElementById('mainImage');
            zoomImage.src = mainImage.src;
            zoomModal.style.display = 'flex';
        }
    }

    closeImageZoom() {
        const zoomModal = document.getElementById('imageZoomModal');
        if (zoomModal) {
            zoomModal.style.display = 'none';
            this.resetZoom();
        }
    }

    zoomIn() {
        this.zoomLevel = Math.min(this.zoomLevel + 0.5, 3);
        this.updateZoom();
    }

    zoomOut() {
        this.zoomLevel = Math.max(this.zoomLevel - 0.5, 1);
        this.updateZoom();
    }

    resetZoom() {
        this.zoomLevel = 1;
        this.updateZoom();
    }

    updateZoom() {
        const zoomImage = document.getElementById('zoomImage');
        if (zoomImage) {
            zoomImage.style.transform = `scale(${this.zoomLevel})`;
        }
    }

    formatPrice(price, currency = 'USD') {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency
        }).format(price);
    }

    showToast(message, type = 'info') {
        if (window.authManager) {
            if (type === 'success') {
                window.authManager.showSuccessToast(message);
            } else if (type === 'error') {
                window.authManager.showErrorToast(message);
            }
        }
    }

    showError(message) {
        const errorContainer = document.getElementById('errorContainer');
        if (errorContainer) {
            errorContainer.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Error Loading Product</h3>
                    <p>${message}</p>
                    <button class="btn btn-primary" onclick="window.location.href='category.html'">
                        Browse Products
                    </button>
                </div>
            `;
            errorContainer.style.display = 'block';
        }
    }

    showLoadingState() {
        const loadingContainer = document.getElementById('loadingContainer');
        if (loadingContainer) {
            loadingContainer.innerHTML = `
                <div class="loading-state">
                    <div class="spinner"></div>
                    <p>Loading product details...</p>
                </div>
            `;
            loadingContainer.style.display = 'block';
        }
    }

    hideLoadingState() {
        const loadingContainer = document.getElementById('loadingContainer');
        if (loadingContainer) {
            loadingContainer.style.display = 'none';
        }
    }

    trackProductView(productId) {
        // Add to recently viewed
        let recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
        recentlyViewed = recentlyViewed.filter(id => id !== productId);
        recentlyViewed.unshift(productId);
        recentlyViewed = recentlyViewed.slice(0, 10);
        localStorage.setItem('recentlyViewed', JSON.stringify(recentlyViewed));
    }

    shareProduct() {
        if (navigator.share && this.currentProduct) {
            navigator.share({
                title: this.currentProduct.name,
                text: this.currentProduct.shortDescription || this.currentProduct.description,
                url: window.location.href
            }).catch(console.error);
        } else {
            // Fallback: copy URL to clipboard
            navigator.clipboard.writeText(window.location.href).then(() => {
                this.showToast('Product URL copied to clipboard!', 'success');
            }).catch(() => {
                this.showToast('Failed to copy URL', 'error');
            });
        }
    }
}

// Global functions for backward compatibility
function incrementQuantity() {
    if (window.productDetail) {
        window.productDetail.incrementQuantity();
    }
}

function decrementQuantity() {
    if (window.productDetail) {
        window.productDetail.decrementQuantity();
    }
}

function toggleZoom() {
    if (window.productDetail) {
        window.productDetail.openImageZoom();
    }
}

function toggleFullscreen() {
    // Implementation for fullscreen toggle
}

function shareProduct() {
    if (window.productDetail) {
        window.productDetail.shareProduct();
    }
}

function openReviewModal() {
    if (window.productDetail) {
        window.productDetail.openReviewModal();
    }
}

function closeReviewModal() {
    if (window.productDetail) {
        window.productDetail.closeReviewModal();
    }
}

function closeImageZoom() {
    if (window.productDetail) {
        window.productDetail.closeImageZoom();
    }
}

function zoomIn() {
    if (window.productDetail) {
        window.productDetail.zoomIn();
    }
}

function zoomOut() {
    if (window.productDetail) {
        window.productDetail.zoomOut();
    }
}

function resetZoom() {
    if (window.productDetail) {
        window.productDetail.resetZoom();
    }
}

// Initialize product detail page
document.addEventListener('DOMContentLoaded', function() {
    window.productDetail = new ProductDetail();
}); 