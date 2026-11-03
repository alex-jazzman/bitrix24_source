/**
 * @module im/messenger/controller/dialog/lib/select-manager
 */
jn.define('im/messenger/controller/dialog/lib/select-manager', (require, exports, module) => {
	const { Type } = require('type');
	const { PerfPoint } = require('debug/prism');
	const { Color } = require('tokens');
	const { Loc } = require('im/messenger/loc');
	const { Haptics } = require('haptics');
	const { isOnline } = require('device/connection');
	const { isEqual } = require('utils/object');
	const { Icon } = require('assets/icons');
	const { ForwardSelector } = require('im/messenger/controller/selector/forward');
	const { Feature } = require('im/messenger/lib/feature');
	const { LoggerManager } = require('im/messenger/lib/logger');
	const { DialogHelper, MessageHelper } = require('im/messenger/lib/helper');
	const { MessengerParams } = require('im/messenger/lib/params');
	const { Notification, ToastType } = require('im/messenger/lib/ui/notification');
	const { EventType, EventFilterType, ErrorType } = require('im/messenger/const');
	const { showDeleteChannelPostsAlert, showDeleteMessagesAlert } = require('im/messenger/lib/ui/alert');
	const { ChatPermission } = require('im/messenger/lib/permission-manager');
	const { AiTaskRest } = require('im/messenger/provider/rest');
	const { AnalyticsService } = require('im/messenger/provider/services/analytics');
	const { AiTaskIndicationManager } = require('im/messenger/controller/dialog/lib/ai-task-indication-manager');

	const logger = LoggerManager.getInstance().getLogger('dialog--select-manager');

	const ButtonId = Object.freeze({
		forward: 'forward',
		delete: 'delete',
		createAiTask: 'createAiTask',
		more: 'more',
	});

	const ButtonIconName = Object.freeze({
		forward: 'forward',
		more: 'more',
	});

	const ButtonHeight = Object.freeze({
		L: 'L',
	});

	const ButtonDesignType = Object.freeze({
		outlineAccent1: 'outline-accent-1',
		outline: 'outline',
		outlineNoAccent: 'outline-no-accent',
		outlineBitrixGpt: 'outline-bitrix-gpt',
	});

	/**
	 * @class SelectManager
	 */
	class SelectManager
	{
		/** @type {Array<string>} */
		#selectedMessageIdList = [];
		#isButtonForwardAvailable = true;
		#isButtonDeleteAvailable = true;
		/** @type {Array<ActionPanelButton|null>} */
		#actionPanelButtons = [];
		/** @type {number} */
		#selectLimit = MessengerParams.getMultipleActionMessageLimit();
		/** @type {MessagesModelState} */
		#savedQuoteMessage = null;

		/**
		 * @desc Whether a creation request of this selection is in flight. The selection mode stays open
		 * until the request answers, so without the flag a second tap sends a second request - and the
		 * second task gets no indication at all, because the manager drops a start while an operation of
		 * the dialog is still running.
		 * @type {boolean}
		 */
		#isAiTaskCreationInProgress = false;

		/**
		 * @constructor
		 * @param {DialogLocator} dialogLocator
		 * @param {DialogId} dialogId
		 */
		constructor(dialogLocator, dialogId)
		{
			/** @type {DialogLocator} */
			this.locator = dialogLocator;
			/** @type {DialogId} */
			this.dialogId = dialogId;
			/** @type {DialogView} */
			this.view = this.locator.get('view');
			/** @type {MessengerCoreStore} */
			this.store = this.locator.get('store');

			this.bindMethods();
		}

		/**
		 * @return {ReplyManager}
		 */
		get replyManager()
		{
			return this.locator.get('reply-manager');
		}

		/**
		 * @return {HeaderButtonsController}
		 */
		get headerButtons()
		{
			return this.locator.get('header-buttons');
		}

		bindMethods()
		{
			this.onTapCancelMultipleSelectHeaderButton = this.onTapCancelMultipleSelectHeaderButton.bind(this);
			this.onMessageSelected = this.onMessageSelected.bind(this);
			this.onMessageUnselected = this.onMessageUnselected.bind(this);
			this.onMaxCountExceeded = this.onMaxCountExceeded.bind(this);
			this.onButtonTap = this.onButtonTap.bind(this);
			this.onDisabledButtonTap = this.onDisabledButtonTap.bind(this);
			this.onDeleteMessages = this.onDeleteMessages.bind(this);
			this.onForwardMessages = this.onForwardMessages.bind(this);
			this.onMoreButtonTap = this.onMoreButtonTap.bind(this);
		}

		/**
		 * @param {string} actionSelectMessageId
		 */
		async enableMultiSelectMode(actionSelectMessageId)
		{
			logger.log(`${this.constructor.name}.enableMultiSelectMode`);
			await this.checkQuoteInProcess();
			await this.checkForwardInProcess();
			this.activateSelectEventFilter();
			this.setSelectedMessageIdList([actionSelectMessageId]);
			this.subscribeView();
			await this.viewEnableSelectMessagesMode();
			await this.selectMessages([actionSelectMessageId]);
			this.renderRightHeaderCancelMultipleButton();
			await this.removeLeftHeaderButton();
			this.setSelectLimit();
			this.viewUpdateRestrictions({ longTap: false, reaction: false, quote: false });
			await this.actionPanelShow();

			Haptics.impactMedium();
		}

		async disableSelectMessagesMode(animated = false)
		{
			logger.log(`${this.constructor.name}.disableSelectMessagesMode`);
			this.restoreQuoteMessageProcess();
			this.deactivateSelectEventFilter();
			await this.viewDisableSelectMessagesMode(animated);
			await this.actionPanelHide(animated);
			this.viewUpdateRestrictions({ longTap: true, reaction: true, quote: true });
			this.updateRightHeaderButton();
			this.restoreLeftHeaderButton();
			this.unsubscribeView();
		}

		subscribeView()
		{
			this.view.selector.on(EventType.dialog.multiSelect.maxCountExceeded, this.onMaxCountExceeded);
			this.view.selector.on(EventType.dialog.multiSelect.selected, this.onMessageSelected);
			this.view.selector.on(EventType.dialog.multiSelect.unselected, this.onMessageUnselected);
			this.view.actionPanel.on(EventType.dialog.actionPanel.buttonTap, this.onButtonTap);
			this.view.actionPanel.on(EventType.dialog.actionPanel.disabledButtonTap, this.onDisabledButtonTap);
		}

		unsubscribeView()
		{
			this.view.selector.off(EventType.dialog.multiSelect.maxCountExceeded, this.onMaxCountExceeded);
			this.view.selector.off(EventType.dialog.multiSelect.selected, this.onMessageSelected);
			this.view.selector.off(EventType.dialog.multiSelect.unselected, this.onMessageUnselected);
			this.view.actionPanel.off(EventType.dialog.actionPanel.buttonTap, this.onButtonTap);
		}

		async onTapCancelMultipleSelectHeaderButton()
		{
			logger.log(`${this.constructor.name}.onTapCancelMultipleSelectHeaderButton`);
			await this.disableSelectMessagesMode(true);
		}

		/**
		 * @param {string} messageId
		 * @param {Array<string>} allSelectedMessages
		 */
		async onMessageUnselected(messageId, allSelectedMessages)
		{
			logger.log(`${this.constructor.name}.onMessageUnselected`, messageId, allSelectedMessages);
			this.setSelectedMessageIdList(this.#selectedMessageIdList.filter((id) => id !== messageId));
			await this.updateActionPanelTitle();
			await this.updateActionPanelButton();
		}

		/**
		 * @param {string} messageId
		 * @param {Array<string>} allSelectedMessages
		 */
		async onMessageSelected(messageId, allSelectedMessages)
		{
			logger.log(`${this.constructor.name}.onMessageSelected`, messageId, allSelectedMessages);
			if (this.#selectedMessageIdList.length >= this.#selectLimit)
			{
				Notification.showToast(ToastType.selectMessageLimit);

				return;
			}

			this.#selectedMessageIdList.push(messageId);
			this.setSelectedMessageIdList([...new Set(this.#selectedMessageIdList)]);
			await this.updateActionPanelTitle();
			await this.updateActionPanelButton();
		}

		onMaxCountExceeded()
		{
			logger.log(`${this.constructor.name}.onMaxCountExceeded`, this.#selectLimit);
			Notification.showToast(ToastType.selectMessageLimit);
		}

		/**
		 * @param {string} buttonId
		 */
		onButtonTap(buttonId)
		{
			if (this.#selectedMessageIdList.length === 0)
			{
				return false;
			}

			logger.log(`${this.constructor.name}.onButtonTap id:`, buttonId);
			switch (buttonId)
			{
				case ButtonId.forward: return this.onForwardMessages();
				case ButtonId.delete: return this.onDeleteMessages();
				case ButtonId.createAiTask: return this.onCreateAiTask();
				case ButtonId.more: return this.onMoreButtonTap();
				default: return false;
			}
		}

		/**
		 * @param {string} buttonId
		 */
		onDisabledButtonTap(buttonId)
		{
			logger.log(`${this.constructor.name}.onDisabledButtonTap id:`, buttonId);
			switch (buttonId)
			{
				case ButtonId.forward: return this.showUnavailableForwardActionToast();
				case ButtonId.delete: return this.showUnavailableDeleteActionToast();
				default: return false;
			}
		}

		async onForwardMessages()
		{
			const forwardSelector = new ForwardSelector({
				messageIds: this.#selectedMessageIdList,
				fromDialogId: this.dialogId,
				locator: this.locator,
				onDialogSelected: async () => {
					await this.disableSelectMessagesMode(true);
				},
			});

			await forwardSelector.open({ parentWidget: PageManager });
		}

		onDeleteMessages()
		{
			const deleteCallback = async () => {
				await this.disableSelectMessagesMode(true);
				this.locator.get('message-service')
					.deleteByIdList(this.#selectedMessageIdList, this.dialogId)
				;
			};

			const helper = DialogHelper.createByDialogId(this.dialogId);
			if (helper?.isChannel)
			{
				showDeleteChannelPostsAlert({ deleteCallback });

				return;
			}

			showDeleteMessagesAlert({ deleteCallback });
		}

		async onCreateAiTask()
		{
			if (!isOnline())
			{
				Notification.showOfflineToast();

				return;
			}

			const messageIds = this.#selectedMessageIdList
				.map((id) => Number(id))
				.filter((id) => Number.isInteger(id));

			if (messageIds.length === 0)
			{
				logger.error(`${this.constructor.name}.onCreateAiTask: no numeric message ids in selection`);

				return;
			}

			// anchor -- max message id of the request, single invariant with web to correlate the autoTaskStatus pull
			const anchor = Math.max(...messageIds);

			if (this.#isAiTaskCreationInProgress)
			{
				logger.log(`${this.constructor.name}.onCreateAiTask: creation in progress, skip`, anchor);

				return;
			}

			if (AiTaskIndicationManager.isOperationRunning(this.locator, anchor))
			{
				logger.log(`${this.constructor.name}.onCreateAiTask: indication active for anchor, skip`, anchor);

				return;
			}

			logger.log(`${this.constructor.name}.onCreateAiTask, messages:`, messageIds, 'anchor:', anchor);

			// Started at the tap and closed on the frame: three waits stand between the two here, and
			// leaving the selection mode is one of them - hence a sub-point of its own for each.
			const point = new PerfPoint('IM AI Task Create', `selection ${messageIds.length}`).start();

			AnalyticsService.getInstance().multiselectPanel.sendCreateAiTaskTap(this.dialogId);

			this.#isAiTaskCreationInProgress = true;

			try
			{
				point.startPoint('Server Create');
				await AiTaskRest.createByMessageList({ messageIds });
				point.endPoint('Server Create', { status: 'success', itemsCount: messageIds.length });

				// The set of the operation is taken above, before the mode is left: leaving it drops the
				// selection. The mode is left before the indication is raised, so that nothing on the way
				// to the first frame can strand the dialog in the selection mode with the task created.
				point.startPoint('Leave Select Mode');
				try
				{
					await this.disableSelectMessagesMode(true);
					point.endPoint('Leave Select Mode');
				}
				catch (error)
				{
					// The task is already on the server, so a native call that failed on the way out of the
					// mode may neither be told as a refusal of the creation nor hold back the indication.
					point.endPoint('Leave Select Mode', { status: 'error' });
					logger.error(`${this.constructor.name}.onCreateAiTask: leaving the select mode:`, error);
				}

				point.startPoint('Indication Start');
				this.#showAiTaskIndication(anchor, messageIds);
				point.endPoint('Indication Start');
			}
			catch (errors)
			{
				// Whichever of the two was open is closed as failed; endPoint of a closed key is a no-op.
				point.endPoint('Server Create', { status: 'error' });
				point.endPoint('Indication Start', { status: 'error' });

				logger.error(`${this.constructor.name}.onCreateAiTask.catch:`, errors);
				this.#showAiTaskRefusal(errors);
			}
			finally
			{
				this.#isAiTaskCreationInProgress = false;
				point.end();
			}
		}

		/**
		 * @desc Tells the refusals the user can act on apart from everything else. A slot already
		 * taken by an operation over the same messages is a state of the chat rather than a failure of
		 * the tap, so it gets a plain toast instead of the red one.
		 * @param {Array<{code: string}>} errors
		 */
		#showAiTaskRefusal(errors)
		{
			const codes = Array.isArray(errors) ? errors.map((error) => error?.code) : [];

			// The transport stamps NETWORK_ERROR for any rejection with no parsed body -- a lost
			// network, a timeout, a gateway page, the 401 of a closed guest session. Only the
			// connection status tells the offline case apart from those, so both are checked here.
			if (codes.includes(ErrorType.networkError) && !isOnline())
			{
				Notification.showOfflineToast();

				return;
			}

			if (codes.includes(ErrorType.aiTask.creationInProgress))
			{
				Notification.showToastWithParams({
					message: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_SELECT_MANAGER_AI_TASK_ALREADY_CREATING'),
				});

				return;
			}

			if (codes.includes(ErrorType.aiTask.sourceNotSupported))
			{
				Notification.showErrorToast({
					message: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_SELECT_MANAGER_AI_TASK_SOURCE_NOT_SUPPORTED'),
				});

				return;
			}

			Notification.showErrorToast();
		}

		/**
		 * @param {number} anchor -- max message id of the request, correlates the operation with the pull
		 * @param {Array<number>} messageIds -- every message the task is built from
		 */
		#showAiTaskIndication(anchor, messageIds)
		{
			const isRaised = AiTaskIndicationManager.startOnAvailableTrack(this.locator, {
				anchor,
				messageIds,
			});

			if (!isRaised)
			{
				logger.log(`${this.constructor.name}.showAiTaskIndication: the build has no track, skip`, anchor);
			}
		}

		onMoreButtonTap()
		{
			logger.log(`${this.constructor.name}.onMoreButtonTap`);

			this.checkDeleteButtonAvailable();

			const items = [
				{
					id: ButtonId.delete,
					title: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_SELECT_MANAGER_DELETE_BUTTON'),
					iconName: Icon.TRASHCAN.getIconName(),
					sectionCode: 'actions',
					disable: !this.#isButtonDeleteAvailable,
					styles: {
						title: {
							font: {
								color: Color.accentMainAlert.toHex(),
							},
						},
						icon: {
							color: Color.accentMainAlert.toHex(),
						},
					},
				},
			];

			const sections = [{ id: 'actions' }];

			const menu = dialogs.createPopupMenu();
			menu.setData(items, sections, (event, item) => {
				if (event === 'onItemSelected')
				{
					this.#handleMoreMenuItemSelected(item.id);
				}
			});
			menu.setTarget(ButtonId.more);
			menu.show();
		}

		/**
		 * @param {string} itemId
		 */
		#handleMoreMenuItemSelected(itemId)
		{
			switch (itemId)
			{
				case ButtonId.delete:
					this.onDeleteMessages();
					break;
				default:
					break;
			}
		}

		showUnavailableForwardActionToast()
		{
			Notification.showNotifier({
				title: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_SELECT_MANAGER_FORWARD_BUTTON_UNAVAILABLE_ACTION_NOTIFIER'),
			});
		}

		showUnavailableDeleteActionToast()
		{
			if (this.#selectedMessageIdList.length === 0)
			{
				return;
			}

			Notification.showNotifier({
				title: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_SELECT_MANAGER_DELETE_BUTTON_UNAVAILABLE_ACTION_NOTIFIER'),
			});
		}

		activateSelectEventFilter()
		{
			this.view.eventFilter.activateEventFilter(EventFilterType.selectMessagesMode);
		}

		deactivateSelectEventFilter()
		{
			this.view.eventFilter.deactivateEventFilter(EventFilterType.selectMessagesMode);
		}

		async checkQuoteInProcess()
		{
			if (this.replyManager.isQuoteInProcess)
			{
				this.#savedQuoteMessage = this.replyManager.getQuoteMessage();
				await this.replyManager.finishQuotingMessage();
			}
		}

		async checkForwardInProcess()
		{
			if (this.replyManager.isForwardInProcess)
			{
				await this.replyManager.finishForwardingMessage();
			}
		}

		restoreQuoteMessageProcess()
		{
			if (this.#savedQuoteMessage)
			{
				this.replyManager.startQuotingMessage(this.#savedQuoteMessage, false);

				this.#savedQuoteMessage = null;
			}
		}

		/**
		 * @param {Array<string>|[]} [value=[]]
		 */
		setSelectedMessageIdList(value = [])
		{
			this.#selectedMessageIdList = value;
		}

		checkForwardButtonAvailable()
		{
			this.#isButtonForwardAvailable = (
				!this.#selectedMessageIdList.some((messageId) => MessageHelper.createById(messageId)?.isVote)
			);
		}

		checkDeleteButtonAvailable()
		{
			const dialogHelper = DialogHelper.createByDialogId(this.dialogId);
			if (Type.isNull(dialogHelper))
			{
				return;
			}

			const dialogModel = dialogHelper.dialogModel;
			const canDeleteOtherMessage = ChatPermission.canDeleteOtherMessage(dialogModel);
			const canDeleteOwnMessage = ChatPermission.canDeleteOwnMessage(dialogModel);
			const selectedMessageIdsAllowedDelete = this.#selectedMessageIdList.filter((id) => {
				const messageHelper = MessageHelper.createById(id);

				if (messageHelper.isYour)
				{
					if (messageHelper.isDeleted)
					{
						return false;
					}

					return canDeleteOwnMessage;
				}

				return canDeleteOtherMessage;
			});

			this.#isButtonDeleteAvailable = selectedMessageIdsAllowedDelete.length === this.#selectedMessageIdList.length;
		}

		/**
		 * @param {Array<string>} messageIds
		 */
		selectMessages(messageIds)
		{
			return this.view.selectMessages(messageIds);
		}

		/**
		 * @param {Array<string>} messageIds
		 */
		unselectMessages(messageIds)
		{
			return this.view.unselectMessages(messageIds);
		}

		setSelectLimit()
		{
			this.view.setSelectMaxCount(this.#selectLimit);
		}

		/**
		 * @param {ChatRestrictionsParams} restrictions
		 */
		viewUpdateRestrictions(restrictions)
		{
			return this.view.updateRestrictions(restrictions);
		}

		viewEnableSelectMessagesMode()
		{
			return this.view.enableSelectMessagesMode();
		}

		/**
		 * @param {boolean} animated
		 */
		viewDisableSelectMessagesMode(animated)
		{
			return this.view.disableSelectMessagesMode(animated);
		}

		actionPanelShow()
		{
			this.#actionPanelButtons = this.getButtons();

			return this.view.actionPanelShow(
				this.getActionPanelTitle(),
				this.#actionPanelButtons,
				this.#getMoreButton(),
			);
		}

		/**
		 * @param {boolean} animated
		 */
		async actionPanelHide(animated)
		{
			// The "more" button has to go before the panel does: hiding the panel is what makes the
			// native side lose the reference to that button while its view stays in the container.
			await this.view.actionPanelHideMoreButton();

			return this.view.actionPanelHide(animated);
		}

		updateActionPanelTitle()
		{
			return this.view.setActionPanelTitle(this.getActionPanelTitle());
		}

		/**
		 * @param {number} [count=this.#selectedMessageIdList.length]
		 * @return {object}
		 */
		getActionPanelTitle(count = this.#selectedMessageIdList.length)
		{
			const title = count > 0
				? Loc.getMessage(
					'IMMOBILE_MESSENGER_DIALOG_SELECT_MANAGER_ACTION_PANEL_COUNT',
					{
						'#COUNT#': count,
					},
				)
				: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_SELECT_MANAGER_ACTION_PANEL_EMPTY_COUNT')
			;

			return {
				text: title,
			};
		}

		/**
		 * @return {Promise}
		 */
		updateActionPanelButton()
		{
			const newButtons = this.getButtons();
			const oldButtons = this.#actionPanelButtons;
			if (!isEqual(oldButtons, newButtons))
			{
				this.#actionPanelButtons = newButtons;

				return this.view.setActionPanelButtons(this.#actionPanelButtons);
			}

			return Promise.resolve(false);
		}

		/**
		 * @return {Promise}
		 */
		setActionPanelButtons()
		{
			this.#actionPanelButtons = this.getButtons();

			return this.view.setActionPanelButtons(this.#actionPanelButtons);
		}

		renderRightHeaderCancelMultipleButton()
		{
			this.headerButtons.renderCancelMultipleButton(this.onTapCancelMultipleSelectHeaderButton);
		}

		updateRightHeaderButton()
		{
			this.headerButtons.render();
		}

		removeLeftHeaderButton()
		{
			this.view.setLeftButtons([]);
		}

		restoreLeftHeaderButton()
		{
			this.view.setLeftButtons([{
				id: 'back',
				type: 'back',
				callback: () => this.view.back(),
			}]);
		}

		/**
		 * @return {Array<ActionPanelButton>}
		 */
		getButtons()
		{
			this.checkForwardButtonAvailable();

			if (!this.#isAiTaskActionPanelAvailable())
			{
				this.checkDeleteButtonAvailable();

				return [
					this.#buildDeleteButton(),
					this.#buildForwardButton(),
				];
			}

			return [
				this.#buildCreateAiTaskButton(),
				this.#buildForwardButton(),
			];
		}

		/**
		 * @return {?ActionPanelButton}
		 */
		#getMoreButton()
		{
			if (!this.#isAiTaskActionPanelAvailable())
			{
				return null;
			}

			return this.#buildMoreButton();
		}

		/**
		 * @return {boolean}
		 */
		#isAiTaskActionPanelAvailable()
		{
			return (
				Feature.isAiTaskCreationFromMessagesEntryPointAvailable
				&& Feature.isChatActionPanelMoreSupported
			);
		}

		/**
		 * @return {ActionPanelButton}
		 */
		#buildForwardButton()
		{
			const disabled = (this.#selectedMessageIdList.length === 0 || !this.#isButtonForwardAvailable);

			return {
				id: ButtonId.forward,
				rightIconName: ButtonIconName.forward,
				text: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_SELECT_MANAGER_FORWARD_BUTTON'),
				height: ButtonHeight.L,
				design: ButtonDesignType.outlineAccent1,
				disabled,
			};
		}

		/**
		 * @return {ActionPanelButton}
		 */
		#buildDeleteButton()
		{
			const disabled = (this.#selectedMessageIdList.length === 0 || !this.#isButtonDeleteAvailable);
			const customStyle = disabled
				? {}
				: { borderColor: Color.accentMainAlert.toHex() };

			return {
				id: ButtonId.delete,
				text: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_SELECT_MANAGER_DELETE_BUTTON'),
				height: ButtonHeight.L,
				design: ButtonDesignType.outline,
				disabled,
				customStyle,
			};
		}

		/**
		 * @return {ActionPanelButton}
		 */
		#buildCreateAiTaskButton()
		{
			return {
				id: ButtonId.createAiTask,
				text: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_SELECT_MANAGER_CREATE_AI_TASK_BUTTON_MSGVER_1'),
				height: ButtonHeight.L,
				design: ButtonDesignType.outlineBitrixGpt,
				disabled: this.#selectedMessageIdList.length === 0,
			};
		}

		/**
		 * @return {ActionPanelButton}
		 */
		#buildMoreButton()
		{
			return {
				id: ButtonId.more,
				iconName: ButtonIconName.more,
				height: ButtonHeight.L,
				design: ButtonDesignType.outline,
				viewId: ButtonId.more,
				disabled: false,
			};
		}

		/**
		 * @return {boolean}
		 */
		isSelectMessagesModeEnabled()
		{
			return this.view.selector.getSelectEnable();
		}
	}

	module.exports = { SelectManager };
});
