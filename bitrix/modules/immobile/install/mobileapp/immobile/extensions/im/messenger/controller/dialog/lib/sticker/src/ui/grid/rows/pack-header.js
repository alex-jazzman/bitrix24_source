/**
 * @module im/messenger/controller/dialog/lib/sticker/src/ui/grid/rows/pack-header
 */
jn.define('im/messenger/controller/dialog/lib/sticker/src/ui/grid/rows/pack-header', (require, exports, module) => {
	const { Color } = require('tokens');
	const { IconView, Icon } = require('ui-system/blocks/icon');
	const { Text4 } = require('ui-system/typography/text');

	const { GridSection } = require('im/messenger/controller/dialog/lib/sticker/src/const');
	const { PackMenu, ActionType } = require('im/messenger/controller/dialog/lib/sticker/src/ui/menu/pack');

	/**
	 * @class StickerPackHeader
	 * @typedef {LayoutComponent<StickerPackHeaderProps, StickerPackHeaderState>} StickerPackHeader
	 */
	class StickerPackHeader extends LayoutComponent
	{
		render()
		{
			return View(
				{
					style: {
						width: '100%',
						height: 40,
						paddingHorizontal: 18,
						flexDirection: 'row',
					},
				},
				this.#renderHeader(),
				this.#renderMoreButton(),
			);
		}

		#renderHeader()
		{
			return View(
				{
					style: {
						paddingTop: 12,
						paddingBottom: 4,
						flexGrow: 2,
					},
				},
				Text4({
					text: this.props.title,
					color: Color.base4,
					accent: true,
				}),
			);
		}

		#renderMoreButton()
		{
			if (!this.props.configurable)
			{
				return null;
			}

			return View(
				{
					style: {
						justifyContent: 'flex-end',
						alignItems: 'center',
						flexDirection: 'row',
					},
					onClick: this.moreButtonClickHandler,
					ref: (ref) => {
						this.moreButtonRef = ref;
					},
				},
				IconView({
					icon: Icon.MORE,
					color: Color.base4,
					size: 24,
				}),
			);
		}

		moreButtonClickHandler = () => {
			const menu = new PackMenu({
				ui: this.moreButtonRef,
				actions: this.#getMenuActions(),
				packData: {},
			});

			menu.show();
		};

		#getMenuActions()
		{
			if (!this.props.configurable)
			{
				return [];
			}

			const result = [];
			if (this.props.sectionType === GridSection.recent)
			{
				result.push(ActionType.clearHistory);
			}

			return result;
		}
	}

	module.exports = { StickerPackHeader };
});
