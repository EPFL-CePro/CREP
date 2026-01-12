"use client";
// This form allows users to register their exams into the system.
import { useForm, SubmitHandler } from "react-hook-form"
import { getAllCourses, getAllExamsBetweenDates, getAllExamsForDate, insertExam } from "@/app/lib/database";
import { useEffect, useState } from "react";
import ReactSelect from "./ReactSelect";
import { fetchMultiplePersonsBySciper, fetchPersonBySciper } from "@/app/lib/api";
import { sendMail } from "@/app/lib/mail";
import { User } from "next-auth";
import { RedAsterisk } from "../RedAsterisk";
import { RegisterModal } from "./RegisterModal";

type SelectOption = { value: string | number; label: string };

type Inputs = {
    examDate: string
    desiredDate: string
    nbStudents: number
    nbPages: number
    contact: string
    authorizedPersons: string
    paperFormat: string
    paperColor: string
    course: SelectOption | null
    remark?: string
    name: string
    needScan: boolean
    files?: FileList
    financialCenter: string
}

interface RegisterProps {
    user: AppUser
}

interface AppUser extends User {
    isAdmin?: boolean;
    sciper: string;
}

interface Exam {
    id: number;
    exam_code: string;
    exam_date: Date;
    exam_name: string;
    exam_pages: number;
    exam_students: number;
    print_date: Date;
    remark: string;
    repro_remark: string;
    status: string;
    paper_format: string;
    paper_color: string;
    contact: string;
    authorized_persons: string;
    registered_by: string;
    need_scan: boolean;
    financial_center: string;
}

interface Gap {
    between: [Exam, Exam]; // before exam, end exam
    gapMinutes: number; // gap between the two exams in minutes
};

function businessDaysBetween(startDate: string, endDate: string) {
    let start = new Date(startDate);
    let end = new Date(endDate);
    let count = 0;

    if (start > end) {
        [start, end] = [end, start];
    }

    while (start < end) {
        const day = start.getDay();
        // 0 = sunday, 6 = saturday
        if (day !== 0 && day !== 6) {
            count++;
        }
        start.setDate(start.getDate() + 1);
    }

    return count;
}


export default function App({ user }: RegisterProps) {
    const { control, register, handleSubmit, formState: { errors }, setError, clearErrors, reset, setValue } = useForm<Inputs>()
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState("Registration Successful");
    const [modalMessage, setModalMessage] = useState("Your exam has been successfully registered.");
    const [modalResolver, setModalResolver] = useState<((confirmed: boolean) => void) | null>(null);
    const [isConfirmModal, setIsConfirmModal] = useState(false);

    const openModal = (title: string, message: string) => {
        setIsConfirmModal(false);
        setModalResolver(null);
        setModalTitle(title);
        setModalMessage(message);
        setModalOpen(true);
        const dialog = document.getElementById("register-modal") as HTMLDialogElement | null;
        dialog?.showModal?.();
    };
    const openConfirmationModal = (title: string, message: string) => new Promise<boolean>((resolve) => {
        setIsConfirmModal(true);
        setModalResolver(() => resolve);
        setModalTitle(title);
        setModalMessage(message);
        setModalOpen(true);
        const dialog = document.getElementById("register-modal") as HTMLDialogElement | null;
        dialog?.showModal?.();
    });
    const handleModalResult = (confirmed: boolean) => {
        if (modalResolver) {
            modalResolver(confirmed);
            setModalResolver(null);
        }
        setModalOpen(false);
    };

    const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;

        const newFiles = Array.from(e.target.files);

        setSelectedFiles((prev) => {
            const merged = [...prev];

            // optional: avoid duplicates (same name + size + lastModified)
            newFiles.forEach((file) => {
                const alreadyThere = merged.some(
                    (f) =>
                        f.name === file.name &&
                        f.size === file.size &&
                        f.lastModified === file.lastModified
                );
                if (!alreadyThere) {
                    merged.push(file);
                }
            });

            return merged;
        });

        clearErrors("files");

        // allow selecting the same file again later
        e.target.value = "";
    };

    const handleRemoveFile = (index: number) => {
        setSelectedFiles(prev => {
            const updated = prev.filter((_, i) => i !== index);
            if (updated.length === 0) {
                setError("files", {
                    type: "validate",
                    message: "Please upload at least one file",
                });
            }
            return updated;
        });
    };

    const onSubmit: SubmitHandler<Inputs> = async (data) => {
        // validate that desiredDate is not later than examDate
        const { examDate, desiredDate } = data;

        if (!data.course) {
            openModal("Course Selection Error", "Please select a course.");
            return;
        }
        if (examDate && desiredDate) {
            const exam = new Date(examDate);
            const desired = new Date(desiredDate);
            if (desired > exam) {
                setError("desiredDate", { type: "validate", message: "Desired delivery date cannot be later than the exam date." });
                return;
            }
            else if (businessDaysBetween(desiredDate, examDate) < 8) {
                const confirmed = await openConfirmationModal('Date Validation Warning', `There must be at least 8 business days between the desired delivery date and the exam date.\n\nDo you still want to submit your exam?`);
                if (!confirmed) {
                    return;
                }
            }
            else {
                // clear any previous date error
                clearErrors("desiredDate");
            }
        }

        // check uploaded files not empty
        if (selectedFiles.length === 0) {
            setError("files", {
                type: "validate",
                message: "Please upload at least one file",
            });
            openModal("File Upload Error", "You need to upload at least one file before submitting the form.");
            return;
        }

        try {
            let authorizedPersons: { id: string, email: string, name: string }[];

            if (data.authorizedPersons) {
                const pers = data.authorizedPersons as unknown as Array<string>;
                const authorizedPersonsList = await fetchMultiplePersonsBySciper(pers.join(','));
                authorizedPersons = authorizedPersonsList.map(user => {
                    return {
                        id: user?.id,
                        email: user?.email,
                        name: user ? `${user.firstname} ${user.lastname}` : '',
                    };
                })
            } else {
                authorizedPersons = [];
            }


            const contact = await fetchPersonBySciper(data.contact);

            const exam_name = data.course.value.toString();
            const exam_code = data.course.label.split(' - ')[0] || '';
            const contact_name = contact?.lastname;

            function getPrintingDurationInMinutes(nbStudents: number): number {
                return Math.ceil((20 * nbStudents + 3600) / 60 / 60) * 60;
            }

            function getEndDateOfPrinting(exam: Exam): Date {
                return new Date(exam.print_date.getTime() + getPrintingDurationInMinutes(exam.exam_students) * 60000);
            }

            function formatDateForDb(date: Date): string {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const hours = String(date.getHours()).padStart(2, '0');
                const minutes = String(date.getMinutes()).padStart(2, '0');
                const seconds = String(date.getSeconds()).padStart(2, '0');

                return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
            }


            function computeGapsBetweenExams(exams: Exam[]): Gap[] {
                const sorted = [...exams].sort(
                    (a, b) => a.print_date.getTime() - b.print_date.getTime()
                );

                const gaps: Gap[] = [];

                for (let i = 0; i < sorted.length - 1; i++) {
                    const current = sorted[i];
                    const next = sorted[i + 1];

                    const currentEnd = getEndDateOfPrinting(current);

                    const nextStart = next.print_date;

                    const gapMs = nextStart.getTime() - currentEnd.getTime();
                    const gapMinutes = gapMs / (1000 * 60);

                    gaps.push({
                        between: [current, next],
                        gapMinutes,
                    });
                }

                return gaps;
            }

            let printingDate;

            const desiredDate = new Date(data.desiredDate);
            const today = new Date();

            // Making sure hours is not a problem
            desiredDate.setHours(0,0,0,0);
            today.setHours(0,0,0,0);

            const daysArray = [];
            const currentDate = new Date(today); // The date that will be manipulated. This will change on every iteration.

            /* `<` so that we stop one day before the desired delivery date.
            Ex : If desired date is 24, we stop at 23. */
            while (currentDate < desiredDate) {
                const day = currentDate.getDay(); // 0 = sunday, 6 = saturday

                if (day !== 0 && day !== 6) {
                    // We push the date only if it's not a sunday or a saturday
                    daysArray.push(new Date(currentDate));
                }

                currentDate.setDate(currentDate.getDate() + 1);
            }

            const allExamsFromNowToDesired = await getAllExamsBetweenDates(new Date(), new Date(data.desiredDate))
            if (!allExamsFromNowToDesired) {
                const firstDayDate = daysArray[0];
                firstDayDate.setHours(7, 0, 0, 0);
                printingDate = formatDateForDb(firstDayDate);
            } else {
                const necessaryPrintingDurationInMinutes = getPrintingDurationInMinutes(data.nbStudents);

                for (const date of daysArray.reverse()) {
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');

                    const allExamsForDate = await getAllExamsForDate(`${year}-${month}-${day}`);

                    if (allExamsForDate.length == 0) {
                        date.setHours(7, 0, 0, 0);
                        printingDate = formatDateForDb(date);
                        break;
                    } else if (allExamsForDate.length == 1) {
                        // This is necessary because of the 1 hour delay between the database and JavaScript
                        allExamsForDate[0].print_date.setHours(allExamsForDate[0].print_date.getHours() - 1);

                        const endPrintExam = getEndDateOfPrinting(allExamsForDate[0]);
                        const endPrintOfWantedExam = new Date(endPrintExam.getTime() + necessaryPrintingDurationInMinutes * 60000);

                        if (endPrintOfWantedExam.getHours() < 22) {
                            printingDate = formatDateForDb(endPrintExam);
                            break;
                        }
                    } else {
                        const gaps = computeGapsBetweenExams(allExamsForDate as Exam[]);
                        const enoughGap = gaps.find(gap => gap.gapMinutes >= necessaryPrintingDurationInMinutes);

                        if (enoughGap) {
                            // This is necessary because of the 1 hour delay between the database and JavaScript
                            enoughGap.between[0].print_date.setHours(enoughGap.between[0].print_date.getHours() - 1);

                            const endPrintFirstExam = getEndDateOfPrinting(enoughGap.between[0]);
                            printingDate = formatDateForDb(endPrintFirstExam);
                            break;
                        } else {
                            const latestGapOfDay = gaps[gaps.length - 1];
                            const latestExam = latestGapOfDay.between[1];
                            const latestExamPrintingDurationInMinutes = getPrintingDurationInMinutes(latestExam.exam_students);

                            const latestExamPrintDate = latestExam.print_date;
                            latestExamPrintDate.setHours(latestExamPrintDate.getHours() - 1);

                            const endPrintingLatestExam = new Date(latestExamPrintDate.getTime() + latestExamPrintingDurationInMinutes * 60000);
                            const endPrintingWantedExam = new Date(endPrintingLatestExam.getTime() + getPrintingDurationInMinutes(data.nbStudents) * 60000);

                            const printingLimit = new Date(endPrintingLatestExam);
                            printingLimit.setHours(22, 0, 0, 0);
                            if (endPrintingWantedExam <= printingLimit) {
                                printingDate = formatDateForDb(endPrintingLatestExam);
                                break;
                            }
                        }
                    }
                }
            }

            const insertedExam = await insertExam(
                {
                    exam_name: exam_name,
                    exam_code: exam_code,
                    exam_date: data.examDate,
                    print_date: printingDate,
                    exam_students: data.nbStudents,
                    exam_pages: data.nbPages,
                    contact: contact?.firstname + ' ' + contact?.lastname + ' (' + contact?.email + ')',
                    // contact: data.contact, //if we want the id only
                    authorized_persons: JSON.stringify(authorizedPersons),
                    paper_format: data.paperFormat,
                    paper_color: data.paperColor,
                    remark: data.remark,
                    repro_remark: null,
                    status: 'registered',
                    registered_by: user.email || '',
                    need_scan: data.needScan,
                    financial_center: data.financialCenter,
                }
            )

            if (typeof (insertedExam) !== 'number') {
                openModal("Registration Error", "An error occurred while registering your exam. Please try again later.");
                return;
            }

            // send files to backend API
            const folder_name = exam_code + '_' + contact_name + '_' + data.desiredDate;
            const formData = new FormData();
            formData.append("folder_name", folder_name);

            selectedFiles.forEach((file) => {
                formData.append("files", file);
            });

            const res = await fetch("/api/upload-exam-files", {
                method: "POST",
                body: formData,
            });
            if (!res.ok) {
                console.error(await res.text());
                openModal("File Upload Error", "An error occurred while uploading exam files. Please try again.");
                return;
            }
            const daysBetweenExamAndDesired = businessDaysBetween(data.desiredDate, data.examDate)
            const lessThanEightDays = daysBetweenExamAndDesired < 8;
            if (process.env.NODE_ENV !== "development") {
                await sendMail(
                    user.email || '',
                    `${lessThanEightDays ? 'REQUIRES ATTENTION - ' : ''} CePro - Exam printing service subscription confirmation`,
                    `
Hello,
Your subscription to our exam printing service has been successfully registered:

${lessThanEightDays ? `⚠️ : We would like to inform you that you choose a desired delivery date that is inferior to 8 business days before the exam.
The CePro team will get in touch with you shortly to discuss about your situation.
Next time, please register to the printing service earlier to make sur that the printing team has the right amount of time to print your exam correctly.
` : ''}

- Course: ${data.course?.label}
- Exam date: ${data.examDate}
- Desired delivery date: ${data.desiredDate}
- Contact: ${contact?.firstname} ${contact?.lastname} (${contact?.email})
- Authorized persons: ${authorizedPersons.map(user => `${user.email}`).join(', ')}
${data.remark && `- Additional remarks: ${data.remark}`}`,
                    'cepro-exams@epfl.ch'
                );
            }
            openModal("Registration Successful", 'Your Exam ' + exam_code + ' has been registered and a confirmation has been sent to your email.');
            reset();
        } catch (err) {
            console.error(err);
            openModal("Unexpected Error", 'An unexpected error occurred while registering the exam.');
        }
    }
    const [courses, setCourses] = useState<Array<{ id: number; name: string, code: string, teacher: string }>>([]);

    useEffect(() => {
        (async function () {
            const courses = await getAllCourses() as Array<{
                id: number;
                name: string;
                code: string;
                teachers: string;
            }>;

            const filteredCoursesData = courses.map(({ id, code, name, teachers }) => ({
                id,
                code,
                name,
                teacher: teachers,
            }));
            setCourses(filteredCoursesData);
        })();
    }, []);

    return (
        /* "handleSubmit" will validate your inputs before invoking "onSubmit" */
        <div className="flex flex-col items-center m-24">
            <dialog id="register-modal" className="modal fixed top-3/8 left-1/8 w-3/4 md:left-1/4 md:w-2/4 rounded-xl flex items-center justify-center z-50 drop-shadow-2xl backdrop:backdrop-blur-xs opacity-98" onClose={() => {
                setModalOpen(false);
                if (modalResolver) {
                    modalResolver(false);
                    setModalResolver(null);
                }
            }}>
                {modalOpen && (
                    <RegisterModal setModalOpen={setModalOpen} title={modalTitle} message={modalMessage} isConfirm={isConfirmModal} onResult={handleModalResult} />
                )}
            </dialog >
            <h1 className="text-3xl font-semibold" >Exam Printing Order</h1>
            <form className="w-2/4 [&>label]:text-lg [&>*]:accent-red-500 p-4 rounded-md flex flex-col gap-3 mt-2 [&>select]:mb-2 [&>input,&>*>*>input]:mb-2 [&>input,&>textarea,&>*>*>input]:border [&>input,&>textarea,&>*>*>input]:border-slate-300 [&>input,&>textarea,&>*>*>input]:rounded-md [&>input,&>*>*>input]:p-2 [&>textarea]:p-2 "
                onSubmit={handleSubmit(onSubmit)}
                encType="multipart/form-data">
                {/* register your input into the hook by invoking the "register" function */}
                <label>Select your exam <RedAsterisk /></label>
                <ReactSelect control={control} label={"course"} name={"course"} isMultiChoice={false} containCourses={true} instanceId={1} />
                <div className="flex flex-row justify-between w-full gap-4 [&>*>label]:text-lg">
                    <div className="flex flex-col w-2/4 gap-3 ">
                        <label>Exam Date <RedAsterisk /></label>
                        <input
                            className="text-right"
                            type="date"
                            {...register("examDate", {
                                required: true,
                                onChange: (e) => {
                                    const exam = (e.target as HTMLInputElement).value;
                                    const desiredInput = document.querySelector('input[name="desiredDate"]') as HTMLInputElement | null;
                                    if (!exam || !desiredInput || desiredInput.value) return; // only set once when desiredDate is empty
                                    const d = new Date(exam);

                                    for (let i = 0; i < 8; i++) {
                                        // If it's sunday go back 2 days
                                        if (d.getDay() === 0) {
                                            d.setDate(d.getDate() - 2);
                                        }
                                        // If it's monday go back 3 days
                                        else if (d.getDay() === 1) {
                                            d.setDate(d.getDate() - 3);
                                        }
                                        // Else just go back one day
                                        else {
                                            d.setDate(d.getDate() - 1);
                                        }
                                    }
                                    const yyyy = d.getFullYear();
                                    const mm = String(d.getMonth() + 1).padStart(2, "0");
                                    const dd = String(d.getDate()).padStart(2, "0");
                                    const formatted = `${yyyy}-${mm}-${dd}`;
                                    setValue("desiredDate", formatted, { shouldDirty: true, shouldValidate: true });
                                },
                            })}
                        />
                    </div>
                    <div className="flex flex-col w-2/4 gap-3">
                        <label>Desired delivery date <RedAsterisk /></label>
                        <input className="text-right" type="date" {...register("desiredDate", { required: false })} />
                        {errors.desiredDate && <span className="text-red-600">{errors.desiredDate.message}</span>}
                    </div>
                </div>
                <div className="flex flex-row justify-between w-full gap-4 [&>*>label]:text-lg">
                    <div className="flex flex-col w-2/4 gap-3">
                        <label>Number of copies <RedAsterisk /></label>
                        <input className="text-right" type="number" min={1} {...register("nbStudents", { required: true, min: 1 })} />
                    </div>
                    <div className="flex flex-col w-2/4 gap-3">
                        <label>Pages per copy <RedAsterisk /></label>
                        <input className="text-right" type="number" min={1} {...register("nbPages", { required: true, min: 1 })} />
                    </div>
                </div>
                <label>Paper Format <RedAsterisk /></label>
                <div className="flex items-end align-middle flex-row justify-between [&>div]:flex [&>div]:flex-col [&>div]:gap-2">
                    <div className="[&>p]:italic">
                        <p>Without folding</p>
                        <p>With two staples in the fold</p>
                    </div>
                    <div className="[&>div]:flex [&>div]:justify-end [&>div]:gap-3">
                        <div onClick={(e) => { const input = e.currentTarget.querySelector('input') as HTMLInputElement | null; if (input) { input.click(); } }}>
                            <input type="radio" value="A4" {...register("paperFormat", { required: true })} /><label>A4</label>
                        </div>
                        <div onClick={(e) => { const input = e.currentTarget.querySelector('input') as HTMLInputElement | null; if (input) { input.click(); } }}>
                            <input type="radio" defaultChecked value="A3" {...register("paperFormat", { required: true })} /><label>A3</label>
                        </div>
                    </div>
                </div>
                <label>Paper color <RedAsterisk /></label>
                <div className="flex items-end align-middle flex-row justify-between [&>div]:flex [&>div]:flex-col [&>div]:gap-2">
                    <div className="[&>p]:italic">
                        <p>In black and white</p>
                        <p>With colors, at your expense</p>
                    </div>
                    <div className="[&>div]:flex [&>div]:justify-end [&>div]:gap-3">
                        <div onClick={(e) => { const input = e.currentTarget.querySelector('input') as HTMLInputElement | null; if (input) { input.click(); } }}>
                            <input type="radio" defaultChecked value="greyscale" {...register("paperColor", { required: true })} /><label>Greyscale</label>
                        </div>
                        <div onClick={(e) => { const input = e.currentTarget.querySelector('input') as HTMLInputElement | null; if (input) { input.click(); } }}>
                            <input type="radio" value="color" {...register("paperColor", { required: true })} /><label>Color</label>
                        </div>
                    </div>
                </div>
                <div className="flex gap-3 text-lg">
                    <label htmlFor="needScan">Needs to be scanned <RedAsterisk /></label>
                    <input id="needScan" type="checkbox" defaultChecked {...register("needScan")} />
                </div>
                <label>Financial Center <RedAsterisk /></label>
                <input type="text" placeholder={"FCXXXX"} maxLength={8} {...register("financialCenter", { required: true })} />
                {errors.financialCenter && <span className="text-red-600">This field is required</span>}
                <label>Contact <RedAsterisk /></label>
                <ReactSelect control={control} label={"contact"} name={"contact"} isMultiChoice={false} instanceId={2} user={user} />
                <label>Authorized persons</label>
                <ReactSelect control={control} label={"authorized persons"} name={"authorizedPersons"} isMultiChoice={true} instanceId={3} />
                <label>Additional remarks</label>
                <textarea {...register("remark")} placeholder="Additional remarks (optional)" />

                <label>Attach exam file(s) to print <RedAsterisk /></label>
                <div className="relative w-full">
                    <div className="border border-slate-300 rounded-md px-4 py-2 bg-white text-left">
                        Select file...
                    </div>
                    <input type="file" multiple onChange={handleFilesChange}
                        className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>

                {/* Preview / list of selected files */}
                <div className="mt-2 border border-slate-300 rounded-md p-2 bg-background"
                    style={{ "--background": "#f0f0f0" } as React.CSSProperties}>
                    {selectedFiles.length === 0 && (
                        <span className="text-sm text-slate-500">
                            No files selected yet.
                        </span>
                    )}

                    {selectedFiles.map((file, index) => (
                        <div key={file.name + index} className="flex items-center justify-between text-sm py-1">
                            <div>
                                <span className="font-medium">{file.name}</span>{" "}
                                <span className="text-slate-500">
                                    ({(file.size / 1024).toFixed(1)} KB)
                                </span>
                            </div>
                            <button type="button" className="text-red-600 text-xs underline"
                                onClick={() => handleRemoveFile(index)} >
                                Remove
                            </button>
                        </div>
                    ))}
                </div>

                {errors.files && (
                    <span className="text-red-600">{errors.files.message}</span>
                )}

                <input className="btn btn-primary hover:cursor-pointer" type="submit" value="Submit exam registration" />
            </form >
        </div >

    )
}