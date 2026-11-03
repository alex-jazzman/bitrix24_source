import type { EnvironmentPort } from '../environment-port';

/**
 * Event target of the host, declared here and injected like every other primitive of this directory.
 * A listener takes nothing: the adapter never hands a platform event object to a consumer.
 */
export type EnvironmentEventTarget = {
	addEventListener(type: string, listener: () => void): void,
	removeEventListener(type: string, listener: () => void): void,
};

/** The document: the visibility reading and the event it changes with come from the same object. */
export type VisibilityPrimitive = EnvironmentEventTarget & {
	visibilityState: string,
};

/** The navigator: the network reading. */
export type NetworkStatePrimitive = {
	onLine: boolean,
};

/**
 * Whether the code runs inside the desktop application. Injected as a predicate rather than read from
 * the desktop adapter of the module: that extension carries the messenger desktop library behind it,
 * and the transport subtree owes nothing to the messenger. Which primitive answers the question is
 * settled by the composition root, and the port stays constructible without any of it.
 */
export type DesktopPredicate = () => boolean;

export type BrowserEnvironmentPortOptions = {
	/** The window: the online pair and the unload events are fired at it. */
	pageEvents: EnvironmentEventTarget,
	/** The document: `visibilitychange` is fired at it, not at the window. */
	page: VisibilityPrimitive,
	network: NetworkStatePrimitive,
	isDesktop: DesktopPredicate,
};

const ONLINE_EVENT = 'online';
const OFFLINE_EVENT = 'offline';
const VISIBILITY_EVENT = 'visibilitychange';

/**
 * The one name a departure is heard by. `pagehide` covers every real one, a page frozen into the
 * back/forward cache included, and does not take a page out of that cache.
 *
 * `unload` is left out because a page that registers it is barred from that cache everywhere, and this
 * subscription is put in place for every call. `beforeunload` is left out for a reason of its own: it
 * fires on the intent to leave, so a navigation cancelled in the dialog of the browser or by another
 * handler leaves the page alive with the connection already closed - and a closed one cannot be
 * reopened. Part of the browsers, Firefox among them, bar a page carrying it from the cache on top of
 * that.
 *
 * A `pagehide` with `persisted` set is a freeze rather than a departure, and reporting it as terminal
 * is deliberate: a media connection does not survive a freeze either. The port reads no flag of the
 * event - by its contract a listener is never handed the event object at all.
 */
const UNLOAD_EVENTS = ['pagehide'];

/** A page that is prerendered is not visible, so the state is compared against the visible one. */
const VISIBLE_STATE = 'visible';

/**
 * `EnvironmentPort` over the signals of the browser. Each subscription turns the event names of the
 * host into the state the port promises - a listener is told the new value and never sees an event
 * object - and every unsubscribe function detaches what it attached, both listeners of a pair
 * included.
 *
 * A departure is forwarded as it comes, without remembering the first one: closing a connection is
 * idempotent, so a repeat costs nothing, while a page restored from the back/forward cache and left
 * again would otherwise have its second departure swallowed.
 *
 * Nothing is decided here: whether a regained network starts a reconnect and whether a hidden page
 * stops a ping is the policy of the caller.
 */
export class BrowserEnvironmentPort implements EnvironmentPort
{
	#pageEvents: EnvironmentEventTarget;
	#page: VisibilityPrimitive;
	#network: NetworkStatePrimitive;
	#isDesktop: DesktopPredicate;

	constructor(options: BrowserEnvironmentPortOptions)
	{
		this.#pageEvents = options.pageEvents;
		this.#page = options.page;
		this.#network = options.network;
		this.#isDesktop = options.isDesktop;
	}

	isOnline(): boolean
	{
		return this.#network.onLine;
	}

	subscribeOnlineChange(listener: (isOnline: boolean) => void): () => void
	{
		const onOnline = (): void => {
			listener(true);
		};
		const onOffline = (): void => {
			listener(false);
		};

		this.#pageEvents.addEventListener(ONLINE_EVENT, onOnline);
		this.#pageEvents.addEventListener(OFFLINE_EVENT, onOffline);

		return () => {
			this.#pageEvents.removeEventListener(ONLINE_EVENT, onOnline);
			this.#pageEvents.removeEventListener(OFFLINE_EVENT, onOffline);
		};
	}

	isVisible(): boolean
	{
		return this.#page.visibilityState === VISIBLE_STATE;
	}

	subscribeVisibilityChange(listener: (isVisible: boolean) => void): () => void
	{
		// the event carries no state, so the new value is the one the reading answers now
		const onVisibilityChange = (): void => {
			listener(this.isVisible());
		};

		this.#page.addEventListener(VISIBILITY_EVENT, onVisibilityChange);

		return () => {
			this.#page.removeEventListener(VISIBILITY_EVENT, onVisibilityChange);
		};
	}

	subscribeUnload(listener: () => void): () => void
	{
		const onUnload = (): void => {
			listener();
		};

		UNLOAD_EVENTS.forEach((eventName) => this.#pageEvents.addEventListener(eventName, onUnload));

		return () => {
			UNLOAD_EVENTS.forEach((eventName) => this.#pageEvents.removeEventListener(eventName, onUnload));
		};
	}

	isDesktop(): boolean
	{
		return this.#isDesktop();
	}
}
