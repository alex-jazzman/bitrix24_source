/* eslint-disable */
this.BX = this.BX || {};
this.BX.Bizproc = this.BX.Bizproc || {};
(function (exports, main_core, ui_alerts, ui_entitySelector, main_popup, bizproc_a11y, bizproc_task, bizproc_types, ui_hint, bizproc_workflow_faces, bizproc_workflow_faces_summary, bizproc_workflow_result, ui_notification) {
	'use strict';

	class WorkflowLoader {
		loadWorkflows(ids) {
			return this.#runComponentAction('loadWorkflows', {
				ids
			});
		}
		#runComponentAction(action, data = {}) {
			return new Promise((resolve, reject) => {
				main_core.ajax.runComponentAction('bitrix:bizproc.user.processes', action, {
					mode: 'class',
					data
				}).catch(response => {
					reject(response);
				}).then(response => {
					resolve(response);
				});
			});
		}
	}

	class WorkflowRenderer {
		#currentUserId;
		#targetUserId;
		#data;
		#task;
		#inlineTaskView;
		#faces = null;
		constructor(data) {
			this.#data = data.workflow;
			this.#currentUserId = main_core.Type.isNumber(data.currentUserId) ? data.currentUserId : 0;
			this.#targetUserId = this.#data.userId;
			if (this.#data.task) {
				this.#task = new bizproc_task.Task(this.#data.task);
				if (main_core.Type.isArrayFilled(this.#task.controls.buttons)) {
					this.#task.setButtons(this.#task.buttons.map(button => ({
						onclick: () => data.userProcesses.doTask({
							taskId: this.#task.id,
							workflowId: this.#data.workflowId,
							taskName: this.#task.name,
							taskRequest: {
								[button.NAME]: button.VALUE
							}
						}),
						...button
					})));
				}
				this.#inlineTaskView = new bizproc_task.InlineTaskView({
					task: this.#task,
					responsibleUser: this.#targetUserId
				});
			}
		}
		renderProcess() {
			const itemName = main_core.Type.isString(this.#data?.name) ? this.#data.name : '';
			const typeName = main_core.Type.isString(this.#data?.typeName) ? this.#data.typeName : '';
			const documentUrl = this.#data.task?.url || this.#data.workflowUrl || this.#getWorkflowInfoUrl();
			const description = main_core.Type.isString(this.#data?.description) ? this.#data.description : '';
			const lengthLimit = 80;
			const collapsedDescription = main_core.Dom.create('span', {
				html: description?.replace(/(<br \/>)+/gm, ' ')
			}).textContent.replace(/\n+/, ' ').slice(0, lengthLimit);
			const collapsed = description?.length > lengthLimit;
			const descriptionNode = main_core.Tag.render`
			<span class="bp-user-processes__description">
				${description}
			</span>
		`;
			BX.UI.Hint.init(descriptionNode);
			const descriptionBox = main_core.Tag.render`
			<div class="bp-user-processes__description-box ${collapsed ? '' : '--expanded'}">
				<span class="bp-user-processes__short_description">
					${main_core.Text.encode(collapsedDescription)}
					...<a href="#" aria-expanded="false" class="bp-user-processes__description-link" data-testid="user-processes-description-more">${main_core.Loc.getMessage('BIZPROC_USER_PROCESSES_TEMPLATE_DESCRIPTION_MORE')}</a>
				</span>
				${descriptionNode}
			</div>
		`;
			const moreLink = descriptionBox.querySelector('.bp-user-processes__description-link');
			if (moreLink) {
				main_core.Event.bind(moreLink, 'click', event => {
					event.preventDefault();
					main_core.Dom.attr(moreLink, 'aria-expanded', 'true');
					main_core.Dom.addClass(descriptionBox, '--expanded');
					// the link gets hidden by CSS, move focus to the expanded text
					main_core.Dom.attr(descriptionNode, 'tabindex', '-1');
					descriptionNode.focus();
				});
			}
			return main_core.Tag.render`
				<div class="bp-user-processes">
					<a class="bp-user-processes__title-link ui-typography-text-lg"
						href="${main_core.Text.encode(documentUrl)}">${main_core.Text.encode(itemName)}
					</a>
					<div class="bp-user-processes__appointment">${main_core.Text.encode(typeName.toUpperCase())}</div>
					${descriptionBox}
			</div>
		`;
		}
		#getWorkflowInfoUrl() {
			const idParam = main_core.Type.isNil(this.#data.task?.id) ? this.#data.workflowId : this.#data.task.id;
			const uri = new main_core.Uri(`/company/personal/bizproc/${idParam}/`);
			return uri.toString();
		}
		renderTaskName() {
			return this.#inlineTaskView?.render();
		}
		renderTask() {
			if (!this.#data.task || this.#data.userId !== this.#currentUserId) {
				const completedClassName = this.#data.isCompleted ? '--success' : '';
				let resultNode = '';
				if (this.#data.isCompleted && this.#data.workflowResult !== null) {
					resultNode = new bizproc_workflow_result.WorkflowResult(this.#data.workflowResult).render();
				}
				return main_core.Tag.render`
				<div class="bp-status-panel ${completedClassName}">
					<div class="bp-status-item">
						<div class="bp-status-name">${main_core.Text.encode(this.#data.statusText.toUpperCase())}</div>
						${resultNode}
					</div>
				</div>
			`;
			}
			return this.renderTaskName();
		}
		renderDocumentName() {
			const documentName = main_core.Type.isString(this.#data?.document?.name) ? this.#data.document.name : '';
			if (main_core.Type.isString(this.#data?.document?.url)) {
				const url = new main_core.Uri(this.#data.document.url);
				return main_core.Tag.render`
				<a href="${main_core.Text.encode(url.toString())}">
					${main_core.Text.encode(documentName)}
				</a>
			`;
			}
			return main_core.Text.encode(documentName);
		}
		renderWorkflowFaces() {
			const target = main_core.Tag.render`<div></div>`;
			if (this.#data.workflowId && this.#data.taskProgress) {
				try {
					this.#faces = new bizproc_workflow_faces.WorkflowFaces({
						workflowId: this.#data.workflowId,
						targetUserId: this.#targetUserId,
						target,
						data: {
							steps: this.#data.taskProgress.steps,
							progressBox: this.#data.taskProgress.progressBox
						},
						showArrow: true
					});
					this.#faces.render();
				} catch (e) {
					console.error(e);
				}
			}
			return target;
		}
		renderSummary() {
			if (!this.#data.workflowId || !this.#data.taskProgress?.timeStep) {
				return null;
			}
			return new bizproc_workflow_faces_summary.Summary({
				workflowId: this.#data.workflowId,
				data: this.#data.taskProgress.timeStep
			}).render();
		}
		destroy() {
			this.#data = null;
			this.#task = null;
			this.#inlineTaskView = null;
			if (!main_core.Type.isNil(this.#faces)) {
				this.#faces.destroy();
				this.#faces = null;
			}
		}
	}

	class CounterPanel {
		constructor(options) {
			this.filterId = options.filterId;
			this.counters = options.counters;
		}
		renderTo(target) {
			this.uiPanel = new BX.UI.CounterPanel({
				target,
				multiselect: false,
				title: main_core.Loc.getMessage('BIZPROC_USER_PROCESSES_TEMPLATE_COUNTERS_LABEL'),
				items: [{
					id: 'task',
					value: {
						value: this.counters?.task || 0,
						order: 1
					},
					title: {
						value: main_core.Loc.getMessage('BIZPROC_USER_PROCESSES_TEMPLATE_COUNTERS_TASK'),
						order: 2
					},
					color: this.#getTaskColor(this.counters?.task),
					separator: false,
					eventsForActive: {
						click: this.#setFilterPreset.bind(this)
					},
					eventsForUnActive: {
						click: this.#setFilterPreset.bind(this, 'active_task')
					}
				}, {
					id: 'comment',
					value: this.counters?.comment || 0,
					title: main_core.Loc.getMessage('BIZPROC_USER_PROCESSES_TEMPLATE_COUNTERS_COMMENT'),
					color: this.#getCommentColor(this.counters?.comment),
					eventsForActive: {
						click: this.#setFilterPreset.bind(this)
					},
					eventsForUnActive: {
						click: this.#setFilterPreset.bind(this, 'comment')
					}
				}]
			});
			this.uiPanel.init();

			// counter items are clickable divs; panel binds its own click handlers,
			// so only role, tabindex and keyboard activation are added here
			target.querySelectorAll('.ui-counter-panel__item').forEach(item => {
				bizproc_a11y.makeActivatable(item, () => {});
			});
			this.#subscribeToPulls();
		}
		#subscribeToPulls() {
			BX.PULL.subscribe({
				moduleId: 'main',
				command: 'user_counter',
				callback: params => {
					const taskCounterValue = params[BX.message('SITE_ID')]?.bp_tasks ?? null;
					if (taskCounterValue !== null) {
						this.uiPanel.getItemById('task').updateValue(taskCounterValue);
						this.uiPanel.getItemById('task').updateColor(this.#getTaskColor(taskCounterValue));
					}
				}
			});
			BX.PULL.subscribe({
				moduleId: 'bizproc',
				command: 'comment',
				callback: params => {
					const allUnreadValue = params.counter?.allUnread ?? null;
					if (allUnreadValue !== null) {
						this.uiPanel.getItemById('comment').updateValue(allUnreadValue);
						this.uiPanel.getItemById('comment').updateColor(this.#getCommentColor(allUnreadValue));
					}
				}
			});
		}
		#getTaskColor(value) {
			return value > 0 ? 'DANGER' : 'THEME';
		}
		#getCommentColor(value) {
			return value > 0 ? 'SUCCESS' : 'THEME';
		}
		#setFilterPreset(presetId) {
			const filterManager = this.#getFilterManager();
			if (!filterManager) {
				return;
			}
			const api = filterManager.getApi();
			const fields = {
				SYSTEM_PRESET: presetId ?? 'in_work'
			};
			api.setFields(fields);
			api.apply();
		}
		#getFilterManager() {
			if (this.filterId) {
				return BX.Main.filterManager?.getById(this.filterId);
			}

			// eslint-disable-next-line no-console
			console.warn('Filter not found');
			return null;
		}
	}

	class UserProcesses {
		delegateToUserId = 0;
		#workflowTasks = new Map();
		#workflowRenderer = {};
		#targetUserId;
		#shownMobilePopup;
		#appLink;
		#gridSubscription = null;
		constructor(options) {
			let mustSubscribeToPushes = false;
			if (main_core.Type.isPlainObject(options)) {
				this.gridId = options.gridId;
				if (main_core.Type.isArray(options.errors)) {
					this.showErrors(options.errors);
				}
				this.actionPanel = {
					wrapperElementId: options.actionPanelUserWrapperId,
					actionButtonName: `${this.gridId}_action_button`
				};
				this.currentUserId = options.currentUserId;
				this.#targetUserId = options.targetUserId;
				this.#shownMobilePopup = options.shownMobilePopup;
				this.#appLink = options.appLink;
				mustSubscribeToPushes = options.mustSubscribeToPushes === true;
			}
			this.loader = new WorkflowLoader();
			if (mustSubscribeToPushes) {
				this.#subscribeToPushes();
			}
			this.#subscribeToTaskDo();
			this.subscribeGridEvents();
			this.init();
			this.initCounterPanel(options.counters, options.filterId);
		}
		#subscribeToPushes() {
			BX.PULL.subscribe({
				moduleId: 'bizproc',
				command: 'workflow',
				callback: params => {
					if (params.eventName === 'DELETED' || params.eventName === 'UPDATED') {
						params.items.forEach(workflow => this.removeWorkflow(workflow.id));
					}
					if (params.eventName === 'ADDED' || params.eventName === 'UPDATED') {
						const rowsCollectionWrapper = this.getGrid().getRows();
						let ids = params.items.map(workflow => workflow.id);
						if (params.eventName === 'ADDED') {
							ids = ids.filter(id => !rowsCollectionWrapper.getById(id));
						}
						if (ids.length > 0) {
							this.loader.loadWorkflows(ids).then(this.#updateWorkflows.bind(this)).catch(response => this.showErrors(response));
						}
					}
				}
			});
		}
		#subscribeToTaskDo() {
			BX.addCustomEvent('SidePanel.Slider:onMessage', event => {
				if (event.getEventId() === 'try-do-bp-task-event') {
					this.#hideRow(event.data.workflowId);
				} else if (event.getEventId() === 'error-do-bp-task-event') {
					this.#showRow(event.data.workflowId);
				} else if (event.getEventId() === 'success-do-bp-task-event') {
					ui_notification.UI.Notification.Center.notify({
						content: main_core.Loc.getMessage('BIZPROC_USER_PROCESSES_TEMPLATE_TASK_TOUCHED', {
							'#TASK_NAME#': main_core.Text.encode(event.data.taskName)
						})
					});
				}
			});
		}
		subscribeGridEvents() {
			this.unsubscribeGridEvents();
			this.#gridSubscription = bizproc_a11y.subscribeGridUpdated(this.gridId, () => bizproc_a11y.announce(main_core.Loc.getMessage('BIZPROC_USER_PROCESSES_TEMPLATE_GRID_UPDATED')));
		}
		unsubscribeGridEvents() {
			this.#gridSubscription?.destroy();
			this.#gridSubscription = null;
		}
		destroy() {
			this.unsubscribeGridEvents();
		}
		#updateWorkflows(response) {
			const {
				workflows
			} = response.data;
			if (!main_core.Type.isArray(workflows)) {
				// eslint-disable-next-line no-console
				console.warn('Unexpected response from server. Expected workflow.data to be an array');
				return;
			}
			const gridRealtime = this.getGrid()?.getRealtime();
			if (gridRealtime) {
				let lastWorkflowId = null;
				workflows.forEach(workflow => {
					const isActual = Boolean(workflow.taskCnt > 0 || workflow.commentCnt > 0 || workflow.startedById === this.currentUserId && workflow.isCompleted === false);
					if (isActual) {
						this.#appendWorkflow({
							workflow,
							renderer: this.#createWorkflowRenderer(workflow.workflowId, workflow),
							insertAfter: lastWorkflowId
						});
						lastWorkflowId = workflow.workflowId;
					}
				});
			}
		}
		#appendWorkflow({
			workflow,
			renderer,
			insertAfter
		}) {
			if (workflow.task) {
				this.#workflowTasks.set(workflow.workflowId, workflow.task.id);
			}
			const gridRealtime = this.getGrid()?.getRealtime();
			if (!gridRealtime) {
				return;
			}
			const addRowOptions = this.getDefaultAddRowOptions(workflow, renderer);
			if (main_core.Type.isStringFilled(insertAfter)) {
				addRowOptions.insertAfter = insertAfter;
			} else {
				addRowOptions.prepend = true;
			}
			gridRealtime.addRow(addRowOptions);

			// temporary crutches for the GRID :-)
			const row = this.getGrid()?.getRows().getById(workflow.workflowId);
			if (row) {
				if (addRowOptions.columnClasses) {
					for (const [columnId, columnClass] of Object.entries(addRowOptions.columnClasses)) {
						if (columnClass) {
							main_core.Dom.addClass(row.getCellById(columnId), columnClass);
						}
					}
				}
				main_core.Dom.addClass(row.getNode(), 'main-ui-grid-show-new-row');
				main_core.Event.bind(row.getNode(), 'animationend', event => {
					if (event.animationName === 'showNewRow') {
						main_core.Dom.removeClass(row.getNode(), 'main-ui-grid-show-new-row');
					}
				});
			}
		}
		getDefaultAddRowOptions(workflow, renderer) {
			const actions = [{
				text: main_core.Loc.getMessage('BIZPROC_USER_PROCESSES_TEMPLATE_ROW_ACTION_DOCUMENT'),
				href: workflow.document.url || '#'
			}];
			if (workflow.task) {
				actions.push({
					text: main_core.Loc.getMessage('BIZPROC_USER_PROCESSES_TEMPLATE_ROW_ACTION_TASK'),
					href: workflow.task.url
				});
			}
			return {
				id: workflow.workflowId,
				animation: false,
				columns: {
					ID: workflow.workflowId,
					PROCESS: renderer.renderProcess(),
					TASK_PROGRESS: renderer.renderWorkflowFaces(),
					TASK: renderer.renderTask(),
					WORKFLOW_STATE: main_core.Text.encode(workflow.statusText),
					DOCUMENT_NAME: renderer.renderDocumentName(),
					WORKFLOW_TEMPLATE_NAME: main_core.Text.encode(workflow.templateName),
					TASK_DESCRIPTION: main_core.Dom.create('span', {
						html: workflow.description || ''
					}),
					MODIFIED: main_core.Text.encode(workflow.modified),
					WORKFLOW_STARTED: main_core.Text.encode(workflow.workflowStarted),
					WORKFLOW_STARTED_BY: main_core.Text.encode(workflow.startedBy),
					OVERDUE_DATE: main_core.Text.encode(workflow.overdueDate),
					SUMMARY: renderer.renderSummary()
				},
				actions,
				columnClasses: {
					TASK_PROGRESS: 'bp-task-progress-cell',
					SUMMARY: 'bp-summary-cell',
					TASK: workflow.isCompleted ? 'bp-status-completed-cell' : '',
					TASK_DESCRIPTION: 'bp-description-cell'
				},
				counters: this.#getCountersOption(workflow),
				editable: Boolean(workflow.task)
			};
		}
		#getCountersOption(workflow) {
			const counters = {};
			if (this.#targetUserId === this.currentUserId && (workflow.taskCnt > 0 || workflow.commentCnt > 0)) {
				const primaryColor = workflow.taskCnt === 0 && workflow.commentCnt > 0 ? BX.Grid.Counters.Color.SUCCESS : BX.Grid.Counters.Color.DANGER;
				counters.MODIFIED = {
					type: BX.Grid.Counters.Type.LEFT,
					color: primaryColor,
					secondaryColor: BX.Grid.Counters.Color.SUCCESS,
					value: (workflow.taskCnt || 0) + (workflow.commentCnt || 0),
					isDouble: workflow.taskCnt > 0 && workflow.commentCnt > 0
				};
			}
			return counters;
		}
		init() {
			this.actionPanel.userWrapperElement = document.getElementById(this.actionPanel.wrapperElementId);
			this.initUserSelector();
			this.renderCells();
			this.#applyGridA11y();
			this.onActionPanelChanged();
		}
		#applyGridA11y() {
			const container = this.getGrid()?.getContainer();
			if (!main_core.Type.isDomNode(container)) {
				return;
			}
			bizproc_a11y.enhanceGrid(container, {
				gridId: this.gridId,
				rowActionsLabel: main_core.Loc.getMessage('BIZPROC_USER_PROCESSES_TEMPLATE_ROW_ACTIONS_LABEL'),
				checkboxesFromTitle: true
			});
		}
		initCounterPanel(counters, filterId) {
			const panelWrapperNode = document.querySelector('[data-role="bizproc-counterpanel"]');
			if (!panelWrapperNode) {
				return;
			}
			new CounterPanel({
				counters,
				filterId
			}).renderTo(panelWrapperNode);
		}
		renderCells() {
			const updated = new Map();
			document.querySelectorAll('[data-role="bp-render-cell"]').forEach(target => {
				const workflow = main_core.Dom.attr(target, 'data-workflow');
				const columnId = main_core.Dom.attr(target, 'data-column');
				if (workflow) {
					if (!updated.has(workflow.workflowId)) {
						this.#deleteWorkflowRendererById(workflow.workflowId);
						updated.set(workflow.workflowId);
					}
					if (workflow.task) {
						// set workflow task map
						this.#workflowTasks.set(workflow.workflowId, workflow.task.id);
					}
					this.renderColumnCell(target, columnId, workflow);
				}
			});
		}
		renderColumnCell(target, columnId, workflow) {
			const renderer = this.#getWorkflowRendererById(String(workflow.workflowId)) ?? this.#createWorkflowRenderer(String(workflow.workflowId), workflow);
			let childNode = null;
			switch (columnId) {
				case 'DOCUMENT_NAME':
					childNode = renderer.renderDocumentName();
					break;
				case 'PROCESS':
					childNode = renderer.renderProcess();
					break;
				case 'TASK_PROGRESS':
					childNode = renderer.renderWorkflowFaces();
					break;
				case 'TASK':
					childNode = renderer.renderTask();
					break;
				case 'SUMMARY':
					childNode = renderer.renderSummary();
					break;
				case 'MODIFIED':
					childNode = renderer.renderModified();
					break;
				// do nothing
			}
			if (childNode) {
				main_core.Dom.replace(target, childNode);
			}
		}
		clickStartWorkflowButton() {
			main_core.Runtime.loadExtension('bizproc.router').then(({
				Router
			}) => {
				Router.openUserProcessesStart();
			}).catch(e => console.error(e));
			main_core.Runtime.loadExtension('ui.analytics').then(({
				sendData
			}) => {
				sendData({
					tool: 'automation',
					category: 'bizproc_operations',
					event: 'drawer_open',
					c_section: 'bizproc',
					c_element: 'button'
				});
			}).catch(() => {});
		}
		creationGuideOpen(params) {
			main_core.Runtime.loadExtension('lists.element.creation-guide').then(({
				CreationGuide
			}) => {
				CreationGuide?.open(params);
			}).catch(() => {});
		}
		initUserSelector() {
			if (!this.delegateToSelector) {
				this.delegateToSelector = new ui_entitySelector.TagSelector({
					multiple: false,
					tagMaxWidth: 180,
					events: {
						onTagAdd: event => {
							this.delegateToUserId = parseInt(event.getData().tag.getId(), 10);
							if (!main_core.Type.isInteger(this.delegateToUserId)) {
								this.delegateToUserId = 0;
							}
						},
						onTagRemove: () => {
							this.delegateToUserId = 0;
						}
					},
					dialogOptions: {
						entities: [{
							id: 'user',
							options: {
								intranetUsersOnly: true,
								inviteEmployeeLink: false
							}
						}]
					}
				});
			}
			if (main_core.Type.isDomNode(this.actionPanel.userWrapperElement)) {
				main_core.Dom.clean(this.actionPanel.userWrapperElement);
				this.delegateToSelector.renderTo(this.actionPanel.userWrapperElement);
				main_core.Dom.attr(this.actionPanel.userWrapperElement, {
					role: 'group',
					'aria-label': main_core.Loc.getMessage('BIZPROC_USER_PROCESSES_TEMPLATE_DELEGATE_TO_LABEL')
				});
			}
		}
		showErrors(errors) {
			if (!main_core.Type.isArrayFilled(errors)) {
				if (!main_core.Type.isArray(errors)) {
					console.error(errors);
				}
				return;
			}
			const errorsContainer = document.getElementById('bp-user-processes-errors-container');
			if (errorsContainer) {
				let errorCounter = 0;
				const fixStyles = () => {
					if (errorCounter > 0) {
						main_core.Dom.style(errorsContainer, {
							margin: '10px'
						});
					} else {
						main_core.Dom.style(errorsContainer, {
							margin: '0px'
						});
					}
				};
				for (const error of errors) {
					errorCounter += 1;
					const alert = new ui_alerts.Alert({
						text: main_core.Text.encode(error.message),
						color: ui_alerts.AlertColor.DANGER,
						closeBtn: true,
						animated: true
					});
					alert.renderTo(errorsContainer);
					if (alert.getCloseBtn()) {
						// eslint-disable-next-line no-loop-func
						alert.getCloseBtn().onclick = () => {
							errorCounter -= 1;
							fixStyles();
						};
					}
				}
				fixStyles();
			}
		}
		onActionPanelChanged() {
			const grid = this.getGrid();
			const actionPanel = grid?.getActionsPanel();
			if (actionPanel) {
				const action = actionPanel.getValues()[this.actionPanel.actionButtonName];
				if (!main_core.Type.isString(action) || action.includes('set_status')) {
					main_core.Dom.hide(this.actionPanel.userWrapperElement);
				} else {
					main_core.Dom.show(this.actionPanel.userWrapperElement);
				}
			}
		}
		applyActionPanelValues() {
			const grid = this.getGrid();
			const actionsPanel = grid?.getActionsPanel();
			if (grid && actionsPanel) {
				const isApplyingForAll = actionsPanel.getForAllCheckbox()?.checked === true;
				// TODO - implement doing all tasks
				if (isApplyingForAll) {
					this.showErrors([{
						message: 'Not implemented currently'
					}]);
				}
				const action = actionsPanel.getValues()[this.actionPanel.actionButtonName];
				if (main_core.Type.isString(action)) {
					const selectedTasks = this.getSelectedTaskIds(grid.getRows().getSelectedIds());
					if (selectedTasks.length === 0) {
						// todo: show error?

						return;
					}
					if (action.includes('set_status_')) {
						const status = parseInt(action.split('_').pop(), 10);
						if (main_core.Type.isNumber(status)) {
							this.setTasksStatuses(selectedTasks, status);
						}
					} else if (action.startsWith('delegate_to')) {
						this.delegateTasks(selectedTasks, this.delegateToUserId);
					}
				}
			}
		}
		getSelectedTaskIds(selectedWorkflowIds) {
			return selectedWorkflowIds.map(workflowId => this.#workflowTasks.get(workflowId)).filter(taskId => main_core.Type.isNumber(taskId));
		}
		setTasksStatuses(taskIds, newStatus) {
			// eslint-disable-next-line promise/catch-or-return
			main_core.ajax.runAction('bizproc.task.doInlineTasks', {
				data: {
					taskIds,
					newStatus
				}
			}).catch(response => {
				this.showErrors(response.errors);
				this.reloadGrid();
			})
			// .then(() => this.reloadGrid())
	;
		}
		delegateTasks(taskIds, toUserId) {
			// eslint-disable-next-line promise/catch-or-return
			main_core.ajax.runComponentAction('bitrix:bizproc.user.processes', 'delegateTasks', {
				mode: 'class',
				data: {
					taskIds,
					toUserId
				}
			}).then(() => bizproc_a11y.announce(main_core.Loc.getMessage('BIZPROC_USER_PROCESSES_TEMPLATE_TASKS_DELEGATED'))).catch(response => {
				this.showErrors(response.errors);
				this.reloadGrid();
			})
			// .then(() => this.reloadGrid())
	;
		}
		reloadGrid() {
			this.getGrid()?.reload();
		}
		doTask(props) {
			this.#hideRow(props.workflowId);
			main_core.ajax.runAction('bizproc.task.do', {
				data: props
			}).then(() => {
				if (props.taskName) {
					ui_notification.UI.Notification.Center.notify({
						content: main_core.Loc.getMessage('BIZPROC_USER_PROCESSES_TEMPLATE_TASK_TOUCHED', {
							'#TASK_NAME#': main_core.Text.encode(props.taskName)
						})
					});
				}
			}).catch(response => {
				this.showErrors(response.errors);
				this.#showRow(props.workflowId);
			});
		}
		removeWorkflow(workflowId) {
			if (!this.#shownMobilePopup && this.#workflowTasks.has(workflowId)) {
				const mobile = new BX.UI.MobilePromoter({
					title: main_core.Loc.getMessage('BIZPROC_USER_PROCESSES_POPUP_PUSH_TITLE'),
					content: this.getPopupContent(),
					position: {
						right: 30,
						bottom: 30
					},
					qrContent: this.#appLink,
					analytics: {
						c_section: 'bizproc'
					}
				});
				mobile.show();
				BX.userOptions.save('bizproc.user.processes', 'mobile_promotion_popup', 'shown_popup', 'Y', false);
				this.#shownMobilePopup = true;
			}
			this.#hideRow(workflowId, true);
			this.#deleteWorkflowRendererById(workflowId);
			this.#workflowTasks.delete(workflowId);
		}
		getPopupContent() {
			return main_core.Tag.render`
			<div class="ui-mobile-promoter__content-wrapper">
				<ul class="ui-mobile-promoter__popup-list">
					<li class="ui-mobile-promoter__popup-list-item">
						${main_core.Loc.getMessage('BIZPROC_USER_PROCESSES_POPUP_PUSH_DO_PROCESS')}
					</li>
					<li class="ui-mobile-promoter__popup-list-item">
						${main_core.Loc.getMessage('BIZPROC_USER_PROCESSES_POPUP_PUSH_REACT')}
					</li>
					<li class="ui-mobile-promoter__popup-list-item">
						${main_core.Loc.getMessage('BIZPROC_USER_PROCESSES_POPUP_PUSH_CONTROL')}
					</li>
				</ul>
				<div class="ui-mobile-promoter__popup-desc">${main_core.Loc.getMessage('UI_MOBILE_PROMOTER_DESC')}</div>
				<div class="ui-mobile-promoter__popup-info">${main_core.Loc.getMessage('UI_MOBILE_PROMOTER_INFO')}</div>
			</div>
		`;
		}
		getGrid() {
			if (this.gridId) {
				return BX.Main.gridManager?.getInstanceById(this.gridId);
			}

			// eslint-disable-next-line no-console
			console.warn('Grid not found');
			return null;
		}
		#createWorkflowRenderer(workflowId, workflow) {
			this.#workflowRenderer[workflowId] = new WorkflowRenderer({
				userProcesses: this,
				currentUserId: this.currentUserId,
				workflow
			});
			return this.#workflowRenderer[workflowId];
		}
		#getWorkflowRendererById(workflowId) {
			return main_core.Type.isNil(this.#workflowRenderer[workflowId]) ? null : this.#workflowRenderer[workflowId];
		}
		#deleteWorkflowRendererById(workflowId) {
			const renderer = this.#getWorkflowRendererById(workflowId);
			if (renderer) {
				renderer.destroy();
				delete this.#workflowRenderer[workflowId];
			}
		}
		#hideRow(id, remove = false) {
			const grid = this.getGrid();
			const row = grid?.getRows().getById(id);
			if (row) {
				row.hide();
				if (remove) {
					main_core.Dom.remove(row.getNode());
				}
				if (grid.getRows().getCountDisplayed() === 0) {
					grid.getRealtime().showStub();
				}
			}
		}
		#showRow(id) {
			const row = this.getGrid()?.getRows().getById(id);
			if (row) {
				row.show();
				main_core.Dom.addClass(row.getNode(), 'main-ui-grid-show-new-row');
				main_core.Event.bind(row.getNode(), 'animationend', event => {
					if (event.animationName === 'showNewRow') {
						main_core.Dom.removeClass(row.getNode(), 'main-ui-grid-show-new-row');
					}
				});
			}
		}
	}

	exports.UserProcesses = UserProcesses;

})(this.BX.Bizproc.Component = this.BX.Bizproc.Component || {}, BX, BX.UI, BX.UI.EntitySelector, BX.Main, BX.Bizproc.A11y, BX.Bizproc, BX.Bizproc, BX.UI, BX.Bizproc.Workflow, BX.Bizproc.Workflow.Faces, BX.Bizproc.Workflow.Result, BX.UI.Notification);
//# sourceMappingURL=script.js.map
