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

	const { Feature } = require('im/messenger/lib/feature');

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
				childrenCounter: collabCounters,
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

			if (!Feature.isRecentMultiBadgeAvailable)
			{
				return this.createLegacyMessageCount();
			}

			const ownCounter = this.getCounter();
			const childrenCounter = this.getChildrenCounter();
			const isMarkedAsUnread = this.getCounterState()?.isMarkedAsUnread === true;

			let effectiveCounter = ownCounter;

			if (effectiveCounter === 0 && isMarkedAsUnread && childrenCounter > 0)
			{
				effectiveCounter = 1;
			}

			if (effectiveCounter === 1 && childrenCounter === 0 && this.hasMention())
			{
				effectiveCounter = 0;
			}

			this.messageCount = effectiveCounter + childrenCounter;

			return this;
		}

		createCounterStyle()
		{
			const dialog = this.getDialogItem();
			if (!dialog)
			{
				return this;
			}

			if (!Feature.isRecentMultiBadgeAvailable)
			{
				return this.createLegacyCounterStyle();
			}

			this.createMultiBadgeCounterStyle();

			return this;
		}

		createMultiBadgeCounterStyle()
		{
			const hasOwnBadge = this.getCounter() > 0 || this.unread;
			const hasChildrenBadge = this.getChildrenCounter() > 0;

			if (!hasOwnBadge && !hasChildrenBadge)
			{
				return;
			}

			const ownColor = this.isMute ? Color.base5.toHex() : Color.accentMainPrimaryalt.toHex();
			const childrenColor = this.isMute ? Color.base5.toHex() : Color.accentMainSuccess.toHex();

			const colors = [];
			if (hasOwnBadge)
			{
				colors.push(ownColor);
			}
			if (hasChildrenBadge)
			{
				colors.push(childrenColor);
			}

			this.styles.counter.backgroundColorList = colors;
		}

		/**
		 * @return RecentItem
		 */
		createCounterTestId()
		{
			const childrenCounter = this.getChildrenCounter();
			const dialog = this.getDialogItem();
			const dialogCounters = dialog?.counter ?? 0;

			if (this.messageCount === 0 && !this.unread && childrenCounter === 0)
			{
				this.counterTestId = null;

				return this;
			}

			const prefix = CounterPrefix.listItemCounter;
			const value = dialogCounters > 0 || childrenCounter > 0
				? dialogCounters || childrenCounter
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
			const suffix = (childrenCounter > 0 && !dialogCounters)
				? CounterSuffix.comments
				: CounterSuffix.posts;

			this.counterTestId = `${prefix}-${dialogId}-${suffix}-${value}-${postfix}`;

			return this;
		}

		/**
		 * @return {number}
		 */
		getChildrenCounter()
		{
			return this.params.model.childrenCounter;
		}

		createCommentsStyle()
		{
			if (!Feature.isRecentMultiBadgeAvailable)
			{
				return this.createLegacyCommentsStyle();
			}

			return this;
		}

		/**
		 * @deprecated Remove after Feature.isRecentMultiBadgeAvailable cleanup
		 */
		createLegacyMessageCount()
		{
			const counter = this.getCounter();
			const childrenCounter = this.getChildrenCounter();

			if (counter)
			{
				this.messageCount = counter;
			}
			else if (childrenCounter)
			{
				this.messageCount = childrenCounter;
			}

			return this;
		}

		/**
		 * @deprecated Remove after Feature.isRecentMultiBadgeAvailable cleanup
		 */
		createLegacyCounterStyle()
		{
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

			if (this.getChildrenCounter() > 0 && !counter)
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
		 * @deprecated Remove after Feature.isRecentMultiBadgeAvailable cleanup
		 */
		createLegacyCommentsStyle()
		{
			if (
				this.getChildrenCounter()
				&& this.getCounter()
				&& !this.hasMention()
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
