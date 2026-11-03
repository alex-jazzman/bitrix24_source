// whether a call goes on is answered by the call manager; these only tell when to ask it again
export const CallEventName = {
	incomingCall: 'CallEvents::incomingCall',
	callCreated: 'CallEvents::callCreated',
	callLeft: 'BX.Call.Controller:onCallLeft',
	callDestroyed: 'BX.Call.Controller:onCallDestroyed',
};

// a call takes the microphone for itself, and it starts both ways: the one the user answers and the
// one they place themselves
export const CALL_START_EVENTS = [CallEventName.incomingCall, CallEventName.callCreated];

export const CALL_STATE_EVENTS = Object.values(CallEventName);
