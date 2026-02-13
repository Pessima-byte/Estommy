# Social Authentication Setup Guide

This application supports sign-in with Google, GitHub, Facebook, and email/password authentication using NextAuth.js.

## Quick Setup

1. **Create a `.env.local` file** in the root directory with the following variables:

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3030
NEXTAUTH_SECRET=WXAusVguKEkhLqeon4cDx50CNoVcBfRG0nVaPPPVvDo=

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# GitHub OAuth (Optional)
GITHUB_ID=your-github-client-id
GITHUB_SECRET=your-github-client-secret

# Facebook OAuth (Optional)
FACEBOOK_CLIENT_ID=your-facebook-app-id
FACEBOOK_CLIENT_SECRET=your-facebook-app-secret
```

## Setting Up OAuth Providers

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth client ID"
5. Choose "Web application"
6. Add authorized redirect URI: `http://localhost:3030/api/auth/callback/google`
7. Copy the Client ID and Client Secret to your `.env.local` file

### GitHub OAuth Setup

1. Go to GitHub → Settings → Developer settings → OAuth Apps
2. Click "New OAuth App"
3. Fill in:
   - Application name: ESTOMMY
   - Homepage URL: `http://localhost:3030`
   - Authorization callback URL: `http://localhost:3030/api/auth/callback/github`
4. Copy the Client ID and Client Secret to your `.env.local` file

### Facebook OAuth Setup

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app
3. Add "Facebook Login" product
4. Go to Settings → Basic
5. Add authorized redirect URI: `http://localhost:3030/api/auth/callback/facebook`
6. Copy the App ID and App Secret to your `.env.local` file

## Notes

- **Email/Password authentication** works without any OAuth setup (demo mode)
- OAuth providers are optional - you can use just email/password if preferred
- For production, update `NEXTAUTH_URL` to your production domain
- Generate a new `NEXTAUTH_SECRET` for production using: `openssl rand -base64 32`

## Testing

1. Start the development server: `npm run dev`
2. Navigate to `/auth/signin`
3. Try signing in with:
   - Email/Password (any email, password 6+ chars)
   - Google (if configured)
   - GitHub (if configured)
   - Facebook (if configured)



