// Product Detail Page JavaScript
class ProductDetail {
    constructor() {
        this.currentProduct = null;
        this.currentImageIndex = 0;
        this.zoomLevel = 1;
        this.reviewRating = 0;
        this.init();
    }

    async init() {
        try {
            // Load content manager
            await window.contentManager.loadContent();
            
            // Get product ID from URL
            const urlParams = new URLSearchParams(window.location.search);
            const productId = urlParams.get('id') || urlParams.get('slug');
            
            if (productId) {
                await this.loadProduct(productId);
            } else {
                this.showError('Product not found');
                return;
            }
            
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
            // Show loading state
            this.showLoadingState();
            
            // In a real app, this would be an API call
            // For demo purposes, we'll simulate product data
            const product = await this.fetchProductData(productId);
            
            if (!product) {
                throw new Error('Product not found');
            }
            
            this.currentProduct = product;
            this.renderProduct(product);
            this.updateBreadcrumbs(product);
            this.loadRelatedProducts(product.category);
            
            // Track product view
            this.trackProductView(product.id);
            
        } catch (error) {
            console.error('Error loading product:', error);
            this.showError('Failed to load product details');
        }
    }

    async fetchProductData(productId) {
        // Simulate API call - in real app, this would fetch from your backend
        return new Promise((resolve) => {
            setTimeout(() => {
                // Mock product data
                const mockProduct = {
                    id: productId,
                    name: 'NVIDIA GeForce RTX 4080 Gaming Graphics Card',
                    slug: 'nvidia-rtx-4080-gaming',
                    brand: 'NVIDIA',
                    sku: 'RTX4080-16G-GAMING',
                    category: 'graphics-cards',
                    price: 1199.99,
                    originalPrice: 1399.99,
                    currency: 'USD',
                    stock: 15,
                    availability: 'in-stock',
                    description: 'Experience unmatched gaming performance with the NVIDIA GeForce RTX 4080. Built with the ultra-efficient NVIDIA Ada Lovelace architecture, this graphics card delivers exceptional ray tracing and AI-powered DLSS 3 performance.',
                    shortDescription: 'High-performance gaming graphics card with ray tracing and DLSS 3 support.',
                    images: [
                        {
                            url: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                            alt: 'NVIDIA RTX 4080 Main View',
                            isPrimary: true
                        },
                        {
                            url: 'https://images.unsplash.com/photo-1555617778-02518db02b80?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                            alt: 'NVIDIA RTX 4080 Side View'
                        },
                        {
                            url: 'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                            alt: 'NVIDIA RTX 4080 Back View'
                        }
                    ],
                    specifications: [
                        { name: 'GPU Architecture', value: 'NVIDIA Ada Lovelace' },
                        { name: 'Memory Size', value: '16GB GDDR6X' },
                        { name: 'Memory Interface', value: '256-bit' },
                        { name: 'Base Clock', value: '2205 MHz' },
                        { name: 'Boost Clock', value: '2505 MHz' },
                        { name: 'CUDA Cores', value: '9728' },
                        { name: 'Ray Tracing Cores', value: '76 (3rd Gen)' },
                        { name: 'Tensor Cores', value: '304 (4th Gen)' },
                        { name: 'Power Consumption', value: '320W' },
                        { name: 'Recommended PSU', value: '750W' },
                        { name: 'Display Outputs', value: '3x DisplayPort 1.4a, 1x HDMI 2.1' },
                        { name: 'Max Resolution', value: '7680x4320 @ 60Hz' }
                    ],
                    features: [
                        'NVIDIA DLSS 3 with Frame Generation',
                        'Real-time Ray Tracing',
                        'NVIDIA Reflex Low Latency',
                        'NVIDIA Broadcast AI Audio & Video',
                        'PCIe 4.0 Support',
                        'DirectX 12 Ultimate'
                    ],
                    rating: {
                        average: 4.6,
                        count: 247,
                        distribution: {
                            five: 156,
                            four: 67,
                            three: 18,
                            two: 4,
                            one: 2
                        }
                    },
                    reviews: [
                        {
                            id: 1,
                            user: { name: 'Alex Chen', verified: true },
                            rating: 5,
                            title: 'Incredible performance for 4K gaming',
                            comment: 'This card handles everything I throw at it at 4K resolution. Ray tracing looks amazing and DLSS 3 gives a huge performance boost.',
                            date: '2024-01-15',
                            helpful: 23
                        },
                        {
                            id: 2,
                            user: { name: 'Sarah Miller', verified: true },
                            rating: 4,
                            title: 'Great card but runs hot',
                            comment: 'Performance is excellent but make sure you have good case ventilation. The card can get quite warm under load.',
                            date: '2024-01-10',
                            helpful: 15
                        }
                    ],
                    warranty: {
                        period: 3,
                        unit: 'years',
                        description: '3-year manufacturer warranty with free technical support'
                    },
                    isNew: false,
                    isFeatured: true,
                    isBestseller: true,
                    isOnSale: true
                };
                
                resolve(mockProduct);
            }, 500);
        });
    }

    renderProduct(product) {
        // Update page title
        document.title = `${product.name} - TechCore`;
        
        // Render product images
        this.renderProductImages(product.images);
        
        // Render product info
        this.renderProductInfo(product);
        
        // Render specifications
        this.renderSpecifications(product.specifications);
        
        // Render reviews
        this.renderReviews(product.reviews, product.rating);
        
        // Hide loading state
        this.hideLoadingState();
    }

    renderProductImages(images) {
        const mainImage = document.getElementById('mainImage');
        const thumbnailContainer = document.getElementById('thumbnailImages');
        const badges = document.getElementById('productBadges');
        
        if (images && images.length > 0) {
            // Set main image
            const primaryImage = images.find(img => img.isPrimary) || images[0];
            mainImage.src = primaryImage.url;
            mainImage.alt = primaryImage.alt;
            
            // Clear and populate thumbnails
            thumbnailContainer.innerHTML = '';
            images.forEach((image, index) => {
                const thumbnail = document.createElement('div');
                thumbnail.className = `thumbnail-image ${index === 0 ? 'active' : ''}`;
                thumbnail.innerHTML = `<img src="${image.url}" alt="${image.alt}">`;
                thumbnail.addEventListener('click', () => this.changeMainImage(index));
                thumbnailContainer.appendChild(thumbnail);
            });
            
            // Add product badges
            this.renderProductBadges(badges);
        }
    }

    renderProductBadges(container) {
        const product = this.currentProduct;
        let badgesHTML = '';
        
        if (product.isNew) {
            badgesHTML += '<span class="badge badge-new">New</span>';
        }
        if (product.isBestseller) {
            badgesHTML += '<span class="badge badge-bestseller">Bestseller</span>';
        }
        if (product.isOnSale) {
            badgesHTML += '<span class="badge badge-sale">Sale</span>';
        }
        if (product.stock <= 5) {
            badgesHTML += '<span class="badge badge-low-stock">Low Stock</span>';
        }
        
        container.innerHTML = badgesHTML;
    }

    renderProductInfo(product) {
        // Basic info
        document.getElementById('productTitle').textContent = product.name;
        document.getElementById('productSku').textContent = product.sku;
        document.getElementById('productBrand').textContent = product.brand;
        document.getElementById('productDescription').textContent = product.description;
        
        // Price
        document.getElementById('currentPrice').textContent = this.formatPrice(product.price, product.currency);
        
        if (product.originalPrice && product.originalPrice > product.price) {
            const originalPriceEl = document.getElementById('originalPrice');
            const discountBadge = document.getElementById('discountBadge');
            
            originalPriceEl.textContent = this.formatPrice(product.originalPrice, product.currency);
            originalPriceEl.style.display = 'inline';
            
            const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
            discountBadge.textContent = `${discount}% OFF`;
            discountBadge.style.display = 'inline';
        }
        
        // Availability
        const availabilityEl = document.getElementById('availability');
        if (product.stock > 0) {
            availabilityEl.textContent = 'In Stock';
            availabilityEl.className = 'availability in-stock';
        } else {
            availabilityEl.textContent = 'Out of Stock';
            availabilityEl.className = 'availability out-of-stock';
        }
        
        // Rating
        this.renderRating(document.getElementById('productStars'), product.rating.average);
        const ratingText = document.getElementById('ratingText');
        if (product.rating.count > 0) {
            ratingText.textContent = `${product.rating.average.toFixed(1)} (${product.rating.count} reviews)`;
        } else {
            ratingText.textContent = 'No reviews yet';
        }
        
        // Features
        this.renderFeatures(product.features);
        
        // Warranty
        if (product.warranty) {
            document.getElementById('warrantyInfo').textContent = product.warranty.description;
        }
        
        // Update quantity input max
        const quantityInput = document.getElementById('quantityInput');
        quantityInput.max = Math.min(product.stock, 10);
        
        // Enable/disable add to cart based on stock
        const addToCartBtn = document.getElementById('addToCartBtn');
        if (product.stock === 0) {
            addToCartBtn.disabled = true;
            addToCartBtn.innerHTML = '<i class="fas fa-times"></i> Out of Stock';
        }
    }

    renderFeatures(features) {
        const featureList = document.getElementById('featureList');
        if (features && features.length > 0) {
            featureList.innerHTML = features.map(feature => 
                `<div class="feature-item">${feature}</div>`
            ).join('');
        }
    }

    renderSpecifications(specifications) {
        const specsGrid = document.getElementById('specificationsGrid');
        if (specifications && specifications.length > 0) {
            specsGrid.innerHTML = specifications.map(spec => `
                <div class="spec-item">
                    <span class="spec-name">${spec.name}</span>
                    <span class="spec-value">${spec.value}</span>
                </div>
            `).join('');
        }
    }

    renderReviews(reviews, rating) {
        // Overall rating
        document.getElementById('overallRating').textContent = rating.average.toFixed(1);
        this.renderRating(document.getElementById('overallStars'), rating.average);
        document.getElementById('totalReviews').textContent = `${rating.count} reviews`;
        
        // Rating breakdown
        this.renderRatingBreakdown(rating.distribution, rating.count);
        
        // Individual reviews
        const reviewsList = document.getElementById('reviewsList');
        if (reviews && reviews.length > 0) {
            reviewsList.innerHTML = reviews.map(review => this.createReviewHTML(review)).join('');
        } else {
            reviewsList.innerHTML = '<p class="no-reviews">No reviews yet. Be the first to review this product!</p>';
        }
    }

    renderRatingBreakdown(distribution, totalCount) {
        const breakdown = document.getElementById('ratingBreakdown');
        const ratings = ['five', 'four', 'three', 'two', 'one'];
        
        breakdown.innerHTML = ratings.map((rating, index) => {
            const count = distribution[rating] || 0;
            const percentage = totalCount > 0 ? (count / totalCount) * 100 : 0;
            const stars = 5 - index;
            
            return `
                <div class="rating-row">
                    <span class="rating-label">${stars} ★</span>
                    <div class="rating-bar">
                        <div class="rating-fill" style="width: ${percentage}%"></div>
                    </div>
                    <span class="rating-count">${count}</span>
                </div>
            `;
        }).join('');
    }

    createReviewHTML(review) {
        const reviewDate = new Date(review.date).toLocaleDateString();
        const initials = review.user.name.split(' ').map(n => n[0]).join('').toUpperCase();
        
        return `
            <div class="review-item">
                <div class="review-header">
                    <div class="reviewer-avatar">${initials}</div>
                    <div class="reviewer-info">
                        <div class="reviewer-name">${review.user.name}</div>
                        <div class="review-date">${reviewDate}</div>
                    </div>
                    <div class="review-rating">
                        ${this.generateStarsHTML(review.rating)}
                        ${review.user.verified ? '<span class="verified-badge">Verified</span>' : ''}
                    </div>
                </div>
                <div class="review-content">
                    <div class="review-title">${review.title}</div>
                    <div class="review-comment">${review.comment}</div>
                </div>
                <div class="review-actions">
                    <button class="helpful-btn" onclick="productDetail.markHelpful(${review.id})">
                        <i class="fas fa-thumbs-up"></i> Helpful (${review.helpful})
                    </button>
                </div>
            </div>
        `;
    }

    renderRating(container, rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        let starsHTML = '';
        
        for (let i = 0; i < 5; i++) {
            if (i < fullStars) {
                starsHTML += '<i class="fas fa-star"></i>';
            } else if (i === fullStars && hasHalfStar) {
                starsHTML += '<i class="fas fa-star-half-alt"></i>';
            } else {
                starsHTML += '<i class="far fa-star"></i>';
            }
        }
        
        container.innerHTML = starsHTML;
    }

    generateStarsHTML(rating) {
        let starsHTML = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= rating) {
                starsHTML += '<i class="fas fa-star"></i>';
            } else {
                starsHTML += '<i class="far fa-star"></i>';
            }
        }
        return starsHTML;
    }

    updateBreadcrumbs(product) {
        const breadcrumb = document.getElementById('productBreadcrumb');
        const breadcrumbNav = document.getElementById('breadcrumbNav');
        
        if (breadcrumb) {
            breadcrumb.textContent = product.name;
        }
        
        // Add category breadcrumb
        const categoryLink = document.createElement('a');
        categoryLink.href = `category.html?cat=${product.category}`;
        categoryLink.className = 'breadcrumb-item';
        categoryLink.textContent = this.getCategoryDisplayName(product.category);
        
        const separator = document.createElement('span');
        separator.className = 'breadcrumb-separator';
        separator.textContent = '/';
        
        breadcrumbNav.insertBefore(separator, breadcrumb);
        breadcrumbNav.insertBefore(categoryLink, separator);
    }

    getCategoryDisplayName(category) {
        const categoryMap = {
            'graphics-cards': 'Graphics Cards',
            'processors': 'Processors',
            'motherboards': 'Motherboards',
            'memory': 'Memory',
            'storage': 'Storage',
            'laptops': 'Laptops',
            'accessories': 'Accessories'
        };
        return categoryMap[category] || category;
    }

    async loadRelatedProducts(category) {
        const container = document.getElementById('relatedProductsCarousel');
        
        try {
            // Simulate API call for related products
            const relatedProducts = await this.fetchRelatedProducts(category);
            
            if (relatedProducts && relatedProducts.length > 0) {
                container.innerHTML = relatedProducts.map(product => 
                    this.createProductCardHTML(product)
                ).join('');
            } else {
                container.innerHTML = '<p>No related products found.</p>';
            }
        } catch (error) {
            console.error('Error loading related products:', error);
            container.innerHTML = '<p>Unable to load related products.</p>';
        }
    }

    async fetchRelatedProducts(category) {
        // Mock related products data
        return new Promise((resolve) => {
            setTimeout(() => {
                const mockProducts = [
                    {
                        id: 'related-1',
                        name: 'AMD Ryzen 9 7950X',
                        price: 699.99,
                        originalPrice: 799.99,
                        image: 'https://images.unsplash.com/photo-1555617778-02518db02b80?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
                        rating: 4.8,
                        reviews: 156
                    },
                    {
                        id: 'related-2',
                        name: 'ASUS ROG Strix B650E',
                        price: 399.99,
                        image: 'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
                        rating: 4.6,
                        reviews: 89
                    },
                    {
                        id: 'related-3',
                        name: 'Corsair Vengeance 32GB DDR5',
                        price: 299.99,
                        image: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
                        rating: 4.7,
                        reviews: 203
                    }
                ];
                resolve(mockProducts);
            }, 300);
        });
    }

    createProductCardHTML(product) {
        const discountPercentage = product.originalPrice 
            ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
            : 0;
            
        return `
            <div class="product-card" onclick="window.location.href='product.html?id=${product.id}'">
                <div class="product-image">
                    <img src="${product.image}" alt="${product.name}" loading="lazy">
                    ${discountPercentage > 0 ? `<span class="discount-badge">${discountPercentage}% OFF</span>` : ''}
                </div>
                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    <div class="product-rating">
                        ${this.generateStarsHTML(product.rating)}
                        <span class="rating-count">(${product.reviews})</span>
                    </div>
                    <div class="product-price">
                        <span class="current-price">${this.formatPrice(product.price)}</span>
                        ${product.originalPrice ? `<span class="original-price">${this.formatPrice(product.originalPrice)}</span>` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    loadRecentlyViewed() {
        const recentlyViewed = this.getRecentlyViewedProducts();
        if (recentlyViewed.length > 0) {
            const section = document.getElementById('recentlyViewedSection');
            const container = document.getElementById('recentlyViewedCarousel');
            
            container.innerHTML = recentlyViewed.map(product => 
                this.createProductCardHTML(product)
            ).join('');
            
            section.style.display = 'block';
        }
    }

    initializeEventListeners() {
        // Quantity controls
        const quantityInput = document.getElementById('quantityInput');
        quantityInput.addEventListener('change', this.validateQuantity.bind(this));
        quantityInput.addEventListener('input', this.validateQuantity.bind(this));
        
        // Add to cart
        document.getElementById('addToCartBtn').addEventListener('click', this.addToCart.bind(this));
        
        // Wishlist
        document.getElementById('wishlistBtn').addEventListener('click', this.toggleWishlist.bind(this));
        
        // Review form
        const reviewForm = document.getElementById('reviewForm');
        if (reviewForm) {
            reviewForm.addEventListener('submit', this.submitReview.bind(this));
        }
        
        // Star rating in review modal
        const starBtns = document.querySelectorAll('.star-btn');
        starBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const rating = parseInt(e.target.closest('.star-btn').dataset.rating);
                this.setReviewRating(rating);
            });
        });
        
        // Image zoom
        const mainImage = document.getElementById('mainImage');
        if (mainImage) {
            mainImage.addEventListener('click', this.openImageZoom.bind(this));
        }
    }

    initializeTabs() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');
        
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetTab = btn.dataset.tab;
                
                // Remove active class from all tabs and contents
                tabBtns.forEach(b => b.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));
                
                // Add active class to clicked tab and corresponding content
                btn.classList.add('active');
                document.getElementById(targetTab).classList.add('active');
            });
        });
    }

    // Image gallery functions
    changeMainImage(index) {
        const images = this.currentProduct.images;
        if (images && images[index]) {
            const mainImage = document.getElementById('mainImage');
            const thumbnails = document.querySelectorAll('.thumbnail-image');
            
            mainImage.src = images[index].url;
            mainImage.alt = images[index].alt;
            
            thumbnails.forEach((thumb, i) => {
                thumb.classList.toggle('active', i === index);
            });
            
            this.currentImageIndex = index;
        }
    }

    // Quantity functions
    validateQuantity() {
        const input = document.getElementById('quantityInput');
        const value = parseInt(input.value);
        const max = parseInt(input.max);
        const min = parseInt(input.min);
        
        if (value > max) {
            input.value = max;
        } else if (value < min) {
            input.value = min;
        }
    }

    // Cart functions
    addToCart() {
        const product = this.currentProduct;
        const quantity = parseInt(document.getElementById('quantityInput').value);
        
        if (!product || product.stock === 0) {
            this.showToast('Product is out of stock', 'error');
            return;
        }
        
        if (quantity > product.stock) {
            this.showToast(`Only ${product.stock} items available`, 'error');
            return;
        }
        
        // Add to cart logic
        const cartItem = {
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.images[0].url,
            quantity: quantity,
            sku: product.sku
        };
        
        this.saveToCart(cartItem);
        this.showToast('Product added to cart!', 'success');
        this.updateCartCount();
        
        // Show cart toast
        const cartToast = document.getElementById('cartToast');
        if (cartToast) {
            cartToast.classList.add('show');
            setTimeout(() => cartToast.classList.remove('show'), 3000);
        }
    }

    saveToCart(item) {
        let cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const existingItem = cart.find(cartItem => cartItem.id === item.id);
        
        if (existingItem) {
            existingItem.quantity += item.quantity;
        } else {
            cart.push(item);
        }
        
        localStorage.setItem('cart', JSON.stringify(cart));
    }

    updateCartCount() {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        const cartCount = document.getElementById('cartCount');
        if (cartCount) {
            cartCount.textContent = totalItems;
        }
    }

    // Wishlist functions
    toggleWishlist() {
        const product = this.currentProduct;
        const btn = document.getElementById('wishlistBtn');
        
        let wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
        const existingIndex = wishlist.findIndex(item => item.id === product.id);
        
        if (existingIndex > -1) {
            // Remove from wishlist
            wishlist.splice(existingIndex, 1);
            btn.innerHTML = '<i class="fas fa-heart"></i> Add to Wishlist';
            this.showToast('Removed from wishlist', 'info');
        } else {
            // Add to wishlist
            wishlist.push({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.images[0].url
            });
            btn.innerHTML = '<i class="fas fa-heart-fill"></i> Remove from Wishlist';
            this.showToast('Added to wishlist!', 'success');
        }
        
        localStorage.setItem('wishlist', JSON.stringify(wishlist));
        this.updateWishlistCount();
    }

    updateWishlistCount() {
        const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
        const wishlistCount = document.getElementById('wishlistCount');
        if (wishlistCount) {
            wishlistCount.textContent = wishlist.length;
        }
    }

    // Review functions
    setReviewRating(rating) {
        this.reviewRating = rating;
        const starBtns = document.querySelectorAll('.star-btn');
        
        starBtns.forEach((btn, index) => {
            if (index < rating) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    submitReview(e) {
        e.preventDefault();
        
        const title = document.getElementById('reviewTitle').value;
        const comment = document.getElementById('reviewComment').value;
        
        if (!this.reviewRating || !title || !comment) {
            this.showToast('Please fill in all review fields', 'error');
            return;
        }
        
        // In a real app, this would submit to the API
        console.log('Submitting review:', {
            rating: this.reviewRating,
            title,
            comment,
            productId: this.currentProduct.id
        });
        
        this.showToast('Review submitted successfully!', 'success');
        this.closeReviewModal();
        
        // Reset form
        document.getElementById('reviewForm').reset();
        this.setReviewRating(0);
    }

    markHelpful(reviewId) {
        // In a real app, this would update the review in the database
        console.log('Marking review as helpful:', reviewId);
        this.showToast('Thank you for your feedback!', 'success');
    }

    // Modal functions
    openReviewModal() {
        document.getElementById('reviewModal').classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeReviewModal() {
        document.getElementById('reviewModal').classList.remove('active');
        document.body.style.overflow = 'auto';
    }

    // Image zoom functions
    openImageZoom() {
        const modal = document.getElementById('imageZoomModal');
        const zoomedImage = document.getElementById('zoomedImage');
        const mainImage = document.getElementById('mainImage');
        
        zoomedImage.src = mainImage.src;
        zoomedImage.alt = mainImage.alt;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        this.zoomLevel = 1;
        zoomedImage.style.transform = 'scale(1)';
    }

    closeImageZoom() {
        document.getElementById('imageZoomModal').classList.remove('active');
        document.body.style.overflow = 'auto';
    }

    zoomIn() {
        this.zoomLevel = Math.min(this.zoomLevel + 0.25, 3);
        this.updateZoom();
    }

    zoomOut() {
        this.zoomLevel = Math.max(this.zoomLevel - 0.25, 0.5);
        this.updateZoom();
    }

    resetZoom() {
        this.zoomLevel = 1;
        this.updateZoom();
    }

    updateZoom() {
        const zoomedImage = document.getElementById('zoomedImage');
        zoomedImage.style.transform = `scale(${this.zoomLevel})`;
    }

    // Utility functions
    formatPrice(price, currency = 'USD') {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency
        }).format(price);
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'exclamation' : 'info'}-circle"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => document.body.removeChild(toast), 300);
        }, 3000);
    }

    showError(message) {
        const container = document.querySelector('.container');
        container.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <h2>Error</h2>
                <p>${message}</p>
                <a href="index.html" class="btn btn-primary">Return to Home</a>
            </div>
        `;
    }

    showLoadingState() {
        const productDetail = document.getElementById('productDetail');
        productDetail.classList.add('loading');
    }

    hideLoadingState() {
        const productDetail = document.getElementById('productDetail');
        productDetail.classList.remove('loading');
    }

    trackProductView(productId) {
        // Track recently viewed products
        let recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
        
        // Remove if already exists
        recentlyViewed = recentlyViewed.filter(item => item.id !== productId);
        
        // Add to beginning
        recentlyViewed.unshift({
            id: productId,
            name: this.currentProduct.name,
            price: this.currentProduct.price,
            image: this.currentProduct.images[0].url,
            viewedAt: new Date().toISOString()
        });
        
        // Keep only last 10 items
        recentlyViewed = recentlyViewed.slice(0, 10);
        
        localStorage.setItem('recentlyViewed', JSON.stringify(recentlyViewed));
    }

    getRecentlyViewedProducts() {
        return JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
    }

    shareProduct() {
        if (navigator.share && this.currentProduct) {
            navigator.share({
                title: this.currentProduct.name,
                text: this.currentProduct.shortDescription,
                url: window.location.href
            }).catch(console.error);
        } else {
            // Fallback to copying URL
            navigator.clipboard.writeText(window.location.href)
                .then(() => this.showToast('Product URL copied to clipboard!', 'success'))
                .catch(() => this.showToast('Failed to copy URL', 'error'));
        }
    }
}

// Global functions for HTML onclick handlers
function incrementQuantity() {
    const input = document.getElementById('quantityInput');
    const max = parseInt(input.max);
    const current = parseInt(input.value);
    if (current < max) {
        input.value = current + 1;
    }
}

function decrementQuantity() {
    const input = document.getElementById('quantityInput');
    const min = parseInt(input.min);
    const current = parseInt(input.value);
    if (current > min) {
        input.value = current - 1;
    }
}

function toggleZoom() {
    productDetail.openImageZoom();
}

function toggleFullscreen() {
    productDetail.openImageZoom();
}

function shareProduct() {
    productDetail.shareProduct();
}

function openReviewModal() {
    productDetail.openReviewModal();
}

function closeReviewModal() {
    productDetail.closeReviewModal();
}

function closeImageZoom() {
    productDetail.closeImageZoom();
}

function zoomIn() {
    productDetail.zoomIn();
}

function zoomOut() {
    productDetail.zoomOut();
}

function resetZoom() {
    productDetail.resetZoom();
}

// Initialize product detail page
let productDetail;
document.addEventListener('DOMContentLoaded', () => {
    productDetail = new ProductDetail();
}); 