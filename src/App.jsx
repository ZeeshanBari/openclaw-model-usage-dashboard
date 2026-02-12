import React, { useState, useEffect } from 'react';
import BudgetGauge from './components/BudgetGauge';
import UsageChart from './components/UsageChart';
import ModelBreakdown from './components/ModelBreakdown';
import StatsCard from './components/StatsCard';

const DAILY_BUDGET = 20;

function App() {
  const [todayData, setTodayData] = useState(null);
  const [weekData, setWeekData] = useState([]);
  const [allTime, setAllTime] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/usage');
      const data = await response.json();
      setTodayData(data.today);
      setWeekData(data.week);
      setAllTime(data.allTime);
    } catch (error) {
      console.error('Failed to fetch usage data:', error);
      // Use demo data if API fails
      setTodayData({
        date: new Date().toISOString().split('T')[0],
        models: {
          'minimax/MiniMax-M2.1': { totalTokens: 125000, totalCost: 8.75, calls: 42 }
        },
        totalTokens: 125000,
        totalCost: 8.75
      });
      setWeekData([
        { date: '2026-02-06', totalCost: 12.50, totalTokens: 150000 },
        { date: '2026-02-07', totalCost: 18.20, totalTokens: 220000 },
        { date: '2026-02-08', totalCost: 15.00, totalTokens: 180000 },
        { date: '2026-02-09', totalCost: 22.00, totalTokens: 280000 },
        { date: '2026-02-10', totalCost: 9.50, totalTokens: 110000 },
        { date: '2026-02-11', totalCost: 14.80, totalTokens: 175000 },
        { date: '2026-02-12', totalCost: 8.75, totalTokens: 125000 }
      ]);
      setAllTime({
        totalTokens: 1250000,
        totalCost: 98.50,
        totalSessions: 287
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Loading usage data...</div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      color: 'white',
      padding: '20px'
    }}>
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '30px',
        paddingBottom: '20px',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px' }}>🤖 Model Usage Dashboard</h1>
          <p style={{ margin: '5px 0 0', opacity: 0.7, fontSize: '14px' }}>
            MiniMax M2.1 Plan • ${DAILY_BUDGET}/day budget
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '12px', opacity: 0.7 }}>
            Last updated: {new Date().toLocaleString()}
          </div>
          <button 
            onClick={fetchData}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              marginTop: '5px'
            }}
          >
            🔄 Refresh
          </button>
        </div>
      </header>

      {/* Stats Row */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '20px',
        marginBottom: '30px'
      }}>
        <StatsCard 
          title="Today's Spend" 
          value={`$${todayData?.totalCost?.toFixed(2) || '0.00'}`}
          subtitle={`${((todayData?.totalCost / DAILY_BUDGET) * 100 || 0).toFixed(1)}% of budget`}
          icon="💰"
        />
        <StatsCard 
          title="Tokens Today" 
          value={(todayData?.totalTokens || 0).toLocaleString()}
          subtitle="input + output"
          icon="📊"
        />
        <StatsCard 
          title="Weekly Total" 
          value={`$${weekData.reduce((sum, d) => sum + d.totalCost, 0).toFixed(2)}`}
          subtitle="last 7 days"
          icon="📅"
        />
        <StatsCard 
          title="All Time" 
          value={`$${allTime?.totalCost?.toFixed(2) || '0.00'}`}
          subtitle={`${((allTime?.totalTokens || 0) / 1000000).toFixed(2)}M tokens`}
          icon="🏆"
        />
      </div>

      {/* Main Content */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Budget Gauge */}
        <div style={{ 
          background: 'rgba(255,255,255,0.05)', 
          borderRadius: '16px', 
          padding: '20px' 
        }}>
          <BudgetGauge used={todayData?.totalCost || 0} budget={DAILY_BUDGET} />
        </div>

        {/* Model Breakdown */}
        <div style={{ 
          background: 'rgba(255,255,255,0.05)', 
          borderRadius: '16px', 
          padding: '20px' 
        }}>
          <ModelBreakdown models={todayData?.models || {}} />
        </div>
      </div>

      {/* Weekly Chart */}
      <div style={{ 
        background: 'rgba(255,255,255,0.05)', 
        borderRadius: '16px', 
        padding: '20px',
        marginTop: '20px' 
      }}>
        <UsageChart data={weekData} />
      </div>

      {/* Quick Actions */}
      <div style={{ 
        marginTop: '30px',
        padding: '20px',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '12px'
      }}>
        <h3 style={{ marginTop: 0 }}>⚡ Quick Actions</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => window.open('/api/export/csv', '_blank')}
            style={actionButtonStyle}
          >
            📥 Export CSV
          </button>
          <button 
            onClick={() => window.open('/api/export/weekly', '_blank')}
            style={actionButtonStyle}
          >
            📊 Weekly Report
          </button>
          <button 
            onClick={() => window.open('/api/obsidian/daily', '_blank')}
            style={actionButtonStyle}
          >
            📝 Today's Obsidian Note
          </button>
        </div>
      </div>
    </div>
  );
}

const actionButtonStyle = {
  background: 'rgba(255,255,255,0.1)',
  border: 'none',
  color: 'white',
  padding: '10px 20px',
  borderRadius: '8px',
  cursor: 'pointer',
  transition: 'background 0.2s'
};

export default App;
