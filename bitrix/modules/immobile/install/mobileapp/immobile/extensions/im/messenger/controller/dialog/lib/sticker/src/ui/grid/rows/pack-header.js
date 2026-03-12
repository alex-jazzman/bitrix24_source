/**
 * @module im/messenger/controller/dialog/lib/sticker/src/ui/grid/rows/pack-header
 */
jn.define('im/messenger/controller/dialog/lib/sticker/src/ui/grid/rows/pack-header', (require, exports, module) => {
	const { Type } = require('type');
	const { Color } = require('tokens');
	const { IconView, Icon } = require('ui-system/blocks/icon');
	const { Text4 } = require('ui-system/typography/text');

	const { serviceLocator } = require('im/messenger/lib/di/service-locator');

	const { GridSection, StickerEventType } = require('im/messenger/controller/dialog/lib/sticker/src/const');
	const { emitter } = require('im/messenger/controller/dialog/lib/sticker/src/utils/emitter');
	const { PackMenu, ActionType } = require('im/messenger/controller/dialog/lib/sticker/src/ui/menu/pack');

	/**
	 * @class StickerPackHeader
	 * @typedef {LayoutComponent<StickerPackHeaderProps, StickerPackHeaderState>} StickerPackHeader
	 */
	class StickerPackHeader extends LayoutComponent
	{
		static #currentUserId;

		static get currentUserId()
		{
			this.#currentUserId = this.#currentUserId ?? serviceLocator.get('core').getUserId();

			return this.#currentUserId;
		}

		constructor(props)
		{
			super(props);

			this.state = {
				title: props.title,
			};
		}

		componentDidMount()
		{
			super.componentDidMount();
			emitter.on(StickerEventType.grid.rename, this.renameHandler);
		}

		componentWillUnmount()
		{
			super.componentWillUnmount();
			emitter.off(StickerEventType.grid.rename, this.renameHandler);
		}

		componentWillReceiveProps(props)
		{
			super.componentWillReceiveProps(props);
			if (Type.isString(props.title))
			{
				this.state.title = props.title;
			}
		}

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
				View(
					{
						style: {
							width: '90%',
						},
					},
					Text4({
						text: this.state.title,
						color: Color.base4,
						accent: true,
						ellipsize: 'end',
					}),
				),
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
				packData: {
					id: this.props.sectionData.packId,
					type: this.props.sectionData.packType,
				},
			});

			menu.show();
		};

		renameHandler = (packId, packType, name) => {
			if (this.props.sectionData.packId === packId && this.props.sectionData.packType === packType)
			{
				this.setState({
					title: name,
				});
			}
		};

		#getMenuActions()
		{
			if (!this.props.configurable)
			{
				return [];
			}

			if (this.props.sectionType === GridSection.recent)
			{
				return [
					ActionType.clearHistory,
				];
			}

			if (this.props.sectionData.authorId !== StickerPackHeader.currentUserId)
			{
				return [ActionType.unlink];
			}

			if (this.props.sectionData.authorId === StickerPackHeader.currentUserId)
			{
				const data = [];
				if (this.props.canEditPack)
				{
					data.push(ActionType.edit);
				}

				return [...data, ActionType.delete];
			}

			return [];
		}
	}

	module.exports = { StickerPackHeader };
});
