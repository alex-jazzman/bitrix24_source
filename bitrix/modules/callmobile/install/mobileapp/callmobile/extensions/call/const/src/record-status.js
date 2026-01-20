/**
 * @module call/const/record-status
 */
jn.define('call/const/record-status', (require, exports, module) => {
	const RecordStatus = Object.freeze({
		2: 'started',
		3: 'stopped',
		4: 'paused',
	});

	module.exports = { RecordStatus };
});
