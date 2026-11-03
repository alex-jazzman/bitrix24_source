/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {};
(function (exports, main_core, tasks_v2_component_fields_relationTasks, tasks_v2_application_ganttPopup, ui_iconSet_api_vue, ui_iconSet_outline, tasks_v2_const, tasks_v2_provider_service_relationService) {
	'use strict';

	const ganttMeta = Object.freeze({
		id: tasks_v2_const.TaskField.Gantt,
		icon: ui_iconSet_api_vue.Outline.STAGES,
		idsField: 'ganttTaskIds',
		containsField: 'containsGanttLinks',
		showCompletedField: 'showCompletedGantt',
		getTitle: () => main_core.Loc.getMessage('TASKS_V2_GANTT_TITLE_V2'),
		getChipTitle: () => main_core.Loc.getMessage('TASKS_V2_GANTT_TITLE_CHIP_V2'),
		getCountLoc: () => 'TASKS_V2_GANTT_TITLE_COUNT_V2',
		getHint: () => main_core.Loc.getMessage('TASKS_V2_GANTT_ADD_V2'),
		service: tasks_v2_provider_service_relationService.ganttService,
		right: 'createGanttDependence'
	});

	// @vue/component
	const Gantt = {
		name: 'TaskGantt',
		components: {
			RelationTasks: tasks_v2_component_fields_relationTasks.RelationTasks,
			GanttPopup: tasks_v2_application_ganttPopup.GanttPopup
		},
		setup() {
			return {
				ganttMeta
			};
		},
		data() {
			return {
				bindElement: null
			};
		},
		methods: {
			handleAdd(addButton) {
				this.bindElement = addButton;
				main_core.Dom.attr(addButton, 'aria-expanded', 'true');
			},
			handleClose() {
				main_core.Dom.attr(this.bindElement, 'aria-expanded', 'false');
				this.bindElement = null;
			}
		},
		template: `
		<RelationTasks
			:meta="ganttMeta"
			:fields="new Set(['gantt'])"
			:shouldShowSubTasksOption="false"
			@add="handleAdd"
		/>
		<GanttPopup v-if="bindElement" :bindElement @close="handleClose"/>
	`
	};

	// @vue/component
	const GanttChip = {
		components: {
			RelationTasksChip: tasks_v2_component_fields_relationTasks.RelationTasksChip,
			GanttPopup: tasks_v2_application_ganttPopup.GanttPopup
		},
		setup() {
			return {
				ganttMeta
			};
		},
		data() {
			return {
				bindElement: null,
				onDialogClose: null
			};
		},
		methods: {
			handleAdd(addButton, onClose) {
				this.bindElement = addButton;
				this.onDialogClose = onClose;
			},
			handleClose() {
				this.bindElement = null;
				this.onDialogClose?.();
				this.onDialogClose = null;
			}
		},
		template: `
		<RelationTasksChip :meta="ganttMeta" @add="handleAdd"/>
		<GanttPopup v-if="bindElement" :bindElement @close="handleClose"/>
	`
	};

	exports.Gantt = Gantt;
	exports.GanttChip = GanttChip;
	exports.ganttMeta = ganttMeta;

})(this.BX.Tasks.V2.Component.Fields = this.BX.Tasks.V2.Component.Fields || {}, BX, BX.Tasks.V2.Component.Fields, BX.Tasks.V2.Application, BX.UI.IconSet, window, BX.Tasks.V2.Const, BX.Tasks.V2.Provider.Service);
//# sourceMappingURL=gantt-tasks.bundle.js.map
