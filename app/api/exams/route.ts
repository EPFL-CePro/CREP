import { getAllExams } from "@/app/lib/database";

export async function GET() {
    const exams = await getAllExams();

    return new Response(JSON.stringify(exams), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    });
}