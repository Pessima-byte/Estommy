'use client';

export function SalesTable({ sales }: { sales: any[] }) {
    if (sales.length === 0) {
        return (
            <div className="h-full flex items-center justify-center text-gray-400">
                No sales found for this period
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead>
                    <tr className="border-b border-white/10 text-white/50">
                        <th className="pb-3 font-medium">Date</th>
                        <th className="pb-3 font-medium">Customer</th>
                        <th className="pb-3 font-medium">Amount</th>
                        <th className="pb-3 font-medium text-right">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {sales.map((sale) => (
                        <tr key={sale.id} className="group">
                            <td className="py-3 text-white/70">
                                {new Date(sale.date).toLocaleDateString()}
                            </td>
                            <td className="py-3 font-medium text-white/90">
                                {sale.customer?.name || 'Unknown'}
                                <div className="text-xs text-white/40 font-normal">{sale.product?.name}</div>
                            </td>
                            <td className="py-3 text-white/90">
                                Le {sale.amount.toLocaleString()}
                            </td>
                            <td className="py-3 text-right">
                                <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${sale.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400' :
                                    sale.status === 'Pending' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-red-500/10 text-red-400'
                                    }`}>
                                    {sale.status}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
