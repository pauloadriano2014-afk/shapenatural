'use client'

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Activity, 
  Scale, 
  Ruler, 
  LogOut, 
  Clock, 
  ArrowRightLeft, 
  X, 
  CheckCircle, 
  FileText, 
  CalendarDays, 
  ShoppingCart, 
  CheckSquare, 
  Square, 
  Camera, 
  Loader2, 
  Sparkles, 
  Image as ImageIcon 
} from 'lucide-react';

// IMPORTANDO OS COMPONENTES DO ECOSSISTEMA SHAPE NATURAL
import Biofeedback from '@/components/Biofeedback';
import FreeMeal from '@/components/FreeMeal';
import WaterTracker from '@/components/WaterTracker';
import DietPDFGenerator from '@/components/DietPDFGenerator';
import ShoppingPDFGenerator from '@/components/ShoppingPDFGenerator';
import NutriChat from '@/components/NutriChat';

export default function Home() {
  const router = useRouter();
  
  // --- ESTADOS DE USUÁRIO E CARREGAMENTO ---
  const [user, setUser] = useState<any>(null);
  const [studentData, setStudentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // --- ESTADOS DO PROTOCOLO E DIETA ---
  const [protocols, setProtocols] = useState<any[]>([]);
  const [activeDay, setActiveDay] = useState<number>(new Date().getDay());

  // --- ESTADOS DE UI E MODAIS ---
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isShoppingListOpen, setIsShoppingListOpen] = useState(false);
  const [checkedShoppingItems, setCheckedShoppingItems] = useState<string[]>([]);

  // --- ESTADOS DA IA E CAPTURA DE IMAGEM ---
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);
  const [activeMealForPhoto, setActiveMealForPhoto] = useState<any>(null);
  
  // REFS PARA INPUTS DE ARQUIVO (GALERIA/CÂMERA)
  const fileInputRef = useRef<HTMLInputElement>(null);
  const profileInputRef = useRef<HTMLInputElement>(null);

  const weekDays = [
      { idx: 0, label: 'Dom' }, 
      { idx: 1, label: 'Seg' }, 
      { idx: 2, label: 'Ter' },
      { idx: 3, label: 'Qua' }, 
      { idx: 4, label: 'Qui' }, 
      { idx: 5, label: 'Sex' }, 
      { idx: 6, label: 'Sáb' }
  ];

  // --- CARREGAMENTO INICIAL DE DADOS ---
  useEffect(() => {
    const storedUser = localStorage.getItem('shape_user');
    if (!storedUser) {
      router.push('/login');
      return;
    }
    
    const userData = JSON.parse(storedUser);
    setUser(userData);

    if (userData.role === 'coach') {
      router.push('/dashboard-coach');
      return;
    }

    async function loadData() {
      try {
        const dietRes = await fetch(`/api/diet/latest?studentId=${userData.id}`);
        if (dietRes.ok) {
          const data = await dietRes.json();
          
          if (Array.isArray(data) && data.length > 0) {
              let normalizedProtocols = [];
              if (!data[0].meals) {
                 normalizedProtocols = [{
                     name: 'Protocolo Padrão',
                     activeDays: [0, 1, 2, 3, 4, 5, 6],
                     meals: data
                 }];
              } else {
                 normalizedProtocols = data;
              }
              setProtocols(normalizedProtocols);
          }
        }
        
        const detailsRes = await fetch(`/api/students/details?id=${userData.id}`);
        if (detailsRes.ok) {
          const sData = await detailsRes.json();
          setStudentData(sData);
        }
      } catch (err) { 
        console.error("Erro ao carregar dados do dashboard:", err); 
      } finally { 
        setLoading(false); 
      }
    }
    loadData();
  }, [router]);

  // --- LOGOUT DO SISTEMA ---
  const handleLogout = () => {
    localStorage.removeItem('shape_user');
    router.push('/login');
  };

  // --- GESTÃO DA FOTO DE PERFIL ---
  const handleProfileImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onloadend = async () => {
          const base64String = reader.result as string;
          const updatedUser = { ...user, photoUrl: base64String };
          
          setUser(updatedUser);
          localStorage.setItem('shape_user', JSON.stringify(updatedUser));

          try {
              const res = await fetch('/api/students/update-photo', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ studentId: user.id, photoUrl: base64String })
              });
              if (!res.ok) throw new Error("Falha no upload");
          } catch (error) {
              console.error("Erro ao sincronizar foto:", error);
          }
      };
      reader.readAsDataURL(file);
  };

  // --- SUBSTITUIÇÕES DE ALIMENTOS ---
  const openSubstituteModal = (item: any) => {
    if (item.substitutes && item.substitutes.length > 0) {
      setSelectedItem(item);
      setIsModalOpen(true);
    }
  };

  const getActiveProtocol = () => {
      if (protocols.length === 0) return null;
      const found = protocols.find(p => p.activeDays?.includes(activeDay));
      return found || (protocols.length === 1 ? protocols[0] : null);
  };

  // --- LÓGICA DA LISTA DE COMPRAS ---
  const generateShoppingList = () => {
      const list: {[key: string]: any} = {};

      protocols.forEach(protocol => {
          const daysCount = protocol.activeDays?.length || 0;
          if (daysCount === 0) return;

          protocol.meals?.forEach((meal: any) => {
              meal.items?.forEach((item: any) => {
                  const amt = parseFloat(item.amount) || 0;
                  if (amt === 0) return;

                  let cleanName = item.name;
                  const prefixRegex = /^(\d+(?:[.,]\d+)?)\s*([a-zA-Záéíóúç]+)?\s*(de\s+)?/i;
                  const match = cleanName.match(prefixRegex);
                  
                  if (match) {
                      const possibleUnit = (match[2] || '').toLowerCase();
                      const validUnits = ['g', 'ml', 'un', 'fatia', 'fatias', 'colher', 'colheres', 'scoop', 'xicara', 'xícara', 'xícaras', 'kg', 'l'];
                      if (validUnits.includes(possibleUnit)) {
                          cleanName = cleanName.replace(prefixRegex, '').trim();
                      } else if (!possibleUnit) {
                          cleanName = cleanName.replace(/^(\d+(?:[.,]\d+)?)\s*/, '').trim();
                      }
                  }

                  const totalAmt = amt * daysCount;
                  const key = `${cleanName.toLowerCase()}|${item.unit}`;

                  if (!list[key]) {
                      let cat = '🛒 Outros';
                      const n = cleanName.toLowerCase();
                      if (n.includes('frango') || n.includes('carne') || n.includes('patinho') || n.includes('peixe') || n.includes('ovo') || n.includes('queijo') || n.includes('mussarela') || n.includes('peru') || n.includes('presunto') || n.includes('lombo') || n.includes('ricota') || n.includes('cottage') || n.includes('tilápia')) {
                          cat = '🥩 Açougue e Laticínios';
                      } else if (n.includes('arroz') || n.includes('aveia') || n.includes('pão') || n.includes('macarrão') || n.includes('azeite') || n.includes('amendoim') || n.includes('tapioca') || n.includes('granola') || n.includes('café') || n.includes('requeijão') || n.includes('leite') || n.includes('crepioca')) {
                          cat = '📦 Mercearia';
                      } else if (n.includes('banana') || n.includes('maçã') || n.includes('batata') || n.includes('mandioca') || n.includes('morango') || n.includes('melancia') || n.includes('mamão') || n.includes('abacate') || n.includes('melão') || n.includes('pera') || n.includes('uva')) {
                          cat = '🥦 Frutaria e Legumes';
                      } else if (n.includes('whey') || n.includes('creatina') || n.includes('albumina') || n.includes('soja') || n.includes('caseína')) {
                          cat = '💪 Suplementos';
                      }
                      list[key] = { name: cleanName, unit: item.unit, amount: totalAmt, category: cat };
                  } else {
                      list[key].amount += totalAmt;
                  }
              });
          });
      });

      const grouped: {[key: string]: any[]} = {};
      Object.values(list).forEach(item => {
          let finalAmount = item.amount;
          let finalUnit = item.unit;
          if (finalUnit === 'g' && finalAmount >= 1000) {
              finalAmount = (finalAmount / 1000).toFixed(1).replace('.0', '');
              finalUnit = 'kg';
          } else if (finalUnit === 'ml' && finalAmount >= 1000) {
              finalAmount = (finalAmount / 1000).toFixed(1).replace('.0', '');
              finalUnit = 'L';
          }
          if (!grouped[item.category]) grouped[item.category] = [];
          grouped[item.category].push({ ...item, amount: finalAmount, unit: finalUnit });
      });
      return grouped;
  };

  const toggleShoppingItem = (itemName: string) => {
      if (checkedShoppingItems.includes(itemName)) {
          setCheckedShoppingItems(checkedShoppingItems.filter(i => i !== itemName));
      } else {
          setCheckedShoppingItems([...checkedShoppingItems, itemName]);
      }
  };

  // --- GESTÃO DE CÂMERA E IA ---
  const triggerCamera = (meal: any) => {
      setActiveMealForPhoto(meal);
      if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleImageCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onloadend = () => {
          setPhotoPreview(reader.result as string);
          setAiFeedback(null);
          setIsAiModalOpen(true);
      };
      reader.readAsDataURL(file);
  };

  const analyzeImage = async () => {
    if (!photoPreview) return;
    setIsAnalyzing(true);
    setAiFeedback(null);
    try {
      const expectedFood = activeMealForPhoto.items.map((i: any) => `${i.amount}${i.unit} de ${i.name}`);
      const res = await fetch('/api/analyze-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: photoPreview, expectedMeal: expectedFood })
      });
      const data = await res.json();
      if (res.ok) {
          setAiFeedback(data.result);
      } else {
          setAiFeedback("Erro ao conectar com o servidor.");
      }
    } catch (error) {
      setAiFeedback("Erro de conexão.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const activeProtocol = getActiveProtocol();
  const shoppingList = generateShoppingList();

  // --- TELA DE CARREGAMENTO ---
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-black text-white text-xl tracking-[0.3em] uppercase italic animate-pulse">Shape Natural</p>
      </div>
    );
  }

  // --- RENDERIZAÇÃO PRINCIPAL DO WEB APP ---
  return (
    <div className="min-h-[100dvh] bg-slate-50 font-sans pb-[env(safe-area-inset-bottom,24px)] relative text-black">
      
      {/* Inputs invisíveis */}
      <input 
        type="file" 
        accept="image/*" 
        capture="environment" 
        ref={fileInputRef} 
        className="hidden" 
        onChange={handleImageCapture} 
      />
      <input 
        type="file" 
        accept="image/*" 
        ref={profileInputRef} 
        className="hidden" 
        onChange={handleProfileImageChange} 
      />

      <NutriChat studentName={user?.name || 'Atleta'} protocols={protocols} />

      {/* --- CABEÇALHO (SAFE AREA NOTCH) --- */}
      <header className="bg-slate-900 text-white p-6 pt-[max(env(safe-area-inset-top,2.5rem),2.5rem)] rounded-b-[45px] shadow-2xl mb-8 border-b-4 border-blue-600 relative overflow-hidden flex items-center justify-between">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600 rounded-full blur-[120px] opacity-20 -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        
        <div className="flex items-center gap-4 sm:gap-5 relative z-10">
          <div 
            onClick={() => profileInputRef.current?.click()} 
            className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-800 rounded-full border-2 border-blue-500 flex items-center justify-center overflow-hidden shadow-[0_0_25px_rgba(37,99,235,0.4)] relative group cursor-pointer active:scale-95 transition-all shrink-0"
          >
            {user?.photoUrl ? (
                <img 
                  src={user.photoUrl} 
                  alt="Perfil" 
                  className="w-full h-full object-cover object-center" 
                />
            ) : (
                <User size={30} className="text-blue-400 group-hover:scale-110 transition-transform" />
            )}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera size={18} className="text-white"/>
            </div>
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-[11px] font-black text-blue-400 uppercase tracking-[0.2em] mb-1">
              Shape Natural Elite
            </p>
            <h1 className="text-xl sm:text-2xl font-black uppercase italic tracking-tighter leading-none truncate max-w-[150px] sm:max-w-[200px]">
              Fala, {user?.name ? user.name.split(' ')[0] : 'Aluno'}!
            </h1>
          </div>
        </div>
        
        <button 
          onClick={handleLogout} 
          className="relative z-10 text-white/40 hover:text-red-500 transition-colors p-3 bg-white/5 rounded-2xl hover:bg-white/10 shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <LogOut size={22} />
        </button>
      </header>

      {/* --- DASHBOARD ROTINA --- */}
      <div className="px-4 sm:px-6 mb-8 space-y-4 max-w-4xl mx-auto">
         <WaterTracker studentId={user?.id} weight={studentData?.weight} />
         
         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <button 
                onClick={() => setIsShoppingListOpen(true)} 
                className="w-full bg-white border border-slate-200 p-5 rounded-3xl shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex items-center gap-4 group h-full active:scale-[0.98]"
             >
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all shrink-0">
                  <ShoppingCart size={24} />
                </div>
                <div className="text-left">
                  <h3 className="font-black uppercase text-sm text-slate-800 leading-tight">Mercado</h3>
                  <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Lista</p>
                </div>
             </button>
             
             <Biofeedback studentId={user?.id} />
         </div>

         <div className="w-full">
            <FreeMeal studentId={user?.id} />
         </div>
      </div>

      {/* --- SELETOR DE PROTOCOLO --- */}
      <div className="px-4 sm:px-6 mb-8 max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-slate-400 px-2">
                <CalendarDays size={16}/>
                <span className="text-[11px] font-black uppercase tracking-widest">Protocolos</span>
              </div>
              {protocols.length > 0 && (
                <DietPDFGenerator studentName={user?.name || 'Aluno'} protocols={protocols} />
              )}
          </div>
          <div className="flex justify-between bg-white p-2.5 rounded-[25px] shadow-sm border border-slate-200 overflow-x-auto hide-scrollbar gap-2 snap-x">
             {weekDays.map(day => (
                 <button 
                    key={day.idx} 
                    onClick={() => setActiveDay(day.idx)} 
                    className={`min-w-[60px] flex-1 py-3 rounded-2xl text-[10px] font-black uppercase transition-all snap-center whitespace-nowrap ${activeDay === day.idx ? 'bg-blue-600 text-white shadow-lg scale-105 z-10' : 'text-slate-400 hover:bg-slate-50'}`}
                 >
                    {day.label}
                 </button>
             ))}
          </div>
      </div>

      {/* --- LISTAGEM DE REFEIÇÕES --- */}
      <main className="px-4 sm:px-6 space-y-8 max-w-4xl mx-auto pb-10">
        <div className="flex justify-between items-center px-2">
            <h2 className="text-[10px] sm:text-xs font-black uppercase italic flex items-center gap-2 sm:gap-3 text-slate-400 tracking-[0.2em] sm:tracking-[0.3em] border-l-4 border-blue-600 pl-3">
               {activeProtocol ? activeProtocol.name : 'Descanso'}
            </h2>
        </div>
        
        {!activeProtocol ? (
          <div className="py-24 text-center border-4 border-dashed border-slate-200 rounded-[50px] bg-white/50 m-2">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                <Activity size={32} />
            </div>
            <p className="font-black uppercase text-xs text-slate-400 tracking-widest">Sem protocolos hoje.</p>
          </div>
        ) : (
          <div className="space-y-6 sm:space-y-8">
            {activeProtocol.meals.map((meal: any, index: number) => (
              <div 
                key={index} 
                className="bg-white p-5 sm:p-7 rounded-[35px] sm:rounded-[40px] shadow-[0px_10px_30px_-15px_rgba(0,0,0,0.1)] border border-slate-100 hover:border-blue-200 transition-all group relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                <div className="flex justify-between items-start mb-6 sm:mb-8 pb-4 sm:pb-5 border-b border-slate-50">
                  <div className="space-y-2 pr-2">
                    <div className="bg-slate-100 text-slate-600 w-fit px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-[9px] sm:text-[10px] font-black flex items-center gap-1.5 sm:gap-2 group-hover:bg-blue-600 group-hover:text-white transition-all">
                      <Clock size={12} className="sm:w-[14px] sm:h-[14px]" /> 
                      {meal.time || "Livre"}
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black uppercase italic leading-none text-slate-800 tracking-tight">
                      {meal.title}
                    </h3>
                  </div>
                  
                  <button 
                    onClick={() => triggerCamera(meal)} 
                    className="bg-blue-50 text-blue-600 p-3 sm:p-4 rounded-2xl sm:rounded-3xl hover:bg-blue-600 hover:text-white transition-all shadow-sm flex flex-col items-center gap-1 active:scale-90 shrink-0 min-w-[56px]"
                  >
                    <Camera size={20} className="sm:w-[24px] sm:h-[24px]" />
                    <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-wider">IA Scan</span>
                  </button>
                </div>

                {meal.observations && (
                  <div className="mb-6 sm:mb-8 bg-amber-50/50 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-amber-100 text-[11px] sm:text-xs font-semibold text-amber-800 italic relative">
                    <span className="absolute -top-3 left-4 sm:left-6 bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full text-[8px] sm:text-[9px] font-black uppercase flex items-center gap-1 shadow-sm">
                      <FileText size={10} className="sm:w-[12px] sm:h-[12px]"/> Nota Estratégica
                    </span>
                    {meal.observations}
                  </div>
                )}

                <div className="space-y-3 sm:space-y-4">
                  {meal.items?.map((item: any, i: number) => (
                    <div key={i} className="flex flex-col">
                      <div className="flex items-center justify-between bg-slate-50/80 p-3 sm:p-4 rounded-[20px] sm:rounded-[25px] border border-slate-100 group/item">
                        <div className="flex items-center gap-3 sm:gap-4 flex-1 overflow-hidden">
                          <div className={`w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-[14px] sm:rounded-2xl flex items-center justify-center font-black text-xs sm:text-sm shadow-sm transition-colors ${item.substitutes?.length > 0 ? 'bg-blue-100 text-blue-600 border border-blue-200' : 'bg-white text-slate-400 border border-slate-200'}`}>
                            {i + 1}
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="block text-sm sm:text-base font-black uppercase italic text-slate-800 leading-tight truncate group-hover/item:text-blue-700 transition-colors">
                              {item.name}
                            </span>
                            {item.amount && (
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] sm:text-[11px] font-black text-slate-500 uppercase bg-slate-200 px-2 py-0.5 rounded-md sm:rounded-lg">
                                  {item.amount}{item.unit}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {item.substitutes && item.substitutes.length > 0 && (
                          <button 
                            onClick={() => openSubstituteModal(item)} 
                            className="shrink-0 bg-white border-2 border-blue-100 text-blue-600 p-2 sm:p-3 rounded-[14px] sm:rounded-2xl hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-sm active:scale-95 flex items-center gap-1.5 sm:gap-2 ml-2 min-h-[44px] min-w-[44px] justify-center"
                          >
                            <ArrowRightLeft size={16} />
                            <span className="text-[9px] sm:text-[10px] font-black uppercase hidden sm:inline">Trocar</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* --- MODAL DA LISTA DE COMPRAS --- */}
      {isShoppingListOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-6">
          <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-md" onClick={() => setIsShoppingListOpen(false)} />
          
          <div className="bg-white w-full h-[95dvh] sm:h-[85vh] max-w-2xl rounded-t-[40px] sm:rounded-[50px] flex flex-col relative z-10 animate-in slide-in-from-bottom duration-500 shadow-2xl overflow-hidden pb-[env(safe-area-inset-bottom,0px)]">
            <div className="bg-blue-600 p-6 sm:p-8 pt-[max(env(safe-area-inset-top,2rem),1.5rem)] text-white relative shrink-0">
               <button 
                 onClick={() => setIsShoppingListOpen(false)} 
                 className="absolute top-4 sm:top-8 right-4 sm:right-8 bg-white/20 hover:bg-white/40 p-2 sm:p-3 rounded-full transition-colors text-white min-w-[44px] min-h-[44px] flex items-center justify-center"
               >
                 <X size={20} className="sm:w-[24px] sm:h-[24px]" />
               </button>
               
               <div className="flex justify-between items-end mb-4 sm:mb-6 pr-14">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/20 rounded-[20px] sm:rounded-3xl flex items-center justify-center backdrop-blur-md">
                     <ShoppingCart size={28} className="sm:w-[32px] sm:h-[32px] text-white" />
                  </div>
                  <ShoppingPDFGenerator studentName={user?.name || 'Aluno'} shoppingList={shoppingList} />
               </div>
               
               <h3 className="text-2xl sm:text-3xl font-black uppercase italic leading-none mb-1 sm:mb-2 tracking-tighter">Minha Despensa</h3>
               <p className="text-[9px] sm:text-[11px] font-bold uppercase opacity-80 tracking-widest">Calculado de todos os seus protocolos</p>
            </div>

            <div className="flex-1 overflow-y-auto p-5 sm:p-8 bg-slate-50 space-y-6 sm:space-y-8 custom-scrollbar">
               {Object.keys(shoppingList).length === 0 ? (
                   <div className="text-center py-20 sm:py-32 opacity-40">
                       <ShoppingCart size={48} className="sm:w-[60px] sm:h-[60px] mx-auto mb-4 sm:mb-6" />
                       <p className="font-black uppercase text-xs sm:text-sm tracking-[0.2em]">Sua lista está vazia</p>
                   </div>
               ) : (
                   Object.keys(shoppingList).map((category, cIdx) => (
                       <div key={cIdx} className="bg-white rounded-[25px] sm:rounded-[35px] border border-slate-200 p-5 sm:p-7 shadow-sm">
                           <h4 className="text-[10px] sm:text-[12px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-blue-600 mb-4 sm:mb-6 border-b border-slate-100 pb-2 sm:pb-3 flex items-center gap-2 sm:gap-3">
                               <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-600 rounded-full animate-pulse"></div>
                               {category}
                           </h4>
                           <div className="grid grid-cols-1 gap-3 sm:gap-4">
                               {shoppingList[category].map((item: any, iIdx: number) => {
                                   const isChecked = checkedShoppingItems.includes(item.name);
                                   return (
                                       <button 
                                          key={iIdx} 
                                          onClick={() => toggleShoppingItem(item.name)} 
                                          className={`w-full flex justify-between items-center p-3 sm:p-4 rounded-2xl sm:rounded-3xl border transition-all min-h-[44px] ${isChecked ? 'bg-slate-50 border-transparent opacity-50 grayscale' : 'bg-white border-slate-100 hover:border-blue-400'}`}
                                       >
                                          <div className="flex items-center gap-3 sm:gap-4 text-left overflow-hidden">
                                              {isChecked ? <CheckSquare size={20} className="sm:w-[22px] sm:h-[22px] text-green-500 shrink-0" /> : <Square size={20} className="sm:w-[22px] sm:h-[22px] text-slate-300 shrink-0" />}
                                              <span className={`text-sm sm:text-base font-bold uppercase italic transition-all truncate ${isChecked ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                                                  {item.name}
                                              </span>
                                          </div>
                                          <div className="bg-slate-100 px-3 py-1.5 sm:px-4 sm:py-2 rounded-[12px] sm:rounded-2xl shrink-0 text-right shadow-inner ml-2">
                                              <span className="font-black text-base sm:text-lg text-blue-600 leading-none">{item.amount}</span>
                                              <span className="text-[9px] sm:text-[10px] font-black uppercase ml-1 sm:ml-1.5 text-slate-500">{item.unit}</span>
                                          </div>
                                       </button>
                                   );
                               })}
                           </div>
                       </div>
                   ))
               )}
            </div>

            <div className="p-5 sm:p-8 bg-white border-t border-slate-100 shrink-0 pb-[max(env(safe-area-inset-bottom,20px),20px)]">
               <button 
                  onClick={() => setIsShoppingListOpen(false)} 
                  className="w-full bg-slate-900 text-white p-5 sm:p-6 rounded-[25px] sm:rounded-[30px] font-black uppercase text-sm sm:text-base tracking-[0.2em] hover:bg-blue-600 transition-all shadow-xl active:scale-95 flex justify-center items-center gap-3 min-h-[56px]"
               >
                  Concluir Compra
               </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL DA IA --- */}
      {isAiModalOpen && photoPreview && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-xl" onClick={() => !isAnalyzing && setIsAiModalOpen(false)} />
          
          <div className="bg-white w-full max-w-lg rounded-[40px] sm:rounded-[50px] overflow-hidden relative z-10 shadow-[0_0_100px_rgba(37,99,235,0.2)] animate-in zoom-in-95 duration-500 flex flex-col max-h-[90dvh]">
            <div className="p-5 sm:p-6 bg-slate-50 flex justify-between items-center border-b border-slate-200 shrink-0">
                <div className="flex items-center gap-2 sm:gap-3 text-blue-600">
                    <Sparkles size={20} className="sm:w-[24px] sm:h-[24px] animate-pulse" />
                    <h3 className="font-black uppercase italic text-xs sm:text-sm tracking-widest">IA Shape Natural</h3>
                </div>
                {!isAnalyzing && (
                    <button 
                      onClick={() => setIsAiModalOpen(false)} 
                      className="p-2 sm:p-3 text-slate-400 hover:text-red-500 rounded-full bg-white shadow-md border border-slate-100 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
                    >
                      <X size={18} className="sm:w-[20px] sm:h-[20px]"/>
                    </button>
                )}
            </div>

            <div className="p-5 sm:p-8 overflow-y-auto custom-scrollbar">
                <div className="w-full h-48 sm:h-64 bg-slate-200 rounded-[25px] sm:rounded-[35px] overflow-hidden mb-6 sm:mb-8 border-4 border-white shadow-2xl relative group shrink-0">
                    <img src={photoPreview} alt="Sua refeição" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                </div>

                {!aiFeedback ? (
                    <button 
                       onClick={analyzeImage} 
                       disabled={isAnalyzing} 
                       className="w-full bg-blue-600 text-white p-5 sm:p-6 rounded-[25px] sm:rounded-[30px] font-black uppercase text-xs sm:text-sm tracking-[0.2em] hover:bg-black transition-all shadow-xl shadow-blue-500/30 flex justify-center items-center gap-3 sm:gap-4 disabled:opacity-70 disabled:cursor-not-allowed min-h-[56px]"
                    >
                       {isAnalyzing ? (
                           <><Loader2 size={20} className="sm:w-[24px] sm:h-[24px] animate-spin" /> Escaneando Macros...</>
                       ) : (
                           <><Sparkles size={20} className="sm:w-[24px] sm:h-[24px]" /> Validar Refeição</>
                       )}
                    </button>
                ) : (
                    <div className="bg-blue-50/50 border-2 border-blue-100 p-5 sm:p-7 rounded-[25px] sm:rounded-[35px] animate-in fade-in duration-500">
                        <div className="flex items-center gap-2 mb-3 sm:mb-4">
                            <CheckCircle size={16} className="sm:w-[18px] sm:h-[18px] text-blue-500" />
                            <p className="text-[10px] sm:text-[11px] font-black text-blue-400 uppercase tracking-widest">Feedback do Coach Virtual:</p>
                        </div>
                        <p className="text-sm sm:text-base font-semibold text-slate-800 whitespace-pre-line leading-relaxed italic">
                            "{aiFeedback}"
                        </p>
                        <button 
                            onClick={() => setIsAiModalOpen(false)} 
                            className="w-full mt-6 sm:mt-8 bg-slate-900 text-white p-4 rounded-2xl font-black uppercase text-[10px] sm:text-xs tracking-widest hover:bg-blue-600 transition-all shadow-lg min-h-[48px]"
                        >
                            Fechar Análise
                        </button>
                    </div>
                )}
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL DE SUBSTITUIÇÃO --- */}
      {isModalOpen && selectedItem && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-6">
          <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
          
          <div className="bg-white w-full max-w-lg rounded-t-[40px] sm:rounded-[50px] overflow-hidden relative z-10 animate-in slide-in-from-bottom duration-500 shadow-2xl pb-[env(safe-area-inset-bottom,0px)] max-h-[90dvh] flex flex-col">
            <div className="bg-blue-600 p-6 sm:p-8 pt-[max(env(safe-area-inset-top,1.5rem),1.5rem)] text-white relative shrink-0">
               <button 
                 onClick={() => setIsModalOpen(false)} 
                 className="absolute top-4 sm:top-6 right-4 sm:right-6 bg-white/20 hover:bg-white/40 p-2 sm:p-3 rounded-full transition-colors text-white min-w-[44px] min-h-[44px] flex items-center justify-center"
               >
                 <X size={20} />
               </button>
               <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] opacity-80 mb-2 sm:mb-3 block">Opções Inteligentes:</span>
               <h3 className="text-2xl sm:text-3xl font-black uppercase italic leading-none tracking-tight pr-12">{selectedItem.name}</h3>
            </div>

            <div className="p-5 sm:p-8 bg-white flex-1 overflow-hidden flex flex-col">
              <div className="space-y-3 sm:space-y-4 overflow-y-auto custom-scrollbar flex-1 pr-1 sm:pr-2">
                {selectedItem.substitutes.map((sub: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center p-4 sm:p-5 bg-white rounded-[25px] sm:rounded-[30px] border border-slate-100 shadow-sm group hover:border-blue-500 hover:bg-blue-50/30 transition-all active:scale-[0.98]">
                    <div className="flex items-center gap-3 sm:gap-5 overflow-hidden">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-[18px] sm:rounded-[22px] bg-slate-50 border border-slate-100 flex flex-col items-center justify-center text-blue-600 group-hover:bg-white group-hover:border-blue-200 transition-all shadow-inner">
                        <span className="text-base sm:text-lg font-black leading-none">{sub.amount}</span>
                        <span className="text-[8px] sm:text-[9px] font-black uppercase mt-1">{sub.unit}</span>
                      </div>
                      <span className="font-black uppercase italic text-slate-700 text-xs sm:text-sm group-hover:text-blue-900 transition-colors line-clamp-2">
                        {sub.name}
                      </span>
                    </div>
                    <div className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 rounded-full border-2 border-slate-100 flex items-center justify-center group-hover:border-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all ml-2">
                        <CheckCircle size={16} className="sm:w-[20px] sm:h-[20px] text-slate-200 group-hover:text-white transition-colors" />
                    </div>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => setIsModalOpen(false)} 
                className="w-full bg-slate-900 text-white p-5 sm:p-6 rounded-[25px] sm:rounded-[30px] font-black uppercase mt-4 sm:mt-6 hover:bg-blue-600 transition-all shadow-2xl active:scale-95 tracking-[0.2em] shrink-0 min-h-[56px] mb-[max(env(safe-area-inset-bottom,10px),10px)]"
              >
                Voltar ao Plano
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}