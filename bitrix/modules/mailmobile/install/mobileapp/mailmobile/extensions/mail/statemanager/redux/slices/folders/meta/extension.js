/**
 * @module mail/statemanager/redux/slices/folders/meta
 */
jn.define('mail/statemanager/redux/slices/folders/meta', (require, exports, module) => {
	const { createEntityAdapter } = require('statemanager/redux/toolkit');

	const sliceName = 'mail:folders';
	const foldersListAdapter = createEntityAdapter();

	module.exports = {
		sliceName,
		foldersListAdapter,
	};
});
