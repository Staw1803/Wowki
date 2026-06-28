import React, { useState } from 'react';
import { supabase, temSupabase } from '../lib/supabaseClient';

export const PublishChallenge: React.FC = () => {
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [idWokwi, setIdWokwi] = useState('');
  const [flagSecreta, setFlagSecreta] = useState('');
  const [dificuldade, setDificuldade] = useState<'Easy' | 'Medium' | 'Hard'>('Easy');

  const [enviando, setEnviando] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const salvarDesafio = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setStatus(null);

    // Validação básica dos campos obrigatórios
    if (!titulo.trim() || !idWokwi.trim() || !flagSecreta.trim()) {
      setStatus({ type: 'error', text: 'Por favor, preencha os campos obrigatórios (*).' });
      setEnviando(false);
      return;
    }

    try {
      if (!temSupabase) {
        // Gambiarra: se o banco não tá ativo, salva no localStorage
        const dadosNovoDesafio = {
          id: `local-${Date.now()}`,
          creator_id: null,
          wokwi_id: idWokwi.trim(),
          title: titulo.trim(),
          description: descricao.trim(),
          secret_flag: flagSecreta.trim(),
          difficulty: dificuldade,
          created_at: new Date().toISOString(),
        };

        const desafiosSalvos = localStorage.getItem('wowki_local_challenges');
        const listaAtual = desafiosSalvos ? JSON.parse(desafiosSalvos) : [];
        listaAtual.unshift(dadosNovoDesafio);
        localStorage.setItem('wowki_local_challenges', JSON.stringify(listaAtual));

        setStatus({
          type: 'success',
          text: 'Desafio publicado com sucesso!',
        });
      } else {
        // Envio real pro Supabase
        const { data: { user } } = await supabase.auth.getUser();
        const idCriador = user ? user.id : null;

        const { error } = await supabase
          .from('challenges')
          .insert([
            {
              title: titulo.trim(),
              description: descricao.trim(),
              wokwi_id: idWokwi.trim(),
              secret_flag: flagSecreta.trim(),
              difficulty: dificuldade,
              creator_id: idCriador,
            },
          ]);

        if (error) throw error;

        setStatus({ type: 'success', text: 'Desafio publicado com sucesso!' });
      }

      // Limpa os inputs da tela pro programador mandar o próximo
      setTitulo('');
      setDescricao('');
      setIdWokwi('');
      setFlagSecreta('');
      setDificuldade('Easy');
    } catch (err: any) {
      console.error(err);
      setStatus({
        type: 'error',
        text: `Erro ao salvar no banco: ${err.message || 'Conexão offline'}`,
      });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-56px)] bg-black text-slate-100 p-6">
      <div className="w-full max-w-lg bg-zinc-950 rounded-xl border border-zinc-800 shadow-2xl p-8">
        
        {/* Header do Form */}
        <div className="mb-6 text-center">
          <span className="inline-block text-xs font-bold uppercase tracking-wider text-slate-200 bg-zinc-800 px-3 py-1 rounded-full mb-2">
            CTF Engine
          </span>
          <h2 className="text-2xl font-extrabold tracking-tight text-white">
            Publish New Challenge
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Cadastre um novo laboratório IoT e defina a flag secreta para os alunos capturarem.
          </p>
        </div>

        {/* Alertas de Retorno */}
        {status && (
          <div
            className={`mb-6 p-4 rounded-lg border text-sm flex items-center gap-2 animate-fadeIn ${
              status.type === 'success'
                ? 'bg-zinc-900 border-zinc-700 text-slate-200'
                : 'bg-zinc-900/50 border-zinc-800 text-zinc-400'
            }`}
          >
            {status.type === 'success' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            )}
            <span>{status.text}</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={salvarDesafio} className="space-y-5">
          {/* Titulo */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Título do Desafio <span className="text-zinc-500">*</span>
            </label>
            <input
              type="text"
              required
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Aula 11: Invasão de Firmware por Buffer Overflow"
              className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-slate-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Descrição / Teoria da Aula
            </label>
            <textarea
              rows={4}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Explique o contexto, a vulnerabilidade e os passos que o aluno deve seguir para invadir o dispositivo..."
              className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-slate-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Wokwi ID */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Wokwi ID ou URL <span className="text-zinc-500">*</span>
              </label>
              <input
                type="text"
                required
                value={idWokwi}
                onChange={(e) => setIdWokwi(e.target.value)}
                placeholder="Ex: 349107446543"
                className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-slate-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
              />
            </div>

            {/* Dificuldade */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Dificuldade
              </label>
              <select
                value={dificuldade}
                onChange={(e) => setDificuldade(e.target.value as 'Easy' | 'Medium' | 'Hard')}
                className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-zinc-500 transition-colors cursor-pointer"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
          </div>

          {/* Secret Flag */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Secret Flag do Dispositivo <span className="text-zinc-500">*</span>
            </label>
            <input
              type="text"
              required
              value={flagSecreta}
              onChange={(e) => setFlagSecreta(e.target.value)}
              placeholder="Ex: flag{ESP32_s3cur1ty_bypass_2026}"
              className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-slate-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
            />
            <p className="text-[10px] text-zinc-500 mt-1">
              Esta é a string secreta que o aluno deve obter no terminal para provar que resolveu a invasão.
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={enviando}
            className="w-full bg-white hover:bg-zinc-200 disabled:bg-zinc-800 disabled:cursor-not-allowed text-black disabled:text-zinc-500 font-bold text-sm py-3 px-4 rounded-lg shadow-lg hover:shadow-white/5 focus:outline-none transition-all flex items-center justify-center gap-2 mt-4"
          >
            {enviando ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Salvando Desafio...
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Publish Challenge
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
