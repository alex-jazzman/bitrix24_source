/** @module tasks/layout/checklist/presenter */
jn.define('tasks/layout/checklist/presenter', (require, exports, module) => {
	const ItemPresenter = require('tasks/layout/checklist/presenter/src/item-presenter');
	const ChecklistPresenter = require('tasks/layout/checklist/presenter/src/checklist-presenter');

	module.exports = { ItemPresenter, ChecklistPresenter };
});
