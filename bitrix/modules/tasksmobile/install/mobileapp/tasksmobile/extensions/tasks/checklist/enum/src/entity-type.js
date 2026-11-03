/**
 * @module tasks/checklist/enum/src/entity-type
 */
jn.define('tasks/checklist/enum/src/entity-type', (require, exports, module) => {
	const { BaseEnum } = require('utils/enums/base');

	/** @class ChecklistEntityType */
	class ChecklistEntityType extends BaseEnum
	{
		static TASK = new ChecklistEntityType('TASK', 'task');
		static TEMPLATE = new ChecklistEntityType('TEMPLATE', 'template');
		static DOD = new ChecklistEntityType('DOD', 'dod');

		/**
		 * @param {string} value
		 * @return {boolean}
		 */
		static isTask(value)
		{
			return value === this.TASK.getValue();
		}

		static isTemplate(value)
		{
			return value === this.TEMPLATE.getValue();
		}

		static isDod(value)
		{
			return value === this.DOD.getValue();
		}
	}

	module.exports = { ChecklistEntityType };
});
