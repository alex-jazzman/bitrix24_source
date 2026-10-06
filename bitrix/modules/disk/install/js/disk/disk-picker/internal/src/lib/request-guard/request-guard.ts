// Monotonic token guard that keeps only the newest request authoritative.
//
// A picker session issues a fresh token for every request and, when the answer
// arrives, checks whether that token is still the last one. A stale answer (a
// newer request already started) is dropped silently: it must not touch a model
// and must not clear a loading indicator, because the newer request still owns
// it. When the session starts closing, `invalidate()` retires every token, so
// any late answer - success or error - is ignored without touching models,
// notifications or public callbacks.
//
// The guard is pure: it knows nothing about models or transport. Cancelling the
// underlying request is an optional optimisation; correctness relies only on the
// token check.
export class RequestGuard
{
	#current: number = 0;
	#invalidated: boolean = false;

	next(): number
	{
		this.#current += 1;

		return this.#current;
	}

	isCurrent(token: number): boolean
	{
		return !this.#invalidated && token === this.#current;
	}

	// True while the session is open, regardless of the token. Independent
	// requests (e.g. the sources sidebar) must not be discarded by a newer
	// main-feed request, only by session close.
	isActive(): boolean
	{
		return !this.#invalidated;
	}

	invalidate(): void
	{
		this.#invalidated = true;
	}
}
