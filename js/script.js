// Global variables
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
let products = {}; // Will be loaded from API
let categories = []; // Will be loaded from API

// API Integration - Load products and categories from backend
async function loadProductsFromAPI() {
    try {
        const response = await apiClient.getFeaturedProducts();
        if (response.success) {
            // Convert array to object for backward compatibility
            response.data.products.forEach(product => {
                products[product._id] = {
                    id: product._id,
                    name: product.name,
                    price: product.price,
                    originalPrice: product.originalPrice,
                    image: product.images?.[0] || product.image || 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=400',
                    category: product.category,
                    description: product.description,
                    inStock: product.stock > 0,
                    stock: product.stock
                };
            });
        }
    } catch (error) {
        console.error('Failed to load products:', error);
        // Don't load fallback products - just leave empty
        products = {};
    }
}

async function loadCategoriesFromAPI() {
    try {
        const response = await apiClient.getCategories();
        if (response.success) {
            categories = response.data;
        }
    } catch (error) {
        console.error('Failed to load categories:', error);
        // Use fallback categories
        categories = [
            { _id: 'processors', name: 'Processors', slug: 'processors' },
            { _id: 'graphics-cards', name: 'Graphics Cards', slug: 'graphics-cards' },
            { _id: 'motherboards', name: 'Motherboards', slug: 'motherboards' },
            { _id: 'memory', name: 'Memory', slug: 'memory' },
            { _id: 'storage', name: 'Storage', slug: 'storage' },
            { _id: 'cooling', name: 'Cooling', slug: 'cooling' }
        ];
    }
}

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

async function initializeApp() {
    // Show loading state
    showLoadingState();
    
    // Load data from API
    await Promise.all([
        loadProductsFromAPI(),
        loadCategoriesFromAPI()
    ]);
    
    // Hide loading state
    hideLoadingState();
    
    // Initialize mobile menu
    initMobileMenu();
    
    // Initialize search functionality
    initSearch();
    
    // Initialize cart functionality
    initCart();
    
    // Initialize category navigation
    initCategoryNavigation();
    
    // Initialize wishlist
    initWishlist();
    
    // Initialize newsletter
    initNewsletter();
    
    // Initialize authentication
    initAuth();
    
    // Update cart and wishlist counts
    updateCartCount();
    updateWishlistCount();
    
    // Initialize smooth scrolling
    initSmoothScrolling();
    
    // Initialize animations
    initAnimations();
    
    // Load featured products on homepage
    if (window.location.pathname === '/' || window.location.pathname.includes('index.html')) {
        loadFeaturedProducts();
    }
}

// Loading state management
function showLoadingState() {
    const loadingOverlay = document.createElement('div');
    loadingOverlay.id = 'loadingOverlay';
    loadingOverlay.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner"></div>
            <p>Loading TechCore...</p>
        </div>
    `;
    loadingOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        color: white;
    `;
    document.body.appendChild(loadingOverlay);
}

function hideLoadingState() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.remove();
    }
}

// Authentication management
function initAuth() {
    updateAuthUI();
    
    // Add auth event listeners
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (loginBtn) {
        loginBtn.addEventListener('click', showLoginModal);
    }
    
    if (registerBtn) {
        registerBtn.addEventListener('click', showRegisterModal);
    }
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
}

function updateAuthUI() {
    const authButtons = document.querySelector('.auth-buttons');
    const userMenu = document.querySelector('.user-menu');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    
    if (user) {
        if (authButtons) authButtons.style.display = 'none';
        if (userMenu) {
            userMenu.style.display = 'flex';
            const userName = userMenu.querySelector('.user-name');
            if (userName) {
                userName.textContent = user.firstName || user.email;
            }
        }
    } else {
        if (authButtons) authButtons.style.display = 'flex';
        if (userMenu) userMenu.style.display = 'none';
    }
}

async function handleLogout() {
    try {
        await apiClient.logout();
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        updateAuthUI();
        showSuccessToast('Successfully logged out');
    }
}

// Load featured products for homepage
async function loadFeaturedProducts() {
    const container = document.getElementById('featuredProducts');
    if (!container) return;

    try {
        // Show loading state
        container.innerHTML = `
            <div class="loading-state">
                <div class="spinner"></div>
                <p>Loading featured products...</p>
            </div>
        `;

        // Use the product manager if available, otherwise load directly
        if (window.productManager) {
            await window.productManager.loadProducts({ featured: true, limit: 8 });
        } else {
            const response = await apiClient.getFeaturedProducts();
            if (response.success && response.data) {
                const products = response.data.products || response.data;
                if (products.length === 0) {
                    container.innerHTML = `
                        <div class="empty-state">
                            <div class="empty-state-icon">
                                <i class="fas fa-box-open"></i>
                            </div>
                            <h3>No Featured Products</h3>
                            <p>We're working on adding featured products. Check back soon!</p>
                            <a href="category.html" class="btn btn-primary">Browse All Products</a>
                        </div>
                    `;
                    return;
                }
                
                container.innerHTML = products.slice(0, 8).map(product => createProductCard(product)).join('');
            } else {
                throw new Error(response.message || 'Failed to load featured products');
            }
        }
    } catch (error) {
        console.error('Failed to load featured products:', error);
        
        // Show user-friendly error message
        let errorMessage = 'Unable to load featured products at the moment.';
        if (error.message.includes('Network') || error.message.includes('fetch')) {
            errorMessage = 'Network error. Please check your connection.';
        } else if (error.message.includes('404')) {
            errorMessage = 'Featured products service is temporarily unavailable.';
        }
        
        container.innerHTML = `
            <div class="error-state">
                <div class="error-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h3>Unable to Load Products</h3>
                <p>${errorMessage}</p>
                <div class="error-actions">
                    <button class="btn btn-primary" onclick="loadFeaturedProducts()">Try Again</button>
                    <a href="category.html" class="btn btn-outline">Browse All Products</a>
                </div>
            </div>
        `;
    }
}

function createProductCard(product) {
    const isOnSale = product.originalPrice && product.originalPrice > product.price;
    const discountPercent = isOnSale ? 
        Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;
    
    const productImage = getProductImage(product);
    const productRating = calculateAverageRating(product.reviews);
    
    return `
        <div class="product-card" data-product-id="${product._id || product.id}">
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
                        ${generateStarRating(productRating)}
                        <span class="rating-count">(${product.reviews?.length || 0})</span>
                    </div>
                ` : ''}
                
                <div class="product-price">
                    <span class="current-price">$${product.price.toFixed(2)}</span>
                    ${isOnSale ? `<span class="original-price">$${product.originalPrice.toFixed(2)}</span>` : ''}
                </div>
                
                <div class="product-stock">
                    ${product.stock > 0 ? 
                        `<span class="in-stock">✓ In Stock</span>` :
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

function getProductImage(product) {
    if (product.images && product.images.length > 0) {
        return product.images[0].url || product.images[0];
    }
    return product.image || getDefaultImage(product.category);
}

function getDefaultImage(category) {
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

function calculateAverageRating(reviews) {
    if (!reviews || reviews.length === 0) return 0;
    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return total / reviews.length;
}

function generateStarRating(rating) {
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

// Mobile Menu Functionality
function initMobileMenu() {
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    const mobileMenu = document.querySelector('.mobile-menu');
    const mobileClose = document.querySelector('.mobile-menu-close');
    
    if (mobileToggle && mobileMenu) {
        mobileToggle.addEventListener('click', () => {
            mobileMenu.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }
    
    if (mobileClose && mobileMenu) {
        mobileClose.addEventListener('click', () => {
            mobileMenu.classList.remove('active');
            document.body.style.overflow = '';
        });
    }
    
    // Close mobile menu when clicking outside
    if (mobileMenu) {
        mobileMenu.addEventListener('click', (e) => {
            if (e.target === mobileMenu) {
                mobileMenu.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }
}

// Search Functionality
function initSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.querySelector('.search-btn');
    const searchSuggestions = document.getElementById('searchSuggestions');
    
    if (searchInput) {
        searchInput.addEventListener('input', debounce(async (e) => {
            const query = e.target.value.trim();
            if (query.length > 2) {
                await showSearchSuggestions(query);
            } else {
                hideSearchSuggestions();
            }
        }, 300));
        
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performSearch(e.target.value);
            }
        });
    }
    
    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            const query = searchInput ? searchInput.value : '';
            performSearch(query);
        });
    }
    
    // Close suggestions when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-container')) {
            hideSearchSuggestions();
        }
    });
}

async function showSearchSuggestions(query) {
    const searchSuggestions = document.getElementById('searchSuggestions');
    if (!searchSuggestions) return;
    
    try {
        const response = await apiClient.searchProducts(query);
        if (response.success && response.data && response.data.length > 0) {
            const suggestions = response.data.slice(0, 5).map(product => {
                const productImage = getProductImage(product);
                return `
                    <div class="search-suggestion" onclick="goToProduct('${product._id || product.id}')">
                        <img src="${productImage}" alt="${product.name}" class="suggestion-image">
                        <div class="suggestion-content">
                            <div class="suggestion-name">${product.name}</div>
                            <div class="suggestion-price">$${product.price.toFixed(2)}</div>
                        </div>
                    </div>
                `;
            }).join('');
            
            searchSuggestions.innerHTML = suggestions;
            searchSuggestions.style.display = 'block';
        } else {
            searchSuggestions.innerHTML = `
                <div class="no-suggestions">
                    <p>No products found for "${query}"</p>
                </div>
            `;
            searchSuggestions.style.display = 'block';
        }
    } catch (error) {
        console.error('Search suggestions error:', error);
        hideSearchSuggestions();
    }
}

function hideSearchSuggestions() {
    const searchSuggestions = document.getElementById('searchSuggestions');
    if (searchSuggestions) {
        searchSuggestions.style.display = 'none';
    }
}

function performSearch(query) {
    if (query.trim()) {
        window.location.href = `category.html?search=${encodeURIComponent(query.trim())}`;
    }
}

function goToProduct(productId) {
    window.location.href = `product.html?id=${productId}`;
}

// Cart Functionality
function initCart() {
    // Cart functionality is now handled by the API
    // This is kept for backward compatibility
}

async function syncCartWithBackend() {
    try {
        const token = localStorage.getItem('authToken');
        if (!token) return;
        
        const response = await apiClient.getCart();
        if (response.success) {
            // Update local cart with backend data
            cart = response.data.items || [];
            updateCartStorage();
            updateCartCount();
        }
    } catch (error) {
        console.error('Cart sync error:', error);
    }
}

async function addToCart(productId, quantity = 1) {
    if (!window.authManager || !window.authManager.requireAuth()) return;
    
    try {
        const response = await apiClient.addToCart(productId, quantity);
        if (response.success) {
            showCartToast();
            updateCartCount();
        } else {
            throw new Error(response.message || 'Failed to add to cart');
        }
    } catch (error) {
        console.error('Add to cart error:', error);
        showErrorToast('Failed to add product to cart');
    }
}

async function removeFromCart(productId) {
    try {
        const response = await apiClient.removeFromCart(productId);
        if (response.success) {
            updateCartCount();
            showSuccessToast('Product removed from cart');
        }
    } catch (error) {
        console.error('Remove from cart error:', error);
        showErrorToast('Failed to remove product from cart');
    }
}

async function updateCartQuantity(productId, quantity) {
    if (quantity <= 0) {
        await removeFromCart(productId);
        return;
    }
    
    try {
        const response = await apiClient.updateCartQuantity(productId, quantity);
        if (response.success) {
            updateCartCount();
        }
    } catch (error) {
        console.error('Update cart quantity error:', error);
        showErrorToast('Failed to update cart');
    }
}

function updateCartStorage() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function updateCartCount() {
    const cartCount = document.getElementById('cartCount');
    if (!cartCount) return;
    
    if (window.authManager && window.authManager.isLoggedIn()) {
        apiClient.getCart().then(response => {
            if (response.success) {
                const totalItems = response.data.items.reduce((sum, item) => sum + item.quantity, 0);
                cartCount.textContent = totalItems;
            }
        }).catch(console.error);
    } else {
        cartCount.textContent = '0';
    }
}

function showCartToast() {
    showSuccessToast('Product added to cart!');
}

function showErrorToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast error-toast';
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas fa-exclamation-circle"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    // Animate in
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (document.body.contains(toast)) {
                document.body.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

function showSuccessToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast success-toast';
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    // Animate in
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (document.body.contains(toast)) {
                document.body.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

// Login modal functionality
function showLoginModal() {
    if (window.authManager) {
        window.authManager.showLoginModal();
    }
}

// Register modal functionality
function showRegisterModal() {
    if (window.authManager) {
        window.authManager.showRegisterModal();
    }
}

async function handleLogin(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const loginData = {
        email: formData.get('email'),
        password: formData.get('password')
    };
    
    try {
        const response = await apiClient.login(loginData.email, loginData.password);
        if (response.success) {
            localStorage.setItem('authToken', response.token);
            localStorage.setItem('user', JSON.stringify(response.user));
            updateAuthUI();
            closeAuthModal();
            showSuccessToast('Successfully logged in!');
            await syncCartWithBackend();
        } else {
            throw new Error(response.message || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        showErrorToast(error.message || 'Login failed');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const registerData = {
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        email: formData.get('email'),
        password: formData.get('password'),
        confirmPassword: formData.get('confirmPassword')
    };
    
    if (registerData.password !== registerData.confirmPassword) {
        showErrorToast('Passwords do not match');
        return;
    }
    
    try {
        const response = await apiClient.register(registerData);
        if (response.success) {
            localStorage.setItem('authToken', response.token);
            localStorage.setItem('user', JSON.stringify(response.user));
            updateAuthUI();
            closeAuthModal();
            showSuccessToast('Account created successfully!');
        } else {
            throw new Error(response.message || 'Registration failed');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showErrorToast(error.message || 'Registration failed');
    }
}

function switchToRegister() {
    closeAuthModal();
    showRegisterModal();
}

function switchToLogin() {
    closeAuthModal();
    showLoginModal();
}

function closeAuthModal() {
    const modal = document.querySelector('.auth-modal');
    if (modal) {
        modal.remove();
    }
}

// Category Navigation
function initCategoryNavigation() {
    // Load categories into navigation dropdown
    const categoriesDropdown = document.getElementById('categoriesDropdown');
    if (categoriesDropdown && categories.length > 0) {
        categoriesDropdown.innerHTML = categories.map(category => `
            <a href="category.html?cat=${category.slug}" class="dropdown-item">
                <i class="fas fa-${getCategoryIcon(category.slug)}"></i>
                ${category.name}
            </a>
        `).join('');
    }
}

function getCategoryIcon(slug) {
    const icons = {
        'graphics-cards': 'tv',
        'processors': 'microchip',
        'motherboards': 'memory',
        'memory': 'save',
        'storage': 'hdd',
        'cooling': 'fan'
    };
    return icons[slug] || 'cog';
}

// Wishlist Functionality
function initWishlist() {
    // Wishlist functionality is now handled by the API
    updateWishlistCount();
}

async function toggleWishlist(productId, button) {
    if (!window.authManager || !window.authManager.requireAuth()) return;
    
    try {
        const isInWishlist = button.classList.contains('active');
        
        if (isInWishlist) {
            await apiClient.removeFromWishlist(productId);
            button.classList.remove('active');
            showSuccessToast('Removed from wishlist');
        } else {
            await apiClient.addToWishlist(productId);
            button.classList.add('active');
            showSuccessToast('Added to wishlist');
        }
        
        updateWishlistCount();
    } catch (error) {
        console.error('Wishlist error:', error);
        showErrorToast('Failed to update wishlist');
    }
}

function updateWishlistStorage() {
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
}

function updateWishlistCount() {
    const wishlistCount = document.getElementById('wishlistCount');
    if (!wishlistCount) return;
    
    if (window.authManager && window.authManager.isLoggedIn()) {
        apiClient.getWishlist().then(response => {
            if (response.success) {
                wishlistCount.textContent = response.data.length;
            }
        }).catch(console.error);
    } else {
        wishlistCount.textContent = '0';
    }
}

// Newsletter Functionality
function initNewsletter() {
    const newsletterForm = document.getElementById('newsletterForm');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = e.target.querySelector('input[type="email"]').value;
            
            if (!isValidEmail(email)) {
                showErrorToast('Please enter a valid email address');
                return;
            }
            
            try {
                // Here you would typically send to your newsletter service
                showSuccessToast('Successfully subscribed to newsletter!');
                e.target.reset();
            } catch (error) {
                showErrorToast('Failed to subscribe. Please try again.');
            }
        });
    }
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Smooth Scrolling
function initSmoothScrolling() {
    // Add smooth scrolling to all anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Animations
function initAnimations() {
    // Intersection Observer for animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);
    
    // Observe elements with animation classes
    document.querySelectorAll('.fade-in, .slide-up, .scale-in').forEach(el => {
        observer.observe(el);
    });
}

// Utility functions
function formatPrice(price) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(price);
}

function debounce(func, wait) {
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

function getURLParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

function getFromStorage(key, defaultValue = null) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error(`Error reading from localStorage: ${key}`, error);
        return defaultValue;
    }
}

function setToStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error(`Error writing to localStorage: ${key}`, error);
    }
}

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// CSS for search suggestions
const searchStyles = `
    .search-suggestions {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: var(--glass-bg);
        backdrop-filter: blur(20px);
        border: 1px solid var(--border-color);
        border-radius: 12px;
        padding: 0.5rem 0;
        margin-top: 0.5rem;
        box-shadow: var(--shadow-secondary);
        z-index: 100;
        display: none;
        max-height: 300px;
        overflow-y: auto;
    }
    
    .search-suggestion {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 0.75rem 1rem;
        cursor: pointer;
        transition: background 0.3s ease;
    }
    
    .search-suggestion:hover {
        background: rgba(0, 212, 255, 0.1);
    }
    
    .search-suggestion img {
        width: 40px;
        height: 40px;
        object-fit: cover;
        border-radius: 8px;
    }
    
    .suggestion-name {
        font-weight: 600;
        color: var(--text-primary);
        font-size: 0.9rem;
    }
    
    .suggestion-price {
        color: var(--neon-blue);
        font-weight: 700;
        font-size: 0.8rem;
    }
    
    .no-suggestions {
        padding: 1rem;
        text-align: center;
        color: var(--text-muted);
        font-style: italic;
    }
`;

// Inject search styles
const styleSheet = document.createElement('style');
styleSheet.textContent = searchStyles;
document.head.appendChild(styleSheet);

// Export for use in other files
window.TechCore = {
    cart,
    wishlist,
    products,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    toggleWishlist,
    formatPrice,
    getURLParameter
}; 