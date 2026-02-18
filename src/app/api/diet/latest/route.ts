import { sql } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("studentId");

  // Validação do ID para evitar erros de sintaxe no Postgres
  if (!studentId || studentId === 'undefined') {
    return NextResponse.json({ error: "ID do aluno não fornecido." }, { status: 400 });
  }

  try {
    // Busca a dieta mais recente salva na tabela de rascunhos (diet_plans)
    const result = await sql`
      SELECT plan_data 
      FROM public.diet_plans 
      WHERE student_id = ${studentId}::uuid 
      ORDER BY created_at DESC 
      LIMIT 1
    `;

    // Se não houver nada no banco para esse ID
    if (!result[0]) {
      return NextResponse.json({ message: "Nenhum rascunho encontrado." }, { status: 404 });
    }

    // Retorna apenas o objeto JSON com as refeições e macros
    return NextResponse.json(result[0].plan_data);
  } catch (error: any) {
    console.error("ERRO AO BUSCAR DIETA:", error);
    return NextResponse.json({ error: "Erro interno no servidor." }, { status: 500 });
  }
}