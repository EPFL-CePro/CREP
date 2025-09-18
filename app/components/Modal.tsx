"use client"
import React from "react";

interface ModalProps {
    event: any;
    shareLink: string;
}

export function Modal({ event, shareLink }: ModalProps) {
    console.log(event._def);
    return (
        //TODO : Use flexbox
        <form method="dialog" className="modal-content flex flex-col gap-4 p-12 w-full text-foreground bg-background accent-red-500 [&_input]:rounded-lg">
            <h3 className="font-bold basis-full text-lg">{event?.title}</h3>
            <button className=" btn p-1 absolute right-5 top-5 hover:bg-gray-100 dark:hover:bg-stone-800" aria-label="Close">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6 size-6 ">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
            </button>
            <div className="flex flex-row justify-between gap-x-12 flex-wrap gap-y-0 md:flex-nowrap sm:gap-y-2">
                <div className="date-input flex flex-row flex-wrap justify-between gap-y-1 [&_input]:rounded-sm">
                    <label className="font-semibold w-full" htmlFor="start">Start</label>
                    <input className="basis-full xl:basis-auto" type="date" name="start" defaultValue={event ? new Date(event.start).toISOString().split("T")[0] : ''} />
                    <input className="time-input basis-full xl:basis-auto" type="time" name="start" step="3600" min="00:00" max="23:59" defaultValue={event ? new Date(event.start).toISOString().split("T")[1].substring(0, 5) : ''} />
                </div>
                <div className="date-input flex flex-row flex-wrap justify-between gap-y-1 [&_input]:rounded-lg">
                    <label className="font-semibold w-full" htmlFor="end">End</label>
                    <input className="basis-full xl:basis-auto" type="date" name="end" defaultValue={event ? new Date(event.end).toISOString().split("T")[0] : ''} />
                    <input className="time-input basis-full xl:basis-auto" type="time" name="end" step="3600" min="00:00" max="23:59" defaultValue={event ? new Date(event.end).toISOString().split("T")[1].substring(0, 5) : ''} />
                </div>
            </div>
            <div>
                <label className="font-semibold w-full" htmlFor="description">Description</label>
                <p className="">{event?.extendedProps?.description}</p>
            </div>
            <textarea className="resize-none rounded-lg" rows={4} name="remarks" id="remarks" placeholder="Add any remarks" ></textarea>
            <div className="flex flex-row justify-between">
                <select name="from" className="dropdown btn btn-secondary" id="from">
                    <option value="registered">Registered</option>
                    <option value="toPrint">To Print</option>
                    <option value="printing">Printing</option>
                    <option value="finished">Finished</option>
                </select>
                <a className="btn btn-secondary" id="openShare" href={shareLink} target="_blank" rel="noreferrer noopener">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5 ">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 0 0-1.883 2.542l.857 6a2.25 2.25 0 0 0 2.227 1.932H19.05a2.25 2.25 0 0 0 2.227-1.932l.857-6a2.25 2.25 0 0 0-1.883-2.542m-16.5 0V6A2.25 2.25 0 0 1 6 3.75h3.879a1.5 1.5 0 0 1 1.06.44l2.122 2.12a1.5 1.5 0 0 0 1.06.44H18A2.25 2.25 0 0 1 20.25 9v.776" />
                    </svg>
                    Open folder</a>
            </div>
        </form>
    );
}