import Calendar from "./components/calendar/FullCalendar";
import { auth } from "../auth"
import { NavBar } from "./components/NavBar";
import { Footer } from "./components/Footer";

export default async function Home() {
  const session = await auth();

  if (!session?.user) return;
  return (
    <>
      <div className="font-sans grid grid-rows items-center justify-items-center min-h-screen gap-8 sm:px-10 sm:py-10 sm:pb-0">
        <div className="header w-full">
          <NavBar user={session?.user} />
        </div>
        <div className="calendar w-full ">
          <Calendar user={session?.user} />
        </div>
        <Footer />

      </div>
    </>
  );
}
