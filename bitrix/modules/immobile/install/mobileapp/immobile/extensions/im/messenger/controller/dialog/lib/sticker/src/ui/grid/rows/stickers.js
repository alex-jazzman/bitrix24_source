/**
 * @module im/messenger/controller/dialog/lib/sticker/src/ui/grid/rows/stickers
 */
jn.define('im/messenger/controller/dialog/lib/sticker/src/ui/grid/rows/stickers', (require, exports, module) => {
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');

	const {
		StickerEventType,
		GridSection,
	} = require('im/messenger/controller/dialog/lib/sticker/src/const');
	const { emitter } = require('im/messenger/controller/dialog/lib/sticker/src/utils/emitter');
	const { StickerMenu, ActionType } = require('im/messenger/controller/dialog/lib/sticker/src/ui/menu/sticker');

	const { StickerCreateView } = require('im/messenger/controller/dialog/lib/sticker/src/ui/grid/element/create');
	const { StickerView } = require('im/messenger/controller/dialog/lib/sticker/src/ui/grid/element/sticker');

	/**
	 * @class StickersRow
	 * @typedef {LayoutComponent<StickersRowProps, StickersRowState>} StickersRow
	 */
	class StickersRow extends LayoutComponent
	{
		static #currentUserId;

		static get currentUserId()
		{
			this.#currentUserId = this.#currentUserId ?? serviceLocator.get('core').getUserId();

			return this.#currentUserId;
		}

		render()
		{
			return View(
				{
					style: {
						paddingLeft: 18,
						paddingRight: 18,
						paddingTop: this.props.isFirstPackRow ? 0 : 4,
						flexDirection: 'row',
						justifyContent: 'space-between',
						alignItems: 'center',
						height: this.props.isFirstPackRow ? 82 : 86,
					},
				},
				...this.#renderStickers(),
				...this.#renderFakeElements(),
			);
		}

		#renderStickers()
		{
			return this.props.stickers.map((sticker, index) => {
				return this.#createStickerElement(sticker, index);
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

		#createStickerElement(sticker, index)
		{
			if (sticker.id === 'create')
			{
				return StickerCreateView({
					packId: sticker.packId,
					packType: sticker.packType,
				});
			}

			return new StickerView({
				uri: sticker.uri,
				isUploading: sticker.uploading,
				id: sticker.id,
				onClick: this.#clickStickerHandler,
				onLongClick: this.#longClickStickerHandler,
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

				return result;
			}

			return result;
		}

		#clickStickerHandler = (stickerId, ref) => {
			const {
				id,
				packId,
				packType,
			} = this.props.stickers.find((sticker) => sticker.id === stickerId);

			emitter.emit(StickerEventType.sticker.click, [id, packId, packType, ref]);
		};

		#longClickStickerHandler = (id, ref) => {
			const menu = new StickerMenu({
				ui: ref,
				actions: this.#getMenuActions(),
				stickerData: this.props.stickers.find((sticker) => sticker.id === id),
			});

			menu.show();
		}
	}

	module.exports = { StickersRow };
});
