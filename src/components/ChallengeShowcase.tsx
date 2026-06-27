import React, { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import lessonsData from '../data/lessons.json';

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

interface ChallengeShowcaseProps {
  completedLessonIds: number[];
  completedCommunityIds: string[];
  onSelectOfficial: (lessonId: number) => void;
  onSelectCommunity: (challenge: CommunityChallenge) => void;
}

export const ChallengeShowcase: React.FC<ChallengeShowcaseProps> = ({
  completedLessonIds,
  completedCommunityIds,
  onSelectOfficial,
  onSelectCommunity,
}) => {
  const officialLessons: Lesson[] = lessonsData as Lesson[];
  const [communityChallenges, setCommunityChallenges] = useState<CommunityChallenge[]>([]);
  const [loading, setLoading] = useState(true);

  // Fallback community challenges
  const mockCommunityChallenges: CommunityChallenge[] = [
    {
      id: 'mock-1',
      creator_id: null,
      wokwi_id: '322577683855704658',
      title: 'Exploit de Buffer Overflow em Termostato IoT',
      description: 'Injete um payload na porta serial do termostato para causar um estouro de buffer e extrair a chave criptográfica master.',
      secret_flag: 'flag{thermostat_buffer_overflow_2026}',
      difficulty: 'Hard',
      created_at: new Date().toISOString(),
    },
    {
      id: 'mock-2',
      creator_id: null,
      wokwi_id: '349107446543155796',
      title: 'Sniffing de Token em Fechadura BLE',
      description: 'Monitore e extraia o hash MD5 trocado entre o aplicativo celular e a fechadura durante o pareamento para destrancá-la.',
      secret_flag: 'flag{ble_md5_token_sniff}',
      difficulty: 'Medium',
      created_at: new Date().toISOString(),
    },
    {
      id: 'mock-3',
      creator_id: null,
      wokwi_id: '322577683855704658',
      title: 'Spoofing de Dados de Sensor GPS via UART',
      description: 'Envie sentenças NMEA falsas na linha serial RX do módulo de rastreamento para simular uma coordenada de destino diferente.',
      secret_flag: 'flag{gps_nmea_uart_spoofing}',
      difficulty: 'Easy',
      created_at: new Date().toISOString(),
    },
  ];

  const getLocalChallenges = (): CommunityChallenge[] => {
    const raw = localStorage.getItem('wowki_local_challenges');
    return raw ? JSON.parse(raw) : [];
  };

  useEffect(() => {
    const fetchChallenges = async () => {
      if (!isSupabaseConfigured) {
        // Fallback offline: Merge local storage entries with mocks
        const local = getLocalChallenges();
        setCommunityChallenges([...local, ...mockCommunityChallenges]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('challenges')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        const local = getLocalChallenges();
        if (data && data.length > 0) {
          setCommunityChallenges([...local, ...data]);
        } else {
          setCommunityChallenges([...local, ...mockCommunityChallenges]);
        }
      } catch (err) {
        console.warn('Fetch failed, loading fallback challenges:', err);
        const local = getLocalChallenges();
        setCommunityChallenges([...local, ...mockCommunityChallenges]);
      } finally {
        setLoading(false);
      }
    };

    fetchChallenges();
  }, []);

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">EASY</span>;
      case 'Medium':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400">MEDIUM</span>;
      case 'Hard':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400">HARD</span>;
      default:
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/30 text-blue-400">EASY</span>;
    }
  };

  return (
    <div className="flex-1 bg-black text-slate-100 p-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Header */}
        <div className="border-b border-zinc-900 pb-6">
          <h2 className="text-3xl font-extrabold tracking-tight text-white">Laboratórios de Hacking</h2>
          <p className="text-slate-400 mt-2">
            Escolha uma das aulas do currículo oficial ou explore os laboratórios publicados por outros alunos.
          </p>
        </div>

        {/* Vitrine 1: Aulas Oficiais */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span className="w-2 h-5 bg-blue-600 rounded-sm"></span>
              Aulas Oficiais (Academia IoT)
            </h3>
            <span className="text-xs text-slate-500">
              {completedLessonIds.length} / {officialLessons.length} Concluídas
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {officialLessons.map((lesson) => {
              const solved = completedLessonIds.includes(lesson.id);
              return (
                <div
                  key={lesson.id}
                  className="card-black rounded-lg p-5 flex flex-col justify-between min-h-[180px] cursor-pointer"
                  onClick={() => onSelectOfficial(lesson.id)}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-blue-500 tracking-wider">MÓDULO 0{lesson.id}</span>
                      {solved ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">✓ SOLVED</span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-slate-500">PENDENTE</span>
                      )}
                    </div>
                    <h4 className="text-base font-bold text-white group-hover:text-blue-500 transition-colors line-clamp-1">
                      {lesson.titulo}
                    </h4>
                    <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                      {lesson.teoria}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-900/50">
                    <span className="text-[10px] text-slate-500">Oficial</span>
                    <span className="text-xs text-blue-500 font-semibold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                      Iniciar Lab
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                      </svg>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Vitrine 2: Desafios da Comunidade */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span className="w-2 h-5 bg-purple-600 rounded-sm"></span>
              Laboratórios da Comunidade (CTF)
            </h3>
            {loading && <span className="text-xs text-slate-500 animate-pulse">Sincronizando banco de dados...</span>}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-zinc-950 border border-zinc-900 rounded-lg p-5 h-[180px] animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {communityChallenges.map((challenge) => {
                const solved = completedCommunityIds.includes(challenge.id.toString());
                return (
                  <div
                    key={challenge.id}
                    className="card-black rounded-lg p-5 flex flex-col justify-between min-h-[180px] cursor-pointer"
                    onClick={() => onSelectCommunity(challenge)}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getDifficultyBadge(challenge.difficulty)}
                        </div>
                        {solved ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">✓ CAPTURED</span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-slate-500">COMPETIR</span>
                        )}
                      </div>
                      <h4 className="text-base font-bold text-white line-clamp-1">
                        {challenge.title}
                      </h4>
                      <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                        {challenge.description || 'Nenhuma descrição fornecida pelo criador.'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-900/50">
                      <span className="text-[10px] text-slate-500">ID: {challenge.wokwi_id.substring(0, 10)}</span>
                      <span className="text-xs text-purple-500 font-semibold flex items-center gap-1">
                        Competir
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                        </svg>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
