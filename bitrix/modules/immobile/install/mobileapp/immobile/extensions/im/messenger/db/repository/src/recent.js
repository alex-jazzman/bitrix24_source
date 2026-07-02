/**
 * @module im/messenger/db/repository/recent
 */
jn.define('im/messenger/db/repository/recent', (require, exports, module) => {
	const { Type } = require('type');
	const { Feature } = require('im/messenger/lib/feature');
	const { DateHelper } = require('im/messenger/lib/helper');
	const { DialogType } = require('im/messenger/const');
	const { Uuid } = require('utils/uuid');

	const {
		RecentTable,
		UserTable,
		MessageTable,
		FileTable,
		StickerTable,
		DraftTable,
	} = require('im/messenger/db/table');
	const { validateRestItem } = require('im/messenger/db/repository/validators/recent');
	const { Query } = require('im/messenger/db/query-builder/builder');
	const { equalField } = require('im/messenger/db/query-builder/condition');
	const {
		RecentSchema,
		DialogSchema,
		DraftSchema,
	} = require('im/messenger/db/table-schema');

	/**
	 * @class RecentRepository
	 */
	class RecentRepository
	{
		constructor()
		{
			this.recentTable = new RecentTable();
			this.userTable = new UserTable();
			this.messageTable = new MessageTable();
			this.fileTable = new FileTable();
			this.stickerTable = new StickerTable();
			this.draftTable = new DraftTable();
		}

		async getList()
		{
			return [];
		}

		/**
		 * @param {PinnedListByDialogTypeFilter} filter
		 * @return {Promise<{items: Array, users: Array}>}
		 */
		async getPinnedListByDialogTypeFilter(filter = {})
		{
			return this.recentTable.getPinnedListByDialogTypeFilter(filter);
		}

		/**
		 * @param {ListByDialogTypeFilter} filter
		 * @return {Promise<{
		 * items: Array<RecentStoredData>,
		 * users: Array<UserStoredData>,
		 * messages: Array,
		 * files: Array,
		 * hasMore: boolean
		 * }>}
		*/
		async getListByDialogTypeFilter(filter = {})
		{
			return this.recentTable.getListByDialogTypeFilter(filter);
		}

		/**
		 * Fetches recent items by chatIds, resolving dialogIds via DialogSchema.
		 * Required for folders: 1-on-1 chats use `dialogId = userId` (numeric string),
		 * not `chat${chatId}`, so a direct mapping by chatId fails to find them.
		 *
		 * @param {Array<number>} chatIds
		 * @return {Promise<RecentPage>}
		 */
		async getByChatIds(chatIds)
		{
			const numericChatIds = Type.isArray(chatIds) ? chatIds.filter((id) => Type.isNumber(id)) : [];
			if (!Feature.isLocalStorageEnabled || numericChatIds.length === 0)
			{
				return {
					items: [],
					users: [],
					messages: [],
					files: [],
					stickers: [],
					draft: [],
					hasMore: false,
				};
			}

			const result = await Query.select()
				.from(RecentSchema)
				.innerJoin(DialogSchema, equalField(RecentSchema.id, DialogSchema.dialogId))
				.leftJoin(DraftSchema, equalField(RecentSchema.id, DraftSchema.dialogId))
				.where(DialogSchema.chatId.in(numericChatIds))
				.execute();

			const items = result.map((row) => {
				const recentData = row.extract(RecentSchema);
				recentData.chat = row.extract(DialogSchema);

				return recentData;
			});

			const related = await this.#fetchRelatedData(items);

			return {
				items,
				...related,
				hasMore: false,
			};
		}

		async saveFromModel(recentList)
		{
			const recentListToAdd = [];

			recentList.forEach((item) => {
				const itemToAdd = this.recentTable.validate(item);

				recentListToAdd.push(itemToAdd);
			});

			return this.recentTable.add(recentListToAdd, true);
		}

		/**
		 * @param {SyncListResult['addedRecent']} recentList
		 * @return {Promise<*>}
		 */
		async saveFromRest(recentList)
		{
			const recentListToAdd = [];

			recentList.forEach((item) => {
				const restItemToAdd = validateRestItem(item);
				const itemToAdd = this.recentTable.validate(restItemToAdd);

				recentListToAdd.push(itemToAdd);
			});

			return this.recentTable.add(recentListToAdd, true);
		}

		async saveFromPush(recentList)
		{
			const recentListMergePromiseList = [];
			recentList.forEach((recentItem) => {
				const recentItemToAdd = this.validatePushRecentItem(recentItem);
				const mergePromise = this.recentTable.merge(recentItemToAdd.id, (existingRecentItem) => {
					return {
						...existingRecentItem,
						...recentItemToAdd,
					};
				});

				recentListMergePromiseList.push(mergePromise);
			});

			return Promise.all(recentListMergePromiseList);
		}

		/**
		 * @param {DialogId} dialogId
		 */
		async deleteById(dialogId)
		{
			return this.recentTable.deleteByIdList([dialogId]);
		}

		/**
		 * @param fields
		 * @return {Partial<RecentStoredData>}
		 */
		validatePushRecentItem(fields)
		{
			const result = {
				options: {},
			};

			if (Type.isNumber(fields.id) || Type.isStringFilled(fields.id))
			{
				result.id = fields.id.toString();
			}

			if (Type.isBoolean(fields.pinned))
			{
				result.pinned = fields.pinned;
			}

			if (Type.isBoolean(fields.liked))
			{
				result.liked = fields.liked;
			}

			if (Type.isBoolean(fields.unread))
			{
				result.unread = fields.unread;
			}

			if (Type.isString(fields.dateMessage) || Type.isDate(fields.dateMessage))
			{
				result.dateMessage = DateHelper.cast(fields.dateMessage, null);
			}
			else if (Type.isUndefined(fields.dateMessage) && Type.isPlainObject(fields.message))
			{
				result.dateMessage = DateHelper.cast(fields.message.date);
			}

			if (Type.isString(fields.date_last_activity))
			{
				fields.dateLastActivity = fields.date_last_activity;
			}

			if (Type.isString(fields.dateLastActivity))
			{
				fields.lastActivityDate = fields.dateLastActivity;
			}

			if (Type.isString(fields.lastActivityDate) || Type.isDate(fields.lastActivityDate))
			{
				result.lastActivityDate = DateHelper.cast(fields.lastActivityDate, null);
			}
			else if (Type.isUndefined(fields.lastActivityDate) && Type.isPlainObject(fields.message))
			{
				result.lastActivityDate = DateHelper.cast(fields.message.date);
			}

			// TODO: move part to file model

			if (Type.isPlainObject(fields.message))
			{
				result.message = this.prepareRecentMessage(fields);
			}

			if (Type.isPlainObject(fields.invited))
			{
				result.invitation = {
					isActive: true,
					originator: fields.invited.originator_id,
					canResend: fields.invited.can_resend,
				};
				result.options.defaultUserRecord = true;
			}
			else if (fields.invited === false)
			{
				result.invitation = {
					isActive: false,
					originator: 0,
					canResend: false,
				};
				result.options.defaultUserRecord = true;
			}
			else if (Type.isPlainObject(fields.invitation))
			{
				result.invitation = fields.invitation;
				// result.options.defaultUserRecord = true;
			}

			if (Type.isPlainObject(fields.options))
			{
				if (!result.options)
				{
					result.options = {};
				}

				if (Type.isBoolean(fields.options.default_user_record))
				{
					fields.options.defaultUserRecord = fields.options.default_user_record;
				}

				if (Type.isBoolean(fields.options.defaultUserRecord))
				{
					result.options.defaultUserRecord = fields.options.defaultUserRecord;
				}

				if (Type.isBoolean(fields.options.birthdayPlaceholder))
				{
					result.options.birthdayPlaceholder = fields.options.birthdayPlaceholder;
				}
			}

			return result;
		}

		/**
		 * @param {string} searchText
		 * @param {'asc'|'desc'} order='asc'
		 * @param {number} limit=25
		 * @param {DialoguesFilter | {}} filter
		 *
		 * @returns {Promise<{items: *[]}>}
		 */
		async searchByText({
			searchText,
			order = 'desc',
			limit = 25,
			filter = {},
		})
		{
			return this.recentTable.searchByText(searchText, order, limit, filter);
		}

		/**
		 * Fetches all related data (users, messages, files, stickers, draft) for a list of recent items.
		 *
		 * @param {Array<object>} items
		 * @return {Promise<{users: Array, messages: Array, files: Array, stickers: Array, draft: Array}>}
		 */
		async #fetchRelatedData(items)
		{
			const [usersResult, messagesResult, filesResult, stickersResult, draftsResult] = await Promise.all([
				this.userTable.getListByIds(this.#extractUserIds(items)),
				this.messageTable.getListByIds(this.#extractMessageIds(items)),
				this.fileTable.getListByIds(this.#extractFileIds(items)),
				this.stickerTable.getStickerList(this.#extractStickerRelations(items)),
				this.draftTable.getListByIds(items.map((item) => item.id)),
			]);

			return {
				users: usersResult.items,
				messages: messagesResult.items,
				files: filesResult.items,
				stickers: stickersResult.items,
				draft: draftsResult.items,
			};
		}

		/**
		 * @param {Array<object>} items
		 * @return {Array<number>}
		 */
		#extractUserIds(items)
		{
			const userIds = [];

			for (const item of items)
			{
				const senderId = item?.message?.senderId ?? 0;
				if (senderId !== 0)
				{
					userIds.push(Number(senderId));
				}

				if ([DialogType.user, DialogType.private].includes(item.chat?.type))
				{
					userIds.push(Number(item.chat.dialogId));
				}
			}

			return [...new Set(userIds)];
		}

		/**
		 * @param {Array<object>} items
		 * @return {Array<number>}
		 */
		#extractMessageIds(items)
		{
			const messageIds = [];

			for (const item of items)
			{
				if (Type.isNumber(item.message?.id) && item.message.id > 0)
				{
					messageIds.push(item.message.id);
				}
			}

			return [...new Set(messageIds)];
		}

		/**
		 * @param {Array<object>} items
		 * @return {Array<number>}
		 */
		#extractFileIds(items)
		{
			const fileIds = [];

			for (const item of items)
			{
				if (!Type.isNil(item.message?.params?.withFile?.id))
				{
					fileIds.push(Number(item.message.params.withFile.id));
				}

				if (Type.isArrayFilled(item.message?.params?.withFile))
				{
					for (const id of item.message.params.withFile)
					{
						fileIds.push(Number(id));
					}
				}
			}

			return [...new Set(fileIds)];
		}

		/**
		 * @param {Array<object>} items
		 * @return {Array<object>}
		 */
		#extractStickerRelations(items)
		{
			const relations = [];

			for (const item of items)
			{
				if (Type.isPlainObject(item.message?.sticker))
				{
					relations.push(item.message.sticker);
				}
			}

			return relations;
		}

		prepareRecentMessage(fields)
		{
			const message = {};
			const params = {};

			if (
				Type.isNumber(fields.message.id)
				|| Type.isStringFilled(fields.message.id)
				|| Uuid.isV4(fields.message.id)
			)
			{
				message.id = fields.message.id;
			}

			if (Type.isString(fields.message.text))
			{
				message.text = fields.message.text;
			}

			if (Type.isStringFilled(fields.message.subTitleIcon))
			{
				message.subTitleIcon = fields.message.subTitleIcon;
			}
			else
			{
				message.subTitleIcon = '';
			}

			if (
				Type.isStringFilled(fields.message.attach)
				|| Type.isBoolean(fields.message.attach)
				|| Type.isArray(fields.message.attach)
			)
			{
				params.withAttach = fields.message.attach;
			}
			else if (
				Type.isStringFilled(fields.message.params?.withAttach)
				|| Type.isBoolean(fields.message.params?.withAttach)
				|| Type.isArray(fields.message.params?.withAttach)
			)
			{
				params.withAttach = fields.message.params.withAttach;
			}

			if (Type.isBoolean(fields.message.file) || Type.isPlainObject(fields.message.file))
			{
				params.withFile = fields.message.file;
			}

			if (
				Type.isBoolean(fields.message.params?.withFile)
				|| Type.isPlainObject(fields.message.params?.withFile)
				|| Type.isArrayFilled(fields.message.params?.withFile)
			)
			{
				params.withFile = fields.message.params.withFile;
			}

			if (Type.isDate(fields.message.date) || Type.isString(fields.message.date))
			{
				message.date = DateHelper.cast(fields.message.date);
			}

			if (Type.isNumber(fields.message.author_id))
			{
				message.senderId = fields.message.author_id;
			}
			else if (Type.isNumber(fields.message.authorId))
			{
				message.senderId = fields.message.authorId;
			}
			else if (Type.isNumber(fields.message.senderId))
			{
				message.senderId = fields.message.senderId;
			}

			if (Type.isStringFilled(fields.message.status))
			{
				message.status = fields.message.status;
			}

			if (Type.isBoolean(fields.message.sending))
			{
				message.sending = fields.message.sending;
			}

			if (Object.keys(params).length > 0)
			{
				message.params = params;
			}

			return message;
		}
	}

	module.exports = {
		RecentRepository,
	};
});
