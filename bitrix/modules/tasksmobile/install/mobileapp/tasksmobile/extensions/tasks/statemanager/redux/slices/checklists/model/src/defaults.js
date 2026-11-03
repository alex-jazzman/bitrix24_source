/** @module tasks/statemanager/redux/slices/checklists/model/src/defaults */
jn.define('tasks/statemanager/redux/slices/checklists/model/src/defaults', (require, exports, module) => {
	const { Loc } = require('loc');

	/**
	 * @param {number} [sortIndex]
	 * @return {string}
	 */
	const buildDefaultChecklistTitle = (sortIndex = 0) => {
		const suffix = sortIndex >= 1 ? ` ${sortIndex + 1}` : '';

		return `${Loc.getMessage('TASKSMOBILE_CHECKLIST_DEFAULT_TITLE')}${suffix}`;
	};

	/**
	 * @return {string}
	 */
	const buildDefaultItemTitle = () => Loc.getMessage('TASKSMOBILE_CHECKLIST_DEFAULT_ITEM_TITLE');

	module.exports = { buildDefaultChecklistTitle, buildDefaultItemTitle };
});
