/**
 * @module layout/ui/field-filter/entry
 */
jn.define('layout/ui/field-filter/entry', (require, exports, module) => {
	const { Type } = require('type');
	const { Icon } = require('assets/icons');
	const { SEARCH_FIELD_ID, NO_PRESET_ID } = require('layout/ui/field-filter/values');

	/**
	 * The filter of a list before its drawer exists: it answers what a screen asks on every render -
	 * the button of the navigation bar, the search string, the payload of the list request - and
	 * holds the search string until the form arrives.
	 *
	 * That is the whole surface a list needs while the drawer is closed, and a start that never
	 * opens the drawer needs no more: `layout/ui/field-filter/filter` carries the form, the
	 * controls, the pickers and the saved filters, so a screen that names it in `deps.php` pays for
	 * that graph on every start. A screen names this extension instead and calls `open()`; the graph
	 * arrives then.
	 *
	 * `ListFilter` continues this class, so the methods are the same before and after loading. The
	 * screen is handed the loaded filter through `onResolve` and keeps it from that moment: the
	 * conditions the user applies live in it, and a screen still reading the stand-in would not see
	 * them.
	 */
	class ListFilterEntry
	{
		/**
		 * @param {ListFilterConfig} config
		 */
		constructor(config)
		{
			this.config = config;
			this.search = (Type.isString(config.search) ? config.search : '');
			/** @type {ListFilterInstance|null} */
			this.resolved = null;
			this.resolveRequest = null;
		}

		/**
		 * True for the loaded filter, false while this is its stand-in.
		 *
		 * @return {boolean}
		 */
		isResolved()
		{
			return false;
		}

		/**
		 * Loads the drawer graph and gives the screen the filter itself, seeded with what the
		 * stand-in has collected. Loaded once: the button of the navigation bar keeps the callback
		 * it was drawn with until the next render, so a second tap must not build a second filter.
		 *
		 * An extension that is not installed on the portal answers `undefined` - the screen then
		 * keeps the stand-in, and the list goes on filtering by its search string.
		 *
		 * @return {Promise<ListFilterInstance|null>}
		 */
		async resolve()
		{
			if (this.isResolved())
			{
				return this;
			}

			this.resolveRequest ??= this.loadFilter().finally(() => {
				if (this.resolved === null)
				{
					this.resolveRequest = null;
				}
			});

			return this.resolveRequest;
		}

		/**
		 * Reads the state of the list into the filter without opening the drawer: the values the
		 * storage shared with the web holds, the presets and the dictionary of the fields.
		 *
		 * A screen answers some questions out of the filter before the user has ever opened it - the
		 * role of the list a "read all" acts on, the counter it writes next to the conditions of the
		 * user - and a filter that has read no state answers those with nothing. Nothing is a
		 * wrong answer there and not a missing one: it reads as "no role" and "no conditions", so the
		 * screen asks for the state first and answers after.
		 *
		 * Costs one request at most: the dictionary is loaded once and kept
		 * (`ListFilter::load()`), so a screen may ask on every such action.
		 *
		 * Answers whether the state was read. A request that never reached the server answers `false`
		 * instead of rejecting (`ListFilter::load()`), and so does a server that names no list; the
		 * screen decides by that answer whether its action still means what it was going to mean,
		 * because an action drawn from a filter that read nothing names the role of nobody and the
		 * conditions of no list.
		 *
		 * A portal without the drawer extension answers `false` as well, and the action is taken back
		 * there too: such a portal has no drawer to open either - the button of the navigation bar
		 * answers a tap with an error toast (`ListFilter::openDrawer()`) - so a screen degraded that
		 * far is better left showing what it shows than acting on a list it cannot describe.
		 *
		 * @public
		 * @return {Promise<boolean>}
		 */
		async readState()
		{
			const filter = await this.resolve();

			return (await filter?.load()) ?? false;
		}

		/**
		 * The drawer graph is loaded by the screen and not named here: `layout/ui/field-filter/list`
		 * is an extension of this module, and this one is in its `deps.php` (`ListFilter` continues
		 * this class), so naming it back would close a cycle. The screen lives in another module and
		 * loads it the way any module loads a foreign extension.
		 *
		 * @private
		 * @return {Promise<ListFilterInstance|null>}
		 */
		async loadFilter()
		{
			const { ListFilter } = await this.config.loadListFilter?.() ?? {};
			if (!ListFilter)
			{
				return null;
			}

			this.resolved = new ListFilter({ ...this.config, search: this.getSearch() });
			this.config.onResolve?.(this.resolved);

			return this.resolved;
		}

		/**
		 * The order of the list outlives the filter and is owned by the screen, so it arrives
		 * separately from the config.
		 *
		 * @public
		 * @param {ListSorting|null} sorting
		 * @param {SortingTypeMap|null} [sortTypes] the types the drawer offers; the config value stands
		 */
		setSorting(sorting, sortTypes = null)
		{
			this.config.sorting = sorting ?? null;

			if (sortTypes !== null)
			{
				this.config.sortTypes = sortTypes;
			}

			this.resolved?.setSorting(sorting, sortTypes);
		}

		/**
		 * Renames the list. The context is its address: the grid id, the presets and the items of
		 * its list fields all change with it, so what was loaded for the previous one is dropped
		 * instead of being carried over (a CRM funnel switch is exactly this).
		 *
		 * @public
		 * @param {FilterListContext} context
		 */
		setContext(context)
		{
			if (JSON.stringify(context) === JSON.stringify(this.config.context))
			{
				return;
			}

			this.config.context = context;
			this.invalidate();
		}

		/**
		 * Forgets what was loaded for the previous address of the list.
		 *
		 * @public
		 */
		invalidate()
		{
			this.search = '';
			this.resolved?.invalidate();
		}

		/**
		 * @return {boolean} the dictionary of fields is loaded
		 */
		isReady()
		{
			return false;
		}

		/**
		 * @return {FieldDescriptor[]}
		 */
		getDescriptors()
		{
			return [];
		}

		/**
		 * @return {FilterValues}
		 */
		getValues()
		{
			return {};
		}

		/**
		 * @return {string}
		 */
		getSearch()
		{
			return this.search;
		}

		/**
		 * @param {string} text
		 */
		setSearch(text)
		{
			this.search = (Type.isString(text) ? text : '');
		}

		/**
		 * @return {boolean}
		 */
		isSearchEmpty()
		{
			return this.getSearch() === '';
		}

		/**
		 * Request payload for the list action (CONTRACT-API-01). Until the form exists the filter
		 * holds the search string only and still produces a request the list understands.
		 *
		 * The empty preset is not "no preset" but "no state read yet": the list is then shown the
		 * way the server holds it, which is what the web shows on the same list. A loaded filter
		 * with no preset selected says so with NO_PRESET_ID.
		 *
		 * @return {ListFilterData}
		 */
		getData()
		{
			const search = this.getSearch();

			return {
				tmpFields: (search === '' ? {} : { [SEARCH_FIELD_ID]: search }),
				search,
				currentFilterId: '',
			};
		}

		/**
		 * @return {number}
		 */
		getActiveCount()
		{
			return (this.isSearchEmpty() ? 0 : 1);
		}

		/**
		 * Preset the request should name. A form the user has touched no longer describes the
		 * preset it started from, so the list asks for values only - the same rule on every list,
		 * hence it lives here and not in the screens.
		 *
		 * @return {string}
		 */
		getPresetId()
		{
			return this.hasActiveFields() ? NO_PRESET_ID : this.getData().currentFilterId;
		}

		/**
		 * Everything a list request carries about the filter, read in one go. A screen asking for the
		 * values and for the preset separately serializes the whole dictionary twice per request, and
		 * the two answers would describe two readings of the state instead of one.
		 *
		 * @return {{tmpFields: FilterValues, search: string, presetId: string}}
		 */
		getRequestFields()
		{
			const { tmpFields, search, currentFilterId } = this.getData();

			return {
				tmpFields,
				search,
				presetId: (this.hasActiveFields() ? NO_PRESET_ID : currentFilterId),
			};
		}

		/**
		 * Active conditions except the search string: the search string is shown on the
		 * magnifier, so the filter badge must not count it twice.
		 *
		 * @return {number}
		 */
		getActiveFieldsCount()
		{
			return this.getActiveCount() - (this.isSearchEmpty() ? 0 : 1);
		}

		/**
		 * @return {boolean}
		 */
		hasActiveFields()
		{
			return this.getActiveFieldsCount() > 0;
		}

		/**
		 * @return {boolean}
		 */
		isActive()
		{
			return !this.isSearchEmpty() || this.hasActiveFields();
		}

		/**
		 * @return {FilterValues}
		 */
		getFieldValues()
		{
			return this.getData().tmpFields;
		}

		/**
		 * @return {Promise<void>}
		 */
		async reset()
		{
			this.search = '';
			await this.resolved?.reset();
		}

		/**
		 * Loads the filter and opens its drawer.
		 *
		 * @param {PageManager} [parentWidget]
		 * @return {Promise<void>}
		 */
		async open(parentWidget = null)
		{
			const filter = await this.resolve();

			if (filter !== null && filter !== this)
			{
				await filter.open(parentWidget);
			}
		}

		/**
		 * Entry point of the drawer in the navigation bar. The badge counts the conditions of the
		 * form only - the search string has its own button.
		 *
		 * The funnel is what the portal filters by wherever it draws a filter - the chats carry it in
		 * the very same place (`im/messenger/controller/messenger-header`), so a list of another module
		 * is opened by the picture the user already reads as "filter".
		 *
		 * @param {Function} [callback] opens the drawer when omitted
		 * @return {ListFilterButton}
		 */
		getMenuButton(callback = null)
		{
			const { buttonRef } = this.config;
			const count = this.getActiveFieldsCount();

			const button = {
				id: 'filter',
				type: Icon.FILTER_FUNNEL.getIconName(),
				testId: buttonRef,
				badgeCode: buttonRef,
				accent: count > 0,
				callback: callback ?? (() => {
					void this.open();
				}),
			};

			if (count > 0)
			{
				button.badgeValue = String(count);
			}

			return button;
		}
	}

	/**
	 * The stand-in of `ListFilter` a list screen starts with: the same methods, but the drawer with its
	 * form, controls, pickers and saved filters is loaded by the screen itself when the filter is first
	 * opened (`loadListFilter` of the configuration). A start where the filter is never opened pays for
	 * none of it.
	 */
	module.exports = { ListFilterEntry };
});
