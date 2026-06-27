const WebSocket = require('ws');
const Docker = require('dockerode');

// Conecta à API local do Docker no seu computador
const docker = new Docker();
const wss = new WebSocket.Server({ port: 8080 });

console.log('Servidor Orquestrador rodando na porta 8080...');

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

        ws.on('message', (msg) => {
            const char = msg.toString();

            if (char === '\r') {
                const cmd = mockBuffer.trim().toLowerCase();
                mockBuffer = '';
                ws.send('\r\n');

                if (cmd === 'help') {
                    ws.send('Ferramentas de Hacking: wireshark, ws-sniff, lsusb, esptool, mqtt-sub, mqtt-pub, binwalk, strings, curl, inject-ping, rf-record, rf-replay, hydra, ssh, modbus-read, modbus-write, hcitool, gatttool, dns-spoof, fota-poison\r\nOutros: ls, whoami, clear, help\r\n');
                } else if (cmd === 'whoami') {
                    ws.send('root\r\n');
                } else if (cmd === 'clear') {
                    ws.send('\x1bc'); // ANSI code to clear terminal screen
                } else if (cmd === 'ls') {
                    ws.send('bin/   etc/   lib/   root/   sys/   usr/   var/   firmware_dump.bin\r\n');
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
                } else if (cmd !== '') {
                    ws.send(`sh: ${cmd}: not found (Simulated OS)\r\n`);
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
            Cmd: ['/bin/sh'],
            Tty: true,
            OpenStdin: true,
            StdinOnce: false
        });

        await container.start();
        ws.send('[!] Laboratório pronto. Terminal interativo estabelecido.\r\n\r\n/ # ');

        const stream = await container.attach({
            stream: true, stdin: true, stdout: true, stderr: true
        });

        ws.on('message', (msg) => {
            stream.write(msg);
        });

        stream.on('data', (chunk) => {
            ws.send(chunk.toString());
        });

        ws.on('close', async () => {
            console.log('[-] Aluno desconectado. Destruindo container...');
            try {
                await container.kill();
                await container.remove();
            } catch (err) {
                console.error('Erro ao destruir contêiner:', err.message);
            }
        });

    } catch (err) {
        ws.send(`\r\n[Erro Fatal] Falha na infraestrutura: ${err.message}\r\n`);
        console.error(err);
    }
});
