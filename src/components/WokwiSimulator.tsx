import React from 'react';

interface WokwiSimulatorProps {
  wokwiUrl: string;
}

export const WokwiSimulator: React.FC<WokwiSimulatorProps> = ({ wokwiUrl }) => {
  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-title">
          <span>LABORATÓRIO DE CIRCUITO (WOKWI)</span>
        </div>
        <div className="status-item" style={{ fontSize: '0.75rem' }}>
          <span className="status-dot active" style={{ backgroundColor: 'var(--accent-color)' }}></span>
          <span>PLACA CONECTADA</span>
        </div>
      </div>
      <div className="panel-content" style={{ backgroundColor: '#151b23' }}>
        {wokwiUrl ? (
          <iframe
            src={wokwiUrl}
            className="wokwi-iframe"
            title="Wokwi Simulator"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div
            style={{
              display: 'flex',
              height: '100%',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
            }}
          >
            Selecione uma aula para carregar o circuito do laboratório.
          </div>
        )}
      </div>
    </div>
  );
};
