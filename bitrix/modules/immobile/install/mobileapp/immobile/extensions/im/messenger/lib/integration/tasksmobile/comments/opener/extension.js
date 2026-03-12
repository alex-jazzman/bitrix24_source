/**
 * @module im/messenger/lib/integration/tasksmobile/comments/opener
 */
jn.define('im/messenger/lib/integration/tasksmobile/comments/opener', (require, exports, module) => {
	const { Type } = require('type');
	const { DialogOpener } = require('im/messenger/api/dialog-opener');
	const {
		SidebarContextMenuActionId,
		SidebarPrimaryActionButtonId,
	} = require('im/messenger/controller/sidebar-v2/const');

	/**
	 * @param {number} chatId
	 * @param {number} taskId
	 * @param {number?} messageId
	 * @return {Promise<DialoguesModelState>}
	 */
	async function openTaskComments(chatId, taskId, messageId)
	{
		/** @type ChatIntegrationSettings */
		const integrationSettings = {
			relatedEntity: {
				type: 'task',
				id: taskId,
				customData: {},
			},
			header: {
				buttons: {
					controller: {
						extensionName: 'im:messenger/lib/integration/tasksmobile/comments/header/buttons',
						className: 'CommentsHeaderButtons',
					},
				},
			},
			sidebar: {
				enabled: true,
				params: {
					addParticipantsEnabled: false,
					headerContextMenuItems: [
						SidebarContextMenuActionId.COPY_LINK,
						SidebarContextMenuActionId.PIN,
						SidebarContextMenuActionId.UNPIN,
					],
					primaryActionButtons: [
						'open_task',
						SidebarPrimaryActionButtonId.VIDEO_CALL,
						SidebarPrimaryActionButtonId.AUDIO_CALL,
						SidebarPrimaryActionButtonId.SEARCH,
						SidebarPrimaryActionButtonId.MESSAGE_AUTO_DELETE,
					],
				},
			},
			message: {
				contextMenu: {
					controller: {
						extensionName: 'im:messenger/lib/integration/tasksmobile/comments/message/context-menu',
						className: 'CommentContextMenu',
					},
				},
			},
		};

		/** @type DialogOpenOptions */
		const options = {
			dialogId: `chat${chatId}`,
			integrationSettings,
		};

		if (Type.isNumber(messageId))
		{
			options.messageId = messageId;
			options.withMessageHighlight = true;
		}

		return DialogOpener.open(options);
	}

	module.exports = {
		openTaskComments,
	};
});
