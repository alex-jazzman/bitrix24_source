/**
 * @module im/messenger/controller/selector/forward/tabbed/src/opener
 */
jn.define('im/messenger/controller/selector/forward/tabbed/src/opener', (require, exports, module) => {
	const { EntitySelectorWidget } = require('selector/widget');
	const { Loc } = require('im/messenger/loc');

	const { ForwardDialogSelectorProvider } = require('im/messenger/controller/selector/forward/tabbed/src/provider');
	const { forwardTabRegistry } = require('im/messenger/controller/selector/forward/tabbed/src/tab-config');

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
	 * @param {Object} [options.providerOptions]
	 * @param {Function} [options.onItemSelected]
	 * @param {Function} [options.onClose]
	 * @param {boolean} [options.closeOnSelect=true]
	 * @param {PageManager} [parentWidget]
	 * @return {Promise}
	 */
	function openForwardDialogSelector({
		title,
		providerOptions,
		closeOnSelect = true,
		onItemSelected,
		onClose,
	}, parentWidget)
	{
		const scopes = forwardTabRegistry.getIds()
			.filter((tabId) => forwardTabRegistry.get(tabId).isAvailable !== false)
			.map((tabId) => ({
				id: tabId,
				title: forwardTabRegistry.get(tabId).title,
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
			},
			events: {
				onItemSelected,
				onClose,
				onScopeChanged: ({ scope, text }) => applyScope(entitySelectorWidget, scope, text),
			},
			searchOptions: {
				startTypingText: Loc.getMessage('IMMOBILE_MESSENGER_FORWARD_SELECTOR_EMPTY_STATE'),
				noResultsText: Loc.getMessage('IMMOBILE_MESSENGER_FORWARD_SELECTOR_EMPTY_STATE'),
				onSearch: ({ text, scope }) => applyScope(entitySelectorWidget, scope, text),
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
			allowMultipleSelection: false,
			closeOnSelect,
		});

		return entitySelectorWidget.show({}, parentWidget);
	}

	module.exports = { openForwardDialogSelector };
});
