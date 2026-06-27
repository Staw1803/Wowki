const WebSocket = require('ws');
const Docker = require('dockerode');

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
// ORCHESTRATOR & DOCKER CONSOLE CONNECTION (UBUNTU)
// ----------------------------------------------------

wss.on('connection', async (ws) => {
    console.log('[+] Novo aluno conectado. Provisionando laboratório...');
    ws.send('\r\n[!] Iniciando ambiente isolado (Container Ubuntu Linux)...\r\n');

    let dockerReady = false;
    try {
        await docker.ping();
        dockerReady = true;
    } catch (e) {
        console.log('[!] Docker Desktop não detectado. Iniciando em MODO FALLBACK.');
        ws.send('\r\n[!] AVISO: Docker Desktop não localizado. Iniciando shell local...\r\n');
    }

    if (!dockerReady) {
        // Fallback Mock Shell simulating Ubuntu and APT package manager
        ws.send('\r\nWelcome to IoT-OS (Ubuntu 22.04.3 LTS) Mock Shell! Type "help" to see tools.\r\n[!] O ambiente está isolado. O ataque de injeção IoT deve ser direcionado ao broker MQTT público em: broker.hivemq.com\r\nroot@iot-academy:~# ');
        let mockBuffer = '';
        let installedPackages = new Set(['curl', 'strings']);

        ws.on('message', async (msg) => {
            const char = msg.toString();

            if (char === '\r') {
                const cmdLine = mockBuffer.trim();
                const args = cmdLine.split(/\s+/);
                const cmd = args[0].toLowerCase();
                mockBuffer = '';
                ws.send('\r\n');

                if (cmd === 'help') {
                    ws.send('Ferramentas instaladas: ls, whoami, clear, help, apt-get, apt\r\nFerramentas de Pentest (instale via apt-get): nmap, mosquitto-clients, telnet\r\n');
                } else if (cmd === 'whoami') {
                    ws.send('root\r\n');
                } else if (cmd === 'clear') {
                    ws.send('\x1bc');
                } else if (cmd === 'ls') {
                    ws.send('bin/   boot/  dev/   etc/   home/  lib/   mnt/   opt/   root/  run/   sbin/  srv/   sys/   tmp/   usr/   var/\r\n');
                } else if (cmd === 'apt-get' || cmd === 'apt') {
                    const action = args[1];
                    const pkg = args[2];

                    if (action === 'install') {
                        if (!pkg) {
                            ws.send('E: Especifique o pacote para instalar (ex: apt-get install nmap)\r\n');
                        } else {
                            const cleanPkg = pkg.toLowerCase();
                            ws.send(`Reading package lists... Done\r\n`);
                            ws.send(`Building dependency tree... Done\r\n`);
                            ws.send(`Reading state information... Done\r\n`);
                            ws.send(`The following NEW packages will be installed:\r\n  ${cleanPkg}\r\n`);
                            ws.send(`0 upgraded, 1 newly installed, 0 to remove and 42 not upgraded.\r\n`);
                            ws.send(`Need to get 143 kB of archives.\r\n`);
                            ws.send(`After this operation, 512 kB of additional disk space will be used.\r\n`);
                            ws.send(`Get:1 http://archive.ubuntu.com/ubuntu jammy/main amd64 ${cleanPkg} [143 kB]\r\n`);
                            ws.send(`Selecting previously unselected package ${cleanPkg}.\r\n`);
                            ws.send(`(Reading database ... 14842 files and directories currently installed.)\r\n`);
                            ws.send(`Preparing to unpack .../${cleanPkg}_amd64.deb ...\r\n`);
                            ws.send(`Unpacking ${cleanPkg} ...\r\n`);
                            ws.send(`Setting up ${cleanPkg} ...\r\n`);
                            installedPackages.add(cleanPkg);
                        }
                    } else if (action === 'update') {
                        ws.send('Get:1 http://archive.ubuntu.com/ubuntu jammy InRelease [270 kB]\r\n');
                        ws.send('Get:2 http://security.ubuntu.com/ubuntu jammy-security InRelease [110 kB]\r\n');
                        ws.send('Fetched 380 kB in 1s (245 kB/s)\r\n');
                        ws.send('Reading package lists... Done\r\n');
                    } else {
                        ws.send('APT Package Manager. Uso: apt-get install <pacote> ou apt-get update\r\n');
                    }
                } else if (cmd === 'nmap') {
                    if (installedPackages.has('nmap')) {
                        const target = args[1];
                        if (!target) {
                            ws.send('nmap: Especifique o alvo (ex: nmap broker.hivemq.com)\r\n');
                        } else {
                            ws.send('Starting Nmap 7.80 ( https://nmap.org ) at ' + new Date().toISOString() + '\r\n');
                            ws.send(`Nmap scan report for ${target}\r\n`);
                            ws.send('Host is up (0.0042s latency).\r\n');
                            ws.send('PORT     STATE SERVICE\r\n');
                            ws.send('1883/tcp open  mqtt\r\n');
                            ws.send('8883/tcp open  secure-mqtt\r\n');
                            ws.send('\r\nNmap done: 1 IP address scanned.\r\n');
                        }
                    } else {
                        ws.send('bash: nmap: command not found (Instale usando: apt-get install nmap)\r\n');
                    }
                } else if (cmd === 'mosquitto_sub' || cmd === 'mosquitto-clients') {
                    if (installedPackages.has('mosquitto-clients')) {
                        const hostIdx = args.indexOf('-h');
                        const topicIdx = args.indexOf('-t');
                        const host = hostIdx !== -1 ? args[hostIdx + 1] : '';
                        const topic = topicIdx !== -1 ? args[topicIdx + 1] : '';

                        if (!host || !topic) {
                            ws.send('Uso: mosquitto_sub -h <broker> -t <topico>\r\n');
                        } else {
                            ws.send(`[+] Conectado ao broker ${host} - Escutando tópico: ${topic}\r\n`);
                            ws.send(`${topic}: {"dispositivo": "ESP32-Termostato", "temperatura": 24.5, "status": "seguro"}\r\n`);
                            ws.send(`${topic}: {"dispositivo": "ESP32-Termostato", "temperatura": 24.6, "status": "seguro"}\r\n`);
                        }
                    } else {
                        ws.send('bash: mosquitto_sub: command not found (Instale usando: apt-get install mosquitto-clients)\r\n');
                    }
                } else if (cmd === 'mosquitto_pub') {
                    if (installedPackages.has('mosquitto-clients')) {
                        const hostIdx = args.indexOf('-h');
                        const topicIdx = args.indexOf('-t');
                        const msgIdx = args.indexOf('-m');
                        const host = hostIdx !== -1 ? args[hostIdx + 1] : '';
                        const topic = topicIdx !== -1 ? args[topicIdx + 1] : '';
                        const payload = msgIdx !== -1 ? args[msgIdx + 1] : '';

                        if (!host || !topic || !payload) {
                            ws.send('Uso: mosquitto_pub -h <broker> -t <topico> -m "<mensagem>"\r\n');
                        } else {
                            ws.send(`[✓] Mensagem publicada no broker ${host} -> Tópico: ${topic}\r\n`);
                            if (payload.includes('flag') || payload.toLowerCase().includes('unlock') || payload.toLowerCase().includes('bypass')) {
                                ws.send(`\r\n\x1b[1;32m[✓] RESPOSTA DO FIRMWARE RECEBIDA:\x1b[0m\r\n`);
                                ws.send(`\x1b[1;32mflag{mqtt_payload_injection_success}\x1b[0m\r\n`);
                            }
                        }
                    } else {
                        ws.send('bash: mosquitto_pub: command not found (Instale usando: apt-get install mosquitto-clients)\r\n');
                    }
                } else if (cmdLine !== '') {
                    ws.send(`bash: ${cmdLine}: command not found\r\n`);
                }
                ws.send('root@iot-academy:~# ');
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
        // Create an interactive Ubuntu container (Fully isolated, no Host mappings)
        const container = await docker.createContainer({
            Image: 'ubuntu:latest',
            Cmd: ['/bin/bash'],
            Tty: true,
            OpenStdin: true,
            StdinOnce: false
        });

        await container.start();
        ws.send('[!] Contêiner Ubuntu iniciado. Configurando ferramentas de rede (apt-get) no segundo plano...\r\n');

        // Silently run apt-get updates and install nmap, curl, and mosquitto-clients in the background
        const installExec = await docker.getContainer(container.id).exec({
            Cmd: [
                '/bin/bash', 
                '-c', 
                'export DEBIAN_FRONTEND=noninteractive && apt-get update && apt-get install -y nmap curl mosquitto-clients telnet netcat-openbsd'
            ],
            AttachStdout: false,
            AttachStderr: false
        });
        await installExec.start({ detach: true });

        // Start shell hijack connection
        const exec = await container.exec({
            Cmd: ['/bin/bash'],
            AttachStdin: true,
            AttachStdout: true,
            AttachStderr: true,
            Tty: true,
            Stdin: true
        });

        const stream = await exec.start({ stdin: true, hijack: true, Tty: true });
        ws.send('[✓] Terminal Ubuntu interativo estabelecido.\r\n');
        ws.send('[!] O ambiente de execução está 100% isolado da sua máquina hospedeira.\r\n');
        ws.send('[!] A conexão com o Wokwi deve ser realizada via MQTT na nuvem (broker.hivemq.com).\r\n');
        ws.send('[!] Tente monitorar o dispositivo rodando: mosquitto_sub -h broker.hivemq.com -t "wowki/+"\r\n\r\n');

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
