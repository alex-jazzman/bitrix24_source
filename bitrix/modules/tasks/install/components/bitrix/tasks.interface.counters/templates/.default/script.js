/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
(function (exports, main_core, main_core_events, ui_buttons, ui_counterpanel, tasks_viewed, ui_analytics) {
	'use strict';

	class Filter {
		constructor(options) {
			this.filterId = options.filterId;
			this.filterManager = BX.Main.filterManager.getById(this.filterId);
			this.bindEvents();
			this.updateFields();
		}
		bindEvents() {
			main_core_events.EventEmitter.subscribe('BX.Main.Filter:apply', this.onFilterApply.bind(this));
		}
		onFilterApply() {
			this.updateFields();
		}
		updateFields() {
			this.fields = this.filterManager.getFilterFieldsValues();
		}
		isFilteredByField(field) {
			if (!Object.keys(this.fields).includes(field)) {
				return false;
			}
			if (main_core.Type.isArray(this.fields[field])) {
				return this.fields[field].length > 0;
			}
			return this.fields[field] !== '';
		}
		isFilteredByFieldValue(field, value) {
			return this.isFilteredByField(field) && this.fields[field] === value;
		}
		toggleByField(field) {
			const name = field.filterField;
			const value = field.filterValue;
			if (!this.isFilteredByFieldValue(name, value)) {
				this.filterManager.getApi().extendFilter({
					[name]: value
				}, false, {
					COUNTER_TYPE: 'TASKS_COUNTER_TYPE_' + value
				});
				return;
			}
			this.filterManager.getFilterFields().forEach(field => {
				if (field.getAttribute('data-name') === name) {
					this.filterManager.getFields().deleteField(field);
				}
			});
			this.filterManager.getSearch().apply();
		}
		getFilter() {
			return this.filterManager;
		}
	}

	class Counters extends ui_counterpanel.CounterPanel {
		static READ_ALL_ID = 'read_all';
		static COLOR_GRAY = 'GRAY';
		static COLOR_THEME = 'THEME';
		static COLOR_SUCCESS = 'SUCCESS';
		static get counterTypes() {
			return {
				my: ['expired', 'my_expired', 'originator_expired', 'accomplices_expired', 'auditor_expired', 'new_comments', 'my_new_comments', 'originator_new_comments', 'accomplices_new_comments', 'auditor_new_comments', 'projects_total_expired', 'projects_total_comments', 'sonet_total_expired', 'sonet_total_comments', 'groups_total_expired', 'groups_total_comments', 'scrum_total_comments', 'flow_total_expired', 'flow_total_comments'],
				other: ['project_expired', 'project_comments', 'projects_foreign_expired', 'projects_foreign_comments', 'groups_foreign_expired', 'groups_foreign_comments', 'sonet_foreign_expired', 'sonet_foreign_comments', 'scrum_foreign_comments'],
				additional: ['muted_new_comments'],
				expired: ['expired', 'my_expired', 'originator_expired', 'accomplices_expired', 'auditor_expired', 'project_expired', 'projects_total_expired', 'projects_foreign_expired', 'groups_total_expired', 'groups_foreign_expired', 'sonet_total_expired', 'sonet_foreign_expired', 'flow_total_expired'],
				comment: ['new_comments', 'my_new_comments', 'originator_new_comments', 'accomplices_new_comments', 'auditor_new_comments', 'muted_new_comments', 'project_comments', 'projects_total_comments', 'projects_foreign_comments', 'groups_total_comments', 'groups_foreign_comments', 'sonet_total_comments', 'sonet_foreign_comments', 'scrum_total_comments', 'scrum_foreign_comments', 'flow_total_comments', 'new_comments_total'],
				project: ['project_expired', 'projects_total_expired', 'projects_foreign_expired', 'groups_total_expired', 'groups_foreign_expired', 'sonet_total_expired', 'sonet_foreign_expired', 'project_comments', 'projects_total_comments', 'projects_foreign_comments', 'groups_total_comments', 'groups_foreign_comments', 'sonet_total_comments', 'sonet_foreign_comments'],
				scrum: ['scrum_total_comments', 'scrum_foreign_comments']
			};
		}
		static updateTimeout = false;
		static needUpdate = false;
		static timeoutTTL = 5000;
		#filterId;
		constructor(options) {
			super({
				target: options.renderTo,
				items: [],
				multiselect: true,
				title: main_core.Loc.getMessage('TASKS_COUNTER_MY')
			});
			this.userId = options.userId;
			this.targetUserId = options.targetUserId;
			this.groupId = options.groupId;
			this.counters = options.counters;
			this.initialCounterTypes = options.counterTypes;
			this.role = options.role;
			this.signedParameters = options.signedParameters;
			this.#filterId = options.filterId;
			this.tasksChatUri = options.tasksChatUri;
			this.viewState = options.viewState || 'list';
			this.chatButton = null;
			this.setData(this.counters);
			this.initPull();
			this.elements = this.getCounterItems(this.counters);
			this.setItems(this.elements);
		}
		isMyTaskList() {
			return this.userId === this.targetUserId;
		}
		isUserTaskList() {
			return Object.keys(this.otherCounters).length === 0;
		}
		isProjectsTaskList() {
			return this.groupId > 0;
		}
		isProjectList() {
			return !this.isUserTaskList() && !this.isProjectsTaskList();
		}
		initPull() {
			BX.PULL.subscribe({
				moduleId: 'tasks',
				callback: data => this.processPullEvent(data)
			});
			this.extendWatch();
		}
		extendWatch() {
			if (this.isProjectsTaskList() || this.isProjectList()) {
				let tagId = 'TASKS_PROJECTS';
				if (this.isProjectsTaskList()) {
					tagId = `TASKS_PROJECTS_${this.groupId}`;
				}
				BX.PULL.extendWatch(tagId, true);
				setTimeout(() => this.extendWatch(), 29 * 60 * 1000);
			}
		}
		processPullEvent(data) {
			const eventHandlers = {
				user_counter: this.onUserCounter.bind(this),
				project_counter: this.onProjectCounter.bind(this),
				comment_read_all: this.onCommentReadAll.bind(this)
			};
			const has = Object.prototype.hasOwnProperty;
			const {
				command,
				params
			} = data;
			if (has.call(eventHandlers, command)) {
				const method = eventHandlers[command];
				if (method) {
					method.apply(this, [params]);
				}
			}
		}
		bindEvents() {
			main_core_events.EventEmitter.subscribe('BX.UI.CounterPanel.Item:activate', this.#onActivateItem.bind(this));
			main_core_events.EventEmitter.subscribe('BX.UI.CounterPanel.Item:deactivate', this.#onDeactivateItem.bind(this));
			main_core_events.EventEmitter.subscribe('BX.UI.CounterPanel.Item:click', this.#readAll.bind(this));
			main_core_events.EventEmitter.subscribe('BX.Main.Filter:apply', this.onFilterApply.bind(this));
			main_core.Event.bind(window, 'resize', main_core.Runtime.throttle(() => {
				if (this.#isBigScreen()) {
					this.getItemById(Counters.READ_ALL_ID)?.expand();
				} else {
					this.getItemById(Counters.READ_ALL_ID)?.collapse();
				}
			}, 10, this));
		}
		#readAll(event) {
			const item = event.getData().item;
			if (item.getId() === Counters.READ_ALL_ID) {
				if (this.isUserTaskList() || this.isProjectsTaskList() && this.role !== 'view_all') {
					this.readAllByRole();
				} else if (this.myCounters.scrum_total_comments || this.otherCounters.scrum_foreign_comments) {
					this.readAllForScrum();
				} else {
					this.readAllForProjects();
				}
				item.lock();
			}
		}
		#isBigScreen() {
			return window.innerWidth > 1520;
		}
		#onActivateItem(event) {
			const item = event.getData();
			const itemId = item.id;
			let count = null;
			Object.values(this.elements).forEach(element => {
				if (element.id === itemId) {
					count = element;
				}
			});
			this.#activateLinkedMenuItem(item);
			this.filter.toggleByField(count);
			this.#sendAnalyticsEvent(item);
			main_core_events.EventEmitter.emit('Tasks.Toolbar:onItem', {
				counter: count
			});
			main_core_events.EventEmitter.emit('BX.Tasks.Counters:active', count);
		}
		#activateLinkedMenuItem(item) {
			const items = this.getItems();
			Object.values(items).forEach(element => {
				if (element.id !== item.id) {
					element.deactivate(false);
				}
			});
			if (item.hasParentId()) {
				this.getItemById(item.parentId).activate(false);
			}
		}
		#onDeactivateItem(event) {
			const item = event.getData();
			let itemId = item.id;
			let count = null;
			if (item.parent) {
				item.getItems().forEach(childItemId => {
					const childItem = this.getItemById(childItemId);
					if (childItem.isActive) {
						itemId = childItem.id;
					}
				});
			}
			Object.values(this.elements).forEach(element => {
				if (element.id === itemId) {
					count = element;
				}
			});
			this.#deactivateLinkedMenuItem(item);
			this.filter.toggleByField(count);
			main_core_events.EventEmitter.emit('Tasks.Toolbar:onItem', {
				counter: count
			});
			main_core_events.EventEmitter.emit('BX.Tasks.Counters:unActive', count);
		}
		#deactivateLinkedMenuItem(item) {
			if (item.hasParentId()) {
				const parentItem = this.getItemById(item.parentId);
				parentItem.deactivate(false);
				return;
			}
			if (item.parent) {
				item.getItems().forEach(childItemId => {
					const childItem = this.getItemById(childItemId);
					if (childItem.isActive) {
						childItem.deactivate(false);
					}
				});
			}
		}
		#getColorByValue(value, color) {
			return Number(value) === 0 ? Counters.COLOR_GRAY : color.toUpperCase();
		}
		onFilterApply() {
			if (this.isRoleChanged()) {
				this.getItems().forEach(item => item.deactivate(false));
				this.updateRole();
				this.updateCountersData();
			} else {
				Object.values(this.elements).forEach(element => {
					const item = this.getItemById(element.id);
					const isFiltered = this.filter.isFilteredByFieldValue(element.filterField, element.filterValue);
					if (!isFiltered) {
						item.deactivate(false);
					}
				});
				this.#markCounters();
			}
		}
		updateCountersData() {
			if (Counters.updateTimeout) {
				Counters.needUpdate = true;
				return;
			}
			Counters.updateTimeout = true;
			Counters.needUpdate = false;
			main_core.ajax.runComponentAction('bitrix:tasks.interface.counters', 'getCounters', {
				mode: 'class',
				data: {
					groupId: this.groupId,
					role: this.role,
					counters: this.initialCounterTypes
				},
				signedParameters: this.signedParameters
			}).then(response => this.rerender(response.data), response => console.log(response));
			setTimeout(() => {
				Counters.updateTimeout = false;
				if (Counters.needUpdate) {
					this.updateCountersData();
				}
			}, Counters.timeoutTTL);
		}
		isRoleChanged() {
			return this.role !== (this.filter.isFilteredByField('ROLEID') ? this.filter.fields.ROLEID : 'view_all');
		}
		updateRole() {
			this.role = this.filter.isFilteredByField('ROLEID') ? this.filter.fields.ROLEID : 'view_all';
		}
		onCommentReadAll(data) {
			this.updateCountersData();
		}
		onUserCounter(data) {
			const has = Object.prototype.hasOwnProperty;
			if (!this.isUserTaskList() || !this.isMyTaskList() || !has.call(data, this.groupId) || this.userId !== Number(data.userId)) {
				// most likely project counters were updated, but due to 'isSonetEnable' flag only user counters are comming
				this.updateCountersData();
				return;
			}
			if (data.isSonetEnabled !== undefined && data.isSonetEnabled === false) {
				this.updateCountersData();
			}
		}
		onProjectCounter(data) {
			if (this.isUserTaskList()) {
				return;
			}
			this.updateCountersData();
		}
		getCounterItems(counters) {
			let items = [];
			let parentTotal = 0;
			const parentItemId = 'tasks_more';
			let hasOther = false;
			const availableTypes = new Set([...Counters.counterTypes.my, ...Counters.counterTypes.other]);
			items = [];
			Object.entries(counters).forEach(([type, data]) => {
				if (!availableTypes.has(type)) {
					return;
				}
				if (Counters.counterTypes.other.includes(type)) {
					hasOther = true;
					parentTotal += Number(data.VALUE);
					items.push({
						id: type,
						title: this.getCounterNameByType(type),
						value: {
							value: Number(data.VALUE),
							order: -1
						},
						parentId: parentItemId,
						color: this.#getColorByValue(Number(data.VALUE), data.STYLE),
						filterField: data.FILTER_FIELD,
						filterValue: data.FILTER_VALUE
					});
				} else {
					items.push({
						id: type,
						title: this.getCounterNameByType(type),
						value: Number(data.VALUE),
						isRestricted: false,
						color: this.#getColorByValue(Number(data.VALUE), data.STYLE),
						filterField: data.FILTER_FIELD,
						filterValue: data.FILTER_VALUE
					});
				}
			});
			if (!this.isUserTaskList() || this.isMyTaskList()) {
				items.push({
					id: Counters.READ_ALL_ID,
					title: main_core.Loc.getMessage('TASKS_COUNTER_READ_ALL'),
					collapsedIcon: 'chat-check',
					collapsed: !this.#isBigScreen(),
					locked: false,
					dataAttributes: {
						role: 'tasks-counters--item-head-read-all'
					}
				});
			}
			if (hasOther) {
				items.push({
					id: parentItemId,
					title: main_core.Loc.getMessage('TASKS_COUNTER_MORE'),
					value: {
						value: parentTotal,
						order: -1
					},
					isRestricted: false,
					color: Counters.COLOR_THEME
				});
			}
			return items;
		}
		getCounterNameByType(type) {
			if (Counters.counterTypes.expired.includes(type)) {
				return main_core.Loc.getMessage('TASKS_COUNTER_EXPIRED');
			}
			if (Counters.counterTypes.comment.includes(type)) {
				return main_core.Loc.getMessage('TASKS_COUNTER_NEW_COMMENTS');
			}
			return '';
		}
		setData(counters) {
			this.counters = counters;
			this.myCounters = {};
			this.otherCounters = {};
			const availableTypes = new Set([...Counters.counterTypes.my, ...Counters.counterTypes.other]);
			Object.entries(counters).forEach(([type, data]) => {
				if (!availableTypes.has(type)) {
					return;
				}
				const counterItem = {
					id: type,
					title: this.getCounterNameByType(type),
					value: Number(data.VALUE),
					color: this.#getColorByValue(Number(data.VALUE), data.STYLE),
					filterField: data.FILTER_FIELD,
					filterValue: data.FILTER_VALUE
				};
				if (Counters.counterTypes.my.includes(type)) {
					this.myCounters[type] = counterItem;
				} else if (Counters.counterTypes.other.includes(type)) {
					this.otherCounters[type] = counterItem;
				}
			});
		}
		readAllByRole() {
			new tasks_viewed.Controller().userComments({
				groupId: this.groupId,
				userId: this.userId,
				role: this.role
			});
		}
		readAllForProjects() {
			const allCounters = {
				...this.myCounters,
				...this.otherCounters
			};
			Object.entries(allCounters).forEach(([type, counter]) => {
				if (Counters.counterTypes.comment.includes(type)) {
					counter.updateCount(0);
				}
			});
			new tasks_viewed.Controller().projectComments({
				groupId: this.groupId
			});
		}
		readAllForScrum() {
			const allCounters = {
				...this.myCounters,
				...this.otherCounters
			};
			Object.entries(allCounters).forEach(([type, counter]) => {
				if (Counters.counterTypes.comment.includes(type)) {
					counter.updateCount(0);
				}
			});
			new tasks_viewed.Controller().scrumComments({
				groupId: this.groupId
			});
		}
		rerender(counters) {
			this.setData(counters);
			this.initChatButtonCounter();
			let parentTotal = 0;
			let parentId = null;
			let canResetReadAll = false;
			const availableTypes = new Set([...Counters.counterTypes.my, ...Counters.counterTypes.other]);
			Object.entries(counters).forEach(([code, counter]) => {
				if (!availableTypes.has(code)) {
					return;
				}
				const item = this.getItemById(code);
				if (item.hasParentId()) {
					parentId = item.parentId;
					parentTotal += Number(counter.VALUE);
				}
				item.updateValue(Number(counter.VALUE));
				item.updateColor(this.#getColorByValue(Number(counter.VALUE), counter.STYLE));
				if (this.#getColorByValue(Number(counter.VALUE), counter.STYLE) === Counters.COLOR_SUCCESS) {
					canResetReadAll = true;
				}
			});
			if (canResetReadAll && (!this.isUserTaskList() || this.isMyTaskList())) {
				this.#updateReadAllItem(canResetReadAll);
			}
			if (parentId) {
				const item = this.getItemById(parentId);
				item.updateValue(parentTotal);
			}
		}
		render() {
			super.init();
			this.renderChatButton();
		}
		renderChatButton() {
			const container = document.getElementById('tasks-chat-button');
			if (!container || !this.tasksChatUri) {
				return;
			}
			this.chatButton = new ui_buttons.Button({
				text: main_core.Loc.getMessage('TASKS_COUNTERS_CHAT_BUTTON'),
				onclick: () => this.handleChatButtonClick(),
				collapsedIcon: ui_buttons.ButtonIcon.CHATS,
				style: ui_buttons.AirButtonStyle.OUTLINE,
				size: ui_buttons.ButtonSize.SMALL,
				useAirDesign: true,
				dataset: {
					testid: 'tasks-counters-chat-button'
				}
			});
			this.initChatButtonCounter();
			this.chatButton.renderTo(container);
		}
		async handleChatButtonClick() {
			const {
				Messenger
			} = await top.BX.Runtime.loadExtension('im.public');
			const isChatOpen = Boolean(Messenger?.isEmbeddedMode() || Messenger?.isMessengerSliderOpened());
			if (this.isProjectsTaskList()) {
				if (isChatOpen) {
					top.BX.Event.EventEmitter.emit('IM.Recent:closeNestedList');
					top.BX.Event.EventEmitter.emit('IM.Recent:openNestedList', {
						parentDialogId: `sg${this.groupId}`,
						options: {
							recentType: 'tasksTask',
							compactMode: true
						}
					});
					BX.SidePanel.Instance.getSliderByWindow(window)?.close();
				} else {
					await Messenger?.openCollab(`sg${this.groupId}`, {
						recentType: 'tasksTask',
						compactMode: true
					});
				}
			} else if (isChatOpen) {
				BX.SidePanel.Instance.emulateAnchorClick('/online/?IM_TASK');
			} else {
				BX.SidePanel.Instance.emulateAnchorClick(this.tasksChatUri);
			}
			ui_analytics.sendData({
				tool: 'tasks',
				category: 'chat_operations',
				type: 'task',
				event: 'click_chat_tasks',
				c_section: 'task',
				c_sub_section: this.viewState,
				c_element: 'chat_tasks_button'
			});
		}
		initChatButtonCounter() {
			if (!this.chatButton) {
				return;
			}
			const counterData = this.isProjectsTaskList() ? this.counters.new_comments : this.counters.new_comments_total;
			if (!counterData) {
				return;
			}
			const value = Number(counterData.VALUE);
			if (this.chatButton.getRightCounter()) {
				this.chatButton.getRightCounter().setValue(value);
				this.chatButton.getRightCounter().setColor(this.getChatButtonCounterColor(value));
				return;
			}
			this.chatButton.setRightCounter({
				value,
				color: this.getChatButtonCounterColor(value)
			});
		}
		getChatButtonCounterColor(value) {
			return value ? ui_buttons.ButtonCounterStyle.FILLED_SUCCESS : ui_buttons.ButtonCounterStyle.OUTLINE_NO_ACCENT;
		}
		connectWithFilter() {
			this.filter = new Filter({
				filterId: this.#filterId
			});
			this.bindEvents();
			this.#markCounters();
		}
		#markCounters() {
			let parentId = null;
			let canResetReadAll = false;
			Object.values(this.elements).forEach(element => {
				const item = this.getItemById(element.id);
				const isFiltered = this.filter.isFilteredByFieldValue(element.filterField, element.filterValue);
				if (item.color === Counters.COLOR_SUCCESS) {
					canResetReadAll = true;
				}
				if (isFiltered) {
					if (item.hasParentId()) {
						parentId = item.parentId;
					}
					item.activate(false);
				}
			});
			if (canResetReadAll && (!this.isUserTaskList() || this.isMyTaskList())) {
				this.#updateReadAllItem(canResetReadAll);
			}
			if (parentId) {
				this.getItemById(parentId).activate(false);
			}
		}
		#updateReadAllItem(canResetReadAll) {
			const readAllItem = this.getItemById(Counters.READ_ALL_ID);
			if (canResetReadAll && readAllItem.isLocked()) {
				readAllItem.unLock();
			}
			if (!canResetReadAll && !readAllItem.isLocked()) {
				readAllItem.lock();
			}
		}
		#sendAnalyticsEvent(item) {
			ui_analytics.sendData({
				tool: 'tasks',
				category: 'task_operations',
				type: 'task',
				event: this.#getAnalyticsEvent(item),
				c_section: this.#getAnalyticsSection(item),
				c_sub_section: this.viewState,
				c_element: this.#getAnalyticsElement(item)
			});
		}
		#getAnalyticsEvent(item) {
			if (Counters.counterTypes.expired.includes(item.id)) {
				return 'overdue_counters_on';
			}
			return 'comments_counters_on';
		}
		#getAnalyticsSection(item) {
			if (Counters.counterTypes.scrum.includes(item.id)) {
				return 'scrum';
			}
			if (Counters.counterTypes.project.includes(item.id)) {
				return 'project';
			}
			return 'tasks';
		}
		#getAnalyticsElement(item) {
			if (Counters.counterTypes.expired.includes(item.id)) {
				return 'overdue_counters_filter';
			}
			return 'comments_counters_filter';
		}
	}

	exports.Counters = Counters;

})(this.BX.Tasks.Counters = this.BX.Tasks.Counters || {}, BX, BX.Event, BX.UI, BX.UI, BX.Tasks.Viewed, BX.UI.Analytics);
//# sourceMappingURL=script.js.map
