# Production Readiness Setup Guide

This guide will help you complete the production setup for ESTOMMY, including database integration, API endpoints, image uploads, and backup/restore functionality.

## 🚀 Quick Start

### Step 1: Install Dependencies

```bash
npm install prisma @prisma/client better-sqlite3
```

**Note:** If you encounter network issues, try:
- Using a different network connection
- Using `npm install --registry https://registry.npmjs.org/`
- Installing packages one at a time

### Step 2: Configure Environment Variables

Add the following to your `.env.local` file:

```env
# Database (SQLite for development)
DATABASE_URL="file:./prisma/dev.db"

# NextAuth (already configured)
NEXTAUTH_URL=http://localhost:3030
NEXTAUTH_SECRET=WXAusVguKEkhLqeon4cDx50CNoVcBfRG0nVaPPPVvDo=

# OAuth Providers (optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_ID=your_github_id
GITHUB_SECRET=your_github_secret
FACEBOOK_CLIENT_ID=your_facebook_client_id
FACEBOOK_CLIENT_SECRET=your_facebook_client_secret
```

### Step 3: Initialize Database

```bash
# Generate Prisma Client
npm run db:generate

# Create database and tables
npm run db:push
```

This will:
- Generate the Prisma Client based on the schema
- Create the SQLite database file (`prisma/dev.db`)
- Create all necessary tables (Product, Customer, Sale, Credit, Profit)

### Step 4: Create Uploads Directory

```bash
mkdir -p public/uploads
touch public/uploads/.gitkeep
```

### Step 5: Start Development Server

```bash
npm run dev
```

## 📁 What Has Been Implemented

### ✅ Database Integration
- **Prisma ORM** with SQLite (easily switchable to PostgreSQL)
- **Schema** for all entities (Products, Customers, Sales, Credits, Profits)
- **Migrations** ready for production

### ✅ API Endpoints
All endpoints are protected with authentication:

- **Products**: `/api/products` (GET, POST)
- **Products by ID**: `/api/products/[id]` (GET, PUT, DELETE)
- **Customers**: `/api/customers` (GET, POST)
- **Customers by ID**: `/api/customers/[id]` (GET, PUT, DELETE)
- **Sales**: `/api/sales` (GET, POST)
- **Sales by ID**: `/api/sales/[id]` (GET, PUT, DELETE)
- **Credits**: `/api/credits` (GET, POST)
- **Credits by ID**: `/api/credits/[id]` (PUT, DELETE)
- **Profits**: `/api/profits` (GET, POST)
- **Profits by ID**: `/api/profits/[id]` (PUT, DELETE)
- **Upload**: `/api/upload` (POST) - Image upload endpoint
- **Backup**: `/api/backup` (GET, POST) - Backup and restore data

### ✅ Context Updates
- **ProductsContext**: Now uses API instead of LocalStorage
- **CustomersContext**: Now uses API instead of LocalStorage
- **SalesContext**: Now uses API instead of LocalStorage
- All contexts include loading states and error handling

### ✅ Image Upload
- File upload endpoint at `/api/upload`
- Validates file type (images only)
- Validates file size (max 5MB)
- Stores files in `public/uploads/`
- Returns public URL for use in products

### ✅ Backup & Restore
- **GET `/api/backup`**: Exports all data as JSON
- **POST `/api/backup`**: Restores data from JSON backup
- Supports clearing existing data before restore

## 🔄 Migrating from LocalStorage

If you have existing data in LocalStorage, you can migrate it:

1. **Export from LocalStorage** (in browser console):
```javascript
const data = {
  products: JSON.parse(localStorage.getItem('products') || '[]'),
  customers: JSON.parse(localStorage.getItem('customers') || '[]'),
  sales: JSON.parse(localStorage.getItem('sales') || '[]'),
};
console.log(JSON.stringify(data, null, 2));
```

2. **Use Prisma Studio** to import:
```bash
npm run db:studio
```

3. Or create a migration script (see below)

## 🗄️ Database Schema

### Product
- `id` (String, Primary Key)
- `name` (String)
- `category` (String)
- `price` (Float)
- `stock` (Int)
- `status` (String, default: "In Stock")
- `image` (String, optional)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

### Customer
- `id` (String, Primary Key)
- `name` (String)
- `email` (String)
- `phone` (String)
- `status` (String, default: "Active")
- `avatar` (String, optional)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

### Sale
- `id` (String, Primary Key)
- `customer` (String)
- `product` (String)
- `date` (String)
- `amount` (Float)
- `status` (String, default: "Completed")
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

### Credit
- `id` (String, Primary Key)
- `customer` (String)
- `amount` (Float)
- `dueDate` (String)
- `status` (String, default: "Pending")
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

### Profit
- `id` (String, Primary Key)
- `date` (String)
- `amount` (Float)
- `type` (String)
- `description` (String, optional)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

## 🔐 Authentication

All API endpoints require authentication. The app uses NextAuth.js v5 with:
- Email/Password authentication
- OAuth providers (Google, GitHub, Facebook) - optional

## 📤 Using Image Upload

To upload product images:

```typescript
import { uploadAPI } from '@/lib/api';

const handleImageUpload = async (file: File) => {
  try {
    const result = await uploadAPI.upload(file);
    console.log('Image URL:', result.url);
    // Use result.url in your product form
  } catch (error) {
    console.error('Upload failed:', error);
  }
};
```

## 💾 Backup & Restore

### Create Backup

```typescript
import { backupAPI } from '@/lib/api';

const backup = await backupAPI.create();
// Download as JSON file
const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
// ... download logic
```

### Restore Backup

```typescript
import { backupAPI } from '@/lib/api';

const backupData = { /* your backup JSON */ };
await backupAPI.restore(backupData.data, true); // true = clear existing data
```

## 🚀 Production Deployment

### For Production (PostgreSQL)

1. **Update `prisma/schema.prisma`**:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

2. **Update `.env.local`**:
```env
DATABASE_URL="postgresql://user:password@host:5432/estommy"
```

3. **Run migrations**:
```bash
npm run db:migrate
```

### Environment Variables for Production

- Set `NEXTAUTH_URL` to your production domain
- Generate a secure `NEXTAUTH_SECRET`:
  ```bash
  openssl rand -base64 32
  ```
- Configure OAuth redirect URIs in provider dashboards

## 🐛 Troubleshooting

### Database not found
- Run `npm run db:push` to create the database
- Check that `DATABASE_URL` is set in `.env.local`

### Prisma Client errors
- Run `npm run db:generate` to regenerate the client
- Restart your development server

### Upload directory errors
- Ensure `public/uploads/` directory exists
- Check file permissions

### API authentication errors
- Verify you're signed in
- Check that NextAuth is properly configured
- Verify `NEXTAUTH_SECRET` is set

## 📝 Next Steps

1. ✅ Install dependencies
2. ✅ Set up database
3. ✅ Test API endpoints
4. ✅ Test image uploads
5. ✅ Test backup/restore
6. ⏳ Add backup/restore UI (optional)
7. ⏳ Add data migration from LocalStorage (optional)

## 📚 Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)



