/** @module tasks/statemanager/redux/slices/checklists/model/src/completion */
jn.define('tasks/statemanager/redux/slices/checklists/model/src/completion', (require, exports, module) => {
	/**
	 * @param {ChecklistItemReduxModel[]} items
	 * @param {ChecklistItemId} toggledId
	 * @param {boolean} isComplete
	 * @return {ChecklistItemId[]}
	 */
	const collectCompletionCascade = (items, toggledId, isComplete) => {
		const byId = new Map(items.map((item) => [item.id, item]));
		const childrenByParent = new Map();
		items.forEach((item) => {
			if (!childrenByParent.has(item.parentId))
			{
				childrenByParent.set(item.parentId, []);
			}
			childrenByParent.get(item.parentId).push(item);
		});

		const affected = new Set([toggledId]);
		const effective = (id) => (affected.has(id) ? isComplete : Boolean(byId.get(id)?.isComplete));

		let currentId = toggledId;
		const visited = new Set();
		while (!visited.has(currentId))
		{
			visited.add(currentId);

			const parentId = byId.get(currentId)?.parentId;
			const parent = byId.get(parentId);
			if (!parent)
			{
				// reached the checklist root (it is not among the items) - stop
				break;
			}

			const siblings = childrenByParent.get(parentId) ?? [];
			const allChildrenComplete = siblings.length > 0 && siblings.every((child) => effective(child.id));
			const parentComplete = effective(parentId);
			const parentFlips = isComplete
				? (allChildrenComplete && !parentComplete)
				: (parentComplete && !allChildrenComplete);

			if (!parentFlips)
			{
				break;
			}

			affected.add(parentId);
			currentId = parentId;
		}

		return [...affected];
	};

	/**
	 * @param {ChecklistItemReduxModel[]} items
	 * @param {ChecklistItemId} fromParentId
	 * @return {Array<{ id: ChecklistItemId, isComplete: boolean }>}
	 */
	const computeAncestorCompletion = (items, fromParentId) => {
		const byId = new Map(items.map((item) => [item.id, item]));
		const childrenByParent = new Map();
		items.forEach((item) => {
			const list = childrenByParent.get(item.parentId);
			if (list)
			{
				list.push(item);
			}
			else
			{
				childrenByParent.set(item.parentId, [item]);
			}
		});

		const changes = [];
		const computed = new Map();
		let parentId = fromParentId;
		const visited = new Set();

		while (parentId && !visited.has(parentId))
		{
			visited.add(parentId);

			const parent = byId.get(parentId);
			if (!parent)
			{
				break;
			}

			const children = childrenByParent.get(parentId) ?? [];
			const allComplete = children.length > 0 && children.every(
				(child) => (computed.has(child.id) ? computed.get(child.id) : child.isComplete),
			);
			if (parent.isComplete === allComplete)
			{
				break;
			}

			changes.push({ id: parentId, isComplete: allComplete });
			computed.set(parentId, allComplete);
			parentId = parent.parentId;
		}

		return changes;
	};

	/**
	 * @param {ChecklistItemReduxModel[]} items
	 * @return {ChecklistCounters}
	 */
	const calcCounters = (items) => {
		let completed = 0;
		items.forEach((item) => {
			if (item.isComplete)
			{
				completed += 1;
			}
		});

		return { completed, uncompleted: items.length - completed };
	};

	module.exports = { collectCompletionCascade, computeAncestorCompletion, calcCounters };
});
