const WebSocket = require('ws');
const Docker = require('dockerode');
const net = require('net');
const http = require('http');

// Connect to local Docker API
const docker = new Docker();
const wss = new WebSocket.Server({ port: 8080 });

console.log('Servidor Orquestrador rodando na porta 8080...');

// Helper to demultiplex Docker stdout/stderr if Tty multiplexing is active
function decodeDockerStream(chunk) {
    if (!Buffer.isBuffer(chunk)) {
        return chunk.toString();
    }
    // Check for standard 8-byte header: [1 or 2, 0, 0, 0, ...]
    if (chunk.length >= 8 && (chunk[0] === 1 || chunk[0] === 2) && chunk[1] === 0 && chunk[2] === 0 && chunk[3] === 0) {
        let result = '';
        let offset = 0;
        while (offset + 8 <= chunk.length) {
            const type = chunk[offset];
            if (type !== 1 && type !== 2) {
                result += chunk.slice(offset).toString();
                break;
            }
            const len = chunk.readUInt32BE(offset + 4);
            const start = offset + 8;
            const end = start + len;
            if (end <= chunk.length) {
                result += chunk.slice(start, end).toString();
            } else {
                result += chunk.slice(start).toString();
            }
            offset = end;
        }
        return result;
    }
    return chunk.toString();
}

// ----------------------------------------------------
// 1. SIMULATED DEVICE SERVICES (TELNET & HTTP)
// ----------------------------------------------------

// TCP Port 8023 - Telnet Backdoor (ESP32 admin shell)
const telnetServer = net.createServer((socket) => {
    console.log('[+] Nova conexão Telnet de:', socket.remoteAddress);
    socket.write('\r\nWelcome to ESP32-Telnetd admin console.\r\nPassword: ');

    let inputBuffer = '';
    let authenticated = false;

    socket.on('data', (data) => {
        const str = data.toString();
        for (let i = 0; i < str.length; i++) {
            const char = str[i];
            if (char === '\n' || char === '\r') {
                const cmd = inputBuffer.trim();
                inputBuffer = '';
                if (!authenticated) {
                    if (cmd === 'admin123' || cmd === 'admin' || cmd === '12345') {
                        authenticated = true;
                        socket.write('\r\nAccess Granted.\r\nESP32-Shell> ');
                    } else {
                        socket.write('\r\nAccess Denied. Try again.\r\nPassword: ');
                    }
                } else {
                    if (cmd === 'help') {
                        socket.write('\r\nComandos disponíveis:\r\n  get_flag - Exibe a flag criptográfica do dispositivo\r\n  reboot   - Reinicia o microcontrolador\r\n  status   - Exibe informações do firmware\r\n  exit     - Encerra sessão\r\nESP32-Shell> ');
                    } else if (cmd === 'get_flag') {
                        socket.write('\r\n[✓] FLAG: flag{telnet_backdoor_accessed}\r\nESP32-Shell> ');
                    } else if (cmd === 'status') {
                        socket.write('\r\nUptime: 24h 12m\r\nBattery: 99% (Charging)\r\nSSID: Lab-Hacking-Wokwi\r\nModbus-State: Listening on port 502\r\nESP32-Shell> ');
                    } else if (cmd === 'reboot') {
                        socket.write('\r\nRebooting ESP32...\r\n');
                        socket.end();
                    } else if (cmd === 'exit') {
                        socket.write('\r\nEncerrando sessão.\r\n');
                        socket.end();
                    } else {
                        socket.write(`\r\nsh: ${cmd}: command not found\r\nESP32-Shell> `);
                    }
                }
            } else if (char.charCodeAt(0) === 127 || char.charCodeAt(0) === 8) { // Backspace
                if (inputBuffer.length > 0) {
                    inputBuffer = inputBuffer.slice(0, -1);
                    socket.write('\b \b');
                }
            } else {
                inputBuffer += char;
                if (authenticated) {
                    socket.write(char);
                } else {
                    socket.write('*');
                }
            }
        }
    });
});

telnetServer.listen(8023, '0.0.0.0', () => {
    console.log('[+] Simulador Telnet ativo na porta TCP 8023');
});

// TCP Port 8000 - HTTP REST API (ESP32 Web Server)
const httpServer = http.createServer((req, res) => {
    console.log(`[+] Nova requisição HTTP: ${req.method} ${req.url}`);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');

    if (req.url === '/' || req.url === '/api/status') {
        res.writeHead(200);
        res.end(JSON.stringify({
            device: 'ESP32-Smart-Gateway',
            status: 'active',
            uptime_seconds: 87120,
            fw_version: 'v1.0.4-dev-vuln',
            api_endpoints: ['/api/status', '/api/readings']
        }, null, 2));
    } else if (req.url === '/api/readings') {
        res.writeHead(200);
        res.end(JSON.stringify({
            temperature: 24.8,
            humidity: 59.2,
            voltage: 3.32
        }, null, 2));
    } else if (req.url === '/debug/credentials') {
        res.writeHead(200);
        res.end(JSON.stringify({
            admin_user: 'admin',
            admin_pass: 'admin123',
            secret_flag: 'flag{web_endpoint_disclosure}',
            warning: 'Rota de depuração ativa! Desative antes de compilar para produção!'
        }, null, 2));
    } else {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Not Found' }));
    }
});

httpServer.listen(8000, '0.0.0.0', () => {
    console.log('[+] Simulador HTTP API ativo na porta TCP 8000');
});


// ----------------------------------------------------
// 2. ORCHESTRATOR & DOCKER CONSOLE CONNECTION
// ----------------------------------------------------

wss.on('connection', async (ws) => {
    console.log('[+] Novo aluno conectado. Provisionando laboratório...');
    ws.send('\r\n[!] Iniciando ambiente isolado (Container Linux)...\r\n');

    let dockerReady = false;
    try {
        await docker.ping();
        dockerReady = true;
    } catch (e) {
        console.log('[!] Docker Desktop não detectado. Iniciando em MODO FALLBACK.');
        ws.send('\r\n[!] AVISO: Docker Desktop não localizado. Iniciando shell local...\r\n');
    }

    if (!dockerReady) {
        // Fallback Mock Shell with networking mock commands
        ws.send('\r\nWelcome to IoT-OS Shell! Type "help" to see tools.\r\n[!] O dispositivo IoT está acessível na rede em: host.docker.internal\r\n/ # ');
        let mockBuffer = '';
        let insideTelnet = false;
        let telnetAuth = false;
        let telnetBuffer = '';

        ws.on('message', async (msg) => {
            const char = msg.toString();

            // Direct input piping if interacting with the mock telnet shell
            if (insideTelnet) {
                if (char === '\r') {
                    const cmd = telnetBuffer.trim();
                    telnetBuffer = '';
                    ws.send('\r\n');
                    if (!telnetAuth) {
                        if (cmd === 'admin123' || cmd === 'admin' || cmd === '12345') {
                            telnetAuth = true;
                            ws.send('Access Granted.\r\nESP32-Shell> ');
                        } else {
                            ws.send('Access Denied. Try again.\r\nPassword: ');
                        }
                    } else {
                        if (cmd === 'help') {
                            ws.send('Comandos disponíveis:\r\n  get_flag - Exibe a flag criptográfica do dispositivo\r\n  reboot   - Reinicia o microcontrolador\r\n  status   - Exibe informações do firmware\r\n  exit     - Encerra sessão\r\nESP32-Shell> ');
                        } else if (cmd === 'get_flag') {
                            ws.send('[✓] FLAG: flag{telnet_backdoor_accessed}\r\nESP32-Shell> ');
                        } else if (cmd === 'status') {
                            ws.send('Uptime: 24h 12m\r\nBattery: 99% (Charging)\r\nSSID: Lab-Hacking-Wokwi\r\nESP32-Shell> ');
                        } else if (cmd === 'reboot' || cmd === 'exit') {
                            insideTelnet = false;
                            telnetAuth = false;
                            ws.send('Conexão encerrada.\r\n/ # ');
                        } else {
                            ws.send(`sh: ${cmd}: command not found\r\nESP32-Shell> `);
                        }
                    }
                } else if (char.charCodeAt(0) === 127 || char.charCodeAt(0) === 8) {
                    if (telnetBuffer.length > 0) {
                        telnetBuffer = telnetBuffer.slice(0, -1);
                        ws.send('\b \b');
                    }
                } else {
                    telnetBuffer += char;
                    if (telnetAuth) {
                        ws.send(char);
                    } else {
                        ws.send('*');
                    }
                }
                return;
            }

            if (char === '\r') {
                const cmdLine = mockBuffer.trim();
                const args = cmdLine.split(/\s+/);
                const cmd = args[0].toLowerCase();
                mockBuffer = '';
                ws.send('\r\n');

                if (cmd === 'help') {
                    ws.send('Ferramentas: nmap, curl, telnet, ls, whoami, clear, help\r\n');
                } else if (cmd === 'whoami') {
                    ws.send('root\r\n');
                } else if (cmd === 'clear') {
                    ws.send('\x1bc');
                } else if (cmd === 'ls') {
                    ws.send('bin/   etc/   lib/   root/   sys/   usr/   var/\r\n');
                } else if (cmd === 'nmap') {
                    const target = args[1];
                    if (!target) {
                        ws.send('nmap: Especifique o IP ou hostname do alvo (ex: nmap host.docker.internal)\r\n');
                    } else if (target.includes('host.docker.internal') || target.includes('localhost') || target.includes('127.0.0.1')) {
                        ws.send('Starting Nmap 7.92 ( https://nmap.org ) at ' + new Date().toISOString() + '\r\n');
                        ws.send('Nmap scan report for host.docker.internal (192.168.1.1)\r\n');
                        ws.send('Host is up (0.0021s latency).\r\n');
                        ws.send('Not shown: 998 closed tcp ports (reset)\r\n');
                        ws.send('PORT     STATE SERVICE\r\n');
                        ws.send('8000/tcp open  http-alt\r\n');
                        ws.send('8023/tcp open  telnet\r\n');
                        ws.send('\r\nNmap done: 1 IP address (1 host up) scanned in 0.45 seconds\r\n');
                    } else {
                        ws.send(`nmap: Host '${target}' parece fora de linha.\r\n`);
                    }
                } else if (cmd === 'curl') {
                    const url = args[1];
                    if (!url) {
                        ws.send('curl: Uso: curl http://<ip>:<porta>/rota\r\n');
                    } else if (url.includes('host.docker.internal:8000/debug/credentials') || url.includes('localhost:8000/debug/credentials')) {
                        ws.send('{\r\n');
                        ws.send('  "admin_user": "admin",\r\n');
                        ws.send('  "admin_pass": "admin123",\r\n');
                        ws.send('  "secret_flag": "flag{web_endpoint_disclosure}",\r\n');
                        ws.send('  "warning": "Rota de depuração ativa! Desative antes de compilar para produção!"\r\n');
                        ws.send('}\r\n');
                    } else if (url.includes('host.docker.internal:8000/api/status') || url.includes('localhost:8000/api/status')) {
                        ws.send('{\r\n  "device": "ESP32-Smart-Gateway",\r\n  "status": "active",\r\n  "uptime_seconds": 87120,\r\n  "fw_version": "v1.0.4-dev-vuln"\r\n}\r\n');
                    } else if (url.includes('host.docker.internal:8000') || url.includes('localhost:8000')) {
                        ws.send('{\r\n  "device": "ESP32-Smart-Gateway",\r\n  "status": "active"\r\n}\r\n');
                    } else {
                        ws.send('curl: (7) Failed to connect to host.\r\n');
                    }
                } else if (cmd === 'telnet') {
                    const host = args[1];
                    const port = args[2];
                    if (!host || !port) {
                        ws.send('telnet: Especifique o host e a porta (ex: telnet host.docker.internal 8023)\r\n');
                    } else if ((host.includes('host.docker.internal') || host.includes('localhost')) && port === '8023') {
                        insideTelnet = true;
                        ws.send('Connecting to host.docker.internal...\r\n');
                        ws.send('Escape character is \'^]\'.\r\n');
                        ws.send('\r\nWelcome to ESP32-Telnetd admin console.\r\nPassword: ');
                    } else {
                        ws.send(`telnet: Unable to connect to remote host: Connection refused\r\n`);
                    }
                } else if (cmdLine !== '') {
                    ws.send(`sh: ${cmdLine}: command not found\r\n`);
                }
                ws.send('/ # ');
            } else if (char.charCodeAt(0) === 127 || char.charCodeAt(0) === 8) {
                if (mockBuffer.length > 0) {
                    mockBuffer = mockBuffer.slice(0, -1);
                    ws.send('\b \b');
                }
            } else {
                mockBuffer += char;
                ws.send(char);
            }
        });
        return;
    }

    try {
        // Create an interactive Alpine container injected with the host network resolution
        const container = await docker.createContainer({
            Image: 'alpine',
            Cmd: ['/bin/sh'],
            Tty: true,
            OpenStdin: true,
            StdinOnce: false,
            HostConfig: {
                ExtraHosts: ["host.docker.internal:host-gateway"]
            }
        });

        await container.start();
        ws.send('[!] Container carregado. Instalando ferramentas de pentesting no background...\r\n');

        // Silently run apk updates in the background to install nmap, curl, and telnet
        const installExec = await docker.getContainer(container.id).exec({
            Cmd: ['/bin/sh', '-c', 'apk update && apk add nmap curl busybox-extras netcat-openbsd'],
            AttachStdout: false,
            AttachStderr: false
        });
        await installExec.start({ detach: true });

        // Start shell hijack connection
        const exec = await container.exec({
            Cmd: ['/bin/sh'],
            AttachStdin: true,
            AttachStdout: true,
            AttachStderr: true,
            Tty: true,
            Stdin: true
        });

        const stream = await exec.start({ stdin: true, hijack: true, Tty: true });
        ws.send('[✓] Terminal interativo estabelecido.\r\n');
        ws.send('[!] O dispositivo IoT está acessível na rede em: host.docker.internal\r\n');
        ws.send('[!] Experimente rodar: nmap host.docker.internal\r\n\r\n');

        // Pipe WebSocket input to Container Exec Stdin
        ws.on('message', (msg) => {
            if (stream && stream.writable) {
                stream.write(msg);
            }
        });

        // Pipe Container Exec Stdout/Stderr back to WebSocket, passing through our demuxer
        stream.on('data', (chunk) => {
            const cleanText = decodeDockerStream(chunk);
            ws.send(cleanText);
        });

        // Clean up on WebSocket disconnection
        ws.on('close', async () => {
            console.log('[-] Aluno desconectado. Encerrando e destruindo container...');
            try {
                stream.destroy();
                await container.stop();
                await container.remove();
            } catch (err) {
                console.error('[!] Erro ao limpar container:', err.message);
            }
        });

    } catch (err) {
        console.error('[Erro Fatal] Falha na infraestrutura:', err);
        ws.send(`\r\n[Erro Fatal] Falha na infraestrutura: ${err.message}\r\n`);
    }
});
