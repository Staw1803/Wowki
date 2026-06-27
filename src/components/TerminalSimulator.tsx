import React, { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

export const TerminalSimulator: React.FC = () => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalInstance = useRef<Terminal | null>(null);
  const fitAddonInstance = useRef<FitAddon | null>(null);

  // Command history/line buffering states
  const lineBuffer = useRef<string>('');
  const isExecuting = useRef<boolean>(false);

  const prompt = '\r\n\x1b[1;32mguest@iot-hack-sim\x1b[0m:\x1b[1;34m~\x1b[0m$ ';

  const writeWelcomeMessage = (term: Terminal) => {
    term.writeln('\x1b[1;36m====================================================\x1b[0m');
    term.writeln('\x1b[1;36m*         IoT CYBERSECURITY SIMULATOR - v1.0.0      *\x1b[0m');
    term.writeln('\x1b[1;36m====================================================\x1b[0m');
    term.writeln('Welcome to the IoT attack emulator console.');
    term.writeln('Type \x1b[1;33mhelp\x1b[0m to list available hacking and utility commands.');
    term.writeln('');
    term.write('\x1b[1;32mguest@iot-hack-sim\x1b[0m:\x1b[1;34m~\x1b[0m$ ');
  };

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const runNmapScan = async (term: Terminal) => {
    isExecuting.current = true;
    term.writeln('');
    term.writeln('\x1b[1;33m[!] INITIALIZING PORT SCAN ON TARGET: 192.168.1.105 (ESP32-IoT-Node)\x1b[0m');
    await delay(600);
    term.writeln('[+] SYN Stealth Scan starting at ' + new Date().toISOString().replace('T', ' ').substring(0, 19));
    await delay(400);
    term.writeln('[.] Scanning 1000 ports...');
    
    // Progress bar animation
    const progressSteps = [
      { percentage: 15, bar: '===                   ' },
      { percentage: 38, bar: '=======               ' },
      { percentage: 67, bar: '==============        ' },
      { percentage: 89, bar: '==================    ' },
      { percentage: 100, bar: '======================' }
    ];

    for (const step of progressSteps) {
      await delay(500);
      // Carriage return to overwrite progress line
      term.write(`\r[.] [${step.bar}] ${step.percentage}% complete`);
    }

    term.writeln('\r\n');
    await delay(300);
    
    // Results
    term.writeln('\x1b[1;37mPORT     STATE SERVICE     VERSION\x1b[0m');
    term.writeln('22/tcp   \x1b[1;32mopen\x1b[0m  ssh         Dropbear sshd 2020.81 (protocol 2.0)');
    await delay(150);
    term.writeln('80/tcp   \x1b[1;32mopen\x1b[0m  http        Mongoose web server 6.18 (IoT Portal)');
    await delay(150);
    term.writeln('1883/tcp \x1b[1;32mopen\x1b[0m  mqtt        Mosquitto MQTT Broker (no auth)');
    await delay(150);
    term.writeln('8883/tcp \x1b[1;32mopen\x1b[0m  secure-mqtt Mosquitto MQTT Broker (TLS)');
    term.writeln('');
    
    await delay(400);
    term.writeln('MAC Address: 24:0A:C4:B8:3C:A2 (Espressif Inc.)');
    term.writeln('');
    
    await delay(300);
    term.writeln('\x1b[1;33m[!] Vulnerability Assessment:\x1b[0m');
    term.writeln('  - \x1b[1;31m[CRITICAL]\x1b[0m Port 1883 (MQTT Broker) is accessible without credentials.');
    term.writeln('             Attackers can publish/subscribe to control lines!');
    term.writeln('  - \x1b[1;33m[WARNING]\x1b[0m Dropbear SSH 2020.81 has known remote user authentication bypass quirks.');
    term.writeln('  - \x1b[1;32m[INFO]\x1b[0m HTTP server exposes device configurations in cleartext.');
    term.writeln('');
    term.writeln('\x1b[1;32m[+] Scan finished in 2.95s. 4 open ports discovered.\x1b[0m');
    
    isExecuting.current = false;
    term.write(prompt);
  };

  const runSysinfo = async (term: Terminal) => {
    isExecuting.current = true;
    term.writeln('');
    term.writeln('\x1b[1;34m[SYSTEM INFO - IOT SIMULATION TARGET]\x1b[0m');
    await delay(200);
    term.writeln('Device Model : ESP32-WROOM-32D Development Board');
    term.writeln('CPU Cores    : Xtensa Dual-Core 32-bit LX6 Microprocessor');
    term.writeln('RAM Size     : 520 KB SRAM');
    term.writeln('Storage      : 4 MB SPI Flash');
    await delay(200);
    term.writeln('Firmware     : FreeRTOS Kernel V10.2.0 (Custom Build)');
    term.writeln('Network Mode : Station & AP (IEEE 802.11 b/g/n)');
    term.writeln('IP Address   : 192.168.1.105 (DHCP Lease)');
    term.writeln('Uptime       : 0 days, 2 hours, 14 minutes');
    term.writeln('MAC Address  : 24:0A:C4:B8:3C:A2');
    term.writeln('Firmware Hash: sha256_b3769c0d12e95a980753b81123fd3892');
    isExecuting.current = false;
    term.write(prompt);
  };

  const handleCommand = (cmd: string, term: Terminal) => {
    const trimmed = cmd.trim().toLowerCase();

    if (trimmed === 'nmap') {
      runNmapScan(term);
    } else if (trimmed === 'sysinfo') {
      runSysinfo(term);
    } else if (trimmed === 'clear') {
      term.clear();
      term.write('guest@iot-hack-sim:~$ ');
    } else if (trimmed === 'help') {
      term.writeln('');
      term.writeln('Available IoT Security Tools:');
      term.writeln('  \x1b[1;32mnmap\x1b[0m       - Perform network port scanning on the target IoT device');
      term.writeln('  \x1b[1;32msysinfo\x1b[0m    - Get hardware and OS details from the target node');
      term.writeln('  \x1b[1;32mclear\x1b[0m      - Clear console output');
      term.writeln('  \x1b[1;32mhelp\x1b[0m       - Display this commands index page');
      term.writeln('  \x1b[1;32mabout\x1b[0m      - Learn more about the simulator');
      term.write(prompt);
    } else if (trimmed === 'about') {
      term.writeln('');
      term.writeln('\x1b[1;35m[IoT HackSim Console]\x1b[0m');
      term.writeln('An interactive environment built with React, xterm.js, and Wokwi.');
      term.writeln('Simulate embedded firmware hacking, serial debugging, and port exploitation.');
      term.writeln('Developed for security training and educational labs.');
      term.write(prompt);
    } else if (trimmed === '') {
      term.write(prompt);
    } else {
      term.writeln('');
      term.writeln(`\x1b[1;31msh: command not found: ${cmd}\x1b[0m`);
      term.writeln('Type \x1b[1;33mhelp\x1b[0m to list valid tools.');
      term.write(prompt);
    }
  };

  useEffect(() => {
    if (!terminalRef.current) return;

    // Initialize Terminal
    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: 'underline',
      theme: {
        background: '#03070c',
        foreground: '#00ff66', // matrix green
        cursor: '#00ff66',
        black: '#000000',
        red: '#ff3366',
        green: '#00ff66',
        yellow: '#ffcc00',
        blue: '#0099ff',
        magenta: '#ff00ff',
        cyan: '#00e5ff',
        white: '#ffffff',
      },
      fontSize: 14,
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

    writeWelcomeMessage(term);

    // Keyboard and Data input handler
    term.onData((data) => {
      if (isExecuting.current) return; // block inputs during command scans

      const charCode = data.charCodeAt(0);

      if (data === '\r') {
        // Enter pressed
        const cmd = lineBuffer.current;
        lineBuffer.current = '';
        handleCommand(cmd, term);
      } else if (charCode === 127 || data === '\b') {
        // Backspace
        if (lineBuffer.current.length > 0) {
          lineBuffer.current = lineBuffer.current.slice(0, -1);
          term.write('\b \b'); // erase last char on screen
        }
      } else if (charCode >= 32 && charCode < 127) {
        // Normal printable characters
        lineBuffer.current += data;
        term.write(data);
      }
    });

    // Resize observer to keep xterm fitted to its container
    const resizeObserver = new ResizeObserver(() => {
      try {
        fitAddon.fit();
      } catch (err) {
        // Ignore container dimensions being zero during transitions
      }
    });
    
    if (terminalRef.current.parentElement) {
      resizeObserver.observe(terminalRef.current.parentElement);
    }

    return () => {
      term.dispose();
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div className="panel panel-right">
      <div className="panel-header">
        <div className="panel-title">INTERACTIVE ATTACK SHELL</div>
        <div className="device-status">
          <div className="status-item">
            <span>IF: eth0</span>
          </div>
          <div className="status-item">
            <span className="status-dot active"></span>
            <span>SHELL READY</span>
          </div>
        </div>
      </div>
      <div className="panel-content">
        <div ref={terminalRef} className="terminal-container" />
      </div>
    </div>
  );
};
