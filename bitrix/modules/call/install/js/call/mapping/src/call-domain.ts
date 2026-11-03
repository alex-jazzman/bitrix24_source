// Domain constants consumed by call.lib.call-manager. This is the single source of
// truth; call.core re-exports these values so legacy behaviour stays 1:1.
export const CallState = Object.freeze({
	Idle: 'Idle',
	Proceeding: 'Proceeding',
	Connected: 'Connected',
	Finished: 'Finished',
});

export const Provider = Object.freeze({
	Plain: 'Plain',
	Bitrix: 'Bitrix',
});

export const CallType = Object.freeze({
	Instant: 1,
	Permanent: 2,
	Large: 3,
});

// Controller lifecycle event names CallManager wires in #buildEngineContext.
export const ControllerEvent = Object.freeze({
	onPromoViewed: 'onPromoViewed',
	onOpenVideoConference: 'onOpenVideoConference',
});
