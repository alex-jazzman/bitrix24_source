/**
 * @module layout/ui/field-filter/filter/src/fields/field-selector
 */
jn.define('layout/ui/field-filter/filter/src/fields/field-selector', (require, exports, module) => {
	const { Type } = require('type');
	const { Loc } = require('loc');
	const { Color, Indent } = require('tokens');
	const { PureComponent } = require('layout/pure-component');
	const { createTestIdGenerator } = require('utils/test');
	const { useCallback } = require('utils/function');
	const { Icon } = require('ui-system/blocks/icon');
	const { Input } = require('ui-system/form/inputs/input');
	const { AreaList } = require('ui-system/layout/area-list');
	const { Box } = require('ui-system/layout/box');
	const { Text4 } = require('ui-system/typography/text');
	const { openFilterSheet } = require('layout/ui/field-filter/filter/src/layout/sheet');
	const { FilterFooter } = require('layout/ui/field-filter/filter/src/layout/footer');
	const { FilterSection, ROW_PADDING } = require('layout/ui/field-filter/filter/src/layout/section');
	const { getRowStyle } = require('layout/ui/field-filter/filter/src/layout/row-layout');
	const { CollapsibleFilterGroup } = require('layout/ui/field-filter/filter/src/layout/collapsible-group');
	const { SelectableRow } = require('layout/ui/field-filter/filter/src/layout/selectable-row');
	const { getClearProps } = require('layout/ui/field-filter/filter/src/layout/clearable-input');
	const { resolveFieldRowIcon, FIELD_ROW_ICONS_SHOWN } = require('layout/ui/field-filter/icons');
	const { matchFields } = require('layout/ui/field-filter/filter/src/fields/field-search');
	const {
		FLAT_GROUP_ID,
		groupFields,
		getVisibleFieldIds,
		orderFieldSet,
	} = require('layout/ui/field-filter/filter/src/fields/field-set');

	/**
	 * The advanced filter: the screen the whole dictionary is offered on, opened by the add-field
	 * action. It composes the set of fields the form shows and nothing else - values are given on the
	 * form itself, the way the web splits its filter and its field settings dialog.
	 *
	 * The search stands where the name of a preset stands in the builder: a CRM dictionary holds
	 * hundreds of fields across four groups, and scrolling the groups to find one by eye is the very
	 * thing the web solves with that input.
	 *
	 * @extends {PureComponent<FieldSelectorProps, FieldSelectorState>}
	 */
	class FieldSelector extends PureComponent
	{
		/**
		 * @param {FieldSelectorProps} props
		 */
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({ context: this, prefix: 'field-filter-selector' });
			this.state = {
				// the fields of the form are what the screen opens on: it changes that set, not builds
				// a new one from nothing
				selectedIds: this.getFormFieldIds(),
				search: '',
				openGroups: {},
			};

			// the input, the group headers and the footer are pure: one handler each, kept across renders
			this.setSearch = this.setSearch.bind(this);
			this.clearSearch = this.clearSearch.bind(this);
			this.apply = this.apply.bind(this);
		}

		componentDidMount()
		{
			this.setBackButton();
		}

		/**
		 * The screen opens over the drawer, so its own navigation bar goes back to it instead of
		 * closing the pair - the same answer the saved filter builder gives.
		 */
		setBackButton()
		{
			const { widget, close } = this.props;

			widget?.setLeftButtons?.([
				{
					id: 'field-filter-selector-back',
					testId: this.getTestId('back'),
					type: 'back',
					callback: () => close?.(),
				},
			]);
		}

		/**
		 * @return {FieldDescriptor[]}
		 */
		getDescriptors()
		{
			const { descriptors } = this.props;

			return Type.isArray(descriptors) ? descriptors : [];
		}

		/**
		 * @return {string[]}
		 */
		getRows()
		{
			const { rows } = this.props;

			return Type.isArray(rows) ? rows : [];
		}

		/**
		 * @return {FilterValues}
		 */
		getValues()
		{
			const { values } = this.props;

			return Type.isPlainObject(values) ? values : {};
		}

		/**
		 * The fields the form is showing right now: the rows of the filter and whatever carries a
		 * value outside them. The screen opens on this answer and gives it back to the form, so a
		 * field the user can see there is never taken off it by a tap on apply alone.
		 *
		 * @return {string[]}
		 */
		getFormFieldIds()
		{
			return getVisibleFieldIds(this.getDescriptors(), this.getRows(), this.getValues());
		}

		/**
		 * @param {string} fieldId
		 * @return {boolean}
		 */
		isSelected(fieldId)
		{
			return this.state.selectedIds.includes(fieldId);
		}

		/**
		 * @param {string} fieldId
		 * @return {boolean}
		 */
		isLocked(fieldId)
		{
			return this.getDescriptors().some(
				(descriptor) => descriptor.id === fieldId && descriptor.locked === true,
			);
		}

		/**
		 * A field the list shows by itself cannot be taken off the form: its row is there to say where
		 * the field is edited, and a filter without it would narrow nothing the list promises.
		 *
		 * @param {string} fieldId
		 */
		toggle(fieldId)
		{
			if (this.isLocked(fieldId))
			{
				return;
			}

			const { selectedIds } = this.state;

			this.setState({
				selectedIds: this.isSelected(fieldId)
					? selectedIds.filter((id) => id !== fieldId)
					: [...selectedIds, fieldId],
			});
		}

		/**
		 * @param {string} search
		 */
		setSearch(search)
		{
			this.setState({ search: Type.isString(search) ? search : '' });
		}

		clearSearch()
		{
			this.setSearch('');
		}

		/**
		 * @return {boolean}
		 */
		isSearching()
		{
			return this.state.search.trim() !== '';
		}

		/**
		 * The groups the screen draws right now: the whole dictionary, or what the query names in it.
		 * A group the query says nothing about is dropped instead of standing empty.
		 *
		 * @return {Array<{id: string, name: string|null, descriptors: FieldDescriptor[]}>}
		 */
		getGroups()
		{
			const { sections } = this.props;
			const matched = matchFields(this.getDescriptors(), this.state.search);

			return groupFields(matched, sections);
		}

		/**
		 * Whether the screen has anything to offer at all: a query naming no field of the dictionary
		 * leaves every group empty, and an empty screen under a search input reads as a broken one.
		 *
		 * @return {boolean}
		 */
		hasFields()
		{
			return this.getGroups().some((group) => group.descriptors.length > 0);
		}

		/**
		 * A query found its fields inside the groups, so the groups stand open: a closed one would hide
		 * the very field it was typed for.
		 *
		 * @param {string} groupId
		 * @return {boolean}
		 */
		isGroupOpen(groupId)
		{
			return this.isSearching() || this.state.openGroups[groupId] === true;
		}

		/**
		 * @param {string} groupId
		 */
		toggleGroup(groupId)
		{
			this.setState({
				openGroups: { ...this.state.openGroups, [groupId]: !this.isGroupOpen(groupId) },
			});
		}

		/**
		 * How many fields of the group are on the form: the number on the row of a closed group, so a
		 * group is not opened only to find out whether anything in it was chosen.
		 *
		 * @param {{descriptors: FieldDescriptor[]}} group
		 * @return {number}
		 */
		getSelectedCount(group)
		{
			return group.descriptors.filter((descriptor) => this.isSelected(descriptor.id)).length;
		}

		/**
		 * The set as the form is to keep it: the fields already on it hold their places, the newly
		 * chosen ones go after them.
		 */
		apply()
		{
			const { onApply, close } = this.props;

			onApply?.(orderFieldSet(this.getDescriptors(), this.getFormFieldIds(), this.state.selectedIds));
			close?.();
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
					this.renderFields(),
				),
			);
		}

		/**
		 * The search heads the very list it narrows, inside one area: as a section of its own it would
		 * stand a whole block of air away from the first field, and the query and its answer are read
		 * together.
		 */
		renderSearch()
		{
			const { search } = this.state;

			return View(
				{
					testId: this.getTestId('search'),
					style: {
						paddingHorizontal: ROW_PADDING,
						paddingBottom: Indent.M.toNumber(),
					},
				},
				Input({
					testId: this.getTestId('search-input'),
					value: search,
					placeholder: Loc.getMessage('M_FIELD_FILTER_SELECTOR_SEARCH'),
					leftContent: Icon.SEARCH,
					...getClearProps(search, this.clearSearch),
					onChange: this.setSearch,
				}),
			);
		}

		renderFields()
		{
			const groups = this.getGroups();
			const isFlat = groups.length === 1 && groups[0].id === FLAT_GROUP_ID;

			return FilterSection(
				{
					testId: this.getTestId('fields'),
					isFirst: true,
					divider: false,
				},
				this.renderSearch(),
				...(this.hasFields()
					? this.renderGroups(groups, isFlat)
					: [this.renderEmptyState()]),
			);
		}

		/**
		 * @param {Array<{id: string, name: string|null, descriptors: FieldDescriptor[]}>} groups
		 * @param {boolean} isFlat
		 * @return {Array}
		 */
		renderGroups(groups, isFlat)
		{
			if (isFlat)
			{
				return this.renderGroupRows(groups[0]);
			}

			return groups.map((group, index) => this.renderGroup(group, index === groups.length - 1));
		}

		/**
		 * What the screen says when the query names no field: the row keeps the metrics of a field row,
		 * so the answer stands where the fields would have been.
		 */
		renderEmptyState()
		{
			return View(
				{
					testId: this.getTestId('empty'),
					style: getRowStyle({ iconColumn: true }),
				},
				Text4({
					testId: this.getTestId('empty-text'),
					text: Loc.getMessage('M_FIELD_FILTER_SELECTOR_EMPTY'),
					color: Color.base4,
				}),
			);
		}

		/**
		 * @param {{id: string, name: string|null, descriptors: FieldDescriptor[]}} group
		 * @param {boolean} isLast
		 */
		renderGroup(group, isLast)
		{
			const { sectionIcons } = this.props;

			return CollapsibleFilterGroup(
				{
					testId: this.getTestId(`section-${group.id}`),
					title: group.name,
					icon: Type.isPlainObject(sectionIcons) ? (sectionIcons[group.id] ?? null) : null,
					expanded: this.isGroupOpen(group.id),
					counter: this.getSelectedCount(group),
					isLast,
					// the header is pure, so the group keeps one handler per id
					onToggle: useCallback(() => this.toggleGroup(group.id), [group.id]),
				},
				// the group drops the children of a closed one, so building them is work nobody sees:
				// the dictionary of a CRM list is hundreds of rows, and the groups start closed
				...(this.isGroupOpen(group.id) ? this.renderGroupRows(group) : []),
			);
		}

		/**
		 * @param {{descriptors: FieldDescriptor[]}} group
		 * @return {Array}
		 */
		renderGroupRows(group)
		{
			const { fieldIcons } = this.props;
			const { id, descriptors } = group;
			// a flat list has no header to line up with, so its rows keep the edge of the area - and
			// while the rows of the fields carry no icons, none of them has a column to line up with
			const inGroup = FIELD_ROW_ICONS_SHOWN && id !== FLAT_GROUP_ID;

			return descriptors.map((descriptor, index) => SelectableRow({
				testId: this.getTestId(`field-${descriptor.id}`),
				title: descriptor.name,
				// the field keeps the face it has on the form: bare while the form draws it bare, and
				// carrying the icon of the list the moment the form carries it again
				icon: resolveFieldRowIcon(fieldIcons, descriptor.id),
				selected: this.isSelected(descriptor.id),
				iconColumn: inGroup,
				divider: index !== descriptors.length - 1,
				onClick: useCallback(() => this.toggle(descriptor.id), [descriptor.id]),
			}));
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
		 * @param {FieldSelectorOptions} options
		 * @return {Promise}
		 */
		static open(options)
		{
			const {
				descriptors,
				sections,
				sectionIcons,
				fieldIcons,
				rows,
				values,
				parentWidget = null,
				onApply,
			} = options;

			return openFilterSheet({
				title: Loc.getMessage('M_FIELD_FILTER_SELECTOR_TITLE'),
				parentWidget,
				component: ({ widget, close }) => new FieldSelector({
					descriptors,
					sections,
					sectionIcons,
					fieldIcons,
					rows,
					values,
					widget,
					close,
					onApply,
				}),
			});
		}
	}

	module.exports = { FieldSelector };
});
