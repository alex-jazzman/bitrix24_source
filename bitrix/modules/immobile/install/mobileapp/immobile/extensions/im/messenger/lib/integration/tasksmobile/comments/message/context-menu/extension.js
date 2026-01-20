/**
 * @module im/messenger/lib/integration/tasksmobile/comments/message/context-menu
 */
jn.define('im/messenger/lib/integration/tasksmobile/comments/message/context-menu', (require, exports, module) => {
	const { MessageContextMenu } = require('im/messenger/api/dialog-integration/message/context-menu');
	const { MessageMenuActionType } = require('im/messenger/const');
	const { Color } = require('tokens');
	const { Loc } = require('loc');
	const { Icon } = require('ui-system/blocks/icon');

	const store = require('statemanager/redux/store');
	const { dispatch } = store;
	const {
		addFromMessage,
		remove,
		selectResultIdByTaskIdAndMessageId,
	} = require('tasks/statemanager/redux/slices/tasks-results-v2');

	const baseColor = Color.base1.toHex();

	/** @type {MessageContextMenuButton} */
	const MarkAsResultAction = {
		id: 'mark-as-result',
		testId: 'MESSAGE_MENU_ACTION_MARK_AS_RESULT',
		type: 'button',
		text: Loc.getMessage('IMMOBILE_INTEGRATION_TASKSMOBILE_COMMENTS_MESSAGE_MENU_MARK_AS_RESULT'),
		iconName: Icon.WINDOW_FLAG.getIconName(),
		style: {
			fontColor: baseColor,
		},
	};

	/** @type {MessageContextMenuButton} */
	const UnmarkAsResultAction = {
		id: 'unmark-as-result',
		testId: 'MESSAGE_MENU_ACTION_UNMARK_AS_RESULT',
		type: 'button',
		text: Loc.getMessage('IMMOBILE_INTEGRATION_TASKSMOBILE_COMMENTS_MESSAGE_MENU_UNMARK_AS_RESULT'),
		iconName: Icon.CIRCLE_CROSS.getIconName(),
		style: {
			fontColor: baseColor,
		},
	};

	/**
	 * @class CommentContextMenu
	 */
	class CommentContextMenu extends MessageContextMenu
	{
		/**
		 * @return {Object<string, (menu: MessageMenuView, message: MessageMenuMessage) => void>}
		 */
		getActions()
		{
			return {
				[MarkAsResultAction.id]: this.addMarkAsResultAction.bind(this),
				[UnmarkAsResultAction.id]: this.addUnmarkAsResultAction.bind(this),
			};
		}

		/**
		 * @return {Object<string, (message: MessageMenuMessage) => void>}
		 */
		getActionHandlers()
		{
			return {
				[MarkAsResultAction.id]: this.markAsResult.bind(this),
				[UnmarkAsResultAction.id]: this.unmarkAsResult.bind(this),
			};
		}

		/**
		 * @param {MessageMenuMessage} message
		 * @return {Promise<string[]>}
		 */
		async getOrderedActions(message)
		{
			return [
				MessageMenuActionType.reply,
				MessageMenuActionType.openVoteResult,
				MessageMenuActionType.revote,
				MessageMenuActionType.copy,
				MessageMenuActionType.copyLink,
				MessageMenuActionType.edit,
				MessageMenuActionType.subscribe,
				MessageMenuActionType.unsubscribe,
				MessageMenuActionType.pin,
				MessageMenuActionType.unpin,
				MessageMenuActionType.forward,
				MessageMenuActionType.askCopilot,
				MessageMenuActionType.feedback,
				MarkAsResultAction.id,
				UnmarkAsResultAction.id,
				MessageMenuActionType.create,
				MessageMenuActionType.downloadToDevice,
				MessageMenuActionType.downloadToDisk,
				MessageMenuActionType.profile,
				MessageMenuActionType.finishVote,
				MessageMenuActionType.delete,
				MessageMenuActionType.multiselect,
			];
		}

		/**
		 * @param {MessageMenuView} menu
		 * @param {MessageMenuMessage} message
		 */
		addMarkAsResultAction(menu, message)
		{
			if (this.#isAuthor(message) && !this.#isResultExist(message))
			{
				menu.addAction(MarkAsResultAction);
			}
		}

		/**
		 * @param {MessageMenuView} menu
		 * @param {MessageMenuMessage} message
		 */
		addUnmarkAsResultAction(menu, message)
		{
			if (this.#isAuthor(message) && this.#isResultExist(message))
			{
				menu.addAction(UnmarkAsResultAction);
			}
		}

		/**
		 * @param {MessageMenuMessage} message
		 */
		markAsResult(message)
		{
			const taskId = this.relatedEntity.id;
			const messageId = message.messageModel.id;
			const resultId = selectResultIdByTaskIdAndMessageId(store.getState(), taskId, messageId);

			if (!resultId)
			{
				dispatch(
					addFromMessage({ taskId, messageId }),
				);
			}
		}

		unmarkAsResult(message)
		{
			const taskId = this.relatedEntity.id;
			const messageId = message.messageModel.id;
			const resultId = selectResultIdByTaskIdAndMessageId(store.getState(), taskId, messageId);

			if (resultId)
			{
				dispatch(
					remove({ taskId, resultId }),
				);
			}
		}

		#isAuthor(message)
		{
			return Number(message.messageModel.authorId) === Number(env.userId);
		}

		#isResultExist(message)
		{
			const taskId = this.relatedEntity.id;
			const messageId = message.messageModel.id;
			const resultId = selectResultIdByTaskIdAndMessageId(store.getState(), taskId, messageId);

			return Boolean(resultId);
		}
	}

	module.exports = {
		CommentContextMenu,
	};
});
