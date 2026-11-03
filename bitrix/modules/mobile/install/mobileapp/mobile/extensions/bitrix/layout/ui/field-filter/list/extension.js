/**
 * @module layout/ui/field-filter/list
 */
jn.define('layout/ui/field-filter/list', (require, exports, module) => {
	const { Type } = require('type');
	const { Loc } = require('loc');
	const { showErrorToast } = require('toast');
	const store = require('statemanager/redux/store');
	const {
		filterDictionaryLoaded,
		filterFieldItemsReset,
	} = require('statemanager/redux/slices/field-filter');
	const { NO_PRESET_ID } = require('layout/ui/field-filter/values');
	const { ListFilterEntry } = require('layout/ui/field-filter/entry');
	const {
		FieldFilter,
		loadFilterFields,
		loadFilterFieldItems,
		saveFilterFieldSet,
	} = require('layout/ui/field-filter/filter');
	const { deserializeValues } = require('layout/ui/field-filter/values');

	/**
	 * Owner of the unified filter on the side of a list screen: it loads the field dictionary,
	 * keeps the search string alive until the dictionary arrives, produces the request payload
	 * and the navigation-bar button, and opens the drawer.
	 *
	 * Everything here is the same for every list, which is why it is not written per screen. What
	 * differs comes in through the config - the action namespace, the context naming the list, the
	 * icons of the fields, the pickers of the entities, the sorting and its wordings - the same
	 * seams StatefulList uses for its own lists.
	 *
	 * The answers a screen needs before the drawer exists - the button, the search string, the
	 * request payload - come from `ListFilterEntry`: a screen may hold the stand-in instead of this
	 * class and never load the drawer graph on a start that does not open the filter.
	 */
	class ListFilter extends ListFilterEntry
	{
		/**
		 * @param {ListFilterConfig} config
		 */
		constructor(config)
		{
			super(config);

			/** @type {FieldFilter|null} */
			this.filter = null;
			this.request = null;
			/** @type {Promise|null} the opening a second tap joins instead of starting its own */
			this.opening = null;
			/**
			 * Which address of the list a dictionary request belongs to. The address may change while
			 * the answer is on its way, and an answer of the previous list is not an answer at all.
			 */
			this.generation = 0;
		}

		/**
		 * @return {boolean}
		 */
		isResolved()
		{
			return true;
		}

		/**
		 * Forgets the loaded dictionary; the next opening asks for it again.
		 *
		 * @public
		 */
		invalidate()
		{
			this.filter = null;
			this.request = null;
			this.search = '';
			this.generation++;
		}

		/**
		 * @return {boolean}
		 */
		isReady()
		{
			return this.filter !== null;
		}

		/**
		 * Loaded once: a screen may ask on its first render or only when the drawer is opened,
		 * and a failed request is not remembered, so the next attempt tries again.
		 *
		 * @return {Promise<boolean>}
		 */
		load()
		{
			if (this.filter !== null)
			{
				return Promise.resolve(true);
			}

			this.request ??= this.requestDictionary(this.generation)
				// a request that never reached the server rejects instead of answering
				// (RunActionExecutor), and every caller of this either voids the promise or awaits it
				// on a path of its own - an escaping rejection is a silence plus a warning in the log,
				// while `false` is an answer the screen can act on
				.catch(() => false)
				.finally(() => {
					if (this.filter === null)
					{
						this.request = null;
					}
				})
			;

			return this.request;
		}

		/**
		 * @param {number} generation the address of the list this request was started for
		 * @return {Promise<boolean>}
		 */
		async requestDictionary(generation)
		{
			const {
				actionPrefix,
				context,
				fieldIcons,
				sectionIcons,
				entitySelectors,
				onOpenField,
				onApply,
				loadFields = loadFilterFields,
				// a story or a suite reads the values of a field its own way and never reaches the network
				loadFieldItems,
				// a story or a suite keeps the set of fields of its own and never reaches the network
				saveFieldSet,
				// a story or a suite hands in its own storage of presets and never reaches the network
				savedFiltersService,
			} = this.config;

			const dictionary = await loadFields({ actionPrefix, context });
			// the screen has left the list this dictionary describes; its fields, its presets and the
			// values it carries all belong to that list, so the answer is dropped and the request for
			// the list on screen is left to `load()`
			if (dictionary === null || generation !== this.generation)
			{
				return false;
			}

			// the words of the controls belong to no list and outlive this screen, so they go to the
			// store: a list opened again draws its form from what is already there. A server that sends
			// none leaves the vocabulary as it stands.
			if (dictionary.dictionary !== null)
			{
				store.dispatch(filterDictionaryLoaded({ dictionary: dictionary.dictionary }));
			}

			// the reference books of the fields are as old as the dictionary they came with, so the ones
			// read on an earlier opening of this list go with it
			store.dispatch(filterFieldItemsReset({ gridId: dictionary.gridId }));

			const descriptors = this.prepareDescriptors(dictionary.fields);
			// the filter the list is already showing, as the server keeps it for the web as well:
			// without it the form would offer no value for every field the web shows filled. A screen
			// with a dictionary of its own may name no current filter - then there is none.
			const currentFilter = dictionary.currentFilter ?? {};
			const { values, search } = deserializeValues(descriptors, currentFilter.fields);

			this.filter = new FieldFilter({
				gridId: dictionary.gridId,
				context,
				fieldDescriptors: descriptors,
				fieldSections: dictionary.sections,
				fieldIcons,
				sectionIcons,
				entitySelectors,
				savedFilters: { actionPrefix },
				savedFiltersService,
				loadFieldItems: loadFieldItems ?? ((fieldId) => loadFilterFieldItems({
					actionPrefix,
					context,
					gridId: dictionary.gridId,
					fieldId,
				})),
				// the fields of the form belong to the user: the server keeps them where the web filter
				// keeps its own, so the set survives a restart of the app and is read by the web form
				saveFieldSet: saveFieldSet ?? ((rows) => saveFilterFieldSet({ actionPrefix, context, rows })),
				// seeds the session state only when it is empty: assigning it after the fact
				// overwrote the preset the user had picked before leaving the list
				initialCurrentFilterId: dictionary.currentPresetId,
				initialValues: values,
				initialSearch: search,
				initialRows: currentFilter.rows,
				onOpenField,
				onApply: () => onApply?.(),
			});

			if (this.search !== '')
			{
				this.filter.setSearch(this.search);
				this.search = '';
			}

			return true;
		}

		/**
		 * A list that shows some of its fields elsewhere drops them here - the counters of the
		 * project list live in the "---" menu, not in the drawer.
		 *
		 * @param {FieldDescriptor[]} fields
		 * @return {FieldDescriptor[]}
		 */
		prepareDescriptors(fields)
		{
			const descriptors = Type.isArray(fields) ? fields : [];
			const { prepareDescriptors } = this.config;

			return Type.isFunction(prepareDescriptors) ? prepareDescriptors(descriptors) : descriptors;
		}

		/**
		 * @return {FieldDescriptor[]}
		 */
		getDescriptors()
		{
			return this.filter?.getDescriptors() ?? [];
		}

		/**
		 * @return {FilterValues}
		 */
		getValues()
		{
			return this.filter?.getValues() ?? {};
		}

		/**
		 * @return {string}
		 */
		getSearch()
		{
			return this.filter?.getSearch() ?? this.search;
		}

		/**
		 * @param {string} text
		 */
		setSearch(text)
		{
			const value = (Type.isString(text) ? text : '');

			if (this.filter)
			{
				this.filter.setSearch(value);

				return;
			}

			this.search = value;
		}

		/**
		 * Request payload for the list action (CONTRACT-API-01). Until the dictionary arrives the
		 * stand-in answers with the search string alone.
		 *
		 * A loaded filter names the preset in the vocabulary of the web: an id, or `default_filter`
		 * for "no preset". The empty string is left to the stand-in and means something else - the
		 * client has read no state yet, so the list is to be shown as the server holds it.
		 *
		 * @return {ListFilterData}
		 */
		getData()
		{
			if (!this.filter)
			{
				return super.getData();
			}

			const { tmpFields, search, currentFilterId } = this.filter.getData();

			return { tmpFields, search, currentFilterId: currentFilterId ?? NO_PRESET_ID };
		}

		/**
		 * @return {number}
		 */
		getActiveCount()
		{
			return this.filter?.getActiveCount() ?? super.getActiveCount();
		}

		/**
		 * @return {Promise<void>}
		 */
		async reset()
		{
			this.search = '';
			await this.filter?.reset();
		}

		/**
		 * The dictionary is asked for without an indicator, so the button of the navigation bar stays
		 * live for the whole round trip: two taps would otherwise build two drawers, one over the
		 * other. Both taps get the same opening.
		 *
		 * @param {PageManager} [parentWidget]
		 * @return {Promise}
		 */
		async open(parentWidget = null)
		{
			this.opening ??= this.openDrawer(parentWidget).finally(() => {
				this.opening = null;
			});

			return this.opening;
		}

		/**
		 * @protected
		 * @param {PageManager} [parentWidget]
		 * @return {Promise}
		 */
		async openDrawer(parentWidget = null)
		{
			if (!await this.load())
			{
				// the dictionary is the drawer: without it there is nothing to open, and a tap answered
				// by nothing at all reads as a broken button - the reasons are all invisible from here
				// (no network, no access to the list, a context the server does not know)
				showErrorToast({ message: Loc.getMessage('M_FIELD_FILTER_OPEN_FAILED') }, parentWidget);

				return;
			}

			await this.filter.open(parentWidget, {
				sorting: this.config.sorting ?? null,
				sortTypes: this.config.sortTypes,
			});
		}
	}

	/**
	 * The owner of the filter on the side of a list screen: it loads the field dictionary, holds the
	 * search string, counts the conditions, draws the button of the navigation bar and opens the
	 * drawer. A list screen needs nothing else from the filter.
	 *
	 * A screen that would rather not carry the drawer on every start names
	 * `layout/ui/field-filter/entry` in its `deps.php` and starts with `ListFilterEntry`: the same
	 * methods, and this extension is loaded by the screen itself when the drawer is first opened
	 * (`loadListFilter` of the configuration).
	 */
	module.exports = { ListFilter };
});
