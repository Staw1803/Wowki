import React, { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

interface Lesson {
  id: number;
  titulo: string;
  teoria: string;
  wokwi_url: string;
  comandos_esperados: string[];
  objetivo: string;
  passo_a_passo: string;
  dica: string;
  sucesso_msg: string;
}

interface TerminalSimulatorProps {
  lesson: Lesson;
  isCompleted: boolean;
  onCommandSuccess: () => void;
  onCommandFailed: () => void;
}

export const TerminalSimulator: React.FC<TerminalSimulatorProps> = ({
  lesson,
  isCompleted,
  onCommandSuccess,
  onCommandFailed,
}) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalInstance = useRef<Terminal | null>(null);
  const fitAddonInstance = useRef<FitAddon | null>(null);
  const websocketRef = useRef<WebSocket | null>(null);

  // Line buffer to spy on user commands for lesson completion
  const lineBuffer = useRef<string>('');

  useEffect(() => {
    if (!terminalRef.current) return;

    // Initialize Terminal
    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: 'underline',
      theme: {
        background: '#0c0c0e',
        foreground: '#f4f4f5',
        cursor: '#2563eb',
        black: '#09090b',
        red: '#ef4444',
        green: '#10b981',
        yellow: '#f59e0b',
        blue: '#2563eb',
        magenta: '#d946ef',
        cyan: '#06b6d4',
        white: '#f4f4f5',
      },
      fontSize: 13,
      fontFamily: 'var(--font-mono)',
      lineHeight: 1.2,
      rows: 24,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    term.open(terminalRef.current);
    
    // Fit immediately, when fonts are ready, and after a short delay
    try {
      fitAddon.fit();
    } catch (e) {}

    document.fonts.ready.then(() => {
      try {
        fitAddon.fit();
      } catch (e) {}
    });

    const initialFitTimeout = setTimeout(() => {
      try {
        fitAddon.fit();
      } catch (e) {}
    }, 300);

    terminalInstance.current = term;
    fitAddonInstance.current = fitAddon;

    // Connect to our Orchestrator Backend
    const ws = new WebSocket('ws://localhost:8080');
    websocketRef.current = ws;

    ws.onmessage = (event) => {
      term.write(event.data);
    };

    ws.onclose = () => {
      term.writeln('\r\n\x1b[1;31m[-] Conexão com o Orquestrador Docker perdida.\x1b[0m');
    };

    ws.onerror = () => {
      term.writeln('\r\n\x1b[1;31m[Erro] Não foi possível conectar ao servidor backend em ws://localhost:8080\x1b[0m');
    };

    // Keystroke typing listener
    term.onData((data) => {
      // 1. Send data to Docker container
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }

      // 2. Track local input buffer to trigger classroom victories
      const charCode = data.charCodeAt(0);

      if (data === '\r') {
        const cmd = lineBuffer.current.trim().toLowerCase();
        lineBuffer.current = '';

        // Check if the typed command is one of the expected commands for this lesson
        const expected = lesson.comandos_esperados;
        if (expected.includes(cmd)) {
          // Trigger success callback
          onCommandSuccess();
        } else if (
          cmd !== '' &&
          !['ls', 'cd', 'pwd', 'cat', 'echo', 'clear', 'whoami', 'help'].includes(cmd)
        ) {
          // If they typed something incorrect (that is not a standard shell command)
          onCommandFailed();
        }
      } else if (charCode === 127 || data === '\b') {
        if (lineBuffer.current.length > 0) {
          lineBuffer.current = lineBuffer.current.slice(0, -1);
        }
      } else if (charCode >= 32 && charCode < 127) {
        lineBuffer.current += data;
      }
    });

    // Resize listener
    const resizeObserver = new ResizeObserver(() => {
      try {
        fitAddon.fit();
      } catch (err) {
        // Safe check
      }
    });

    if (terminalRef.current.parentElement) {
      resizeObserver.observe(terminalRef.current.parentElement);
    }

    return () => {
      ws.close();
      term.dispose();
      resizeObserver.disconnect();
      clearTimeout(initialFitTimeout);
    };
  }, [lesson]);

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-title">TERMINAL DE COMANDO</div>
        <div className="device-status">
          <div className="status-item">
            <span style={{ color: isCompleted ? 'var(--success-color)' : 'var(--accent-color)', fontWeight: 'bold' }}>
              {isCompleted ? '✓ RESOLVIDO' : '• ATIVO'}
            </span>
          </div>
          <div className="status-item">
            <span>MODO: DOCKER DUPLEX</span>
          </div>
        </div>
      </div>
      <div className="panel-content">
        <div ref={terminalRef} className="terminal-container" />
      </div>
    </div>
  );
};
