/**
 * @module tasks/checklist/view-model/support/src/filter
 *
 * @typedef {object} ChecklistFilterDeps
 * @property {number|string} userId
 * @property {Set<ChecklistItemId>} alwaysShow
 * @property {function(ChecklistItemId): ChecklistItemView[]} getChildren
 */
jn.define('tasks/checklist/view-model/support/src/filter', (require, exports, module) => {
	/**
	 * @param {(item: ChecklistItemView) => boolean} callback
	 * @param {ChecklistItemView} item
	 * @param {function(ChecklistItemId): ChecklistItemView[]} getChildren
	 * @return {boolean}
	 */
	const filterCondition = (callback, item, getChildren) => {
		const hasMatchingChild = getChildren(item.getId()).some((descendant) => callback(descendant));

		return hasMatchingChild || callback(item);
	};

	/**
	 * @param {ChecklistItemView} item
	 * @param {ChecklistFilterDeps} deps
	 * @return {boolean}
	 */
	const shouldShowMine = (item, { userId, alwaysShow, getChildren }) => {
		if (alwaysShow.has(item.getId()))
		{
			return true;
		}

		const targetUserId = Number(userId);
		// a member id from V2 may come as a string - compare as numbers, otherwise the filter won't match
		const check = (checkItem) => checkItem.getMembers().some((member) => Number(member.id) === targetUserId);

		return filterCondition(check, item, getChildren);
	};

	/**
	 * @param {ChecklistItemView} item
	 * @param {ChecklistFilterDeps} deps
	 * @return {boolean}
	 */
	const shouldShowCompleted = (item, { getChildren }) => filterCondition(
		(checkItem) => !checkItem.isComplete(),
		item,
		getChildren,
	);

	/**
	 * @param {ChecklistItemView[]} allItems
	 * @param {ChecklistConditions} conditions
	 * @param {ChecklistFilterDeps} deps
	 * @return {ChecklistItemView[]}
	 */
	const computeVisible = (allItems, conditions, deps) => {
		const { onlyMine, hideCompleted } = conditions || {};

		if (!onlyMine && !hideCompleted)
		{
			return allItems;
		}

		return allItems.filter((item) => {
			if (item.isRoot() || deps.alwaysShow.has(item.getId()))
			{
				return true;
			}

			const conditionOnlyMine = shouldShowMine(item, deps);
			const conditionHideCompleted = shouldShowCompleted(item, deps);

			if (onlyMine && hideCompleted)
			{
				return conditionOnlyMine && conditionHideCompleted;
			}

			if (onlyMine)
			{
				return conditionOnlyMine;
			}

			if (hideCompleted)
			{
				return conditionHideCompleted;
			}

			return true;
		});
	};

	module.exports = { computeVisible, shouldShowMine, shouldShowCompleted };
});
