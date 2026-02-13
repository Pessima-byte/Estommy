# 🚀 Quick Start: Adding OAuth Credentials

## 📍 Where to Add Credentials

**File:** `.env.local` in your project root  
**Location:** `/Users/mac/Desktop/Projects/ESTOMMY/.env.local`

---

## 📝 Current .env.local File

Your `.env.local` file currently looks like this:

```env
# NextAuth Configuration (REQUIRED)
NEXTAUTH_URL=http://localhost:3030
NEXTAUTH_SECRET=WXAusVguKEkhLqeon4cDx50CNoVcBfRG0nVaPPPVvDo=

# Google OAuth (Optional - Add your credentials when ready)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# GitHub OAuth (Optional - Add your credentials when ready)
GITHUB_ID=
GITHUB_SECRET=

# Facebook OAuth (Optional - Add your credentials when ready)
FACEBOOK_CLIENT_ID=
FACEBOOK_CLIENT_SECRET=
```

---

## 🔵 Google OAuth (5 minutes)

### Get Credentials:
1. Go to: https://console.cloud.google.com/
2. Create/Select project → **APIs & Services** → **Credentials**
3. **Create Credentials** → **OAuth client ID**
4. Type: **Web application**
5. Redirect URI: `http://localhost:3030/api/auth/callback/google`
6. Copy **Client ID** and **Client Secret**

### Add to .env.local:
Replace the empty values:
```env
GOOGLE_CLIENT_ID=123456789-abc123def456.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abc123def456
```

---

## 🐙 GitHub OAuth (3 minutes)

### Get Credentials:
1. Go to: https://github.com/settings/developers
2. **OAuth Apps** → **New OAuth App**
3. Fill in:
   - Name: `ESTOMMY`
   - Homepage: `http://localhost:3030`
   - Callback: `http://localhost:3030/api/auth/callback/github`
4. Copy **Client ID** and generate **Client Secret**

### Add to .env.local:
```env
GITHUB_ID=Iv1.8a61f9b3a7aba766
GITHUB_SECRET=abc123def456ghi789jkl012mno345pqr678stu
```

---

## 📘 Facebook OAuth (5 minutes)

### Get Credentials:
1. Go to: https://developers.facebook.com/
2. **My Apps** → **Create App** → **Consumer**
3. Add **Facebook Login** product
4. **Settings** → **Basic**
5. Copy **App ID** and **App Secret**
6. Add redirect URI: `http://localhost:3030/api/auth/callback/facebook`

### Add to .env.local:
```env
FACEBOOK_CLIENT_ID=1234567890123456
FACEBOOK_CLIENT_SECRET=abc123def456ghi789jkl012mno345pq
```

---

## ✅ After Adding Credentials

1. **Save** `.env.local`
2. **Restart** your dev server:
   ```bash
   # Stop server (Ctrl+C or Cmd+C)
   npm run dev
   ```
3. **Test** at: `http://localhost:3030/auth/signin`

---

## 📖 Detailed Guide

For step-by-step screenshots and detailed instructions, see:
- **`OAUTH_CREDENTIALS_GUIDE.md`** - Complete detailed guide

---

## 💡 Pro Tips

- ✅ You only need **ONE** provider to test (start with GitHub - it's easiest)
- ✅ Email/Password works **without** any OAuth setup
- ✅ Restart server **after** adding credentials
- ❌ Don't add spaces around the `=` sign
- ❌ Don't use quotes around the values



