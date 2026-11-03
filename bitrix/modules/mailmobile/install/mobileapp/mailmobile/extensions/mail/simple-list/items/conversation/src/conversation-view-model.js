/**
 * @module mail/simple-list/items/conversation/src/conversation-view-model
 */
jn.define('mail/simple-list/items/conversation/src/conversation-view-model', (require, exports, module) => {
	/**
	 * Dependency free on purpose: the conversation row component draws from the view model built
	 * here, and the unit suite covers the mapping the component renders. No `require`
	 * of Loc, tokens or redux may enter this module - the labels arrive as parameters instead.
	 */
	const CONVERSATION_TYPE = 'conversation';
	const CONVERSATION_TEST_ID_PREFIX = 'mail-conversation';

	/**
	 * @param {*} item
	 * @return {boolean} whether the row is a DTO-01 conversation summary and not a single message or draft
	 */
	const isConversationSummary = (item) => item?.type === CONVERSATION_TYPE;

	const toDisplayParticipant = (participant) => {
		const name = typeof participant?.name === 'string' ? participant.name.trim() : '';
		if (name !== '')
		{
			return name;
		}

		const email = typeof participant?.email === 'string' ? participant.email.trim() : '';

		return email;
	};

	/**
	 * @param {ConversationParticipant[]} participants
	 * @param {string} emptyLabel shown when a summary carries no named participant
	 * @return {string}
	 */
	const formatParticipants = (participants, emptyLabel) => {
		const names = (Array.isArray(participants) ? participants : [])
			.map(toDisplayParticipant)
			.filter((value) => value !== '')
		;

		return names.length > 0 ? names.join(', ') : emptyLabel;
	};

	const firstParticipant = (participants) => (Array.isArray(participants) ? participants[0] : null) ?? {};

	/**
	 * ISO 8601 activity date to the numeric timestamp the date component formats.
	 *
	 * @param {string} lastActivityAt
	 * @return {number} seconds since epoch, 0 when the date is missing or malformed
	 */
	const toActivityTimestamp = (lastActivityAt) => {
		const milliseconds = Date.parse(lastActivityAt);

		return Number.isFinite(milliseconds) ? Math.floor(milliseconds / 1000) : 0;
	};

	const toCount = (value) => {
		const count = Number(value);

		return Number.isFinite(count) && count > 0 ? Math.floor(count) : 0;
	};

	const buildConversationChildContainerStyle = ({
		isSelected,
		paddingLeft,
		selectedBackgroundColor,
		defaultBackgroundColor,
	}) => ({
		paddingLeft,
		backgroundColor: isSelected ? selectedBackgroundColor : defaultBackgroundColor,
	});

	/**
	 * View model of a collapsed conversation row from its DTO-01 summary.
	 *
	 * A summary with a single message carries no chain affordance: it reads as a plain message and
	 * exposes no count or expand control. The representative message id stays separate from the row
	 * id, so the chain is never addressed by a message id. The unread state is driven by the count
	 * alone, and the group commands come only from `availableActions`.
	 *
	 * @param {ConversationSummary} summary
	 * @param {ConversationRowLabels} [labels]
	 * @return {ConversationRowViewModel|null} null for a row that is not a conversation summary
	 */
	const buildConversationRowViewModel = (summary, labels = {}) => {
		if (!isConversationSummary(summary))
		{
			return null;
		}

		const id = String(summary.conversationId ?? summary.id ?? '');
		const messageCount = toCount(summary.messageCount);
		const unreadCount = toCount(summary.unreadCount);
		const incomplete = summary.incomplete === true;
		const retryAvailable = summary.retryAvailable === true;
		const subject = typeof summary.subject === 'string' ? summary.subject.trim() : '';
		const preview = typeof summary.preview === 'string' ? summary.preview.trim() : '';
		const primary = firstParticipant(summary.participants);

		return {
			id,
			testId: `${CONVERSATION_TEST_ID_PREFIX}-${id}`,
			expandTestId: `${CONVERSATION_TEST_ID_PREFIX}-expand-${id}`,
			subject: subject === '' ? (labels.emptySubject ?? '') : subject,
			participants: formatParticipants(summary.participants, labels.noParticipants ?? ''),
			avatarName: toDisplayParticipant(primary),
			avatarEmail: typeof primary.email === 'string' ? primary.email : '',
			preview,
			timestamp: toActivityTimestamp(summary.lastActivityAt),
			messageCount,
			isChain: messageCount > 1,
			hasUnread: unreadCount > 0,
			unreadCount,
			hasDraft: summary.hasDraft === true,
			incomplete,
			retryAvailable,
			showRetry: incomplete && retryAvailable,
			availableActions: Array.isArray(summary.availableActions) ? summary.availableActions : [],
			representativeMessageId: toCount(summary.representativeMessageId),
		};
	};

	module.exports = {
		CONVERSATION_TEST_ID_PREFIX,
		buildConversationChildContainerStyle,
		buildConversationRowViewModel,
		formatParticipants,
		isConversationSummary,
		toActivityTimestamp,
	};
});
