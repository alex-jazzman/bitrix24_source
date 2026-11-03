/**
 * @module mail/simple-list/items/conversation/src/action-menu
 */
jn.define('mail/simple-list/items/conversation/src/action-menu', (require, exports, module) => {
	/**
	 * Dependency free on purpose: the conversation row menu (in the product component) is built from
	 * the pure helpers here, and the unit suite covers the request building, partial
	 * result application and context guard defined below. No `require` of Loc, ajax, redux or the popup
	 * may enter this module - the labels, the transport and the store all arrive as injected ports.
	 */
	const CONVERSATION_ACTION_TEST_ID_PREFIX = 'mail-conversation-action';

	// API-03 group actions over a conversation of the current physical folder. The server owns the
	// targets, so the client never sends message ids; it only names the action.
	const ConversationAction = Object.freeze({
		MARK_READ: 'markRead',
		MARK_UNREAD: 'markUnread',
		MOVE: 'move',
		DELETE: 'delete',
		MARK_SPAM: 'markSpam',
		DELETE_DRAFT: 'deleteDraft',
	});

	const SUPPORTED_ACTIONS = Object.freeze(Object.values(ConversationAction));

	// Actions whose processed messages leave the current folder list.
	const REMOVING_ACTIONS = Object.freeze([
		ConversationAction.MOVE,
		ConversationAction.DELETE,
		ConversationAction.MARK_SPAM,
	]);

	const DRAFT_GRID_ID_PREFIX = 'd:';

	const toId = (value) => String(value ?? '');

	const toPositiveInt = (value) => {
		const number = Number(value);

		return Number.isFinite(number) && number > 0 ? Math.floor(number) : 0;
	};

	const toPositiveIntList = (value) => (Array.isArray(value) ? value : [])
		.map((entry) => toPositiveInt(entry))
		.filter((entry) => entry > 0);

	/**
	 * The group commands a chain row offers: only the actions the summary itself declares and this
	 * client can perform. In the virtual multi-folder view the group menu is hidden entirely, because
	 * a group action is defined against a single physical folder.
	 *
	 * @param {ConversationActionTarget} target
	 * @return {string[]}
	 */
	const resolveConversationActions = (target = {}) => {
		if (target.isVirtualFolderMode === true)
		{
			return [];
		}

		const available = Array.isArray(target.availableActions) ? target.availableActions : [];

		return available.filter((action) => SUPPORTED_ACTIONS.includes(action));
	};

	/**
	 * A row that carries no conversationId is a single draft of the plain drafts list, not a chain:
	 * API-03 has no chain target to resolve and rejects it, so its deletion goes through the existing
	 * drafts endpoint instead of the group action.
	 *
	 * @param {ConversationActionTarget} target
	 * @param {string} action
	 * @return {boolean}
	 */
	const isSingleDraftDeletion = (target = {}, action) => {
		if (action !== ConversationAction.DELETE && action !== ConversationAction.DELETE_DRAFT)
		{
			return false;
		}

		const hasConversation = toId(target.conversationId) !== '';

		return !hasConversation && (target.isDraftOnly === true || toId(target.rowId).startsWith(DRAFT_GRID_ID_PREFIX));
	};

	/**
	 * API-03 request. The endpoint resolves the targets itself, so the request names the chain, the
	 * mailbox, the physical folder, the action and the composition version the list or the expansion
	 * reported for this context - never any message ids. A stale version is rejected by the server.
	 *
	 * @param {{
	 *     conversationId: string,
	 *     mailboxId: number,
	 *     folderPath: string|null,
	 *     action: string,
	 *     actionParameters?: object,
	 *     expectedVersion: string|null,
	 * }} params
	 * @return {object}
	 */
	const buildConversationActionRequest = ({
		conversationId,
		mailboxId,
		folderPath = null,
		action,
		actionParameters = {},
		expectedVersion = null,
	} = {}) => {
		const request = {
			conversationId: toId(conversationId),
			mailboxId: toPositiveInt(mailboxId),
			folderPath: toId(folderPath),
			action,
			expectedVersion: toId(expectedVersion),
		};

		if (actionParameters && Object.keys(actionParameters).length > 0)
		{
			request.actionParameters = actionParameters;
		}

		return request;
	};

	/**
	 * DTO-03 to the client decision. The result is partial by construction: successfully changed
	 * messages and per-item failures are listed apart, and a partial failure never reads as an overall
	 * success. The row must be re-read on any failure, on a draft removal (the composition changed) and
	 * whenever the server itself asks - the target limit and a concurrent change surface as that flag.
	 *
	 * @param {object} dto DTO-03
	 * @param {{action: string}} params
	 * @return {ConversationActionResult}
	 */
	const interpretConversationActionResult = (dto = {}, { action } = {}) => {
		const processedMessageIds = toPositiveIntList(dto.processedMessageIds);
		const processedDraftIds = toPositiveIntList(dto.processedDraftIds);
		const failed = Array.isArray(dto.failed) ? dto.failed : [];
		const hasFailure = failed.length > 0;

		return {
			action,
			conversationId: toId(dto.conversationId),
			processedMessageIds,
			processedDraftIds,
			failed,
			hasFailure,
			reloadRequired: dto.reloadRequired === true || hasFailure || processedDraftIds.length > 0,
			version: dto.version ?? null,
		};
	};

	/**
	 * Whether the response still belongs to the context the request was sent in. A folder or mailbox
	 * change while the request is in flight forbids applying the answer to the new context.
	 *
	 * @param {ConversationActionContext} requestContext
	 * @param {ConversationActionContext} currentContext
	 * @return {boolean}
	 */
	const isConversationActionContextValid = (requestContext = {}, currentContext = {}) => (
		toId(requestContext.mailboxId) === toId(currentContext.mailboxId)
		&& toId(requestContext.folderPath) === toId(currentContext.folderPath)
		&& toId(requestContext.virtualFolderKey) === toId(currentContext.virtualFolderKey)
	);

	const firstError = (errors) => (Array.isArray(errors) && errors.length > 0 ? errors[0] : null);

	/**
	 * Runs a single group action of a conversation row over API-03. It keeps no runtime of its own:
	 * the store reads, the transport, the state application and the toasts all arrive as ports, so the
	 * class is unit-tested with fakes and drags no product module into the suite.
	 *
	 * The whole chain is never removed optimistically. Only the messages and drafts the server reports
	 * as processed are applied; a failure keeps the row, shows a general error and re-reads its summary.
	 *
	 * Ports:
	 * - `getTarget()`               reads `{ conversationId, rowId, version, availableActions,
	 *                               isVirtualFolderMode, isDraftOnly, draftId }` of the row;
	 * - `getContext()`             the mailbox, physical folder and virtual key the action is sent in;
	 * - `runAction(request)`       performs API-03 and resolves with `{ data, errors }`;
	 * - `applyResult(result)`      applies processed messages and drafts to their existing state owners;
	 * - `deleteSingleDraft(id)`    deletes a lone draft through the existing drafts scenario;
	 * - `reloadSummary(id)`        re-reads the row summary after a failure or a composition change;
	 * - `showErrorToast(error)`    surfaces a hard endpoint error (stale version, access, not found);
	 * - `showPartialFailureToast()`surfaces the general "not everything changed" message.
	 */
	class ConversationActionRunner
	{
		constructor({
			getTarget = () => ({}),
			getContext = () => ({}),
			runAction,
			applyResult = () => {},
			deleteSingleDraft = () => {},
			reloadSummary = () => {},
			showErrorToast = () => {},
			showPartialFailureToast = () => {},
			normalizeError = (error) => error ?? null,
		} = {})
		{
			this.getTarget = getTarget;
			this.getContext = getContext;
			this.runAction = runAction;
			this.applyResult = applyResult;
			this.deleteSingleDraft = deleteSingleDraft;
			this.reloadSummary = reloadSummary;
			this.showErrorToast = showErrorToast;
			this.showPartialFailureToast = showPartialFailureToast;
			this.normalizeError = normalizeError;
		}

		/**
		 * The group commands the row currently offers.
		 *
		 * @return {string[]}
		 */
		availableActions()
		{
			return resolveConversationActions(this.getTarget() ?? {});
		}

		/**
		 * @param {string} action one of {@link ConversationAction}
		 * @param {object} [actionParameters] extra parameters, e.g. the target folder of a move
		 * @return {Promise|null} null when the action is not applicable to the row
		 */
		run(action, actionParameters = {})
		{
			const target = this.getTarget() ?? {};

			if (!resolveConversationActions(target).includes(action))
			{
				return null;
			}

			if (isSingleDraftDeletion(target, action))
			{
				return Promise.resolve(this.deleteSingleDraft(toPositiveInt(target.draftId)));
			}

			const requestContext = this.getContext() ?? {};
			const request = buildConversationActionRequest({
				conversationId: target.conversationId,
				mailboxId: requestContext.mailboxId,
				folderPath: requestContext.folderPath,
				action,
				actionParameters,
				expectedVersion: target.version,
			});

			return Promise.resolve()
				.then(() => this.runAction(request))
				.then((response) => this.#onResponse({ response, requestContext, target, action }))
				.catch((error) => this.#onError({ error, requestContext, target }));
		}

		#onResponse({ response, requestContext, target, action })
		{
			if (!isConversationActionContextValid(requestContext, this.getContext() ?? {}))
			{
				return;
			}

			const error = firstError(response?.errors);
			if (error !== null)
			{
				this.showErrorToast(error);
				this.reloadSummary(toId(target.conversationId));

				return;
			}

			const result = interpretConversationActionResult(response?.data ?? {}, { action });
			this.applyResult(result);

			if (result.hasFailure)
			{
				this.showPartialFailureToast();
			}

			if (result.reloadRequired)
			{
				this.reloadSummary(toId(target.conversationId));
			}
		}

		#onError({ error, requestContext, target })
		{
			if (!isConversationActionContextValid(requestContext, this.getContext() ?? {}))
			{
				return;
			}

			this.showErrorToast(this.normalizeError(error));
			this.reloadSummary(toId(target.conversationId));
		}
	}

	module.exports = {
		ConversationAction,
		ConversationActionRunner,
		CONVERSATION_ACTION_TEST_ID_PREFIX,
		REMOVING_ACTIONS,
		SUPPORTED_ACTIONS,
		buildConversationActionRequest,
		interpretConversationActionResult,
		isConversationActionContextValid,
		isSingleDraftDeletion,
		resolveConversationActions,
	};
});
