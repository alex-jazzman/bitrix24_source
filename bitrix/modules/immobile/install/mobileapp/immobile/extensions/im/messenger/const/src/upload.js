/**
 * @module im/messenger/const/upload
 */
jn.define('im/messenger/const/upload', (require, exports, module) => {

	const UploaderClientEvent = Object.freeze({
		create: 'create',
		start: 'start',
		progress: 'progress',
		done: 'done',
		error: 'error',
	});

	module.exports = { UploaderClientEvent };
});
