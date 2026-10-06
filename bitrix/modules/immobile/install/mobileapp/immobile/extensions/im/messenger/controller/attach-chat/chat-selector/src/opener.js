/**
 * @module im/messenger/controller/attach-chat/chat-selector/src/opener
 */
jn.define('im/messenger/controller/attach-chat/chat-selector/src/opener', (require, exports, module) => {
	const { EntitySelectorWidget } = require('selector/widget');
	const { Loc } = require('im/messenger/loc');
	const { MessengerIcon, IconType } = require('im/messenger/assets/icon');

	const { ChatDialogSelectorProvider } = require('im/messenger/controller/attach-chat/chat-selector/src/provider');

	/**
	 * @param {Object} options
	 * @param {string|number} options.parentChatId - excluded parent chat id
	 * @param {string} [options.title]
	 * @param {Function} [options.onItemSelected]
	 * @param {Function} [options.onClose]
	 * @param {Function} [options.onWidgetClosed] - fired after the widget is fully closed (e.g. after a selection)
	 * @param {Function} [options.onViewRemoved] - fired after the view is removed (e.g. on swipe-dismiss)
	 * @param {boolean} [options.closeOnSelect=true]
	 * @param {PageManager} [parentWidget]
	 */
	function openChatSelector({
		parentChatId,
		title,
		onItemSelected,
		onClose,
		onWidgetClosed,
		onViewRemoved,
		closeOnSelect = true,
	}, parentWidget)
	{
		const emptyTitle = Loc.getMessage('IMMOBILE_ATTACH_CHAT_SELECTOR_CHATS_SEARCH_EMPTY_TITLE');
		const emptyDescription = Loc.getMessage('IMMOBILE_ATTACH_CHAT_SELECTOR_CHATS_SEARCH_EMPTY_DESCRIPTION');

		const entitySelectorWidget = new EntitySelectorWidget({
			widgetParams: {
				titleParams: {
					text: title ?? Loc.getMessage('IMMOBILE_ATTACH_CHAT_SELECTOR_CHATS_TITLE'),
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
				onWidgetClosed,
				onViewRemoved,
			},
			searchOptions: {
				startTypingText: emptyTitle,
				noResultsText: emptyTitle,
				onSearch: ({ text }) => entitySelectorWidget.getProvider()?.applyQuery(text),
				onSearchCancelled: () => entitySelectorWidget.getProvider()?.applyQuery(''),
			},
			emptyState: {
				image: MessengerIcon.getByType(IconType.chatAttachEmptyState),
				title: emptyTitle,
				text: emptyDescription,
			},
			provider: {
				class: ChatDialogSelectorProvider,
				options: { parentChatId },
			},
			entityIds: ['dialog'],
			allowMultipleSelection: false,
			closeOnSelect,
		});

		return entitySelectorWidget.show({}, parentWidget);
	}

	module.exports = { openChatSelector };
});
