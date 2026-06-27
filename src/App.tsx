import React, { useState } from 'react';
import lessonsData from './data/lessons.json';
import { WokwiSimulator } from './components/WokwiSimulator';
import { TerminalSimulator } from './components/TerminalSimulator';

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

const App: React.FC = () => {
  const lessons: Lesson[] = lessonsData as Lesson[];

  const [activeLessonId, setActiveLessonId] = useState<number>(1);
  const [failCount, setFailCount] = useState<number>(0);
  const [completedLessons, setCompletedLessons] = useState<number[]>([]);

  const activeLesson = lessons.find((l) => l.id === activeLessonId) || lessons[0];
  const isCompleted = completedLessons.includes(activeLessonId);

  const handleLessonChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = parseInt(e.target.value, 10);
    setActiveLessonId(id);
    setFailCount(0);
  };

  const handleCommandSuccess = () => {
    if (!completedLessons.includes(activeLessonId)) {
      setCompletedLessons([...completedLessons, activeLessonId]);
    }
  };

  const handleCommandFailed = () => {
    setFailCount((prev) => prev + 1);
  };

  const handlePrevLesson = () => {
    if (activeLessonId > 1) {
      setActiveLessonId((prev) => prev - 1);
      setFailCount(0);
    }
  };

  const handleNextLesson = () => {
    if (activeLessonId < lessons.length) {
      setActiveLessonId((prev) => prev + 1);
      setFailCount(0);
    }
  };

  return (
    <>
      <header className="app-header">
        <div className="app-title-container">
          <span className="cyber-badge">LAB CLASSROOM</span>
          <h1 className="app-title">IoT Hacking Academy</h1>
        </div>
        <div className="device-status">
          <div className="status-item">
            <span>PROGRESSO:</span>
            <span style={{ color: 'var(--accent-color)', fontWeight: 'bold' }}>
              {completedLessons.length} / {lessons.length} AULAS
            </span>
          </div>
          <div className="status-item">
            <span className="status-dot active"></span>
            <span>SERVIDOR ONLINE</span>
          </div>
        </div>
      </header>

      <main className="dashboard-layout">
        {/* Coluna 1: O Instrutor */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">
              <span>Painel do Instrutor</span>
            </div>
            <div className="panel-actions" style={{ display: 'flex', gap: '6px' }}>
              <button
                className="header-nav-btn"
                onClick={handlePrevLesson}
                disabled={activeLessonId === 1}
                style={{ padding: '2px 8px', fontSize: '0.7rem' }}
              >
                Anterior
              </button>
              <button
                className="header-nav-btn"
                onClick={handleNextLesson}
                disabled={activeLessonId === lessons.length}
                style={{ padding: '2px 8px', fontSize: '0.7rem' }}
              >
                Próxima
              </button>
            </div>
          </div>
          <div className="panel-content">
            <div className="instructor-scrollable">
              {/* Seleção de Aulas */}
              <div className="lesson-selector-container">
                <label className="lesson-select-label">Selecione o Módulo:</label>
                <select
                  value={activeLessonId}
                  onChange={handleLessonChange}
                  className="lesson-select"
                >
                  {lessons.map((lesson) => (
                    <option key={lesson.id} value={lesson.id}>
                      {completedLessons.includes(lesson.id) ? '✓ ' : '• '}
                      {lesson.titulo}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status da Aula */}
              <div
                className={`lesson-status-badge ${
                  isCompleted ? 'completed' : 'unsolved'
                }`}
              >
                {isCompleted ? '✓ Lição Concluída' : '• Não Resolvido'}
              </div>

              {/* Informações da Aula */}
              <div className="instructor-title-section">
                <span className="instructor-title-label">Tópico do Ataque</span>
                <h2 className="instructor-title">{activeLesson.titulo}</h2>
              </div>

              <div className="instructor-section">
                <h3 className="instructor-section-title">1. Base Teórica</h3>
                <p className="instructor-text">{activeLesson.teoria}</p>
              </div>

              <div className="instructor-section">
                <h3 className="instructor-section-title">2. Objetivo</h3>
                <p className="instructor-text" style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                  {activeLesson.objetivo}
                </p>
              </div>

              <div className="instructor-section">
                <h3 className="instructor-section-title">3. Instruções</h3>
                <div className="steps-list">
                  {activeLesson.passo_a_passo.split('\n').map((step, idx) => (
                    <div key={idx} className="step-item">
                      {step}
                    </div>
                  ))}
                </div>
              </div>

              {/* Instrutor Virtual - Dica automática */}
              {failCount >= 3 && (
                <div className="instructor-hint-box">
                  <div className="instructor-hint-title">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="16" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                    Dica do Instrutor
                  </div>
                  <p className="instructor-hint-text">
                    "{activeLesson.dica}"
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Coluna 2: O Laboratório (Wokwi Iframe) */}
        <WokwiSimulator wokwiUrl={activeLesson.wokwi_url} />

        {/* Coluna 3: O Terminal (xterm.js) */}
        <TerminalSimulator
          lesson={activeLesson}
          isCompleted={isCompleted}
          onCommandSuccess={handleCommandSuccess}
          onCommandFailed={handleCommandFailed}
        />
      </main>
    </>
  );
};

export default App;
