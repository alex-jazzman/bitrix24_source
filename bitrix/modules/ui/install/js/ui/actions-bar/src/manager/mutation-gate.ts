/**
 * Wraps a MutationObserver with a `pause(fn)` helper that suppresses
 * self-triggered notifications while we mutate the DOM ourselves.
 */
export class MutationGate
{
	#observer: MutationObserver;
	#target: Node;
	#options: MutationObserverInit;
	constructor(target: Node, options: MutationObserverInit, callback: MutationCallback)
	{
		this.#target = target;
		this.#options = options;
		this.#observer = new MutationObserver(callback);
		this.#observer.observe(target, options);
	}

	pause(fn: () => void): void
	{
		this.#observer.disconnect();
		try
		{
			fn();
		}
		finally
		{
			this.#observer.observe(this.#target, this.#options);
		}
	}
}
