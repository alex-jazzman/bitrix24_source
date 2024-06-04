/**
 * @module im/messenger/lib/element/recent/item/chat/channel
 */
jn.define('im/messenger/lib/element/recent/item/chat/channel', (require, exports, module) => {
	const { Loc } = require('loc');
	const { ChatItem } = require('im/messenger/lib/element/recent/item/chat');
	const { ChatTitle } = require('im/messenger/lib/element/chat-title');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');

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

		setSuperEllipseIcon()
		{
			this.isSuperEllipseIcon = true;
		}

		createSubtitle()
		{
			const item = this.getModelItem();
			const message = item.message;
			if (message.id === 0)
			{
				this.subtitle = ChatTitle.createFromDialogId(item.id).getDescription();

				return this;
			}

			const messageText = this.getMessageText();

			const user = serviceLocator.get('core').getStore().getters['usersModel/getById'](message.senderId);
			const isYourMessage = item.message.senderId === serviceLocator.get('core').getUserId();
			if (isYourMessage)
			{
				this.subtitle = Loc.getMessage('IMMOBILE_ELEMENT_RECENT_YOU_WROTE') + messageText;

				return this;
			}

			const hasAuthor = item.message.senderId;
			if (!hasAuthor)
			{
				this.subtitle = messageText;

				return this;
			}

			let authorInfo = '';
			if (user && user.firstName)
			{
				const shortLastName = (user.lastName ? ` ${user.lastName.slice(0, 1)}.` : '');
				authorInfo = `${user.firstName + shortLastName}: `;
			}
			else if (user && user.name)
			{
				authorInfo = `${user.name}: `;
			}

			this.subtitle = authorInfo + messageText;

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
			];

			return this;
		}
	}

	module.exports = { ChannelItem };
});
