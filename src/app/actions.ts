"use server";
import { neon } from "@neondatabase/serverless";

export async function getScores(): Promise<Map<string, number>> {
  const sql = neon(`${process.env.DATABASE_URL}`);
  const result = await sql`SELECT * FROM scores ORDER BY score DESC LIMIT 10`;
  return new Map(result.map((row) => [row.name, row.score]));
}

export async function addScore(formData: FormData) {
  const name = formData.get("name");
  const score = formData.get("score");

  const sql = neon(`${process.env.DATABASE_URL}`);
  await sql`
    INSERT INTO scores (name, score)
    VALUES (${name}, ${score})
  `;
  console.log("Server Action received:", name);
}
