// Category Page JavaScript
class CategoryPage {
    constructor() {
        this.currentCategory = this.getCategoryFromURL();
        this.currentFilters = {
            priceMin: 0,
            priceMax: 2000,
            brands: [],
            availability: ['in-stock'],
            rating: null,
            search: this.getSearchFromURL()
        };
        this.currentSort = 'featured';
        this.currentView = 'grid';
        this.currentPage = 1;
        this.itemsPerPage = 12;
        this.allProducts = this.generateSampleProducts();
        this.filteredProducts = [];
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.updateCategoryHeader();
        this.applyFilters();
        this.renderProducts();
        this.updateProductCount();
    }
    
    getCategoryFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('cat') || 'all';
    }
    
    getSearchFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('search') || '';
    }
    
    generateSampleProducts() {
        const products = [
            {
                id: 'rtx-4090',
                name: 'NVIDIA RTX 4090',
                price: 1599.99,
                originalPrice: null,
                image: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=400',
                category: 'graphics-cards',
                brand: 'nvidia',
                rating: 4.8,
                reviews: 124,
                inStock: true,
                isNew: true,
                onSale: false,
                description: 'The ultimate gaming GPU with 24GB GDDR6X memory'
            },
            {
                id: 'i9-13900k',
                name: 'Intel Core i9-13900K',
                price: 629.99,
                originalPrice: 699.99,
                image: 'https://images.unsplash.com/photo-1555617981-dac3880eac6e?w=400',
                category: 'processors',
                brand: 'intel',
                rating: 4.9,
                reviews: 89,
                inStock: true,
                isNew: false,
                onSale: true,
                description: '24-core processor for extreme performance'
            },
            {
                id: 'asus-z790',
                name: 'ASUS ROG Maximus Z790 Hero',
                price: 449.99,
                originalPrice: null,
                image: 'https://images.unsplash.com/photo-1562976540-906b13717cd1?w=400',
                category: 'motherboards',
                brand: 'asus',
                rating: 4.6,
                reviews: 67,
                inStock: true,
                isNew: false,
                onSale: false,
                description: 'Premium Z790 motherboard for gaming enthusiasts'
            },
            {
                id: 'corsair-ddr5',
                name: 'Corsair Vengeance DDR5-5600 32GB',
                price: 199.99,
                originalPrice: null,
                image: 'https://images.unsplash.com/photo-1541029071515-84cc54f84dc5?w=400',
                category: 'memory',
                brand: 'corsair',
                rating: 4.7,
                reviews: 203,
                inStock: true,
                isNew: false,
                onSale: false,
                description: 'High-speed DDR5 memory for demanding applications'
            },
            {
                id: 'rtx-4070',
                name: 'NVIDIA RTX 4070',
                price: 899.99,
                originalPrice: null,
                image: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=400',
                category: 'graphics-cards',
                brand: 'nvidia',
                rating: 4.5,
                reviews: 156,
                inStock: true,
                isNew: false,
                onSale: false,
                description: 'Excellent 1440p gaming performance'
            },
            {
                id: 'amd-7800x3d',
                name: 'AMD Ryzen 7 7800X3D',
                price: 449.99,
                originalPrice: 499.99,
                image: 'https://images.unsplash.com/photo-1555617981-dac3880eac6e?w=400',
                category: 'processors',
                brand: 'amd',
                rating: 4.9,
                reviews: 234,
                inStock: true,
                isNew: false,
                onSale: true,
                description: 'Gaming CPU with 3D V-Cache technology'
            },
            {
                id: 'samsung-980pro',
                name: 'Samsung 980 PRO 2TB NVMe SSD',
                price: 179.99,
                originalPrice: 229.99,
                image: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=400',
                category: 'storage',
                brand: 'samsung',
                rating: 4.8,
                reviews: 312,
                inStock: true,
                isNew: false,
                onSale: true,
                description: 'Lightning-fast PCIe 4.0 NVMe SSD'
            },
            {
                id: 'gskill-ddr5',
                name: 'G.SKILL Trident Z5 DDR5-6000 32GB',
                price: 249.99,
                originalPrice: null,
                image: 'https://images.unsplash.com/photo-1541029071515-84cc54f84dc5?w=400',
                category: 'memory',
                brand: 'gskill',
                rating: 4.6,
                reviews: 89,
                inStock: true,
                isNew: true,
                onSale: false,
                description: 'Premium RGB DDR5 memory kit'
            }
        ];
        
        // Generate more products for pagination testing
        const additionalProducts = [];
        for (let i = 0; i < 20; i++) {
            const baseProduct = products[i % products.length];
            additionalProducts.push({
                ...baseProduct,
                id: `${baseProduct.id}-${i}`,
                name: `${baseProduct.name} (Variant ${i + 1})`,
                price: baseProduct.price + (Math.random() * 200 - 100),
                reviews: Math.floor(Math.random() * 300) + 10
            });
        }
        
        return [...products, ...additionalProducts];
    }
    
    setupEventListeners() {
        // Price filters
        const minPriceInput = document.getElementById('minPrice');
        const maxPriceInput = document.getElementById('maxPrice');
        const priceRangeSlider = document.getElementById('priceRange');
        
        if (minPriceInput) {
            minPriceInput.addEventListener('input', () => {
                this.currentFilters.priceMin = parseFloat(minPriceInput.value) || 0;
                this.applyFilters();
            });
        }
        
        if (maxPriceInput) {
            maxPriceInput.addEventListener('input', () => {
                this.currentFilters.priceMax = parseFloat(maxPriceInput.value) || 2000;
                this.applyFilters();
            });
        }
        
        if (priceRangeSlider) {
            priceRangeSlider.addEventListener('input', () => {
                this.currentFilters.priceMax = parseFloat(priceRangeSlider.value);
                maxPriceInput.value = priceRangeSlider.value;
                this.applyFilters();
            });
        }
        
        // Brand filters
        const brandCheckboxes = document.querySelectorAll('#brandFilters input[type="checkbox"]');
        brandCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                if (checkbox.checked) {
                    this.currentFilters.brands.push(checkbox.value);
                } else {
                    const index = this.currentFilters.brands.indexOf(checkbox.value);
                    if (index > -1) {
                        this.currentFilters.brands.splice(index, 1);
                    }
                }
                this.applyFilters();
            });
        });
        
        // Availability filters
        const availabilityCheckboxes = document.querySelectorAll('.filter-options input[type="checkbox"]');
        availabilityCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                if (checkbox.checked) {
                    if (!this.currentFilters.availability.includes(checkbox.value)) {
                        this.currentFilters.availability.push(checkbox.value);
                    }
                } else {
                    const index = this.currentFilters.availability.indexOf(checkbox.value);
                    if (index > -1) {
                        this.currentFilters.availability.splice(index, 1);
                    }
                }
                this.applyFilters();
            });
        });
        
        // Rating filters
        const ratingRadios = document.querySelectorAll('input[name="rating"]');
        ratingRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                this.currentFilters.rating = radio.value;
                this.applyFilters();
            });
        });
        
        // Sort dropdown
        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) {
            sortSelect.addEventListener('change', () => {
                this.currentSort = sortSelect.value;
                this.applyFilters();
            });
        }
        
        // View toggles
        const viewToggles = document.querySelectorAll('.view-toggle');
        viewToggles.forEach(toggle => {
            toggle.addEventListener('click', () => {
                viewToggles.forEach(t => t.classList.remove('active'));
                toggle.classList.add('active');
                this.currentView = toggle.dataset.view;
                this.updateViewMode();
            });
        });
        
        // Clear filters
        const clearFiltersBtn = document.getElementById('clearFilters');
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => {
                this.clearAllFilters();
            });
        }
        
        // Pagination
        this.setupPaginationListeners();
    }
    
    setupPaginationListeners() {
        const prevBtn = document.querySelector('.pagination-btn.prev');
        const nextBtn = document.querySelector('.pagination-btn.next');
        const pageNumbers = document.querySelectorAll('.pagination-number');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (this.currentPage > 1) {
                    this.currentPage--;
                    this.renderProducts();
                    this.updatePagination();
                }
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                const totalPages = Math.ceil(this.filteredProducts.length / this.itemsPerPage);
                if (this.currentPage < totalPages) {
                    this.currentPage++;
                    this.renderProducts();
                    this.updatePagination();
                }
            });
        }
        
        pageNumbers.forEach(pageBtn => {
            pageBtn.addEventListener('click', () => {
                this.currentPage = parseInt(pageBtn.textContent);
                this.renderProducts();
                this.updatePagination();
            });
        });
    }
    
    updateCategoryHeader() {
        const categoryTitle = document.getElementById('categoryTitle');
        const categoryDescription = document.getElementById('categoryDescription');
        const categoryIcon = document.getElementById('categoryIcon');
        const currentCategoryBreadcrumb = document.getElementById('currentCategory');
        
        const categoryInfo = {
            'graphics-cards': {
                title: 'Graphics Cards',
                description: 'High-performance GPUs for gaming, content creation, and professional workloads',
                icon: 'fas fa-tv'
            },
            'processors': {
                title: 'Processors',
                description: 'Latest CPUs from Intel and AMD for every computing need',
                icon: 'fas fa-microchip'
            },
            'motherboards': {
                title: 'Motherboards',
                description: 'Reliable and feature-rich motherboards for every build',
                icon: 'fas fa-memory'
            },
            'memory': {
                title: 'Memory (RAM)',
                description: 'Fast DDR4 and DDR5 memory modules for optimal performance',
                icon: 'fas fa-save'
            },
            'storage': {
                title: 'Storage',
                description: 'SSDs and HDDs for all your data storage needs',
                icon: 'fas fa-hdd'
            },
            'laptops': {
                title: 'Laptops',
                description: 'Gaming and productivity laptops for every budget',
                icon: 'fas fa-laptop'
            },
            'accessories': {
                title: 'Accessories',
                description: 'Gaming peripherals and computer accessories',
                icon: 'fas fa-keyboard'
            }
        };
        
        const info = categoryInfo[this.currentCategory] || {
            title: 'All Products',
            description: 'Discover our complete range of premium computer components',
            icon: 'fas fa-microchip'
        };
        
        if (this.currentFilters.search) {
            info.title = `Search Results for "${this.currentFilters.search}"`;
            info.description = `Products matching your search query`;
        }
        
        if (categoryTitle) categoryTitle.textContent = info.title;
        if (categoryDescription) categoryDescription.textContent = info.description;
        if (categoryIcon) categoryIcon.innerHTML = `<i class="${info.icon}"></i>`;
        if (currentCategoryBreadcrumb) currentCategoryBreadcrumb.textContent = info.title;
    }
    
    applyFilters() {
        this.filteredProducts = this.allProducts.filter(product => {
            // Category filter
            if (this.currentCategory !== 'all' && product.category !== this.currentCategory) {
                return false;
            }
            
            // Search filter
            if (this.currentFilters.search) {
                const searchTerm = this.currentFilters.search.toLowerCase();
                if (!product.name.toLowerCase().includes(searchTerm) &&
                    !product.description.toLowerCase().includes(searchTerm)) {
                    return false;
                }
            }
            
            // Price filter
            if (product.price < this.currentFilters.priceMin || 
                product.price > this.currentFilters.priceMax) {
                return false;
            }
            
            // Brand filter
            if (this.currentFilters.brands.length > 0 && 
                !this.currentFilters.brands.includes(product.brand)) {
                return false;
            }
            
            // Availability filter
            if (this.currentFilters.availability.includes('in-stock') && !product.inStock) {
                return false;
            }
            
            if (this.currentFilters.availability.includes('on-sale') && !product.onSale) {
                return false;
            }
            
            if (this.currentFilters.availability.includes('new-arrivals') && !product.isNew) {
                return false;
            }
            
            // Rating filter
            if (this.currentFilters.rating) {
                const minRating = parseFloat(this.currentFilters.rating.replace('+', ''));
                if (product.rating < minRating) {
                    return false;
                }
            }
            
            return true;
        });
        
        this.sortProducts();
        this.currentPage = 1; // Reset to first page
        this.renderProducts();
        this.updateProductCount();
        this.updatePagination();
    }
    
    sortProducts() {
        switch (this.currentSort) {
            case 'price-low':
                this.filteredProducts.sort((a, b) => a.price - b.price);
                break;
            case 'price-high':
                this.filteredProducts.sort((a, b) => b.price - a.price);
                break;
            case 'name':
                this.filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'rating':
                this.filteredProducts.sort((a, b) => b.rating - a.rating);
                break;
            case 'newest':
                this.filteredProducts.sort((a, b) => b.isNew - a.isNew);
                break;
            default: // featured
                this.filteredProducts.sort((a, b) => b.reviews - a.reviews);
                break;
        }
    }
    
    renderProducts() {
        const productsGrid = document.getElementById('productsGrid');
        if (!productsGrid) return;
        
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const productsToShow = this.filteredProducts.slice(startIndex, endIndex);
        
        if (productsToShow.length === 0) {
            productsGrid.innerHTML = this.renderEmptyState();
            return;
        }
        
        productsGrid.innerHTML = productsToShow.map(product => this.renderProductCard(product)).join('');
        
        // Reinitialize cart functionality for new products
        this.initProductCardListeners();
    }
    
    renderProductCard(product) {
        const badges = [];
        if (product.isNew) badges.push('<span class="badge badge-new">New</span>');
        if (product.onSale) badges.push('<span class="badge badge-sale">Sale</span>');
        
        const stars = Array.from({length: 5}, (_, i) => {
            const isFilled = i < Math.floor(product.rating);
            const iconClass = isFilled ? 'fas fa-star' : 'far fa-star';
            return `<i class="${iconClass}"></i>`;
        }).join('');
        
        const priceHtml = product.originalPrice ? 
            `<span class="original-price">$${product.originalPrice.toFixed(2)}</span>
             <span class="current-price">$${product.price.toFixed(2)}</span>` :
            `<span class="current-price">$${product.price.toFixed(2)}</span>`;
        
        return `
            <div class="product-card">
                <div class="product-image">
                    <img src="${product.image}" alt="${product.name}" loading="lazy">
                    ${badges.length > 0 ? `<div class="product-badges">${badges.join('')}</div>` : ''}
                    <button class="wishlist-btn" data-product-id="${product.id}">
                        <i class="fas fa-heart"></i>
                    </button>
                </div>
                <div class="product-info">
                    <h3 class="product-name">
                        <a href="product.html?id=${product.id}">${product.name}</a>
                    </h3>
                    <div class="product-rating">
                        <div class="stars">${stars}</div>
                        <span class="rating-count">(${product.reviews})</span>
                    </div>
                    <div class="product-price">${priceHtml}</div>
                    <button class="btn btn-primary add-to-cart" data-product-id="${product.id}">
                        Add to Cart
                    </button>
                </div>
            </div>
        `;
    }
    
    renderEmptyState() {
        return `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <h3>No products found</h3>
                <p>Try adjusting your filters or search terms</p>
                <button class="btn btn-primary" onclick="categoryPage.clearAllFilters()">
                    Clear Filters
                </button>
            </div>
        `;
    }
    
    initProductCardListeners() {
        // Add to cart buttons
        const addToCartButtons = document.querySelectorAll('.add-to-cart');
        addToCartButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const productId = button.getAttribute('data-product-id');
                if (window.TechCore && window.TechCore.addToCart) {
                    window.TechCore.addToCart(productId);
                }
            });
        });
        
        // Wishlist buttons
        const wishlistButtons = document.querySelectorAll('.wishlist-btn');
        wishlistButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const productId = button.getAttribute('data-product-id');
                if (window.TechCore && window.TechCore.toggleWishlist) {
                    window.TechCore.toggleWishlist(productId, button);
                }
            });
        });
    }
    
    updateViewMode() {
        const productsGrid = document.getElementById('productsGrid');
        if (productsGrid) {
            productsGrid.classList.toggle('list-view', this.currentView === 'list');
        }
    }
    
    updateProductCount() {
        const productCount = document.getElementById('productCount');
        const resultsCount = document.getElementById('resultsCount');
        
        const total = this.filteredProducts.length;
        const startIndex = (this.currentPage - 1) * this.itemsPerPage + 1;
        const endIndex = Math.min(this.currentPage * this.itemsPerPage, total);
        
        if (productCount) {
            productCount.textContent = `${total} product${total !== 1 ? 's' : ''}`;
        }
        
        if (resultsCount) {
            if (total === 0) {
                resultsCount.textContent = 'No results';
            } else {
                resultsCount.textContent = `Showing ${startIndex}-${endIndex} of ${total} results`;
            }
        }
    }
    
    updatePagination() {
        const totalPages = Math.ceil(this.filteredProducts.length / this.itemsPerPage);
        const prevBtn = document.querySelector('.pagination-btn.prev');
        const nextBtn = document.querySelector('.pagination-btn.next');
        const pageNumbers = document.querySelectorAll('.pagination-number');
        
        // Update prev/next buttons
        if (prevBtn) {
            prevBtn.disabled = this.currentPage === 1;
        }
        
        if (nextBtn) {
            nextBtn.disabled = this.currentPage === totalPages || totalPages === 0;
        }
        
        // Update page numbers (simplified - just show current page state)
        pageNumbers.forEach(pageBtn => {
            const pageNum = parseInt(pageBtn.textContent);
            pageBtn.classList.toggle('active', pageNum === this.currentPage);
        });
        
        // Scroll to top of products
        const productsSection = document.querySelector('.products-section');
        if (productsSection) {
            productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
    
    clearAllFilters() {
        // Reset filters
        this.currentFilters = {
            priceMin: 0,
            priceMax: 2000,
            brands: [],
            availability: ['in-stock'],
            rating: null,
            search: this.getSearchFromURL()
        };
        
        // Reset form elements
        const minPriceInput = document.getElementById('minPrice');
        const maxPriceInput = document.getElementById('maxPrice');
        const priceRangeSlider = document.getElementById('priceRange');
        
        if (minPriceInput) minPriceInput.value = '';
        if (maxPriceInput) maxPriceInput.value = '';
        if (priceRangeSlider) priceRangeSlider.value = 2000;
        
        // Reset checkboxes
        const checkboxes = document.querySelectorAll('.filters-sidebar input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = checkbox.value === 'in-stock';
        });
        
        // Reset radio buttons
        const radioButtons = document.querySelectorAll('.filters-sidebar input[type="radio"]');
        radioButtons.forEach(radio => {
            radio.checked = false;
        });
        
        // Apply filters
        this.applyFilters();
    }
}

// Initialize category page when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Only initialize if we're on the category page
    if (document.getElementById('productsGrid')) {
        window.categoryPage = new CategoryPage();
    }
});

// Export for global access
window.CategoryPage = CategoryPage; 