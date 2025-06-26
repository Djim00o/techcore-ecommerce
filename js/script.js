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
        // Fallback to static data
        loadFallbackProducts();
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

// Fallback static data for offline mode
function loadFallbackProducts() {
    products = {
        'rtx-4090': {
            id: 'rtx-4090',
            name: 'NVIDIA RTX 4090',
            price: 1599.99,
            image: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=400',
            category: 'graphics-cards',
            inStock: true,
            stock: 10
        },
        'i9-13900k': {
            id: 'i9-13900k',
            name: 'Intel Core i9-13900K',
            price: 629.99,
            originalPrice: 699.99,
            image: 'https://images.unsplash.com/photo-1555617981-dac3880eac6e?w=400',
            category: 'processors',
            inStock: true,
            stock: 15
        },
        'asus-z790': {
            id: 'asus-z790',
            name: 'ASUS ROG Maximus Z790',
            price: 449.99,
            image: 'https://images.unsplash.com/photo-1562976540-906b13717cd1?w=400',
            category: 'motherboards',
            inStock: true,
            stock: 8
        },
        'corsair-ddr5': {
            id: 'corsair-ddr5',
            name: 'Corsair Vengeance DDR5',
            price: 199.99,
            image: 'https://images.unsplash.com/photo-1541029071515-84cc54f84dc5?w=400',
            category: 'memory',
            inStock: true,
            stock: 25
        }
    };
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
    const userNameSpan = document.querySelector('.user-name');
    const adminBtn = document.getElementById('adminBtn');
    
    if (apiClient.isLoggedIn()) {
        const user = apiClient.getCurrentUser();
        
        if (authButtons) authButtons.style.display = 'none';
        if (userMenu) userMenu.style.display = 'flex';
        if (userNameSpan && user) {
            userNameSpan.textContent = `${user.firstName} ${user.lastName}`;
        }
        
        // Show admin button for admin users
        if (adminBtn && user && user.role === 'admin') {
            adminBtn.style.display = 'flex';
        }
    } else {
        if (authButtons) authButtons.style.display = 'flex';
        if (userMenu) userMenu.style.display = 'none';
        if (adminBtn) adminBtn.style.display = 'none';
    }
}

async function handleLogout() {
    try {
        await apiClient.logout();
        updateAuthUI();
        // Redirect to home
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Logout failed:', error);
    }
}

// Load featured products for homepage
async function loadFeaturedProducts() {
    try {
        const productGrid = document.getElementById('featuredProductsGrid');
        if (!productGrid) return;
        
        const response = await apiClient.getFeaturedProducts();
        if (response.success && response.data.products && response.data.products.length > 0) {
            productGrid.innerHTML = response.data.products.map(product => `
                <div class="product-card" data-category="${product.category}">
                    <div class="product-image">
                        <img src="${product.images?.[0] || product.image || 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=400'}" 
                             alt="${product.name}" loading="lazy">
                        <div class="product-badges">
                            ${product.onSale ? '<span class="badge badge-sale">Sale</span>' : ''}
                            ${product.featured && !product.onSale ? '<span class="badge badge-new">Featured</span>' : ''}
                        </div>
                        <button class="wishlist-btn" onclick="toggleWishlist('${product._id}', this)">
                            <i class="fas fa-heart"></i>
                        </button>
                    </div>
                    <div class="product-info">
                        <h3 class="product-name">${product.name}</h3>
                        <div class="product-rating">
                            <div class="stars">
                                ${generateStarRating(4.5)}
                            </div>
                            <span class="rating-count">(${Math.floor(Math.random() * 200) + 50})</span>
                        </div>
                        <div class="product-price">
                            ${product.originalPrice ? `<span class="original-price">$${product.originalPrice}</span>` : ''}
                            <span class="current-price">$${product.price}</span>
                        </div>
                        <button class="btn btn-primary add-to-cart" onclick="addToCart('${product._id}')">
                            <i class="fas fa-shopping-cart"></i> Add to Cart
                        </button>
                    </div>
                </div>
            `).join('');
        } else {
            // Show empty state if no products
            productGrid.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                    <i class="fas fa-box-open" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 1rem;"></i>
                    <h3 style="color: var(--text-primary); margin-bottom: 0.5rem;">No Products Available</h3>
                    <p style="color: var(--text-secondary); margin-bottom: 2rem;">Products are being loaded. Please check back soon!</p>
                    <button class="btn btn-primary" onclick="window.location.href='admin.html'">
                        <i class="fas fa-plus"></i> Add Products (Admin)
                    </button>
                </div>
            `;
        }
    } catch (error) {
        console.error('Failed to load featured products:', error);
        const productGrid = document.getElementById('featuredProductsGrid');
        if (productGrid) {
            productGrid.innerHTML = `
                <div class="error-state" style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: var(--accent-orange); margin-bottom: 1rem;"></i>
                    <h3 style="color: var(--text-primary); margin-bottom: 0.5rem;">Failed to Load Products</h3>
                    <p style="color: var(--text-secondary); margin-bottom: 2rem;">Unable to connect to the server. Please try again.</p>
                    <button class="btn btn-primary" onclick="loadFeaturedProducts()">
                        <i class="fas fa-redo"></i> Retry
                    </button>
                </div>
            `;
        }
    }
}

// Helper function to generate star ratings
function generateStarRating(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
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

// Mobile Menu Functionality
function initMobileMenu() {
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    const mobileMenu = document.querySelector('.mobile-menu');
    const mobileClose = document.querySelector('.mobile-menu-close');
    const mobileLinks = document.querySelectorAll('.mobile-nav-link');
    
    if (mobileToggle) {
        mobileToggle.addEventListener('click', () => {
            mobileMenu.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }
    
    if (mobileClose) {
        mobileClose.addEventListener('click', () => {
            mobileMenu.classList.remove('active');
            document.body.style.overflow = '';
        });
    }
    
    // Close menu when clicking on links
    mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.remove('active');
            document.body.style.overflow = '';
        });
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (mobileMenu.classList.contains('active') && 
            !mobileMenu.contains(e.target) && 
            !mobileToggle.contains(e.target)) {
            mobileMenu.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
}

// Search Functionality
function initSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.querySelector('.search-btn');
    const searchSuggestions = document.getElementById('searchSuggestions');
    
    if (searchInput) {
        let searchTimeout;
        
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            const query = e.target.value.trim();
            
            if (query.length > 0) {
                searchTimeout = setTimeout(() => {
                    showSearchSuggestions(query);
                }, 300);
            } else {
                hideSearchSuggestions();
            }
        });
        
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performSearch(searchInput.value);
            }
        });
        
        searchInput.addEventListener('focus', () => {
            if (searchInput.value.trim().length > 0) {
                showSearchSuggestions(searchInput.value);
            }
        });
        
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-container')) {
                hideSearchSuggestions();
            }
        });
    }
    
    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            performSearch(searchInput.value);
        });
    }
}

async function showSearchSuggestions(query) {
    const suggestions = document.getElementById('searchSuggestions');
    if (!suggestions) return;
    
    try {
        // Try to get suggestions from API
        const response = await apiClient.getSearchSuggestions(query);
        
        if (response.success && response.data.length > 0) {
            suggestions.innerHTML = response.data.map(product => `
                <div class="search-suggestion" onclick="goToProduct('${product._id}')">
                    <img src="${product.images?.[0] || product.image}" alt="${product.name}">
                    <div>
                        <div class="suggestion-name">${product.name}</div>
                        <div class="suggestion-price">$${product.price}</div>
                    </div>
                </div>
            `).join('');
            
            suggestions.style.display = 'block';
        } else {
            // Fallback to local search
            const filteredProducts = Object.values(products).filter(product =>
                product.name.toLowerCase().includes(query.toLowerCase())
            );
            
            if (filteredProducts.length > 0) {
                suggestions.innerHTML = filteredProducts.map(product => `
                    <div class="search-suggestion" onclick="goToProduct('${product.id}')">
                        <img src="${product.image}" alt="${product.name}">
                        <div>
                            <div class="suggestion-name">${product.name}</div>
                            <div class="suggestion-price">$${product.price}</div>
                        </div>
                    </div>
                `).join('');
                
                suggestions.style.display = 'block';
            } else {
                suggestions.innerHTML = '<div class="no-suggestions">No products found</div>';
                suggestions.style.display = 'block';
            }
        }
    } catch (error) {
        console.error('Search suggestions failed:', error);
        // Fallback to local search
        const filteredProducts = Object.values(products).filter(product =>
            product.name.toLowerCase().includes(query.toLowerCase())
        );
        
        if (filteredProducts.length > 0) {
            suggestions.innerHTML = filteredProducts.map(product => `
                <div class="search-suggestion" onclick="goToProduct('${product.id}')">
                    <img src="${product.image}" alt="${product.name}">
                    <div>
                        <div class="suggestion-name">${product.name}</div>
                        <div class="suggestion-price">$${product.price}</div>
                    </div>
                </div>
            `).join('');
            
            suggestions.style.display = 'block';
        } else {
            suggestions.innerHTML = '<div class="no-suggestions">No products found</div>';
            suggestions.style.display = 'block';
        }
    }
}

function hideSearchSuggestions() {
    const suggestions = document.getElementById('searchSuggestions');
    if (suggestions) {
        suggestions.style.display = 'none';
    }
}

function performSearch(query) {
    if (query.trim()) {
        window.location.href = `category.html?search=${encodeURIComponent(query)}`;
    }
}

function goToProduct(productId) {
    window.location.href = `product.html?id=${productId}`;
}

// Cart Functionality
function initCart() {
    // Sync cart with backend if logged in
    syncCartWithBackend();
}

async function syncCartWithBackend() {
    if (apiClient.isLoggedIn()) {
        try {
            const response = await apiClient.getCart();
            if (response.success) {
                cart = response.data.items.map(item => ({
                    productId: item.product._id,
                    quantity: item.quantity,
                    product: item.product
                }));
                updateCartStorage();
                updateCartCount();
            }
        } catch (error) {
            console.error('Failed to sync cart:', error);
        }
    }
}

async function addToCart(productId, quantity = 1) {
    try {
        if (apiClient.isLoggedIn()) {
            // Add to backend cart
            const response = await apiClient.addToCart(productId, quantity);
            if (response.success) {
                // Update local cart from backend response
                await syncCartWithBackend();
                showCartToast();
                return;
            }
        }
        
        // Fallback to local cart
        const existingItem = cart.find(item => item.productId === productId);
        
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            const product = products[productId];
            if (product) {
                cart.push({
                    productId: productId,
                    quantity: quantity,
                    product: product
                });
            }
        }
        
        updateCartStorage();
        updateCartCount();
        showCartToast();
    } catch (error) {
        console.error('Failed to add to cart:', error);
        showErrorToast('Failed to add item to cart');
    }
}

async function removeFromCart(productId) {
    try {
        if (apiClient.isLoggedIn()) {
            await apiClient.removeFromCart(productId);
            await syncCartWithBackend();
            return;
        }
        
        // Fallback to local cart
        cart = cart.filter(item => item.productId !== productId);
        updateCartStorage();
        updateCartCount();
    } catch (error) {
        console.error('Failed to remove from cart:', error);
    }
}

async function updateCartQuantity(productId, quantity) {
    try {
        if (quantity <= 0) {
            return removeFromCart(productId);
        }
        
        if (apiClient.isLoggedIn()) {
            await apiClient.updateCartItem(productId, quantity);
            await syncCartWithBackend();
            return;
        }
        
        // Fallback to local cart
        const item = cart.find(item => item.productId === productId);
        if (item) {
            item.quantity = quantity;
            updateCartStorage();
            updateCartCount();
        }
    } catch (error) {
        console.error('Failed to update cart:', error);
    }
}

function updateCartStorage() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function updateCartCount() {
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalItems;
        cartCount.style.display = totalItems > 0 ? 'block' : 'none';
    }
}

function showCartToast() {
    const toast = document.createElement('div');
    toast.className = 'cart-toast';
    toast.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>Item added to cart!</span>
    `;
    
    // Add styles
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--glass-bg);
        backdrop-filter: blur(20px);
        border: 1px solid var(--neon-green);
        padding: 1rem 1.5rem;
        border-radius: 12px;
        color: var(--neon-green);
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        z-index: 10000;
        animation: slideInRight 0.3s ease, slideOutRight 0.3s ease 2.7s;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function showErrorToast(message) {
    const toast = document.createElement('div');
    toast.className = 'error-toast';
    toast.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <span>${message}</span>
    `;
    
    // Add styles
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--glass-bg);
        backdrop-filter: blur(20px);
        border: 1px solid #ff4757;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        color: #ff4757;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        z-index: 10000;
        animation: slideInRight 0.3s ease, slideOutRight 0.3s ease 2.7s;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function showSuccessToast(message) {
    const toast = document.createElement('div');
    toast.className = 'success-toast';
    toast.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${message}</span>
    `;
    
    // Add styles
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--glass-bg);
        backdrop-filter: blur(20px);
        border: 1px solid var(--neon-green);
        padding: 1rem 1.5rem;
        border-radius: 12px;
        color: var(--neon-green);
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        z-index: 10000;
        animation: slideInRight 0.3s ease, slideOutRight 0.3s ease 2.7s;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Login modal functionality
function showLoginModal() {
    const modal = document.createElement('div');
    modal.className = 'auth-modal';
    modal.innerHTML = `
        <div class="modal-overlay" onclick="closeAuthModal()"></div>
        <div class="modal-content">
            <div class="modal-header">
                <h2>Login to TechCore</h2>
                <button class="modal-close" onclick="closeAuthModal()">&times;</button>
            </div>
            <form id="loginForm">
                <div class="form-group">
                    <label for="loginEmail">Email Address</label>
                    <input type="email" id="loginEmail" placeholder="Enter your email" required>
                </div>
                <div class="form-group">
                    <label for="loginPassword">Password</label>
                    <input type="password" id="loginPassword" placeholder="Enter your password" required>
                </div>
                <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 1rem;">
                    <i class="fas fa-sign-in-alt"></i>
                    Login
                </button>
                <p class="auth-switch">
                    Don't have an account? <a href="#" onclick="switchToRegister()">Register here</a>
                </p>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Handle form submission
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    
    // Focus on email input
    setTimeout(() => {
        document.getElementById('loginEmail').focus();
    }, 100);
}

// Register modal functionality
function showRegisterModal() {
    const modal = document.createElement('div');
    modal.className = 'auth-modal';
    modal.innerHTML = `
        <div class="modal-overlay" onclick="closeAuthModal()"></div>
        <div class="modal-content">
            <div class="modal-header">
                <h2>Join TechCore</h2>
                <button class="modal-close" onclick="closeAuthModal()">&times;</button>
            </div>
            <form id="registerForm">
                <div class="form-group">
                    <label for="registerFirstName">First Name</label>
                    <input type="text" id="registerFirstName" placeholder="Enter your first name" required>
                </div>
                <div class="form-group">
                    <label for="registerLastName">Last Name</label>
                    <input type="text" id="registerLastName" placeholder="Enter your last name" required>
                </div>
                <div class="form-group">
                    <label for="registerEmail">Email Address</label>
                    <input type="email" id="registerEmail" placeholder="Enter your email" required>
                </div>
                <div class="form-group">
                    <label for="registerPassword">Password</label>
                    <input type="password" id="registerPassword" placeholder="Create a password (min 8 characters)" required minlength="8">
                </div>
                <div class="form-group">
                    <label for="registerConfirmPassword">Confirm Password</label>
                    <input type="password" id="registerConfirmPassword" placeholder="Confirm your password" required>
                </div>
                <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 1rem;">
                    <i class="fas fa-user-plus"></i>
                    Create Account
                </button>
                <p class="auth-switch">
                    Already have an account? <a href="#" onclick="switchToLogin()">Login here</a>
                </p>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Handle form submission
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    
    // Focus on first name input
    setTimeout(() => {
        document.getElementById('registerFirstName').focus();
    }, 100);
}

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    // Disable button and show loading
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
    
    try {
        const response = await apiClient.login(email, password);
        
        if (response.success) {
            showSuccessToast('Welcome back! Login successful.');
            closeAuthModal();
            updateAuthUI();
            await syncCartWithBackend();
        } else {
            showErrorToast(response.message || 'Login failed');
        }
    } catch (error) {
        showErrorToast('Login failed. Please check your credentials.');
        console.error('Login error:', error);
    } finally {
        // Re-enable button
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const firstName = document.getElementById('registerFirstName').value;
    const lastName = document.getElementById('registerLastName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    // Validate passwords match
    if (password !== confirmPassword) {
        showErrorToast('Passwords do not match');
        return;
    }
    
    // Disable button and show loading
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';
    
    try {
        const response = await apiClient.register({
            firstName,
            lastName,
            email,
            password
        });
        
        if (response.success) {
            showSuccessToast(`Welcome ${firstName}! Account created successfully.`);
            closeAuthModal();
            updateAuthUI();
            await syncCartWithBackend();
        } else {
            showErrorToast(response.message || 'Registration failed');
        }
    } catch (error) {
        showErrorToast('Registration failed. Please try again.');
        console.error('Registration error:', error);
    } finally {
        // Re-enable button
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-user-plus"></i> Create Account';
    }
}

function switchToRegister() {
    closeAuthModal();
    setTimeout(showRegisterModal, 100);
}

function switchToLogin() {
    closeAuthModal();
    setTimeout(showLoginModal, 100);
}

function closeAuthModal() {
    const modal = document.querySelector('.auth-modal');
    if (modal) {
        modal.style.animation = 'modalSlideOut 0.3s ease';
        setTimeout(() => modal.remove(), 300);
    }
}

// Category Navigation
function initCategoryNavigation() {
    const categoryCards = document.querySelectorAll('.category-card');
    
    categoryCards.forEach(card => {
        card.addEventListener('click', () => {
            const category = card.getAttribute('data-category');
            if (category) {
                window.location.href = `category.html?cat=${category}`;
            }
        });
    });
    
    // Hero buttons
    const heroButtons = document.querySelectorAll('.hero-buttons .btn');
    heroButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            if (button.textContent.includes('Shop Now')) {
                e.preventDefault();
                window.location.href = 'category.html';
            } else if (button.textContent.includes('Browse Categories')) {
                e.preventDefault();
                document.querySelector('.featured-categories').scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Wishlist Functionality
function initWishlist() {
    const wishlistButtons = document.querySelectorAll('.wishlist-btn');
    
    wishlistButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const productCard = button.closest('.product-card');
            const productId = productCard.querySelector('.add-to-cart').getAttribute('data-product-id');
            
            toggleWishlist(productId, button);
        });
    });
}

function toggleWishlist(productId, button) {
    const product = products[productId];
    if (!product) return;
    
    const existingIndex = wishlist.findIndex(item => item.id === productId);
    
    if (existingIndex > -1) {
        wishlist.splice(existingIndex, 1);
        button.classList.remove('active');
        button.style.color = 'var(--text-secondary)';
    } else {
        wishlist.push(product);
        button.classList.add('active');
        button.style.color = 'var(--accent-orange)';
    }
    
    updateWishlistStorage();
    updateWishlistCount();
}

function updateWishlistStorage() {
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
}

function updateWishlistCount() {
    const wishlistCount = document.getElementById('wishlistCount');
    if (wishlistCount) {
        wishlistCount.textContent = wishlist.length;
        wishlistCount.style.display = wishlist.length > 0 ? 'block' : 'none';
    }
}

// Newsletter Functionality
function initNewsletter() {
    const newsletterForm = document.querySelector('.newsletter-form');
    const newsletterInput = document.querySelector('.newsletter-input');
    const newsletterBtn = newsletterForm?.querySelector('.btn');
    
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = newsletterInput.value.trim();
            
            if (email && isValidEmail(email)) {
                // Simulate newsletter signup
                newsletterBtn.textContent = 'Subscribed!';
                newsletterBtn.style.background = 'var(--neon-green)';
                newsletterInput.value = '';
                
                setTimeout(() => {
                    newsletterBtn.textContent = 'Subscribe';
                    newsletterBtn.style.background = '';
                }, 2000);
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
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Animations
function initAnimations() {
    // Intersection Observer for fade-in animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Animate sections on scroll
    const animatedElements = document.querySelectorAll('.category-card, .product-card, .trust-item');
    
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
    
    // Parallax effect for hero background
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const heroBackground = document.querySelector('.hero-bg-animation');
        
        if (heroBackground) {
            heroBackground.style.transform = `translateY(${scrolled * 0.5}px)`;
        }
    });
}

// Utility Functions
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

// URL Parameters Helper
function getURLParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

// Local Storage Helper
function getFromStorage(key, defaultValue = null) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error('Error reading from localStorage:', error);
        return defaultValue;
    }
}

function setToStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error('Error writing to localStorage:', error);
    }
}

// Performance optimization
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
    }
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