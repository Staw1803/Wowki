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
  const divTerm = useRef<HTMLDivElement>(null);
  const termObj = useRef<Terminal | null>(null);
  const fitObj = useRef<FitAddon | null>(null);
  const socketConn = useRef<WebSocket | null>(null);

  // Guarda a linha atual digitada pra checar se acertou a flag/comando
  const bufferLinha = useRef<string>('');

  useEffect(() => {
    if (!divTerm.current) return;

    // Configura o xterm.js com um visual escuro minimalista
    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: 'underline',
      theme: {
        background: '#0c0c0e',
        foreground: '#f4f4f5',
        cursor: '#ffffff',
        black: '#09090b',
        red: '#ef4444',
        green: '#10b981',
        yellow: '#f59e0b',
        blue: '#e2e8f0',
        magenta: '#d946ef',
        cyan: '#06b6d4',
        white: '#ffffff',
      },
      fontSize: 13,
      fontFamily: 'var(--font-mono)',
      lineHeight: 1.2,
      rows: 24,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(divTerm.current);
    
    // Tenta ajustar o layout logo no inicio
    try {
      fitAddon.fit();
    } catch (err) {}

    // Refaz o ajuste assim que as fontes externas carregarem
    document.fonts.ready.then(() => {
      try {
        fitAddon.fit();
      } catch (err) {}
    });

    // Gambiarra de segurança: tenta rodar o fit mais uma vez depois de 300ms
    const timerFit = setTimeout(() => {
      try {
        fitAddon.fit();
      } catch (err) {}
    }, 300);

    termObj.current = term;
    fitObj.current = fitAddon;

    // Abre conexão com o servidor local
    const ws = new WebSocket('ws://localhost:8080');
    socketConn.current = ws;

    ws.onmessage = (e) => {
      term.write(e.data);
    };

    ws.onclose = () => {
      term.writeln('\r\n\x1b[1;31m[-] Conexão com o orquestrador encerrada.\x1b[0m');
    };

    ws.onerror = () => {
      term.writeln('\r\n\x1b[1;31m[Erro] Sem sinal do backend na porta 8080.\x1b[0m');
    };

    // Fica de olho no teclado do usuario
    term.onData((data) => {
      // Repassa as teclas pro container rodando no backend
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }

      const codigoChar = data.charCodeAt(0);

      // Usuário apertou enter
      if (data === '\r') {
        const cmd = bufferLinha.current.trim();
        const cmdLower = cmd.toLowerCase();
        bufferLinha.current = '';

        // Vê se é um desafio criado pela comunidade (não tem lista de comandos esperados)
        const ehComunidade = !('comandos_esperados' in lesson);

        if (ehComunidade) {
          // Validação por secret flag
          const flagAlvo = (lesson as any).secret_flag;
          if (flagAlvo && cmd.toLowerCase().includes(flagAlvo.toLowerCase())) {
            term.writeln('\r\n\x1b[1;32m[✓] FLAG CAPTURADA COM SUCESSO!\x1b[0m');
            term.writeln(`\x1b[1;32mParabéns! Você resolveu o desafio: ${(lesson as any).title}\x1b[0m`);
            onCommandSuccess();
          } else if (
            cmd !== '' &&
            !['ls', 'cd', 'pwd', 'cat', 'echo', 'clear', 'whoami', 'help'].includes(cmdLower)
          ) {
            onCommandFailed();
          }
        } else {
          // Validação por comando sequencial (aulas oficiais)
          const cmdEsperados = lesson.comandos_esperados || [];
          if (cmdEsperados.includes(cmdLower)) {
            onCommandSuccess();
          } else if (
            cmd !== '' &&
            !['ls', 'cd', 'pwd', 'cat', 'echo', 'clear', 'whoami', 'help'].includes(cmdLower)
          ) {
            onCommandFailed();
          }
        }
      } 
      // Usuário apertou backspace (127 é delete, 8 é backspace)
      else if (codigoChar === 127 || data === '\b') {
        if (bufferLinha.current.length > 0) {
          bufferLinha.current = bufferLinha.current.slice(0, -1);
        }
      } 
      // Caracteres comuns digitáveis
      else if (codigoChar >= 32 && codigoChar < 127) {
        bufferLinha.current += data;
      }
    });

    // Se o painel for redimensionado, ajusta o grid de colunas do terminal
    const observador = new ResizeObserver(() => {
      try {
        fitAddon.fit();
      } catch (err) {}
    });

    if (divTerm.current.parentElement) {
      observador.observe(divTerm.current.parentElement);
    }

    // Limpa a sujeira quando desmontar o componente
    return () => {
      ws.close();
      term.dispose();
      observador.disconnect();
      clearTimeout(timerFit);
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
        <div ref={divTerm} className="terminal-container" />
      </div>
    </div>
  );
};
