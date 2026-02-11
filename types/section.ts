export type Section = {
    id: number;
    code: string;
    name: string;
}

export type FormattedSection = {
  value: number;
  label: string;
  section: {
    id: number;
    code: string;
    name: string;
  }
};