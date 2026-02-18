'use client'

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Sparkles, Send, RefreshCcw } from 'lucide-react';

export default function DietaAtualPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLatest() {
      try {
        const res = await fetch(`/api/diet/latest?studentId=${id}`);
        if (res.ok) {
          const data = await res.json();
          setPlan(data);
        }
      } catch (err) {
        console.error("Erro ao buscar rascunho");
      } finally {
        setLoading(false);
      }
    }
    fetchLatest();
  }, [id]);

  // Função para publicar a dieta e mover para a tabela oficial
  const handlePublish = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/diet/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: id })
      });

      if (res.ok) {
        alert("🚀 DIETA PUBLICADA COM SUCESSO!");
        router.push('/'); // Redireciona para a home para ver o resultado no app
      } else {
        alert("Erro ao publicar a dieta.");
      }
    } catch (err) {
      alert("Erro de conexão ao tentar publicar.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-10 text-center font-black animate-pulse uppercase">Sincronizando Laboratório...</div>;

  return (
    <div className="min-h-screen bg-white p-6 pb-24 text-black font-sans">
      <header className="mb-8">
        <button onClick={() => router.back()} className="text-[10px] font-black uppercase italic border-b-2 border-black mb-6 flex items-center gap-2">
          <ChevronLeft size={14} /> Voltar ao Perfil
        </button>
        <h1 className="text-3xl font-black uppercase italic tracking-tighter">
          Dieta <span className="text-blue-600">Atual</span>
        </h1>
      </header>

      {!plan ? (
        <div className="text-center py-20 border-4 border-dashed border-slate-100 rounded-[40px]">
          <p className="font-black text-slate-300 uppercase italic">Nenhum rascunho ativo no momento.</p>
          <button 
            onClick={() => router.push(`/dashboard-coach/aluno/${id}/gerar-dieta-ia`)}
            className="mt-6 bg-black text-white px-8 py-4 rounded-full font-black uppercase text-[10px] tracking-widest"
          >
            Iniciar Engine IA
          </button>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-blue-600 p-8 rounded-[40px] text-white shadow-xl">
            <h2 className="text-xl font-black uppercase italic">Protocolo em Validação</h2>
            <p className="text-[10px] font-black uppercase opacity-80 mt-1">Status: Rascunho IA (Aguardando Publicação)</p>
          </div>

          <div className="space-y-4">
            {plan.meals?.map((meal: any, idx: number) => (
              <div key={idx} className="bg-white p-6 rounded-[30px] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-black uppercase italic text-sm">{meal.title}</h3>
                  <span className="text-[10px] font-black bg-slate-100 px-3 py-1 rounded-full uppercase">{meal.time}</span>
                </div>
                <div className="space-y-2">
                  {meal.items?.map((item: any, i: number) => (
                    <div key={i} className="text-[11px] font-bold border-l-4 border-blue-600 pl-3 py-1 uppercase italic text-slate-700">
                      {item.amount} <span className="text-black">{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="fixed bottom-6 left-6 right-6 grid grid-cols-2 gap-4">
            <button 
              onClick={() => router.push(`/dashboard-coach/aluno/${id}/gerar-dieta-ia`)}
              className="bg-slate-100 text-black font-black py-5 rounded-[25px] uppercase text-[10px] tracking-widest border-2 border-black flex items-center justify-center gap-2"
            >
              <RefreshCcw size={14} /> Refazer na IA
            </button>
            <button 
              onClick={handlePublish}
              className="bg-blue-600 text-white font-black py-5 rounded-[25px] uppercase text-[10px] tracking-widest shadow-2xl flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <Send size={14} /> Publicar para Aluno
            </button>
          </div>
        </div>
      )}
    </div>
  );
}