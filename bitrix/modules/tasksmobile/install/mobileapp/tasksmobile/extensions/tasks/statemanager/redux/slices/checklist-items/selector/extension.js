/**
 * @module tasks/statemanager/redux/slices/checklist-items/selector
 */
jn.define('tasks/statemanager/redux/slices/checklist-items/selector', (require, exports, module) => {
	const { createDraftSafeSelector } = require('statemanager/redux/toolkit');
	const { sliceName, itemsAdapter } = require('tasks/statemanager/redux/slices/checklist-items/meta');

	const {
		selectAll,
		selectById,
		selectEntities,
		selectIds,
		selectTotal,
	} = itemsAdapter.getSelectors((state) => state[sliceName]);

	const EMPTY_CHILDREN = Object.freeze([]);

	/**
	 * Children of every item, sorted, in one pass. Both adapters are global, so a per-parent selector
	 * would rescan the whole collection on every row of every list: memoization has a single slot and
	 * a changing parentId evicts it. The index is keyed on the collection instead, so it survives.
	 *
	 * The lists it holds are shared with the callers - read them, do not mutate them.
	 *
	 * @type {(state: object) => Map<ChecklistItemId, ChecklistItemReduxModel[]>}
	 */
	const selectChildrenByParentId = createDraftSafeSelector(
		selectAll,
		(items) => {
			const byParent = new Map();

			items.forEach((item) => {
				if (!byParent.has(item.parentId))
				{
					byParent.set(item.parentId, []);
				}
				byParent.get(item.parentId).push(item);
			});

			byParent.forEach((children) => children.sort((a, b) => a.sortIndex - b.sortIndex));

			return byParent;
		},
	);

	/**
	 * @type {(state: object, itemId: ChecklistItemId) => ChecklistItemReduxModel[]}
	 */
	const selectItemChildren = (state, itemId) => (
		selectChildrenByParentId(state).get(itemId) ?? EMPTY_CHILDREN
	);

	/**
	 * @type {(state: object, checklistId: ChecklistItemId) => ChecklistItemReduxModel[]}
	 */
	const selectItemsByChecklistId = createDraftSafeSelector(
		selectChildrenByParentId,
		(state, checklistId) => checklistId,
		(byParent, checklistId) => {
			const ordered = [];
			// guard against cyclic parentId, else stack overflow
			const visited = new Set();
			const walk = (parentId) => {
				if (visited.has(parentId))
				{
					return;
				}
				visited.add(parentId);

				(byParent.get(parentId) ?? []).forEach((child) => {
					if (child.checklistId !== checklistId)
					{
						return;
					}

					ordered.push(child);
					walk(child.id);
				});
			};
			walk(checklistId);

			return ordered;
		},
	);

	/**
	 * @type {(state: object, entityType: ChecklistEntityType, entityId: number|string) => ChecklistItemReduxModel[]}
	 */
	const selectItemsByEntity = createDraftSafeSelector(
		selectAll,
		(state, entityType) => entityType,
		(state, entityType, entityId) => entityId,
		(items, entityType, entityId) => items.filter(
			(item) => item.entityType === entityType && item.entityId === entityId,
		),
	);

	/**
	 * @type {(state: object, entityType: ChecklistEntityType, entityId: number|string) => boolean}
	 */
	const selectHasUploadingAttachments = createDraftSafeSelector(
		selectItemsByEntity,
		(items) => items.some(
			(item) => (item.attachments ?? []).some((attachment) => attachment?.isUploading),
		),
	);

	module.exports = {
		selectAll,
		selectById,
		selectEntities,
		selectIds,
		selectTotal,
		selectItemsByChecklistId,
		selectItemChildren,
		selectChildrenByParentId,
		selectItemsByEntity,
		selectHasUploadingAttachments,
	};
});
