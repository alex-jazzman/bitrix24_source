/** @module tasks/checklist/view-model/support/src/tree-nav */
jn.define('tasks/checklist/view-model/support/src/tree-nav', (require, exports, module) => {
	/**
	 * @param {ChecklistItemId} rootId
	 * @param {function(ChecklistItemId): Array<{id: ChecklistItemId}>} getDirectChildren
	 * @param {boolean} [deep]
	 * @return {Array<{id: ChecklistItemId}>}
	 */
	const collectDescendants = (rootId, getDirectChildren, deep = false) => {
		const result = [];
		const visited = new Set();

		const traverse = (parentId) => {
			if (visited.has(parentId))
			{
				return;
			}
			visited.add(parentId);

			getDirectChildren(parentId).forEach((child) => {
				result.push(child);
				if (deep)
				{
					traverse(child.id);
				}
			});
		};
		traverse(rootId);

		return result;
	};

	/**
	 * @param {ChecklistItemId} startParentId
	 * @param {ChecklistItemId} checklistId
	 * @param {function(ChecklistItemId): (ChecklistItemId|undefined)} resolveParentId
	 * @return {number}
	 */
	const computeDepth = (startParentId, checklistId, resolveParentId) => {
		let depth = 0;
		let parentId = startParentId;
		const visited = new Set();

		while (parentId && parentId !== checklistId && !visited.has(parentId))
		{
			visited.add(parentId);
			depth += 1;
			parentId = resolveParentId(parentId);
		}

		return depth;
	};

	module.exports = { collectDescendants, computeDepth };
});
