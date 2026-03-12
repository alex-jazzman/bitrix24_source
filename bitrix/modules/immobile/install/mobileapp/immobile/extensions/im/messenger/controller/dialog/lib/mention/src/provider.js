/**
 * @module im/messenger/controller/dialog/lib/mention/provider
 */
jn.define('im/messenger/controller/dialog/lib/mention/provider', (require, exports, module) => {
	const { Type } = require('type');
	const { RecentProvider } = require('im/messenger/controller/search/experimental');
	const { MentionConfig } = require('im/messenger/controller/dialog/lib/mention/config');
	const { Logger } = require('im/messenger/lib/logger');
	const { runAction } = require('im/messenger/lib/rest');
	const { RestMethod, UserType } = require('im/messenger/const');
	const { MessengerParams } = require('im/messenger/lib/params');
	const { DialogHelper } = require('im/messenger/lib/helper');

	class MentionProvider extends RecentProvider
	{
		constructor(params)
		{
			super(params);
			this.dialogId = params.dialogId;
			this.chatParticipants = [];
			this.isChatParticipantsLoaded = false;
		}

		initConfig()
		{
			this.config = new MentionConfig();
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

			const queryParams = {
				order: {
					lastSendMessageId: 'desc',
				},
				dialogId: this.dialogId,
				limit: 50,
			};

			try
			{
				const ajaxResult = await runAction(RestMethod.imV2ChatMentionList, {
					data: queryParams,
				});

				this.chatParticipants = this.processChatParticipantsResult(ajaxResult);
				this.isChatParticipantsLoaded = true;
			}
			catch (error)
			{
				Logger.error(`${this.constructor.name}.loadChatParticipants error`, error);
			}

			return this.chatParticipants;
		}

		/**
		 *
		 * @param {{users: Array<RawUser>}} ajaxResult
		 * @return {Array<number>}
		 */
		async processChatParticipantsResult(ajaxResult)
		{
			const users = ajaxResult?.users;
			if (!Type.isArrayFilled(users))
			{
				return [];
			}

			await this.serverService.storeUpdater.setUsersToModel(users);

			return users.map((user) => user.id);
		}

		closeSession()
		{
			super.closeSession();
			this.isChatParticipantsLoaded = false;
			this.chatParticipants = [];
		}

		loadMessengerRecentUsers()
		{
			return this.messengerStore.getters['recentModel/getSortedCollection']()
				.sort((item1, item2) => item2.dateMessage - item1.dateMessage)
				.map((recentItem) => recentItem.id)
				.filter((recentId) => !String(recentId).startsWith('chat'))
			;
		}
	}

	module.exports = { MentionProvider };
});
