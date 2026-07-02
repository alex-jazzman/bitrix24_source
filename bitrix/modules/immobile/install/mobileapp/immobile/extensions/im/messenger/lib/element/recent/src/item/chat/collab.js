/**
 * @module im/messenger/lib/element/recent/item/chat/collab
 */
jn.define('im/messenger/lib/element/recent/item/chat/collab', (require, exports, module) => {
	const { Theme } = require('im/lib/theme');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { ChatItem } = require('im/messenger/lib/element/recent/item/chat');
	const {
		CounterPrefix,
		CounterValue,
		CounterPostfix,
		CounterSuffix,
	} = require('im/messenger/lib/element/recent/const/test-id');

	const { AnchorType } = require('im/messenger/const');

	const { Color } = require('tokens');
	const { Icon } = require('assets/icons');

	/**
	 * @class CollabItem
	 */
	class CollabItem extends ChatItem
	{
		/**
		 * @param {RecentModelState} modelItem
		 * @param {object} options
		 * @return RecentItem
		 */
		initParams(modelItem, options)
		{
			super.initParams(modelItem, options);

			this.dialog = this.params.model.dialog;
			const store = serviceLocator.get('core').getStore();
			const collabCounters = store.getters['counterModel/getNumberChildCounters'](this.dialog?.chatId);

			this.params.model = {
				...this.params.model,
				commentsCounter: collabCounters,
			};

			return this;
		}

		createMessageCount()
		{
			const dialog = this.getDialogItem();
			if (!dialog)
			{
				return this;
			}

			const counter = this.getCounter();
			if (counter)
			{
				this.messageCount = counter;
			}
			else if (this.getCommentsCounterItem())
			{
				this.messageCount = this.getCommentsCounterItem();
			}

			return this;
		}

		createCounterStyle()
		{
			const dialog = this.getDialogItem();
			if (!dialog)
			{
				return this;
			}

			if (this.isMute)
			{
				this.styles.counter.backgroundColor = Theme.colors.base5;

				return this;
			}

			const counter = this.getCounter();

			if (counter > 0)
			{
				this.styles.counter.backgroundColor = Theme.colors.accentMainPrimaryalt;

				return this;
			}

			if (this.getCommentsCounterItem() > 0 && !counter)
			{
				this.styles.counter.backgroundColor = Theme.colors.accentMainSuccess;

				return this;
			}

			if (this.unread)
			{
				this.styles.counter.backgroundColor = Theme.colors.accentMainPrimaryalt;
			}

			return this;
		}

		/**
		 * @return RecentItem
		 */
		createCounterTestId()
		{
			const commentCounters = this.getCommentsCounterItem();
			const dialog = this.getDialogItem();
			const dialogCounters = dialog?.counter ?? 0;

			if (this.messageCount === 0 && !this.unread && commentCounters === 0)
			{
				this.counterTestId = null;

				return this;
			}

			const prefix = CounterPrefix.listItemCounter;
			const value = dialogCounters > 0 || commentCounters > 0
				? dialogCounters || commentCounters
				: CounterValue.unread;

			let postfix = '';
			if (this.isMute)
			{
				postfix = CounterPostfix.muted;
			}
			else if (dialogCounters > 0)
			{
				postfix = CounterPostfix.unmuted;
			}
			else
			{
				postfix = CounterPostfix.watch;
			}

			const dialogId = this.getModelItem().id;
			const suffix = (commentCounters > 0 && !dialogCounters)
				? CounterSuffix.comments
				: CounterSuffix.posts;

			this.counterTestId = `${prefix}-${dialogId}-${suffix}-${value}-${postfix}`;

			return this;
		}

		/**
		 * @return {number}
		 */
		getCommentsCounterItem()
		{
			return this.params.model.commentsCounter;
		}

		createCommentsStyle()
		{
			const hasMention = serviceLocator.get('core').getStore().getters['anchorModel/hasAnchorsByType'](this.dialog?.chatId, AnchorType.mention);

			if (
				this.getCommentsCounterItem()
				&& this.getCounter()
				&& !hasMention
			)
			{
				this.styles.comments = {
					backgroundColor: Color.accentMainSuccess.toHex(),
					image: {
						name: Icon.SMALL_MESSAGE_2.getIconName(),
						tintColor: Color.baseWhiteFixed.toHex(),
						contentHeight: 16,
					},
				};
			}

			return this;
		}
	}

	module.exports = {
		CollabItem,
	};
});
