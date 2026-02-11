export type AcademicYear = {
  id: number;
  code: string;
  name: string;
};

export type FormattedAcademicYear = {
  value: number;
  label: string;
  academicYear: {
    id: number;
    code: string;
    name: string;
  }
};