/**
 * Whom the current cycle of the key belongs to. The physical key is one for the whole zone, so the
 * adapters of both documents share one instance: a cycle can start in the call window and end in
 * the Picture-in-Picture window, and a flag of its own would stay raised in the document that never
 * saw the release - swallowing the release of the next cycle.
 */
export class KeyCycleOwnership
{
	#foreign: boolean = false;

	begin(foreign: boolean): void
	{
		this.#foreign = foreign;
	}

	end(): void
	{
		this.#foreign = false;
	}

	isForeign(): boolean
	{
		return this.#foreign;
	}
}
