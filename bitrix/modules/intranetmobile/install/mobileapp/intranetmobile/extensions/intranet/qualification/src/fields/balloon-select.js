/**
 * @module intranet/qualification/fields/balloon-select
 */
jn.define('intranet/qualification/fields/balloon-select', (require, exports, module) => {
	const { PureComponent } = require('layout/pure-component');
	const { Icon, IconView } = require('ui-system/blocks/icon');
	const { Text4 } = require('ui-system/typography');
	const { Color, Indent } = require('tokens');
	const { PropTypes } = require('utils/validation');
	const { createTestIdGenerator } = require('utils/test');

	class BalloonSelect extends PureComponent
	{
		/**
		 * @param {Object} props
		 * @param {string} props.testId
		 * @param {Array} [props.items=[]]
		 * @param {Array} [props.selectedItemIds=[]]
		 * @param {boolean} [props.multiple=false] several items can be selected at once
		 * @param {Function} [props.onChange=null]
		 */
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({ context: this });

			this.#updateState(this.props);
		}

		componentWillReceiveProps(nextProps)
		{
			this.#updateState(nextProps);
		}

		#updateState(newState)
		{
			this.state = {
				selectedItemIds: newState.selectedItemIds,
			};
		}

		render()
		{
			return View(
				{
					style: {
						padding: Indent.XS.toNumber(),
					},
					testId: this.getTestId('container'),
				},
				...this.props.items.map((item, index) => this.#renderItem(item, index === 0)),
			);
		}

		#renderItem(item, isFirst)
		{
			const isSelected = this.#isItemSelected(item.id);

			let borderWidth = 0;
			let backgroundColor = Color.accentSoftBlue2;
			let textColor = this.#shouldDimUnselectedItems() ? Color.base4 : Color.base1;
			let iconColor = backgroundColor;

			if (isSelected)
			{
				borderWidth = 2;
				backgroundColor = Color.bgContentPrimary;
				textColor = Color.accentMainPrimary;
				iconColor = Color.accentMainPrimaryalt;
			}

			return View(
				{
					style: {
						borderWidth,
						flexDirection: 'row',
						alignItems: 'center',
						paddingLeft: Indent.XL3.toNumber(),
						paddingRight: Indent.L.toNumber(),
						paddingVertical: Indent.XL.toNumber(),
						marginTop: isFirst ? 0 : Indent.XL2.toNumber(),
						borderRadius: 24,
						borderColor: Color.accentMainPrimaryalt.toHex(),
						backgroundColor: backgroundColor.toHex(),
					},
					testId: this.getTestId(`item-container-${item.id}`),
					onClick: () => this.#onItemClick(item.id),
				},
				Text4({
					style: {
						flex: 1,
					},
					accent: true,
					color: textColor,
					text: item.title,
					testId: this.getTestId(`item-field-${item.id}`),
				}),
				IconView({
					style: {
						marginLeft: Indent.XL2.toNumber(),
					},
					icon: Icon.CHECK,
					size: 24,
					color: iconColor,
					// the mark is always rendered and only recolored, so the state has to live in the locator
					testId: this.getTestId(`item-check-${isSelected ? 'selected' : 'unselected'}-${item.id}`),
				}),
			);
		}

		#onItemClick(itemId)
		{
			const { onChange } = this.props;

			let toggledItemIds = [];

			this.setState(
				// setState is not synchronous, so the accumulated set is derived from the previous state
				(state) => {
					toggledItemIds = this.#toggleItem(itemId, state.selectedItemIds);

					return { selectedItemIds: toggledItemIds };
				},
				// the payload is the set the updater computed: a parent rerender can reassign the state by then
				() => onChange?.(this.#getSelectedItems(toggledItemIds)),
			);
		}

		#getSelectedItems(selectedItemIds)
		{
			const { items } = this.props;

			return Object.fromEntries(
				selectedItemIds
					.map((itemId) => items.find((item) => item.id === itemId))
					.filter(Boolean)
					.map(({ id, value }) => [id, value]),
			);
		}

		#toggleItem(itemId, selectedItemIds)
		{
			if (selectedItemIds.includes(itemId))
			{
				return this.props.multiple
					? selectedItemIds.filter((id) => id !== itemId)
					: [];
			}

			return this.props.multiple ? [...selectedItemIds, itemId] : [itemId];
		}

		#isItemSelected(itemId)
		{
			return this.state.selectedItemIds.includes(itemId);
		}

		#shouldDimUnselectedItems()
		{
			return !this.props.multiple && this.state.selectedItemIds.length > 0;
		}
	}

	BalloonSelect.defaultProps = {
		items: [],
		selectedItemIds: [],
		multiple: false,
		onChange: null,
	};

	BalloonSelect.propTypes = {
		testId: PropTypes.string.isRequired,
		items: PropTypes.arrayOf(
			PropTypes.shape({
				id: PropTypes.string,
				title: PropTypes.string,
				value: PropTypes.any,
			}),
		),
		selectedItemIds: PropTypes.arrayOf(PropTypes.string),
		multiple: PropTypes.bool,
		onChange: PropTypes.func,
	};

	module.exports = { BalloonSelect };
});
