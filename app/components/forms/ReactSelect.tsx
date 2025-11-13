"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AsyncSelect from "react-select/async";
import type { OptionProps, GroupBase } from "react-select";
import type { ComponentType } from "react";
import CustomOption from "./CustomOption";
import { Control, Controller, Path } from "react-hook-form";
import { fetchPersons } from "@/app/lib/api";

export type SelectOption = { value: number; label: string; person?: { id: number; firstname?: string; lastname?: string; email?: string; sciper?: string } };

type Inputs = {
    exampleRequired: string
    exampleSelect: string
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
}

export interface SelectProps {
    control: Control<any>;
    label: string;
    name: Path<Inputs>;
    isMultiChoice: boolean;
}

async function fetchPersonById(id: number): Promise<SelectOption | null> {
    const list = await fetchPersons(String(id));
    const found = list.find((l) => Number(l.value) === Number(id));
    return found ?? null;
}

export default function SelectController({ control, label, name, isMultiChoice }: SelectProps) {
    const timeoutRef = useRef<NodeJS.Timeout | number>(0);
    const [selected, setSelected] = useState<SelectOption | SelectOption[] | null>(null);

    const loadOptions = useCallback(async (inputValue: string) => {
        if (!inputValue || inputValue.length < 3) return [];
        return new Promise((resolve) => {
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
    const theme = useCallback((themeArg: any) => ({
        ...themeArg,
        borderRadius: 9,
        colors: {
            ...themeArg.colors,
            primary25: 'rgba(239, 68, 68, 0.1)',
            primary: 'rgba(239, 68, 68, 1)',
        },
        fontWeight: 'bolder',
        fontSize: '24px',
    }), []);

    const customStyles = useMemo(() => ({
        control: (styles: any) => ({ ...styles, backgroundColor: 'white', ":focus-within": { borderColor: 'red', boxShadow: '0 0 0 1px red', }, padding: '4px' }),
        multiValueLabel: (styles: any) => ({ ...styles, fontWeight: '500' }),
        option: (styles: any, { isSelected }: any) => ({ ...styles, fontWeight: isSelected ? '600' : 'normal' }),
    }), []);

    return (
        <Controller
            name={name}
            control={control}
            render={({ field }) => {
                useEffect(() => {
                    let mounted = true;
                    (async () => {
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
                }, [field.value, isMultiChoice]);

                return (
                    <AsyncSelect<SelectOption, boolean, GroupBase<SelectOption>>
                        cacheOptions
                        defaultOptions={false}
                        loadOptions={loadOptions}
                        value={isMultiChoice ? (Array.isArray(selected) ? selected : []) : (selected as SelectOption | null)}
                        getOptionValue={(opt) => String(opt.value)}
                        formatOptionLabel={formatOption}
                        theme={theme}
                        styles={customStyles}
                        isMulti={isMultiChoice}
                        classNamePrefix="custom-option"
                        components={{ Option: CustomOption as ComponentType<OptionProps<SelectOption, any, GroupBase<SelectOption>>> }}
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
                        noOptionsMessage={({ inputValue }) => inputValue ? `No results for "${inputValue}"` : `Type atleast 3 chars...`}
                        // small client-side debounce can be added by wrapping loadOptions when necessary
                        instanceId={2}
                    />
                );
            }}
        />
    );
}
