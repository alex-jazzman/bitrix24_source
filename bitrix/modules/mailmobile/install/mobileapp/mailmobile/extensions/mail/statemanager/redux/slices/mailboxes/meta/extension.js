/**
 * @module mail/statemanager/redux/slices/mailboxes/meta
 */
jn.define('mail/statemanager/redux/slices/mailboxes/meta', (require, exports, module) => {
	const { createEntityAdapter } = require('statemanager/redux/toolkit');

	const sliceName = 'mail:mailboxes';
	const mailboxesListAdapter = createEntityAdapter();

	module.exports = {
		sliceName,
		mailboxesListAdapter,
	};
});
