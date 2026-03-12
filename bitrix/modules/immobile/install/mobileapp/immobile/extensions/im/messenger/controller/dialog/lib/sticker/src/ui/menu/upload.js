/**
 * @module im/messenger/controller/dialog/lib/sticker/src/ui/menu/upload
 */
jn.define('im/messenger/controller/dialog/lib/sticker/src/ui/menu/upload', (require, exports, module) => {
	const { UIMenu } = require('layout/ui/menu');
	const { Icon } = require('assets/icons');

	const { Loc } = require('im/messenger/loc');

	const ActionType = {
		delete: 'delete',
		rename: 'rename',
	};

	/**
	 * @class UploadMenu
	 */
	class UploadMenu
	{
		/**
		 * @param ui
		 * @param {Array<{name: string, onItemSelected: function}>} actions
		 */
		constructor({ ui, actions })
		{
			this.ui = ui;
			this.actions = actions;
			/** @type {GridStickerState} */
		}

		/**
		 * @return {Record<string, (onItemSelected) => Partial<UIMenuActionProps>>}
		 */
		get #actionCollection()
		{
			return {
				[ActionType.delete]: (onItemSelected) => ({
					id: 'delete',
					testId: 'delete',
					title: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_STICKER_MENU_STICKER_DELETE_ACTION'),
					icon: Icon.TRASHCAN,
					isDestructive: true,
					onItemSelected,
				}),
				[ActionType.rename]: (onItemSelected) => ({
					id: 'rename',
					testId: 'rename',
					title: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_STICKER_MENU_PACK_RENAME_ACTION'),
					icon: Icon.EDIT,
					onItemSelected,
				}),
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
			return this.actions.map((action, index) => {
				return this.#actionCollection[action.name](action.onItemSelected);
			});
		}
	}

	module.exports = { UploadMenu, ActionType };
});
