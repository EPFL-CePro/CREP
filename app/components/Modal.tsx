"use client"
import { User } from "next-auth";
import React, { Dispatch, SetStateAction, useRef, useState } from "react";
import { updateExamRemarkById, updateExamStatusById, updateExamReproRemarkById } from "../lib/database";
import { EventApi, EventInput, EventSourceInput } from "@fullcalendar/core/index.js";
import { PrintButton } from "./print/ReactToPrint";
import { examNotAdminStatus } from "../lib/examStatus";
import {
    formatDateInputValue,
    formatDateOnlyValue,
    formatTimeInputValue,
    getDatePartFromDateTimeString,
    getTimePartFromDateTimeString,
} from "../lib/dateTime";

interface AppUser extends User {
    isAdmin?: boolean;
}

interface ModalProps {
    event?: EventApi;
    shareLink: string;
    user: AppUser;
    examStatus?: { value: string; label: string; color: string, needsAdmin: boolean, fcColor: string }[];
    exams: EventSourceInput | undefined;
    setExams: Dispatch<SetStateAction<EventSourceInput | undefined>>;
}

export function Modal({ event, shareLink, user, examStatus, exams, setExams }: ModalProps) {
    const [remark, setRemark] = useState(event?.extendedProps?.remark)
    const [reproRemark, setReproRemark] = useState(event?.extendedProps?.reproRemark)
    const [selectStatus, setSelectStatus] = useState(event?.extendedProps?.status)
    const modalRef = useRef<HTMLFormElement | null>(null);

    async function save() {
        // save remark, save status, and update the exams state
        const updatedExams = Array.isArray(exams) ? exams.map((e: EventInput) => {
            if (e.id == event?.id) {
                e.remark = remark
                e.status = selectStatus
                e.reproRemark = reproRemark
            }
            return e;
        }) : [];
        await updateExamRemarkById(event?.id || '', remark)
        setRemark(remark)

        await updateExamReproRemarkById(event?.id || '', reproRemark)
        setReproRemark(reproRemark)

        await updateExamStatusById(event?.id || '', selectStatus)
        setSelectStatus(selectStatus)
        setExams(updatedExams)
    }

    // Get color of selected exam
    const examColor = examStatus?.find(status => status.value === event?.extendedProps?.status)?.color;
    const startDateValue = getDatePartFromDateTimeString(event?.startStr) || (event?.start ? formatDateInputValue(event.start) : '');
    const startTimeValue = getTimePartFromDateTimeString(event?.startStr) || (event?.start ? formatTimeInputValue(event.start) : '');
    const endDateValue = getDatePartFromDateTimeString(event?.endStr) || (event?.end ? formatDateInputValue(event.end) : '');
    const endTimeValue = getTimePartFromDateTimeString(event?.endStr) || (event?.end ? formatTimeInputValue(event.end) : '');

    return (
        <form ref={modalRef as React.RefObject<HTMLFormElement>} method="dialog" className="modal-content flex flex-col gap-4 p-12 w-full text-foreground bg-background accent-red-500 [&_input]:rounded-lg">
            <h3 className={`exam-title font-bold basis-full text-lg ${examColor}`}>{event?.title}</h3>
            <button className=" btn p-1 absolute right-5 top-5 hover:bg-gray-100" aria-label="Close">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6 size-6 ">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
            </button>
            {/* status selector for non-admin users. ToDo: Create a component instead?*/}
            <div id="status-selector" className="flex flex-row gap-4 flex-wrap">
                {examNotAdminStatus && examNotAdminStatus.map((status) => (
                    <div key={status.value} id={status.value} className={`btn rounded-full border-2 border-solid border-${status.color} h-8 ${selectStatus === status.value ? `bg-${status.color} text-white` : "btn-secondary text-gray-800"}`} onClick={
                        (e) => {
                            const currentColor = examNotAdminStatus?.find(s => s.value === selectStatus)?.color;
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
                        <input className="hidden" type="radio" name="status" id={status.value} value={status.value} defaultChecked={selectStatus === status.value} />
                        <label className="text-sm cursor-pointer" htmlFor={status.value}>{status.label}</label>
                    </div>
                ))}
            </div>
            <div className="flex flex-col gap-y-4">
                <div className="flex flex-row justify-between gap-x-12 flex-wrap gap-y-0 md:flex-nowrap sm:gap-y-2 items-start">
                    <div className="date-input flex flex-row flex-wrap gap-4 gap-y-1 [&_input]:rounded-sm flex-1">
                        <label className="font-semibold w-full" htmlFor="start">Estimated print start</label>
                        <input className="start-date basis-full xl:basis-auto" type="date" name="start" disabled defaultValue={startDateValue} />
                        <input className="start-time basis-full xl:basis-auto" type="time" name="start" disabled step="3600" min="00:00" max="23:59" defaultValue={startTimeValue} />
                    </div>
                    <div className="date-input flex flex-row flex-wrap gap-4 gap-y-1 [&_input]:rounded-lg flex-1">
                        <label className="font-semibold w-full" htmlFor="end">Estimated print end</label>
                        <input className="end-date basis-full xl:basis-auto" type="date" name="end" disabled defaultValue={endDateValue} />
                        <input className="end-time basis-full xl:basis-auto" type="time" name="end" disabled step="3600" min="00:00" max="23:59" defaultValue={endTimeValue} />
                    </div>
                </div>
                <div className="flex flex-row justify-between gap-x-12 flex-wrap gap-y-0 md:flex-nowrap sm:gap-y-2 items-start">
                    <div className="date-input flex flex-row flex-wrap gap-4 gap-y-1 [&_input]:rounded-sm flex-1">
                        <label className="font-semibold w-full" htmlFor="financial">Financial center</label>
                        <input className="financial-center basis-full xl:basis-auto" type="text" name="financial" disabled defaultValue={event?.extendedProps?.financialCenter} />
                    </div>
                    <div className="date-input flex flex-row flex-wrap gap-4 gap-y-1 [&_input]:rounded-lg flex-1">
                        <label className="font-semibold w-full" htmlFor="examDate">Exam date</label>
                        <input className="exam-date basis-full xl:basis-auto" type="date" name="examDate" disabled defaultValue={formatDateOnlyValue(event?.extendedProps?.examDate as string | Date | null | undefined)} />
                    </div>
                </div>
                <div className="flex flex-row justify-between gap-x-12 flex-wrap gap-y-0 md:flex-nowrap sm:gap-y-2 items-start">
                    <div className="date-input flex flex-row flex-wrap gap-4 gap-y-1 [&_input]:rounded-sm flex-1">
                        <label className="font-semibold w-full" htmlFor="copiesNumber">Number of copies</label>
                        <input className="copies-number basis-full xl:basis-auto" type="text" name="copiesNumber" disabled defaultValue={event?.extendedProps?.copiesNumber} />
                    </div>
                    <div className="date-input flex flex-row flex-wrap gap-4 gap-y-1 [&_input]:rounded-lg flex-1">
                        <label className="font-semibold w-full" htmlFor="pagesPerCopy">Pages per copy</label>
                        <input className="pages-copy basis-full xl:basis-auto" type="text" name="pagesPerCopy" disabled defaultValue={event?.extendedProps?.pagesPerCopy} />
                    </div>
                </div>
                <div className="flex flex-row justify-between gap-x-12 flex-wrap gap-y-0 md:flex-nowrap sm:gap-y-2 items-start">
                    <div className="date-input flex flex-row flex-wrap gap-4 gap-y-1 [&_input]:rounded-sm flex-1">
                        <label className="font-semibold w-full" htmlFor="paperFormat">Paper format</label>
                        <input className="paper-format basis-full xl:basis-auto" type="text" name="paperFormat" disabled defaultValue={event?.extendedProps?.paperFormat} />
                    </div>
                    <div className="date-input flex flex-row flex-wrap gap-4 gap-y-1 [&_input]:rounded-lg flex-1">
                        <label className="font-semibold w-full" htmlFor="paperColor">Paper color</label>
                        <input className="paper-color basis-full xl:basis-auto" type="text" name="paperColor" disabled defaultValue={event?.extendedProps?.paperColor} />
                    </div>
                </div>
                <div className="flex flex-row justify-between gap-x-12 flex-wrap gap-y-0 md:flex-nowrap sm:gap-y-2 items-start">
                    <div className="date-input flex flex-row flex-wrap gap-4 gap-y-1 [&_input]:rounded-sm flex-1">
                        <label className="font-semibold w-full" htmlFor="needScan">Needs to be scanned</label>
                        <input className="need-scan basis-full xl:basis-auto" type="text" name="needScan" disabled defaultValue={event?.extendedProps?.needScan ? 'Yes' : 'No'} />
                    </div>
                    <div className="date-input flex flex-row flex-wrap gap-4 gap-y-1 [&_input]:rounded-lg flex-1">
                        <label className="font-semibold w-full" htmlFor="contact">Contact</label>
                        <input className="contact basis-full xl:basis-auto w-full" type="text" name="contact" disabled defaultValue={event?.extendedProps?.contact} />
                    </div>
                </div>
                <div className="flex flex-row justify-between gap-x-12 flex-wrap gap-y-0 md:flex-nowrap sm:gap-y-2 items-start">
                    <div className="date-input flex flex-row flex-wrap gap-4 gap-y-1 [&_input]:rounded-sm flex-1">
                        <label className="font-semibold w-full" htmlFor="authorizedPersons">Authorized persons</label>
                        <ul className={`${event?.extendedProps?.authorizedPersons.length > 0 && 'ml-6'} list-disc`}>
                            {event?.extendedProps?.authorizedPersons.length > 0 ? 
                                event?.extendedProps?.authorizedPersons.map((user:{ email: string, id: string, name: string }) => (
                                    <li key={user.id}>{user.email}</li>
                                )) : 'None'
                            }
                        </ul>
                    </div>
                    <div className="date-input flex flex-row flex-wrap gap-4 gap-y-1 [&_input]:rounded-lg flex-1">
                        <label className="font-semibold w-full" htmlFor="files">Files</label>
                        <ul className={`${event?.extendedProps?.files.length > 0 && 'ml-6'} list-disc`}>
                            {event?.extendedProps?.files.length > 0 ? 
                                event?.extendedProps?.files.map((file:string) => (
                                    <li key={file}>{file}</li>
                                )) : 'None'
                            }
                        </ul>
                    </div>
                </div>
                <div className="flex flex-row justify-between gap-x-12 flex-wrap gap-y-0 md:flex-nowrap sm:gap-y-2 items-start">
                    <div className="date-input flex flex-row flex-wrap gap-4 gap-y-1 [&_input]:rounded-sm flex-1">
                        <label className="font-semibold w-full" htmlFor="desiredDate">Desired delivery date</label>
                        <input className="exam-date basis-full xl:basis-auto" type="date" name="desiredDate" disabled defaultValue={formatDateOnlyValue(event?.extendedProps?.desiredDate as string | Date | null | undefined)} />
                    </div>
                </div>
            </div>
            <div>
                <label className="font-semibold w-full" htmlFor="description">Description</label>
                <p className="description">{event?.extendedProps?.description}</p>
            </div>
            <textarea className="remarks resize-none rounded-lg border border-gray-300 p-3" rows={6} name="remarks" id="remarks" placeholder="Add any remarks"
                value={remark || ""}
                onChange={(e) => setRemark(e.target.value)}
            >
            </textarea>
            <label className="font-semibold w-full" htmlFor="description">Repro&apos;s remark</label>
            <textarea className="remarks resize-none rounded-lg border border-gray-300 p-3" rows={6} name="remarks" id="remarks" placeholder="Add any remarks"
                value={reproRemark || ""}
                onChange={(e) => setReproRemark(e.target.value)}
            >
            </textarea>
            <div id="modal-toolbar" className="flex flex-row justify-between flex-wrap xxl:flex-nowrap gap-y-2">
                <div className="flex flex-row gap-4 flex-wrap md:flex-nowrap gap-y-2 ">
                    {/* ToDo : use a component */}
                    {/* Displays a dropdown if user has admin privileges */}
                    {user.isAdmin && (
                        <select name="from" className="dropdown btn btn-secondary" id="from"
                            value={selectStatus}
                            onChange={(e) => setSelectStatus(e.target.value)}
                        >
                            {examStatus && examStatus.map((status) => (
                                <option key={status.value} value={status.value} className={status.color}>{status.label}</option>
                            ))}
                        </select>
                    )}
                    <PrintButton ref={modalRef} />
                    {/* Open the folder where the exam files are stored */}
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