# Generated Assets Backend

This is the backend for the Generated Assets application, built with Node.js, Express, and TypeScript.

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL (for database)
- Redis (for session storage, optional)

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file in the root directory with the necessary environment variables:
   ```
   PORT=5000
   NODE_ENV=development
   DATABASE_URL=postgresql://user:password@localhost:5432/generated_assets
   JWT_SECRET=your_jwt_secret
   OPENAI_API_KEY=your_openai_api_key
   ```

3. Run database migrations:
   ```bash
   npm run db:push
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

   The server will be available at `http://localhost:5000`

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build for production
- `npm start` - Start the production server
- `npm run check` - Type-check the code
- `npm run db:push` - Push database schema

## Project Structure

- `/src` - Source code
  - `/db` - Database configuration and migrations
  - `/middleware` - Express middleware
  - `/models` - Database models
  - `/routes` - API routes
  - `/services` - Business logic

## Tech Stack

- Node.js
- Express
- TypeScript
- Drizzle ORM
- PostgreSQL
- JWT for authentication
- OpenAI API integration
