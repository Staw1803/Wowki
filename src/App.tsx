import React, { useState } from 'react';
import lessonsData from './data/lessons.json';
import { WokwiSimulator } from './components/WokwiSimulator';
import { TerminalSimulator } from './components/TerminalSimulator';
import { PublishChallenge } from './components/PublishChallenge';
import { ChallengeShowcase } from './components/ChallengeShowcase';

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

interface CommunityChallenge {
  id: string;
  creator_id: string | null;
  wokwi_id: string;
  title: string;
  description: string;
  secret_flag: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  created_at: string;
}

const App: React.FC = () => {
  // Tela atual: landing, navigation, showcase, workspace, publish
  const [tela, setTela] = useState<'landing' | 'navigation' | 'showcase' | 'workspace' | 'publish'>('landing');

  // Desafio/Aula que tá aberta no Workspace
  const [desafioAtivo, setDesafioAtivo] = useState<Lesson | CommunityChallenge | null>(null);
  const [ehDesafioComunidade, setEhDesafioComunidade] = useState<boolean>(false);

  // Controla o popup com os avisos do laboratório
  const [modalTutorial, setModalTutorial] = useState<boolean>(false);

  // Conta os erros do aluno pra dar uma colher de chá e liberar as dicas
  const [erros, setErros] = useState<number>(0);
  const [aulasFeitas, setAulasFeitas] = useState<number[]>([]);
  const [desafiosResolvidos, setDesafiosResolvidos] = useState<string[]>([]);

  // Gambiarra pra formatar a URL do Wokwi e sumir com o painel de código (view=diagram)
  const limparLinkWokwi = (urlOrId: string) => {
    let url = urlOrId.trim();
    if (!url.startsWith('http')) {
      url = `https://wokwi.com/projects/${url}?embed=1`;
    }
    if (!url.includes('view=diagram')) {
      url += url.includes('?') ? '&view=diagram' : '?view=diagram';
    }
    return url;
  };

  // Carrega aula do currículo padrão
  const carregarOficial = (lessonId: number) => {
    const lessons: Lesson[] = lessonsData as Lesson[];
    const selected = lessons.find((l) => l.id === lessonId) || lessons[0];
    const formatada = { ...selected, wokwi_url: limparLinkWokwi(selected.wokwi_url) };
    setDesafioAtivo(formatada);
    setEhDesafioComunidade(false);
    setErros(0);
    setModalTutorial(true);
    setTela('workspace');
  };

  // Carrega desafio da galera
  const carregarComunidade = (challenge: CommunityChallenge) => {
    const urlLimpa = limparLinkWokwi(challenge.wokwi_id);
    const preparado = { ...challenge, wokwi_url: urlLimpa };
    setDesafioAtivo(preparado as any);
    setEhDesafioComunidade(true);
    setErros(0);
    setModalTutorial(true);
    setTela('workspace');
  };

  // Callback chamado quando o aluno digita o comando certo ou acerta a flag
  const comandoAcertou = () => {
    if (!desafioAtivo) return;

    if (ehDesafioComunidade) {
      const cId = desafioAtivo.id.toString();
      if (!desafiosResolvidos.includes(cId)) {
        setDesafiosResolvidos([...desafiosResolvidos, cId]);
      }
    } else {
      const lId = (desafioAtivo as Lesson).id;
      if (!aulasFeitas.includes(lId)) {
        setAulasFeitas([...aulasFeitas, lId]);
      }
    }
  };

  // Callback pra quando digita outro comando qualquer
  const comandoErrou = () => {
    setErros((prev) => prev + 1);
  };

  const estaResolvido = desafioAtivo
    ? ehDesafioComunidade
      ? desafiosResolvidos.includes(desafioAtivo.id.toString())
      : aulasFeitas.includes((desafioAtivo as Lesson).id)
    : false;

  // Botão voltar simples
  const voltarTela = () => {
    if (tela === 'workspace') {
      setTela('showcase');
      setDesafioAtivo(null);
    } else if (tela === 'showcase' || tela === 'publish') {
      setTela('navigation');
    } else if (tela === 'navigation') {
      setTela('landing');
    }
  };

  const noClassroom = tela === 'showcase' || tela === 'workspace';

  return (
    <div className="flex flex-col min-h-screen bg-black text-slate-100">
      
      {/* Pop-up do Tutorial de Boas-vindas ao Workspace */}
      {modalTutorial && tela === 'workspace' && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="mb-5 border-b border-zinc-800 pb-3 flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Tutorial de Invasão</h3>
            </div>
            
            <div className="space-y-4 text-xs text-zinc-300 leading-relaxed">
              <p>
                Bem-vindo ao laboratório físico interativo! O ambiente de testes está dividido em 3 partes:
              </p>
              
              <ul className="space-y-3 list-none pl-1">
                <li className="flex gap-2">
                  <span className="font-bold text-white">1.</span>
                  <span><strong>Instruções (Painel Esquerdo)</strong>: Leia os fundamentos teóricos, o seu objetivo de intrusão e os passos de ataque.</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-white">2.</span>
                  <span><strong>Dispositivo IoT (Painel Central)</strong>: <span className="text-white font-semibold underline">IMPORTANTE:</span> Você deve clicar no botão verde de <strong>Play/Start</strong> dentro do simulador Wokwi para ligar o circuito físico do dispositivo na rede.</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-white">3.</span>
                  <span><strong>Terminal Linux (Painel Direito)</strong>: Após ligar o dispositivo, interaja com o terminal para varrer portas (`nmap`), capturar dados e submeter a flag secreta.</span>
                </li>
              </ul>
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-800 flex justify-end">
              <button
                onClick={() => setModalTutorial(false)}
                className="bg-white hover:bg-zinc-200 text-black font-bold text-xs px-5 py-2.5 rounded-lg transition-colors uppercase tracking-wider"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tela 1: Landing Page */}
      {tela === 'landing' && (
        <div className="flex-1 flex flex-col items-center justify-center bg-gradient-black p-6 relative">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] pointer-events-none opacity-20"></div>
          
          <div className="w-full max-w-2xl text-center space-y-6 z-10">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-white bg-zinc-900 px-4 py-1.5 rounded-full border border-zinc-850 shadow-sm animate-pulse">
              CTF & IoT LAB ACADEMY
            </span>
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-white select-none">
              IoT Hacking Simulator
            </h1>
            <p className="text-base text-zinc-400 max-w-lg mx-auto leading-relaxed">
              Explore falhas em fechaduras BLE, hijacking de corretores MQTT, replay de sinais de RF Sub-GHz e injeção de comandos web em tempo real.
            </p>
            <div className="pt-4">
              <button
                onClick={() => setTela('navigation')}
                className="bg-white hover:bg-zinc-200 text-black font-bold text-sm tracking-wide px-8 py-3.5 rounded-lg shadow-lg hover:shadow-white/5 active:scale-[0.98] transition-all uppercase"
              >
                Acessar Plataforma
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Telas que usam o cabeçalho comum */}
      {tela !== 'landing' && (
        <>
          {/* Header principal do app */}
          <header className="app-header">
            <div className="app-title-container">
              <button
                onClick={voltarTela}
                className="bg-transparent border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/50 text-zinc-400 hover:text-white px-3 py-1.5 rounded text-xs font-semibold transition-all flex items-center gap-1.5 mr-2"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
                </svg>
                Voltar
              </button>
              <span className="cyber-badge">LAB PANEL</span>
              <h1 className="app-title cursor-pointer" onClick={() => setTela('navigation')}>
                IoT Hacking Simulator
              </h1>
            </div>

            {/* Menu central do cabeçalho */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                className="header-nav-btn"
                style={{
                  background: noClassroom ? 'var(--accent-color)' : 'transparent',
                  border: noClassroom ? 'none' : '1px solid var(--border-dark)',
                  boxShadow: noClassroom ? '0 0 10px var(--accent-glow)' : 'none',
                  color: noClassroom ? '#000000' : 'var(--text-primary)',
                }}
                onClick={() => setTela('showcase')}
              >
                Classroom
              </button>
              <button
                className="header-nav-btn"
                style={{
                  background: tela === 'publish' ? 'var(--accent-color)' : 'transparent',
                  border: tela === 'publish' ? 'none' : '1px solid var(--border-dark)',
                  boxShadow: tela === 'publish' ? '0 0 10px var(--accent-glow)' : 'none',
                  color: tela === 'publish' ? '#000000' : 'var(--text-primary)',
                }}
                onClick={() => setTela('publish')}
              >
                Publish Challenge
              </button>
            </div>

            {/* Status rápido do aluno */}
            <div className="device-status">
              <div className="status-item">
                <span>CONCLUÍDO:</span>
                <span className="text-white font-bold">
                  {aulasFeitas.length + desafiosResolvidos.length} DESAFIOS
                </span>
              </div>
              <div className="status-item">
                <span className="status-dot"></span>
                <span>DOCKER CONNECTED</span>
              </div>
            </div>
          </header>

          {/* Tela 2: Seleção de caminho inicial */}
          {tela === 'navigation' && (
            <div className="flex-1 flex items-center justify-center p-6 bg-black">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
                
                {/* Card Classroom */}
                <div
                  className="card-black rounded-xl p-8 flex flex-col justify-between min-h-[300px] cursor-pointer group"
                  onClick={() => setTela('showcase')}
                >
                  <div className="space-y-4">
                    <div className="w-12 h-12 bg-zinc-900 rounded-lg flex items-center justify-center text-white border border-zinc-800">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-white">Iniciar Aprendizado</h3>
                    <p className="text-sm text-zinc-400 leading-relaxed">
                      Acesse a vitrine de laboratórios. Treine suas habilidades no currículo oficial de 10 aulas ou teste desafios criados por outros usuários.
                    </p>
                  </div>
                  <span className="text-white font-bold text-sm tracking-wide flex items-center gap-1.5 group-hover:translate-x-1 transition-transform mt-6">
                    Acessar Vitrine
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                    </svg>
                  </span>
                </div>

                {/* Card Criar Desafio */}
                <div
                  className="card-black rounded-xl p-8 flex flex-col justify-between min-h-[300px] cursor-pointer group"
                  onClick={() => setTela('publish')}
                >
                  <div className="space-y-4">
                    <div className="w-12 h-12 bg-zinc-900 rounded-lg flex items-center justify-center text-white border border-zinc-800">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-white">Publicar Desafio</h3>
                    <p className="text-sm text-zinc-400 leading-relaxed">
                      Crie seu próprio laboratório! Conecte um ID do simulador Wokwi, monte a teoria e configure a flag secreta para desafiar os competidores.
                    </p>
                  </div>
                  <span className="text-white font-bold text-sm tracking-wide flex items-center gap-1.5 group-hover:translate-x-1 transition-transform mt-6">
                    Criar Desafio
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                    </svg>
                  </span>
                </div>

              </div>
            </div>
          )}

          {/* Tela 3: Vitrine (Showcase) */}
          {tela === 'showcase' && (
            <ChallengeShowcase
              feitasOficiais={aulasFeitas}
              feitasComunidade={desafiosResolvidos}
              abrirOficial={carregarOficial}
              abrirComunidade={carregarComunidade}
            />
          )}

          {/* Tela 4: Publicar Desafio */}
          {tela === 'publish' && <PublishChallenge />}

          {/* Tela 5: Área de Trabalho (Workspace) em 3 colunas */}
          {tela === 'workspace' && desafioAtivo && (
            <main className="dashboard-layout">
              {/* Coluna 1: O Instrutor (Lado Esquerdo) */}
              <div className="panel">
                <div className="panel-header">
                  <div className="panel-title">
                    <span>Instruções de Ataque</span>
                  </div>
                  <div className="panel-actions">
                    <button
                      className="header-nav-btn"
                      onClick={() => setTela('showcase')}
                      style={{ padding: '3px 10px', fontSize: '0.7rem' }}
                    >
                      Sair do Lab
                    </button>
                  </div>
                </div>
                <div className="panel-content">
                  <div className="instructor-scrollable">
                    
                    {/* Status do Desafio */}
                    <div
                      className={`lesson-status-badge ${
                        estaResolvido ? 'completed' : 'unsolved'
                      }`}
                    >
                      {estaResolvido ? '✓ Desafio Resolvido' : '• Invasão Pendente'}
                    </div>

                    {/* Título da Aula */}
                    <div className="instructor-title-section">
                      <span className="instructor-title-label">
                        {ehDesafioComunidade ? 'DESAFIO DA COMUNIDADE' : 'CURRÍCULO ACADÊMICO'}
                      </span>
                      <h2 className="instructor-title">
                        {ehDesafioComunidade ? (desafioAtivo as CommunityChallenge).title : (desafioAtivo as Lesson).titulo}
                      </h2>
                    </div>

                    {/* Teoria */}
                    <div className="instructor-section">
                      <h3 className="instructor-section-title">1. Base Teórica</h3>
                      <p className="instructor-text">
                        {ehDesafioComunidade ? (desafioAtivo as CommunityChallenge).description : (desafioAtivo as Lesson).teoria}
                      </p>
                    </div>

                    {/* Objetivo */}
                    <div className="instructor-section">
                      <h3 className="instructor-section-title">2. Objetivo</h3>
                      <p className="instructor-text" style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                        {ehDesafioComunidade 
                          ? 'Analise o firmware da placa Wokwi, infiltre-se no sistema do dispositivo e descubra a secret flag. Quando descobrir a flag, digite-a no terminal à direita para vencer.'
                          : (desafioAtivo as Lesson).objetivo}
                      </p>
                    </div>

                    {/* Passo a Passo */}
                    <div className="instructor-section">
                      <h3 className="instructor-section-title">3. Passo a Passo</h3>
                      <div className="steps-list">
                        {ehDesafioComunidade ? (
                          <>
                            <div className="step-item">1. Estude o hardware do laboratório carregado na tela central.</div>
                            <div className="step-item">2. Interaja com o shell do contêiner para explorar vulnerabilidades locais.</div>
                            <div className="step-item">{"3. Capture a flag e insira no console (Ex: flag{exemplo_chave})."}</div>
                          </>
                        ) : (
                          (desafioAtivo as Lesson).passo_a_passo.split('\n').map((step, idx) => (
                            <div key={idx} className="step-item">
                              {step}
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Dica de Ajuda */}
                    {(ehDesafioComunidade || erros >= 3) && (
                      <div className="instructor-hint-box" style={{ marginTop: '10px' }}>
                        <div className="instructor-hint-title">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
                          </svg>
                          Diretrizes do Lab
                        </div>
                        <p className="instructor-hint-text">
                          {ehDesafioComunidade
                            ? `Secret Flag alvo: flag{...}. Digite a flag no console após a descoberta para capturar os pontos.`
                            : (desafioAtivo as Lesson).dica}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Coluna 2: O Simulador (Painel Central) */}
              <WokwiSimulator wokwiUrl={(desafioAtivo as any).wokwi_url} />

              {/* Coluna 3: O Terminal (Lado Direito) */}
              <TerminalSimulator
                lesson={desafioAtivo as any}
                isCompleted={estaResolvido}
                onCommandSuccess={comandoAcertou}
                onCommandFailed={comandoErrou}
              />
            </main>
          )}
        </>
      )}

    </div>
  );
};

export default App;
