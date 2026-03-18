import { auth } from "@/auth";
import ExamsTable from "../../components/exams/ExamsTable";
import { getAllAcademicYears } from "@/app/lib/database";
import { redirect } from "next/navigation";

export const metadata = {
    title: "Exams table",
}

export default async function Page({
    params,
}: {
    params: Promise<{ academicYear: string }>
}) {
    const session = await auth();
    if (!session?.user) return;

    const { academicYear } = await params;
    const allAcademicYears = await getAllAcademicYears();
    const academicYearExists = allAcademicYears.some(item => item.label == academicYear);
    if(!academicYear || !academicYearExists) {
        redirect(`/exams/${allAcademicYears[allAcademicYears.length - 1].label}`)
    }

    return (
        <main>
            <ExamsTable academicYear={academicYear[0]}/>
        </main>
    )
}
