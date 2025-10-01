"use client"
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction'; // handles event clicks
import { useEffect, useRef, useState } from "react";
import { EventDropArg, EventSourceInput } from "@fullcalendar/core/index.js";
import { getAllExams, getAllNonAdminExams, updateExamDateById } from "@/app/lib/database";
import { Modal } from "../Modal";
import { User } from "next-auth";

interface CalendarProps {
  user: AppUser
}

interface AppUser extends User {
  isAdmin?: boolean;
}


export default function Calendar({ user }: CalendarProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [shareLink, setShareLink] = useState('#');

  const [exams, setExams] = useState<EventSourceInput | undefined>();
  const calRef = useRef<FullCalendar | null>(null);

  // the safelist below is needed for Tailwind to generate the classes used for exam status:
  // bg-blue-500 bg-yellow-500 bg-green-500 bg-red-500 bg-gray-500 text-blue-500 text-yellow-500 text-green-500 text-red-500 text-gray-500
  // border-blue-500 border-yellow-500 border-green-500 border-red-500
  const examStatus = [
    { value: 'registered', label: 'Registered', color: 'blue-500', fcColor: 'oklch(62.3% 0.214 259.815)', needsAdmin: false },
    { value: 'toPrint', label: 'To Print', color: 'yellow-500', fcColor: 'oklch(79.5% 0.184 86.047)', needsAdmin: false },
    { value: 'printing', label: 'Printing', color: 'green-500', fcColor: 'oklch(72.3% 0.219 149.579)', needsAdmin: false },
    { value: 'finished', label: 'Finished', color: 'red-500', fcColor: '#fb2c36', needsAdmin: false },
    { value: 'canceled', label: 'Canceled', color: '', fcColor: '#000000', needsAdmin: true },
    { value: 'prep_teach', label: 'Prep-Teach', color: '', fcColor: '#000000', needsAdmin: true },
    { value: 'prep_2compile', label: 'Prep-2compile', color: '', fcColor: '#000000', needsAdmin: true },
    { value: 'prep_2check', label: 'Prep-2check', color: '', fcColor: '#000000', needsAdmin: true },
    { value: 'pick_up', label: 'Pick-up', color: '', fcColor: '#0000000', needsAdmin: true },
    { value: 'picked_up', label: 'Picked-up', color: '', fcColor: '#000000', needsAdmin: true },
    { value: 'wait_scan', label: 'Wait-Scan', color: '', fcColor: '#000000', needsAdmin: true },
    { value: 'rep_cut', label: 'Rep-Cut', color: '', fcColor: '#000000', needsAdmin: true },
    { value: '2scan', label: '2Scan', color: '', fcColor: '#000000', needsAdmin: true },
    { value: 'scanned', label: 'Scanned', color: '', fcColor: '#0000000', needsAdmin: true },
    { value: 'wait_teach', label: 'Wait-Teach', color: '', fcColor: '#000000', needsAdmin: true },
    { value: 'to_contact', label: 'To-Contact', color: '', fcColor: '#000000', needsAdmin: true }
  ];
  useEffect(() => {
    (async function () {
      const data = user.isAdmin ? await getAllExams() as Array<any> : await getAllNonAdminExams() as Array<any>;
      console.log("Fetched exams:", data);
      const startDate = new Date();

      const filteredData = data.map((e: any, i: number) => {
        const currentStart = new Date(startDate);
        currentStart.setDate(startDate.getDate() + i);

        const currentEnd = new Date(currentStart);
        currentEnd.setHours(currentStart.getHours() + 1);
        const eventColor = examStatus.find(status => status.value === e.crep_status)?.fcColor;
        return {
          title: `${e.code} - ${e.name}`,
          start: e.crep_print_date ? e.crep_print_date.toISOString().slice(0, 19) : currentStart.toISOString().slice(0, 19), // TODO: Calculate the print duration by the number of pages
          end: e.crep_print_date ? e.crep_print_date.setHours(e.crep_print_date.getUTCHours() + 1) : currentEnd.toISOString().slice(0, 19), // TODO: Calculate the print duration by the number of pages
          description: e.name,
          durationEditable: false,
          id: e.code,
          status: e.crep_status,
          backgroundColor: eventColor,
          borderColor: eventColor,
          remark: e.crep_remark
        }
      })
      setExams(filteredData);
    })();
  }, [])

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
        ref={calRef}
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
          const clickedExam = Array.isArray(exams) ? exams.find((e: any) => e.id == info.event.id) : undefined;
          info.event.setExtendedProp('status', clickedExam?.status);
          info.event.setExtendedProp('remark', clickedExam?.remark);
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
        editable={user.isAdmin ? true : false}
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
            exams={exams}
            setExams={setExams}
            examStatus={examStatus}
            calRef={calRef}
          />
        )}
      </dialog >
    </>
  );
}
