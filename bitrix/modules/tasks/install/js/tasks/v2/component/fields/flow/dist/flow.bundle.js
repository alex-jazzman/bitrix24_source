/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {};
(function (exports, main_sidepanel, ui_iconSet_api_vue, ui_iconSet_outline, tasks_v2_core, tasks_v2_const, tasks_v2_component_elements_hoverPill, tasks_v2_component_elements_fieldAdd, tasks_v2_provider_service_flowService, tasks_v2_provider_service_taskService, main_core, tasks_v2_lib_entitySelectorDialog, tasks_v2_provider_service_groupService, ui_system_chip_vue, tasks_v2_lib_fieldHighlighter) {
	'use strict';

	const flowMeta = Object.freeze({
		id: tasks_v2_const.TaskField.Flow,
		title: main_core.Loc.getMessage('TASKS_V2_FLOW_TITLE')
	});

	class FlowDialog {
		#dialog;
		#taskId;
		#onClose;
		#onUpdate;
		show(params) {
			this.#taskId = params.taskId;
			this.#onClose = params.onClose;
			this.#onUpdate = params.onUpdate;
			this.#dialog ??= this.#createDialog();
			this.#dialog.selectItemsByIds(this.#items);
			this.#dialog.showTo(params.targetNode);
		}
		#createDialog() {
			const dialog = new tasks_v2_lib_entitySelectorDialog.EntitySelectorDialog({
				context: 'tasks-card',
				width: 380,
				height: 370,
				multiple: false,
				hideOnDeselect: true,
				enableSearch: true,
				entities: [{
					id: tasks_v2_const.EntitySelectorEntity.Flow,
					options: {
						onlyActive: true
					}
				}],
				preselectedItems: this.#items,
				events: {
					onLoad: this.#fillStore
				},
				popupOptions: {
					events: {
						onClose: this.#handleFlowSelect
					}
				}
			});
			if (tasks_v2_core.Core.getParams().rights.flow.create) {
				const isFeatureTriable = main_core.Extension.getSettings('tasks.v2.component.fields.flow').get('isFeatureTriable');
				void main_core.Runtime.loadExtension('tasks.flow.entity-selector').then(({
					EmptyStub,
					Footer
				}) => {
					dialog.setFooter(new Footer(dialog, {
						isFeatureTriable
					}).render());
					dialog.getRecentTab().getStub().hide();
					dialog.getRecentTab().setStub(EmptyStub, {
						showArrow: false
					});
					dialog.getRecentTab().render();
				});
			}
			return dialog;
		}
		#handleFlowSelect = async () => {
			try {
				if (!this.#dialog.isLoaded()) {
					return;
				}

				// Singleton dialog: a show() for another card can overwrite this.#taskId while an await
				// below is in flight, so capture the id and current flow synchronously and use only these.
				const taskId = this.#taskId;
				const currentFlowId = tasks_v2_provider_service_taskService.taskService.getStoreTask(taskId).flowId;
				const flow = await this.#fillStore();
				if (flow?.id === currentFlowId) {
					return;
				}
				if (flow) {
					const {
						id: flowId,
						templateId,
						groupId
					} = flow;
					tasks_v2_provider_service_groupService.groupService.setHasScrumInfo(taskId);
					const updatePromise = tasks_v2_provider_service_taskService.taskService.update(taskId, {
						flowId,
						templateId,
						groupId,
						stageId: 0
					});

					// Non-blocking so the flow popup closes immediately. Refetch canCreateEpic
					// unconditionally: setHasScrumInfo() cleared it as a fail-safe, so on update failure
					// (server unchanged) the refetch still restores the group's real right. Each call
					// self-guards by task id kind: getScrumInfo for a real task, getEpicCreationRight for
					// a create-mode draft.
					void updatePromise.then(() => {
						void tasks_v2_provider_service_groupService.groupService.getScrumInfo(taskId, {
							force: true
						});
						void tasks_v2_provider_service_groupService.groupService.getEpicCreationRight(taskId);
					});
					this.#onUpdate?.();
				}
			} finally {
				this.#onClose?.();
			}
		};
		#fillStore = async () => {
			const item = this.#dialog.getSelectedItems()[0];
			if (!item) {
				return null;
			}
			const flowId = Number(item.getId()) || 0;
			if (flowId <= 0) {
				return null;
			}
			const flow = {
				id: flowId,
				name: item.getTitle(),
				groupId: item.getCustomData().get('groupId'),
				templateId: item.getCustomData().get('templateId')
			};
			if (!tasks_v2_core.Core.getStore().getters[`${tasks_v2_const.Model.Flows}/getById`](flow.id)) {
				await tasks_v2_provider_service_flowService.flowService.getFlow(flow.id);
			}
			return flow;
		};
		get #items() {
			return this.#flowId > 0 ? [[tasks_v2_const.EntitySelectorEntity.Flow, this.#flowId]] : [];
		}
		get #flowId() {
			return tasks_v2_provider_service_taskService.taskService.getStoreTask(this.#taskId).flowId;
		}
	}
	const flowDialog = new FlowDialog();

	// @vue/component
	const Flow = {
		name: 'TaskFlow',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			HoverPill: tasks_v2_component_elements_hoverPill.HoverPill,
			FieldAdd: tasks_v2_component_elements_fieldAdd.FieldAdd
		},
		inject: {
			task: {},
			taskId: {},
			isEdit: {}
		},
		setup() {
			return {
				flowMeta,
				Outline: ui_iconSet_api_vue.Outline
			};
		},
		data() {
			return {
				isMenuShown: false
			};
		},
		computed: {
			flow() {
				return this.$store.getters[`${tasks_v2_const.Model.Flows}/getById`](this.task.flowId);
			},
			readonly() {
				return !this.task.rights.edit;
			},
			withClear() {
				return !this.readonly && this.flow;
			},
			ariaLabel() {
				return this.flow?.name ? this.loc('TASKS_V2_FLOW_VALUE_ARIA_LABEL', {
					'#FLOW_NAME#': this.flow.name
				}) : this.loc('TASKS_V2_FLOW_ARIA_LABEL');
			}
		},
		methods: {
			handleClick() {
				if (this.flow && this.readonly) {
					this.openFlow();
					return;
				}
				this.showDialog();
			},
			openFlow() {
				const href = tasks_v2_provider_service_flowService.flowService.getUrl(this.flow.id, tasks_v2_core.Core.getParams().currentUser.id);
				main_sidepanel.SidePanel.Instance.open(href);
			},
			clearField() {
				void tasks_v2_provider_service_taskService.taskService.update(this.taskId, {
					flowId: 0,
					groupId: 0,
					stageId: 0
				});
			},
			showDialog() {
				this.isMenuShown = true;
				flowDialog.show({
					targetNode: this.$refs.container,
					taskId: this.taskId,
					onClose: () => {
						this.isMenuShown = false;
					}
				});
			}
		},
		template: `
		<div
			:data-task-id="taskId"
			:data-task-field-id="flowMeta.id"
			:data-task-field-value="task.flowId"
			@click="handleClick"
			ref="container"
		>
			<HoverPill
				v-if="flow"
				:withClear
				:ariaLabel
				:ariaHaspopup="'dialog'"
				:ariaExpanded="isMenuShown"
				:clearAriaLabel="loc('TASKS_V2_FLOW_CLEAR_ARIA_LABEL')"
				data-testid="tasks-flow-pill"
				@clear="clearField"
			>
				<div class="tasks-field-flow">
					<BIcon :name="Outline.BOTTLENECK" aria-hidden="true"/>
					<div class="tasks-field-flow-title">{{ flow.name }}</div>
				</div>
			</HoverPill>
			<FieldAdd
				v-else
				:icon="Outline.BOTTLENECK"
				:ariaLabel="loc('TASKS_V2_FLOW_ADD_ARIA_LABEL')"
				:ariaHaspopup="'dialog'"
				:ariaExpanded="isMenuShown"
				data-testid="tasks-flow-add-btn"
			/>
		</div>
	`
	};

	// @vue/component
	const FlowChip = {
		components: {
			Chip: ui_system_chip_vue.Chip
		},
		inject: {
			task: {},
			taskId: {}
		},
		props: {
			isAutonomous: {
				type: Boolean,
				default: false
			}
		},
		setup() {
			return {
				Outline: ui_iconSet_api_vue.Outline,
				flowMeta
			};
		},
		data() {
			return {
				isDialogShown: false
			};
		},
		computed: {
			flow() {
				return this.$store.getters[`${tasks_v2_const.Model.Flows}/getById`](this.task.flowId);
			},
			design() {
				return {
					[!this.isAutonomous && !this.isSelected]: ui_system_chip_vue.ChipDesign.ShadowNoAccent,
					[!this.isAutonomous && this.isSelected]: ui_system_chip_vue.ChipDesign.ShadowAccent,
					[this.isAutonomous && !this.isSelected]: ui_system_chip_vue.ChipDesign.OutlineNoAccent,
					[this.isAutonomous && this.isSelected]: ui_system_chip_vue.ChipDesign.OutlineAccent
				}.true;
			},
			isSelected() {
				if (this.isAutonomous) {
					return this.task.flowId > 0;
				}
				return this.task.filledFields[flowMeta.id];
			},
			isFilled() {
				return this.isAutonomous && this.task.flowId > 0;
			},
			text() {
				if (this.isFilled) {
					return this.flow.name;
				}
				return this.loc('TASKS_V2_FLOW_TITLE_CHIP');
			},
			opensDialog() {
				return this.isAutonomous || !this.isSelected;
			}
		},
		watch: {
			isDialogShown() {
				this.syncAria();
			},
			opensDialog() {
				this.syncAria();
			}
		},
		created() {
			if (this.task.flowId && !this.flow) {
				void tasks_v2_provider_service_flowService.flowService.getFlow(this.task.flowId);
			}
		},
		mounted() {
			this.syncAria();
		},
		methods: {
			syncAria() {
				const el = this.$refs.chip?.$el;
				if (!el) {
					return;
				}
				main_core.Dom.attr(el, 'role', 'button');
				main_core.Dom.attr(el, 'aria-haspopup', this.opensDialog ? 'dialog' : null);
				main_core.Dom.attr(el, 'aria-expanded', this.opensDialog ? String(this.isDialogShown) : null);
			},
			handleClick() {
				if (!this.isAutonomous && this.isSelected) {
					this.highlightField();
					return;
				}
				this.isDialogShown = true;
				flowDialog.show({
					targetNode: this.$el,
					taskId: this.taskId,
					onClose: this.handleDialogClose,
					onUpdate: this.highlightField
				});
			},
			handleKeydown(event) {
				if (event.key !== ' ') {
					return;
				}
				event.preventDefault();
				this.handleClick();
			},
			handleDialogClose() {
				this.isDialogShown = false;
			},
			highlightField() {
				void tasks_v2_lib_fieldHighlighter.fieldHighlighter.setContainer(this.$root.$el).highlight(flowMeta.id);
			},
			handleClear() {
				void tasks_v2_provider_service_taskService.taskService.update(this.taskId, {
					flowId: 0,
					groupId: 0
				});
			}
		},
		// TODO: remove title prop when flow popup added
		template: `
		<Chip
			:design
			:icon="Outline.BOTTLENECK"
			:text
			:withClear="isFilled"
			:trimmable="isFilled"
			:data-task-id="taskId"
			:data-task-chip-id="flowMeta.id"
			:data-task-chip-value="task.flowId"
			data-testid="tasks-flow-chip"
			ref="chip"
			@click="handleClick"
			@clear="handleClear"
			@keydown="handleKeydown"
			:title="flow?.name ?? ''"
		/>
	`
	};

	exports.Flow = Flow;
	exports.FlowChip = FlowChip;
	exports.flowMeta = flowMeta;

})(this.BX.Tasks.V2.Component.Fields = this.BX.Tasks.V2.Component.Fields || {}, BX.SidePanel, BX.UI.IconSet, window, BX.Tasks.V2, BX.Tasks.V2.Const, BX.Tasks.V2.Component.Elements, BX.Tasks.V2.Component.Elements, BX.Tasks.V2.Provider.Service, BX.Tasks.V2.Provider.Service, BX, BX.Tasks.V2.Lib, BX.Tasks.V2.Provider.Service, BX.UI.System.Chip.Vue, BX.Tasks.V2.Lib);
//# sourceMappingURL=flow.bundle.js.map
