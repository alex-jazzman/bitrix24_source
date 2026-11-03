/**
 * @module im/messenger/const/attach-file-status
 */
jn.define('im/messenger/const/attach-file-status', (require, exports, module) => {
	const AttachFileStatus = Object.freeze({
		checking: 'checking', // metadata (size) is being resolved, sending is blocked
		valid: 'valid', // file passed client validation
		error: 'error', // file failed client validation, sending is blocked
	});

	module.exports = {
		AttachFileStatus,
	};
});
