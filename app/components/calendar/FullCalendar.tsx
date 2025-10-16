"use client"
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction'; // handles event clicks
import { useEffect, useRef, useState, useMemo, Dispatch } from "react";
import { EventDropArg, EventInput, EventSourceInput } from "@fullcalendar/core/index.js";
import { getAllExams, getAllNonAdminExams, updateExamDateById } from "@/app/lib/database";
import { Modal } from "../Modal";
import { User } from "next-auth";
import { getAllowedExamStatus } from "@/app/lib/examStatus";
import { Filters } from "../Filters";
import { QueryResult } from "mysql2";
import { Legend } from "../Legend";

interface CalendarProps {
  user: AppUser
}

interface AppUser extends User {
  isAdmin?: boolean;
}


export default function Calendar({ user }: CalendarProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventInput>();
  const [shareLink, setShareLink] = useState('#');

  const [exams, setExams] = useState<EventSourceInput | undefined>();
  const calRef = useRef<FullCalendar | null>(null);

  const [filters, setFilters] = useState<{ label: string, value: string }[]>([]);
  const availableStatus = getAllowedExamStatus(user.isAdmin || false);

  useEffect(() => {
    (async function () {
      const data = user.isAdmin ? await getAllExams() as Array<QueryResult> : await getAllNonAdminExams() as Array<QueryResult>;
      const startDate = new Date();

      const filteredData = data.map((e: EventInput, i: number) => {
        const currentStart = new Date(startDate);
        currentStart.setDate(startDate.getDate() + i);

        const currentEnd = new Date(currentStart);
        currentEnd.setHours(currentStart.getHours() + 1);
        const eventColor = availableStatus.find(status => status.value === e.status)?.fcColor;
        return {
          title: `${e.exam_code} - ${e.exam_name}`,
          start: e.print_date ? e.print_date.toISOString().slice(0, 19) : currentStart.toISOString().slice(0, 19), // TODO: Calculate the print duration by the number of pages
          end: e.print_date ? e.print_date.setHours(e.print_date.getUTCHours() + 1) : currentEnd.toISOString().slice(0, 19), // TODO: Calculate the print duration by the number of pages
          description: e.exam_name,
          durationEditable: false,
          id: e.id,
          status: e.status,
          backgroundColor: eventColor,
          borderColor: eventColor,
          remark: e.remark,
          reproRemark: e.repro_remark
        }
      })
      setExams(filteredData);
    })();
  }, [availableStatus, user.isAdmin])

  function formatDate(date: Date) {
    const pad = (num: number) => String(num).padStart(2, '0');

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

    const formattedStartDate = formatDate(startDate || new Date())

    await updateExamDateById(id, formattedStartDate)
  }

  const eventsCacheRef = useRef<{ key: string; events: EventInput[] }>({ key: "", events: [] });

  const statusColorMap = useMemo(() => {
    const m = new Map<string, string>();
    (availableStatus || []).forEach(s => m.set(s.value, s.fcColor || "#000000"));
    return m;
  }, [availableStatus]);

  function makeEventsKey(
    examsArr: EventSourceInput,
    filtersArr: { label: string, value: string }[],
    examStatusArr: {
      value: string;
      label: string;
      color: string;
      hexColor: string;
      fcColor: string;
      needsAdmin: boolean;
    }[]) {
    const examsPart = Array.isArray(examsArr) ? examsArr.map(e => `${e.id}:${e.status}`).join("|") : "";
    const filtersPart = (filtersArr || []).map(f => f.value).join(",");
    const statusPart = (examStatusArr || []).map(s => `${s.value}:${s.fcColor}`).join(",");

    // Key to invalidate the cache if something changed using the exams, the filters or the status.
    return `${examsPart}::${filtersPart}::${statusPart}`;
  }

  return (
    <div className="flex flex-col gap-3 justify-between">
      <div className=" w-full flex flex-row justify-between">
        <div className="flex flex-grow-8 flex-row">
          <div className="flex-col ml-4 gap-2 grid grid-cols-4">
            <Legend />
          </div>
        </div>
        <div className=" flex-min-2 min-w-80">
          <Filters
            examStatus={availableStatus}
            user={user}
            setFilters={setFilters as Dispatch<unknown>}
          />
        </div>
      </div>
      <FullCalendar
        ref={calRef}
        plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        height="75vh"
        firstDay={1}
        slotMinTime="07:00:00"
        slotMaxTime="23:00:00"
        timeZone="Europe/Zurich"
        expandRows={true}
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
          const clickedExam = Array.isArray(exams) ? exams.find((e: EventInput) => e.id == info.event.id) : undefined;
          info.event.setExtendedProp('status', clickedExam?.status);
          info.event.setExtendedProp('remark', clickedExam?.remark);
          info.event.setExtendedProp('reproRemark', clickedExam?.reproRemark)
          setSelectedEvent(info.event as EventInput);
          // build the share link once and stash in state
          const rawPath = "vpsi1files.epfl.ch/CAPE/REPRO/TEST/" + info.event.extendedProps?.folder_name; //folder name doesn't exist yet. snippet from ludo. ToDo
          const uncURL = `file://///${rawPath}`;
          const smbURL = `smb://${rawPath}`;
          const dialog = document.getElementById("modal") as HTMLDialogElement;
          const isWindows = () =>
            /windows/i.test(navigator.userAgent);

          setShareLink(isWindows() ? uncURL : smbURL);
          dialog.showModal();
          setModalOpen(true);
        }}
        editable={user.isAdmin ? true : false}
        selectable={true}
        events={(info, successCallback) => {
          if (!exams) return successCallback([]);

          const key = makeEventsKey(exams, filters, availableStatus);

          // If nothing changed, send back the cache
          if (eventsCacheRef.current.key === key) {
            return successCallback(eventsCacheRef.current.events);
          }

          // Else, calculate the exams list + inject colors
          const allSelectedFiltersValues = filters.map((item: { label: string, value: string }) => item.value);
          const filteredEvents = allSelectedFiltersValues.length === 0
            ? exams
            : (exams as EventInput[]).filter((ev) => allSelectedFiltersValues.includes(ev.status));

          const prepared = (filteredEvents as EventInput[]).map((ev: EventInput) => {
            const color = statusColorMap.get(ev.status) || "#000000";
            return {
              ...ev,
              backgroundColor: color,
              borderColor: color,
              extendedProps: { ...(ev.extendedProps || {}), status: ev.status, remark: ev.remark, reproRemark: ev.reproRemark },
            };
          });

          // Put new results in cache
          eventsCacheRef.current = { key, events: prepared };
          successCallback(prepared);
        }}
        allDaySlot={false}
        eventDrop={handleEventDrop}
      />
      {/* dialog modal starts empty, then is populated with event details on click. Closing the modal will reset the state. */}
      <dialog id="modal" className="modal fixed top-1/4 left-1/4 w-2/4 rounded-xl flex items-center justify-center z-50 drop-shadow-2xl backdrop:backdrop-blur-xs opacity-98" onClose={() => {
        setModalOpen(false);
      }}>
        {modalOpen && (
          <Modal
            event={selectedEvent as EventInput}
            shareLink={shareLink}
            user={user}
            exams={exams}
            setExams={setExams}
            examStatus={availableStatus}
          />
        )}
      </dialog >
    </div>
  );
}
