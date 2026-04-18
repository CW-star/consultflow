'use client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { formatCurrency } from '@/lib/utils'

export function CashFlowChart({ data }: { data: { month: string; billed: number; collected: number }[] }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Cash flow — last 6 months</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false}/>
          <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false}/>
          <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false}
            tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`}/>
          <Tooltip
            formatter={(value: number, name: string) => [formatCurrency(value), name === 'billed' ? 'Billed' : 'Collected']}
            contentStyle={{ border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13 }}
          />
          <Bar dataKey="billed" fill="#dbeafe" radius={[4,4,0,0]} name="billed"/>
          <Bar dataKey="collected" fill="#1e40af" radius={[4,4,0,0]} name="collected"/>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}