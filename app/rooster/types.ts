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

export interface SolverConfig {
  preference_scale: number;
  multi_task_day_penalty: number;
  repeat_penalty: number;
  no_repeat_penalty: number;
  balance_penalty: number;
  no_repeat_tasks: string[];
}

export interface RosterConfig {
  days: string[];
  task_conflicts: [string, string][];
  max_task_assignments: Record<string, number>;
  pre_assignments: [string, string, string][];
  task_blocks: [string, string, string][];  // [person_id, task_id, day] day="" for all days
  disabled_task_days: Record<string, string[]>;  // {task_id: [days]} — task not scheduled on those days
  solver_config: SolverConfig;
}

export interface RoosterPresets {
  [presetName: string]: RosterConfig;
}

export type Schedule = Record<string, Record<string, string[]>>;

export interface RosterResponse {
  schedule: Schedule;
}

export type Step = "input" | "result";
