/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports, im_v2_application_core, im_v2_const, im_v2_lib_copilot, im_v2_lib_layout, im_v2_lib_logger, main_core, im_v2_lib_rest, im_v2_lib_user) {
	'use strict';

	class RecentDataExtractor {
		#restResult;
		#withBirthdays;
		#users = {};
		#chats = {};
		#messages = {};
		#files = {};
		#recentItems = {};
		#stickerMessages = {};
		constructor(params) {
			const {
				rawData,
				withBirthdays = true
			} = params;
			this.#withBirthdays = withBirthdays;
			this.#restResult = rawData;
		}
		getItems() {
			const {
				items = [],
				copilot,
				messagesAutoDeleteConfigs
			} = this.#restResult;
			items.forEach(item => {
				this.#extractUser(item);
				this.#extractChat(item);
				this.#extractMessage(item);
				this.#extractRecentItem(item);
				this.#extractStickerMessage(item);
			});
			this.#extractBirthdayItems();
			return {
				users: Object.values(this.#users),
				chats: Object.values(this.#chats),
				messages: Object.values(this.#messages),
				files: Object.values(this.#files),
				recentItems: Object.values(this.#recentItems),
				copilot,
				messagesAutoDeleteConfigs,
				stickerMessages: Object.values(this.#stickerMessages)
			};
		}
		#extractUser(item) {
			if (item.user?.id && !this.#users[item.user.id]) {
				this.#users[item.user.id] = item.user;
			}
		}
		#extractChat(item) {
			if (item.type === im_v2_const.ChatType.chat) {
				this.#chats[item.id] = this.#prepareGroupChat(item);
				if (item.user.id && !this.#chats[item.user.id]) {
					this.#chats[item.user.id] = this.#prepareChatForAdditionalUser(item.user);
				}
			} else if (item.type === im_v2_const.ChatType.user) {
				const existingRecentItem = im_v2_application_core.Core.getStore().getters['recent/get'](item.user.id);
				// we should not update real chat with "default" chat data
				if (!existingRecentItem || !item.options.default_user_record) {
					this.#chats[item.user.id] = this.#prepareChatForUser(item);
				}
			}
		}
		#extractMessage(item) {
			const message = item.message;
			if (!message) {
				return;
			}
			if (message.id === 0) {
				message.id = `${im_v2_const.FakeMessagePrefix}-${item.id}`;
			}
			let viewedByOthers = false;
			if (message.status === im_v2_const.MessageStatus.delivered) {
				viewedByOthers = true;
			}
			const existingMessage = im_v2_application_core.Core.getStore().getters['messages/getById'](message.id);
			// recent has shortened attach format, we should not rewrite attach if model has it
			if (main_core.Type.isArrayFilled(existingMessage?.attach)) {
				delete message.attach;
			}
			if (main_core.Type.isPlainObject(message.file)) {
				const file = message.file;
				if (existingMessage) {
					// recent doesn't know about several files in one message,
					// we should not rewrite message files, so we merge it.
					message.files = this.#mergeFileIds(existingMessage, file.id);
				} else {
					message.files = [file.id];
				}
				const existingFile = im_v2_application_core.Core.getStore().getters['files/get'](file.id);
				// recent has shortened file format, we should not rewrite file if model has it
				if (!existingFile) {
					this.#files[file.id] = file;
				}
			}
			this.#messages[message.id] = {
				...message,
				viewedByOthers
			};
		}
		#extractRecentItem(item) {
			const messageId = item.message?.id ?? 0;
			this.#recentItems[item.id] = {
				...item,
				messageId
			};
		}
		#extractBirthdayItems() {
			if (!this.#withBirthdays) {
				return;
			}
			const {
				birthdayList = []
			} = this.#restResult;
			birthdayList.forEach(item => {
				if (im_v2_application_core.Core.getUserId() === item.id) {
					return;
				}
				if (!this.#users[item.id]) {
					this.#users[item.id] = item;
				}
				if (!this.#chats[item.id]) {
					this.#chats[item.id] = this.#prepareChatForAdditionalUser(item);
				}
				if (!this.#recentItems[item.id]) {
					const messageId = `${im_v2_const.FakeMessagePrefix}-${item.id}`;
					this.#recentItems[item.id] = {
						...this.#getBirthdayPlaceholder(item),
						messageId
					};
					this.#messages[messageId] = {
						id: messageId
					};
				}
			});
		}
		#extractStickerMessage(item) {
			const messageId = item.message?.id;
			if (!messageId || !item.message.sticker) {
				return;
			}
			this.#stickerMessages[messageId] = {
				...item.message.sticker,
				messageId
			};
		}
		#prepareGroupChat(item) {
			return {
				...item.chat,
				dialogId: item.id
			};
		}
		#prepareChatForUser(item) {
			return {
				chatId: item.chat_id,
				avatar: item.user.avatar,
				color: item.user.color,
				dialogId: item.id,
				name: item.user.name,
				type: im_v2_const.ChatType.user,
				role: im_v2_const.UserRole.member,
				backgroundId: item.chat.background_id,
				textFieldEnabled: item.chat.text_field_enabled,
				muteList: item.chat.mute_list
			};
		}
		#prepareChatForAdditionalUser(user) {
			return {
				dialogId: user.id,
				avatar: user.avatar,
				color: user.color,
				name: user.name,
				type: im_v2_const.ChatType.user,
				role: im_v2_const.UserRole.member
			};
		}
		#getBirthdayPlaceholder(item) {
			return {
				id: item.id,
				isBirthdayPlaceholder: true
			};
		}
		#mergeFileIds(existingMessage, fileId) {
			const existingMessageFilesIds = existingMessage.files.map(id => {
				return Number.parseInt(id, 10);
			});
			const setOfFileIds = new Set([...existingMessageFilesIds, fileId]);
			return [...setOfFileIds];
		}
	}

	class LegacyRecentService {
		static instance = null;
		dataIsPreloaded = false;
		itemsPerPage = 50;
		isLoading = false;
		pagesLoaded = 0;
		hasMoreItems = true;
		lastMessageDate = null;
		static getInstance() {
			if (!this.instance) {
				this.instance = new this();
			}
			return this.instance;
		}

		// region public
		loadFirstPage({
			ignorePreloadedItems = false
		} = {}) {
			if (this.dataIsPreloaded && !ignorePreloadedItems) {
				im_v2_lib_logger.Logger.warn('Im.RecentList: first page was preloaded');
				return Promise.resolve();
			}
			this.isLoading = true;
			return this.requestItems({
				firstPage: true
			});
		}
		loadNextPage() {
			if (this.isLoading || !this.hasMoreItems) {
				return Promise.resolve();
			}
			this.isLoading = true;
			return this.requestItems();
		}
		hasMoreItemsToLoad() {
			return this.hasMoreItems;
		}
		setPreloadedData(params) {
			im_v2_lib_logger.Logger.warn('Im.RecentList: setting preloaded data', params);
			const {
				items,
				hasMore
			} = params;
			this.lastMessageDate = this.getLastMessageDate(items);
			if (!hasMore) {
				this.hasMoreItems = false;
			}
			this.dataIsPreloaded = true;
			void this.updateModels(params);
		}
		hideChat(dialogId) {
			im_v2_lib_logger.Logger.warn('Im.RecentList: hide chat', dialogId);
			const recentItem = im_v2_application_core.Core.getStore().getters['recent/get'](dialogId);
			if (!recentItem) {
				return;
			}
			void im_v2_application_core.Core.getStore().dispatch('recent/hide', {
				dialogId
			});
			const chatIsOpened = im_v2_application_core.Core.getStore().getters['application/isChatOpen'](dialogId);
			if (chatIsOpened) {
				im_v2_lib_layout.LayoutManager.getInstance().clearCurrentLayoutEntityId();
				void im_v2_lib_layout.LayoutManager.getInstance().deleteLastOpenedElementById(dialogId);
			}
			im_v2_application_core.Core.getRestClient().callMethod(im_v2_const.RestMethod.imRecentHide, {
				DIALOG_ID: dialogId
			}).catch(result => {
				console.error('Im.RecentList: hide chat error', result.error());
			});
		}
		// endregion public

		async requestItems({
			firstPage = false
		} = {}) {
			const queryParams = this.getQueryParams(firstPage);
			const result = await im_v2_application_core.Core.getRestClient().callMethod(im_v2_const.RestMethod.imRecentList, queryParams).catch(errorResult => {
				console.error('Im.RecentList: page request error', errorResult.error());
			});
			this.pagesLoaded++;
			im_v2_lib_logger.Logger.warn(`Im.RecentList: ${firstPage ? 'First' : this.pagesLoaded} page request result`, result.data());
			const {
				items,
				hasMore
			} = result.data();
			this.lastMessageDate = this.getLastMessageDate(items);
			this.hasMoreItems = hasMore;
			this.isLoading = false;
			return this.updateModels(result.data());
		}
		getQueryParams(firstPage) {
			return {
				SKIP_OPENLINES: 'Y',
				LIMIT: this.itemsPerPage,
				LAST_MESSAGE_DATE: firstPage ? null : this.lastMessageDate,
				GET_ORIGINAL_TEXT: 'Y',
				PARSE_TEXT: 'Y',
				WITH_COUNTERS: 'N'
			};
		}
		saveRecentItems(recentItems) {
			return im_v2_application_core.Core.getStore().dispatch('recent/setCollection', {
				type: im_v2_const.RecentType.default,
				items: recentItems
			});
		}
		updateModels(rawData) {
			const extractor = new RecentDataExtractor({
				rawData,
				...this.getExtractorOptions()
			});
			const extractedItems = extractor.getItems();
			const {
				users,
				chats,
				messages,
				files,
				recentItems,
				copilot,
				messagesAutoDeleteConfigs,
				stickerMessages
			} = extractedItems;
			im_v2_lib_logger.Logger.warn('LegacyRecentService: prepared data for models', extractedItems);
			const usersPromise = im_v2_application_core.Core.getStore().dispatch('users/set', users);
			const dialoguesPromise = im_v2_application_core.Core.getStore().dispatch('chats/set', chats);
			const autoDeletePromise = im_v2_application_core.Core.getStore().dispatch('chats/autoDelete/set', messagesAutoDeleteConfigs);
			const messagesPromise = im_v2_application_core.Core.getStore().dispatch('messages/store', messages);
			const filesPromise = im_v2_application_core.Core.getStore().dispatch('files/set', files);
			const recentPromise = this.saveRecentItems(recentItems);
			const stickersPromise = im_v2_application_core.Core.getStore().dispatch('stickers/messages/set', stickerMessages);
			const copilotManager = new im_v2_lib_copilot.CopilotManager();
			const copilotPromise = copilotManager.handleRecentListResponse(copilot);
			return Promise.all([usersPromise, dialoguesPromise, messagesPromise, filesPromise, recentPromise, copilotPromise, autoDeletePromise, stickersPromise]);
		}
		getLastMessageDate(items) {
			if (items.length === 0) {
				return '';
			}
			return items.slice(-1)[0].message.date;
		}
		getExtractorOptions() {
			return {};
		}
	}

	class UnreadRecentService extends LegacyRecentService {
		static instance = null;
		static getInstance() {
			if (!this.instance) {
				this.instance = new this();
			}
			return this.instance;
		}
		getQueryParams(firstPage) {
			return {
				...super.getQueryParams(firstPage),
				UNREAD_ONLY: 'Y'
			};
		}
		saveRecentItems(recentItems) {
			return im_v2_application_core.Core.getStore().dispatch('recent/setUnreadCollection', {
				type: im_v2_const.RecentType.default,
				items: recentItems
			});
		}
	}

	class BaseRecentService {
		#unreadMode = false;
		#parentChatId = 0;
		#itemsPerPage = 50;
		#isLoading = false;
		#pagesLoaded = 0;
		#hasMoreItemsToLoad = true;
		#lastMessageDate = 0;
		constructor(params = {}) {
			const {
				unreadMode = false,
				parentChatId = im_v2_const.ParentChatScope.topLevel
			} = params;
			this.#unreadMode = unreadMode;
			this.#parentChatId = parentChatId;
		}
		loadFirstPage() {
			this.#isLoading = true;
			return this.#requestItems({
				firstPage: true
			});
		}
		loadNextPage() {
			if (this.#isLoading || !this.#hasMoreItemsToLoad) {
				return Promise.resolve();
			}
			this.#isLoading = true;
			return this.#requestItems();
		}
		hasMoreItemsToLoad() {
			return this.#hasMoreItemsToLoad;
		}
		getItemsPerPage() {
			return this.#itemsPerPage;
		}
		getRestMethodName(firstPage) {
			if (firstPage) {
				return im_v2_const.RestMethod.imV2RecentLoad;
			}
			return im_v2_const.RestMethod.imV2RecentTail;
		}
		getRecentType() {
			return im_v2_const.RecentType.default;
		}
		getUnreadMode() {
			return this.#unreadMode;
		}
		getParentChatId() {
			return this.#parentChatId;
		}
		saveRecentItems(restResult) {
			const {
				recentItems
			} = restResult;
			const setPayload = {
				type: this.getRecentType(),
				items: recentItems,
				unread: this.getUnreadMode()
			};
			if (this.getParentChatId() !== null) {
				setPayload.parentChatId = this.getParentChatId();
			}
			return im_v2_application_core.Core.getStore().dispatch('recent/setCollection', setPayload);
		}
		saveFirstPageData(restResult) {
			// The base class does nothing here
			return Promise.resolve();
		}
		getQueryParams(firstPage = false) {
			return {
				limit: this.getItemsPerPage(),
				filter: this.getRequestFilter(firstPage)
			};
		}
		getRequestFilter(firstPage = false) {
			return {
				lastMessageDate: firstPage ? null : this.#lastMessageDate,
				recentSection: this.getRecentType(),
				parentId: this.getParentChatId(),
				unread: this.getUnreadMode()
			};
		}
		handlePaginationField(result) {
			this.#lastMessageDate = this.#getLastMessageDate(result);
		}
		onAfterRequest(firstPage) {
			// The base class does nothing here
		}
		async #requestItems({
			firstPage = false
		} = {}) {
			const queryParams = {
				data: this.getQueryParams(firstPage)
			};
			const result = await im_v2_lib_rest.runAction(this.getRestMethodName(firstPage), queryParams).catch(([error]) => {
				console.error('BaseRecentList: page request error', error);
				throw error;
			});
			this.#pagesLoaded++;
			im_v2_lib_logger.Logger.warn(`BaseRecentList: ${firstPage ? 'First' : this.#pagesLoaded} page request result`, result);
			const {
				hasNextPage
			} = result;
			this.handlePaginationField(result);
			this.#hasMoreItemsToLoad = hasNextPage;
			this.#isLoading = false;
			this.onAfterRequest(firstPage);
			if (firstPage) {
				await this.saveFirstPageData(result);
			}
			return this.#updateModels(result, firstPage);
		}
		#updateModels(restResult) {
			const {
				users,
				chats,
				messages,
				files,
				recentItems,
				messagesAutoDeleteConfigs,
				copilot
			} = restResult;
			const chatsWithCounters = this.#getChatsWithCounters(chats, recentItems);

			// private chats objects are empty, so we should handle chats before users to not overwrite real info
			const chatsPromise = im_v2_application_core.Core.getStore().dispatch('chats/set', chatsWithCounters);
			const usersPromise = new im_v2_lib_user.UserManager().setUsersToModel(users);
			const autoDeletePromise = im_v2_application_core.Core.getStore().dispatch('chats/autoDelete/set', messagesAutoDeleteConfigs);
			const messagesPromise = im_v2_application_core.Core.getStore().dispatch('messages/store', messages);
			const filesPromise = im_v2_application_core.Core.getStore().dispatch('files/set', files);
			const recentPromise = this.saveRecentItems(restResult);
			const copilotManager = new im_v2_lib_copilot.CopilotManager();
			const copilotPromise = copilotManager.handleRecentListResponse(copilot);
			return Promise.all([usersPromise, chatsPromise, messagesPromise, filesPromise, recentPromise, autoDeletePromise, copilotPromise]);
		}
		#getChatsWithCounters(chats, recentItems) {
			const chatMap = {};
			chats.forEach(chat => {
				chatMap[chat.id] = chat;
			});
			recentItems.forEach(recentItem => {
				const {
					counter,
					chatId
				} = recentItem;
				if (counter === 0) {
					return;
				}
				chatMap[chatId] = {
					...chatMap[chatId],
					counter
				};
			});
			return Object.values(chatMap);
		}
		#getLastMessageDate(restResult) {
			const messages = this.#filterPinnedItemsMessages(restResult);
			if (messages.length === 0) {
				return '';
			}

			// comparing strings in atom format works correctly because the format is lexically sortable
			let firstMessageDate = messages[0].date;
			messages.forEach(message => {
				if (message.date < firstMessageDate) {
					firstMessageDate = message.date;
				}
			});
			return firstMessageDate;
		}
		#filterPinnedItemsMessages(restResult) {
			const {
				messages,
				recentItems,
				sectionMeta
			} = restResult;
			const fixedChatIds = sectionMeta ? sectionMeta.fixedChatIds : [];
			return messages.filter(message => {
				const chatId = message.chat_id;
				const recentItem = recentItems.find(item => {
					return item.chatId === chatId;
				});
				const isPinnedItem = recentItem.pinned === true;
				const isFixedItem = fixedChatIds.includes(chatId);
				return !isPinnedItem && !isFixedItem;
			});
		}
	}

	class TaskRecentService extends BaseRecentService {
		getRecentType() {
			return im_v2_const.RecentType.taskComments;
		}
	}

	class CalendarRecentService extends BaseRecentService {
		getRecentType() {
			return im_v2_const.RecentType.calendar;
		}
	}

	exports.BaseRecentService = BaseRecentService;
	exports.CalendarRecentService = CalendarRecentService;
	exports.LegacyRecentService = LegacyRecentService;
	exports.TaskRecentService = TaskRecentService;
	exports.UnreadRecentService = UnreadRecentService;

})(this.BX.Messenger.v2.Service = this.BX.Messenger.v2.Service || {}, BX.Messenger.v2.Application, BX.Messenger.v2.Const, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib);
//# sourceMappingURL=registry.bundle.js.map
