/**
 * @module layout/ui/field-filter/filter/src/component
 */
jn.define('layout/ui/field-filter/filter/src/component', (require, exports, module) => {
	const { runInOrder } = require('layout/ui/field-filter/filter/src/serial-queue');
	const { Type } = require('type');
	const store = require('statemanager/redux/store');
	const { buildRows, serializeValues, deserializeValues } = require('layout/ui/field-filter/values');
	const { SavedFiltersService } = require('layout/ui/field-filter/filter/src/saved-filters/service');
	const { FieldFilterDrawer } = require('layout/ui/field-filter/filter/src/drawer');
	const { dropValuesOutsideSet } = require('layout/ui/field-filter/filter/src/fields/field-set');
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
	} = require('statemanager/redux/slices/field-filter');
	const { selectFilterByGridId } = require('statemanager/redux/slices/field-filter/selector');

	/**
	 * Universal, data-driven filter component (TPL-01).
	 * Renders a form from field descriptors (CONTRACT-DTO-01), owns a serializable
	 * `field -> value` state in the `field-filter` redux slice keyed by `gridId`,
	 * and produces the API-01 request via getData().
	 *
	 * The component is the single writer of its slice entry; it carries no domain
	 * specifics - fields, values and grid id come only from configuration.
	 */
	class FieldFilter
	{
		/**
		 * @param {FieldFilterProps} props
		 */
		constructor(props)
		{
			this.props = props;
			this.gridId = props.gridId;
			this.context = Type.isPlainObject(props.context) ? props.context : {};
			this.fieldDescriptors = Type.isArray(props.fieldDescriptors) ? props.fieldDescriptors : [];
			this.fieldSections = Type.isArray(props.fieldSections) ? props.fieldSections : [];
			this.fieldIcons = Type.isPlainObject(props.fieldIcons) ? props.fieldIcons : {};
			this.sectionIcons = Type.isPlainObject(props.sectionIcons) ? props.sectionIcons : {};
			this.entitySelectors = Type.isPlainObject(props.entitySelectors) ? props.entitySelectors : {};
			/** @type {SavedFiltersService|null} */
			this.savedFiltersService = null;
			// how the values of a field left on the server are read; a story and a suite hand in their
			// own, and a filter given none simply draws the fields as they came
			this.loadFieldItems = Type.isFunction(props.loadFieldItems) ? props.loadFieldItems : null;
			// where the fields of the form are kept between sessions; a filter given no way to write
			// them keeps the set for as long as the app is running and no longer
			this.saveFieldSet = Type.isFunction(props.saveFieldSet) ? props.saveFieldSet : null;

			// the entry survives recreation of the component, so the state of the server seeds it
			// only on the first load: what the user picked during the session must outlive the drawer
			store.dispatch(filterInitialized({
				gridId: this.gridId,
				values: Type.isPlainObject(props.initialValues) ? props.initialValues : {},
				search: Type.isStringFilled(props.initialSearch) ? props.initialSearch : '',
				currentFilterId: Type.isStringFilled(props.initialCurrentFilterId)
					? props.initialCurrentFilterId
					: null,
				rows: Type.isArray(props.initialRows) ? props.initialRows : [],
			}));

			// The set of fields is the one exception: it belongs to the server since it began to be
			// written there, so it is taken from the answer every time and not only on the first load.
			// The entry of the list is kept on disk together with the slice and outlives a start of the
			// app - and a start that trusted that copy drew a form without the field the user had added,
			// the very "left the app, came back, everything is gone" of the reports.
			if (Type.isArray(props.initialRows))
			{
				store.dispatch(filterRowsChanged({ gridId: this.gridId, rows: props.initialRows }));
			}
		}

		/**
		 * Fields of the list as everything above reads them: the rows of the form, the field selector,
		 * the serializer of a preset.
		 *
		 * A field whose reference book the dictionary left on the server (DeferredItems) is read here
		 * with the values once the picker of that field has asked for them: the row of the field words
		 * its chosen value out of them, and nothing above needs to know they arrived later.
		 *
		 * @public
		 * @return {FieldDescriptor[]}
		 */
		getDescriptors()
		{
			const items = this.getEntity().deferredItems;
			if (!Type.isPlainObject(items) || Object.keys(items).length === 0)
			{
				return this.fieldDescriptors;
			}

			return this.fieldDescriptors.map((descriptor) => {
				if (descriptor.itemsDeferred !== true || !Type.isArray(items[descriptor.id]))
				{
					return descriptor;
				}

				// the values are here, so both the flag and the number they were promised by are
				// answered by the values themselves from now on
				const { itemsDeferred, itemsCount, ...rest } = descriptor;

				return { ...rest, items: items[descriptor.id] };
			});
		}

		/**
		 * Reads the values of one field of this list, for a field the dictionary left them on the server.
		 * Null when the filter was given no way to ask - a story with a dictionary of its own.
		 *
		 * @public
		 * @return {?function(string): Promise<?FieldItem[]>}
		 */
		getFieldItemsLoader()
		{
			return this.loadFieldItems;
		}

		/**
		 * Groups the form draws its fields in, in the order of the server. Empty for a list the web
		 * does not group - the form then draws one flat list.
		 *
		 * @public
		 * @return {FieldSection[]}
		 */
		getSections()
		{
			return this.fieldSections;
		}

		/**
		 * Leading icons of the field rows, keyed by field id. Field codes belong to the consumer,
		 * so the map comes with the props - the same seam the sorting icons go through - and a
		 * field the map says nothing about is rendered without an icon.
		 *
		 * @public
		 * @return {FieldIcons}
		 */
		getFieldIcons()
		{
			return this.fieldIcons;
		}

		/**
		 * Icons of the group titles, keyed by section id. Section codes belong to the consumer the
		 * same way field codes do, and a group the map says nothing about keeps its title alone.
		 *
		 * @public
		 * @return {FieldIcons}
		 */
		getSectionIcons()
		{
			return this.sectionIcons;
		}

		/**
		 * Which picker opens for which entity of CONTRACT-DTO-01. The vocabulary of entities
		 * belongs to the consumer - Tasks names projects and flows, CRM names contacts and
		 * companies - so the component is given the map instead of holding one.
		 *
		 * @public
		 * @return {EntitySelectorMap}
		 */
		getEntitySelectors()
		{
			return this.entitySelectors;
		}

		/**
		 * Seam for a field the generic controls cannot serve. The consumer opens its own editor
		 * and returns true; anything else leaves the field to the component.
		 *
		 * @public
		 * @param {FieldOpenRequest} params
		 * @return {boolean}
		 */
		openField(params)
		{
			return this.props.onOpenField?.(params) === true;
		}

		/**
		 * @private
		 * @return {FieldFilterEntity}
		 */
		getEntity()
		{
			return selectFilterByGridId(store.getState(), this.gridId);
		}

		/**
		 * @public
		 * @return {FilterValues}
		 */
		getValues()
		{
			return this.getEntity().values;
		}

		/**
		 * @public
		 * @return {string}
		 */
		getSearch()
		{
			return this.getEntity().search;
		}

		/**
		 * Fields the current filter puts on the form: the rows of its preset, as the web shows them.
		 * Empty when no preset is applied - the form then draws the fields the provider marks as
		 * default, which is what the web does for its own "no preset" state.
		 *
		 * @public
		 * @return {string[]}
		 */
		getRows()
		{
			return this.getEntity().rows;
		}

		/**
		 * The fields the form is composed of, as the user picked them in the field selector. An empty
		 * set means the fields of the provider, the same way it does for a filter that names no preset,
		 * so "back to the default fields" is a set of nothing.
		 *
		 * A field taken off the form loses its value: left behind, it would narrow the list by a
		 * condition no row on the screen shows.
		 *
		 * The set goes to the server as well, where the web filter keeps its own: it belongs to the
		 * user and not to the session of the app, so a field added here is on the web form of the
		 * same list and is still on the mobile one after the app is restarted. The form does not wait
		 * for that answer - the rows are already on the screen, the way the web applies its own field
		 * list before saving it.
		 *
		 * @public
		 * @param {string[]} rows
		 */
		setRows(rows)
		{
			store.dispatch(filterRowsChanged({
				gridId: this.gridId,
				rows,
				values: dropValuesOutsideSet(this.fieldDescriptors, rows, this.getValues()),
			}));

			// one save after another: two sets in flight are answered in whatever order the network gives
			// them, and the older answer would leave the server holding the set the user has already
			// changed - the form then shows the new one until the app is restarted
			void runInOrder(this, () => (this.saveFieldSet?.(rows) ?? Promise.resolve()))
				.catch((error) => console.error(error))
			;
		}

		/**
		 * @public
		 * @param {string} fieldId
		 * @param {FieldValue} value
		 */
		setValue(fieldId, value)
		{
			store.dispatch(filterValueChanged({ gridId: this.gridId, fieldId, value }));
		}

		/**
		 * @public
		 * @param {string} search
		 */
		setSearch(search)
		{
			store.dispatch(filterSearchChanged({ gridId: this.gridId, search }));
		}

		/**
		 * The preset selected right now. Lives in the slice, not in the drawer: the drawer is
		 * rebuilt on every open and would otherwise lose the choice made during the session.
		 *
		 * @public
		 * @return {string|null}
		 */
		getCurrentFilterId()
		{
			return this.getEntity().currentFilterId;
		}

		/**
		 * @public
		 * @param {string|null} currentFilterId
		 */
		setCurrentFilterId(currentFilterId)
		{
			store.dispatch(filterCurrentFilterIdChanged({ gridId: this.gridId, currentFilterId }));
		}

		/**
		 * Saved filters of this list, as the store holds them. The drawer draws the strip from
		 * here at once and lets the request refresh it in the background.
		 *
		 * @public
		 * @return {SavedFilter[]}
		 */
		getPresets()
		{
			return this.getEntity().presets;
		}

		/**
		 * False only until the list has been fetched for the first time - the single case where
		 * there is genuinely nothing to draw.
		 *
		 * @public
		 * @return {boolean}
		 */
		arePresetsLoaded()
		{
			return this.getEntity().presetsLoaded;
		}

		/**
		 * The set the selected preset filters by, and nothing while no preset is selected. The set the
		 * reset of the field list gives back: the web shows exactly the rows of the current preset after
		 * its own reset (main.ui.filter restoreDefaultFields() re-applies the current preset),
		 * and an empty answer leaves the form to the fields the provider marks `default`.
		 *
		 * @public
		 * @return {string[]}
		 */
		getCurrentPresetRows()
		{
			const currentFilterId = this.getCurrentFilterId();
			const preset = this.getPresets().find(({ id }) => id === currentFilterId);

			return Type.isArray(preset?.rows) ? preset.rows : [];
		}

		/**
		 * The preset the list opens on, as the web keeps it: the pinned one. Null when nothing is
		 * pinned - the list then opens on the filter the user left it with.
		 *
		 * @public
		 * @return {string|null}
		 */
		getDefaultPresetId()
		{
			return this.getEntity().defaultPresetId;
		}

		/**
		 * Whether this user may make a filter of the list common to everyone. The server weighs the
		 * same operation of the portal before it accepts `setForAll`/`unsetForAll`
		 * (SavedFilterStorage::changeForAll), so an action offered without the right is applied on the
		 * screen and taken back on the answer, every time.
		 *
		 * @public
		 * @return {boolean}
		 */
		canEditForAll()
		{
			return this.getEntity().canEditForAll === true;
		}

		/**
		 * Puts a list freshly read from the server down as it came.
		 *
		 * @public
		 * @param {SavedFiltersData} data
		 */
		setSavedFilters(data)
		{
			store.dispatch(filterPresetsLoaded({
				gridId: this.gridId,
				presets: data?.presets,
				defaultPresetId: data?.defaultPresetId ?? null,
				canEditForAll: data?.canEditForAll === true,
			}));
		}

		/**
		 * Every action below changes the store before its request is sent, so the list on the screen
		 * answers the tap on the same frame; the caller keeps the snapshot and puts it back when the
		 * server refuses (see saved-filters/mutation).
		 *
		 * @public
		 * @param {SavedFilter} preset
		 */
		savePreset(preset)
		{
			store.dispatch(filterPresetSaved({ gridId: this.gridId, preset }));
		}

		/**
		 * @public
		 * @param {string} presetId
		 */
		removePreset(presetId)
		{
			store.dispatch(filterPresetRemoved({ gridId: this.gridId, presetId }));
		}

		/**
		 * The order the list shows its saved filters in, as the user dragged them. Kept on the server
		 * as the `sort` of a preset - the same value the web orders its own strip by.
		 *
		 * @public
		 * @param {string[]} presetIds in the order the list is to show them
		 */
		reorderPresets(presetIds)
		{
			store.dispatch(filterPresetsReordered({ gridId: this.gridId, presetIds }));
		}

		/**
		 * @public
		 * @param {string} presetId
		 */
		pinPreset(presetId)
		{
			store.dispatch(filterPresetPinned({ gridId: this.gridId, presetId }));
		}

		/**
		 * @public
		 */
		unpinPreset()
		{
			store.dispatch(filterPresetPinned({ gridId: this.gridId, presetId: null }));
		}

		/**
		 * Shows one preset to everyone on the portal, or takes it back.
		 *
		 * @public
		 * @param {string} presetId
		 * @param {boolean} forAll
		 */
		setPresetForAll(presetId, forAll)
		{
			store.dispatch(filterPresetForAllChanged({ gridId: this.gridId, presetId, forAll }));
		}

		/**
		 * State to go back to when a request behind an applied action fails. Copied field by field:
		 * a reference into the store would follow the very change it has to undo.
		 *
		 * @public
		 * @return {FieldFilterSnapshot}
		 */
		getSnapshot()
		{
			const entity = this.getEntity();

			return {
				values: { ...entity.values },
				search: entity.search,
				currentFilterId: entity.currentFilterId,
				rows: [...entity.rows],
				presets: [...entity.presets],
				defaultPresetId: entity.defaultPresetId,
				presetsLoaded: entity.presetsLoaded,
			};
		}

		/**
		 * @public
		 * @param {FieldFilterSnapshot} snapshot
		 */
		restoreSnapshot(snapshot)
		{
			store.dispatch(filterSnapshotRestored({ gridId: this.gridId, snapshot }));
		}

		/**
		 * Reset takes every applied condition off the list and leaves the form as the user
		 * composed it: the values and the search string go, the set of fields stays. A pinned preset is
		 * a filter like any other here - putting its conditions back would leave the counters lit right
		 * after the tap that was meant to clear them.
		 *
		 * @public
		 */
		reset()
		{
			this.clear();
		}

		/**
		 * No preset and no conditions: what dropping the selected preset leaves behind. The set of
		 * fields is not touched - it belongs to the user and not to the conditions of the session.
		 *
		 * @public
		 */
		clear()
		{
			store.dispatch(filterReset({ gridId: this.gridId }));
		}

		/**
		 * @public
		 * @return {FieldFilterData}
		 */
		getData()
		{
			const entity = this.getEntity();

			return {
				tmpFields: serializeValues(this.fieldDescriptors, entity.values, entity.search),
				search: entity.search,
				currentFilterId: entity.currentFilterId,
			};
		}

		/**
		 * Number of active conditions (used for the entry-button badge).
		 *
		 * @public
		 * @return {number}
		 */
		getActiveCount()
		{
			const entity = this.getEntity();

			// the same test the request is built by: an "active condition" must mean one thing
			// for the badge, for the form and for the wire
			return buildRows(this.fieldDescriptors, entity.values, entity.search).length;
		}

		/**
		 * Saved filters are optional: without a service and without an action namespace the
		 * section is not rendered at all and the form keeps working as an ad-hoc filter.
		 *
		 * A ready service can be handed in - a story or a suite supplies its own and never
		 * reaches the network, the same seam the field dictionary goes through.
		 *
		 * @public
		 * @return {SavedFiltersApi|null}
		 */
		getSavedFiltersService()
		{
			if (this.savedFiltersService === null)
			{
				this.savedFiltersService = this.createSavedFiltersService();
			}

			return this.savedFiltersService;
		}

		/**
		 * @private
		 * @return {SavedFiltersApi|null}
		 */
		createSavedFiltersService()
		{
			const { savedFiltersService, savedFilters } = this.props;

			if (savedFiltersService)
			{
				return savedFiltersService;
			}

			if (!Type.isPlainObject(savedFilters) || !Type.isStringFilled(savedFilters.actionPrefix))
			{
				return null;
			}

			return new SavedFiltersService({
				actionPrefix: savedFilters.actionPrefix,
				context: this.context,
			});
		}

		/**
		 * Fills the form from a saved preset and marks it as the current one.
		 *
		 * @public
		 * @param {SavedFilter} preset
		 */
		applyPreset(preset)
		{
			const { values, search } = deserializeValues(this.fieldDescriptors, preset?.fields);

			store.dispatch(filterValuesReplaced({
				gridId: this.gridId,
				values,
				search,
				currentFilterId: Type.isStringFilled(preset?.id) ? preset.id : null,
				rows: Type.isArray(preset?.rows) ? preset.rows : [],
			}));
		}

		/**
		 * @public
		 */
		apply()
		{
			this.props.onApply?.(this.getData());
		}

		/**
		 * Opens the filter drawer (BottomSheet, top segment - Q-1 resolved).
		 *
		 * @public
		 * @param {PageManager} [parentWidget]
		 * @param {FieldFilterOpenOptions} [options]
		 * @return {Promise}
		 */
		open(parentWidget = null, options = {})
		{
			return FieldFilterDrawer.open(this, parentWidget, options);
		}
	}

	module.exports = { FieldFilter };
});
