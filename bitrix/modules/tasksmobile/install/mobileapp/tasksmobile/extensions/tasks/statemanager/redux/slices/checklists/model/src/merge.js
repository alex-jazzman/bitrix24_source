/** @module tasks/statemanager/redux/slices/checklists/model/src/merge */
jn.define('tasks/statemanager/redux/slices/checklists/model/src/merge', (require, exports, module) => {
	/**
	 * @param {object} state
	 * @param {object} adapter
	 * @param {Array<ChecklistReduxModel|ChecklistItemReduxModel>} serverModels
	 * @param {ChecklistEntityContext} context
	 * @return {Array<ChecklistReduxModel|ChecklistItemReduxModel>}
	 */
	const mergeServerModelsIntoSlice = (state, adapter, serverModels, { entityType, entityId }) => {
		// records cached before store ids became entity-scoped are still keyed by a bare nodeId
		const legacyByNodeId = new Map();
		Object.values(state.entities).forEach((local) => {
			const isSameEntity = local.entityType === entityType && local.entityId === entityId;
			if (isSameEntity && local.id === local.nodeId)
			{
				legacyByNodeId.set(local.nodeId, local);
			}
		});

		const toAdd = [];

		serverModels.forEach((model) => {
			// server models are built with the same context, so a matching store id means the same entity
			const local = state.entities[model.id] ?? legacyByNodeId.get(model.nodeId);
			if (!local)
			{
				toAdd.push(model);

				return;
			}

			if (Number.isInteger(model.serverId))
			{
				local.serverId = model.serverId;
				local.isNew = false;
			}
		});

		if (toAdd.length > 0)
		{
			adapter.addMany(state, toAdd);
		}

		return toAdd;
	};

	module.exports = { mergeServerModelsIntoSlice };
});
