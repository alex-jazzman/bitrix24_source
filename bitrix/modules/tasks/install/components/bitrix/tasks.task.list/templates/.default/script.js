/* eslint-disable */
BX.namespace('BX.Tasks.Grid');

BX.Tasks.GridActions = {
	gridId: null,
	groupSelector: null,
	registeredTimerNodes: {},
	expandedDeadlineTrigger: null,
	deadlineCalendarCloseBound: false,
	defaultPresetId: '',
	getTotalCountProceed: false,
	currentGroupAction: null,
	restrictions: {
		project: {
			limitExceeded: false,
			limitFeatureId: '',
		}
	},

	checkCanMove: function()
	{
		return !BX.Tasks.GridInstance || BX.Tasks.GridInstance.checkCanMove();
	},

	initPopupBalloon: function(mode, searchField, groupIdField)
	{
		this.groupSelector = null;
		this.flowSelectorDialog = null;
		this.crmSelectorDialog = null;

		BX.bind(BX(searchField + '_control'), 'click', BX.delegate(function() {
				if (mode === 'crm')
				{
					if (!this.crmSelectorDialog)
					{
						this.crmSelectorDialog = new BX.UI.EntitySelector.Dialog({
							targetNode: BX(searchField + '_control'),
							width: 350,
							height: 400,
							multiple: false,
							dropdownMode: true,
							enableSearch: true,
							context: 'tasks-list-crm-bind',
							entities: this.getCrmSelectorEntities(),
							events: {
								'Item:onBeforeSelect': (baseEvent) => {
									const item = baseEvent.getData().item;
									// getTitle() returns '' safely; item.title is null for a title-less
									// CRM element, so reading item.title.text would throw.
									BX(searchField + '_control').value =
										BX.util.htmlspecialcharsback(item.getTitle()) || '';
									BX(groupIdField + '_control').value =
										BX.Tasks.GridActions.mapCrmItemId(item.getEntityId(), item.getId());
								},
							},
						});
					}

					this.crmSelectorDialog.show();
				}
				else if (mode === 'flow')
				{
					if (!this.flowSelectorDialog)
					{
						this.flowSelectorDialog = new BX.UI.EntitySelector.Dialog({
							targetNode: BX(searchField + '_control'),
							width: 350,
							height: 400,
							multiple: false,
							dropdownMode: true,
							enableSearch: true,
							cacheable: true,
							entities: [
								{
									id: 'flow',
									options: {
										onlyActive: true,
									},
									dynamicLoad: true,
									dynamicSearch: true,
								},
							],
							events: {
								'Item:onBeforeSelect': (baseEvent) => {
									const data = baseEvent.getData();
									BX(searchField + '_control').value = BX.util.htmlspecialcharsback(data.item.title.text) || '';
									BX(groupIdField + '_control').value = data.item.id || '';
								},
								'onHide': (baseEvent) => {
									const dialog = baseEvent.getTarget();
									const targetNode = dialog.getTargetNode();
									const activeNode = document.activeElement;
									if (
										targetNode
										&& (
											activeNode === document.body
											|| dialog.getContainer().contains(activeNode)
										)
									)
									{
										targetNode.focus();
									}
								},
							},
							recentTabOptions: {
								stub: 'BX.Tasks.Flow.EmptyStub',
								stubOptions: {
									showArrow: true,
								},
							},
						});

						const footer = (new BX.Tasks.Flow.Footer(this.flowSelectorDialog));
						this.flowSelectorDialog.setFooter(footer.render());

					}

					this.flowSelectorDialog.show();
				}
				else
				{
					if (!this.groupSelector)
					{
						const targetNodeId = searchField + '_control';
						const targetControlNodeId = groupIdField + '_control';

						this.groupSelector = new BX.Tasks.GroupSelector({
							mode: mode,
							targetNodeId: targetNodeId,
							showAvatars: true,
							enableSearch: true,
							multiple: false,
							context: 'TASKS',
						});

						this.groupSelector.subscribe('itemSelected', (event) => {
							const { item } = event.getData();

							document.getElementById(targetNodeId).value = BX.util.htmlspecialcharsback(item.getTitle()) || '';
							document.getElementById(targetControlNodeId).value = item.getId() || '';
						});
					}

					this.groupSelector.show();
				}
		}, this));
	},

	setTriggerExpandedIfPresent: function(triggerNode, expanded)
	{
		if (
			triggerNode
			&& typeof triggerNode.hasAttribute === 'function'
			&& triggerNode.hasAttribute('aria-expanded')
		)
		{
			triggerNode.setAttribute('aria-expanded', expanded ? 'true' : 'false');
		}
	},

	expandDeadlineTrigger: function(triggerNode)
	{
		this.collapseDeadlineTrigger();
		this.expandedDeadlineTrigger = triggerNode;
		this.setTriggerExpandedIfPresent(triggerNode, true);
	},

	collapseDeadlineTrigger: function()
	{
		this.setTriggerExpandedIfPresent(this.expandedDeadlineTrigger, false);
		this.expandedDeadlineTrigger = null;
	},

	bindDeadlineCalendarClose: function(calendar)
	{
		if (this.deadlineCalendarCloseBound || !calendar || !calendar.popup)
		{
			return;
		}

		this.deadlineCalendarCloseBound = true;
		BX.addCustomEvent(calendar.popup, 'onPopupClose', function() {
			var triggerNode = BX.Tasks.GridActions.expandedDeadlineTrigger;
			var popupContainer = (typeof calendar.popup.getPopupContainer === 'function')
				? calendar.popup.getPopupContainer()
				: null;
			var isTriggerFocusable = (
				triggerNode
				&& document.body.contains(triggerNode)
				&& (triggerNode.offsetParent !== null || triggerNode.getClientRects().length > 0)
			);
			var activeNode = document.activeElement;
			var shouldRestoreFocus = (
				isTriggerFocusable
				&& (
					activeNode === document.body
					|| (popupContainer && popupContainer.contains(activeNode))
				)
			);

			BX.Tasks.GridActions.collapseDeadlineTrigger();

			if (shouldRestoreFocus)
			{
				triggerNode.focus();
			}
		});
	},

	onTagUpdateClick: function(taskId, groupId, event)
	{
		const onRowUpdate = (baseEvent) => {
			const id = baseEvent.getData().id;
			if (Number(id) === Number(taskId))
			{
				const row = BX.Main.gridManager.getById(this.gridId).instance.getRows().getById(id);
				dialog.setTargetNode(row.getCellById('TAG'));
			}
		};
		const onRowRemove = (baseEvent) => {
			const id = baseEvent.getData().id;
			if (Number(id) === Number(taskId))
			{
				dialog.hide();
			}
		};

		var statusSuccess = false;

		var onTagsChange = function(event) {
			const dialog = event.getTarget();
			const selectedItem = event.getData().item;
			selectedItem.setSort(1);
			dialog.getTab('all').getRootNode().addItem(selectedItem);

			if (statusSuccess)
			{
				dialog.clearSearch();
				dialog.getFooter().setSearchQuery(dialog.getTagSelectorQuery());
				BX.Tasks.GridActions.reloadRow(taskId);
				statusSuccess = false;
				return;
			}
			var tags = dialog.getSelectedItems().map(function(item) {
				return item.getTitle();
			});
			BX.Tasks.GridActions.action('setTags', taskId, { tags: tags });
		};
		var onSearch = function(event) {
			var dialog = event.getTarget();
			dialog.getFooter().setSearchQuery(event.getData().query);
		};

		var showAlert = function(className, error)
		{
			if (dialog.getContainer().querySelector(`div.${className}`))
			{
				return;
			}
			var alert = document.createElement('div');
			alert.className = className;

			var alertInner = document.createElement('div');
			alertInner.className = 'ui-alert ui-alert-xs ui-alert-danger';

			var alertMessage = document.createElement('span');
			alertMessage.className = 'ui-alert-message';
			alertMessage.textContent = error;

			alertInner.appendChild(alertMessage);
			alert.appendChild(alertInner);
			dialog.getFooterContainer().before(alert);

			if (BX.UI.Accessibility && BX.UI.Accessibility.LiveAnnouncer)
			{
				BX.UI.Accessibility.LiveAnnouncer.announce(error, 'assertive');
			}
		};

		var onCreateTag = function()
		{
				var tags = dialog.getSelectedItems().map(function(item) {
					return item.getTitle();
				});

				var newTag = dialog.getTagSelectorQuery();
				if (newTag.trim() === '')
				{
					return;
				}
				BX.ajax.runComponentAction('bitrix:tasks.task', 'setTags', {
					mode: 'class',
					data: {
						taskId: taskId,
						tags: tags,
						newTag: newTag,
					},
				}).then(function(response) {
					if (response.data.success)
					{
						statusSuccess = true;
						const item = dialog.addItem({
							id: newTag,
							entityId: 'task-tag',
							title: newTag,
							sort: 1,
							badges: [
								{
									title: response.data.owner,
								},
							],
						});

						dialog.getTab('all').getRootNode().addItem(item);
						item.select();
					}
					else
					{
						const alertClass = 'tasks-list-tag-already-exists-alert';
						showAlert(alertClass, response.data.error);
						const removeAlert = function() {
							const notification = dialog.getContainer().querySelector(`div.${alertClass}`);
							notification && notification.remove();
						};
						setTimeout(removeAlert, 2000);
					}
				});
		};

		var eventData = event.getData();

		if (BX.Tasks.GridActions.tagsAreConverting)
		{
			var message = new top.BX.UI.Dialogs.MessageBox({
				title: BX.message('TASKS_TASK_LIST_TAGS_ARE_CONVERTING_TITLE'),
				message: BX.message('TASKS_TASK_LIST_TAGS_ARE_CONVERTING_TEXT'),
				buttons: top.BX.UI.Dialogs.MessageBoxButtons.OK,
				okCaption: BX.message('TASKS_TASK_LIST_TAGS_ARE_CONVERTING_COME_BACK_LATER'),
				onOk: function(){
					message.close();
				}
			});
			message.show();
			return;
		};

		var getTargetContainer = function()
		{
			var fields = document.querySelectorAll('td.main-grid-cell.main-grid-cell-left');
			var target = eventData.button;
			fields.forEach(function(field){
				if (field.contains(target))
				{
					target = field;
				}
			});

			return target;
		};

		//widget in tasks list
		var dialog = new BX.UI.EntitySelector.Dialog({
			id: 'tasks-task-list-tag-widget',
			targetNode: getTargetContainer(),
			enableSearch: true,
			width: 350,
			height: 400,
			multiple: true,
			dropdownMode: true,
			compactView: true,
			entities: [
				{
					id: 'task-tag',
					options: {
						taskId: taskId,
						groupId: groupId,
					},
				},
			],
			searchOptions: {
				allowCreateItem: false,
			},
			footer: BX.Tasks.EntitySelector.Footer,
			footerOptions: {
				userId: BX.Tasks.GridInstance.userId,
				taskId: taskId,
				groupId: groupId,
				onCreateTag: onCreateTag,
			},
			clearUnavailableItems: true,
			events: {
				'onLoad': function() {
					dialog.getFooterContainer().style.zIndex = 1;
					BX.addCustomEvent('Tasks.Tasks.Grid:RowRemove', onRowRemove);
				}.bind(this),
				'onShow': function() {
					BX.addCustomEvent('Tasks.Tasks.Grid:RowUpdate', onRowUpdate);
					BX.Tasks.GridActions.setTriggerExpandedIfPresent(eventData.button, true);
				}.bind(this),
				'onHide': function() {
					BX.removeCustomEvent('Tasks.Tasks.Grid:RowUpdate', onRowUpdate);
					BX.removeCustomEvent('Tasks.Tasks.Grid:RowRemove', onRowRemove);
					BX.Tasks.GridActions.setTriggerExpandedIfPresent(eventData.button, false);
				}.bind(this),
				'onSearch': function(event){
					onSearch(event)
				}.bind(this),
				'Item:onSelect': function(event){
					onTagsChange(event)
				}.bind(this),
				'Item:onDeselect': function(event){
					onTagsChange(event)
				}.bind(this),
			},
		});
		dialog.show();
	},

	onProjectAddClick: function(taskId, target) {
		var dialog = new BX.UI.EntitySelector.Dialog({
			targetNode: target,
			enableSearch: true,
			context: 'TASKS_PROJECT',
			entities: [
				{
					id: 'project',
					options: {
						lockProjectLink: this.restrictions.project.limitExceeded,
						lockProjectLinkFeatureId: this.restrictions.project.limitFeatureId,
					},
				},
			],
			events: {
				'Item:onSelect': function(event) {
					var item = event.getData().item;
					BX.Tasks.GridActions.action('setGroup', taskId, { groupId: item.getId() });
					event.getTarget().hide();
				},
				'onShow': function() {
					BX.Tasks.GridActions.setTriggerExpandedIfPresent(target, true);
				},
				'onHide': function() {
					BX.Tasks.GridActions.setTriggerExpandedIfPresent(target, false);
				},
			},
		});
		dialog.show();
	},

	// Same CRM entity set as the task card CRM field (see tasks.v2 crm-dialog).
	// dynamicTypeIds mirrors the portal CRM UF settings when the card field
	// extension is on the page; otherwise the selector shows all SPA types.
	getCrmSelectorEntities: function() {
		var crmSettings = (BX.Extension && BX.Extension.getSettings)
			? BX.Extension.getSettings('tasks.v2.component.fields.crm')
			: null;
		var taskCrmSettings = (crmSettings && crmSettings.crmIntegration)
			? crmSettings.crmIntegration.task
			: null;

		// null (not []) when the card field extension is absent: the dynamic-multiple provider auto-loads
		// all smart processes only when dynamicTypeIds is missing/not an array; an empty array would be a
		// valid filter that loads nothing, hiding smart processes from the picker.
		var dynamicTypeIds = taskCrmSettings === null
			? null
			: Object.entries(taskCrmSettings)
				.filter(function([entityId, enabled]) {
					return enabled === 'Y' && entityId.indexOf('DYNAMIC_') === 0;
				})
				.map(function([entityId]) {
					return Number(entityId.slice('DYNAMIC_'.length));
				});

		return ['deal', 'contact', 'company', 'lead', 'smart_invoice', 'dynamic_multiple']
			.map(function(entityId) {
				return {
					id: entityId,
					dynamicLoad: true,
					dynamicSearch: true,
					options: {
						dynamicTypeIds: dynamicTypeIds,
						showTab: true,
						allowAllCategories: true,
					},
					dynamicSearchMatchMode: 'all',
				};
			});
	},

	// Encodes a selected entity-selector item as the DTO-01 crmItemId
	// ({ABBR}_{id}; SPA => T{hex(typeId)}_{itemId}). Mirrors tasks.v2 CrmMappers.mapId.
	mapCrmItemId: function(entityId, id) {
		var prefixMap = {
			deal: 'D',
			contact: 'C',
			company: 'CO',
			lead: 'L',
			smart_invoice: 'SI',
		};

		if (!prefixMap[entityId])
		{
			var parts = String(id).split(':');

			return 'T' + Number(parts[0]).toString(16) + '_' + parts[1];
		}

		return prefixMap[entityId] + '_' + id;
	},

	getCrmSelectedItemsFromCell: function(target) {
		var container = target.closest('.tasks-list-crm');
		if (!container)
		{
			return [];
		}

		return [].slice.call(container.querySelectorAll('[data-crm-filter-value]'))
			.map(function(chip) {
				try
				{
					var item = JSON.parse(chip.getAttribute('data-crm-filter-value') || '');

					return BX.Type.isArray(item) && item.length === 2 ? item : null;
				}
				catch (error)
				{
					return null;
				}
			})
			.filter(function(item) {
				return item !== null;
			});
	},

	onCrmBindAddClick: function(taskId, target) {
		var selectedItems = this.getCrmSelectedItemsFromCell(target);

		// cacheable:false so the dialog is destroyed on close instead of piling up in the selector's
		// instance registry; a new dialog is created for every "+" click.
		var dialog = new BX.UI.EntitySelector.Dialog({
			targetNode: target,
			enableSearch: true,
			multiple: true,
			compactView: true,
			tagSelectorOptions: {
				maxHeight: 68,
				textBoxWidth: '50%',
			},
			cacheable: false,
			context: 'tasks-list-crm-bind',
			entities: this.getCrmSelectorEntities(),
			preselectedItems: selectedItems,
			undeselectedItems: selectedItems,
			events: {
				'Item:onSelect': function(event) {
					var item = event.getData().item;
					var crmItemId = BX.Tasks.GridActions.mapCrmItemId(item.getEntityId(), item.getId());

					BX.Tasks.GridActions.bindCrmItem(taskId, crmItemId);
					event.getTarget().hide();
				},
			},
		});
		dialog.show();
	},

	bindCrmItem: function(taskId, crmItemId) {
		return BX.ajax.runAction('tasks.task.bindCrmItem', {
			data: {
				taskId: Number(taskId),
				crmItemId: crmItemId,
			},
		}).then(function() {
			BX.Tasks.GridActions.reloadRow(taskId);
		}).catch(function(response) {
			BX.UI.Notification.Center.notify({
				content: BX.message('TASKS_LIST_CRM_BIND_ERROR'),
				actions: [{
					title: BX.message('TASKS_LIST_CRM_BIND_RETRY'),
					events: {
						click: function(event, balloon) {
							balloon.close();
							BX.Tasks.GridActions.bindCrmItem(taskId, crmItemId);
						},
					},
				}],
			});

			return Promise.reject(response);
		});
	},

	toggleFilter: function(options, selected, extendable) {
		var filterManager = BX.Main.filterManager.getById(this.gridId);
		if (!filterManager)
		{
			console.log('BX.Main.filterManager not initialised');
			return;
		}

		if (selected)
		{
			this.reduceFilter(filterManager, options, extendable);
		}
		else
		{
			this.extendFilter(filterManager, options, extendable);
		}
	},

	extendFilter: function(filterManager, options, extendable) {
		if (extendable)
		{
			options = this.extendCurrentFieldsValues(filterManager, options);
		}
		filterManager.getApi().extendFilter(options);
	},

	reduceFilter: function(filterManager, options, extendable) {
		var clearFilterFields = !extendable;

		if (extendable)
		{
			options = this.reduceCurrentFieldsValues(filterManager, options);

			Object.values(options).forEach(function(values) {
				if (BX.Type.isArray(values) && values.length <= 0)
				{
					clearFilterFields = true;
				}
			});
		}

		if (!clearFilterFields)
		{
			filterManager.getApi().extendFilter(options);
			return;
		}

		var filterFields = filterManager.getFilterFields();

		Object.keys(options).forEach(function(optionKey) {
			filterFields.forEach(function(field) {
				if (field.getAttribute('data-name') === optionKey)
				{
					filterManager.getFields().deleteField(field);
				}
			});
		});

		filterManager.getSearch().apply();
	},

	extendCurrentFieldsValues: function(filterManager, options) {
		var extendedOptions = options;
		var filterFieldsValues = filterManager.getFilterFieldsValues();

		Object.entries(options).forEach(function([key, values]) {
			var currentValues = filterFieldsValues[key];

			if (BX.Type.isArray(currentValues) && BX.Type.isArray(values))
			{
				values.forEach(function(value) {
					if (!currentValues.includes(value))
					{
						currentValues.push(value);
						extendedOptions[key] = currentValues;
					}
				});
			}
		});

		return extendedOptions;
	},

	reduceCurrentFieldsValues: function(filterManager, options) {
		var reducedOptions = options;
		var filterFieldsValues = filterManager.getFilterFieldsValues();

		Object.entries(options).forEach(function([key, values]) {
			var currentValues = filterFieldsValues[key];

			if (BX.Type.isArray(currentValues) && BX.Type.isArray(values))
			{
				values.forEach(function(value) {
					if (currentValues.includes(value))
					{
						currentValues.splice(currentValues.indexOf(value), 1);
						reducedOptions[key] = currentValues;
					}
				});
			}
		});

		return reducedOptions;
	},

	filter: function(options) {
		var filterManager = BX.Main.filterManager.getById(this.gridId);
		if (!filterManager)
		{
			console.log('BX.Main.filterManager not initialised');
			return;
		}
		var fields = filterManager.getFilterFieldsValues();
		var filterApi = filterManager.getApi();

		Object.keys(options).forEach(function(key) {
			fields[key] = options[key];
		});

		filterApi.setFields(fields);
		filterApi.apply();
	},

	// Toggles the chip's element in the CRM_ITEM filter: an active chip is removed, an inactive one added.
	toggleCrmItemFilter: function(chip) {
		var value = chip.getAttribute('data-crm-filter-value');
		var label = chip.getAttribute('data-crm-filter-label');

		if (chip.classList.contains('tasks-grid-filter-active'))
		{
			this.unfilterByCrmItem(value, label);
		}
		else
		{
			this.filterByCrmItem(value, label);
		}
	},

	// crmItemId is the entity-selector filter value (e.g. '["deal","15"]'), matching what the CRM_ITEM
	// filter field stores when the element is picked in the dialog, so add/remove are symmetric.
	filterByCrmItem: function(crmItemId, crmItemLabel) {
		if (!crmItemId)
		{
			return;
		}

		var filterManager = BX.Main.filterManager.getById(this.gridId);
		if (!filterManager)
		{
			console.log('BX.Main.filterManager not initialised');
			return;
		}

		// entity_selector filter field needs the value and its label in parallel
		// arrays; without the label the chip is not rendered.
		this.extendFilter(
			filterManager,
			{
				CRM_ITEM: [crmItemId],
				CRM_ITEM_label: [crmItemLabel || crmItemId],
			},
			true,
		);
	},

	unfilterByCrmItem: function(crmItemId, crmItemLabel) {
		if (!crmItemId)
		{
			return;
		}

		var filterManager = BX.Main.filterManager.getById(this.gridId);
		if (!filterManager)
		{
			console.log('BX.Main.filterManager not initialised');
			return;
		}

		// Mirror of filterByCrmItem: drop this element's value/label from the CRM_ITEM
		// filter set. reduceFilter clears the field entirely when the last value is removed.
		this.reduceFilter(
			filterManager,
			{
				CRM_ITEM: [crmItemId],
				CRM_ITEM_label: [crmItemLabel || crmItemId],
			},
			true,
		);
	},

	// Binds a hover CRM mini-card (crm.mini-card) to each accessible CRM chip. The chip title is plain
	// text now, so the card is reachable only by hovering the chip. Chips are re-created on every grid
	// reload, so this runs on init and on Grid::updated; chips are marked to avoid double-binding.
	initCrmMiniCards: function() {
		var chips = [].slice.call(
			document.querySelectorAll('.tasks-list-crm [data-crm-mini-card-id]:not([data-crm-mini-card-bound])'),
		);
		if (!chips.length)
		{
			return;
		}

		// Mark synchronously so a concurrent init (rapid Grid::updated) never binds the same chip twice.
		chips.forEach(function(chip) {
			chip.setAttribute('data-crm-mini-card-bound', '1');
		});

		BX.Runtime.loadExtension('crm.mini-card').then(function(exports) {
			var EntityMiniCard = exports.EntityMiniCard;
			if (!EntityMiniCard)
			{
				return;
			}

			chips.forEach(function(chip) {
				var entityTypeId = parseInt(chip.getAttribute('data-crm-mini-card-type-id'), 10);
				var entityId = parseInt(chip.getAttribute('data-crm-mini-card-id'), 10);
				if (!entityTypeId || !entityId)
				{
					return;
				}

				new EntityMiniCard({
					bindElement: chip,
					entityTypeId: entityTypeId,
					entityId: entityId,
				});
			});
		});
	},

	changePin: function(taskId, groupId, event) {
		var eventData = event.getData();
		var button = eventData.button;

		if (BX.Dom.hasClass(button, BX.Grid.CellActionState.ACTIVE))
		{
			BX.Tasks.GridActions.action('unpin', taskId, { groupId: groupId });

			BX.Dom.removeClass(button, BX.Grid.CellActionState.ACTIVE);
			BX.Dom.addClass(button, BX.Grid.CellActionState.SHOW_BY_HOVER);
		}
		else
		{
			BX.Tasks.GridActions.action('pin', taskId, { groupId: groupId });

			BX.Dom.addClass(button, BX.Grid.CellActionState.ACTIVE);
			BX.Dom.removeClass(button, BX.Grid.CellActionState.SHOW_BY_HOVER);
		}
	},

	changeMute: function(taskId, event) {
		var eventData = event.getData();
		var button = eventData.button;

		if (BX.Dom.hasClass(button, BX.Grid.CellActionState.ACTIVE))
		{
			BX.Tasks.GridActions.action('unmute', taskId);

			BX.Dom.removeClass(button, BX.Grid.CellActionState.ACTIVE);
			BX.Dom.addClass(button, BX.Grid.CellActionState.SHOW_BY_HOVER);
		}
		else
		{
			BX.Tasks.GridActions.action('mute', taskId);

			BX.Dom.addClass(button, BX.Grid.CellActionState.ACTIVE);
			BX.Dom.removeClass(button, BX.Grid.CellActionState.SHOW_BY_HOVER);
		}
	},

	action: function(code, taskId, args)
	{
		switch (code)
		{
			case 'add2Timeman':
			{
				if (BX.addTaskToPlanner)
				{
					BX.addTaskToPlanner(taskId);
				}
				else if (window.top.BX.addTaskToPlanner)
				{
					window.top.BX.addTaskToPlanner(taskId);
				}

				break;
			}

			case 'copyLink':
			{
				if (BX.clipboard.copy(args.copyLink))
				{
					BX.UI.Notification.Center.notify({ content: BX.message('TASKS_LIST_ACTION_COPY_LINK_NOTIFICATION') });
				}

				break;
			}

			case 'complete':
			{
				const completion = this.prepareCompletion();

				BX.ajax.runAction(
					'bitrix:tasks.scrum.task.isScrumTask',
					{
						mode: 'class',
						data: { taskId: taskId },
					},
				).then(function(response) {
					if (response.data === true)
					{
						this.doScrumAction(code, taskId, args, completion);
					}
					else
					{
						this.doCompleteAction(taskId, undefined, completion);
					}
				}.bind(this)).catch(function(error) {
					this.notifyActionError(error);
				}.bind(this));

				break;
			}

			case 'renew':
			{
				BX.ajax.runAction(
					'bitrix:tasks.scrum.task.isScrumTask',
					{
						mode: 'class',
						data: { taskId: taskId },
					},
				).then(function(response) {
					if (response.data === true)
					{
						this.doScrumAction(code, taskId, args);
					}
					else
					{
						this.doAction(code, taskId, args);
					}
				}.bind(this)).catch(function(error) {
					this.notifyActionError(error);
				}.bind(this));

				break;
			}

			case 'unlinkSubTask':
				this.unlinkTask(taskId, args.parentId, 'subTasksService');

				break;

			case 'unlinkRelatedTask':
				this.unlinkTask(taskId, args.relatedToTaskId, 'relatedTasksService');

				break;

			case 'unlinkRelatedTemplateTask':
				this.unlinkTask(taskId, `template${args.relatedToTaskId}`, 'relatedTasksService');

				break;

			case 'unlinkGantt':
				this.unlinkTask(taskId, args.ganttParentId, 'ganttService');

				break;

			case 'take':
			{
				this.doTakeAction(taskId, args);

				break;
			}

			default:
			{
				this.doAction(code, taskId, args);

				break;
			}
		}
	},

	unlinkTask: function(taskId, relationToId, serviceName)
	{
		top.BX.Runtime.loadExtension('tasks.v2.provider.service.relation-service').then((exports) => {
			exports[serviceName].delete(relationToId, [taskId]).then(() => {
				if (!this.checkCanMove())
				{
					this.reloadRow(taskId);
				}
			}).catch((error) => {
				console.error(error);
				if (error.errors)
				{
					const content = error.errors[0].message || error.errors[0].MESSAGE;
					BX.UI.Notification.Center.notify({ content });
				}
			});
		});
	},

	doAction: function(action, taskId, args) {
		args = args || {};
		args['taskId'] = taskId;

		let component = 'bitrix:tasks.task';
		if (action === 'pin' || action === 'unpin')
		{
			component = 'bitrix:tasks.task.list';
		}

		if (action === 'ping')
		{
			BX.UI.Notification.Center.notify({ content: BX.message('TASKS_LIST_ACTION_PING_NOTIFICATION') });
		}

		return BX.ajax.runComponentAction(component, action, {
			mode: 'class',
			data: args,
		}).then(
			function(response) {
				if (action === 'complete')
				{
					this.sendAnalytics(taskId, 'task_complete');
				}

				if (action === 'delete')
				{
					BX.Tasks.Util.fireGlobalTaskEvent('DELETE', { ID: taskId });

					BX.UI.Notification.Center.notify({ content: BX.message('TASKS_DELETE_SUCCESS') });

					this.sendAnalytics(taskId, 'task_delete');
				}
				if (!this.gridId)
				{
					window.location.href = window.location.href;

					return false;
				}
				if (!this.checkCanMove())
				{
					this.reloadRow(taskId);
				}

				return true;
			}.bind(this),
		).catch(
			function(response) {
				if (response.errors)
				{
					const content = response.errors[0].message || response.errors[0].MESSAGE;
					BX.UI.Notification.Center.notify({ content: content });
				}
			}.bind(this),
		);
	},

	prepareCompletion: function()
	{
		return {
			apiClient: this.loadCompletionExtension('tasks.v2.lib.api-client'),
			prompt: this.loadCompletionExtension('tasks.v2.lib.check-list-completion-prompt'),
		};
	},

	loadCompletionExtension: function(extension)
	{
		const loading = top.BX.Runtime.loadExtension(extension);
		// the action may end before the extension is awaited, so a failure must not stay unhandled
		loading.catch(function() {
			return null;
		});

		return loading;
	},

	completeWithPrompt: function(prompt, taskId, complete, beforeComplete)
	{
		return prompt.then(function(extension) {
			return extension.checkListCompletionPromptRunner.runForTask(taskId, {
				complete: () => complete(true),
				completeWithChecklist: () => complete(true),
			}, {
				beforeComplete: beforeComplete,
			}).then(function(result) {
				return {
					success: result.state === extension.CompletionStates.Success,
					error: result.state === extension.CompletionStates.Failed ? result.error : null,
				};
			});
		});
	},

	completeWithoutPrompt: function(complete, beforeComplete)
	{
		return Promise.resolve(beforeComplete ? beforeComplete() : true).then(function(confirmed) {
			if (!confirmed)
			{
				return { success: false, error: null };
			}

			return complete(true).then(function(error) {
				return { success: !error, error: error };
			});
		});
	},

	doCompleteAction: function(taskId, beforeComplete, completion)
	{
		const context = completion || this.prepareCompletion();
		const complete = function(completeWithChecklist) {
			return context.apiClient.then(function(extension) {
				return extension.apiClient.post('Task.Status.complete', {
					task: { id: taskId },
					completeWithChecklist: completeWithChecklist,
				});
			}).then(
				function(response) {
					if (response?.errors?.length > 0)
					{
						return this.normalizeActionError(response);
					}

					return null;
				}.bind(this),
				function(error) {
					return this.normalizeActionError(error);
				}.bind(this),
			);
		}.bind(this);

		const completed = context.prompt
			? this.completeWithPrompt(context.prompt, taskId, complete, beforeComplete)
			: this.completeWithoutPrompt(complete, beforeComplete)
		;

		return completed.then(function(result) {
			if (!result.success)
			{
				if (result.error)
				{
					this.notifyActionError(result.error);
				}

				return false;
			}

			this.sendAnalytics(taskId, 'task_complete');
			if (!this.gridId)
			{
				window.location.reload();

				return false;
			}
			if (!this.checkCanMove())
			{
				this.reloadRow(taskId);
			}

			return true;
		}.bind(this)).catch(function(error) {
			this.notifyActionError(error);

			return false;
		}.bind(this));
	},

	normalizeActionError: function(error)
	{
		if (error instanceof Error)
		{
			return error;
		}

		const message = error?.errors?.[0]?.message || error?.errors?.[0]?.MESSAGE || String(error);

		return new Error(message);
	},

	notifyActionError: function(error)
	{
		const normalizedError = this.normalizeActionError(error);
		BX.UI.Notification.Center.notify({ content: normalizedError.message });
	},

	doTakeAction: function(taskId, args)
	{
		if (!args.allowTimeTracking)
		{
			this.doAction('TAKE', taskId, args);

			return;
		}

		BX.ajax.runComponentAction('bitrix:tasks.task', 'getTaskFromTimer', {
			mode: 'class',
			data: {},
		}).then(
			(response) => {
				const data = response.data;

				if (!data.id)
				{
					this.doAction('TAKE', taskId, args);

					return;
				}

				let body = BX.Loc.getMessage('TASKS_TASK_CONFIRM_START_TIMER');
				body = body.replace('{{TITLE}}', BX.type.isNotEmptyString(data.title)
					? BX.util.htmlspecialchars(data.title)
					: BX.Loc.getMessage('TASKS_UNKNOWN'));

				BX.Tasks.confirm(body, BX.delegate(function(result) {
					if (result)
					{
						this.doAction('TAKE', taskId, args);
					}
				}, this), { title: BX.Loc.getMessage('TASKS_TASK_CONFIRM_START_TIMER_TITLE') });
			},
		);
	},

	doScrumAction(action, taskId, args, completion)
	{
		let taskStatus = null;
		let isParentScrumTask = false;

		return Promise.resolve(top.BX.loadExt('tasks.scrum.task-status'))
		.then(function() {
			if (
				!BX.type.isUndefined(top.BX.Tasks.Scrum)
				&& !BX.type.isUndefined(top.BX.Tasks.Scrum.TaskStatus)
			)
			{
				taskStatus = new top.BX.Tasks.Scrum.TaskStatus({
					taskId: taskId,
					action: action,
					performActionOnParentTask: true,
				});
				return taskStatus.updateState()
				.then(function() {
					return taskStatus.isParentScrumTask()
					.then(function(result) {
						isParentScrumTask = result;
					}.bind(this))
					;
				}.bind(this))
				;
			}

			return null;
		}.bind(this))
		.then(function() {
			const beforeComplete = (
				action === 'complete'
				&& taskStatus
				&& !isParentScrumTask
			)
				? () => taskStatus.showDodConfirmation(taskId)
				: undefined
			;
			const actionPromise = action === 'complete'
				? this.doCompleteAction(taskId, beforeComplete, completion)
				: this.doAction(action, taskId, args)
			;

			return actionPromise.then(function(success) {
				if (success !== false && taskStatus && isParentScrumTask)
				{
					taskStatus.update();
				}

				return success;
			}.bind(this))
			;
		}.bind(this))
		.catch(function(error) {
			this.notifyActionError(error);

			return false;
		}.bind(this));
	},

	getTotalCount: function(prefix, userId, groupId, parameters)
	{
		if (this.getTotalCountProceed)
		{
			return;
		}
		this.getTotalCountProceed = true;

		var container = document.getElementById(prefix + '_row_count_wrapper');
		var countButton = container.querySelector('.tasks-list-row-count-link');
		var restoreFocus = !!(countButton && document.activeElement === countButton);

		this.showCountLoader(container);

		if (restoreFocus)
		{
			this.focusCountWrapper(container);
		}

		BX.ajax.runComponentAction('bitrix:tasks.task.list', 'getTotalCount', {
			mode: 'class',
			data: {
				userId: userId,
				groupId: groupId,
				parameters: JSON.stringify(parameters),
			},
		}).then(
			function(response) {
				this.hideCountLoader(container);
				if (response.data)
				{
					response.data = (typeof response.data == 'number') ? response.data : 0;
					var button = container.querySelector('.tasks-list-row-count-link');
					if (button)
					{
						button.remove();
					}
					container.append(response.data);

					if (restoreFocus)
					{
						var activeNode = document.activeElement;
						if (activeNode === container || activeNode === document.body)
						{
							this.focusCountWrapper(container);
						}
						this.announceTotalCount(container);
					}
				}
				this.getTotalCountProceed = false;
			}.bind(this),
		).catch(
			function(response) {
				if (response.errors)
				{
					BX.Tasks.alert(response.errors);
				}
				this.getTotalCountProceed = false;
			}.bind(this),
		);
	},

	showCountLoader: function(container) {
		var button = container.querySelector('.tasks-list-row-count-link');
		if (button)
		{
			button.style.display = 'none';
		}

		var loader = container.querySelector('.tasks-circle-loader-circular');
		if (loader)
		{
			loader.style.display = 'inline';
		}
	},

	hideCountLoader: function(container) {
		var loader = container.querySelector('.tasks-circle-loader-circular');
		if (loader)
		{
			loader.style.display = 'none';
		}
	},

	focusCountWrapper: function(container) {
		if (!container)
		{
			return;
		}
		if (!container.hasAttribute('tabindex'))
		{
			container.setAttribute('tabindex', '-1');
		}
		container.focus();
	},

	announceTotalCount: function(container) {
		if (!container || !(BX.UI.Accessibility && BX.UI.Accessibility.LiveAnnouncer))
		{
			return;
		}

		var text = container.textContent.replace(/\s+/g, ' ').trim();
		if (text !== '')
		{
			BX.UI.Accessibility.LiveAnnouncer.announce(text);
		}
	},

	reloadRow: function(taskId) {
		var grid = BX.Main.gridManager.getById(this.gridId);
		if (grid && grid.hasOwnProperty('instance'))
		{
			var gridInstance = BX.Tasks.GridInstance;
			var focusDescriptor = null;
			if (gridInstance && gridInstance.isRowExist(taskId))
			{
				focusDescriptor = gridInstance.captureRowFocus(gridInstance.getRowNodeById(taskId));
			}

			grid.instance.updateRow(taskId.toString(), null, null, ({ id }) => {
				if (gridInstance && gridInstance.isRowExist(id) && gridInstance.isFocusLost())
				{
					gridInstance.restoreRowFocus(id, focusDescriptor);
				}

				BX.onCustomEvent('Tasks.Tasks.Grid:RowUpdate', { id });
			});
		}
	},

	reloadGrid: function() {
		if (
			BX.SidePanel
			&& BX.SidePanel.Instance
			&& BX.SidePanel.Instance.getLastOpenSlider()
		)
		{
			BX.SidePanel.Instance.destroy(BX.SidePanel.Instance.getLastOpenSlider().getUrl());
		}

		var filterManager = BX.Main.filterManager.getById(this.gridId);
		if (!filterManager)
		{
			console.log('BX.Main.filterManager not initialised');
			return;
		}
		filterManager.getSearch().apply();
	},

	setCurrentGroupAction: function(groupAction) {
		this.currentGroupAction = groupAction;
	},

	processBeforeGroupActionSent: function() {
		if (this.currentGroupAction === 'ping')
		{
			BX.UI.Notification.Center.notify({ content: BX.message('TASKS_LIST_GROUP_ACTION_PING_NOTIFICATION') });
		}
		this.currentGroupAction = null;
	},

	confirmGroupAction: function(gridId) {
		const gridActions = BX.Main.gridManager.getById(gridId).instance.getActionsPanel().getValues();
		const actionKey = BX.Main.gridManager.getById(gridId).instance.getActionKey();
		const action = gridActions[actionKey];

		const data = this.preparationDataGroupAction(gridId, action);

		if (!action.includes("none") && (data.forAll !== 'N' || data.selectedIds.length))
		{
			data.ownerId = this.ownerId;
			const groupActions = new BX.Tasks.GroupActionsStepper({
				action,
				data,
				requestStopFunction() {
					BX.Tasks.GridActions.processBeforeGroupActionSent();
					BX.Tasks.GridActions.reloadGrid();
				},
			});
			groupActions.showDialog();
		}
	},

	preparationDataGroupAction(gridId, action) {
		const selectedIds = BX.Main.gridManager.getById(gridId).instance.getRows().getSelectedIds();
		const gridActions = BX.Main.gridManager.getById(gridId).instance.getActionsPanel().getValues();
		const data = {
			forAll: gridActions[`action_all_rows_${gridId}`] ? 'Y' : 'N',
			selectedIds,
			groupId: Number(this.groupId),
		};

		if (action === 'setdeadline')
		{
			data.setDeadline = gridActions.ACTION_SET_DEADLINE_from;
		}

		if (action === 'adjustdeadline' || action === 'substractdeadline')
		{
			data.num = Number(gridActions.num);
			data.type = gridActions.type;
		}

		if (action === 'settaskcontrol')
		{
			data.taskControlState = gridActions.value;
		}

		if (action === 'setresponsible')
		{
			data.responsibleId = Number(gridActions.responsibleId);
		}

		if (action === 'setoriginator')
		{
			data.originatorId = Number(gridActions.originatorId);
		}

		if (action === 'addauditor')
		{
			data.auditorId = Number(gridActions.auditorId);
		}

		if (action === 'addaccomplice')
		{
			data.accompliceId = Number(gridActions.accompliceId);
		}

		if (action === 'setgroup' || action === 'setcollab')
		{
			data.specifyGroupId = Number(gridActions.groupId);
		}

		if (action === 'setflow')
		{
			data.flowId = Number(gridActions.flowId);
		}

		if (action === 'bindcrm')
		{
			data.crmItemId = gridActions.crmItemId;
		}

		return data;
	},

	onDeadlineChangeClick: function(taskId, node, curDeadline, event) {
		curDeadline = curDeadline || (new Date).getDate();
		node = node || event.getData().button;

		this.expandDeadlineTrigger(node);

		var wasTriggerFocused = (document.activeElement === node);

		var calendar = BX.calendar({
			node: node,
			value: curDeadline,
			form: '',
			bTime: true,
			currentTime: Math.round((new Date()) / 1000) - (new Date()).getTimezoneOffset() * 60,
			bHideTimebar: true,
			bCompatibility: true,
			bCategoryTimeVisibilityOption: 'tasks.bx.calendar.deadline',
			bTimeVisibility: (BX.Tasks.GridInstance ?
				(BX.Tasks.GridInstance.calendarSettings.deadlineTimeVisibility === 'Y') : false),
			callback_after: (function(node, taskId) {
				return function(value) {
					var currentTime = new Date();
					if (value.getTime() > currentTime.getTime())
					{
						BX.onCustomEvent('Tasks.Tour.ExpiredTasksDeadlineChange:saveDeadline', []);
					}

					var path = BX.CJSTask.ajaxUrl;
					BX.CJSTask.ajaxUrl = BX.CJSTask.ajaxUrl + '&_CODE=CHANGE_DEADLINE&viewType=VIEW_MODE_LIST';
					BX.CJSTask.batchOperations(
						[
							{
								operation: 'CTaskItem::update()',
								taskData: {
									ID: taskId,
									DEADLINE: BX.calendar.ValueToString(value, true),
								},
							},
						],
						{
							callbackOnSuccess: (function(taskId) {
								return function(reply) {
									if (!BX.Tasks.GridActions.checkCanMove())
									{
										BX.Tasks.GridActions.reloadRow(taskId);
									}
								};
							})(taskId),
							callbackOnFailure: (response) => {
								const data = response.rawReply;
								if (data.message)
								{
									BX.loadExt('ui.notification').then(() => {
										BX.UI.Notification.Center.notify({ content: data.message });
									});
								}
							},
						},
					);
					BX.CJSTask.ajaxUrl = path;
				};
			})(node, taskId),
		});

		if (wasTriggerFocused)
		{
			node.focus();
		}

		this.bindDeadlineCalendarClose(calendar);

		var guide = BX.Tasks.TourGuideController.getGuide();
		if (guide && guide.setCalendarPopup && guide.isCorrectRow(taskId) && !guide.getIsStopped())
		{
			guide.setCalendarPopup(calendar.popup);
		}
	},

	onMarkChangeClick: function(taskId, bindElement, currentValues) {
		BX.TaskGradePopup.show(
			taskId,
			bindElement,
			currentValues,
			{
				events: {
					onPopupClose: this.__onGradePopupClose,
					onPopupChange: this.__onGradePopupChange,
				},
			},
		);
		BX.addClass(bindElement, 'task-grade-and-report-selected');
		this.setTriggerExpandedIfPresent(bindElement, true);

		return false;
	},

	__onGradePopupClose: function() {
		BX.removeClass(this.bindElement, 'task-grade-and-report-selected');
		BX.Tasks.GridActions.setTriggerExpandedIfPresent(this.bindElement, false);
	},

	__onGradePopupChange: function() {
		this.bindElement.className = 'task-grade-and-report tasks-grid-control'
			+ (this.listValue !== 'NULL' ? ' task-grade-' + this.listItem.className : '')
			+ (this.report ? ' task-in-report' : '');
		var accessibleName = BX.message('TASKS_MARK') + ': ' + this.listItem.name;
		this.bindElement.title = accessibleName;
		this.bindElement.setAttribute('aria-label', accessibleName);

		BX.Tasks.GridActions.action('legacyUpdate', this.id, {
			data: {
				MARK: (this.listValue === 'NULL' ? '' : this.listValue),
			},
		});
	},

	__getTimerState: function(timeSpentInLogs, timeEstimate, isRunning, taskTimersTotalValue, canStartTimeTracking) {
		var className = 'task-timer-inner';
		var timeSpent = timeSpentInLogs + taskTimersTotalValue;
		var ariaLabel;
		var interactive;

		if (isRunning)
		{
			className = className + ' task-timer-play';
			ariaLabel = BX.message('TASKS_TIMER_STOP');
			interactive = true;
		}
		else if (canStartTimeTracking)
		{
			className = className + ' task-timer-pause';
			ariaLabel = BX.message('TASKS_TIMER_START');
			interactive = true;
		}
		else
		{
			className = className + ' task-timer-clock';
			ariaLabel = BX.message('TASKS_TIMER_TRACKING');
			interactive = false;
		}

		if (timeEstimate > 0 && timeSpent > timeEstimate)
		{
			className = className + ' task-timer-overdue';
		}

		return {
			className: className,
			ariaLabel: ariaLabel,
			text: BX.Tasks.GridActions.renderTimerTimes(timeSpent, timeEstimate, isRunning),
			interactive: interactive,
		};
	},

	__updateTimerNode: function(taskId, timerState) {
		var innerTimerBlock = BX('task-timer-block-inner-' + taskId);
		if (innerTimerBlock)
		{
			innerTimerBlock.className = timerState.className;
		}

		var outerTimerBlock = BX('task-timer-block-' + taskId);
		if (outerTimerBlock)
		{
			outerTimerBlock.setAttribute('aria-label', timerState.ariaLabel);
		}

		var valueBlock = BX('task-timer-block-value-' + taskId);
		if (valueBlock)
		{
			valueBlock.textContent = timerState.text;
		}
	},

	__replaceTimerNode: function(currentNode, newNode) {
		var keepFocus = currentNode.contains(document.activeElement);

		currentNode.parentNode.replaceChild(newNode, currentNode);

		if (keepFocus)
		{
			if (newNode.tagName !== 'BUTTON')
			{
				newNode.setAttribute('tabindex', '-1');
			}

			newNode.focus();
		}
	},

	renderTimerItem: function(taskId, timeSpentInLogs, timeEstimate, isRunning, taskTimersTotalValue, canStartTimeTracking) {
		canStartTimeTracking = canStartTimeTracking || false;

		var timerState = BX.Tasks.GridActions.__getTimerState(
			timeSpentInLogs,
			timeEstimate,
			isRunning,
			taskTimersTotalValue,
			canStartTimeTracking,
		);

		var innerBlock = BX.create('span', {
			props: {
				id: 'task-timer-block-inner-' + taskId,
				className: timerState.className,
			},
			children: [
				BX.create('span', {
					props: {
						className: 'task-timer-icon',
					},
				}),
				BX.create('span', {
					props: {
						id: 'task-timer-block-value-' + taskId,
						className: 'task-timer-time',
					},
					text: timerState.text,
				}),
			],
		});

		if (!timerState.interactive)
		{
			return BX.create('span', {
				props: {
					id: 'task-timer-block-' + taskId,
					className: 'task-timer-block',
				},
				attrs: {
					role: 'timer',
					'aria-label': timerState.ariaLabel,
				},
				children: [innerBlock],
			});
		}

		return BX.create('button', {
			props: {
				id: 'task-timer-block-' + taskId,
				className: 'task-timer-block',
			},
			attrs: {
				type: 'button',
				'aria-label': timerState.ariaLabel,
			},
			events: {
				click: function() {
					var innerTimerBlock = BX('task-timer-block-inner-' + taskId);
					if (BX.hasClass(innerTimerBlock, 'task-timer-play'))
					{
						BX.Tasks.GridInstance.stopTimerPull();
						BX.TasksTimerManager.stop(taskId);
					}
					else if (BX.hasClass(innerTimerBlock, 'task-timer-pause'))
					{
						BX.Tasks.GridInstance.stopTimerPull();
						BX.TasksTimerManager.start(taskId);
					}
				},
			},
			children: [innerBlock],
		});
	},

	renderTimerTimes: function(timeSpent, timeEstimate, isRunning) {
		var str = '';
		var showSeconds = !!isRunning;

		str = BX.Tasks.GridActions.renderSecondsToHHMMSS(timeSpent, showSeconds);

		if (timeEstimate > 0)
		{
			str = str + ' / ' + BX.Tasks.GridActions.renderSecondsToHHMMSS(timeEstimate, false);
		}

		return str;
	},

	renderSecondsToHHMMSS: function(totalSeconds, showSeconds) {
		var pad = '00';
		var hours = '';
		var minutes = '';
		var seconds = 0;

		if (totalSeconds > 0)
		{
			hours += Math.floor(totalSeconds / 3600);
			minutes += Math.floor(totalSeconds / 60) % 60;
		}
		else
		{
			hours += Math.ceil(totalSeconds / 3600);
			minutes += Math.ceil(totalSeconds / 60) % 60;
		}

		var result = pad.substring(0, 2 - hours.length) + hours + ':' + pad.substring(0, 2 - minutes.length) + minutes;

		if (showSeconds)
		{
			seconds = '' + totalSeconds % 60;
			result = result + ':' + pad.substring(0, 2 - seconds.length) + seconds;
		}

		return result;
	},

	redrawTimerNode: function(taskId, timeSpentInLogs, timeEstimate, isRunning, taskTimersTotalValue, canStartTimeTracking) {
		var taskTimerBlock = BX('task-timer-block-' + taskId);

		if (taskTimerBlock)
		{
			var timerState = BX.Tasks.GridActions.__getTimerState(
				timeSpentInLogs,
				timeEstimate,
				isRunning,
				taskTimersTotalValue,
				canStartTimeTracking,
			);

			if (timerState.interactive === (taskTimerBlock.tagName === 'BUTTON'))
			{
				BX.Tasks.GridActions.__updateTimerNode(taskId, timerState);
			}
			else
			{
				BX.Tasks.GridActions.__replaceTimerNode(
					taskTimerBlock,
					BX.Tasks.GridActions.renderTimerItem(
						taskId,
						timeSpentInLogs,
						timeEstimate,
						isRunning,
						taskTimersTotalValue,
						canStartTimeTracking,
					),
				);
			}
		}
		else
		{
			var container = BX('task-timer-block-container-' + taskId);
			if (container)
			{
				var newTaskTimerBlock = BX.Tasks.GridActions.renderTimerItem(
					taskId,
					timeSpentInLogs,
					timeEstimate,
					isRunning,
					taskTimersTotalValue,
					canStartTimeTracking,
				);

				// Unregister callback function for this item (if it exists)
				if (this.registeredTimerNodes[taskId])
				{
					BX.removeCustomEvent(window, 'onTaskTimerChange', this.registeredTimerNodes[taskId]);
				}

				container.appendChild(newTaskTimerBlock);

				// If row inserted into DOM -> register callback function
				if (BX('task-timer-block-' + taskId))
				{
					this.registeredTimerNodes[taskId] = this.__getTimerChangeCallback(taskId);
					BX.addCustomEvent(window, 'onTaskTimerChange', this.registeredTimerNodes[taskId]);
				}
			}
		}
	},

	removeTimerNode: function(taskId) {
		if (this.registeredTimerNodes[taskId])
		{
			BX.removeCustomEvent(window, 'onTaskTimerChange', this.registeredTimerNodes[taskId]);
		}

		var taskTimerBlock = BX('task-timer-block-' + taskId);
		if (taskTimerBlock)
		{
			taskTimerBlock.parentNode.removeChild(taskTimerBlock);
		}
	},

	__getTimerChangeCallback: function(selfTaskId) {
		var state = null;

		return function(params) {
			var switchStateTo = null;
			var innerTimerBlock = null;

			if (params.action === 'refresh_daemon_event')
			{
				if (Number(params.taskId) !== Number(selfTaskId))
				{
					if (state === 'paused')
					{
						return;
					}
					switchStateTo = 'paused';
				}
				else
				{
					if (state !== 'playing')
					{
						switchStateTo = 'playing';
					}

					BX.Tasks.GridActions.redrawTimerNode(
						params.taskId,
						params.data.TASK.TIME_SPENT_IN_LOGS,
						params.data.TASK.TIME_ESTIMATE,
						true,	// IS_TASK_TRACKING_NOW
						params.data.TIMER.RUN_TIME,
						true,
					);
				}
			}
			else if (params.action === 'start_timer')
			{
				if (
					Number(selfTaskId) === Number(params.taskId)
					&& params.timerData
					&& Number(selfTaskId) === Number(params.timerData.TASK_ID)
				)
				{
					switchStateTo = 'playing';
				}
				else
				{
					switchStateTo = 'paused'; // other task timer started, so we need to be paused
				}
			}
			else if (params.action === 'stop_timer')
			{
				if (Number(selfTaskId) == Number(params.taskId))
				{
					switchStateTo = 'paused';
				}
			}
			else if (params.action === 'init_timer_data')
			{
				if (params.data.TIMER)
				{
					if (Number(params.data.TIMER.TASK_ID) === Number(selfTaskId))
					{
						switchStateTo = (params.data.TIMER.TIMER_STARTED_AT > 0 ? 'playing' : 'paused');
					}
					else if (params.data.TIMER.TASK_ID > 0)
					{
						// our task is not playing now
						switchStateTo = 'paused';
					}
				}
			}

			if (switchStateTo !== null)
			{
				innerTimerBlock = BX('task-timer-block-inner-' + selfTaskId);
				if (innerTimerBlock && !BX.hasClass(innerTimerBlock, 'task-timer-clock'))
				{
					var outerTimerBlock = BX('task-timer-block-' + selfTaskId);

					if (switchStateTo === 'paused')
					{
						BX.removeClass(innerTimerBlock, 'task-timer-play');
						BX.addClass(innerTimerBlock, 'task-timer-pause');
						if (outerTimerBlock)
						{
							outerTimerBlock.setAttribute('aria-label', BX.message('TASKS_TIMER_START'));
						}
						const valueBlock = BX('task-timer-block-value-' + selfTaskId);
						if (valueBlock && valueBlock.textContent)
						{
							const parts = valueBlock.textContent.trim().split(' / ');
							parts[0] = parts[0].replace(/^(\d+:\d+):\d+$/, '$1');
							valueBlock.textContent = parts.join(' / ');
						}
					}
					else if (switchStateTo === 'playing')
					{
						BX.removeClass(innerTimerBlock, 'task-timer-pause');
						BX.addClass(innerTimerBlock, 'task-timer-play');
						if (outerTimerBlock)
						{
							outerTimerBlock.setAttribute('aria-label', BX.message('TASKS_TIMER_STOP'));
						}
					}
				}

				state = switchStateTo;
			}
		};
	},

	getAnalyticsSection: function ()
	{
		let section = 'tasks';

		if (BX.Tasks.GridInstance)
		{
			const isCollab = BX.Tasks.GridInstance.arParams['CONTEXT'] === 'collab';

			if (isCollab)
			{
				section = 'collab';
			}
			else if (BX.Tasks.GridInstance.groupId)
			{
				section = 'project';
			}
		}

		return section;
	},

	sendAnalytics: function (taskId, event)
	{
		const analyticsData = {
			tool: 'tasks',
			category: 'task_operations',
			type: 'task',
			c_section: this.getAnalyticsSection(),
			c_element: 'context_menu',
			c_sub_section: 'list',
			p1: `taskId_${taskId}`,
			event,
		};

		if (BX.UI.Analytics)
		{
			BX.UI.Analytics.sendData(analyticsData);

			return;
		}

		BX.Runtime.loadExtension('ui.analytics').then(() => {
			BX.UI.Analytics.sendData(analyticsData);
		});
	},

	// SC-005 events 1-2: the deadlineless hint is a notification, not a card banner —
	// type=notification, no c_element, c_sub_section=list. Values are literals kept in sync
	// with the tasks.v2.const dictionary (no ES import in this legacy plain-JS bundle).
	// ui.analytics is loaded lazily via the loadExtension fallback below. The CTA opens the
	// local BX.calendar without unloading the page, so the promise resolves and the event is
	// delivered.
	sendDeadlinelessHintAnalytics: function (event)
	{
		const analyticsData = {
			tool: 'tasks',
			category: 'task_operations',
			event: event,
			type: 'notification',
			c_section: this.getAnalyticsSection(),
			c_sub_section: 'list',
		};

		if (BX.UI.Analytics)
		{
			BX.UI.Analytics.sendData(analyticsData);

			return;
		}

		BX.Runtime.loadExtension('ui.analytics').then(() => {
			BX.UI.Analytics.sendData(analyticsData);
		});
	},

	onStageSwitch: function(taskId, stageId, color)
	{
		const row = BX.Main.gridManager.getById(this.gridId).instance.getRows().getById(taskId);
		const stageIdCell = row.getCellById('STAGE_ID');

		if (!stageIdCell)
		{
			return;
		}

		const stagesContainer = stageIdCell.querySelector('.tasks-grid-stage-container');
		if (!stagesContainer)
		{
			return;
		}

		if (this.isCurrentStageSelected(stagesContainer, stageId))
		{
			return;
		}

		let applyCurrent = true;
		let title = '';
		for (const stageElement of stagesContainer.children)
		{
			const stageElementId = parseInt(stageElement.dataset.stageId);

			if (applyCurrent)
			{
				stageElement.style.backgroundColor = color;
			}
			else
			{
				stageElement.style.backgroundColor = '';
			}

			stageElement.dataset.selected = 'N';
			stageElement.removeAttribute('aria-current');

			if (stageElementId === parseInt(stageId))
			{
				applyCurrent = false;
				title = stageElement.title;
				stageElement.dataset.selected = 'Y';
				stageElement.setAttribute('aria-current', 'step');
			}
		}

		if (title !== '')
		{
			const titleElement = stageIdCell.querySelector('.tasks-grid-stage-title');

			if (titleElement)
			{
				titleElement.innerHTML = title;
			}
		}

		this.saveStage(taskId, stageId);
	},

	isCurrentStageSelected: function(stagesContainer, stageId)
	{
		for (const stageElement of stagesContainer.children)
		{
			const selected = stageElement.dataset.selected;
			const currentStageId = parseInt(stageElement.dataset.stageId);

			if (currentStageId === stageId && selected === 'Y')
			{
				return true;
			}
		}

		return false;
	},

	saveStage: function(taskId, stageId)
	{
		return BX.ajax.runComponentAction('bitrix:tasks.task', 'moveStage', {
			mode: 'class',
			data: {
				taskId,
				stageId
			}
		}).then((response) => {
			if (response && response.errors && response.errors.length === 0)
			{
				BX.Tasks.Util.fireGlobalTaskEvent(
					"UPDATE_STAGE",
					{ID: taskId, STAGE_ID: stageId},
					{STAY_AT_PAGE: true},
					{id: taskId}
				);
			}
		})
	}
};

BX(function() {
	'use strict';

	// SC-005: shared registry — at most one deadlineless hint popup is open at a time.
	var activeDeadlinelessHintRow = null;

	BX.Tasks.Grid = function(options) {
		this.grid = BX.Main.gridManager.getInstanceById(options.gridId);

		this.userId = Number(options.userId);
		this.ownerId = Number(options.ownerId);
		this.groupId = Number(options.groupId);
		this.lastGroupId = Number(options.lastGroupId);

		this.sorting = options.sorting;
		this.groupByGroups = (options.groupByGroups === 'true');
		this.groupBySubTasks = (options.groupBySubTasks === 'true');
		this.arParams = options.arParams;
		this.migrationBarOptions = options.migrationBarOptions;

		this.isV2Form = (options.isV2Form === 'true');

		// SC-005: current viewer id (distinct from this.userId semantics) and new-user segment flag
		this.currentUserId = Number(options.currentUserId);
		this.isNewUser = (options.isNewUser === true);

		this.calendarSettings = (options.calendarSettings ? options.calendarSettings : {});

		this.taskList = new Map();
		this.comments = new Map();

		this.actions = {
			taskAdd: 'taskAdd',
			taskUpdate: 'taskUpdate',
			taskRemove: 'taskRemove',
			commentAdd: 'commentAdd',
			pinChanged: 'pinChanged',
		};
		this.classes = {
			highlighted: 'task-list-item-highlighted',
			pinned: 'tasks-list-item-pinned',
		};

		this.isMyList = this.userId === this.ownerId;
		this.canPin = this.isMyList;
		this.skipTimerPush = false;

		this.updateCanMove();
		this.init(options);
	};

	BX.Tasks.Grid.prototype = {
		init: function(options) {
			this.subscribeToPull();
			this.bindEvents();
			this.fillTaskListItems(options.taskList);
			this.colorPinnedRows();
			this.applyDeadlinelessHints();
			this.showStub();
			this.clearAnalyticsParams();
			this.initHints();
			BX.Tasks.GridActions.initCrmMiniCards();

			if (options.arParams && options.arParams['LAZY_LOAD'])
			{
				this.grid.reload();
			}
		},

		initHints: function() {
			if (BX.UI && BX.UI.Hint)
			{
				// Cache the hint manager on the instance: initHints() runs on init AND on every
				// BX.Main.grid:paramsUpdated (sort/filter/row reload). Each createInstance() makes a
				// new manager that binds a document listener on its first init(), so recreating it
				// per update leaked listeners. Reuse one manager and just re-init() the grid nodes.
				if (!this.hintTooltip)
				{
					this.hintTooltip = BX.UI.Hint.createInstance({
						popupParameters: {
							className: 'tasks-hint-popup',
							darkMode: false,
							offsetTop: 2,
							background: 'var(--ui-color-bg-content-inapp)',
							padding: 6,
							angle: true,
							targetContainer: document.body,
							events: {
								onPopupShow: (popup) => {
									popup.setOffset({
										offsetLeft: popup.bindElement.getBoundingClientRect()?.width / 2 ?? 0,
									});
								}
							}
						},
						attributeName: 'data-tasks-hint',
					});
				}
				this.hintTooltip.init(this.grid.getContainer());
			}
		},

		clearAnalyticsParams()
		{
			const uri = new BX.Uri(window.location.href);

			uri.removeQueryParam('ta_cat', 'ta_sec', 'ta_sub', 'ta_el', 'p1', 'p2', 'p3', 'p4', 'p5');

			window.history.replaceState(null, null, uri.toString());
		},

		subscribeToPull()
		{
			new BX.Pull.QueueManager({
				moduleId: 'tasks',
				userId: this.ownerId,
				config: {
					loadItemsDelay: 1000,
				},
				additionalData: {},
				events: {
					onBeforePull: (event) => {
						const { pullData: { command, params } } = event.data;

						const pullHandlers = {
							comment_read_all: this.onPullCommentReadAll,
							project_read_all: this.onPullProjectReadAll,
							tag_changed: this.onPullTagChanged,
						};
						if (pullHandlers[command])
						{
							pullHandlers[command].apply(this, [params]);
						}
					},
					onPull: (event) => {
						const { pullData: { command, params }, promises } = event.data;

						const taskId = (new BX.Tasks.ControllerTaskEvent()).resolveIdByParam(command, params);
						if (taskId > 0)
						{
							promises.push(
								Promise.resolve({
									data: {
										id: taskId,
										action: command,
										actionParams: params,
									},
								}),
							);
						}
					},
				},
				callbacks: {
					onBeforeQueueExecute: (items) => {
						return Promise.resolve();
					},
					onQueueExecute: (items) => {
						return new Promise((resolve, reject) => {
							BX.Tasks.ControllerTask
								.getRepository(items, this)
								.then((repository) => {
									// eslint-disable-next-line promise/catch-or-return
									this.executePullQueue(this.getPullItems(items, repository))
										.then(() => {
											resolve();
										})
									;
								})
							;
						});
					},
					onReload: () => {},
				},
			});
		},

		stopTimerPull()
		{
			this.skipTimerPush = true;
		},

		getPullItems(items, repository)
		{
			const pullItems = [];

			items.forEach((item) => {
				pullItems.push({
					...item,
					...{
						repository,
					},
				});
			});

			return pullItems;
		},

		executePullQueue(pullItems)
		{
			const pullHandlers = {
				comment_add: this.onPullCommentAdd,
				task_add: this.onPullTaskAdd,
				task_update: this.onPullTaskUpdate,
				task_view: this.onPullTaskView,
				task_remove: this.onPullTaskRemove,
				user_option_changed: this.onUserOptionChanged,
				task_timer_start: this.onTimerStart,
				task_timer_stop: this.onTimerStop,
			};

			return new Promise((resolve, reject) => {
				pullItems.forEach((pullItem) => {
					const { data: { action, actionParams }, repository } = pullItem;

					if (pullHandlers[action])
					{
						pullHandlers[action].apply(
							this,
							[actionParams, repository],
						);
					}
				});

				resolve();
			});
		},

		bindEvents: function() {
			BX.addCustomEvent('BX.Main.grid:sort', function(column, grid) {
				if (grid === this.grid)
				{
					this.sorting.sort = {};
					this.sorting.sort[column.sort_by] = column.sort_order;
				}
			}.bind(this));

			BX.addCustomEvent('BX.Main.grid:paramsUpdated', function() {
				this.updateCanMove();
				this.colorPinnedRows();
				this.applyDeadlinelessHints();
				this.clearTaskListItems();
				this.clearLastGroupId();
				this.getRows()
				.map(function(row) {
					return row.getId();
				})
				.filter(function(id) {
					return id !== 'template_0';
				})
				.forEach(function(id) {
					this.addTaskListItem(id);
					this.updateLastGroupId(id);
				}.bind(this))
				;
				this.showStub();
				this.initHints();
			}.bind(this));

			BX.addCustomEvent('BX.Tasks.Filter.group', function(grid, groupType, value) {
				if (this.getGrid() === grid)
				{
					this[groupType] = value;
				}
			}.bind(this));

			BX.Event.EventEmitter.subscribe('Grid::beforeRequest', (event) => {
				const [, eventArgs] = event.getCompatData();

				// an empty url means the grid will fall back to its own baseUrl, so it must be left untouched
				if (
					!this.groupByGroups
					|| eventArgs.gridId !== this.getGrid().getId()
					|| !BX.Type.isStringFilled(eventArgs.url)
				)
				{
					return;
				}

				eventArgs.url = new BX.Uri(eventArgs.url)
					.setQueryParam('lastGroupId', this.lastGroupId)
					.toString()
				;
			});

			const clearParam = new BX.Uri(location.toString())
				.removeQueryParam('relationToId')
				.removeQueryParam('relationType')
				.toString()
			;
			history.replaceState(null, '', clearParam);

			const relationToId = Number(this.arParams.relationToId);
			const relationType = this.arParams.relationType;
			if (relationToId)
			{
				const buttonRelationAdd = document.getElementById('tasks-buttonRelationAdd');
				const reload = () => this.getGrid().reload();
				const meta = {
					subTasks: {
						relationToField: 'parentId',
						relationDialog: 'subTasksDialog',
						relationToId,
					},
					relatedTasks: {
						relationToField: 'relatedToTaskId',
						relationDialog: 'relatedTasksDialog',
						relationToId,
					},
					relatedTemplateTasks: {
						relationToField: 'relatedToTaskId',
						relationDialog: 'relatedTasksDialog',
						relationToId: `template${relationToId}`,
					},
					gantt: {
						relationToField: 'ganttParentId',
						relationDialog: 'ganttDialog',
						relationToId,
					},
				}[relationType];

				top.BX.Runtime.loadExtension('tasks.v2.lib.relation-tasks-dialog').then((exports) => {
					/** @type RelationTasksDialog */
					const dialog = exports[meta.relationDialog];
					BX.Event.EventEmitter.subscribe('SidePanel.Slider:onClose', () => {
						const popup = dialog.dialog.getPopup();
						popup.setTargetContainer(top.document.body); // avoid destroying by SliderIntegration
						popup.close();
					});
				});

				if (relationType === 'gantt')
				{
					top.BX.Runtime.loadExtension('tasks.v2.application.gantt-popup').then(({ GanttPopupApi }) => {
						/** @type GanttPopupApi */
						const ganttPopup = new GanttPopupApi({ taskId: meta.relationToId });
						ganttPopup.onUpdate(reload);

						BX.Event.bind(buttonRelationAdd, 'click', () => {
							void ganttPopup.showTo(buttonRelationAdd, document.body);
						});

						BX.Event.EventEmitter.subscribe('SidePanel.Slider:onClose', () => {
							ganttPopup.destroy();
						});
					});
				}
				else
				{
					top.BX.Runtime.loadExtension('tasks.v2.lib.relation-tasks-dialog').then((exports) => {
						/** @type RelationTasksDialog */
						const dialog = exports[meta.relationDialog];

						BX.Event.bind(buttonRelationAdd, 'click', () => dialog.show({
							targetNode: buttonRelationAdd,
							targetContainer: document.body,
							taskId: meta.relationToId,
							onUpdate: reload,
						}));
					});
				}

				BX.Event.EventEmitter.subscribe('Grid::beforeRequest', (event) => {
					const [, eventArgs] = event.getCompatData();

					eventArgs.url = new BX.Uri(eventArgs.url)
						.setQueryParam('relationToId', relationToId)
						.setQueryParam('relationType', relationType)
						.toString()
					;
				});

				top.BX.Event.EventEmitter.subscribe('tasks:card:taskAdded', (event) => {
					if (event.getData()?.initialTask[meta.relationToField] === meta.relationToId)
					{
						reload();
					}
				});
			}
		},

		updateCanMove: function() {
			this.canMove = (
				this.isMyList
				&& this.sorting.sort.ACTIVITY_DATE
				&& this.sorting.sort.ACTIVITY_DATE === 'desc'
				&& !this.groupByGroups
				&& !this.groupBySubTasks
			);
		},

		checkCanMove: function() {
			return this.canMove;
		},

		colorPinnedRows: function() {
			this.getRows().forEach(function(row) {
				var node = row.getNode();
				this.getIsPinned(row.getId())
					? BX.addClass(node, this.classes.pinned)
					: BX.removeClass(node, this.classes.pinned)
				;
			}.bind(this));
		},

		/**
		 * SC-005: apply deadlineless hint highlighting to all rows matching ALG-02 predicate.
		 * Also wires up mouseenter/mouseleave for hover popup.
		 */
		applyDeadlinelessHints: function() {
			if (!this.isNewUser)
			{
				return;
			}

			this.getRows().forEach(function(row) {
				var rowId = row.getId();
				if (!rowId || rowId === 'template_0' || typeof rowId === 'string' && rowId.indexOf('group_') === 0)
				{
					return;
				}

				var node = row.getNode();
				if (!node)
				{
					return;
				}

				var creatorId = Number(node.getAttribute('data-creator-id') || 0);
				var hasDeadline = node.getAttribute('data-has-deadline') === 'true';
				// the deadline must actually be settable on this row — computed server-side in
				// result_modifier.php from the deadline cell's own clickable + CHANGE_DEADLINE
				// gate; without it the badge/CTA would target a read-only cell whose picker
				// never opens (completed/deferred/no-permission rows).
				var canChangeDeadline = node.getAttribute('data-can-change-deadline') === 'true';

				// ALG-02: isNewUser (already checked above) && !hasDeadline && creatorId === currentUserId
				var isHint = !hasDeadline && creatorId === this.currentUserId && canChangeDeadline;

				if (isHint)
				{
					BX.addClass(node, 'tasks-task-list-deadlineless-hint');

					// Bind hover events only once (guard with dataset flag)
					if (!node._deadlinelessHintBound)
					{
						node._deadlinelessHintBound = true;
						node._deadlinelessHintPopup = null;
						node._deadlinelessHintCloseTimer = null;

						var self = this;

						node.addEventListener('mouseenter', function() {
							clearTimeout(node._deadlinelessHintCloseTimer);
							if (BX.hasClass(node, 'tasks-task-list-deadlineless-hint'))
							{
								self.showDeadlinelessHintForRow(node, rowId);
							}
						});

						node.addEventListener('mouseleave', function() {
							if (node._deadlinelessHintPopup)
							{
								node._deadlinelessHintCloseTimer = setTimeout(function() {
									if (node._deadlinelessHintPopup)
									{
										node._deadlinelessHintPopup.close();
									}
								}, 300);
							}
						});
					}
				}
				else
				{
					BX.removeClass(node, 'tasks-task-list-deadlineless-hint');
				}
			}.bind(this));
		},

		/**
		 * SC-005: show hover popup for a deadlineless task row.
		 * @param {HTMLElement} rowNode
		 * @param {string|number} taskId
		 */
		showDeadlinelessHintForRow: function(rowNode, taskId) {
			if (rowNode._deadlinelessHintPopup)
			{
				return;
			}

			// AC-024: suppress under an open slider / panel
			if (
				typeof BX.SidePanel !== 'undefined'
				&& BX.SidePanel.Instance
				&& BX.SidePanel.Instance.getTopSlider
				&& BX.SidePanel.Instance.getTopSlider()
			)
			{
				return;
			}

			// Find DEADLINE cell for popup bind point; fall back to row node
			var deadlineCell = rowNode.querySelector('[data-column-id="DEADLINE"]') || rowNode;

			var ctaButton = BX.create('button', {
				attrs: {
					type: 'button',
					className: 'tasks-kanban-deadlineless-hint__cta',
					'data-testid': 'task-list-deadlineless-hint-cta'
				},
				text: BX.message('TASKS_KANBAN_DEADLINELESS_HINT_CTA'),
				events: {
					click: function() {
						// Event 2: sent before opening the calendar (ALG-02) so it survives the navigation
						BX.Tasks.GridActions.sendDeadlinelessHintAnalytics('click_suggest_banner');
						if (rowNode._deadlinelessHintPopup)
						{
							rowNode._deadlinelessHintPopup.close();
						}
						// Pass the current date explicitly: with null the handler falls back to
						// `(new Date).getDate()` — a day-of-month number, not a date
						BX.Tasks.GridActions.onDeadlineChangeClick(taskId, deadlineCell, new Date(), null);
					}
				}
			});

			var closeButton = BX.create('button', {
				attrs: {
					type: 'button',
					className: 'tasks-kanban-deadlineless-hint__close',
					'data-testid': 'task-list-deadlineless-hint-close',
					'aria-label': BX.message('TASKS_KANBAN_DEADLINELESS_HINT_CLOSE')
				},
				html: '&times;',
				events: {
					click: function() {
						// Event 1: explicit dismissal via the × button
						BX.Tasks.GridActions.sendDeadlinelessHintAnalytics('close_suggest_banner');
						if (rowNode._deadlinelessHintPopup)
						{
							rowNode._deadlinelessHintPopup.close();
						}
					}
				}
			});

			// RF-11: no role/aria-label here — the accessible name and role are set on the BX.Main.Popup itself
			var content = BX.create('div', {
				attrs: {
					className: 'tasks-kanban-deadlineless-hint'
				},
				children: [
					BX.create('div', { attrs: { className: 'tasks-kanban-deadlineless-hint__avatar' } }),
					BX.create('div', {
						attrs: { className: 'tasks-kanban-deadlineless-hint__body' },
						children: [
							BX.create('div', {
								attrs: { className: 'tasks-kanban-deadlineless-hint__title' },
								text: BX.message('TASKS_KANBAN_DEADLINELESS_HINT_TITLE')
							}),
							BX.create('div', {
								attrs: { className: 'tasks-kanban-deadlineless-hint__text' },
								text: BX.message('TASKS_KANBAN_DEADLINELESS_HINT_TEXT')
							}),
							ctaButton
						]
					}),
					closeButton
				]
			});

			// Close any previously open deadlineless hint
			if (activeDeadlinelessHintRow && activeDeadlinelessHintRow !== rowNode)
			{
				clearTimeout(activeDeadlinelessHintRow._deadlinelessHintCloseTimer);
				if (activeDeadlinelessHintRow._deadlinelessHintPopup)
				{
					activeDeadlinelessHintRow._deadlinelessHintPopup.close();
				}
			}

			var popup = new BX.Main.Popup({
				bindElement: deadlineCell,
				content: content,
				// RF-11: hover hint — expose as a named live region instead of a nameless dialog
				role: 'status',
				ariaLabel: BX.message('TASKS_KANBAN_DEADLINELESS_HINT_TITLE'),
				width: 390,
				padding: 0,
				angle: true,
				background: 'var(--ui-color-bg-content-inapp, #0056bf)',
				borderRadius: 16,
				closeByEsc: true,
				autoHide: true,
				// onClose drops the reference, so a cacheable (default) popup would leak
				// a hidden container into document.body on every hover
				cacheable: false,
				offsetLeft: 55,
				offsetTop: -5,
				className: 'tasks-kanban-deadlineless-hint-popup',
				events: {
					onClose: function() {
						clearTimeout(rowNode._deadlinelessHintCloseTimer);
						rowNode._deadlinelessHintPopup = null;
						if (activeDeadlinelessHintRow === rowNode)
						{
							activeDeadlinelessHintRow = null;
						}
					},
					onDestroy: function() {
						clearTimeout(rowNode._deadlinelessHintCloseTimer);
						rowNode._deadlinelessHintPopup = null;
						if (activeDeadlinelessHintRow === rowNode)
						{
							activeDeadlinelessHintRow = null;
						}
					}
				}
			});

			rowNode._deadlinelessHintPopup = popup;

			// hover-intent: keep popup open while cursor is inside it
			var popupContainer = popup.getPopupContainer();
			if (popupContainer)
			{
				popupContainer.addEventListener('mouseenter', function() {
					clearTimeout(rowNode._deadlinelessHintCloseTimer);
				});
				popupContainer.addEventListener('mouseleave', function() {
					rowNode._deadlinelessHintCloseTimer = setTimeout(function() {
						if (rowNode._deadlinelessHintPopup)
						{
							rowNode._deadlinelessHintPopup.close();
						}
					}, 300);
				});
			}

			activeDeadlinelessHintRow = rowNode;
			popup.show();
		},

		getIsPinned: function(rowId) {
			return this.isRowExist(rowId)
				&& this.getRowNodeById(rowId).querySelector('.main-grid-cell-content-action-pin.main-grid-cell-content-action-active') instanceof HTMLElement;
		},

		onPullTaskView: function(data, repository) {
			if (this.userId !== Number(data.USER_ID) || !this.isRowExist(data.TASK_ID.toString()))
			{
				return;
			}
			this.updateActivityDateCellForTask(data.TASK_ID, {}, {}, repository);
		},

		onPullCommentReadAll: function(data) {
			this.onReadAll(data);
		},

		onPullProjectReadAll: function(data) {
			this.onReadAll(data);
		},

		onReadAll: function(data) {
			if (this.userId !== Number(data.USER_ID))
			{
				return;
			}
			this.updateActivityDateCellForTasksFromLocalStorage();
		},

		updateActivityDateCellForTasksHandler: function(response, rowData, parameters)
		{
			Object.keys(response.data).forEach(function(taskId) {
				if (this.isRowExist(taskId))
				{
					var row = this.getRowById(taskId);
					var rowData = response.data[taskId];

					if (row.getCellById('ACTIVITY_DATE'))
					{
						row.setCellsContent({ ACTIVITY_DATE: rowData.content.ACTIVITY_DATE });
					}
					row.setActions(rowData.actions);
					row.setCellActions(rowData.cellActions);
					row.setCounters(rowData.counters);

					if (parameters.highlightRow === true)
					{
						this.highlightGridRow(taskId);
					}
				}
			}.bind(this))
		},

		updateActivityDateCellForTasksFromLocalStorage: function()
		{
			var parameters = {};
			var taskIds = this.getTaskListItems();

			var params = {
				taskIds: taskIds,
				arParams: this.arParams,
			};

			BX.ajax.runComponentAction('bitrix:tasks.task.list', 'getGridRows', {
				mode: 'class',
				data: params,
			}).then(
				function(response) {
					this.updateActivityDateCellForTasksHandler(response, {},{});
				}.bind(this),
			).catch(
				function(response) {
					if (response.errors)
					{
						BX.Tasks.alert(response.errors);
					}
				}.bind(this),
			);
		},

		updateActivityDateCellForTask: function(taskId, rowData, parameters, repository)
		{
			parameters = parameters || {};

			var item = repository.collectionGrid.get(BX.Text.toNumber(taskId));

			if (item && item[taskId])
			{
				this.updateActivityDateCellForTasksHandler({data: item}, rowData, parameters);
			}
		},

		onPullCommentAdd: function(data, repository) {
			if (this.checkComment(data))
			{
				var xmlId = data.entityXmlId.split('_');
				if (xmlId)
				{
					this.checkTask(xmlId[1], {
						action: this.actions.commentAdd,
						userId: Number(data.ownerId),
						isCompleteComment: data.isCompleteComment,
					}, repository);
				}
			}
		},

		onPullTagChanged: function(params)
		{
			if (this.groupId === 0)
			{
				this.getGrid().reload();
			}
			if (this.groupId !== 0 && params.groupId === this.groupId)
			{
				this.getGrid().reload();
			}
			var dialog = BX.UI.EntitySelector.Dialog.getById('tasks-task-list-tag-widget');
			dialog && dialog.hide();
		},

		onPullTaskAdd: function(data, repository) {
			if (data.params.addCommentExists === false)
			{
				this.checkTask(data.TASK_ID.toString(), {
					action: this.actions.taskAdd,
					userId: this.ownerId,
				}, repository);
			}
		},

		onPullTaskUpdate: function(data, repository) {
			var dialog = BX.UI.EntitySelector.Dialog.getById('tasks-task-list-tag-widget');
			if (dialog)
			{
				if ('GROUP_ID' in data.AFTER && data.AFTER.GROUP_ID !== data.BEFORE.GROUP_ID)
				{
					dialog.hide()
				}
			}
			if (data.params.updateCommentExists === false)
			{
				this.checkTask(data.TASK_ID.toString(), {
					action: this.actions.taskUpdate,
					userId: this.ownerId,
				}, repository);
			}
			else if (
				data.params.removedParticipants.includes(this.ownerId.toString())
				&& (!this.groupId || this.groupId !== Number(data.AFTER.GROUP_ID))
			)
			{
				this.removeItem(data.TASK_ID.toString());
			}
		},

		onPullTaskRemove: function(data, repository) {
			if (this.checkCanMove())
			{
				this.removeItem(data.TASK_ID.toString());
			}
		},

		onUserOptionChanged: function(data, repository) {
			if (!this.checkCanMove() || this.userId !== Number(data.USER_ID))
			{
				return;
			}

			var taskId = data.TASK_ID.toString();

			switch (Number(data.OPTION))
			{
				case 1:
					this.updateActivityDateCellForTask(taskId, {}, {}, repository);
					break;

				case 2:
				case 3:
					if (this.canPin)
					{
						this.placeToNearTasks(taskId, null, { action: this.actions.pinChanged }, repository);
					}
					break;

				default:
					break;
			}
		},

		onTimerStart: function(data, repository)
		{
			const taskId = data.taskId;
			if (!this.isRowExist(Number(taskId)))
			{
				return;
			}

			if (this.skipTimerPush)
			{
				this.skipTimerPush = false;

				return;
			}

			const onRowUpdate = (eventData) => {
				const rowId = eventData.data?.id ?? eventData.id;
				if (Number(rowId) !== Number(taskId))
				{
					return;
				}

				BX.removeCustomEvent('Tasks.Tasks.Grid:RowUpdate', onRowUpdate);

				BX.TasksTimerManager.startTimer(taskId, {
					timerStartedAtTs: data.timerStartedAtTs,
					timeElapsed: data.timeElapsed,
					timeSpentInLogs: data.timeSpentInLogs,
					timeEstimate: data.timeEstimate,
					userId: this.ownerId,
				});
			};
			BX.addCustomEvent('Tasks.Tasks.Grid:RowUpdate', onRowUpdate);

			this.checkTask(taskId, {
				action: this.actions.taskUpdate,
				userId: this.ownerId,
			}, repository);
		},

		onTimerStop: function(data, repository)
		{
			const taskId = data.taskId;
			if (!this.isRowExist(Number(taskId)))
			{
				return;
			}

			if (this.skipTimerPush)
			{
				this.skipTimerPush = false;

				return;
			}

			const onRowUpdate = (eventData) => {
				const rowId = eventData.data?.id ?? eventData.id;
				if (Number(rowId) !== Number(taskId))
				{
					return;
				}

				BX.removeCustomEvent('Tasks.Tasks.Grid:RowUpdate', onRowUpdate);

				BX.TasksTimerManager.stopTimer(taskId);
			};
			BX.addCustomEvent('Tasks.Tasks.Grid:RowUpdate', onRowUpdate);

			this.checkTask(taskId, {
				action: this.actions.taskUpdate,
				userId: this.ownerId,
			}, repository);
		},

		placeToNearTasks: function(taskId, taskData, parameters, repository)
		{
			var item = repository.collectionNear.get(BX.Text.toNumber(taskId));

			if (item[taskId])
			{
				var rowData = item[taskId];
				var before = rowData.before;
				var after = rowData.after;

				if ((before && this.isRowExist(before)) || (after && this.isRowExist(after)))
				{
					var params = {
						before: before,
						after: after,
					};
					Object.keys(parameters).forEach(function(key) {
						params[key] = parameters[key];
					});
					this.updateItem(taskId, taskData, params, repository);
				}
				else
				{
					this.removeItem(taskId);
				}
			}
		},

		checkComment: function(data) {
			var xmlId = data.entityXmlId.split('_');
			if (!xmlId)
			{
				return false;
			}

			var entityType = xmlId[0];
			var taskId = xmlId[1];

			if (entityType !== 'TASK')
			{
				return false;
			}

			if (!this.comments.has(taskId))
			{
				this.comments.set(taskId, new Set());
			}

			var taskComments = this.comments.get(taskId);
			var messageId = data.messageId;
			var participants = data.participants.map(function(id) {
				return id.toString();
			});

			if (taskComments.has(messageId))
			{
				return false;
			}

			taskComments.add(messageId);

			return (participants.includes(this.userId.toString()) || this.groupId === data.groupId);
		},

		checkTask: function(taskId, parameters, repository) {
			parameters = parameters || {};

			var task = null;
			var collection = repository.collection;
			var collectionSiftThroughFilter = repository.collectionSiftThroughFilter;

			if (parameters.isCompleteComment === false || parameters.userId === this.userId)
			{
				task = collectionSiftThroughFilter.getById(taskId);
			}
			else
			{
				task = collection.getById(taskId);
			}

			this.onCheckTaskSuccess(task, taskId, parameters, repository);
		},

		onCheckTaskSuccess: function(model, taskId, parameters, repository)
		{
			if (BX.Type.isNil(model))
			{
				this.removeItem(taskId);
				return;
			}

			var taskData = model.getFields();

			if (this.isRowExist(taskId))
			{
				if (this.checkCanMove())
				{
					parameters.canMoveRow = (parameters.action !== this.actions.taskUpdate);
					this.updateGridRow(taskId, taskData, parameters, repository);
				}
				else
				{
					var focusDescriptor = null;

					if (parameters.action === this.actions.commentAdd)
					{
						if (parameters.isCompleteComment === true)
						{
							focusDescriptor = this.captureRowFocus(this.getRowNodeById(taskId));
							this.getGrid().updateRow(taskId, null, null, ({ id }) => {
								if (this.isRowExist(id) && this.isFocusLost())
								{
									this.restoreRowFocus(id, focusDescriptor);
								}

								BX.onCustomEvent('Tasks.Tasks.Grid:RowUpdate', { id });
							});
						}
						else
						{
							var rowData = {};
							rowData[taskId] = taskData;

							this.updateActivityDateCellForTask(
								taskId,
								rowData,
								{ highlightRow: true },
								repository
							);
						}
					}
					else if (parameters.action === this.actions.taskUpdate)
					{
						focusDescriptor = this.captureRowFocus(this.getRowNodeById(taskId));
						this.getGrid().updateRow(taskId, null, null, ({ id }) => {
							if (this.isRowExist(id) && this.isFocusLost())
							{
								this.restoreRowFocus(id, focusDescriptor);
							}

							BX.onCustomEvent('Tasks.Tasks.Grid:RowUpdate', { id });
						});
					}
				}
			}
			else if (this.checkCanMove())
			{
				if (parameters.action === this.actions.taskUpdate)
				{
					this.placeToNearTasks(taskId, taskData, parameters, repository);
				}
				else
				{
					this.updateItem(taskId, taskData, parameters, repository);
				}
			}
		},

		updateItem: function(taskId, rowData, parameters, repository) {
			rowData = rowData || null;
			parameters = parameters || {};

			if (!this.hasTaskListItem(taskId))
			{
				this.addTaskListItem(taskId);
				this.addGridRow(taskId, rowData, parameters, repository);
			}
			else
			{
				this.updateGridRow(taskId, rowData, parameters, repository);
			}
		},

		addGridRow: function(rowId, rowData, parameters, repository)
		{
			var item = repository.collectionGrid.get(BX.Text.toNumber(rowId));

			if (item[rowId])
			{
				var rowData = item[rowId];
				var options = {
					id: rowId,
					columns: rowData.content,
					actions: rowData.actions,
					cellActions: rowData.cellActions,
					counters: rowData.counters,
				};
				var moveRows = this.getGridMoveRows(rowId, parameters);

				if (moveRows.rowAfter)
				{
					options.insertAfter = moveRows.rowAfter;
				}
				else if (moveRows.rowBefore)
				{
					options.insertBefore = moveRows.rowBefore;
				}
				else
				{
					options.append = true;
				}

				if (this.taskList.size > this.getPageNumber() * this.getPageSize())
				{
					var lastRowId = this.getLastRowId();

					this.removeTaskListItem(lastRowId);
					BX.remove(this.getRowNodeById(lastRowId));
					this.showMoreButton();
				}

				this.hideStub();
				this.getRealtime().addRow(options);
				this.colorPinnedRows();
			}
			else
			{
				BX.Tasks.alert('grid.id is empty' + rowId);
			}

			const gridId = this.getGrid().containerId;
			const checkBoxNode = document.getElementById(gridId + '_check_all');
			if (checkBoxNode && checkBoxNode.disabled === true)
			{
				checkBoxNode.disabled = false;
			}
		},

		updateGridRow: function(rowId, rowData, parameters, repository)
		{
			if (!this.isRowExist(rowId))
			{
				return;
			}

			var item = repository.collectionGrid.get(BX.Text.toNumber(rowId));

			if (item[rowId])
			{
				var rowData = item[rowId];
				var row = this.getRowById(rowId);
				var focusDescriptor = this.captureRowFocus(row.getNode());
				row.setCellsContent(rowData.content);
				row.setActions(rowData.actions);
				row.setCellActions(rowData.cellActions);
				row.setCounters(rowData.counters);

				if (parameters.canMoveRow !== false)
				{
					this.getGrid().getRows().reset();

					var moveRows = this.getGridMoveRows(rowId, parameters);
					this.moveRow(rowId, moveRows.rowAfter);
				}
				this.highlightGridRow(rowId).then(function() {
					this.colorPinnedRows();
				}.bind(this));

				this.getGrid().bindOnRowEvents();

				this.restoreRowFocus(rowId, focusDescriptor);

				BX.onCustomEvent('Tasks.Tasks.Grid:RowUpdate', { id: rowId });
			}
			else
			{
				BX.Tasks.alert('grid.id is empty' + rowId);
			}
		},

		removeItem: function(id)
		{
			if (!this.isRowExist(id))
			{
				return;
			}

			var rowNode = this.getRowNodeById(id);
			var hadRowFocus = !!rowNode && rowNode.contains(document.activeElement);
			var neighbourFocus = this.moveFocusFromRow(id);

			this.removeTaskListItem(id);
			this.getGrid().removeRow(id, undefined, undefined, function() {
				if (document.activeElement !== document.body)
				{
					return;
				}

				if (neighbourFocus && neighbourFocus.id)
				{
					this.restoreRowFocus(neighbourFocus.id, neighbourFocus.descriptor);
				}
				else if (hadRowFocus)
				{
					this.focusGridFallback();
				}
			}.bind(this));

			BX.onCustomEvent('Tasks.Tasks.Grid:RowRemove', { id: id });
		},

		getGridMoveRows: function(rowId, parameters) {
			var rowBefore;
			var rowAfter;

			switch (parameters.action)
			{
				case this.actions.pinChanged:
				case this.actions.taskUpdate:
					rowBefore = parameters.before;
					rowAfter = parameters.after;
					break;

				default:
					rowBefore = this.getFirstRowId();
					rowAfter = (this.getIsPinned(rowId) ? 0 : this.getLastPinnedRowId());
					break;
			}

			return {
				rowBefore: rowBefore,
				rowAfter: rowAfter,
			};
		},

		moveRow: function(rowId, after) {
			if (after)
			{
				this.getGrid().getRows().insertAfter(rowId, after);
			}
			else
			{
				const firstRow = this.getGrid().getRows().getBodyFirstChild();
				this.getGrid().getRows().insertBefore(rowId, firstRow.getId());
			}
		},

		moveFocusFromRow: function(rowId) {
			var row = this.getRowById(rowId);
			if (!row)
			{
				return null;
			}

			var rowNode = row.getNode();
			if (!rowNode || !rowNode.contains(document.activeElement))
			{
				return null;
			}

			return this.focusNeighbourRow(rowId);
		},

		focusNeighbourRow: function(rowId) {
			var row = this.getRowById(rowId);
			if (!row)
			{
				return null;
			}

			var rows = this.getRows();
			var currentId = row.getId();
			var currentIndex = -1;
			for (var i = 0; i < rows.length; i++)
			{
				if (rows[i].getId() === currentId)
				{
					currentIndex = i;
					break;
				}
			}

			if (currentIndex === -1)
			{
				return null;
			}

			var neighbours = [];
			for (var offset = 1; offset < rows.length; offset++)
			{
				if (rows[currentIndex + offset])
				{
					neighbours.push(rows[currentIndex + offset]);
				}
				if (rows[currentIndex - offset])
				{
					neighbours.push(rows[currentIndex - offset]);
				}
			}

			for (var j = 0; j < neighbours.length; j++)
			{
				if (this.focusNode(this.getFocusableNode(neighbours[j].getNode())))
				{
					return {
						id: neighbours[j].getId(),
						descriptor: this.captureRowFocus(neighbours[j].getNode()),
					};
				}
			}

			this.focusGridFallback();

			return null;
		},

		isFocusLost: function() {
			return document.activeElement === document.body;
		},

		captureRowFocus: function(rowNode) {
			if (!rowNode || !rowNode.contains(document.activeElement))
			{
				return null;
			}

			var active = document.activeElement;
			var candidates = this.getRowFocusables(rowNode);
			var index = -1;
			for (var i = 0; i < candidates.length; i++)
			{
				if (candidates[i] === active)
				{
					index = i;
					break;
				}
			}

			return {
				id: (active.id || null),
				index: index,
			};
		},

		restoreRowFocus: function(rowId, descriptor) {
			if (!descriptor)
			{
				return;
			}

			var row = this.getRowById(rowId);
			var rowNode = (row ? row.getNode() : null);
			if (!rowNode)
			{
				this.focusNeighbourRow(rowId);
				return;
			}

			if (descriptor.id)
			{
				var byId = document.getElementById(descriptor.id);
				if (byId && rowNode.contains(byId) && this.focusNode(byId))
				{
					return;
				}
			}

			var candidates = this.getRowFocusables(rowNode);
			if (
				descriptor.index >= 0
				&& descriptor.index < candidates.length
				&& this.focusNode(candidates[descriptor.index])
			)
			{
				return;
			}

			if (this.focusNode(this.getFocusableNode(rowNode)))
			{
				return;
			}

			this.focusNeighbourRow(rowId);
		},

		getRowFocusables: function(container) {
			if (!container)
			{
				return [];
			}

			return container.querySelectorAll(
				'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
			);
		},

		getFocusableNode: function(container) {
			var candidates = this.getRowFocusables(container);

			for (var i = 0; i < candidates.length; i++)
			{
				if (this.isNodeVisible(candidates[i]))
				{
					return candidates[i];
				}
			}

			return null;
		},

		isNodeVisible: function(node) {
			return !!node && (node.offsetParent !== null || node.getClientRects().length > 0);
		},

		focusNode: function(node) {
			if (!this.isNodeVisible(node))
			{
				return false;
			}

			node.focus();

			return document.activeElement === node;
		},

		focusGridFallback: function() {
			var gridId = this.getGrid().containerId;
			if (this.focusNode(document.getElementById(gridId + '_check_all')))
			{
				return;
			}

			var container = this.getGrid().getContainer();
			if (container && !container.hasAttribute('tabindex'))
			{
				container.setAttribute('tabindex', '-1');
			}

			this.focusNode(container);
		},

		getLastPinnedRowId: function() {
			var pinnedRows = Object.values(this.getRows()).filter(function(row) {
				return this.getIsPinned(row.getId());
			}.bind(this));
			var keys = Object.keys(pinnedRows);

			if (keys.length > 0)
			{
				return pinnedRows[keys[keys.length - 1]].getId();
			}

			return 0;
		},

		getFirstRowId: function() {
			var rows = this.getRows();
			return (rows.length ? this.getRowProp(rows[0], 'id') : 0);
		},

		getLastRowId: function() {
			var lastRow = this.getGrid().getRows().getBodyLastChild();
			return (lastRow ? this.getRowProp(lastRow, 'id') : 0);
		},

		highlightGridRow: function(rowId) {
			var promise = new BX.Promise();

			if (!this.isRowExist(rowId))
			{
				promise.reject();
				return promise;
			}

			var node = this.getRowNodeById(rowId);
			var isPinned = BX.hasClass(node, this.classes.pinned);

			if (isPinned)
			{
				BX.removeClass(node, this.classes.pinned);
			}

			BX.addClass(node, this.classes.highlighted);
			setTimeout(function() {
				BX.removeClass(node, this.classes.highlighted);
				if (isPinned)
				{
					BX.addClass(node, this.classes.pinned);
				}
				promise.fulfill();
			}.bind(this), 900);

			return promise;
		},

		getGrid: function() {
			return this.grid;
		},

		getRows: function() {
			return this.getGrid().getRows().getBodyChild();
		},

		isRowExist: function(id) {
			return this.getRowById(id) !== null;
		},

		getRowById: function(id) {
			return this.getGrid().getRows().getById(id);
		},

		getRowNodeById: function(id) {
			return this.getRowById(id).getNode();
		},

		getRowProp: function(row, propName) {
			return BX.data(row.getNode(), propName);
		},

		setRowProp: function(row, propName, propValue) {
			row.getNode().setAttribute('data-' + propName, propValue);
		},

		getPageNumber: function() {
			var pageNumber = 1;
			var navPanel = this.getGrid().getContainer().querySelector('.main-grid-nav-panel');
			if (navPanel)
			{
				var pagination = navPanel.querySelector('.main-ui-pagination');
				if (pagination)
				{
					var activePagination = pagination.querySelector('.main-ui-pagination-active');
					if (activePagination)
					{
						pageNumber = activePagination.innerText;
					}
				}
			}

			return pageNumber;
		},

		getPageSize: function() {
			var pageSize = 50;
			var selector = BX(this.getGrid().getContainerId() + '_' + this.getGrid().settings.get('pageSizeId'));

			if (selector)
			{
				pageSize = BX.data(selector, 'value');
			}

			return pageSize;
		},

		getRealtime: function() {
			return this.getGrid().getRealtime();
		},

		showStub: function() {

		},

		hideStub: function() {
			this.getGrid().hideEmptyStub();
		},

		showMoreButton: function() {
			this.getGrid().getMoreButton().getNode().style.display = 'inline-block';
		},

		hideMoreButton: function() {
			this.getGrid().getMoreButton().getNode().style.display = 'none';
		},

		getTaskListItems: function() {
			return Array.from(this.taskList.keys());
		},

		hasTaskListItem: function(id) {
			return this.taskList.has(parseInt(id, 10));
		},

		addTaskListItem: function(id) {
			this.taskList.set(parseInt(id, 10));
		},

		removeTaskListItem: function(id) {
			this.taskList.delete(parseInt(id, 10));
		},

		fillTaskListItems: function(items) {
			Object.keys(items).forEach(function(id) {
				this.addTaskListItem(id);
			}.bind(this));
		},

		clearTaskListItems: function() {
			this.taskList.clear();
		},

		updateLastGroupId: function(id) {
			if (id.indexOf('group_') === 0)
			{
				this.lastGroupId = Number(id.replace('group_', ''));
			}
		},

		clearLastGroupId: function() {
			this.lastGroupId = 0;
		},
	};

	BX.addCustomEvent('tasksTaskEvent', BX.delegate(function(type, data) {
		if (!BX.Tasks.GridActions.checkCanMove())
		{
			BX.Tasks.GridActions.reloadGrid();
		}
	}, this));

	// Delegated click inside the CRM cell. The chip body adds its element to the CRM_ITEM filter; the
	// remove button (shown by CSS only while the chip is active) removes it; the card link opens the CRM
	// card and must not filter. Capture phase + stopPropagation: the click must not bubble to the grid's
	// row-select handler, so filtering by a chip does not tick the row checkbox. The handler is a no-op
	// when the feature is off (no matching nodes in the DOM), so it registers unconditionally.
	document.addEventListener('click', function(event) {
		var removeButton = event.target.closest('[data-crm-filter-remove]');
		if (removeButton)
		{
			var activeChip = removeButton.closest('[data-crm-filter-value]');
			if (activeChip)
			{
				event.stopPropagation();
				BX.PreventDefault(event);
				BX.Tasks.GridActions.unfilterByCrmItem(
					activeChip.getAttribute('data-crm-filter-value'),
					activeChip.getAttribute('data-crm-filter-label'),
				);
			}

			return;
		}

		var chip = event.target.closest('.tasks-list-crm [data-crm-filter-value]');
		if (chip)
		{
			event.stopPropagation();
			BX.PreventDefault(event);
			BX.Tasks.GridActions.toggleCrmItemFilter(chip);

			return;
		}

		// Delegated click on the empty CRM cell "+" button: opens the CRM selector and binds the chosen
		// element to the task. Backend renders the button only when allowed.
		var addButton = event.target.closest('[data-crm-bind-add]');
		if (addButton)
		{
			event.stopPropagation();
			BX.PreventDefault(event);
			BX.Tasks.GridActions.onCrmBindAddClick(addButton.getAttribute('data-task-id'), addButton);
		}
	}, true);

	// Keyboard path for the focusable chip (role="button", tabindex=0): Enter/Space toggles the filter.
	// The remove button is a native <button>, so it keeps its own Enter/Space handling via the click above.
	document.addEventListener('keydown', function(event) {
		if (event.key !== 'Enter' && event.key !== ' ' && event.key !== 'Spacebar')
		{
			return;
		}

		if (event.target.closest('[data-crm-filter-remove]'))
		{
			return;
		}

		var chip = event.target.closest('.tasks-list-crm [data-crm-filter-value]');
		if (chip)
		{
			event.stopPropagation();
			BX.PreventDefault(event);
			BX.Tasks.GridActions.toggleCrmItemFilter(chip);
		}
	}, true);

	// CRM chips are re-rendered on every grid reload; re-bind their hover mini-cards each time.
	BX.addCustomEvent('Grid::updated', function() {
		BX.Tasks.GridActions.initCrmMiniCards();
	});

	BX.addCustomEvent('BX.Main.Filter:apply', function(filterId, data, ctx) {
		var stringUrl = window.location.href;
		var url = new URL(stringUrl);
		var state = url.searchParams.get('F_STATE');
		var newUrl = (state === 'sR' ? stringUrl.replace('&F_STATE=sR', '') : stringUrl);

		window.history.replaceState(null, null, newUrl);
	}.bind(this));

	BX.addCustomEvent('Tasks.TopMenu:onItem', function(roleId, url) {
		var filterManager = BX.Main.filterManager.getById(BX.Tasks.GridActions.gridId);
		if (!filterManager)
		{
			console.log('BX.Main.filterManager not initialised');
			return;
		}

		var fields = {
			preset_id: BX.Tasks.GridActions.defaultPresetId,
			additional: { ROLEID: (roleId === 'view_all' ? 0 : roleId) },
		};
		var filterApi = filterManager.getApi();
		filterApi.setFilter(fields, { ROLE_TYPE: 'TASKS_ROLE_TYPE_' + (roleId === '' ? 'view_all' : roleId) });

		window.history.pushState(null, null, url);
	});

	BX.addCustomEvent('Tasks.Toolbar:onItem', function(event) {
		var data = event.getData();
		if (data.counter && data.counter.filter)
		{
			data.counter.filter.toggleByField({ PROBLEM: data.counter.filterValue });
		}
	});

	BX.Tasks.Grid.Sorting = function(options) {
		this.grid = BX.Main.gridManager.getInstanceById(options.gridId);
		this.currentGroupId = options.currentGroupId;
		this.treeMode = options.treeMode;

		BX.message(options.messages);

		this.init();

		BX.addCustomEvent('BX.Main.grid:rowDragStart', this.handleRowDragStart.bind(this));
		BX.addCustomEvent('BX.Main.grid:rowDragMove', this.handleRowDragMove.bind(this));
		BX.addCustomEvent('BX.Main.grid:rowDragEnd', this.handleRowDragEnd.bind(this));
	};

	BX.Tasks.Grid.Sorting.prototype = {

		init: function() {
			this.dragRow = null;
			this.targetRow = null;
			this.error = false;

			this.targetTask = null;
			this.before = true;
			this.newGroup = null;
			this.newParentId = null;
		},

		/**
		 *
		 * @returns {BX.Main.grid}
		 */
		getGrid: function() {
			return this.grid;
		},

		/**
		 *
		 * @param {Element} node
		 * @return {BX.Grid.Row}
		 */
		getRow: function(node) {
			return this.getGrid().getRows().get(node);
		},

		/**
		 *
		 * @param id
		 * @return {BX.Grid.Row}
		 */
		getRowById: function(id) {
			return this.getGrid().getRows().getById(id);
		},

		/**
		 *
		 * @returns {BX.Grid.Row[]}
		 */
		getRows: function() {
			return this.getGrid().getRows().getBodyChild();
		},

		/**
		 *
		 * @param {BX.Grid.Row} row
		 * @param {string} propName
		 * @return {string}
		 */
		getRowProp: function(row, propName) {
			return row.getNode().dataset[propName];
		},

		/**
		 *
		 * @param {BX.Grid.Row} row
		 * @returns {string}
		 */
		getRowType: function(row) {
			return this.getRowProp(row, 'type');
		},

		/**
		 *
		 * @param {BX.Grid.Row} row
		 * @returns {string}
		 */
		getRowGroupId: function(row) {
			return this.getRowProp(row, 'groupId');
		},

		/**
		 *
		 * @param {BX.Grid.RowDragEvent} dragEvent
		 * @param {BX.Main.grid} grid
		 */
		handleRowDragStart: function(dragEvent, grid) {
			this.dragRow = this.getRow(dragEvent.getDragItem());
		},

		/**
		 *
		 * @param {BX.Grid.RowDragEvent} dragEvent
		 * @param {BX.Main.grid} grid
		 */
		handleRowDragMove: function(dragEvent, grid) {
			this.targetRow = this.getRow(dragEvent.getTargetItem());
			var targetType = this.targetRow ? this.getRowType(this.targetRow) : null;

			this.newParentId = null;
			this.error = false;
			var newGroup = null;

			if (targetType === 'task')
			{
				var targetParentId = this.targetRow.getParentId();
				if (targetParentId !== this.dragRow.getParentId())
				{
					this.newParentId = targetParentId;
				}

				newGroup = this.getGroupByRow(this.targetRow);

				this.targetTask = this.targetRow;
				this.before = true;
			}
			else
			{
				if (targetType === 'group')
				{
					newGroup = this.getPreviousGroup(this.targetRow);
				}
				else
				{
					newGroup = this.getLastGroup();
				}

				var target = this.getClosestTask(this.targetRow);
				this.targetTask = target.task;
				this.before = target.before;
			}

			this.newGroup = newGroup.id !== this.getGroupByRow(this.dragRow).id ? newGroup : null;

			if (targetType === 'task' && this.isChildOf(this.targetTask, this.dragRow))
			{
				this.error = true;
			}
			else if (
				this.newGroup
				&& this.newGroup.id > 0
				&& (
					this.getRowProp(this.dragRow, 'canEdit') === 'false' ||
					!this.newGroup.canCreateTasks
				)
			)
			{
				this.error = true;
			}
			else if (
				this.newParentId !== null &&
				this.getRowProp(this.dragRow, 'canEdit') === 'false'
			)
			{
				this.error = true;
			}

			this.error ? dragEvent.disallowMove(BX.message('TASKS_ACCESS_DENIED')) : dragEvent.allowMove();
		},

		handleRowDragEnd: function(dragEvent, grid) {
			if (!this.error)
			{
				this.save();
			}

			this.init();
		},

		save: function() {
			var sourceId = this.dragRow.getId();
			var targetId = this.targetTask ? this.targetTask.getId() : null;

			if (sourceId === targetId)
			{
				return;
			}

			var data = {
				sourceId: sourceId,
				targetId: targetId,
				before: this.before ? 1 : 0,
				currentGroupId: this.currentGroupId,
			};

			if (this.newGroup !== null)
			{
				data.newGroupId = this.newGroup.id;
				this.setGroupId(this.dragRow, data.newGroupId);
			}

			if (this.newParentId !== null && this.treeMode)
			{
				data.newParentId = this.newParentId;
			}

			BX.ajax.runComponentAction('bitrix:tasks.task.list', 'sortTask', {
				mode: 'class',
				data: {
					data: data,
				},
			}).then(
				function(response) {

				}.bind(this),
			).catch(
				function(response) {
					if (response.errors)
					{
						BX.Tasks.alert(response.errors);
						BX.Tasks.GridActions.reloadGrid();
					}
				}.bind(this),
			);
		},

		getParentRow: function(row) {
			return this.getRowById(row.getParentId());
		},

		/**
		 *
		 * @param {BX.Grid.Row} child
		 * @param {BX.Grid.Row} parent
		 * @return {Boolean}
		 */
		isChildOf: function(child, parent) {
			var parentTask = this.getParentRow(child);
			while (parentTask !== null)
			{
				if (parentTask === parent)
				{
					return true;
				}

				parentTask = this.getParentRow(parentTask);
			}

			return false;
		},

		getGroupById: function(groupId) {
			var rows = this.getRows();

			for (var i = 0; i < rows.length; i++)
			{
				var row = rows[i];
				if (this.getRowType(row) === 'group' && this.getRowGroupId(row) === String(groupId))
				{
					return this.getGroupByRow(row);
				}
			}

			return this.getDefaultProject();
		},

		setGroupId: function(row, groupId) {
			row.getDataset().groupId = groupId;

			var children = row.getChildren();
			for (var i = 0; i < children.length; i++)
			{
				this.setGroupId(children[i], groupId);

			}
		},

		getDefaultProject: function() {
			return {
				id: '0',
				canCreateTasks: true,
			};
		},

		/**
		 *
		 * @param {BX.Grid.Row} row
		 */
		getGroupByRow: function(row) {
			if (this.getRowType(row) === 'group')
			{
				return {
					id: this.getRowGroupId(row),
					canCreateTasks: this.getRowProp(row, 'canCreateTasks') === 'true',
				};
			}
			else
			{
				return this.getGroupById(this.getRowGroupId(row));
			}
		},

		getLastGroup: function() {
			var group = null;
			var rows = this.getRows();

			for (var i = rows.length - 1; i >= 0; i--)
			{
				var row = rows[i];
				if (this.getRowType(row) === 'group')
				{
					return this.getGroupByRow(row);
				}
			}

			return this.getDefaultProject();
		},

		getPreviousGroup: function(currentGroup) {
			var group = null;
			var rows = this.getRows();
			var found = false;

			for (var i = rows.length - 1; i >= 0; i--)
			{
				var row = rows[i];
				if (currentGroup === row)
				{
					found = true;
					continue;
				}

				if (found && this.getRowType(row) === 'group')
				{
					return this.getGroupByRow(row);
				}
			}

			return this.getDefaultProject();
		},

		getClosestTask: function(currentRow) {
			var rows = this.getRows();
			var index = currentRow ? currentRow.getIndex() - 1 : rows.length;

			for (var i = index - 1; i >= 0; i--)
			{
				if (this.getRowType(rows[i]) === 'task' && rows[i].getDepth() === '0')
				{
					return {
						task: rows[i],
						before: false,
					};
				}
			}

			for (i = index + 1; i < rows.length; i++)
			{
				if (this.getRowType(rows[i]) === 'task' && rows[i].getDepth() === '0')
				{
					return {
						task: rows[i],
						before: true,
					};
				}
			}

			return {
				task: null,
				before: true,
			};
		},
	};

	BX.Tasks.TourGuideController = function(options) {
		this.tours = options.tours;
		this.guide = null;

		this.isV2Form = options.isV2Form;

		this.initGuides(options);
	};

	BX.Tasks.TourGuideController.prototype = {
		initGuides: function(options) {
			var firstGridTaskCreation = this.tours.firstGridTaskCreation;
			var expiredTasksDeadlineChange = this.tours.expiredTasksDeadlineChange;

			if (firstGridTaskCreation.show)
			{
				this.guide = new BX.Tasks.TourGuideController.FirstGridTaskCreationTourGuide(options);
			}
			else if (expiredTasksDeadlineChange.show || expiredTasksDeadlineChange.backgroundCheck)
			{
				this.guide = new BX.Tasks.TourGuideController.ExpiredTasksDeadlineChangeTourGuide(options);
			}
		},

		getGuide: function() {
			return this.guide;
		},
	};

	BX.Tasks.TourGuideController.FirstGridTaskCreationTourGuide = function(options) {
		this.tour = options.tours.firstGridTaskCreation;
		this.popupData = this.tour.popupData;

		this.start();
	};

	BX.Tasks.TourGuideController.FirstGridTaskCreationTourGuide.prototype = {
		start: function() {
			const addButton = BX('tasks-buttonAdd');
			if (!addButton)
			{
				return;
			}

			if (this.isV2Form === false)
			{
				addButton.href = BX.Uri.addParam(
					addButton.href,
					{ FIRST_GRID_TASK_CREATION_TOUR_GUIDE: 'Y' },
				);
			}

			this.guide = new BX.UI.Tour.Guide({
				steps: [
					{
						target: addButton,
						title: this.popupData[0].title,
						text: this.popupData[0].text,
					},
				],
				onEvents: true,
			});

			if (this.isV2Form === false)
			{
				BX.addCustomEvent('UI.Tour.Guide:onFinish', function(event) {
					if (event.getData().guide === this.guide)
					{
						addButton.href = BX.Uri.removeParam(addButton.href, ['FIRST_GRID_TASK_CREATION_TOUR_GUIDE']);
					}
				}.bind(this));
			}

			this.showNextStep();
		},

		showNextStep: function() {
			setTimeout(function() {
				this.guide.showNextStep();
			}.bind(this), 500);
		},
	};

	BX.Tasks.TourGuideController.ExpiredTasksDeadlineChangeTourGuide = function(options) {
		this.userId = options.userId;
		this.tour = options.tours.expiredTasksDeadlineChange;
		this.popupData = this.tour.popupData;
		this.counterToCheck = this.tour.counterToCheck;

		this.rowId = 0;
		this.calendarPopup = 0;
		this.isStopped = false;
		this.viewMode = 'grid';
		this.ajaxActionPrefix = 'tasks.tourguide.expiredtasksdeadlinechange.';

		this.grid = BX.Main.gridManager.getInstanceById(options.gridId);

		if (this.tour.show)
		{
			this.start();
		}
		else if (this.tour.backgroundCheck)
		{
			this.isPullListening = true;
		}

		this.bindEvents();
	};

	BX.Tasks.TourGuideController.ExpiredTasksDeadlineChangeTourGuide.prototype = {
		bindEvents: function() {
			var eventHandlers = {
				user_counter: this.onUserCounter.bind(this),
			};
			BX.addCustomEvent('onPullEvent-tasks', function(command, params) {
				if (eventHandlers[command])
				{
					eventHandlers[command].apply(this, [params]);
				}
			}.bind(this));

			BX.addCustomEvent('UI.Tour.Guide:onPopupClose', function() {
				this.stop();
			}.bind(this));

			BX.addCustomEvent('UI.Tour.Guide:onFinish', function(event) {
				if (event.getData().guide === this.guide && this.getCurrentStepIndex() === 0)
				{
					BX.addCustomEvent('BX.Main.grid:paramsUpdated', BX.proxy(this.onExpiredCounterGridReloaded, this));
				}
			}.bind(this));
		},

		onUserCounter: function(data) {
			if (!this.isPullListening || this.userId !== Number(data.userId))
			{
				return;
			}

			var newCounter = Number(data[0].view_role_originator.expired) + Number(data[0].view_role_responsible.expired);
			if (newCounter >= Number(this.counterToCheck))
			{
				this.isPullListening = false;

				BX.ajax.runAction(this.ajaxActionPrefix + 'proceed', {
					analyticsLabel: {
						viewMode: this.viewMode,
					},
				}).then(function(result) {
					if (result.data)
					{
						this.start();
					}
				}.bind(this));
			}
		},

		start: function() {
			this.guide = new BX.UI.Tour.Guide({
				steps: [
					{
						target: document.querySelector('.tasks-counters--item-counter'),
						title: this.popupData[0].title,
						text: this.popupData[0].text,
					},
				],
				onEvents: true,
			});

			this.showNextStep();
		},

		markShowedStep: function(step) {
			BX.ajax.runAction(this.ajaxActionPrefix + 'markShowedStep', {
				analyticsLabel: {
					viewMode: this.viewMode,
					step: step,
				},
			});
		},

		onExpiredCounterGridReloaded: function() {
			BX.removeCustomEvent('BX.Main.grid:paramsUpdated', BX.proxy(this.onExpiredCounterGridReloaded, this));

			var target = null;
			Object.values(this.grid.getRows().getBodyChild()).forEach(function(row) {
				if (!this.rowId && row.getNode().querySelector('.ui-label.ui-label-danger.ui-label-fill.ui-label-link'))
				{
					this.rowId = row.getId();
					target = row.getNode().querySelector('.ui-label.ui-label-danger.ui-label-fill.ui-label-link');
				}
			}.bind(this));

			if (this.rowId > 0 && target)
			{
				this.guide.steps.push(
					new BX.UI.Tour.Step({
						target: target,
						title: this.popupData[1].title,
						text: this.popupData[1].text,
					}),
				);
				this.showNextStep();
			}
		},

		setCalendarPopup: function(popup) {
			if (!this.calendarPopup && this.getCurrentStepIndex() === 1)
			{
				this.calendarPopup = popup;

				BX.addCustomEvent(this.calendarPopup, 'onPopupAfterClose', BX.proxy(this.onCalendarPopupClose, this));
			}
		},

		onCalendarPopupClose: function() {
			BX.removeCustomEvent(this.calendarPopup, 'onPopupAfterClose', BX.proxy(this.onCalendarPopupClose, this));

			setTimeout(function() {
				BX.removeCustomEvent('Tasks.Tour.ExpiredTasksDeadlineChange:saveDeadline', BX.proxy(this.onDeadlineSave, this));
			}.bind(this), 500);

			BX.addCustomEvent('Tasks.Tour.ExpiredTasksDeadlineChange:saveDeadline', BX.proxy(this.onDeadlineSave, this));
		},

		onDeadlineSave: function() {
			BX.addCustomEvent('BX.Main.grid:paramsUpdated', BX.proxy(this.onGridReloaded, this));
		},

		onGridReloaded: function() {
			BX.removeCustomEvent('BX.Main.grid:paramsUpdated', BX.proxy(this.onGridReloaded, this));

			if (this.grid.getRows().getById(this.rowId) === null)
			{
				this.guide.steps.push(
					new BX.UI.Tour.Step({
						title: this.popupData[2].title,
						text: this.popupData[2].text,
						buttons: [
							{
								text: this.popupData[2].buttons[0],
								event: function() {
									this.stop();
								}.bind(this),
							},
						],
					}),
				);
				this.showNextStep();
			}
		},

		showNextStep: function() {
			if (this.isStopped)
			{
				return;
			}

			setTimeout(function() {
				this.guide.showNextStep();
				this.markShowedStep(this.getCurrentStepIndex());
			}.bind(this), 500);
		},

		getCurrentStepIndex: function() {
			return this.guide.currentStepIndex;
		},

		isCorrectRow: function(rowId) {
			return Number(this.rowId) === Number(rowId);
		},

		getIsStopped: function() {
			return this.isStopped;
		},

		stop: function() {
			this.isStopped = true;
			this.guide.close();
		},
	};
});


this.BX = this.BX || {};
(function (exports, main_core_events, main_core, tasks_taskModel, ui_entitySelector) {
	'use strict';

	const Action = Object.freeze({
		COMMENT_ADD: 'comment_add',
		TASK_ADD: 'task_add',
		TASK_UPDATE: 'task_update',
		TASK_VIEW: 'task_view',
		TASK_REMOVE: 'task_remove',
		TASK_TIMER_START: 'task_timer_start',
		TASK_TIMER_STOP: 'task_timer_stop',
		USER_OPTION_CHANGED: 'user_option_changed'
	});

	class ControllerTaskEvent {
		#timeout = 0;
		constructor(options = {}) {
			options = main_core.Type.isPlainObject(options) ? options : {};
			this.#timeout = options.timeout ?? 100;
		}
		resolveIdByParam(cmd, params) {
			if (this.#isDefinedAction(cmd)) {
				const inx = this.#resolveIndexByEvent(cmd, params);
				if (inx > 0) {
					return inx;
				} else {
					throw new Error("Index is not resolved for command: " + cmd);
				}
			}
		}
		#resolveIndexByEvent(cmd, params) {
			let result = '';
			if ([Action.TASK_ADD, Action.TASK_UPDATE, Action.TASK_REMOVE, Action.TASK_VIEW, Action.USER_OPTION_CHANGED].includes(cmd)) {
				result = params.TASK_ID;
			} else {
				result = params.taskId;
			}
			return result;
		}
		#isDefinedAction(value) {
			const types = Object.values(Action);
			return types.includes(value);
		}
		intervalEmitByParams(params) {
			return new Promise((resolve, reject) => {
				const items = Object.values(params);
				const tm = setInterval(() => {
					if (items.length === 0) {
						clearTimeout(tm);
						resolve();
						return;
					}
					const item = items.shift();
					const {
						poolItem,
						repository
					} = item;

					// console.log('poolItemsShift', items);
					this.#emit(poolItem, repository);
				}, this.#timeout);
			});
		}
		batchEmitByParams(params) {
			return new Promise((resolve, reject) => {
				const items = Object.values(params);
				// console.log('poolItemsShift', items);
				for (let inx in items) {
					if (!items.hasOwnProperty(inx)) {
						continue;
					}
					const item = items[inx];
					const {
						poolItem,
						repository
					} = item;
					this.#emit(poolItem, repository);
				}
				resolve();
			});
		}
		#emit(item, repository) {
			let [param] = Object.values(item);
			let [command] = Object.keys(item);
			let params = param.fields.params;
			// console.log('repository', repository);
			main_core_events.EventEmitter.emit('BX.Tasks.Event:onEmit', {
				command,
				params,
				repository
			});
		}
	}

	class ControllerTaskRepository {
		#repository = {
			collectionNear: new Map(),
			collectionGrid: new Map(),
			collection: new tasks_taskModel.TaskCollection(),
			collectionSiftThroughFilter: new tasks_taskModel.TaskCollection()
		};
		#internalize(fields, params) {
			const result = {};
			const items = {
				collectionSiftThroughFilter: {
					cmd: 'tasks.task.list',
					filter: {
						id: fields.id,
						returnAccess: fields.returnAccess,
						siftThroughFilter: {
							userId: fields.siftThroughFilter.userId,
							groupId: fields.siftThroughFilter.groupId
						}
					}
				},
				collection: {
					cmd: 'tasks.task.list',
					filter: {
						id: fields.id,
						returnAccess: fields.returnAccess
					}
				},
				collectionGrid: {
					cmd: 'tasks.task.getGridRows',
					filter: {
						id: fields.id
					},
					params: params.arParams
				},
				collectionNear: {
					cmd: 'tasks.task.getNearTasks',
					filter: {
						id: fields.id
					},
					navigation: params.navigation,
					params: params.arParams
				}
			};
			Object.keys(items).forEach(type => {
				const item = items[type];
				switch (type) {
					case 'collection':
					case 'collectionSiftThroughFilter':
						result[type] = {
							cmd: item.cmd,
							param: tasks_taskModel.TaskCollection.internalize(item.filter)
						};
						break;
					case 'collectionGrid':
					case 'collectionNear':
						result[type] = {
							cmd: item.cmd,
							param: {
								taskIds: main_core.Type.isArrayFilled(item.filter.id) ? item.filter.id : [item.filter.id],
								navigation: main_core.Type.isUndefined(item?.navigation) ? null : item.navigation,
								arParams: item.params
							}
						};
						break;
				}
			});
			return result;
		}
		#buildQuery(items) {
			const result = {};
			Object.keys(items).forEach(inx => {
				const item = items[inx];
				result[inx] = [item.cmd, item.param];
			});
			return result;
		}
		#init(type, items) {
			if (Object.keys(this.#repository).includes(type)) {
				switch (type) {
					case 'collection':
					case 'collectionSiftThroughFilter':
						this.#repository[type].init(items.tasks);
						break;
					case 'collectionNear':
					case 'collectionGrid':
						Object.keys(items).forEach(id => {
							if (id > 0) {
								const row = {};
								row[id] = items[id];
								this.#repository[type].set(main_core.Text.toNumber(id), row);
							}
						});
						break;
				}
			}
		}
		callByFilter(fields, params) {
			return new Promise((resolve, reject) => {
				const items = this.#internalize(fields, params);
				const sets = this.#buildQuery(items);
				if (Object.keys(sets).length > 0) {
					BX.rest.callBatch(sets, result => {
						Object.keys(sets).forEach(type => {
							let set = result[type] ?? null;
							if (main_core.Type.isNull(set) === false) {
								let items = set.answer.result;
								this.#init(type, items);
							}
						});
						resolve(this.get());
					});
				}
			});
		}
		get() {
			return this.#repository;
		}
	}

	class ControllerTask {
		static getRepository(items, context) {
			const taskRepository = new ControllerTaskRepository();
			const taskIds = [];
			items.forEach(item => {
				taskIds.push(item.data.id);
			});
			return new Promise((resolve, reject) => {
				// eslint-disable-next-line promise/catch-or-return
				taskRepository.callByFilter({
					id: taskIds,
					returnAccess: 'Y',
					siftThroughFilter: {
						userId: context.ownerId,
						groupId: context.groupId
					}
				}, {
					arParams: context.arParams,
					navigation: {
						pageNumber: context.getPageNumber(),
						pageSize: context.getPageSize()
					}
				}).then(() => {
					resolve(taskRepository.get());
				});
			});
		}
		static getRepositoryByCollectionPushEventsAsync(items, context) {
			const taskRepository = new ControllerTaskRepository();
			const id = ControllerTask.getValuesId(items);
			return new Promise((resolve, reject) => {
				taskRepository.callByFilter({
					id,
					returnAccess: 'Y',
					siftThroughFilter: {
						userId: context.ownerId,
						groupId: context.groupId
					}
				}, {
					arParams: context.arParams,
					navigation: {
						pageNumber: context.getPageNumber(),
						pageSize: context.getPageSize()
					}
				}).then(() => {
					const repository = taskRepository.get();
					main_core_events.EventEmitter.emit('BX.Tasks.ControllerTask:onGetRepository', {
						params: {
							items,
							repository
						}
					});
					resolve();
				});
			});
		}
		static emitByCollectionEventImitterEventsAsync(items) {
			const eventLib = new ControllerTaskEvent();
			const params = ControllerTask.prepareByPoolToEmit(items);
			return new Promise((resolve, reject) => {
				eventLib.batchEmitByParams(params).then(() => resolve());
			});
		}
		static getValuesId(collection) {
			const result = [];
			try {
				for (let inx in collection) {
					if (!collection.hasOwnProperty(inx)) {
						continue;
					}
					let [cmd] = Object.keys(collection[inx]);
					let [params] = Object.values(collection[inx]);
					let id = params.fields.id;
					if (result.includes(id) === false) {
						result.push(id);
					}
				}
			} catch (e) {}
			return result;
		}
		static getItemsByType(poolItems, type) {
			const result = [];
			Object.keys(poolItems).forEach(key => {
				const poolItem = poolItems[key];
				if (Object.keys(poolItem)[0] === type) {
					result.push(poolItem[type].fields);
				}
			});
			return result;
		}
		static sortedById(items) {
			items.sort((l, r) => l.id > r.id ? 1 : r.id < r.id ? -1 : 0);
			return items;
		}
		static prepareByPoolToEmit(items) {
			const result = [];
			const action = Action.USER_OPTION_CHANGED;
			Object.keys(items).forEach(key => {
				const item = items[key];
				const poolItems = item['default'].fields.params.items;
				const repository = item['default'].fields.params.repository;
				let poolItem = {};
				const sortedItems = ControllerTask.sortedById(ControllerTask.getItemsByType(poolItems, action));
				Object.keys(poolItems).forEach(key => {
					if (Object.keys(poolItems[key])[0] === action) {
						// ORDER actions user_option_changed BY ASC
						poolItem = {
							[action]: {
								fields: sortedItems.shift()
							}
						};
					} else {
						poolItem = poolItems[key];
					}
					result.push({
						poolItem,
						repository
					});
				});
			});
			// console.log('collection', result);
			return result;
		}
	}

	class GroupSelector extends main_core_events.EventEmitter {
		#userEntities = [{
			id: 'user',
			options: {
				emailUsers: true,
				inviteGuestLink: true
			},
			filters: [{
				id: 'tasks.distributedUserDataFilter'
			}]
		}, {
			id: 'department',
			options: {
				selectMode: 'usersOnly'
			}
		}];
		#projectEntities = [{
			id: 'project',
			filters: [{
				id: 'tasks.projectDataFilter'
			}]
		}];
		#entitiesByMode = {
			['user']: this.#userEntities,
			['group']: this.#projectEntities,
			['project']: this.#projectEntities,
			['all']: this.#userEntities.concat(this.#projectEntities)
		};
		#mode = 'user';
		#targetNodeId = null;
		#showAvatars = false;
		#enableSearch = false;
		#multiple = false;
		#context = 'TASKS';
		#dialog = null;
		constructor(data) {
			super(data);
			this.setEventNamespace('BX.Tasks.GroupSelector');
			this.#mode = data.mode;
			this.#targetNodeId = data.targetNodeId;
			this.#showAvatars = data.showAvatars;
			this.#enableSearch = data.enableSearch;
			this.#multiple = data.multiple;
			this.#context = data.context;
		}
		getDialog() {
			if (!this.#dialog) {
				this.#dialog = new ui_entitySelector.Dialog({
					targetNode: document.getElementById(this.#targetNodeId),
					showAvatars: this.#showAvatars,
					enableSearch: this.#enableSearch,
					multiple: this.#multiple,
					context: this.#context,
					entities: this.#entitiesByMode[this.#mode],
					events: {
						'Item:onSelect': event => this.onItemSelect(event),
						'onHide': event => {
							const dialog = event.getTarget();
							const targetNode = dialog.getTargetNode();
							const activeNode = document.activeElement;
							if (targetNode && (activeNode === document.body || dialog.getContainer().contains(activeNode))) {
								targetNode.focus();
							}
						}
					}
				});
			}
			return this.#dialog;
		}
		show() {
			if (this.#dialog === null) {
				this.getDialog();
			}
			this.#dialog.show();
		}
		onItemSelect(event) {
			this.emit('itemSelected', event.getData());
		}
	}

	exports.Action = Action;
	exports.ControllerTask = ControllerTask;
	exports.ControllerTaskEvent = ControllerTaskEvent;
	exports.ControllerTaskRepository = ControllerTaskRepository;
	exports.GroupSelector = GroupSelector;

})(this.BX.Tasks = this.BX.Tasks || {}, BX.Event, BX, BX.Tasks.TaskModel, BX.UI.EntitySelector);


//# sourceMappingURL=script.js.map