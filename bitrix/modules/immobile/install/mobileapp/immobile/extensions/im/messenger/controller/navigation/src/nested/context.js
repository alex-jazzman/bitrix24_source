/**
 * @module im/messenger/controller/navigation/src/nested/context
 */
jn.define('im/messenger/controller/navigation/src/nested/context', (require, exports, module) => {
	/**
	 * Holds all session-related state for a single nested navigation.
	 *
	 * @class NestedNavigationContext
	 */
	class NestedNavigationContext
	{
		/** @type {object} */
		widget;
		/** @type {number} */
		chatId;
		/** @type {string} */
		sessionId;
		/** @type {string} */
		previousRecentId;
		/** @type {string|null} */
		previousSessionId;
		/** @type {NestedTabSwitcher|null} */
		switcher;
		/** @type {NestedTabCounters|null} */
		tabCounters;
		/** @type {MessengerHeaderController|null} */
		headerController;
		/** @type {NestedMutationHandler|null} */
		mutationHandler;

		constructor({ widget, chatId, sessionId, previousRecentId, previousSessionId })
		{
			this.widget = widget;
			this.chatId = chatId;
			this.sessionId = sessionId;
			this.previousRecentId = previousRecentId;
			this.previousSessionId = previousSessionId;
			this.switcher = null;
			this.tabCounters = null;
			this.headerController = null;
			this.mutationHandler = null;
		}

		destroy()
		{
			this.mutationHandler?.destructor();
			this.tabCounters?.destructor();
			this.widget = null;
			this.switcher = null;
			this.tabCounters = null;
			this.headerController = null;
			this.mutationHandler = null;
			this.previousRecentId = null;
			this.previousSessionId = null;
		}
	}

	module.exports = { NestedNavigationContext };
});
