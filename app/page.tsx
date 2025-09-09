import Calendar from "./components/calendar/FullCalendar";
import { auth } from "../auth"
import { NavBar } from "./components/NavBar";


export default async function Home() {
  const session = await auth();
  console.log(session);
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <div className="header w-full">
        <NavBar user={session?.user} />
      </div>
      <div className="calendar w-full">
        <Calendar />
      </div>
    </div>
  );
}
