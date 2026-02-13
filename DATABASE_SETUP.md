# Database Setup Guide

This guide will help you set up the database for the ESTOMMY application.

## Prerequisites

- Node.js installed
- npm or yarn package manager

## Installation Steps

### 1. Install Dependencies

```bash
npm install prisma @prisma/client better-sqlite3
```

### 2. Add Database URL to Environment Variables

Add this line to your `.env.local` file:

```env
DATABASE_URL="file:./dev.db"
```

### 3. Initialize Prisma

```bash
npx prisma generate
npx prisma db push
```

This will:
- Generate the Prisma Client
- Create the SQLite database file (`dev.db`) in the `prisma` directory
- Create all the tables based on the schema

### 4. (Optional) Seed Initial Data

If you want to populate the database with initial data, you can run:

```bash
npx prisma studio
```

This opens Prisma Studio, a visual database browser where you can add data manually.

## Database Schema

The database includes the following tables:

- **Product**: Products with name, category, price, stock, status, and image
- **Customer**: Customers with name, email, phone, status, and avatar
- **Sale**: Sales records with customer, product, date, amount, and status
- **Credit**: Credit records with customer, amount, due date, and status
- **Profit**: Profit records with date, amount, type, and description

## Migration to Production

For production, you can easily switch to PostgreSQL:

1. Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

2. Update `.env.local`:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/estommy"
   ```

3. Run migrations:
   ```bash
   npx prisma migrate dev --name init
   ```

## Troubleshooting

### Database not found
- Make sure you've run `npx prisma db push` after installing dependencies
- Check that `DATABASE_URL` is set in `.env.local`

### Prisma Client not generated
- Run `npx prisma generate` manually
- Restart your development server

### Migration errors
- Delete the `prisma/dev.db` file and run `npx prisma db push` again
- Check the Prisma schema for any syntax errors



