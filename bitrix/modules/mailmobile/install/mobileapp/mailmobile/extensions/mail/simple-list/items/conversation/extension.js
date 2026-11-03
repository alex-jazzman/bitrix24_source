/**
 * @module mail/simple-list/items/conversation
 */
jn.define('mail/simple-list/items/conversation', (require, exports, module) => {
	const { PerfPoint } = require('debug/prism');
	const { Loc } = require('loc');
	const { Haptics } = require('haptics');
	const { Icon } = require('assets/icons');
	const { PopupMenu } = require('ui-system/popups/popup-menu');
	const { showToast, showErrorToast } = require('toast');
	const { Base } = require('layout/ui/simple-list/items/base');
	const { ConversationContentView } = require('mail/simple-list/items/conversation/src/conversation-content');
	const { ConversationItemsView } = require('mail/simple-list/items/conversation/src/conversation-items');
	const { buildConversationRowViewModel } = require('mail/simple-list/items/conversation/src/conversation-view-model');
	const {
		ConversationAction,
		ConversationActionRunner,
		CONVERSATION_ACTION_TEST_ID_PREFIX,
		REMOVING_ACTIONS,
	} = require('mail/simple-list/items/conversation/src/action-menu');
	const conversationLoaderApi = require('mail/simple-list/items/conversation/src/conversation-loader');
	const conversationInteractionApi = require('mail/simple-list/items/conversation/src/conversation-interaction');
	const { openFolderSelector } = require('mail/message/actions');
	const { DraftConnector } = require('mail/draft/connector');
	const { AjaxMethod } = require('mail/const');
	const { messagesRemoved, messagesReadStatusApplied } = require('mail/statemanager/redux/slices/messages');
	const { selectById } = require('mail/statemanager/redux/slices/conversations/selector');
	const {
		selectCurrentFolderPath,
		selectCurrentVirtualFolderKey,
		selectIsVirtualFolderMode,
		selectFoldersByType,
	} = require('mail/statemanager/redux/slices/folders/selector');
	const { selectCurrentMailboxId } = require('mail/statemanager/redux/slices/mailboxes/selector');
	const { parseDraftGridId } = require('mail/statemanager/redux/slices/conversations/src/state');
	const store = require('statemanager/redux/store');
	const { dispatch } = store;

	// Producer of the event the grid controller listens to; see message-grid/src/controller.js.
	const CONVERSATION_RELOAD_EVENT = 'mail.conversation:onReloadRequired';

	const ACTION_LABELS = {
		[ConversationAction.MARK_READ]: { phrase: 'MAILMOBILE_CONVERSATION_ACTION_MARK_READ', icon: Icon.DOUBLE_CHECK },
		[ConversationAction.MARK_UNREAD]: { phrase: 'MAILMOBILE_CONVERSATION_ACTION_MARK_UNREAD', icon: Icon.MAIL_COUNTER },
		[ConversationAction.MOVE]: { phrase: 'MAILMOBILE_CONVERSATION_ACTION_MOVE', icon: Icon.FOLDER },
		[ConversationAction.MARK_SPAM]: { phrase: 'MAILMOBILE_CONVERSATION_ACTION_MARK_SPAM', icon: Icon.ALERT_ACCENT },
		[ConversationAction.DELETE]: { phrase: 'MAILMOBILE_CONVERSATION_ACTION_DELETE', icon: Icon.TRASHCAN, destructive: true },
		[ConversationAction.DELETE_DRAFT]: { phrase: 'MAILMOBILE_CONVERSATION_ACTION_DELETE_DRAFT', icon: Icon.TRASHCAN, destructive: true },
	};

	class Conversation extends Base
	{
		getStyles()
		{
			const styles = super.getStyles();

			styles.wrapper.paddingBottom = 0;

			return styles;
		}

		renderItemContent()
		{
			const id = this.props.item.id;

			return View(
				{},
				View(
					{
						ref: (ref) => {
							this.rowRef = ref;
						},
					},
					ConversationContentView({
						id,
						itemDetailOpenHandler: this.props.itemDetailOpenHandler,
						onToggleExpand: this.params.onToggleConversation,
						onRetry: this.params.onRetryConversation,
						onLongClick: () => this.openActionMenu(id),
					}),
				),
				ConversationItemsView({
					id,
					itemDetailOpenHandler: this.props.itemDetailOpenHandler,
					onLoadMore: this.params.onLoadMoreConversation,
					onRetry: this.params.onRetryConversation,
				}),
			);
		}

		openActionMenu(conversationId)
		{
			const runner = this.#createRunner(conversationId);
			const actions = runner.availableActions();
			if (actions.length === 0)
			{
				return;
			}

			Haptics.impactLight();

			const items = actions.map((action) => {
				const label = ACTION_LABELS[action] ?? {};

				return {
					id: action,
					testId: `${CONVERSATION_ACTION_TEST_ID_PREFIX}-${action}`,
					title: Loc.getMessage(label.phrase),
					icon: label.icon ?? null,
					sectionCode: 'conversation',
					isDestructive: label.destructive === true,
					onItemSelected: () => this.#onActionSelected(runner, action),
				};
			});

			this.menu = new PopupMenu(items);
			this.menu.show({ target: this.rowRef });
		}

		#onActionSelected(runner, action)
		{
			if (action === ConversationAction.MOVE)
			{
				this.#openMover(runner);

				return;
			}

			void runner.run(action);
		}

		#openMover(runner)
		{
			openFolderSelector({
				onSelect: ({ folderSignature = null, folder = null }) => {
					const folderPath = folder?.path ?? selectFoldersByType(store.getState(), folderSignature, true)?.[0]?.path ?? null;
					if (folderPath === null)
					{
						return;
					}

					void runner.run(ConversationAction.MOVE, { folderPath });
				},
			});
		}

		#createRunner(conversationId)
		{
			const showPartialFailure = () => showToast({
				message: Loc.getMessage('MAILMOBILE_CONVERSATION_ACTION_PARTIAL_FAILURE'),
			});

			return new ConversationActionRunner({
				getTarget: () => this.#readTarget(conversationId),
				getContext: () => this.#readContext(),
				runAction: async (request) => {
					const perfPoint = new PerfPoint('Mail Conversation Action', request.action).start();

					try
					{
						const response = await BX.ajax.runAction(
							AjaxMethod.executeConversationAction,
							{ data: request },
						);
						const failed = response?.data?.failed;
						if (response?.data?.truncated === true && !(Array.isArray(failed) && failed.length > 0))
						{
							showPartialFailure();
						}

						return response;
					}
					finally
					{
						perfPoint.end();
					}
				},
				applyResult: (result) => this.#applyResult(result),
				deleteSingleDraft: (draftId) => this.#deleteSingleDraft(draftId),
				reloadSummary: () => BX.postComponentEvent(CONVERSATION_RELOAD_EVENT, [{ conversationId }]),
				showErrorToast: (error) => showErrorToast(error),
				showPartialFailureToast: showPartialFailure,
			});
		}

		#readTarget(conversationId)
		{
			const summary = selectById(store.getState(), conversationId);
			const vm = buildConversationRowViewModel(summary) ?? {};
			const isDraftOnly = vm.isChain === false && vm.hasDraft === true;

			return {
				conversationId: summary?.conversationId ?? summary?.id ?? conversationId,
				rowId: conversationId,
				version: summary?.version ?? null,
				availableActions: vm.availableActions ?? [],
				isVirtualFolderMode: selectIsVirtualFolderMode(store.getState()),
				isDraftOnly,
				draftId: isDraftOnly ? (parseDraftGridId(conversationId) ?? 0) : 0,
			};
		}

		#readContext()
		{
			const state = store.getState();

			return {
				mailboxId: selectCurrentMailboxId(state),
				folderPath: selectCurrentFolderPath(state),
				virtualFolderKey: selectCurrentVirtualFolderKey(state),
			};
		}

		#applyResult(result)
		{
			const { action, processedMessageIds } = result;
			if (processedMessageIds.length === 0)
			{
				return;
			}

			if (action === ConversationAction.MARK_READ || action === ConversationAction.MARK_UNREAD)
			{
				dispatch(messagesReadStatusApplied({
					objectIds: processedMessageIds,
					isRead: action === ConversationAction.MARK_READ,
				}));

				return;
			}

			if (REMOVING_ACTIONS.includes(action))
			{
				dispatch(messagesRemoved({ objectIds: processedMessageIds }));
			}
		}

		#deleteSingleDraft(draftId)
		{
			if (!(draftId > 0))
			{
				return;
			}

			void new DraftConnector()
				.deleteMany({ draftIds: [draftId] })
				.then(() => BX.postComponentEvent(CONVERSATION_RELOAD_EVENT, [{ draftId }]))
			;
		}
	}

	module.exports = { Conversation, ...conversationLoaderApi, ...conversationInteractionApi };
});
