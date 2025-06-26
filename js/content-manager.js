// Content Manager - Dynamic Text Management System
class ContentManager {
    constructor() {
        this.content = null;
        this.isLoaded = false;
        this.loadPromise = null;
        this.currentLanguage = 'en';
        this.fallbackLanguage = 'en';
    }
    
    // Load content from JSON file
    async loadContent(language = 'en') {
        if (this.loadPromise && this.currentLanguage === language) {
            return this.loadPromise;
        }
        
        this.currentLanguage = language;
        this.loadPromise = this.fetchContent(language);
        
        try {
            const data = await this.loadPromise;
            this.content = data;
            this.isLoaded = true;
            this.updatePageContent();
            return data;
        } catch (error) {
            console.error('Error loading content:', error);
            // Try fallback language if current language fails
            if (language !== this.fallbackLanguage) {
                return this.loadContent(this.fallbackLanguage);
            }
            throw error;
        }
    }
    
    async fetchContent(language) {
        const contentFile = language === 'en' ? 'content.json' : `content-${language}.json`;
        
        const response = await fetch(contentFile);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return response.json();
    }
    
    // Get content by path (e.g., 'site.name' or 'navigation.home')
    get(path, fallback = '') {
        if (!this.content) {
            console.warn('Content not loaded yet');
            return fallback;
        }
        
        const keys = path.split('.');
        let value = this.content;
        
        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            } else {
                console.warn(`Content path '${path}' not found`);
                return fallback;
            }
        }
        
        return value;
    }
    
    // Get content with variable substitution
    getText(path, variables = {}, fallback = '') {
        let text = this.get(path, fallback);
        
        if (typeof text === 'string' && Object.keys(variables).length > 0) {
            text = this.substituteVariables(text, variables);
        }
        
        return text;
    }
    
    // Substitute variables in text (e.g., "Hello {name}" with {name: "John"})
    substituteVariables(text, variables) {
        return text.replace(/\{(\w+)\}/g, (match, key) => {
            return variables.hasOwnProperty(key) ? variables[key] : match;
        });
    }
    
    // Update page content automatically based on data attributes
    updatePageContent() {
        const elements = document.querySelectorAll('[data-content]');
        
        elements.forEach(element => {
            const contentPath = element.getAttribute('data-content');
            const variables = this.parseDataVariables(element);
            const content = this.getText(contentPath, variables);
            
            if (content) {
                const contentType = element.getAttribute('data-content-type') || 'text';
                this.setElementContent(element, content, contentType);
            }
        });
    }
    
    // Parse data variables from element attributes
    parseDataVariables(element) {
        const variables = {};
        const attributes = element.attributes;
        
        for (let i = 0; i < attributes.length; i++) {
            const attr = attributes[i];
            if (attr.name.startsWith('data-var-')) {
                const varName = attr.name.replace('data-var-', '');
                variables[varName] = attr.value;
            }
        }
        
        return variables;
    }
    
    // Set element content based on type
    setElementContent(element, content, type) {
        switch (type) {
            case 'html':
                element.innerHTML = content;
                break;
            case 'placeholder':
                element.placeholder = content;
                break;
            case 'title':
                element.title = content;
                break;
            case 'alt':
                element.alt = content;
                break;
            case 'value':
                element.value = content;
                break;
            default:
                element.textContent = content;
        }
    }
    
    // Initialize content management for the page
    async init() {
        try {
            await this.loadContent();
            this.setupLanguageDetection();
            this.setupContentObserver();
            console.log('✅ Content Manager initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize Content Manager:', error);
        }
    }
    
    // Detect user's preferred language
    setupLanguageDetection() {
        // Check URL parameter
        const urlParams = new URLSearchParams(window.location.search);
        const urlLang = urlParams.get('lang');
        
        if (urlLang) {
            this.switchLanguage(urlLang);
            return;
        }
        
        // Check localStorage
        const savedLang = localStorage.getItem('preferred-language');
        if (savedLang) {
            this.switchLanguage(savedLang);
            return;
        }
        
        // Check browser language
        const browserLang = navigator.language.split('-')[0];
        if (browserLang !== 'en') {
            this.switchLanguage(browserLang);
        }
    }
    
    // Setup observer for dynamically added content
    setupContentObserver() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const elements = node.querySelectorAll ? 
                            node.querySelectorAll('[data-content]') : [];
                        
                        if (node.hasAttribute && node.hasAttribute('data-content')) {
                            elements.push(node);
                        }
                        
                        elements.forEach(element => {
                            const contentPath = element.getAttribute('data-content');
                            const variables = this.parseDataVariables(element);
                            const content = this.getText(contentPath, variables);
                            
                            if (content) {
                                const contentType = element.getAttribute('data-content-type') || 'text';
                                this.setElementContent(element, content, contentType);
                            }
                        });
                    }
                });
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    // Switch language
    async switchLanguage(language) {
        if (language === this.currentLanguage) {
            return;
        }
        
        try {
            await this.loadContent(language);
            localStorage.setItem('preferred-language', language);
            
            // Update URL without reload
            const url = new URL(window.location);
            url.searchParams.set('lang', language);
            window.history.replaceState({}, '', url);
            
            // Trigger language change event
            window.dispatchEvent(new CustomEvent('languageChanged', {
                detail: { language, content: this.content }
            }));
            
        } catch (error) {
            console.error('Failed to switch language:', error);
        }
    }
    
    // Get available languages
    getAvailableLanguages() {
        // This would typically be fetched from your backend
        return [
            { code: 'en', name: 'English', flag: '🇺🇸' },
            { code: 'es', name: 'Español', flag: '🇪🇸' },
            { code: 'fr', name: 'Français', flag: '🇫🇷' },
            { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
            { code: 'ja', name: '日本語', flag: '🇯🇵' }
        ];
    }
    
    // Helper method to update specific elements
    updateElement(selector, contentPath, variables = {}) {
        const element = document.querySelector(selector);
        if (element) {
            const content = this.getText(contentPath, variables);
            if (content) {
                const contentType = element.getAttribute('data-content-type') || 'text';
                this.setElementContent(element, content, contentType);
            }
        }
    }
    
    // Helper method to update multiple elements
    updateElements(selector, contentPath, variables = {}) {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
            const content = this.getText(contentPath, variables);
            if (content) {
                const contentType = element.getAttribute('data-content-type') || 'text';
                this.setElementContent(element, content, contentType);
            }
        });
    }
    
    // Format price with currency
    formatPrice(amount, currency = 'USD', locale = null) {
        if (!locale) {
            locale = this.currentLanguage === 'en' ? 'en-US' : this.currentLanguage;
        }
        
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency
        }).format(amount);
    }
    
    // Format date based on current language
    formatDate(date, options = {}) {
        const locale = this.currentLanguage === 'en' ? 'en-US' : this.currentLanguage;
        const defaultOptions = {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        
        return new Intl.DateTimeFormat(locale, { ...defaultOptions, ...options })
            .format(new Date(date));
    }
    
    // Format number based on current language
    formatNumber(number, options = {}) {
        const locale = this.currentLanguage === 'en' ? 'en-US' : this.currentLanguage;
        return new Intl.NumberFormat(locale, options).format(number);
    }
    
    // Get category display name
    getCategoryName(categoryKey) {
        return this.get(`categories.${categoryKey}.name`, categoryKey);
    }
    
    // Get category description
    getCategoryDescription(categoryKey) {
        return this.get(`categories.${categoryKey}.description`, '');
    }
    
    // Get category icon
    getCategoryIcon(categoryKey) {
        return this.get(`categories.${categoryKey}.icon`, 'fas fa-cube');
    }
    
    // Validate content structure
    validateContent(content) {
        const requiredPaths = [
            'site.name',
            'navigation.home',
            'categories',
            'homepage.hero.title'
        ];
        
        for (const path of requiredPaths) {
            const value = this.getValueByPath(content, path);
            if (value === undefined) {
                console.warn(`Missing required content path: ${path}`);
                return false;
            }
        }
        
        return true;
    }
    
    getValueByPath(obj, path) {
        const keys = path.split('.');
        let value = obj;
        
        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            } else {
                return undefined;
            }
        }
        
        return value;
    }
    
    // Debug method to log all content
    logContent() {
        console.table(this.content);
    }
    
    // Check if content is loaded
    isContentLoaded() {
        return this.isLoaded && this.content !== null;
    }
    
    // Get current language
    getCurrentLanguage() {
        return this.currentLanguage;
    }
    
    // Preload content for better performance
    async preloadLanguages(languages = []) {
        const promises = languages.map(lang => {
            if (lang !== this.currentLanguage) {
                return this.fetchContent(lang).catch(err => {
                    console.warn(`Failed to preload ${lang}:`, err);
                    return null;
                });
            }
            return Promise.resolve(null);
        });
        
        await Promise.all(promises);
    }
}

// Create global instance
window.contentManager = new ContentManager();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.contentManager.init();
    });
} else {
    window.contentManager.init();
}

// Language switcher component
class LanguageSwitcher {
    constructor(container) {
        this.container = container;
        this.render();
    }
    
    render() {
        const languages = window.contentManager.getAvailableLanguages();
        const currentLang = window.contentManager.getCurrentLanguage();
        
        this.container.innerHTML = `
            <div class="language-switcher">
                <button class="lang-current" id="langCurrent">
                    ${languages.find(l => l.code === currentLang)?.flag || '🌐'} 
                    ${currentLang.toUpperCase()}
                    <i class="fas fa-chevron-down"></i>
                </button>
                <div class="lang-dropdown" id="langDropdown">
                    ${languages.map(lang => `
                        <button class="lang-option ${lang.code === currentLang ? 'active' : ''}" 
                                data-lang="${lang.code}">
                            ${lang.flag} ${lang.name}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        const currentBtn = this.container.querySelector('#langCurrent');
        const dropdown = this.container.querySelector('#langDropdown');
        const options = this.container.querySelectorAll('.lang-option');
        
        currentBtn.addEventListener('click', () => {
            dropdown.classList.toggle('show');
        });
        
        options.forEach(option => {
            option.addEventListener('click', () => {
                const lang = option.dataset.lang;
                window.contentManager.switchLanguage(lang);
                dropdown.classList.remove('show');
                this.render(); // Re-render to update current language
            });
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.container.contains(e.target)) {
                dropdown.classList.remove('show');
            }
        });
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ContentManager, LanguageSwitcher };
} 