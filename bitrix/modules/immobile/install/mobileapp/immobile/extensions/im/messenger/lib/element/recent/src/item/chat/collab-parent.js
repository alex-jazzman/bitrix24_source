/**
 * @module im/messenger/lib/element/recent/item/chat/collab-parent
 */
jn.define('im/messenger/lib/element/recent/item/chat/collab-parent', (require, exports, module) => {
	const { Loc } = require('im/messenger/loc');
	const { Theme } = require('im/lib/theme');
	const { CollabItem } = require('im/messenger/lib/element/recent/item/chat/collab');
	const {
		CounterPrefix,
		CounterValue,
		CounterPostfix,
		CounterSuffix,
	} = require('im/messenger/lib/element/recent/const/test-id');

	/**
	 * @class CollabParentChatItem
	 */
	class CollabParentChatItem extends CollabItem
	{
		/**
		 * @return {CollabParentChatItem}
		 */
		createTitle()
		{
			this.title = Loc.getMessage('IMMOBILE_ELEMENT_RECENT_COLLAB_PARENT_CHAT_TITLE');

			return this;
		}

		/**
		 * @return {CollabParentChatItem}
		 */
		createSectionCode()
		{
			this.sectionCode = 'parentChat';

			return this;
		}

		/**
		 * Shows only direct counter, ignoring child counters.
		 * @return {CollabParentChatItem}
		 */
		createMessageCount()
		{
			const counter = this.getCounter();
			if (counter)
			{
				this.messageCount = counter;
			}

			return this;
		}

		/**
		 * Always uses primary color — no green child-counter style.
		 * @return {CollabParentChatItem}
		 */
		createCounterStyle()
		{
			this.styles.counter.backgroundColor = this.isMute
				? Theme.colors.base5
				: Theme.colors.accentMainPrimaryalt;

			return this;
		}

		/**
		 * Uses base counter test id logic (no child counters).
		 * @return {CollabParentChatItem}
		 */
		createCounterTestId()
		{
			if (this.messageCount === 0 && !this.unread)
			{
				this.counterTestId = null;

				return this;
			}

			const prefix = CounterPrefix.listItemCounter;
			const dialogId = this.getModelItem().id;
			const suffix = CounterSuffix.messages;
			const value = this.messageCount > 0 ? this.messageCount : CounterValue.unread;
			const postfix = this.isMute ? CounterPostfix.muted : CounterPostfix.unmuted;

			this.counterTestId = `${prefix}-${dialogId}-${suffix}-${value}-${postfix}`;

			return this;
		}

		createCommentsStyle()
		{
			return this;
		}

		createActions()
		{
			this.actions = [
				this.getMuteAction(),
				this.getAddToFolderAction(),
				this.getReadAction(),
			].filter(Boolean);

			return this;
		}
	}

	module.exports = {
		CollabParentChatItem,
	};
});
