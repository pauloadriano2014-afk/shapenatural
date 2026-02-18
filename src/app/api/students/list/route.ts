import { sql } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Busca todos os perfis que possuem a role 'aluno'
    const students = await sql`
      SELECT id, full_name, email, goal, created_at 
      FROM public.profiles 
      WHERE role = 'aluno' 
      ORDER BY full_name ASC
    `;

    return NextResponse.json(students);
  } catch (error: any) {
    console.error("ERRO AO LISTAR ALUNOS:", error);
    return NextResponse.json({ error: "Erro ao buscar alunos" }, { status: 500 });
  }
}