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

  const lineBuffer = useRef<string>('');
  const isExecuting = useRef<boolean>(false);
  const correctCommandsEntered = useRef<string[]>([]);

  const prompt = '\r\n\x1b[1;34mstudent@classroom\x1b[0m:\x1b[1;36m~\x1b[0m$ ';

  const writeWelcome = (term: Terminal) => {
    term.clear();
    term.writeln('\x1b[1;34m====================================================\x1b[0m');
    term.writeln('\x1b[1;34m*          IOT SECURITY LABORATORY CONSOLE          *\x1b[0m');
    term.writeln('\x1b[1;34m====================================================\x1b[0m');
    term.writeln(`Aula ativa: ${lesson.titulo}`);
    term.writeln('Execute o passo a passo descrito no painel do instrutor.');
    term.writeln('Digite \x1b[1;33mhelp\x1b[0m para ver as ferramentas globais do console.');
    if (isCompleted) {
      term.writeln('\x1b[1;32m[✓] STATUS: Lição concluída com sucesso!\x1b[0m');
    } else {
      term.writeln('STATUS: Aguardando comandos do exploit...');
    }
    term.write(prompt);
  };

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  // Reset progress within the current lesson
  const resetProgress = () => {
    correctCommandsEntered.current = [];
    lineBuffer.current = '';
    isExecuting.current = false;
    if (terminalInstance.current) {
      writeWelcome(terminalInstance.current);
    }
  };

  // Trigger reset whenever the lesson changes
  useEffect(() => {
    resetProgress();
  }, [lesson]);

  const runCommandSimulation = async (cmd: string, term: Terminal) => {
    isExecuting.current = true;

    const lowerCmd = cmd.trim().toLowerCase();
    const expected = lesson.comandos_esperados;
    const currentStepIndex = correctCommandsEntered.current.length;

    // Check if the command entered is the next expected one
    if (currentStepIndex < expected.length && expected[currentStepIndex] === lowerCmd) {
      correctCommandsEntered.current.push(lowerCmd);
      term.writeln('');
      
      // Simulating command execution
      term.writeln(`[+] Executando utilitário: ${lowerCmd}...`);
      await delay(800);

      // Show intermediate execution details
      if (lowerCmd === 'wireshark') {
        term.writeln('[.] Escaneando interfaces... Interface ativa [eth0] selecionada.');
        await delay(500);
        term.writeln('[.] Capturando tráfego na rede local...');
        term.writeln('[+] Monitoramento em execução. Pronto para filtrar pacotes.');
      } else if (lowerCmd === 'ws-sniff') {
        term.writeln('[.] Abrindo socket decodificador e escutando na porta 8080...');
        await delay(600);
        term.writeln('[!] Tráfego WebSocket detectado!');
        term.writeln('    Payload: {"action":"auth", "user":"admin", "pass":"IoT_s3cur3_p@ss"}');
      } else if (lowerCmd === 'lsusb') {
        term.writeln('Bus 001 Device 003: ID 303a:1001 Espressif ESP32-S3 USB DevKit');
        term.writeln('Bus 001 Device 001: ID 1d6b:0002 Linux Foundation 2.0 root hub');
      } else if (lowerCmd === 'esptool') {
        term.writeln('[.] Conectando ao ESP32 via /dev/ttyUSB0 (baud 115200)...');
        await delay(600);
        term.writeln('[.] Chip: ESP32-S3 (revision v0.0)');
        term.writeln('[.] Lendo flash da posição 0x00000 até 0x100000...');
        term.writeln('[+] Dump finalizado e salvo em firmware_dump.bin.');
      } else if (lowerCmd === 'mqtt-sub') {
        term.writeln('[.] Conectando ao MQTT Broker local (192.168.1.105:1883)...');
        await delay(500);
        term.writeln('[+] Conectado. Escutando todos os tópicos (#)...');
        term.writeln('    Tópico: casa/seguranca/status  Payload: {"status": "locked"}');
      } else if (lowerCmd === 'mqtt-pub') {
        term.writeln('[.] Enviando pacote de publicação MQTT...');
        await delay(500);
        term.writeln('[+] Mensagem enviada para o broker.');
      } else if (lowerCmd === 'binwalk') {
        term.writeln('Scan da imagem de firmware: firmware_dump.bin');
        term.writeln('DECIMAL       HEXADECIMAL     DESCRIPTION');
        term.writeln('--------------------------------------------------------------------------------');
        term.writeln('0             0x0             Squashfs filesystem, little endian, version 4.0');
        term.writeln('1048576       0x100000        POSIX tar archive (gzip)');
      } else if (lowerCmd === 'strings') {
        term.writeln('[.] Buscando constantes e dados em formato ASCII...');
        await delay(400);
        term.writeln('wifi_password=admin_private_ap_123');
        term.writeln('api_endpoint=http://api.manufacturer.com/v2/config');
      } else if (lowerCmd === 'curl') {
        term.writeln('[.] Requisitando painel de gerenciamento web...');
        await delay(500);
        term.writeln('HTTP/1.1 200 OK | Server: Mongoose/6.18');
        term.writeln('API Endpoint: /api/ping?host=<ip>');
      } else if (lowerCmd === 'inject-ping') {
        term.writeln('[.] Enviando carga útil para injeção de shell no formulário...');
        await delay(600);
        term.writeln('[+] Shell capturado via Injeção de Comando.');
      } else if (lowerCmd === 'rf-record') {
        term.writeln('[.] Inicializando gravação SDR na faixa de 433.92MHz...');
        await delay(800);
        term.writeln('[+] Captura concluída. 1 sinal gravado em wave_sdr.rf');
      } else if (lowerCmd === 'rf-replay') {
        term.writeln('[.] Modulando e retransmitindo sinal via SDR...');
        await delay(600);
        term.writeln('[+] Sinal transmitido no espectro.');
      } else if (lowerCmd === 'hydra') {
        term.writeln('[.] Iniciando dicionário contra SSH na porta 22...');
        await delay(600);
        term.writeln('[+] Tentando admin:admin...');
        term.writeln('[+] Tentando admin:admin123 ... CRASH!');
        term.writeln('    Chave encontrada -> user: admin | pass: admin123');
      } else if (lowerCmd === 'ssh') {
        term.writeln('[.] Conectando via SSH em admin@192.168.1.105...');
        await delay(500);
        term.writeln('[+] Sessão autenticada. Acesso shell ativo.');
      } else if (lowerCmd === 'modbus-read') {
        term.writeln('Modbus Registers Dump:');
        term.writeln('Address: 40001 | Value: 24 (Turbine Temperature)');
        term.writeln('Address: 40002 | Value: 1200 (RPM)');
      } else if (lowerCmd === 'modbus-write') {
        term.writeln('[.] Enviando frame Modbus TCP (Write Single Register)...');
        await delay(400);
        term.writeln('[+] Registrador modificado no PLC.');
      } else if (lowerCmd === 'hcitool') {
        term.writeln('[.] Ativando escaneamento BLE passivo...');
        await delay(600);
        term.writeln('Dispositivos localizados:');
        term.writeln('  AA:BB:CC:DD:EE:FF  SmartLock_V3');
      } else if (lowerCmd === 'gatttool') {
        term.writeln('[.] Conectando ao descritor GATT AA:BB:CC:DD:EE:FF...');
        await delay(600);
        term.writeln('[+] Escrevendo valor hexadecimal 0x01 no canal de trava...');
      } else if (lowerCmd === 'dns-spoof') {
        term.writeln('[.] Inicializando envenenamento DNS ARP...');
        await delay(500);
        term.writeln('[+] Redirecionando tráfego do domínio de update para 192.168.1.100.');
      } else if (lowerCmd === 'fota-poison') {
        term.writeln('[.] Hospedando servidor local de FOTA...');
        await delay(600);
        term.writeln('[.] Transferindo imagem corrompida de atualização...');
      }

      // Check if all expected commands for this lesson are now entered
      if (correctCommandsEntered.current.length === expected.length) {
        await delay(600);
        term.writeln('');
        // Print success message from lesson metadata
        term.writeln(`\x1b[1;32m${lesson.sucesso_msg}\x1b[0m`);
        onCommandSuccess();
      }
    } else {
      // Incorrect command entered
      term.writeln('');
      if (lowerCmd === 'help') {
        term.writeln('Utilitários globais do console:');
        term.writeln('  help  - Exibe esta página de ajuda');
        term.writeln('  clear - Limpa os logs do terminal');
        term.writeln('  about - Informações do laboratório');
      } else if (lowerCmd === 'clear') {
        term.clear();
      } else if (lowerCmd === 'about') {
        term.writeln('Laboratório de Hacking IoT. Complete as etapas descritas.');
      } else {
        term.writeln(`\x1b[1;31msh: comando inválido ou incorreto para esta etapa: ${cmd}\x1b[0m`);
        // Notify parent of failed input
        onCommandFailed();
      }
    }

    isExecuting.current = false;
    term.write(prompt);
  };

  useEffect(() => {
    if (!terminalRef.current) return;

    // Initialize Terminal
    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: 'underline',
      theme: {
        background: '#0c0c0e',
        foreground: '#f4f4f5', // Zinc 100
        cursor: '#2563eb', // Royal Blue
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
    fitAddon.fit();

    terminalInstance.current = term;
    fitAddonInstance.current = fitAddon;

    writeWelcome(term);

    term.onData((data) => {
      if (isExecuting.current) return;

      const charCode = data.charCodeAt(0);

      if (data === '\r') {
        const cmd = lineBuffer.current;
        lineBuffer.current = '';
        runCommandSimulation(cmd, term);
      } else if (charCode === 127 || data === '\b') {
        if (lineBuffer.current.length > 0) {
          lineBuffer.current = lineBuffer.current.slice(0, -1);
          term.write('\b \b');
        }
      } else if (charCode >= 32 && charCode < 127) {
        lineBuffer.current += data;
        term.write(data);
      }
    });

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
      term.dispose();
      resizeObserver.disconnect();
    };
  }, [lesson, isCompleted]);

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-title">TERMINAL DE COMANDO</div>
        <div className="device-status">
          <div className="status-item">
            <span>TTY: /dev/pts/1</span>
          </div>
        </div>
      </div>
      <div className="panel-content">
        <div ref={terminalRef} className="terminal-container" />
      </div>
    </div>
  );
};
