/**
 * @module statemanager/redux/slices/field-filter/meta
 */
jn.define('statemanager/redux/slices/field-filter/meta', (require, exports, module) => {
	const { createEntityAdapter } = require('statemanager/redux/toolkit');
	const { StateCache } = require('statemanager/redux/state-cache');

	const sliceName = 'mobile:field-filter';

	/**
	 * One entry per consumer grid (keyed by `gridId`).
	 * @type {EntityAdapter}
	 */
	const fieldFilterAdapter = createEntityAdapter({
		selectId: (filter) => filter.gridId,
	});

	/**
	 * The words of the controls stand next to the lists and not inside them: the vocabulary comes from
	 * the web filter library and is the same for a CRM funnel and for a task list. Kept in the store so
	 * that a screen opened again draws its form from what is already there instead of waiting for the
	 * answer - persisted with the slice, so that survives a restart as well.
	 * @type {?FilterDictionary}
	 */
	const NO_DICTIONARY = null;

	const initialState = StateCache.getReducerState(
		sliceName,
		fieldFilterAdapter.getInitialState({ dictionary: NO_DICTIONARY }),
	);

	/**
	 * The entries `StateCache` brought back from the previous run of the app.
	 *
	 * What such an entry holds was current when the app was last closed, and the filter of the list
	 * may have been changed since - in the web, or on another device. So the first answer of the
	 * server after a restore is the authority, while every answer after it is older than what the
	 * user has done to the form meanwhile.
	 *
	 * Knowledge about this run and not part of the state: the state is persisted whole, and a mark
	 * left inside it would come back from the cache as well and mean the opposite of itself.
	 *
	 * @type {Set<string>}
	 */
	const restoredGridIds = new Set(Object.keys(initialState.entities ?? {}));

	/**
	 * @param {string} gridId
	 * @return {FieldFilterEntity}
	 */
	const createEmptyEntity = (gridId) => ({
		gridId,
		values: {},
		search: '',
		currentFilterId: null,
		// rows of the current filter: which fields the form shows before "show all". Empty means
		// "no opinion" - the form then falls back to the fields the provider marks as default
		rows: [],
		// saved filters live here too: the drawer is rebuilt on every open and must draw the strip
		// from the store at once, leaving the request to refresh what is already on the screen
		presets: [],
		// values of the fields whose reference book the dictionary left on the server
		// (Bitrix\Mobile\Filter\DeferredItems), keyed by field id: read when the picker of the field is
		// opened and kept until the dictionary of the list is read again
		deferredItems: {},
		// the preset the list opens on, as the web keeps it (Options::getDefaultFilterId). Stored
		// next to the list because pinning moves the pointer: a screen holding the pointer of its
		// own could not show a pin before the server answered
		defaultPresetId: null,
		presetsLoaded: false,
		// whether this user may make a filter of the list common to everyone: the same operation of
		// the portal the server weighs before it accepts the action (SavedFilterStorage::changeForAll),
		// so a menu built without it offers what is always refused
		canEditForAll: false,
	});

	module.exports = {
		sliceName,
		fieldFilterAdapter,
		initialState,
		restoredGridIds,
		createEmptyEntity,
	};
});
