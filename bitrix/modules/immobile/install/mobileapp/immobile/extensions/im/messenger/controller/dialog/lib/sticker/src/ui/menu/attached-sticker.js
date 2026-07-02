/**
 * @module im/messenger/controller/dialog/lib/sticker/src/ui/menu/attached-sticker
 */
jn.define('im/messenger/controller/dialog/lib/sticker/src/ui/menu/attached-sticker', (require, exports, module) => {
	const { Icon } = require('assets/icons');
	const { Color } = require('tokens');

	const { Loc } = require('im/messenger/loc');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');
	const {
		StickerEventType,
		MenuActionType,
		MenuActionEventType,
		MenuSectionId,
	} = require('im/messenger/controller/dialog/lib/sticker/src/const');
	const { emitter } = require('im/messenger/controller/dialog/lib/sticker/src/utils/emitter');
	const { StickerAttachedMenuView } = require('im/messenger/controller/dialog/lib/sticker/src/ui/menu/attached-sticker-view');

	const logger = getLoggerWithContext('dialog--sticker', 'StickerAttachedMenu');

	/**
	 * @class StickerAttachedMenu
	 */
	class StickerAttachedMenu
	{
		/**
		 * @param {Array<string>} actions
		 * @param {StickerViewClickData} stickerData
		 */
		constructor({ actions, stickerData })
		{
			this.actions = actions;
			this.stickerData = stickerData;
			this.menu = null;
		}

		/**
		 * @return {Record<string, object>}
		 */
		get #actionCollection()
		{
			return {
				[MenuActionType.send]: {
					id: MenuActionType.send,
					title: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_STICKER_MENU_STICKER_SEND_ACTION'),
					iconName: Icon.SEND.getIconName(),
					sectionCode: MenuSectionId.main,
				},
				[MenuActionType.deleteFromRecent]: {
					id: MenuActionType.deleteFromRecent,
					title: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_STICKER_MENU_STICKER_DELETE_FROM_RECENT_ACTION'),
					iconName: Icon.CIRCLE_CROSS.getIconName(),
					sectionCode: MenuSectionId.main,
				},
				[MenuActionType.delete]: {
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
				},
			};
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
					items: this.#getItems(),
					sections: [{ id: MenuSectionId.main }],
				},
			};

			dialogs.createAttachedMenu()
				.then((menu) => {
					this.menu = menu;
					menu.setComponent(component, params);
					menu.show();
				})
				.catch((error) => {
					logger.error('createAttachedMenu error', error);
				});
		}

		/**
		 * @return {Array<object>}
		 */
		#getItems()
		{
			return this.actions.map((actionId) => this.#actionCollection[actionId]).filter(Boolean);
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

			switch (id)
			{
				case MenuActionType.send:
					this.#sendStickerEvent(StickerEventType.action.send);
					break;
				case MenuActionType.deleteFromRecent:
					this.#sendStickerEvent(StickerEventType.action.deleteRecentSticker);
					break;
				case MenuActionType.delete:
					this.#sendStickerEvent(StickerEventType.action.deleteSticker);
					break;
				default:
			}

			this.menu?.hide?.();
		};

		/**
		 * @param {keyof StickersEvents} event
		 */
		#sendStickerEvent(event)
		{
			const { id, packId, packType } = this.stickerData;

			emitter.emit(event, [id, packId, packType]);
		}
	}

	module.exports = { StickerAttachedMenu };
});
