/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {};
(function (exports, tasks_v2_component_fields_relationTasks, tasks_v2_application_ganttPopup, main_core, ui_iconSet_api_vue, ui_iconSet_outline, tasks_v2_const, tasks_v2_provider_service_relationService) {
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
			}
		},
		template: `
		<RelationTasks
			:meta="ganttMeta"
			:fields="new Set(['gantt'])"
			:shouldShowSubTasksOption="false"
			@add="handleAdd"
		/>
		<GanttPopup v-if="bindElement" :bindElement @close="bindElement = null"/>
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
				bindElement: null
			};
		},
		methods: {
			handleAdd(addButton) {
				this.bindElement = addButton;
			}
		},
		template: `
		<RelationTasksChip :meta="ganttMeta" @add="handleAdd"/>
		<GanttPopup v-if="bindElement" :bindElement @close="bindElement = null"/>
	`
	};

	exports.Gantt = Gantt;
	exports.GanttChip = GanttChip;
	exports.ganttMeta = ganttMeta;

})(this.BX.Tasks.V2.Component.Fields = this.BX.Tasks.V2.Component.Fields || {}, BX.Tasks.V2.Component.Fields, BX.Tasks.V2.Application, BX, BX.UI.IconSet, window, BX.Tasks.V2.Const, BX.Tasks.V2.Provider.Service);
//# sourceMappingURL=gantt-tasks.bundle.js.map
