import type { PersonInput } from "./types";
import { WAL_ALLOWED_TASKS } from "./defaults";

export const ENTERTAINMENT_LABEL = "Entertainment";
const ENTERTAINMENT_ID = "ent";

/**
 * Names for a task cell. On tasks Wal staff may do (avond_programma), every Wal
 * person — and the Entertainment pseudo-person — collapses into one
 * "Entertainment" entry, listed first.
 */
export function formatAssignees(
  ids: string[],
  taskId: string,
  people: PersonInput[],
  groupOf: (discipline: string) => string,
): string {
  const collapse = WAL_ALLOWED_TASKS.includes(taskId);
  const names: string[] = [];
  let hasEntertainment = false;
  for (const id of ids) {
    const p = people.find((x) => x.id === id);
    const isWal =
      id === ENTERTAINMENT_ID || (!!p?.discipline && groupOf(p.discipline) === "wal");
    if (collapse && isWal) {
      hasEntertainment = true;
      continue;
    }
    names.push(p?.name || id);
  }
  if (hasEntertainment) names.unshift(ENTERTAINMENT_LABEL);
  return names.join(", ");
}
