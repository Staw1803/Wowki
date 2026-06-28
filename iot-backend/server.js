const WebSocket = require('ws');
const Docker = require('dockerode');

const docker = new Docker();
const wss = new WebSocket.Server({ port: 8080 });

console.log('Servidor rodando na porta 8080...');

// Limpa o cabeçalho chato de 8 bytes que o docker enfia no meio do stdout/stderr
function limparHeaderDocker(chunk) {
    if (!Buffer.isBuffer(chunk)) {
        return chunk.toString();
    }
    // Verifica o padrão de 8 bytes: [1 ou 2, 0, 0, 0, ...]
    if (chunk.length >= 8 && (chunk[0] === 1 || chunk[0] === 2) && chunk[1] === 0 && chunk[2] === 0 && chunk[3] === 0) {
        let textoFinal = '';
        let offset = 0;
        while (offset + 8 <= chunk.length) {
            const tipo = chunk[offset];
            if (tipo !== 1 && tipo !== 2) {
                textoFinal += chunk.slice(offset).toString();
                break;
            }
            const tamanho = chunk.readUInt32BE(offset + 4);
            const inicio = offset + 8;
            const fim = inicio + tamanho;
            if (fim <= chunk.length) {
                textoFinal += chunk.slice(inicio, fim).toString();
            } else {
                textoFinal += chunk.slice(inicio).toString();
            }
            offset = fim;
        }
        return textoFinal;
    }
    return chunk.toString();
}

// ----------------------------------------------------
// GERENCIADOR DE CONEXÃO WEBSOCKET ⟷ DOCKER (UBUNTU)
// ----------------------------------------------------

wss.on('connection', async (ws) => {
    console.log('[+] Novo aluno conectado. Iniciando setup do lab...');
    ws.send('\r\n[!] Iniciando ambiente isolado (Container Ubuntu Linux)...\r\n');

    let dockerAtivo = false;
    try {
        await docker.ping();
        dockerAtivo = true;
    } catch (err) {
        console.log('[!] Docker não rodando ou indisponível. Entrando em modo fallback.');
        ws.send('\r\n[!] AVISO: Docker Desktop não localizado. Iniciando shell local...\r\n');
    }

    // Se der ruim e não tiver Docker no pc dele, inicia o shell mockado
    if (!dockerAtivo) {
        ws.send('\r\nWelcome to IoT-OS (Ubuntu 22.04.3 LTS) Mock Shell! Type "help" to see tools.\r\n[!] O ambiente está isolado. O ataque de injeção IoT deve ser direcionado ao broker MQTT público em: broker.hivemq.com\r\nroot@iot-academy:~# ');
        let bufferTerminal = '';
        let pacotesInstalados = new Set(['curl', 'strings']);

        ws.on('message', async (msg) => {
            const char = msg.toString();

            if (char === '\r') {
                const cmdLine = bufferTerminal.trim();
                const args = cmdLine.split(/\s+/);
                const cmd = args[0].toLowerCase();
                bufferTerminal = '';
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
                    const acao = args[1];
                    const pacote = args[2];

                    if (acao === 'install') {
                        if (!pacote) {
                            ws.send('E: Especifique o pacote para instalar (ex: apt-get install nmap)\r\n');
                        } else {
                            const pName = pacote.toLowerCase();
                            ws.send(`Reading package lists... Done\r\n`);
                            ws.send(`Building dependency tree... Done\r\n`);
                            ws.send(`Reading state information... Done\r\n`);
                            ws.send(`The following NEW packages will be installed:\r\n  ${pName}\r\n`);
                            ws.send(`0 upgraded, 1 newly installed, 0 to remove and 42 not upgraded.\r\n`);
                            ws.send(`Need to get 143 kB of archives.\r\n`);
                            ws.send(`After this operation, 512 kB of additional disk space will be used.\r\n`);
                            ws.send(`Get:1 http://archive.ubuntu.com/ubuntu jammy/main amd64 ${pName} [143 kB]\r\n`);
                            ws.send(`Selecting previously unselected package ${pName}.\r\n`);
                            ws.send(`(Reading database ... 14842 files and directories currently installed.)\r\n`);
                            ws.send(`Preparing to unpack .../${pName}_amd64.deb ...\r\n`);
                            ws.send(`Unpacking ${pName} ...\r\n`);
                            ws.send(`Setting up ${pName} ...\r\n`);
                            pacotesInstalados.add(pName);
                        }
                    } else if (acao === 'update') {
                        ws.send('Get:1 http://archive.ubuntu.com/ubuntu jammy InRelease [270 kB]\r\n');
                        ws.send('Get:2 http://security.ubuntu.com/ubuntu jammy-security InRelease [110 kB]\r\n');
                        ws.send('Fetched 380 kB in 1s (245 kB/s)\r\n');
                        ws.send('Reading package lists... Done\r\n');
                    } else {
                        ws.send('APT Package Manager. Uso: apt-get install <pacote> ou apt-get update\r\n');
                    }
                } else if (cmd === 'nmap') {
                    if (pacotesInstalados.has('nmap')) {
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
                    if (pacotesInstalados.has('mosquitto-clients')) {
                        const idxHost = args.indexOf('-h');
                        const idxTopic = args.indexOf('-t');
                        const host = idxHost !== -1 ? args[idxHost + 1] : '';
                        const topic = idxTopic !== -1 ? args[idxTopic + 1] : '';

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
                    if (pacotesInstalados.has('mosquitto-clients')) {
                        const idxHost = args.indexOf('-h');
                        const idxTopic = args.indexOf('-t');
                        const idxMsg = args.indexOf('-m');
                        const host = idxHost !== -1 ? args[idxHost + 1] : '';
                        const topic = idxTopic !== -1 ? args[idxTopic + 1] : '';
                        const payload = idxMsg !== -1 ? args[idxMsg + 1] : '';

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
                if (bufferTerminal.length > 0) {
                    bufferTerminal = bufferTerminal.slice(0, -1);
                    ws.send('\b \b');
                }
            } else {
                bufferTerminal += char;
                ws.send(char);
            }
        });
        return;
    }

    try {
        // Puxa a imagem do ubuntu da internet se não tiver ela baixada
        const listaImagens = await docker.listImages();
        const temUbuntu = listaImagens.some(img => img.RepoTags && img.RepoTags.includes('ubuntu:latest'));

        if (!temUbuntu) {
            ws.send('[!] Imagem Ubuntu não localizada no disco local.\r\n');
            ws.send('[!] Baixando imagem base ubuntu:latest do Docker Hub... (Aguarde alguns instantes)\r\n');
            console.log('[*] Baixando imagem ubuntu:latest...');
            
            await new Promise((resolve, reject) => {
                docker.pull('ubuntu:latest', {}, (err, stream) => {
                    if (err) return reject(err);
                    docker.modem.followProgress(stream, (err, output) => {
                        if (err) return reject(err);
                        resolve(output);
                    });
                });
            });
            console.log('[*] Imagem ubuntu:latest baixada.');
            ws.send('[✓] Download concluído. Inicializando contêiner...\r\n');
        }

        // Cria o container Ubuntu e injeta o comando do instalador com um shell bash depois
        const container = await docker.createContainer({
            Image: 'ubuntu:latest',
            Cmd: [
                '/bin/bash',
                '-c',
                'echo -e "\x1b[1;33m[!] Inicializando laboratório. Instalando ferramentas de pentesting (nmap, curl, mosquitto, telnet)...\x1b[0m\r" && ' +
                'export DEBIAN_FRONTEND=noninteractive && ' +
                'apt-get update && ' +
                'apt-get install -y nmap curl mosquitto-clients telnet netcat-openbsd && ' +
                'clear && ' +
                'echo -e "\x1b[1;32m[✓] Ambiente pronto para invasão!\x1b[0m\r" && ' +
                'echo -e "\x1b[1;34m[!] Dispositivo IoT isolado na nuvem.\x1b[0m\r" && ' +
                'echo -e "\x1b[1;34m[!] Broker MQTT: broker.hivemq.com (porta 1883)\x1b[0m\r" && ' +
                'echo -e "\x1b[1;34m[!] Escutar telemetria: mosquitto_sub -h broker.hivemq.com -t \\"wowki/aula04/#\\" -v\x1b[0m\r\n" && ' +
                'exec /bin/bash'
            ],
            Tty: true,
            OpenStdin: true,
            StdinOnce: false
        });

        await container.start();

        // Conecta no fluxo de entrada/saida
        const execInstancia = await container.exec({
            Cmd: ['/bin/bash'],
            AttachStdin: true,
            AttachStdout: true,
            AttachStderr: true,
            Tty: true,
            Stdin: true
        });

        const fluxo = await execInstancia.start({ stdin: true, hijack: true, Tty: true });

        // Envia o que o aluno digita pro container
        ws.on('message', (msg) => {
            if (fluxo && fluxo.writable) {
                fluxo.write(msg);
            }
        });

        // Retorna o output limpo pro terminal web
        fluxo.on('data', (chunk) => {
            const cleanText = limparHeaderDocker(chunk);
            ws.send(cleanText);
        });

        // Limpa tudo e mata o container se a conexao cair
        ws.on('close', async () => {
            console.log('[-] Aluno desconectado. Limpando container...');
            try {
                fluxo.destroy();
                await container.stop();
                await container.remove();
            } catch (err) {
                console.error('[!] Erro ao limpar container:', err.message);
            }
        });

    } catch (err) {
        console.error('[Erro Fatal] Falha de infra:', err);
        ws.send(`\r\n[Erro Fatal] Falha na infraestrutura: ${err.message}\r\n`);
    }
});
