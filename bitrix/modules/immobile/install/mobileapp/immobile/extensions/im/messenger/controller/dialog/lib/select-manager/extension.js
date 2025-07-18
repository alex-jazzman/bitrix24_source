/**
 * @module im/messenger/controller/dialog/lib/select-manager
 */
jn.define('im/messenger/controller/dialog/lib/select-manager', (require, exports, module) => {
	const { Loc } = require('loc');
	const { Haptics } = require('haptics');
	const { isEqual } = require('utils/object');
	const { Color } = require('tokens');
	const { ForwardSelector } = require('im/messenger/controller/selector/forward');
	const { LoggerManager } = require('im/messenger/lib/logger');
	const { DialogHelper, MessageHelper } = require('im/messenger/lib/helper');
	const { MessengerParams } = require('im/messenger/lib/params');
	const { Notification, ToastType } = require('im/messenger/lib/ui/notification');
	const { EventType, EventFilterType } = require('im/messenger/const');
	const { showDeleteChannelPostsAlert, showDeleteMessagesAlert } = require('im/messenger/lib/ui/alert');

	const logger = LoggerManager.getInstance().getLogger('dialog--select-manager');

	const ButtonId = Object.freeze({
		forward: 'forward',
		delete: 'delete',
	});

	const ButtonIconName = Object.freeze({
		forward: 'forward',
	});

	const ButtonHeight = Object.freeze({
		L: 'L',
	});

	const ButtonDesignType = Object.freeze({
		outlineAccent1: 'outline-accent-1',
		outline: 'outline',
		outlineNoAccent: 'outline-no-accent',
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
			this.updateRightHeaderButton();
			this.restoreLeftHeaderButton();
			await this.actionPanelHide(animated);
			this.viewUpdateRestrictions({ longTap: true, reaction: true, quote: true });
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
			forwardSelector.open();
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
			this.#isButtonDeleteAvailable = true;
			for (const id of this.#selectedMessageIdList)
			{
				const messageHelper = MessageHelper.createById(id);
				if (!messageHelper.isYour)
				{
					this.#isButtonDeleteAvailable = false;
					break;
				}

				if (messageHelper.isDeleted)
				{
					this.#isButtonDeleteAvailable = false;
					break;
				}
			}
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

			return this.view.actionPanelShow(this.getActionPanelTitle(), this.#actionPanelButtons);
		}

		/**
		 * @param {boolean} animated
		 */
		actionPanelHide(animated)
		{
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
			this.checkDeleteButtonAvailable();

			const disabledForwardButton = (this.#selectedMessageIdList.length === 0 || !this.#isButtonForwardAvailable);
			const disabledDeleteButton = (this.#selectedMessageIdList.length === 0 || !this.#isButtonDeleteAvailable);
			const customStyleDeleteButton = disabledDeleteButton
				? {}
				: { borderColor: Color.accentMainAlert.toHex() };

			return [
				{
					id: ButtonId.delete,
					text: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_SELECT_MANAGER_DELETE_BUTTON'),
					height: ButtonHeight.L,
					design: ButtonDesignType.outline,
					disabled: disabledDeleteButton,
					customStyle: customStyleDeleteButton,
				},
				{
					id: ButtonId.forward,
					rightIconName: ButtonIconName.forward,
					text: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_SELECT_MANAGER_FORWARD_BUTTON'),
					height: ButtonHeight.L,
					design: ButtonDesignType.outlineAccent1,
					disabled: disabledForwardButton,
				},
			];
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
