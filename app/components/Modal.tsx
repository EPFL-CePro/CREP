"use client"
import { User } from "next-auth";
import React, { Dispatch, SetStateAction, useState } from "react";
import { updateExamRemarkById, updateExamStatusById } from "../lib/database";
import { EventSourceInput } from "@fullcalendar/core/index.js";

interface AppUser extends User {
    isAdmin?: boolean;
}

interface ModalProps {
    event: any;
    shareLink: string;
    user: AppUser;
    examStatus?: { value: string; label: string; color: string, needsAdmin: boolean, fcColor: string }[];
    exams: EventSourceInput | undefined;
    setExams: Dispatch<SetStateAction<EventSourceInput | undefined>>;
    calRef: React.RefObject<any>;
}

export function Modal({ event, shareLink, user, examStatus, exams, setExams, calRef }: ModalProps) {
    const [remark, setRemark] = useState(event?.extendedProps?.remark)
    const [selectStatus, setSelectStatus] = useState(event?.extendedProps?.status)

    // get current calendar reference in order to update event color on status change
    const api = calRef.current.getApi();

    async function save() {
        // save remark, save status, and update the exams state
        const updatedExams = Array.isArray(exams) ? exams.map((e: any) => {
            if (e.id == event?.id) {
                e.remark = remark
                e.status = selectStatus
                // if we have a calendar ref, update the specific event so FullCalendar re-renders its styling
                if (api) {
                    const fcEvent = api.getEventById(String(e.id))
                    if (fcEvent) {
                        const newColor = examStatus?.find(status => status.value === selectStatus)?.fcColor || '#000000'
                        fcEvent.setProp('backgroundColor', newColor)
                        fcEvent.setProp('borderColor', newColor)
                        fcEvent.setExtendedProp('status', selectStatus)
                        fcEvent.setExtendedProp('remark', remark)
                    }
                }
            }
            return e;
        }) : [];
        await updateExamRemarkById(event?.id, remark)
        setRemark(remark)

        await updateExamStatusById(event?.id, selectStatus)
        setSelectStatus(selectStatus)
        setExams(updatedExams)
    }

    // Get color of selected exam
    const examColor = examStatus?.find(status => status.value === event?.extendedProps?.status)?.color;
    return (
        <form method="dialog" className="modal-content flex flex-col gap-4 p-12 w-full text-foreground bg-background accent-red-500 [&_input]:rounded-lg">
            <h3 className={`font-bold basis-full text-lg ${examColor}`}>{event?.title}</h3>
            <button className=" btn p-1 absolute right-5 top-5 hover:bg-gray-100" aria-label="Close">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6 size-6 ">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
            </button>
            {/* status selector for non-admin users. ToDo: Create a component instead?*/}
            <div className="flex flex-row gap-4 flex-wrap">
                {examStatus && examStatus.map((status) => (
                    !status.needsAdmin && (
                        <div key={status.value} id={status.value} className={`btn rounded-full border-2 border-solid border-${status.color} h-8 ${selectStatus === status.value ? `bg-${status.color} text-white` : "btn-secondary text-gray-800"}`} onClick={
                            (e) => {
                                const currentColor = examStatus?.find(s => s.value === selectStatus)?.color;
                                // Remove previous color class from all siblings
                                if (currentColor) {
                                    e.currentTarget.parentElement?.childNodes.forEach((child) => {
                                        if (child instanceof HTMLElement) {
                                            child.classList.remove(currentColor ? `bg-${currentColor}` : "", "text-white");
                                        }
                                    });
                                }
                                // Add new color class to the clicked element and apply new status
                                e.currentTarget.classList.add(`bg-${status.color}`, "text-white");
                                setSelectStatus(status.value);
                            }
                        }>
                            <input onChange={(e) => { }} className="hidden" type="radio" name="status" id={status.value} value={status.value} checked={selectStatus === status.value} />
                            <label className="text-sm cursor-pointer" htmlFor={status.value}>{status.label}</label>
                        </div>
                    )
                ))}
            </div>
            <div className="flex flex-row justify-between gap-x-12 flex-wrap gap-y-0 md:flex-nowrap sm:gap-y-2">
                <div className="date-input flex flex-row flex-wrap justify-between gap-y-1 [&_input]:rounded-sm">
                    <label className="font-semibold w-full" htmlFor="start">Start</label>
                    <input className="basis-full xl:basis-auto" type="date" name="start" disabled defaultValue={event ? new Date(event.start).toISOString().split("T")[0] : ''} />
                    <input className="time-input basis-full xl:basis-auto" type="time" name="start" disabled step="3600" min="00:00" max="23:59" defaultValue={event ? `${("0" + new Date(event.start).getHours()).slice(-2)}:${("0" + new Date(event.start).getMinutes()).slice(-2)}` : ''} />
                </div>
                <div className="date-input flex flex-row flex-wrap justify-between gap-y-1 [&_input]:rounded-lg">
                    <label className="font-semibold w-full" htmlFor="end">End</label>
                    <input className="basis-full xl:basis-auto" type="date" name="end" disabled defaultValue={event ? new Date(event.end).toISOString().split("T")[0] : ''} />
                    <input className="time-input basis-full xl:basis-auto" type="time" name="end" disabled step="3600" min="00:00" max="23:59" defaultValue={event ? `${("0" + new Date(event.end).getHours()).slice(-2)}:${("0" + new Date(event.end).getMinutes()).slice(-2)}` : ''} />
                </div>
            </div>
            <div>
                <label className="font-semibold w-full" htmlFor="description">Description</label>
                <p className="">{event?.extendedProps?.description}</p>
            </div>
            <textarea className="resize-none rounded-lg border border-gray-300 p-3" rows={4} name="remarks" id="remarks" placeholder="Add any remarks"
                value={remark || ""}
                onChange={(e) => setRemark(e.target.value)}
            >
            </textarea>
            <div className="flex flex-row justify-between flex-wrap gap-y-0 xl:flex-nowrap sm:gap-y-2">
                <div className="flex flex-row gap-4 flex-wrap gap-y-0 md:flex-nowrap sm:gap-y-2 ">
                    {/* ToDo : use a component */}
                    {user.isAdmin && (
                        <select name="from" className="dropdown btn btn-secondary" id="from"
                            value={selectStatus}
                            onChange={(e) => setSelectStatus(e.target.value)}
                        >
                            {/* Displays status according to admin privileges */}
                            {examStatus && examStatus.map((status) => (
                                (!status.needsAdmin || user.isAdmin && status.needsAdmin) && (
                                    <option key={status.value} value={status.value} className={status.color}>{status.label}</option>
                                )
                            ))}
                        </select>
                    )}
                    <a className="btn btn-secondary group " id="openShare" href={shareLink} target="_blank" rel="noreferrer noopener">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                            <path className="opacity-0 group-hover:opacity-100 transition duration-300 ease-out-in" strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 0 0-1.883 2.542l.857 6a2.25 2.25 0 0 0 2.227 1.932H19.05a2.25 2.25 0 0 0 2.227-1.932l.857-6a2.25 2.25 0 0 0-1.883-2.542m-16.5 0V6A2.25 2.25 0 0 1 6 3.75h3.879a1.5 1.5 0 0 1 1.06.44l2.122 2.12a1.5 1.5 0 0 0 1.06.44H18A2.25 2.25 0 0 1 20.25 9v.776" />
                            <path className="opacity-100 group-hover:opacity-0 transition duration-300 ease-in-out" strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
                        </svg>
                        Open folder</a>
                </div>
                <div className="flex flex-row gap-4">
                    <button className="btn btn-secondary">Cancel</button>
                    {/* on save, check if the status change into a status that requires admin privileges and confirm with the user */}
                    <button className="btn btn-primary" onClick={(e) => {
                        if (event?.extendedProps?.status !== selectStatus && examStatus?.find(status => status.value === selectStatus)?.needsAdmin) {
                            // proceed only if confirmed, else prevent modal close and save
                            if (window.confirm("You are changing the status to one that requires admin privileges. It means that this exam will be hidden to non-admin users. Are you sure you want to proceed?")) {
                                save();
                                return
                            }
                            e.preventDefault();
                            return;
                        } else {
                            save();
                        }
                    }}>Save</button>
                </div>
            </div>
        </form >
    );
}