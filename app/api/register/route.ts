import { NextResponse } from 'next/server'
import { insertExam } from '@/app/lib/database'

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { course, examCode, examDate, desiredDate, paperFormat, paperColor, contact, authorizedPersons, nbStudents, nbPages, remark } = body;
    // if (!course || !course.label || !examDate || !nbStudents || !nbPages) {
    //   return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    // }

    const insertedId = await insertExam({
      exam_code: examCode,
      exam_date: examDate,
      exam_name: course,
      exam_pages: Number(nbPages),
      exam_students: Number(nbStudents),
      print_date: desiredDate || null,
      paper_format: paperFormat,
      paper_color: paperColor,
      contact: contact,
      authorized_persons: authorizedPersons,
      remark: remark || null,
      repro_remark: null,
      status: 'registered'
    });

    return NextResponse.json({ success: true, id: insertedId });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
