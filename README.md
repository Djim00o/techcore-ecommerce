# TechCore E-commerce Website

A modern, full-featured e-commerce website for computer components and electronics, built with a dynamic content management system and MongoDB backend.

## 🚀 Features

### Frontend Features
- **Dynamic Content Management**: All text content managed through centralized `content.json` file
- **Responsive Design**: Mobile-first design with modern glassmorphism UI
- **Product Catalog**: Comprehensive product listing with filtering, sorting, and search
- **Shopping Cart**: Full cart functionality with local storage persistence
- **Product Details**: Detailed product pages with image galleries, specifications, and reviews
- **User Authentication**: Registration, login, and account management
- **Wishlist**: Save products for later
- **Modern UI/UX**: Dark theme with neon accents and smooth animations

### Backend Features
- **RESTful API**: Comprehensive API for all e-commerce operations
- **User Management**: Authentication, authorization, and user profiles
- **Product Management**: CRUD operations for products with advanced search
- **Order Management**: Complete order processing and tracking system
- **Security**: JWT authentication, rate limiting, input validation
- **Logging**: Comprehensive request and error logging
- **Documentation**: Auto-generated API documentation with Swagger

## 🛠 Tech Stack

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Modern styling with custom properties
- **JavaScript (ES6+)** - Modern JavaScript features
- **FontAwesome** - Icon library
- **Google Fonts** - Typography

### Backend
- **Node.js** - Server runtime
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **express-validator** - Input validation
- **helmet** - Security headers
- **cors** - Cross-origin resource sharing
- **express-rate-limit** - Rate limiting

## 📁 Project Structure

```
TechCore/
├── index.html              # Homepage
├── category.html           # Category/product listing page
├── cart.html              # Shopping cart page
├── product.html           # Product detail page
├── content.json           # Centralized content management
├── css/
│   ├── style.css          # Main styles
│   ├── category.css       # Category page styles
│   ├── cart.css          # Cart page styles
│   └── product.css       # Product detail styles
├── js/
│   ├── content-manager.js # Content management system
│   ├── script.js         # Main JavaScript
│   ├── category.js       # Category page functionality
│   ├── cart.js           # Cart functionality
│   └── product.js        # Product detail functionality
└── server/
    ├── server.js         # Main server file
    ├── package.json      # Dependencies
    ├── env.example       # Environment variables template
    ├── config/
    │   └── database.js   # Database configuration
    ├── models/
    │   ├── User.js       # User model
    │   ├── Product.js    # Product model
    │   └── Order.js      # Order model
    ├── routes/
    │   ├── auth.js       # Authentication routes
    │   ├── products.js   # Product routes
    │   ├── cart.js       # Cart routes
    │   └── wishlist.js   # Wishlist routes
    └── middleware/
        ├── auth.js       # Authentication middleware
        ├── errorHandler.js # Error handling
        └── logger.js     # Request logging
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/techcore-ecommerce.git
   cd techcore-ecommerce
   ```

2. **Install server dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Setup environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   NODE_ENV=development
   PORT=5234
   MONGODB_URI=mongodb://localhost:27017/techcore_ecommerce
   JWT_SECRET=your-super-secure-jwt-secret
   # ... see env.example for all options
   ```

4. **Start MongoDB**
   ```bash
   # If using local MongoDB
   mongod
   ```

5. **Start the server**
   ```bash
   npm run dev
   # or
   npm start
   ```

6. **Open the frontend**
   - Open `index.html` in your browser
   - Or use a local server like Live Server for VS Code
   - Or serve with Python: `python -m http.server 3000`

## 📖 API Documentation

### Base URL
```
http://localhost:5234/api
```

### Authentication Endpoints
- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `GET /auth/me` - Get current user profile
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password

### Product Endpoints
- `GET /products` - Get all products (with filtering)
- `GET /products/:id` - Get single product
- `POST /products` - Create product (Admin only)
- `PUT /products/:id` - Update product (Admin only)
- `DELETE /products/:id` - Delete product (Admin only)
- `GET /products/search?q=query` - Search products
- `POST /products/:id/reviews` - Add product review

### Cart Endpoints
- `GET /cart` - Get user's cart
- `POST /cart/add` - Add item to cart
- `PUT /cart/update` - Update cart item
- `DELETE /cart/remove` - Remove item from cart
- `DELETE /cart/clear` - Clear entire cart

### Wishlist Endpoints
- `GET /wishlist` - Get user's wishlist
- `POST /wishlist/add` - Add item to wishlist
- `DELETE /wishlist/remove` - Remove item from wishlist

### Interactive API Documentation
When running in development mode, visit:
```
http://localhost:5234/api-docs
```

## 🎨 Content Management

The website uses a centralized content management system through `content.json`. This allows easy modification of all text content without touching HTML files.

### Structure
```json
{
  "site": {
    "name": "TechCore",
    "tagline": "Premium PC Components & Gaming Hardware"
  },
  "navigation": {
    "home": "Home",
    "components": "Components"
  },
  "categories": {
    "graphics-cards": {
      "name": "Graphics Cards",
      "description": "High-performance GPUs"
    }
  }
}
```

### Usage
Content is automatically loaded and applied to elements with `data-content` attributes:
```html
<h1 data-content="site.name">TechCore</h1>
<p data-content="categories.graphics-cards.description">High-performance GPUs</p>
```

## 🔧 Configuration

### Environment Variables
Key environment variables (see `env.example` for full list):

- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 5234)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret
- `FRONTEND_URL` - Frontend URL for CORS

### Database Configuration
The application automatically connects to MongoDB using the provided URI. Collections are created automatically when first used.

### Default Admin User
On first run with `SEED_DATABASE=true`, an admin user is created:
- Email: admin@techcore.com
- Password: Admin123!

## 🔒 Security Features

- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - bcrypt with configurable rounds
- **Rate Limiting** - Prevents abuse and DDoS attacks
- **Input Validation** - Server-side validation for all inputs
- **CORS Protection** - Configurable cross-origin resource sharing
- **Security Headers** - Helmet.js for secure HTTP headers
- **Error Handling** - Secure error responses without sensitive data

## 🚀 Deployment

### Production Setup

1. **Set environment to production**
   ```env
   NODE_ENV=production
   ```

2. **Use production database**
   ```env
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/techcore
   ```

3. **Secure JWT secrets**
   ```env
   JWT_SECRET=your-secure-production-secret
   ```

4. **Build and start**
   ```bash
   npm run build
   npm start
   ```

### Recommended Hosting
- **Frontend**: Netlify, Vercel, or GitHub Pages
- **Backend**: Heroku, DigitalOcean, or AWS
- **Database**: MongoDB Atlas

## 🧪 Testing

### Manual Testing
1. Start the server: `npm start`
2. Open frontend in browser
3. Test user registration and login
4. Test product browsing and search
5. Test cart functionality
6. Test API endpoints with Postman

### API Testing
Use the Swagger documentation at `/api-docs` for interactive testing.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter any issues:

1. Check the console for error messages
2. Verify MongoDB is running
3. Ensure all environment variables are set
4. Check the server logs
5. Review API documentation at `/api-docs`

## 📋 Todo/Roadmap

- [ ] Order management system
- [ ] Payment integration (Stripe)
- [ ] Email notifications
- [ ] Admin dashboard
- [ ] Product image uploads
- [ ] Advanced search filters
- [ ] Product recommendations
- [ ] Reviews and ratings
- [ ] Multi-language support
- [ ] Unit and integration tests

## 🎉 Acknowledgments

- Design inspiration from modern e-commerce platforms
- Icons from FontAwesome
- Fonts from Google Fonts
- Community feedback and contributions

---

Built with ❤️ for the tech community 