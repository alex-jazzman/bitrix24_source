/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
(function (exports, main_core, main_popup, main_core_events, pull_client, ui_dialogs_messagebox) {
	'use strict';

	class Item {
		ACCEPTED_ITEM_CLASS = 'menu-popup-item-accept';
		DISABLED_ITEM_CLASS = 'menu-popup-item-disabled';
		OPTION_ROLE = 'menuitemradio';
		#item;
		#hintManager;
		getItem() {
			if (!main_core.Type.isUndefined(this.#item)) {
				return this.#item;
			}
			if (main_core.Type.isUndefined(this.MENU_ID) || main_core.Type.isUndefined(this.HINT_ID) || main_core.Type.isUndefined(this.TITLE)) {
				return null;
			}
			this.#item = {
				dataset: {
					id: this.MENU_ID
				},
				id: this.MENU_ID,
				html: this.#getHtml(),
				className: `menu-popup-item-none menu-popup-${this.TITLE}-deadline`,
				events: {
					onSubMenuShow: this.#onSubMenuShow.bind(this)
				},
				items: this.getSubItems()
			};
			return this.#item;
		}
		onPromiseError(error) {
			const errors = error.errors;
			if (main_core.Type.isUndefined(errors)) {
				console.error(error);
				return;
			}
			ui_dialogs_messagebox.MessageBox.alert(main_core.Loc.getMessage('TASKS_DEADLINE_MENU_ERROR_DESCRIPTION'), main_core.Loc.getMessage('TASKS_DEADLINE_MENU_ERROR_TITLE'));
		}
		getSubItems() {
			return [];
		}
		refreshIcons(subItems, subMenu) {}

		/**
		 * The role is set from here and not from the item options: main.popup applies `attrs` before
		 * forcing `role="menuitem"` on the very same node, so a role passed with the options is lost.
		 */
		markOption(item, selected) {
			const node = item?.getLayout().item;
			if (!main_core.Type.isElementNode(node) || !item.isFocusable()) {
				return;
			}
			main_core.Dom.attr(node, 'role', this.OPTION_ROLE);
			main_core.Dom.attr(node, 'aria-checked', selected ? 'true' : 'false');
		}
		#getHtml() {
			const node = main_core.Tag.render`
			<div class="tasks-deadline-menu_${this.TITLE}-deadline-item__text">
				${main_core.Loc.getMessage(`TASKS_DEADLINE_MENU_${this.TITLE.toUpperCase()}_ITEM_TITLE`)}
			</div>
		`;
			this.#hintManager = BX.UI.Hint.createInstance({
				id: this.HINT_ID
			});
			const hint = this.#hintManager.createNode(main_core.Loc.getMessage(`TASKS_DEADLINE_MENU_${this.TITLE.toUpperCase()}_ITEM_HINT`));
			main_core.Dom.append(hint, node);
			return node;
		}
		#onSubMenuShow(event) {
			const item = event.getTarget();
			const subMenu = item.getSubMenu();
			const subItems = subMenu.getMenuItems();
			this.refreshIcons(subItems, subMenu);
			this.#bringHintToFront(subMenu);
		}
		#bringHintToFront(subMenu) {
			const subMenuComponent = subMenu.getPopupWindow().getZIndexComponent();
			const hintPopup = this.#hintManager.popup;
			if (!hintPopup) {
				return;
			}
			const hintComponent = hintPopup.getZIndexComponent();
			hintComponent.setSort(subMenuComponent.getSort() + 1);
			const stack = hintComponent.getStack();
			stack.sort();
		}
	}

	class DefaultItem extends Item {
		MENU_ID = 'default-deadline-menu';
		HINT_ID = 'default-deadline-hint';
		TITLE = 'default';
		#PULL_EVENT = 'default_deadline_changed';
		#SECONDS_IN_DAY = 86400;
		#SECONDS_IN_WEEK = 7 * this.#SECONDS_IN_DAY;
		#SUBITEMS_CLASS_NAME = 'menu-popup-default-deadline-item';
		#subMenu;
		#subItems;
		#defaultDeadline;
		#isDeadlineNotificationAvailable;
		constructor(isDeadlineNotificationAvailable = true) {
			super();
			this.#isDeadlineNotificationAvailable = isDeadlineNotificationAvailable;
			this.#subscribeToPull();
		}
		getSubItems() {
			const onclick = this.#onMenuItemClick.bind(this);
			const subItems = [new main_popup.MenuItem({
				dataset: {
					id: `${this.MENU_ID}-day`,
					analytics: 'one_day_button'
				},
				text: main_core.Loc.getMessage('TASKS_DEADLINE_MENU_DEFAULT_ITEM_1_DAY'),
				value: this.#SECONDS_IN_DAY,
				isExactTime: false,
				className: this.#SUBITEMS_CLASS_NAME,
				onclick
			}), new main_popup.MenuItem({
				dataset: {
					id: `${this.MENU_ID}-three-days`,
					analytics: 'three_days_button'
				},
				text: main_core.Loc.getMessage('TASKS_DEADLINE_MENU_DEFAULT_ITEM_3_DAYS'),
				value: 3 * this.#SECONDS_IN_DAY,
				isExactTime: false,
				className: this.#SUBITEMS_CLASS_NAME,
				onclick
			}), new main_popup.MenuItem({
				dataset: {
					id: `${this.MENU_ID}-week`,
					analytics: 'one_week_button'
				},
				text: main_core.Loc.getMessage('TASKS_DEADLINE_MENU_DEFAULT_ITEM_1_WEEK'),
				value: this.#SECONDS_IN_WEEK,
				isExactTime: false,
				className: this.#SUBITEMS_CLASS_NAME,
				onclick
			}), new main_popup.MenuItem({
				dataset: {
					id: `${this.MENU_ID}-two-weeks`,
					analytics: 'two_weeks_button'
				},
				text: main_core.Loc.getMessage('TASKS_DEADLINE_MENU_DEFAULT_ITEM_2_WEEKS'),
				value: 2 * this.#SECONDS_IN_WEEK,
				isExactTime: false,
				className: this.#SUBITEMS_CLASS_NAME,
				onclick
			}), new main_popup.MenuItem({
				dataset: {
					id: `${this.MENU_ID}-empty`,
					analytics: 'no_deadline'
				},
				text: main_core.Loc.getMessage('TASKS_DEADLINE_MENU_DEFAULT_ITEM_EMPTY'),
				value: 0,
				isExactTime: false,
				className: this.#SUBITEMS_CLASS_NAME,
				onclick
			})];
			if (this.#isDeadlineNotificationAvailable) {
				subItems.push(new main_popup.MenuItem({
					dataset: {
						id: `${this.MENU_ID}-custom`
					},
					text: main_core.Loc.getMessage('TASKS_DEADLINE_MENU_DEFAULT_ITEM_CUSTOM'),
					className: this.#SUBITEMS_CLASS_NAME
				}));
			}
			return subItems;
		}
		refreshIcons(subItems, subMenu) {
			const subItemsFilled = main_core.Type.isArrayFilled(subItems) || !main_core.Type.isUndefined(this.#subItems);
			const subMenuFilled = !main_core.Type.isUndefined(subMenu) || !main_core.Type.isUndefined(this.#subMenu);
			if (!subItemsFilled || !subMenuFilled) {
				return;
			}
			if (main_core.Type.isArrayFilled(subItems)) {
				this.#subItems = subItems;
			}
			if (!main_core.Type.isUndefined(subMenu)) {
				this.#subMenu = subMenu;
			}
			let isDefaultDeadlineFound = false;
			let customItem = null;
			this.#subItems.forEach(item => {
				const node = item.getLayout().item;
				if (!main_core.Type.isElementNode(node)) {
					return;
				}
				const currentDeadline = item.value;
				if (main_core.Type.isUndefined(currentDeadline)) {
					customItem = item;
				} else if (currentDeadline === this.defaultDeadline) {
					main_core.Dom.addClass(node, this.ACCEPTED_ITEM_CLASS);
					this.markOption(item, true);
					isDefaultDeadlineFound = true;
					return;
				}
				main_core.Dom.removeClass(node, this.ACCEPTED_ITEM_CLASS);
				this.markOption(item, false);
			});
			if (!main_core.Type.isNull(customItem)) {
				const customItemClass = isDefaultDeadlineFound ? this.DISABLED_ITEM_CLASS : this.ACCEPTED_ITEM_CLASS;
				main_core.Dom.addClass(customItem.getLayout().item, customItemClass);
				this.markOption(customItem, !isDefaultDeadlineFound);
				return;
			}
			if (isDefaultDeadlineFound) {
				return;
			}
			customItem = new main_popup.MenuItem({
				dataset: {
					id: `${this.MENU_ID}-custom`
				},
				text: main_core.Loc.getMessage('TASKS_DEADLINE_MENU_DEFAULT_ITEM_CUSTOM'),
				className: `${this.#SUBITEMS_CLASS_NAME} ${this.ACCEPTED_ITEM_CLASS}`
			});
			this.markOption(this.#subMenu.addMenuItem(customItem), true);
		}
		#onMenuItemClick(event, item) {
			const deadline = item.value;
			if (!main_core.Type.isNumber(deadline)) {
				return;
			}
			if (deadline === this.#defaultDeadline) {
				return;
			}
			this.#defaultDeadline = deadline;
			const subMenu = item.getMenuWindow();
			const subItems = subMenu.getMenuItems();
			this.refreshIcons(subItems, subMenu);
			main_core.ajax.runAction('tasks.deadline.Deadline.setDefault', {
				data: {
					deadlineData: {
						default: deadline,
						isExactTime: item.isExactTime ? 'Y' : 'N'
					}
				},
				analytics: {
					tool: 'tasks',
					category: 'task_operations',
					event: 'click_settings',
					type: 'task',
					c_section: 'tasks',
					c_sub_section: 'default_deadline_selected',
					c_element: item.dataset?.analytics
				}
			}).catch(error => this.onPromiseError(error));
		}
		#subscribeToPull() {
			pull_client.PULL.subscribe({
				moduleId: 'tasks',
				command: this.#PULL_EVENT,
				callback: this.#onDefaultDeadlineChanged.bind(this)
			});
		}
		#onDefaultDeadlineChanged(params) {
			const deadline = params.deadline;
			if (!main_core.Type.isNumber(deadline) || this.#defaultDeadline === deadline) {
				return;
			}
			this.#defaultDeadline = deadline;
		}
		get defaultDeadline() {
			if (!main_core.Type.isUndefined(this.#defaultDeadline)) {
				return this.#defaultDeadline;
			}
			const settings = main_core.Extension.getSettings('tasks.deadline.menu');
			this.#defaultDeadline = Number(settings.get('defaultDeadline'));
			return this.#defaultDeadline;
		}
	}

	class NotificationItem extends Item {
		MENU_ID = 'skip-deadline-notification-menu';
		HINT_ID = 'skip-deadline-notification-hint';
		TITLE = 'notification';
		#PULL_EVENT = 'skip_deadline_notification_period_changed';
		#SUBITEMS_CLASS_NAME = 'menu-popup-skip-deadline-item';
		#subItems;
		#skipPeriod;
		constructor() {
			super();
			this.#subscribeToPull();
		}
		getSubItems() {
			const onclick = this.#onMenuItemClick.bind(this);
			return [new main_popup.MenuItem({
				text: main_core.Loc.getMessage('TASKS_DEADLINE_MENU_NOTIFICATION_ITEM_DELIMITER'),
				delimiter: true,
				className: this.#SUBITEMS_CLASS_NAME
			}), new main_popup.MenuItem({
				dataset: {
					id: `${this.MENU_ID}-always`,
					analytics: 'daily_remind'
				},
				text: main_core.Loc.getMessage('TASKS_DEADLINE_MENU_NOTIFICATION_ITEM_DONT_SKIP'),
				value: '',
				className: this.#SUBITEMS_CLASS_NAME,
				onclick
			}), new main_popup.MenuItem({
				dataset: {
					id: `${this.MENU_ID}-day`,
					analytics: 'no_remind_today'
				},
				text: main_core.Loc.getMessage('TASKS_DEADLINE_MENU_NOTIFICATION_ITEM_SKIP_FOR_DAY'),
				value: 'day',
				className: this.#SUBITEMS_CLASS_NAME,
				onclick
			}), new main_popup.MenuItem({
				dataset: {
					id: `${this.MENU_ID}-week`,
					analytics: 'no_remind_current_week'
				},
				text: main_core.Loc.getMessage('TASKS_DEADLINE_MENU_NOTIFICATION_ITEM_SKIP_FOR_WEEK'),
				value: 'week',
				className: this.#SUBITEMS_CLASS_NAME,
				onclick
			}), new main_popup.MenuItem({
				dataset: {
					id: `${this.MENU_ID}-month`,
					analytics: 'no_remind_current_month'
				},
				text: main_core.Loc.getMessage('TASKS_DEADLINE_MENU_NOTIFICATION_ITEM_SKIP_FOR_MONTH'),
				value: 'month',
				className: this.#SUBITEMS_CLASS_NAME,
				onclick
			}), new main_popup.MenuItem({
				dataset: {
					id: `${this.MENU_ID}-forever`,
					analytics: 'never_remind'
				},
				text: main_core.Loc.getMessage('TASKS_DEADLINE_MENU_NOTIFICATION_ITEM_SKIP_FOREVER'),
				value: 'forever',
				className: this.#SUBITEMS_CLASS_NAME,
				onclick
			})];
		}
		refreshIcons(subItems, subMenu) {
			const subItemsFilled = main_core.Type.isArrayFilled(subItems) || !main_core.Type.isUndefined(this.#subItems);
			if (!subItemsFilled) {
				return;
			}
			if (main_core.Type.isArrayFilled(subItems)) {
				this.#subItems = subItems;
			}
			this.#subItems.forEach(item => {
				const node = item.getLayout().item;
				if (!main_core.Type.isElementNode(node)) {
					return;
				}
				const currentSkipPeriod = item.value;
				const isSelected = currentSkipPeriod === this.skipPeriod;
				this.markOption(item, isSelected);
				if (isSelected) {
					main_core.Dom.addClass(node, this.ACCEPTED_ITEM_CLASS);
					return;
				}
				main_core.Dom.removeClass(node, this.ACCEPTED_ITEM_CLASS);
			});
		}
		#onMenuItemClick(event, item) {
			const skipPeriod = item.value;
			if (!main_core.Type.isString(skipPeriod)) {
				return;
			}
			if (skipPeriod === this.#skipPeriod) {
				return;
			}
			this.#skipPeriod = skipPeriod;
			const subMenu = item.getMenuWindow();
			const subItems = subMenu.getMenuItems();
			this.refreshIcons(subItems, subMenu);
			main_core.ajax.runAction('tasks.deadline.Notification.skip', {
				data: {
					notificationData: {
						skipPeriod
					}
				},
				analytics: {
					tool: 'tasks',
					category: 'task_operations',
					event: 'click_settings',
					type: 'task',
					c_section: 'tasks',
					c_sub_section: 'deadline_management',
					c_element: item.dataset?.analytics
				}
			}).catch(error => this.onPromiseError(error));
		}
		#subscribeToPull() {
			pull_client.PULL.subscribe({
				moduleId: 'tasks',
				command: this.#PULL_EVENT,
				callback: this.#onNotificationPeriodChanged.bind(this)
			});
		}
		#onNotificationPeriodChanged(params) {
			const period = params.period;
			if (!main_core.Type.isString(period) || this.#skipPeriod === period) {
				return;
			}
			this.#skipPeriod = period;
		}
		get skipPeriod() {
			if (!main_core.Type.isUndefined(this.#skipPeriod)) {
				return this.#skipPeriod;
			}
			const settings = main_core.Extension.getSettings('tasks.deadline.menu');
			this.#skipPeriod = String(settings.get('skipDeadlineNotificationPeriod'));
			return this.#skipPeriod;
		}
	}

	class Menu {
		#isDeadlineNotificationAvailable;
		get menuItems() {
			const defaultMenuItem = new DefaultItem(this.isDeadlineNotificationAvailable);
			const menuItems = [defaultMenuItem.getItem()];
			if (this.isDeadlineNotificationAvailable) {
				const notificationMenuItem = new NotificationItem();
				menuItems.push(notificationMenuItem.getItem());
			}
			return menuItems;
		}
		get isDeadlineNotificationAvailable() {
			if (!main_core.Type.isUndefined(this.#isDeadlineNotificationAvailable)) {
				return this.#isDeadlineNotificationAvailable;
			}
			const settings = main_core.Extension.getSettings('tasks.deadline.menu');
			this.#isDeadlineNotificationAvailable = Boolean(settings.get('isDeadlineNotificationAvailable'));
			return this.#isDeadlineNotificationAvailable;
		}
	}

	exports.Menu = Menu;

})(this.BX.Tasks.Deadline = this.BX.Tasks.Deadline || {}, BX, BX.Main, BX.Event, BX, BX.UI.Dialogs);
//# sourceMappingURL=menu.bundle.js.map
