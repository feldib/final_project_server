# E-Commerce Backend Server

This is the backend server for the full-stack e-commerce project built with Node.js, Express, and TypeScript. It provides both REST API endpoints and a GraphQL API to support a robust, scalable application.

The server features include:

- **REST API Endpoints:** Structured routes for handling products, users, admins, orders, and more.
- **GraphQL API:** Flexible and efficient data retrieval for various client needs.
- **Redis Caching:** High-performance caching layer for improved response times and reduced database load.
- **DeepL Translation API:** Automatic text translation service supporting multiple languages.
- **Express Routing:** Clean and modular routing approach for easy scalability and maintenance.
- **Database Integration:** Robust connection management for reliable data storage and retrieval.
- **Docker Support:** Containerized setup for streamlined deployment and scalability.
- **Full-Stack Integration:** A crucial part of the complete full-stack project.

## Main API Routes

- **Core (`/`)**: Authentication, artworks, categories, reviews with Redis caching
- **Users (`/users`)**: Registration, profiles, wishlist, shopping cart, orders
- **Admin (`/admin`)**: Artwork management, user administration, analytics
- **Translation (`/api`)**: DeepL text translation and language support
- **GraphQL (`/graphql-search`)**: Advanced search with flexible data retrieval

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Set up your environment variables using `.env.example` as a reference.

3. Run the server in development mode:

   ```bash
   npm run dev
   ```

## Available Scripts

- **npm run dev:** Runs the server in development mode.
- **npm run build:** Compiles the TypeScript code.
- **npm start:** Starts the server in production mode.

## Learn More

For additional details on the entire project, please visit:
[E-Commerce Full-Stack: NextJs, NodeJS - Express](https://github.com/feldib/E-Commerce-Full-Stack-NextJs-NodeJS---Express)
