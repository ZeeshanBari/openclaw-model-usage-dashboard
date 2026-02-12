import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format } from 'date-fns';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

function BudgetGauge({ used, budget }) {
  const percent = Math.min(100, (used / budget) * 100);
  const color = percent > 90 ? '#ff4444' : percent > 75 ? '#ffbb33' : '#00C49F';
  
  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h3>Daily Budget</h3>
      <div style={{ position: 'relative', width: '200px', height: '100px', margin: '0 auto' }}>
        <svg viewBox="0 0 200 100" style={{ width: '100%', height: '100%' }}>
          {/* Background arc */}
          <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#eee" strokeWidth="20" />
          {/* Progress arc */}
          <path 
            d="M 20 100 A 80 80 0 0 1 180 100" 
            fill="none" 
            stroke={color} 
            strokeWidth="20"
            strokeDasharray={`${percent * 2.51} 251`}
            style={{ transition: 'stroke-dasharray 0.5s ease' }}
          />
        </svg>
        <div style={{ position: 'absolute', bottom: '0', left: '0', right: '0', textAlign: 'center' }}>
          <span style={{ fontSize: '24px', fontWeight: 'bold' }}>${used.toFixed(2)}</span>
          <span style={{ color: '#888' }}> / ${budget}</span>
        </div>
      </div>
      <p style={{ color: color, marginTop: '10px' }}>
        {percent > 90 ? '⚠️ Near budget limit!' : percent > 75 ? '🔶 High usage' : '✅ On track'}
      </p>
    </div>
  );
}

export default BudgetGauge;
