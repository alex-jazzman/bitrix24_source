/** @module tasks/statemanager/redux/slices/checklists/model/src/factory */
jn.define('tasks/statemanager/redux/slices/checklists/model/src/factory', (require, exports, module) => {
	const { Random } = require('utils/random');
	const { makeStoreId } = require('tasks/statemanager/redux/slices/checklists/model/src/common');
	const { buildDefaultChecklistTitle } = require('tasks/statemanager/redux/slices/checklists/model/src/defaults');

	/**
	 * @param {ChecklistV2Raw} raw
	 * @param {ChecklistEntityContext} context
	 * @return {ChecklistReduxModel}
	 */
	const makeChecklistFromRaw = (raw, { entityType, entityId }) => ({
		id: makeStoreId({ entityType, entityId }, raw.nodeId),
		nodeId: raw.nodeId,
		serverId: Number.isInteger(raw.id) ? raw.id : null,
		entityType,
		entityId,
		title: raw.title ?? '',
		sortIndex: raw.sortIndex ?? 0,
		collapsed: Boolean(raw.collapsed),
		expanded: Boolean(raw.expanded),
		isComplete: Boolean(raw.isComplete),
		actions: raw.actions ?? {},
		createdBy: raw.creator?.id ?? null,
		isNew: false,
	});

	/**
	 * @param {ChecklistV2Raw} raw
	 * @param {ChecklistEntityContext} context
	 * @param {ChecklistItemId} checklistNodeId
	 * @param {ChecklistItemId} [parentNodeId]
	 * @return {ChecklistItemReduxModel}
	 */
	const makeItemFromRaw = (raw, { entityType, entityId }, checklistNodeId, parentNodeId = null) => ({
		id: makeStoreId({ entityType, entityId }, raw.nodeId),
		nodeId: raw.nodeId,
		serverId: Number.isInteger(raw.id) ? raw.id : null,
		checklistId: makeStoreId({ entityType, entityId }, checklistNodeId),
		entityType,
		entityId,
		parentId: makeStoreId({ entityType, entityId }, parentNodeId ?? checklistNodeId),
		parentNodeId: parentNodeId ?? null,
		sortIndex: raw.sortIndex ?? 0,
		displaySortIndex: '',
		title: raw.title ?? '',
		isComplete: Boolean(raw.isComplete),
		isImportant: Boolean(raw.isImportant),
		accomplices: raw.accomplices ?? [],
		auditors: raw.auditors ?? [],
		attachments: raw.attachments ?? [],
		actions: raw.actions ?? {},
		copiedId: raw.copiedId ?? null,
		isNew: false,
	});

	/**
	 * @param {NewChecklistParams} params
	 * @return {ChecklistReduxModel}
	 */
	const makeNewChecklist = ({ entityType, entityId, title = '', sortIndex = 0, createdBy = null }) => {
		const nodeId = Random.getString();

		return {
			id: makeStoreId({ entityType, entityId }, nodeId),
			nodeId,
			serverId: null,
			entityType,
			entityId,
			title: title || buildDefaultChecklistTitle(sortIndex),
			sortIndex,
			collapsed: false,
			expanded: false,
			actions: {
				modify: true,
				remove: true,
				toggle: true,
				add: true,
				addAccomplice: true,
			},
			createdBy,
			isNew: true,
		};
	};

	/**
	 * `checklistId` and `parentId` are store ids, they are taken from the store as is.
	 *
	 * @param {NewItemParams} params
	 * @return {ChecklistItemReduxModel}
	 */
	const makeNewItem = ({ checklistId, entityType, entityId, parentId, sortIndex = 0, title = '' }) => {
		const nodeId = Random.getString();

		return {
			id: makeStoreId({ entityType, entityId }, nodeId),
			nodeId,
			serverId: null,
			checklistId,
			entityType,
			entityId,
			parentId,
			parentNodeId: null,
			sortIndex,
			displaySortIndex: '',
			title,
			isComplete: false,
			isImportant: false,
			accomplices: [],
			auditors: [],
			attachments: [],
			actions: { modify: true, remove: true, toggle: true },
			copiedId: null,
			isNew: true,
		};
	};

	module.exports = {
		makeChecklistFromRaw,
		makeItemFromRaw,
		makeNewChecklist,
		makeNewItem,
	};
});
