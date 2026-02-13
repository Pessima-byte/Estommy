'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function SalesReportChart({ data }: { data: any[] }) {
    // Aggregate sales by date
    const chartData = data.reduce((acc: any[], sale) => {
        const date = new Date(sale.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const existing = acc.find(item => item.date === date);
        if (existing) {
            existing.amount += sale.amount;
        } else {
            acc.push({ date, amount: sale.amount });
        }
        return acc;
    }, []).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (chartData.length === 0) {
        return (
            <div className="h-full flex items-center justify-center text-gray-400">
                No data available for this period
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart
                data={chartData}
                margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 5,
                }}
            >
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="date" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `Le ${value}`} />
                <Tooltip
                    contentStyle={{ backgroundColor: '#1e1b4b', border: '1px solid #ffffff10', borderRadius: '8px' }}
                    itemStyle={{ color: '#a5b4fc' }}
                    formatter={(value: number) => [`Le ${value.toLocaleString()}`, 'Sales']}
                />
                <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
}
