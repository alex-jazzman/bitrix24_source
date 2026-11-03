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
	const { equalField, or, isNull } = require('im/messenger/db/query-builder/condition');
	const { expressionField } = require('im/messenger/db/schema/field');
	const { getStartWordsSearchCondition } = require('im/messenger/db/helper/start-words');
	const {
		RecentSchema,
		RecentSectionSchema,
		DialogSchema,
		DraftSchema,
		UserSchema,
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
				return this.#emptyPage();
			}

			const result = await Query.select()
				.from(RecentSchema)
				.innerJoin(DialogSchema, equalField(RecentSchema.id, DialogSchema.dialogId))
				.innerJoin(RecentSectionSchema, equalField(RecentSchema.id, RecentSectionSchema.dialogId))
				.leftJoin(DraftSchema, equalField(RecentSchema.id, DraftSchema.dialogId))
				.leftJoin(UserSchema, equalField(RecentSchema.id, UserSchema.id))
				.where(
					RecentSectionSchema.section.equal(section),
					Type.isNumber(parentChatId) && DialogSchema.parentChatId.equal(parentChatId),
					lastActivityDate && RecentSchema.lastActivityDate.lessThan(lastActivityDate),
					or(isNull(UserSchema.id), UserSchema.active.equal(true)),
				)
				.orderBy(
					RecentSchema.pinned.desc(),
					DraftSchema.lastActivityDate.desc().nullsLast(),
					RecentSchema.lastActivityDate.desc(),
				)
				.limit(limit)
				.execute()
			;

			const items = this.#extractItems(result);

			const [related, hasMore] = await Promise.all([
				this.#fetchRelatedData(items),
				this.#hasMoreBelowCursor({
					sectionCondition: RecentSectionSchema.section.equal(section),
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
		 * Multi-section variant of getListBySectionFilter: a page of the union of the given
		 * sections. A chat that belongs to several of them is returned once.
		 *
		 * @param {object} filter
		 * @param {Array<string>|Set<string>} filter.sections
		 * @param {number|null} [filter.parentChatId]
		 * @param {string|null} [filter.lastActivityDate]
		 * @param {number} [filter.limit]
		 * @return {Promise<RecentPage>}
		 */
		async getListBySectionsFilter({
			sections,
			parentChatId = null,
			lastActivityDate = null,
			limit = 50,
		})
		{
			const sectionList = this.#toSectionList(sections);
			if (!Feature.isLocalStorageEnabled || sectionList.length === 0)
			{
				return this.#emptyPage();
			}

			const result = await Query.select()
				.from(RecentSchema)
				.innerJoin(DialogSchema, equalField(RecentSchema.id, DialogSchema.dialogId))
				.innerJoin(RecentSectionSchema, equalField(RecentSchema.id, RecentSectionSchema.dialogId))
				.leftJoin(DraftSchema, equalField(RecentSchema.id, DraftSchema.dialogId))
				.leftJoin(UserSchema, equalField(RecentSchema.id, UserSchema.id))
				.where(
					RecentSectionSchema.section.in(sectionList),
					Type.isNumber(parentChatId) && DialogSchema.parentChatId.equal(parentChatId),
					lastActivityDate && RecentSchema.lastActivityDate.lessThan(lastActivityDate),
					or(isNull(UserSchema.id), UserSchema.active.equal(true)),
				)
				// the section join multiplies a chat by its sections: collapse back to one row per dialog
				.groupBy(RecentSchema.id)
				.orderBy(
					RecentSchema.pinned.desc(),
					DraftSchema.lastActivityDate.desc().nullsLast(),
					RecentSchema.lastActivityDate.desc(),
				)
				.limit(limit)
				.execute()
			;

			const items = this.#extractItems(result);

			const [related, hasMore] = await Promise.all([
				this.#fetchRelatedData(items),
				this.#hasMoreBelowCursor({
					sectionCondition: RecentSectionSchema.section.in(sectionList),
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
		 * State of the rows a server page of the section is compared against: the same slice
		 * `getListBySectionFilter` shows (section, nesting level, rows of active users), narrowed by
		 * the dialog types the tab never lists.
		 *
		 * A page with a tail asserts nothing beyond its own window, so only the rows a verdict can be
		 * reached about are read: the ones inside the window, the ones pinned locally - a pinned row
		 * missing from the first page loses the flag wherever it lies - and the ones the page itself
		 * carries, since a chat pinned on the server may sit in the response with activity older than
		 * the cursor. Without the boundary the window is the whole section, and then the slice is read
		 * in full: that is the only case where absence from the response is a verdict for every row.
		 *
		 * @param {object} filter
		 * @param {string} filter.section
		 * @param {number|null} [filter.parentChatId]
		 * @param {Array<string>} [filter.exceptDialogTypes]
		 * @param {Date|null} [filter.boundary] cursor of the next page, null covers the whole section
		 * @param {Array<string>} [filter.dialogIds] ids the compared page carries
		 * @return {Promise<Array<{id: string, pinned: boolean, lastActivityDate: Date|null}>>}
		 */
		async getSectionRowStates({
			section,
			parentChatId = null,
			exceptDialogTypes = [],
			boundary = null,
			dialogIds = [],
		})
		{
			if (!Feature.isLocalStorageEnabled || !Type.isStringFilled(section))
			{
				return [];
			}

			const result = await Query.select()
				.from(RecentSchema)
				.innerJoin(DialogSchema, equalField(RecentSchema.id, DialogSchema.dialogId))
				.innerJoin(RecentSectionSchema, equalField(RecentSchema.id, RecentSectionSchema.dialogId))
				.leftJoin(UserSchema, equalField(RecentSchema.id, UserSchema.id))
				.setSelect(RecentSchema.id, RecentSchema.pinned, RecentSchema.lastActivityDate)
				.where(
					RecentSectionSchema.section.equal(section),
					Type.isNumber(parentChatId) && DialogSchema.parentChatId.equal(parentChatId),
					Type.isArrayFilled(exceptDialogTypes) && DialogSchema.type.notIn(exceptDialogTypes),
					or(isNull(UserSchema.id), UserSchema.active.equal(true)),
					boundary && or(
						RecentSchema.lastActivityDate.greaterThan(boundary),
						RecentSchema.pinned.equal(true),
						Type.isArrayFilled(dialogIds) && RecentSchema.id.in(dialogIds),
					),
				)
				.execute()
			;

			return result.map((row) => ({
				id: String(row.id),
				pinned: row.pinned === true,
				lastActivityDate: DateHelper.cast(row.lastActivityDate, null),
			}));
		}

		/**
		 * Writes the pinned flag of the given dialogs.
		 * Rows outside the list are left as they are.
		 *
		 * @param {Array<string>} dialogIds
		 * @param {boolean} pinned
		 * @return {Promise<void>}
		 */
		async setPinnedByIds(dialogIds, pinned)
		{
			if (!Feature.isLocalStorageEnabled || !Type.isArrayFilled(dialogIds))
			{
				return;
			}

			await Query.update()
				.from(RecentSchema)
				.set({ pinned })
				.where(RecentSchema.id.in(dialogIds))
				.execute()
			;
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
				return this.#emptyPage();
			}

			const result = await Query.select()
				.from(RecentSchema)
				.innerJoin(DialogSchema, equalField(RecentSchema.id, DialogSchema.dialogId))
				.leftJoin(DraftSchema, equalField(RecentSchema.id, DraftSchema.dialogId))
				.leftJoin(UserSchema, equalField(RecentSchema.id, UserSchema.id))
				.where(
					RecentSchema.id.in(dialogIds),
					or(isNull(UserSchema.id), UserSchema.active.equal(true)),
				)
				.execute();

			const items = this.#extractItems(result);

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
				return this.#emptyPage();
			}

			const result = await Query.select()
				.from(RecentSchema)
				.innerJoin(DialogSchema, equalField(RecentSchema.id, DialogSchema.dialogId))
				.leftJoin(DraftSchema, equalField(RecentSchema.id, DraftSchema.dialogId))
				.leftJoin(UserSchema, equalField(RecentSchema.id, UserSchema.id))
				.where(
					DialogSchema.chatId.in(numericChatIds),
					or(isNull(UserSchema.id), UserSchema.active.equal(true)),
				)
				.execute();

			const items = this.#extractItems(result);

			const related = await this.#fetchRelatedData(items);

			return {
				items,
				...related,
				hasMore: false,
			};
		}

		/**
		 * Searches within a section scope: either one section, as a tab standing on a section asks for
		 * it, or a set of them, as the tab scoped to the composition of a folder does. One section keeps
		 * the equality condition and no collapse: that is the query every other tab runs.
		 *
		 * @param {object} params
		 * @param {string} params.searchText
		 * @param {string} [params.section]
		 * @param {Array<string>|Set<string>} [params.sections]
		 * @param {number | null} [params.parentChatId]
		 * @param {number} [params.limit]
		 * @return {Promise<{items: Array}>}
		 */
		async searchByText({
			searchText,
			section,
			sections,
			parentChatId = null,
			limit = 25,
		})
		{
			if (!Feature.isLocalStorageEnabled)
			{
				return { items: [] };
			}

			const sectionList = this.#toSectionList(sections ?? section);
			if (sectionList.length === 0)
			{
				return { items: [] };
			}

			const isSingleSection = sectionList.length === 1;
			const query = Query.select()
				.from(RecentSchema)
				.innerJoin(DialogSchema, equalField(RecentSchema.id, DialogSchema.dialogId))
				.innerJoin(RecentSectionSchema, equalField(RecentSchema.id, RecentSectionSchema.dialogId))
				.leftJoin(UserSchema, equalField(RecentSchema.id, UserSchema.id))
				.where(
					isSingleSection
						? RecentSectionSchema.section.equal(sectionList[0])
						: RecentSectionSchema.section.in(sectionList),
					Type.isNumber(parentChatId) && DialogSchema.parentChatId.equal(parentChatId),
					getStartWordsSearchCondition(DialogSchema.name, searchText),
					or(isNull(UserSchema.id), UserSchema.active.equal(true)),
				)
			;

			if (!isSingleSection)
			{
				// the section join multiplies a chat by its sections: collapse back to one row per dialog
				query.groupBy(RecentSchema.id);
			}

			const result = await query
				.orderBy(RecentSchema.lastActivityDate.desc())
				.limit(limit)
				.execute()
			;

			return { items: this.#extractItems(result) };
		}

		/**
		 * Chats of a section filtered by dialog type, with no text condition at all.
		 *
		 * The text search above runs over the stored name, and for some chats that is not the name the
		 * user reads: a copilot chat nobody renamed is drawn under the name of the assistant while the
		 * base keeps the title the server generated for it. Such a chat is found by its type, and the
		 * caller keeps the rows whose DISPLAYED title matches - a rule that lives in the interface and
		 * has no twin in SQL.
		 *
		 * @param {object} filter
		 * @param {string} filter.section
		 * @param {Array<string>} filter.dialogTypes
		 * @param {number|null} [filter.parentChatId]
		 * @param {number} [filter.limit]
		 * @return {Promise<{items: Array<object>}>}
		 */
		async getListBySectionAndTypes({ section, dialogTypes, parentChatId = null, limit = 25 })
		{
			if (
				!Feature.isLocalStorageEnabled
				|| !Type.isStringFilled(section)
				|| !Type.isArrayFilled(dialogTypes)
			)
			{
				return { items: [] };
			}

			const result = await Query.select()
				.from(RecentSchema)
				.innerJoin(DialogSchema, equalField(RecentSchema.id, DialogSchema.dialogId))
				.innerJoin(RecentSectionSchema, equalField(RecentSchema.id, RecentSectionSchema.dialogId))
				.where(
					RecentSectionSchema.section.equal(section),
					DialogSchema.type.in(dialogTypes),
					Type.isNumber(parentChatId) && DialogSchema.parentChatId.equal(parentChatId),
				)
				.orderBy(RecentSchema.lastActivityDate.desc())
				.limit(limit)
				.execute()
			;

			return { items: this.#extractItems(result) };
		}

		/**
		 * The scope of a read as a list of sections: a set, a list or a single section, whichever the
		 * caller works with. Anything else is no scope at all and comes back empty.
		 *
		 * @param {string|Array<string>|Set<string>} [sections]
		 * @return {Array<string>}
		 */
		#toSectionList(sections)
		{
			if (Type.isStringFilled(sections))
			{
				return [sections];
			}

			const sectionList = Type.isSet(sections) ? [...sections] : sections;

			return Type.isArrayFilled(sectionList) ? sectionList : [];
		}

		/**
		 * Whether at least one row below the cursor still matches the page filter.
		 * The single- and the multi-section page differ only in the condition on the section,
		 * so both pass it in ready-made.
		 *
		 * @param {object} filter
		 * @param {Condition} filter.sectionCondition
		 * @param {number|null} [filter.parentChatId]
		 * @param {string|null} [filter.lastActivityDate]
		 * @return {Promise<boolean>}
		 */
		async #hasMoreBelowCursor({ sectionCondition, parentChatId = null, lastActivityDate = null })
		{
			if (!lastActivityDate)
			{
				return false;
			}

			const query = Query.select()
				.from(RecentSchema)
				.innerJoin(RecentSectionSchema, equalField(RecentSchema.id, RecentSectionSchema.dialogId))
				.leftJoin(UserSchema, equalField(RecentSchema.id, UserSchema.id))
				.setSelect(expressionField('1', 'hasMore'))
				.where(
					sectionCondition,
					RecentSchema.lastActivityDate.lessThan(lastActivityDate),
					or(isNull(UserSchema.id), UserSchema.active.equal(true)),
				)
				.limit(1);

			if (Type.isNumber(parentChatId))
			{
				query
					.innerJoin(DialogSchema, equalField(RecentSchema.id, DialogSchema.dialogId))
					.where(DialogSchema.parentChatId.equal(parentChatId));
			}

			const result = await query.execute();

			return result.length > 0;
		}

		/**
		 * @param {SelectResult} result
		 * @return {Array<object>}
		 */
		#extractItems(result)
		{
			return result.map((row) => {
				const recentData = row.extract(RecentSchema);
				recentData.chat = row.extract(DialogSchema);

				return recentData;
			});
		}

		/**
		 * @return {RecentPage}
		 */
		#emptyPage()
		{
			return { items: [], users: [], messages: [], files: [], stickers: [], draft: [], hasMore: false };
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
		 * Sections of the given dialogs. The multi-section page query returns one row per
		 * dialog, so the section membership needed to seed the model is read separately
		 * for the dialogs of the loaded page.
		 *
		 * @param {Array<string>} dialogIds
		 * @return {Promise<Map<string, Array<string>>>}
		 */
		async getSectionsByDialogIds(dialogIds)
		{
			const sectionsByDialogId = new Map();
			if (!Feature.isLocalStorageEnabled || !Type.isArrayFilled(dialogIds))
			{
				return sectionsByDialogId;
			}

			const result = await Query.select()
				.from(RecentSectionSchema)
				.where(RecentSectionSchema.dialogId.in(dialogIds))
				.execute();

			for (const row of result)
			{
				const { dialogId, section } = row.extract(RecentSectionSchema);
				const sections = sectionsByDialogId.get(dialogId) ?? [];
				sections.push(section);
				sectionsByDialogId.set(dialogId, sections);
			}

			return sectionsByDialogId;
		}

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

			if (Type.isPlainObject(fields.ownMessage))
			{
				result.ownMessage = this.prepareRecentMessage({ message: fields.ownMessage });
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

			if (Type.isNumber(fields.message.chatId))
			{
				message.chatId = fields.message.chatId;
			}
			else if (Type.isNumber(fields.message.chat_id))
			{
				message.chatId = fields.message.chat_id;
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
