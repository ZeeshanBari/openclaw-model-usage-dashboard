import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function UsageChart({ data = [] }) {
  const chartData = (data || []).map(day => ({
    date: day.date.slice(5), // MM-DD format
    cost: day.totalCost || 0,
    tokens: Math.round((day.totalTokens || 0) / 1000) // in thousands
  }));

  return (
    <div style={{ height: '300px', marginTop: '20px' }}>
      <h3>7-Day Cost Trend</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis yAxisId="left" orientation="left" tickFormatter={(v) => `$${v}`} />
          <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `${v}k`} />
          <Tooltip 
            formatter={(value, name) => [
              name === 'cost' ? `$${value.toFixed(2)}` : `${value}k tokens`,
              name === 'cost' ? 'Cost' : 'Tokens'
            ]}
          />
          <Legend />
          <Bar yAxisId="left" dataKey="cost" fill="#0088FE" name="Cost ($)" />
          <Bar yAxisId="right" dataKey="tokens" fill="#00C49F" name="Tokens (k)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
