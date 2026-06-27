const WebSocket = require('ws');
const Docker = require('dockerode');

// Conecta à API local do Docker no seu computador
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
                // If it's not a stdout/stderr frame, fallback to printing the rest as-is
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

wss.on('connection', async (ws) => {
    console.log('[+] Novo aluno conectado. Provisionando laboratório...');
    ws.send('\r\n[!] Iniciando ambiente isolado (Container Linux)...\r\n');

    let dockerReady = false;
    try {
        // Pings Docker daemon to verify if it is running
        await docker.ping();
        dockerReady = true;
    } catch (e) {
        console.log('[!] Docker Desktop não detectado. Iniciando em MODO SIMULADO.');
        ws.send('\r\n[!] AVISO: Docker Desktop não localizado. Iniciando shell simulado...\r\n');
    }

    if (!dockerReady) {
        // Fallback Mock Shell
        ws.send('Welcome to IoT-OS Mock Shell! Type "help" to see tools.\r\n/ # ');
        let mockBuffer = '';
        let installedPackages = new Set(['binwalk', 'strings', 'curl', 'wireshark', 'ws-sniff']);

        ws.on('message', async (msg) => {
            const char = msg.toString();

            if (char === '\r') {
                const cmdLine = mockBuffer.trim();
                const args = cmdLine.split(/\s+/);
                const cmd = args[0].toLowerCase();
                mockBuffer = '';
                ws.send('\r\n');

                if (cmd === 'help') {
                    ws.send('Ferramentas de Hacking: wireshark, ws-sniff, lsusb, esptool, mqtt-sub, mqtt-pub, binwalk, strings, curl, inject-ping, rf-record, rf-replay, hydra, ssh, modbus-read, modbus-write, hcitool, gatttool, dns-spoof, fota-poison\r\nOutros: ls, whoami, clear, help, nmap, apk\r\n');
                } else if (cmd === 'whoami') {
                    ws.send('root\r\n');
                } else if (cmd === 'clear') {
                    ws.send('\x1bc'); // ANSI code to clear terminal screen
                } else if (cmd === 'ls') {
                    ws.send('bin/   etc/   lib/   root/   sys/   usr/   var/   firmware_dump.bin\r\n');
                } else if (cmd === 'apt-get' || cmd === 'apt') {
                    ws.send('sh: apt-get: not found. (Hint: Alpine Linux usa "apk" em vez de "apt-get". Tente rodar: apk add nmap)\r\n');
                } else if (cmd === 'apk') {
                    if (args[1] === 'add') {
                        const pkg = args[2];
                        if (!pkg) {
                            ws.send('ERROR: Especifique o pacote para adicionar (ex: apk add nmap)\r\n');
                        } else {
                            ws.send(`fetch https://dl-cdn.alpinelinux.org/alpine/v3.19/main/x86_64/APKINDEX.tar.gz\r\n`);
                            ws.send(`(1/3) Installing libpcap (1.10.4-r0)\r\n`);
                            ws.send(`(2/3) Installing ${pkg}-libs (7.92-r2)\r\n`);
                            ws.send(`(3/3) Installing ${pkg} (7.92-r2)\r\n`);
                            ws.send(`Executing busybox-1.36.1-r15.trigger\r\n`);
                            ws.send(`OK: 12 MiB in 18 packages\r\n`);
                            installedPackages.add(pkg.toLowerCase());
                        }
                    } else {
                        ws.send('Apk Package Manager. Uso: apk add <pacote>\r\n');
                    }
                } else if (cmd === 'nmap') {
                    if (installedPackages.has('nmap')) {
                        ws.send('[!] Starting nmap 7.92 ( https://nmap.org ) at ' + new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC\r\n');
                        ws.send('Nmap scan report for 192.168.1.105 (ESP32-Gateway)\r\n');
                        ws.send('Host is up (0.0031s latency).\r\n');
                        ws.send('Not shown: 996 closed tcp ports (reset)\r\n');
                        ws.send('PORT     STATE SERVICE\r\n');
                        ws.send('22/tcp   \x1b[1;32mopen\x1b[0m  ssh\r\n');
                        ws.send('80/tcp   \x1b[1;32mopen\x1b[0m  http\r\n');
                        ws.send('1883/tcp \x1b[1;32mopen\x1b[0m  mqtt\r\n');
                        ws.send('8883/tcp \x1b[1;32mopen\x1b[0m  secure-mqtt\r\n\r\n');
                        ws.send('Nmap done: 1 IP address (1 host up) scanned in 0.45 seconds\r\n');
                    } else {
                        ws.send('sh: nmap: not found. (Hint: Instale o nmap rodando: apk add nmap)\r\n');
                    }
                } else if (cmd === 'wireshark') {
                    ws.send('[.] Escaneando interfaces... Interface ativa [eth0] selecionada.\r\n[.] Capturando tráfego na rede local...\r\n[+] Monitoramento em execução. Pronto para filtrar pacotes.\r\n');
                } else if (cmd === 'ws-sniff') {
                    ws.send('[.] Abrindo socket decodificador...\r\n[!] WebSocket filtrado: {"user":"admin", "pass":"IoT_s3cur3_p@ss"}\r\n');
                } else if (cmd === 'lsusb') {
                    ws.send('Bus 001 Device 003: ID 303a:1001 Espressif ESP32-S3 USB DevKit\r\nBus 001 Device 001: ID 1d6b:0002 Linux 2.0 root hub\r\n');
                } else if (cmd === 'esptool') {
                    ws.send('[.] Conectando ao ESP32 via /dev/ttyUSB0...\r\n[.] Lendo flash da posição 0x00000...\r\n[+] Dump finalizado e salvo em firmware_dump.bin.\r\n');
                } else if (cmd === 'mqtt-sub') {
                    ws.send('[.] Conectando ao MQTT Broker local (192.168.1.105:1883)...\r\n[+] Conectado. Escutando todos os tópicos (#)...\r\n    Tópico: casa/seguranca/status  Payload: {"status": "locked"}\r\n');
                } else if (cmd === 'mqtt-pub') {
                    ws.send('[.] Enviando pacote de publicação MQTT...\r\n[+] Mensagem enviada para o broker: cmd=unlock\r\n');
                } else if (cmd === 'binwalk') {
                    ws.send('DECIMAL       HEXADECIMAL     DESCRIPTION\r\n---------------------------------------------\r\n0             0x0             Squashfs filesystem, version 4.0\r\n');
                } else if (cmd === 'strings') {
                    ws.send('[.] Buscando constantes ASCII em firmware_dump.bin...\r\nwifi_password=admin_private_ap_123\r\napi_endpoint=http://api.manufacturer.com/v2/config\r\n');
                } else if (cmd === 'curl') {
                    ws.send('[.] Requisitando painel de gerenciamento web...\r\nHTTP/1.1 200 OK | Server: Mongoose/6.18\r\nAPI: /api/ping?host=<ip>\r\n');
                } else if (cmd === 'inject-ping') {
                    ws.send('[.] Enviando carga útil para injeção de shell...\r\n[+] Shell capturado via Injeção de Comando: root@iot-device:/#\r\n');
                } else if (cmd === 'rf-record') {
                    ws.send('[.] Inicializando gravação SDR na faixa de 433.92MHz...\r\n[+] Captura concluída. 1 sinal gravado em wave_sdr.rf\r\n');
                } else if (cmd === 'rf-replay') {
                    ws.send('[.] Modulando e retransmitindo sinal via SDR...\r\n[+] Sinal transmitido no espectro. Portão residencial aberto.\r\n');
                } else if (cmd === 'hydra') {
                    ws.send('[.] Iniciando dicionário contra SSH na porta 22...\r\n[+] Chave encontrada -> user: admin | pass: admin123\r\n');
                } else if (cmd === 'ssh') {
                    ws.send('[.] Conectando via SSH em admin@192.168.1.105...\r\n[+] Sessão autenticada. Acesso shell ativo (OpenWrt).\r\n');
                } else if (cmd === 'modbus-read') {
                    ws.send('Modbus Registers Dump:\r\nAddress: 40001 | Value: 24 (Turbine Temperature)\r\nAddress: 40002 | Value: 1200 (RPM)\r\n');
                } else if (cmd === 'modbus-write') {
                    ws.send('[.] Enviando frame Modbus TCP (Write Single Register)...\r\n[+] Registrador escrito no PLC. Temperatura alterada para 200.0 C!\r\n');
                } else if (cmd === 'hcitool') {
                    ws.send('[.] Ativando escaneamento BLE passivo...\r\nDispositivos localizados:\r\n  AA:BB:CC:DD:EE:FF  SmartLock_V3\r\n');
                } else if (cmd === 'gatttool') {
                    ws.send('[.] Conectando ao descritor GATT AA:BB:CC:DD:EE:FF...\r\n[+] Escrevendo valor hexadecimal 0x01 no canal de trava... Status: DESBLOQUEADO\r\n');
                } else if (cmd === 'dns-spoof') {
                    ws.send('[.] Inicializando envenenamento DNS ARP...\r\n[+] Redirecionando tráfego do domínio de update para 192.168.1.100.\r\n');
                } else if (cmd === 'fota-poison') {
                    ws.send('[.] Hospedando servidor local de FOTA e transferindo imagem...\r\n[+] Firmware carregado e gravado com sucesso! Backdoor IoT ativo.\r\n');
                } else if (cmdLine !== '') {
                    ws.send(`sh: ${cmdLine}: command not found (Simulated OS)\r\n`);
                }
                ws.send('/ # ');
            } else if (char.charCodeAt(0) === 127 || char === '\b') {
                if (mockBuffer.length > 0) {
                    mockBuffer = mockBuffer.slice(0, -1);
                    ws.send('\b \b');
                }
            } else if (char.charCodeAt(0) >= 32 && char.charCodeAt(0) < 127) {
                mockBuffer += char;
                ws.send(char);
            }
        });
        return;
    }

    // Real Docker Mode
    try {
        const container = await docker.createContainer({
            Image: 'alpine',
            Cmd: ['sleep', 'infinity'],
            Tty: false,
            OpenStdin: false
        });

        await container.start();
        console.log('[+] Contêiner principal iniciado.');

        const exec = await container.exec({
            Cmd: ['/bin/sh'],
            AttachStdin: true,
            AttachStdout: true,
            AttachStderr: true,
            Tty: true
        });

        // Start exec stream, making sure to pass Tty: true in start options
        const stream = await exec.start({ stdin: true, hijack: true, Tty: true });
        console.log('[+] Exec stream estabelecido.');

        ws.send('[!] Laboratório pronto. Terminal interativo estabelecido.\r\n\r\n/ # ');

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

        ws.on('close', async () => {
            console.log('[-] Aluno desconectado. Destruindo container...');
            try {
                stream.end();
                await container.kill();
                await container.remove();
                console.log('[+] Contêiner removido com sucesso.');
            } catch (err) {
                console.error('Erro ao destruir contêiner:', err.message);
            }
        });

    } catch (err) {
        ws.send(`\r\n[Erro Fatal] Falha na infraestrutura: ${err.message}\r\n`);
        console.error(err);
    }
});
