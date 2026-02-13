import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ESTOMMY - Business Management System',
  description: 'Modern business management system for products, customers, sales, and inventory tracking',
  keywords: 'business, management, inventory, sales, customers, products',
  authors: [{ name: 'ESTOMMY Team' }],
  creator: 'ESTOMMY',
  publisher: 'ESTOMMY',
  robots: 'index, follow',
  openGraph: {
    title: 'ESTOMMY - Business Management System',
    description: 'Modern business management system for products, customers, sales, and inventory tracking',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ESTOMMY - Business Management System',
    description: 'Modern business management system for products, customers, sales, and inventory tracking',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
} 