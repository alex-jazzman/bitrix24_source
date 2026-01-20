export type TaskId = number | string;

export const idUtils = new class
{
	isReal(taskId: TaskId): boolean
	{
		const id = this.isTemplate(taskId) ? this.unbox(taskId) : taskId;

		return Number.isInteger(id) && id > 0;
	}

	isTemplate(id: TaskId): boolean
	{
		return String(id).startsWith('template');
	}

	boxTemplate(id: TaskId): string
	{
		return `template${id}`;
	}

	unbox(id: TaskId): TaskId
	{
		const idPure = String(id).replace('template', '');

		return Number(idPure) || idPure;
	}
}();
