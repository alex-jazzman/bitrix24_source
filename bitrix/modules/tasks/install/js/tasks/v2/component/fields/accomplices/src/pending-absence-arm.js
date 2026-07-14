// Handoff of absence userIds loaded by the chip flow to the freshly mounted
// Accomplices field. The chip and the field are two alternate representations
// of the same field and never coexist, so the loaded promise is parked by
// taskId and consumed once the field mounts. This keeps arming per-instance
// instead of relying on the store-wide `Model.Absences.fetching` flag.
const pendingByTaskId: Map<number | string, Promise<number[]>> = new Map();

export function registerPendingAbsenceArm(taskId: number | string, promise: Promise<number[]>): void
{
	pendingByTaskId.set(taskId, promise);
}

export function consumePendingAbsenceArm(taskId: number | string): Promise<number[]> | null
{
	const promise = pendingByTaskId.get(taskId) ?? null;
	pendingByTaskId.delete(taskId);

	return promise;
}
