/* eslint-disable */
if (typeof(BX.FilterEntitySelector) === "undefined")
{
	BX.FilterEntitySelector = function ()
	{
		this._id = "";
		this._settings = {};
		this._fieldId = "";
		this._control = null;
		this._selector = null;

		this._inputKeyPressHandler = BX.delegate(this.keypress, this);
	};

	BX.FilterEntitySelector.prototype =
		{
			initialize: function (id, settings)
			{
				this._id = id;
				this._settings = settings ? settings : {};
				this._fieldId = this.getSetting("fieldId", "");

				BX.addCustomEvent(window, "BX.Main.Filter:customEntityFocus", BX.delegate(this.onCustomEntitySelectorOpen, this));
				BX.addCustomEvent(window, "BX.Main.Filter:customEntityBlur", BX.delegate(this.onCustomEntitySelectorClose, this));

			},
			getId: function ()
			{
				return this._id;
			},
			getSetting: function (name, defaultval)
			{
				return this._settings.hasOwnProperty(name) ? this._settings[name] : defaultval;
			},
			keypress: function (e)
			{
				//e.target.value
			},
			open: function (field, query)
			{
				this._selector = new BX.Tasks.Integration.Socialnetwork.NetworkSelector({
					scope: field,
					id: this.getId() + "-selector",
					mode: this.getSetting("mode"),
					query: false,
					useSearch: true,
					useAdd: false,
					parent: this,
					popupOffsetTop: 5,
					popupOffsetLeft: 40
				});
				this._selector.bindEvent("item-selected", BX.delegate(function (data)
				{
					this._control.setData(BX.util.htmlspecialcharsback(data.nameFormatted), data.id);
					if (!this.getSetting("multi"))
					{
						this._selector.close();
					}
				}, this));
				this._selector.open();
			},
			close: function ()
			{
				if (this._selector)
				{
					this._selector.close();
				}
			},
			onCustomEntitySelectorOpen: function (control)
			{
				this._control = control;

				//BX.bind(control.field, "keyup", this._inputKeyPressHandler);

				if (this._fieldId !== control.getId())
				{
					this._selector = null;
					this.close();
				}
				else
				{
					this._selector = control;
					this.open(control.field);
				}
			},
			onCustomEntitySelectorClose: function (control)
			{
				if (this._fieldId !== control.getId())
				{
					this.close();
					//BX.unbind(control.field, "keyup", this._inputKeyPressHandler);
				}
			}
		};
	BX.FilterEntitySelector.closeAll = function ()
	{
		for (var k in this.items)
		{
			if (this.items.hasOwnProperty(k))
			{
				this.items[k].close();
			}
		}
	};
	BX.FilterEntitySelector.items = {};
	BX.FilterEntitySelector.create = function(id, settings)
	{
		var self = new BX.FilterEntitySelector(id, settings);
		self.initialize(id, settings);
		this.items[self.getId()] = self;
		return self;
	};
}

if (typeof(BX.TasksGroupsSelectorInit) === "undefined")
{
	BX.TasksGroupsSelectorInit = function (settings)
	{
		var menu = null,
			selectorId = settings.selectorId,
			buttonAddId = settings.buttonAddId,
			pathTaskAdd = settings.pathTaskAdd.indexOf("?") === -1
				? settings.pathTaskAdd + "?GROUP_ID="
				: settings.pathTaskAdd + "&GROUP_ID=",
			messages = settings.messages,
			groups = settings.groups,
			currentGroup = settings.currentGroup,
			groupLimit = settings.groupLimit,
			offsetLeft = settings.offsetLeft;

		// change add-button href
		var setTaskAddHref = function(groupId)
		{
			if (BX(buttonAddId))
			{
				BX(buttonAddId).setAttribute("href", pathTaskAdd + groupId);
			}
		};

		var updateSelectorButton = function(text)
		{
			var node = BX(selectorId);
			if (!node)
			{
				return;
			}

			BX.UI.ButtonManager.createFromNode(node).setText(text);

			if (messages.TASKS_FILTER_GROUP_BTN_ARIA_LABEL)
			{
				node.setAttribute(
					"aria-label",
					messages.TASKS_FILTER_GROUP_BTN_ARIA_LABEL.replace("#NAME#", function() {
						return text;
					})
				);
			}
		};

		currentGroup.id = parseInt(currentGroup.id);

		setTaskAddHref(currentGroup.id);

		BX.bind(BX(selectorId), "click", function ()
		{
			if (menu === null)
			{
				var menuItems = [];

				var clickHandler = function (e, item)
				{
					//BX.addClass(item.layout.item, "menu-popup-item-accept");

					BX.onCustomEvent(window, 'BX.Kanban.ChangeGroup', [item.id, currentGroup.id]);
					BX.onCustomEvent(window, 'BX.Tasks.ChangeGroup', [item.id, currentGroup.id]);

					if (item.id !== currentGroup.id)
					{
						var currentMenuItems = menu.getMenuItems();
						// insert new group and remove current item or pre-last item
						menu.addMenuItem({
							id: currentGroup.id,
							text: currentGroup.text,
							onclick: BX.delegate(clickHandler, this)
						}, currentMenuItems.length > 0
							? currentMenuItems[0]["id"]
							: null);
						if (item.id !== "wo")
						{
							if (menu.getMenuItem(item.id))
							{
								menu.removeMenuItem(item.id);
							}
							else if (currentMenuItems.length >= groupLimit)
							{
								// without "select" and delimeter
								menu.removeMenuItem(currentMenuItems[currentMenuItems.length - 3].id);
							}
						}
					}
					menu.close();
					// set selected item in current
					currentGroup = {
						id: item.id,
						text: item.text
					};
					setTaskAddHref(item.id);
					updateSelectorButton(item.text);
					BX.onCustomEvent(this, "onTasksGroupSelectorChange", [currentGroup]);
				};

				// fill menu array
				for (var i = 0, c = groups.length; i < c; i++)
				{
					menuItems.push({
						id: parseInt(groups[i]["id"]),
						text: groups[i]["text"],
						class: 'menu-popup-item-none',
						onclick: BX.delegate(clickHandler, this)
					});

				}
				// select new group
				if (groups.length > 0)
				{
					menuItems.push({delimiter: true});
					/*menuItems.push({
						id: "wo",
						text: messages.TASKS_BTN_GROUP_WO,
						onclick: BX.delegate(clickHandler, this)
					});*/
					menuItems.push({
						id: "new",
						text: messages.TASKS_BTN_GROUP_SELECT,
						onclick: function (event, item)
						{
							menu.getPopupWindow().setAutoHide(false);

							var selector = new BX.Tasks.Integration.Socialnetwork.NetworkSelector({
								scope: item.getContainer(),
								id: "group-selector",
								mode: "group",
								query: false,
								useSearch: true,
								useAdd: false,
								parent: this,
								popupOffsetTop: 5,
								popupOffsetLeft: 40
							});
							selector.bindEvent("item-selected", function (data)
							{
								clickHandler(null, {
									id: data.id,
									text: data.nameFormatted.length > 50
										? data.nameFormatted.substring(0, 50) + "..."
										: data.nameFormatted
								});
								selector.close();
							});
							selector.bindEvent("close", function (data) {
								menu.getPopupWindow().setAutoHide(true);
							});
							selector.open();
						}
					});
				}
				// create menu
				if (!offsetLeft)
				{
					offsetLeft = 0;
				}
				menu = BX.PopupMenu.create(
					selectorId,
					BX(selectorId),
					menuItems,
					{
						autoHide: true,
						closeByEsc: true,
						offsetLeft: offsetLeft,
						events: {
							onShow: function()
							{
								BX(selectorId).setAttribute("aria-expanded", "true");
							},
							onClose: function()
							{
								BX(selectorId).setAttribute("aria-expanded", "false");
							}
						}
					}
				);
			}
			menu.popupWindow.show();
		});
	};
}

if (typeof(BX.Tasks.SortManager) === "undefined")
{
	BX.Tasks.SortManager = {
		setSort: function (field, dir, gridId)
		{
			dir = dir || 'asc';

			if (BX.Main.gridManager != undefined)
			{
				var grid = BX.Main.gridManager.getById(gridId).instance;
				grid.sortByColumn({sort_by: field, sort_order: dir});

				if (field === "SORTING")
				{
					grid.getRows().enableDragAndDrop()
				}
				else
				{
					grid.getRows().disableDragAndDrop();
				}
			}
			else
			{
				BX.ajax.post(
					BX.util.add_url_param("/bitrix/components/bitrix/main.ui.grid/settings.ajax.php", {
						GRID_ID: gridId,
						action: "setSort"
					}),
					{
						by: field,
						order: dir
					},
					function(res)
					{
						try
						{
							res = JSON.parse(res);

							if (!res.error)
							{
								window.location.reload();
							}
						}
						catch(err)
						{

						}
					}
				);
			}
		}
	}
}

if (typeof BX.Tasks.SprintSelector === 'undefined')
{
	BX.Tasks.SprintSelector = function(containerId, params)
	{
		if (!BX(containerId))
		{
			return;
		}

		const buttonSelector = BX.UI.ButtonManager.createFromNode(BX(containerId));

		BX.bind(
			BX(containerId),
			"click",
			function()
			{
				var sprintsSelectorDialog = new BX.UI.EntitySelector.Dialog({
					targetNode: BX(containerId),
					width: 400,
					height: 300,
					multiple: false,
					dropdownMode: true,
					enableSearch: true,
					compactView: true,
					showAvatars: false,
					cacheable: false,
					ariaLabel: params.messages.TASKS_FILTER_SPRINT_DIALOG_ARIA_LABEL,
					preselectedItems: [['sprint-selector' , params.sprintId]],
					entities: [
						{
							id: 'sprint-selector',
							options: {
								groupId: params.groupId,
								onlyCompleted: true
							},
							dynamicLoad: true,
							dynamicSearch: true
						}
					],
					events: {
						'Item:onSelect': function(event) {
							var selectedItem = event.getData().item;

							params.sprintId = selectedItem.id;

							BX.onCustomEvent(
								BX(containerId),
								'onTasksGroupSelectorChange',
								[
									{
										id: params.groupId,
										sprintId: selectedItem.id,
										name: selectedItem.customData.get('name')
									}
								]
							);

							var label = selectedItem.customData.get('label');
							buttonSelector.setText(label);
							BX(containerId).setAttribute(
								'aria-label',
								params.messages.TASKS_FILTER_SPRINT_BTN_ARIA_LABEL.replace('#RANGE#', function() {
									return label;
								})
							);
						},
					},
					popupOptions: {
						focusTrap: true,
						className: 'tasks-interface-filter-popup-adaptive',
						events: {
							onShow: function() {
								BX(containerId).setAttribute('aria-expanded', 'true');
							},
							onClose: function() {
								BX(containerId).setAttribute('aria-expanded', 'false');
							}
						}
					}
				});

				sprintsSelectorDialog.getPopup().getPopupContainer().setAttribute('aria-modal', 'true');
				sprintsSelectorDialog.show();
			}
		);
	};
}

if (typeof BX.Tasks.ProjectSelector === "undefined")
{
	BX.Tasks.ProjectSelector =
		{
			reloadProject: function(groupId)
			{
				var url = document.location.href;
				url = BX.util.add_url_param(url, {
					group_id: groupId
				});

				document.location.href = url;
			}
		}
}


this.BX = this.BX || {};
(function (exports, ui_tour, main_core, ui_buttons, main_core_events, ui_system_menu, pull_client) {
	'use strict';

	class Preset {
		static DELAY = 1000;
		#filterId;
		#filter;
		constructor(options) {
			this.#filterId = options.filterId;
			this.#init();
		}
		payAttention() {
			setTimeout(() => {
				this.guide.showNextStep();
				this.#markViewed();
			}, Preset.DELAY);
		}
		#init() {
			this.#setFilter().#setGuide();
		}
		#setFilter() {
			this.#filter = BX.Main.filterManager.getById(this.#filterId);
			return this;
		}
		#setGuide() {
			this.guide = new ui_tour.Guide({
				simpleMode: true,
				onEvents: true,
				steps: [{
					target: this.#filter.getPopupBindElement(),
					title: main_core.Loc.getMessage('TASKS_INTERFACE_FILTER_PRESETS_MOVED_TITLE'),
					text: main_core.Loc.getMessage('TASKS_INTERFACE_FILTER_PRESETS_MOVED_TEXT'),
					position: 'bottom',
					condition: {
						top: true,
						bottom: false,
						color: 'primary'
					}
				}]
			});
			this.guide.getPopup().setWidth(420);
			main_core.Dom.addClass(this.guide.getPopup().getPopupContainer(), 'tasks-interface-filter-popup-adaptive');
			return this;
		}
		#markViewed() {
			main_core.ajax.runComponentAction('bitrix:tasks.interface.filter', 'markPresetAhaMomentViewed', {
				mode: 'class',
				data: {}
			}).catch(error => {
				this.#log(error);
			});
		}
		#log(error) {
			console.log(error);
		}
	}

	const defaultRole = 'view_all';
	class Roles {
		#groupId;
		#selectedRoleId;
		#roles;
		#analytics;
		#button;
		#menu;
		constructor(params) {
			if (!params.button) {
				return;
			}
			this.#groupId = params.groupId || 0;
			this.#selectedRoleId = params.selectedRoleId || defaultRole;
			this.#roles = {
				[defaultRole]: {
					title: main_core.Loc.getMessage('TASKS_ALL_ROLES'),
					counter: params.totalCounter
				},
				...Object.fromEntries(Object.entries(params.items).map(([roleId, item]) => [roleId, {
					title: item.TEXT,
					counter: Number(item.COUNTER)
				}]))
			};
			this.#analytics = params.analytics;
			this.#initButton(params.button);
			this.#bindEvents();
		}
		#initButton(button) {
			this.#menu = new ui_system_menu.Menu({
				items: this.#menuItems,
				offsetTop: 6,
				focusTrap: true,
				ariaLabel: main_core.Loc.getMessage('TASKS_FILTER_ROLES_MENU_ARIA_LABEL'),
				events: {
					onBeforeShow: () => {
						this.#menu.getPopup().getPopupContainer().setAttribute('aria-modal', 'true');
					},
					onShow: () => this.#button.getContainer().setAttribute('aria-expanded', 'true'),
					onClose: () => this.#button.getContainer().setAttribute('aria-expanded', 'false')
				}
			});
			this.#button = ui_buttons.ButtonManager.createFromNode(button);
			this.#button.bindEvent('click', () => {
				this.#menu.show(this.#button.getContainer());
				this.#menu.getPopup()?.getFocusTrap()?.focusFirst();
				void this.#sendAnalyticsClick();
			});
		}
		#bindEvents() {
			main_core_events.EventEmitter.subscribe('BX.Main.Filter:beforeApply', this.#handleFilterBeforeApply);
			pull_client.PULL.subscribe({
				moduleId: 'tasks',
				command: 'user_counter',
				callback: this.#handlePull
			});
		}
		#handleFilterBeforeApply = event => {
			const previousRoleId = this.#selectedRoleId;
			this.#selectedRoleId = event.getData()[2].getFilterFieldsValues().ROLEID || defaultRole;
			this.#update();
			if (previousRoleId !== this.#selectedRoleId) {
				void this.#sendAnalyticsApply(this.#selectedRoleId);
			}
		};
		#handlePull = data => {
			Object.entries(data[this.#groupId] ?? this.#getEmptyCounters()).forEach(([roleId, {
				total
			}]) => {
				this.#roles[roleId].counter = total;
			});
			this.#update();
		};
		#getEmptyCounters() {
			return Object.fromEntries(Object.keys(this.#roles).map(roleId => [roleId, {
				total: 0
			}]));
		}
		#update() {
			this.#button.setText(this.#roleName);
			this.#button.setRightCounter(this.#roleCounter ? {
				value: this.#roleCounter
			} : null);
			this.#updateButtonAriaLabel();
			this.#updateMenuItems();
		}
		#updateButtonAriaLabel() {
			const container = this.#button.getContainer();
			if (this.#roleCounter) {
				container.setAttribute('aria-label', main_core.Loc.getMessage('TASKS_FILTER_ROLES_BTN_ARIA_LABEL', {
					'#ROLE#': this.#roleName,
					'#COUNT#': this.#roleCounter
				}));
			} else {
				container.removeAttribute('aria-label');
			}
		}
		#updateMenuItems() {
			const popup = this.#menu.getPopup();
			const container = popup?.getPopupContainer();
			const shouldRestoreFocus = Boolean(popup?.isShown()) && Boolean(container?.contains(document.activeElement));
			this.#menu.updateItems(this.#menuItems);
			if (shouldRestoreFocus) {
				this.#menu.getPopup()?.getFocusTrap()?.focusContainer();
			}
		}
		get #menuItems() {
			const hasCounters = Object.values(this.#roles).some(({
				counter
			}) => counter > 0);
			return Object.entries(this.#roles).map(([roleId, role]) => ({
				title: role.title,
				isSelected: roleId === this.#selectedRoleId,
				onClick: () => main_core_events.EventEmitter.emit('Tasks.TopMenu:onItem', new main_core_events.BaseEvent({
					data: [roleId],
					compatData: [roleId]
				})),
				...(hasCounters ? {
					counter: {
						value: role.counter
					}
				} : {})
			}));
		}
		get #roleName() {
			return this.#roles[this.#selectedRoleId].title;
		}
		get #roleCounter() {
			return this.#roles[defaultRole].counter;
		}
		async #sendAnalyticsClick() {
			const analytics = await this.#getAnalyticsSender();
			analytics.sendRoleClick(this.#analytics);
		}
		async #sendAnalyticsApply(role) {
			const analytics = await this.#getAnalyticsSender();
			analytics.sendRoleClickType(this.#analytics, {
				role,
				isFilterEnabled: role !== defaultRole
			});
		}
		async #getAnalyticsSender() {
			return (await main_core.Runtime.loadExtension('tasks.v2.lib.analytics')).analytics;
		}
	}

	class TasksInterfaceFilter {
		#params;
		constructor(params) {
			this.#params = params;
			this.#initAddButton();
			this.#initRoles();
			this.#showPresetTourGuide();
		}
		#initAddButton() {
			if (!this.#params.isV2Form || !this.#params.createNode) {
				return;
			}
			const button = ui_buttons.ButtonManager.createFromNode(this.#params.createNode);
			const loadCard = top.BX.Runtime.loadExtension('tasks.v2.application.task-card');
			button.getMainButton().bindEvent('click', async () => {
				const {
					TaskCard
				} = await loadCard;
				TaskCard.showCompactCard({
					groupId: this.#params.groupId,
					analytics: this.#params.analytics,
					...(this.#params.isScrum ? {
						deadlineTs: 0
					} : {})
				});
			});
		}
		#initRoles() {
			new Roles(this.#params.roles);
		}
		#showPresetTourGuide() {
			if (!this.#params.showPresetTourGuide) {
				return;
			}
			BX.Tasks.Preset.Aha = new BX.Tasks.Preset({
				filterId: this.#params.filterId
			});
			BX.Tasks.Preset.Aha.payAttention();
		}
	}

	exports.Preset = Preset;
	exports.TasksInterfaceFilter = TasksInterfaceFilter;

})(this.BX.Tasks = this.BX.Tasks || {}, BX.UI.Tour, BX, BX.UI, BX.Event, BX.UI.System, BX);


//# sourceMappingURL=script.js.map