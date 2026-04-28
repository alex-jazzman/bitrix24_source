/**
 * @module im/messenger/controller/dialog/lib/mention/manager
 */
jn.define('im/messenger/controller/dialog/lib/mention/manager', (require, exports, module) => {
	const { Icon } = require('assets/icons');
	const { isOnline } = require('device/connection');
	const { ChatService } = require('im/messenger/provider/services/chat');
	const { AnalyticsService } = require('im/messenger/provider/services/analytics');
	const { callMethod } = require('im/messenger/lib/rest');
	const { MessengerEmitter } = require('im/messenger/lib/emitter');
	const { MentionProvider } = require('im/messenger/controller/dialog/lib/mention/provider');
	const { Loc } = require('im/messenger/loc');
	const { Feature } = require('im/messenger/lib/feature');
	const { ChatAvatar } = require('im/messenger/lib/element/chat-avatar');
	const { ChatTitle } = require('im/messenger/lib/element/chat-title');
	const { ChatPermission } = require('im/messenger/lib/permission-manager');
	const {
		EventType,
		BBCode,
		BBCodeEntity,
		DialogType,
		RestMethod,
	} = require('im/messenger/const');
	const { DialogHelper } = require('im/messenger/lib/helper');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { DateFormatter } = require('im/messenger/lib/date-formatter');
	const { getLogger } = require('im/messenger/lib/logger');
	const { Type } = require('type');

	const MENTION_SYMBOL = new Set(['@', '+']);
	const CLOSE_MENTION_SYMBOLS = new Set([' ', '\n']);
	const MENTION_PREFIX = new Set([' ', '\n']);

	const logger = getLogger('mention');

	const ButtonDesignType = Object.freeze({
		primary: 'primary',
		success: 'success',
		alert: 'alert',
		grey: 'grey',
		black: 'black',
		disabledAlike: 'disabled-alike',
	});

	const ButtonDesignMode = Object.freeze({
		solid: 'solid',
		outline: 'outline',
		tinted: 'tinted',
	});

	const ButtonDesignSize = Object.freeze({
		S: 'S',
		M: 'M',
		L: 'L',
	});

	const ACTION_MENU_SECTION_ID_GENERAL = 'general';

	class MentionManager
	{
		/**
		 * @param {DialogView} view
		 * @param dialogId
		 */
		constructor({ view, dialogId })
		{
			/**
			 * @private
			 * @type {DialogView}
			 */
			this.view = view;

			this.dialogId = dialogId;
			/**
			 * @private
			 * @type {MentionProvider || null}
			 */
			this.provider = null;
			/**
			 * @private
			 * @type {boolean}
			 */
			this.isProcessed = false;
			/**
			 * @private
			 * @type {string}
			 */
			this.curruntQuery = '';
			/**
			 * @private
			 * @type {boolean}
			 */
			this.isLoading = false;
			/**
			 * @private
			 * @type {number || null}
			 */
			this.mentionSymbolPosition = null;
			/**
			 * @private
			 * @type {number || null}
			 */
			this.lastQuerySymbolPosition = null;

			/**
			 * @private
			 * @type {number}
			 */
			this.focusIndexPosition = 1;

			/**
			 * @private
			 * @type {boolean}
			 */
			this.isDialogShow = true;

			/**
			 * @private
			 * @type {Array<{id: string|number, type: string}>}
			 */
			this.externalMentionQueue = [];
			this.bindMethods();
			this.initProvider();
			this.subscribeEvents();
			this.subscribeStoreEvents();
		}

		bindMethods()
		{
			/**
			 * @private
			 * @type {function}
			 */
			this.changeTextStateHandler = this.onChangeText.bind(this);
			/**
			 * @private
			 * @type {function}
			 */
			this.mentionItemSelectedHandler = this.onMentionItemSelected.bind(this);
			/**
			 * @private
			 * @type {function}
			 */
			this.externalMention = this.onExternalMention.bind(this);
		}

		/**
		 * @public
		 */
		subscribeEvents()
		{
			BX.addCustomEvent(EventType.dialog.external.mention, this.externalMention);

			if (!this.canUse())
			{
				return;
			}
			this.view.textField.on(EventType.dialog.textField.changeState, this.changeTextStateHandler);
			this.view.mentionPanel.on(EventType.dialog.mentionPanel.itemTap, this.mentionItemSelectedHandler);
			this.view.mentionPanel.on(EventType.dialog.mentionPanel.actionTap, this.mentionItemActionTapHandler);
		}

		subscribeStoreEvents()
		{
			serviceLocator.get('core').getStoreManager()
				.on('dialoguesModel/update', this.#onUpdateParticipants)
			;
		}

		unsubscribeStoreEvents()
		{
			serviceLocator.get('core').getStoreManager()
				.off('dialoguesModel/update', this.#onUpdateParticipants)
			;
		}

		/**
		 * @public
		 */
		unsubscribeEvents()
		{
			BX.removeCustomEvent(EventType.dialog.external.mention, this.externalMention);

			if (!this.canUse())
			{
				return;
			}
			this.view.textField.off(EventType.dialog.textField.changeState, this.changeTextStateHandler);
			this.view.mentionPanel.off(EventType.dialog.mentionPanel.itemTap, this.mentionItemSelectedHandler);
			this.view.mentionPanel.off(EventType.dialog.mentionPanel.actionTap, this.mentionItemActionTapHandler);
		}

		/**
		 * @return {MessengerCoreStore}
		 */
		get #store()
		{
			return serviceLocator.get('core').getStore();
		}

		/**
		 * @return {number}
		 */
		get chatId()
		{
			return this.#getChatIdByDialogId(this.dialogId);
		}

		/**
		 * @return {number}
		 */
		get currentUserId()
		{
			return serviceLocator.get('core').getUserId();
		}

		/**
		 * @public
		 * @return {boolean}
		 */
		get isMentionProcessed()
		{
			return this.isProcessed;
		}

		get canAddParticipants()
		{
			return ChatPermission.canAddParticipants(this.dialogId)
				&& Feature.isAddingUserByMentionAvailable;
		}

		/**
		 * @param {MutationPayload<DialoguesUpdateData, DialoguesUpdateActions>} payload
		 */
		#onUpdateParticipants = ({ payload }) => {
			if (!this.provider.isMembershipMapLoaded)
			{
				return;
			}

			const { actionName, data } = payload;

			if (actionName === 'addParticipants')
			{
				this.#removeParticipantsToMentionPanel(data);
			}

			if (actionName === 'removeParticipants')
			{
				this.#addParticipantsToMentionPanel(data);
			}
		};

		/**
		 * @param {DialoguesUpdateData} data
		 */
		#addParticipantsToMentionPanel(data)
		{
			if (!isOnline())
			{
				return;
			}

			const { participants } = data.fields;
			for (const participant of participants)
			{
				const isCopilot = participant === this.#store.getters['usersModel/getCopilotData']()?.id;
				if (isCopilot)
				{
					continue;
				}

				this.provider.updateMembershipMap(participant, true);
				this.view.mentionPanel.update(participant, { actions: [this.#buildInviteActionButton(participant)] });
			}
		}

		/**
		 * @param {DialoguesUpdateData} data
		 */
		#removeParticipantsToMentionPanel(data)
		{
			for (const participant of data.removeData)
			{
				this.provider.updateMembershipMap(participant, false);
				this.view.mentionPanel.update(participant, { actions: [] });
			}
		}

		/**
		 * @public
		 */
		finishMentioning()
		{
			this.hideLoader();
			this.closeMentionPanel();
			this.recoverFocusIndexPosition();
		}

		/**
		 * @return {boolean}
		 */
		canUse()
		{
			return Boolean(this.view.textField.isUiAvailable() && this.view.mentionPanel.isUiAvailable());
		}

		/**
		 * @private
		 */
		showLoader()
		{
			this.view.mentionPanel.showLoader();
			this.isLoading = true;
		}

		/**
		 * @private
		 */
		hideLoader()
		{
			this.view.mentionPanel.hideLoader();
			this.isLoading = false;
		}

		/**
		 * @private
		 */
		closeMentionPanel()
		{
			this.view.mentionPanel.close();

			this.isProcessed = false;
			this.curruntQuery = '';
			this.mentionSymbolPosition = null;
			this.lastQuerySymbolPosition = null;

			this.provider.closeSession();
		}

		recoverFocusIndexPosition()
		{
			this.focusIndexPosition = 1;
		}

		/**
		 * @private
		 */
		initProvider()
		{
			this.provider = new MentionProvider(this.getProviderOptions());
		}

		/**
		 * @return {object}
		 */
		getProviderOptions()
		{
			return {
				dialogId: this.dialogId,
				canAddParticipants: () => this.canAddParticipants,
				filter: {
					exceptDialogTypes: [
						DialogType.copilot,
						DialogType.lines,
						DialogType.comment,
						DialogType.tasksTask,
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
		 * @private
		 * @param {string} text
		 * @param {string} inputCharacters
		 * @param {number} cursorPosition
		 */
		onChangeText(text, inputCharacters, cursorPosition)
		{
			logger.log('Mention.onChangeText', text, inputCharacters, cursorPosition);
			if (this.isMentionProcessed)
			{
				this.onProcessedMentionChangeText(text, inputCharacters, cursorPosition);

				return;
			}

			this.onInactiveMentionChangeText(text, inputCharacters, cursorPosition);
		}

		/**
		 * @private
		 * @param text
		 * @param inputCharacters
		 * @param cursorPosition
		 */
		async onProcessedMentionChangeText(text, inputCharacters, cursorPosition)
		{
			logger.log('Mention.onProcessedMentionChangeText', text, inputCharacters, cursorPosition);
			if (this.checkToClose(text, inputCharacters, cursorPosition))
			{
				logger.log('Mention: close panel');
				this.finishMentioning();

				return;
			}

			this.provider.setOptionConfig(this.chatId);

			this.lastQuerySymbolPosition = cursorPosition - 1;
			if (this.mentionSymbolPosition === this.lastQuerySymbolPosition)
			{
				void this.#initialUsersMembership();

				const userIdList = DialogHelper.isChatId(this.dialogId)
					? this.getRecentUsers()
					: await this.provider.loadChatParticipants()
				;

				this.drawParticipantsItems(userIdList);

				return;
			}

			this.curruntQuery = text.slice(this.mentionSymbolPosition + 1, cursorPosition);
			void this.provider.doSearch(this.curruntQuery);
		}

		/**
		 * @private
		 * @param text
		 * @param inputCharacters
		 * @param cursorPosition
		 */
		async onInactiveMentionChangeText(text, inputCharacters, cursorPosition)
		{
			if (!this.checkToOpen(text, inputCharacters, cursorPosition))
			{
				return;
			}

			if (!this.chatId)
			{
				return;
			}

			logger.warn('Mention: open mention panel, cursorPosition:', cursorPosition);

			this.mentionSymbolPosition = cursorPosition - 1;
			this.provider.setOptionConfig(this.chatId);
			void this.#initialUsersMembership();

			const userIdList = await this.loadUsersForInitial();
			this.drawUserFoInitial(userIdList);
		}

		async #initialUsersMembership()
		{
			if (!this.canAddParticipants)
			{
				return;
			}

			const notParticipantsIds = await this.provider.loadChatUsersMembership();
			if (!Type.isArrayFilled(notParticipantsIds))
			{
				return;
			}

			notParticipantsIds.forEach((itemId) => {
				const dialogHelper = DialogHelper.createByDialogId(itemId);
				const copilotId = this.#store.getters['usersModel/getCopilotData']()?.id;
				const isNotCopilot = String(itemId) !== String(copilotId);

				if (dialogHelper?.isDirect && isNotCopilot)
				{
					this.view.mentionPanel.update(itemId, { actions: [this.#buildInviteActionButton(itemId)] });
				}
			});

			logger.log(`${this.constructor.name}.#initialUsersMembership : ${notParticipantsIds}`);
		}

		/**
		 * @private
		 * @param text
		 * @param inputCharacters
		 * @param cursorPosition
		 * @return {boolean}
		 */
		checkToOpen(text, inputCharacters, cursorPosition)
		{
			if (!MENTION_SYMBOL.has(inputCharacters))
			{
				return false;
			}

			const mentionSymbolPosition = cursorPosition - 1;

			return mentionSymbolPosition === 0 || MENTION_PREFIX.has(text[mentionSymbolPosition - 1]);
		}

		/**
		 * @private
		 * @param {string} text
		 * @param {string} inputCharacters
		 * @param cursorPosition
		 * @return {boolean}
		 */
		checkToClose(text, inputCharacters, cursorPosition)
		{
			if (CLOSE_MENTION_SYMBOLS.has(inputCharacters))
			{
				logger.warn('Mention close: symbol has been entered to close the mention');

				return true;
			}

			if (inputCharacters.length > 1)
			{
				logger.warn('Mention close: more than 1 character entered');

				return true;
			}

			if (!MENTION_SYMBOL.has(text[this.mentionSymbolPosition]))
			{
				logger.warn('Mention close: mention symbol has been shifted or deleted');

				return true;
			}

			return false;
		}

		/**
		 * @private
		 * @param {MentionItem} item
		 */
		onMentionItemSelected(item)
		{
			const bbCodeText = this.#getBBCodeTextByItem(item);

			const fromIndex = this.mentionSymbolPosition ?? this.view.textField.getCursorIndex();
			let toIndex = (this.lastQuerySymbolPosition ?? this.mentionSymbolPosition) + this.focusIndexPosition;

			if (toIndex < fromIndex)
			{
				toIndex = fromIndex;
			}

			logger.warn('Mention: replace text', fromIndex, toIndex, bbCodeText);

			this.view.textField.replaceText(fromIndex, toIndex, bbCodeText);

			this.finishMentioning();
		}

		/**
		 * protected
		 * @param {string} actionId
		 * @param {string} actionViewId
		 * @param {string} mentionId
		 */
		mentionItemActionTapHandler = ({ actionId, actionViewId, mentionId }) => {
			logger.log(`${this.constructor.name}.mentionItemActionTapHandler tapped: ${actionId}, ${actionViewId}, ${mentionId}`);

			const sections = [{ id: ACTION_MENU_SECTION_ID_GENERAL }];
			const isTaskComment = DialogHelper.createByDialogId(this.dialogId)?.isTaskComment;
			const title = isTaskComment
				? Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_MENTION_POPUP_ADD_USER_TO_TASK')
				: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_MENTION_POPUP_ADD_USER');

			const items = [{
				id: mentionId,
				title,
				iconName: Icon.ADD_PERSON.getIconName(),
				sectionCode: ACTION_MENU_SECTION_ID_GENERAL,
			}];

			let wasTappedUserAdd = false;
			const addUserHandler = async (event) => {
				switch (event)
				{
					case 'onItemSelected': {
						wasTappedUserAdd = true;
						this.#onAddParticipant(mentionId);

						break;
					}

					case 'onHide': {
						if (!wasTappedUserAdd)
						{
							this.#onHideAddUserPopup(mentionId);
						}

						break;
					}

					case 'onShow': {
						this.#onShowAddUserInProgress(mentionId);

						break;
					}

					default:
				}
			};

			const addUserPopup = dialogs.createPopupMenu();
			addUserPopup.setData(items, sections, addUserHandler);
			addUserPopup.setTarget(actionViewId);
			addUserPopup.show();
		};

		/**
		 * @param {string} mentionId
		 */
		#onAddParticipant(mentionId)
		{
			AnalyticsService.getInstance().sendAddParticipantFromMentionPanel(this.dialogId);
			if (DialogHelper.isDialogId(this.dialogId))
			{
				void this.#addParticipant(mentionId);
			}
			else
			{
				void this.#addChat(mentionId);
			}

			this.provider.updateMembershipMap(mentionId, true);
			this.#onShowAddUserSuccess(mentionId);
		}

		/**
		 * @param {string|number} userId
		 */
		#onShowAddUserInProgress(userId)
		{
			const item = {
				actions: [this.#buildProgressActionButton(userId)],
			};

			this.view.mentionPanel.update(userId, item);
		}

		/**
		 * @param {string|number} userId
		 */
		#onShowAddUserSuccess(userId)
		{
			this.view.mentionPanel.update(userId, { actions: [] });
			this.view.mentionPanel.animateAction(userId, this.#buildSuccessActionButton(userId));
		}

		/**
		 * @param {string|number} userId
		 */
		#onHideAddUserPopup(userId)
		{
			this.view.mentionPanel.update(userId, { actions: [this.#buildInviteActionButton(userId)] });
		}

		/**
		 * @param {string|number} userId
		 * @return {Promise<void>}
		 */
		async #addParticipant(userId)
		{
			const chatSettings = Application.storage.getObject('settings.chat', {
				historyShow: true,
			});

			const showHistory = chatSettings.historyShow;
			const chatService = new ChatService();

			const { chatId } = this;
			if (!chatId)
			{
				return Promise.reject(new Error('chatId is not available'));
			}

			return chatService.addToChat(chatId, [userId], showHistory)
				.then(() => {
					logger.log(`${this.constructor.name}.#addParticipant with id = ${userId} was add to chat = ${chatId}`);
				})
				.catch((error) => {
					logger.error(`${this.constructor.name}.#addParticipant error:`, error);
				})
			;
		}

		/**
		 * @param {string|number} userId
		 * @return {Promise<boolean>}
		 */
		async #addChat(userId)
		{
			const userIds = [userId, this.dialogId, this.currentUserId];

			try
			{
				const result = await callMethod(RestMethod.imChatAdd, { USERS: userIds });
				const chatId = parseInt(result.data(), 10);
				if (!chatId)
				{
					return false;
				}

				MessengerEmitter.emit(
					EventType.messenger.openDialog,
					{ dialogId: `chat${chatId}` },
				);
			}
			catch (error)
			{
				logger.error(`${this.constructor.name}#addСhat error:`, error);
			}

			return true;
		}

		/**
		 * @private
		 * @param {string|number} id
		 * @param {string} type
		 */
		onExternalMention(id, type, fromDialogId = null)
		{
			if (this.dialogId !== fromDialogId)
			{
				return;
			}

			logger.log('Mention.onExternalMention', id, type, this.isDialogShow);

			if (!this.isDialogShow)
			{
				this.externalMentionQueue.push({ id, type, fromDialogId });

				return;
			}

			if (id === BBCodeEntity.all && DialogHelper.isChatId(this.dialogId))
			{
				return;
			}

			let bbCodeText = this.#getBBCodeTextByType(type, id);

			const text = this.view.getInput();
			if (Type.isStringFilled(text) && !text.endsWith(' '))
			{
				bbCodeText = ` ${bbCodeText}`;
			}

			this.view.textField.showKeyboard();
			this.view.textField.replaceText(text.length, text.length, bbCodeText);
		}

		onDialogHidden()
		{
			this.isDialogShow = false;
		}

		onDialogShow()
		{
			this.isDialogShow = true;

			if (this.externalMentionQueue.length > 0)
			{
				this.externalMentionQueue.forEach((externalMention) => {
					this.onExternalMention(externalMention.id, externalMention.type, externalMention.fromDialogId);
				});

				this.externalMentionQueue = [];
			}
		}

		/**
		 * @param {DialogId} dialogId
		 * @return {boolean}
		 */
		#isNeedAddActionToAddUser(dialogId)
		{
			if (!this.canAddParticipants || !isOnline())
			{
				return false;
			}

			const copilotData = this.#store.getters['usersModel/getCopilotData']();
			if (String(copilotData?.id) === String(dialogId))
			{
				return false;
			}

			const isNotGroupCurrentChat = !DialogHelper.isDialogId(this.dialogId);
			const isDirect = DialogHelper.createByDialogId(dialogId)?.isDirect;
			const isNotCurrentChat = Number(this.dialogId) !== Number(dialogId)
				&& Number(this.currentUserId) !== Number(dialogId);

			if (isNotGroupCurrentChat && isDirect && isNotCurrentChat)
			{
				return true;
			}

			const isNotParticipant = !this.provider.membershipMap[dialogId];
			const isMembershipMapLoaded = this.provider.isMembershipMapLoaded;

			return isNotParticipant && isDirect && isMembershipMapLoaded;
		}

		/**
		 * @private
		 * @param {DialogId} itemId
		 * @return {MentionItem}
		 */
		prepareItemForDrawing(itemId)
		{
			const chatTitleParams = ChatTitle.createFromDialogId(itemId);
			const avatarTitleParams = ChatAvatar.createFromDialogId(itemId);

			const actions = [];
			if (this.#isNeedAddActionToAddUser(itemId))
			{
				actions.push(this.#buildInviteActionButton(itemId));
			}

			return {
				id: String(itemId),
				title: chatTitleParams.getTitle(),
				titleColor: chatTitleParams.getTitleColor(),
				description: chatTitleParams.getDescription(),
				/** @deprecated use to avatar {AvatarDetail} */
				imageUrl: avatarTitleParams.getAvatarUrl(),
				/** @deprecated use to avatar {AvatarDetail} */
				imageColor: avatarTitleParams.getColor(),
				/** @deprecated use to avatar {AvatarDetail} */
				isSuperEllipseIcon: avatarTitleParams.getIsSuperEllipseIcon(),
				avatar: avatarTitleParams.getMentionAvatarProps(),
				testId: String(itemId),
				actions,
			};
		}

		/**
		 * @private
		 * @param {Array<DialogId>} itemIds
		 */
		drawItems(itemIds)
		{
			let result = [];

			itemIds.forEach((itemId) => {
				const item = this.prepareItemForDrawing(itemId);
				const recentItem = this.#store.getters['recentModel/getById'](item.id);

				item.displayedDate = DateFormatter.getRecentFormat(recentItem?.dateMessage);

				result.push(item);
			});

			const copilotMentionItem = this.getCopilotMentionItem();
			const copilotMentionItemTitle = copilotMentionItem?.title.toLowerCase();
			if (copilotMentionItemTitle?.includes(this.curruntQuery.toLowerCase()))
			{
				result = result.filter((item) => item.id !== copilotMentionItem.id);

				result.push(copilotMentionItem);
			}

			logger.log('Mention: draw items', result);
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
		 * @override
		 * @return {Array<string>}
		 */
		getRecentUsers()
		{
			return this.provider.loadRecentUsers();
		}

		/**
		 * @param {Array<number>} userIdList
		 */
		drawParticipantsItems(userIdList)
		{
			const result = this.getFixedItems();

			userIdList.forEach((itemId) => {
				const item = this.prepareItemForDrawing(itemId);

				result.push(item);
			});

			logger.log('Mention: draw items', result);

			if (!this.isProcessed)
			{
				this.view.mentionPanel.open(result);

				this.isProcessed = true;

				return;
			}
			this.view.mentionPanel.setItems(result);
			this.view.mentionPanel.hideLoader();
		}

		/**
		 * @param {string|number} userId
		 * @return {MentionAction}
		 */
		#buildInviteActionButton(userId)
		{
			return {
				action: {
					id: userId,
					testId: 'button-invite',
					iconName: Icon.ADD_PERSON.getIconName(),
					size: ButtonDesignSize.M,
					design: ButtonDesignType.primary,
					mode: ButtonDesignMode.outline,
					rounded: true,
					dropdown: true,
					viewId: `ref-action-button-${userId}`,
				},
			};
		}

		/**
		 * @param {string|number} userId
		 * @return {MentionAction}
		 */
		#buildSuccessActionButton(userId)
		{
			return {
				options: {
					autoHideDelay: 1500,
				},
				action: {
					id: userId,
					testId: 'button-success',
					iconName: Icon.CHECK.getIconName(),
					size: ButtonDesignSize.M,
					design: ButtonDesignType.primary,
					mode: ButtonDesignMode.tinted,
					rounded: true,
					dropdown: false,
					viewId: `ref-action-button-${userId}`,
				},
			};
		}

		/**
		 * @param {string|number} userId
		 * @return {MentionAction}
		 */
		#buildProgressActionButton(userId)
		{
			return {
				action: {
					id: userId,
					testId: 'button-progress',
					iconName: Icon.ADD_PERSON.getIconName(),
					size: ButtonDesignSize.M,
					design: ButtonDesignType.primary,
					mode: ButtonDesignMode.tinted,
					rounded: true,
					dropdown: true,
					viewId: `ref-action-button-${userId}`,
				},
			};
		}

		async loadUsersForInitial()
		{
			if (DialogHelper.isChatId(this.dialogId))
			{
				return this.getRecentUsers();
			}

			this.view.mentionPanel.open([]);
			this.showLoader();
			this.isProcessed = true;

			return this.provider.loadChatParticipants();
		}

		/**
		 * @param {Array<number>} userIdList
		 */
		drawUserFoInitial(userIdList)
		{
			if (Type.isNumber(this.lastQuerySymbolPosition))
			{
				return;
			}

			this.drawParticipantsItems(userIdList);
		}

		getFixedItems()
		{
			const result = [];

			const copilotMentionItem = this.getCopilotMentionItem();
			if (copilotMentionItem)
			{
				result.push(copilotMentionItem);
			}

			const allUsersMentionItem = this.getAllUsersMentionItem();
			if (allUsersMentionItem)
			{
				result.push(allUsersMentionItem);
			}

			return result;
		}

		getAllUsersMentionItem()
		{
			const helper = DialogHelper.createByDialogId(this.dialogId);
			if (!helper)
			{
				return null;
			}

			if (helper.isDirect)
			{
				return null;
			}

			return this.createAllUsersMentionItem();
		}

		getCopilotMentionItem()
		{
			if (!Feature.isCopilotMentionAvailable)
			{
				return null;
			}

			const helper = DialogHelper.createByDialogId(this.dialogId);
			if (!helper)
			{
				return null;
			}

			if (!helper.isCopilotMentionSupported)
			{
				return null;
			}

			return this.createCopilotMentionItem();
		}

		createCopilotMentionItem()
		{
			const copilotData = this.#store.getters['usersModel/getCopilotData']();
			const chatTitleParams = ChatTitle.getCopilotMentionTitle(copilotData);
			const avatarTitleParams = ChatAvatar.createCopilotMentionAvatar();

			return {
				id: String(copilotData.id),
				title: chatTitleParams.title,
				titleColor: chatTitleParams.titleColor,
				description: chatTitleParams.description,
				avatar: avatarTitleParams,
				testId: 'copilot',
				actions: [],
			};
		}

		/**
		 * @param {string} dialogId
		 * @return {object|undefined}
		 */
		#getDialogById(dialogId)
		{
			return this.#store.getters['dialoguesModel/getById'](dialogId);
		}

		/**
		 * @param {string} dialogId
		 * @return {number}
		 */
		#getChatIdByDialogId(dialogId)
		{
			return this.#getDialogById(dialogId)?.chatId ?? 0;
		}

		/**
		 * @param {string} type see BBCode constant
		 * @param {string | DialogId} id
		 * @return {string}
		 */
		#getBBCodeTextByType(type, id)
		{
			switch (type)
			{
				case BBCode.user: {
					if (id === BBCodeEntity.all)
					{
						return this.#getBBCodeAllUsersText();
					}

					return this.#getBBCodeUserText(id);
				}

				case BBCode.chat: {
					return this.#getBBCodeChatText(id);
				}

				default: {
					return '';
				}
			}
		}

		#getBBCodeAllUsersText()
		{
			return `[USER=all]${Loc.getMessage('IMMOBILE_MESSENGER_COMMON_ALL_USERS')}[/USER] `;
		}

		#getBBCodeUserText(userId)
		{
			const userModelState = this.#store.getters['usersModel/getById'](userId);
			if (Type.isUndefined(userModelState))
			{
				return '';
			}

			const userName = Type.isStringFilled(userModelState.name)
				? userModelState.name : `${userModelState.firstName} ${userModelState.lastName}`;

			return this.#wrapTextInBBCode(userName, BBCode.user, userId);
		}

		#getBBCodeChatText(dialogId)
		{
			const dialogModelState = this.#getDialogById(dialogId);
			if (Type.isUndefined(dialogModelState))
			{
				return '';
			}

			return this.#wrapTextInBBCode(dialogModelState.name, BBCode.chat, dialogModelState.dialogId);
		}

		/**
		 * @private
		 * @param {string} text
		 * @param {string} bbCode
		 * @param {string || number || null} [param=null]
		 * @return {string}
		 */
		#wrapTextInBBCode(text, bbCode, param = null)
		{
			if (param !== null)
			{
				return `[${bbCode}=${param}]${text}[/${bbCode}] `;
			}

			return `[${bbCode}]${text}[/${bbCode}] `;
		}

		/**
		 * @return {MentionItem}
		 */
		createAllUsersMentionItem()
		{
			const chatTitleParams = ChatTitle.createMentionAllUsersTitle();
			const avatarTitleParams = ChatAvatar.createMentionAllUsersAvatar();

			return {
				id: BBCodeEntity.all,
				title: chatTitleParams.title,
				titleColor: chatTitleParams.titleColor,
				description: chatTitleParams.description,
				avatar: avatarTitleParams,
				testId: BBCodeEntity.all,
				actions: [],
			};
		}

		/**
		 * @param {MentionItem} item
		 * @return {string}
		 */
		#getBBCodeTextByItem(item)
		{
			if (item.id === BBCodeEntity.all)
			{
				return this.#getBBCodeAllUsersText();
			}

			if (DialogHelper.isDialogId(item.id))
			{
				const id = this.#getChatIdByDialogId(item.id);
				if (!id)
				{
					return '';
				}

				return this.#wrapTextInBBCode(item.title, BBCode.chat, id);
			}

			return this.#wrapTextInBBCode(item.title, BBCode.user, item.id);
		}
	}

	module.exports = { MentionManager };
});
