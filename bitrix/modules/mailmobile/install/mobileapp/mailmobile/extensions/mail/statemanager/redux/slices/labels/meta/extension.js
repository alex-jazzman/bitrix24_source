/**
 * @module mail/statemanager/redux/slices/labels/meta
 */
jn.define('mail/statemanager/redux/slices/labels/meta', (require, exports, module) => {
	const { createEntityAdapter } = require('statemanager/redux/toolkit');

	const sliceName = 'mail:labels';
	const labelsListAdapter = createEntityAdapter();

	module.exports = {
		sliceName,
		labelsListAdapter,
	};
});
