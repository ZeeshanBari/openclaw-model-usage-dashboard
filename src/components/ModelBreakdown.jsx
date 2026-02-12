import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function ModelBreakdown({ models }) {
  const data = Object.entries(models || {}).map(([name, stats]) => ({
    name: name.includes('/') ? name.split('/').pop() : name,
    value: stats?.totalCost || stats?.cost || 0,
    tokens: stats?.totalTokens || stats?.tokens || 0,
    calls: stats?.calls || 0
  })).sort((a, b) => (b.value || 0) - (a.value || 0));

  return (
    <div style={{ height: '300px' }}>
      <h3>Cost by Model</h3>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => `$${value.toFixed(4)}`} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
