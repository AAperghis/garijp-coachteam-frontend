export interface StudentInput {
  name: string;
  discipline: string;
  instructor: string;
  wants_banana: boolean;
  cwo: number;
  age: number;
  friends: string[] | null;
}

export interface InstructorInput {
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
  students: string[];
  count: number;
  transport_instructors: string[];
  student_transport: Record<string, string>;
}

export interface ScheduleCell {
  state: string;
  detail: string;
}

export interface BanaanResponse {
  rides: RideOutput[];
  total_rides: number;
  total_banana_students: number;
  times: string[];
  instructor_timeline: Record<string, ScheduleCell[]>;
  student_timeline: Record<string, ScheduleCell[]>;
}

export type Step = "upload" | "preview" | "result";
