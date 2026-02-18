import { Utensils } from 'lucide-react';

interface MealProps {
  title: string;
  time: string;
  items: any[];
  calories: number;
}

export default function MealCard({ title, time, items, calories }: MealProps) {
  return (
    <div className="bg-white p-6 rounded-[35px] border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] mb-4">
      <div className="flex justify-between items-start mb-4">
        <div>
          <span className="text-[10px] font-black bg-blue-600 text-white px-3 py-1 rounded-full uppercase tracking-widest">
            {time}
          </span>
          <h3 className="text-lg font-black uppercase italic italic tracking-tighter mt-2 leading-none text-black">
            {title}
          </h3>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Energia</p>
          <p className="text-sm font-black text-black">{calories} kcal</p>
        </div>
      </div>

      <div className="space-y-2 border-t-2 border-slate-100 pt-4">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-3 text-xs font-bold text-slate-700">
            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
            <span className="uppercase">{item.amount}</span>
            <span className="text-black uppercase italic">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}