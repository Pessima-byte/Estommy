# 🔐 OAuth Credentials Guide - Step by Step

This guide shows you exactly where to find OAuth credentials and how to add them to your application.

## 📍 Where to Add Credentials

All credentials go in the `.env.local` file in your project root directory.

**File location:** `/Users/mac/Desktop/Projects/ESTOMMY/.env.local`

---

## 🔵 Google OAuth Setup

### Step 1: Go to Google Cloud Console
1. Visit: https://console.cloud.google.com/
2. Sign in with your Google account

### Step 2: Create or Select a Project
1. Click the project dropdown at the top
2. Click **"New Project"** (or select an existing one)
3. Enter project name: `ESTOMMY` (or any name)
4. Click **"Create"**

### Step 3: Enable Google+ API
1. In the left sidebar, go to **"APIs & Services"** → **"Library"**
2. Search for **"Google+ API"** or **"Google Identity"**
3. Click on it and click **"Enable"**

### Step 4: Create OAuth Credentials
1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"+ CREATE CREDENTIALS"** at the top
3. Select **"OAuth client ID"**
4. If prompted, configure the OAuth consent screen first:
   - Choose **"External"** (unless you have a Google Workspace)
   - Fill in:
     - App name: `ESTOMMY`
     - User support email: Your email
     - Developer contact: Your email
   - Click **"Save and Continue"** through the steps
   - Click **"Back to Dashboard"**

5. Now create the OAuth client:
   - Application type: **"Web application"**
   - Name: `ESTOMMY Web Client`
   - Authorized redirect URIs: 
     ```
     http://localhost:3030/api/auth/callback/google
     ```
   - Click **"Create"**

### Step 5: Copy Credentials
You'll see a popup with:
- **Client ID** (looks like: `123456789-abc123def456.apps.googleusercontent.com`)
- **Client Secret** (looks like: `GOCSPX-abc123def456`)

### Step 6: Add to .env.local
Open `.env.local` and update these lines:
```env
GOOGLE_CLIENT_ID=your-client-id-here
GOOGLE_CLIENT_SECRET=your-client-secret-here
```

**Example:**
```env
GOOGLE_CLIENT_ID=123456789-abc123def456.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abc123def456
```

---

## 🐙 GitHub OAuth Setup

### Step 1: Go to GitHub Settings
1. Visit: https://github.com/settings/developers
2. Sign in to your GitHub account

### Step 2: Create OAuth App
1. Click **"OAuth Apps"** in the left sidebar
2. Click **"New OAuth App"** button

### Step 3: Fill in OAuth App Details
Fill in the form:
- **Application name:** `ESTOMMY`
- **Homepage URL:** `http://localhost:3030`
- **Authorization callback URL:** `http://localhost:3030/api/auth/callback/github`
- **Application description:** (optional) `ESTOMMY Application`

### Step 4: Register Application
Click **"Register application"**

### Step 5: Copy Credentials
You'll see:
- **Client ID** (a long string of numbers and letters)
- **Client Secret** (click **"Generate a new client secret"** to reveal it)

⚠️ **Important:** Copy the client secret immediately - you can only see it once!

### Step 6: Add to .env.local
Open `.env.local` and update these lines:
```env
GITHUB_ID=your-github-client-id-here
GITHUB_SECRET=your-github-client-secret-here
```

**Example:**
```env
GITHUB_ID=Iv1.8a61f9b3a7aba766
GITHUB_SECRET=abc123def456ghi789jkl012mno345pqr678stu
```

---

## 📘 Facebook OAuth Setup

### Step 1: Go to Facebook Developers
1. Visit: https://developers.facebook.com/
2. Sign in with your Facebook account

### Step 2: Create a New App
1. Click **"My Apps"** → **"Create App"**
2. Choose **"Consumer"** as the app type
3. Fill in:
   - App name: `ESTOMMY`
   - App contact email: Your email
4. Click **"Create App"**

### Step 3: Add Facebook Login Product
1. In the app dashboard, find **"Add Products"**
2. Find **"Facebook Login"** and click **"Set Up"**
3. Choose **"Web"** as the platform
4. Enter site URL: `http://localhost:3030`
5. Click **"Save"**

### Step 4: Configure Settings
1. Go to **"Settings"** → **"Basic"** in the left sidebar
2. Note your **App ID** and **App Secret**
3. Click **"Show"** next to App Secret to reveal it

### Step 5: Add Valid OAuth Redirect URI
1. Go to **"Settings"** → **"Basic"**
2. Scroll to **"Valid OAuth Redirect URIs"**
3. Add: `http://localhost:3030/api/auth/callback/facebook`
4. Click **"Save Changes"**

### Step 6: Add to .env.local
Open `.env.local` and update these lines:
```env
FACEBOOK_CLIENT_ID=your-facebook-app-id-here
FACEBOOK_CLIENT_SECRET=your-facebook-app-secret-here
```

**Example:**
```env
FACEBOOK_CLIENT_ID=1234567890123456
FACEBOOK_CLIENT_SECRET=abc123def456ghi789jkl012mno345pq
```

---

## ✅ After Adding Credentials

### Step 1: Save .env.local
Make sure all your credentials are saved in `.env.local`:

```env
# NextAuth Configuration (REQUIRED)
NEXTAUTH_URL=http://localhost:3030
NEXTAUTH_SECRET=WXAusVguKEkhLqeon4cDx50CNoVcBfRG0nVaPPPVvDo=

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# GitHub OAuth
GITHUB_ID=your-github-client-id
GITHUB_SECRET=your-github-client-secret

# Facebook OAuth
FACEBOOK_CLIENT_ID=your-facebook-app-id
FACEBOOK_CLIENT_SECRET=your-facebook-app-secret
```

### Step 2: Restart Development Server
**IMPORTANT:** You must restart your server for environment variables to load:

1. Stop the current server (Ctrl+C or Cmd+C)
2. Start it again:
   ```bash
   npm run dev
   ```

### Step 3: Test
1. Navigate to: `http://localhost:3030/auth/signin`
2. Click on any social login button
3. You should be redirected to the OAuth provider's login page

---

## 🔒 Security Tips

1. **Never commit `.env.local` to Git** - It's already in `.gitignore`
2. **Keep credentials secret** - Don't share them publicly
3. **Use different credentials for production** - Create separate OAuth apps
4. **Rotate secrets regularly** - Especially if compromised

---

## 🆘 Troubleshooting

### "Configuration" Error
- **Problem:** OAuth provider shows "Configuration" error
- **Solution:** Check that credentials are correctly added to `.env.local` and server was restarted

### "Redirect URI Mismatch"
- **Problem:** OAuth provider says redirect URI doesn't match
- **Solution:** Double-check the redirect URI in OAuth provider settings matches exactly:
  - Google: `http://localhost:3030/api/auth/callback/google`
  - GitHub: `http://localhost:3030/api/auth/callback/github`
  - Facebook: `http://localhost:3030/api/auth/callback/facebook`

### Credentials Not Working
- **Problem:** Social login still doesn't work after adding credentials
- **Solution:** 
  1. Verify credentials are correct (no extra spaces)
  2. Restart the development server
  3. Check browser console for errors
  4. Verify redirect URIs match exactly

---

## 📝 Quick Reference

| Provider | Where to Get | What You Need |
|----------|-------------|---------------|
| **Google** | https://console.cloud.google.com/ | Client ID & Client Secret |
| **GitHub** | https://github.com/settings/developers | Client ID & Client Secret |
| **Facebook** | https://developers.facebook.com/ | App ID & App Secret |

---

**Need help?** Check the error messages in the browser console or terminal for specific issues.



