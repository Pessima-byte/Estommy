export const createProduct = async () => {
    const newProduct = await prisma.product.create({
        data: {
            name: 'Test Product',
            category: 'Electronics',
            price: 100,
            stock: 50,
            status: 'In Stock',
        },
    });
    return newProduct;
};

export const createCustomer = async () => {
    const newCustomer = await prisma.customer.create({
        data: {
            name: 'Test Customer',
            email: 'test@example.com',
            phone: '1234567890',
            status: 'Active'
        }
    });
    return newCustomer;
}

export const createSale = async (customerId: string, productId: string) => {
    const newSale = await prisma.sale.create({
        data: {
            customerId: customerId,
            productId: productId,
            date: new Date().toISOString().split('T')[0],
            amount: 100,
            status: 'Completed'
        }
    });
    return newSale;
}
