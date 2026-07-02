/**
 * @module im/messenger/controller/dialog/lib/sticker/src/ui/menu/attached-upload
 */
jn.define('im/messenger/controller/dialog/lib/sticker/src/ui/menu/attached-upload', (require, exports, module) => {
	const { Icon } = require('assets/icons');
	const { Color } = require('tokens');

	const { Loc } = require('im/messenger/loc');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');
	const {
		MenuActionEventType,
		MenuSectionId,
		MenuActionType,
	} = require('im/messenger/controller/dialog/lib/sticker/src/const');
	const { StickerAttachedMenuView } = require('im/messenger/controller/dialog/lib/sticker/src/ui/menu/attached-sticker-view');

	const logger = getLoggerWithContext('dialog--sticker', 'StickerAttachedUploadMenu');

	let activeMenu = null;

	/**
	 * @class StickerAttachedUploadMenu
	 */
	class StickerAttachedUploadMenu
	{
		/**
		 * @param {AttachedUploadStickerData} stickerData
		 * @param {Function} onDelete
		 */
		constructor({ stickerData, onDelete })
		{
			this.stickerData = stickerData;
			this.onDelete = onDelete;
			this.menu = null;
		}

		show()
		{
			const component = new StickerAttachedMenuView({
				stickerData: this.stickerData,
			});

			const params = {
				backgroundColor: Color.chatOverallFixedBlack.toHex(),
				closeOnClickOutside: true,
				callback: this.#handleMenuEvent,
				attachedMenu: {
					items: [this.#getDeleteItem()],
					sections: [{ id: MenuSectionId.main }],
				},
			};

			dialogs.createAttachedMenu()
				.then((menu) => {
					activeMenu?.hide?.();
					activeMenu = menu;
					this.menu = menu;
					menu.setComponent(component, params);
					menu.show();
				})
				.catch((error) => {
					logger.error('createAttachedMenu error', error);
				});
		}

		#getDeleteItem()
		{
			return {
				id: MenuActionType.delete,
				title: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_STICKER_MENU_STICKER_DELETE_ACTION'),
				iconName: Icon.TRASHCAN.getIconName(),
				isDestructive: true,
				sectionCode: MenuSectionId.main,
				styles: {
					title: {
						font: {
							color: Color.accentMainAlert.toHex(),
						},
					},
					icon: {
						color: Color.accentMainAlert.toHex(),
					},
				},
			};
		}

		/**
		 * @param {string} eventName
		 * @param {string} id
		 */
		#handleMenuEvent = (eventName, id) => {
			if (eventName !== MenuActionEventType.menuItemClick)
			{
				return;
			}

			if (id === MenuActionType.delete)
			{
				this.onDelete?.();
			}

			this.menu?.hide?.();
		};
	}

	module.exports = { StickerAttachedUploadMenu };
});
