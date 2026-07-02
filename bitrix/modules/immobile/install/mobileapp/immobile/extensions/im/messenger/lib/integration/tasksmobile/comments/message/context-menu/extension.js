/**
 * @module im/messenger/lib/integration/tasksmobile/comments/message/context-menu
 */
jn.define('im/messenger/lib/integration/tasksmobile/comments/message/context-menu', (require, exports, module) => {
	const { MessageContextMenu } = require('im/messenger/api/dialog-integration/message/context-menu');
	const { MenuSection, MenuActions } = require('im/messenger/controller/dialog/lib/message-menu');

	const { MessageMenuActionType, MessageMenuSectionId } = require('im/messenger/const');
	const { Loc } = require('loc');
	const { Icon } = require('ui-system/blocks/icon');

	const store = require('statemanager/redux/store');
	const { dispatch } = store;
	const {
		addFromMessage,
		remove,
		selectResultIdByTaskIdAndMessageId,
	} = require('tasks/statemanager/redux/slices/tasks-results-v2');

	/** @type {MessageContextMultiLevelMenuActionItem} */
	const MarkAsResultAction = {
		id: 'mark-as-result',
		testId: 'MESSAGE_MENU_ACTION_MARK_AS_RESULT',
		type: MenuActions.ActionViewType.base,
		title: Loc.getMessage('IMMOBILE_INTEGRATION_TASKSMOBILE_COMMENTS_MESSAGE_MENU_MARK_AS_RESULT'),
		iconName: Icon.WINDOW_FLAG.getIconName(),
	};

	/** @type {MessageContextMultiLevelMenuActionItem} */
	const UnmarkAsResultAction = {
		id: 'unmark-as-result',
		testId: 'MESSAGE_MENU_ACTION_UNMARK_AS_RESULT',
		type: MenuActions.ActionViewType.base,
		title: Loc.getMessage('IMMOBILE_INTEGRATION_TASKSMOBILE_COMMENTS_MESSAGE_MENU_UNMARK_AS_RESULT'),
		iconName: Icon.CIRCLE_CROSS.getIconName(),
	};

	/**
	 * @class CommentContextMenu
	 */
	class CommentContextMenu extends MessageContextMenu
	{
		/**
		 * @return {Object<string, (menu: MessageMenuView, message: MessageMenuActionHelper) => void>}
		 */
		getActions()
		{
			return {
				[MarkAsResultAction.id]: this.addMarkAsResultAction.bind(this),
				[UnmarkAsResultAction.id]: this.addUnmarkAsResultAction.bind(this),
			};
		}

		/**
		 * @return {Object<string, (message: MessageMenuActionHelper) => void>}
		 */
		getActionHandlers()
		{
			return {
				[MarkAsResultAction.id]: this.markAsResult.bind(this),
				[UnmarkAsResultAction.id]: this.unmarkAsResult.bind(this),
			};
		}

		/**
		 * @param {IMessageMenuActionHelper} actionHelper
		 * @return {Promise<string[]>}
		 */
		async getOrderedActions(actionHelper)
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
		 * @returns {Array<string|object>}
		 */
		getOrderedActionTree(actionHelper)
		{
			return [
				{
					sectionId: MessageMenuSectionId.dialogMain,
					children: [
						MessageMenuActionType.reply,
						MessageMenuActionType.copy,
						MessageMenuActionType.edit,
						MessageMenuActionType.forward,
						MessageMenuActionType.askCopilot,
						MarkAsResultAction.id,
						UnmarkAsResultAction.id,
						MessageMenuActionType.createTask,
						{
							sectionId: MessageMenuSectionId.dialogMore,
							nextMenuActionType: MessageMenuActionType.more,
							children: [
								MessageMenuActionType.pin,
								MessageMenuActionType.unpin,
								MessageMenuActionType.copyLink,
								MessageMenuActionType.createEvent,
								MessageMenuActionType.downloadToDevice,
								MessageMenuActionType.downloadToDisk,
								MessageMenuActionType.profile,
							],
						},
					],
				},
				{
					sectionId: MessageMenuSectionId.dialogFooter,
					children: [
						MessageMenuActionType.delete,
						MessageMenuActionType.multiselect,
					],
				},
			];
		}

		/**
		 * @return {Record<string, MessageContextMenuSectionItem>}
		 */
		getSection()
		{
			return {
				[MessageMenuSectionId.dialogMain]: MenuSection.MainSection,
				[MessageMenuSectionId.dialogMore]: MenuSection.MoreSection,
				[MessageMenuSectionId.dialogFooter]: MenuSection.MainSubSection,
			};
		}

		/**
		 * @param {MessageMenuView} menu
		 * @param {MessageMenuActionHelper} actionHelper
		 * @param {object} [options]
		 */
		addMarkAsResultAction(menu, actionHelper, options = {})
		{
			if (this.#isAuthor(actionHelper) && !this.#isResultExist(actionHelper))
			{
				menu.addAction(MarkAsResultAction, options);
			}
		}

		/**
		 * @param {MessageMenuView} menu
		 * @param {MessageMenuActionHelper} actionHelper
		 * @param {object} [options]
		 */
		addUnmarkAsResultAction(menu, actionHelper, options = {})
		{
			if (this.#isAuthor(actionHelper) && this.#isResultExist(actionHelper))
			{
				menu.addAction(UnmarkAsResultAction, options);
			}
		}

		/**
		 * @param {MessageMenuActionHelper} actionHelper
		 */
		markAsResult(actionHelper)
		{
			const taskId = this.relatedEntity.id;
			const messageId = actionHelper.messageModel.id;
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

		#isResultExist(actionHelper)
		{
			const taskId = this.relatedEntity.id;
			const messageId = actionHelper.messageModel.id;
			const resultId = selectResultIdByTaskIdAndMessageId(store.getState(), taskId, messageId);

			return Boolean(resultId);
		}
	}

	module.exports = {
		CommentContextMenu,
	};
});
