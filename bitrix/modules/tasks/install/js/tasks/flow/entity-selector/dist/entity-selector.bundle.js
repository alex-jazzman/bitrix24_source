/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
(function (exports, ui_entitySelector, ui_infoHelper, main_core, main_core_events, ui_buttons) {
	'use strict';

	class Footer extends ui_entitySelector.DefaultFooter {
		render() {
			const element = main_core.Tag.render`
			<span class="ui-selector-footer-link ui-selector-footer-link-add">
				${main_core.Loc.getMessage('TASKS_FLOW_ENTITY_SELECTOR_FOOTER_CREATE_FLOW')}
			</span>
		`;
			main_core.Event.bind(element, 'click', this.#onCreateFlowButtonClicked.bind(this));
			return element;
		}
		#onCreateFlowButtonClicked() {
			return new Promise(resolve => {
				// eslint-disable-next-line promise/catch-or-return
				top.BX.Runtime.loadExtension('tasks.flow.edit-form').then(async exports => {
					const editForm = await exports.EditForm.createInstance({
						flowName: '',
						isFeatureTrialable: this.getOption('isFeatureTrialable'),
						context: this.getOption('context', '')
					});
					editForm.subscribe('afterSave', baseEvent => {
						resolve(baseEvent.getData());
					});
					editForm.subscribe('afterClose', baseEvent => {
						resolve();
					});
				});
			}).then(createdFlowData => {
				if (createdFlowData) {
					this.#onFlowCreated(createdFlowData);
				}
			});
		}
		#onFlowCreated(createdFlowData) {
			const item = this.getDialog().addItem({
				tabs: 'recents',
				id: createdFlowData.id,
				entityId: 'flow',
				title: createdFlowData.name,
				customData: {
					groupId: createdFlowData.groupId,
					templateId: createdFlowData.templateId
				}
			});
			item.select();
		}
	}

	class AbstractToggleFlow {
		onSelectFlow(event, itemBeforeUpdate) {
			throw new Error('AbstractToggleFlow: Calling an abstract changeFlow() without implementation');
		}
		onDeselectFlow(event, selectedItem) {
			throw new Error('AbstractToggleFlow: Calling an abstract unChangeFlow() without implementation');
		}
		showConfirmChangeFlow(doneCallback, cancelCallback) {
			BX.UI.Dialogs.MessageBox.show({
				message: main_core.Loc.getMessage('TASKS_FLOW_ENTITY_SELECTOR_CHANGE_MESSAGE'),
				title: main_core.Loc.getMessage('TASKS_FLOW_ENTITY_SELECTOR_CHANGE_TITLE'),
				onOk: () => {
					doneCallback();
				},
				okCaption: main_core.Loc.getMessage('TASKS_FLOW_ENTITY_SELECTOR_CHANGE_OK_CAPTION'),
				cancelCallback: messageBox => {
					cancelCallback();
					messageBox.close();
				},
				cancelCaption: main_core.Loc.getMessage('TASKS_FLOW_ENTITY_SELECTOR_CHANGE_CANCEL_CAPTION'),
				buttons: BX.UI.Dialogs.MessageBoxButtons.OK_CANCEL,
				popupOptions: {
					events: {
						onPopupClose: () => {
							cancelCallback();
						}
					}
				}
			});
		}
	}

	const Scope = Object.freeze({
		taskView: 'taskView',
		taskEdit: 'taskEdit'
	});

	class TaskEditToggleFlow extends AbstractToggleFlow {
		#params;
		constructor(params) {
			super();
			this.#params = params;
		}
		onSelectFlow(event, itemBeforeUpdate) {
			const dialog = event.getTarget();
			const selectedItem = event.getData().item;
			const flowId = parseInt(selectedItem.id, 10);
			const groupId = parseInt(selectedItem.customData.get('groupId'), 10);
			const templateId = parseInt(selectedItem.customData.get('templateId'), 10);
			window.onbeforeunload = () => {};
			if (this.#shouldShowConfirmChangeFlow()) {
				const rollback = () => {
					dialog.getItem(itemBeforeUpdate).select(true);
				};
				this.showConfirmChangeFlow(this.#bindFlow.bind(this, flowId, groupId, templateId), rollback);
				return;
			}
			this.#bindFlow(flowId, groupId, templateId);
		}
		#bindFlow(flowId, groupId, templateId) {
			const currentUri = new BX.Uri(decodeURI(location.href));
			currentUri.setQueryParam('FLOW_ID', flowId);
			currentUri.setQueryParam('GROUP_ID', groupId);
			if (templateId) {
				currentUri.setQueryParam('TEMPLATE', templateId);
			} else {
				currentUri.removeQueryParam('TEMPLATE');
			}
			currentUri.removeQueryParam('EVENT_TYPE');
			currentUri.removeQueryParam('EVENT_TASK_ID');
			currentUri.removeQueryParam('EVENT_OPTIONS');
			currentUri.removeQueryParam('NO_FLOW');
			const immutable = this.#params.immutable;
			Object.entries(immutable).forEach(([key, value]) => {
				currentUri.setQueryParam(key, value);
			});
			const demoSuffix = this.#params.isFeatureTrialable ? 'Y' : 'N';
			currentUri.setQueryParams({
				ta_cat: 'task_operations',
				ta_sec: 'flows',
				ta_sub: 'flows_grid',
				ta_el: 'flow_selector',
				p1: `isDemo_${demoSuffix}`
			});
			location.href = currentUri.getPath() + currentUri.getQuery();
		}
		onDeselectFlow(event, selectedItem) {
			if (selectedItem !== null) {
				return;
			}
			window.onbeforeunload = () => {};
			if (this.#shouldShowConfirmChangeFlow()) {
				const rollback = () => {
					const dialog = event.getTarget();
					const deselectedItem = event.getData().item;
					dialog.getItem(deselectedItem).select(true);
				};
				this.showConfirmChangeFlow(this.#unBindFlow.bind(this), rollback);
				return;
			}
			this.#unBindFlow();
		}
		#unBindFlow() {
			const currentUri = new BX.Uri(decodeURI(location.href));
			currentUri.removeQueryParam('FLOW_ID', 'GROUP_ID', 'TEMPLATE');
			currentUri.removeQueryParam('EVENT_TYPE');
			currentUri.removeQueryParam('EVENT_TASK_ID');
			currentUri.removeQueryParam('EVENT_OPTIONS');
			currentUri.setQueryParam('NO_FLOW', 1);
			const immutable = this.#params.immutable;
			Object.entries(immutable).forEach(([key, value]) => {
				currentUri.setQueryParam(key, value);
			});
			location.href = currentUri.getPath() + currentUri.getQuery();
		}
		#shouldShowConfirmChangeFlow() {
			const description = this.#getEditorText().trim();
			const hasDescription = description.length > 0;
			if (!hasDescription) {
				return false;
			}
			const isNewTask = Number(this.#params.taskId) === 0;
			if (isNewTask) {
				return true;
			}
			const taskDescription = this.#params.taskDescription;
			return !this.#removeBBCode(taskDescription).includes(description);
		}
		#getEditorText() {
			const container = document.querySelector('[data-bx-id="task-edit-editor-container"]');
			const isBBCode = main_core.Dom.style(container.querySelector('.bxhtmled-iframe-cnt'), 'display') === 'none';
			if (isBBCode) {
				const textArea = container.querySelector('.bxhtmled-textarea');
				return textArea.value;
			}
			const editor = container.querySelector('.bx-editor-iframe').contentDocument;
			return editor.body.innerText;
		}
		#removeBBCode(text) {
			return text.replaceAll(/\[(user|icon|color|size|url|b|i|u|s)(?:=[^\]]*)?](.*?)\[\/\1]/gi, '$2');
		}
	}

	class TaskViewToggleFlow extends AbstractToggleFlow {
		#taskId;
		#currentFlowId;
		constructor(params) {
			super();
			this.#taskId = params.taskId;
			this.#currentFlowId = params.flowId;
		}
		onSelectFlow(event, itemBeforeUpdate) {
			const selectedItem = event.getData().item;
			const flowId = parseInt(selectedItem.id, 10);
			this.#updateFlow(flowId);
		}
		onDeselectFlow(event, selectedItem) {
			const unSelectedItem = event.getData().item;
			const unSelectedFlowId = parseInt(unSelectedItem.id, 10);
			if (unSelectedFlowId === this.#currentFlowId) {
				this.#unBindFlow();
			}
		}
		#unBindFlow() {
			this.#updateFlow(0);
		}
		async #updateFlow(flowId) {
			const flowIdBeforeUpdate = this.#currentFlowId;
			this.#currentFlowId = flowId;
			try {
				await main_core.ajax.runAction('tasks.task.update', {
					data: {
						taskId: this.#taskId,
						fields: {
							FLOW_ID: flowId
						}
					}
				});
			} catch {
				this.#currentFlowId = flowIdBeforeUpdate;
			}
		}
	}

	class ToggleFlowFactory {
		static get(toggleFlowParams) {
			// eslint-disable-next-line sonarjs/no-small-switch
			switch (toggleFlowParams.scope) {
				case Scope.taskView:
					return new TaskViewToggleFlow(toggleFlowParams);
				default:
					return new TaskEditToggleFlow(toggleFlowParams);
			}
		}
	}

	class EntitySelectorDialog {
		#toggleFlow;
		#flowParams;
		#canCreateFlow;
		#dialog;
		#selectedItemBeforeUpdate;
		constructor(params) {
			this.#flowParams = params.flowParams;
			this.#canCreateFlow = params.canCreateFlow;
			this.#toggleFlow = ToggleFlowFactory.get(params.toggleFlowParams);
			this.#selectedItemBeforeUpdate = null;
		}
		show(target) {
			if (!this.#flowParams.isFeatureEnabled) {
				ui_infoHelper.InfoHelper.show(this.#flowParams.limitCode);
				return;
			}
			if (!this.#dialog) {
				this.#createDialog(target);
			}
			this.#dialog.show();
		}
		#createDialog(target) {
			this.#dialog = new ui_entitySelector.Dialog({
				targetNode: target,
				width: 350,
				height: 400,
				multiple: false,
				dropdownMode: true,
				enableSearch: true,
				cacheable: true,
				preselectedItems: [['flow', this.#flowParams.id]],
				entities: [{
					id: 'flow',
					options: {
						onlyActive: true
					},
					dynamicLoad: true,
					dynamicSearch: true
				}],
				events: {
					'Item:onBeforeSelect': event => {
						const dialog = event.getTarget();
						this.#selectedItemBeforeUpdate = dialog.getSelectedItems()[0];
					},
					'Item:onBeforeDeselect': event => {
						const dialog = event.getTarget();
						this.#selectedItemBeforeUpdate = dialog.getSelectedItems()[0];
						dialog.hide();
					},
					'Item:onSelect': event => {
						this.#toggleFlow.onSelectFlow(event, this.#selectedItemBeforeUpdate);
					},
					'Item:onDeselect': event => {
						setTimeout(() => {
							const dialog = event.getTarget();
							this.#toggleFlow.onDeselectFlow(event, dialog.getSelectedItems()[0] ?? null);
						}, 100);
					},
					'Search:onItemCreateAsync': event => {
						return new Promise(resolve => {
							/** @type  {BX.UI.EntitySelector.Item} */
							const {
								searchQuery
							} = event.getData();
							/** @type  {BX.UI.EntitySelector.Dialog} */
							const dialog = event.getTarget();
							this.#createFlow(searchQuery.getQuery()).then(createdFlowData => {
								if (createdFlowData) {
									const item = dialog.addItem({
										tabs: 'recents',
										id: createdFlowData.id,
										entityId: 'flow',
										title: createdFlowData.name,
										customData: {
											groupId: createdFlowData.groupId,
											templateId: createdFlowData.templateId
										}
									});
									item.select();
									resolve();
								} else {
									resolve();
								}
							});
						});
					}
				},
				searchOptions: {
					allowCreateItem: this.#canCreateFlow,
					footerOptions: {
						label: BX.Loc.getMessage('TASKS_FLOW_ENTITY_SELECTOR_CREATE_BUTTON')
					}
				},
				recentTabOptions: {
					stub: 'BX.Tasks.Flow.EmptyStub',
					stubOptions: {
						showArrow: this.#canCreateFlow
					}
				}
			});
			if (this.#canCreateFlow) {
				this.#dialog = this.#addFooter(this.#dialog);
			}
			return this.#dialog;
		}
		#createFlow(flowName) {
			return main_core.Runtime.loadExtension('tasks.flow.edit-form').then(exports => exports.EditForm.createInstance({
				flowName,
				isFeatureTrialable: this.#flowParams.isFeatureTrialable,
				context: this.#flowParams.context ?? ''
			})).then(editForm => {
				return new Promise(resolve => {
					editForm.subscribe('afterSave', baseEvent => {
						resolve(baseEvent.getData());
					});
					editForm.subscribe('afterClose', () => {
						resolve();
					});
				});
			});
		}
		#addFooter(dialog) {
			const footer = new Footer(this.#dialog, {
				isFeatureTrialable: this.#flowParams.isFeatureTrialable,
				context: this.#flowParams.context ?? ''
			});
			dialog.setFooter(footer.render());
			return dialog;
		}
	}

	class EmptyStub extends ui_entitySelector.BaseStub {
		#showArrow = true;
		constructor(tab, options) {
			super(tab, options);
			this.#showArrow = options.showArrow;
		}
		render() {
			return main_core.Tag.render`
			<div class="tasks-flow__stub-container">
					<div class="tasks-flow__stub-title">
							${main_core.Loc.getMessage('TASKS_FLOW_ENTITY_SELECTOR_STUB_TITLE')}
					</div>
					<div class="tasks-flow__stub-icon"></div>
					<div class="tasks-flow__stub-subtitle-container">
						${this.#showArrow ? this.#renderArrow() : ''}
						<div class="tasks-flow__stub-subtitle-text">
				 		${main_core.Loc.getMessage('TASKS_FLOW_ENTITY_SELECTOR_STUB_SUBTITLE', {
			'[helpdesklink]': '<a class="tasks-flow__stub-link" href="javascript:top.BX.Helper.show(\'redirect=detail&code=21307026\');">',
			'[/helpdesklink]': '</a>'
		})}
					</div>
					</div>
			</div>
		`;
		}
		#renderArrow() {
			return main_core.Tag.render`
			<div class="tasks-flow__stub-subtitle-arrow"></div>
		`;
		}
	}

	class EntitySelector {
		#flowSelectorBtn;
		#taskId;
		#canEditTask;
		#canCreateFlow;
		#toggleFlowParams;
		#flowParams;
		#dialog;
		constructor(params) {
			this.#taskId = params.taskId;
			this.#canEditTask = params.canEditTask;
			this.#canCreateFlow = params.canCreateFlow;
			this.#toggleFlowParams = params.toggleFlowParams;
			this.#flowParams = params.flowParams;
			this.#flowSelectorBtn = ui_buttons.ButtonManager.createFromNode(document.getElementById('tasks-flow-selector-container'));
			this.#subscribeEvents();
		}
		#subscribeEvents() {
			BX.PULL.subscribe({
				type: BX.PullClient.SubscriptionType.Server,
				moduleId: 'tasks',
				command: 'task_update',
				callback: this.#onTaskUpdated.bind(this)
			});
		}
		async #onTaskUpdated(params, extra, command) {
			const isEventByCurrentTask = parseInt(params?.TASK_ID, 10) === this.#taskId;
			const isEventContainsFlow = !main_core.Type.isUndefined(params.AFTER.FLOW_ID);
			if (!isEventByCurrentTask || !isEventContainsFlow) {
				return;
			}
			const flowId = Number(params.AFTER.FLOW_ID ?? 0);
			const isFlowChange = this.#flowParams.id !== flowId;
			if (!isFlowChange) {
				return;
			}
			let flowData = {
				id: 0,
				name: '',
				efficiency: 0
			};
			if (flowId !== 0) {
				flowData = await this.#loadFlowData(flowId);
			}
			this.#updateFlow(flowData);
		}
		async #loadFlowData(flowId) {
			const flowResponse = await main_core.ajax.runAction('tasks.flow.Flow.get', {
				data: {
					flowId
				}
			});
			return flowResponse.data;
		}
		#updateFlow(flowData) {
			this.#flowParams.id = flowData.id;
			this.#flowParams.name = flowData.name;
			this.#flowParams.efficiency = flowData.efficiency;
			this.show(this.#flowSelectorBtn.getContainer());
		}
		show(target) {
			if (!main_core.Type.isDomNode(target)) {
				throw new TypeError('HTMLElement for render flow entity selector not found');
			}
			this.#updateFlowBtn();
		}
		#updateFlowBtn() {
			this.#flowSelectorBtn.addClass('tasks-flow__selector');
			this.#flowSelectorBtn.setDropdown(true);
			this.#flowSelectorBtn.setState(this.#canEditTask ? '' : ui_buttons.ButtonState.DISABLED);
			this.#flowSelectorBtn.setIcon(this.#flowParams.isFeatureEnabled ? '' : ui_buttons.ButtonIcon.LOCK, 'right');
			if (this.#flowParams.id) {
				this.#flowSelectorBtn.setText(this.#flowParams.name);
				if (this.#flowSelectorBtn.hasAirDesign()) {
					this.#flowSelectorBtn.setStyle(ui_buttons.AirButtonStyle.SELECTION);
					this.#flowSelectorBtn.setRightCounter(null);
					this.#flowSelectorBtn.setRightCounter({
						color: ui_buttons.ButtonCounterColor.PRIMARY,
						style: ui_buttons.ButtonCounterStyle.FILLED_INVERTED,
						value: this.#flowParams.efficiency,
						useSymbolPercent: true,
						maxValue: 100
					});
				} else {
					this.#flowSelectorBtn.setColor(ui_buttons.ButtonColor.SECONDARY_LIGHT);
					this.#flowSelectorBtn.setCounter(this.#prepareEfficiency(this.#flowParams.efficiency));
				}
				this.#flowSelectorBtn.setMaxWidth(350);
			} else {
				this.#flowSelectorBtn.setText(main_core.Loc.getMessage('TASKS_FLOW_ENTITY_SELECTOR_FLOW_EMPTY'));
				if (this.#flowSelectorBtn.hasAirDesign()) {
					this.#flowSelectorBtn.setStyle(ui_buttons.AirButtonStyle.OUTLINE);
					this.#flowSelectorBtn.setRightCounter(null);
				} else {
					this.#flowSelectorBtn.setColor(ui_buttons.ButtonColor.BASE_LIGHT);
					this.#flowSelectorBtn.setCounter(null);
				}
				this.#flowSelectorBtn.setMaxWidth(null);
				if (this.#canEditTask === false) {
					this.#flowSelectorBtn.addClass('--hide');
				} else {
					this.#flowSelectorBtn.removeClass('--hide');
				}
			}
			if (this.#canEditTask) {
				main_core.Event.bind(this.#flowSelectorBtn.getContainer(), 'click', () => {
					this.#dialog = this.#dialog ?? this.#createDialog();
					this.#dialog.show(this.#flowSelectorBtn.getContainer());
				});
			}
		}
		#createDialog() {
			this.#dialog = new EntitySelectorDialog({
				toggleFlowParams: this.#toggleFlowParams,
				flowParams: this.#flowParams,
				canCreateFlow: this.#canCreateFlow
			});
			return this.#dialog;
		}
		#prepareEfficiency(efficiency) {
			return `${efficiency}%`;
		}
	}

	exports.EmptyStub = EmptyStub;
	exports.EntitySelector = EntitySelector;
	exports.Footer = Footer;

})(this.BX.Tasks.Flow = this.BX.Tasks.Flow || {}, BX.UI.EntitySelector, BX.UI, BX, BX.Event, BX.UI);
