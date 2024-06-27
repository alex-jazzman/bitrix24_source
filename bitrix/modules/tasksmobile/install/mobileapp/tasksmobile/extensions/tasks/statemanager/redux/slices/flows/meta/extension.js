/**
 * @module tasks/statemanager/redux/slices/flows/meta
 */
jn.define('tasks/statemanager/redux/slices/flows/meta', (require, exports, module) => {
	const { createEntityAdapter } = require('statemanager/redux/toolkit');

	const sliceName = 'tasks:flows';
	const entityAdapter = createEntityAdapter({});

	module.exports = {
		sliceName,
		entityAdapter,
	};
});
