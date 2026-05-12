export interface PersonInput {
  id: string;
  name: string;
  task_weights: Record<string, number>;
  editable?: boolean;
}

export interface TaskInput {
  id: string;
  name: string;
  preferred_people: number;
  min_people: number;
}

export interface RosterConfig {
  days: string[];
  task_conflicts: [string, string][];
  max_task_assignments: Record<string, number>;
  pre_assignments: [string, string, string][];
  task_blocks: [string, string, string][];  // [person_id, task_id, day] day="" for all days
}

export type Schedule = Record<string, Record<string, string[]>>;

export interface RosterResponse {
  schedule: Schedule;
}

export type Step = "input" | "result";
