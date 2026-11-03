/**
 * @module im/messenger/controller/dialog/copilot/component/mention/manager
 */
jn.define('im/messenger/controller/dialog/copilot/component/mention/manager', (require, exports, module) => {
	const { MentionManager } = require('im/messenger/controller/dialog/lib/mention');
	const { CopilotMentionProvider } = require('im/messenger/controller/dialog/copilot/component/mention/provider');
	const { EventType, DialogType } = require('im/messenger/const');
	const { DialogHelper } = require('im/messenger/lib/helper');
	const { getLogger } = require('im/messenger/lib/logger');
	const logger = getLogger('mention');

	/**
	 * @class CopilotMentionManager
	 */
	class CopilotMentionManager extends MentionManager
	{
		#mentionRequestId = 0;

		#pendingFocusRequestId = 0;

		#pendingExplicitRequestId = 0;

		#pendingExplicitCursorPosition = null;

		#participantsLoadPromise = null;

		bindMethods()
		{
			super.bindMethods();
			this.onFocusInput = this.onFocusInput.bind(this);
			this.onBlurInput = this.onBlurInput.bind(this);
		}

		/**
		 * @override
		 */
		initProvider()
		{
			this.provider = new CopilotMentionProvider(this.getProviderOptions());
		}

		/**
		 * @return {object}
		 */
		getProviderOptions()
		{
			return {
				dialogId: this.dialogId,
				chatId: this.chatId,
				canAddParticipants: this.canAddParticipants,
				filter: {
					dialogTypes: [
						DialogType.private,
						DialogType.user,
					],
				},
				loadSearchProcessed: (dialogIdList, isStartServerSearch) => {
					if (isStartServerSearch)
					{
						if (!this.isLoading)
						{
							logger.log('Mention: show loader');
							this.showLoader();
						}

						this.drawItems(dialogIdList);

						return;
					}

					if (this.isLoading)
					{
						logger.log('Mention: hide local loader');
						this.hideLoader();
					}

					this.drawItems(dialogIdList);
				},
				loadSearchComplete: (dialogIdList, query) => {
					if (query !== this.curruntQuery)
					{
						return;
					}

					if (this.isLoading)
					{
						logger.log('Mention: hide server loader');
						this.hideLoader();
					}
					this.drawItems(dialogIdList);
				},
			};
		}

		/**
		 * @override
		 */
		subscribeEvents()
		{
			BX.addCustomEvent(EventType.dialog.external.mention, this.externalMention);

			if (!this.canUse())
			{
				return;
			}

			this.view.textField.on(EventType.dialog.textField.changeState, this.changeTextStateHandler);
			this.view.textField.on(EventType.dialog.textField.focus, this.onFocusInput);
			this.view.textField.on(EventType.dialog.textField.blur, this.onBlurInput);
			this.view.mentionPanel.on(EventType.dialog.mentionPanel.itemTap, this.mentionItemSelectedHandler);
			this.view.mentionPanel.on(EventType.dialog.mentionPanel.actionTap, this.mentionItemActionTapHandler);
		}

		/**
		 * @override
		 */
		unsubscribeEvents()
		{
			if (this.#hasPendingExplicitRequest())
			{
				this.finishMentioning();
			}
			else
			{
				this.#cancelMentionRequests();
			}

			BX.removeCustomEvent(EventType.dialog.external.mention, this.externalMention);

			if (!this.canUse())
			{
				return;
			}

			this.view.textField.off(EventType.dialog.textField.changeState, this.changeTextStateHandler);
			this.view.textField.off(EventType.dialog.textField.focus, this.onFocusInput);
			this.view.textField.off(EventType.dialog.textField.blur, this.onBlurInput);
			this.view.mentionPanel.off(EventType.dialog.mentionPanel.itemTap, this.mentionItemSelectedHandler);
			this.view.mentionPanel.off(EventType.dialog.mentionPanel.actionTap, this.mentionItemActionTapHandler);
		}

		/**
		 * @override
		 * @param {Array<string>} itemIds
		 */
		drawItems(itemIds)
		{
			const result = itemIds.map((itemId) => this.prepareItemForDrawing(itemId));
			if (this.isProcessed)
			{
				this.view.mentionPanel.setItems(result);
			}
			else
			{
				this.view.mentionPanel.open(result);

				this.isProcessed = true;
			}
		}

		/**
		 * @private
		 */
		async onFocusInput()
		{
			logger.log(`${this.constructor.name}.onFocusInput`);
			const cursorIndex = this.view.textField.getCursorIndex();
			if (!this.#canOpenMentionOnFocus(cursorIndex))
			{
				return;
			}

			const requestId = this.#claimMentionRequest();
			this.#pendingFocusRequestId = requestId;
			this.mentionSymbolPosition = cursorIndex;
			this.lastQuerySymbolPosition = cursorIndex;
			this.focusIndexPosition = 0;
			const userIdList = await this.#loadParticipants();

			const currentCursorIndex = this.view.textField.getCursorIndex();
			if (requestId !== this.#mentionRequestId || !this.#canOpenMentionOnFocus(currentCursorIndex))
			{
				if (requestId === this.#pendingFocusRequestId)
				{
					this.#resetFocusRequestState();
				}

				return;
			}

			this.#pendingFocusRequestId = 0;
			this.mentionSymbolPosition = currentCursorIndex;
			this.lastQuerySymbolPosition = currentCursorIndex;
			this.focusIndexPosition = 0;
			this.drawParticipantsItems(userIdList);
		}

		isHasInputText()
		{
			return this.view.textField.getText().length;
		}

		/**
		 * @private
		 * @param {string} text
		 * @param {string} inputCharacters
		 * @param {number} cursorPosition
		 */
		onChangeText(text, inputCharacters, cursorPosition)
		{
			this.processTextChangeSideEffects(text);

			const shouldOpenExplicitMention = !this.isMentionProcessed
				&& this.checkToOpen(text, inputCharacters, cursorPosition)
			;

			this.#cancelFocusRequest();
			if (shouldOpenExplicitMention)
			{
				void this.#openExplicitMention(cursorPosition);

				return;
			}

			if (this.#hasPendingExplicitRequest())
			{
				if (this.checkToClose(text, inputCharacters, cursorPosition))
				{
					this.finishMentioning();

					return;
				}

				this.#pendingExplicitCursorPosition = cursorPosition;

				return;
			}

			this.processMentionTextChange(text, inputCharacters, cursorPosition);
		}

		/**
		 * @private
		 */
		async onBlurInput()
		{
			logger.log(`${this.constructor.name}.onBlurInput`);
			this.finishMentioning();
		}

		/**
		 * @override
		 */
		finishMentioning()
		{
			this.#cancelMentionRequests();
			super.finishMentioning();
		}

		/**
		 * @private
		 * @return {number}
		 */
		#claimMentionRequest()
		{
			this.#mentionRequestId += 1;

			return this.#mentionRequestId;
		}

		/**
		 * @private
		 */
		#cancelFocusRequest()
		{
			if (!this.#hasPendingFocusRequest())
			{
				return;
			}

			this.#claimMentionRequest();
			this.#resetFocusRequestState();
		}

		/**
		 * @private
		 */
		#resetFocusRequestState()
		{
			this.#pendingFocusRequestId = 0;
			this.mentionSymbolPosition = null;
			this.lastQuerySymbolPosition = null;
			this.recoverFocusIndexPosition();
		}

		/**
		 * @private
		 */
		#cancelMentionRequests()
		{
			this.#claimMentionRequest();
			this.#resetFocusRequestState();
			this.#pendingExplicitRequestId = 0;
			this.#pendingExplicitCursorPosition = null;
		}

		/**
		 * @private
		 * @return {boolean}
		 */
		#hasPendingFocusRequest()
		{
			return this.#pendingFocusRequestId > 0;
		}

		/**
		 * @private
		 * @return {boolean}
		 */
		#hasPendingExplicitRequest()
		{
			return this.#pendingExplicitRequestId > 0;
		}

		/**
		 * @private
		 * @param {number} cursorIndex
		 * @return {boolean}
		 */
		#canOpenMentionOnFocus(cursorIndex)
		{
			if (this.isMentionProcessed || this.isHasInputText())
			{
				return false;
			}

			if (!this.#isMultiUserCopilotDialog())
			{
				return false;
			}

			return this.#isCursorIndexValid(cursorIndex);
		}

		/**
		 * @private
		 * @return {boolean}
		 */
		#isMultiUserCopilotDialog()
		{
			const dialog = this.getStore().getters['dialoguesModel/getById'](this.dialogId);

			return dialog?.type === DialogType.copilot && dialog?.userCounter > 2;
		}

		/**
		 * @private
		 * @param {number} cursorIndex
		 * @return {boolean}
		 */
		#isCursorIndexValid(cursorIndex)
		{
			const textLength = this.view.textField.getText().length;

			return Number.isInteger(cursorIndex)
				&& cursorIndex >= 0
				&& cursorIndex <= textLength
			;
		}

		/**
		 * @private
		 * @return {Promise<Array<string>>|Array<string>}
		 */
		#loadParticipants()
		{
			if (!DialogHelper.isDialogId(this.dialogId))
			{
				return this.getRecentUsers();
			}

			if (this.#participantsLoadPromise)
			{
				return this.#participantsLoadPromise;
			}

			const participantsLoadPromise = Promise.resolve(this.provider.loadChatParticipants())
				.finally(() => {
					if (this.#participantsLoadPromise === participantsLoadPromise)
					{
						this.#participantsLoadPromise = null;
					}
				})
			;
			this.#participantsLoadPromise = participantsLoadPromise;

			return participantsLoadPromise;
		}

		/**
		 * @private
		 * @param {number} cursorPosition
		 */
		async #openExplicitMention(cursorPosition)
		{
			if (!this.chatId)
			{
				return;
			}

			const requestId = this.#claimMentionRequest();
			const mentionSymbolPosition = cursorPosition - 1;
			const mentionSymbol = this.view.textField.getText()[mentionSymbolPosition];
			this.#pendingExplicitRequestId = requestId;
			this.#pendingExplicitCursorPosition = cursorPosition;
			this.mentionSymbolPosition = mentionSymbolPosition;
			this.lastQuerySymbolPosition = null;
			this.focusIndexPosition = 1;
			this.provider.setOptionConfig(this.chatId);
			void this.initialUsersMembership();
			this.openMentionLoadingPanel();

			const userIdList = await this.#loadParticipants();
			const currentText = this.view.textField.getText();
			const currentCursorPosition = this.#pendingExplicitCursorPosition;
			if (
				requestId !== this.#mentionRequestId
				|| requestId !== this.#pendingExplicitRequestId
			)
			{
				return;
			}

			if (
				this.mentionSymbolPosition !== mentionSymbolPosition
				|| currentText[mentionSymbolPosition] !== mentionSymbol
				|| !this.#isPendingExplicitRangeValid(currentText, currentCursorPosition, mentionSymbolPosition)
			)
			{
				this.finishMentioning();

				return;
			}

			this.#pendingExplicitRequestId = 0;
			this.#pendingExplicitCursorPosition = null;
			const query = currentText.slice(mentionSymbolPosition + 1, currentCursorPosition);
			if (query.length > 0)
			{
				this.continueMentionSearch(currentText, currentCursorPosition);

				return;
			}

			this.drawParticipantsItems(userIdList);
		}

		/**
		 * @private
		 * @param {string} text
		 * @param {number} cursorPosition
		 * @param {number} mentionSymbolPosition
		 * @return {boolean}
		 */
		#isPendingExplicitRangeValid(text, cursorPosition, mentionSymbolPosition)
		{
			if (!this.#isCursorIndexValid(cursorPosition) || cursorPosition <= mentionSymbolPosition)
			{
				return false;
			}

			const query = text.slice(mentionSymbolPosition + 1, cursorPosition);

			return !query.includes(' ') && !query.includes('\n');
		}

		/**
		 * @override
		 * @return {Array<string>}
		 */
		getRecentUsers()
		{
			return [];
		}

		/**
		 * @param {Array<string>} userIdList
		 * @override
		 * @void
		 */
		drawParticipantsItems(userIdList)
		{
			const result = this.getFixedItems();

			userIdList.forEach((itemId) => {
				const item = this.prepareItemForDrawing(itemId);

				result.push(item);
			});

			logger.log(`${this.constructor.name}.drawParticipantsItems:`, result);

			this.view.mentionPanel.setItems(result);
			this.hideLoader();
			if (!this.isProcessed)
			{
				this.view.mentionPanel.open(result);
			}

			this.isProcessed = true;
		}
	}

	module.exports = { CopilotMentionManager };
});
