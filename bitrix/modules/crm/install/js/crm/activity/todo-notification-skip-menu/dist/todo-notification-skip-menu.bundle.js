/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
(function (exports, main_popup, main_core, crm_activity_todoNotificationSkip) {
	'use strict';

	class TodoNotificationSkipMenu {
		#selectedMenuItemId = null;
		#entityTypeId = null;
		#skipProvider = null;
		constructor(params) {
			this.#entityTypeId = params.entityTypeId;
			if (params.selectedValue) {
				this.#selectedMenuItemId = params.selectedValue;
			}
			this.#skipProvider = new crm_activity_todoNotificationSkip.TodoNotificationSkip({
				entityTypeId: this.#entityTypeId,
				onSkippedPeriodChange: this.#onSkippedPeriodChange.bind(this)
			});
		}
		setSelectedValue(value) {
			this.#selectedMenuItemId = value;
		}
		#onSkippedPeriodChange(period) {
			this.#selectedMenuItemId = period;
		}
		getItems() {
			const items = [];
			items.push({
				id: 'askForCreateTodo',
				text: this.#getMenuItemText(),
				className: 'menu-popup-item-none',
				items: this.#getSkipPeriodsMenuItems()
			});
			return items;
		}
		#getMenuItemText() {
			let messagePhrase = 'CRM_ACTIVITY_TODO_NOTIFICATION_SKIP_MENU_ITEM';
			switch (this.#entityTypeId) {
				case BX.CrmEntityType.enumeration.lead:
					messagePhrase = 'CRM_ACTIVITY_TODO_NOTIFICATION_SKIP_MENU_ITEM_LEAD';
					break;
				case BX.CrmEntityType.enumeration.deal:
					messagePhrase = 'CRM_ACTIVITY_TODO_NOTIFICATION_SKIP_MENU_ITEM_DEAL';
					break;
			}
			return main_core.Loc.getMessage(messagePhrase);
		}
		#getSkipPeriodsMenuItems() {
			const activeClass = 'menu-popup-item-accept';
			const inactiveClass = 'menu-popup-item-none';
			const items = [];
			items.push({
				id: 'activate',
				text: main_core.Loc.getMessage('CRM_ACTIVITY_TODO_NOTIFICATION_ACTIVATE'),
				className: this.#selectedMenuItemId ? inactiveClass : activeClass,
				disabled: this.#isLoading(),
				onclick: this.#onSkipMenuItemSelect.bind(this, '')
			});
			items.push({
				id: 'day',
				text: main_core.Loc.getMessage('CRM_ACTIVITY_TODO_NOTIFICATION_SKIP_PERIOD_DAY'),
				className: this.#selectedMenuItemId === 'day' ? activeClass : inactiveClass,
				disabled: this.#isLoading(),
				onclick: this.#onSkipMenuItemSelect.bind(this, 'day')
			});
			items.push({
				id: 'week',
				text: main_core.Loc.getMessage('CRM_ACTIVITY_TODO_NOTIFICATION_SKIP_PERIOD_WEEK'),
				className: this.#selectedMenuItemId === 'week' ? activeClass : inactiveClass,
				disabled: this.#isLoading(),
				onclick: this.#onSkipMenuItemSelect.bind(this, 'week')
			});
			items.push({
				id: 'month',
				text: main_core.Loc.getMessage('CRM_ACTIVITY_TODO_NOTIFICATION_SKIP_PERIOD_MONTH'),
				className: this.#selectedMenuItemId === 'month' ? activeClass : inactiveClass,
				disabled: this.#isLoading(),
				onclick: this.#onSkipMenuItemSelect.bind(this, 'month')
			});
			items.push({
				id: 'forever',
				text: main_core.Loc.getMessage('CRM_ACTIVITY_TODO_NOTIFICATION_SKIP_PERIOD_FOREVER'),
				className: this.#selectedMenuItemId === 'forever' ? activeClass : inactiveClass,
				disabled: this.#isLoading(),
				onclick: this.#onSkipMenuItemSelect.bind(this, 'forever')
			});
			return items;
		}
		#isLoading() {
			return this.#selectedMenuItemId === 'loading';
		}
		#onSkipMenuItemSelect(period, event, item) {
			item.getMenuWindow()?.getRootMenuWindow()?.close();
			this.#selectedMenuItemId = 'loading';
			this.#skipProvider.saveSkippedPeriod(period).then(() => {
				this.#selectedMenuItemId = period;
			});
		}
	}

	exports.TodoNotificationSkipMenu = TodoNotificationSkipMenu;

})(this.BX.Crm.Activity = this.BX.Crm.Activity || {}, BX.Main, BX, BX.Crm.Activity);
//# sourceMappingURL=todo-notification-skip-menu.bundle.js.map
