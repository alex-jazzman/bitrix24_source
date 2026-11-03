/** @module tasks/checklist/view-model/support/src/rights */
jn.define('tasks/checklist/view-model/support/src/rights', (require, exports, module) => {
	const { ChecklistEntityType } = require('tasks/checklist/enum');

	const MAX_INDENT_DEPTH = 5;

	/**
	 * @param {ChecklistEntityContext} context
	 * @return {boolean}
	 */
	const canAdd = (context) => context?.canAddChecklist !== false;

	/**
	 * @param {ChecklistEntityContext} context
	 * @param {number|null} rootCreatedBy
	 * @return {boolean}
	 */
	const canEdit = (context, rootCreatedBy) => {
		if (ChecklistEntityType.isDod(context?.entityType))
		{
			return false;
		}

		return context?.canEditChecklist !== false || rootCreatedBy === context?.userId;
	};

	/**
	 * @param {ChecklistItemActions} [actions]
	 * @return {boolean}
	 */
	const canRemove = (actions) => Boolean(actions?.remove);

	/**
	 * @param {ChecklistItemActions} [actions]
	 * @return {boolean}
	 */
	const canToggle = (actions) => Boolean(actions?.toggle);

	/**
	 * @param {number} depth
	 * @param {boolean} hasPrevSibling
	 * @return {boolean}
	 */
	const canIndent = (depth, hasPrevSibling) => depth <= MAX_INDENT_DEPTH && Boolean(hasPrevSibling);

	/**
	 * @param {number} depth
	 * @return {boolean}
	 */
	const canOutdent = (depth) => Boolean(depth);

	module.exports = { canAdd, canEdit, canRemove, canToggle, canIndent, canOutdent };
});
