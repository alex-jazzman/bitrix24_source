/**
 * @module call/const/log-type
 */
jn.define('call/const/log-type', (require, exports, module) => {
	const Type = Object.freeze({
		INCOMING: 'incoming',
		OUTGOING: 'outgoing',
	});

	const Status = Object.freeze({
		MISSED: 'missed',
		ANSWERED: 'answered',
	});

	const CallLogType = Object.freeze({ Type, Status });

	module.exports = { CallLogType };
});
