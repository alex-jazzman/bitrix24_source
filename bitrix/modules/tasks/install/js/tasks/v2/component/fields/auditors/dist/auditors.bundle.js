/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {};
(function (exports, main_core, tasks_v2_core, tasks_v2_component_elements_participants, tasks_v2_lib_idUtils, tasks_v2_provider_service_taskService, tasks_v2_lib_analytics, tasks_v2_const, ui_system_chip_vue, ui_iconSet_api_vue, ui_iconSet_outline, tasks_v2_lib_fieldHighlighter, tasks_v2_lib_showLimit, tasks_v2_lib_userSelectorDialog) {
	'use strict';

	const auditorsMeta = Object.freeze({
		id: tasks_v2_const.TaskField.Auditors,
		title: main_core.Loc.getMessage('TASKS_V2_AUDITORS_TITLE')
	});

	// @vue/component
	const Auditors = {
		name: 'TaskAuditors',
		components: {
			Participants: tasks_v2_component_elements_participants.Participants
		},
		inject: {
			task: {},
			taskId: {},
			analytics: {},
			cardType: {}
		},
		setup() {
			return {
				auditorsMeta
			};
		},
		computed: {
			dataset() {
				return {
					'data-task-id': this.taskId,
					'data-task-field-id': auditorsMeta.id,
					'data-task-field-value': this.task.auditorsIds.join(',')
				};
			},
			isEdit() {
				return tasks_v2_lib_idUtils.idUtils.isReal(this.taskId);
			},
			isLocked() {
				return !tasks_v2_core.Core.getParams().restrictions.stakeholder.available;
			},
			featureId() {
				return tasks_v2_core.Core.getParams().restrictions.stakeholder.featureId;
			},
			auditorsCount() {
				return this.task.auditorsIds?.length ?? 0;
			}
		},
		methods: {
			update(auditorsIds) {
				const hasChanges = tasks_v2_provider_service_taskService.taskService.hasChanges(this.task, {
					auditorsIds
				}) && auditorsIds.length > 0 && auditorsIds.length >= this.auditorsCount;
				void tasks_v2_provider_service_taskService.taskService.update(this.taskId, {
					auditorsIds
				});
				if (hasChanges) {
					tasks_v2_lib_analytics.analytics.sendAddViewer(this.analytics, {
						cardType: this.cardType,
						taskId: main_core.Type.isNumber(this.taskId) ? this.taskId : 0,
						viewersCount: auditorsIds.length,
						coexecutorsCount: this.task.accomplicesIds?.length ?? 0
					});
				}
			}
		},
		template: `
		<Participants
			:taskId
			:context="auditorsMeta.id"
			:userIds="task.auditorsIds"
			:canAdd="task.rights.addAuditors"
			:canRemove="task.rights.edit"
			:forceEdit="!isEdit"
			:dataset
			:isLocked
			:featureId
			useRemoveAll
			@update="update"
		/>
	`
	};

	// @vue/component
	const AuditorsChip = {
		components: {
			Chip: ui_system_chip_vue.Chip
		},
		inject: {
			task: {},
			taskId: {},
			analytics: {},
			cardType: {}
		},
		setup() {
			return {
				Outline: ui_iconSet_api_vue.Outline,
				auditorsMeta
			};
		},
		computed: {
			design() {
				return this.isSelected ? ui_system_chip_vue.ChipDesign.ShadowAccent : ui_system_chip_vue.ChipDesign.ShadowNoAccent;
			},
			isSelected() {
				return this.task.filledFields[auditorsMeta.id];
			},
			isLocked() {
				return !tasks_v2_core.Core.getParams().restrictions.stakeholder.available;
			}
		},
		methods: {
			handleClick() {
				if (this.isSelected) {
					this.highlightField();
					return;
				}
				if (this.isLocked) {
					void tasks_v2_lib_showLimit.showLimit({
						featureId: tasks_v2_core.Core.getParams().restrictions.stakeholder.featureId,
						bindElement: this.$el
					});
					return;
				}
				void tasks_v2_lib_userSelectorDialog.usersDialog.show({
					targetNode: this.$el,
					ids: this.task.auditorsIds,
					onClose: this.handleClose
				});
			},
			handleClose(auditorsIds) {
				if (!this.isSelected && auditorsIds.length > 0) {
					this.highlightField();
					tasks_v2_lib_analytics.analytics.sendAddViewer(this.analytics, {
						cardType: this.cardType,
						taskId: main_core.Type.isNumber(this.taskId) ? this.taskId : 0,
						viewersCount: auditorsIds.length,
						coexecutorsCount: this.task.accomplicesIds?.length ?? 0
					});
				}
				void tasks_v2_provider_service_taskService.taskService.update(this.taskId, {
					auditorsIds
				});
			},
			highlightField() {
				void tasks_v2_lib_fieldHighlighter.fieldHighlighter.setContainer(this.$root.$el).highlight(auditorsMeta.id);
			}
		},
		template: `
		<Chip
			v-if="isSelected || task.rights.addAuditors"
			:design
			:icon="Outline.OBSERVER"
			:lock="isLocked"
			:text="loc('TASKS_V2_AUDITORS_TITLE_CHIP')"
			:data-task-id="taskId"
			:data-task-chip-id="auditorsMeta.id"
			:data-task-chip-value="task.auditorsIds.join(',')"
			@click="handleClick"
		/>
	`
	};

	exports.Auditors = Auditors;
	exports.AuditorsChip = AuditorsChip;
	exports.auditorsMeta = auditorsMeta;

})(this.BX.Tasks.V2.Component.Fields = this.BX.Tasks.V2.Component.Fields || {}, BX, BX.Tasks.V2, BX.Tasks.V2.Component.Elements, BX.Tasks.V2.Lib, BX.Tasks.V2.Provider.Service, BX.Tasks.V2.Lib, BX.Tasks.V2.Const, BX.UI.System.Chip.Vue, BX.UI.IconSet, window, BX.Tasks.V2.Lib, BX.Tasks.V2.Lib, BX.Tasks.V2.Lib);
//# sourceMappingURL=auditors.bundle.js.map
