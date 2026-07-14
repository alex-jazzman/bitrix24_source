/**
 * @module im/messenger/lib/project-access-guard
 */
jn.define('im/messenger/lib/project-access-guard', (require, exports, module) => {
	const { Type } = require('type');
	const { NotifyManager } = require('notify-manager');
	const { DialogType, EntitySelectorElementType } = require('im/messenger/const');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { ChatService } = require('im/messenger/provider/services/chat');
	const { showAddParticipantsToProjectAlert } = require('im/messenger/lib/ui/alert');
	const { Notification } = require('im/messenger/lib/ui/notification');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');

	const logger = getLoggerWithContext('lib-project-access-guard', 'ProjectAccessGuard');

	/**
	 * @class ProjectAccessGuard
	 */
	class ProjectAccessGuard
	{
		/**
		 * @param {number} parentChatId — chatId of the parent project
		 * @param {Array<{id: number|string, type: string}>} addedEntities — entities added via the selector
		 * @return {Promise<boolean>} — true if the addition was confirmed or does not require confirmation
		 */
		static async canAddEntitiesToProjectChildChat(parentChatId, addedEntities)
		{
			if (!Type.isArrayFilled(addedEntities))
			{
				return true;
			}

			if (!ProjectAccessGuard.#isProjectParent(parentChatId))
			{
				return true;
			}

			const hasNewDepartment = addedEntities.some(
				({ type }) => type === EntitySelectorElementType.department,
			);
			if (hasNewDepartment)
			{
				return ProjectAccessGuard.#askForParentAccess();
			}

			const userIds = addedEntities
				.filter(({ type }) => type === EntitySelectorElementType.user)
				.map(({ id }) => Number(id));

			return ProjectAccessGuard.#checkUsersAccessOrAsk(parentChatId, userIds);
		}

		/**
		 * @param {number} parentChatId — chatId of the parent project
		 * @param {Array<number>} userIds — user ids being added
		 * @return {Promise<boolean>} — true if the addition was confirmed or does not require confirmation
		 */
		static async canAddUsersToProjectChildChat(parentChatId, userIds)
		{
			if (!Type.isArrayFilled(userIds))
			{
				return true;
			}

			if (!ProjectAccessGuard.#isProjectParent(parentChatId))
			{
				return true;
			}

			return ProjectAccessGuard.#checkUsersAccessOrAsk(parentChatId, userIds);
		}

		static #isProjectParent(parentChatId)
		{
			if (!parentChatId || parentChatId <= 0)
			{
				return false;
			}

			const store = serviceLocator.get('core').getStore();
			const parentDialog = store.getters['dialoguesModel/getByChatId'](parentChatId);

			return parentDialog?.type === DialogType.collab;
		}

		static async #checkUsersAccessOrAsk(parentChatId, userIds)
		{
			if (!Type.isArrayFilled(userIds))
			{
				return true;
			}

			NotifyManager.showLoadingIndicator();

			let usersNotInChat;
			try
			{
				({ usersNotInChat } = await (new ChatService())
					.memberService
					.checkParticipation(parentChatId, userIds));
			}
			catch (error)
			{
				NotifyManager.hideLoadingIndicatorWithoutFallback();
				logger.error('checkUsersAccessOrAsk error', error);
				Notification.showErrorToast();

				return false;
			}

			NotifyManager.hideLoadingIndicatorWithoutFallback();

			if (!Type.isArrayFilled(usersNotInChat))
			{
				return true;
			}

			return ProjectAccessGuard.#askForParentAccess();
		}

		static #askForParentAccess()
		{
			return new Promise((resolve) => {
				showAddParticipantsToProjectAlert({
					addCallback: () => resolve(true),
					cancelCallback: () => resolve(false),
				});
			});
		}
	}

	module.exports = { ProjectAccessGuard };
});
