/**
 * @module mail/statemanager/redux/slices/conversations
 */
jn.define('mail/statemanager/redux/slices/conversations', (require, exports, module) => {
	const { createSlice } = require('statemanager/redux/toolkit');
	const { ReducerRegistry } = require('statemanager/redux/reducer-registry');
	const { sliceName } = require('mail/statemanager/redux/slices/conversations/meta');
	const conversationState = require('mail/statemanager/redux/slices/conversations/src/state');
	const {
		createConversationReducers,
		createConversationState,
	} = conversationState;

	/**
	 * Conversation summaries and their expansion live apart from the numeric message storage and
	 * are not restored from StateCache: a page of another grid context must never be shown.
	 */
	const conversationsSlice = createSlice({
		name: sliceName,
		initialState: createConversationState(),
		reducers: createConversationReducers(),
	});

	ReducerRegistry.register(sliceName, conversationsSlice.reducer);

	module.exports = {
		...conversationsSlice.actions,
		ConversationItemKind: conversationState.ConversationItemKind,
		ConversationPageMode: conversationState.ConversationPageMode,
		buildConversationContextKey: conversationState.buildConversationContextKey,
		parseDraftGridId: conversationState.parseDraftGridId,
		planListResponse: conversationState.planListResponse,
		resolveGridPageCursor: conversationState.resolveGridPageCursor,
		routeConversationItems: conversationState.routeConversationItems,
		routeGridItem: conversationState.routeGridItem,
	};
});
