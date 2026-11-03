export function isSameTaskId(taskId: number | string, currentTaskId: number | string): boolean
{
	return String(taskId) === String(currentTaskId);
}
