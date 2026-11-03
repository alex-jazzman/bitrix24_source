/**
 * Signals of the environment a connection lives in, each with a synchronous read of the state it
 * reports. The read is not a convenience: a strategy asks "is there a network right now?" before it
 * decides, and a consumer that only subscribed would have to assume an initial value - which is the
 * bug of a tab that was already hidden, or already offline, by the time it subscribed.
 *
 * Decides nothing: whether a regained network starts a reconnect, and whether a hidden tab stops the
 * ping, is the policy of the caller.
 */
export interface EnvironmentPort
{
	/** Whether the network is up right now. */
	isOnline(): boolean;

	/**
	 * Reports the new state, so the consumer keeps no copy of it - one subscription rather than an
	 * online/offline pair. Returns the unsubscribe function.
	 */
	subscribeOnlineChange(listener: (isOnline: boolean) => void): () => void;

	/** Whether the page is visible right now. */
	isVisible(): boolean;

	/** Reports the new visibility. Returns the unsubscribe function. */
	subscribeVisibilityChange(listener: (isVisible: boolean) => void): () => void;

	/**
	 * The page is going away - the last moment to close a connection. Carries no state: there is
	 * nothing left to read back afterwards. Returns the unsubscribe function.
	 */
	subscribeUnload(listener: () => void): () => void;

	/**
	 * Whether the code runs inside the desktop application. Synchronous, because it answers about an
	 * environment that is already what it is; how that is found out belongs to the adapter.
	 */
	isDesktop(): boolean;
}
