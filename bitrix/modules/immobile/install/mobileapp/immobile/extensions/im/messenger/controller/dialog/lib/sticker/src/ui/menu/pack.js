/**
 * @module im/messenger/controller/dialog/lib/sticker/src/ui/menu/pack
 */
jn.define('im/messenger/controller/dialog/lib/sticker/src/ui/menu/pack', (require, exports, module) => {
	const { UIMenu } = require('layout/ui/menu');
	const { Icon } = require('assets/icons');

	const { Loc } = require('im/messenger/loc');
	const { StickerEventType } = require('im/messenger/controller/dialog/lib/sticker/src/const');
	const { emitter } = require('im/messenger/controller/dialog/lib/sticker/src/utils/emitter');

	const ActionType = {
		clearHistory: 'clearHistory',
		delete: 'delete',
	};

	/**
	 * @class PackMenu
	 */
	class PackMenu
	{
		/**
		 * @param ui
		 * @param {Array<string>} actions
		 * @param {{}} packData // TODO for second iteration
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
		get actionCollection()
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
				return this.actionCollection[actionId];
			});
		}
	}

	module.exports = { PackMenu, ActionType };
});
