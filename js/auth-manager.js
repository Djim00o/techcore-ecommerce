/**
 * TechCore Centralized Authentication Manager
 * Handles authentication state and UI updates across all pages
 */
class AuthManager {
    constructor() {
        this.apiClient = window.apiClient || new APIClient();
        this.currentUser = null;
        this.authCallbacks = [];
        this.init();
    }

    async init() {
        // Check for existing auth token
        const token = localStorage.getItem('authToken');
        const userStr = localStorage.getItem('user');
        
        if (token && userStr) {
            try {
                this.currentUser = JSON.parse(userStr);
                // Verify token is still valid
                await this.verifyAuth();
            } catch (error) {
                console.error('Auth verification failed:', error);
                this.logout();
            }
        }
        
        this.updateAuthUI();
        this.bindEvents();
    }

    async verifyAuth() {
        try {
            const response = await this.apiClient.request('/auth/me');
            if (response.success) {
                this.currentUser = response.user;
                localStorage.setItem('user', JSON.stringify(this.currentUser));
                return true;
            }
        } catch (error) {
            console.error('Auth verification error:', error);
            this.logout();
            return false;
        }
    }

    bindEvents() {
        // Bind authentication modal events
        document.addEventListener('click', (e) => {
            if (e.target.id === 'loginBtn' || e.target.closest('#loginBtn')) {
                this.showLoginModal();
            }
            if (e.target.id === 'registerBtn' || e.target.closest('#registerBtn')) {
                this.showRegisterModal();
            }
            if (e.target.id === 'logoutBtn' || e.target.closest('#logoutBtn')) {
                this.logout();
            }
            if (e.target.classList.contains('auth-modal-close') || e.target.closest('.auth-modal-close')) {
                this.closeAuthModal();
            }
        });

        // Close modal on outside click
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('auth-modal')) {
                this.closeAuthModal();
            }
        });

        // Handle form submissions
        document.addEventListener('submit', (e) => {
            if (e.target.id === 'loginForm') {
                e.preventDefault();
                this.handleLogin(e);
            }
            if (e.target.id === 'registerForm') {
                e.preventDefault();
                this.handleRegister(e);
            }
        });
    }

    updateAuthUI() {
        const authButtons = document.querySelector('.auth-buttons');
        const userMenu = document.querySelector('.user-menu');
        const adminBtn = document.getElementById('adminBtn');
        
        if (this.isLoggedIn()) {
            // Show user menu, hide auth buttons
            if (authButtons) authButtons.style.display = 'none';
            if (userMenu) {
                userMenu.style.display = 'flex';
                const userName = userMenu.querySelector('.user-name');
                if (userName) {
                    userName.textContent = this.currentUser.firstName || this.currentUser.email;
                }
            }
            
            // Show admin button for admin users
            if (adminBtn && this.isAdmin()) {
                adminBtn.style.display = 'inline-flex';
            } else if (adminBtn) {
                adminBtn.style.display = 'none';
            }
        } else {
            // Show auth buttons, hide user menu
            if (authButtons) authButtons.style.display = 'flex';
            if (userMenu) userMenu.style.display = 'none';
            if (adminBtn) adminBtn.style.display = 'none';
        }

        // Notify callbacks
        this.authCallbacks.forEach(callback => callback(this.currentUser));
    }

    showLoginModal() {
        this.createAuthModal('login');
    }

    showRegisterModal() {
        this.createAuthModal('register');
    }

    createAuthModal(type) {
        // Remove existing modal
        const existingModal = document.querySelector('.auth-modal');
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.className = 'auth-modal';
        modal.innerHTML = this.getModalHTML(type);
        document.body.appendChild(modal);

        // Animate in
        requestAnimationFrame(() => {
            modal.classList.add('active');
        });

        // Focus on first input
        setTimeout(() => {
            const firstInput = modal.querySelector('input');
            if (firstInput) firstInput.focus();
        }, 100);
    }

    getModalHTML(type) {
        const isLogin = type === 'login';
        return `
            <div class="auth-modal-content">
                <div class="auth-modal-header">
                    <h2>${isLogin ? 'Sign In' : 'Create Account'}</h2>
                    <button class="auth-modal-close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <form id="${isLogin ? 'loginForm' : 'registerForm'}" class="auth-form">
                    ${!isLogin ? `
                        <div class="form-row">
                            <div class="form-group">
                                <input type="text" name="firstName" placeholder="First Name" required>
                            </div>
                            <div class="form-group">
                                <input type="text" name="lastName" placeholder="Last Name" required>
                            </div>
                        </div>
                    ` : ''}
                    
                    <div class="form-group">
                        <input type="email" name="email" placeholder="Email Address" required>
                    </div>
                    
                    <div class="form-group">
                        <input type="password" name="password" placeholder="Password" required>
                        <div class="password-requirements" ${isLogin ? 'style="display:none"' : ''}>
                            <small>Password must be at least 8 characters long</small>
                        </div>
                    </div>
                    
                    ${!isLogin ? `
                        <div class="form-group">
                            <input type="password" name="confirmPassword" placeholder="Confirm Password" required>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <input type="text" name="phone" placeholder="Phone Number">
                            </div>
                            <div class="form-group">
                                <input type="text" name="zipCode" placeholder="ZIP Code" required>
                            </div>
                        </div>
                    ` : ''}
                    
                    <div class="form-group">
                        <button type="submit" class="btn btn-primary auth-submit-btn">
                            <span class="btn-text">${isLogin ? 'Sign In' : 'Create Account'}</span>
                            <div class="btn-loader" style="display: none;">
                                <div class="spinner"></div>
                            </div>
                        </button>
                    </div>
                    
                    <div class="auth-switch">
                        <p>
                            ${isLogin ? "Don't have an account?" : "Already have an account?"}
                            <button type="button" class="auth-switch-btn" onclick="authManager.${isLogin ? 'showRegisterModal' : 'showLoginModal'}()">
                                ${isLogin ? 'Sign Up' : 'Sign In'}
                            </button>
                        </p>
                    </div>
                </form>
                
                <div class="auth-error" style="display: none;"></div>
            </div>
        `;
    }

    async handleLogin(e) {
        const form = e.target;
        const submitBtn = form.querySelector('.auth-submit-btn');
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoader = submitBtn.querySelector('.btn-loader');
        const errorDiv = form.parentElement.querySelector('.auth-error');

        try {
            // Show loading state
            btnText.style.display = 'none';
            btnLoader.style.display = 'flex';
            submitBtn.disabled = true;
            errorDiv.style.display = 'none';

            const formData = new FormData(form);
            const loginData = {
                email: formData.get('email'),
                password: formData.get('password')
            };

            const response = await this.apiClient.login(loginData.email, loginData.password);
            
            if (response.success) {
                this.currentUser = response.user;
                this.updateAuthUI();
                this.closeAuthModal();
                this.showSuccessToast('Successfully signed in!');
                
                // Redirect to admin if admin user came from admin page
                if (this.isAdmin() && window.location.pathname.includes('admin')) {
                    window.location.reload();
                }
            } else {
                throw new Error(response.message || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            errorDiv.textContent = error.message || 'Login failed. Please try again.';
            errorDiv.style.display = 'block';
        } finally {
            // Reset button state
            btnText.style.display = 'inline';
            btnLoader.style.display = 'none';
            submitBtn.disabled = false;
        }
    }

    async handleRegister(e) {
        const form = e.target;
        const submitBtn = form.querySelector('.auth-submit-btn');
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoader = submitBtn.querySelector('.btn-loader');
        const errorDiv = form.parentElement.querySelector('.auth-error');

        try {
            // Show loading state
            btnText.style.display = 'none';
            btnLoader.style.display = 'flex';
            submitBtn.disabled = true;
            errorDiv.style.display = 'none';

            const formData = new FormData(form);
            
            // Validate passwords match
            if (formData.get('password') !== formData.get('confirmPassword')) {
                throw new Error('Passwords do not match');
            }

            const registerData = {
                firstName: formData.get('firstName'),
                lastName: formData.get('lastName'),
                email: formData.get('email'),
                password: formData.get('password'),
                phone: formData.get('phone'),
                zipCode: formData.get('zipCode')
            };

            const response = await this.apiClient.register(registerData);
            
            if (response.success) {
                this.currentUser = response.user;
                this.updateAuthUI();
                this.closeAuthModal();
                this.showSuccessToast('Account created successfully! Welcome to TechCore!');
            } else {
                throw new Error(response.message || 'Registration failed');
            }
        } catch (error) {
            console.error('Registration error:', error);
            errorDiv.textContent = error.message || 'Registration failed. Please try again.';
            errorDiv.style.display = 'block';
        } finally {
            // Reset button state
            btnText.style.display = 'inline';
            btnLoader.style.display = 'none';
            submitBtn.disabled = false;
        }
    }

    closeAuthModal() {
        const modal = document.querySelector('.auth-modal');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300);
        }
    }

    async logout() {
        try {
            await this.apiClient.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            this.currentUser = null;
            this.updateAuthUI();
            this.showSuccessToast('Successfully signed out');
            
            // Redirect if on admin page
            if (window.location.pathname.includes('admin')) {
                window.location.href = 'index.html';
            }
        }
    }

    // Utility methods
    isLoggedIn() {
        return !!this.currentUser && !!localStorage.getItem('authToken');
    }

    isAdmin() {
        return this.isLoggedIn() && this.currentUser.role === 'admin';
    }

    getCurrentUser() {
        return this.currentUser;
    }

    requireAuth() {
        if (!this.isLoggedIn()) {
            this.showLoginModal();
            return false;
        }
        return true;
    }

    requireAdmin() {
        if (!this.isAdmin()) {
            this.showAccessDenied();
            return false;
        }
        return true;
    }

    showAccessDenied() {
        const modal = document.createElement('div');
        modal.className = 'auth-modal active';
        modal.innerHTML = `
            <div class="auth-modal-content">
                <div class="access-denied">
                    <i class="fas fa-shield-alt"></i>
                    <h2>Access Denied</h2>
                    <p>You need administrator privileges to access this page.</p>
                    <div class="access-denied-actions">
                        <button class="btn btn-primary" onclick="authManager.showLoginModal()">Sign In</button>
                        <button class="btn btn-outline" onclick="window.location.href='index.html'">Go Home</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    // Callback system for auth state changes
    onAuthChange(callback) {
        this.authCallbacks.push(callback);
    }

    removeAuthCallback(callback) {
        const index = this.authCallbacks.indexOf(callback);
        if (index > -1) {
            this.authCallbacks.splice(index, 1);
        }
    }

    // Toast notifications
    showSuccessToast(message) {
        this.showToast(message, 'success');
    }

    showErrorToast(message) {
        this.showToast(message, 'error');
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        requestAnimationFrame(() => {
            toast.classList.add('active');
        });
        
        setTimeout(() => {
            toast.classList.remove('active');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// Initialize global auth manager
window.authManager = new AuthManager(); 