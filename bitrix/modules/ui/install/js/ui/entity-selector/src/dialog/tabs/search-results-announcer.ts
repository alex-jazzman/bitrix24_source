import { LiveAnnouncer } from 'ui.a11y';

/**
 * Coalesces search-results announcements bound to a single dialog.
 *
 * The global {@link LiveAnnouncer} drains its polite queue slowly (up to 4s per
 * item), while search runs on a short debounce. Announcing every finished search
 * directly would let the queue outrun its own processing and read out stale
 * counts after the query changed or the dialog closed. This helper keeps only
 * the last pending message and hands a single value to the announcer once typing
 * settles; {@link SearchResultsAnnouncer#cancel} drops the pending announcement
 * when the dialog is hidden or destroyed.
 */
export class SearchResultsAnnouncer
{
	#delay: number;
	#timerId: ReturnType<typeof setTimeout> | null = null;
	#pendingMessage: string | null = null;

	constructor(delay: number = 500)
	{
		this.#delay = delay;
	}

	announce(message: string): void
	{
		this.#pendingMessage = message;

		if (this.#timerId !== null)
		{
			clearTimeout(this.#timerId);
		}

		this.#timerId = setTimeout(() => {
			this.#flush();
		}, this.#delay);
	}

	cancel(): void
	{
		if (this.#timerId !== null)
		{
			clearTimeout(this.#timerId);
			this.#timerId = null;
		}

		this.#pendingMessage = null;
	}

	#flush(): void
	{
		this.#timerId = null;
		const message = this.#pendingMessage;
		this.#pendingMessage = null;

		if (message !== null)
		{
			LiveAnnouncer.announce(message);
		}
	}
}
