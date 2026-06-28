import React, { useEffect, useState } from 'react';
import { supabase, temSupabase } from '../lib/supabaseClient';
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
  feitasOficiais: number[];
  feitasComunidade: string[];
  abrirOficial: (lessonId: number) => void;
  abrirComunidade: (challenge: CommunityChallenge) => void;
}

export const ChallengeShowcase: React.FC<ChallengeShowcaseProps> = ({
  feitasOficiais,
  feitasComunidade,
  abrirOficial,
  abrirComunidade,
}) => {
  const aulas: Lesson[] = lessonsData as Lesson[];
  const [desafiosDb, setDesafiosDb] = useState<CommunityChallenge[]>([]);
  const [carregando, setCarregando] = useState(true);

  // Desafios mocados de backup pro site não ficar vazio caso o Supabase não esteja ativo
  const desafiosFake: CommunityChallenge[] = [
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

  // Carrega as coisas salvas localmente pelo form do localStorage
  const pegarLocais = (): CommunityChallenge[] => {
    const raw = localStorage.getItem('wowki_local_challenges');
    return raw ? JSON.parse(raw) : [];
  };

  useEffect(() => {
    const carregarDesafios = async () => {
      // Se não tiver credenciais, usa direto o localStorage + mocks
      if (!temSupabase) {
        const locais = pegarLocais();
        setDesafiosDb([...locais, ...desafiosFake]);
        setCarregando(false);
        return;
      }

      try {
        setCarregando(true);
        const { data, error } = await supabase
          .from('challenges')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        const locais = pegarLocais();
        if (data && data.length > 0) {
          setDesafiosDb([...locais, ...data]);
        } else {
          setDesafiosDb([...locais, ...desafiosFake]);
        }
      } catch (err) {
        console.warn('Erro ao ler Supabase, usando mocks locais:', err);
        const locais = pegarLocais();
        setDesafiosDb([...locais, ...desafiosFake]);
      } finally {
        setCarregando(false);
      }
    };

    carregarDesafios();
  }, []);

  const renderDificuldade = (dificuldade: string) => {
    switch (dificuldade) {
      case 'Easy':
        return <span className="text-[10px] font-bold px-2.5 py-0.5 rounded bg-zinc-100 text-zinc-950">EASY</span>;
      case 'Medium':
        return <span className="text-[10px] font-bold px-2.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">MEDIUM</span>;
      case 'Hard':
        return <span className="text-[10px] font-bold px-2.5 py-0.5 rounded bg-black border border-white text-white">HARD</span>;
      default:
        return <span className="text-[10px] font-bold px-2.5 py-0.5 rounded bg-zinc-900 text-zinc-300">EASY</span>;
    }
  };

  return (
    <div className="flex-1 bg-black text-slate-100 p-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Header da Vitrine */}
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
              <span className="w-1 h-5 bg-white rounded-sm"></span>
              Aulas Oficiais (Academia IoT)
            </h3>
            <span className="text-xs text-slate-500">
              {feitasOficiais.length} / {aulas.length} Concluídas
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {aulas.map((aula) => {
              const resolvida = feitasOficiais.includes(aula.id);
              return (
                <div
                  key={aula.id}
                  className="card-black rounded-lg p-5 flex flex-col justify-between min-h-[180px] cursor-pointer"
                  onClick={() => abrirOficial(aula.id)}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-zinc-400 tracking-wider">MÓDULO 0{aula.id}</span>
                      {resolvida ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-white">✓ SOLVED</span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-950 border border-zinc-900 text-zinc-500">PENDENTE</span>
                      )}
                    </div>
                    <h4 className="text-base font-bold text-white transition-colors line-clamp-1">
                      {aula.titulo}
                    </h4>
                    <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                      {aula.teoria}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-900/50">
                    <span className="text-[10px] text-zinc-500">Oficial</span>
                    <span className="text-xs text-white font-bold flex items-center gap-1">
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
              <span className="w-1 h-5 bg-white rounded-sm"></span>
              Laboratórios da Comunidade (CTF)
            </h3>
            {carregando && <span className="text-xs text-zinc-500 animate-pulse">Sincronizando banco...</span>}
          </div>

          {carregando ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-zinc-950 border border-zinc-900 rounded-lg p-5 h-[180px] animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {desafiosDb.map((desafio) => {
                const resolvido = feitasComunidade.includes(desafio.id.toString());
                return (
                  <div
                    key={desafio.id}
                    className="card-black rounded-lg p-5 flex flex-col justify-between min-h-[180px] cursor-pointer"
                    onClick={() => abrirComunidade(desafio)}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {renderDificuldade(desafio.difficulty)}
                        </div>
                        {resolvido ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-white">✓ CAPTURED</span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-950 border border-zinc-900 text-zinc-500">COMPETIR</span>
                        )}
                      </div>
                      <h4 className="text-base font-bold text-white line-clamp-1">
                        {desafio.title}
                      </h4>
                      <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                        {desafio.description || 'Nenhuma descrição fornecida pelo criador.'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-900/50">
                      <span className="text-[10px] text-zinc-500">ID: {desafio.wokwi_id.substring(0, 10)}</span>
                      <span className="text-xs text-white font-bold flex items-center gap-1">
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
