/* eslint-disable no-param-reassign */
/* global ChatUtils */

/**
 * @module im/messenger/model/dialogues/validator
 */

jn.define('im/messenger/model/dialogues/validator', (require, exports, module) => {
	const { Type } = require('type');
	const { DateHelper } = require('im/messenger/lib/helper');
	const { UserRole } = require('im/messenger/const');
	const { mergeImmutable } = require('utils/object');
	const { MessengerParams } = require('im/messenger/lib/params');
	const { ChatPermission } = require('im/messenger/lib/permission-manager');

	const { LoggerManager } = require('im/messenger/lib/logger');
	const logger = LoggerManager.getInstance().getLogger('model--dialogues');
	/**
	 *
	 * @param fields
	 * @return {{}}
	 */
	function validate(fields)
	{
		const result = {};

		if (!Type.isUndefined(fields.dialog_id))
		{
			fields.dialogId = fields.dialog_id;
		}

		if (Type.isNumber(fields.dialogId) || Type.isStringFilled(fields.dialogId))
		{
			result.dialogId = fields.dialogId.toString();
		}

		if (!Type.isUndefined(fields.chat_id))
		{
			fields.chatId = fields.chat_id;
		}
		else if (!Type.isUndefined(fields.id))
		{
			fields.chatId = fields.id;
		}

		if (Type.isNumber(fields.chatId) || Type.isStringFilled(fields.chatId))
		{
			result.chatId = Number.parseInt(fields.chatId, 10);
		}

		if (Type.isStringFilled(fields.type))
		{
			result.type = fields.type.toString();
		}

		if (Type.isNumber(fields.quoteId))
		{
			result.quoteId = Number.parseInt(fields.quoteId, 10);
		}

		if (Type.isNumber(fields.counter) || Type.isStringFilled(fields.counter))
		{
			result.counter = Number.parseInt(fields.counter, 10);
		}

		if (!Type.isUndefined(fields.user_counter))
		{
			result.userCounter = fields.user_counter;
		}

		if (!Type.isUndefined(fields.participants))
		{
			result.participants = fields.participants.map(
				(userId) => (Type.isString(userId) ? parseInt(userId, 10) : userId),
			);
		}

		if (Type.isNumber(fields.userCounter) || Type.isStringFilled(fields.userCounter))
		{
			result.userCounter = Number.parseInt(fields.userCounter, 10);
		}

		if (!Type.isUndefined(fields.last_id))
		{
			fields.lastId = fields.last_id;
		}

		if (Type.isNumber(fields.lastId) || Type.isStringFilled(fields.lastId))
		{
			result.lastReadId = Number.parseInt(fields.lastId, 10);
		}

		if (Type.isNumber(fields.lastReadId) || Type.isStringFilled(fields.lastReadId))
		{
			result.lastReadId = Number.parseInt(fields.lastReadId, 10);
		}

		if (!Type.isUndefined(fields.marked_id))
		{
			fields.markedId = fields.marked_id;
		}

		if (Type.isNumber(fields.markedId))
		{
			result.markedId = fields.markedId;
		}

		if (!Type.isUndefined(fields.last_message_id))
		{
			fields.lastMessageId = fields.last_message_id;
		}

		if (Type.isNumber(fields.lastLoadParticipantId))
		{
			result.lastLoadParticipantId = fields.lastLoadParticipantId;
		}

		if (Type.isNumber(fields.lastMessageId) || Type.isStringFilled(fields.lastMessageId))
		{
			result.lastMessageId = Number.parseInt(fields.lastMessageId, 10);
		}

		if (Type.isPlainObject(fields.last_message_views))
		{
			fields.lastMessageViews = fields.last_message_views;
		}

		if (Type.isPlainObject(fields.lastMessageViews))
		{
			result.lastMessageViews = prepareLastMessageViews(fields.lastMessageViews);
		}

		if (Type.isBoolean(fields.hasPrevPage))
		{
			result.hasPrevPage = fields.hasPrevPage;
		}

		if (Type.isBoolean(fields.hasNextPage))
		{
			result.hasNextPage = fields.hasNextPage;
		}

		if (!Type.isUndefined(fields.textareaMessage))
		{
			result.textareaMessage = fields.textareaMessage.toString();
		}

		if (!Type.isUndefined(fields.title))
		{
			fields.name = fields.title;
		}

		if (Type.isNumber(fields.name) || Type.isStringFilled(fields.name))
		{
			result.name = ChatUtils.htmlspecialcharsback(fields.name.toString());
		}

		if (!Type.isUndefined(fields.owner))
		{
			fields.ownerId = fields.owner;
		}

		if (Type.isNumber(fields.ownerId) || Type.isStringFilled(fields.ownerId))
		{
			result.owner = Number.parseInt(fields.ownerId, 10);
		}

		if (Type.isString(fields.avatar))
		{
			result.avatar = prepareAvatar(fields.avatar);
		}

		if (Type.isStringFilled(fields.color))
		{
			result.color = fields.color;
		}

		if (Type.isBoolean(fields.extranet))
		{
			result.extranet = fields.extranet;
		}

		if (!Type.isUndefined(fields.entity_type))
		{
			fields.entityType = fields.entity_type;
		}

		if (Type.isStringFilled(fields.entityType))
		{
			result.entityType = fields.entityType;
		}

		if (!Type.isUndefined(fields.entity_id))
		{
			fields.entityId = fields.entity_id;
		}

		if (Type.isNumber(fields.entityId) || Type.isStringFilled(fields.entityId))
		{
			result.entityId = fields.entityId.toString();
		}

		if (!Type.isUndefined(fields.date_create))
		{
			fields.dateCreate = fields.date_create;
		}

		if (!Type.isUndefined(fields.dateCreate))
		{
			result.dateCreate = DateHelper.cast(fields.dateCreate);
		}

		if (Type.isPlainObject(fields.public))
		{
			result.public = {};

			if (Type.isStringFilled(fields.public.code))
			{
				result.public.code = fields.public.code;
			}

			if (Type.isStringFilled(fields.public.link))
			{
				result.public.link = fields.public.link;
			}
		}

		// if (!Type.isUndefined(fields.readed_list))
		// {
		// 	fields.readList = fields.readed_list;
		// }
		// if (Type.isArray(fields.readList))
		// {
		// 	result.readList = this.prepareReadList(fields.readList);
		// }

		if (!Type.isUndefined(fields.writing_list))
		{
			fields.writingList = fields.writing_list;
		}

		if (Type.isArray(fields.inputActions))
		{
			result.inputActions = prepareInputActions(fields.inputActions);
		}

		if (!Type.isUndefined(fields.manager_list))
		{
			fields.managerList = fields.manager_list;
		}

		if (Type.isArray(fields.managerList))
		{
			result.managerList = [];

			fields.managerList.forEach((userId) => {
				userId = Number.parseInt(userId, 10);
				if (userId > 0)
				{
					result.managerList.push(userId);
				}
			});
		}

		if (!Type.isUndefined(fields.mute_list))
		{
			fields.muteList = fields.mute_list;
		}

		if (Type.isArray(fields.muteList) || Type.isPlainObject(fields.muteList))
		{
			result.muteList = prepareMuteList(fields.muteList);
		}

		if (Type.isBoolean(fields.inited))
		{
			result.inited = fields.inited;
		}

		if (Type.isBoolean(fields.hasMoreUnreadToLoad))
		{
			result.hasMoreUnreadToLoad = fields.hasMoreUnreadToLoad;
		}

		if (Type.isString(fields.description))
		{
			result.description = fields.description;
		}

		if (Type.isNumber(fields.disk_folder_id))
		{
			result.diskFolderId = fields.disk_folder_id;
		}
		else if (Type.isNumber(fields.diskFolderId))
		{
			result.diskFolderId = fields.diskFolderId;
		}

		fields.role = fields.role?.toString().toLowerCase();
		if (UserRole[fields.role])
		{
			result.role = fields.role;
		}

		if (!Type.isUndefined(fields.permissions))
		{
			result.permissions = {};
			if (Type.isObject(fields.permissions))
			{
				result.permissions = preparePermissions(fields.permissions);
			}

			result.permissions = mergeImmutable(ChatPermission.getActionGroupsByChatType(result.type), result.permissions);
		}

		if (Type.isStringFilled(fields.aiProvider))
		{
			result.aiProvider = fields.aiProvider;
		}

		if (Type.isStringFilled(fields.ai_provider))
		{
			result.aiProvider = fields.ai_provider;
		}

		if (Type.isNumber(fields.parentChatId))
		{
			result.parentChatId = fields.parentChatId;
		}

		if (Type.isNumber(fields.parentMessageId))
		{
			result.parentMessageId = fields.parentMessageId;
		}

		if (fields.tariffRestrictions)
		{
			result.tariffRestrictions = fields.tariffRestrictions;
		}

		return result;
	}

	/**
	 * @param {LastMessageViews} rawLastMessageViews
	 */
	function prepareLastMessageViews(rawLastMessageViews)
	{
		if (Type.isObject(rawLastMessageViews.firstViewer) || rawLastMessageViews.firstViewer === null)
		{
			return rawLastMessageViews;
		}

		let countOfViewers = rawLastMessageViews.countOfViewers;
		let rawFirstViewers = rawLastMessageViews.firstViewers;
		let messageId = rawLastMessageViews.messageId;
		let firstViewer = null;

		try
		{
			if (
				Type.isUndefined(countOfViewers)
				&& !Type.isUndefined(rawLastMessageViews.count_of_viewers)
			) // old rest response
			{
				countOfViewers = rawLastMessageViews.count_of_viewers;
				rawFirstViewers = rawLastMessageViews.first_viewers;
				messageId = rawLastMessageViews.message_id;

				for (const rawFirstViewer of rawFirstViewers)
				{
					if (rawFirstViewer.user_id === MessengerParams.getUserId())
					{
						continue;
					}

					firstViewer = {
						userId: rawFirstViewer.user_id,
						userName: rawFirstViewer.user_name,
						date: DateHelper.cast(rawFirstViewer.date),
					};
					break;
				}
			}
			else
			{
				if (Type.isNil(rawFirstViewers))
				{
					// case for get data from local db (lastMessageViews is empty object)
					return {
						countOfViewers: 0,
						firstViewer: null,
						messageId: 0,
					};
				}

				for (const rawFirstViewer of rawFirstViewers)
				{
					if (rawFirstViewer.userId === MessengerParams.getUserId())
					{
						continue;
					}

					firstViewer = {
						userId: rawFirstViewer.userId,
						userName: rawFirstViewer.userName,
						date: DateHelper.cast(rawFirstViewer.date),
					};
					break;
				}
			}
		}
		catch (error)
		{
			logger.error('dialoguesModel.prepareLastMessageViews.catch:', error);
		}

		if (countOfViewers > 0 && !firstViewer)
		{
			throw new Error('dialoguesModel: no first viewer for message');
		}

		return {
			countOfViewers,
			firstViewer,
			messageId,
		};
	}

	/**
	 * @param muteList
	 * @return {Array<number>}
	 */
	function prepareMuteList(muteList)
	{
		const result = [];

		if (Type.isArray(muteList))
		{
			muteList.forEach((userId) => {
				userId = Number.parseInt(userId, 10);
				if (userId > 0)
				{
					result.push(userId);
				}
			});
		}
		else if (Type.isPlainObject(muteList))
		{
			Object.entries(muteList).forEach(([key, value]) => {
				if (!value)
				{
					return;
				}
				const userId = Number.parseInt(key, 10);
				if (userId > 0)
				{
					result.push(userId);
				}
			});
		}

		return result;
	}

	/**
	 * @param {string} avatar
	 * @return {string}
	 */
	function prepareAvatar(avatar)
	{
		let result = '';

		if (!avatar || avatar.endsWith('/js/im/images/blank.gif'))
		{
			result = '';
		}
		else if (avatar.startsWith('http'))
		{
			result = avatar;
		}
		else
		{
			result = currentDomain + avatar;
		}

		if (result)
		{
			result = encodeURI(result);
		}

		return result;
	}

	/**
	 * @param {Array<InputActionNotify>} inputAction
	 * @return {Array<InputActionNotify>}
	 */
	function prepareInputActions(inputAction)
	{
		const result = [];

		inputAction.forEach((inputAction) => {
			const item = {};
			const isValidUserId = Type.isNumber(inputAction.userId);
			const isValidUserFirstName = Type.isString(inputAction.userFirstName);
			const isValidActions = Type.isArrayFilled(inputAction.actions)
				&& inputAction.actions.every((action) => Type.isString(action))
			;

			if (!isValidUserId || !isValidUserFirstName || !isValidActions)
			{
				return;
			}

			item.userId = inputAction.userId;
			item.userFirstName = inputAction.userFirstName;
			item.actions = inputAction.actions;

			result.push(item);
		});

		return result;
	}

	/**
	 * @param fields
	 * @return {DialogPermissions}
	 */
	function preparePermissions(fields)
	{
		const result = {};
		if (Type.isStringFilled(fields.manage_users_add) || Type.isStringFilled(fields.manageUsersAdd))
		{
			result.manageUsersAdd = fields.manage_users_add || fields.manageUsersAdd;
		}

		if (Type.isStringFilled(fields.manage_users_delete) || Type.isStringFilled(fields.manageUsersDelete))
		{
			result.manageUsersDelete = fields.manage_users_delete || fields.manageUsersDelete;
		}

		if (Type.isStringFilled(fields.manage_ui) || Type.isStringFilled(fields.manageUi))
		{
			result.manageUi = fields.manage_ui || fields.manageUi;
		}

		if (Type.isStringFilled(fields.manage_settings) || Type.isStringFilled(fields.manageSettings))
		{
			result.manageSettings = fields.manage_settings || fields.manageSettings;
		}

		if (Type.isStringFilled(fields.can_post) || Type.isStringFilled(fields.canPost))
		{
			fields.manageMessages = fields.can_post || fields.canPost;
		}

		if (Type.isStringFilled(fields.manage_messages) || Type.isStringFilled(fields.manageMessages))
		{
			result.manageMessages = fields.manage_messages || fields.manageMessages;
		}

		return result;
	}

	module.exports = {
		validate,
		preparePermissions,
	};
});
