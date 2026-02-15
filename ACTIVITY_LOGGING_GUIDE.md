# Activity Logging Implementation Guide

## Overview
This document provides instructions for implementing comprehensive activity logging across the ESTOMMY application (both web and mobile).

## Activity Logger Utility

The `ActivityLogger` class has been created in:
- Web: `/src/utils/activityLogger.ts`
- Mobile: `/mobile/src/utils/activityLogger.ts`

## Usage Examples

### 1. Product Actions

```typescript
import { ActivityLogger } from '@/utils/activityLogger';

// When creating a product
const handleCreateProduct = async (productData) => {
  const newProduct = await productsAPI.create(productData);
  await ActivityLogger.logCreate('PRODUCT', newProduct.id, newProduct.name);
  return newProduct;
};

// When updating a product
const handleUpdateProduct = async (id, updates) => {
  const updated = await productsAPI.update(id, updates);
  await ActivityLogger.logUpdate('PRODUCT', updated.id, updated.name);
  return updated;
};

// When deleting a product
const handleDeleteProduct = async (id, name) => {
  await productsAPI.delete(id);
  await ActivityLogger.logDelete('PRODUCT', id, name);
};

// When exporting products
const handleExportProducts = async (products) => {
  await exportToCSV(products, columns, 'products');
  await ActivityLogger.logExport('PRODUCT', products.length);
};
```

### 2. Customer Actions

```typescript
// Create customer
await ActivityLogger.logCreate('CUSTOMER', customer.id, customer.name);

// Update customer
await ActivityLogger.logUpdate('CUSTOMER', customer.id, customer.name);

// Delete customer
await ActivityLogger.logDelete('CUSTOMER', customer.id, customer.name);

// View customer profile
await ActivityLogger.logView('CUSTOMER', customer.id, customer.name);

// Export customers
await ActivityLogger.logExport('CUSTOMER', customers.length);
```

### 3. Sales Actions

```typescript
// Create sale
await ActivityLogger.logCreate('SALE', sale.id, `Sale #${sale.id.slice(-6)}`, {
  amount: sale.amount,
  customerId: sale.customerId
});

// Update sale
await ActivityLogger.logUpdate('SALE', sale.id, `Sale #${sale.id.slice(-6)}`);

// Delete sale
await ActivityLogger.logDelete('SALE', sale.id, `Sale #${sale.id.slice(-6)}`);
```

### 4. Credit/Debtor Actions

```typescript
// Create credit
await ActivityLogger.logCreate('CREDIT', credit.id, credit.customerName);

// Settle payment
await ActivityLogger.logSettle('CREDIT', credit.id, credit.customerName, paymentAmount);

// Update credit
await ActivityLogger.logUpdate('CREDIT', credit.id, credit.customerName);

// Delete credit
await ActivityLogger.logDelete('CREDIT', credit.id, credit.customerName);
```

### 5. Category Actions

```typescript
// Create category
await ActivityLogger.logCreate('CATEGORY', category.id, category.name);

// Update category
await ActivityLogger.logUpdate('CATEGORY', category.id, category.name);

// Delete category
await ActivityLogger.logDelete('CATEGORY', category.id, category.name);
```

### 6. User Management Actions

```typescript
// Create user
await ActivityLogger.logCreate('USER', user.id, user.name, {
  role: user.role,
  email: user.email
});

// Update user
await ActivityLogger.logUpdate('USER', user.id, user.name);

// Delete user
await ActivityLogger.logDelete('USER', user.id, user.name);

// Update permissions
await ActivityLogger.logUpdate('PERMISSION', user.id, user.name, {
  permissions: updatedPermissions
});
```

### 7. System Actions

```typescript
// Login
await ActivityLogger.logLogin();

// Logout
await ActivityLogger.logLogout();

// Backup
await ActivityLogger.logBackup();

// Restore
await ActivityLogger.logRestore();
```

## Implementation Checklist

### Web Application

#### Products (`/src/app/products/page.tsx`)
- [ ] Add logging to create product
- [ ] Add logging to update product
- [ ] Add logging to delete product
- [ ] Add logging to export products

#### Customers (`/src/app/customers/page.tsx`)
- [ ] Add logging to create customer
- [ ] Add logging to update customer
- [ ] Add logging to delete customer
- [ ] Add logging to export customers

#### Sales (`/src/app/sales/page.tsx`)
- [ ] Add logging to create sale
- [ ] Add logging to update sale
- [ ] Add logging to delete sale
- [ ] Add logging to export sales

#### Credits (`/src/app/credits/page.tsx`)
- [ ] Add logging to create credit
- [ ] Add logging to update credit
- [ ] Add logging to delete credit
- [ ] Add logging to settle payment
- [ ] Add logging to export credits

#### Debtors (`/src/app/debtors/page.tsx`)
- [ ] Add logging to view debtor details
- [ ] Add logging to settle debtor payment
- [ ] Add logging to export debtors

#### Categories (`/src/app/categories/page.tsx`)
- [ ] Add logging to create category
- [ ] Add logging to update category
- [ ] Add logging to delete category

#### Users (`/src/app/users/page.tsx`)
- [ ] Add logging to create user
- [ ] Add logging to update user
- [ ] Add logging to delete user

#### Permissions (`/src/app/permissions/page.tsx`)
- [ ] Add logging to update permissions

#### Settings (`/src/app/settings/page.tsx`)
- [ ] Add logging to backup
- [ ] Add logging to restore

#### Auth (`/src/app/auth/signin/page.tsx`)
- [ ] Add logging to login
- [ ] Add logging to logout

### Mobile Application

#### Products (`/mobile/src/screens/ProductsScreen.tsx`)
- [ ] Add logging to create product
- [ ] Add logging to update product
- [ ] Add logging to delete product
- [ ] Add logging to export products

#### Customers (`/mobile/src/screens/CustomersScreen.tsx`)
- [ ] Add logging to create customer
- [ ] Add logging to update customer
- [ ] Add logging to delete customer
- [ ] Add logging to view customer profile
- [ ] Add logging to export customers
- [ ] Add logging to export customer report

#### Sales (`/mobile/src/screens/SalesScreen.tsx`)
- [ ] Add logging to create sale
- [ ] Add logging to update sale
- [ ] Add logging to delete sale
- [ ] Add logging to export sales

#### Credits (`/mobile/src/screens/CreditsScreen.tsx`)
- [ ] Add logging to create credit
- [ ] Add logging to update credit
- [ ] Add logging to delete credit
- [ ] Add logging to export credits

#### Debtors (`/mobile/src/screens/DebtorsScreen.tsx`)
- [ ] Add logging to settle payment
- [ ] Add logging to export debtors

#### Categories (`/mobile/src/screens/CategoriesScreen.tsx`)
- [ ] Add logging to create category
- [ ] Add logging to update category
- [ ] Add logging to delete category

#### Users (`/mobile/src/screens/UsersScreen.tsx`)
- [ ] Add logging to create user
- [ ] Add logging to update user
- [ ] Add logging to delete user

#### Settings (`/mobile/src/screens/SettingsScreen.tsx`)
- [ ] Add logging to backup
- [ ] Add logging to restore
- [ ] Add logging to logout

## Best Practices

1. **Always log after successful operations**: Place logging calls after the API call succeeds
2. **Use descriptive entity names**: Include meaningful names for better activity tracking
3. **Include relevant metadata**: Add context like amounts, counts, or related IDs
4. **Don't block on logging**: The logger fails silently to avoid breaking user flows
5. **Log user-initiated actions only**: Don't log automatic/system-triggered events unless necessary

## Example: Complete CRUD Implementation

```typescript
import { ActivityLogger } from '@/utils/activityLogger';
import { productsAPI } from '@/lib/api';

// CREATE
const createProduct = async (data) => {
  try {
    const product = await productsAPI.create(data);
    await ActivityLogger.logCreate('PRODUCT', product.id, product.name, {
      category: product.category,
      price: product.price
    });
    return product;
  } catch (error) {
    console.error('Failed to create product:', error);
    throw error;
  }
};

// UPDATE
const updateProduct = async (id, data) => {
  try {
    const product = await productsAPI.update(id, data);
    await ActivityLogger.logUpdate('PRODUCT', product.id, product.name);
    return product;
  } catch (error) {
    console.error('Failed to update product:', error);
    throw error;
  }
};

// DELETE
const deleteProduct = async (id, name) => {
  try {
    await productsAPI.delete(id);
    await ActivityLogger.logDelete('PRODUCT', id, name);
  } catch (error) {
    console.error('Failed to delete product:', error);
    throw error;
  }
};

// EXPORT
const exportProducts = async (products) => {
  try {
    await exportToCSV(products, columns, 'products');
    await ActivityLogger.logExport('PRODUCT', products.length);
  } catch (error) {
    console.error('Failed to export products:', error);
    throw error;
  }
};
```

## Testing

After implementation, verify that:
1. Activities appear in the Activity Log screen
2. Each activity shows the correct action, entity type, and description
3. User name is captured correctly
4. Timestamps are accurate
5. Failed operations don't create activity logs
