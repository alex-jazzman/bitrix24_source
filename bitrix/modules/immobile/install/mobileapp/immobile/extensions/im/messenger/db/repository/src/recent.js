/**
 * @module im/messenger/db/repository/recent
 */
jn.define('im/messenger/db/repository/recent', (require, exports, module) => {
	const { Type } = require('type');
	const { DateHelper } = require('im/messenger/lib/helper');
	const { Uuid } = require('utils/uuid');

	const {
		RecentTable,
	} = require('im/messenger/db/table');
	const { validateRestItem } = require('im/messenger/db/repository/validators/recent');

	/**
	 * @class RecentRepository
	 */
	class RecentRepository
	{
		constructor()
		{
			this.recentTable = new RecentTable();
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
		 *
		 * @returns {Promise<{items: *[]}>}
		 */
		async searchByText({
			searchText,
			order = 'desc',
			limit = 25,
		})
		{
			return this.recentTable.searchByText(searchText, order, limit);
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
			else if (Type.isBoolean(fields.message.params?.withFile) || Type.isPlainObject(fields.message.params?.withFile))
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
