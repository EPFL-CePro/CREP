"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AsyncSelect from "react-select/async";
import Select from "react-select";
import type { OptionProps, GroupBase, OptionsOrGroups, Theme, StylesConfig } from "react-select";
import type { ComponentType } from "react";
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

async function fetchPersonById(id: number): Promise<SelectOption | null> {
    const list = await fetchPersons(String(id));
    const found = list.find((l) => Number(l.value) === Number(id));
    return found ?? null;
}

async function fetchOasisCourses(): Promise<SelectOption[]> {
    const list = (await fetchCourses()) || [];
    return list;
}

export default function SelectController({ control, label, name, isMultiChoice, containCourses, instanceId, user }: SelectProps) {
    const timeoutRef = useRef<NodeJS.Timeout | number>(0);
    const PAGE_SIZE = 10;
    const allCoursesRef = useRef<SelectOption[] | null>(null);
    const filteredCoursesRef = useRef<SelectOption[]>([]);
    const displayedCoursesRef = useRef<SelectOption[]>([]);
    const currentQueryRef = useRef<string>('');
    const pageRef = useRef<number>(1);
    const [currentUser, setCurrentUser] = useState<SelectOption | undefined>(undefined);

    // Automatically fetch current connected user
    useEffect(() => {
        if (!user?.sciper) return;
        fetchPersonBySciper(user?.sciper).then((person) => {
            if (person) {
                const option: SelectOption = {
                    value: Number(person.id),
                    label: `${person.firstname} ${person.lastname}`.trim() || (person.email),
                    person: {
                        id: Number(person.id),
                        firstname: person.firstname,
                        lastname: person.lastname,
                        email: person.email,
                        sciper: person.id,
                    }
                };
                setCurrentUser(option);
            }
        });
    }, []);

    const loadOptions = useCallback(async (inputValue: string, callback?: (opts: OptionsOrGroups<SelectOption, GroupBase<SelectOption>>) => void) => {
        // For non-course selects, require at least 3 characters.
        if (!(containCourses && name === 'course') && (!inputValue || inputValue.length < 3)) return [];

        // Course-select paginated loading
        if (name === 'course' && containCourses) {
            clearTimeout(timeoutRef.current as number);
            return new Promise<OptionsOrGroups<SelectOption, GroupBase<SelectOption>>>((resolve) => {
                (async () => {
                    try {
                        // Load full course list once
                        if (!allCoursesRef.current) {
                            const all = await fetchOasisCourses();
                            allCoursesRef.current = all ?? [];
                        }

                        const query = inputValue ? inputValue.trim().toLowerCase() : '';
                        // If query changed, reset paging
                        if (currentQueryRef.current !== query) {
                            currentQueryRef.current = query;
                            pageRef.current = 1;
                            displayedCoursesRef.current = [];
                        }

                        // Filter the full list by label
                        const filtered = (allCoursesRef.current || []).filter((c) => c.label.toLowerCase().includes(query));
                        filteredCoursesRef.current = filtered;

                        const end = pageRef.current * PAGE_SIZE;
                        const slice = filtered.slice(0, end);
                        displayedCoursesRef.current = slice;

                        if (callback) callback(slice);
                        resolve(slice);
                    } catch (e) {
                        console.error("Failed to fetch courses", e);
                        if (callback) callback([]);
                        resolve([]);
                    }
                })();
            });
        }

        // Persons
        return new Promise<OptionsOrGroups<SelectOption, GroupBase<SelectOption>>>((resolve) => {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(async () => {
                try {
                    const items = await fetchPersons(inputValue);
                    resolve(items);
                } catch (e) {
                    console.error("Failed to fetch persons", e);
                    resolve([]);
                }
            }, 1000);
        });
    }, []);

    const formatOption = useCallback((option: SelectOption) => {
        const p = option.person;
        if (p) return (
            <div className="">
                {p.firstname} {p.lastname} {p.email ? `- ${p.email}` : null}
            </div>
        );
        return option.label;
    }, []);

    // react-select theme and styles

    const theme = useCallback((themeArg: Theme): Theme => {
        return {
            ...themeArg,
            borderRadius: 9,
            colors: {
                ...themeArg.colors,
                primary25: 'rgba(239, 68, 68, 0.1)',
                primary: 'rgba(239, 68, 68, 1)',
            },
            fontWeight: 'bolder' as unknown as Theme['spacing'],
            fontSize: '24px' as unknown as Theme['spacing'],
        } as Theme;
    }, []);

    const customStyles = useMemo<StylesConfig<SelectOption, boolean, GroupBase<SelectOption>>>(
        () => ({
            control: (styles) => ({
                ...styles,
                backgroundColor: 'white',
                ":focus-within": {
                    borderColor: 'red',
                    boxShadow: '0 0 0 1px red',
                },
                padding: '4px',
            }),
            multiValueLabel: (styles) => ({
                ...styles,
                fontWeight: '500',
            }),
            option: (styles, { isSelected }) => ({
                ...styles,
                fontWeight: isSelected ? '600' : 'normal',
            }),
        }),
        []
    );


    function SelectField({ field }: { field: ControllerRenderProps<Inputs> }) {
        const [selected, setSelected] = useState<SelectOption | SelectOption[] | null>(null);
        const [courseDisplayed, setCourseDisplayed] = useState<SelectOption[]>([]);
        const [courseLoading, setCourseLoading] = useState(false);

        useEffect(() => {
            let mounted = true;
            (async () => {
                // On first mount, if no value is selected, set currentUser as default in contact select
                if (!field.value && currentUser && containCourses !== true && user?.sciper) {
                    setSelected(currentUser);
                    field.onChange(currentUser?.value ?? null);
                    return;
                }
                if (name === 'course') {
                    if (isMultiChoice) {
                        const vals = Array.isArray(field.value) ? field.value.filter(Boolean) : [];
                        if (vals.length === 0) {
                            if (mounted) setSelected([]);
                            return;
                        }
                        if (!allCoursesRef.current) {
                            allCoursesRef.current = await fetchOasisCourses();
                        }
                        const results = vals.map((v: SelectOption) => {
                            if (typeof v === 'object' && v.label) return v as SelectOption;
                            return (allCoursesRef.current || []).find((c) => String(c.value) === String(v));
                        }).filter(Boolean) as SelectOption[];
                        if (mounted) setSelected(results);
                    } else {
                        const val = field.value;
                        if (!val) {
                            if (mounted) setSelected(null);
                            return;
                        }
                        if (typeof val === 'object' && (val as SelectOption).label) {
                            if (mounted) setSelected(val as SelectOption);
                            return;
                        }
                        if (!allCoursesRef.current) {
                            allCoursesRef.current = await fetchOasisCourses();
                        }
                        const found = (allCoursesRef.current || []).find((c) => String(c.value) === String(val));
                        if (mounted) setSelected(found ?? null);
                    }
                    return;
                }

                if (isMultiChoice) {
                    const ids = Array.isArray(field.value) ? field.value.map(Number).filter(Boolean) : [];
                    if (ids.length === 0) {
                        if (mounted) setSelected([]);
                        return;
                    }
                    const promises = ids.map((id) => fetchPersonById(Number(id)));
                    const results = (await Promise.all(promises)).filter(Boolean) as SelectOption[];
                    if (mounted) setSelected(results);
                } else {
                    const id = field.value ? Number(field.value) : null;
                    if (!id) {
                        if (mounted) setSelected(null);
                        return;
                    }
                    const one = await fetchPersonById(id);
                    if (mounted) setSelected(one);
                }
            })();
            return () => { mounted = false; };
        }, [field.value, currentUser]);

        // Helper to load and page courses
        const ensureCoursesLoaded = useCallback(async (query = '') => {
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
            const filtered = (allCoursesRef.current || []).filter((c) => c.label.toLowerCase().includes(q));
            filteredCoursesRef.current = filtered;
            const slice = filtered.slice(0, PAGE_SIZE);
            displayedCoursesRef.current = slice;
            setCourseDisplayed(slice);
        }, []);

        const loadMoreCourses = useCallback(() => {
            const filtered = filteredCoursesRef.current || [];
            if (displayedCoursesRef.current.length >= filtered.length) return;
            pageRef.current = pageRef.current + 1;
            const end = pageRef.current * PAGE_SIZE;
            const slice = filtered.slice(0, end);
            displayedCoursesRef.current = slice;
            setCourseDisplayed(slice);
        }, []);

        if (containCourses && name === 'course') {
            return (
                <Select<SelectOption, boolean, GroupBase<SelectOption>>
                    options={courseDisplayed}
                    isLoading={courseLoading}
                    value={isMultiChoice ? (Array.isArray(selected) ? selected : []) : (selected as SelectOption | null)}
                    getOptionValue={(opt) => String(opt.value)}
                    formatOptionLabel={formatOption}
                    theme={theme}
                    styles={customStyles}
                    isMulti={isMultiChoice}
                    classNamePrefix="custom-option"
                    components={{ Option: CustomOption as ComponentType<OptionProps<SelectOption, boolean, GroupBase<SelectOption>>> }}
                    placeholder={`Select ${label}...`}
                    onChange={async (selectedOption) => {
                        // When selecting a course, fetch its full details and store them
                        if (isMultiChoice) {
                            const opts = Array.isArray(selectedOption) ? selectedOption : [];
                            setSelected(opts);
                        } else {
                            const opt = selectedOption ? (selectedOption as SelectOption) : null;
                            setSelected(opt);
                            if (!opt) {
                                field.onChange(null);
                                return;
                            }
                            try {
                                field.onChange((opt ?? opt) as SelectOption);
                            } catch {
                                // fallback to the selected option if fetch fails
                                field.onChange(opt as SelectOption);
                            }
                        }
                    }}
                    onMenuOpen={() => ensureCoursesLoaded(currentQueryRef.current)}
                    onInputChange={(newValue) => { ensureCoursesLoaded(newValue || ''); return newValue; }}
                    onMenuScrollToBottom={() => { loadMoreCourses(); }}
                    filterOption={null}
                    instanceId={1}
                />
            );
        }

        return (
            <AsyncSelect<SelectOption, boolean, GroupBase<SelectOption>>
                cacheOptions
                defaultOptions={containCourses ? false : true}
                loadOptions={loadOptions}
                value={isMultiChoice ? (Array.isArray(selected) ? selected : []) : (selected as SelectOption | null)}
                getOptionValue={(opt) => String(opt.value)}
                formatOptionLabel={containCourses ? undefined : formatOption}
                theme={theme}
                styles={customStyles}
                isMulti={isMultiChoice}
                classNamePrefix="custom-option"
                components={{ Option: CustomOption as ComponentType<OptionProps<SelectOption, boolean, GroupBase<SelectOption>>> }}
                placeholder={`Select ${label}...`}
                onChange={(selectedOption) => {
                    if (isMultiChoice) {
                        const arr = Array.isArray(selectedOption) ? selectedOption.map((s) => Number(s.value)) : [];
                        field.onChange(arr);
                        setSelected(Array.isArray(selectedOption) ? selectedOption : []);
                    } else {
                        const val = selectedOption ? Number((selectedOption as SelectOption).value) : null;
                        field.onChange(val);
                        setSelected(selectedOption as SelectOption | null);
                    }
                }}
                filterOption={null}
                noOptionsMessage={({ inputValue }) => {
                    if (inputValue) return `No results for "${inputValue}"`;
                    return `Type at least 3 chars...`;
                }}
                instanceId={instanceId}
            />
        );
    }

    return (
        <Controller
            name={name}
            control={control}
            render={({ field }) => <SelectField field={field} />}
        />
    );
}
