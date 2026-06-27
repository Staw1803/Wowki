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
  const [currentView, setCurrentView] = useState<'landing' | 'navigation' | 'showcase' | 'workspace' | 'publish'>('landing');

  // Active challenge state (can be an official Lesson or community Challenge)
  const [activeChallenge, setActiveChallenge] = useState<Lesson | CommunityChallenge | null>(null);
  const [isCommunityChallenge, setIsCommunityChallenge] = useState<boolean>(false);

  const [failCount, setFailCount] = useState<number>(0);
  const [completedLessons, setCompletedLessons] = useState<number[]>([]);
  const [completedCommunityIds, setCompletedCommunityIds] = useState<string[]>([]);

  const handleSelectOfficial = (lessonId: number) => {
    const lessons: Lesson[] = lessonsData as Lesson[];
    const selected = lessons.find((l) => l.id === lessonId) || lessons[0];
    setActiveChallenge(selected);
    setIsCommunityChallenge(false);
    setFailCount(0);
    setCurrentView('workspace');
  };

  const handleSelectCommunity = (challenge: CommunityChallenge) => {
    // Format community challenge into Wokwi embed URL
    let embedUrl = challenge.wokwi_id.trim();
    if (!embedUrl.startsWith('http')) {
      embedUrl = `https://wokwi.com/projects/${embedUrl}?embed=1`;
    }
    const preparedChallenge = { ...challenge, wokwi_url: embedUrl };
    setActiveChallenge(preparedChallenge as any);
    setIsCommunityChallenge(true);
    setFailCount(0);
    setCurrentView('workspace');
  };

  const handleCommandSuccess = () => {
    if (!activeChallenge) return;

    if (isCommunityChallenge) {
      const challengeId = activeChallenge.id.toString();
      if (!completedCommunityIds.includes(challengeId)) {
        setCompletedCommunityIds([...completedCommunityIds, challengeId]);
      }
    } else {
      const lessonId = (activeChallenge as Lesson).id;
      if (!completedLessons.includes(lessonId)) {
        setCompletedLessons([...completedLessons, lessonId]);
      }
    }
  };

  const handleCommandFailed = () => {
    setFailCount((prev) => prev + 1);
  };

  // Helper properties
  const isCompleted = activeChallenge
    ? isCommunityChallenge
      ? completedCommunityIds.includes(activeChallenge.id.toString())
      : completedLessons.includes((activeChallenge as Lesson).id)
    : false;

  const handleGoBack = () => {
    if (currentView === 'workspace') {
      setCurrentView('showcase');
      setActiveChallenge(null);
    } else if (currentView === 'showcase' || currentView === 'publish') {
      setCurrentView('navigation');
    } else if (currentView === 'navigation') {
      setCurrentView('landing');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-black text-slate-100">
      
      {/* 1. Landing View */}
      {currentView === 'landing' && (
        <div className="flex-1 flex flex-col items-center justify-center bg-gradient-black p-6 relative">
          {/* Subtle Cyber Grid Background */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] pointer-events-none opacity-20"></div>
          
          <div className="w-full max-w-2xl text-center space-y-6 z-10">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-blue-500 bg-blue-500/10 px-4 py-1.5 rounded-full border border-blue-500/20 shadow-sm animate-pulse">
              CTF & IoT LAB ACADEMY
            </span>
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-white select-none">
              IoT Hacking Simulator
            </h1>
            <p className="text-base text-slate-400 max-w-lg mx-auto leading-relaxed">
              Explore falhas em fechaduras BLE, hijacking de corretores MQTT, replay de sinais de RF Sub-GHz e injeção de comandos web em tempo real.
            </p>
            <div className="pt-4">
              <button
                onClick={() => setCurrentView('navigation')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm tracking-wide px-8 py-3.5 rounded-lg shadow-lg hover:shadow-blue-600/20 active:scale-[0.98] transition-all uppercase"
              >
                Acessar Plataforma
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Layout Views (Choice, Showcase, Workspace, Publish) */}
      {currentView !== 'landing' && (
        <>
          {/* Main App Header */}
          <header className="app-header">
            <div className="app-title-container">
              <button
                onClick={handleGoBack}
                className="bg-transparent border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/50 text-slate-400 hover:text-white px-3 py-1.5 rounded text-xs font-semibold transition-all flex items-center gap-1.5 mr-2"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
                </svg>
                Voltar
              </button>
              <span className="cyber-badge">LAB PANEL</span>
              <h1 className="app-title cursor-pointer" onClick={() => setCurrentView('navigation')}>
                IoT Hacking Simulator
              </h1>
            </div>

            {/* Quick Stats in Header */}
            <div className="device-status">
              <div className="status-item">
                <span>CONCLUÍDO:</span>
                <span className="text-blue-500 font-bold">
                  {completedLessons.length + completedCommunityIds.length} DESAFIOS
                </span>
              </div>
              <div className="status-item">
                <span className="status-dot active"></span>
                <span>DOCKER CONNECTED</span>
              </div>
            </div>
          </header>

          {/* View: Path Selection (Navigation) */}
          {currentView === 'navigation' && (
            <div className="flex-1 flex items-center justify-center p-6 bg-black">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
                
                {/* Learn Card */}
                <div
                  className="card-black rounded-xl p-8 flex flex-col justify-between min-h-[300px] cursor-pointer"
                  onClick={() => setCurrentView('showcase')}
                >
                  <div className="space-y-4">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-500 border border-blue-500/20">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-white">Iniciar Aprendizado</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      Acesse a vitrine de laboratórios. Treine suas habilidades no currículo oficial de 10 aulas ou teste desafios criados por outros usuários.
                    </p>
                  </div>
                  <span className="text-blue-500 font-bold text-sm tracking-wide flex items-center gap-1.5 group-hover:translate-x-1 transition-transform mt-6">
                    Acessar Vitrine
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                    </svg>
                  </span>
                </div>

                {/* Publish Card */}
                <div
                  className="card-black rounded-xl p-8 flex flex-col justify-between min-h-[300px] cursor-pointer"
                  onClick={() => setCurrentView('publish')}
                >
                  <div className="space-y-4">
                    <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center text-purple-500 border border-purple-500/20">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-white">Publicar Desafio</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      Crie seu próprio laboratório! Conecte um ID do simulador Wokwi, monte a teoria e configure a flag secreta para desafiar os competidores.
                    </p>
                  </div>
                  <span className="text-purple-500 font-bold text-sm tracking-wide flex items-center gap-1.5 mt-6">
                    Criar Desafio
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                    </svg>
                  </span>
                </div>

              </div>
            </div>
          )}

          {/* View: Challenges Showroom (Showcase) */}
          {currentView === 'showcase' && (
            <ChallengeShowcase
              completedLessonIds={completedLessons}
              completedCommunityIds={completedCommunityIds}
              onSelectOfficial={handleSelectOfficial}
              onSelectCommunity={handleSelectCommunity}
            />
          )}

          {/* View: Publish Challenge */}
          {currentView === 'publish' && <PublishChallenge />}

          {/* View: 3-Column Lab Workspace */}
          {currentView === 'workspace' && activeChallenge && (
            <main className="dashboard-layout">
              {/* Coluna 1: O Instrutor */}
              <div className="panel">
                <div className="panel-header">
                  <div className="panel-title">
                    <span>Instruções de Ataque</span>
                  </div>
                  <div className="panel-actions">
                    <button
                      className="header-nav-btn"
                      onClick={() => setCurrentView('showcase')}
                      style={{ padding: '3px 10px', fontSize: '0.7rem' }}
                    >
                      Sair do Lab
                    </button>
                  </div>
                </div>
                <div className="panel-content">
                  <div className="instructor-scrollable">
                    
                    {/* Status Badge */}
                    <div
                      className={`lesson-status-badge ${
                        isCompleted ? 'completed' : 'unsolved'
                      }`}
                    >
                      {isCompleted ? '✓ Desafio Resolvido' : '• Invasão Pendente'}
                    </div>

                    {/* Titulo */}
                    <div className="instructor-title-section">
                      <span className="instructor-title-label">
                        {isCommunityChallenge ? 'DESAFIO DA COMUNIDADE' : 'CURRÍCULO ACADÊMICO'}
                      </span>
                      <h2 className="instructor-title">
                        {isCommunityChallenge ? (activeChallenge as CommunityChallenge).title : (activeChallenge as Lesson).titulo}
                      </h2>
                    </div>

                    {/* Teoria */}
                    <div className="instructor-section">
                      <h3 className="instructor-section-title">1. Base Teórica</h3>
                      <p className="instructor-text">
                        {isCommunityChallenge ? (activeChallenge as CommunityChallenge).description : (activeChallenge as Lesson).teoria}
                      </p>
                    </div>

                    {/* Objetivo */}
                    <div className="instructor-section">
                      <h3 className="instructor-section-title">2. Objetivo</h3>
                      <p className="instructor-text" style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                        {isCommunityChallenge 
                          ? 'Analise o firmware da placa Wokwi, infiltre-se no sistema do dispositivo e descubra a secret flag. Quando descobrir a flag, digite-a no terminal à direita para vencer.'
                          : (activeChallenge as Lesson).objetivo}
                      </p>
                    </div>

                    {/* Instruções */}
                    <div className="instructor-section">
                      <h3 className="instructor-section-title">3. Passo a Passo</h3>
                      <div className="steps-list">
                        {isCommunityChallenge ? (
                          <>
                            <div className="step-item">1. Estude o hardware do laboratório carregado na tela central.</div>
                            <div className="step-item">2. Interaja com o shell do contêiner para explorar vulnerabilidades locais.</div>
                            <div className="step-item">{"3. Capture a flag e insira no console (Ex: flag{exemplo_chave})."}</div>
                          </>
                        ) : (
                          (activeChallenge as Lesson).passo_a_passo.split('\n').map((step, idx) => (
                            <div key={idx} className="step-item">
                              {step}
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Dica do Instrutor */}
                    {(isCommunityChallenge || failCount >= 3) && (
                      <div className="instructor-hint-box" style={{ marginTop: '10px' }}>
                        <div className="instructor-hint-title">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
                          </svg>
                          Diretrizes do Lab
                        </div>
                        <p className="instructor-hint-text">
                          {isCommunityChallenge
                            ? `Secret Flag alvo: flag{...}. Digite a flag no console após a descoberta para capturar os pontos.`
                            : (activeChallenge as Lesson).dica}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Coluna 2: O Laboratório (Wokwi Iframe) */}
              <WokwiSimulator wokwiUrl={(activeChallenge as any).wokwi_url} />

              {/* Coluna 3: O Terminal (xterm.js) */}
              <TerminalSimulator
                lesson={activeChallenge as any}
                isCompleted={isCompleted}
                onCommandSuccess={handleCommandSuccess}
                onCommandFailed={handleCommandFailed}
              />
            </main>
          )}
        </>
      )}

    </div>
  );
};

export default App;
