// Cart Page JavaScript
class CartManager {
    constructor() {
        this.cart = JSON.parse(localStorage.getItem('cart')) || [];
        this.appliedPromo = JSON.parse(localStorage.getItem('appliedPromo')) || null;
        this.taxRate = 0.08; // 8% tax
        this.freeShippingThreshold = 50;
        this.shippingCost = 9.99;
        this.itemToRemove = null;
        this.isLoading = false;
        
        this.init();
    }
    
    async init() {
        this.showLoadingState();
        
        // Sync cart with backend if logged in
        await this.syncCartWithBackend();
        
        this.renderCart();
        this.setupEventListeners();
        this.updateCartCount();
        
        this.hideLoadingState();
    }
    
    async syncCartWithBackend() {
        if (apiClient.isLoggedIn()) {
            try {
                const response = await apiClient.getCart();
                if (response.success) {
                    this.cart = response.data.items.map(item => ({
                        id: item.product._id,
                        name: item.product.name,
                        price: item.product.price,
                        originalPrice: item.product.originalPrice,
                        image: item.product.images?.[0] || item.product.image,
                        description: item.product.shortDescription || item.product.description,
                        quantity: item.quantity,
                        category: item.product.category
                    }));
                    this.saveCart();
                }
            } catch (error) {
                console.error('Failed to sync cart:', error);
                this.showError('Failed to load cart data. Using local cart.');
            }
        }
    }
    
    showLoadingState() {
        const cartContainer = document.getElementById('cartContainer');
        if (cartContainer) {
            cartContainer.innerHTML = `
                <div class="loading-state">
                    <div class="spinner"></div>
                    <p>Loading your cart...</p>
                </div>
            `;
        }
    }
    
    hideLoadingState() {
        // Loading state will be replaced by renderCart()
    }
    
    showError(message) {
        const errorToast = document.createElement('div');
        errorToast.className = 'error-toast';
        errorToast.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <span>${message}</span>
        `;
        errorToast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(255, 71, 87, 0.1);
            border: 1px solid #ff4757;
            color: #ff4757;
            padding: 1rem;
            border-radius: 8px;
            z-index: 10000;
        `;
        document.body.appendChild(errorToast);
        
        setTimeout(() => errorToast.remove(), 5000);
    }
    
    setupEventListeners() {
        // Modal event listeners
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target);
            }
        });
        
        // Promo code events
        const promoInput = document.getElementById('promoInput');
        if (promoInput) {
            promoInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.applyPromoCode();
                }
            });
        }
    }
    
    renderCart() {
        const cartContainer = document.getElementById('cartContainer');
        if (!cartContainer) return;
        
        if (this.cart.length === 0) {
            cartContainer.innerHTML = this.renderEmptyCart();
            return;
        }
        
        const subtotal = this.calculateSubtotal();
        const discount = this.calculateDiscount(subtotal);
        const shipping = this.calculateShipping(subtotal);
        const tax = this.calculateTax(subtotal - discount);
        const total = subtotal - discount + shipping + tax;
        
        cartContainer.innerHTML = `
            <div class="cart-items">
                <div class="cart-items-header">
                    <h2>Your Items (${this.cart.length})</h2>
                    <button class="clear-cart" onclick="cartManager.clearCart()">
                        <i class="fas fa-trash"></i>
                        Clear Cart
                    </button>
                </div>
                ${this.cart.map(item => this.renderCartItem(item)).join('')}
            </div>
            
            <div class="cart-summary">
                <div class="summary-header">
                    <h3>Order Summary</h3>
                </div>
                
                <div class="summary-row">
                    <span>Subtotal (${this.cart.length} items)</span>
                    <span class="summary-value">$${subtotal.toFixed(2)}</span>
                </div>
                
                ${discount > 0 ? `
                    <div class="summary-row">
                        <span>Discount</span>
                        <span class="summary-value discount">-$${discount.toFixed(2)}</span>
                    </div>
                ` : ''}
                
                <div class="summary-row">
                    <span>Shipping</span>
                    <span class="summary-value">${shipping === 0 ? 'FREE' : '$' + shipping.toFixed(2)}</span>
                </div>
                
                <div class="summary-row">
                    <span>Tax</span>
                    <span class="summary-value">$${tax.toFixed(2)}</span>
                </div>
                
                <div class="summary-row total">
                    <span>Total</span>
                    <span class="summary-value">$${total.toFixed(2)}</span>
                </div>
                
                ${subtotal >= this.freeShippingThreshold ? `
                    <div class="shipping-info">
                        <i class="fas fa-check-circle"></i>
                        <span>You qualify for free shipping!</span>
                    </div>
                ` : `
                    <div class="shipping-info">
                        <i class="fas fa-truck"></i>
                        <span>Add $${(this.freeShippingThreshold - subtotal).toFixed(2)} more for free shipping</span>
                    </div>
                `}
                
                <div class="promo-section">
                    ${this.appliedPromo ? this.renderAppliedPromo() : this.renderPromoInput()}
                </div>
                
                <div class="cart-actions">
                    <button class="btn btn-primary" onclick="window.location.href='checkout.html'">
                        <i class="fas fa-lock"></i>
                        Secure Checkout
                    </button>
                    <button class="btn btn-secondary" onclick="window.location.href='category.html'">
                        <i class="fas fa-arrow-left"></i>
                        Continue Shopping
                    </button>
                </div>
                
                <div class="continue-shopping">
                    <a href="category.html">
                        <i class="fas fa-arrow-left"></i>
                        Continue Shopping
                    </a>
                </div>
            </div>
        `;
        
        this.attachItemEventListeners();
    }
    
    renderCartItem(item) {
        const itemTotal = item.price * item.quantity;
        const hasOriginalPrice = item.originalPrice && item.originalPrice > item.price;
        
        return `
            <div class="cart-item" data-product-id="${item.id}">
                <div class="item-image">
                    <img src="${item.image}" alt="${item.name}" loading="lazy">
                </div>
                
                <div class="item-details">
                    <a href="product.html?id=${item.id}" class="item-name">${item.name}</a>
                    <div class="item-description">${item.description || 'Premium computer component'}</div>
                    <div class="item-stock">
                        <i class="fas fa-check-circle"></i>
                        In Stock
                    </div>
                </div>
                
                <div class="item-price">
                    ${hasOriginalPrice ? `<span class="original-price">$${item.originalPrice.toFixed(2)}</span>` : ''}
                    $${item.price.toFixed(2)}
                </div>
                
                <div class="quantity-controls">
                    <button class="quantity-btn" onclick="cartManager.updateQuantity('${item.id}', ${item.quantity - 1})" ${item.quantity <= 1 ? 'disabled' : ''}>
                        <i class="fas fa-minus"></i>
                    </button>
                    <input type="number" class="quantity-input" value="${item.quantity}" min="1" max="99" 
                           onchange="cartManager.updateQuantity('${item.id}', parseInt(this.value))">
                    <button class="quantity-btn" onclick="cartManager.updateQuantity('${item.id}', ${item.quantity + 1})" ${item.quantity >= 99 ? 'disabled' : ''}>
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
                
                <div class="item-total">
                    $${itemTotal.toFixed(2)}
                </div>
                
                <button class="remove-item" onclick="cartManager.showRemoveModal('${item.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
    }
    
    renderEmptyCart() {
        return `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart"></i>
                <h2>Your cart is empty</h2>
                <p>Looks like you haven't added any items to your cart yet. Start browsing our amazing collection of computer components!</p>
                <div class="cart-actions">
                    <button class="btn btn-primary" onclick="window.location.href='category.html'">
                        Start Shopping
                    </button>
                </div>
            </div>
        `;
    }
    
    renderPromoInput() {
        return `
            <div class="promo-input-group">
                <input type="text" id="promoInput" class="promo-input" placeholder="Enter promo code">
                <button class="promo-btn" onclick="cartManager.applyPromoCode()">Apply</button>
            </div>
            <a href="#" class="promo-link" onclick="cartManager.showPromoModal(); return false;">
                View available offers
            </a>
        `;
    }
    
    renderAppliedPromo() {
        return `
            <div class="applied-promo">
                <div>
                    <div class="applied-promo-code">${this.appliedPromo.code}</div>
                    <div>${this.appliedPromo.description}</div>
                </div>
                <button class="remove-promo" onclick="cartManager.removePromo()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
    }
    
    attachItemEventListeners() {
        // Additional event listeners for cart items can be added here
        // Most functionality is handled through onclick attributes for simplicity
    }
    
    async updateQuantity(productId, newQuantity) {
        if (newQuantity < 1) {
            this.showRemoveModal(productId);
            return;
        }
        
        if (newQuantity > 99) {
            this.showError('Maximum quantity is 99');
            return;
        }
        
        try {
            if (apiClient.isLoggedIn()) {
                // Update backend cart
                await apiClient.updateCartItem(productId, newQuantity);
            }
            
            // Update local cart
            const item = this.cart.find(item => item.id === productId);
            if (item) {
                const oldQuantity = item.quantity;
                item.quantity = newQuantity;
                
                this.saveCart();
                this.renderCart();
                this.updateCartCount();
                this.showUpdateFeedback(productId);
                
                console.log(`Updated ${item.name} quantity from ${oldQuantity} to ${newQuantity}`);
            }
        } catch (error) {
            console.error('Failed to update cart:', error);
            this.showError('Failed to update item quantity');
        }
    }
    
    showUpdateFeedback(productId) {
        const cartItem = document.querySelector(`[data-product-id="${productId}"]`);
        if (cartItem) {
            cartItem.style.background = 'rgba(0, 212, 255, 0.1)';
            cartItem.style.transition = 'background 0.3s ease';
            
            setTimeout(() => {
                cartItem.style.background = '';
            }, 1000);
        }
    }
    
    async removeItem(productId) {
        try {
            if (apiClient.isLoggedIn()) {
                // Remove from backend cart
                await apiClient.removeFromCart(productId);
            }
            
            // Remove from local cart
            const itemIndex = this.cart.findIndex(item => item.id === productId);
            if (itemIndex > -1) {
                const removedItem = this.cart[itemIndex];
                this.cart.splice(itemIndex, 1);
                
                this.saveCart();
                this.renderCart();
                this.updateCartCount();
                
                this.showRemoveSuccess(removedItem.name);
                console.log(`Removed ${removedItem.name} from cart`);
            }
        } catch (error) {
            console.error('Failed to remove item:', error);
            this.showError('Failed to remove item from cart');
        }
    }
    
    showRemoveSuccess(itemName) {
        const successToast = document.createElement('div');
        successToast.className = 'success-toast';
        successToast.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>${itemName} removed from cart</span>
        `;
        successToast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(46, 204, 113, 0.1);
            border: 1px solid #2ecc71;
            color: #2ecc71;
            padding: 1rem;
            border-radius: 8px;
            z-index: 10000;
        `;
        document.body.appendChild(successToast);
        
        setTimeout(() => successToast.remove(), 3000);
    }
    
    async clearCart() {
        if (this.cart.length === 0) return;
        
        if (!confirm('Are you sure you want to clear your entire cart?')) {
            return;
        }
        
        try {
            if (apiClient.isLoggedIn()) {
                // Clear backend cart
                await apiClient.clearCart();
            }
            
            // Clear local cart
            this.cart = [];
            this.saveCart();
            this.renderCart();
            this.updateCartCount();
            
            this.showRemoveSuccess('Cart cleared');
            console.log('Cart cleared');
        } catch (error) {
            console.error('Failed to clear cart:', error);
            this.showError('Failed to clear cart');
        }
    }
    
    showRemoveModal(productId) {
        this.itemToRemove = productId;
        const modal = document.getElementById('removeModal');
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }
    
    confirmRemove() {
        if (this.itemToRemove) {
            this.removeItem(this.itemToRemove);
            this.itemToRemove = null;
        }
        this.closeRemoveModal();
    }
    
    closeRemoveModal() {
        const modal = document.getElementById('removeModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
        this.itemToRemove = null;
    }
    
    showPromoModal() {
        const modal = document.getElementById('promoModal');
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }
    
    closePromoModal() {
        const modal = document.getElementById('promoModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }
    
    selectPromo(code) {
        const promoInput = document.getElementById('promoInput');
        if (promoInput) {
            promoInput.value = code;
        }
        this.applyPromoCode();
        this.closePromoModal();
    }
    
    applyPromoCode() {
        const promoInput = document.getElementById('promoInput');
        if (!promoInput) return;
        
        const code = promoInput.value.trim().toUpperCase();
        if (!code) return;
        
        const promos = {
            'SAVE10': {
                code: 'SAVE10',
                description: '10% off orders over $100',
                type: 'percentage',
                value: 0.10,
                minOrder: 100
            },
            'NEWCUSTOMER': {
                code: 'NEWCUSTOMER',
                description: '15% off first order',
                type: 'percentage',
                value: 0.15,
                minOrder: 0
            },
            'FREESHIP': {
                code: 'FREESHIP',
                description: 'Free shipping on any order',
                type: 'free_shipping',
                value: 0,
                minOrder: 0
            },
            'TECH25': {
                code: 'TECH25',
                description: '$25 off orders over $200',
                type: 'fixed',
                value: 25,
                minOrder: 200
            }
        };
        
        const promo = promos[code];
        const subtotal = this.calculateSubtotal();
        
        if (!promo) {
            this.showPromoError('Invalid promo code');
            return;
        }
        
        if (subtotal < promo.minOrder) {
            this.showPromoError(`Minimum order of $${promo.minOrder} required for this promo`);
            return;
        }
        
        this.appliedPromo = promo;
        this.savePromo();
        this.renderCart();
        this.showPromoSuccess(`Promo code "${code}" applied successfully!`);
        
        // Clear input and close modal if open
        promoInput.value = '';
        this.closePromoModal();
    }
    
    removePromo() {
        this.appliedPromo = null;
        this.savePromo();
        this.renderCart();
        
        const toast = document.createElement('div');
        toast.className = 'cart-toast show';
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-times-circle"></i>
                <span>Promo code removed</span>
            </div>
        `;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
    
    showPromoError(message) {
        const toast = document.createElement('div');
        toast.className = 'cart-toast show';
        toast.style.background = 'var(--accent-orange)';
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-exclamation-triangle"></i>
                <span>${message}</span>
            </div>
        `;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 4000);
    }
    
    showPromoSuccess(message) {
        const toast = document.createElement('div');
        toast.className = 'cart-toast show';
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-check-circle"></i>
                <span>${message}</span>
            </div>
        `;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
    
    calculateSubtotal() {
        return this.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    }
    
    calculateDiscount(subtotal) {
        if (!this.appliedPromo) return 0;
        
        const promo = this.appliedPromo;
        
        switch (promo.type) {
            case 'percentage':
                return subtotal * promo.value;
            case 'fixed':
                return Math.min(promo.value, subtotal);
            case 'free_shipping':
                return 0; // Discount is handled in shipping calculation
            default:
                return 0;
        }
    }
    
    calculateShipping(subtotal) {
        // Free shipping if over threshold or if free shipping promo is applied
        if (subtotal >= this.freeShippingThreshold || 
            (this.appliedPromo && this.appliedPromo.type === 'free_shipping')) {
            return 0;
        }
        return this.shippingCost;
    }
    
    calculateTax(taxableAmount) {
        return taxableAmount * this.taxRate;
    }
    
    closeModal(modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    saveCart() {
        localStorage.setItem('cart', JSON.stringify(this.cart));
    }
    
    savePromo() {
        localStorage.setItem('appliedPromo', JSON.stringify(this.appliedPromo));
    }
    
    updateCartCount() {
        const cartCount = document.getElementById('cartCount');
        if (cartCount) {
            const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
            cartCount.textContent = totalItems;
            cartCount.style.display = totalItems > 0 ? 'block' : 'none';
        }
    }
}

// Global functions for cart operations
function closePromoModal() {
    if (window.cartManager) {
        window.cartManager.closePromoModal();
    }
}

function closeRemoveModal() {
    if (window.cartManager) {
        window.cartManager.closeRemoveModal();
    }
}

function confirmRemove() {
    if (window.cartManager) {
        window.cartManager.confirmRemove();
    }
}

function applyPromoCode() {
    if (window.cartManager) {
        window.cartManager.applyPromoCode();
    }
}

function selectPromo(code) {
    if (window.cartManager) {
        window.cartManager.selectPromo(code);
    }
}

// Initialize cart manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Only initialize if we're on the cart page
    if (document.getElementById('cartContainer')) {
        window.cartManager = new CartManager();
    }
});

// Export for global access
window.CartManager = CartManager; 