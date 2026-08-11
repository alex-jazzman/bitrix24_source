/**
 * @module im/messenger/controller/navigation/src/nested/opener
 */
jn.define('im/messenger/controller/navigation/src/nested/opener', (require, exports, module) => {
	const { RecentTabByNavigationTab } = require('im/messenger/const');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { NestedTabCounters } = require('im/messenger/lib/counters/tab-counters');
	const { ChatAvatar } = require('im/messenger/lib/element/chat-avatar');
	const { NestedTabsConfig } = require('im/messenger/controller/navigation/src/nested/tabs-config');

	const rightButtonsStub = [
		{id: 'search', type: 'search'},
		{id: 'filter', type: 'filter_funnel'},
		{id: 'more', type: 'more'},
	];

	/**
	 * @class NestedNavigationOpener
	 * Opens a nested tab widget for a given parent chat.
	 * Returns the widget and title — all lifecycle orchestration is handled by NavigationManager.
	 */
	class NestedNavigationOpener
	{
		/**
		 * Opens the nested tab widget for the given parent chat.
		 * @param {number} chatId — chatId of the parent chat
		 * @param code
		 * @returns {Promise<{widget: object, title: string}>}
		 */
		async open(chatId, code)
		{
			const store = serviceLocator.get('core').getStore();
			const dialog = store.getters['dialoguesModel/getByChatId'](chatId);
			const title = dialog?.name ?? '';
			const dialogId = `chat${chatId}`;
			const avatar = ChatAvatar.createFromDialogId(dialogId).getNavigationHeaderAvatarProps();

			const items = NestedTabsConfig.map((tabConfig) => {
				const recentSection = RecentTabByNavigationTab[tabConfig.id];
				const counter = NestedTabCounters.calculateTabCounter(store, recentSection, chatId);

				tabConfig.widget.settings = {
					rightButtons: rightButtonsStub
				};

				return {
					...tabConfig,
					counter,
					label: counter > 0 ? String(counter) : '',
				};
			});

			const widget = await PageManager.openWidget('tabs', {
				titleParams: {
					text: title,
					type: 'common',
					avatar,
				},
				code,
				rightButtons: rightButtonsStub,
				grabTitle: false,
				tabs: {
					items,
				},
			});

			return { widget };
		}
	}

	module.exports = { NestedNavigationOpener };
});
