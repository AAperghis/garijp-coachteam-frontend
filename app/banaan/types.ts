export interface CursistInput {
  id?: number | null;
  name: string;
  discipline: string;
  instructor: string;
  wants_banana: boolean;
  cwo: number;
  age: number;
  friends: string[] | null;
}

export interface InstructorInput {
  id?: number | null;
  name: string;
  discipline: string;
  cwo: number;
  transport_capacity: number;
  cover_capacity: number;
}

export interface ConfigInput {
  boat_capacity: number;
  slot_duration_min: number;
  transit_slots: number;
  prep_slots: number;
  start_time: string;
  end_time: string;
  weights: Record<string, number>;
}

export interface RideOutput {
  slot: number;
  time: string;
  cursists: string[];
  count: number;
  transport_instructors: string[];
  cursist_transport: Record<string, string>;
}

export interface ScheduleCell {
  state: string;
  detail: string;
}

export interface BanaanResponse {
  rides: RideOutput[];
  total_rides: number;
  total_banana_cursists: number;
  times: string[];
  instructor_timeline: Record<string, ScheduleCell[]>;
  cursist_timeline: Record<string, ScheduleCell[]>;
}

export type Step = "upload" | "preview" | "result";
