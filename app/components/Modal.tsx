"use client"
import React from "react";

interface ModalProps {
    event: any;
    shareLink: string;
}

export function Modal({ event, shareLink }: ModalProps) {
    console.log(event);
    return (
        //TODO : Use flexbox
        <form method="dialog" className="modal-content p-10 w-full">
            <h3 className="font-bold color-primary text-lg">{event?.title}</h3>
            <button className="absolute right-5 top-5 rounded-lg text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-red-500" aria-label="Close">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6 size-6 ">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
            </button>
            <div className="date-input">
                <label className="font-semibold" htmlFor="start">Start</label>
                <input className="pr-7" type="date" name="start" defaultValue={event ? new Date(event.start).toISOString().split("T")[0] : ''} />
                <input className="time-input" type="time" name="start" step="3600" min="00:00" max="23:59" defaultValue={event ? new Date(event.start).toISOString().split("T")[1].substring(0, 5) : ''} />
            </div>
            <div className="date-input">
                <label className="font-semibold" htmlFor="end">End</label>
                <input className="pr-7" type="date" name="end" defaultValue={event ? new Date(event.end).toISOString().split("T")[0] : ''} />
                <input className="time-input" type="time" name="end" step="3600" min="00:00" max="23:59" defaultValue={event ? new Date(event.end).toISOString().split("T")[1].substring(0, 5) : ''} />
            </div>
            <p className="">{event?.extendedProps?.description}</p>
            <textarea className="resize-none rounded-lg" rows={4} name="remarks" id="remarks" placeholder="Add any remarks" ></textarea>
            <select name="from" className="dropdown rounded-lg border-1 pl-3 pr-3 ms-1 w-32" id="from">
                <option value="registered">Registered</option>
                <option value="toPrint">To Print</option>
                <option value="printing">Printing</option>
                <option value="finished">Finished</option>
            </select>
            <a className="btn rounded-lg border-1 pl-1 ms-1 w-32" id="openShare" href={shareLink} target="_blank" rel="noreferrer noopener">Open folder</a>
        </form>
    );
}