// Category Page JavaScript
class CategoryPage {
    constructor() {
        this.apiClient = window.apiClient || new APIClient();
        this.currentCategory = this.getCategoryFromURL();
        this.currentFilters = {
            priceMin: 0,
            priceMax: 5000,
            brands: [],
            availability: ['in-stock'],
            rating: null,
            search: this.getSearchFromURL()
        };
        this.currentSort = 'featured';
        this.currentView = 'grid';
        this.currentPage = 1;
        this.itemsPerPage = 12;
        this.allProducts = [];
        this.filteredProducts = [];
        this.totalProducts = 0;
        this.categories = [];
        
        this.init();
    }
    
    async init() {
        try {
            await this.loadCategories();
            await this.loadProducts();
            this.setupEventListeners();
            this.updateCategoryHeader();
            this.renderProducts();
            this.updateProductCount();
        } catch (error) {
            console.error('Category page initialization error:', error);
            this.showError('Failed to load category page');
        }
    }
    
    getCategoryFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('cat') || 'all';
    }
    
    getSearchFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('search') || '';
    }

    async loadCategories() {
        try {
            const response = await this.apiClient.getCategories();
            if (response.success) {
                this.categories = response.data;
                await this.loadBrandCounts();
            }
        } catch (error) {
            console.error('Failed to load categories:', error);
            this.categories = this.getFallbackCategories();
        }
    }

    async loadBrandCounts() {
        try {
            // Get all products to count brands
            const response = await this.apiClient.getProducts({ limit: 1000 });
            if (response.success) {
                const products = response.data.products || response.data;
                const brandCounts = {};
                
                products.forEach(product => {
                    if (product.brand) {
                        const brand = product.brand.toLowerCase();
                        brandCounts[brand] = (brandCounts[brand] || 0) + 1;
                    }
                });
                
                // Update brand count displays
                Object.entries(brandCounts).forEach(([brand, count]) => {
                    const countElement = document.getElementById(`${brand}-count`);
                    if (countElement) {
                        countElement.textContent = `(${count})`;
                        countElement.style.display = count > 0 ? 'inline' : 'none';
                    }
                });
                
                // Hide brands with no products
                ['nvidia', 'amd', 'intel', 'asus', 'corsair'].forEach(brand => {
                    const countElement = document.getElementById(`${brand}-count`);
                    if (countElement && !brandCounts[brand]) {
                        countElement.textContent = '';
                        // Optionally hide the entire filter option
                        const filterOption = countElement.closest('.filter-option');
                        if (filterOption) {
                            filterOption.style.opacity = '0.5';
                        }
                    }
                });
            }
        } catch (error) {
            console.error('Failed to load brand counts:', error);
            // Hide all brand counts on error
            ['nvidia', 'amd', 'intel', 'asus', 'corsair'].forEach(brand => {
                const countElement = document.getElementById(`${brand}-count`);
                if (countElement) {
                    countElement.textContent = '';
                }
            });
        }
    }

    async loadProducts() {
        try {
            this.showLoadingState();
            
            const params = {
                page: this.currentPage,
                limit: this.itemsPerPage,
                sort: this.currentSort
            };

            // Add category filter
            if (this.currentCategory && this.currentCategory !== 'all') {
                params.category = this.currentCategory;
            }

            // Add search filter
            if (this.currentFilters.search) {
                params.search = this.currentFilters.search;
            }

            // Add price filters
            if (this.currentFilters.priceMin > 0) {
                params.minPrice = this.currentFilters.priceMin;
            }
            if (this.currentFilters.priceMax < 5000) {
                params.maxPrice = this.currentFilters.priceMax;
            }

            // Add brand filters
            if (this.currentFilters.brands.length > 0) {
                params.brands = this.currentFilters.brands.join(',');
            }

            // Add availability filter
            if (this.currentFilters.availability.includes('in-stock')) {
                params.inStock = true;
            }

            // Add rating filter
            if (this.currentFilters.rating) {
                params.minRating = this.currentFilters.rating;
            }

            const response = await this.apiClient.getProducts(params);
            
            if (response.success) {
                this.allProducts = response.data.products || response.data || [];
                this.totalProducts = response.data.total || this.allProducts.length;
                this.filteredProducts = this.allProducts;
                
                this.hideLoadingState();
                this.renderProducts();
                this.updateProductCount();
            } else {
                throw new Error(response.message || 'Failed to load products');
            }
            
        } catch (error) {
            console.error('Failed to load products:', error);
            this.hideLoadingState();
            
            // Show user-friendly error instead of generic message
            if (error.message.includes('Network')) {
                this.showError('Network error. Please check your connection and try again.');
            } else if (error.message.includes('404')) {
                this.showError('No products found for this category.');
            } else {
                this.showError('Unable to load products at the moment. Please try again later.');
            }
            
            // Set empty state instead of leaving undefined
            this.allProducts = [];
            this.filteredProducts = [];
            this.totalProducts = 0;
            this.renderProducts();
            this.updateProductCount();
        }
    }
    
    setupEventListeners() {
        // Price filters
        const minPriceInput = document.getElementById('minPrice');
        const maxPriceInput = document.getElementById('maxPrice');
        
        if (minPriceInput) {
            minPriceInput.addEventListener('input', this.debounce(() => {
                this.currentFilters.priceMin = parseFloat(minPriceInput.value) || 0;
                this.applyFilters();
            }, 500));
        }
        
        if (maxPriceInput) {
            maxPriceInput.addEventListener('input', this.debounce(() => {
                this.currentFilters.priceMax = parseFloat(maxPriceInput.value) || 5000;
                this.applyFilters();
            }, 500));
        }

        // Brand filters
        const brandCheckboxes = document.querySelectorAll('input[name="brand"]');
        brandCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.updateBrandFilters();
                this.applyFilters();
            });
        });

        // Availability filters
        const availabilityCheckboxes = document.querySelectorAll('input[name="availability"]');
        availabilityCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.updateAvailabilityFilters();
                this.applyFilters();
            });
        });

        // Rating filter
        const ratingInputs = document.querySelectorAll('input[name="rating"]');
        ratingInputs.forEach(input => {
            input.addEventListener('change', () => {
                this.currentFilters.rating = input.checked ? parseInt(input.value) : null;
                this.applyFilters();
            });
        });

        // Sort dropdown
        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) {
            sortSelect.addEventListener('change', () => {
                this.currentSort = sortSelect.value;
                this.loadProducts();
            });
        }

        // View mode toggles
        const gridViewBtn = document.getElementById('gridView');
        const listViewBtn = document.getElementById('listView');
        
        if (gridViewBtn) {
            gridViewBtn.addEventListener('click', () => {
                this.currentView = 'grid';
                this.updateViewMode();
            });
        }
        
        if (listViewBtn) {
            listViewBtn.addEventListener('click', () => {
                this.currentView = 'list';
                this.updateViewMode();
            });
        }

        // Clear filters button
        const clearFiltersBtn = document.getElementById('clearFilters');
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => {
                this.clearAllFilters();
            });
        }

        // Pagination
        this.setupPaginationListeners();
    }

    updateBrandFilters() {
        const checkedBrands = Array.from(document.querySelectorAll('input[name="brand"]:checked'))
            .map(input => input.value);
        this.currentFilters.brands = checkedBrands;
    }

    updateAvailabilityFilters() {
        const checkedAvailability = Array.from(document.querySelectorAll('input[name="availability"]:checked'))
            .map(input => input.value);
        this.currentFilters.availability = checkedAvailability;
    }
    
    setupPaginationListeners() {
        // Previous page
        const prevBtn = document.querySelector('.pagination-btn.prev');
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (this.currentPage > 1) {
                    this.currentPage--;
                    this.loadProducts();
                }
            });
        }
        
        // Next page
        const nextBtn = document.querySelector('.pagination-btn.next');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                const totalPages = Math.ceil(this.totalProducts / this.itemsPerPage);
                if (this.currentPage < totalPages) {
                    this.currentPage++;
                    this.loadProducts();
                }
            });
        }
    }
    
    updateCategoryHeader() {
        const categoryTitle = document.getElementById('categoryTitle');
        const categoryDescription = document.getElementById('categoryDescription');
        const categoryBreadcrumb = document.getElementById('categoryBreadcrumb');
        
        if (this.currentCategory === 'all') {
            if (categoryTitle) categoryTitle.textContent = 'All Products';
            if (categoryDescription) categoryDescription.textContent = 'Browse our complete collection of premium PC components and accessories';
            if (categoryBreadcrumb) categoryBreadcrumb.textContent = 'All Products';
        } else if (this.currentFilters.search) {
            if (categoryTitle) categoryTitle.textContent = `Search Results for "${this.currentFilters.search}"`;
            if (categoryDescription) categoryDescription.textContent = `Showing results for "${this.currentFilters.search}"`;
            if (categoryBreadcrumb) categoryBreadcrumb.textContent = 'Search Results';
        } else {
            const category = this.categories.find(cat => cat.slug === this.currentCategory);
            const categoryName = category ? category.name : this.formatCategoryName(this.currentCategory);
            const categoryDesc = category ? category.description : `Browse our selection of ${categoryName.toLowerCase()}`;
            
            if (categoryTitle) categoryTitle.textContent = categoryName;
            if (categoryDescription) categoryDescription.textContent = categoryDesc;
            if (categoryBreadcrumb) categoryBreadcrumb.textContent = categoryName;
        }
    }

    formatCategoryName(slug) {
        return slug.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }
    
    async applyFilters() {
        this.currentPage = 1; // Reset to first page when filtering
        await this.loadProducts();
    }
    
    renderProducts() {
        const productsContainer = document.getElementById('productsGrid');
        if (!productsContainer) return;
        
        if (this.filteredProducts.length === 0) {
            this.renderEmptyState();
            return;
        }
        
        productsContainer.innerHTML = this.filteredProducts.map(product => 
            this.renderProductCard(product)
        ).join('');
        
        this.initProductCardListeners();
        this.updatePagination();
    }
    
    renderProductCard(product) {
        const isOnSale = product.originalPrice && product.originalPrice > product.price;
        const discountPercent = isOnSale ? 
            Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;
        
        const productImage = this.getProductImage(product);
        const productRating = this.calculateAverageRating(product.reviews);
        
        return `
            <div class="product-card ${this.currentView === 'list' ? 'list-view' : ''}" data-product-id="${product._id || product.id}">
                <div class="product-image-container">
                    <img src="${productImage}" 
                         alt="${product.name}" 
                         class="product-image"
                         loading="lazy"
                         onerror="this.src='https://images.unsplash.com/photo-1591488320449-011701bb6704?w=400'">
                    
                    <div class="product-badges">
                        ${product.isNew ? '<span class="badge badge-new">New</span>' : ''}
                        ${isOnSale ? `<span class="badge badge-sale">${discountPercent}% Off</span>` : ''}
                        ${product.isBestseller ? '<span class="badge badge-bestseller">Bestseller</span>' : ''}
                    </div>
                    
                    <button class="wishlist-btn" onclick="toggleWishlist('${product._id || product.id}', this)">
                        <i class="fas fa-heart"></i>
                    </button>
                </div>
                
                <div class="product-info">
                    <h3 class="product-name">
                        <a href="product.html?id=${product._id || product.id}">${product.name}</a>
                    </h3>
                    
                    ${productRating > 0 ? `
                        <div class="product-rating">
                            ${this.generateStarRating(productRating)}
                            <span class="rating-count">(${product.reviews?.length || 0})</span>
                        </div>
                    ` : ''}
                    
                    <div class="product-price">
                        <span class="current-price">$${product.price.toFixed(2)}</span>
                        ${isOnSale ? `<span class="original-price">$${product.originalPrice.toFixed(2)}</span>` : ''}
                    </div>
                    
                    <div class="product-stock">
                        ${product.stock > 0 ? 
                            `<span class="in-stock">✓ In Stock (${product.stock})</span>` :
                            `<span class="out-of-stock">✗ Out of Stock</span>`
                        }
                    </div>
                    
                    <button class="btn btn-primary add-to-cart-btn" 
                            onclick="addToCart('${product._id || product.id}')"
                            ${product.stock === 0 ? 'disabled' : ''}>
                        <i class="fas fa-shopping-cart"></i>
                        ${product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                    </button>
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
        
        for (let i = 0; i < fullStars; i++) {
            stars += '<i class="fas fa-star"></i>';
        }
        
        if (hasHalfStar) {
            stars += '<i class="fas fa-star-half-alt"></i>';
        }
        
        for (let i = 0; i < emptyStars; i++) {
            stars += '<i class="far fa-star"></i>';
        }
        
        return `<div class="stars">${stars}</div>`;
    }
    
    renderEmptyState() {
        const productsContainer = document.getElementById('productsGrid');
        if (!productsContainer) return;
        
        productsContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">
                    <i class="fas fa-search"></i>
                </div>
                <h3>No Products Found</h3>
                <p>We couldn't find any products matching your criteria.</p>
                <button class="btn btn-primary" onclick="categoryPage.clearAllFilters()">
                    Clear Filters
                </button>
            </div>
        `;
    }
    
    initProductCardListeners() {
        // Add event listeners for product interactions
        const productCards = document.querySelectorAll('.product-card');
        productCards.forEach(card => {
            const productId = card.dataset.productId;
            
            // Track product view on click (excluding buttons)
            card.addEventListener('click', (e) => {
                if (!e.target.closest('button')) {
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
        recentlyViewed = recentlyViewed.slice(0, 10);
        localStorage.setItem('recentlyViewed', JSON.stringify(recentlyViewed));
    }
    
    updateViewMode() {
        const productsContainer = document.getElementById('productsGrid');
        const gridViewBtn = document.getElementById('gridView');
        const listViewBtn = document.getElementById('listView');
        
        if (this.currentView === 'grid') {
            productsContainer?.classList.remove('list-view');
            gridViewBtn?.classList.add('active');
            listViewBtn?.classList.remove('active');
        } else {
            productsContainer?.classList.add('list-view');
            listViewBtn?.classList.add('active');
            gridViewBtn?.classList.remove('active');
        }
    }
    
    updateProductCount() {
        const productCount = document.getElementById('productCount');
        if (productCount) {
            const start = ((this.currentPage - 1) * this.itemsPerPage) + 1;
            const end = Math.min(this.currentPage * this.itemsPerPage, this.totalProducts);
            productCount.textContent = `Showing ${start}-${end} of ${this.totalProducts} products`;
        }
    }
    
    updatePagination() {
        const totalPages = Math.ceil(this.totalProducts / this.itemsPerPage);
        const paginationContainer = document.querySelector('.pagination-numbers');
        
        if (!paginationContainer || totalPages <= 1) {
            const paginationElement = document.querySelector('.pagination');
            if (paginationElement) {
                paginationElement.style.display = 'none';
            }
            return;
        }

        const paginationElement = document.querySelector('.pagination');
        if (paginationElement) {
            paginationElement.style.display = 'flex';
        }

        // Update prev/next buttons
        const prevBtn = document.querySelector('.pagination-btn.prev');
        const nextBtn = document.querySelector('.pagination-btn.next');
        
        if (prevBtn) prevBtn.disabled = this.currentPage === 1;
        if (nextBtn) nextBtn.disabled = this.currentPage === totalPages;

        // Generate page numbers
        let paginationHTML = '';
        const maxVisiblePages = 5;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <button class="pagination-number ${i === this.currentPage ? 'active' : ''}" 
                        onclick="categoryPage.goToPage(${i})">
                    ${i}
                </button>
            `;
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                paginationHTML += '<span class="pagination-dots">...</span>';
            }
            paginationHTML += `
                <button class="pagination-number" onclick="categoryPage.goToPage(${totalPages})">
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
    
    clearAllFilters() {
        // Reset all filters
        this.currentFilters = {
            priceMin: 0,
            priceMax: 5000,
            brands: [],
            availability: ['in-stock'],
            rating: null,
            search: this.getSearchFromURL()
        };
        
        // Reset UI elements
        const minPriceInput = document.getElementById('minPrice');
        const maxPriceInput = document.getElementById('maxPrice');
        
        if (minPriceInput) minPriceInput.value = '';
        if (maxPriceInput) maxPriceInput.value = '';
        
        // Clear checkboxes
        document.querySelectorAll('input[type="checkbox"], input[type="radio"]').forEach(input => {
            input.checked = false;
        });
        
        // Reset availability to in-stock
        const inStockCheckbox = document.querySelector('input[name="availability"][value="in-stock"]');
        if (inStockCheckbox) inStockCheckbox.checked = true;
        
        // Reload products
        this.applyFilters();
    }

    showLoadingState() {
        const productsContainer = document.getElementById('productsGrid');
        if (productsContainer) {
            productsContainer.innerHTML = `
                <div class="loading-state">
                    <div class="spinner"></div>
                    <p>Loading products...</p>
                </div>
            `;
        }
    }

    hideLoadingState() {
        // Loading state will be replaced by products or empty state
    }

    showError(message) {
        if (window.authManager) {
            window.authManager.showErrorToast(message);
        } else {
            console.error(message);
        }
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

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Global functions for backward compatibility
async function addToCart(productId, quantity = 1) {
    if (window.authManager && !window.authManager.requireAuth()) return;
    
    try {
        const response = await window.apiClient.addToCart(productId, quantity);
        if (response.success) {
            window.authManager.showSuccessToast('Product added to cart!');
            updateCartCount();
        }
    } catch (error) {
        console.error('Add to cart error:', error);
        window.authManager.showErrorToast('Failed to add product to cart');
    }
}

async function toggleWishlist(productId, button) {
    if (window.authManager && !window.authManager.requireAuth()) return;
    
    try {
        const isInWishlist = button.classList.contains('active');
        
        if (isInWishlist) {
            await window.apiClient.removeFromWishlist(productId);
            button.classList.remove('active');
            window.authManager.showSuccessToast('Removed from wishlist');
        } else {
            await window.apiClient.addToWishlist(productId);
            button.classList.add('active');
            window.authManager.showSuccessToast('Added to wishlist');
        }
        
        updateWishlistCount();
    } catch (error) {
        console.error('Wishlist error:', error);
        window.authManager.showErrorToast('Failed to update wishlist');
    }
}

function updateCartCount() {
    if (window.authManager && window.authManager.isLoggedIn()) {
        window.apiClient.getCart().then(response => {
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

function updateWishlistCount() {
    if (window.authManager && window.authManager.isLoggedIn()) {
        window.apiClient.getWishlist().then(response => {
            if (response.success) {
                const wishlistCount = document.getElementById('wishlistCount');
                if (wishlistCount) {
                    wishlistCount.textContent = response.data.length;
                }
            }
        }).catch(console.error);
    }
}

// Initialize category page
document.addEventListener('DOMContentLoaded', function() {
    window.categoryPage = new CategoryPage();
}); 