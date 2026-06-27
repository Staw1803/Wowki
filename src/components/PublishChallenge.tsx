import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export const PublishChallenge: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [wokwiId, setWokwiId] = useState('');
  const [secretFlag, setSecretFlag] = useState('');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Easy');

  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg(null);

    // Basic validation
    if (!title.trim() || !wokwiId.trim() || !secretFlag.trim()) {
      setStatusMsg({ type: 'error', text: 'Por favor, preencha os campos obrigatórios (*).' });
      setLoading(false);
      return;
    }

    try {
      if (!isSupabaseConfigured) {
        // Fallback: Save challenge in localStorage
        const newChallenge = {
          id: `local-${Date.now()}`,
          creator_id: null,
          wokwi_id: wokwiId.trim(),
          title: title.trim(),
          description: description.trim(),
          secret_flag: secretFlag.trim(),
          difficulty,
          created_at: new Date().toISOString(),
        };

        const existingRaw = localStorage.getItem('wowki_local_challenges');
        const list = existingRaw ? JSON.parse(existingRaw) : [];
        list.unshift(newChallenge);
        localStorage.setItem('wowki_local_challenges', JSON.stringify(list));

        setStatusMsg({
          type: 'success',
          text: 'Desafio publicado com sucesso localmente! (Supabase em modo simulação)',
        });
      } else {
        // Real Supabase insert
        const { data: { user } } = await supabase.auth.getUser();
        const creatorId = user ? user.id : null;

        const { error } = await supabase
          .from('challenges')
          .insert([
            {
              title: title.trim(),
              description: description.trim(),
              wokwi_id: wokwiId.trim(),
              secret_flag: secretFlag.trim(),
              difficulty,
              creator_id: creatorId,
            },
          ]);

        if (error) {
          throw error;
        }

        setStatusMsg({ type: 'success', text: 'Desafio publicado com sucesso no Supabase!' });
      }

      // Reset form fields
      setTitle('');
      setDescription('');
      setWokwiId('');
      setSecretFlag('');
      setDifficulty('Easy');
    } catch (err: any) {
      console.error(err);
      setStatusMsg({
        type: 'error',
        text: `Erro ao salvar no banco de dados: ${err.message || 'Conectividade interrompida'}`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-56px)] bg-slate-900 text-slate-100 p-6">
      <div className="w-full max-w-lg bg-slate-800 rounded-xl border border-slate-700 shadow-2xl p-8">
        
        {/* Header */}
        <div className="mb-6 text-center">
          <span className="inline-block text-xs font-bold uppercase tracking-wider text-blue-500 bg-blue-500/10 px-3 py-1 rounded-full mb-2">
            CTF Engine
          </span>
          <h2 className="text-2xl font-extrabold tracking-tight text-white">
            Publish New Challenge
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Cadastre um novo laboratório IoT e defina a flag secreta para os alunos capturarem.
          </p>
          {!isSupabaseConfigured && (
            <p className="text-[10px] text-amber-400 mt-2 bg-amber-500/10 border border-amber-500/20 py-1 px-2 rounded">
              ⚠️ Modo Simulação Ativo: As credenciais do Supabase no .env não foram configuradas. Os dados serão salvos localmente.
            </p>
          )}
        </div>

        {/* Status Alerts */}
        {statusMsg && (
          <div
            className={`mb-6 p-4 rounded-lg border text-sm flex items-center gap-2 animate-fadeIn ${
              statusMsg.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}
          >
            {statusMsg.type === 'success' ? (
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
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Título do Desafio <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Aula 11: Invasão de Firmware por Buffer Overflow"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Descrição / Teoria da Aula
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explique o contexto, a vulnerabilidade e os passos que o aluno deve seguir para invadir o dispositivo..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Wokwi ID */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Wokwi ID ou URL <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={wokwiId}
                onChange={(e) => setWokwiId(e.target.value)}
                placeholder="Ex: 349107446543"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Dificuldade
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as 'Easy' | 'Medium' | 'Hard')}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
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
              Secret Flag do Dispositivo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={secretFlag}
              onChange={(e) => setSecretFlag(e.target.value)}
              placeholder="Ex: flag{ESP32_s3cur1ty_bypass_2026}"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Esta é a string secreta que o aluno deve obter no terminal para provar que resolveu a invasão.
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-semibold text-sm py-3 px-4 rounded-lg shadow-lg hover:shadow-blue-500/10 focus:outline-none transition-all flex items-center justify-center gap-2 mt-4"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
