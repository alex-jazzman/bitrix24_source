/**
 * @module layout/ui/field-filter/filter/src/sorting-section
 */
jn.define('layout/ui/field-filter/filter/src/sorting-section', (require, exports, module) => {
	const { Type } = require('type');
	const { Loc } = require('loc');
	const { PureComponent } = require('layout/pure-component');
	const { createTestIdGenerator } = require('utils/test');
	const { useCallback } = require('utils/function');
	const { Icon } = require('ui-system/blocks/icon');
	const { FilterSection } = require('layout/ui/field-filter/filter/src/layout/section');
	const { SelectableRow } = require('layout/ui/field-filter/filter/src/layout/selectable-row');

	const DEFAULT_TYPE_ICON = Icon.CHANGE_ORDER;

	/**
	 * Sorting block that lives inside the filter drawer (moved out of the "---" menu).
	 * Drives a reused BaseListSorting instance: a tap picks the type, the direction is
	 * the sorting's own business and has no control here.
	 *
	 * @extends {PureComponent<SortingSectionProps>}
	 */
	class SortingSection extends PureComponent
	{
		/**
		 * @param {SortingSectionProps} props
		 */
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({ context: this, prefix: 'sorting' });
		}

		getTypes()
		{
			const { types } = this.props;

			return Type.isPlainObject(types) ? types : {};
		}

		/**
		 * Sorting codes belong to the consumer, so the icon comes with the type and only the
		 * fallback lives here.
		 *
		 * @param {SortingType} params
		 * @return {Icon}
		 */
		getTypeIcon(params)
		{
			return params?.icon ?? DEFAULT_TYPE_ICON;
		}

		select(type)
		{
			const { sorting, onChange } = this.props;

			sorting?.setType(type);
			onChange?.();
		}

		render()
		{
			const { isFirst } = this.props;
			const entries = Object.entries(this.getTypes());

			return FilterSection(
				{
					testId: this.getTestId(),
					title: Loc.getMessage('M_FIELD_FILTER_SORTING_TITLE'),
					isFirst,
				},
				...entries.map(([type, params], index) => this.renderRow(type, params, index === entries.length - 1)),
			);
		}

		/**
		 * The selected type comes down as a prop: the section is pure, and an order it reads out of
		 * the sorting object itself is an order its owner cannot repaint - the object is the same one
		 * on every render, so the props of the section would never change with it.
		 *
		 * @param {string} type
		 * @param {SortingType} params
		 * @param {boolean} isLast
		 */
		renderRow(type, params, isLast)
		{
			return SelectableRow({
				testId: this.getTestId(type),
				title: params?.label,
				selected: this.props.sortType === type,
				icon: this.getTypeIcon(params),
				divider: !isLast,
				onClick: useCallback(() => this.select(type), [type]),
			});
		}
	}

	module.exports = { SortingSection };
});
