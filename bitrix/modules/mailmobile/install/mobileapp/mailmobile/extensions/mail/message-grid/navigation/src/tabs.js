/**
 * @module mail/message-grid/navigation/src/tabs
 */
jn.define('mail/message-grid/navigation/src/tabs', (require, exports, module) => {
	const { Color } = require('tokens');
	const { Loc } = require('loc');

	const MESSAGE_GRID_TAB_IDS = {
		allIncome: 'all_income',
		unread: 'unread',
		sent: 'sent',
	};

	class MessageGridTabs
	{
		static get tabIds()
		{
			return MESSAGE_GRID_TAB_IDS;
		}

		constructor({ onTabSelected })
		{
			this.onTabSelected = onTabSelected;
			this.tabViewRef = null;
		}

		render()
		{
			return TabView({
				ref: this.#bindRef,
				style: {
					height: 51,
					backgroundColor: Color.bgPrimary,
				},
				params: {
					items: this.#getItems(),
				},
				onTabSelected: this.onTabSelected,
			});
		}

		setActiveItem(tabId)
		{
			this.tabViewRef?.setActiveItem(tabId);
		}

		updateUnreadCounter(counter)
		{
			const label = Number(counter) > 0 ? String(counter) : '';
			this.tabViewRef?.updateItem(MESSAGE_GRID_TAB_IDS.unread, { label });
		}

		#bindRef = (ref) => {
			this.tabViewRef = ref;
		};

		#getItems()
		{
			return [
				{
					title: Loc.getMessage('MAILMOBILE_MESSAGE_GRID_TAB_TITLE_ALL'),
					id: MESSAGE_GRID_TAB_IDS.allIncome,
				},
				{
					title: Loc.getMessage('MAILMOBILE_MESSAGE_GRID_TAB_TITLE_UNREAD'),
					id: MESSAGE_GRID_TAB_IDS.unread,
				},
				{
					title: Loc.getMessage('MAILMOBILE_MESSAGE_GRID_TAB_TITLE_SENT'),
					id: MESSAGE_GRID_TAB_IDS.sent,
				},
			];
		}
	}

	module.exports = {
		MessageGridTabs,
		MESSAGE_GRID_TAB_IDS,
	};
});
