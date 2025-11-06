"use client";
// This form allows users to register their exams into the system.
import { useForm, SubmitHandler, Controller } from "react-hook-form"
import { getAllCourses, getAllUsers } from "@/app/lib/database";
import Select from "react-select"
import { QueryResult } from "mysql2";
import { useEffect, useState } from "react";
import ReactSelect from "./ReactSelect";

type SelectOption = { value: number; label: string };

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
}


export default function App() {
    const { control, register, handleSubmit, formState: { errors }, setError, clearErrors } = useForm<Inputs>()
    const onSubmit: SubmitHandler<Inputs> = (data) => {
        // validate that desiredDate is not later than examDate
        const { examDate, desiredDate } = data;
        if (examDate && desiredDate) {
            const exam = new Date(examDate);
            const desired = new Date(desiredDate);
            if (desired > exam) {
                setError("desiredDate", { type: "validate", message: "Desired print date cannot be later than the exam date." });
                return;
            } else {
                // clear any previous date error
                clearErrors("desiredDate");
            }
        }

        console.log(data);
    }
    const [courses, setCourses] = useState<Array<{ id: number; name: string, code: string, teacher: string }>>([]);
    const [users, setUsers] = useState<Array<{ id: number; lastname: string; firstname: string; sciper: string; email: string }>>([]);

    useEffect(() => {
        (async function () {
            const courses = await getAllCourses() as Array<QueryResult>;
            const users = await getAllUsers() as Array<QueryResult>;

            const filteredCoursesData = courses.map((c: any) => ({
                id: c.id,
                code: c.code,
                name: c.name,
                teacher: c.teachers,
            }));
            const filteredUsersData = users.map((u: any) => ({
                id: u.id,
                lastname: u.lastname,
                firstname: u.firstname,
                sciper: u.sciper,
                email: u.email,
            }));
            setUsers(filteredUsersData);
            setCourses(filteredCoursesData);
        })();
    }, []);
    const usersData = users.map((user) => ({ value: user.id, label: `${user.sciper}: ${user.firstname} ${user.lastname} (${user.email})` }));

    return (
        /* "handleSubmit" will validate your inputs before invoking "onSubmit" */
        <div className="flex flex-col items-center m-24">
            <h1 className="text-3xl font-semibold" >Register an Exam</h1>
            <form className="w-2/4 [&>label]:text-lg [&>*]:accent-red-500 p-4 rounded-md flex flex-col gap-3 mt-2 [&>select]:mb-2 [&>input,&>*>*>input]:mb-2 [&>input,&>textarea,&>*>*>input]:border [&>input,&>textarea,&>*>*>input]:border-slate-300 [&>input,&>textarea,&>*>*>input]:rounded-md [&>input,&>*>*>input]:p-2 [&>textarea]:p-2 "
                onSubmit={handleSubmit(onSubmit)}>
                {/* register your input into the hook by invoking the "register" function */}
                <label>Select your exam:</label>
                <Controller
                    name="course"
                    control={control}
                    render={({ field }) => (
                        <Select<SelectOption>
                            {...field}
                            options={courses.map((course) => ({ value: course.id, label: `${course.code} - ${course.name} ${course.teacher ? ''.concat("(", course.teacher.split("|").map((t: string) => t.split(";")[2]).join(", "), ")") : ''}` }))}
                            theme={(theme) => ({
                                ...theme,
                                borderRadius: 9,
                                colors: {
                                    ...theme.colors,
                                    primary25: 'rgba(239, 68, 68, 0.1)',
                                    primary: 'rgba(239, 68, 68, 1)',
                                },
                                fontWeight: 'bolder',
                                fontSize: '24px',
                            })}
                            styles={{
                                control: (styles) => ({ ...styles, backgroundColor: 'white', ":focus-within": { borderColor: 'red', boxShadow: '0 0 0 1px red', }, padding: '4px' }),
                                multiValueLabel: (styles) => ({ ...styles, fontWeight: '500' }),
                                option: (styles, { isSelected }) => {
                                    return {
                                        ...styles,
                                        fontWeight: isSelected ? '600' : 'normal',
                                    };
                                }
                            }}
                        />
                    )}
                />
                <div className="flex flex-row justify-between w-full gap-4 [&>*>label]:text-lg">
                    <div className="flex flex-col w-2/4 gap-3 ">
                        <label>Exam Date:</label>
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
                                    desiredInput.value = `${yyyy}-${mm}-${dd}`;
                                    // notify react-hook-form about the programmatic change
                                    desiredInput.dispatchEvent(new Event("input", { bubbles: true }));
                                },
                            })}
                        />
                    </div>
                    <div className="flex flex-col w-2/4 gap-3">
                        <label>Desired print date:</label>
                        <input className="text-right" type="date" {...register("desiredDate", { required: false })} />
                        {errors.desiredDate && <span className="text-red-600">{errors.desiredDate.message}</span>}
                    </div>
                </div>
                <div className="flex flex-row justify-between w-full gap-4 [&>*>label]:text-lg">
                    <div className="flex flex-col w-2/4 gap-3">
                        <label>Number of students:</label>
                        <input className="text-right" type="number" min={1} {...register("nbStudents", { required: true, min: 1 })} />
                    </div>
                    <div className="flex flex-col w-2/4 gap-3">
                        <label>Number of pages:</label>
                        <input className="text-right" type="number" min={1} {...register("nbPages", { required: true, min: 1 })} />
                    </div>
                </div>
                <label>Paper Format:</label>
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
                <label>Paper color:</label>
                <div className="flex items-end align-middle flex-row justify-between [&>div]:flex [&>div]:flex-col [&>div]:gap-2">
                    <div className="[&>p]:italic">
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
                <label>Contact:</label>
                <ReactSelect control={control} data={usersData} value={""} label={"contact"} baseArray={users} name={"contact"} isMultiChoice={false} />
                <label>Authorized persons:</label>
                <ReactSelect control={control} data={usersData} value={""} label={"authorized persons"} baseArray={users} name={"authorizedPersons"} isMultiChoice={true} />
                <label>Additional remarks:</label>
                <textarea {...register("remark")} placeholder="Additional remarks (optional)" />
                <input className="btn btn-primary hover:cursor-pointer" type="submit" value="Submit exam registration" />
            </form >
        </div >

    )
}