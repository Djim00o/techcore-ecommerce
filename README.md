# TechCore E-commerce Website

A modern, full-featured e-commerce website for computer components and electronics, built with a comprehensive admin panel and MongoDB backend.

## Features

### Frontend Features
- **Dynamic Content Management**: All text content managed through centralized content.json file
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
- **Admin Panel**: Full-featured admin dashboard for managing products, users, orders, and analytics
- **Security**: JWT authentication, rate limiting, input validation
- **Logging**: Comprehensive request and error logging
- **Documentation**: Auto-generated API documentation with Swagger

### Admin Panel Features
- **Dashboard**: Real-time analytics and statistics
- **Product Management**: Create, edit, delete, and manage product inventory
- **Order Management**: View and update order statuses
- **User Management**: View and manage user accounts
- **Category Management**: Organize products into categories
- **Data Seeding**: One-click database seeding with sample data
- **Authentication**: Secure admin-only access with role-based permissions

## Tech Stack

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

## Project Structure

```
TechCore/
├── index.html                  # Homepage
├── category.html              # Category/product listing page
├── cart.html                  # Shopping cart page
├── product.html               # Product detail page
├── admin.html                 # Admin panel
├── fix-admin-auth.html        # Admin authentication utility
├── content.json               # Centralized content management
├── css/
│   ├── style.css             # Main styles
│   ├── category.css          # Category page styles
│   ├── cart.css              # Cart page styles
│   ├── product.css           # Product detail styles
│   └── admin.css             # Admin panel styles
├── js/
│   ├── content-manager.js    # Content management system
│   ├── script.js             # Main JavaScript
│   ├── category.js           # Category page functionality
│   ├── cart.js               # Cart functionality
│   ├── product.js            # Product detail functionality
│   ├── admin.js              # Admin panel functionality
│   ├── api-client.js         # API communication layer
│   └── data-seeder.js        # Database seeding utility
└── server/
    ├── server.js             # Main server file
    ├── package.json          # Dependencies
    ├── .env                  # Environment variables (not in repo)
    ├── env.example           # Environment variables template
    ├── config/
    │   └── database.js       # Database configuration
    ├── models/
    │   ├── User.js           # User model
    │   ├── Product.js        # Product model
    │   ├── Order.js          # Order model
    │   └── Category.js       # Category model
    ├── routes/
    │   ├── auth.js           # Authentication routes
    │   ├── products.js       # Product routes
    │   ├── cart.js           # Cart routes
    │   ├── wishlist.js       # Wishlist routes
    │   ├── categories.js     # Category routes
    │   ├── orders.js         # Order routes
    │   ├── users.js          # User management routes
    │   ├── analytics.js      # Analytics routes
    │   └── search.js         # Search routes
    ├── middleware/
    │   ├── auth.js           # Authentication middleware
    │   ├── errorHandler.js   # Error handling
    │   └── logger.js         # Request logging
    └── scripts/
        └── create-admin.js   # Admin user creation script
```

## Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/djim00o/techcore-ecommerce.git
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
   JWT_SECRET=your-super-secure-jwt-secret-key-here
   FRONTEND_URL=http://localhost:8080
   ```

4. **Start MongoDB**
   ```bash
   # If using local MongoDB
   mongod
   ```

5. **Start the backend server**
   ```bash
   npm start
   ```

6. **Start the frontend server**
   ```bash
   # In the project root directory
   python3 -m http.server 8080
   # or use Live Server extension in VS Code
   ```

7. **Create admin user**
   ```bash
   # In server directory
   node scripts/create-admin.js
   ```

### Access Points
- **Main Website**: http://localhost:8080/index.html
- **Admin Panel**: http://localhost:8080/admin.html
- **API Documentation**: http://localhost:5234/api-docs
- **Health Check**: http://localhost:5234/health

### Default Admin Credentials
- **Email**: admin@techcore.com
- **Password**: admin123456

## API Documentation

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

### Category Endpoints
- `GET /categories` - Get all categories
- `GET /categories/:id` - Get single category
- `POST /categories` - Create category (Admin only)
- `PUT /categories/:id` - Update category (Admin only)
- `DELETE /categories/:id` - Delete category (Admin only)

### Cart Endpoints
- `GET /cart` - Get user's cart
- `POST /cart/add` - Add item to cart
- `PUT /cart/update` - Update cart item
- `DELETE /cart/remove` - Remove item from cart
- `DELETE /cart/clear` - Clear entire cart

### Admin Endpoints
- `GET /users` - Get all users (Admin only)
- `GET /orders` - Get all orders (Admin only)
- `GET /analytics/dashboard` - Get dashboard analytics (Admin only)

### Interactive API Documentation
When running in development mode, visit:
```
http://localhost:5234/api-docs
```

## Admin Panel Usage

### Accessing the Admin Panel
1. Navigate to `http://localhost:8080/admin.html`
2. Login with admin credentials
3. If authentication issues occur, use the fix utility at `http://localhost:8080/fix-admin-auth.html`

### Admin Features
- **Dashboard**: View real-time statistics including revenue, orders, products, and users
- **Product Management**: Add, edit, delete products with full specification management
- **Order Management**: View and update order statuses
- **User Management**: View user accounts and manage permissions
- **Category Management**: Organize products into categories
- **Data Seeding**: Populate database with sample products and categories

## Content Management

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

## Configuration

### Environment Variables
Key environment variables (see `env.example` for full list):

- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 5234)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret
- `FRONTEND_URL` - Frontend URL for CORS
- `BCRYPT_ROUNDS` - Password hashing rounds (default: 12)
- `RATE_LIMIT_WINDOW_MS` - Rate limiting window (default: 900000)
- `RATE_LIMIT_MAX_REQUESTS` - Max requests per window (default: 100)

### Database Configuration
The application automatically connects to MongoDB using the provided URI. Collections are created automatically when first used.

## Security Features

- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - bcrypt with configurable rounds
- **Rate Limiting** - Prevents abuse and DDoS attacks
- **Input Validation** - Server-side validation for all inputs
- **CORS Protection** - Configurable cross-origin resource sharing
- **Security Headers** - Helmet.js for secure HTTP headers
- **Role-based Access Control** - Admin and user role separation
- **Error Handling** - Secure error responses without sensitive data

## Deployment

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
   JWT_SECRET=your-secure-production-secret-minimum-32-characters
   ```

4. **Configure CORS for production**
   ```env
   FRONTEND_URL=https://your-domain.com
   ```

5. **Build and start**
   ```bash
   npm start
   ```

### Recommended Hosting
- **Frontend**: Netlify, Vercel, or GitHub Pages
- **Backend**: Heroku, DigitalOcean, Railway, or AWS
- **Database**: MongoDB Atlas

## Testing

### Manual Testing
1. Start the server: `npm start`
2. Open frontend in browser
3. Test user registration and login
4. Test product browsing and search
5. Test cart functionality
6. Test admin panel access and features
7. Test API endpoints with Postman

### API Testing
Use the Swagger documentation at `/api-docs` for interactive testing.

## Troubleshooting

### Common Issues

1. **Server won't start**
   - Check MongoDB is running
   - Verify environment variables in `.env`
   - Ensure port 5234 is not in use

2. **Admin login fails**
   - Use the fix utility at `/fix-admin-auth.html`
   - Verify admin user exists in database
   - Check JWT secret configuration

3. **CORS errors**
   - Verify `FRONTEND_URL` in environment variables
   - Check server CORS configuration

4. **Database connection fails**
   - Verify MongoDB URI format
   - Check database server status
   - Ensure network connectivity

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

### Development Guidelines
- Follow existing code style and conventions
- Add comments for complex functionality
- Test changes thoroughly before submitting
- Update documentation as needed

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

If you encounter any issues:

1. Check the console for error messages
2. Verify MongoDB is running
3. Ensure all environment variables are set
4. Check the server logs
5. Review API documentation at `/api-docs`
6. Use the admin authentication fix utility if needed

## Roadmap

- [ ] Payment integration (Stripe/PayPal)
- [ ] Email notifications
- [ ] Product image uploads with Cloudinary
- [ ] Advanced search filters
- [ ] Product recommendations
- [ ] Multi-language support
- [ ] Unit and integration tests
- [ ] Docker containerization
- [ ] CI/CD pipeline
- [ ] Performance optimization

## Acknowledgments

- Design inspiration from modern e-commerce platforms
- Icons from FontAwesome
- Fonts from Google Fonts
- MongoDB and Express.js communities
- Open source contributors

---

Built for the tech community
