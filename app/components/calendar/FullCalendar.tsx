"use client"
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction'; // handles event clicks
import { useEffect, useState } from "react";
import { EventSourceInput } from "@fullcalendar/core/index.js";
// import interactionPlugin from "@fullcalendar/interaction";
export default function Calendar() {

  const [exams, setExams] = useState<EventSourceInput | undefined>();

  useEffect(() => {
    (async function() {
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
          dayGridMonth: {buttonText: 'Month'},
          timeGridWeek: {buttonText: 'Week'},
          timeGridDay: {buttonText: 'Day'},
          listWeek: {buttonText: 'List'},
      }}
      editable={true}
      selectable={true}
      events={exams}
    />
  );
}