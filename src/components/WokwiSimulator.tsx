import React, { useState } from 'react';

export const WokwiSimulator: React.FC = () => {
  const defaultProjectUrl = 'https://wokwi.com/projects/349107446543155796?embed=1';
  const [inputUrl, setInputUrl] = useState(defaultProjectUrl);
  const [iframeUrl, setIframeUrl] = useState(defaultProjectUrl);

  const handleLoadUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim()) return;

    let processedUrl = inputUrl.trim();
    // Helper to format URL or ID into a clean embed URL
    if (/^\d+$/.test(processedUrl)) {
      // Just a project ID
      processedUrl = `https://wokwi.com/projects/${processedUrl}?embed=1`;
    } else if (processedUrl.includes('wokwi.com') && !processedUrl.includes('embed=1')) {
      // Wokwi URL but missing embed param
      const separator = processedUrl.includes('?') ? '&' : '?';
      processedUrl = `${processedUrl}${separator}embed=1`;
    }

    setIframeUrl(processedUrl);
    setInputUrl(processedUrl);
  };

  const handleReset = () => {
    setIframeUrl(defaultProjectUrl);
    setInputUrl(defaultProjectUrl);
  };

  return (
    <div className="panel panel-left">
      <div className="panel-header">
        <div className="panel-title">WOKWI IoT EMULATOR</div>
        <form onSubmit={handleLoadUrl} style={{ display: 'flex', gap: '8px', flex: 1, justifySelf: 'center', maxWidth: '400px', margin: '0 16px' }}>
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            placeholder="Wokwi URL or Project ID..."
            style={{
              flex: 1,
              background: 'rgba(5, 8, 12, 0.8)',
              border: '1px solid var(--panel-border)',
              borderRadius: '4px',
              padding: '2px 8px',
              color: 'var(--accent-color)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            style={{
              background: 'rgba(0, 255, 102, 0.1)',
              border: '1px solid var(--accent-color)',
              borderRadius: '4px',
              padding: '2px 10px',
              color: 'var(--accent-color)',
              fontFamily: 'var(--font-tech)',
              fontSize: '0.75rem',
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Load
          </button>
          <button
            type="button"
            onClick={handleReset}
            style={{
              background: 'rgba(100, 116, 139, 0.1)',
              border: '1px solid var(--text-muted)',
              borderRadius: '4px',
              padding: '2px 8px',
              color: 'var(--text-color)',
              fontFamily: 'var(--font-tech)',
              fontSize: '0.75rem',
              cursor: 'pointer',
            }}
          >
            Reset
          </button>
        </form>
        <div className="panel-actions">
          <span className="dot-btn"></span>
          <span className="dot-btn"></span>
          <span className="dot-btn"></span>
        </div>
      </div>
      <div className="panel-content" style={{ backgroundColor: '#151b23' }}>
        {iframeUrl ? (
          <iframe
            src={iframeUrl}
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
              flexDirection: 'column',
              gap: '12px',
              color: 'var(--text-muted)',
            }}
          >
            <p>No Wokwi project loaded</p>
            <button
              onClick={handleReset}
              style={{
                background: 'transparent',
                border: '1px dashed var(--accent-color)',
                color: 'var(--accent-color)',
                padding: '6px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Load Default ESP32 Project
            </button>
          </div>
        )}
        <div className="wokwi-overlay-info">
          <strong>SIMULATOR NODE STATUS:</strong> Online | <strong>TARGET ARCH:</strong> ESP32-S3 | <strong>INTERFACE:</strong> UART0 / GPIO-MUX
        </div>
      </div>
    </div>
  );
};
