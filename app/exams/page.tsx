import { auth } from "@/auth";
import ExamsTable from "../components/exams/ExamsTable";

export const metadata = {
    title: "Exams table",
}

export default async function Page() {
    const session = await auth();
    if (!session?.user) return;
    return (
        <main>
            <ExamsTable />
        </main>
    )
}
