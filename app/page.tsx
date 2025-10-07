import Calendar from "./components/calendar/FullCalendar";
import { auth } from "../auth"
import { NavBar } from "./components/NavBar";
import { Modal } from "./components/Modal";

export default async function Home() {
  const session = await auth();

  if (!session?.user) return;
  return (
    <>
      <div className="font-sans grid grid-rows-[20px_1fr_0px] items-center justify-items-center min-h-screen p-8 gap-16 sm:p-20 sm:pb-0">
        <div className="header w-full">
          <NavBar user={session?.user} />
        </div>
        <div className="calendar w-full ">
          <Calendar user={session?.user} />
        </div>
      </div>
    </>
  );
}
