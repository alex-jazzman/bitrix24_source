/**
 * @module layout/ui/field-filter/filter/src/drawer
 */
jn.define('layout/ui/field-filter/filter/src/drawer', (require, exports, module) => {
	const { Loc } = require('loc');
	const { Type } = require('type');
	const { openFilterSheet } = require('layout/ui/field-filter/filter/src/layout/sheet');
	const { Color } = require('tokens');
	const { PureComponent } = require('layout/pure-component');
	const { createTestIdGenerator } = require('utils/test');
	const { AreaList } = require('ui-system/layout/area-list');
	const { Box } = require('ui-system/layout/box');
	const { FilterFooter } = require('layout/ui/field-filter/filter/src/layout/footer');
	const { SelectedFields } = require('layout/ui/field-filter/filter/src/fields/selected-fields');
	const { FieldSelector } = require('layout/ui/field-filter/filter/src/fields/field-selector');
	const { SortingSection } = require('layout/ui/field-filter/filter/src/sorting-section');
	const { SavedFiltersSection } = require('layout/ui/field-filter/filter/src/saved-filters/section');

	/**
	 * "Filters and sorting" drawer. Container is a BottomSheet pinned to the top
	 * segment (Q-1 resolved: bottom-sheet). Sections top-to-bottom: saved filters,
	 * sorting, fields. Apply is the only footer button; the title and the reset
	 * belong to the navigation bar of the sheet (BXML `NavBar title` + `ActionText`),
	 * so they stay put while the content scrolls under them.
	 *
	 * @extends {PureComponent<FieldFilterDrawerProps, FieldFilterDrawerState>}
	 */
	class FieldFilterDrawer extends PureComponent
	{
		/**
		 * @param {FieldFilterDrawerProps} props
		 */
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({ context: this, prefix: 'field-filter-drawer' });
			this.state = { revision: 0 };
			/** @type {Promise|null} the application a second tap joins instead of starting its own */
			this.applying = null;

			// bound once: an arrow rebuilt on every render never equals the previous prop, so
			// every section would re-render on every keystroke in a field
			this.refresh = this.refresh.bind(this);
			this.onFieldChange = this.onFieldChange.bind(this);
			this.openField = (params) => this.props.filter.openField(params);
			this.addFields = this.addFields.bind(this);
			this.resetFields = this.resetFields.bind(this);
			this.applyFieldSet = this.applyFieldSet.bind(this);
			this.apply = this.apply.bind(this);
		}

		componentDidMount()
		{
			this.setResetButton();
		}

		/**
		 * Reset is an action of the navigation bar: the title area of the sheet has no slot
		 * for a custom view, and a row inside the content would scroll away with it.
		 */
		setResetButton()
		{
			this.props.widget?.setRightButtons?.([
				{
					id: 'field-filter-drawer-reset',
					testId: this.getTestId('reset'),
					name: Loc.getMessage('M_FIELD_FILTER_RESET'),
					color: Color.accentMainLinks.toHex(),
					callback: () => this.reset(),
				},
			]);
		}

		/**
		 * The form reads its values from the filter, not from the state, so a re-render is
		 * requested by a counter: an empty setState does not pass shouldComponentUpdate.
		 */
		refresh()
		{
			this.setState({ revision: this.state.revision + 1 });
		}

		/**
		 * The tap clears the conditions, puts the default order back and takes both off the list at
		 * once - reset is an action over the list, not a change of the form waiting for apply.
		 * The sheet stays open: the form is cleared to be composed anew.
		 *
		 * The list has to be reloaded here because the form has no draft of its own: the tap reaches
		 * the state of the filter directly, so a reset left unapplied leaves the list showing the rows
		 * the filter no longer asks for and the button showing the counter over them - the counter is
		 * redrawn by a reload of the list and by nothing else. A sheet then closed by a swipe would
		 * keep that disagreement instead of the state apply leaves.
		 *
		 * The fields of the form are left alone: reset fields in the fields section is the action
		 * that composes the form.
		 */
		async reset()
		{
			// the save of the default order is a request, and the form is not waiting for it: cleared
			// after the round trip, the sheet stands with its chips filled and the button dead for as
			// long as the network takes. Only the half that reaches the list waits - same reason as in
			// apply()
			const sorted = this.resetSorting();

			this.props.filter.reset();
			this.refresh();

			await sorted;

			this.props.filter.apply();
		}

		/**
		 * The order of the list is kept by the server, so a list asked for while the save of the order
		 * is still on its way comes back under the order it replaced - and the drawer already shows the
		 * new one. The wait is the request the tap on the row started; a save that fails is answered
		 * all the same (`ItemsSortManager::whenSaved()` never rejects), so the filter is applied either
		 * way.
		 */
		apply()
		{
			// the button stays live for the whole wait, and two taps must not apply the filter twice:
			// every application reloads the list, and the sheet is closed by the first one
			this.applying ??= this.applyWhenSorted().finally(() => {
				this.applying = null;
			});

			return this.applying;
		}

		/**
		 * @return {Promise<void>}
		 */
		async applyWhenSorted()
		{
			const { filter, onApply, sorting } = this.props;

			await sorting?.whenSaved?.();

			filter.apply();
			onApply?.();
		}

		/**
		 * AC-014: the reset gives the list its default order back. The default is the first type the
		 * consumer offers - the same one `BaseListSorting` starts with - so the drawer needs no
		 * separate answer about it.
		 */
		resetSorting()
		{
			const { sorting, sortTypes } = this.props;
			const [defaultType] = Object.keys(Type.isPlainObject(sortTypes) ? sortTypes : {});

			if (sorting && defaultType)
			{
				return sorting.setType(defaultType);
			}

			return Promise.resolve();
		}

		onFieldChange(fieldId, value)
		{
			this.props.filter.setValue(fieldId, value);
			this.refresh();
		}

		render()
		{
			return Box(
				{
					testId: this.getTestId(),
					withScroll: true,
					backgroundColor: Color.bgPrimary,
					footer: this.renderFooter(),
				},
				AreaList(
					{
						testId: this.getTestId('areas'),
						withScroll: false,
					},
					...this.renderSections(),
				),
			);
		}

		/**
		 * Saved filters and sorting are both optional (a project list has neither), so the
		 * top padding of the first area (BXML `Area firstInList="true"`) goes to whichever
		 * section opens the list.
		 *
		 * @return {Array}
		 */
		renderSections()
		{
			const { filter, sorting } = this.props;
			const service = filter.getSavedFiltersService();

			// the top padding of the first area (BXML `Area firstInList="true"`) belongs to whichever
			// section opens the list, so "first" is the position and not a chain of negations
			return [
				service && ((isFirst) => this.renderSavedFiltersSection(service, isFirst)),
				sorting && ((isFirst) => this.renderSortingSection(isFirst)),
				(isFirst) => this.renderFieldsSection(isFirst),
			]
				.filter(Boolean)
				.map((renderSection, index) => renderSection(index === 0));
		}

		/**
		 * The sections are pure, so what they draw comes down as props - the same way the form is
		 * given its values. A section reading the selection out of the shared filter cannot be
		 * repainted at all: its own props stay the same when the selection moves, and a reset would
		 * leave the chip filled and the checkmark on the order the list no longer has.
		 */
		renderSavedFiltersSection(service, isFirst)
		{
			const { filter, parentWidget } = this.props;

			return new SavedFiltersSection({
				testId: this.getTestId(),
				filter,
				service,
				presets: filter.getPresets(),
				currentFilterId: filter.getCurrentFilterId(),
				parentWidget,
				isFirst,
				onChange: this.refresh,
			});
		}

		renderSortingSection(isFirst)
		{
			const { sorting, sortTypes } = this.props;

			return new SortingSection({
				testId: this.getTestId(),
				sorting,
				sortType: sorting.getType(),
				types: sortTypes,
				isFirst,
				onChange: this.refresh,
			});
		}

		renderFieldsSection(isFirst)
		{
			const { filter, parentWidget } = this.props;

			return new SelectedFields({
				testId: this.getTestId(),
				descriptors: filter.getDescriptors(),
				values: filter.getValues(),
				rows: filter.getRows(),
				defaultRows: filter.getCurrentPresetRows(),
				fieldIcons: filter.getFieldIcons(),
				entitySelectors: filter.getEntitySelectors(),
				gridId: filter.gridId,
				parentWidget,
				loadFieldItems: filter.getFieldItemsLoader?.() ?? null,
				isFirst,
				onChange: this.onFieldChange,
				onOpenField: this.openField,
				onAddFields: this.addFields,
				onResetFields: this.resetFields,
			});
		}

		/**
		 * The whole dictionary is offered on a screen of its own: the groups of the entities hold
		 * hundreds of fields, and the drawer shows the filter rather than the choice of its fields.
		 */
		addFields()
		{
			void FieldSelector.open(this.getFieldSelectorOptions());
		}

		/**
		 * What the screen of the whole dictionary is opened with. Both maps of icons go with it: the
		 * groups of the server name theirs, and the fields of the list keep on that screen the icons
		 * they are read by on this one.
		 *
		 * @return {FieldSelectorOptions}
		 */
		getFieldSelectorOptions()
		{
			const { filter, parentWidget } = this.props;

			return {
				descriptors: filter.getDescriptors(),
				sections: filter.getSections(),
				sectionIcons: filter.getSectionIcons(),
				fieldIcons: filter.getFieldIcons(),
				rows: filter.getRows(),
				// the form shows a field carrying a value even when the set does not name it, and that
				// row has to be chosen on the screen the set is composed on
				values: filter.getValues(),
				parentWidget,
				onApply: this.applyFieldSet,
			};
		}

		/**
		 * Back to the set of the filter that is on: the rows of the selected preset, or nothing when no
		 * preset is selected - and an empty set is the fields of the provider, for the form and for the
		 * server alike.
		 */
		resetFields()
		{
			this.applyFieldSet(this.props.filter.getCurrentPresetRows());
		}

		/**
		 * @param {string[]} rows
		 */
		applyFieldSet(rows)
		{
			this.props.filter.setRows(rows);
			this.refresh();
		}

		renderFooter()
		{
			return FilterFooter({
				testId: this.getTestId('footer'),
				buttonTestId: this.getTestId('apply'),
				text: Loc.getMessage('M_FIELD_FILTER_APPLY'),
				onClick: this.apply,
			});
		}

		/**
		 * Opens the drawer in a top-segment BottomSheet with the wide title.
		 *
		 * @param {FieldFilter} filter
		 * @param {PageManager} [parentWidget]
		 * @param {FieldFilterOpenOptions} [options]
		 * @return {Promise}
		 */
		static open(filter, parentWidget = null, options = {})
		{
			return openFilterSheet({
				title: Loc.getMessage('M_FIELD_FILTER_DRAWER_TITLE'),
				largeTitle: true,
				parentWidget,
				component: ({ widget, close }) => new FieldFilterDrawer({
					filter,
					widget,
					parentWidget: widget,
					sorting: options.sorting,
					sortTypes: options.sortTypes,
					onApply: close,
				}),
			});
		}
	}

	module.exports = { FieldFilterDrawer };
});
