export interface StudentInput {
  name: string;
  discipline: string;
  instructor: string;
  wants_banana: boolean;
  friend: string | null;
}

export interface InstructorInput {
  name: string;
  discipline: string;
  transport_capacity: number;
}

export interface ConfigInput {
  boat_capacity: number;
  slot_duration_min: number;
  prep_time_min: number;
  transport_time_min: number;
  start_time: string;
  end_time: string;
  weights: Record<string, number>;
}

export interface GroupOutput {
  index: number;
  slot: number;
  time: string;
  phase: number;
  students: string[];
  disciplines: string[];
  transport_instructor: string | null;
}
// ToDo Fix! These are incorrect in the backend
export interface RideOutput {
  slot: number;
  time: string;
  students: string[];
  count: number;
  transport_instructors: string | null;
}

export interface BanaanResponse {
  rides: RideOutput[];
  total_rides: number;
  total_banana_students: number;
}

export type Step = "upload" | "preview" | "result";
