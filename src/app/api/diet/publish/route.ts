import { sql } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { student_id } = await req.json();

    if (!student_id || student_id === 'undefined') {
      return NextResponse.json({ error: "ID do aluno inválido" }, { status: 400 });
    }

    // 1. Busca o rascunho mais recente gerado pela IA
    const latestPlan = await sql`
      SELECT plan_data FROM public.diet_plans 
      WHERE student_id = ${student_id}::uuid 
      ORDER BY created_at DESC LIMIT 1
    `;

    if (!latestPlan[0]) {
      return NextResponse.json({ error: "Nenhum rascunho encontrado para publicar." }, { status: 404 });
    }

    const meals = latestPlan[0].plan_data.meals;

    // 2. Limpa a dieta antiga do aluno para não duplicar
    await sql`DELETE FROM public.meals WHERE student_id = ${student_id}::uuid`;

    // 3. Insere cada refeição do rascunho na tabela oficial de execução
    for (const meal of meals) {
      await sql`
        INSERT INTO public.meals (student_id, title, time, calories, items)
        VALUES (
          ${student_id}::uuid, 
          ${meal.title}, 
          ${meal.time}, 
          ${latestPlan[0].plan_data.macros_total.calories}, 
          ${JSON.stringify(meal.items)}::jsonb
        )
      `;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("ERRO NA PUBLICAÇÃO:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}