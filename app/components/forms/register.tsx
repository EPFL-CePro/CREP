"use client";
// This form allows users to register their exams into the system.
import { useForm, SubmitHandler } from "react-hook-form"
import { getAllCourses, insertExam } from "@/app/lib/database";
import { useEffect, useState } from "react";
import ReactSelect from "./ReactSelect";
import { fetchCourses, fetchMultiplePersonsBySciper, fetchPersonBySciper } from "@/app/lib/api";
import { sendMail } from "@/app/lib/mail";
import { User } from "next-auth";
import { RedAsterisk } from "../RedAsterisk";

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
}

interface RegisterProps {
    user: AppUser
}

interface AppUser extends User {
    isAdmin?: boolean;
}

function businessDaysBetween(startDate:string, endDate:string) {
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

async function fetchOasis() {
    const list = (await fetchCourses());
    // const found = list.find((l) => Number(l.value) === Number(id));
    return list ?? null;
}


export default function App({ user }: RegisterProps) {
    const { control, register, handleSubmit, formState: { errors }, setError, clearErrors, reset, setValue } = useForm<Inputs>()
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

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
        if (examDate && desiredDate) {
            const exam = new Date(examDate);
            const desired = new Date(desiredDate);
            if (desired > exam) {
                setError("desiredDate", { type: "validate", message: "Desired delivery date cannot be later than the exam date." });
                return;
            } else {
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
            return;
        }

        try {
            if (!data.course) {
                alert('Please select a course.');
                return;
            }

            let authorizedPersons:{ id: string, email: string, name: string }[];

            if(data.authorizedPersons) {
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

            const exam_name =  data.course.value.toString();
            const exam_code = data.course.label.split(' - ')[0] || '';
            const contact_name = contact?.lastname;
            const insertedExam = await insertExam(
                {
                    exam_name: exam_name,
                    exam_code: exam_code,
                    exam_date: data.examDate,
                    print_date: data.desiredDate,
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
                    need_scan: data.needScan
                }
            )

            if(typeof(insertedExam) !== 'number') {
                alert("Error while registering exam.");
                return;
            }

            // send files to backend API
            const folder_name = exam_code + '_' + contact_name + '_' + data.desiredDate;
            const formData = new FormData();
            formData.append("folder_name",folder_name);

            selectedFiles.forEach((file) => {
                formData.append("files", file);
            });

            const res = await fetch("/api/upload-exam-files", {
                method: "POST",
                body: formData,
            });
            if(!res.ok){
                console.error(await res.text());
                alert("Error while uploading exam files.");
                return;
            }
            const daysBetweenExamAndDesired = businessDaysBetween(data.desiredDate, data.examDate)

            await sendMail(
                user.email || '',
                `${daysBetweenExamAndDesired < 8 && 'REQUIRES ATTENTION - '} CePro - Exam printing service subscription confirmation`,
                    `
Hello,
Your subscription to our exam printing service has been successfully registered:

${daysBetweenExamAndDesired < 8 && `⚠️ : We would like to inform you that you choose a desired delivery date that is inferior to 8 business days before the exam.
The CePro team will get in touch with you shortly to discuss about your situation.
Next time, please register to the printing service earlier to make sur that the printing team has the right amount of time to print your exam correctly.
`}

- Course: ${courses.find(c => c.id === data.course?.value)?.code}
- Exam date: ${data.examDate}
- Desired delivery date: ${data.desiredDate}
- Contact: ${contact?.firstname} ${contact?.lastname} (${contact?.email})
- Authorized persons: ${authorizedPersons.map(user => `${user.email}`).join(', ')}
${data.remark && `- Additional remarks: ${data.remark}`}`,
                    'cepro-exams@epfl.ch'
                );
                alert('Exam registered (id: ' + insertedExam + ')');
            reset();
        } catch (err) {
            console.error(err);
            alert('An unexpected error occurred while registering the exam.');
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

    // fetch oasis courses and store them in local state
    const [oasisCourses, setOasisCourses] = useState<SelectOption[]>([]);
    useEffect(() => {
        (async () => {
            const list = await fetchOasis();
            setOasisCourses(list ?? []);
        })();
    }, []);

    return (
        /* "handleSubmit" will validate your inputs before invoking "onSubmit" */
        <div className="flex flex-col items-center m-24">
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
                                    d.setDate(d.getDate() - 3);
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
                    <label htmlFor="needScan">Needs to be scanned</label>
                    <input id="needScan" type="checkbox" defaultChecked {...register("needScan")}/>
                </div>
                <label>Contact <RedAsterisk /></label>
                <ReactSelect control={control} label={"contact"} name={"contact"} isMultiChoice={false} instanceId={2} />
                <label>Authorized persons</label>
                <ReactSelect control={control} label={"authorized persons"} name={"authorizedPersons"} isMultiChoice={true} instanceId={3} />
                <label>Additional remarks</label>
                <textarea {...register("remark")} placeholder="Additional remarks (optional)" />

                <label>Attach exam file(s) to print:</label>
                <div className="relative w-full">
                  <div className="border border-slate-300 rounded-md px-4 py-2 bg-white text-left">
                    Select file...
                  </div>
                <input type="file" multiple onChange={handleFilesChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"/>
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