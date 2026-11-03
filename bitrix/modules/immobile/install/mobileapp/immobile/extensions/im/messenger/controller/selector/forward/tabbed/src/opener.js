/**
 * @module im/messenger/controller/selector/forward/tabbed/src/opener
 */
jn.define('im/messenger/controller/selector/forward/tabbed/src/opener', (require, exports, module) => {
	const { EntitySelectorWidget } = require('selector/widget');
	const { Loc } = require('im/messenger/loc');

	const { UserHelper } = require('im/messenger/lib/helper');
	const { AnalyticsService } = require('im/messenger/provider/services/analytics');
	const { ForwardDialogSelectorProvider } = require('im/messenger/controller/selector/forward/tabbed/src/provider');
	const { ForwardTab, forwardTabRegistry } = require('im/messenger/controller/selector/forward/tabbed/src/tab-config');

	/**
	 * @description Propagates the active scope (tab) and search text to the provider.
	 * Called from a single place for all sources of scope/search changes:
	 * events.onScopeChanged, searchOptions.onSearch and searchOptions.onSearchCancelled.
	 * This avoids depending on the order of native events (on Android onScopeChanged
	 * may arrive after onListFill) and guarantees this.activeTab is updated before
	 * the widget itself calls provider.loadRecent() / doSearch() without a scope.
	 *
	 * @param {EntitySelectorWidget} widget
	 * @param {{ id: string }} scope
	 * @param {string} [text='']
	 */
	const applyScope = (widget, scope, text = '') => {
		widget.getProvider()?.setActiveTab(scope.id, text);
	};

	/**
	 * @param {Object} options
	 * @param {string} options.title
	 * @param {DialogId} [options.fromDialogId] source chat, needed for analytics only
	 * @param {Object} [options.providerOptions]
	 * @param {Function} [options.onItemSelected]
	 * @param {Function} [options.onSelectedChanged]
	 * @param {Function} [options.onClose]
	 * @param {Function} [options.onWidgetReady]
	 * @param {boolean} [options.allowMultipleSelection=false]
	 * @param {string} [options.sendButtonName]
	 * @param {boolean} [options.closeOnSelect=true]
	 * @param {PageManager} [parentWidget]
	 * @return {Promise}
	 */
	function openForwardDialogSelector({
		title,
		fromDialogId,
		providerOptions,
		allowMultipleSelection = false,
		closeOnSelect = true,
		sendButtonName,
		onItemSelected,
		onSelectedChanged,
		onClose,
		onWidgetReady,
	}, parentWidget)
	{
		// start_search is sent once per picker session, on the first non-empty query
		let searchStarted = false;
		const trackStartSearch = (text) => {
			if (searchStarted || text.trim().length === 0)
			{
				return;
			}

			searchStarted = true;
			AnalyticsService.getInstance().forwardAnalytics.sendStartSearch({
				fromDialogId,
				tab: entitySelectorWidget.getProvider()?.getActiveTab(),
			});
		};

		// Guests have access to a single chat only; the other forward tabs (tasks, projects,
		// channels, copilot) rely on REST methods that aren't whitelisted in the guest scope
		// (`MobileGuestApplication`), so loading them produces "extension not found" errors.
		const isGuest = UserHelper.isCurrentUserGuest();
		const scopes = forwardTabRegistry.getIds()
			.filter((tabId) => forwardTabRegistry.isAvailable(tabId))
			.filter((tabId) => !isGuest || tabId === ForwardTab.chats)
			.map((tabId) => ({
				id: tabId,
				title: forwardTabRegistry.getTitle(tabId),
			}))
			.filter(({ title }) => Boolean(title));

		const entitySelectorWidget = new EntitySelectorWidget({
			widgetParams: {
				titleParams: {
					text: title ?? Loc.getMessage('IMMOBILE_MESSENGER_FORWARD_SELECTOR_TITLE'),
					type: 'dialog',
				},
				backdrop: {
					mediumPositionPercent: 85,
					horizontalSwipeAllowed: false,
					onlyMediumPosition: true,
				},
				sendButtonName,
			},
			events: {
				onItemSelected,
				onSelectedChanged,
				onClose,
				onWidgetCreated: () => onWidgetReady?.(entitySelectorWidget),
				onScopeChanged: ({ scope, text }) => applyScope(entitySelectorWidget, scope, text),
			},
			searchOptions: {
				startTypingText: Loc.getMessage('IMMOBILE_MESSENGER_FORWARD_SELECTOR_EMPTY_STATE'),
				noResultsText: Loc.getMessage('IMMOBILE_MESSENGER_FORWARD_SELECTOR_EMPTY_STATE'),
				onSearch: ({ text, scope }) => {
					applyScope(entitySelectorWidget, scope, text);
					trackStartSearch(text);
				},
				onSearchCancelled: ({ scope }) => applyScope(entitySelectorWidget, scope, ''),
			},
			provider: {
				class: ForwardDialogSelectorProvider,
				options: providerOptions ?? {},
			},
			scopes,
			sectionTitles: {
				recent: Loc.getMessage('IMMOBILE_MESSENGER_FORWARD_SELECTOR_SEARCH_PLACEHOLDER'),
			},
			entityIds: ['dialog'],
			allowMultipleSelection,
			closeOnSelect,
			// The list is always filtered by the active tab, and picked recipients are shown as chips
			// above it, so the widget must not merge the selection back into the tab's rows.
			shouldRenderHiddenItemsInList: false,
		});

		return entitySelectorWidget.show({}, parentWidget);
	}

	module.exports = { openForwardDialogSelector };
});
