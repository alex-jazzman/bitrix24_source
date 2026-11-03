/** @module tasks/statemanager/redux/slices/checklists/model/src/serializer */
jn.define('tasks/statemanager/redux/slices/checklists/model/src/serializer', (require, exports, module) => {
	const { Type } = require('type');
	const { ChecklistMemberType } = require('tasks/checklist/enum');
	const { ROOT_PARENT_ID } = require('tasks/statemanager/redux/slices/checklists/model/src/common');
	const {
		buildDefaultChecklistTitle,
		buildDefaultItemTitle,
	} = require('tasks/statemanager/redux/slices/checklists/model/src/defaults');

	/**
	 * @param {ChecklistAttachmentV2[]} [attachments]
	 * @return {Array<{id: string, fileId: string}>}
	 */
	const mapSaveAttachments = (attachments) => (attachments ?? []).reduce((result, attachment) => {
		if (attachment?.isUploading)
		{
			return result;
		}

		const objectId = [attachment?.serverFileId, attachment?.fileId]
			.find((value) => Type.isStringFilled(value) && value.startsWith('n'));

		if (objectId)
		{
			result.push({ id: objectId, fileId: objectId });
		}

		return result;
	}, []);

	/**
	 * @param {ChecklistItemReduxModel} item
	 * @param {Map<ChecklistItemId, number>} [serverIdByStoreId]
	 * @param {Map<ChecklistItemId, ChecklistItemId>} [nodeIdByStoreId]
	 * @return {ChecklistItemSaveDTO}
	 */
	const itemToSaveDTO = (item, serverIdByStoreId, nodeIdByStoreId) => {
		const dto = {
			nodeId: item.nodeId,
			title: item.title,
			parentId: serverIdByStoreId?.get(item.parentId) ?? 0,
			parentNodeId: nodeIdByStoreId?.get(item.parentId) ?? item.parentNodeId ?? null,
			sortIndex: item.sortIndex,
			isComplete: item.isComplete,
			isImportant: item.isImportant,
			accomplices: item.accomplices,
			auditors: item.auditors,
			attachments: mapSaveAttachments(item.attachments),
		};

		if (Number.isInteger(item.serverId))
		{
			dto.id = item.serverId;
		}

		if (item.copiedId)
		{
			dto.copiedId = item.copiedId;
		}

		return dto;
	};

	/**
	 * @param {ChecklistReduxModel} checklist
	 * @return {ChecklistItemSaveDTO}
	 */
	const checklistToSaveDTO = (checklist) => {
		const dto = {
			nodeId: checklist.nodeId,
			title: (checklist.title ?? '').trim() || buildDefaultChecklistTitle(checklist.sortIndex),
			parentId: 0,
			parentNodeId: null,
			sortIndex: checklist.sortIndex,
			isComplete: false,
			isImportant: false,
			accomplices: [],
			auditors: [],
			attachments: [],
		};

		if (Number.isInteger(checklist.serverId))
		{
			dto.id = checklist.serverId;
		}

		return dto;
	};

	/**
	 * @param {ChecklistReduxModel[]} checklists
	 * @param {Record<ChecklistItemId, ChecklistItemReduxModel[]>} itemsByChecklistId
	 * @return {ChecklistItemSaveDTO[]}
	 */
	const buildSavePayload = (checklists, itemsByChecklistId) => {
		const serverIdByStoreId = new Map();
		const nodeIdByStoreId = new Map();
		checklists.forEach((checklist) => {
			nodeIdByStoreId.set(checklist.id, checklist.nodeId);
			if (Number.isInteger(checklist.serverId))
			{
				serverIdByStoreId.set(checklist.id, checklist.serverId);
			}
			(itemsByChecklistId[checklist.id] ?? []).forEach((item) => {
				nodeIdByStoreId.set(item.id, item.nodeId);
				if (Number.isInteger(item.serverId))
				{
					serverIdByStoreId.set(item.id, item.serverId);
				}
			});
		});

		const payload = [];

		[...checklists]
			.sort((a, b) => a.sortIndex - b.sortIndex)
			.forEach((checklist) => {
				payload.push(checklistToSaveDTO(checklist));

				const skipped = new Set();
				const items = itemsByChecklistId[checklist.id] ?? [];
				items.forEach((item) => {
					const isEmptyTitle = (item.title ?? '').trim() === '';
					const hasContent = (item.attachments ?? []).length > 0
						|| (item.accomplices ?? []).length > 0
						|| (item.auditors ?? []).length > 0;

					if ((isEmptyTitle && !hasContent) || skipped.has(item.parentId))
					{
						skipped.add(item.id);

						return;
					}

					const dto = itemToSaveDTO(item, serverIdByStoreId, nodeIdByStoreId);
					if (isEmptyTitle)
					{
						dto.title = buildDefaultItemTitle();
					}
					payload.push(dto);
				});
			});

		return payload;
	};

	/**
	 * @param {ChecklistAttachmentV2[]} [attachments]
	 * @return {Object<string, *>}
	 */
	const mapDodAttachments = (attachments) => {
		const map = {};
		(attachments ?? []).forEach((attachment) => {
			const { id, serverFileId, token } = attachment ?? {};
			if (!serverFileId)
			{
				return;
			}

			map[token ? serverFileId : id] = serverFileId;
		});

		return map;
	};

	/**
	 * @param {ChecklistItemReduxModel} item
	 * @return {ChecklistMembersMap}
	 */
	const mapMembersUppercase = (item) => {
		const members = {};
		ChecklistMemberType.getEnums().forEach((memberType) => {
			(item[memberType.getStoreKey()] ?? []).forEach(({ id, name }) => {
				members[id] = { ID: id, TYPE: memberType.getCode(), NAME: name ?? '' };
			});
		});

		return members;
	};

	/**
	 * @param {ChecklistItemReduxModel} item
	 * @param {ChecklistParentResolvers} resolvers
	 * @param {BuildItemFieldsOptions} [options]
	 * @return {ChecklistItemRequestData}
	 */
	const buildItemFields = (item, { resolveParentId, resolveParentNodeId }, options = {}) => {
		const { flagsAsInt = false, alwaysCollections = true, mapAttachments = mapDodAttachments } = options;
		const flag = (value) => (flagsAsInt ? Number(Boolean(value)) : Boolean(value));

		const fields = {
			NODE_ID: item.nodeId,
			PARENT_NODE_ID: resolveParentNodeId(item.parentId),
			PARENT_ID: resolveParentId(item.parentId),
			TITLE: item.title ?? '',
			SORT_INDEX: item.sortIndex,
			IS_COMPLETE: flag(item.isComplete),
			IS_IMPORTANT: flag(item.isImportant),
		};

		if (Number.isInteger(item.serverId))
		{
			fields.ID = item.serverId;
		}

		if (item.copiedId)
		{
			fields.COPIED_ID = item.copiedId;
		}

		const members = mapMembersUppercase(item);
		if (alwaysCollections || Object.keys(members).length > 0)
		{
			fields.MEMBERS = members;
		}

		const attachments = mapAttachments(item.attachments);
		if (alwaysCollections || Object.keys(attachments).length > 0)
		{
			fields.ATTACHMENTS = attachments;
		}

		return fields;
	};

	/**
	 * @param {ChecklistItemReduxModel} item
	 * @param {Record<string, number>} serverIdByStoreId
	 * @param {Record<string, ChecklistItemId>} nodeIdByStoreId
	 * @return {ChecklistItemRequestData}
	 */
	const itemToDodFields = (item, serverIdByStoreId, nodeIdByStoreId) => buildItemFields(
		item,
		{
			resolveParentId: (parentId) => serverIdByStoreId[parentId] ?? null,
			resolveParentNodeId: (parentId) => nodeIdByStoreId[parentId] ?? item.parentNodeId ?? null,
		},
		{ flagsAsInt: true, alwaysCollections: false, mapAttachments: mapDodAttachments },
	);

	/**
	 * @param {ChecklistReduxModel[]} checklists
	 * @param {Record<ChecklistItemId, ChecklistItemReduxModel[]>} itemsByChecklistId
	 * @return {ChecklistItemRequestData[]|null}
	 */
	const toDodRequestData = (checklists, itemsByChecklistId) => {
		const serverIdByStoreId = {};
		const nodeIdByStoreId = {};
		checklists.forEach((checklist) => {
			nodeIdByStoreId[checklist.id] = checklist.nodeId;
			if (Number.isInteger(checklist.serverId))
			{
				serverIdByStoreId[checklist.id] = checklist.serverId;
			}
		});
		Object.values(itemsByChecklistId).forEach((items) => {
			items.forEach((item) => {
				nodeIdByStoreId[item.id] = item.nodeId;
				if (Number.isInteger(item.serverId))
				{
					serverIdByStoreId[item.id] = item.serverId;
				}
			});
		});

		let shouldAbort = false;
		const requestData = [];

		checklists.forEach((checklist) => {
			const items = itemsByChecklistId[checklist.id] ?? [];
			if (items.length === 0)
			{
				return;
			}

			if (!(checklist.title ?? '').trim())
			{
				shouldAbort = true;
			}

			requestData.push({
				NODE_ID: checklist.nodeId,
				PARENT_NODE_ID: ROOT_PARENT_ID,
				PARENT_ID: ROOT_PARENT_ID,
				TITLE: checklist.title ?? '',
				SORT_INDEX: checklist.sortIndex,
				IS_COMPLETE: 0,
				IS_IMPORTANT: 0,
				...(Number.isInteger(checklist.serverId) ? { ID: checklist.serverId } : {}),
			});

			items.forEach((item) => {
				requestData.push(itemToDodFields(item, serverIdByStoreId, nodeIdByStoreId));
			});
		});

		return shouldAbort ? null : requestData;
	};

	module.exports = {
		itemToSaveDTO,
		checklistToSaveDTO,
		buildSavePayload,
		mapMembersUppercase,
		toDodRequestData,
	};
});
