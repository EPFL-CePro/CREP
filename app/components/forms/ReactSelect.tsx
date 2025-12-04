"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState, ComponentType } from "react";
import AsyncSelect from "react-select/async";
import Select from "react-select";
import type { OptionProps, GroupBase, OptionsOrGroups, Theme, StylesConfig } from "react-select";
import CustomOption from "./CustomOption";
import { Control, Controller, ControllerRenderProps, Path } from "react-hook-form";
import { fetchCourses, fetchPersonBySciper, fetchPersons } from "@/app/lib/api";
import { User } from "next-auth";

export type SelectOption = { value: number | string; label: string; person?: { id: number; firstname?: string; lastname?: string; email?: string; sciper?: string } };

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
    financialCenter: string
}

export interface SelectProps {
    control: Control<Inputs>;
    label: string;
    name: Path<Inputs>;
    isMultiChoice: boolean;
    containCourses?: boolean;
    instanceId?: string | number;
    user?: AppUser;
}

export interface AppUser extends User {
    sciper: string;
}

async function fetchOasisCourses(): Promise<SelectOption[]> {
    const list = (await fetchCourses()) || [];
    return list;
}

type SelectFieldProps = {
    field: ControllerRenderProps<Inputs>;
    label: string;
    name: Path<Inputs>;
    isMultiChoice: boolean;
    containCourses?: boolean;
    instanceId?: string | number;
    user?: AppUser;
};

function SelectField({
    field,
    label,
    name,
    isMultiChoice,
    containCourses,
    instanceId,
    user,
}: SelectFieldProps) {
    const timeoutRef = useRef<NodeJS.Timeout | number>(0);
    const PAGE_SIZE = 10;
    const allCoursesRef = useRef<SelectOption[] | null>(null);
    const filteredCoursesRef = useRef<SelectOption[]>([]);
    const displayedCoursesRef = useRef<SelectOption[]>([]);
    const currentQueryRef = useRef<string>("");
    const pageRef = useRef<number>(1);

    const [selected, setSelected] = useState<SelectOption | SelectOption[] | null>(
        null
    );
    const [courseDisplayed, setCourseDisplayed] = useState<SelectOption[]>([]);
    const [courseLoading, setCourseLoading] = useState(false);

    const formatOption = useCallback((option: SelectOption) => {
        const p = option.person;
        if (p) {
            return (
                <div>
                    {p.firstname} {p.lastname} {p.email ? `- ${p.email}` : null}
                </div>
            );
        }
        return option.label;
    }, []);

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

    const customStyles = useMemo<
        StylesConfig<SelectOption, boolean, GroupBase<SelectOption>>
    >(
        () => ({
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
        }),
        []
    );

    // Load options (people / courses)
    const loadOptions = useCallback(
        async (
            inputValue: string,
            callback?: (
                opts: OptionsOrGroups<SelectOption, GroupBase<SelectOption>>
            ) => void
        ) => {
            // If it is not a `courses` select, it means that API calls are made. That's why we wait at least 3 chars.
            if (!(containCourses && name === "course") && (!inputValue || inputValue.length < 3)) {
                return [];
            }

            // Fetching persons
            return new Promise<
                OptionsOrGroups<SelectOption, GroupBase<SelectOption>>
            >((resolve) => {
                clearTimeout(timeoutRef.current as number);
                timeoutRef.current = setTimeout(async () => {
                    try {
                        const items = await fetchPersons(inputValue);
                        resolve(items);
                        if (callback) callback(items);
                    } catch (e) {
                        console.error("Failed to fetch persons", e);
                        resolve([]);
                        if (callback) callback([]);
                    }
                }, 1000);
            });
        },
        [containCourses, name]
    );

    // Default contact user is the logged in user
    useEffect(() => {
        if (!user?.sciper) return;

        let cancelled = false;

        (async () => {
            try {
                const person = await fetchPersonBySciper(user.sciper);
                if (!person || cancelled) return;

                const option: SelectOption = {
                    value: Number(person.id),
                    label:
                        `${person.firstname} ${person.lastname}`.trim() ||
                        person.email,
                    person: {
                        id: Number(person.id),
                        firstname: person.firstname,
                        lastname: person.lastname,
                        email: person.email,
                        sciper: person.id,
                    },
                };

                setSelected(option);

                if (!field.value) {
                    field.onChange(option.value);
                }
            } catch (e) {
                console.error("Failed to fetch current user person", e);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [name, user?.sciper, field]);

    const ensureCoursesLoaded = useCallback(
        async (query = "") => {
            if (!allCoursesRef.current) {
                setCourseLoading(true);
                try {
                    const all = await fetchOasisCourses();
                    allCoursesRef.current = all ?? [];
                } catch (e) {
                    alert(`Failed to load courses, ${e}`);
                    allCoursesRef.current = [];
                } finally {
                    setCourseLoading(false);
                }
            }

            const q = query.trim().toLowerCase();
            currentQueryRef.current = q;
            pageRef.current = 1;

            const filtered = (allCoursesRef.current || []).filter((c) =>
                c.label.toLowerCase().includes(q)
            );
            filteredCoursesRef.current = filtered;

            const slice = filtered.slice(0, PAGE_SIZE);
            displayedCoursesRef.current = slice;
            setCourseDisplayed(slice);
        },
        [PAGE_SIZE]
    );

    const loadMoreCourses = useCallback(() => {
        const filtered = filteredCoursesRef.current || [];
        if (displayedCoursesRef.current.length >= filtered.length) return;

        pageRef.current = pageRef.current + 1;
        const end = pageRef.current * PAGE_SIZE;
        const slice = filtered.slice(0, end);
        displayedCoursesRef.current = slice;
        setCourseDisplayed(slice);
    }, [PAGE_SIZE]);

    // Courses select
    if (containCourses && name === "course") {
        return (
            <Select<SelectOption, boolean, GroupBase<SelectOption>>
                options={courseDisplayed}
                isLoading={courseLoading}
                value={
                    isMultiChoice
                        ? (Array.isArray(selected) ? selected : [])
                        : (selected as SelectOption | null)
                }
                getOptionValue={(opt) => String(opt.value)}
                formatOptionLabel={formatOption}
                theme={theme}
                styles={customStyles}
                isMulti={isMultiChoice}
                classNamePrefix="custom-option"
                components={{
                    Option:
                        CustomOption as ComponentType<
                            OptionProps<SelectOption, boolean, GroupBase<SelectOption>>
                        >,
                }}
                placeholder={`Select ${label}...`}
                onChange={async (selectedOption) => {
                    if (isMultiChoice) {
                        const opts = Array.isArray(selectedOption)
                            ? selectedOption
                            : [];
                        setSelected(opts);
                    } else {
                        const opt = selectedOption
                            ? (selectedOption as SelectOption)
                            : null;
                        setSelected(opt);
                        if (!opt) {
                            field.onChange(null);
                            return;
                        }
                        field.onChange(opt as SelectOption);
                    }
                }}
                onMenuOpen={() => ensureCoursesLoaded(currentQueryRef.current)}
                onInputChange={(newValue) => {
                    void ensureCoursesLoaded(newValue || "");
                    return newValue;
                }}
                onMenuScrollToBottom={() => {
                    loadMoreCourses();
                }}
                filterOption={null}
                instanceId={instanceId ?? `${name}-course-select`}
            />
        );
    }

    // People select
    return (
        <AsyncSelect<SelectOption, boolean, GroupBase<SelectOption>>
            cacheOptions
            defaultOptions={containCourses ? false : true}
            loadOptions={loadOptions}
            value={
                isMultiChoice
                    ? (Array.isArray(selected) ? selected : [])
                    : (selected as SelectOption | null)
            }
            getOptionValue={(opt) => String(opt.value)}
            formatOptionLabel={containCourses ? undefined : formatOption}
            theme={theme}
            styles={customStyles}
            isMulti={isMultiChoice}
            classNamePrefix="custom-option"
            components={{
                Option:
                    CustomOption as ComponentType<
                        OptionProps<SelectOption, boolean, GroupBase<SelectOption>>
                    >,
            }}
            placeholder={`Select ${label}...`}
            onChange={(selectedOption) => {
                if (isMultiChoice) {
                    const arr = Array.isArray(selectedOption)
                        ? selectedOption.map((s) => Number(s.value))
                        : [];
                    field.onChange(arr);
                    setSelected(
                        Array.isArray(selectedOption) ? selectedOption : []
                    );
                } else {
                    const val = selectedOption
                        ? Number((selectedOption as SelectOption).value)
                        : null;
                    field.onChange(val);
                    setSelected(selectedOption as SelectOption | null);
                }
            }}
            filterOption={null}
            noOptionsMessage={({ inputValue }) => {
                if (inputValue) return `No results for "${inputValue}"`;
                return `Type at least 3 chars...`;
            }}
            instanceId={instanceId ?? `${name}-async-select`}
        />
    );
}

// Select wrapper
export default function SelectController({
    control,
    label,
    name,
    isMultiChoice,
    containCourses,
    instanceId,
    user,
}: SelectProps) {
    return (
        <Controller
            name={name}
            control={control}
            render={({ field }) => (
                <SelectField
                    field={field}
                    label={label}
                    name={name}
                    isMultiChoice={isMultiChoice}
                    containCourses={containCourses}
                    instanceId={instanceId}
                    user={user}
                />
            )}
        />
    );
}
