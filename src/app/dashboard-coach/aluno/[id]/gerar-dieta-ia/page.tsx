'use client'

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, BrainCircuit, Save, Target, Sparkles } from 'lucide-react';

export default function GerarDietaIAPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params); 
  
  const [loading, setLoading] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<any>(null);

  const [details, setDetails] = useState({
    weight: '', height: '', age: '', 
    goal: 'Cutting', calories: '', 
    gender: 'Masculino', training_level: 'Intermediário'
  });

  const handleGenerate = async () => {
    if (!details.weight || !details.height) { 
      alert("Peso e Altura são obrigatórios!"); 
      return; 
    }
    setLoading(true);
    try {
      const res = await fetch('/api/ai/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...details, studentId: id })
      });
      const plan = await res.json();
      setGeneratedPlan(plan);
    } catch (err) {
      alert("Erro na Engine IA. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!id || id === 'undefined') {
      alert("Erro Crítico: ID do aluno não identificado.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/diet/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: id, plan_data: generatedPlan })
      });

      if (res.ok) {
        alert("✅ PROTOCOLO SALVO!");
        window.location.href = `/dashboard-coach/aluno/${id}/dieta-atual?t=${Date.now()}`;
      } else {
        alert("Erro ao salvar no banco.");
      }
    } catch (err) {
      alert("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans text-black">
      <header className="mb-10 max-w-2xl mx-auto">
        <button onClick={() => router.back()} className="text-black font-black text-[10px] uppercase tracking-widest mb-4 italic flex items-center gap-2 border-b-2 border-black pb-1">
          <ChevronLeft size={14} /> Voltar
        </button>
        <h1 className="text-4xl font-black text-black uppercase italic tracking-tighter">
          IA <span className="text-blue-600">Engine v2</span>
        </h1>
      </header>

      <main className="max-w-2xl mx-auto">
        {!generatedPlan ? (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              {['weight', 'height', 'age'].map((f) => (
                <div key={f}>
                  <label className="text-[10px] font-black uppercase mb-2 block">{f === 'weight' ? 'Peso' : f === 'height' ? 'Alt' : 'Idade'}</label>
                  <input 
                    type="number" 
                    className="w-full p-4 border-2 border-black rounded-xl font-black" 
                    value={(details as any)[f]} 
                    onChange={e => setDetails({...details, [f]: e.target.value})} 
                  />
                </div>
              ))}
            </div>
            <button onClick={handleGenerate} disabled={loading} className="w-full bg-black text-white font-black py-6 rounded-3xl uppercase tracking-widest flex items-center justify-center gap-3">
              {loading ? 'PROCESSANDO...' : <><BrainCircuit size={20} className="text-blue-400" /> GERAR DIETA</>}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-black p-6 rounded-[30px] text-white">
              <h2 className="text-xl font-black uppercase italic">Protocolo Pronto</h2>
              <p className="text-xs text-blue-400 font-bold uppercase mt-1">Meta: {generatedPlan.macros_total?.calories} kcal</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setGeneratedPlan(null)} className="bg-white border-2 border-black p-5 rounded-2xl font-black uppercase text-xs">Refazer</button>
              <button onClick={handleSave} className="bg-blue-600 text-white p-5 rounded-2xl font-black uppercase text-xs shadow-lg">Salvar no Banco</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}