'use client';

export function InventoryTable({ products }: { products: any[] }) {
    if (products.length === 0) {
        return (
            <div className="h-full flex items-center justify-center text-gray-400">
                No products found in inventory
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead>
                    <tr className="border-b border-white/10 text-white/50">
                        <th className="pb-3 font-medium">Product Name</th>
                        <th className="pb-3 font-medium">Category</th>
                        <th className="pb-3 font-medium">Price</th>
                        <th className="pb-3 font-medium">Stock</th>
                        <th className="pb-3 font-medium text-right">Value</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {products.map((product) => (
                        <tr key={product.id} className="group hover:bg-white/5 transition-colors">
                            <td className="py-3 font-medium text-white/90">
                                {product.name}
                            </td>
                            <td className="py-3 text-white/60">
                                {product.category}
                            </td>
                            <td className="py-3 text-white/90">
                                Le {product.price.toLocaleString()}
                            </td>
                            <td className="py-3">
                                <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${(product.stock || 0) < 10 ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'
                                    }`}>
                                    {product.stock}
                                </span>
                            </td>
                            <td className="py-3 text-right text-white/90">
                                Le {(product.price * (product.stock || 0)).toLocaleString()}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
