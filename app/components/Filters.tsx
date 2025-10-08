"use client";
import { User } from "next-auth";
import dynamic from "next/dynamic";
import { StylesConfig } from "react-select";
const Select = dynamic(() => import("react-select"), { ssr: false });
import chroma from "chroma-js";
import { Dispatch, SetStateAction } from "react";

interface AppUser extends User {
    isAdmin?: boolean;
}

interface StatusOption {
  value: string;
  label: string;
  color: string;
  needsAdmin: boolean;
  fcColor: string;
  hexColor: string;
}

interface FiltersProps {
    examStatus?: StatusOption[];
    user: AppUser;
    setFilters: Dispatch<SetStateAction<unknown>>;
}

const colourStyles: StylesConfig<StatusOption, true> = {
  control: (styles) => ({ ...styles, backgroundColor: 'white' }),
  option: (styles, { data, isDisabled, isFocused, isSelected }) => {
    const color = chroma(data.hexColor);
    return {
      ...styles,
      backgroundColor: isDisabled
        ? undefined
        : isSelected
        ? data.hexColor
        : isFocused
        ? color.alpha(0.1).css()
        : undefined,
      color: isDisabled
        ? '#ccc'
        : isSelected
        ? chroma.contrast(color, 'white') > 2
          ? 'white'
          : 'black'
        : data.hexColor,
      cursor: isDisabled ? 'not-allowed' : 'default',

      ':active': {
        ...styles[':active'],
        backgroundColor: !isDisabled
          ? isSelected
            ? data.hexColor
            : color.alpha(0.3).css()
          : undefined,
      },
    };
  },
  multiValue: (styles, { data }) => {
    const color = chroma(data.hexColor);
    return {
      ...styles,
      backgroundColor: color.alpha(0.1).css(),
    };
  },
  multiValueLabel: (styles, { data }) => ({
    ...styles,
    color: data.hexColor,
  }),
  multiValueRemove: (styles, { data }) => ({
    ...styles,
    color: data.hexColor,
    ':hover': {
      backgroundColor: data.hexColor,
      color: 'white',
    },
  }),
};

export function Filters({ examStatus, user, setFilters }: FiltersProps) {
    return (
        <Select
            isMulti
            name="colors"
            options={
                examStatus?.filter(
                    (status) =>
                        !status.needsAdmin || (user.isAdmin && status.needsAdmin)
                )
            }
            className="basic-multi-select z-10"
            classNamePrefix="select"
            placeholder="Filters..."
            onChange={(filters:unknown) => setFilters(filters)}
            styles={colourStyles as StylesConfig}
        />
    )
}