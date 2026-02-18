'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, UserPlus, Save } from 'lucide-react';

export default function NovoAlunoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ full_name: '', email: '', goal: 'Emagrecimento' });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/students/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        alert("✅ ATLETA INTEGRADO AO TIME!");
        router.push('/dashboard-coach');
      } else {
        alert("Erro ao cadastrar. Verifique se o email é único.");
      }
    } catch (err) {
      alert("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-black font-sans">
      <header className="max-w-md mx-auto mb-10">
        <button onClick={() => router.back()} className="text-[10px] font-black uppercase italic border-b-2 border-black mb-6 flex items-center gap-2">
          <ChevronLeft size={14} /> Voltar ao Painel
        </button>
        <h1 className="text-4xl font-black uppercase italic tracking-tighter leading-none">
          Novo <span className="text-blue-600">Atleta</span>
        </h1>
      </header>

      <main className="max-w-md mx-auto">
        <form onSubmit={handleCreate} className="space-y-8">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest mb-3 block italic">Nome Completo</label>
            <input 
              required
              type="text" 
              className="w-full p-5 bg-white border-2 border-black rounded-[20px] font-black text-lg outline-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" 
              value={formData.full_name} 
              onChange={e => setFormData({...formData, full_name: e.target.value})} 
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest mb-3 block italic">E-mail de Acesso</label>
            <input 
              required
              type="email" 
              className="w-full p-5 bg-white border-2 border-black rounded-[20px] font-black text-lg outline-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" 
              value={formData.email} 
              onChange={e => setFormData({...formData, email: e.target.value})} 
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest mb-3 block italic">Objetivo Principal</label>
            <select 
              className="w-full p-5 bg-white border-2 border-black rounded-[20px] font-black text-lg outline-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] appearance-none"
              value={formData.goal}
              onChange={e => setFormData({...formData, goal: e.target.value})}
            >
              <option>Emagrecimento</option>
              <option>Hipertrofia</option>
              <option>Definição</option>
              <option>Performance</option>
            </select>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-black text-white font-black py-6 rounded-[30px] uppercase tracking-widest text-[12px] shadow-2xl flex items-center justify-center gap-4 active:scale-95 transition-all"
          >
            {loading ? 'CADASTRANDO...' : <><UserPlus size={20} className="text-blue-400" /> FINALIZAR CADASTRO</>}
          </button>
        </form>
      </main>
    </div>
  );
}