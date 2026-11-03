/**
 * @module layout/ui/field-filter/filter/src/form
 */
jn.define('layout/ui/field-filter/filter/src/form', (require, exports, module) => {
	const { Type } = require('type');
	const { Loc } = require('loc');
	const { Color } = require('tokens');
	const { PureComponent } = require('layout/pure-component');
	const { resolveFieldRowIcon } = require('layout/ui/field-filter/icons');
	const { createTestIdGenerator } = require('utils/test');
	const { useCallback } = require('utils/function');
	const { Icon } = require('ui-system/blocks/icon');
	const { SettingSelector, SettingMode } = require('ui-system/blocks/setting-selector');
	const { FieldRow } = require('layout/ui/field-filter/filter/src/fields/field-row');
	const { FilterSection } = require('layout/ui/field-filter/filter/src/layout/section');
	const { CollapsibleFilterGroup } = require('layout/ui/field-filter/filter/src/layout/collapsible-group');
	const { getRowStyle } = require('layout/ui/field-filter/filter/src/layout/row-layout');
	const { FLAT_GROUP_ID, groupFields } = require('layout/ui/field-filter/filter/src/fields/field-set');
	const { buildRows } = require('layout/ui/field-filter/values');

	/**
	 * How many fields a group shows when the filter itself asks for fewer. A group of a client entity
	 * names none of its fields in the preset, so without a floor it would open onto the "show all
	 * fields" row alone - the group looks empty exactly where it was just tapped to be read.
	 * @type {number}
	 */
	const MIN_VISIBLE_FIELDS = 10;

	/**
	 * Order of the form: the rows of the current filter come in the order the user put them in, and
	 * that order is the answer of the server - the field dictionary knows nothing about it. A field
	 * that is shown because it has a value, and is not one of the rows, keeps its place in the
	 * dictionary and goes after them.
	 *
	 * @param {FieldDescriptor[]} descriptors already reduced to the visible ones
	 * @param {string[]} rows
	 * @return {FieldDescriptor[]}
	 */
	const sortByRows = (descriptors, rows) => {
		const position = new Map(rows.map((row, index) => [row, index]));
		const tail = position.size;

		return [...descriptors].sort((first, second) => (
			(position.get(first.id) ?? tail) - (position.get(second.id) ?? tail)
		));
	};

	/**
	 * Tops the fields the filter asks for up to `MIN_VISIBLE_FIELDS` with the first ones of the
	 * dictionary, in its order. The fields the filter asks for are never dropped: a field carrying a
	 * value stays visible even when the group holds more than the floor.
	 *
	 * @param {FieldDescriptor[]} descriptors of one group
	 * @param {FieldDescriptor[]} visible the ones the filter asks for
	 * @return {FieldDescriptor[]} in the order of the dictionary
	 */
	const fillUpToFloor = (descriptors, visible) => {
		if (visible.length >= MIN_VISIBLE_FIELDS)
		{
			return visible;
		}

		const shown = new Set(visible.map((descriptor) => descriptor.id));

		descriptors
			.filter((descriptor) => !shown.has(descriptor.id))
			.slice(0, MIN_VISIBLE_FIELDS - shown.size)
			.forEach((descriptor) => shown.add(descriptor.id));

		return descriptors.filter((descriptor) => shown.has(descriptor.id));
	};

	/**
	 * Renders the whole filter form from field descriptors (CONTRACT-DTO-01). Only the fields the
	 * web filter shows by default are visible at first, the rest open by a tap (NR-03).
	 *
	 * A list whose web filter groups its fields (the client entities of a CRM list) is drawn as one
	 * accordion per group, all of them closed: the groups of a CRM filter hold dozens of rows, and
	 * an open one would bury the rest of the drawer. A list the web does not group keeps the single
	 * flat section it always was.
	 *
	 * @extends {PureComponent<FieldFilterFormProps, FieldFilterFormState>}
	 */
	class FieldFilterForm extends PureComponent
	{
		/**
		 * @param {FieldFilterFormProps} props
		 */
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({ context: this, prefix: 'form' });
			this.state = { expandedGroups: {}, openGroups: {} };
		}

		getDescriptors()
		{
			const { descriptors } = this.props;

			return Type.isArray(descriptors) ? descriptors : [];
		}

		/**
		 * @return {FieldSection[]}
		 */
		getSections()
		{
			const { sections } = this.props;

			return Type.isArrayFilled(sections) ? sections : [];
		}

		/**
		 * @return {Array<{id: string, name: string|null, descriptors: FieldDescriptor[]}>}
		 */
		getGroups()
		{
			return groupFields(this.getDescriptors(), this.getSections());
		}

		/**
		 * The rows of the current filter, as the web draws them: the fields of its preset. Without a
		 * preset there are no rows to follow, and the fields the provider marks as default take over
		 * - the same set the web shows for its own "no preset" state.
		 *
		 * A field carrying a value is visible either way: otherwise an active condition would hide
		 * behind the row and read as if it had been dropped. "Carrying a value" is the very test
		 * the serializer applies, so the form and the request agree on what counts as active.
		 *
		 * A group the filter asks nothing of is filled up to `MIN_VISIBLE_FIELDS` from the head of its
		 * dictionary, so every group opens onto fields to read and keeps the rest behind its row.
		 *
		 * @param {FieldDescriptor[]} descriptors of one group
		 * @param {boolean} expanded whether "show all fields" was tapped for that group
		 * @return {FieldDescriptor[]}
		 */
		getVisibleDescriptors(descriptors, expanded)
		{
			if (expanded)
			{
				return descriptors;
			}

			const { rows } = this.props;
			const filled = this.getFilledIds();
			const presetRows = Type.isArrayFilled(rows) ? new Set(rows) : null;

			const visible = descriptors.filter((descriptor) => {
				const belongsToFilter = presetRows === null
					? descriptor.default === true
					: presetRows.has(descriptor.id);

				return belongsToFilter || filled.has(descriptor.id);
			});

			const shown = fillUpToFloor(descriptors, visible);

			return presetRows === null ? shown : sortByRows(shown, rows);
		}

		/**
		 * Ids of the fields the filter is set by. "Set" is the test of the serializer - the one that
		 * decides what goes into the request - so the form and the request agree on what counts.
		 *
		 * Serializing the whole filter is the price of the answer, and every group asks for it twice -
		 * once for the fields it shows, once for the number on its row. The answer is kept until the
		 * values or the dictionary are replaced, so one keystroke costs one pass and not a dozen.
		 *
		 * @return {Set<string>}
		 */
		getFilledIds()
		{
			const { values, descriptors } = this.props;

			if (this.filled?.values !== values || this.filled?.descriptors !== descriptors)
			{
				this.filled = {
					values,
					descriptors,
					ids: new Set(buildRows(this.getDescriptors(), Type.isPlainObject(values) ? values : {})),
				};
			}

			return this.filled.ids;
		}

		/**
		 * How many fields of the group the filter is set by: the number on the row of the group, so a
		 * condition set inside a closed group is not hidden together with its fields.
		 *
		 * @param {{descriptors: FieldDescriptor[]}} group
		 * @return {number}
		 */
		getFilledCount(group)
		{
			const filled = this.getFilledIds();

			return group.descriptors.filter((descriptor) => filled.has(descriptor.id)).length;
		}

		/**
		 * Icon of a group title, as the consumer names it (`sectionIcons`). A group the map says
		 * nothing about keeps its title alone, the same answer a field without an icon gets.
		 *
		 * @param {string} groupId
		 * @return {?FieldIcon}
		 */
		resolveSectionIcon(groupId)
		{
			const { sectionIcons } = this.props;

			return Type.isPlainObject(sectionIcons) ? (sectionIcons[groupId] ?? null) : null;
		}

		isGroupExpanded(groupId)
		{
			return this.state.expandedGroups[groupId] === true;
		}

		isGroupOpen(groupId)
		{
			return this.state.openGroups[groupId] === true;
		}

		expandGroup(groupId)
		{
			this.setState({ expandedGroups: { ...this.state.expandedGroups, [groupId]: true } });
		}

		toggleGroup(groupId)
		{
			this.setState({
				openGroups: { ...this.state.openGroups, [groupId]: !this.isGroupOpen(groupId) },
			});
		}

		/**
		 * The fields live in one section either way: a list the web groups draws a row per group
		 * inside it, a list it does not draw its fields there directly. A section per group would
		 * spread four closed rows over the whole sheet, which is not what the mockup keeps.
		 */
		render()
		{
			const { isFirst, title } = this.props;
			const groups = this.getGroups();
			const isFlat = this.getSections().length === 0;

			return FilterSection(
				{
					testId: this.getTestId(),
					// the consumer that stands the form in a screen of its own words the section itself
					title,
					isFirst,
					divider: false,
				},
				...(isFlat
					? this.renderGroupRows(groups[0])
					: groups.map((group, index) => this.renderGroup(group, index === groups.length - 1))),
			);
		}

		/**
		 * @param {{id: string, name: string|null, descriptors: FieldDescriptor[]}} group
		 * @param {boolean} isLast
		 */
		renderGroup(group, isLast)
		{
			return CollapsibleFilterGroup(
				{
					testId: this.getTestId(`section-${group.id}`),
					title: group.name,
					icon: this.resolveSectionIcon(group.id),
					expanded: this.isGroupOpen(group.id),
					counter: this.getFilledCount(group),
					isLast,
					// the group keeps one handler per id, so its header is not a changed prop on
					// every render of the form
					onToggle: useCallback(() => this.toggleGroup(group.id), [group.id]),
				},
				// the group drops the children of a closed one, so building them is work nobody sees:
				// a closed CRM group is dozens of rows with their values and icons resolved per render
				...(this.isGroupOpen(group.id) ? this.renderGroupRows(group) : []),
			);
		}

		/**
		 * What the group shows right now: the fields it draws and how many it keeps behind the
		 * "show all fields" row.
		 *
		 * @param {{id: string, descriptors: FieldDescriptor[]}} group
		 * @return {{descriptors: FieldDescriptor[], hiddenCount: number}}
		 */
		getGroupRows(group)
		{
			const descriptors = this.getVisibleDescriptors(group.descriptors, this.isGroupExpanded(group.id));

			return { descriptors, hiddenCount: group.descriptors.length - descriptors.length };
		}

		/**
		 * @param {{id: string, descriptors: FieldDescriptor[]}} group
		 * @return {Array}
		 */
		renderGroupRows(group)
		{
			const {
				testId,
				values,
				gridId,
				fieldIcons,
				entitySelectors,
				parentWidget,
				loadFieldItems,
				onChange,
				onOpenField,
			} = this.props;

			const { descriptors, hiddenCount } = this.getGroupRows(group);

			return [
				...descriptors.map((descriptor, index) => new FieldRow({
					testId,
					descriptor,
					icon: resolveFieldRowIcon(fieldIcons, descriptor.id),
					gridId,
					entitySelectors,
					parentWidget,
					loadFieldItems,
					isLast: hiddenCount === 0 && index === descriptors.length - 1,
					value: Type.isPlainObject(values) ? values[descriptor.id] : undefined,
					onChange,
					onOpenField,
				})),
				hiddenCount > 0 ? this.renderExpandRow(group.id, hiddenCount) : null,
			];
		}

		/**
		 * @param {string} groupId
		 * @param {number} hiddenCount
		 */
		renderExpandRow(groupId, hiddenCount)
		{
			const groupSuffix = groupId === FLAT_GROUP_ID ? '' : `-${groupId}`;

			return SettingSelector({
				testId: this.getTestId(`show-all${groupSuffix}`),
				title: Loc.getMessage('M_FIELD_FILTER_SHOW_ALL_FIELDS', { '#COUNT#': String(hiddenCount) }),
				color: Color.accentMainLink,
				mode: SettingMode.RIGHT_ICON,
				modeParams: {
					icon: Icon.CHEVRON_DOWN,
					size: 20,
					color: Color.accentMainLink,
				},
				divider: false,
				style: getRowStyle({ iconColumn: true }),
				onClick: useCallback(() => this.expandGroup(groupId), [groupId]),
			});
		}
	}

	module.exports = { FieldFilterForm };
});
