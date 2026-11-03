/**
 * @module mail/statemanager/redux/slices/conversations/selector
 */
jn.define('mail/statemanager/redux/slices/conversations/selector', (require, exports, module) => {
	const { sliceName } = require('mail/statemanager/redux/slices/conversations/meta');
	const { createConversationSelectors } = require('mail/statemanager/redux/slices/conversations/src/state');

	/** @type {ConversationSelectors} */
	const selectors = createConversationSelectors((state) => state[sliceName]);

	module.exports = selectors;
});
