const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, '..', 'prisma', 'dev.db');
const db = new Database(dbPath);

// Create User table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL UNIQUE,
    "name" TEXT,
    "password" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "image" TEXT,
    "provider" TEXT,
    "providerId" TEXT,
    "isActive" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

// Create default admin user (password: admin123)
const adminPassword = bcrypt.hashSync('admin123', 10);
const adminEmail = 'admin@estommy.com';

// Check if admin exists
const existingAdmin = db.prepare('SELECT id FROM User WHERE email = ?').get(adminEmail);

if (!existingAdmin) {
  const adminId = 'admin-' + Date.now();
  db.prepare(`
    INSERT INTO User (id, email, name, password, role, isActive)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(adminId, adminEmail, 'Admin User', adminPassword, 'ADMIN', 1);
  console.log('✅ Default admin user created:');
  console.log('   Email: admin@estommy.com');
  console.log('   Password: admin123');
}

// Create default manager user (password: manager123)
const managerPassword = bcrypt.hashSync('manager123', 10);
const managerEmail = 'manager@estommy.com';

const existingManager = db.prepare('SELECT id FROM User WHERE email = ?').get(managerEmail);

if (!existingManager) {
  const managerId = 'manager-' + Date.now();
  db.prepare(`
    INSERT INTO User (id, email, name, password, role, isActive)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(managerId, managerEmail, 'Manager User', managerPassword, 'MANAGER', 1);
  console.log('✅ Default manager user created:');
  console.log('   Email: manager@estommy.com');
  console.log('   Password: manager123');
}

db.close();
console.log('\n✅ User initialization complete!');



