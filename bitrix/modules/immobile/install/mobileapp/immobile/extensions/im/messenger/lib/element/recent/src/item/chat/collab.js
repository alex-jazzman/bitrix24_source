/**
 * @module im/messenger/lib/element/recent/item/chat/collab
 */
jn.define('im/messenger/lib/element/recent/item/chat/collab', (require, exports, module) => {
	const { Theme } = require('im/lib/theme');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { ChatItem } = require('im/messenger/lib/element/recent/item/chat');
	const { ChatAvatar } = require('im/messenger/lib/element/chat-avatar');
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

			this.subtitleHasBbCode = false;

			this.dialog = this.params.model.dialog;
			const store = serviceLocator.get('core').getStore();
			const collabCounters = store.getters['counterModel/getNumberChildCounters'](this.dialog?.chatId);

			this.params.model = {
				...this.params.model,
				childrenCounter: collabCounters,
			};

			return this;
		}

		/**
		 * @return {boolean}
		 */
		hasNestedSource()
		{
			if (!Feature.isCollabPreviewSourceAvailable)
			{
				return false;
			}

			const message = this.getItemMessage();
			const dialog = this.getDialogItem();

			if (!message || !dialog)
			{
				return false;
			}

			// The current user's own message is shown as a regular own message,
			// without the nested-source name or avatar.
			if (message.senderId === serviceLocator.get('core').getUserId())
			{
				return false;
			}

			const sourceChatId = Number.parseInt(message.chatId, 10);
			const ownChatId = Number.parseInt(dialog.chatId, 10);

			return sourceChatId > 0 && sourceChatId !== ownChatId;
		}

		/**
		 * @return {?DialoguesModelState}
		 */
		getSourceDialog()
		{
			if (!this.hasNestedSource())
			{
				return null;
			}

			const message = this.getItemMessage();

			return serviceLocator.get('core').getStore().getters['dialoguesModel/getByChatId'](message.chatId) ?? null;
		}

		/**
		 * @return {RecentItem}
		 */
		createSubtitle()
		{
			if (!this.hasNestedSource())
			{
				return super.createSubtitle();
			}

			const sourceDialog = this.getSourceDialog();
			const messageText = this.getMessageText();

			if (!sourceDialog || !sourceDialog.name)
			{
				this.subtitle = messageText;

				return this;
			}

			if (!Feature.isChatDialogListSupportsSubtitleBbCodes)
			{
				this.subtitle = `${sourceDialog.name}: ${messageText}`;

				return this;
			}

			const color = Color.accentMainLink.toHex();
			// The name is user-controlled, so a zero-width space after every '[' stops it
			// from closing our [COLOR] wrapper or injecting its own BB-code. Defang before
			// slicing so the invisible marker never gets cut off its bracket.
			// truncateSubtitle() then caps the whole subtitle at 150 chars right after
			// createSubtitle(); maxNameLength keeps the closing [/COLOR] tag from being cut.
			const maxNameLength = 150 - `[COLOR=${color}][/COLOR]`.length;
			let name = sourceDialog.name.replaceAll('[', '[\u200B').slice(0, maxNameLength);
			// A slice on maxNameLength may land between a '[' and its zero-width space,
			// leaving a bare '['; drop it so no unescaped bracket reaches the renderer.
			if (name.endsWith('['))
			{
				name = name.slice(0, -1);
			}

			this.subtitle = `[COLOR=${color}]${name}[/COLOR]: ${messageText}`;
			this.subtitleHasBbCode = true;

			return this;
		}

		/**
		 * When the subtitle carries the nested-source name in a [COLOR] tag, the recent
		 * widget renders BBCode only with showBBCode disabled (same contract as the draft
		 * prefix in the base item). Base createSubtitleStyle() runs after createSubtitle()
		 * and resets showBBCode to true, so flip it back off here.
		 * @return {RecentItem}
		 */
		createSubtitleStyle()
		{
			super.createSubtitleStyle();

			if (this.subtitleHasBbCode)
			{
				this.styles.subtitle.showBBCode = false;
			}

			return this;
		}

		/**
		 * When the last message comes from a nested source chat, the subtitle avatar
		 * represents that source chat instead of the message author. It follows the same
		 * visibility as the nested-source name - shown for any nested source and gated only
		 * by native support and the draft state, not by the base author-message rules.
		 * @return {RecentItem}
		 */
		createSubtitleAvatar()
		{
			if (!this.hasNestedSource())
			{
				return super.createSubtitleAvatar();
			}

			if (!Feature.isChatRecentSubtitleAvatarSupported || this.hasDraft())
			{
				return this;
			}

			const sourceDialog = this.getSourceDialog();
			if (!sourceDialog || !sourceDialog.dialogId)
			{
				return super.createSubtitleAvatar();
			}

			this.subtitleAvatar = ChatAvatar
				.createFromDialogId(sourceDialog.dialogId)
				.getRecentItemSubtitleAvatarProps();

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
			const dialogCounters = this.getCounter();

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

		/**
		 * Project (collab) chat aggregates unread from its nested chats, so the
		 * read/unread menu action must reflect the children counter as well.
		 * @return {number}
		 */
		getReadActionChildrenCounter()
		{
			return this.getChildrenCounter();
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
