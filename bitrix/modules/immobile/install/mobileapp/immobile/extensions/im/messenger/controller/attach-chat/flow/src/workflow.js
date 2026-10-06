/**
 * @module im/messenger/controller/attach-chat/flow/src/workflow
 */
jn.define('im/messenger/controller/attach-chat/flow/src/workflow', (require, exports, module) => {
	const { Loc } = require('im/messenger/loc');
	const { Icon } = require('assets/icons');
	const { RecentTab, ROOT_PARENT_CHAT_ID } = require('im/messenger/const');
	const { ChatService } = require('im/messenger/provider/services/chat');
	const { Notification } = require('im/messenger/lib/ui/notification');
	const { getLogger } = require('im/messenger/lib/logger');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');

	const { ConfirmWidget } = require('im/messenger/controller/attach-chat/flow/src/confirm-widget');

	const logger = getLogger('AttachChat.Workflow');

	/**
	 * Removes a recent item from all sections under a specific parent scope.
	 *
	 * @param {string|number} dialogId
	 * @param {number} parentChatId
	 * @return {Promise<void>}
	 */
	async function hideFromRecent(dialogId, parentChatId)
	{
		const store = serviceLocator.get('core').getStore();
		const sections = store.getters['recentModel/getSectionsContainingItem'](dialogId, [parentChatId]);

		if (sections.length === 0)
		{
			return;
		}

		await store.dispatch('recentModel/hideByRecentConfigTabs', {
			id: dialogId,
			fromSections: sections.map((s) => s.recentSection),
			parentChatId,
		});
	}

	/**
	 * Restores a recent item to a parent scope under the chat section using the existing
	 * collection entry. No-op if the item is missing from the model.
	 *
	 * @param {string|number} dialogId
	 * @param {number} parentChatId
	 * @return {Promise<void>}
	 */
	async function showInRecent(dialogId, parentChatId)
	{
		const store = serviceLocator.get('core').getStore();
		const recentItem = store.getters['recentModel/getById'](dialogId);

		if (!recentItem)
		{
			return;
		}

		await store.dispatch('recentModel/setByRecentConfigTabs', {
			sections: [RecentTab.chat],
			itemList: recentItem,
			parentChatId,
		});
	}

	/**
	 * Maps REST error codes to localised toast texts. Used for both attach and detach.
	 *
	 * @param {Array<{code: string}>} errors
	 * @return {string}
	 */
	function resolveErrorText(errors)
	{
		const code = Array.isArray(errors) && errors[0] ? String(errors[0].code ?? '') : '';

		switch (code)
		{
			case 'CHAT_ALREADY_HAS_PARENT':
				return Loc.getMessage('IMMOBILE_ATTACH_CHAT_TOAST_ERROR_ALREADY_HAS_PARENT');
			case 'WRONG_PARENT_CHAT':
				return Loc.getMessage('IMMOBILE_ATTACH_CHAT_TOAST_ERROR_WRONG_PARENT');
			case 'CHAT_HAS_NO_PARENT':
				return Loc.getMessage('IMMOBILE_ATTACH_CHAT_TOAST_ERROR_NO_PARENT');
			case 'ACCESS_DENIED':
				return Loc.getMessage('IMMOBILE_ATTACH_CHAT_TOAST_ERROR_ACCESS_DENIED');
			default:
				return Loc.getMessage('IMMOBILE_ATTACH_CHAT_TOAST_ERROR_GENERIC');
		}
	}

	/**
	 * Returns dialog name with fallbacks.
	 *
	 * @param {?Object} dialog
	 * @return {string}
	 */
	function getDialogName(dialog)
	{
		return dialog?.name || dialog?.title || '';
	}

	/**
	 * Selector and ConfirmWidget are lazy-loaded so the workflow stays cheap to require.
	 *
	 * @param {Object} params
	 * @param {DialoguesModelState} params.dialog - chat being attached
	 * @param {PageManager} [params.parentWidget]
	 * @param {object|null} [params.toastAnchor] - widget to anchor success/error toasts to (e.g. sidebar widget)
	 * @param {number|null} [params.toastOffset] - bottom offset for toasts; null falls back to MessengerToast default (75)
	 * @return {Promise<void>}
	 */
	async function runAttachFlow({ dialog, parentWidget = PageManager, toastAnchor = null, toastOffset = null })
	{
		const { ProjectSelector } = await requireLazy(
			'im:messenger/controller/attach-chat/project-selector',
			true,
		);

		const selectedProject = await ProjectSelector.open({
			chatId: dialog.dialogId,
			parentWidget,
		});

		if (!selectedProject)
		{
			return;
		}

		const confirmed = await ConfirmWidget.open({
			title: Loc.getMessage('IMMOBILE_ATTACH_CHAT_CONFIRM_ATTACH_TITLE'),
			description: Loc.getMessage('IMMOBILE_ATTACH_CHAT_CONFIRM_ATTACH_DESCRIPTION'),
			icon: 'marshmallows',
			confirmText: Loc.getMessage('IMMOBILE_ATTACH_CHAT_CONFIRM_ATTACH_BUTTON_CONFIRM'),
			cancelText: Loc.getMessage('IMMOBILE_ATTACH_CHAT_CONFIRM_BUTTON_CANCEL'),
		}, parentWidget);

		if (!confirmed)
		{
			return;
		}

		const chatId = Number(dialog.chatId);
		const parentChatId = Number(selectedProject.chatId);

		if (!chatId || !parentChatId)
		{
			logger.error('runAttachFlow: missing numeric chatId/parentChatId', {
				dialog,
				selectedProject,
			});
			Notification.showToastWithParams(
				{ message: Loc.getMessage('IMMOBILE_ATTACH_CHAT_TOAST_ERROR_GENERIC'), offset: toastOffset },
				toastAnchor,
			);

			return;
		}

		try
		{
			const chatService = new ChatService();
			await chatService.attachService.attachToParent(chatId, parentChatId);

			await hideFromRecent(dialog.dialogId, ROOT_PARENT_CHAT_ID);

			Notification.showToastWithParams(
				{
					message: Loc.getMessage('IMMOBILE_ATTACH_CHAT_TOAST_ATTACH_SUCCESS', {
						'#CHAT#': getDialogName(dialog),
						'#PROJECT#': selectedProject.name || '',
					}),
					icon: Icon.GO_TO_MESSAGE,
					offset: toastOffset,
				},
				toastAnchor,
			);
		}
		catch (errors)
		{
			logger.error('runAttachFlow error', errors);
			Notification.showToastWithParams(
				{ message: resolveErrorText(errors), offset: toastOffset },
				toastAnchor,
			);
		}
	}

	/**
	 * Project name for the toast is resolved from Vuex by parentChatId.
	 *
	 * @param {Object} params
	 * @param {DialoguesModelState} params.dialog - child chat being detached (parentChatId !== 0)
	 * @param {PageManager} [params.parentWidget]
	 * @param {object|null} [params.toastAnchor] - widget to anchor success/error toasts to (e.g. sidebar widget)
	 * @param {number|null} [params.toastOffset] - bottom offset for toasts; null falls back to MessengerToast default (75)
	 * @return {Promise<void>}
	 */
	async function runDetachFlow({ dialog, parentWidget = PageManager, toastAnchor = null, toastOffset = null })
	{
		const confirmed = await ConfirmWidget.open({
			title: Loc.getMessage('IMMOBILE_ATTACH_CHAT_CONFIRM_DETACH_TITLE'),
			description: Loc.getMessage('IMMOBILE_ATTACH_CHAT_CONFIRM_DETACH_DESCRIPTION'),
			confirmText: Loc.getMessage('IMMOBILE_ATTACH_CHAT_CONFIRM_DETACH_BUTTON_CONFIRM'),
			cancelText: Loc.getMessage('IMMOBILE_ATTACH_CHAT_CONFIRM_BUTTON_CANCEL'),
			confirmDesign: 'destructive',
		}, parentWidget);

		if (!confirmed)
		{
			return;
		}

		const chatId = Number(dialog.chatId);
		const parentChatId = Number(dialog.parentChatId ?? dialog.parent_chat_id ?? 0);

		if (!chatId || !parentChatId)
		{
			logger.error('runDetachFlow: missing numeric chatId/parentChatId', { dialog });
			Notification.showToastWithParams(
				{ message: Loc.getMessage('IMMOBILE_ATTACH_CHAT_TOAST_ERROR_GENERIC'), offset: toastOffset },
				toastAnchor,
			);

			return;
		}

		const store = serviceLocator.get('core').getStore();
		const parentDialog = store.getters['dialoguesModel/getByChatId'](parentChatId);

		try
		{
			const chatService = new ChatService();
			await chatService.attachService.detachFromParent(chatId);

			await hideFromRecent(dialog.dialogId, parentChatId);
			await showInRecent(dialog.dialogId, ROOT_PARENT_CHAT_ID);

			Notification.showToastWithParams(
				{
					message: Loc.getMessage('IMMOBILE_ATTACH_CHAT_TOAST_DETACH_SUCCESS', {
						'#CHAT#': getDialogName(dialog),
						'#PROJECT#': getDialogName(parentDialog),
					}),
					icon: Icon.GO_TO_MESSAGE,
					offset: toastOffset,
				},
				toastAnchor,
			);
		}
		catch (errors)
		{
			logger.error('runDetachFlow error', errors);
			Notification.showToastWithParams(
				{ message: resolveErrorText(errors), offset: toastOffset },
				toastAnchor,
			);
		}
	}

	/**
	 * Entry point from a project's "+" menu: the user picks a chat and attaches it to the
	 * current project. Mirror of runAttachFlow but with chat-selector instead of
	 * project-selector and parentChatId fixed to the current project.
	 *
	 * @param {Object} params
	 * @param {DialoguesModelState} params.parentDialog - the project (parent) dialog
	 * @param {PageManager} [params.parentWidget]
	 * @return {Promise<void>}
	 */
	async function runAttachFromProject({ parentDialog, parentWidget = PageManager })
	{
		const parentChatId = Number(parentDialog.chatId);
		if (!parentChatId)
		{
			logger.error('runAttachFromProject: missing numeric parentDialog.chatId', { parentDialog });

			return;
		}

		const { ChatSelector } = await requireLazy(
			'im:messenger/controller/attach-chat/chat-selector',
			true,
		);

		const selectedChat = await ChatSelector.open({ parentChatId, parentWidget });
		if (!selectedChat)
		{
			return;
		}

		const confirmed = await ConfirmWidget.open({
			title: Loc.getMessage('IMMOBILE_ATTACH_CHAT_CONFIRM_ATTACH_TITLE'),
			description: Loc.getMessage('IMMOBILE_ATTACH_CHAT_CONFIRM_ATTACH_DESCRIPTION'),
			icon: 'marshmallows',
			confirmText: Loc.getMessage('IMMOBILE_ATTACH_CHAT_CONFIRM_ATTACH_BUTTON_CONFIRM'),
			cancelText: Loc.getMessage('IMMOBILE_ATTACH_CHAT_CONFIRM_BUTTON_CANCEL'),
		}, parentWidget);

		if (!confirmed)
		{
			return;
		}

		const chatId = Number(selectedChat.chatId);
		if (!chatId)
		{
			logger.error('runAttachFromProject: missing numeric selectedChat.chatId', { selectedChat });
			Notification.showToastWithParams({
				message: Loc.getMessage('IMMOBILE_ATTACH_CHAT_TOAST_ERROR_GENERIC'),
			});

			return;
		}

		try
		{
			const chatService = new ChatService();
			await chatService.attachService.attachToParent(chatId, parentChatId);

			// Optimistic recent migration for the source chat (it leaves ROOT and lands under parent)
			await hideFromRecent(selectedChat.dialogId, ROOT_PARENT_CHAT_ID);

			Notification.showToastWithParams({
				message: Loc.getMessage('IMMOBILE_ATTACH_CHAT_TOAST_ATTACH_SUCCESS', {
					'#CHAT#': selectedChat.name || '',
					'#PROJECT#': getDialogName(parentDialog),
				}),
				icon: Icon.GO_TO_MESSAGE,
			});
		}
		catch (errors)
		{
			logger.error('runAttachFromProject error', errors);
			Notification.showToastWithParams({
				message: resolveErrorText(errors),
			});
		}
	}

	module.exports = {
		runAttachFlow,
		runDetachFlow,
		runAttachFromProject,
		resolveErrorText,
	};
});
