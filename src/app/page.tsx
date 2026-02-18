import { sql } from "@/lib/db";
import { User, Activity } from 'lucide-react';
import MealCard from '@/components/MealCard';

export default async function Home() {
  // ID do aluno de teste que criamos no Neon
  const studentId = "5e748d2c-c128-449b-ad8d-5fced0c1307c";

  // Busca as refeições reais do banco que foram publicadas
  const meals = await sql`
    SELECT * FROM public.meals 
    WHERE student_id = ${studentId}::uuid 
    ORDER BY time ASC
  `;

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-black font-sans pb-20">
      <header className="flex justify-between items-center mb-8 bg-white p-6 rounded-[30px] shadow-sm border-2 border-black">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
            <User size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black uppercase italic tracking-tighter text-black">
              Shape <span className="text-blue-600">Natural</span>
            </h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocolo de Elite</p>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto space-y-6">
        <section className="">
          <h2 className="text-xs font-black uppercase italic mb-6 flex items-center gap-2 px-2">
            <Activity size={16} className="text-blue-600" /> Cronograma do Dia
          </h2>
          
          {meals.length === 0 ? (
            <div className="py-20 text-center border-4 border-dashed border-slate-200 rounded-[40px] bg-white">
              <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.2em]">Aguardando Dieta...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {meals.map((meal: any) => (
                /* USANDO O COMPONENTE OFICIAL AQUI */
                <MealCard 
                  key={meal.id}
                  title={meal.title}
                  time={meal.time}
                  calories={meal.calories}
                  items={meal.items} // Aqui ele passa o JSON das comidas
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}