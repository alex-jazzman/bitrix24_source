/** @module tasks/statemanager/redux/slices/checklists/model/src/tree */
jn.define('tasks/statemanager/redux/slices/checklists/model/src/tree', (require, exports, module) => {
	const {
		isRootRaw,
		hasParentNodeRef,
		makeStoreId,
	} = require('tasks/statemanager/redux/slices/checklists/model/src/common');
	const {
		makeChecklistFromRaw,
		makeItemFromRaw,
	} = require('tasks/statemanager/redux/slices/checklists/model/src/factory');

	/**
	 * @param {ChecklistItemReduxModel[]} items
	 * @return {Record<ChecklistItemId, string>}
	 */
	const buildDisplayIndexes = (items) => {
		const byParent = new Map();
		items.forEach((item) => {
			if (!byParent.has(item.parentId))
			{
				byParent.set(item.parentId, []);
			}
			byParent.get(item.parentId).push(item);
		});

		const result = {};
		const visited = new Set();
		/**
		 * @param {ChecklistItemId} parentId
		 * @param {string} prefix
		 * @return {void}
		 */
		const walk = (parentId, prefix) => {
			if (visited.has(parentId))
			{
				return;
			}
			visited.add(parentId);
			const children = [...(byParent.get(parentId) ?? [])]
				.sort((a, b) => a.sortIndex - b.sortIndex);

			children.forEach((child, index) => {
				const display = prefix === '' ? String(index + 1) : `${prefix}.${index + 1}`;
				result[child.id] = display;
				walk(child.id, display);
			});
		};

		const checklistIds = new Set(items.map((item) => item.checklistId));
		checklistIds.forEach((checklistId) => walk(checklistId, ''));

		return result;
	};

	/**
	 * @param {ChecklistV2Raw[]} rawItems
	 * @param {ChecklistEntityContext} context
	 * @return {SplitFlatListResult}
	 */
	const splitFlatList = (rawItems, context) => {
		const list = Array.isArray(rawItems) ? rawItems : [];
		const byNodeId = new Map(list.map((raw) => [String(raw.nodeId), raw]));
		const byServerId = new Map(
			list
				.filter((raw) => Number.isInteger(raw.id))
				.map((raw) => [raw.id, raw]),
		);
		const rootCache = new Map();

		/**
		 * @param {ChecklistV2Raw} raw
		 * @return {ChecklistV2Raw|null}
		 */
		const resolveParentRaw = (raw) => {
			if (hasParentNodeRef(raw))
			{
				return byNodeId.get(String(raw.parentNodeId)) ?? null;
			}

			return byServerId.get(raw.parentId) ?? null;
		};

		/**
		 * @param {ChecklistV2Raw} raw
		 * @return {string|null}
		 */
		const resolveRootNodeId = (raw) => {
			if (isRootRaw(raw))
			{
				return raw.nodeId;
			}

			const key = String(raw.nodeId);
			if (rootCache.has(key))
			{
				return rootCache.get(key);
			}

			// cyclic-reference guard: mark the node before descending to its parent
			rootCache.set(key, null);

			const parent = resolveParentRaw(raw);
			const rootNodeId = parent ? resolveRootNodeId(parent) : null;
			rootCache.set(key, rootNodeId);

			return rootNodeId;
		};

		const checklists = [];
		const items = [];

		list.forEach((raw) => {
			if (isRootRaw(raw))
			{
				checklists.push(makeChecklistFromRaw(raw, context));

				return;
			}

			const rootNodeId = resolveRootNodeId(raw);
			if (rootNodeId !== null)
			{
				const parentRaw = resolveParentRaw(raw);
				const parentNodeId = parentRaw ? parentRaw.nodeId : rootNodeId;
				items.push(makeItemFromRaw(raw, context, rootNodeId, parentNodeId));
			}
		});

		const indexes = buildDisplayIndexes(items);
		const indexedItems = items.map((item) => ({
			...item,
			displaySortIndex: indexes[item.id] ?? '',
		}));

		return { checklists, items: indexedItems };
	};

	/**
	 * @param {ChecklistV2Raw[]} rawItems
	 * @param {Record<number, string>} serverIdToStoreId
	 * @param {ChecklistEntityContext} context
	 * @return {ChecklistFetchMergeMaps}
	 */
	const buildFetchMergeMaps = (rawItems, serverIdToStoreId, context) => {
		const storeIdRemap = {};
		const responseServerIds = new Set();

		(Array.isArray(rawItems) ? rawItems : []).forEach((raw) => {
			const hasServerId = Number.isInteger(raw.id);
			if (hasServerId)
			{
				responseServerIds.add(raw.id);
			}

			const localStoreId = hasServerId ? serverIdToStoreId?.[raw.id] : undefined;
			const responseStoreId = makeStoreId(context, raw.nodeId);
			storeIdRemap[responseStoreId] = localStoreId ?? responseStoreId;
		});

		return { storeIdRemap, responseServerIds };
	};

	/**
	 * @param {ChecklistReduxModel|ChecklistItemReduxModel} model
	 * @param {Record<number, string>} serverIdToStoreId
	 * @return {boolean}
	 */
	const isKnownServerEntity = (model, serverIdToStoreId) => (
		Number.isInteger(model.serverId) && Boolean(serverIdToStoreId[model.serverId])
	);

	module.exports = {
		splitFlatList,
		buildDisplayIndexes,
		buildFetchMergeMaps,
		isKnownServerEntity,
	};
});
