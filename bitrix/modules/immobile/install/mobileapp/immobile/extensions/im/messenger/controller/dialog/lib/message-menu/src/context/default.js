/**
 * @module im/messenger/controller/dialog/lib/message-menu/src/context/default
 */
jn.define('im/messenger/controller/dialog/lib/message-menu/src/context/default', (require, exports, module) => {
	const { Type } = require('type');
	const { Loc } = require('im/messenger/loc');
	const { Alert, confirmDestructiveAction } = require('alert');
	const { Icon } = require('assets/icons');
	const { isOnline } = require('device/connection');
	const {
		EventType,
		MessageMenuActionType,
		PinCount,
		BBCode,
		MessageMenuSectionId,
		Color: MessengerColor,
	} = require('im/messenger/const');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { MessengerEmitter } = require('im/messenger/lib/emitter');
	const { Notification, ToastType } = require('im/messenger/lib/ui/notification');
	const { showDeleteChannelPostAlert } = require('im/messenger/lib/ui/alert');
	const { UserProfile } = require('im/messenger/controller/user-profile');
	const { ForwardSelector } = require('im/messenger/controller/selector/forward');
	const { DialogTextHelper } = require('im/messenger/controller/dialog/lib/helper/text');
	const { Feature } = require('im/messenger/lib/feature');
	const { DialogHelper } = require('im/messenger/lib/helper');
	const { AnalyticsService } = require('im/messenger/provider/services/analytics');
	const { getLogger } = require('im/messenger/lib/logger');
	const { Color } = require('tokens');

	const {
		CopyAction,
		CopyLinkAction,
		MarkAction,
		PinAction,
		UnpinAction,
		ForwardAction,
		CreateAction,
		CreateEventAction,
		CreateTaskAction,
		ReplyAction,
		ProfileAction,
		EditAction,
		DeleteAction,
		DownloadToDeviceAction,
		DownloadToDiskAction,
		FeedbackAction,
		ResendAction,
		SubscribeAction,
		UnsubscribeAction,
		MultiSelectAction,
		FinishVoteAction,
		RevoteAction,
		OpenVoteResultAction,
		AskCopilotAction,
		MoreAction,
	} = require('im/messenger/controller/dialog/lib/message-menu/src/action');
	const { EntityManager } = require('im/messenger/controller/dialog/lib/entity-manager');
	const { MoreSection, MainSection, MainSubSection } = require('im/messenger/controller/dialog/lib/message-menu/src/section');
	const { MessageCreateMenu } = require('im/messenger/controller/dialog/lib/message-create-menu');
	const { MessageHelper } = require('im/messenger/lib/helper');
	const { MessageContextMenu } = require('im/messenger/api/dialog-integration/message/context-menu');
	const { fileSaver } = require('im/messenger/controller/dialog/lib/message-menu/src/saver/file-saver');
	const { diskSaver } = require('im/messenger/controller/dialog/lib/message-menu/src/saver/disk-saver');

	const logger = getLogger('dialog--message-menu');

	/**
	 * @class DialogMessageContextMenu
	 * @implements {IMessageContextMenu}
	 */
	class DialogMessageContextMenu extends MessageContextMenu
	{
		/**
		 * @type {number}
		 */
		maxPins = PinCount.max;

		/**
		 * @return {MessengerCoreStore}
		 */
		get store()
		{
			return serviceLocator.get('core').getStore();
		}

		/**
		 * @return {VoteManager}
		 */
		get voteManager()
		{
			return this.dialogLocator.get('vote-manager');
		}

		/**
		 * @param {DialogLocator} dialogLocator
		 */
		setDialogLocator(dialogLocator)
		{
			this.dialogLocator = dialogLocator;
		}

		/**
		 * @return {Array<MessageContextTreeSectionNode>}
		 */
		getOrderedActionTree(actionHelper)
		{
			return [
				{
					sectionId: MessageMenuSectionId.dialogMain,
					children: [
						MessageMenuActionType.reply,
						MessageMenuActionType.revote,
						MessageMenuActionType.openVoteResult,
						MessageMenuActionType.copy,
						MessageMenuActionType.edit,
						MessageMenuActionType.downloadToDevice,
						MessageMenuActionType.forward,
						MessageMenuActionType.askCopilot,
						MessageMenuActionType.createTask,
						MessageMenuActionType.finishVote,
						MessageMenuActionType.subscribe,
						MessageMenuActionType.unsubscribe,
						{
							sectionId: MessageMenuSectionId.dialogMore,
							nextMenuActionType: MessageMenuActionType.more,
							children: [
								MessageMenuActionType.pin,
								MessageMenuActionType.unpin,
								MessageMenuActionType.copyLink,
								MessageMenuActionType.mark,
								MessageMenuActionType.createEvent,
								MessageMenuActionType.downloadToDisk,
								MessageMenuActionType.profile,
							],
						},
					],
				},
				{
					sectionId: MessageMenuSectionId.dialogFooter,
					children: [
						MessageMenuActionType.delete,
						MessageMenuActionType.multiselect,
					],
				},
			];
		}

		/**
		 * @return {Array<MessageContextTreeSectionNode>}
		 */
		getOrderedErrorActionTree()
		{
			return [
				{
					sectionId: MessageMenuSectionId.dialogMain,
					children: [
						MessageMenuActionType.delete,
						MessageMenuActionType.resend,
					],
				},
			];
		}

		/**
		 * @return {Array<MessageContextTreeSectionNode>}
		 */
		getOrderedSendingActionTree()
		{
			return [
				{
					sectionId: MessageMenuSectionId.dialogMain,
					children: [
						MessageMenuActionType.copy,
					],
				},
			];
		}

		/**
		 * @return {Record<string, (MessageMenuView, IMessageMenuActionHelper, object) => void>}
		 */
		getActions()
		{
			return {
				[MessageMenuActionType.copy]: this.addCopyAction.bind(this),
				[MessageMenuActionType.copyLink]: this.addCopyLinkAction.bind(this),
				[MessageMenuActionType.mark]: this.addMarkAction.bind(this),
				[MessageMenuActionType.pin]: this.addPinAction.bind(this),
				[MessageMenuActionType.unpin]: this.addUnpinAction.bind(this),
				[MessageMenuActionType.subscribe]: this.addSubscribeAction.bind(this),
				[MessageMenuActionType.unsubscribe]: this.addUnsubscribeAction.bind(this),
				[MessageMenuActionType.forward]: this.addForwardAction.bind(this),
				[MessageMenuActionType.askCopilot]: this.addAskCopilotAction.bind(this),
				[MessageMenuActionType.create]: this.addCreateAction.bind(this),
				[MessageMenuActionType.createEvent]: this.addCreateEventAction.bind(this),
				[MessageMenuActionType.createTask]: this.addCreateTaskAction.bind(this),
				[MessageMenuActionType.reply]: this.addReplyAction.bind(this),
				[MessageMenuActionType.profile]: this.addProfileAction.bind(this),
				[MessageMenuActionType.edit]: this.addEditAction.bind(this),
				[MessageMenuActionType.delete]: this.addDeleteAction.bind(this),
				[MessageMenuActionType.downloadToDevice]: this.addDownloadToDeviceAction.bind(this),
				[MessageMenuActionType.downloadToDisk]: this.addDownloadToDiskAction.bind(this),
				[MessageMenuActionType.feedback]: this.addFeedbackAction.bind(this),
				[MessageMenuActionType.multiselect]: this.addMultiselectAction.bind(this),
				[MessageMenuActionType.resend]: this.addResendAction.bind(this),
				[MessageMenuActionType.finishVote]: this.addFinishVoteAction.bind(this),
				[MessageMenuActionType.revote]: this.addRevoteAction.bind(this),
				[MessageMenuActionType.openVoteResult]: this.addOpenVoteResultAction.bind(this),
				[MessageMenuActionType.more]: this.addNextMenuMoreAction.bind(this),
			};
		}

		/**
		 * @return {Record<string, (IMessageMenuActionHelper) => void>}
		 */
		getActionHandlers()
		{
			return {
				[MessageMenuActionType.copy]: this.onCopy.bind(this),
				[MessageMenuActionType.copyLink]: this.onCopyLink.bind(this),
				[MessageMenuActionType.reply]: this.onReply.bind(this),
				[MessageMenuActionType.mark]: this.onMark.bind(this),
				[MessageMenuActionType.pin]: this.onPin.bind(this),
				[MessageMenuActionType.unpin]: this.onUnpin.bind(this),
				[MessageMenuActionType.subscribe]: this.onSubscribe.bind(this),
				[MessageMenuActionType.unsubscribe]: this.onUnsubscribe.bind(this),
				[MessageMenuActionType.forward]: this.onForward.bind(this),
				[MessageMenuActionType.askCopilot]: this.onAskCopilot.bind(this),
				[MessageMenuActionType.create]: this.onCreate.bind(this),
				[MessageMenuActionType.createTask]: this.onCreateTask.bind(this),
				[MessageMenuActionType.createEvent]: this.onCreateEvent.bind(this),
				[MessageMenuActionType.profile]: this.onProfile.bind(this),
				[MessageMenuActionType.edit]: this.onEdit.bind(this),
				[MessageMenuActionType.delete]: this.onDelete.bind(this),
				[MessageMenuActionType.downloadToDevice]: this.onDownloadToDevice.bind(this),
				[MessageMenuActionType.downloadToDisk]: this.onDownloadToDisk.bind(this),
				[MessageMenuActionType.feedback]: this.onFeedback.bind(this),
				[MessageMenuActionType.multiselect]: this.onMultiSelect.bind(this),
				[MessageMenuActionType.resend]: this.onResend.bind(this),
				[MessageMenuActionType.finishVote]: this.onFinishVote.bind(this),
				[MessageMenuActionType.revote]: this.onRevote.bind(this),
				[MessageMenuActionType.openVoteResult]: this.onOpenVoteResult.bind(this),
				[MessageMenuActionType.goToMessage]: this.onGoToMessage.bind(this),
				[MessageMenuActionType.more]: this.onNextMenuMore.bind(this),
			};
		}

		/**
		 * @return {Record<string, MessageContextMenuSectionItem>}
		 */
		getSection()
		{
			return {
				[MessageMenuSectionId.dialogMain]: MainSection,
				[MessageMenuSectionId.dialogMore]: MoreSection,
				[MessageMenuSectionId.dialogFooter]: MainSubSection,
			};
		}

		/**
		 * @return {Record<string, MessageContextMenuSectionItem>}
		 */
		getErrorMenuSection()
		{
			return {
				[MessageMenuSectionId.dialogMain]: MainSection,
			};
		}

		/**
		 * @return {Record<string, MessageContextMenuSectionItem>}
		 */
		getSendingMenuSection()
		{
			return {
				[MessageMenuSectionId.dialogMain]: MainSection,
			};
		}

		/**
		 * @param {MessageMenuView} menu
		 * @param {MessageMenuActionHelper} actionHelper
		 * @param {object} [options]
		 */
		addCopyAction(menu, actionHelper, options = {})
		{
			if (actionHelper.isPossibleCopy())
			{
				menu.addAction(CopyAction, options);
			}
		}

		/**
		 * @param {MessageMenuView} menu
		 * @param {MessageMenuActionHelper} actionHelper
		 * @param {object} [options]
		 */
		addAskCopilotAction(menu, actionHelper, options = {})
		{
			if (actionHelper.isPossibleAskCopilot())
			{
				const action = AskCopilotAction;
				if (Feature.isBitrixGptV2Available)
				{
					action.styles.title.font.colorGradient = MessengerColor.copilotGradient;
					action.styles.icon.colorGradient = MessengerColor.copilotGradient;
				}

				menu.addAction(action, options);
			}
		}

		/**
		 * @param {MessageMenuView} menu
		 * @param {MessageMenuActionHelper} actionHelper
		 * @param {object} [options]
		 */
		addCopyLinkAction(menu, actionHelper, options = {})
		{
			if (actionHelper.isPossibleCopyLink())
			{
				menu.addAction(CopyLinkAction, options);
			}
		}

		/**
		 * @param {MessageMenuView} menu
		 * @param {MessageMenuActionHelper} actionHelper
		 * @param {object} [options]
		 */
		addMarkAction(menu, actionHelper, options = {})
		{
			if (actionHelper.isPossibleMark())
			{
				menu.addAction(MarkAction, options);
			}
		}

		/**
		 * @param {MessageMenuView} menu
		 * @param {MessageMenuActionHelper} actionHelper
		 * @param {object} [options]
		 */
		addPinAction(menu, actionHelper, options = {})
		{
			if (actionHelper.isPossiblePin())
			{
				menu.addAction(PinAction, options);
			}
		}

		/**
		 * @param {MessageMenuView} menu
		 * @param {MessageMenuActionHelper} actionHelper
		 * @param {object} [options]
		 */
		addUnpinAction(menu, actionHelper, options = {})
		{
			if (actionHelper.isPossibleUnpin())
			{
				menu.addAction(UnpinAction, options);
			}
		}

		/**
		 * @param {MessageMenuView} menu
		 * @param {MessageMenuActionHelper} actionHelper
		 * @param {object} [options]
		 */
		addSubscribeAction(menu, actionHelper, options = {})
		{
			if (actionHelper.isPossibleSubscribe())
			{
				menu.addAction(SubscribeAction, options);
			}
		}

		/**
		 * @param {MessageMenuView} menu
		 * @param {MessageMenuActionHelper} actionHelper
		 * @param {object} [options]
		 */
		addUnsubscribeAction(menu, actionHelper, options = {})
		{
			if (actionHelper.isPossibleUnsubscribe())
			{
				menu.addAction(UnsubscribeAction, options);
			}
		}

		/**
		 * @param {MessageMenuView} menu
		 * @param {MessageMenuActionHelper} actionHelper
		 * @param {object} [options]
		 */
		addForwardAction(menu, actionHelper, options = {})
		{
			if (actionHelper.isPossibleForward())
			{
				menu.addAction(ForwardAction, options);
			}
		}

		/**
		 * @param {MessageMenuView} menu
		 * @param {MessageMenuActionHelper} actionHelper
		 * @param {object} [options]
		 */
		addCreateAction(menu, actionHelper, options = {})
		{
			if (actionHelper.isPossibleCreate() && MessageCreateMenu.hasActions())
			{
				menu.addAction(CreateAction, options);
			}
		}

		/**
		 * @param {MessageMenuView} menu
		 * @param {MessageMenuActionHelper} actionHelper
		 * @param {object} [options]
		 */
		addCreateTaskAction(menu, actionHelper, options = {})
		{
			if (actionHelper.isPossibleTaskCreate())
			{
				menu.addAction(CreateTaskAction, options);
			}
		}

		/**
		 * @param {MessageMenuView} menu
		 * @param {MessageMenuActionHelper} actionHelper
		 * @param {object} [options]
		 */
		addCreateEventAction(menu, actionHelper, options = {})
		{
			if (actionHelper.isPossibleEventCreate())
			{
				menu.addAction(CreateEventAction, options);
			}
		}

		/**
		 * @param {MessageMenuView} menu
		 * @param {MessageMenuActionHelper} actionHelper
		 * @param {object} [options]
		 */
		addReplyAction(menu, actionHelper, options = {})
		{
			if (actionHelper.isPossibleReply())
			{
				menu.addAction(ReplyAction, options);
			}
		}

		/**
		 * @param {MessageMenuView} menu
		 * @param {MessageMenuActionHelper} actionHelper
		 * @param {object} [options]
		 */
		addProfileAction(menu, actionHelper, options = {})
		{
			if (actionHelper.isPossibleShowProfile())
			{
				menu.addAction(ProfileAction, options);
			}
		}

		/**
		 * @param {MessageMenuView} menu
		 * @param {MessageMenuActionHelper} actionHelper
		 * @param {object} [options]
		 */
		addEditAction(menu, actionHelper, options = {})
		{
			if (actionHelper.isPossibleEdit())
			{
				menu.addAction(EditAction, options);
			}
		}

		/**
		 * @param {MessageMenuView} menu
		 * @param {MessageMenuActionHelper} actionHelper
		 * @param {object} [options]
		 */
		addDeleteAction(menu, actionHelper, options = {})
		{
			if (actionHelper.isPossibleDelete() && actionHelper.isDialogCopilot() && menu.actions.length === 0)
			{
				menu.addAction(DeleteAction, options);

				return;
			}

			if (actionHelper.isPossibleDelete())
			{
				menu.addSeparator();
				menu.addAction(DeleteAction, options);
			}

			if (actionHelper.isPossibleMultiselect())
			{
				menu.addSeparator();
			}
		}

		/**
		 * @param {MessageMenuView} menu
		 * @param {MessageMenuActionHelper} actionHelper
		 * @param {object} [options]
		 */
		addDownloadToDeviceAction(menu, actionHelper, options = {})
		{
			if (actionHelper.isPossibleDownloadToDevice())
			{
				menu.addSeparator();
				menu.addAction(DownloadToDeviceAction, options);
			}
		}

		/**
		 * @param {MessageMenuView} menu
		 * @param {MessageMenuActionHelper} actionHelper
		 * @param {object} [options]
		 */
		addDownloadToDiskAction(menu, actionHelper, options = {})
		{
			if (actionHelper.isPossibleSaveFile())
			{
				menu.addAction(DownloadToDiskAction, options);
				menu.addSeparator();
			}
		}

		/**
		 * @param {MessageMenuView} menu
		 * @param {MessageMenuActionHelper} actionHelper
		 * @param {object} [options]
		 */
		addFeedbackAction(menu, actionHelper, options = {})
		{
			if (actionHelper.isPossibleCallFeedback())
			{
				menu.addAction(FeedbackAction, options);
			}
		}

		/**
		 * @param {MessageMenuView} menu
		 * @param {MessageMenuActionHelper} actionHelper
		 * @param {object} [options]
		 */
		addMultiselectAction(menu, actionHelper, options = {})
		{
			if (actionHelper.isPossibleMultiselect())
			{
				menu.addSeparator();
				menu.addAction(MultiSelectAction, options);
			}
		}

		/**
		 * @param {MessageMenuView} menu
		 * @param {MessageMenuActionHelper} actionHelper
		 * @param {object} [options]
		 */
		addResendAction(menu, actionHelper, options = {})
		{
			if (actionHelper.isPossibleResend())
			{
				menu.addAction(ResendAction, options);
			}
		}

		/**
		 * @param {MessageMenuView} menu
		 * @param {MessageMenuActionHelper} actionHelper
		 * @param {object} [options]
		 */
		addFinishVoteAction(menu, actionHelper, options = {})
		{
			if (actionHelper.isPossibleFinishVote())
			{
				menu.addAction(FinishVoteAction, options);
			}
		}

		/**
		 * @param {MessageMenuView} menu
		 * @param {MessageMenuActionHelper} actionHelper
		 * @param {object} [options]
		 */
		addRevoteAction(menu, actionHelper, options = {})
		{
			if (actionHelper.isPossibleRevote())
			{
				menu.addAction(RevoteAction, options);
			}
		}

		/**
		 * @param {MessageMenuView} menu
		 * @param {MessageMenuActionHelper} actionHelper
		 * @param {object} [options]
		 */
		addOpenVoteResultAction(menu, actionHelper, options = {})
		{
			if (actionHelper.isPossibleOpenVoteResult())
			{
				menu.addAction(OpenVoteResultAction, options);
			}
		}

		/**
		 * @param {MessageMenuView} menu
		 * @param {MessageMenuActionHelper} actionHelper
		 * @param {object} [options]
		 */
		addNextMenuMoreAction(menu, actionHelper, options = {})
		{
			menu.addAction(MoreAction, options);
		}

		/**
		 * @param {MessageMenuActionHelper} actionHelper
		 * @param {MessageMenuActionHandlerParams} params
		 */
		onCopy(actionHelper, params)
		{
			const modelMessage = this.#getMessageModel(actionHelper.messageModel.id);

			DialogTextHelper.copyToClipboard(
				modelMessage.text,
				{
					parentWidget: this.#getUiView(),
				},
			);

			const isNestedSection = this.isNestedSection(params.sectionId, actionHelper);
			AnalyticsService.getInstance().messageMenuAnalytics.sendMessageMenuCopyTap(
				actionHelper.messageModel.id,
				{
					dialogId: actionHelper.dialogModel.dialogId,
					isNestedSection,
					...params,
				},
			);
		}

		/**
		 * @param {MessageMenuActionHelper} actionHelper
		 * @param {MessageMenuActionHandlerParams} params
		 */
		onCopyLink(actionHelper, params)
		{
			const messageHelper = MessageHelper.createById(actionHelper.messageModel.id);

			const link = messageHelper?.getLinkToMessage();
			if (!Type.isStringFilled(link))
			{
				return;
			}

			DialogTextHelper.copyToClipboard(
				link,
				{
					notificationText: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_MESSAGE_MENU_COPY_LINK_SUCCESS'),
					notificationIcon: Icon.LINK,
					parentWidget: this.#getUiView(),
				},
				true,
			);

			const isNestedSection = this.isNestedSection(params.sectionId, actionHelper);
			if (messageHelper?.isVoteModelExist)
			{
				AnalyticsService.getInstance().sendVoteMessageLinkCopied(
					this.getDialog().dialogId,
					messageHelper.voteModel.voteId,
					isNestedSection,
				);

				return;
			}

			AnalyticsService.getInstance().messageMenuAnalytics.sendMessageMenuCommonTap(
				actionHelper.messageModel.id,
				{
					dialogId: actionHelper.dialogModel.dialogId,
					isNestedSection,
					...params,
				},
			);
		}

		/**
		 * @param {MessageMenuActionHelper} actionHelper
		 */
		onMark(actionHelper)
		{
			if (!isOnline())
			{
				Notification.showOfflineToast();

				return;
			}

			const messageModel = this.#getMessageModel(actionHelper.messageModel.id);
			if (!messageModel.id)
			{
				return;
			}

			this.dialogLocator.get('mark-service')?.markMessage(messageModel.id);
		}

		/**
		 * @param {MessageMenuActionHelper} actionHelper
		 * @param {MessageMenuActionHandlerParams} params
		 */
		onReply(actionHelper, params)
		{
			this.createReply(actionHelper);

			const isNestedSection = this.isNestedSection(params.sectionId, actionHelper);
			AnalyticsService.getInstance().messageMenuAnalytics.sendMessageMenuCommonTap(
				actionHelper.messageModel.id,
				{
					dialogId: actionHelper.dialogModel.dialogId,
					isNestedSection,
					...params,
				},
			);
		}

		/**
		 * @param {MessageMenuActionHelper} actionHelper
		 */
		createReply(actionHelper)
		{
			if (!isOnline())
			{
				Notification.showOfflineToast();

				return;
			}

			const replyManager = this.dialogLocator.get('reply-manager');
			const messageModel = actionHelper.messageModel;
			if (
				replyManager.isQuoteInProcess
				&& messageModel.id === replyManager.getQuoteMessage().id
			)
			{
				return;
			}

			const textFieldManager = this.dialogLocator.get('text-field-manager');
			if (textFieldManager?.isHide())
			{
				return;
			}

			replyManager.startQuotingMessage(messageModel);
		}

		/**
		 * @param {MessageMenuActionHelper} actionHelper
		 * @param {GoToMessageContextEvent} [params={}]
		 * @return {Promise<void>}
		 */
		onGoToMessage(actionHelper, params = {})
		{
			const messageId = actionHelper.messageModel?.id;
			if (!messageId || !this.#checkOnlineStatus())
			{
				return Promise.reject();
			}

			const dialogId = this.getDialog().dialogId;

			return this.dialogLocator.get('context-manager').goToMessageContext({
				dialogId,
				messageId,
				...params,
			});
		}

		/**
		 * @param {MessageMenuActionHelper} actionHelper
		 * @param {MessageMenuActionHandlerParams} params
		 */
		onPin(actionHelper, params)
		{
			const dialogId = this.#getDialogId();

			if (!isOnline())
			{
				Notification.showOfflineToast();

				return;
			}

			const messageModel = this.#getMessageModel(actionHelper.messageModel.id);
			if (!messageModel.id)
			{
				return;
			}

			if (this.#isPinsLimitReached(messageModel.chatId))
			{
				this.#showPinsLimitAlert();

				AnalyticsService.getInstance().sendPinnedMessageLimitException({ dialogId });

				return;
			}

			this.dialogLocator.get('message-service')
				.pinMessage(messageModel.id)
			;

			const isNestedSection = this.isNestedSection(params.sectionId, actionHelper);

			AnalyticsService.getInstance().sendMessagePin({
				dialogId,
				chatId: messageModel.chatId,
				isNestedSection,
			});
		}

		/**
		 * @param {MessageMenuActionHelper} actionHelper
		 * @param {MessageMenuActionHandlerParams} params
		 */
		onUnpin(actionHelper, params)
		{
			if (!isOnline())
			{
				Notification.showOfflineToast();

				return;
			}

			const messageModel = this.#getMessageModel(actionHelper.messageModel.id);
			if (!messageModel.id)
			{
				return;
			}

			this.dialogLocator.get('message-service')
				.unpinMessage(messageModel.id)
			;
			const isNestedSection = this.isNestedSection(params.sectionId, actionHelper);

			AnalyticsService.getInstance().sendMessageUnpin({
				dialogId: this.#getDialogId(),
				chatId: messageModel.chatId,
				isNestedSection,
				isContextMenu: true,
			});
		}

		onSubscribe(actionHelper)
		{
			if (!isOnline())
			{
				Notification.showOfflineToast();

				return;
			}

			Notification.showToast(ToastType.subscribeToComments, this.#getUiView());
			const modelMessage = this.#getMessageModel(actionHelper.messageModel.id);
			this.dialogLocator.get('chat-service').subscribeToCommentsByPostId(modelMessage.id);
		}

		onUnsubscribe(actionHelper)
		{
			if (!isOnline())
			{
				Notification.showOfflineToast();

				return;
			}

			Notification.showToast(ToastType.unsubscribeFromComments, this.#getUiView());
			const modelMessage = this.#getMessageModel(actionHelper.messageModel.id);
			this.dialogLocator.get('chat-service').unsubscribeFromCommentsByPostId(modelMessage.id);
		}

		/**
		 * @param {MessageMenuActionHelper} actionHelper
		 * @param {MessageMenuActionHandlerParams} params
		 * @return {Promise}
		 */
		onForward(actionHelper, params)
		{
			if (!isOnline())
			{
				Notification.showOfflineToast();

				return Promise.reject();
			}

			const { parentWidget, onItemSelected, closeOnSelect = true, sectionId = null, actionId = null } = params;

			const forwardSelector = new ForwardSelector({
				messageIds: [actionHelper.messageModel.id],
				fromDialogId: this.#getDialogId(),
				locator: this.dialogLocator,
				onDialogSelected: onItemSelected,
				closeOnSelect,
			});

			if (actionId && sectionId)
			{
				const isNestedSection = this.isNestedSection(sectionId, actionHelper);
				AnalyticsService.getInstance().messageMenuAnalytics.sendMessageMenuForwardTap(
					actionHelper.messageModel.id,
					{
						dialogId: actionHelper.dialogModel.dialogId,
						isNestedSection,
						actionId,
					},
				);
			}

			return forwardSelector.open({ parentWidget });
		}

		/**
		 * @param {MessageMenuActionHelper} actionHelper
		 * @param {MessageMenuActionHandlerParams} params
		 */
		onAskCopilot(actionHelper, params)
		{
			const copilot = this.store.getters['usersModel/getCopilotData']();
			if (Type.isNil(copilot))
			{
				return;
			}

			const isNestedSection = this.isNestedSection(params.sectionId, actionHelper);
			AnalyticsService.getInstance().messageMenuAnalytics.sendMessageMenuCommonTap(
				actionHelper.messageModel.id,
				{
					dialogId: actionHelper.dialogModel.dialogId,
					isNestedSection,
					...params,
				},
			);

			this.createReply(actionHelper);
			BX.postComponentEvent(EventType.dialog.external.mention, [copilot.id, BBCode.user, this.#getDialogId()]);
		}

		/**
		 * @param {MessageMenuActionHelper} actionHelper
		 * @param {MessageMenuActionHandlerParams} params
		 */
		onCreateEvent(actionHelper, params)
		{
			if (!isOnline())
			{
				Notification.showOfflineToast();

				return;
			}

			const messageModel = this.#getMessageModel(actionHelper.messageModel.id);
			if (!messageModel)
			{
				return;
			}

			const isNestedSection = this.isNestedSection(params.sectionId, actionHelper);
			AnalyticsService.getInstance().messageMenuAnalytics.sendMessageMenuCreateActionTap(
				messageModel.id,
				{
					dialogId: actionHelper.dialogModel.dialogId,
					isNestedSection,
					...params,
				},
			);

			try
			{
				const entityManager = new EntityManager(actionHelper.dialogModel.dialogId, this.store);

				entityManager.createMeeting(actionHelper.messageModel.id);
			}
			catch (error)
			{
				logger.log('onCreateEvent.createMeeting.catch:', error);
			}
		}

		/**
		 * @param {MessageMenuActionHelper} actionHelper
		 * @param {MessageMenuActionHandlerParams} params
		 */
		onCreateTask(actionHelper, params)
		{
			if (!isOnline())
			{
				Notification.showOfflineToast();

				return;
			}

			const messageModel = this.#getMessageModel(actionHelper.messageModel.id);
			if (!messageModel)
			{
				return;
			}

			const isNestedSection = this.isNestedSection(params.sectionId, actionHelper);
			AnalyticsService.getInstance().messageMenuAnalytics.sendMessageMenuCreateActionTap(
				messageModel.id,
				{
					dialogId: actionHelper.dialogModel.dialogId,
					isNestedSection,
					...params,
				},
			);

			try
			{
				const entityManager = new EntityManager(actionHelper.dialogModel.dialogId, this.store);

				entityManager.createTaskFomMessage(actionHelper.messageModel);
			}
			catch (error)
			{
				logger.log('onCreateTask.createTaskFomMessage.catch:', error);
			}
		}

		/**
		 * @param {MessageMenuActionHelper} actionHelper
		 * @param {MessageMenuActionHandlerParams} params
		 */
		onCreate(actionHelper, params)
		{
			if (!isOnline())
			{
				Notification.showOfflineToast();

				return;
			}

			const messageModel = this.#getMessageModel(actionHelper.messageModel.id);
			if (!messageModel)
			{
				return;
			}

			const isNestedSection = this.isNestedSection(params.sectionId, actionHelper);
			AnalyticsService.getInstance().messageMenuAnalytics.sendMessageMenuCommonTap(
				messageModel.id,
				{
					dialogId: actionHelper.dialogModel.dialogId,
					isNestedSection,
					...params,
				},
			);

			MessageCreateMenu.open(this.#getDialogId(), messageModel, this.store);
		}

		/**
		 * @param {MessageMenuActionHelper} actionHelper
		 */
		onProfile(actionHelper)
		{
			const messageModel = this.#getMessageModel(actionHelper.messageModel.id);
			if (!messageModel.id)
			{
				return;
			}

			UserProfile.show(messageModel.authorId, {
				backdrop: true,
				openingDialogId: this.#getDialogId(),
			});
		}

		/**
		 * @param {MessageMenuActionHelper} actionHelper
		 * @param {MessageMenuActionHandlerParams} params
		 */
		onEdit(actionHelper, params)
		{
			this.dialogLocator.get('reply-manager').startEditingMessage(actionHelper.messageModel);

			const isNestedSection = this.isNestedSection(params.sectionId, actionHelper);
			AnalyticsService.getInstance().messageMenuAnalytics.sendMessageMenuCommonTap(
				actionHelper.messageModel.id,
				{
					dialogId: actionHelper.dialogModel.dialogId,
					isNestedSection,
					...params,
				},
			);
		}

		/**
		 * @param {MessageMenuActionHelper} actionHelper
		 */
		onNextMenuMore(actionHelper)
		{
			logger.log('onNextMenuMore');
		}

		/**
		 * @param {MessageMenuActionHelper} actionHelper
		 * @param {MessageMenuActionHandlerParams} params
		 */
		onDelete(actionHelper, params)
		{
			if (!isOnline())
			{
				Notification.showOfflineToast();

				return;
			}

			const messageModel = this.#getMessageModel(actionHelper.messageModel.id);
			if (!messageModel.id)
			{
				return;
			}

			if (Type.isNumber(messageModel.id))
			{
				const isNestedSection = this.isNestedSection(params.sectionId, actionHelper);
				AnalyticsService.getInstance().sendMessageDeleteActionClicked({
					messageId: messageModel.id,
					dialogId: this.#getDialogId(),
					isNestedSection,
				});
			}

			const helper = DialogHelper.createByDialogId(this.#getDialogId());

			if (helper?.isChannel)
			{
				showDeleteChannelPostAlert({
					deleteCallback: () => {
						this.dialogLocator.get('message-service')
							.delete(messageModel, this.#getDialogId())
						;
					},
					cancelCallback: () => {
						if (Type.isNumber(messageModel.id))
						{
							AnalyticsService.getInstance().sendMessageDeletingCanceled({
								messageId: messageModel.id,
								dialogId: this.#getDialogId(),
							});
						}
					},
				});

				return;
			}

			this.dialogLocator.get('message-service')
				.delete(messageModel, this.#getDialogId())
			;

			this.#deleteQuotingMessage(actionHelper.messageModel.id);
		}

		/**
		 * @param {string} messageId
		 */
		#deleteQuotingMessage(messageId)
		{
			const isQuoteInProcess = this.dialogLocator.get('reply-manager')?.isQuoteInProcess;
			if (!isQuoteInProcess)
			{
				return;
			}

			const quoteMessage = this.dialogLocator.get('reply-manager').getQuoteMessage();
			if (quoteMessage?.id !== messageId)
			{
				return;
			}

			this.dialogLocator.get('reply-manager').finishQuotingMessage();
		}

		/**
		 * @param {MessageMenuActionHelper} actionHelper
		 * @param {MessageMenuActionHandlerParams} params
		 */
		async onDownloadToDevice(actionHelper, params)
		{
			const messageId = actionHelper.messageModel?.id;
			if (!messageId || !this.#checkOnlineStatus())
			{
				return;
			}

			const messageHelper = MessageHelper.createById(messageId);

			if (!messageHelper.isWithFile)
			{
				return;
			}

			const { parentWidget = null, sectionId = null } = params;

			const isNestedSection = this.isNestedSection(sectionId, actionHelper);

			void fileSaver({
				locator: this.dialogLocator,
				dialogId: this.#getDialogId(),
				messageHelper,
				parentWidget,
				isNestedSection,
			}).save();
		}

		/**
		 * @param {MessageMenuActionHelper} actionHelper
		 * @param {MessageMenuActionHandlerParams} params
		 */
		onDownloadToDisk(actionHelper, params)
		{
			const messageId = actionHelper.messageModel?.id;
			if (!messageId || !this.#checkOnlineStatus())
			{
				return;
			}

			const { parentWidget = null, sectionId = null } = params;

			const isNestedSection = this.isNestedSection(sectionId, actionHelper);
			void diskSaver({
				locator: this.dialogLocator,
				dialogId: this.#getDialogId(),
				messageHelper: MessageHelper.createById(messageId),
				parentWidget,
				isNestedSection,
			}).save();
		}

		/**
		 * @param {MessageMenuActionHelper} actionHelper
		 * @param {MessageMenuActionHandlerParams} params
		 */
		onFeedback(actionHelper, params)
		{
			let formId = 'copilotRoles';
			if (actionHelper.isAiAssistantMessage())
			{
				formId = 'aiAssistant';
			}

			const openFormFallback = () => {
				const hiddenFields = encodeURIComponent(JSON.stringify({
					from_domain: currentDomain,
					back_version: Application.getAppVersion(),
					os_phone: Application.getPlatform(),
					app_version: Application.getApiVersion(),
					region_model: env.languageId,
					phone_model: device.model,
					os_version: device.version,
				}));

				PageManager.openPage({
					backgroundColor: Color.bgSecondary.toHex(),
					url: `${env.siteDir}mobile/settings?formId=${formId}&hiddenFields=${hiddenFields}`,
					backdrop: {
						mediumPositionPercent: 80,
						onlyMediumPosition: true,
						forceDismissOnSwipeDown: true,
						swipeAllowed: true,
						swipeContentAllowed: true,
						horizontalSwipeAllowed: false,
						navigationBarColor: Color.bgSecondary.toHex(),
						enableNavigationBarBorder: false,
					},
					titleParams: {
						text: Loc.getMessage('FEEDBACK_FORM_TITLE'),
					},
					enableNavigationBarBorder: false,
					modal: true,
					cache: true,
				});
			};

			requireLazy('layout/ui/feedback-form-opener').then(({ FeedbackForm }) => {
				if (FeedbackForm)
				{
					(new FeedbackForm({
						formId,
						senderPage: 'MessageMenu',
					})).openInBackdrop();
				}
				else
				{
					openFormFallback();
				}
			}).catch(() => {
				openFormFallback();
			});

			const isNestedSection = this.isNestedSection(params.sectionId, actionHelper);
			AnalyticsService.getInstance().messageMenuAnalytics.sendMessageMenuFeedbackTap(
				actionHelper.messageModel.id,
				{
					dialogId: actionHelper.dialogModel.dialogId,
					isNestedSection,
					...params,
				},
			);
		}

		/**
		 * @param {MessageMenuActionHelper} actionHelper
		 * @param {MessageMenuActionHandlerParams} params
		 */
		onMultiSelect(actionHelper, params)
		{
			if (!isOnline())
			{
				Notification.showOfflineToast();

				return;
			}

			this.dialogLocator.get('select-manager')
				.enableMultiSelectMode(String(actionHelper.messageModel.id))
				.catch((error) => logger.error(
					`${this.constructor.name}.onMultiSelect(${String(actionHelper.messageModel.id)}).enableMultiSelectMode catch:`,
					error,
				))
			;

			const isNestedSection = this.isNestedSection(params.sectionId, actionHelper);
			AnalyticsService.getInstance().messageMenuAnalytics.sendMessageMenuCommonTap(
				actionHelper.messageModel.id,
				{
					dialogId: actionHelper.dialogModel.dialogId,
					isNestedSection,
					...params,
				},
			);
		}

		/**
		 * @param {MessageMenuActionHelper} actionHelper
		 */
		onResend(actionHelper)
		{
			MessengerEmitter.emit(EventType.dialog.external.resend, {
				index: null,
				message: actionHelper.messageModel,
			});
		}

		/**
		 * @param {MessageMenuActionHelper} actionHelper
		 * @param {MessageMenuActionHandlerParams} params
		 */
		onFinishVote(actionHelper, params)
		{
			if (!isOnline())
			{
				Notification.showOfflineToast();

				return;
			}

			const messageModel = this.store.getters['messagesModel/getById'](actionHelper.messageModel.id);
			if (!messageModel.id)
			{
				return;
			}

			const isNestedSection = this.isNestedSection(params.sectionId, actionHelper);

			confirmDestructiveAction({
				title: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_MESSAGE_MENU_FINISH_VOTE_CONFIRM_TITLE'),
				description: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_MESSAGE_MENU_FINISH_VOTE_CONFIRM_DESCRIPTION'),
				destructionText: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_MESSAGE_MENU_FINISH_VOTE_CONFIRM_FINISH'),
				onDestruct: () => this.voteManager?.finishVote(messageModel.id, isNestedSection),
			});
		}

		/**
		 * @param {MessageMenuActionHelper} actionHelper
		 * @param {MessageMenuActionHandlerParams} params
		 */
		onRevote(actionHelper, params)
		{
			if (!isOnline())
			{
				Notification.showOfflineToast();

				return;
			}

			const messageModel = this.store.getters['messagesModel/getById'](actionHelper.messageModel.id);
			if (!messageModel.id)
			{
				return;
			}
			const isNestedSection = this.isNestedSection(params.sectionId, actionHelper);

			void this.voteManager?.revote(messageModel.id, isNestedSection);
		}

		/**
		 * @param {MessageMenuActionHelper} actionHelper
		 */
		onOpenVoteResult(actionHelper)
		{
			if (!isOnline())
			{
				Notification.showOfflineToast();

				return;
			}

			const messageModel = this.store.getters['messagesModel/getById'](actionHelper.messageModel.id);
			if (!messageModel.id)
			{
				return;
			}

			void this.voteManager?.openVoteResult(messageModel.id);
		}

		/**
		 * @param {number} chatId
		 * @returns {boolean}
		 */
		#isPinsLimitReached(chatId)
		{
			const pinsCounter = this.store.getters['messagesModel/pinModel/getPinsCounter'](chatId);

			return pinsCounter >= this.maxPins;
		}

		#showPinsLimitAlert()
		{
			Alert.alert(
				Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_MESSAGE_MENU_PIN_LIMIT_ALERT_TITLE', {
					'#MAX_PINS#': this.maxPins,
				}),
				'',
				null,
				Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_MESSAGE_MENU_PIN_LIMIT_ALERT_BUTTON_NAME'),
			);
		}

		/**
		 * @param {MessageId} messageId
		 * @returns {MessagesModelState|{}}
		 */
		#getMessageModel(messageId)
		{
			return this.store.getters['messagesModel/getById'](messageId);
		}

		/**
		 * @param {MessageId} messageId
		 * @returns {Array<FilesModelState>}
		 */
		#getFilesModel(messageId)
		{
			return this.store.getters['messagesModel/getMessageFiles'](messageId);
		}

		#checkOnlineStatus()
		{
			if (!isOnline())
			{
				Notification.showOfflineToast();

				return false;
			}

			return true;
		}

		#getUiView()
		{
			return this.dialogLocator.get('view').ui;
		}

		/**
		 * @returns {DialogId}
		 */
		#getDialogId()
		{
			return this.getDialog().dialogId;
		}

		/**
		 * @param {string|null} sectionId
		 * @param {IMessageMenuActionHelper} actionHelper
		 * @returns {boolean}
		 */
		isNestedSection(sectionId, actionHelper)
		{
			if (!sectionId)
			{
				return false;
			}

			const firstLevelSections = this.getOrderedActionTree(actionHelper)
				.map((sectionNode) => sectionNode.sectionId);

			return !firstLevelSections.includes(sectionId);
		}
	}

	module.exports = {
		DialogMessageContextMenu,
	};
});
