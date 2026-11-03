/**
 * @module statemanager/redux/slices/field-filter
 */
jn.define('statemanager/redux/slices/field-filter', (require, exports, module) => {
	const { Type } = require('type');
	const { isFilledScalar } = require('utils/type');
	const { ReducerRegistry } = require('statemanager/redux/reducer-registry');
	const { createSlice } = require('statemanager/redux/toolkit');
	const {
		sliceName,
		fieldFilterAdapter,
		initialState,
		createEmptyEntity,
		restoredGridIds,
	} = require('statemanager/redux/slices/field-filter/meta');

	const ensureEntity = (state, gridId) => {
		if (!state.entities[gridId])
		{
			fieldFilterAdapter.addOne(state, createEmptyEntity(gridId));
		}

		return state.entities[gridId];
	};

	/**
	 * Whether the value keeps the field in the filter. Same test as the serializer applies, plus the
	 * empty selection: a scalar counts unless it is nil or an empty string - a zero is a condition.
	 */
	const isValueActive = (value) => (
		Type.isArray(value) ? value.length > 0 : isFilledScalar(value)
	);

	/**
	 * Every action names the list it is about, and the list is created in the store by the first
	 * action that names it - so both answers belong to one place, and a reducer is left with the
	 * change itself. An action naming no list has nothing to change.
	 *
	 * @param {function(Object, Object): void} reducer takes the entity of the list and the payload
	 * @return {function(Object, {payload: Object}): void}
	 */
	const withEntity = (reducer) => (state, { payload }) => {
		if (!Type.isStringFilled(payload.gridId))
		{
			return;
		}

		reducer(ensureEntity(state, payload.gridId), payload);
	};

	/**
	 * No conditions and no preset: what a reset does, and what the deletion of the applied preset
	 * leaves behind.
	 *
	 * The fields of the form are left exactly as they are. The list of fields belongs to the user and
	 * not to a filter: the web changes it by actions over the fields alone - the field dialog, adding,
	 * removing and dragging a field, all of them ending in saveFieldsSort() - while a reset only clears
	 * what is filtered. Taking a field off the form here would answer a request nobody made, and
	 * reset fields is the action that does exactly that.
	 */
	const clearConditions = (entity) => {
		entity.values = {};
		entity.search = '';
		entity.currentFilterId = null;
	};

	/**
	 * The fields of the form once a preset has been applied: the ones the form already shows, and
	 * after them the ones the preset names. The same composition the server sends on load
	 * (SavedFilterStorage::resolveFormRows): the field list belongs to the user, and a preset shows
	 * the fields it filters on top of it - it does not compose the form and does not take a field off.
	 *
	 * @param {string[]} rows
	 * @param {string[]} presetRows
	 * @return {string[]}
	 */
	const mergeRows = (rows, presetRows) => {
		const kept = Type.isArray(rows) ? rows : [];
		const added = (Type.isArray(presetRows) ? presetRows : []).filter((row) => !kept.includes(row));

		return [...kept, ...added];
	};

	const fieldFilterSlice = createSlice({
		name: sliceName,
		initialState,
		reducers: {
			filterInitialized: (state, { payload }) => {
				const { gridId, values, search, currentFilterId, rows } = payload;
				if (!Type.isStringFilled(gridId))
				{
					return;
				}

				const entity = state.entities[gridId];
				const isRestoredFromCache = restoredGridIds.has(gridId);

				if (entity && !isRestoredFromCache)
				{
					// the component has been recreated inside this run of the app: the entry holds what
					// the user has done to the form since the list was read, and the answer of the
					// server is older than that
					return;
				}

				if (entity)
				{
					// the first answer of the server after a restart, over an entry the cache brought
					// back: the filter may have been changed in the web or on another device while the
					// app was closed, and the list on screen is already requested by that answer - an
					// entry left as the cache had it would show the drawer one filter and the list
					// another, and apply would write the stale one back to the server.
					// The presets are left alone: the strip has a load of its own (presetsLoaded)
					restoredGridIds.delete(gridId);

					entity.values = Type.isPlainObject(values) ? values : {};
					entity.search = Type.isStringFilled(search) ? search : '';
					entity.currentFilterId = currentFilterId ?? null;
					entity.rows = Type.isArray(rows) ? [...rows] : [];

					return;
				}

				restoredGridIds.delete(gridId);

				fieldFilterAdapter.addOne(state, {
					...createEmptyEntity(gridId),
					values: Type.isPlainObject(values) ? values : {},
					search: Type.isStringFilled(search) ? search : '',
					currentFilterId: currentFilterId ?? null,
					rows: Type.isArray(rows) ? [...rows] : [],
				});
			},
			filterValueChanged: withEntity((entity, { fieldId, value }) => {
				if (!Type.isStringFilled(fieldId))
				{
					return;
				}

				if (isValueActive(value))
				{
					entity.values[fieldId] = value;
				}
				else
				{
					delete entity.values[fieldId];
				}
			}),
			// the set of fields the form shows, as the user composed it in the field selector. The
			// values come with it: a value of a field taken off the form would narrow the list by a
			// condition nothing on the screen shows, so the caller passes the ones that survive
			filterRowsChanged: withEntity((entity, { rows, values }) => {
				entity.rows = Type.isArray(rows) ? [...rows] : [];

				if (Type.isPlainObject(values))
				{
					entity.values = { ...values };
				}
			}),
			filterSearchChanged: withEntity((entity, { search }) => {
				entity.search = Type.isStringFilled(search) ? search : '';
			}),
			filterCurrentFilterIdChanged: withEntity((entity, { currentFilterId }) => {
				entity.currentFilterId = currentFilterId ?? null;
			}),
			// the answer carries the pointer of the pinned preset next to the list, so both are put
			// down together: a screen that kept the pointer of its own could not show a pin
			// before the server confirmed it
			filterPresetsLoaded: withEntity((entity, { presets, defaultPresetId, canEditForAll }) => {
				entity.presets = Type.isArray(presets) ? presets : [];
				entity.defaultPresetId = defaultPresetId ?? null;
				entity.presetsLoaded = true;
				entity.canEditForAll = canEditForAll === true;

				// a pointer at a preset the fresh list no longer holds promises conditions nothing
				// can apply - it was deleted elsewhere, on another device or in the web
				if (entity.currentFilterId !== null
					&& !entity.presets.some(({ id }) => id === entity.currentFilterId))
				{
					entity.currentFilterId = null;
				}
			}),
			// creates the preset when the id is new and overwrites it otherwise, the way
			// SavedFilterStorage::save() does
			filterPresetSaved: withEntity((entity, { preset }) => {
				if (!Type.isStringFilled(preset?.id))
				{
					return;
				}

				const index = entity.presets.findIndex(({ id }) => id === preset.id);

				if (index === -1)
				{
					// a preset created on mobile gets the highest sort on the server
					// (SavedFilterStorage::getNextPresetSort), so it lands last here as well
					entity.presets.push(preset);

					return;
				}

				entity.presets[index] = preset;
			}),
			filterPresetRemoved: withEntity((entity, { presetId }) => {
				entity.presets = entity.presets.filter(({ id }) => id !== presetId);

				if (entity.defaultPresetId === presetId)
				{
					entity.defaultPresetId = null;
				}

				// the server drops the pointer at a deleted preset as well
				// (SavedFilterStorage::resetCurrentPreset), and a form still filled from it would
				// promise conditions no preset holds
				if (entity.currentFilterId === presetId)
				{
					clearConditions(entity);
				}
			}),
			// the order of the presets is a value of the storage shared with the web (the `sort` of a
			// preset), so the strip of the drawer and the edit screen show one order
			filterPresetsReordered: withEntity((entity, { presetIds }) => {
				const ids = Type.isArray(presetIds) ? presetIds : [];
				const byId = new Map(entity.presets.map((preset) => [preset.id, preset]));
				const ordered = ids.map((id) => byId.get(id)).filter(Boolean);
				// a preset the order says nothing about - saved in the web while the screen was open -
				// keeps its place after the ones it does name, the way the server leaves its sort alone
				const rest = entity.presets.filter((preset) => !ids.includes(preset.id));

				entity.presets = [...ordered, ...rest];
			}),
			// pinning is one pointer for the whole list - the web keeps the pinned preset as the
			// default one of the grid (Options::pinPreset) - so a null unpins whatever is pinned now
			filterPresetPinned: withEntity((entity, { presetId }) => {
				const pinnedId = presetId ?? null;

				entity.defaultPresetId = pinnedId;
				entity.presets = entity.presets.map((preset) => ({
					...preset,
					pinned: preset.id === pinnedId,
				}));
			}),
			// one preset at a time, both ways: the web publishes the whole set of presets marked
			// for all at once, and dropping the mark of one takes that one back
			filterPresetForAllChanged: withEntity((entity, { presetId, forAll }) => {
				entity.presets = entity.presets.map(
					(preset) => (preset.id === presetId ? { ...preset, forAll: forAll === true } : preset),
				);
			}),
			// undo of an optimistic action: the state as it stood before the request that failed
			filterSnapshotRestored: withEntity((entity, { snapshot }) => {
				Object.assign(entity, snapshot);
			}),
			// a saved preset defines the whole condition set, so nothing is merged
			filterValuesReplaced: withEntity((entity, { values, search, currentFilterId, rows }) => {
				entity.values = Type.isPlainObject(values) ? { ...values } : {};
				entity.search = Type.isStringFilled(search) ? search : '';
				entity.currentFilterId = currentFilterId ?? null;
				// the form keeps its fields and takes the ones the preset brings on top, see mergeRows
				entity.rows = mergeRows(entity.rows, rows);
			}),
			filterReset: withEntity((entity) => {
				clearConditions(entity);
			}),
			// the reference book of a field the dictionary left on the server: read once per session of
			// the list, so a picker opened a second time draws it without asking again
			filterFieldItemsLoaded: withEntity((entity, { fieldId, items }) => {
				if (!Type.isStringFilled(fieldId) || !Type.isArray(items))
				{
					return;
				}

				entity.deferredItems[fieldId] = items;
			}),
			// the values are as old as the dictionary they came with, so reading the dictionary anew
			// drops them: a funnel renamed in the web must not be worded out of yesterday's answer.
			//
			// A list nothing is stored about is left alone rather than created: this runs while the
			// dictionary is being read, before the filter itself seeds the list, and an entry created
			// here would have swallowed that seeding (filterInitialized keeps what is already stored).
			filterFieldItemsReset: (state, { payload }) => {
				const entity = state.entities[payload?.gridId];
				if (entity)
				{
					entity.deferredItems = {};
				}
			},
			// the words of the controls belong to no list, so this one names none: the answer of any
			// list carries the same vocabulary, and a later answer only refreshes it - the wording
			// changes when the portal changes its language, not when the user opens another list
			filterDictionaryLoaded: (state, { payload }) => {
				if (!Type.isPlainObject(payload?.dictionary))
				{
					return;
				}

				state.dictionary = payload.dictionary;
			},
		},
	});

	const {
		filterInitialized,
		filterValueChanged,
		filterRowsChanged,
		filterSearchChanged,
		filterCurrentFilterIdChanged,
		filterPresetsLoaded,
		filterPresetSaved,
		filterPresetRemoved,
		filterPresetsReordered,
		filterPresetPinned,
		filterPresetForAllChanged,
		filterSnapshotRestored,
		filterValuesReplaced,
		filterReset,
		filterFieldItemsLoaded,
		filterFieldItemsReset,
		filterDictionaryLoaded,
	} = fieldFilterSlice.actions;

	ReducerRegistry.register(sliceName, fieldFilterSlice.reducer);

	module.exports = {
		filterInitialized,
		filterValueChanged,
		filterRowsChanged,
		filterSearchChanged,
		filterCurrentFilterIdChanged,
		filterPresetsLoaded,
		filterPresetSaved,
		filterPresetRemoved,
		filterPresetsReordered,
		filterPresetPinned,
		filterPresetForAllChanged,
		filterSnapshotRestored,
		filterValuesReplaced,
		filterReset,
		filterFieldItemsLoaded,
		filterFieldItemsReset,
		filterDictionaryLoaded,
	};
});
