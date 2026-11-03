/** @module tasks/statemanager/redux/slices/checklists/model/src/rekey */
jn.define('tasks/statemanager/redux/slices/checklists/model/src/rekey', (require, exports, module) => {
	const { makeStoreId } = require('tasks/statemanager/redux/slices/checklists/model/src/common');

	/**
	 * The same store id under another entity id: only the entity part of the key changes, `nodeId`
	 * identifies the record inside the entity and stays as it is. A key issued outside `from` - a bare
	 * legacy `nodeId` among them - is returned untouched.
	 *
	 * @param {ChecklistItemId} storeId
	 * @param {ChecklistEntityContext} from
	 * @param {ChecklistEntityContext} to
	 * @return {ChecklistItemId}
	 */
	const rekeyStoreId = (storeId, from, to) => {
		const prefix = makeStoreId(from, '');

		return (typeof storeId === 'string' && storeId.startsWith(prefix))
			? makeStoreId(to, storeId.slice(prefix.length))
			: storeId;
	};

	/**
	 * Re-issues the store ids of every record of an entity that has just got its real id. A draft task
	 * keys its checklists by guid, and a record left under the guid key no longer matches the record
	 * the server sends back for the same task - the card would then show both.
	 *
	 * @param {object} state
	 * @param {object} adapter
	 * @param {ChecklistEntityContext} from
	 * @param {ChecklistEntityContext} to
	 * @param {string[]} [refFields] fields holding store ids of sibling records of the same entity
	 * @return {Array<ChecklistReduxModel|ChecklistItemReduxModel>} the records under their new keys
	 */
	const rekeyEntityRecords = (state, adapter, from, to, refFields = []) => {
		const affected = Object.values(state.entities).filter(
			(record) => record.entityType === from.entityType && record.entityId === from.entityId,
		);

		if (affected.length === 0)
		{
			return [];
		}

		const rekeyed = affected.map((record) => {
			const next = { ...record, id: rekeyStoreId(record.id, from, to), entityId: to.entityId };

			refFields.forEach((field) => {
				next[field] = rekeyStoreId(record[field], from, to);
			});

			// the new key may already be taken by the server copy of the same record: the draft carries
			// the freshest local edits, the copy carries the server binding, and one record keeps both.
			// Server-owned fields of the copy (actions, createdBy, collapsed) are dropped with it - the
			// next fetch brings them back, and the branch needs the copy to land before create/fulfilled
			const occupant = state.entities[next.id];
			if (occupant && !Number.isInteger(next.serverId))
			{
				next.serverId = occupant.serverId;
				next.isNew = occupant.isNew;
			}

			return next;
		});

		// drop the old keys first, then claim the new ones: `ids` must not keep a guid key behind
		adapter.removeMany(state, affected.map((record) => record.id));
		adapter.setMany(state, rekeyed);

		return rekeyed;
	};

	module.exports = { rekeyStoreId, rekeyEntityRecords };
});
