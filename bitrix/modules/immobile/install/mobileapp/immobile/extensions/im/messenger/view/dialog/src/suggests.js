/**
 * @module im/messenger/view/dialog/suggests
 */
jn.define('im/messenger/view/dialog/suggests', (require, exports, module) => {
	const { EventFilterType } = require('im/messenger/const');
	const { StateManager } = require('im/messenger/view/lib/state-manager');
	const { ProxyView } = require('im/messenger/view/lib/proxy-view');

	/**
	 * @class DialogSuggests
	 */
	class DialogSuggests extends ProxyView
	{
		/**
		 * @constructor
		 * @param {JNBaseClassInterface} ui
		 * @param {EventFilter} eventFilter
		 */
		constructor(ui, eventFilter)
		{
			super(ui, eventFilter);

			this.initStateManager();
		}

		initStateManager()
		{
			const state = {
				isShown: false,
			};

			this.stateManager = new StateManager(state);
		}

		/**
		 * @return {AvailableEventCollection}
		 */
		getAvailableEvents()
		{
			return {
				[EventFilterType.selectMessagesMode]: [],
			};
		}

		/**
		 * @return {boolean}
		 */
		get isShown()
		{
			return this.stateManager.state.isShown;
		}

		/**
		 * @param {SuggestsShowParams} params
		 */
		show(params)
		{
			const newState = { isShown: true };
			const hasChanges = this.stateManager.hasChanges(newState);

			if (this.isUiAvailable() && hasChanges)
			{
				this.stateManager.updateState(newState);
				this.ui.show(params);
			}
		}

		hide()
		{
			const newState = { isShown: false };
			const hasChanges = this.stateManager.hasChanges(newState);

			if (this.isUiAvailable() && hasChanges)
			{
				this.stateManager.updateState(newState);
				this.ui.hide();
			}
		}
	}

	module.exports = { DialogSuggests };
});
