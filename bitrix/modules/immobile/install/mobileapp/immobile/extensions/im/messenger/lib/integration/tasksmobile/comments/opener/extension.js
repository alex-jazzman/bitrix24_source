/**
 * @module im/messenger/lib/integration/tasksmobile/comments/opener
 */
jn.define('im/messenger/lib/integration/tasksmobile/comments/opener', (require, exports, module) => {
	const { Loc } = require('im/messenger/loc');
	const { DialogOpener } = require('im/messenger/api/dialog-opener');

	/**
	 * @param {number} chatId
	 * @param {number} taskId
	 * @return {Promise<DialoguesModelState>}
	 */
	async function openTaskComments(chatId, taskId)
	{
		/** @type ChatIntegrationSettings */
		const integrationSettings = {
			relatedEntity: {
				type: 'task',
				id: taskId,
				customData: {},
			},
			header: {
				title: {
					params: {
						text: Loc.getMessage('IMMOBILE_INTEGRATION_M_TASK_DETAILS_COMMENTS_TITLE'),
						type: 'wizard',
					},
					controller: {
						extensionName: 'im:messenger/lib/integration/tasksmobile/comments/header/title',
						className: 'CommentsHeaderTitle',
					},
				},
				buttons: {
					controller: {
						extensionName: 'im:messenger/lib/integration/tasksmobile/comments/header/buttons',
						className: 'CommentsHeaderButtons',
					},
				},
			},
			sidebar: {
				enabled: false,
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

		return DialogOpener.open({
			dialogId: `chat${chatId}`,
			integrationSettings,
		});
	}

	module.exports = {
		openTaskComments,
	};
});
