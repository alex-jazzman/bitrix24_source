export class RequestRevisionGuard
{
	#revisions: Map<number, number> = new Map();

	next(entityId: number): number
	{
		const nextRevision = (this.#revisions.get(entityId) ?? 0) + 1;
		this.#revisions.set(entityId, nextRevision);

		return nextRevision;
	}

	isActual(entityId: number, revision: number): boolean
	{
		return this.#revisions.get(entityId) === revision;
	}
}
