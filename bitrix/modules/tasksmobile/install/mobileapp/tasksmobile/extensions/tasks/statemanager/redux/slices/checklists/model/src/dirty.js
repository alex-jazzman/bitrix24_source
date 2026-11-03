/** @module tasks/statemanager/redux/slices/checklists/model/src/dirty */
jn.define('tasks/statemanager/redux/slices/checklists/model/src/dirty', (require, exports, module) => {
	const { makeEntityKey } = require('tasks/statemanager/redux/slices/checklists/model/src/common');

	/**
	 * Entities with local changes that have not reached the server yet. A fetch must not overwrite them:
	 * the save is debounced, and offline it is skipped altogether, so a local edit can live in the store -
	 * and in StateCache, across restarts - for an arbitrarily long time.
	 *
	 * The flag is per entity, not per record: a save always sends the whole entity, so that is the
	 * granularity at which "everything local is persisted" can be stated.
	 *
	 * @param {object} state
	 * @return {Record<string, boolean>}
	 */
	const dirtyEntities = (state) => {
		if (!state.dirtyEntities)
		{
			// eslint-disable-next-line no-param-reassign
			state.dirtyEntities = {};
		}

		return state.dirtyEntities;
	};

	/**
	 * @param {object} state
	 * @param {ChecklistEntityContext|ChecklistReduxModel|ChecklistItemReduxModel} [source]
	 * @return {void}
	 */
	const markEntityDirty = (state, source) => {
		if (source)
		{
			dirtyEntities(state)[makeEntityKey(source)] = true;
		}
	};

	/**
	 * @param {object} state
	 * @param {ChecklistEntityContext} context
	 * @return {void}
	 */
	const clearEntityDirty = (state, context) => {
		delete dirtyEntities(state)[makeEntityKey(context)];
	};

	/**
	 * @param {object} state
	 * @param {ChecklistEntityContext} context
	 * @return {boolean}
	 */
	const isEntityDirty = (state, context) => Boolean(state.dirtyEntities?.[makeEntityKey(context)]);

	/**
	 * @param {object} state
	 * @param {ChecklistEntityContext} from
	 * @param {ChecklistEntityContext} to
	 * @return {void}
	 */
	const moveEntityDirty = (state, from, to) => {
		if (isEntityDirty(state, from))
		{
			clearEntityDirty(state, from);
			markEntityDirty(state, to);
		}
	};

	module.exports = {
		markEntityDirty,
		clearEntityDirty,
		isEntityDirty,
		moveEntityDirty,
	};
});
