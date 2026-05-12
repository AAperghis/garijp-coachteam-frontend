import type { PersonInput, TaskInput, RosterConfig } from "./types";

export const DEFAULT_TASKS: TaskInput[] = [
  { id: "corvee", name: "Corvee", preferred_people: 3, min_people: 2 },
  { id: "bar", name: "Bar", preferred_people: 1, min_people: 1 },
  { id: "water", name: "Water", preferred_people: 2, min_people: 1 },
  { id: "nacht_wacht", name: "Nacht Wacht", preferred_people: 2, min_people: 2 },
  { id: "theorie_beginner", name: "Theorie Beginner", preferred_people: 1, min_people: 1 },
  { id: "theorie_gevorderd", name: "Theorie Gevorderd", preferred_people: 1, min_people: 1 },
  { id: "avond_programma", name: "Avond programma", preferred_people: 2, min_people: 2 },
];

export const DEFAULT_CONFIG: RosterConfig = {
  days: ["Zondag", "Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag"],
  task_conflicts: [
    ["nacht_wacht", "avond_programma"],
    ["theorie_beginner", "theorie_gevorderd"],
    ["corvee", "avond_programma"],
    ["corvee", "water"],
  ],
  max_task_assignments: {},
  pre_assignments: [],
  task_blocks: [
    // Entertainment doet alleen avondprogramma
    ["ent", "corvee", ""],
    ["ent", "bar", ""],
    ["ent", "water", ""],
    ["ent", "nacht_wacht", ""],
    ["ent", "theorie_beginner", ""],
    ["ent", "theorie_gevorderd", ""],
    // Eigen Groepjes doet geen taken
    ["eigen", "corvee", ""],
    ["eigen", "bar", ""],
    ["eigen", "water", ""],
    ["eigen", "nacht_wacht", ""],
    ["eigen", "theorie_beginner", "Maandag"],
    ["eigen", "theorie_beginner", "Dinsdag"],
    ["eigen", "theorie_beginner", "Woensdag"],
    ["eigen", "theorie_beginner", "Donderdag"],
    ["eigen", "theorie_gevorderd", ""],
    ["eigen", "avond_programma", ""],
  ],
};

export const DEFAULT_PEOPLE: PersonInput[] = [
  { id: "ent", name: "Entertainment", editable: false, task_weights: {"avond_programma": 10} },
  { id: "eigen", name: "Eigen Groepjes", editable: false, task_weights: {"theorie_beginner": 10} },
  { id: "p3", name: "Instructeur 3", editable: true, task_weights: {} },
  { id: "p4", name: "Instructeur 4", editable: true, task_weights: {} },
  { id: "p5", name: "Instructeur 5", editable: true, task_weights: {} },
  { id: "p6", name: "Instructeur 6", editable: true, task_weights: {} },
];
