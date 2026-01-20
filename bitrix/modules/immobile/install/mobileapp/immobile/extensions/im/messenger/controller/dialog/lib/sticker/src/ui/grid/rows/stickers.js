/**
 * @module im/messenger/controller/dialog/lib/sticker/src/ui/grid/rows/stickers
 */
jn.define('im/messenger/controller/dialog/lib/sticker/src/ui/grid/rows/stickers', (require, exports, module) => {
	const { SafeImage } = require('layout/ui/safe-image');
	const {
		StickerEventType,
		GridSection,
	} = require('im/messenger/controller/dialog/lib/sticker/src/const');
	const { emitter } = require('im/messenger/controller/dialog/lib/sticker/src/utils/emitter');
	const { StickerMenu, ActionType } = require('im/messenger/controller/dialog/lib/sticker/src/ui/menu/sticker');

	/**
	 * @class StickersRow
	 * @typedef {LayoutComponent<StickersRowProps, StickersRowState>} StickersRow
	 */
	class StickersRow extends LayoutComponent
	{
		constructor(props)
		{
			super(props);

			this.refCollection = {};
		}
		render()
		{
			return View(
				{
					style: {
						paddingLeft: 18,
						paddingRight: 18,
						marginTop: 4,
						flexDirection: 'row',
						justifyContent: 'space-between',
						alignItems: 'center',
					},
				},
				...this.#renderStickers(),
				...this.#renderFakeElements(),
			);
		}

		#renderStickers()
		{
			return this.props.stickers.map((sticker, index) => {
				return View(
					{
						style: {
							width: 82,
							height: 82,
							paddingLeft: 5,
							paddingRight: 5,
							paddingTop: 5,
							paddingBottom: 5,
							justifyContent: 'center',
							alignItems: 'center',
						},
						onClick: () => this.clickHandler(index),
						onLongClick: () => this.longClickHandler(index),
						ref: (ref) => {
							this.refCollection[index] = ref;
						},
					},
					SafeImage({
						withShimmer: true,
						uri: sticker.uri,
						wrapperStyle: {
							width: 72,
							height: 72,
							borderRadius: 6,
						},
						style: {
							width: 72,
							height: 72,
							borderRadius: 4,
						},
						resizeMode: 'contain',
						clickable: false,
					}),
				);
			});
		}

		#renderFakeElements()
		{
			return Array.from({ length: this.props.fakeItemCount })
				.map(() => {
					return View({
						style: {
							width: 82,
							height: 82,
							paddingLeft: 5,
							paddingRight: 5,
							paddingTop: 5,
							paddingBottom: 5,
						},
					});
				});
		}

		/**
		 * @return {Array<string>}
		 */
		#getMenuActions()
		{
			const result = [ActionType.send];

			if (this.props.sectionType === GridSection.recent)
			{
				result.push(ActionType.deleteFromRecent);
			}

			return result;
		}

		clickHandler = (stickerIndex) => {
			const {
				id,
				packId,
				packType,
				uri,
			} = this.props.stickers[stickerIndex];

			emitter.emit(StickerEventType.action.send, [id, packId, packType, uri]);
		};

		longClickHandler = (stickerIndex) => {
			const menu = new StickerMenu({
				ui: this.refCollection[stickerIndex],
				actions: this.#getMenuActions(),
				stickerData: this.props.stickers[stickerIndex],
			});

			menu.show();
		};
	}

	module.exports = { StickersRow };
});
