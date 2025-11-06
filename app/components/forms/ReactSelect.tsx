"use client";
import React from "react";
import Select, { createFilter } from "react-select";
import type { OptionProps, GroupBase } from "react-select";
import type { ComponentType } from "react";
import CustomOption from "./CustomOption";
import { Control, Controller, Path } from "react-hook-form";

type SelectOption = { value: number; label: string };

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
    data: SelectOption[];
    label: string;
    name: Path<Inputs>;
    baseArray?: { id: number; lastname: string; firstname: string; sciper: string; email: string; }[];
    isMultiChoice: boolean;
}

export default function SelectController({ control, data, label, name, baseArray, isMultiChoice }: SelectProps) {
    return (
        <Controller
            name={name}
            control={control}
            render={({ field }) => {
                if (isMultiChoice) {
                    return (
                        <Select<SelectOption, true, GroupBase<SelectOption>>
                            {...field}
                            instanceId={2}
                            options={data}
                            formatOptionLabel={(option) => {
                                const user = baseArray?.find((u) => u.id === option.value);
                                if (user) return (
                                    <div className="">
                                        {user.firstname} {user.lastname} - {user.email}
                                    </div>
                                );
                                return option.label;
                            }}
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
                            isMulti={true}
                            classNamePrefix="custom-option"
                            filterOption={createFilter({ ignoreAccents: false })}
                            components={{
                                Option: CustomOption as ComponentType<OptionProps<SelectOption, true, GroupBase<SelectOption>>>,
                            }}
                            placeholder={`Select ${label}...`}
                            value={Array.isArray(field.value) ? data.filter((c) => field.value.includes(c.value)) : []}
                            onChange={(selected) => {
                                field.onChange(selected ? (selected as SelectOption[]).map(s => s.value) : []);
                            }}
                        />
                    );
                }

                return (
                    <Select<SelectOption, false, GroupBase<SelectOption>>
                        {...field}
                        instanceId={3}
                        options={data}
                        formatOptionLabel={(option) => {
                            const user = baseArray?.find((u) => u.id === option.value);
                            if (user) return (
                                <div className="">
                                    {user.firstname} {user.lastname} - {user.email}
                                </div>
                            );
                            return option.label;
                        }}
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
                        isMulti={false}
                        classNamePrefix="custom-option"
                        filterOption={createFilter({ ignoreAccents: false })}
                        components={{
                            Option: CustomOption as ComponentType<OptionProps<SelectOption, false, GroupBase<SelectOption>>>,
                        }}
                        placeholder={`Select ${label}...`}
                        value={data.find((c) => c.value === (field.value as number | string)) || null}
                        onChange={(selected) => {
                            field.onChange(selected ? (selected as SelectOption).value : null);
                        }}
                    />
                );
            }}
        />
    );
}
