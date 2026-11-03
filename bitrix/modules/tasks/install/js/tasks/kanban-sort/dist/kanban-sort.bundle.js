/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, main_core_events, main_popup, ui_dialogs_messagebox, ui_a11y) {
	'use strict';

	class OrderType {
		static ASC = 'asc';
		static DESC = 'desc';
		static FIELD = 'field';
		static ACTUAL = 'actual';
		// the axis the "by activity" item stands for: the same server contract as the order values above
		static ACTIVITY_FIELD = 'ACTIVITY_DATE';
	}

	class KanbanMenu {
		#mainMenu;
		#mainItem;
		static SELECTED = 'menu-popup-item-accept';
		static DESELECTED = 'menu-popup-item-none';
		// the class comes from the filter template, the sort menu of the task list hides its items by it
		static HIDDEN = 'menu-popup-item-display-none';
		static DIRECTION_DELIMITER_ID = 'tasksKanbanSortDirectionDelimiter';
		// one role in a flat menu reads as one set of mutually exclusive items, so the radio role stays
		// with the order of the board alone: the direction and the new task placement are chosen on top of it
		static ORDER_ROLE = 'menuitemradio';
		static MODIFIER_ROLE = 'menuitemcheckbox';
		constructor(item, menu = null) {
			this.#mainItem = item;
			this.#mainMenu = menu ?? this.#mainItem.getMenuWindow();
		}

		/**
		 * The first render of the menu comes from the server, where the choice is expressed by a class
		 * only, and the sort options reach the item as options of a foreign menu we hold no reference to.
		 * The show of the menu is the single moment both are reachable.
		 */
		static describeOptions(items) {
			items.forEach(item => {
				const node = item?.layout?.item;
				const role = KanbanMenu.#getChoiceRole(item);
				if (!node || !role) {
					return;
				}
				main_core.Dom.attr(node, 'role', role);
				KanbanMenu.#nameItself(node);
				KanbanMenu.#markState(item, main_core.Dom.hasClass(node, KanbanMenu.SELECTED));
			});
		}

		/**
		 * The accessible name comes from the server on a nested span, whose generic role forbids
		 * `aria-label` - WebKit ignores it there. The name belongs to the item itself.
		 */
		static #nameItself(node) {
			const named = node.querySelector('.menu-popup-item-text [aria-label]');
			if (!named) {
				return;
			}
			main_core.Dom.attr(node, 'aria-label', named.getAttribute('aria-label'));
			main_core.Dom.attr(named, 'aria-label', null);
		}
		static #markState(item, selected) {
			const node = item?.layout?.item;
			if (!node || !KanbanMenu.#getChoiceRole(item)) {
				return;
			}
			main_core.Dom.attr(node, 'aria-checked', selected ? 'true' : 'false');
		}
		select(item) {
			main_core.Dom.removeClass(item.layout.item, KanbanMenu.DESELECTED);
			main_core.Dom.addClass(item.layout.item, KanbanMenu.SELECTED);
			KanbanMenu.#markState(item, true);
		}
		deselect(item) {
			main_core.Dom.removeClass(item.layout.item, KanbanMenu.SELECTED);
			main_core.Dom.addClass(item.layout.item, KanbanMenu.DESELECTED);
			KanbanMenu.#markState(item, false);
		}

		// the chosen axis and direction are marked by a class only: a screen reader needs the aria state
		syncAriaState() {
			KanbanMenu.describeOptions(this.getItems());
			this.#syncDirectionVisibility();
		}
		deselectAll() {
			this.getItems().forEach(element => {
				this.deselect(element);
			});
			this.#syncDirectionVisibility();
		}
		deselectSubItems() {
			this.getSubItems().forEach(element => {
				this.deselect(element);
			});
		}
		isSelected(item) {
			return main_core.Dom.hasClass(item.layout.item, KanbanMenu.SELECTED);
		}
		getSelectedField() {
			return this.#getSelectedParam('field');
		}
		getSelectedDirection() {
			return this.#getSelectedParam('direction');
		}
		applyFieldSort(field, direction) {
			this.removeSubItems();
			this.deselectAll();
			this.#select('field', field);
			this.#select('direction', direction);
			this.#syncDirectionVisibility();
		}
		isCustomSortEnabled() {
			const items = this.getItems();
			const ascSort = items.find(item => item.params?.type === 'sub' && item.params?.order === OrderType.ASC);
			const descSort = items.find(item => item.params?.type === 'sub' && item.params?.order === OrderType.DESC);
			return Boolean(ascSort) && Boolean(descSort);
		}
		addItemsFromItemParams(onSelectCallback) {
			KanbanMenu.#getOwnedItems(this.#mainItem).forEach(subItem => {
				if (main_core.Type.isString(subItem.params)) {
					subItem.params = BX.parseJSON(subItem.params);
				}
				if (subItem.params?.order) {
					subItem.onclick = onSelectCallback;
				}
				this.#mainMenu.addMenuItem(subItem);
			});
			KanbanMenu.describeOptions(this.getItems());
			ui_a11y.LiveAnnouncer.announce(main_core.Loc.getMessage('TASKS_KANBAN_A11Y_SORT_MENU_EXPANDED'), 'polite');
		}
		removeSubItems() {
			const subItems = this.getSubItems();
			this.#moveFocusOut(subItems);
			subItems.forEach(subItem => {
				this.#mainMenu.removeMenuItem(subItem.getId());
			});
			ui_a11y.LiveAnnouncer.announce(main_core.Loc.getMessage('TASKS_KANBAN_A11Y_SORT_MENU_COLLAPSED'), 'polite');
		}
		#moveFocusOut(items) {
			const focusedItem = items.find(item => this.#holdsFocus(item));
			if (!focusedItem) {
				return;
			}
			const menuItems = this.getItems();
			const stays = item => item.isFocusable() && !items.includes(item);
			const position = menuItems.indexOf(focusedItem);
			const neighbour = menuItems.slice(0, position).reverse().find(stays) ?? menuItems.slice(position + 1).find(stays);
			neighbour?.focus(ui_a11y.FocusMonitor.Instance.getLastInputModality() === 'keyboard');
		}
		#holdsFocus(item) {
			return item.isFocused() || item.layout.item.contains(document.activeElement);
		}
		getSubItems() {
			return this.getItems().filter(element => element.params?.type === 'sub');
		}
		getItems() {
			return this.#mainMenu.getMenuItems();
		}
		find(order = '') {
			return this.getItems().find(element => element.params?.order === order);
		}
		#getSelectedParam(name) {
			const selected = this.getItems().find(element => element.params?.[name] && this.isSelected(element));
			return selected?.params?.[name] ?? null;
		}
		#select(name, value) {
			// an empty value matches every item without the param, so there is nothing to highlight
			if (!value) {
				return;
			}
			const item = this.getItems().find(element => element.params?.[name] === value);
			if (item) {
				this.select(item);
			}
		}

		// the direction has nothing to apply to until an axis is chosen: a dead grey line reads as a defect,
		// so the direction leaves the menu the same way it does in the task list
		#syncDirectionVisibility() {
			const hasSelectedField = Boolean(this.getSelectedField());
			this.#getDirectionItems().forEach(item => {
				const node = item?.layout?.item;
				if (!node) {
					return;
				}
				if (hasSelectedField) {
					main_core.Dom.removeClass(node, KanbanMenu.HIDDEN);
				} else {
					main_core.Dom.addClass(node, KanbanMenu.HIDDEN);
				}
			});
		}

		// the line above the direction opens its block and leaves the menu together with it
		#getDirectionItems() {
			return this.getItems().filter(item => Boolean(item.params?.direction) || item.getId() === KanbanMenu.DIRECTION_DELIMITER_ID);
		}

		// the php menu keeps the sub items of the custom sort in its params list itself,
		// the menu built by the extension — under the items key
		static #getOwnedItems(item) {
			const params = item?.params;
			if (!KanbanMenu.#ownsSubItems(params)) {
				return [];
			}
			return Array.isArray(params) ? params : params.items;
		}
		static #ownsSubItems(params) {
			return Array.isArray(params) || Array.isArray(params?.items);
		}
		static #getChoiceRole(item) {
			const params = item?.params;
			// the sub items place new tasks inside the custom sort, they do not order the board
			const isSubItem = params?.type === 'sub';

			// the custom sort item is the only one that carries sub items of its own
			const isOrderItem = KanbanMenu.#ownsSubItems(params) || Boolean(params?.field) || Boolean(params?.order) && !isSubItem;
			if (isOrderItem) {
				return KanbanMenu.ORDER_ROLE;
			}
			return Boolean(params?.direction) || Boolean(params?.order) ? KanbanMenu.MODIFIER_ROLE : null;
		}
	}

	class KanbanAjaxComponent {
		#ajaxComponentPath;
		#ajaxComponentParams;
		constructor(parameters = {}) {
			this.#ajaxComponentPath = parameters?.ajaxComponentPath;
			this.#ajaxComponentParams = parameters?.ajaxComponentParams;
		}
		getPath() {
			return this.#ajaxComponentPath;
		}
		getParams() {
			return this.#ajaxComponentParams;
		}
	}

	class KanbanRequestSender {
		#ajaxComponent;
		#requestId = 0;
		// a sender serves a single order change, so the last request sent is counted for the whole class
		static #lastRequestId = 0;
		constructor() {
			this.#init();
		}
		setOrder(order = '') {
			return this.#send({
				order
			});
		}
		setFieldOrder(field, direction) {
			return this.#send({
				order: OrderType.FIELD,
				field,
				direction
			});
		}
		#send(order) {
			KanbanRequestSender.#lastRequestId++;
			this.#requestId = KanbanRequestSender.#lastRequestId;
			return BX.ajax.runComponentAction('bitrix:tasks.kanban', 'setNewTaskOrder', {
				mode: 'class',
				data: {
					...order,
					params: this.#ajaxComponent.getParams()
				}
			}).then(response => {
				// the board follows the order chosen last, so an answer overtaken by a newer request changes nothing
				if (this.#isOutdated()) {
					return null;
				}
				const data = response.data;
				// the event is global, so the kanban of another view needs the parameters to tell it is not the one
				BX.onCustomEvent(this, 'onTaskSortChanged', [data, this.#ajaxComponent.getParams()]);
				return data;
			});
		}
		#isOutdated() {
			return this.#requestId !== KanbanRequestSender.#lastRequestId;
		}
		#init() {
			this.#ajaxComponent = BX.Tasks.KanbanAjaxComponent.Parameters;
		}
	}

	const SETTINGS_MENU_ID = 'popupMenuOptions';
	class KanbanSort {
		#kanbanMenu;
		#requestSender;
		static #menuObserved = false;
		constructor() {
			this.#bindMethods();
		}
		static getInstance() {
			return new this();
		}
		enableCustomSort(event, item) {
			this.#requestSender = new KanbanRequestSender();
			this.#kanbanMenu = new KanbanMenu(item);
			if (this.#kanbanMenu.isCustomSortEnabled()) {
				return;
			}
			this.#kanbanMenu.addItemsFromItemParams(this.selectCustomOrder.bind(this));
			this.#kanbanMenu.deselectAll();
			this.#kanbanMenu.select(item);
			const selectedItem = this.#kanbanMenu.find(OrderType.DESC);
			this.#kanbanMenu.select(selectedItem);
			this.#setOrder(selectedItem);
		}
		disableCustomSort(event, item) {
			this.#requestSender = new KanbanRequestSender();
			this.#kanbanMenu = new KanbanMenu(item);
			// any other mode is left through this item, so the current selection is the only stop condition
			if (this.#kanbanMenu.isSelected(item)) {
				return;
			}
			this.#kanbanMenu.removeSubItems();
			this.#kanbanMenu.deselectAll();
			this.#kanbanMenu.select(item);
			this.#setOrder(item);
		}
		selectCustomOrder(event, item) {
			this.#requestSender = new KanbanRequestSender();
			this.#kanbanMenu = new KanbanMenu(item);
			if (!this.#kanbanMenu.isCustomSortEnabled()) {
				return;
			}
			this.#kanbanMenu.deselectSubItems();
			this.#kanbanMenu.select(item);
			this.#setOrder(item);
		}
		selectSortField(event, item) {
			const field = item?.params?.field;
			if (!field) {
				return;
			}
			this.#kanbanMenu = new KanbanMenu(item);
			const direction = this.#kanbanMenu.getSelectedDirection();
			// the same axis with the same direction is already applied, a board reload would change nothing
			if (direction && this.#kanbanMenu.isSelected(item)) {
				return;
			}

			// outside the field sort mode the menu has no direction chosen, so the saved one is the default
			this.#setFieldOrder(field, direction ?? item.params.defaultDirection ?? OrderType.ASC);
		}
		selectSortDirection(event, item) {
			const direction = item?.params?.direction;
			if (!direction) {
				return;
			}
			this.#kanbanMenu = new KanbanMenu(item);
			const field = this.#kanbanMenu.getSelectedField();
			// the direction belongs to a chosen axis, and the applied one needs no board reload
			if (!field || this.#kanbanMenu.isSelected(item)) {
				return;
			}
			this.#setFieldOrder(field, direction);
		}

		// the menu is built by the settings component, so its own opening is the only point
		// where the initial state of the axes and the direction can be announced
		static observeSettingsMenu() {
			if (KanbanSort.#menuObserved) {
				return;
			}
			KanbanSort.#menuObserved = true;
			main_core_events.EventEmitter.subscribe('BX.Main.Menu:onShow', event => {
				const menu = event.getTarget();
				if (menu?.getId() !== SETTINGS_MENU_ID) {
					return;
				}
				new KanbanMenu(null, menu).syncAriaState();
			});
		}
		#bindMethods() {
			this.enableCustomSort = this.enableCustomSort.bind(this);
			this.disableCustomSort = this.disableCustomSort.bind(this);
			this.selectCustomOrder = this.selectCustomOrder.bind(this);
			this.selectSortField = this.selectSortField.bind(this);
			this.selectSortDirection = this.selectSortDirection.bind(this);
		}
		#setOrder(item) {
			const order = item?.params?.order || '';
			this.#requestSender.setOrder(order).catch(KanbanSort.#showRequestError);
		}
		#setFieldOrder(field, direction) {
			this.#requestSender = new KanbanRequestSender();
			this.#requestSender.setFieldOrder(field, direction).then(state => {
				// the menu follows the saved state: an order the backend refused, as well as one the sender
				// dropped as outdated, must not stay highlighted
				if (state?.newTaskOrder === OrderType.FIELD) {
					this.#kanbanMenu.applyFieldSort(state.sortField, state.sortDirection);
				}
			}).catch(KanbanSort.#showRequestError);
		}

		// the menu is already switched to the order the request was about to save, so a refused save
		// leaves it out of sync with the server until the page is reloaded
		static #showRequestError(response) {
			const message = response?.errors?.[0]?.message;
			ui_dialogs_messagebox.MessageBox.alert(
			// the dialog puts its message into the DOM as html, and the server text is out of our control
			message ? main_core.Text.encode(message) : main_core.Loc.getMessage('TASKS_KANBAN_SORT_ERROR_SAVE_FAILED'), main_core.Loc.getMessage('TASKS_KANBAN_SORT_ERROR_TITLE'), () => window.location.reload(), main_core.Loc.getMessage('TASKS_KANBAN_SORT_ERROR_RELOAD'));
		}
	}

	const ROOT_ITEM_ID = 'tasksKanbanSortMenu';
	const ITEM_ID_PREFIX = 'tasksKanbanSort';
	class KanbanSortMenu {
		#options;
		#sort;
		constructor(options) {
			this.#options = KanbanSortMenu.#withActivityAxis(options ?? {});
			this.#sort = KanbanSort.getInstance();
		}

		// a board nobody has sorted yet is ordered by the activity axis descending, and the menu says so
		// instead of leaving the choice unmarked
		static #withActivityAxis(options) {
			if (options.order !== OrderType.ACTUAL) {
				return options;
			}
			return {
				...options,
				field: OrderType.ACTIVITY_FIELD,
				direction: OrderType.DESC
			};
		}

		// the board offers ten axes on top of the modes, and the root of the settings menu has no room
		// for all of them: the sort lives in a sub menu of its own, as it already does in the task list
		get menuItem() {
			return {
				id: ROOT_ITEM_ID,
				text: main_core.Loc.getMessage('TASKS_KANBAN_SORT_MENU_TITLE'),
				className: 'menu-popup-item-none',
				dataset: {
					testid: 'tasks-kanban-sort-menu'
				},
				// the chosen order is kept by the menu itself, so the sub menu has to outlive its closing
				cacheable: true,
				events: {
					onSubMenuShow: this.#handleSubMenuShow
				},
				items: this.#getItems()
			};
		}
		#getItems() {
			const items = [this.#getCustomSortItem(), {
				delimiter: true
			}, this.#getActivitySortItem(), {
				delimiter: true
			}, ...this.#getFieldItems(), {
				id: KanbanMenu.DIRECTION_DELIMITER_ID,
				delimiter: true
			}, this.#getDirectionItem(OrderType.ASC), this.#getDirectionItem(OrderType.DESC)];
			if (this.#isCustomSort()) {
				items.push(...this.#getNewTaskItems());
			}
			return items;
		}
		#getCustomSortItem() {
			return {
				id: `${ITEM_ID_PREFIX}OrderCustom`,
				dataset: {
					testid: 'tasks-kanban-sort-order-custom'
				},
				text: main_core.Loc.getMessage('TASKS_KANBAN_SORT_MENU_MY_SORT'),
				className: KanbanSortMenu.#getClassName(this.#isCustomSort()),
				// the "new tasks" block belongs to the custom sort and joins the menu together with it
				params: {
					items: this.#getNewTaskItems()
				},
				onclick: this.#sort.enableCustomSort
			};
		}

		// the activity is an axis like the rest, it only keeps the item of its own above them — as in the task list
		#getActivitySortItem() {
			return {
				id: `${ITEM_ID_PREFIX}OrderActual`,
				dataset: {
					testid: 'tasks-kanban-sort-order-actual'
				},
				html: KanbanSortMenu.#renderRecommended(main_core.Loc.getMessage('TASKS_KANBAN_SORT_MENU_ACTIVITY')),
				className: KanbanSortMenu.#getClassName(this.#options.field === OrderType.ACTIVITY_FIELD),
				params: this.#getFieldParams(OrderType.ACTIVITY_FIELD),
				onclick: this.#sort.selectSortField
			};
		}
		#getFieldItems() {
			return (this.#options.fields ?? []).map(field => ({
				id: `${ITEM_ID_PREFIX}Field${field.id}`,
				dataset: {
					testid: `tasks-kanban-sort-field-${KanbanSortMenu.#toTestId(field.id)}`
				},
				text: field.title,
				className: KanbanSortMenu.#getClassName(this.#options.field === field.id),
				params: this.#getFieldParams(field.id),
				onclick: this.#sort.selectSortField
			}));
		}

		// outside the field sort mode the menu has no direction chosen, so the saved one travels with the axis;
		// the activity axis falls back to the descending order — the freshest tasks on top, as the board opens
		#getFieldParams(fieldId) {
			const defaultDirection = this.#options.savedDirection ?? (fieldId === OrderType.ACTIVITY_FIELD ? OrderType.DESC : null);
			return defaultDirection ? {
				field: fieldId,
				defaultDirection
			} : {
				field: fieldId
			};
		}
		#getDirectionItem(direction) {
			const phraseId = direction === OrderType.ASC ? 'TASKS_KANBAN_SORT_MENU_DIRECTION_ASC' : 'TASKS_KANBAN_SORT_MENU_DIRECTION_DESC';
			return {
				id: `${ITEM_ID_PREFIX}Direction${direction}`,
				dataset: {
					testid: `tasks-kanban-sort-direction-${direction}`
				},
				text: main_core.Loc.getMessage(phraseId),
				className: KanbanSortMenu.#getClassName(this.#options.direction === direction),
				params: {
					direction
				},
				onclick: this.#sort.selectSortDirection
			};
		}
		#getNewTaskItems() {
			return [{
				id: `${ITEM_ID_PREFIX}NewTasksDelimiter`,
				delimiter: true,
				params: {
					type: 'sub'
				}
			}, {
				id: `${ITEM_ID_PREFIX}NewTasksTitle`,
				html: KanbanSortMenu.#renderTitle(main_core.Loc.getMessage('TASKS_KANBAN_SORT_MENU_NEW_TASKS')),
				params: {
					type: 'sub'
				}
			}, this.#getNewTaskItem(OrderType.DESC), this.#getNewTaskItem(OrderType.ASC)];
		}

		// the new task goes to the top of the column in the descending order and to the bottom in the ascending one
		#getNewTaskItem(order) {
			const phraseId = order === OrderType.DESC ? 'TASKS_KANBAN_SORT_MENU_NEW_TASKS_TOP' : 'TASKS_KANBAN_SORT_MENU_NEW_TASKS_BOTTOM';
			return {
				id: `${ITEM_ID_PREFIX}Order${order}`,
				dataset: {
					testid: `tasks-kanban-sort-order-${order}`
				},
				text: main_core.Loc.getMessage(phraseId),
				className: KanbanSortMenu.#getClassName(this.#options.order === order),
				params: {
					type: 'sub',
					order
				},
				onclick: this.#sort.selectCustomOrder
			};
		}
		#isCustomSort() {
			return this.#options.order === OrderType.ASC || this.#options.order === OrderType.DESC;
		}
		#handleSubMenuShow = event => {
			const subMenu = event.getTarget()?.getSubMenu();
			if (subMenu) {
				new KanbanMenu(null, subMenu).syncAriaState();
			}
		};
		static #getClassName(selected) {
			return selected ? KanbanMenu.SELECTED : KanbanMenu.DESELECTED;
		}
		static #renderTitle(text) {
			return main_core.Tag.render`<b>${main_core.Text.encode(text)}</b>`;
		}
		static #renderRecommended(text) {
			const label = main_core.Text.encode(main_core.Loc.getMessage('TASKS_KANBAN_SORT_MENU_ACTIVITY_LABEL'));
			const labelNode = main_core.Tag.render`<span class="menu-popup-item-sort-field-label">${label}</span>`;
			return main_core.Tag.render`<span>${main_core.Text.encode(text)}${labelNode}</span>`;
		}
		static #toTestId(field) {
			return field.toLowerCase().replaceAll('_', '-');
		}
	}

	/**
	 * Place of a card among the loaded ones of a column in the field sort mode.
	 * Mirrors the order of the selection: by the value of the active axis,
	 * empty values last, equal values by id ascending.
	 */
	class KanbanSortComparator {
		// the locale of the user is the closest client side match of the collation the selection is ordered by
		static #collator = new Intl.Collator();

		/**
		 * Returns id of the item the card must be placed before, null to the end of the loaded part.
		 * @param {SortableItem[]} items Loaded items of the column.
		 * @param {SortableItem} item Card to place.
		 * @param {?string} direction Sort direction, ascending unless desc is given.
		 * @returns {number | string | null}
		 */
		static findTargetId(items, item, direction) {
			const value = item.data.sort_value;
			if (KanbanSortComparator.#isEmpty(value)) {
				return null;
			}
			const order = direction === OrderType.DESC ? -1 : 1;
			for (const candidate of items) {
				if (candidate.id === item.id) {
					continue;
				}
				const candidateValue = candidate.data.sort_value;
				if (KanbanSortComparator.#isEmpty(candidateValue)) {
					return candidate.id;
				}
				const compared = KanbanSortComparator.#compare(value, candidateValue) * order;
				if (compared < 0 || compared === 0 && Number(item.id) < Number(candidate.id)) {
					return candidate.id;
				}
			}
			return null;
		}
		static #isEmpty(value) {
			return value === null || typeof value === 'undefined';
		}
		static #compare(value, candidateValue) {
			if (typeof value === 'number' && typeof candidateValue === 'number') {
				return value - candidateValue;
			}
			return KanbanSortComparator.#collator.compare(String(value), String(candidateValue));
		}
	}

	// the sort is created by the onclick of a menu item, so the loaded extension is all there is
	// when the settings menu opens for the first time
	KanbanSort.observeSettingsMenu();

	exports.KanbanAjaxComponent = KanbanAjaxComponent;
	exports.KanbanSort = KanbanSort;
	exports.KanbanSortComparator = KanbanSortComparator;
	exports.KanbanSortMenu = KanbanSortMenu;

})(this.BX.Tasks = this.BX.Tasks || {}, BX, BX.Event, BX.Main, BX.UI.Dialogs, BX.UI.Accessibility);
//# sourceMappingURL=kanban-sort.bundle.js.map
