import { ajax, Event, Text } from 'main.core';

export const POLL_INTERVAL_MS = 5000;
export const MAX_CONSECUTIVE_ERRORS = 5;
export const STATUS_ACTION = 'landing.api.presetemptystate.status';
export const PERMANENT_ERROR_CODES = ['ACCESS_DENIED', 'EXTRANET_IS_NOT_ALLOWED'];
// the component template marks the placeholder container with the window it has left
export const REMAINING_ATTRIBUTE = 'data-preset-empty-state-remaining';

/**
 * Watches the preset empty state placeholder shown on the site list page.
 *
 * While the placeholder is on the screen the observer polls the portal status and reloads the page
 * as soon as the waiting window is over: either the AI feature became available, or the portal is
 * not in the preset waiting state anymore, or the local deadline has expired.
 */
export class PresetEmptyStateObserver
{
	remainingSeconds: number;
	#deadlineTs: number = 0;
	#intervalId: ?number = null;
	#isFinished: boolean = false;
	#isRequestInFlight: boolean = false;
	#isPollingStopped: boolean = false;
	#consecutiveErrorCount: number = 0;

	constructor(options: {remainingSeconds?: ?number} = {})
	{
		this.remainingSeconds = Math.max(0, parseInt(options.remainingSeconds, 10) || 0);
		this.tick = this.tick.bind(this);
	}

	observe(): void
	{
		// the observer lives as a page singleton: once the waiting is over it stays over, otherwise
		// a repeated observe() would revive a finished observer and poll forever
		if (this.#isFinished || this.#intervalId)
		{
			return;
		}

		// the waiting window belongs to the first observe(): a repeated one may restart the timer,
		// but never moves the deadline further away
		if (this.#deadlineTs === 0)
		{
			this.#deadlineTs = Date.now() + this.remainingSeconds * 1000;
		}

		this.#intervalId = setInterval(this.tick, POLL_INTERVAL_MS);
	}

	stopObserve(): void
	{
		if (this.#intervalId)
		{
			clearInterval(this.#intervalId);
			this.#intervalId = null;
		}
	}

	tick(): void
	{
		// the expired window is the only way out of the placeholder, so it is checked before anything
		// that may skip the tick: neither a hidden tab nor a point that stopped answering may cost
		// the user the reload
		if (Date.now() >= this.#deadlineTs)
		{
			this.finish();

			return;
		}

		// the point is not asked anymore - it keeps failing or refuses for good - but the tick above
		// still owes the reload
		if (this.#isPollingStopped)
		{
			return;
		}

		// a hidden tab waits in silence: nobody looks at the placeholder, so nobody needs the poll.
		// The waiting resumes by itself on the first tick after the tab is looked at again
		if (this.isPageHidden())
		{
			return;
		}

		// a slow answer must not get the next request piled on top of it
		if (this.#isRequestInFlight)
		{
			return;
		}

		this.#isRequestInFlight = true;

		ajax
			.runAction(STATUS_ACTION, { data: {} })
			.then((response) => {
				this.#isRequestInFlight = false;
				this.#consecutiveErrorCount = 0;

				const status = response?.data ?? {};
				if (status.aiAvailable === true || status.actual !== true)
				{
					this.finish();
				}
			})
			.catch((error) => {
				this.#isRequestInFlight = false;
				this.handleRequestError(error);
			});
	}

	isPageHidden(): boolean
	{
		return document.hidden === true;
	}

	handleRequestError(error: mixed): void
	{
		// a permanent refusal never turns into an answer: no access right to the section, an extranet
		// user, an expired session. Asking it to the end of the window is pointless - but only the
		// questions are given up on, never the waiting: the deadline still owes the user the reload.
		// By that time the server is out of the preset window and answers with the usual site list
		// or with the plain access refusal, and either of them is better than a placeholder that
		// stays on the screen until the page is navigated away by hand
		if (this.isPermanentError(error))
		{
			this.stopPolling();

			return;
		}

		// a single network error must not stop the waiting, but a point that keeps failing is not
		// worth the whole window either. Only the requests are given up on here: the network comes
		// back or it does not, and either way the user must leave the placeholder by the deadline
		this.#consecutiveErrorCount += 1;
		if (this.#consecutiveErrorCount >= MAX_CONSECUTIVE_ERRORS)
		{
			this.stopPolling();
		}
	}

	// the questions stop, the waiting does not: the tick stays alive, and the expired window still
	// reloads the page. Both ways out of the polling lead here - the point that keeps failing and
	// the point that refuses for good
	stopPolling(): void
	{
		this.#isPollingStopped = true;
	}

	isPermanentError(error: mixed): boolean
	{
		if (error?.status === 'denied')
		{
			return true;
		}

		const errors = Array.isArray(error?.errors) ? error.errors : [];

		return errors.some((item) => PERMANENT_ERROR_CODES.includes(String(item?.code ?? '')));
	}

	finish(): void
	{
		if (this.#isFinished)
		{
			return;
		}

		this.#isFinished = true;
		this.stopObserve();
		this.reloadPage();
	}

	reloadPage(): void
	{
		document.location.reload();
	}
}

// set on the container once its observer is running, so a repeated bootstrap is a no-op
export const STARTED_ATTRIBUTE = 'data-preset-empty-state-started';

/**
 * Starts the observer over the placeholder rendered by the component template, taking the window
 * left from the container the template marks. The page carries no start-up code of its own, so the
 * markup is the whole contract between the two.
 */
export function bootstrapPresetEmptyState(): ?PresetEmptyStateObserver
{
	const container = document.querySelector(`[${REMAINING_ATTRIBUTE}]`);

	// a second observer over the same placeholder would poll the point twice as often
	if (!container || container.hasAttribute(STARTED_ATTRIBUTE))
	{
		return null;
	}

	container.setAttribute(STARTED_ATTRIBUTE, '');

	const observer = new PresetEmptyStateObserver({
		remainingSeconds: Text.toInteger(container.getAttribute(REMAINING_ATTRIBUTE)),
	});
	observer.observe();

	return observer;
}

Event.ready(bootstrapPresetEmptyState);
