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
    setLoading(true);
    try {
      // Try API first (for local development)
      const response = await fetch('/api/usage');
      if (response.ok) {
        const data = await response.json();
        setTodayData(data.today);
        setWeekData(data.week);
        setAllTime(data.allTime);
        // Save to localStorage for GitHub Pages
        localStorage.setItem('usage_today', JSON.stringify(data.today));
        localStorage.setItem('usage_week', JSON.stringify(data.week));
        localStorage.setItem('usage_alltime', JSON.stringify(data.allTime));
        setLoading(false);
        return;
      }
    } catch (error) {
      console.log('API not available, using localStorage/demo data');
    }

    // Fallback to localStorage or demo data (for GitHub Pages)
    const storedToday = localStorage.getItem('usage_today');
    const storedWeek = localStorage.getItem('usage_week');
    const storedAllTime = localStorage.getItem('usage_alltime');

    if (storedToday && storedWeek) {
      setTodayData(JSON.parse(storedToday));
      setWeekData(JSON.parse(storedWeek));
      setAllTime(JSON.parse(storedAllTime || '{"totalTokens":0,"totalCost":0,"totalSessions":0}'));
    } else {
      // Use demo data
      setTodayData({
        date: new Date().toISOString().split('T')[0],
        models: {
          'MiniMax-M2.1': { totalTokens: 125000, totalCost: 8.75, calls: 42 }
        },
        totalTokens: 125000,
        totalCost: 8.75
      });
      setWeekData([
        { date: '02-06', totalCost: 12.50, totalTokens: 150000 },
        { date: '02-07', totalCost: 18.20, totalTokens: 220000 },
        { date: '02-08', totalCost: 15.00, totalTokens: 180000 },
        { date: '02-09', totalCost: 22.00, totalTokens: 280000 },
        { date: '02-10', totalCost: 9.50, totalTokens: 110000 },
        { date: '02-11', totalCost: 14.80, totalTokens: 175000 },
        { date: '02-12', totalCost: 8.75, totalTokens: 125000 }
      ]);
      setAllTime({
        totalTokens: 1250000,
        totalCost: 98.50,
        totalSessions: 287
      });
    }
    setLoading(false);
  };

  const handleExportCSV = () => {
    alert('Export requires local server. Run: npm run server');
  };

  const handleWeeklyReport = () => {
    alert('Weekly report requires local server. Run: npm run server');
  };

  const handleObsidianNote = () => {
    const note = generateObsidianNote();
    const blob = new Blob([note], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-usage-${new Date().toISOString().split('T')[0]}.md`;
    a.click();
  };

  const generateObsidianNote = () => {
    const data = todayData;
    const budget = 20;
    const budgetPercent = ((data?.totalCost || 0) / budget) * 100;
    
    let note = `# AI Usage - ${new Date().toISOString().split('T')[0]}\n\n`;
    note += `## Budget Status\n`;
    note += `- **Spent:** $${(data?.totalCost || 0).toFixed(2)} / $${budget}\n`;
    note += `- **Remaining:** $${(budget - (data?.totalCost || 0)).toFixed(2)}\n`;
    note += `- **Usage:** ${budgetPercent.toFixed(1)}%\n\n`;
    
    note += `## Model Usage\n\n`;
    note += `| Model | Tokens | Cost | Calls |\n`;
    note += `|-------|--------|------|-------|\n`;
    
    Object.entries(data?.models || {}).sort((a, b) => b[1].totalTokens - a[1].totalTokens).forEach(([model, stats]) => {
      note += `| ${model.split('/').pop()} | ${stats.totalTokens.toLocaleString()} | $${stats.cost.toFixed(4)} | ${stats.calls} |\n`;
    });
    
    note += `\n**Total:** ${(data?.totalTokens || 0).toLocaleString()} tokens, $${(data?.totalCost || 0).toFixed(4)}\n`;
    return note;
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        color: 'white'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>🤖</div>
          <div>Loading usage data...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      color: 'white',
      padding: '20px',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
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
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
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
              marginTop: '8px',
              fontSize: '14px'
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
          value={`$${(todayData?.totalCost || 0).toFixed(2)}`}
          subtitle={`${((todayData?.totalCost || 0) / DAILY_BUDGET * 100).toFixed(1)}% of budget`}
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
          value={`$${(allTime?.totalCost || 0).toFixed(2)}`}
          subtitle={`${((allTime?.totalTokens || 0) / 1000000).toFixed(2)}M tokens`}
          icon="🏆"
        />
      </div>

      {/* Main Content */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
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
        <h3 style={{ marginTop: 0, marginBottom: '15px' }}>⚡ Quick Actions</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={handleExportCSV} style={actionButtonStyle}>📥 Export CSV</button>
          <button onClick={handleWeeklyReport} style={actionButtonStyle}>📊 Weekly Report</button>
          <button onClick={handleObsidianNote} style={actionButtonStyle}>📝 Today's Obsidian Note</button>
        </div>
      </div>

      {/* Footer */}
      <div style={{ 
        marginTop: '30px', 
        textAlign: 'center', 
        opacity: 0.5, 
        fontSize: '12px',
        padding: '20px'
      }}>
        <p>OpenClaw Model Usage Dashboard</p>
        <p>Data requires local server for live updates</p>
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
  transition: 'all 0.2s ease'
};

export default App;
