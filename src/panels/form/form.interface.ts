interface IFormField {
  name: string;
  label: string;
  value?: string;
}

interface IFormOptions {
  title?: string;
  fields: IFormField[];
  onSubmit(data: Record<string, string>): void;
}
