import React from 'react';
import { WokwiSimulator } from './components/WokwiSimulator';
import { TerminalSimulator } from './components/TerminalSimulator';

const App: React.FC = () => {
  return (
    <>
      <header className="app-header">
        <div className="app-title-container">
          <span className="cyber-badge">SEC-OPS PANEL</span>
          <h1 className="app-title">IoT HACKING SIMULATOR</h1>
        </div>
        <div className="device-status">
          <div className="status-item">
            <span className="text-muted">SESSION:</span>
            <span style={{ color: 'var(--info-color)' }}>ACTIVE_ATTACK_VEC</span>
          </div>
          <div className="status-item">
            <span className="status-dot active" style={{ backgroundColor: 'var(--accent-color)', boxShadow: '0 0 10px var(--accent-color)' }}></span>
            <span>NODE_GATEWAY: CONNECTED</span>
          </div>
        </div>
      </header>

      <main className="dashboard-layout">
        <WokwiSimulator />
        <TerminalSimulator />
      </main>
    </>
  );
};

export default App;
