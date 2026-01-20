/**
 * @module mail/statemanager/redux/slices/messages/meta
 */
jn.define('mail/statemanager/redux/slices/messages/meta', (require, exports, module) => {
	const { createEntityAdapter } = require('statemanager/redux/toolkit');

	const sliceName = 'mail:messages';
	const messagesListAdapter = createEntityAdapter();

	module.exports = {
		sliceName,
		messagesListAdapter,
	};
});
