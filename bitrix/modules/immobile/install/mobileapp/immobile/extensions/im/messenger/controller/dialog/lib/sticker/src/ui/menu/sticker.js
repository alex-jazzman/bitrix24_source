/**
 * @module im/messenger/controller/dialog/lib/sticker/src/ui/menu/sticker
 */
jn.define('im/messenger/controller/dialog/lib/sticker/src/ui/menu/sticker', (require, exports, module) => {
	const { UIMenu } = require('layout/ui/menu');
	const { Icon } = require('assets/icons');

	const { Loc } = require('im/messenger/loc');
	const { StickerEventType } = require('im/messenger/controller/dialog/lib/sticker/src/const');
	const { emitter } = require('im/messenger/controller/dialog/lib/sticker/src/utils/emitter');

	const ActionType = {
		send: 'send',
		deleteFromRecent: 'deleteFromRecent',
		delete: 'delete',
	};

	/**
	 * @class StickerMenu
	 */
	class StickerMenu
	{
		/**
		 * @param ui
		 * @param {Array<string>} actions
		 * @param {GridStickerState} stickerData
		 */
		constructor({ ui, actions, stickerData })
		{
			this.ui = ui;
			this.actions = actions;
			/** @type {GridStickerState} */
			this.stickerData = stickerData;
		}

		/**
		 * @return {Record<string, Partial<UIMenuActionProps>>}
		 */
		get #actionCollection()
		{
			return {
				[ActionType.send]: {
					id: 'send',
					testId: 'send',
					title: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_STICKER_MENU_STICKER_SEND_ACTION'),
					icon: Icon.SEND,
					onItemSelected: () => {
						this.#sendStickerEvent(StickerEventType.action.send);
					},
				},
				[ActionType.deleteFromRecent]: {
					id: 'deleteFromRecent',
					testId: 'deleteFromRecent',
					title: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_STICKER_MENU_STICKER_DELETE_FROM_RECENT_ACTION'),
					icon: Icon.CIRCLE_CROSS,
					onItemSelected: () => {
						this.#sendStickerEvent(StickerEventType.action.deleteRecentSticker);
					},
				},
				[ActionType.delete]: {
					id: 'delete',
					testId: 'delete',
					title: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_STICKER_MENU_STICKER_DELETE_ACTION'),
					icon: Icon.TRASHCAN,
					isDestructive: true,
					onItemSelected: () => {
						this.#sendStickerEvent(StickerEventType.action.deleteSticker);
					},
				},
			};
		}

		show()
		{
			const menuActions = this.#getActions();
			const menu = new UIMenu(menuActions);

			menu.show({ target: this.ui });
		}

		/**
		 * @return {Array<UIMenuActionProps>}
		 */
		#getActions()
		{
			return this.actions.map((actionId, index) => {
				return this.#actionCollection[actionId];
			});
		}

		/**
		 * @param {keyof StickersEvents} event
		 */
		#sendStickerEvent(event)
		{
			const { id, packId, packType } = this.stickerData;

			emitter.emit(event, [id, packId, packType]);
		}
	}

	module.exports = { StickerMenu, ActionType };
});
