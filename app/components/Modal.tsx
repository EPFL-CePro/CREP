"use client"
import { User } from "next-auth";
import React from "react";

interface ModalProps {
    event: any;
    shareLink: string;
    user: User;
}

export function Modal({ event, shareLink, user }: ModalProps) {
    console.log(event);
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
                    <input className="basis-full xl:basis-auto" type="date" name="start" disabled defaultValue={event ? new Date(event.start).toISOString().split("T")[0] : ''} />
                    <input className="time-input basis-full xl:basis-auto" type="time" name="start" disabled step="3600" min="00:00" max="23:59" defaultValue={event ? new Date(event.start).toISOString().split("T")[1].substring(0, 5) : ''} />
                </div>
                <div className="date-input flex flex-row flex-wrap justify-between gap-y-1 [&_input]:rounded-lg">
                    <label className="font-semibold w-full" htmlFor="end">End</label>
                    <input className="basis-full xl:basis-auto" type="date" name="end" disabled defaultValue={event ? new Date(event.end).toISOString().split("T")[0] : ''} />
                    <input className="time-input basis-full xl:basis-auto" type="time" name="end" disabled step="3600" min="00:00" max="23:59" defaultValue={event ? new Date(event.end).toISOString().split("T")[1].substring(0, 5) : ''} />
                </div>
            </div>
            <div>
                <label className="font-semibold w-full" htmlFor="description">Description</label>
                <p className="">{event?.extendedProps?.description}</p>
            </div>
            <textarea className="resize-none rounded-lg" rows={4} name="remarks" id="remarks" placeholder="Add any remarks" ></textarea>
            <select name="from" className="dropdown rounded-lg border-1 pl-3 pr-3 ms-1 w-32" id="from">
                <option value="registered">Registered</option>
                <option value="toPrint">To Print</option>
                <option value="printing">Printing</option>
                <option value="finished">Finished</option>
                {/* If the user is administrator, we should display more options. */}
                {
                    user.isAdmin && (
                        <>                        
                            <option value="canceled">Canceled</option>
                            <option value="prep_teach">Prep-Teach</option>
                            <option value="prep_2compile">Prep-2compile</option>
                            <option value="prep_2check">Prep-2check</option>
                            <option value="pick_up">Pick-up</option>
                            <option value="picked_up">Picked-up</option>
                            <option value="wait_scan">Wait-Scan</option>
                            <option value="rep_cut">Rep-Cut</option>
                            <option value="2scan">2Scan</option>
                            <option value="scanned">Scanned</option>
                            <option value="wait_teach">Wait-Teach</option>
                            <option value="to_contact">To-Contact</option>
                        </>
                    )
                }
            </select>
            <a className="btn rounded-lg border-1 pl-1 ms-1 w-32" id="openShare" href={shareLink} target="_blank" rel="noreferrer noopener">Open folder</a>
        </form>
    );
}