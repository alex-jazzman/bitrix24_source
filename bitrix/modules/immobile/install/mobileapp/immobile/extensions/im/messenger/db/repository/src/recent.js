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
	const { expressionField } = require('im/messenger/db/schema/field');
	const { getStartWordsSearchCondition } = require('im/messenger/db/helper/start-words');
	const {
		RecentSchema,
		RecentSectionSchema,
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
			await this.deleteSectionsByDialogId(dialogId);

			return this.recentTable.deleteByIdList([dialogId]);
		}

		/**
		 * Batch delete recent items with their sections.
		 *
		 * @param {Array<string>} dialogIds
		 * @return {Promise<void>}
		 */
		async deleteByIds(dialogIds)
		{
			if (!Type.isArrayFilled(dialogIds))
			{
				return;
			}

			return Promise.all([
				this.deleteSectionsByDialogIds(dialogIds),
				this.recentTable.deleteByIdList(dialogIds),
			]);
		}

		// ─── section-based queries ────────────────────────────────────

		/**
		 * @param {object} filter
		 * @param {string} filter.section
		 * @param {number|null} [filter.parentChatId]
		 * @param {string|null} [filter.lastActivityDate]
		 * @param {number} [filter.limit]
		 * @return {Promise<RecentPage>}
		 */
		async getListBySectionFilter({
			section,
			parentChatId = null,
			lastActivityDate = null,
			limit = 50,
		})
		{
			if (!Feature.isLocalStorageEnabled)
			{
				return { items: [], users: [], messages: [], files: [], stickers: [], draft: [], hasMore: false };
			}

			const result = await Query.select()
				.from(RecentSchema)
				.innerJoin(DialogSchema, equalField(RecentSchema.id, DialogSchema.dialogId))
				.innerJoin(RecentSectionSchema, equalField(RecentSchema.id, RecentSectionSchema.dialogId))
				.leftJoin(DraftSchema, equalField(RecentSchema.id, DraftSchema.dialogId))
				.where(
					RecentSectionSchema.section.equal(section),
					Type.isNumber(parentChatId) && DialogSchema.parentChatId.equal(parentChatId),
					lastActivityDate && RecentSchema.lastActivityDate.lessThan(lastActivityDate),
				)
				.orderBy(
					RecentSchema.pinned.desc(),
					DraftSchema.lastActivityDate.desc().nullsLast(),
					RecentSchema.lastActivityDate.desc(),
				)
				.limit(limit)
				.execute()
			;

			const items = result.map((row) => {
				const recentData = row.extract(RecentSchema);
				recentData.chat = row.extract(DialogSchema);

				return recentData;
			});

			const [related, hasMore] = await Promise.all([
				this.#fetchRelatedData(items),
				this.#hasMoreBySectionFilter({
					section,
					parentChatId,
					lastActivityDate: items[items.length - 1]?.lastActivityDate?.toISOString() ?? null,
				}),
			]);

			return {
				items,
				...related,
				hasMore,
			};
		}

		/**
		 * Fetches recent items by their dialogIds without section filtering.
		 * Use this to load fixed/pinned items (e.g. parent chat) into the store
		 * separately from the scrollable collection.
		 *
		 * @param {Array<string>} dialogIds
		 * @return {Promise<RecentPage>}
		 */
		async getByDialogIds(dialogIds)
		{
			if (!Feature.isLocalStorageEnabled || !Type.isArrayFilled(dialogIds))
			{
				return { items: [], users: [], messages: [], files: [], stickers: [], draft: [], hasMore: false };
			}

			const result = await Query.select()
				.from(RecentSchema)
				.innerJoin(DialogSchema, equalField(RecentSchema.id, DialogSchema.dialogId))
				.leftJoin(DraftSchema, equalField(RecentSchema.id, DraftSchema.dialogId))
				.where(RecentSchema.id.in(dialogIds))
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
				return { items: [], users: [], messages: [], files: [], stickers: [], draft: [], hasMore: false };
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

		/**
		 * @param {object} params
		 * @param {string} params.searchText
		 * @param {string} params.section
		 * @param {number | null} [params.parentChatId]
		 * @param {number} [params.limit]
		 * @return {Promise<{items: Array}>}
		 */
		async searchByText({
			searchText,
			section,
			parentChatId = null,
			limit = 25,
		})
		{
			if (!Feature.isLocalStorageEnabled)
			{
				return { items: [] };
			}

			const result = await Query.select()
				.from(RecentSchema)
				.innerJoin(DialogSchema, equalField(RecentSchema.id, DialogSchema.dialogId))
				.innerJoin(RecentSectionSchema, equalField(RecentSchema.id, RecentSectionSchema.dialogId))
				.where(
					RecentSectionSchema.section.equal(section),
					Type.isNumber(parentChatId) && DialogSchema.parentChatId.equal(parentChatId),
					getStartWordsSearchCondition(DialogSchema.name, searchText),
				)
				.orderBy(RecentSchema.lastActivityDate.desc())
				.limit(limit)
				.execute()
			;

			const items = result.map((row) => {
				const recentData = row.extract(RecentSchema);
				recentData.chat = row.extract(DialogSchema);

				return recentData;
			});

			return { items };
		}

		/**
		 * @param {object} filter
		 * @param {string} filter.section
		 * @param {number|null} [filter.parentChatId]
		 * @param {string|null} [filter.lastActivityDate]
		 * @return {Promise<boolean>}
		 */
		async #hasMoreBySectionFilter({ section, parentChatId = null, lastActivityDate = null })
		{
			if (!lastActivityDate)
			{
				return false;
			}

			const query = Query.select()
				.from(RecentSchema)
				.innerJoin(RecentSectionSchema, equalField(RecentSchema.id, RecentSectionSchema.dialogId))
				.setSelect(expressionField('1', 'hasMore'))
				.where(
					RecentSectionSchema.section.equal(section),
					RecentSchema.lastActivityDate.lessThan(lastActivityDate),
				)
				.limit(1);

			if (!Type.isNull(parentChatId))
			{
				query
					.innerJoin(DialogSchema, equalField(RecentSchema.id, DialogSchema.dialogId))
					.where(DialogSchema.parentChatId.equal(parentChatId));
			}

			const result = await query.execute();

			return result.length > 0;
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

		// ─── recent sections ──────────────────────────────────────────

		/**
		 * Full replace of sections for a dialog.
		 * Deletes all existing sections, then inserts the new set.
		 *
		 * @param {string} dialogId
		 * @param {Array<string>} sections
		 * @return {Promise<void>}
		 */
		async setSections(dialogId, sections)
		{
			if (!Feature.isLocalStorageEnabled)
			{
				return;
			}

			if (!Type.isStringFilled(dialogId) || !Type.isArray(sections))
			{
				return;
			}

			await Query.delete()
				.from(RecentSectionSchema)
				.where(RecentSectionSchema.dialogId.equal(dialogId))
				.execute();

			if (!Type.isArrayFilled(sections))
			{
				return;
			}

			await Query.insertOrIgnore()
				.from(RecentSectionSchema)
				.values(sections.map((section) => ({ dialogId, section })))
				.execute();
		}

		/**
		 * Batch ensure that dialogs belong to a section.
		 * Does not remove existing sections — only adds missing ones.
		 *
		 * @param {Array<string>} dialogIds
		 * @param {string} section
		 * @return {Promise<void>}
		 */
		async ensureSectionForDialogIds(dialogIds, section)
		{
			if (!Feature.isLocalStorageEnabled)
			{
				return;
			}

			if (!Type.isArrayFilled(dialogIds) || !Type.isStringFilled(section))
			{
				return;
			}

			await Query.insertOrIgnore()
				.from(RecentSectionSchema)
				.values(dialogIds.map((dialogId) => ({ dialogId, section })))
				.execute();
		}

		/**
		 * Remove specific sections for a dialog.
		 * Leaves other sections untouched.
		 *
		 * @param {string} dialogId
		 * @param {Array<string>} sections
		 * @return {Promise<void>}
		 */
		async removeSections(dialogId, sections)
		{
			if (!Feature.isLocalStorageEnabled)
			{
				return;
			}

			if (!Type.isStringFilled(dialogId) || !Type.isArrayFilled(sections))
			{
				return;
			}

			await Query.delete()
				.from(RecentSectionSchema)
				.where(
					RecentSectionSchema.dialogId.equal(dialogId),
					RecentSectionSchema.section.in(sections),
				)
				.execute();
		}

		/**
		 * @param {string} dialogId
		 * @return {Promise<void>}
		 */
		async deleteSectionsByDialogId(dialogId)
		{
			if (!Feature.isLocalStorageEnabled)
			{
				return;
			}

			if (!Type.isStringFilled(dialogId))
			{
				return;
			}


			await Query.delete()
				.from(RecentSectionSchema)
				.where(RecentSectionSchema.dialogId.equal(dialogId))
				.execute();
		}

		/**
		 * @param {Array<string>} dialogIds
		 * @return {Promise<void>}
		 */
		async deleteSectionsByDialogIds(dialogIds)
		{
			if (!Feature.isLocalStorageEnabled)
			{
				return;
			}

			if (!Type.isArrayFilled(dialogIds))
			{
				return;
			}

			await Query.delete()
				.from(RecentSectionSchema)
				.where(RecentSectionSchema.dialogId.in(dialogIds))
				.execute();
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
