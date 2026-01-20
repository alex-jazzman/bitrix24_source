/**
 * @module tab-presets/src/preset-manual/manual-bottom-list
 */
jn.define('tab-presets/src/preset-manual/manual-bottom-list', (require, exports, module) => {
	const { Color, Indent } = require('tokens');
	const { Loc } = require('loc');
	const { Area } = require('ui-system/layout/area');
	const { Card } = require('ui-system/layout/card');
	const { CardList } = require('ui-system/layout/card-list');
	const { IconView } = require('ui-system/blocks/icon');
	const { Text1 } = require('ui-system/typography/text');
	const { BottomSheet } = require('bottom-sheet');
	const { Ellipsize } = require('utils/enums/style');
	const { ChipButton, ChipButtonMode } = require('ui-system/blocks/chips/chip-button');
	const TabPresetsNewUtils = require('tab-presets/src/utils');

	/**
	 * @class ManualBottomMenu
	 * @typedef {Object} ManualBottomMenuProps
	 * @property {Array} items
	 * @property {Function} onClick
	 * @property {Object} parentWidget
	 * @property {Object} replaceItem
	 */
	class ManualBottomMenu extends LayoutComponent
	{
		#testId = 'manual-bottom-menu';

		/**
		 * @param {ManualBottomMenu} params
		 */
		static show(params)
		{
			const { parentWidget, ...restProps } = params;
			const bottomSheet = new BottomSheet({
				titleParams: {
					type: 'dialog',
				},
				component: (layoutWidget) => new ManualBottomMenu({
					...restProps,
					parentWidget: layoutWidget,
				}),
			});

			void bottomSheet.setMediumPositionPercent(70)
				.enableOnlyMediumPosition()
				.setParentWidget(parentWidget)
				.open();
		}

		render()
		{
			return Area(
				{
					testId: `${this.#testId}-area`,
				},
				CardList(
					{
						divided: true,
						testId: `${this.#testId}-list`,
					},
					...this.#getItems().map((item, index) => this.#renderItemCard(item, index)),
				),
			);
		}

		#renderItemCard(item, itemIndex)
		{
			const { key, iconId, title } = item;
			const icon = TabPresetsNewUtils.getIcon(iconId) || TabPresetsNewUtils.getIcon(key);
			const isFirstItem = itemIndex === 0;

			return Card(
				{
					withPressed: true,
					border: true,
					testId: `${this.#testId}-item-${key}`,
					style: {
						alignItems: 'center',
						flexDirection: 'row',
						justifyContent: 'space-between',
					},
					onClick: () => {
						this.#onClick(item);
					},
				},
				View(
					{
						style: {
							flex: 1,
							flexDirection: 'row',
						},
					},
					IconView({
						icon,
						testId: `${this.#testId}-item-icon-${key}`,
						size: 32,
						color: Color.accentMainPrimaryalt,
						solid: true,
						style: {
							marginRight: Indent.XS.toNumber(),
						},
					}),
					Text1({
						testId: `${this.#testId}-item-text-${key}`,
						text: title,
						color: Color.base1,
						numberOfLines: 1,
						ellipsize: Ellipsize.END.getValue(),
						style: {
							flex: 1,
							flexShrink: 1,
						},
					}),
				),
				isFirstItem && this.#renderReplaceButton(item),
			);
		}

		#renderReplaceButton(item)
		{
			const { replaceItem } = this.props;
			if (!replaceItem)
			{
				return null;
			}

			return ChipButton({
				testId: `${this.testId}-button-selected-${item.key}`,
				text: Loc.getMessage('PRESET_MANUAL_SETTINGS_BUTTON_SELECTED'),
				rounded: true,
				compact: true,
				mode: ChipButtonMode.OUTLINE,
				style: {
					flexShrink: 0,
				},
			});
		}

		#onClick = (item) => {
			const { onClick, replaceItem } = this.props;

			onClick(item, replaceItem);
			this.parentWidget.close();
		};

		#getItems()
		{
			const { items } = this.props;

			return items;
		}

		get parentWidget()
		{
			return this.props.parentWidget;
		}
	}

	module.exports = {
		ManualBottomMenu,
	};
});
