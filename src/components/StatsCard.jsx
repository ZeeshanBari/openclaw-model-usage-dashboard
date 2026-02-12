import React from 'react';

export default function StatsCard({ title, value, subtitle, icon }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      borderRadius: '12px',
      padding: '20px',
      color: 'white',
      minWidth: '150px'
    }}>
      <div style={{ fontSize: '14px', opacity: 0.8, marginBottom: '8px' }}>
        {icon} {title}
      </div>
      <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{value}</div>
      {subtitle && <div style={{ fontSize: '12px', opacity: 0.7 }}>{subtitle}</div>}
    </div>
  );
}
