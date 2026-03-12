/**
 * @module im/messenger/lib/element/recent/item/chat/channel
 */
jn.define('im/messenger/lib/element/recent/item/chat/channel', (require, exports, module) => {
	const { Theme } = require('im/lib/theme');
	const {
		ComponentCode,
		AnchorType,
	} = require('im/messenger/const');
	const { MessengerParams } = require('im/messenger/lib/params');
	const { ChatItem } = require('im/messenger/lib/element/recent/item/chat');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { Color } = require('tokens');
	const { Icon } = require('assets/icons');

	const { CounterPrefix, CounterValue, CounterPostfix } = require('im/messenger/lib/element/recent/item/chat/const/test-id');

	/**
	 * @class ChannelItem
	 */
	class ChannelItem extends ChatItem
	{
		constructor(modelItem = {}, options = {})
		{
			super(modelItem, options);

			this.setSuperEllipseIcon();
		}

		/**
		 * @param {RecentModelState} modelItem
		 * @param {object} options
		 * @return RecentItem
		 */
		initParams(modelItem, options)
		{
			super.initParams(modelItem, options);

			this.dialog = this.params.model.dialog;
			const postsCountWithCounters = serviceLocator.get('core').getStore()
				.getters['commentModel/getPostsCountWithCounters'](this.dialog?.chatId);

			this.params.model = {
				...this.params.model,
				commentsCounter: postsCountWithCounters,
			};

			return this;
		}

		/**
		 * @return RecentItem
		 */
		createUnread()
		{
			if (MessengerParams.getComponentCode() === ComponentCode.imChannelMessenger)
			{
				this.unread = false;

				return this;
			}

			this.unread = this.getModelItem().unread;

			return this;
		}

		/**
		 * @deprecated use to AvatarDetail
		 */
		setSuperEllipseIcon()
		{
			this.isSuperEllipseIcon = true;
			// for native support styles (isSuperEllipseIcon key will be deleted)

			const roundingRadiusByDesign = Theme.corner.M.toNumber();
			const heightIcon = 56;
			const borderPercent = Math.round((roundingRadiusByDesign / heightIcon) * 100);
			this.styles.image = { image: { borderRadius: borderPercent } };
		}

		createMessageCount()
		{
			if (MessengerParams.getComponentCode() === ComponentCode.imChannelMessenger)
			{
				return this;
			}

			const dialog = this.getDialogItem();
			if (!dialog)
			{
				return this;
			}

			if (dialog.counter)
			{
				this.messageCount = dialog.counter;
			}
			else if (this.getCommentsCounterItem())
			{
				this.messageCount = this.getCommentsCounterItem();
			}

			return this;
		}

		createCounterStyle()
		{
			if (MessengerParams.getComponentCode() === ComponentCode.imChannelMessenger)
			{
				return this;
			}

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

			if (dialog.counter > 0)
			{
				this.styles.counter.backgroundColor = Theme.colors.accentMainPrimaryalt;

				return this;
			}

			if (this.getCommentsCounterItem() > 0 && !dialog.counter)
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
			const dialogCounters = this.getDialogItem().counter;

			if (this.messageCount === 0 && !this.unread && commentCounters === 0)
			{
				this.counterTestId = null;

				return this;
			}

			const prefix = CounterPrefix.counter;
			const value = dialogCounters > 0 || commentCounters > 0 ? dialogCounters || commentCounters : CounterValue.unread;

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

			this.counterTestId = `${prefix}-${value}-${postfix}`;

			return this;
		}

		createActions()
		{
			if (!this.params.options.isNeedShowActions)
			{
				this.actions = [];

				return this;
			}

			this.actions = [
				this.getMuteAction(),
				this.getHideAction(),
				this.getPinAction(),
				this.getReadAction(),
			];

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
				&& this.getDialogItem().counter
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

	module.exports = { ChannelItem };
});
