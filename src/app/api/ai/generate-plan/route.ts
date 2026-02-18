import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("Dados recebidos pela Engine IA:", body);

    // Mock de resposta para testarmos o fluxo sem gastar créditos de IA agora
    const mockPlan = {
      macros_total: { calories: 2450 },
      meals: [
        {
          title: "CAFÉ DA MANHÃ DE ELITE",
          time: "08:00",
          items: [
            { name: "Ovos Inteiros", amount: "4 un" },
            { name: "Pão Integral", amount: "2 fatias" },
            { name: "Café sem açúcar", amount: "200ml" }
          ]
        },
        {
          title: "ALMOÇO ANABÓLICO",
          time: "12:30",
          items: [
            { name: "Arroz Branco", amount: "150g" },
            { name: "Feijão Preto", amount: "100g" },
            { name: "Frango Grelhado", amount: "150g" }
          ]
        }
      ]
    };

    return NextResponse.json(mockPlan);
  } catch (error) {
    console.error("Erro na rota de geração:", error);
    return NextResponse.json({ error: "Falha na Engine IA" }, { status: 500 });
  }
}