/**
 * @module im/messenger/view/dialog/action-panel
 */
jn.define('im/messenger/view/dialog/action-panel', (require, exports, module) => {
	const { Type } = require('type');
	const { EventFilterType, EventType } = require('im/messenger/const');

	const { StateManager } = require('im/messenger/view/lib/state-manager');
	const { ProxyView } = require('im/messenger/view/lib/proxy-view');

	/**
	 * @class DialogActionPanel
	 */
	class DialogActionPanel extends ProxyView
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
				isShow: false,
				title: null,
				buttons: null,
				moreButton: null,
			};

			this.stateManager = new StateManager(state);
		}

		/**
		 * @return {AvailableEventCollection}
		 */
		getAvailableEvents()
		{
			return {
				[EventFilterType.selectMessagesMode]: [
					EventType.dialog.actionPanel.buttonTap,
					EventType.dialog.actionPanel.disabledButtonTap,
				],
			};
		}

		/**
		 * @param {boolean} animated
		 */
		async hide(animated)
		{
			const newState = { isShow: false };
			const hasChanges = this.stateManager.hasChanges(newState);

			if (this.isUiAvailable() && hasChanges)
			{
				this.stateManager.updateState(newState);

				return this.ui.hide(animated);
			}

			return false;
		}

		/**
		 * @param {object} titleData
		 * @param {Array<ActionPanelButton>} buttons
		 * @param {?ActionPanelButton} [moreButton=null]
		 */
		async show(titleData, buttons = [], moreButton = null)
		{
			const title = Type.isStringFilled(titleData?.text) ? titleData : { text: '' };
			const newState = { title, buttons, moreButton, isShow: true };
			const hasChanges = this.stateManager.hasChanges(newState);

			if (this.isUiAvailable() && hasChanges)
			{
				this.stateManager.updateState(newState);

				return this.ui.show(title, buttons, moreButton);
			}

			return false;
		}

		/**
		 * @desc Drops the "more" button while the native reference to it is still alive. Native hide()
		 * clears that reference without removing the view from the long-lived container of the panel,
		 * and the next show() strips the orphan of every constraint -- it then lands at the origin of
		 * the button row, over the first button of the panel.
		 */
		async hideMoreButton()
		{
			const hasMoreButton = !Type.isNil(this.stateManager.state.moreButton);

			if (this.isUiAvailable() && hasMoreButton && Type.isFunction(this.ui.hideMoreButton))
			{
				this.stateManager.updateState({ moreButton: null });

				return this.ui.hideMoreButton();
			}

			return false;
		}

		/**
		 * @param {object} title
		 */
		async setTitle(title)
		{
			const newState = { title };
			const hasChanges = this.stateManager.hasChanges(newState);

			if (this.isUiAvailable() && hasChanges)
			{
				this.stateManager.updateState(newState);

				return this.ui.setTitle(title);
			}

			return false;
		}

		/**
		 * @param {Array<ActionPanelButton>} buttons
		 */
		async setButtons(buttons)
		{
			const newState = { buttons };
			const hasChanges = this.stateManager.hasChanges(newState);

			if (this.isUiAvailable() && hasChanges)
			{
				this.stateManager.updateState(newState);

				return this.ui.setButtons(buttons);
			}

			return false;
		}
	}

	module.exports = {
		DialogActionPanel,
	};
});
