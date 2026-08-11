/**
 * @module im/messenger/controller/dialog/lib/message-footer-action
 */
jn.define('im/messenger/controller/dialog/lib/message-footer-action', (require, exports, module) => {
	const { Type } = require('type');
	const { debounce } = require('utils/function');
	const { Haptics } = require('haptics');
	const { Color: ColorTokens } = require('tokens');
	const { FeedbackForm } = require('layout/ui/feedback-form-opener');

	const { EventType, MessageActionType, MessageActionVoteValue } = require('im/messenger/const');
	const { isOnline } = require('device/connection');
	const { Notification } = require('im/messenger/lib/ui/notification');
	const { MessageFooterActionService } = require('im/messenger/provider/services/message-footer-action');
	const { DialogTextHelper } = require('im/messenger/controller/dialog/lib/helper/text');
	const { ForwardSelector } = require('im/messenger/controller/selector/forward');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { Feature } = require('im/messenger/lib/feature');
	const { MessengerParams } = require('im/messenger/lib/params');
	const { getLogger } = require('im/messenger/lib/logger');

	const logger = getLogger('dialog--message-footer-action');

	const FEEDBACK_MESSAGE_MAX_LENGTH = 1000;

	const ActionTint = Object.freeze({
		active: ColorTokens.accentMainPrimaryalt.toHex(),
		neutral: ColorTokens.chatOtherCopilot2.toHex(),
	});

	const ActionIconName = Object.freeze({
		like: 'like',
		likeSolid: 'solid_like',
		dislike: 'dislike',
		dislikeSolid: 'solid_disike',
	});

	/**
	 * @class MessageFooterActionManager
	 */
	class MessageFooterActionManager
	{
		/**
		 * @param {Object} options
		 * @param {IServiceLocator<DialogLocatorServices>} options.dialogLocator
		 */
		constructor(options)
		{
			const { dialogLocator } = options;

			this.dialogLocator = dialogLocator;

			/** @type {MessengerCoreStore} */
			this.store = serviceLocator.get('core').getStore();

			/** @type {Map<string, 'like'|'dislike'|null>} */
			this.voteState = new Map();

			/** @type {MessageFooterActionService} */
			this.feedbackService = new MessageFooterActionService();

			this.handleLike = debounce(this.handleLike, 500, this, true);
			this.handleDislike = debounce(this.handleDislike, 500, this, true);
			this.handleRegenerate = debounce(this.handleRegenerate, 3000, this, true);
		}

		/**
		 * @return {string}
		 */
		get dialogId()
		{
			return this.dialogLocator.get('dialogId');
		}

		/**
		 * @return {DialogView}
		 */
		get view()
		{
			return this.dialogLocator.get('view');
		}

		/**
		 * @return {MessageRenderer}
		 */
		get messageRenderer()
		{
			return this.dialogLocator.get('message-renderer');
		}

		subscribeEvents()
		{
			this.view.on(EventType.dialog.actionTap, this.onActionTap);
		}

		unsubscribeEvents()
		{
			this.view.off(EventType.dialog.actionTap, this.onActionTap);
		}

		destructor()
		{
			this.voteState.clear();
		}

		/**
		 * @param {string} messageId
		 * @param {string} actionId
		 */
		onActionTap = (messageId, actionId) =>
		{
			Haptics.impactLight();

			switch (actionId)
			{
				case MessageActionType.copy:
					this.handleCopy(messageId);
					break;

				case MessageActionType.like:
					this.handleLike(messageId);
					break;

				case MessageActionType.dislike:
					this.handleDislike(messageId);
					break;

				case MessageActionType.regenerate:
					this.handleRegenerate(messageId);
					break;

				case MessageActionType.forward:
					this.handleForward(messageId);
					break;

				default:
					break;
			}
		}

		/**
		 * @param {string} messageId
		 */
		handleLike(messageId)
		{
			logger.log('MessageFooterActionManager.handleLike', messageId);

			const currentVote = this.voteState.get(messageId);
			const newVote = currentVote === MessageActionVoteValue.like ? null : MessageActionVoteValue.like;
			this.voteState.set(messageId, newVote);
			this.#updateActionsTint(messageId);

			if (newVote)
			{
				this.feedbackService.sendVote(messageId, MessageActionVoteValue.like)
					.catch(() => Notification.showErrorToast())
				;
			}
		}

		/**
		 * @param {string} messageId
		 */
		handleDislike(messageId)
		{
			logger.log('MessageFooterActionManager.handleDislike', messageId);

			const currentVote = this.voteState.get(messageId);
			const newVote = currentVote === MessageActionVoteValue.dislike ? null : MessageActionVoteValue.dislike;
			this.voteState.set(messageId, newVote);
			this.#updateActionsTint(messageId);

			if (newVote)
			{
				this.feedbackService.sendVote(messageId, MessageActionVoteValue.dislike)
					.catch(() => Notification.showErrorToast())
				;
				this.#openFeedbackForm(messageId);
			}
		}

		/**
		 * @param {string} messageId
		 */
		handleRegenerate(messageId)
		{
			logger.log('MessageFooterActionManager.handleRegenerate', messageId);

			if (!isOnline())
			{
				Notification.showOfflineToast();

				return;
			}

			this.#updateActionsTint(messageId, {
				[MessageActionType.regenerate]: { tint: ActionTint.active },
			});
			this.feedbackService.sendRegenerate(messageId)
				.catch(() => Notification.showErrorToast())
			;
		}

		/**
		 * @param {string} messageId
		 */
		handleCopy(messageId)
		{
			const modelMessage = this.store.getters['messagesModel/getById'](messageId);
			DialogTextHelper.copyToClipboard(
				modelMessage.text,
				{
					parentWidget: this.view.ui,
				},
			);
		}

		/**
		 * @param {string} messageId
		 */
		handleForward(messageId)
		{
			if (!isOnline())
			{
				Notification.showOfflineToast();

				return;
			}

			const forwardSelector = new ForwardSelector({
				messageIds: [messageId],
				fromDialogId: this.dialogId,
				locator: this.dialogLocator,
			});

			void forwardSelector.open({ parentWidget: this.view.ui });
		}

		/**
		 * @param {string} messageId
		 */
		#openFeedbackForm(messageId)
		{
			const modelMessage = this.store.getters['messagesModel/getById'](messageId);
			const dialogModel = this.store.getters['dialoguesModel/getById'](this.dialogId);

			const formId = Feature.isBitrixGptV2Available ? 'aiAssistantV2' : 'aiAssistant';

			const extraHiddenFields = {
				message: modelMessage.text.slice(0, FEEDBACK_MESSAGE_MAX_LENGTH),
				chat_id: dialogModel?.chatId ?? 0,
				message_id: modelMessage.id,
				user_id: MessengerParams.getUserId(),
				sending_time: modelMessage.date instanceof Date
					? modelMessage.date.toISOString()
					: String(modelMessage.date),
			};

			const feedbackForm = new FeedbackForm({
				formId,
				senderPage: 'copilot_message',
				extraHiddenFields,
			});
			feedbackForm.openInBackdrop();
		}

		/**
		 * @param {string} messageId
		 * @param {Object} [overrides]
		 */
		#updateActionsTint(messageId, overrides = {})
		{
			const message = this.messageRenderer.viewMessageCollection[messageId];
			if (!Type.isArrayFilled(message?.actions))
			{
				return;
			}

			const currentVote = this.voteState.get(messageId);

			message.actions = message.actions.map((action) => {
				if (overrides[action.id])
				{
					return { ...action, ...overrides[action.id] };
				}

				if (action.id === MessageActionType.like)
				{
					const isActive = currentVote === MessageActionVoteValue.like;

					return {
						...action,
						tint: isActive ? ActionTint.active : ActionTint.neutral,
						iconName: isActive ? ActionIconName.likeSolid : ActionIconName.like,
					};
				}

				if (action.id === MessageActionType.dislike)
				{
					const isActive = currentVote === MessageActionVoteValue.dislike;

					return {
						...action,
						tint: isActive ? ActionTint.active : ActionTint.neutral,
						iconName: isActive ? ActionIconName.dislikeSolid : ActionIconName.dislike,
					};
				}

				return action;
			});

			void this.view.updateMessageById(messageId, message, 'actions');
		}
	}

	module.exports = { MessageFooterActionManager };
});
