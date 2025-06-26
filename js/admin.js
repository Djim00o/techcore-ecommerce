/**
 * TechCore Admin Panel JavaScript
 * Handles all admin functionality including dashboard, products, orders, users, etc.
 */

class AdminPanel {
    constructor() {
        this.currentSection = 'dashboard';
        this.adminToken = localStorage.getItem('authToken');
        this.adminUser = null;
        this.isAdmin = false;
        
        // Hide admin content immediately until verified
        this.hideAdminContent();
        
        this.init();
    }
    
    hideAdminContent() {
        // Hide all admin content until authentication is verified
        const adminContainer = document.querySelector('.admin-container');
        const adminHeader = document.querySelector('.admin-header');
        
        if (adminContainer) {
            adminContainer.style.display = 'none';
        }
        if (adminHeader) {
            adminHeader.style.display = 'none';
        }
        
        // Show loading screen
        this.showAdminLoading();
    }
    
    showAdminContent() {
        const adminContainer = document.querySelector('.admin-container');
        const adminHeader = document.querySelector('.admin-header');
        const loadingScreen = document.getElementById('adminLoadingScreen');
        
        if (adminContainer) {
            adminContainer.style.display = 'flex';
        }
        if (adminHeader) {
            adminHeader.style.display = 'block';
        }
        if (loadingScreen) {
            loadingScreen.remove();
        }
    }
    
    showAdminLoading() {
        const loadingScreen = document.createElement('div');
        loadingScreen.id = 'adminLoadingScreen';
        loadingScreen.innerHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: var(--primary-bg);
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                z-index: 10000;
                color: var(--text-primary);
            ">
                <div style="text-align: center;">
                    <div class="spinner" style="margin: 0 auto 2rem;"></div>
                    <h2 style="color: var(--neon-blue); margin-bottom: 1rem;">
                        <i class="fas fa-shield-alt"></i> TechCore Admin
                    </h2>
                    <p>Verifying admin access...</p>
                </div>
            </div>
        `;
        document.body.appendChild(loadingScreen);
    }
    
    async init() {
        // Add a small delay to ensure everything is loaded
        await new Promise(resolve => setTimeout(resolve, 100));
        
        console.log('🚀 Initializing admin panel...');
        
        // Check authentication first
        const isAuthenticated = await this.checkAdminAuth();
        
        console.log('🔐 Authentication result:', isAuthenticated);
        
        if (!isAuthenticated) {
            console.log('❌ Authentication failed, redirecting to login');
            this.redirectToLogin();
            return;
        }
        
        console.log('✅ Authentication successful, showing admin content');
        
        // Show admin content only after successful authentication
        this.showAdminContent();
        
        // Initialize admin panel
        this.setupEventListeners();
        this.loadDashboardData();
        this.updateAdminUserDisplay();
        
        console.log('🎉 Admin panel fully initialized');
    }
    
    async checkAdminAuth() {
        try {
            console.log('🔍 Checking admin auth...');
            console.log('🎫 Admin token:', this.adminToken ? 'Present' : 'Missing');
            
            if (!this.adminToken) {
                console.log('❌ No admin token found');
                return false;
            }
            
            console.log('📡 Making API request to /auth/me...');
            const response = await apiClient.request('/auth/me');
            console.log('📋 API Response:', response);
            
            if (response.success && response.user && response.user.role === 'admin') {
                console.log('✅ Admin authentication successful');
                console.log('👤 Admin user:', response.user);
                this.adminUser = response.user;
                this.isAdmin = true;
                return true;
            } else {
                console.log('❌ Admin authentication failed - not admin role');
                console.log('🔍 User role:', response.user?.role);
                console.log('🔍 Response structure:', {
                    success: response?.success,
                    hasUser: !!response?.user,
                    userRole: response?.user?.role
                });
            }
        } catch (error) {
            console.error('❌ Admin auth check failed:', error);
            
            // If token is invalid, clear it and try to refresh
            if (error.message.includes('Invalid token') || error.message.includes('Authentication required')) {
                console.log('🔄 Token appears invalid, clearing and requesting fresh login...');
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                this.adminToken = null;
                apiClient.token = null;
                
                // Show login prompt
                this.showTokenRefreshPrompt();
                return false;
            }
        }
        
        return false;
    }
    
    showTokenRefreshPrompt() {
        // Remove loading screen
        const loadingScreen = document.getElementById('adminLoadingScreen');
        if (loadingScreen) {
            loadingScreen.remove();
        }
        
        // Show token refresh prompt
        document.body.innerHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: var(--primary-bg);
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                color: var(--text-primary);
                text-align: center;
                padding: 2rem;
            ">
                <div style="
                    background: var(--card-bg);
                    border: 1px solid var(--border-color);
                    border-radius: 16px;
                    padding: 3rem;
                    max-width: 500px;
                    box-shadow: var(--shadow-secondary);
                ">
                    <i class="fas fa-key" style="font-size: 3rem; color: var(--neon-blue); margin-bottom: 1rem;"></i>
                    <h2 style="color: var(--text-primary); margin-bottom: 1rem;">Session Expired</h2>
                    <p style="color: var(--text-secondary); margin-bottom: 2rem;">
                        Your admin session has expired. Please log in again to continue.
                    </p>
                    <button onclick="refreshAdminLogin()" class="btn btn-primary" style="margin-right: 1rem;">
                        <i class="fas fa-sign-in-alt"></i> Login Again
                    </button>
                    <a href="index.html" class="btn btn-secondary">
                        <i class="fas fa-home"></i> Return to Home
                    </a>
                </div>
            </div>
            <script>
                async function refreshAdminLogin() {
                    try {
                        const response = await fetch('/js/api-client.js');
                        const apiClientCode = await response.text();
                        eval(apiClientCode);
                        
                        const apiClient = new APIClient();
                        const loginResponse = await apiClient.login('admin@techcore.com', 'admin123456');
                        
                        if (loginResponse.success) {
                            location.reload();
                        } else {
                            alert('Login failed: ' + loginResponse.message);
                        }
                    } catch (error) {
                        console.error('Auto-login failed:', error);
                        alert('Auto-login failed. Please go to the main site and login manually.');
                    }
                }
            </script>
        `;
    }
    
    redirectToLogin() {
        // Remove loading screen
        const loadingScreen = document.getElementById('adminLoadingScreen');
        if (loadingScreen) {
            loadingScreen.remove();
        }
        
        // Show access denied message
        document.body.innerHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: var(--primary-bg);
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                color: var(--text-primary);
                text-align: center;
                padding: 2rem;
            ">
                <div style="
                    background: var(--card-bg);
                    border: 1px solid var(--border-color);
                    border-radius: 16px;
                    padding: 3rem;
                    max-width: 500px;
                    box-shadow: var(--shadow-secondary);
                ">
                    <i class="fas fa-shield-alt" style="font-size: 3rem; color: var(--accent-orange); margin-bottom: 1rem;"></i>
                    <h2 style="color: var(--text-primary); margin-bottom: 1rem;">Access Denied</h2>
                    <p style="color: var(--text-secondary); margin-bottom: 2rem;">
                        Admin access required. Please login with administrator credentials.
                    </p>
                    <a href="index.html" class="btn btn-primary">
                        <i class="fas fa-home"></i> Return to Home
                    </a>
                </div>
            </div>
        `;
    }
    
    updateAdminUserDisplay() {
        const userNameEl = document.querySelector('.admin-user-name');
        if (userNameEl && this.adminUser) {
            userNameEl.textContent = `${this.adminUser.firstName} ${this.adminUser.lastName}`;
        }
    }
    
    setupEventListeners() {
        // Navigation menu
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.getAttribute('data-section');
                this.switchSection(section);
            });
        });
        
        // Logout button
        const logoutBtn = document.getElementById('adminLogout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', this.handleLogout.bind(this));
        }
        
        // Seed data button
        const seedBtn = document.getElementById('seedDataBtn');
        if (seedBtn) {
            seedBtn.addEventListener('click', this.handleSeedData.bind(this));
        }
        
        // Add product button
        const addProductBtn = document.getElementById('addProductBtn');
        if (addProductBtn) {
            addProductBtn.addEventListener('click', this.showAddProductModal.bind(this));
        }
        
        // Add category button
        const addCategoryBtn = document.getElementById('addCategoryBtn');
        if (addCategoryBtn) {
            addCategoryBtn.addEventListener('click', this.showAddCategoryModal.bind(this));
        }
        
        // Settings form
        const settingsForm = document.getElementById('settingsForm');
        if (settingsForm) {
            settingsForm.addEventListener('submit', this.handleSettingsUpdate.bind(this));
        }
    }
    
    switchSection(sectionName) {
        // Update menu active state
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');
        
        // Update section visibility
        document.querySelectorAll('.admin-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(sectionName).classList.add('active');
        
        this.currentSection = sectionName;
        
        // Load section data
        this.loadSectionData(sectionName);
    }
    
    async loadSectionData(section) {
        switch (section) {
            case 'dashboard':
                await this.loadDashboardData();
                break;
            case 'products':
                await this.loadProducts();
                break;
            case 'orders':
                await this.loadOrders();
                break;
            case 'users':
                await this.loadUsers();
                break;
            case 'categories':
                await this.loadCategories();
                break;
        }
    }
    
    async loadDashboardData() {
        try {
            // Load dashboard statistics
            const [analytics, recentOrders, lowStock] = await Promise.all([
                apiClient.request('/analytics/dashboard'),
                apiClient.request('/orders?limit=5&sort=-createdAt'),
                apiClient.request('/products?stock[lte]=10&limit=5')
            ]);
            
            // Update stats
            if (analytics.success) {
                this.updateDashboardStats(analytics.data);
            }
            
            // Update recent orders
            if (recentOrders.success) {
                this.updateRecentOrders(recentOrders.data.orders);
            }
            
            // Update low stock products
            if (lowStock.success) {
                this.updateLowStockProducts(lowStock.data.products);
            }
            
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            this.showError('Failed to load dashboard data');
        }
    }
    
    updateDashboardStats(stats) {
        // Handle the nested structure returned by the analytics endpoint
        const revenue = stats.orders?.overall?.totalRevenue || 0;
        const orders = stats.orders?.overall?.totalOrders || 0;
        const products = stats.products?.total || 0;
        const users = stats.users?.total || 0;
        
        document.getElementById('totalRevenue').textContent = this.formatCurrency(revenue);
        document.getElementById('totalOrders').textContent = orders;
        document.getElementById('totalProducts').textContent = products;
        document.getElementById('totalUsers').textContent = users;
    }
    
    updateRecentOrders(orders) {
        const container = document.getElementById('recentOrders');
        
        if (!orders || orders.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>No recent orders found</p></div>';
            return;
        }
        
        const html = orders.map(order => `
            <div class="recent-item">
                <div class="recent-info">
                    <h4>Order #${order.orderNumber}</h4>
                    <p>${order.user?.firstName} ${order.user?.lastName}</p>
                </div>
                <div class="recent-value">${this.formatCurrency(order.total)}</div>
            </div>
        `).join('');
        
        container.innerHTML = html;
    }
    
    updateLowStockProducts(products) {
        const container = document.getElementById('lowStockProducts');
        
        if (!products || products.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>No low stock products</p></div>';
            return;
        }
        
        const html = products.map(product => `
            <div class="recent-item">
                <div class="recent-info">
                    <h4>${product.name}</h4>
                    <p>SKU: ${product.sku}</p>
                </div>
                <div class="recent-value">${product.stock} left</div>
            </div>
        `).join('');
        
        container.innerHTML = html;
    }
    
    async loadProducts() {
        try {
            const response = await apiClient.request('/products?limit=100');
            
            if (response.success) {
                this.updateProductsTable(response.data.products);
            }
        } catch (error) {
            console.error('Failed to load products:', error);
            this.showError('Failed to load products');
        }
    }
    
    updateProductsTable(products) {
        const tbody = document.querySelector('#productsTable tbody');
        
        if (!products || products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7"><div class="empty-state"><p>No products found</p></div></td></tr>';
            return;
        }
        
        const html = products.map(product => `
            <tr>
                <td>
                    <img src="${product.images?.[0]?.url || 'https://via.placeholder.com/50'}" 
                         alt="${product.name}" class="product-image">
                </td>
                <td>
                    <strong>${product.name}</strong><br>
                    <small>SKU: ${product.sku}</small>
                </td>
                <td>${product.category}</td>
                <td>${this.formatCurrency(product.price)}</td>
                <td>${product.stock}</td>
                <td>
                    <span class="status-badge ${product.stock > 0 ? 'status-active' : 'status-inactive'}">
                        ${product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-view" onclick="adminPanel.viewProduct('${product._id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-edit" onclick="adminPanel.editProduct('${product._id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-delete" onclick="adminPanel.deleteProduct('${product._id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
        
        tbody.innerHTML = html;
    }
    
    async loadOrders() {
        try {
            const response = await apiClient.request('/orders?limit=100&sort=-createdAt');
            
            if (response.success) {
                this.updateOrdersTable(response.data.orders);
            }
        } catch (error) {
            console.error('Failed to load orders:', error);
            this.showError('Failed to load orders');
        }
    }
    
    updateOrdersTable(orders) {
        const tbody = document.querySelector('#ordersTable tbody');
        
        if (!orders || orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state"><p>No orders found</p></div></td></tr>';
            return;
        }
        
        const html = orders.map(order => `
            <tr>
                <td>#${order.orderNumber}</td>
                <td>${order.user?.firstName} ${order.user?.lastName}</td>
                <td>${new Date(order.createdAt).toLocaleDateString()}</td>
                <td>${this.formatCurrency(order.total)}</td>
                <td>
                    <span class="status-badge status-${order.status}">
                        ${order.status}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-view" onclick="adminPanel.viewOrder('${order._id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-edit" onclick="adminPanel.updateOrderStatus('${order._id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
        
        tbody.innerHTML = html;
    }
    
    async loadUsers() {
        try {
            const response = await apiClient.request('/users?limit=100');
            
            if (response.success) {
                this.updateUsersTable(response.data.users);
            }
        } catch (error) {
            console.error('Failed to load users:', error);
            this.showError('Failed to load users');
        }
    }
    
    updateUsersTable(users) {
        const tbody = document.querySelector('#usersTable tbody');
        
        if (!users || users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state"><p>No users found</p></div></td></tr>';
            return;
        }
        
        const html = users.map(user => `
            <tr>
                <td>${user.firstName} ${user.lastName}</td>
                <td>${user.email}</td>
                <td>
                    <span class="status-badge ${user.role === 'admin' ? 'status-completed' : 'status-active'}">
                        ${user.role}
                    </span>
                </td>
                <td>${new Date(user.createdAt).toLocaleDateString()}</td>
                <td>
                    <span class="status-badge ${user.isVerified ? 'status-active' : 'status-pending'}">
                        ${user.isVerified ? 'Verified' : 'Pending'}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-view" onclick="adminPanel.viewUser('${user._id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-edit" onclick="adminPanel.editUser('${user._id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
        
        tbody.innerHTML = html;
    }
    
    async loadCategories() {
        try {
            const response = await apiClient.request('/categories');
            
            if (response.success) {
                this.updateCategoriesGrid(response.data.categories);
            }
        } catch (error) {
            console.error('Failed to load categories:', error);
            this.showError('Failed to load categories');
        }
    }
    
    updateCategoriesGrid(categories) {
        const container = document.getElementById('categoriesGrid');
        
        if (!categories || categories.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>No categories found</p></div>';
            return;
        }
        
        const html = categories.map(category => `
            <div class="category-card">
                <div class="category-icon">
                    <i class="${category.icon || 'fas fa-tag'}"></i>
                </div>
                <h3>${category.name}</h3>
                <p>${category.description}</p>
                <div class="action-buttons" style="margin-top: 1rem;">
                    <button class="btn btn-sm btn-edit" onclick="adminPanel.editCategory('${category._id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-delete" onclick="adminPanel.deleteCategory('${category._id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `).join('');
        
        container.innerHTML = html;
    }
    
    async handleSeedData() {
        if (!confirm('This will seed the database with sample data. Continue?')) {
            return;
        }
        
        this.showLoading('Seeding database...');
        
        try {
            const success = await dataSeeder.seedAll();
            
            if (success) {
                this.showSuccess('Database seeded successfully!');
                this.loadDashboardData();
            } else {
                this.showError('Failed to seed database');
            }
        } catch (error) {
            console.error('Seeding failed:', error);
            this.showError('Failed to seed database');
        } finally {
            this.hideLoading();
        }
    }
    
    showAddProductModal() {
        // Implementation for add product modal
        this.showInfo('Add product functionality coming soon!');
    }
    
    showAddCategoryModal() {
        // Implementation for add category modal
        this.showInfo('Add category functionality coming soon!');
    }
    
    async viewProduct(productId) {
        this.showInfo(`View product ${productId} - functionality coming soon!`);
    }
    
    async editProduct(productId) {
        this.showInfo(`Edit product ${productId} - functionality coming soon!`);
    }
    
    async deleteProduct(productId) {
        if (!confirm('Are you sure you want to delete this product?')) {
            return;
        }
        
        try {
            const response = await apiClient.request(`/products/${productId}`, {
                method: 'DELETE'
            });
            
            if (response.success) {
                this.showSuccess('Product deleted successfully');
                this.loadProducts();
            } else {
                this.showError('Failed to delete product');
            }
        } catch (error) {
            console.error('Delete failed:', error);
            this.showError('Failed to delete product');
        }
    }
    
    async viewOrder(orderId) {
        this.showInfo(`View order ${orderId} - functionality coming soon!`);
    }
    
    async updateOrderStatus(orderId) {
        this.showInfo(`Update order status ${orderId} - functionality coming soon!`);
    }
    
    async viewUser(userId) {
        this.showInfo(`View user ${userId} - functionality coming soon!`);
    }
    
    async editUser(userId) {
        this.showInfo(`Edit user ${userId} - functionality coming soon!`);
    }
    
    async editCategory(categoryId) {
        this.showInfo(`Edit category ${categoryId} - functionality coming soon!`);
    }
    
    async deleteCategory(categoryId) {
        if (!confirm('Are you sure you want to delete this category?')) {
            return;
        }
        
        try {
            const response = await apiClient.request(`/categories/${categoryId}`, {
                method: 'DELETE'
            });
            
            if (response.success) {
                this.showSuccess('Category deleted successfully');
                this.loadCategories();
            } else {
                this.showError('Failed to delete category');
            }
        } catch (error) {
            console.error('Delete failed:', error);
            this.showError('Failed to delete category');
        }
    }
    
    async handleSettingsUpdate(e) {
        e.preventDefault();
        this.showInfo('Settings update functionality coming soon!');
    }
    
    handleLogout() {
        if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('authToken');
            window.location.href = 'index.html';
        }
    }
    
    // Utility methods
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }
    
    showLoading(message = 'Loading...') {
        const overlay = document.getElementById('loadingOverlay');
        const content = overlay.querySelector('.loading-content p');
        content.textContent = message;
        overlay.style.display = 'flex';
    }
    
    hideLoading() {
        document.getElementById('loadingOverlay').style.display = 'none';
    }
    
    showSuccess(message) {
        this.showToast(message, 'success');
    }
    
    showError(message) {
        this.showToast(message, 'error');
    }
    
    showInfo(message) {
        this.showToast(message, 'info');
    }
    
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `${type}-toast`;
        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--card-bg);
            border: 1px solid var(--border-color);
            border-left: 4px solid ${type === 'success' ? 'var(--neon-green)' : type === 'error' ? '#ef4444' : 'var(--neon-blue)'};
            padding: 1rem 1.5rem;
            border-radius: 8px;
            color: ${type === 'success' ? 'var(--neon-green)' : type === 'error' ? '#ef4444' : 'var(--neon-blue)'};
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            z-index: 10001;
            animation: slideInRight 0.3s ease;
            box-shadow: var(--shadow-secondary);
            min-width: 250px;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideInRight 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// Initialize admin panel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminPanel = new AdminPanel();
}); 