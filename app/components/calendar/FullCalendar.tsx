"use client"
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction'; // handles event clicks
import { useEffect, useState } from "react";
import { EventSourceInput } from "@fullcalendar/core/index.js";
import { Modal } from "../Modal";
// import interactionPlugin from "@fullcalendar/interaction";
// interface CalendarProps {
//   currentEvent: any;
//   setEvent: any;
// }


export default function Calendar() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [shareLink, setShareLink] = useState('#');

  const [exams, setExams] = useState<EventSourceInput | undefined>();

  useEffect(() => {
    (async function () {
      const response = await fetch('/api/exams', { method: 'GET' });
      const data = await response.json();

      const startDate = new Date('2025-09-16T10:00:00');

      const filteredData = data.map((e, i) => {
        const currentStart = new Date(startDate);
        currentStart.setDate(startDate.getDate() + i);

        const currentEnd = new Date(currentStart);
        currentEnd.setHours(currentStart.getHours() + 1);

        return {
          title: `${e.code} - ${e.name}`,
          start: currentStart.toISOString().slice(0, 19), // TODO: Calculate the print duration by the number of pages
          end: currentEnd.toISOString().slice(0, 19), // TODO: Calculate the print duration by the number of pages
          description: e.name,
          durationEditable: false
        }
      })

      setExams(filteredData);
    })();
  }, [])
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
      />
      {/* dialog modal starts empty, then is populated with event details on click. Closing the modal will reset the state. */}
      <dialog id="modal" className="modal fixed top-1/4 left-1/4 w-2/4 rounded-xl flex items-center justify-center z-50 drop-shadow-2xl backdrop:backdrop-blur-xs opacity-98" onClose={() => {
        setModalOpen(false);
      }}>
        {modalOpen && (
          <Modal
            event={selectedEvent}
            shareLink={shareLink}
          />
        )}
      </dialog>
    </>
  );
}
