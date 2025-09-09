"use client"
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction'; // handles event clicks
// import interactionPlugin from "@fullcalendar/interaction";
export default function Calendar() {
  const events = [
    {
        title: 'Team Meeting',
        start: '2025-09-10T10:00:00',
        end: '2025-09-10T11:00:00',
        description: 'Discuss Q2 strategy with the team.',
    }
  ];

  console.log(events);
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
      events={events}
    />
  );
}