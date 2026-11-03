// Native call-lifecycle event names used to (un)subscribe a call instance.
export type CallLifecycleEventNames = {
	onJoin: string,
	onLeave: string,
	onDestroy: string,
};

// Opaque legacy call instance from call.core; typed as Object until call.core is TS.
export type LegacyCallInstance = Object;

// Handler for a call-lifecycle event (onJoin/onLeave/onDestroy).
export type CallEventHandler = (event: unknown) => void;

// Identity fields of a raw active call as it comes from a server snapshot: enough to tell the
// engines apart and to look the call up in the engine's finished guard.
export type RawCallIdentity = {
	ID?: string | number,
	UUID?: string,
	PROVIDER?: string,
	SCHEME?: unknown,
};

// Instantiates a call instance from raw server data (legacy vs new scheme).
export interface CallInstantiator
{
	isLegacyCall(provider: string | undefined, scheme: unknown): boolean;
	// Whether the call is already finished on this tab. A `Call::finish` may arrive while an
	// active-calls snapshot is in flight, and re-instantiating such a call would resurrect its
	// card with no later event to tear it down. Each engine keys its own guard: the modern one
	// by UUID, the legacy one by numeric call id.
	isFinished(call: RawCallIdentity): boolean;
	instantiate(call: LegacyCallInstance | undefined, callToken: unknown, logToken: unknown, userData: Object | undefined): LegacyCallInstance;
	instantiateLegacy(
		call: LegacyCallInstance | undefined,
		users: unknown,
		logToken: unknown,
		connectionData: unknown,
		userData: unknown,
	): LegacyCallInstance;
}

// Recent-calls source port: what RecentCallsSync needs from the active engine —
// instantiate a call and (un)subscribe to its lifecycle. Legacy engine backs it
// with call.core; CoreCallEngine provides a no-op implementation.
export interface RecentCallsSource
{
	callEvent: CallLifecycleEventNames;
	instantiator: CallInstantiator;
	addCallListener(call: LegacyCallInstance, event: string, handler: CallEventHandler): void;
	removeCallListener(call: LegacyCallInstance, event: string, handler: CallEventHandler): void;
}
