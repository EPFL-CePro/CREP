"use client"
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction'; // handles event clicks
import { useEffect, useState } from "react";
import { EventDropArg, EventSourceInput } from "@fullcalendar/core/index.js";
import { getAllExams, updateExamDateById } from "@/app/lib/database";
import { Modal } from "../Modal";
import { User } from "next-auth";
// import interactionPlugin from "@fullcalendar/interaction";
// interface CalendarProps {
//   currentEvent: any;
//   setEvent: any;
// }

interface CalendarProps {
  user: User
}


export default function Calendar({ user }: CalendarProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [shareLink, setShareLink] = useState('#');

  const [exams, setExams] = useState<EventSourceInput | undefined>();

  useEffect(() => {
    (async function () {
      const data = await getAllExams()

      const startDate = new Date();

      const filteredData = data.map((e, i) => {
        const currentStart = new Date(startDate);
        currentStart.setDate(startDate.getDate() + i);

        const currentEnd = new Date(currentStart);
        currentEnd.setHours(currentStart.getHours() + 1);

        return {
          title: `${e.code} - ${e.name}`,
          start: e.crep_print_date ? e.crep_print_date.toISOString().slice(0, 19) : currentStart.toISOString().slice(0, 19), // TODO: Calculate the print duration by the number of pages
          end: e.crep_print_date ? e.crep_print_date.setHours(e.crep_print_date.getUTCHours() + 1) : currentEnd.toISOString().slice(0, 19), // TODO: Calculate the print duration by the number of pages
          description: e.name,
          durationEditable: false,
          id: e.code,
          status: e.crep_status,
          remark: e.crep_remark
        }
      })

      setExams(filteredData);
    })();
  }, [modalOpen])

  function formatDate(date: Date) {
    const pad = (num: Number) => String(num).padStart(2, '0');

    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1); // month starting at 0
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  const handleEventDrop = async (arg: EventDropArg) => {
    const id = arg.event.id;
    const startDate = arg.event.start;
    const endDate = arg.event.end;

    const formattedStartDate = formatDate(startDate || new Date())
    const formattedEndDate = formatDate(endDate || new Date())

    await updateExamDateById(id, formattedStartDate, formattedEndDate)
  }

  return (
    <>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        height="90vh"
        firstDay={1}
        slotMinTime="07:00:00"
        slotMaxTime="21:00:00"
        slotLabelFormat={{
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
        }}
        views={{
          dayGridMonth: { buttonText: 'Month' },
          timeGridWeek: { buttonText: 'Week' },
          timeGridDay: { buttonText: 'Day' },
          listWeek: { buttonText: 'List' },
        }}
        eventClick={(info) => {
          setSelectedEvent(info.event);
          // build the share link once and stash in state
          const rawPath = "vpsi1files.epfl.ch/CAPE/REPRO/TEST/" + info.event.extendedProps?.folder_name;
          const uncURL = `file://///${rawPath}`;
          const smbURL = `smb://${rawPath}`;
          let dialog = document.getElementById("modal") as HTMLDialogElement;
          const isWindows = () =>
            /windows/i.test(navigator.userAgent);

          setShareLink(isWindows() ? uncURL : smbURL);
          dialog.showModal();
          setModalOpen(true);
        }}
        editable={true}
        selectable={true}
        events={exams}
        allDaySlot={false}
        eventDrop={handleEventDrop}
      />
      {/* dialog modal starts empty, then is populated with event details on click. Closing the modal will reset the state. */}
      <dialog id="modal" className="modal fixed top-1/4 left-1/4 w-2/4 rounded-xl flex items-center justify-center z-50 drop-shadow-2xl backdrop:backdrop-blur-xs opacity-98" onClose={() => {
        setModalOpen(false);
      }}>
        {modalOpen && (
          <Modal
            event={selectedEvent}
            shareLink={shareLink}
            user={user}
          />
        )}
      </dialog>
    </>
  );
}
