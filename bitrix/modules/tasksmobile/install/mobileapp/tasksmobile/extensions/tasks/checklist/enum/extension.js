/**
 * @module tasks/checklist/enum
 */
jn.define('tasks/checklist/enum', (require, exports, module) => {
	const { ChecklistEntityType } = require('tasks/checklist/enum/src/entity-type');
	const { ChecklistMemberType } = require('tasks/checklist/enum/src/member-type');

	module.exports = {
		ChecklistEntityType,
		ChecklistMemberType,
	};
});
