/**
 * Coalesces calls into a single rAF tick. A second `request` while one is
 * already pending is dropped.
 */
export class RafGate
{
	#pendingId: number | null = null;

	request(fn: () => void): void
	{
		if (this.#pendingId !== null)
		{
			return;
		}

		this.#pendingId = requestAnimationFrame(() => {
			this.#pendingId = null;
			fn();
		});
	}
}
