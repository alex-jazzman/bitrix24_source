/**
 * @module tasks/checklist/utils
 */
jn.define('tasks/checklist/utils', (require, exports, module) => {
	const { openChecklistWithPreparedData } = require('tasks/checklist/utils/src/open');

	module.exports = {
		openChecklistWithPreparedData,
	};
});
