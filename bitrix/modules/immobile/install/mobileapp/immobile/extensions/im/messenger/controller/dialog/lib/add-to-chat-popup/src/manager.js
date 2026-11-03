/**
 * @module im/messenger/controller/dialog/lib/add-to-chat-popup/manager
 */
jn.define('im/messenger/controller/dialog/lib/add-to-chat-popup/manager', (require, exports, module) => {
	const { Type } = require('type');
	const { showToast } = require('toast');
	const { Color } = require('tokens');
	const { Icon } = require('assets/icons');
	const { AhaMoment } = require('ui-system/popups/aha-moment');

	const { Loc } = require('im/messenger/loc');
	const { Feature } = require('im/messenger/lib/feature');
	const { DialogHelper } = require('im/messenger/lib/helper');
	const { ChatService } = require('im/messenger/provider/services/chat');
	const { AnalyticsService } = require('im/messenger/provider/services/analytics');
	const { ProjectAccessGuard } = require('im/messenger/lib/project-access-guard');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { getLogger } = require('im/messenger/lib/logger');

	const logger = getLogger('dialog--add-to-chat-popup-manager');

	const POPUP_TEST_ID = 'dialog-add-to-chat-popup';

	// the attach button registers itself under this spotlight id, same target as the chat onboarding hints
	const SPOTLIGHT_TARGET_ID = 'attachButton';

	// The native instance cannot be created synchronously inside the tap callback: createSpotlight()
	// returns falsy there. Leaving the callback is all it takes, so the wait is kept short — until
	// the popup is on screen, any keystroke drops the candidate, and the earliest keystroke after a
	// tap was measured on the simulator at ~183ms. At the previous 300ms the popup was cancelled
	// before it ever appeared.
	const SHOW_DELAY = 50;

	// If the short wait turns out not to be enough on some device, the creation is retried once at
	// the delay other spotlight consumers use (100–500ms), instead of losing the popup entirely.
	const SHOW_RETRY_DELAY = 300;

	/**
	 * @class AddToChatPopupManager
	 */
	class AddToChatPopupManager
	{
		/** @type {boolean} */
		#initialized = false;

		/** @type {DialogId|null} */
		#dialogId = null;

		/** @type {(() => void)|null} */
		#onClose = null;

		/** @type {AhaMomentController|null} */
		#controller = null;

		/**
		 * Bumped by every dismissal, so a callback of a popup that has already been taken
		 * down is recognised — a failed show must not be retried for a stale candidate.
		 *
		 * @type {number}
		 */
		#showToken = 0;

		/** @type {string|number|null} */
		candidateId = null;

		/** @type {boolean} */
		isAdding = false;

		/**
		 * @param {{ dialogId: DialogId }} options
		 */
		constructor({ dialogId })
		{
			if (!Feature.isAddToChatPopupAvailable)
			{
				return;
			}

			this.#dialogId = dialogId;
			this.#initialized = true;

			logger.log(`${this.constructor.name} init: `, this.#dialogId);
		}

		/**
		 * @return {boolean}
		 */
		get isInitialized()
		{
			return this.#initialized;
		}

		/**
		 * @param {(() => void)|null} onClose
		 */
		setOnClose(onClose)
		{
			this.#onClose = onClose;
		}

		unsubscribeViewEvents()
		{
			if (!this.isInitialized)
			{
				return;
			}

			this.#dismissPopup();
		}

		/**
		 * @param {string|number} candidateId
		 */
		show(candidateId)
		{
			if (!this.isInitialized)
			{
				return;
			}

			// One-way on purpose, hence skipShownCheck below: an aha-moment opened later still
			// lands on top of this popup.
			if (AhaMoment.isShown)
			{
				logger.log(`${this.constructor.name}.show: skipped, an aha-moment is on screen`);

				return;
			}

			this.#dismissPopup();

			this.candidateId = candidateId;
			this.isAdding = false;

			this.#showPopup(candidateId, SHOW_DELAY, this.#showToken);
		}

		/**
		 * A dismissal takes the pending show down with it, so a candidate that goes stale while
		 * the popup is still being scheduled never reaches the screen — retry included.
		 *
		 * @param {string|number} candidateId
		 * @param {number} delay
		 * @param {number} showToken
		 * @param {boolean} [isRetry=false]
		 */
		#showPopup(candidateId, delay, showToken, isRetry = false)
		{
			const userName = this.#getUserName(candidateId);

			this.#controller = AhaMoment.show({
				testId: POPUP_TEST_ID,
				targetRef: SPOTLIGHT_TARGET_ID,
				delay,
				disableHideByOutsideClick: false,
				// the popup is not an aha-moment: it must not keep a real one from appearing over it
				skipShownCheck: true,
				// the popup stays up while the user is being added, and closes on success
				closeOnClick: false,
				description: Loc.getMessage(this.#descriptionPhraseCode, { '#NAME#': userName }),
				buttonText: Loc.getMessage(this.#buttonPhraseCode),
				buttonIcon: Icon.ADD_PERSON,
				buttonStretched: false,
				closeButton: true,
				onClick: () => {
					void this.handleButtonTap();
				},
				onClose: () => {
					this.hide();
				},
				onHide: () => {
					this.#handlePopupHide();
				},
				onShowSkipped: (error) => {
					this.#handleShowSkipped(candidateId, showToken, isRetry, error);
				},
			});

			logger.log(`${this.constructor.name}.show candidate: ${candidateId}`);
		}

		/**
		 * @param {string|number} candidateId
		 * @param {number} showToken
		 * @param {boolean} isRetry
		 * @param {Error} error
		 */
		#handleShowSkipped(candidateId, showToken, isRetry, error)
		{
			if (isRetry || showToken !== this.#showToken)
			{
				logger.error(`${this.constructor.name}.show: unable to create spotlight`, error);

				return;
			}

			this.#showPopup(candidateId, SHOW_RETRY_DELAY, showToken, true);
		}

		/**
		 * @param {boolean} [isAnimated=true]
		 */
		hide(isAnimated = true)
		{
			this.candidateId = null;
			this.isAdding = false;

			this.#dismissPopup();

			this.#onClose?.();
		}

		async handleButtonTap()
		{
			if (this.isAdding || Type.isNil(this.candidateId))
			{
				return;
			}

			const userId = this.candidateId;
			this.isAdding = true;

			AnalyticsService.getInstance().sendAddParticipantFromPopup(this.#dialogId);

			try
			{
				const isAdded = await this.addUser(userId);
				if (!isAdded)
				{
					this.isAdding = false;

					return;
				}

				this.notifyUserAddSuccess();
				this.hide();
			}
			catch (error)
			{
				logger.error(`${this.constructor.name}.handleButtonTap error: `, error);

				this.isAdding = false;
				this.notifyUserAddRetryableError(() => {
					void this.handleButtonTap();
				});
			}
		}

		/**
		 * @param {string|number} userId
		 * @return {Promise<boolean>}
		 */
		async addUser(userId)
		{
			const dialog = this.#store.getters['dialoguesModel/getById'](this.#dialogId);
			if (!dialog)
			{
				return Promise.reject(new Error(`${this.constructor.name}.addUser: unknown dialog`));
			}

			const dialogHelper = DialogHelper.createByModel(dialog);
			if (dialogHelper?.inheritsParentChatMembership)
			{
				const parentChatId = dialog.parentChatId ?? 0;
				const canAdd = await ProjectAccessGuard.canAddUsersToProjectChildChat(parentChatId, [Number(userId)]);
				if (!canAdd)
				{
					return false;
				}
			}

			const chatSettings = Application.storage.getObject('settings.chat', { historyShow: true });
			const chatService = new ChatService();

			await chatService.addToChat(dialog.chatId, [userId], chatSettings.historyShow);

			logger.log(`${this.constructor.name}.addUser: ${userId} added to chat ${dialog.chatId}`);

			return true;
		}

		notifyUserAddSuccess()
		{
			showToast({
				message: this.#getUserAddSuccessText(),
				icon: Icon.CHECK,
				time: 3,
			});
		}

		/**
		 * @param {() => void} onRetry
		 */
		notifyUserAddRetryableError(onRetry)
		{
			showToast({
				message: this.#getUserAddErrorText(),
				backgroundColor: Color.accentMainAlert.toHex(),
				messageTextColor: Color.baseWhiteFixed.toHex(),
				buttonTextColor: Color.baseWhiteFixed.toHex(),
				shouldCloseOnTap: false,
				buttonText: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_ADD_TO_TASK_POPUP_ADD_RETRY'),
				onButtonTap: onRetry,
			});
		}

		#dismissPopup()
		{
			this.#showToken += 1;

			if (!this.#controller)
			{
				return;
			}

			const controller = this.#controller;
			this.#controller = null;
			controller.hide();
		}

		/**
		 * The popup closed on its own — an outside click, or the very hide() this manager asked
		 * for. Dropping the controller before hiding it is what tells the two apart.
		 */
		#handlePopupHide()
		{
			if (!this.#controller)
			{
				return;
			}

			this.hide();
		}

		/**
		 * @return {MessengerCoreStore}
		 */
		get #store()
		{
			return serviceLocator.get('core').getStore();
		}

		/**
		 * @return {boolean}
		 */
		get #isTaskComment()
		{
			return Boolean(DialogHelper.createByDialogId(this.#dialogId)?.isTaskComment);
		}

		/**
		 * @return {string}
		 */
		get #descriptionPhraseCode()
		{
			return this.#isTaskComment
				? 'IMMOBILE_MESSENGER_DIALOG_ADD_TO_TASK_POPUP_TEXT'
				: 'IMMOBILE_MESSENGER_DIALOG_ADD_TO_CHAT_POPUP_TEXT';
		}

		/**
		 * @return {string}
		 */
		get #buttonPhraseCode()
		{
			return this.#isTaskComment
				? 'IMMOBILE_MESSENGER_DIALOG_MENTION_POPUP_ADD_USER_TO_TASK'
				: 'IMMOBILE_MESSENGER_DIALOG_MENTION_POPUP_ADD_USER';
		}

		/**
		 * @param {string|number} userId
		 * @return {string}
		 */
		#getUserName(userId)
		{
			const user = this.#store.getters['usersModel/getById'](userId);
			if (!user)
			{
				return '';
			}

			return Type.isStringFilled(user.name)
				? user.name
				: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
		}

		/**
		 * @return {string}
		 */
		#getUserAddErrorText()
		{
			return this.#isTaskComment
				? Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_ADD_TO_TASK_POPUP_USER_ADD_ERROR')
				: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_ADD_TO_TASK_POPUP_USER_ADD_ERROR_CHAT');
		}

		/**
		 * @return {string}
		 */
		#getUserAddSuccessText()
		{
			return this.#isTaskComment
				? Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_ADD_TO_TASK_POPUP_USER_ADD_SUCCESS')
				: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_ADD_TO_CHAT_POPUP_USER_ADD_SUCCESS');
		}
	}

	module.exports = { AddToChatPopupManager };
});
