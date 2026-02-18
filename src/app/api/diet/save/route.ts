import { sql } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { student_id, plan_data } = await req.json();

    // Validação rigorosa do ID para evitar erro de sintaxe UUID
    if (!student_id || student_id === 'undefined') {
      console.error("Tentativa de salvar com ID inválido");
      return NextResponse.json({ error: "ID do aluno é obrigatório e deve ser um UUID válido." }, { status: 400 });
    }

    console.log("Recebido para salvar no banco v2:", { student_id });

    // 1. Limpa rascunhos antigos (Opcional, mantém o banco limpo)
    // await sql`DELETE FROM diet_plans WHERE student_id = ${student_id}::uuid`;

    // 2. Insere na tabela de rascunhos (diet_plans)
    // Nota: Certifique-se de que criou a tabela 'diet_plans' no Neon SQL Editor
    await sql`
      INSERT INTO diet_plans (student_id, plan_data, active, created_at)
      VALUES (
        ${student_id}::uuid, 
        ${JSON.stringify(plan_data)}::jsonb, 
        true, 
        NOW()
      )
    `;

    return NextResponse.json({ success: true, message: "Dieta salva com sucesso!" });
  } catch (error: any) {
    console.error("ERRO CRÍTICO NO SAVE:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}