/* eslint-disable */
this.BX = this.BX || {};
this.BX.Socialnetwork = this.BX.Socialnetwork || {};
(function (exports, main_core, main_core_events, ui_shortView, pull_client, main_popup, ui_label, tasks_kanbanSort, ui_entitySelector, tasks_creationMenu, calendar_analytics, calendar_entry, socialnetwork_postForm, ui_popupcomponentsmaker, ui_switcher) {
	'use strict';

	class Filter extends main_core_events.EventEmitter {
		#filter;
		#filterContainer;
		#fields;
		constructor(params) {
			super(params);
			this.setEventNamespace('BX.Socialnetwork.Spaces.Filter');
			this.#filter = BX.Main.filterManager.getById(params.filterId);
			this.#filterContainer = params.filterContainer;
			this.#fields = this.#filter.getFilterFieldsValues();
			main_core_events.EventEmitter.subscribe('BX.Main.Filter:apply', this.#filterApply.bind(this));
			main_core_events.EventEmitter.subscribe('BX.Main.Filter:show', this.#filterShow.bind(this));
			main_core_events.EventEmitter.subscribe('BX.Main.Filter:blur', this.#filterHide.bind(this));
		}
		applyFilter() {
			this.#filter.applyFilter(false, true);
		}
		toggleField(fieldName, value) {
			if (!this.#isFilteredByFieldValue(fieldName, value)) {
				this.#filter.getApi().extendFilter({
					[fieldName]: value
				});
				return;
			}
			this.#filter.getFilterFields().forEach(field => {
				if (field.getAttribute('data-name') === fieldName) {
					this.#filter.getFields().deleteField(field);
				}
			});
			this.#filter.getSearch().apply();
		}
		#filterApply() {
			this.#fields = this.#filter.getFilterFieldsValues();
		}
		#filterShow() {
			main_core.Dom.addClass(this.#filterContainer, '--active');
		}
		#filterHide() {
			main_core.Dom.removeClass(this.#filterContainer, '--active');
		}
		#isFilteredByField(field) {
			if (!Object.keys(this.#fields).includes(field)) {
				return false;
			}
			if (main_core.Type.isArray(this.#fields[field])) {
				return this.#fields[field].length > 0;
			}
			return this.#fields[field] !== '';
		}
		#isFilteredByFieldValue(field, value) {
			return this.#isFilteredByField(field) && this.#fields[field].toString() === value.toString();
		}
	}

	class TasksCounters {
		#filter;
		#filterRole;
		#userId;
		#groupId;
		#counters;
		#isUserSpace;
		#isScrumSpace;
		#layout;
		constructor(params) {
			this.#userId = main_core.Type.isUndefined(params.userId) ? 0 : parseInt(params.userId, 10);
			this.#groupId = main_core.Type.isUndefined(params.groupId) ? 0 : parseInt(params.groupId, 10);
			this.#filter = params.filter;
			this.#filterRole = params.filterRole;
			this.#counters = params.counters;
			this.#isUserSpace = params.isUserSpace;
			this.#isScrumSpace = params.isScrumSpace;
			this.#layout = {
				node: null,
				listContainerNode: null,
				listNode: null
			};
			this.#initPull();
		}
		render() {
			this.#layout.node = main_core.Tag.render`
			<div class="sn-spaces__toolbar-space_counters">
				${this.#renderExpired()}
				${this.#renderNewComments()}
			</div>
		`;
			return this.#layout.node;
		}
		readAll() {
			if (this.#isUserSpace || this.#filterRole !== 'view_all') {
				this.#readAllUser();
			} else {
				this.#readAllGroup();
			}
		}
		#initPull() {
			pull_client.PULL.subscribe({
				moduleId: 'tasks',
				callback: this.#processPullEvent.bind(this)
			});
		}
		#processPullEvent(data) {
			const {
				command,
				params
			} = data;
			const eventHandlers = {
				user_counter: this.#processUserCounter.bind(this),
				project_counter: this.#processProjectCounter.bind(this)
			};
			const has = Object.prototype.hasOwnProperty;
			if (has.call(eventHandlers, command)) {
				const method = eventHandlers[command];
				if (method) {
					method.apply(this, [params]);
				}
			}
		}
		#processUserCounter() {
			if (!this.#isUserSpace) {
				return;
			}
			this.#updateCounters();
		}
		#processProjectCounter() {
			if (this.#isUserSpace) {
				return;
			}
			this.#updateCounters();
		}
		#renderExpired() {
			if (this.#isScrumSpace) {
				return '';
			}
			const uiClasses = 'ui-btn ui-btn-light ui-btn-sm ui-btn-round ui-btn-themes';
			const activeClass = this.#getActiveClass(this.#counters.expired.counter);
			this.#layout.expired = main_core.Tag.render`
			<button
				data-id="sn-spaces-toolbar-counters-expired"
				class="sn-spaces__toolbar-space_btn-with-counter ${uiClasses} ${activeClass}"
			>
				<div class="ui-icon-set --stopwatch"></div>
				<div class="sn-spaces__toolbar-space_btn-counter">
					${parseInt(this.#counters.expired.counter, 10)}
				</div>
			</button>
		`;
			main_core.Event.bind(this.#layout.expired, 'click', this.#click.bind(this, this.#counters.expired));
			return this.#layout.expired;
		}
		#renderNewComments() {
			const uiClasses = 'ui-btn ui-btn-light ui-btn-sm ui-btn-round ui-btn-themes';
			const activeClass = this.#getActiveClass(this.#counters.new_comments.counter);
			this.#layout.newComments = main_core.Tag.render`
			<button
				data-id="sn-spaces-toolbar-counters-new-comments"
				class="sn-spaces__toolbar-space_btn-with-counter --green ${uiClasses} ${activeClass}"
			>
				<div class="ui-icon-set --chats-1"></div>
				<div class="sn-spaces__toolbar-space_btn-counter">
					${parseInt(this.#counters.new_comments.counter, 10)}
				</div>
			</button>
		`;
			main_core.Event.bind(this.#layout.newComments, 'click', this.#click.bind(this, this.#counters.new_comments));
			return this.#layout.newComments;
		}
		#click(counter) {
			this.#filter.toggleField(counter.filterField, counter.code);
		}
		#update(counters) {
			this.#counters = counters;
			if (!this.#isScrumSpace) {
				this.#updateCounter(this.#layout.expired, this.#counters.expired.counter);
			}
			this.#updateCounter(this.#layout.newComments, this.#counters.new_comments.counter);
		}
		#updateCounter(node, value) {
			const newCommentsActiveClass = this.#getActiveClass(value);
			if (newCommentsActiveClass) {
				main_core.Dom.addClass(node, newCommentsActiveClass);
			} else {
				main_core.Dom.removeClass(node, '--active');
			}
			const counterNode = node.querySelector('.sn-spaces__toolbar-space_btn-counter');
			counterNode.textContent = parseInt(value, 10);
		}
		#updateCounters() {
			main_core.ajax.runComponentAction('bitrix:socialnetwork.spaces.toolbar', 'getTasksCounters', {
				mode: 'class',
				data: {
					groupId: this.#groupId
				}
			}).then(response => {
				this.#update(response.data);
			}).catch(error => {
				this.#consoleError('changePrivacy', error);
			});
		}
		#readAllGroup() {
			if (!this.#hasCounters()) {
				return;
			}
			main_core.ajax.runAction('tasks.viewedGroup.project.markAsRead', {
				data: {
					fields: {
						groupId: this.#groupId
					}
				}
			}).then(response => {
				this.#updateCounters();
				this.#filter.applyFilter();
			}).catch(error => {
				this.#consoleError('readAllScrum', error);
			});
		}
		#readAllUser() {
			if (!this.#hasCounters()) {
				return;
			}
			main_core.ajax.runAction('tasks.viewedGroup.user.markAsRead', {
				data: {
					fields: {
						groupId: this.#groupId,
						userId: this.#userId,
						role: this.#filterRole
					}
				}
			}).then(response => {
				this.#updateCounters();
				this.#filter.applyFilter();
			}).catch(error => {
				this.#consoleError('readAllScrum', error);
			});
		}
		#hasCounters() {
			const expiredCounter = parseInt(this.#counters.expired.counter, 10);
			const newCommentsCounter = parseInt(this.#counters.new_comments.counter, 10);
			return expiredCounter > 0 || newCommentsCounter > 0;
		}
		#getActiveClass(value) {
			return value > 0 ? '--active' : '';
		}
		#consoleError(action, error) {
			// eslint-disable-next-line no-console
			console.error(`TasksCounters: ${action} error`, error);
		}
	}

	class TasksRobots extends main_core_events.EventEmitter {
		#groupId;
		#isTaskLimitsExceeded;
		#canUseAutomation;
		#sourceAnalytics;
		#sidePanelManager;
		constructor(params) {
			super(params);
			this.#groupId = params.groupId;
			this.#isTaskLimitsExceeded = params.isTaskLimitsExceeded;
			this.#canUseAutomation = params.canUseAutomation;
			this.#sourceAnalytics = params.sourceAnalytics;
			this.#sidePanelManager = BX.SidePanel.Instance;
			this.setEventNamespace('BX.Socialnetwork.Spaces.TasksRobots');
		}
		renderBtn() {
			let className = 'tasks-scrum-robot-btn ui-btn ui-btn-light ui-btn-sm ui-btn-round ui-btn-themes ui-btn-no-caps ui-btn-themes ';
			if (this.#isShowLimitSidePanel()) {
				className += ' ui-btn-icon-lock';
			}
			const node = main_core.Tag.render`
			<button class="${className}">
				${main_core.Loc.getMessage('SN_SPACES_TASKS_ROBOTS_BUTTON')}
			</button>
		`;
			main_core.Event.bind(node, 'click', this.#onClick.bind(this));
			return node;
		}
		#onClick() {
			if (this.#isShowLimitSidePanel()) {
				BX.UI.InfoHelper.show('limit_tasks_robots', {
					isLimit: true,
					limitAnalyticsLabels: {
						module: 'tasks',
						source: this.#sourceAnalytics
					}
				});
			} else {
				const url = `/bitrix/components/bitrix/tasks.automation/slider.php?site_id=${main_core.Loc.getMessage('SITE_ID')}&project_id=${this.#groupId}`;
				this.#sidePanelManager.open(url, {
					customLeftBoundary: 0,
					cacheable: false,
					loader: 'bizproc:automation-loader'
				});
			}
		}
		#isShowLimitSidePanel() {
			return this.#isTaskLimitsExceeded && !this.#canUseAutomation;
		}
	}

	class TasksRouter {
		#sidePanelManager;
		#pathToTasks;
		#pathToTasksTask;
		constructor(params) {
			this.#pathToTasks = params.pathToTasks;
			this.#pathToTasksTask = params.pathToTasksTask;
			this.#sidePanelManager = BX.SidePanel.Instance;
		}
		redirectTo(url) {
			top.BX.Socialnetwork.Spaces.space.reloadPageContent(url);
		}
		redirectToTasks(urlParam, urlValue) {
			const viewUri = new main_core.Uri(this.#pathToTasks);
			viewUri.setQueryParam(urlParam, urlValue);
			top.BX.Socialnetwork.Spaces.space.reloadPageContent(viewUri.toString());
		}
		redirectToScrumView(view) {
			const viewUri = new main_core.Uri(this.#pathToTasks);
			viewUri.setQueryParam('tab', view);
			top.BX.Socialnetwork.Spaces.space.reloadPageContent(viewUri.toString());
		}
		showTask(taskId) {
			this.#sidePanelManager.open(this.#pathToTasksTask.replace('#action#', 'view').replace('#task_id#', taskId));
		}
		showSidePanel(url) {
			this.#sidePanelManager.open(url);
		}
		showByExtension(fullName, shortName, params) {
			return top.BX.Runtime.loadExtension(fullName).then(exports => {
				const className = shortName.replaceAll('-', '');
				if (exports && exports[className]) {
					const extension = new exports[className](params);
					extension.show();
					return extension;
				}
				return null;
			});
		}
	}

	class KanbanOrder {
		static SORT_ASC = 'asc';
		static SORT_DESC = 'desc';
		static SORT_ACTUAL = 'actual';
	}

	const ReadAllItem = (view, emptySpace) => new main_popup.MenuItem({
		dataset: {
			id: `spaces-tasks-${view.getViewId()}-settings-read-all`
		},
		text: main_core.Loc.getMessage('SN_SPACES_TASKS_SETTINGS_READ_ALL'),
		className: emptySpace ? 'menu-popup-item-none' : '',
		onclick: () => {
			view.emit('realAll');
		}
	});

	class TasksSettingsMenu extends main_core_events.EventEmitter {
		#menu;
		#bindElement;
		constructor(params) {
			super();
			this.setEventNamespace(this.#getEventNamespace());
			this.#bindElement = params.bindElement;
		}
		show() {
			this.#getMenu().show();
		}
		close() {
			this.#menu?.close();
		}
		#getMenu() {
			if (!this.#menu) {
				this.#menu = this.#createMenu(this.#bindElement);
			}
			return this.#menu;
		}
		#createMenu(bindElement) {
			const menu = new main_popup.Menu({
				id: `spaces-tasks-${this.getViewId()}-settings`,
				bindElement,
				closeByEsc: true
			});
			for (const menuItem of this.getMenuItems()) {
				menu.addMenuItem(menuItem);
			}
			return menu;
		}
		#getEventNamespace() {
			const camelCase = this.getViewId().toLowerCase().replace(/(-[a-z])/g, group => group.toUpperCase().replace('-', ''));
			const pascalCase = camelCase.charAt(0).toUpperCase() + camelCase.slice(1);
			return `BX.Socialnetwork.Spaces.${pascalCase}Settings`;
		}
		getMenuItems() {
			return [ReadAllItem(this)];
		}
		getViewId() {
			return 'base';
		}
	}

	class TasksView {
		#isUserSpace;
		#isScrumSpace;
		#viewMode;
		constructor(params) {
			this.#isUserSpace = params.isUserSpace;
			this.#isScrumSpace = params.isScrumSpace;
			this.#setViewMode(params.viewMode);
		}
		getCurrentViewMode() {
			return this.#viewMode;
		}
		#setViewMode(viewMode) {
			const availableModes = this.#getAvailableModes().get(this.#getCurrentSpace());
			this.#viewMode = availableModes.has(viewMode) ? viewMode : this.#getDefaultMode();
		}
		#getAvailableModes() {
			return new Map([['user', new Set(['list', 'plan', 'timeline', 'calendar', 'gantt'])], ['group', new Set(['list', 'kanban', 'plan', 'timeline', 'calendar', 'gantt'])], ['scrum', new Set(['plan', 'active', 'complete'])]]);
		}
		#getDefaultMode() {
			const defaultModes = new Map([['user', 'list'], ['group', 'list'], ['scrum', 'plan']]);
			return defaultModes.get(this.#getCurrentSpace());
		}
		#getCurrentSpace() {
			if (this.#isUserSpace) {
				return 'user';
			}
			if (this.#isScrumSpace) {
				return 'scrum';
			} else {
				return 'group';
			}
		}
	}

	const CompleteSprintItem = view => new main_popup.MenuItem({
		dataset: {
			id: `spaces-tasks-${view.getViewId()}-settings-complete-sprint`
		},
		text: main_core.Loc.getMessage('SN_SPACES_TASKS_SCRUM_SETTINGS_COMPLETE_SPRINT'),
		disabled: !view.canCompleteSprint(),
		onclick: () => {
			view.close();
			view.emit('completeSprint');
		}
	});

	class KanbanSortItems {
		#view;
		#order;
		constructor(view, order) {
			this.#view = view;
			this.#order = order;
		}
		getItems() {
			const hiddenItems = [this.#getOrderTitleItem(), this.#getOrderDescItem(), this.#getOrderAscItem()];
			const items = [this.#getTitleItem(), this.#getActivitySortItem(), this.#getMySortItem(hiddenItems)];
			if (this.#order !== KanbanOrder.SORT_ACTUAL) {
				items.push(...hiddenItems);
			}
			return items;
		}
		#getTitleItem() {
			return new main_popup.MenuItem({
				dataset: {
					id: `spaces-tasks-${this.#view.getViewId()}-settings-sort-title-item`
				},
				html: `<b>${main_core.Loc.getMessage('SN_SPACES_TASKS_SORT_TITLE_ITEM')}</b>`,
				className: 'menu-popup-item menu-popup-no-icon'
			});
		}
		#getActivitySortItem() {
			const menuItem = new main_popup.MenuItem({
				dataset: {
					id: `spaces-tasks-${this.#view.getViewId()}-settings-activity-sort-item`
				},
				html: `
				${main_core.Loc.getMessage('SN_SPACES_TASKS_SORT_ACTIVITY_DATE_MSGVER_1')}
				<span style="margin-left: 5px">${this.#getRecommendedLabel()}</span>
			`,
				className: `menu-popup-item-sort-field ${this.#getSelectedClass([KanbanOrder.SORT_ACTUAL])}`,
				onclick: tasks_kanbanSort.KanbanSort.getInstance().disableCustomSort
			});
			menuItem.params = {
				order: KanbanOrder.SORT_ACTUAL
			};
			return menuItem;
		}
		#getRecommendedLabel() {
			return new ui_label.Label({
				text: main_core.Loc.getMessage('SN_SPACES_TASKS_SORT_RECOMMENDED_LABEL').toUpperCase(),
				color: ui_label.LabelColor.LIGHT_BLUE,
				fill: true,
				size: 'ui-label-xs'
			}).render().outerHTML;
		}
		#getMySortItem(hiddenItems) {
			const menuItem = new main_popup.MenuItem({
				dataset: {
					id: `spaces-tasks-${this.#view.getViewId()}-settings-my-sort-item`
				},
				text: main_core.Loc.getMessage('SN_SPACES_TASKS_SORT_SORTING'),
				className: `menu-popup-item-sort-field ${this.#getSelectedClass([KanbanOrder.SORT_ASC, KanbanOrder.SORT_DESC])}`,
				onclick: tasks_kanbanSort.KanbanSort.getInstance().enableCustomSort
			});
			menuItem.params = hiddenItems;
			return menuItem;
		}
		#getOrderTitleItem() {
			const menuItem = new main_popup.MenuItem({
				dataset: {
					id: `spaces-tasks-${this.#view.getViewId()}-settings-sort-order-title-item`
				},
				html: `<b>${main_core.Loc.getMessage('SN_SPACES_TASKS_SORT_ORDER_TITLE')}</b>`,
				className: 'menu-popup-item menu-popup-no-icon'
			});
			menuItem.params = {
				type: 'sub'
			};
			return menuItem;
		}
		#getOrderDescItem() {
			return this.#getOrderItem(KanbanOrder.SORT_DESC);
		}
		#getOrderAscItem() {
			return this.#getOrderItem(KanbanOrder.SORT_ASC);
		}
		#getOrderItem(order) {
			const menuItem = new main_popup.MenuItem({
				dataset: {
					id: `spaces-tasks-${this.#view.getViewId()}-settings-order-${order}-item`
				},
				text: main_core.Loc.getMessage(`SN_SPACES_TASKS_SORT_${order.toUpperCase()}`),
				className: `menu-popup-item-sort-field ${this.#getSelectedClass([order])}`,
				onclick: tasks_kanbanSort.KanbanSort.getInstance().selectCustomOrder
			});
			menuItem.params = {
				type: 'sub',
				order
			};
			return menuItem;
		}
		#getSelectedClass(order) {
			const classSelected = 'menu-popup-item-accept';
			const classDeselected = 'menu-popup-item-none';
			return order.includes(this.#order) ? classSelected : classDeselected;
		}
	}

	class ScrumActiveSettings extends TasksSettingsMenu {
		#order;
		#canCompleteSprint;
		#activeSprintExists;
		constructor(params) {
			super(params);
			this.#order = params.order;
			this.#canCompleteSprint = params.canCompleteSprint;
			this.#activeSprintExists = params.activeSprintExists;
		}
		getViewId() {
			return 'scrum-active';
		}
		canCompleteSprint() {
			return this.#canCompleteSprint && this.#activeSprintExists;
		}
		getMenuItems() {
			return [CompleteSprintItem(this), ...new KanbanSortItems(this, this.#order).getItems()];
		}
	}

	const BurnDownItem = view => new main_popup.MenuItem({
		dataset: {
			id: `spaces-tasks-${view.getViewId()}-settings-burn-down`
		},
		text: main_core.Loc.getMessage('SN_SPACES_TASKS_SCRUM_SETTINGS_BURN_DOWN'),
		onclick: () => {
			view.close();
			view.emit('showBurnDown');
		}
	});

	class ScrumCompleteSettings extends TasksSettingsMenu {
		getViewId() {
			return 'scrum-complete';
		}
		getMenuItems() {
			return [BurnDownItem(this)];
		}
	}

	const PriorityItem = (view, priority, isActive) => {
		const menuItem = new main_popup.MenuItem({
			dataset: {
				id: `spaces-tasks-${view.getViewId()}-settings-priority-${priority}`
			},
			className: isActive ? 'menu-popup-item-accept' : 'menu-popup-item-none',
			text: main_core.Loc.getMessage(`SN_SPACES_TASKS_SCRUM_SETTINGS_${priority.toUpperCase()}`),
			onclick: () => BX.Tasks.Scrum.Entry.setDisplayPriority(document.querySelector(`[data-id=${menuItem.dataset.id}`), priority)
		});
		return menuItem;
	};
	const PriorityItems = (view, priority) => [PriorityItem(view, 'backlog', priority === 'backlog'), PriorityItem(view, 'sprint', priority === 'sprint')];

	class ScrumPlanSettings extends TasksSettingsMenu {
		#displayPriority;
		constructor(params) {
			super(params);
			this.#displayPriority = params.displayPriority;
		}
		getViewId() {
			return 'scrum-plan';
		}
		getMenuItems() {
			return [ReadAllItem(this, true), {
				delimiter: true
			}, ...PriorityItems(this, this.#displayPriority)];
		}
	}

	class ScrumSettings extends main_core_events.EventEmitter {
		#settings;
		#tasksView;
		constructor(params) {
			super();
			this.setEventNamespace('BX.Socialnetwork.Spaces.TasksScrumSettings');
			this.#tasksView = params.tasksView;
			this.#createSettings(params);
		}
		show() {
			this.#settings.show();
		}
		#createSettings(params) {
			switch (this.#tasksView.getCurrentViewMode()) {
				case 'plan':
					this.#settings = new ScrumPlanSettings(params);
					this.#settings.subscribe('realAll', () => this.emit('realAll'));
					break;
				case 'active':
					this.#settings = new ScrumActiveSettings(params);
					this.#settings.subscribe('completeSprint', () => this.emit('completeSprint'));
					break;
				case 'complete':
					this.#settings = new ScrumCompleteSettings(params);
					this.#settings.subscribe('showBurnDown', () => this.emit('showBurnDown'));
					break;
			}
		}
	}

	class GroupCalendarSettings extends TasksSettingsMenu {
		getViewId() {
			return 'group-calendar';
		}
	}

	class TasksExcelManager {
		#pathToTasks;
		constructor(params) {
			this.#pathToTasks = params?.pathToTasks;
		}

		/**
		 * @param options {{isAll: boolean}}
		 */
		getExportHref(options = {}) {
			let href = `${this.#pathToTasks}?F_STATE=sV80&EXPORT_AS=EXCEL&ncc=1`;
			if (options.isAll) {
				href += '&COLUMNS=ALL';
			}
			return href;
		}
		getImportHref() {
			return `${this.#pathToTasks}import/`;
		}
	}

	const ExportItem = (view, excelManager) => {
		return {
			dataset: {
				id: `spaces-tasks-${view.getViewId()}-settings-export-list`
			},
			text: main_core.Loc.getMessage('SN_SPACES_TASKS_EXPORT_LIST'),
			className: 'menu-popup-item-none',
			items: [{
				dataset: {
					id: `spaces-tasks-${view.getViewId()}-settings-to-excel`
				},
				text: main_core.Loc.getMessage('SN_SPACES_TASKS_EXPORT_TO_EXCEL'),
				className: 'sn-spaces-tasks-icon-excel',
				href: excelManager.getExportHref()
			}]
		};
	};

	const GroupSubtasksItem = (view, params) => {
		let shouldSubtasksBeGrouped = params.shouldSubtasksBeGrouped;
		return new main_popup.MenuItem({
			dataset: {
				id: `spaces-tasks-${view.getViewId()}-settings-group-subtasks`
			},
			text: main_core.Loc.getMessage('SN_SPACES_TASKS_GROUP_SUBTASKS'),
			className: shouldSubtasksBeGrouped ? 'menu-popup-item-accept' : 'menu-popup-item-none',
			onclick: (event, item) => {
				BX.ajax.runComponentAction('bitrix:tasks.interface.filter', 'toggleGroupByTasks', {
					mode: 'class',
					data: {
						userId: params.userId
					}
				}).then(response => {
					if (response.status !== 'success') {
						return;
					}
					main_core.Dom.toggleClass(item.layout.item, ['menu-popup-item-accept', 'menu-popup-item-none']);
					if (BX.Main.gridManager) {
						shouldSubtasksBeGrouped = !shouldSubtasksBeGrouped;
						const gridInstance = BX.Main.gridManager.data[0].instance;
						gridInstance.reloadTable();
						main_core_events.EventEmitter.emit('BX.Tasks.Filter.group', [gridInstance, 'groupBySubTasks', shouldSubtasksBeGrouped]);
					} else {
						window.location.reload();
					}
				}, error => {
					// eslint-disable-next-line no-console
					console.log(error);
				});
			}
		});
	};

	const ImportCsvItem = (view, excelManager) => {
		return {
			dataset: {
				id: `spaces-tasks-${view.getViewId()}-settings-import`
			},
			text: main_core.Loc.getMessage('SN_SPACES_TASKS_IMPORT_LIST'),
			className: 'menu-popup-item-none',
			items: [{
				dataset: {
					id: `spaces-tasks-${view.getViewId()}-settings-import-csv`
				},
				text: main_core.Loc.getMessage('SN_SPACES_TASKS_IMPORT_LIST_CSV'),
				className: 'sn-spaces-tasks-icon-excel',
				href: excelManager.getImportHref(),
				onclick: () => view.close()
			}]
		};
	};

	class TasksSortManager {
		#gridId;
		constructor(params) {
			this.#gridId = params.gridId;
		}
		setSort(taskSort) {
			const field = taskSort.field;
			const dir = taskSort.direction || 'asc';
			if (BX.Main.gridManager === undefined) {
				BX.ajax.post(BX.util.add_url_param('/bitrix/components/bitrix/main.ui.grid/settings.ajax.php', {
					GRID_ID: this.#gridId,
					action: 'setSort'
				}), {
					by: field,
					order: dir
				}, res => {
					try {
						res = JSON.parse(res);
						if (!res.error) {
							window.location.reload();
						}
					} catch (err) {
						console.log(err);
					}
				});
			} else {
				const grid = BX.Main.gridManager.getById(this.#gridId).instance;
				grid.sortByColumn({
					sort_by: field,
					sort_order: dir
				});
				if (field === 'SORTING') {
					grid.getRows().enableDragAndDrop();
				} else {
					grid.getRows().disableDragAndDrop();
				}
			}
		}
	}

	const classSelected = 'menu-popup-item-accept';
	const classSortField = 'menu-popup-item-sort-field';
	const classSortDir = 'menu-popup-item-sort-dir';
	class SortItem {
		#params;
		#view;
		#menuItems;
		constructor(view, params) {
			this.#view = view;
			this.#params = params;
		}
		getItem() {
			return {
				dataset: {
					id: `spaces-tasks-${this.#view.getViewId()}-settings-sort`
				},
				text: main_core.Loc.getMessage('SN_SPACES_TASKS_SORT'),
				className: 'menu-popup-item-none menu-popup-sort',
				events: {
					onSubMenuShow: event => {
						this.#menuItems = event.target.getSubMenu().getMenuItems();
						this.#updateStyles(this.#menuItems);
					}
				},
				items: this.#getMenuItems()
			};
		}
		#getMenuItems() {
			return [...this.#params.sortFields.flatMap(this.#getFieldItem.bind(this)), new main_popup.MenuItem({
				id: 'delimiterDir',
				delimiter: true
			}), this.#getDirectionItem('asc'), this.#getDirectionItem('desc')];
		}
		#getFieldItem(field) {
			const isActivityField = field === 'ACTIVITY_DATE';
			const menuItem = new main_popup.MenuItem({
				dataset: {
					id: `spaces-tasks-${this.#view.getViewId()}-settings-sort-${field}`
				},
				html: `
				${main_core.Loc.getMessage(`SN_SPACES_TASKS_SORT_${field}`)}
				${isActivityField ? `<span style="margin-left: 5px">${this.#getRecommendedLabel()}</span>` : ''}
			`,
				value: field,
				className: `${classSortField} menu-popup-item-none`,
				onclick: (event, item) => {
					this.#onMenuItemClick('field', item);
				}
			});
			if (isActivityField) {
				return [new main_popup.MenuItem({
					delimiter: true
				}), menuItem, new main_popup.MenuItem({
					delimiter: true
				})];
			}
			return menuItem;
		}
		#getDirectionItem(direction) {
			return new main_popup.MenuItem({
				dataset: {
					id: `spaces-tasks-${this.#view.getViewId()}-settings-sort-${direction}`
				},
				text: main_core.Loc.getMessage(`SN_SPACES_TASKS_SORT_BY_${direction.toUpperCase()}`),
				className: `${classSortDir} menu-popup-item-none`,
				value: direction,
				onclick: (event, item) => {
					this.#onMenuItemClick('dir', item);
				}
			});
		}
		#getRecommendedLabel() {
			return new ui_label.Label({
				text: main_core.Loc.getMessage('SN_SPACES_TASKS_SORT_RECOMMENDED_LABEL').toUpperCase(),
				color: ui_label.LabelColor.LIGHT_BLUE,
				fill: true,
				size: 'ui-label-xs'
			}).render().outerHTML;
		}
		#onMenuItemClick(selectedItemType, selectedItem) {
			if (selectedItemType === 'field') {
				this.#params.taskSort.field = selectedItem.value;
			} else if (selectedItemType === 'dir') {
				this.#params.taskSort.direction = selectedItem.value;
			}
			this.#params.sortManager.setSort(this.#params.taskSort);
			this.#updateStyles(this.#menuItems);
		}
		#updateStyles(menuItems) {
			menuItems.forEach(item => {
				this.#updateStyle(item, this.#params.taskSort);
			});
		}
		#updateStyle(item, taskSort) {
			const itemNode = item.getContainer();
			const isFieldItem = main_core.Dom.hasClass(itemNode, classSortField);
			const isDirectionItem = main_core.Dom.hasClass(itemNode, classSortDir) || item.getId() === 'delimiterDir';
			const isFieldSelected = isFieldItem && taskSort.field === item.value;
			const isDirectionSelected = isDirectionItem && taskSort.direction === item.value;
			if (isFieldSelected || isDirectionSelected) {
				main_core.Dom.addClass(itemNode, classSelected);
			} else {
				main_core.Dom.removeClass(itemNode, classSelected);
			}
			if (taskSort.field === 'SORTING' && isDirectionItem) {
				main_core.Dom.style(itemNode, 'display', 'none');
			} else {
				main_core.Dom.style(itemNode, 'display', '');
			}
		}
	}

	const SyncItem = (view, syncScript) => {
		return {
			dataset: {
				id: `spaces-tasks-${view.getViewId()}-settings-sync`
			},
			text: main_core.Loc.getMessage('SN_SPACES_TASKS_SYNC_LIST'),
			className: 'menu-popup-item-none',
			items: [{
				text: main_core.Loc.getMessage('SN_SPACES_TASKS_SYNC_WITH_OUTLOOK'),
				className: 'sn-spaces-tasks-icon-outlook',
				// eslint-disable-next-line no-eval
				onclick: () => eval(syncScript)
			}]
		};
	};

	class GroupGanttSettings extends TasksSettingsMenu {
		#excelManager;
		#sortManager;
		#params;
		constructor(params) {
			super(params);
			this.#params = params;
			this.#excelManager = new TasksExcelManager({
				pathToTasks: params.pathToTasks
			});
			this.#sortManager = new TasksSortManager({
				gridId: params.gridId
			});
		}
		getViewId() {
			return 'group-gantt';
		}
		getMenuItems() {
			const menuItems = [ReadAllItem(this, true), GroupSubtasksItem(this, this.#params), {
				delimiter: true
			}, new SortItem(this, {
				sortFields: this.#params.sortFields,
				taskSort: this.#params.taskSort,
				sortManager: this.#sortManager
			}).getItem(), {
				delimiter: true
			}];
			if (this.#params.permissions.import) {
				menuItems.push(ImportCsvItem(this, this.#excelManager));
			}
			if (this.#params.permissions.export) {
				menuItems.push(ExportItem(this, this.#excelManager));
			}
			if (this.#params.permissions.import && this.#params.permissions.export) {
				menuItems.push(SyncItem(this, this.#params.syncScript));
			}
			return menuItems;
		}
	}

	const ConfigureViewItem = view => new main_popup.MenuItem({
		dataset: {
			id: `spaces-tasks-${view.getViewId()}-settings-configure-view`
		},
		text: main_core.Loc.getMessage('SN_SPACES_TASKS_CONFIGURE_VIEW'),
		onclick: () => {
			main_core.Runtime.loadExtension('ui.dialogs.checkbox-list').then(() => {
				view.close();
				main_core_events.EventEmitter.emit('tasks-kanban-settings-fields-view');
			});
		}
	});

	class GroupKanbanSettings extends TasksSettingsMenu {
		#order;
		constructor(params) {
			super(params);
			this.#order = params.order;
		}
		getViewId() {
			return 'group-kanban';
		}
		getMenuItems() {
			return [ReadAllItem(this), ...new KanbanSortItems(this, this.#order).getItems(), ConfigureViewItem(this)];
		}
	}

	const ExportExcelItem = (view, excelManager) => {
		return {
			dataset: {
				id: `spaces-tasks-${view.getViewId()}-settings-export-excel`
			},
			text: main_core.Loc.getMessage('SN_SPACES_TASKS_EXPORT_LIST_TO_EXCEL'),
			className: 'menu-popup-item-none',
			items: [{
				dataset: {
					id: `spaces-tasks-${view.getViewId()}-settings-export-excel-grid-fields`
				},
				text: main_core.Loc.getMessage('SN_SPACES_TASKS_EXPORT_GRID_FIELDS'),
				className: 'sn-spaces-tasks-icon-excel',
				href: excelManager.getExportHref()
			}, {
				dataset: {
					id: `spaces-tasks-${view.getViewId()}-settings-export-excel-all-fields`
				},
				text: main_core.Loc.getMessage('SN_SPACES_TASKS_EXPORT_ALL_FIELDS'),
				className: 'sn-spaces-tasks-icon-excel',
				href: excelManager.getExportHref({
					isAll: true
				})
			}]
		};
	};

	class GroupListSettings extends TasksSettingsMenu {
		#excelManager;
		#sortManager;
		#params;
		constructor(params) {
			super(params);
			this.#params = params;
			this.#excelManager = new TasksExcelManager({
				pathToTasks: params.pathToTasks
			});
			this.#sortManager = new TasksSortManager({
				gridId: params.gridId
			});
		}
		getViewId() {
			return 'group-list';
		}
		getMenuItems() {
			const menuItems = [ReadAllItem(this, true), GroupSubtasksItem(this, this.#params), {
				delimiter: true
			}, new SortItem(this, {
				sortFields: this.#params.sortFields,
				taskSort: this.#params.taskSort,
				sortManager: this.#sortManager
			}).getItem(), {
				delimiter: true
			}];
			if (this.#params.permissions.import) {
				menuItems.push(ImportCsvItem(this, this.#excelManager));
			}
			if (this.#params.permissions.export) {
				menuItems.push(ExportExcelItem(this, this.#excelManager));
			}
			if (this.#params.permissions.import && this.#params.permissions.export) {
				menuItems.push(SyncItem(this, this.#params.syncScript));
			}
			return menuItems;
		}
	}

	class GroupSettings extends main_core_events.EventEmitter {
		#tasksView;
		#settings;
		constructor(params) {
			super();
			this.setEventNamespace('BX.Socialnetwork.Spaces.TasksGroupSettings');
			this.#tasksView = params.tasksView;
			this.#createSettings(params);
		}
		show() {
			this.#settings.show();
		}
		#createSettings(params) {
			switch (this.#tasksView.getCurrentViewMode()) {
				case 'list':
					this.#settings = new GroupListSettings(params);
					break;
				case 'kanban':
				case 'plan':
				case 'timeline':
					this.#settings = new GroupKanbanSettings(params);
					break;
				case 'calendar':
					this.#settings = new GroupCalendarSettings(params);
					break;
				case 'gantt':
					this.#settings = new GroupGanttSettings(params);
					break;
				default:
					return;
			}
			this.#settings.subscribe('realAll', () => this.emit('realAll'));
		}
	}

	class TasksScrum {
		#groupId;
		#pathToScrumBurnDown;
		#router;
		#currentCompletedSprint;
		#layout;
		constructor(params) {
			this.#groupId = params.groupId;
			this.#pathToScrumBurnDown = params.pathToScrumBurnDown;
			this.#router = params.router;
			this.#currentCompletedSprint = params.currentCompletedSprint;
			this.#layout = {};
		}
		renderSprintSelector() {
			const {
				selector,
				selectorLabel
			} = main_core.Tag.render`
			<div
				ref="selector"
			
				class="ui-btn ui-btn-light ui-btn-sm ui-btn-round ui-btn-no-caps ui-btn-themes sn-spaces__toolbar-space_btn-options"
			>
				<span class="sn-spaces__toolbar-space_btn-text" ref="selectorLabel">
					${main_core.Text.encode(this.#currentCompletedSprint.selectorLabel)}
				</span>
				<div class="ui-icon-set --chevron-down" style="--ui-icon-set__icon-size: 19px;"></div>
			</div>
		`;
			this.#layout.selector = selector;
			this.#layout.selectorLabel = selectorLabel;
			main_core.Event.bind(selector, 'click', this.#showSprintSelector.bind(this, selector));
			return selector;
		}
		showCompletionForm() {
			const extensionName = 'Sprint-Completion-Form';
			// eslint-disable-next-line promise/catch-or-return
			this.#router.showByExtension(`tasks.scrum.${extensionName.toLowerCase()}`, extensionName, {
				groupId: this.#groupId
			}).then(extension => {
				if (extension) {
					extension.subscribe('afterComplete', () => {
						this.#router.redirectToScrumView('plan');
					});
					extension.subscribe('taskClick', baseEvent => {
						this.#router.showTask(baseEvent.getData());
					});
				}
			});
		}
		showBurnDown() {
			this.#router.showSidePanel(this.#pathToScrumBurnDown.replace('#sprint_id#', this.#currentCompletedSprint.id));
		}
		#showSprintSelector(selectorNode) {
			const dialog = new ui_entitySelector.Dialog({
				targetNode: selectorNode,
				width: 400,
				height: 300,
				multiple: false,
				dropdownMode: true,
				enableSearch: true,
				compactView: true,
				showAvatars: false,
				cacheable: false,
				preselectedItems: [['sprint-selector', this.#currentCompletedSprint.id]],
				entities: [{
					id: 'sprint-selector',
					options: {
						groupId: this.#groupId,
						onlyCompleted: true
					},
					dynamicLoad: true,
					dynamicSearch: true
				}],
				events: {
					'Item:onSelect': event => {
						var selectedItem = event.getData().item;
						this.#currentCompletedSprint.id = selectedItem.id;

						// todo change to EventEmitter
						// eslint-disable-next-line @bitrix24/bitrix24-rules/no-bx
						BX.onCustomEvent(selectorNode, 'onTasksGroupSelectorChange', [{
							id: this.#groupId,
							sprintId: selectedItem.id,
							name: selectedItem.customData.get('name')
						}]);
						this.#layout.selectorLabel.textContent = selectedItem.customData.get('label');
					}
				}
			});
			dialog.show();
		}
	}

	class UserCalendarSettings extends TasksSettingsMenu {
		getViewId() {
			return 'user-calendar';
		}
	}

	class UserGanttSettings extends TasksSettingsMenu {
		#excelManager;
		#sortManager;
		#params;
		constructor(params) {
			super(params);
			this.#params = params;
			this.#excelManager = new TasksExcelManager({
				pathToTasks: params.pathToTasks
			});
			this.#sortManager = new TasksSortManager({
				gridId: params.gridId
			});
		}
		getViewId() {
			return 'user-gantt';
		}
		getMenuItems() {
			const menuItems = [ReadAllItem(this, true), GroupSubtasksItem(this, this.#params), {
				delimiter: true
			}, new SortItem(this, {
				sortFields: this.#params.sortFields,
				taskSort: this.#params.taskSort,
				sortManager: this.#sortManager
			}).getItem(), {
				delimiter: true
			}];
			if (this.#params.permissions.import) {
				menuItems.push(ImportCsvItem(this, this.#excelManager));
			}
			if (this.#params.permissions.export) {
				menuItems.push(ExportItem(this, this.#excelManager));
			}
			if (this.#params.permissions.import && this.#params.permissions.export) {
				menuItems.push(SyncItem(this, this.#params.syncScript));
			}
			return menuItems;
		}
	}

	class UserKanbanSettings extends TasksSettingsMenu {
		#order;
		constructor(params) {
			super(params);
			this.#order = params.order;
		}
		getViewId() {
			return 'user-kanban';
		}
		getMenuItems() {
			return [ReadAllItem(this), ...new KanbanSortItems(this, this.#order).getItems(), ConfigureViewItem(this)];
		}
	}

	class UserListSettings extends TasksSettingsMenu {
		#excelManager;
		#sortManager;
		#params;
		constructor(params) {
			super(params);
			this.#params = params;
			this.#excelManager = new TasksExcelManager({
				pathToTasks: params.pathToTasks
			});
			this.#sortManager = new TasksSortManager({
				gridId: params.gridId
			});
		}
		getViewId() {
			return 'user-list';
		}
		getMenuItems() {
			const menuItems = [ReadAllItem(this, true), GroupSubtasksItem(this, this.#params), {
				delimiter: true
			}, new SortItem(this, {
				sortFields: this.#params.sortFields,
				taskSort: this.#params.taskSort,
				sortManager: this.#sortManager
			}).getItem(), {
				delimiter: true
			}];
			if (this.#params.permissions.import) {
				menuItems.push(ImportCsvItem(this, this.#excelManager));
			}
			if (this.#params.permissions.export) {
				menuItems.push(ExportExcelItem(this, this.#excelManager));
			}
			if (this.#params.permissions.import && this.#params.permissions.export) {
				menuItems.push(SyncItem(this, this.#params.syncScript));
			}
			return menuItems;
		}
	}

	class UserSettings extends main_core_events.EventEmitter {
		#tasksView;
		#settings;
		constructor(params) {
			super();
			this.setEventNamespace('BX.Socialnetwork.Spaces.TasksUserSettings');
			this.#tasksView = params.tasksView;
			this.#createSettings(params);
		}
		show() {
			this.#settings.show();
		}
		#createSettings(params) {
			switch (this.#tasksView.getCurrentViewMode()) {
				case 'list':
					this.#settings = new UserListSettings(params);
					break;
				case 'plan':
				case 'timeline':
					this.#settings = new UserKanbanSettings(params);
					break;
				case 'calendar':
					this.#settings = new UserCalendarSettings(params);
					break;
				case 'gantt':
					this.#settings = new UserGanttSettings(params);
					break;
				default:
					return;
			}
			this.#settings.subscribe('realAll', () => this.emit('realAll'));
		}
	}

	class TasksViewList extends main_core_events.EventEmitter {
		#menu;
		constructor(params) {
			super();
			this.setEventNamespace('BX.Socialnetwork.Spaces.TasksViewList');
			this.#menu = this.#createMenu(params.bindElement, params.viewList);
		}
		show() {
			this.#menu.toggle();
		}
		#createMenu(bindElement, viewList) {
			const menu = new main_popup.Menu({
				id: 'spaces-tasks-view-list',
				className: 'sn-spaces-tasks-view-list-menu',
				bindElement,
				closeByEsc: true
			});
			viewList.forEach(viewItem => {
				menu.addMenuItem({
					dataset: {
						id: `spaces-tasks-${viewItem.key}`
					},
					text: viewItem.title,
					className: `sn-spaces-tasks-${viewItem.key}-icon ${viewItem.selected ? '--selected' : ''}`,
					onclick: () => {
						if (viewItem.selected) {
							menu.close();
							return;
						}
						this.emit('click', {
							urlParam: viewItem.urlParam,
							urlValue: viewItem.urlValue
						});
					}
				});
			});
			return menu;
		}
	}

	class TasksToolbar {
		#cache = new main_core.Cache.MemoryCache();
		#filter;
		#router;
		#counters;
		#tasksView;
		#tasksScrum;
		#tasksViewList;
		#settings;
		constructor(params) {
			this.#setParams(params);
			this.#filter = new Filter({
				filterId: this.#getParam('filterId'),
				filterContainer: this.#getParam('filterContainer')
			});
			if (this.#getParam('isUserSpace')) {
				this.#router = new TasksRouter({
					pathToTasks: this.#getParam('pathToUserSpaceTasks'),
					pathToTasksTask: ''
				});
			} else {
				this.#router = new TasksRouter({
					pathToTasks: this.#getParam('pathToGroupTasks'),
					pathToTasksTask: this.#getParam('pathToGroupTasksTask')
				});
			}
			this.#tasksView = new TasksView({
				isUserSpace: this.#getParam('isUserSpace'),
				isScrumSpace: this.#getParam('isScrumSpace'),
				viewMode: this.#getParam('viewMode')
			});
			if (this.#getParam('isScrumSpace')) {
				this.#tasksScrum = new TasksScrum({
					groupId: this.#getParam('groupId'),
					pathToScrumBurnDown: this.#getParam('pathToScrumBurnDown'),
					router: this.#router,
					currentCompletedSprint: this.#getParam('currentCompletedSprint')
				});
			}
		}
		renderAddBtnTo(container) {
			if (!main_core.Type.isDomNode(container)) {
				throw new Error('BX.Socialnetwork.Spaces.TasksToolbar: HTMLElement for add btn not found');
			}
			main_core.Dom.append(this.#renderAddBtn(), container);
		}
		renderScrumAddBtnTo(container) {
			if (!main_core.Type.isDomNode(container)) {
				throw new Error('BX.Socialnetwork.Spaces.TasksToolbar: HTMLElement for add btn not found');
			}
			main_core.Dom.append(this.#renderScrumAddBtn(), container);
		}
		renderCountersTo(container) {
			if (!main_core.Type.isDomNode(container)) {
				throw new Error('BX.Socialnetwork.Spaces.TasksToolbar: HTMLElement for add btn not found');
			}
			const ignoreList = new Set([]);
			if (this.#getParam('isScrumSpace')) {
				ignoreList.add('active');
				ignoreList.add('complete');
			}
			if (ignoreList.has(this.#tasksView.getCurrentViewMode())) {
				return;
			}
			this.#counters = new TasksCounters({
				filter: this.#filter,
				filterRole: this.#getParam('filterRole'),
				userId: this.#getParam('userId'),
				groupId: this.#getParam('groupId'),
				counters: this.#getParam('counters'),
				isUserSpace: this.#getParam('isUserSpace'),
				isScrumSpace: this.#getParam('isScrumSpace'),
				tasksView: this.#tasksView
			});
			main_core.Dom.append(this.#counters.render(), container);
		}
		renderViewBtnTo(container) {
			if (!main_core.Type.isDomNode(container)) {
				throw new Error('BX.Socialnetwork.Spaces.TasksToolbar: HTMLElement for view btn not found');
			}
			main_core.Dom.append(this.#renderViewBtn(), container);
		}
		renderScrumShortView(container) {
			if (!main_core.Type.isDomNode(container)) {
				throw new Error('BX.Socialnetwork.Spaces.TasksToolbar: HTMLElement for short view btn not found');
			}
			const shortView = new ui_shortView.ShortView({
				isShortView: this.#getParam('isShortView')
			});
			shortView.renderTo(container);
			shortView.subscribe('change', baseEvent => {
				BX.Tasks.Scrum.Entry.changeShortView(baseEvent.getData());
			});
		}
		renderScrumSprintSelector(container) {
			if (!main_core.Type.isDomNode(container)) {
				throw new Error('BX.Socialnetwork.Spaces.TasksToolbar: HTMLElement for sprint selector not found');
			}
			main_core.Dom.append(this.#tasksScrum.renderSprintSelector(), container);
		}
		renderScrumRobots(container) {
			if (!main_core.Type.isDomNode(container)) {
				throw new Error('BX.Socialnetwork.Spaces.TasksToolbar: HTMLElement for robots btn not found');
			}
			if (this.#getParam('activeSprintId') > 0 && this.#getParam('canEditSprint') === 'Y') {
				const tasksRobots = new TasksRobots({
					groupId: this.#getParam('groupId'),
					isTaskLimitsExceeded: this.#getParam('isTaskLimitsExceeded'),
					canUseAutomation: this.#getParam('canUseAutomation'),
					sourceAnalytics: 'scrumActiveSprint'
				});
				main_core.Dom.append(tasksRobots.renderBtn(), container);
			}
		}
		renderSettingsBtnTo(container) {
			if (!main_core.Type.isDomNode(container)) {
				throw new Error('BX.Socialnetwork.Spaces.TasksToolbar: HTMLElement for settings btn not found');
			}
			const ignoreList = new Set([]);
			if (ignoreList.has(this.#tasksView.getCurrentViewMode())) {
				return;
			}
			main_core.Dom.append(this.#renderSettingsBtn(), container);
		}
		#setParams(params) {
			this.#cache.set('params', params);
		}
		#getParam(param) {
			return this.#cache.get('params')[param];
		}
		#renderAddBtn() {
			const node = main_core.Tag.render`
			<div class="ui-btn-split ui-btn-success ui-btn-round ui-btn-no-caps">
				<a
					data-id="spaces-tasks-add-main-btn"
					class="ui-btn-main"
					href="${this.#getParam('pathToAddTask')}"
				>
					${main_core.Loc.getMessage('SN_SPACES_TASKS_ADD_TASK')}
				</a>
				<button class="ui-btn-menu" data-id="spaces-tasks-add-menu-btn"></button>
			</div>
		`;
			main_core.Event.bind(node.querySelector('.ui-btn-menu'), 'click', this.#addMenuClick.bind(this));
			return node;
		}
		#renderScrumAddBtn() {
			const node = main_core.Tag.render`
			<div class="ui-btn-split ui-btn-round ui-btn-no-caps ui-btn-light-border ui-btn-themes">
				<a
					data-id="spaces-tasks-add-main-btn"
					class="ui-btn-main"
					href="${this.#getParam('pathToAddTask')}"
				>
					${main_core.Loc.getMessage('SN_SPACES_TASKS_ADD_TASK')}
				</a>
				<button class="ui-btn-menu" data-id="spaces-tasks-add-menu-btn"></button>
			</div>
		`;
			main_core.Event.bind(node.querySelector('.ui-btn-menu'), 'click', this.#addMenuClick.bind(this));
			return node;
		}
		#renderViewBtn() {
			const uiClasses = 'ui-btn ui-btn-light ui-btn-sm ui-btn-round ui-btn-no-caps ui-btn-themes';
			const node = main_core.Tag.render`
			<button
				data-id="sn-spaces-tasks-view-mode-btn"
				class="${uiClasses} sn-spaces__toolbar-space_btn-options"
			>
				<div
					class="ui-icon-set --customer-cards"
					style="--ui-icon-set__icon-size: 25px;"
				></div>
				<div class="sn-spaces__toolbar-space_btn-text">
					${main_core.Loc.getMessage('SN_SPACES_TASKS_VIEW_BTN')}
				</div>
				<div
					class="ui-icon-set --chevron-down"
					style="--ui-icon-set__icon-size: 19px;"
				></div>
			</button>
		`;
			main_core.Event.bind(node, 'click', this.#viewClick.bind(this));
			return node;
		}
		#renderSettingsBtn() {
			const uiClasses = 'ui-btn ui-btn-light ui-btn-sm ui-btn-round ui-btn-themes';
			const node = main_core.Tag.render`
			<button
				data-id="spaces-tasks-settings-btn"
				class="${uiClasses} sn-spaces__toolbar-space_btn-more"
			>
				<div class="ui-icon-set --more"></div>
			</button>
		`;
			main_core.Event.bind(node, 'click', this.#settingsClick.bind(this));
			return node;
		}
		#addMenuClick(event) {
			tasks_creationMenu.CreationMenu.toggle({
				bindElement: event.srcElement,
				createTaskLink: this.#getParam('pathToAddTask'),
				templatesListLink: this.#getParam('pathToTemplateList')
			});
		}
		#viewClick(event) {
			if (!this.#tasksViewList) {
				this.#tasksViewList = new TasksViewList({
					bindElement: event.target,
					viewList: this.#getParam('viewList')
				});
				this.#tasksViewList.subscribe('click', baseEvent => {
					const {
						urlParam,
						urlValue
					} = baseEvent.getData();
					this.#router.redirectToTasks(urlParam, urlValue);
				});
			}
			this.#tasksViewList.show();
		}
		#settingsClick(event) {
			if (!this.#settings) {
				if (this.#getParam('isUserSpace')) {
					this.#settings = new UserSettings({
						bindElement: event.target,
						tasksView: this.#tasksView,
						pathToTasks: this.#getParam('pathToTasks'),
						order: this.#getParam('order'),
						shouldSubtasksBeGrouped: this.#getParam('shouldSubtasksBeGrouped'),
						userId: this.#getParam('userId'),
						gridId: this.#getParam('gridId'),
						sortFields: this.#getParam('sortFields'),
						taskSort: this.#getParam('taskSort'),
						syncScript: this.#getParam('syncScript'),
						permissions: this.#getParam('permissions')
					});
				} else {
					// eslint-disable-next-line no-lonely-if
					if (this.#getParam('isScrumSpace')) {
						this.#settings = new ScrumSettings({
							bindElement: event.target,
							displayPriority: this.#getParam('displayPriority'),
							tasksView: this.#tasksView,
							router: this.#router,
							order: this.#getParam('order'),
							activeSprintExists: this.#getParam('activeSprintId') > 0,
							canCompleteSprint: this.#getParam('canEditSprint') === 'Y'
						});
						this.#settings.subscribe('completeSprint', () => this.#tasksScrum.showCompletionForm());
						this.#settings.subscribe('showBurnDown', () => this.#tasksScrum.showBurnDown());
					} else {
						this.#settings = new GroupSettings({
							bindElement: event.target,
							tasksView: this.#tasksView,
							pathToTasks: this.#getParam('pathToTasks'),
							order: this.#getParam('order'),
							shouldSubtasksBeGrouped: this.#getParam('shouldSubtasksBeGrouped'),
							userId: this.#getParam('userId'),
							gridId: this.#getParam('gridId'),
							sortFields: this.#getParam('sortFields'),
							taskSort: this.#getParam('taskSort'),
							syncScript: this.#getParam('syncScript'),
							permissions: this.#getParam('permissions')
						});
					}
				}
				this.#settings.subscribe('realAll', () => {
					if (this.#counters) {
						this.#counters.readAll();
					}
				});
			}
			this.#settings.show();
		}
	}

	class FilesAddSettings extends main_core_events.EventEmitter {
		#menu;
		#documentHandlers;
		constructor(params) {
			super();
			this.setEventNamespace('BX.Socialnetwork.Spaces.FilesAddSettings');
			this.#documentHandlers = params.documentHandlers;
			this.#menu = this.#createMenu(params.bindElement);
		}
		show() {
			this.#menu.toggle();
		}
		#createMenu(bindElement) {
			const fileUploadItemId = 'spaces-files-add-file-item';
			const menu = new main_popup.Menu({
				id: 'spaces-files-add-settings',
				bindElement,
				closeByEsc: true,
				events: {
					onShow: event => {
						this.emit('show', {
							fileUploadContainer: menu.getMenuItem(fileUploadItemId).getContainer()
						});
					},
					onClose: () => {
						this.emit('close', {
							fileUploadContainer: menu.getMenuItem(fileUploadItemId).getContainer()
						});
					}
				}
			});
			menu.addMenuItem({
				dataset: {
					id: 'spaces-files-add-settings-file'
				},
				id: fileUploadItemId,
				text: main_core.Loc.getMessage('SN_SPACES_FILES_ADD_SETTINGS_FILE')
			});
			menu.addMenuItem({
				dataset: {
					id: 'spaces-files-add-settings-folder'
				},
				text: main_core.Loc.getMessage('SN_SPACES_FILES_ADD_SETTINGS_FOLDER'),
				onclick: () => {
					this.emit('addFolder');
				}
			});
			this.#documentHandlers.forEach(handler => {
				menu.addMenuItem({
					dataset: {
						id: `spaces-files-add-settings-type-${handler.code}`
					},
					text: handler.name,
					items: [{
						text: main_core.Loc.getMessage('SN_SPACES_FILES_ADD_SETTINGS_DOC'),
						onclick: () => {
							menu.close();
							this.emit('addDoc', {
								handlerCode: handler.code
							});
						}
					}, {
						text: main_core.Loc.getMessage('SN_SPACES_FILES_ADD_SETTINGS_TABLE'),
						onclick: () => {
							menu.close();
							this.emit('addTable', {
								handlerCode: handler.code
							});
						}
					}, {
						text: main_core.Loc.getMessage('SN_SPACES_FILES_ADD_SETTINGS_PRESENTATION'),
						onclick: () => {
							menu.close();
							this.emit('addPresentation', {
								handlerCode: handler.code
							});
						}
					}]
				});
			});
			return menu;
		}
	}

	class FilesRouter {
		#pathToTrash;
		#pathToVolume;
		constructor(params) {
			this.#pathToTrash = params.pathToTrash;
			this.#pathToVolume = params.pathToUserFilesVolume;
		}
		redirectToTrash() {
			top.BX.Socialnetwork.Spaces.space.reloadPageContent(this.#pathToTrash);
		}
		redirectToVolume() {
			top.location.href = this.#pathToVolume;
		}
	}

	class FilesSettings extends main_core_events.EventEmitter {
		#cache = new main_core.Cache.MemoryCache();
		#menu;
		constructor(params) {
			super();
			this.setEventNamespace('BX.Socialnetwork.Spaces.FilesSettings');
			this.#setParams(params);
			this.#menu = this.#createMenu(params.bindElement);
		}
		show() {
			this.#menu.toggle();
		}
		#setParams(params) {
			this.#cache.set('params', params);
		}
		#getParam(param) {
			return this.#cache.get('params')[param];
		}
		#createMenu(bindElement) {
			const menu = new main_popup.Menu({
				id: 'spaces-files-settings',
				bindElement,
				closeByEsc: true
			});
			const permissions = this.#getParam('permissions');
			if (permissions.canChangeRights === true) {
				menu.addMenuItem({
					dataset: {
						id: 'spaces-files-settings-rights'
					},
					text: main_core.Loc.getMessage('SN_SPACES_FILES_SETTINGS_RIGHTS'),
					onclick: () => {
						this.emit('rights');
					}
				});
			}
			if (permissions.canChangeBizproc === true) {
				menu.addMenuItem({
					dataset: {
						id: 'spaces-files-settings-bizproc'
					},
					text: main_core.Loc.getMessage('SN_SPACES_FILES_BIZPROC'),
					onclick: () => {
						this.emit('bizproc');
					}
				});
			}
			if (permissions.canChangeBizprocSettings === true) {
				menu.addMenuItem({
					dataset: {
						id: 'spaces-files-settings-config-bizproc'
					},
					text: main_core.Loc.getMessage('SN_SPACES_FILES_SETTINGS_BIZPROC'),
					onclick: () => {
						this.emit('bizprocSettings');
					}
				});
			}
			menu.addMenuItem({
				dataset: {
					id: 'spaces-files-settings-network'
				},
				text: main_core.Loc.getMessage('SN_SPACES_FILES_SETTINGS_NETWORK'),
				onclick: () => {
					this.emit('network');
				}
			});
			menu.addMenuItem({
				dataset: {
					id: 'spaces-files-settings-doc'
				},
				text: main_core.Loc.getMessage('SN_SPACES_FILES_SETTINGS_DOC'),
				onclick: () => {
					this.emit('docSettings');
				}
			});
			if (permissions.canCleanFiles === true) {
				menu.addMenuItem({
					dataset: {
						id: 'spaces-files-settings-clean'
					},
					text: main_core.Loc.getMessage('SN_SPACES_FILES_SETTINGS_CLEAN'),
					onclick: () => {
						this.emit('clean');
					}
				});
			}
			if (!this.#getParam('isTrashMode')) {
				menu.addMenuItem({
					dataset: {
						id: 'spaces-files-settings-trash'
					},
					text: main_core.Loc.getMessage('SN_SPACES_FILES_SETTINGS_TRASH'),
					onclick: () => {
						this.emit('trash');
					}
				});
			}
			return menu;
		}
	}

	class FilesDisk {
		#cache = new main_core.Cache.MemoryCache();
		constructor(params) {
			this.#setParams(params);
		}
		createFolder() {
			this.#getDiskFolderList().createFolder();
		}
		appendUploadInput(container) {
			// eslint-disable-next-line @bitrix24/bitrix24-rules/no-bx
			BX.onCustomEvent(window, 'onDiskUploadPopupShow', [container]);
		}
		hideUploadInput(container) {
			// eslint-disable-next-line @bitrix24/bitrix24-rules/no-bx
			BX.onCustomEvent(window, 'onDiskUploadPopupClose', [container]);
		}
		runCreatingDocFile(code) {
			this.#getDiskFolderList().runCreatingFile('docx', code);
		}
		runCreatingTableFile(code) {
			this.#getDiskFolderList().runCreatingFile('xlsx', code);
		}
		runCreatingPresentationFile(code) {
			this.#getDiskFolderList().runCreatingFile('pptx', code);
		}
		showRights() {
			const listAvailableFeatures = this.#getParam('listAvailableFeatures');
			const featureRestrictionMap = this.#getParam('featureRestrictionMap');
			if (listAvailableFeatures.disk_folder_sharing === true) {
				this.#getDiskFolderList().showRightsOnStorage();
			} else {
				BX.UI.InfoHelper.show(featureRestrictionMap.disk_folder_sharing);
			}
		}
		showBizproc() {
			this.#getDiskFolderList().openSlider(this.#getParam('pathToFilesBizprocWorkflowAdmin'));
		}
		showBizprocSettings() {
			this.#getDiskFolderList().showSettingsOnBizproc();
		}
		showNetworkDriveConnect() {
			this.#getDiskFolderList().showNetworkDriveConnect({
				link: this.#getParam('networkDriveLink')
			});
		}
		openWindowForSelectDocumentService() {
			this.#getDiskFolderList().openWindowForSelectDocumentService({});
		}
		cleanTrash() {
			this.#getDiskFolderList().openConfirmEmptyTrash();
		}
		#setParams(params) {
			this.#cache.set('params', params);
		}
		#getParam(param) {
			return this.#cache.get('params')[param];
		}
		#getDiskFolderList() {
			return BX.Disk[`FolderListClass_${this.#getParam('diskComponentId')}`];
		}
	}

	class FilesToolbar {
		#cache = new main_core.Cache.MemoryCache();
		#router;
		#disk;
		#addSettings;
		#settings;
		#filter;
		constructor(params) {
			this.#setParams(params);
			this.#router = new FilesRouter({
				pathToTrash: this.#getParam('pathToTrash'),
				pathToUserFilesVolume: this.#getParam('pathToUserFilesVolume')
			});
			this.#disk = new FilesDisk({
				diskComponentId: params.diskComponentId,
				networkDriveLink: this.#getParam('networkDriveLink'),
				pathToFilesBizprocWorkflowAdmin: this.#getParam('pathToFilesBizprocWorkflowAdmin'),
				listAvailableFeatures: this.#getParam('listAvailableFeatures'),
				featureRestrictionMap: this.#getParam('featureRestrictionMap')
			});
			this.#filter = new Filter({
				filterId: params.filterId,
				filterContainer: params.filterContainer
			});
		}
		renderAddBtnTo(container) {
			if (!main_core.Type.isDomNode(container)) {
				throw new Error('BX.Socialnetwork.Spaces.FilesToolbar: HTMLElement for add btn not found');
			}
			main_core.Dom.append(this.#renderAddBtn(), container);
		}
		renderCleanBtnTo(container) {
			if (!main_core.Type.isDomNode(container)) {
				throw new Error('BX.Socialnetwork.Spaces.FilesToolbar: HTMLElement for add btn not found');
			}
			main_core.Dom.append(this.#renderCleanBtn(), container);
		}
		renderSettingsBtnTo(container) {
			if (!main_core.Type.isDomNode(container)) {
				throw new Error('BX.Socialnetwork.Spaces.FilesToolbar: HTMLElement for settings btn not found');
			}
			main_core.Dom.append(this.#renderSettingsBtn(), container);
		}
		#setParams(params) {
			this.#cache.set('params', params);
		}
		#getParam(param) {
			return this.#cache.get('params')[param];
		}
		#renderAddBtn() {
			const node = main_core.Tag.render`
			<div class="ui-btn-split ui-btn-success ui-btn-round ui-btn-no-caps">
				<div data-id="spaces-files-add-main-btn" class="ui-btn-main">
					${main_core.Loc.getMessage('SN_SPACES_FILES_ADD_FILE')}
				</div>
				<div data-id="spaces-files-add-menu-btn" class="ui-btn-menu"></div>
			</div>
		`;
			main_core.Event.bind(node.querySelector('.ui-btn-menu'), 'click', this.#addMenuClick.bind(this));
			main_core.Event.bind(node.querySelector('.ui-btn-main'), 'mouseenter', event => {
				this.#disk.appendUploadInput(event.target);
			});
			main_core.Event.bind(node.querySelector('.ui-btn-main'), 'mouseleave', event => {
				this.#disk.hideUploadInput(event.target);
			});
			return node;
		}
		#renderCleanBtn() {
			const node = main_core.Tag.render`
			<div class="ui-btn ui-btn-success ui-btn-round ui-btn-no-caps">
				${main_core.Loc.getMessage('SN_SPACES_FILES_CLEAN_BTN')}
			</div>
		`;
			main_core.Event.bind(node, 'click', this.#cleanClick.bind(this));
			return node;
		}
		#renderSettingsBtn() {
			const node = main_core.Tag.render`
			<button
				data-id="spaces-files-settings-btn"
				class="ui-btn ui-btn-light ui-btn-sm ui-btn-round ui-btn-themes sn-spaces__toolbar-space_btn-more"
			>
				<div class="ui-icon-set --more"></div>
			</button>
		`;
			main_core.Event.bind(node, 'click', this.#settingsClick.bind(this));
			return node;
		}
		#addMenuClick(event) {
			if (!this.#addSettings) {
				this.#addSettings = new FilesAddSettings({
					bindElement: event.target,
					documentHandlers: this.#getParam('documentHandlers')
				});
				this.#addSettings.subscribe('show', baseEvent => {
					const {
						fileUploadContainer
					} = baseEvent.getData();
					this.#disk.appendUploadInput(fileUploadContainer);
				});
				this.#addSettings.subscribe('close', baseEvent => {
					const {
						fileUploadContainer
					} = baseEvent.getData();
					this.#disk.hideUploadInput(fileUploadContainer);
				});
				this.#addSettings.subscribe('addFolder', () => {
					this.#disk.createFolder();
				});
				this.#addSettings.subscribe('addDoc', baseEvent => {
					const {
						handlerCode
					} = baseEvent.getData();
					this.#disk.runCreatingDocFile(handlerCode);
				});
				this.#addSettings.subscribe('addTable', baseEvent => {
					const {
						handlerCode
					} = baseEvent.getData();
					this.#disk.runCreatingTableFile(handlerCode);
				});
				this.#addSettings.subscribe('addPresentation', baseEvent => {
					const {
						handlerCode
					} = baseEvent.getData();
					this.#disk.runCreatingPresentationFile(handlerCode);
				});
			}
			this.#addSettings.show();
		}
		#cleanClick() {
			this.#disk.cleanTrash();
		}
		#settingsClick(event) {
			if (!this.#settings) {
				this.#settings = new FilesSettings({
					bindElement: event.target,
					permissions: this.#getParam('permissions'),
					featureRestrictionMap: this.#getParam('featureRestrictionMap'),
					isTrashMode: this.#getParam('isTrashMode')
				});
				this.#settings.subscribe('rights', () => {
					this.#disk.showRights();
				});
				this.#settings.subscribe('bizproc', () => {
					this.#disk.showBizproc();
				});
				this.#settings.subscribe('bizprocSettings', () => {
					this.#disk.showBizprocSettings();
				});
				this.#settings.subscribe('network', () => {
					this.#disk.showNetworkDriveConnect();
				});
				this.#settings.subscribe('clean', () => {
					this.#router.redirectToVolume();
				});
				this.#settings.subscribe('docSettings', () => {
					this.#disk.openWindowForSelectDocumentService();
				});
				this.#settings.subscribe('trash', () => {
					this.#router.redirectToTrash();
				});
			}
			this.#settings.show();
		}
	}

	class Calendar {
		#type;
		#locationAccess;
		#userId;
		#ownerId;
		#calendarInstance = null;
		constructor(params) {
			if (!this.#isTypeAllowed(params.type)) {
				throw new Error('BX.Socialnetwork.Spaces.Calendar: calendar type is not allowed');
			}
			this.#type = params.type;
			this.#userId = params.userId;
			this.#ownerId = params.ownerId;
			this.#locationAccess = params.locationAccess;
		}
		#isTypeAllowed(type) {
			const allowedType = ['user', 'group'];
			return allowedType.includes(type);
		}
		#setCalendarInstance() {
			if (main_core.Type.isUndefined(window.BXEventCalendar)) {
				throw new TypeError('BX.Socialnetwork.Spaces.CalendarSettings: BXEventCalendar is not allowed');
			}
			const calendarId = Object.keys(window.BXEventCalendar.instances)[0];
			this.#calendarInstance = window.BXEventCalendar.instances[calendarId];
		}
		getCalendarInstance() {
			if (!this.#calendarInstance) {
				this.#setCalendarInstance();
			}
			return this.#calendarInstance;
		}
		addEvent() {
			calendar_entry.EntryManager.openEditSlider({
				type: this.#type,
				isLocationCalendar: false,
				locationAccess: this.#locationAccess,
				ownerId: this.#ownerId,
				userId: this.#userId
			});
		}
		addTask() {
			BX.SidePanel.Instance.open(this.#getUrlForAddTask(this.#type), {
				loader: 'task-new-loader'
			});
		}
		#getUrlForAddTask(type) {
			let url = '';
			switch (type) {
				case 'group':
					url = `/workgroups/group/${this.#ownerId}`;
					break;
				case 'user':
					url = `/company/personal/user/${this.#ownerId}`;
					break;
				default:
					throw new Error('BX.Socialnetwork.Spaces.Calendar: url for add task is empty');
			}
			return `${url}/tasks/task/edit/0/`;
		}
	}

	class CalendarAddButtonMenu extends main_core_events.EventEmitter {
		#menu;
		#calendar;
		constructor(params) {
			super();
			this.setEventNamespace('BX.Socialnetwork.Spaces.CalendarAddButtonMenu');
			if (params.showMenu ?? true) {
				this.#menu = this.#createMenu(params.bindElement);
			}
			this.#calendar = params.calendar;
		}
		show() {
			this.#menu.show();
		}
		#createMenu(bindElement) {
			const menu = new main_popup.Menu({
				id: 'spaces-calendar-add-button-menu',
				bindElement,
				closeByEsc: true
			});
			menu.addMenuItem({
				text: main_core.Loc.getMessage('SN_SPACES_CALENDAR_CREATE_EVENT'),
				dataset: {
					id: 'spaces-calendar-add-button-menu-create-event'
				},
				onclick: () => {
					menu.close();
					this.#calendar.addEvent();
				}
			});
			menu.addMenuItem({
				text: main_core.Loc.getMessage('SN_SPACES_CALENDAR_CREATE_TASK'),
				dataset: {
					id: 'spaces-calendar-add-button-menu-create-task'
				},
				onclick: () => {
					menu.close();
					this.#calendar.addTask();
				}
			});
			return menu;
		}
	}

	class CalendarSettings extends main_core_events.EventEmitter {
		#menu;
		constructor(params) {
			super();
			this.setEventNamespace('BX.Socialnetwork.Spaces.CalendarSettings');
			if (main_core.Type.isNil(params.calendar)) {
				throw new TypeError('BX.Socialnetwork.Spaces.CalendarSettings: calendar is not available');
			}
			this.#menu = this.#createMenu(params.bindElement, params.calendar);
		}
		show() {
			this.#menu.show();
		}
		#createMenu(bindElement, calendar) {
			const menu = new main_popup.Menu({
				id: 'spaces-calendar-settings',
				bindElement,
				closeByEsc: true
			});
			if (calendar.getCalendarInstance().util.userIsOwner() || calendar.getCalendarInstance().util.config.TYPE_ACCESS) {
				menu.addMenuItem({
					text: main_core.Loc.getMessage('SN_SPACES_CALENDAR_SETTINGS_SETTINGS'),
					onclick: () => {
						menu.close();
						this.#openSettings(calendar);
					}
				});
			}
			menu.addMenuItem({
				text: main_core.Loc.getMessage('SN_SPACES_CALENDAR_SETTINGS_CALENDARS'),
				onclick: () => {
					menu.close();
					this.#openCalendars(calendar);
				}
			});
			return menu;
		}
		#openCalendars(calendar) {
			// eslint-disable-next-line promise/catch-or-return
			this.#getSectionInterface().then(SectionInterface => {
				if (!this.sectionInterface) {
					const calendarInstance = calendar.getCalendarInstance();
					this.sectionInterface = new SectionInterface({
						calendarContext: calendarInstance,
						readonly: calendarInstance.util.readOnlyMode(),
						sectionManager: calendarInstance.sectionManager
					});
				}
				this.sectionInterface.show();
			});
		}
		#openSettings(calendar) {
			// eslint-disable-next-line promise/catch-or-return
			this.#getSettingsInterface().then(SettingsInterface => {
				if (!this.settingsInterface) {
					const calendarInstance = calendar.getCalendarInstance();
					if (main_core.Type.isNull(calendarInstance)) {
						throw new TypeError('BX.Socialnetwork.Spaces.CalendarSettings: calendar instance is not available');
					}
					this.settingsInterface = new SettingsInterface({
						calendarContext: calendarInstance,
						showPersonalSettings: calendarInstance.util.userIsOwner(),
						showGeneralSettings: Boolean(calendarInstance.util.config.perm && calendarInstance.util.config.perm.access),
						settings: calendarInstance.util.config.settings
					});
				}
				this.settingsInterface.show();
			});
		}
		#getSectionInterface() {
			return new Promise(resolve => {
				const bx = BX.Calendar.Util.getBX();
				if (bx.Calendar.SectionInterface) {
					resolve(bx.Calendar.SectionInterface);
				} else {
					const extensionName = 'calendar.sectioninterface';
					// eslint-disable-next-line promise/catch-or-return
					bx.Runtime.loadExtension(extensionName).then(() => {
						if (bx.Calendar.SectionInterface) {
							resolve(bx.Calendar.SectionInterface);
						} else {
							console.error(`Extension ${extensionName} not found`);
						}
					});
				}
			});
		}
		#getSettingsInterface() {
			return new Promise(resolve => {
				const bx = BX.Calendar.Util.getBX();
				if (bx.Calendar.SettingsInterface) {
					resolve(bx.Calendar.SettingsInterface);
				} else {
					const extensionName = 'calendar.settingsinterface';
					// eslint-disable-next-line promise/catch-or-return
					bx.Runtime.loadExtension(extensionName).then(() => {
						if (bx.Calendar.SettingsInterface) {
							resolve(bx.Calendar.SettingsInterface);
						} else {
							console.error(`Extension ${extensionName} not found`);
						}
					});
				}
			});
		}
	}

	class CalendarToolbar {
		#calendar;
		#addButtonMenu;
		#settings;
		#filter;
		#type;
		#ownerId;
		constructor(params) {
			this.#type = params.type;
			this.#ownerId = params.ownerId;
			this.#calendar = new Calendar({
				type: params.type,
				// eslint-disable-next-line no-constant-binary-expression
				locationAccess: params.locationAccess === '1' ?? false,
				userId: params.userId,
				ownerId: params.ownerId
			});
			this.#filter = new Filter({
				filterId: params.filterId,
				filterContainer: params.filterContainer
			});
		}
		renderAddBtnTo(container) {
			if (!main_core.Type.isDomNode(container)) {
				throw new Error('BX.Socialnetwork.Spaces.CalendarToolbar: HTMLElement for add btn not found');
			}
			main_core.Dom.append(this.#renderAddBtn(), container);
		}
		renderSettingsBtnTo(container) {
			if (!main_core.Type.isDomNode(container)) {
				throw new Error('BX.Socialnetwork.Spaces.CalendarToolbar: HTMLElement for settings btn not found');
			}
			main_core.Dom.append(this.#renderSettingsBtn(), container);
		}
		#renderAddBtn() {
			const {
				node,
				mainBtn,
				menuBtn
			} = main_core.Tag.render`
			<div class="ui-btn-split ui-btn-success ui-btn-round ui-btn-no-caps" ref="node">
				<button class="ui-btn-main" data-id="spaces-calendar-add-main-btn" ref="mainBtn">
					${main_core.Loc.getMessage('SN_SPACES_CALENDAR_CREATE_MEETING')}
				</button>
				<button 
					class="ui-btn-menu" 
					id="spaces-calendar-toolbar-menu" 
					data-id="spaces-calendar-add-menu-btn"
					ref="menuBtn"
				>		
				</button>
			</div>
		`;
			main_core.Event.bind(mainBtn, 'click', this.#addMainClick.bind(this));
			main_core.Event.bind(menuBtn, 'click', this.#addMenuClick.bind(this));
			return node;
		}
		#renderSettingsBtn() {
			const node = main_core.Tag.render`
			<button 
				class="ui-btn ui-btn-light ui-btn-sm ui-btn-round ui-btn-themes" 
				data-id="spaces-calendar-settings-btn"
			>
				<div class="ui-icon-set --more" style="--ui-icon-set__icon-color: white;"></div>
			</button>
		`;
			main_core.Event.bind(node, 'click', this.#settingsClick.bind(this));
			return node;
		}
		#createAddSettings() {
			this.#addButtonMenu = new CalendarAddButtonMenu({
				bindElement: document.getElementById('spaces-calendar-toolbar-menu'),
				calendar: this.#calendar
			});
		}
		#addMainClick() {
			this.#sendCreateEventAnalytics();
			this.#calendar.addEvent();
		}
		#sendCreateEventAnalytics() {
			const settings = main_core.Extension.getSettings('socialnetwork.v2.lib.event-sender') ?? {};
			const userType = main_core.Type.isStringFilled(settings.userType) ? settings.userType : null;
			calendar_analytics.Analytics.sendEvent({
				event: 'click_create_event',
				cSection: 'project',
				cSubSection: 'project_header',
				cElement: 'slider',
				status: 'success',
				projectId: this.#type === 'group' ? this.#ownerId : null,
				userType
			});
		}
		#addMenuClick() {
			if (!this.#addButtonMenu) {
				this.#createAddSettings();
			}
			this.#addButtonMenu.show();
		}
		#settingsClick(event) {
			if (!this.#settings) {
				this.#settings = new CalendarSettings({
					bindElement: event.target,
					calendar: this.#calendar
				});
			}
			this.#settings.show();
		}
	}

	class DiscussionsAddButtonMenu extends main_core_events.EventEmitter {
		#menu;
		constructor(params) {
			super();
			this.setEventNamespace('BX.Socialnetwork.Spaces.DiscussionsAddButtonMenu');
			if (main_core.Type.isNil(params.calendar)) {
				throw new TypeError('BX.Socialnetwork.Spaces.DiscussionsAddButtonMenu: calendar is not allowed');
			}
			this.#menu = this.#createMenu(params.bindElement, params.calendar, params.isDiskStorageWasObtained);
		}
		show() {
			this.#menu.show();
		}
		#createMenu(bindElement, calendar, isDiskStorageWasObtained) {
			const fileUploadItemId = 'spaces-discussions-add-button-menu-file-item';
			const menu = new main_popup.Menu({
				id: 'spaces-discussions-add-button-menu',
				bindElement,
				closeByEsc: true,
				events: {
					onShow: event => {
						if (isDiskStorageWasObtained) {
							this.emit('showMenu', {
								fileUploadContainer: menu.getMenuItem(fileUploadItemId).getContainer()
							});
						}
					},
					onClose: () => {
						if (isDiskStorageWasObtained) {
							this.emit('closeMenu', {
								fileUploadContainer: menu.getMenuItem(fileUploadItemId).getContainer()
							});
						}
					}
				}
			});
			menu.addMenuItem({
				text: main_core.Loc.getMessage('SN_SPACES_DISCUSSIONS_CREATE_TASK'),
				dataset: {
					id: 'spaces-discussions-add-button-menu-create-task'
				},
				onclick: () => {
					menu.close();
					calendar.addTask();
				}
			});
			menu.addMenuItem({
				text: main_core.Loc.getMessage('SN_SPACES_DISCUSSIONS_ORGANIZE_EVENT'),
				dataset: {
					id: 'spaces-discussions-add-button-menu-organize_event'
				},
				onclick: () => {
					menu.close();
					calendar.addEvent();
				}
			});
			if (isDiskStorageWasObtained) {
				menu.addMenuItem({
					text: main_core.Loc.getMessage('SN_SPACES_DISCUSSIONS_UPLOAD_FILE'),
					dataset: {
						id: 'spaces-discussions-add-button-menu-file'
					},
					id: fileUploadItemId
				});
			}
			return menu;
		}
	}

	class DiscussionsSettings extends main_core_events.EventEmitter {
		#menu;
		#isSmartTrackingMode;
		#mainFilterId;
		static SWITCHER = 'smart_tracking';
		static SELECTED = 'menu-popup-item-accept';
		static DESELECTED = 'menu-popup-item-none';
		constructor(params) {
			super();
			this.setEventNamespace('BX.Socialnetwork.Spaces.DiscussionsSettings');
			this.#mainFilterId = params.mainFilterId;
			this.#isSmartTrackingMode = String(params.isSmartTrackingMode) === 'Y';
			this.#menu = this.#createMenu(params.bindElement);
		}
		show() {
			this.#menu.show();
		}
		#switch() {
			this.#switchMode().then(result => {
				this.#switchStyle(result.data.mode);
				this.#refresh();
			});
		}
		#createMenu(bindElement) {
			const menu = new main_popup.Menu({
				id: 'spaces-discussions-settings',
				bindElement,
				closeByEsc: true
			});
			menu.addMenuItem({
				id: DiscussionsSettings.SWITCHER,
				text: main_core.Loc.getMessage('SN_SPACES_DISCUSSIONS_SETTINGS_SMART_TRACKING'),
				className: this.#isSmartTrackingMode ? DiscussionsSettings.DESELECTED : DiscussionsSettings.SELECTED,
				onclick: this.#switch.bind(this)
			});
			menu.getMenuItem();
			return menu;
		}
		#getStyleFromMode(mode) {
			if (mode === 'Y') {
				return DiscussionsSettings.DESELECTED;
			}
			return DiscussionsSettings.SELECTED;
		}
		#switchMode() {
			return main_core.ajax.runAction('socialnetwork.api.livefeed.spaces.switcher.track', {
				data: {
					switcher: {
						type: DiscussionsSettings.SWITCHER,
						spaceId: 0
					},
					space: 0
				}
			});
		}
		#switchStyle(mode) {
			const item = this.#menu.getMenuItem(DiscussionsSettings.SWITCHER);
			main_core.Dom.removeClass(item.layout.item, DiscussionsSettings.SELECTED);
			main_core.Dom.removeClass(item.layout.item, DiscussionsSettings.DESELECTED);
			main_core.Dom.addClass(item.layout.item, this.#getStyleFromMode(mode));
		}
		#refresh() {
			const filter = BX.Main.filterManager.getById(this.#mainFilterId);
			if (filter instanceof BX.Main.Filter) {
				filter.getApi().apply();
			}
		}
	}

	class DiscussionsComposition extends main_core_events.EventEmitter {
		#params;
		#menu;
		#fields;
		#appliedFields;
		#switchers;
		#spaceName;
		#spaceId;
		#userId;
		constructor(params) {
			super();
			this.setEventNamespace('BX.Socialnetwork.Spaces.DiscussionsComposition');
			this.#params = params;
			this.#init();
		}
		#init() {
			this.#spaceId = this.#params.spaceId;
			this.#userId = this.#params.userId;
			this.#spaceName = this.#params.spaceName;
			this.#fields = this.#params.compositionFilters;
			this.#appliedFields = JSON.parse(this.#params.appliedFields);
			this.#switchers = {};
			this.#menu = this.#createMenu(this.#params.bindElement);
		}
		show() {
			this.#menu.show();
		}
		#createMenu(bindElement) {
			return new ui_popupcomponentsmaker.PopupComponentsMaker({
				id: 'spaces-discussions-composition',
				target: bindElement,
				padding: 0,
				contentPadding: 0,
				offsetTop: 5,
				width: 300,
				useAngle: false,
				content: [{
					html: [{
						html: this.#renderMenuContent()
					}]
				}]
			});
		}
		#renderMenuContent() {
			return main_core.Tag.render`
			<div>
				${this.#renderHeader()}
				${this.#renderFilters()}
			</div>
		`;
		}
		#renderHeader() {
			return main_core.Tag.render`
			<div class="sn-spaces-discussions-composition-header" data-id="spaces-discussions-composition-header">
				<div class="sn-spaces-discussions-composition-header-title">
					${main_core.Loc.getMessage('SN_SPACES_DISCUSSION_COMPOSITION_TITLE').replace('%SPACE_NAME%', `<span>${main_core.Text.encode(this.#spaceName)}</span>`)}
				</div>
				<div class="sn-spaces-discussions-composition-header-icon"></div>
			</div>
		`;
		}
		#renderFilters() {
			const filtersContainer = main_core.Tag.render`
			<div data-id="spaces-discussions-composition-filters" class="sn-spaces-discussions-composition-filters"></div>
		`;
			this.#fields.forEach(field => {
				const messageId = `SN_SPACES_DISCUSSIONS_COMPOSITION_FILTER_${field.toUpperCase()}`;
				const {
					container,
					switchButton
				} = main_core.Tag.render`
				<div
					id="spaces-discussions-composition-filter-${field}" 
					ref="container"
					class="sn-spaces-discussions-composition-filters-item"
				>
					<div ref="switchButton" class="sn-spaces-discussions-composition-item-switcher"></div>
					<div class="sn-spaces__popup-settings_name">
						${main_core.Loc.getMessage(messageId)}
					</div>
				</div>
			`;
				this.#switchers[field] = new ui_switcher.Switcher({
					node: switchButton,
					checked: this.#appliedFields.includes(field),
					color: 'green',
					size: 'small',
					handlers: {
						toggled: () => {
							if (this.#switchers[field].isChecked()) {
								this.#appliedFields.push(field);
							} else {
								this.#appliedFields.splice(this.#appliedFields.indexOf(field), 1);
							}
							this.#applyComposition();
						}
					}
				});
				filtersContainer.append(container);
			});
			return filtersContainer;
		}
		#applyComposition() {
			this.#setCompositionSettings().then(() => {
				this.#refresh();
			});
		}
		#setCompositionSettings() {
			return main_core.ajax.runAction('socialnetwork.api.livefeed.spaces.composition.setSettings', {
				data: {
					composition: this.#spaceId,
					settings: this.#appliedFields
				}
			});
		}
		#refresh() {
			const params = {
				composition: this.#appliedFields,
				context: 'spaces',
				useBXMainFilter: 'Y',
				spaceId: this.#spaceId,
				spaceUserId: this.#userId
			};
			BX.Livefeed.PageInstance.refresh(params, null);
		}
	}

	const NotificationCenter = main_core.Reflection.namespace('BX.UI.Notification.Center');
	class DiscussionsToolbar {
		#cache = new main_core.Cache.MemoryCache();
		#postForm;
		#addButtonMenu;
		#composition;
		#settings;
		#filter;
		constructor(params) {
			this.#setParams(params);
			this.#filter = new Filter({
				filterId: this.#getParam('filterId'),
				filterContainer: this.#getParam('filterContainer')
			});
		}
		#setParams(params) {
			this.#cache.set('params', params);
		}
		#getParam(param) {
			return this.#cache.get('params')[param];
		}
		renderAddBtnTo(container) {
			if (!main_core.Type.isDomNode(container)) {
				throw new Error('BX.Socialnetwork.Spaces.DiscussionsToolbar: HTMLElement for add btn not found');
			}
			main_core.Dom.append(this.#renderAddBtn(), container);
		}
		renderCompositionBtnTo(container) {
			if (!main_core.Type.isDomNode(container)) {
				throw new Error('BX.Socialnetwork.Spaces.DiscussionsToolbar: HTMLElement for add composition btn not found');
			}
			main_core.Dom.append(this.#renderCompositionBtn(), container);
		}
		renderSettingsBtnTo(container) {
			if (!main_core.Type.isDomNode(container)) {
				throw new Error('BX.Socialnetwork.Spaces.DiscussionsToolbar: HTMLElement for settings btn not found');
			}
			main_core.Dom.append(this.#renderSettingsBtn(), container);
		}
		#renderAddBtn() {
			const {
				node,
				mainBtn,
				menuBtn
			} = main_core.Tag.render`
			<div class="ui-btn-split ui-btn-success ui-btn-round ui-btn-no-caps" ref="node">
				<button class="ui-btn-main" data-id="spaces-discussions-add-main-btn" ref="mainBtn">
					${main_core.Loc.getMessage('SN_SPACES_DISCUSSIONS_START_DISCUSSIONS')}
				</button>
				<button 
					class="ui-btn-menu"  
					id="spaces-discussions-toolbar-menu" 
					data-id="spaces-discussions-add-menu-btn"
					ref="menuBtn"
				>	
				</button>
			</div>
		`;
			main_core.Event.bind(mainBtn, 'click', this.#addMainClick.bind(this));
			main_core.Event.bind(menuBtn, 'click', this.#addMenuClick.bind(this));
			return node;
		}
		#renderCompositionBtn() {
			const node = main_core.Tag.render`
			<button 
				class="ui-btn ui-btn-light ui-btn-sm ui-btn-round ui-btn-no-caps ui-btn-themes sn-spaces__toolbar-space_btn-options"
			>
				<div class="ui-icon-set --customer-cards" style="--ui-icon-set__icon-size: 25px;"></div>
				<div class="sn-spaces__toolbar-space_btn-text">
					${main_core.Loc.getMessage('SN_SPACES_DISCUSSIONS_COMPOSITION')}
				</div>
				<div class="ui-icon-set --chevron-down" style="--ui-icon-set__icon-size: 19px;"></div>
			</button>
		`;
			this.#composition = new DiscussionsComposition({
				userId: this.#getParam('userId'),
				spaceId: this.#getParam('spaceId'),
				bindElement: node,
				spaceName: this.#getParam('spaceName'),
				compositionFilters: this.#getParam('compositionFilters'),
				mainFilterId: this.#getParam('mainFilterId'),
				appliedFields: this.#getParam('appliedFields')
			});
			main_core.Event.bind(node, 'click', () => this.#composition.show());
			return node;
		}
		#renderSettingsBtn() {
			const node = main_core.Tag.render`
			<button 
				class="ui-btn ui-btn-light ui-btn-sm ui-btn-round ui-btn-themes sn-spaces__toolbar-space_btn-more" 
				data-id="spaces-discussions-settings-btn"
			>
				<div class="ui-icon-set --more"></div>
			</button>
		`;
			main_core.Event.bind(node, 'click', this.#settingsClick.bind(this));
			return node;
		}
		#addMainClick() {
			if (!this.#postForm) {
				this.#postForm = new socialnetwork_postForm.PostForm({
					groupId: this.#getParam('type') === 'user' ? 0 : this.#getParam('ownerId'),
					pathToDefaultRedirect: this.#getParam('pathToUserPage'),
					pathToGroupRedirect: this.#getParam('pathToGroupPage')
				});
			}
			this.#postForm.show();
		}
		#createAddButtonMenu() {
			const calendar = new Calendar({
				type: this.#getParam('type'),
				// eslint-disable-next-line no-constant-binary-expression
				locationAccess: this.#getParam('locationAccess') === '1' ?? false,
				userId: this.#getParam('userId'),
				ownerId: this.#getParam('ownerId')
			});
			this.#addButtonMenu = new DiscussionsAddButtonMenu({
				bindElement: document.getElementById('spaces-discussions-toolbar-menu'),
				calendar,
				isDiskStorageWasObtained: this.#getParam('isDiskStorageWasObtained') === 'Y'
			});

			// eslint-disable-next-line @bitrix24/bitrix24-rules/no-bx
			BX.addCustomEvent(window, 'onPopupFileUploadClose', () => {
				this.#showSuccessUploadNotify();
			});
			this.#addButtonMenu.subscribe('showMenu', baseEvent => {
				const {
					fileUploadContainer
				} = baseEvent.getData();
				this.#appendUploadInput(fileUploadContainer);
			});
			this.#addButtonMenu.subscribe('closeMenu', baseEvent => {
				const {
					fileUploadContainer
				} = baseEvent.getData();
				this.#hideUploadInput(fileUploadContainer);
			});
		}
		#appendUploadInput(container) {
			// eslint-disable-next-line @bitrix24/bitrix24-rules/no-bx
			BX.onCustomEvent(window, 'onDiskUploadPopupShow', [container]);
		}
		#hideUploadInput(container) {
			// eslint-disable-next-line @bitrix24/bitrix24-rules/no-bx
			BX.onCustomEvent(window, 'onDiskUploadPopupClose', [container]);
		}
		#showSuccessUploadNotify() {
			const content = main_core.Loc.getMessage('SN_SPACES_LINE_UPLOAD_FILE_NOTIFY_MESSAGE').replace('#handler#', `top.BX.Socialnetwork.Spaces.space.reloadPageContent('${this.#getParam('pathToFilesPage')}');`);
			NotificationCenter.notify({
				content
			});
		}
		#addMenuClick() {
			if (!this.#addButtonMenu) {
				this.#createAddButtonMenu();
			}
			this.#addButtonMenu.show();
		}
		#settingsClick(event) {
			if (!this.#settings) {
				this.#settings = new DiscussionsSettings({
					bindElement: event.target,
					isSmartTrackingMode: this.#getParam('isSmartTrackingMode'),
					mainFilterId: this.#getParam('mainFilterId')
				});
			}
			this.#settings.show();
		}
	}

	class UsersRouter {
		#sidePanelManager;
		#pathToInvite;
		constructor(params) {
			this.#sidePanelManager = BX.SidePanel.Instance;
			this.#pathToInvite = params.pathToInvite;
		}
		openInvite() {
			this.#sidePanelManager.open(this.#pathToInvite, {
				width: 950,
				loader: 'group-invite-loader'
			});
		}
	}

	class UsersToolbar {
		#cache = new main_core.Cache.MemoryCache();
		#router;
		constructor(params) {
			this.#setParams(params);
			this.#initServices(params);
		}
		renderInviteBtnTo(container) {
			if (!main_core.Type.isDomNode(container)) {
				throw new Error('BX.Socialnetwork.Spaces.UsersToolbar: HTMLElement for add btn not found');
			}
			main_core.Dom.append(this.#renderInviteBtn(), container);
		}
		#setParams(params) {
			this.#cache.set('params', params);
		}
		#getParam(param) {
			return this.#cache.get('params')[param];
		}
		#initServices(params) {
			this.#router = new UsersRouter({
				pathToInvite: params.pathToInvite
			});
		}
		#renderInviteBtn() {
			const node = main_core.Tag.render`
			<div
				data-id="spaces-users-invite-btn"
				class="ui-btn ui-btn-success ui-btn-round ui-btn-no-caps"
			>
				${main_core.Loc.getMessage('SN_SPACES_USERS_INVITE_BTN')}
			</div>
		`;
			main_core.Event.bind(node, 'click', this.#inviteClick.bind(this));
			return node;
		}
		#inviteClick() {
			this.#router.openInvite();
		}
	}

	exports.CalendarToolbar = CalendarToolbar;
	exports.DiscussionsToolbar = DiscussionsToolbar;
	exports.FilesToolbar = FilesToolbar;
	exports.TasksToolbar = TasksToolbar;
	exports.UsersToolbar = UsersToolbar;

})(this.BX.Socialnetwork.Spaces = this.BX.Socialnetwork.Spaces || {}, BX, BX.Event, BX.UI.ShortView, BX, BX.Main, BX.UI, BX.Tasks, BX.UI.EntitySelector, BX.Tasks, BX.Calendar.Analytics, BX.Calendar, BX.Socialnetwork, BX.UI, BX.UI);
//# sourceMappingURL=script.js.map
