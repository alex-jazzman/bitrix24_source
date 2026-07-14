/**
 * @module call/const
 */
jn.define('call/const', (require, exports, module) => {
	const { Analytics } = require('call/const/analytics');
	const { EventType } = require('call/const/event-type');
	const { DialogType } = require('call/const/dialog-type');
	const { CallLogType } = require('call/const/log-type');
	const { ConnectionType } = require('call/const/connection-type');
	const { RecordStatus } = require('call/const/record-status');
	const { CallError } = require('call/const/call-error');
	const { CallStatus } = require('call/const/call-status');
	const { CallPresence } = require('call/const/call-presence');

	module.exports = {
		Analytics,
		EventType,
		DialogType,
		CallLogType,
		ConnectionType,
		RecordStatus,
		CallError,
		CallStatus,
		CallPresence,
	};
});
