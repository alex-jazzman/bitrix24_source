/** @module tasks/statemanager/redux/slices/checklists/model/src/common */
jn.define('tasks/statemanager/redux/slices/checklists/model/src/common', (require, exports, module) => {
	const ROOT_PARENT_ID = 0;

	/**
	 * Store id of a checklist entity. Both adapters are global, while `nodeId` is unique only within
	 * one entity: a copy/prefill keeps the source `nodeId`, so a bare `nodeId` would let a draft
	 * overwrite the records of the task or template it was copied from.
	 *
	 * @param {ChecklistEntityContext} context
	 * @param {ChecklistItemId} nodeId
	 * @return {string}
	 */
	const makeStoreId = ({ entityType, entityId }, nodeId) => `${entityType}:${entityId}:${nodeId}`;

	/**
	 * Key of the entity a record belongs to. Accepts both a context and a stored record - every record
	 * carries `entityType` and `entityId`, and those stay correct even after a draft task gets its real id.
	 *
	 * @param {ChecklistEntityContext|ChecklistReduxModel|ChecklistItemReduxModel} source
	 * @return {string}
	 */
	const makeEntityKey = ({ entityType, entityId }) => `${entityType}:${entityId}`;

	/**
	 * @param {Array<number|null|string>} [ids]
	 * @return {number[]}
	 */
	const serverItemIds = (ids) => (ids ?? []).filter((id) => Number.isInteger(id));

	/**
	 * @param {ChecklistV2Raw} raw
	 * @return {boolean}
	 */
	const hasParentNodeRef = (raw) => {
		const parentNodeId = raw?.parentNodeId;

		return parentNodeId !== null
			&& parentNodeId !== undefined
			&& String(parentNodeId) !== ''
			&& String(parentNodeId) !== '0';
	};

	/**
	 * @param {ChecklistV2Raw} raw
	 * @return {boolean}
	 */
	const isRootRaw = (raw) => {
		if (hasParentNodeRef(raw))
		{
			return false;
		}

		return raw.parentId === null || raw.parentId === undefined || Number(raw.parentId) === ROOT_PARENT_ID;
	};

	module.exports = { ROOT_PARENT_ID, makeStoreId, makeEntityKey, serverItemIds, hasParentNodeRef, isRootRaw };
});
