/**
 * @module im/messenger/view/dialog/mention-panel
 */
jn.define('im/messenger/view/dialog/mention-panel', (require, exports, module) => {
	const { mergeImmutable } = require('utils/object');
	const { EventFilterType } = require('im/messenger/const');

	const { StateManager } = require('im/messenger/view/lib/state-manager');
	const { ProxyView } = require('im/messenger/view/lib/proxy-view');

	/**
	 * @class DialogMentionPanel
	 */
	class DialogMentionPanel extends ProxyView
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
				isOpen: false,
				isShowLoader: false,
				items: null,
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
		 * @param {Array<MentionItem>} items
		 */
		open(items)
		{
			const newState = { items, isOpen: true };
			const hasChanges = this.stateManager.hasChanges(newState);

			if (this.isUiAvailable() && hasChanges)
			{
				this.stateManager.updateState(newState);
				this.ui.open(items);
			}
		}

		/**
		 * @void
		 */
		close()
		{
			const newState = { isOpen: false, items: null };
			const hasChanges = this.stateManager.hasChanges(newState);

			if (this.isUiAvailable() && hasChanges)
			{
				this.stateManager.updateState(newState);
				this.ui.close();
			}
		}

		/**
		 * @param {string} id
		 * @param {Partial<MentionItem>} item
		 */
		update(id, item)
		{
			let hasChanges = false;
			let newItem = { ...item };

			const newStateItems = this.stateManager.state.items?.map((mention) => {
				const needUpdate = id === mention.id;
				if (needUpdate)
				{
					hasChanges = true;
					newItem = mergeImmutable(mention, newItem);

					return newItem;
				}

				return mention;
			});

			if (this.isUiAvailable() && hasChanges)
			{
				this.ui.update(id, newItem);
				this.stateManager.updateState({ items: newStateItems });
			}
		}

		/**
		 * @param {string} id
		 * @param {MentionAction} item
		 */
		animateAction(id, item)
		{
			const existingItem = this.stateManager.state.items.find((mention) => mention.id === id);

			if (this.isUiAvailable() && existingItem)
			{
				this.ui.animateAction(id, item);
			}
		}

		/**
		 * @param {Array<MentionItem>} items
		 */
		setItems(items)
		{
			const newState = { items };
			const hasChanges = this.stateManager.hasChanges(newState);

			if (this.isUiAvailable() && hasChanges)
			{
				this.ui.setItems(items);
				this.stateManager.updateState(newState);
			}
		}

		/**
		 * @void
		 */
		showLoader()
		{
			const newState = { isShowLoader: true };
			const hasChanges = this.stateManager.hasChanges(newState);

			if (this.isUiAvailable() && hasChanges)
			{
				this.stateManager.updateState(newState);
				this.ui.showLoader();
			}
		}

		/**
		 * @void
		 */
		hideLoader()
		{
			const newState = { isShowLoader: false };
			const hasChanges = this.stateManager.hasChanges(newState);

			if (this.isUiAvailable() && hasChanges)
			{
				this.stateManager.updateState(newState);
				this.ui.hideLoader();
			}
		}
	}

	module.exports = {
		DialogMentionPanel,
	};
});
