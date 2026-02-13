/**
 * @jest-environment node
 */
import { createMocks } from 'node-mocks-http';
import { GET } from './route';
import { prisma } from '@/lib/prisma';

// Mock auth
jest.mock('@/lib/auth', () => ({
    auth: jest.fn(() => ({ user: { id: 'test-user', role: 'ADMIN' } })),
}));

describe('/api/sales', () => {
    beforeAll(async () => {
        // Cleanup beforehand
        await prisma.sale.deleteMany();
        await prisma.product.deleteMany();
        await prisma.customer.deleteMany();

        // Setup seed data if necessary, or rely on mocks. 
        // For integration tests, we often want to use real DB with test env.
        // Here we assume a test database is used. 
        const customer = await prisma.customer.create({
            data: {
                name: 'Integration Test Customer',
                email: 'integration@test.com',
                phone: '0000000000',
            }
        });

        const product = await prisma.product.create({
            data: {
                name: 'Integration Test Product',
                category: 'Test',
                price: 100,
                stock: 10,
            }
        });

        await prisma.sale.create({
            data: {
                customerId: customer.id,
                productId: product.id,
                date: '2023-01-01',
                amount: 100,
                status: 'Completed'
            }
        });
    });

    afterAll(async () => {
        await prisma.sale.deleteMany();
        await prisma.product.deleteMany();
        await prisma.customer.deleteMany();
        await prisma.$disconnect();
    });

    it('GET /api/sales should return sales', async () => {
        const { req } = createMocks({
            method: 'GET',
        });

        const response = await GET(req as any);
        expect(response.status).toBe(200);

        const data = await response.json();
        expect(Array.isArray(data)).toBe(true);
        expect(data.length).toBeGreaterThan(0);
        expect(data[0]).toHaveProperty('id');
        expect(data[0]).toHaveProperty('amount');
    });
});
