# Generated Assets Frontend

This is the frontend for the Generated Assets application, built with React, TypeScript, and Vite. The application features a robust authentication system supporting both email/password and Google OAuth through Firebase.

## Features

- 🔐 Email/Password Authentication
- 🔑 Google OAuth Integration
- 🔄 Session Management
- 👤 User Profile Management
- 🔄 Token-based Authentication

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Firebase Project (for authentication)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Fill in your Firebase configuration:
     ```
     VITE_FIREBASE_API_KEY=your_firebase_api_key
     VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
     VITE_FIREBASE_PROJECT_ID=your_project_id
     VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
     VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
     VITE_FIREBASE_APP_ID=your_app_id
     
     VITE_API_URL=http://localhost:5000
     ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build for production
- `npm run preview` - Preview the production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Check TypeScript types

## Project Structure

```
src/
├── components/     # Reusable UI components
├── pages/         # Page components
├── hooks/         # Custom React hooks
├── lib/           # Core functionality
│   ├── api.ts     # API client configuration
│   └── auth.ts    # Authentication service
├── utils/         # Helper functions
└── App.tsx        # Main application component
```

## Authentication

The application uses Firebase Authentication with the following features:

### Available Authentication Methods

1. **Email/Password**
   - Registration
   - Login
   - Password Reset (coming soon)

2. **Google OAuth**
   - One-tap sign-in with Google
   - Automatic account creation

### Authentication Flow

1. User signs in using either email/password or Google OAuth
2. On successful authentication, a JWT token is received from the backend
3. The token is stored in localStorage and used for subsequent API requests
4. The user session is maintained until logout or token expiration

### API Integration

The authentication service (`src/lib/auth.ts`) provides the following methods:

```typescript
// Email/Password Authentication
await authService.register(email, password, name);
await authService.login(email, password);

// Google OAuth
await authService.googleLogin();

// Session Management
const currentUser = await authService.getCurrentUser();
const isAuthenticated = authService.isAuthenticated();
await authService.logout();

// User Profile
await authService.updateProfile({ name, email, profilePhoto });
await authService.changePassword(currentPassword, newPassword);
```

## Error Handling

The authentication service includes comprehensive error handling for various scenarios:
- Network errors
- Invalid credentials
- Account conflicts
- Session expiration
- Firebase-specific errors

## Security Considerations

- JWT tokens are stored in `httpOnly` cookies when possible
- Sensitive operations require re-authentication
- Rate limiting is implemented on the backend
- CSRF protection is enabled for all authenticated requests

## Tech Stack

- ⚛️ React 18
- 🔷 TypeScript
- ⚡ Vite
- 🎨 Tailwind CSS
- 🔥 Firebase Authentication
- 🔒 JWT Authentication
- 🔄 Axios for API requests
- React Query
- React Hook Form
- Zod for validation
