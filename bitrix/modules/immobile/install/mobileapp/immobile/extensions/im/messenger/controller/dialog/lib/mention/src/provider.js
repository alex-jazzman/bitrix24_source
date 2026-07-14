/**
 * @module im/messenger/controller/dialog/lib/mention/provider
 */
jn.define('im/messenger/controller/dialog/lib/mention/provider', (require, exports, module) => {
	const { Type } = require('type');
	const {
		ChatSearchProvider,
		DialogLocalSearchStrategy,
		DefaultServerSearchStrategy,
		getWordsFromText,
	} = require('im/messenger/lib/chat-search');
	const { MentionConfig } = require('im/messenger/controller/dialog/lib/mention/config');
	const { ChatService } = require('im/messenger/provider/services/chat');
	const { Logger } = require('im/messenger/lib/logger');
	const { UserType, DialogType } = require('im/messenger/const');
	const { MessengerParams } = require('im/messenger/lib/params');
	const { DialogHelper } = require('im/messenger/lib/helper');

	const LIMIT_LOCAL_SEARCH_USERS = 100;

	const DEFAULT_EXCEPT_DIALOG_TYPES = [
		DialogType.copilot,
		DialogType.lines,
		DialogType.comment,
		DialogType.tasksTask,
	];

	class MentionProvider extends ChatSearchProvider
	{
		/** @type {Record<string, boolean>} */
		#membershipMap;
		/** @type {boolean} */
		#isMembershipMapLoaded;
		/** @type {() => boolean} */
		#canAddParticipants;

		constructor(params)
		{
			const config = new MentionConfig();
			const filter = params.filter ?? {};
			const dialogTypes = filter.dialogTypes ?? [];
			const exceptDialogTypes = Type.isArrayFilled(dialogTypes)
				? []
				: filter.exceptDialogTypes ?? DEFAULT_EXCEPT_DIALOG_TYPES;

			super({
				localStrategy: new DialogLocalSearchStrategy({ dialogTypes, exceptDialogTypes }),
				serverStrategy: new DefaultServerSearchStrategy({ config }),
			});
			this.setCallbacks(params);

			/**
			 * @protected
			 * @type {MentionConfig}
			 */
			this.config = config;

			this.dialogId = params.dialogId;
			this.chatParticipants = [];
			this.isChatParticipantsLoaded = false;
			this.#canAddParticipants = params.canAddParticipants;
			this.#membershipMap = {};
			this.#isMembershipMapLoaded = false;

			/**
			 * @protected
			 * @type {ChatService}
			 */
			this.chatService = new ChatService();
		}

		/**
		 * @return {Record<string, boolean>}
		 */
		get membershipMap()
		{
			return this.#membershipMap;
		}

		/**
		 * @return {boolean}
		 */
		get isMembershipMapLoaded()
		{
			return this.#isMembershipMapLoaded;
		}

		get canAddParticipants()
		{
			return Type.isFunction(this.#canAddParticipants) ? this.#canAddParticipants() : false;
		}

		/**
		 * @param {number} chatId
		 */
		initConfig({ chatId } = {}) {
			if (chatId)
			{
				this.setOptionConfig(chatId);
			}
		}

		/**
		 * @param {number} chatId
		 */
		setOptionConfig(chatId)
		{
			this.config.setOption({ contextChatId: chatId });
		}

		/**
		 * @param {string} userId
		 * @param {boolean} isParticipant
		 */
		updateMembershipMap(userId, isParticipant)
		{
			this.#membershipMap[String(userId)] = Boolean(isParticipant);
		}

		loadRecentUsers()
		{
			return this.store.getters['recentModel/getSortedCollection']()
				.sort((item1, item2) => item2.dateMessage - item1.dateMessage)
				.filter((item) => this.filterRecentItem(item))
				.map((recentItem) => recentItem.id)
			;
		}

		/**
		 * @protected
		 * @param {RecentModelState} item
		 * @return {boolean}
		 */
		filterRecentItem(item)
		{
			if (!DialogHelper.isChatId(item.id))
			{
				return false;
			}

			const userItem = this.store.getters['usersModel/getById'](item.id);

			if (Type.isNil(userItem))
			{
				return false;
			}

			return userItem.type === UserType.user && Number(item.id) !== MessengerParams.getUserId();
		}

		/**
		 * @return {Promise<Array<number>>}
		 */
		async loadChatParticipants()
		{
			if (this.isChatParticipantsLoaded)
			{
				return this.chatParticipants;
			}

			try
			{
				const participants = await this.chatService.getMentionListByChat(this.dialogId);
				await this.processChatParticipantsResult(participants);
				this.isChatParticipantsLoaded = true;
			}
			catch (error)
			{
				Logger.error(`${this.constructor.name}.loadChatParticipants error`, error);
			}

			return this.chatParticipants;
		}

		/**
		 * @param {{users: Array<RawUser>}} ajaxResult
		 */
		async processChatParticipantsResult(ajaxResult)
		{
			const users = ajaxResult?.users;
			if (!Type.isArrayFilled(users))
			{
				return;
			}

			await this.serverStrategy.storeUpdater.setUsersToModel(users);

			users.forEach((user) => {
				const userId = user.id;

				this.chatParticipants.push(userId);
				this.#membershipMap[userId] = true;
			});
		}

		/**
		 * @return {Promise<Array<string>>}
		 */
		async loadChatUsersMembership()
		{
			const dialogHelper = DialogHelper.createByDialogId(this.dialogId);
			if (!dialogHelper)
			{
				return [];
			}

			if (this.#isMembershipMapLoaded)
			{
				return [];
			}

			const localUsers = await this.localStrategy.preload({
				types: [DialogType.private, DialogType.user],
				limit: LIMIT_LOCAL_SEARCH_USERS,
			});

			for (const userId of localUsers)
			{
				this.#membershipMap[userId] = false;
			}

			return this.#loadMembershipDataFromServer(localUsers, dialogHelper);
		}

		/**
		 * @protected
		 * @param {string} text
		 * @return {Promise<void>}
		 */
		async doSearchInternal(text)
		{
			if (text.length === 0)
			{
				this.loadSearchProcessedCallback([], false);

				return;
			}

			const wordsFromText = getWordsFromText(text);

			const localSearchResult = await this.#localSearch(wordsFromText);
			const preparedSearchingIds = this.#prepareLocalSearchResult(localSearchResult);

			const needSearchFromServer = text.length >= this.minSearchSize;
			this.loadSearchProcessedCallback(preparedSearchingIds, needSearchFromServer);

			if (!needSearchFromServer)
			{
				return;
			}

			void this.searchOnServerDelayed(wordsFromText, text, preparedSearchingIds);
		}

		/**
		 * @protected
		 * @param {Array<string>} searchingWords
		 * @param {string} originalQuery
		 * @param {Array<string>} localSearchingIds
		 */
		searchOnServer(searchingWords, originalQuery, localSearchingIds)
		{
			void this.serverStrategy.search(searchingWords, originalQuery)
				.then((response) => {
					const { items } = response.dialog;

					this.fillSearchDateCache(items);

					this.#onSearchServerSuccess(items, originalQuery, localSearchingIds);
				})
				.catch((error) => {
					this.logger.error(error);
				})
			;
		}

		/**
		 * @param {Array<RecentSearchResult>} items
		 * @param {string} originalQuery
		 * @param {Array<string>} localSearchingIds
		 */
		#onSearchServerSuccess(items, originalQuery, localSearchingIds)
		{
			const dialogIds = items.map((item) => {
				const { customData, id } = item;
				const { isContextChatMember } = customData;
				if (Type.isBoolean(isContextChatMember))
				{
					this.#membershipMap[id] = isContextChatMember;
				}

				return id;
			});

			const mergedDialogIds = this.merge(localSearchingIds, dialogIds);
			const resultedDialogIds = this.sortByDate(mergedDialogIds);

			this.loadSearchCompleteCallBack(resultedDialogIds, originalQuery);
		}

		/**
		 * @param {Array<string>} userIds
		 * @return {Array<string>}
		 */
		#prepareLocalSearchResult(userIds)
		{
			return this.sortByDate(userIds)
				.filter((dialogId) => {
					const dialogHelper = DialogHelper.createByDialogId(dialogId);
					if (!this.canAddParticipants)
					{
						return true;
					}

					if (!DialogHelper.isDialogId(this.dialogId) || !dialogHelper?.isDirect)
					{
						return true;
					}

					return Type.isBoolean(this.#membershipMap[dialogId]);
				});
		}

		/**
		 * @param {Array<string>} wordsFromText
		 * @return {Promise<Array<string>>}
		 */
		async #localSearch(wordsFromText)
		{
			try
			{
				return await this.localStrategy.search({
					searchText: wordsFromText.join(' '),
				});
			}
			catch (error)
			{
				this.logger.error(`${this.constructor.name}.#localSearch error:`, error);

				return [];
			}
		}

		/**
		 * @param {Array<string>} users
		 * @param {DialogHelper} dialogHelper
		 * @return {Promise<Array<string>>}
		 */
		async #loadMembershipDataFromServer(users, dialogHelper)
		{
			if (!Type.isArrayFilled(users))
			{
				this.#isMembershipMapLoaded = true;

				return [];
			}

			const notParticipantsIds = new Set(users);

			try
			{
				const verifiedMembers = await this.chatService.verifyUsersChatMembership(dialogHelper.chatId, users);
				for (const member of verifiedMembers.relations)
				{
					const userId = String(member.userId);
					this.#membershipMap[userId] = true;
					notParticipantsIds.delete(userId);
				}

				this.#isMembershipMapLoaded = true;
			}
			catch (error)
			{
				Logger.error(`${this.constructor.name}.#loadMembershipDataFromServer error`, error);
			}

			return [...notParticipantsIds];
		}

		closeSession()
		{
			super.closeSession();

			this.isChatParticipantsLoaded = false;
			this.chatParticipants = [];
		}
	}

	module.exports = { MentionProvider };
});
