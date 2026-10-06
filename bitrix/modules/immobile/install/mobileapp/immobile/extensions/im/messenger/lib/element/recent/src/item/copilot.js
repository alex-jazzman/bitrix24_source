/**
 * @module im/messenger/lib/element/recent/item/copilot
 */
jn.define('im/messenger/lib/element/recent/item/copilot', (require, exports, module) => {
	const { Loc } = require('im/messenger/loc');
	const { merge } = require('utils/object');

	const { RecentItem } = require('im/messenger/lib/element/recent/item/base');
	const { ChatTitle } = require('im/messenger/lib/element/chat-title');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');

	/**
	 * @class CopilotItem
	 */
	class CopilotItem extends RecentItem
	{
		/**
		 * @param {RecentModelState} modelItem
		 * @param {object} options
		 */
		constructor(modelItem = {}, options = {})
		{
			super(modelItem, options);
		}

		createTitleStyle()
		{
			if (this.isMute)
			{
				this.styles.title = merge(this.styles.title, {
					additionalImage: {
						name: 'name_status_mute',
					},
				});
			}

			return this;
		}

		createSubtitle()
		{
			const item = this.getModelItem();
			const message = this.getItemMessage();
			if (message.id === 0)
			{
				this.subtitle = ChatTitle.createFromDialogId(item.id).getDescription();

				return this;
			}

			const user = serviceLocator.get('core').getStore().getters['usersModel/getById'](message.senderId);
			const isYourMessage = message.senderId === serviceLocator.get('core').getUserId();
			if (isYourMessage)
			{
				this.subtitle = Loc.getMessage('IMMOBILE_ELEMENT_RECENT_YOU_WROTE') + this.getMessageText(item);

				return this;
			}
			const messageText = this.getMessageText(item);

			const hasAuthor = message.senderId;
			if (!hasAuthor)
			{
				this.subtitle = messageText;

				return this;
			}

			if (this.shouldShowSubtitleAvatar())
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

		createColor()
		{
			const dialog = this.getDialogItem();
			if (dialog)
			{
				this.color = dialog.color;
			}

			return this;
		}

		createActions()
		{
			this.actions = [
				this.getMuteAction(),
				this.getHideAction(),
				this.getAddToFolderAction(),
				this.getPinAction(),
				this.getReadAction(),
			].filter(Boolean);

			return this;
		}
	}

	module.exports = {
		CopilotItem,
	};
});
