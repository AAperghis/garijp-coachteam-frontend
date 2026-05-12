export const DISCIPLINES = [
  "ws",
  "cat",
  "jz",
  "kb",
] as const;

export type Discipline = (typeof DISCIPLINES)[number];
