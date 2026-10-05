export type Category = "Cursor" | "Typography" | "Scroll" | "3D" | "WebGL" | "UI" | "Physics";

export type Control = {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  default: number;
  unit?: string;
};

export type Experiment = {
  id: number;
  slug: string;
  title: string;
  short: string;
  description: string;
  category: Category;
  technologies: string[];
  difficulty: "Beginner" | "Intermediate" | "Advanced" | "Experimental";
  performance: "Low" | "Medium" | "High";
  mobile: "Full" | "Limited" | "Desktop recommended";
  accent: string;
  controls: Control[];
  featured?: boolean;
};

export type ControlValues = Record<string, number>;
