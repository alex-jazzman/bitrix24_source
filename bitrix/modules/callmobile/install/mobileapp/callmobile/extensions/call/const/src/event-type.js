/**
 * @module call/const/event-type
 */
jn.define('call/const/event-type', (require, exports, module) => {
	const EventType = Object.freeze({
		imMobile: {
			activeCallsReceived: 'ImMobile.CallManager:activeCallsReceived',
			updateCallToken: 'ImMobile.CallManager:updateCallToken',
			setCurrentUser:  'ImMobile.CallManager:setCurrentUser',
			guestIdentified: 'ImMobile.CallManager:guestIdentified',
		},
		callMobile: {
			chatUserChanged: 'CallMobile.CallManager:chatUserChanged',
		},
	});

	module.exports = { EventType };
});
