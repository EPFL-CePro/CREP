"use client";
// This form allows users to register their exams into the system.
import { useForm, SubmitHandler, useFieldArray, Controller } from "react-hook-form"
import { getAllExamTypes, getAllServices, insertExam, getAllAcademicYears, getAllSections } from "@/app/lib/database";
import { useCallback, useEffect, useMemo, useState } from "react";
import ReactSelect from "./ReactSelect";
import { sendMail } from "@/app/lib/mail";
import { User } from "next-auth";
import { RedAsterisk } from "../RedAsterisk";
import { RegisterModal } from "./RegisterModal";
import { Inputs } from "@/types/inputs";
import { Service } from "@/types/service";
import { ExamType } from "@/types/examType";
import { FormattedAcademicYear } from "@/types/academicYear";
import Select from "react-select";
import { GroupBase, StylesConfig, Theme } from "react-select";
import { FormattedSection } from "@/types/section";

interface RegisterProps {
    user: AppUser
}

interface AppUser extends User {
    isAdmin?: boolean;
    sciper: string;
}


export default function App({ user }: RegisterProps) {
    const [modalOpen, setModalOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState("Registration Successful");
    const [modalMessage, setModalMessage] = useState("Your exam has been successfully registered.");
    const [modalResolver, setModalResolver] = useState<((confirmed: boolean) => void) | null>(null);
    const [isConfirmModal, setIsConfirmModal] = useState(false);
    const [services, setServices] = useState<Service[]>([]);
    const [examTypes, setExamTypes] = useState<ExamType[]>([]);
    const [academicYears, setAcademicYears] = useState<FormattedAcademicYear[]>([]);
    const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>();
    const [sections, setSections] = useState<FormattedSection[]>([]);

    useEffect(() => {
        (async () => {
            const allServices = await getAllServices();
            setServices(allServices);

            const allExamTypes = await getAllExamTypes();
            setExamTypes(allExamTypes);

            const allAcademicYears = await getAllAcademicYears();
            setAcademicYears(allAcademicYears.reverse()); // .reverse() to get the most recent academic years first in the list.

            const allSections = await getAllSections();
            setSections(allSections);
            
        })();
    }, [])

    const { control, register, handleSubmit, formState: { errors }, setError, clearErrors, reset, setValue } = useForm<Inputs>({
        defaultValues: {
            examType: [],
        }
    })

    useEffect(() => {
        if (!academicYears.length) return;

        setValue("academicYear", academicYears[0], { shouldValidate: true, shouldDirty: false });
        setSelectedAcademicYear(academicYears[0].academicYear.code);
    }, [academicYears, setValue]);

    useEffect(() => {
        if (!examTypes.length) return;

        reset(prev => ({
            ...prev,
            examType: examTypes.map(examType => ({
                id: examType.id,
                code: examType.code,
                name: examType.name,
                checked: false,
                date: "",
                dontKnowYet: false
            }))
        }));
    }, [examTypes, reset]);

    const { fields } = useFieldArray({
        control,
        name: "examType"
    })

    const openModal = (title: string, message: string) => {
        setIsConfirmModal(false);
        setModalResolver(null);
        setModalTitle(title);
        setModalMessage(message);
        setModalOpen(true);
        const dialog = document.getElementById("register-modal") as HTMLDialogElement | null;
        dialog?.showModal?.();
    };
    const handleModalResult = (confirmed: boolean) => {
        if (modalResolver) {
            modalResolver(confirmed);
            setModalResolver(null);
        }
        setModalOpen(false);
    };

    const onSubmit: SubmitHandler<Inputs> = async (data) => {
        if (!data.course) {
            openModal("Course Selection Error", "Please select a course.");
            return;
        }

        if (!data.contact) {
            openModal("Contact Selection Error", "Please select a contact.");
            return;
        }

        // TODO: Add a verification if an exam type is checked but doesn't have any date AND `I don't know yet` is not checked too.

        try {
            console.log(data)

            for (let index = 0; index < data.examType.length; index++) {
                const examType = data.examType[index]
                if(!examType.checked) continue;

                const insertedExam = await insertExam(
                    {
                        code: data.course.exam.code,
                        name: data.course.exam.title,
                        service_level_id: 2, // Silver by default for everyone, but this is a TODO
                        service_id: parseInt(data.service),
                        exam_type_id: examType.id,
                        exam_status_id: 2,
                        exam_date: examType.dontKnowYet ? null : examType.date,
                        academic_year_id: data.academicYear.academicYear.id,
                        exam_semester: parseInt(data.examSemester),
                        nb_students: null,
                        nb_pages: null,
                        total_pages: null,
                        remark: data.remark,
                        section_id: data.section.section.id,
                        responsible_id: null,
                        contact: data.contact
                    }
                )
                if (typeof (insertedExam) !== 'number') {
                    openModal("Registration Error", "An error occurred while registering your exam. Please try again later.");
                    return;
                }
            }
//             if (process.env.NODE_ENV !== "development") {
//                 await sendMail(
//                     user.email || '',
//                     `${lessThanEightDays ? 'REQUIRES ATTENTION - ' : ''} CePro - Exam printing service subscription confirmation`,
//                     `
// Hello,
// Your subscription to our exam printing service has been successfully registered:

// ${lessThanEightDays ? `⚠️ : We would like to inform you that you choose a desired delivery date that is inferior to 8 business days before the exam.
// The CePro team will get in touch with you shortly to discuss about your situation.
// Next time, please register to the printing service earlier to make sur that the printing team has the right amount of time to print your exam correctly.
// ` : ''}

// - Course: ${data.course?.label}
// - Exam date: ${data.examDate}
// - Desired delivery date: ${data.desiredDate}
// - Contact: ${contact?.firstname} ${contact?.lastname} (${contact?.email})
// - Authorized persons: ${authorizedPersons.map(user => `${user.email}`).join(', ')}
// ${data.remark && `- Additional remarks: ${data.remark}`}`,
//                     'cepro-exams@epfl.ch'
//                 );
//             }
//             openModal("Registration Successful", 'Your Exam ' + exam_code + ' has been registered and a confirmation has been sent to your email.');
//             reset();
        } catch (err) {
            console.error(err);
            openModal("Unexpected Error", 'An unexpected error occurred while registering the exam.');
        }
    }
    
    const theme = useCallback((themeArg: Theme): Theme => {
        return {
            ...themeArg,
            borderRadius: 9,
            colors: {
                ...themeArg.colors,
                primary25: "rgba(239, 68, 68, 0.1)",
                primary: "rgba(239, 68, 68, 1)",
            },
            fontWeight: "bolder" as unknown as Theme["spacing"],
            fontSize: "24px" as unknown as Theme["spacing"],
        } as Theme;
    }, []);

    function makeCustomStyles<Option, IsMulti extends boolean = boolean>(): StylesConfig<
        Option,
        IsMulti,
        GroupBase<Option>
    > {
        return {
            control: (styles) => ({
            ...styles,
            backgroundColor: "white",
            ":focus-within": {
                borderColor: "red",
                boxShadow: "0 0 0 1px red",
            },
            padding: "4px",
            }),
            multiValueLabel: (styles) => ({
            ...styles,
            fontWeight: "500",
            }),
            option: (styles, { isSelected }) => ({
            ...styles,
            fontWeight: isSelected ? "600" : "normal",
            }),
        };
    }

    const academicYearStyles = useMemo(() => 
        makeCustomStyles<FormattedAcademicYear, false>(), []
    )

    const sectionStyles = useMemo(() => 
        makeCustomStyles<FormattedSection, false>(), []
    )

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
            <h1 className="text-3xl font-semibold mb-8 text-center" >CePro — Exam service subscription</h1>
            <div className="flex flex-col gap-2 text-center">
                <p className="justify-center">
                    Please provide us all the necessary information about your exam (end of semester exams) <u>2 months before the date of your assessment.</u>
                    <br />Those information will allow us to plan technical support according to service levels.
                </p>
                <div className="flex flex-col gap-2">
                    <p>For more information about the different services and levels provided by the CePro, please click the <i>Learn more</i> button bellow.</p>
                    <button className="btn btn-primary hover:cursor-pointer ml-auto mr-auto">Learn more</button>
                </div>
            </div>
            <form className="max-w-[1000px] [&>label]:text-lg [&>*]:accent-red-500 p-4 rounded-md flex flex-col gap-3 mt-2 [&>select]:mb-2 [&>input,&>*>*>input]:mb-2 [&>input,&>textarea,&>*>*>input]:border [&>input,&>textarea,&>*>*>input]:border-slate-300 [&>input,&>textarea,&>*>*>input]:rounded-md [&>input,&>*>*>input]:p-2 [&>textarea]:p-2 "
                onSubmit={handleSubmit(onSubmit)}
                encType="multipart/form-data">
                {/* register your input into the hook by invoking the "register" function */}
                <label>Your email address</label>
                <ReactSelect control={control} label={"registeredBy"} name={"registeredBy"} isMultiChoice={false} instanceId={2} user={user} disabled={true}/>
                <label>Academic Year <RedAsterisk /></label>
                <Controller
                    name="academicYear"
                    control={control}
                    render={({ field }) => (
                        <Select<FormattedAcademicYear, false>
                        options={academicYears}
                        styles={academicYearStyles}
                        theme={theme}
                        value={field.value}
                        onChange={(val) => {
                            field.onChange(val)
                            setSelectedAcademicYear(val?.academicYear.code)
                        }}
                        onBlur={field.onBlur}
                        ref={field.ref}
                        isClearable
                        isSearchable
                        />
                    )}
                />
                <label>Exam semester <RedAsterisk /></label>
                <div className="flex gap-1" key={1}>
                        <input
                            id="semester-1"
                            value={1}
                            className="text-right"
                            type="radio"
                            {...register("examSemester")}
                        />
                        <label className="!text-sm" htmlFor="semester-1">Semester 1</label>
                </div>
                <div className="flex gap-1" key={2}>
                        <input
                            id="semester-2"
                            value={2}
                            className="text-right"
                            type="radio"
                            {...register("examSemester")}
                        />
                        <label className="!text-sm" htmlFor="semester-2">Semester 2</label>
                </div>
                <label>Select your exam <RedAsterisk /></label>
                <ReactSelect key={selectedAcademicYear} control={control} label={"course"} name={"course"} isMultiChoice={false} containCourses={true} instanceId={1} academicYear={selectedAcademicYear} />
                <label>Exam section <RedAsterisk /></label>
                <Controller
                    name="section"
                    control={control}
                    render={({ field }) => (
                        <Select<FormattedSection, false>
                            options={sections}
                            styles={sectionStyles}
                            theme={theme}
                            value={field.value}
                            onChange={(val) => field.onChange(val)}
                            onBlur={field.onBlur}
                            ref={field.ref}
                            isClearable
                            isSearchable
                        />
                    )}
                />
                <label>Exam type <RedAsterisk /></label>
                {fields.map((field, index) => (
                    <div className="flex flex-row justify-between w-full 2xl:w-4/5 [&>*>label]:text-lg" key={field.id}>
                        <div>
                            <input
                                id={field.code}
                                className="text-right"
                                type="checkbox"
                                {...register(`examType.${index}.checked`)}
                            />
                            <label htmlFor={field.code} className="!text-sm ml-1">{field.name}</label>
                        </div>
                        <div className="flex gap-3">
                            <div className="flex flex-row items-center">
                                <label className="!text-sm mr-2">Exam Date</label>
                                <input
                                    className="text-right rounded-lg border-1 border-solid border-gray-400"
                                    type="date"
                                    {...register(`examType.${index}.date`)}
                                />
                            </div>
                            <div>
                                <label htmlFor={`${field.code}dontKnowYet`} className="!text-sm mr-2">I don't know yet</label>
                                <input
                                    id={`${field.code}dontKnowYet`}
                                    className="text-right"
                                    type="checkbox"
                                    {...register(`examType.${index}.dontKnowYet`)}
                                />
                            </div>
                        </div>
                    </div>
                ))}
                <label>Service <RedAsterisk /></label>
                {services.map(service => (
                    <div className="flex gap-1" key={service.id}>
                        <input
                            id={service.code}
                            value={service.id}
                            className="text-right"
                            type="radio"
                            {...register("service")}
                        />
                        <label className="!text-sm" htmlFor={service.code}>{service.description}</label>
                    </div>
                ))}
                <label>Contact <RedAsterisk /></label>
                <div className="bg-red-600/30 border-1 border-red-500 rounded-xl p-3 text-sm">
                    Please select here the person <u>from your course</u> who will be in contact with CePro for preparation.
                    This is the person who will coordinate the preparation of the exam and with whom CePro will be in contact depending on the level of support.
                    This does not preclude having several people for the preparation of your exam, but we prefer to have just one contact person for organisational reasons.
                </div>
                <ReactSelect control={control} label={"contact"} name={"contact"} isMultiChoice={false} instanceId={2} />
                <label>Additional remarks</label>
                <textarea {...register("remark")} placeholder="Additional remarks (optional)" />

                <input className="btn btn-primary hover:cursor-pointer" type="submit" value="Submit exam registration" />
            </form>
        </div >

    )
}