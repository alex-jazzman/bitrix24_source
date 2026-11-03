import type { EnvironmentPort } from 'call.engine.transport';

/**
 * Programmable environment. Every signal is injected by hand and nothing is read from the browser:
 * the fake touches neither `navigator` nor `document`, so it needs no page and no way to go offline
 * for real.
 *
 * An `emit...` moves the synchronous read with the event it reports, which is the point of having both
 * on one port: a strategy that asks `isOnline()` from inside its own listener must not see the state
 * the tab had before. Arranging a state a consumer will find on subscribe - a tab that was already
 * hidden - is the job of the `set...` pair, which changes the read and reports nothing.
 *
 * A repeated emit of the same value is delivered as asked: the fake is a programmable primitive, not
 * an adapter that decides which change is worth reporting.
 */
export class FakeEnvironmentPort implements EnvironmentPort
{
	#online: boolean = true;
	#visible: boolean = true;
	#desktop: boolean = false;
	#onlineListeners: Set<(isOnline: boolean) => void> = new Set();
	#visibilityListeners: Set<(isVisible: boolean) => void> = new Set();
	#unloadListeners: Set<() => void> = new Set();

	isOnline(): boolean
	{
		return this.#online;
	}

	subscribeOnlineChange(listener: (isOnline: boolean) => void): () => void
	{
		this.#onlineListeners.add(listener);

		return () => {
			this.#onlineListeners.delete(listener);
		};
	}

	isVisible(): boolean
	{
		return this.#visible;
	}

	subscribeVisibilityChange(listener: (isVisible: boolean) => void): () => void
	{
		this.#visibilityListeners.add(listener);

		return () => {
			this.#visibilityListeners.delete(listener);
		};
	}

	subscribeUnload(listener: () => void): () => void
	{
		this.#unloadListeners.add(listener);

		return () => {
			this.#unloadListeners.delete(listener);
		};
	}

	isDesktop(): boolean
	{
		return this.#desktop;
	}

	/** Sets what `isOnline()` answers without reporting a change. */
	setOnline(isOnline: boolean): void
	{
		this.#online = isOnline;
	}

	/** Sets what `isVisible()` answers without reporting a change. */
	setVisible(isVisible: boolean): void
	{
		this.#visible = isVisible;
	}

	setDesktop(isDesktop: boolean): void
	{
		this.#desktop = isDesktop;
	}

	/** Reports the new state and moves `isOnline()` with it: the predicate and the event never disagree. */
	emitOnlineChange(isOnline: boolean): void
	{
		this.#online = isOnline;

		// a snapshot, so a listener may unsubscribe from inside its own call
		[...this.#onlineListeners].forEach((listener) => listener(isOnline));
	}

	/** Reports the new visibility and moves `isVisible()` with it. */
	emitVisibilityChange(isVisible: boolean): void
	{
		this.#visible = isVisible;

		[...this.#visibilityListeners].forEach((listener) => listener(isVisible));
	}

	/** Carries no state, exactly as the port promises: there is nothing to read back afterwards. */
	emitUnload(): void
	{
		[...this.#unloadListeners].forEach((listener) => listener());
	}

	/** Zero after every unsubscribe function has been called: the proof that a consumer let go. */
	getOnlineSubscriberCount(): number
	{
		return this.#onlineListeners.size;
	}

	getVisibilitySubscriberCount(): number
	{
		return this.#visibilityListeners.size;
	}

	getUnloadSubscriberCount(): number
	{
		return this.#unloadListeners.size;
	}
}
