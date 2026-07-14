/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {};
(function (exports, ui_vue3_directives_hint, ui_system_typography_vue, ui_iconSet_api_vue, ui_iconSet_outline, tasks_v2_component_taskList, tasks_v2_component_elements_hint, tasks_v2_provider_service_relationService, tasks_v2_lib_idUtils, tasks_v2_const, main_core, tasks_v2_lib_entitySelectorDialog, tasks_v2_lib_relationError, tasks_v2_provider_service_taskService, ui_system_chip_vue, tasks_v2_lib_fieldHighlighter) {
	'use strict';

	const parentTaskMeta = Object.freeze({
		id: tasks_v2_const.TaskField.Parent
	});

	const dialogs = {};
	const parentTaskDialog = new class {
		#taskId;
		#withTemplates;
		#onUpdate;
		#templateEntity;
		show(params) {
			this.#taskId = params.taskId;
			this.#withTemplates = params.withTemplates ?? true;
			this.#onUpdate = params.onClose;
			this.#dialog.selectItemsByIds(this.#items);
			this.#dialog.showTo(params.targetNode);
			this.#updateTemplatesVisibility();
		}
		get #dialog() {
			dialogs[this.#taskId] ??= this.#createDialog();
			return dialogs[this.#taskId];
		}
		#createDialog() {
			const onItemChange = main_core.Runtime.debounce(this.#onItemChange, 10, this);
			return new tasks_v2_lib_entitySelectorDialog.EntitySelectorDialog({
				context: 'tasks-card',
				multiple: false,
				hideOnDeselect: true,
				enableSearch: true,
				width: 500,
				entities: [{
					id: tasks_v2_const.EntitySelectorEntity.Task,
					options: {
						withTab: true
					}
				}, this.#isTemplate && {
					id: tasks_v2_const.EntitySelectorEntity.Template,
					options: {
						withTab: true,
						withFooter: false
					}
				}].filter(it => it),
				preselectedItems: this.#items,
				events: {
					onLoad: this.#updateTemplatesVisibility,
					'Item:onSelect': onItemChange,
					'Item:onDeselect': onItemChange
				}
			});
		}
		async #onItemChange() {
			const item = this.#dialog.getSelectedItems()[0];
			const isTemplate = item?.getEntityId() === tasks_v2_const.EntitySelectorEntity.Template;
			const selectedTaskId = isTemplate ? tasks_v2_lib_idUtils.idUtils.boxTemplate(item.getId()) : item?.getId() ?? 0;
			const error = await tasks_v2_provider_service_relationService.subTasksService.setParent(this.#taskId, selectedTaskId);
			if (error) {
				void tasks_v2_lib_relationError.relationError.setTaskId(this.#taskId).showError(error, tasks_v2_const.TaskField.Parent);
				return;
			}
			this.#onUpdate?.();
		}
		#updateTemplatesVisibility = () => {
			if (!this.#isTemplate || !this.#dialog.isLoaded()) {
				return;
			}
			if (!this.#withTemplates) {
				if (this.#templateEntity) {
					return;
				}
				const items = this.#dialog.getEntityItems(tasks_v2_const.EntitySelectorEntity.Template);
				const tab = this.#dialog.getTab(tasks_v2_const.EntitySelectorEntity.Template);
				this.#templateEntity = {
					items,
					tab
				};
				items.forEach(it => it.setHidden(true));
				main_core.Dom.addClass(tab.getLabelContainer(), 'ui-selector-tab-label-hidden');
				if (tab.isSelected()) {
					this.#dialog.selectFirstTab();
				}
			} else if (this.#templateEntity) {
				const {
					items,
					tab
				} = this.#templateEntity;
				items.forEach(it => it.setHidden(false));
				main_core.Dom.removeClass(tab.getLabelContainer(), 'ui-selector-tab-label-hidden');
				this.#templateEntity = null;
			}
		};
		get #items() {
			const parentId = tasks_v2_provider_service_taskService.taskService.getStoreTask(this.#taskId).parentId;
			const templateId = tasks_v2_lib_idUtils.idUtils.unbox(parentId);
			const isTemplate = tasks_v2_lib_idUtils.idUtils.isTemplate(parentId);
			const itemId = isTemplate ? [tasks_v2_const.EntitySelectorEntity.Template, templateId] : [tasks_v2_const.EntitySelectorEntity.Task, parentId];
			return parentId ? [itemId] : [];
		}
		get #isTemplate() {
			return tasks_v2_lib_idUtils.idUtils.isTemplate(this.#taskId);
		}
	}();

	// @vue/component
	const ParentTask = {
		name: 'TaskParentTask',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			TaskList: tasks_v2_component_taskList.TaskList,
			TextMd: ui_system_typography_vue.TextMd
		},
		directives: {
			hint: ui_vue3_directives_hint.hint
		},
		inject: {
			task: {},
			taskId: {}
		},
		setup() {
			return {
				Outline: ui_iconSet_api_vue.Outline,
				parentTaskMeta,
				subTasksService: tasks_v2_provider_service_relationService.subTasksService
			};
		},
		computed: {
			parentId() {
				return this.task.parentId;
			},
			hasParent() {
				return tasks_v2_lib_idUtils.idUtils.isReal(this.parentId);
			},
			title() {
				if (tasks_v2_lib_idUtils.idUtils.isTemplate(this.parentId)) {
					return this.loc('TASKS_V2_PARENT_TEMPLATE_TITLE');
				}
				return this.loc('TASKS_V2_PARENT_TASK_TITLE');
			},
			tooltip() {
				return () => tasks_v2_component_elements_hint.tooltip({
					text: this.loc('TASKS_V2_PARENT_TASK_SELECT'),
					popupOptions: {
						offsetLeft: this.$refs.add.$el.offsetWidth / 2
					}
				});
			}
		},
		watch: {
			parentId: {
				immediate: true,
				handler() {
					if (this.hasParent) {
						void tasks_v2_provider_service_relationService.subTasksService.getParent(this.taskId, this.parentId);
					}
				}
			}
		},
		methods: {
			handleEditClick() {
				parentTaskDialog.show({
					targetNode: this.$refs.add.$el,
					taskId: this.taskId,
					withTemplates: !this.task.replicate && !this.task.isForNewUser
				});
			},
			async handleRemoveParentTask() {
				await tasks_v2_provider_service_relationService.subTasksService.setParent(this.taskId, 0);
			}
		},
		template: `
		<div class="tasks-field-parent-task print-no-box-shadow" :data-task-id="taskId" :data-task-field-id="parentTaskMeta.id">
			<div class="tasks-field-parent-task-title">
				<div class="tasks-field-parent-task-main" :class="{ '--readonly': true }">
					<BIcon :name="Outline.SUBTASK"/>
					<TextMd accent>{{ title }}</TextMd>
				</div>
				<div v-if="task.rights.edit" v-hint="tooltip" class="tasks-field-parent-task-edit-container print-ignore">
					<BIcon
						class="tasks-field-parent-task-icon"
						:name="Outline.PLUS_L"
						hoverable
						:data-task-relation-add="parentTaskMeta.id"
						ref="add"
						@click="handleEditClick"
					/>
				</div>
			</div>
			<TaskList
				v-if="hasParent"
				:ids="hasParent ? [parentId] : []"
				:loadingIds="!subTasksService.hasStoreTask(parentId) ? [parentId] : []"
				:shouldShowSubTasksOption="false"
				@removeTask="handleRemoveParentTask"
			/>
		</div>
	`
	};

	// @vue/component
	const ParentTaskChip = {
		components: {
			Chip: ui_system_chip_vue.Chip
		},
		inject: {
			task: {},
			taskId: {}
		},
		setup() {
			return {
				parentTaskMeta,
				Outline: ui_iconSet_api_vue.Outline
			};
		},
		computed: {
			text() {
				if (tasks_v2_lib_idUtils.idUtils.isTemplate(this.task.parentId)) {
					return this.loc('TASKS_V2_PARENT_TEMPLATE_TITLE_CHIP');
				}
				return this.loc('TASKS_V2_PARENT_TASK_TITLE_CHIP');
			},
			design() {
				return this.isSelected ? ui_system_chip_vue.ChipDesign.ShadowAccent : ui_system_chip_vue.ChipDesign.ShadowNoAccent;
			},
			isSelected() {
				return this.task.filledFields[parentTaskMeta.id];
			}
		},
		methods: {
			handleClick() {
				if (this.isSelected) {
					this.highlightField();
					return;
				}
				parentTaskDialog.show({
					targetNode: this.$el,
					taskId: this.taskId,
					onUpdate: this.highlightField,
					withTemplates: !this.task.replicate && !this.task.isForNewUser
				});
			},
			highlightField() {
				void tasks_v2_lib_fieldHighlighter.fieldHighlighter.setContainer(this.$root.$el).highlight(parentTaskMeta.id);
			}
		},
		template: `
		<Chip
			v-if="task.rights.edit || isSelected"
			:design
			:text
			:icon="Outline.SUBTASK"
			:data-task-id="taskId"
			:data-task-chip-id="parentTaskMeta.id"
			ref="chip"
			@click="handleClick"
		/>
	`
	};

	exports.ParentTask = ParentTask;
	exports.ParentTaskChip = ParentTaskChip;
	exports.parentTaskMeta = parentTaskMeta;

})(this.BX.Tasks.V2.Component.Fields = this.BX.Tasks.V2.Component.Fields || {}, BX.Vue3.Directives, BX.UI.System.Typography.Vue, BX.UI.IconSet, window, BX.Tasks.V2.Component, BX.Tasks.V2.Component.Elements, BX.Tasks.V2.Provider.Service, BX.Tasks.V2.Lib, BX.Tasks.V2.Const, BX, BX.Tasks.V2.Lib, BX.Tasks.V2.Lib, BX.Tasks.V2.Provider.Service, BX.UI.System.Chip.Vue, BX.Tasks.V2.Lib);
//# sourceMappingURL=parent-task.bundle.js.map
