/**
 * @module timeman/const
 */
jn.define('timeman/const', (require, exports, module) => {
	const WorkdayState = Object.freeze({
		NOT_STARTED: 'not_started',
		OPENED: 'opened',
		PAUSED: 'paused',
		CLOSED: 'closed',
		EXPIRED: 'expired',
	});

	module.exports = { WorkdayState };
});
