import { sql } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { full_name, email, goal } = await req.json();

    // Log para conferirmos o que está chegando na API
    console.log("Tentando cadastrar atleta:", { full_name, email, goal });

    if (!full_name || !email) {
      return NextResponse.json({ error: "Dados incompletos." }, { status: 400 });
    }

    // Inserção com tratamento de conflito
    const result = await sql`
      INSERT INTO public.profiles (full_name, email, goal, role)
      VALUES (${full_name}, ${email}, ${goal}, 'aluno')
      ON CONFLICT (email) DO NOTHING
      RETURNING id
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: "Este e-mail já está cadastrado no sistema." }, { status: 409 });
    }

    return NextResponse.json({ success: true, id: result[0].id });
  } catch (error: any) {
    console.error("ERRO NO BANCO NEON:", error.message);
    return NextResponse.json({ error: "Erro interno no banco de dados." }, { status: 500 });
  }
}