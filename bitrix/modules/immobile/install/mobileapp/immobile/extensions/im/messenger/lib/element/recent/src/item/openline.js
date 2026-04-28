/**
 * @module im/messenger/lib/element/recent/item/openline
 */
jn.define('im/messenger/lib/element/recent/item/openline', (require, exports, module) => {
	const { Type } = require('type');
	const { merge } = require('utils/object');
	const { Loc } = require('im/messenger/loc');
	const { OpenlineStatus } = require('im/messenger/const');
	const { DialogHelper } = require('im/messenger/lib/helper');

	const { RecentItem } = require('im/messenger/lib/element/recent/item/base');
	const { ChatTitle } = require('im/messenger/lib/element/chat-title');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const {
		OperatorAnswerAction,
		OperatorSpamAction,
		OperatorSkipAction,
		OperatorFinishAction,
	} = require('im/messenger/lib/element/recent/item/action/action');

	const RecentItemSectionCode = Object.freeze({
		new: 'new',
		work: 'work',
		answered: 'answered',
	});

	const OperatorActionType = {
		answer: 'answer',
		spam: 'spam',
		skip: 'skip',
		finish: 'finish',
	};

	const OperatorAction = {
		[OperatorActionType.answer]: OperatorAnswerAction,
		[OperatorActionType.spam]: OperatorSpamAction,
		[OperatorActionType.skip]: OperatorSkipAction,
		[OperatorActionType.finish]: OperatorFinishAction,
	};

	/**
	 * @class OpenlineItem
	 */
	class OpenlineItem extends RecentItem
	{
		/**
		 * @param {RecentModelState} modelItem
		 * @param {object} options
		 */
		constructor(modelItem = {}, options = {})
		{
			super(modelItem, options);
		}

		/**
		 * @return {MessengerCoreStore}
		 */
		get store()
		{
			return serviceLocator.get('core').getStore();
		}

		/**
		 * @return RecentItem
		 */
		createActions()
		{
			const dialogId = this.getModelItem().id;
			const dialog = this.getDialogById(dialogId);
			if (Type.isNil(dialog))
			{
				return this;
			}

			if (dialog.owner === 0)
			{
				this.actions = [
					this.getOperatorAction(OperatorActionType.answer),
					this.getOperatorAction(OperatorActionType.skip),
					this.getOperatorAction(OperatorActionType.spam),
				];

				return this;
			}

			const isOwner = DialogHelper.createByDialogId(dialogId)?.isCurrentUserOwner;
			if (isOwner)
			{
				this.actions = [
					this.getOperatorAction(OperatorActionType.finish),
					this.getOperatorAction(OperatorActionType.spam),
				];

				return this;
			}

			return this;
		}

		/**
		 * @return RecentItem
		 */
		createSubtitle()
		{
			const item = this.getModelItem();
			const message = this.getItemMessage();

			const messageText = this.getMessageText(item);
			if (!Type.isPlainObject(message) || message.id === 0)
			{
				this.subtitle = ChatTitle.createFromDialogId(item.id).getDescription() ?? this.subtitle;

				return this;
			}

			const hasAuthor = message.senderId;
			if (!hasAuthor)
			{
				this.subtitle = messageText;

				return this;
			}

			const isYourMessage = message.senderId === serviceLocator.get('core').getUserId();
			if (isYourMessage)
			{
				this.subtitle = Loc.getMessage('IMMOBILE_ELEMENT_RECENT_YOU_WROTE') + messageText;

				return this;
			}

			let authorInfo = '';

			const user = this.store.getters['usersModel/getById'](message.senderId);
			if (!user)
			{
				this.subtitle = messageText;

				return this;
			}

			if (user.firstName)
			{
				const shortLastName = (user.lastName ? ` ${user.lastName.slice(0, 1)}.` : '');
				authorInfo = `${user.firstName + shortLastName}: `;
			}
			else if (user.name)
			{
				authorInfo = `${user.name}: `;
			}

			this.subtitle = authorInfo + messageText;

			return this;
		}

		/**
		 * @return RecentItem
		 */
		createAvatarStyle()
		{
			const dialog = this.getDialogById(this.getModelItem().id);
			if (Type.isNil(dialog))
			{
				return this;
			}

			const source = dialog.entityId.split('|')[0];
			const imageCode = this.getAvatarImageCode(source);
			this.styles.avatar = merge(this.styles.avatar, {
				image: {
					name: `status_${imageCode}`,
				},
			});

			return this;
		}

		/**
		 * @return RecentItem
		 */
		createTitleStyle()
		{
			const dialog = this.getDialogItem();
			if (Type.isNil(dialog))
			{
				return this;
			}

			const isOwner = DialogHelper.createByModel(dialog)?.isCurrentUserOwner;
			if (isOwner)
			{
				this.styles.title = merge(this.styles.title, {
					image: {
						name: 'name_status_owner',
					},
				});

				return this;
			}

			if (dialog.owner === 0)
			{
				this.styles.title = merge(this.styles.title, {
					image: {
						name: 'name_status_new',
					},
					color: '#e66467',
				});

				return this;
			}

			return this;
		}

		/**
		 * @return RecentItem
		 */
		createSortValues()
		{
			const chatId = this.getDialogItem()?.chatId;
			const session = this.store.getters['dialoguesModel/openlinesModel/getSession'](chatId);

			switch (session?.status)
			{
				case OpenlineStatus.new:
				case OpenlineStatus.work:
					this.sortValues = { order: session.id };
					break;

				default:
					this.sortValues = { order: this.date };
			}

			return this;
		}

		/**
		 * @return RecentItem
		 */
		createSectionCode()
		{
			const chatId = this.getDialogItem()?.chatId;
			if (!Type.isNumber(chatId))
			{
				return this;
			}

			const sessionStatus = this.store.getters['dialoguesModel/openlinesModel/getSessionStatus'](chatId);
			if (!Type.isStringFilled(sessionStatus))
			{
				return this;
			}

			if (sessionStatus === OpenlineStatus.new)
			{
				this.sectionCode = RecentItemSectionCode.new;

				return this;
			}

			this.sectionCode = RecentItemSectionCode[sessionStatus];

			return this;
		}

		/**
		 * @private
		 * @param {string} source
		 * @return {string}
		 */
		getAvatarImageCode(source)
		{
			switch (source)
			{
				case 'livechat':
					return 'livechat';

				case 'viber':
					return 'viber';

				case 'telegrambot':
				case 'botframework.telegram':
					return 'telegram';

				case 'instagram':
					return 'instagram';

				case 'vkgroup':
					return 'vk';

				case 'facebook':
				case 'botframework.facebookmessenger':
					return 'fbm';

				case 'facebookcomments':
					return 'facebook';

				case 'network':
					return 'network';

				case 'botframework.skype':
					return 'skype';

				case 'botframework.slack':
					return 'slack';

				case 'botframework.kik':
					return 'kik';

				case 'botframework.groupme':
					return 'groupme';

				case 'botframework.twilio':
					return 'twilio';

				case 'botframework.webchat':
					return 'webchat';

				case 'botframework.emailoffice365':
					return 'email';

				default:
					return 'world';
			}
		}

		/**
		 * @private
		 * @return {RecentWidgetItemAction}
		 */
		getOperatorAction(actionType)
		{
			return OperatorAction[actionType];
		}
	}

	module.exports = {
		OpenlineItem,
	};
});
