const WebSocket = require('ws');
const Docker = require('dockerode');

// Conecta à API local do Docker no seu computador
const docker = new Docker();
const wss = new WebSocket.Server({ port: 8080 });

console.log('Servidor Orquestrador rodando na porta 8080...');

wss.on('connection', async (ws) => {
    console.log('[+] Novo aluno conectado. Provisionando laboratório...');
    ws.send('\r\n[!] Iniciando ambiente isolado (Container Linux)...\r\n');

    try {
        // Cria um container Linux rodando a imagem Alpine (super leve e rápida)
        const container = await docker.createContainer({
            Image: 'alpine', // Imagem base
            Cmd: ['/bin/sh'], // Inicia o shell nativo
            Tty: true,
            OpenStdin: true,
            StdinOnce: false
        });

        await container.start();
        ws.send('[!] Laboratório pronto. Terminal interativo estabelecido.\r\n\r\n/ # ');

        // Conecta a entrada e saída do container
        const stream = await container.attach({
            stream: true, stdin: true, stdout: true, stderr: true
        });

        // O que o aluno digita no Xterm.js vai para o Docker
        ws.on('message', (msg) => {
            stream.write(msg);
        });

        // A resposta do Linux no Docker volta para o Xterm.js
        stream.on('data', (chunk) => {
            ws.send(chunk.toString());
        });

        // Sistema de autodestruição: se o aluno fechar a aba, apagamos a máquina
        ws.on('close', async () => {
            console.log('[-] Aluno desconectado. Destruindo container...');
            await container.kill();
            await container.remove();
        });

    } catch (err) {
        ws.send(`\r\n[Erro Fatal] Falha na infraestrutura: ${err.message}\r\n`);
        console.error(err);
    }
});
