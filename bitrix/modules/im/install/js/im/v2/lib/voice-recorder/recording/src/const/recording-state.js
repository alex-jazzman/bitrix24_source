export const RecordingState = {
	idle: 'idle',
	requesting: 'requesting',
	recording: 'recording',
	paused: 'paused',
	stopped: 'stopped',
	error: 'error',
};

// a stop nobody asked for: the recorded fragment stays ready, the panel explains what interrupted it
export const RecordingStopReason = {
	otherTab: 'otherTab',
	callStarted: 'callStarted',
	durationLimit: 'durationLimit',
};

// each code is fixed in a different place, so each one gets a text of its own in the panel
export const RecordingErrorCode = {
	accessDeniedInSession: 'accessDeniedInSession',
	accessDeniedPermanently: 'accessDeniedPermanently',
	deviceNotFound: 'deviceNotFound',
	deviceBusy: 'deviceBusy',
	accessDeniedBySystem: 'accessDeniedBySystem',
};
