/** @module tasks/statemanager/redux/slices/checklists/model/src/entities */
jn.define('tasks/statemanager/redux/slices/checklists/model/src/entities', (require, exports, module) => {
	/**
	 * @param {ChecklistItemReduxModel[]} items
	 * @param {ChecklistItemId} itemId
	 * @return {ChecklistItemId[]}
	 */
	const collectSubtreeIds = (items, itemId) => {
		const childIdsByParent = new Map();
		items.forEach((item) => {
			const list = childIdsByParent.get(item.parentId);
			if (list)
			{
				list.push(item.id);
			}
			else
			{
				childIdsByParent.set(item.parentId, [item.id]);
			}
		});

		const ids = [itemId];
		const stack = [itemId];
		const visited = new Set([itemId]);

		while (stack.length > 0)
		{
			const parentId = stack.pop();
			(childIdsByParent.get(parentId) ?? []).forEach((childId) => {
				if (!visited.has(childId))
				{
					visited.add(childId);
					ids.push(childId);
					stack.push(childId);
				}
			});
		}

		return ids;
	};

	/**
	 * @param {ChecklistItemReduxModel[]} items
	 * @param {ChecklistItemId} parentId
	 * @return {number}
	 */
	const nextSortIndex = (items, parentId) => {
		const siblings = items.filter((item) => item.parentId === parentId);

		return siblings.length === 0
			? 0
			: Math.max(...siblings.map((item) => item.sortIndex)) + 1;
	};

	/**
	 * @param {ChecklistItemReduxModel[]} items
	 * @return {Map<string, ChecklistAttachmentV2>}
	 */
	const buildLocalAttachmentIndex = (items) => {
		const index = new Map();
		items.forEach((item) => {
			(item.attachments ?? []).forEach((attachment) => {
				if (!attachment || !attachment.name)
				{
					return;
				}

				if (attachment.id !== undefined && attachment.id !== null)
				{
					index.set(`id:${attachment.id}`, attachment);
				}

				if (attachment.fileId !== undefined && attachment.fileId !== null)
				{
					index.set(`fileId:${attachment.fileId}`, attachment);
				}
			});
		});

		return index;
	};

	module.exports = { collectSubtreeIds, nextSortIndex, buildLocalAttachmentIndex };
});
