/**
 * @module im/messenger/controller/dialog/lib/sticker/src/ui/menu/pack
 */
jn.define('im/messenger/controller/dialog/lib/sticker/src/ui/menu/pack', (require, exports, module) => {
	const { Color } = require('tokens');
	const { UIMenu } = require('layout/ui/menu');
	const { Icon } = require('assets/icons');

	const { Loc } = require('im/messenger/loc');
	const { StickerEventType } = require('im/messenger/controller/dialog/lib/sticker/src/const');
	const { emitter } = require('im/messenger/controller/dialog/lib/sticker/src/utils/emitter');

	const ActionType = {
		clearHistory: 'clearHistory',
		delete: 'delete',
		rename: 'rename',
		edit: 'edit',
		unlink: 'unlink',
	};

	/**
	 * @class PackMenu
	 */
	class PackMenu
	{
		/**
		 * @param ui
		 * @param {Array<string>} actions
		 * @param {{id: StickerPackId, type: StickerPackType}} packData
		 */
		constructor({ ui, actions, packData })
		{
			this.ui = ui;
			this.actions = actions;
			this.packData = packData;
		}

		/**
		 * @return {Record<string, Partial<UIMenuActionProps>>}
		 */
		get #actionCollection()
		{
			return {
				[ActionType.clearHistory]: {
					id: 'clearHistory',
					testId: 'clearHistory',
					title: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_STICKER_MENU_PACK_CLEAR_HISTORY_ACTION'),
					icon: Icon.BROOM,
					onItemSelected: () => {
						emitter.emit(StickerEventType.action.clearHistory, []);
					},
				},
				[ActionType.delete]: {
					id: 'delete',
					testId: 'delete',
					title: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_STICKER_MENU_PACK_DELETE_ACTION'),
					icon: Icon.TRASHCAN,
					isDestructive: true,
					showTopSeparator: true,
					onItemSelected: () => {
						emitter.emit(StickerEventType.action.deletePack, [this.packData.id, this.packData.type]);
					},
				},
				[ActionType.unlink]: {
					id: 'unlink',
					testId: 'unlink',
					title: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_STICKER_MENU_PACK_UNLINK_ACTION'),
					icon: Icon.TRASHCAN,
					isDestructive: true,
					showTopSeparator: true,
					onItemSelected: () => {
						emitter.emit(StickerEventType.action.unlinkPack, [this.packData.id, this.packData.type]);
					},
				},
				[ActionType.rename]: {
					id: 'rename',
					testId: 'rename',
					title: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_STICKER_MENU_PACK_RENAME_ACTION'),
					icon: Icon.EDIT,
					onItemSelected: () => {
						emitter.emit(StickerEventType.action.rename, [this.packData.id, this.packData.type]);
					},
				},
				[ActionType.edit]: {
					id: 'edit',
					testId: 'edit',
					title: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_STICKER_MENU_PACK_EDIT_ACTION'),
					icon: Icon.EDIT,
					onItemSelected: () => {
						emitter.emit(StickerEventType.action.edit, [this.packData.id, this.packData.type]);
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
	}

	module.exports = { PackMenu, ActionType };
});
