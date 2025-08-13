export type Field = {
  key: string;
  label: string;
  type: 'text' | 'checkbox';
  required?: boolean;
  placeholder?: string;
  validation?: { regex: string; message: string };
};

export type Step = {
  key: string;
  title: string;
  fields: Field[];
  actions: { key: string; label: string; endpoint: string }[];
};

export type Schema = {
  meta: { title: string; version: string; source: string };
  steps: Step[];
};
