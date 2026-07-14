/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {};
(function (exports, main_core, tasks_v2_core, tasks_v2_const, tasks_v2_component_elements_participants, tasks_v2_component_absencePopup, tasks_v2_lib_idUtils, tasks_v2_provider_service_taskService, tasks_v2_lib_analytics, ui_system_chip_vue, ui_iconSet_api_vue, ui_iconSet_outline, tasks_v2_lib_fieldHighlighter, tasks_v2_lib_showLimit, tasks_v2_lib_userSelectorDialog) {
	'use strict';

	const accomplicesMeta = Object.freeze({
		id: tasks_v2_const.TaskField.Accomplices,
		title: main_core.Loc.getMessage('TASKS_V2_ACCOMPLICES_TITLE')
	});

	// Handoff of absence userIds loaded by the chip flow to the freshly mounted
	// Accomplices field. The chip and the field are two alternate representations
	// of the same field and never coexist, so the loaded promise is parked by
	// taskId and consumed once the field mounts. This keeps arming per-instance
	// instead of relying on the store-wide `Model.Absences.fetching` flag.
	const pendingByTaskId = new Map();
	function registerPendingAbsenceArm(taskId, promise) {
		pendingByTaskId.set(taskId, promise);
	}
	function consumePendingAbsenceArm(taskId) {
		const promise = pendingByTaskId.get(taskId) ?? null;
		pendingByTaskId.delete(taskId);
		return promise;
	}

	// @vue/component
	const Accomplices = {
		name: 'TaskAccomplices',
		components: {
			AbsencePopup: tasks_v2_component_absencePopup.AbsencePopup,
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
				accomplicesMeta
			};
		},
		data() {
			return {
				armedAbsencePopupUserIds: new Set()
			};
		},
		mounted() {
			const existingAbsences = this.$store.getters[`${tasks_v2_const.Model.Absences}/getByUserIds`](this.task.accomplicesIds);
			existingAbsences.forEach(({
				userId
			}) => {
				this.armedAbsencePopupUserIds.add(userId);
			});

			// Absences added through the chip flow are loaded before this field
			// mounts, so arm them off the chip's own load promise rather than the
			// store-wide `fetching` flag (shared across all task windows).
			const pendingArm = consumePendingAbsenceArm(this.taskId);
			if (pendingArm) {
				void pendingArm.then(userIds => {
					this.armAbsenceForUsers(userIds);
				});
			}
		},
		computed: {
			dataset() {
				return {
					'data-task-id': this.taskId,
					'data-task-field-id': accomplicesMeta.id,
					'data-task-field-value': this.task.accomplicesIds.join(',')
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
			accomplicesCount() {
				return this.task.accomplicesIds?.length ?? 0;
			},
			userAbsences() {
				return this.$store.getters[`${tasks_v2_const.Model.Absences}/getByUserIds`](this.task.accomplicesIds);
			}
		},
		methods: {
			armAbsenceForUsers(userIds) {
				userIds.forEach(userId => {
					this.armedAbsencePopupUserIds.add(userId);
				});
			},
			normalizeArmedAbsencePopupUserIds(accomplicesIds) {
				const accomplicesIdsSet = new Set(accomplicesIds);
				this.armedAbsencePopupUserIds.forEach(userId => {
					if (!accomplicesIdsSet.has(userId)) {
						this.armedAbsencePopupUserIds.delete(userId);
					}
				});
			},
			update(accomplicesIds) {
				const hasChanges = tasks_v2_provider_service_taskService.taskService.hasChanges(this.task, {
					accomplicesIds
				}) && accomplicesIds.length > 0 && accomplicesIds.length >= this.accomplicesCount;
				void tasks_v2_provider_service_taskService.taskService.update(this.taskId, {
					accomplicesIds
				});
				this.normalizeArmedAbsencePopupUserIds(accomplicesIds);
				if (hasChanges) {
					tasks_v2_lib_analytics.analytics.sendAddCoexecutor(this.analytics, {
						cardType: this.cardType,
						taskId: main_core.Type.isNumber(this.taskId) ? this.taskId : 0,
						viewersCount: this.task.auditorsIds?.length ?? 0,
						coexecutorsCount: accomplicesIds.length
					});
				}
			},
			hasUserAbsence(userId) {
				return this.userAbsences.some(absence => absence.userId === userId);
			}
		},
		template: `
		<Participants
			:taskId
			:context="accomplicesMeta.id"
			:userIds="task.accomplicesIds"
			:canAdd="task.rights.changeAccomplices"
			:canRemove="task.rights.changeAccomplices"
			:forceEdit="!isEdit"
			:dataset
			:isLocked
			:featureId
			warnAboutAbsence
			@update="update"
			@absenceLoaded="armAbsenceForUsers"
		>
			<template #user="slotProps">
				<AbsencePopup
					v-if="slotProps?.getUserEl && armedAbsencePopupUserIds.has(slotProps.userId) && hasUserAbsence(slotProps.userId)"
					:getBindElement="slotProps?.getUserEl"
					:userId="slotProps.userId"
					:delay="task.accomplicesIds.length - slotProps.index"
				/>
			</template>
		</Participants>
	`
	};

	// @vue/component
	const AccomplicesChip = {
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
				accomplicesMeta
			};
		},
		computed: {
			design() {
				return this.isSelected ? ui_system_chip_vue.ChipDesign.ShadowAccent : ui_system_chip_vue.ChipDesign.ShadowNoAccent;
			},
			isSelected() {
				return this.task.filledFields[accomplicesMeta.id];
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
					ids: this.task.accomplicesIds,
					onClose: this.handleClose
				});
			},
			handleClose(accomplicesIds, items) {
				if (!this.isSelected && accomplicesIds.length > 0) {
					this.highlightField();
					tasks_v2_lib_analytics.analytics.sendAddCoexecutor(this.analytics, {
						cardType: this.cardType,
						taskId: main_core.Type.isNumber(this.taskId) ? this.taskId : 0,
						viewersCount: this.task.auditorsIds?.length ?? 0,
						coexecutorsCount: accomplicesIds.length
					});
					registerPendingAbsenceArm(this.taskId, tasks_v2_component_absencePopup.loadUsersAbsenceInfo(items));
				}
				void tasks_v2_provider_service_taskService.taskService.update(this.taskId, {
					accomplicesIds
				});
			},
			highlightField() {
				void tasks_v2_lib_fieldHighlighter.fieldHighlighter.setContainer(this.$root.$el).highlight(accomplicesMeta.id);
			}
		},
		template: `
		<Chip
			v-if="isSelected || task.rights.changeAccomplices"
			:design
			:icon="Outline.PERSON"
			:lock="isLocked"
			:text="loc('TASKS_V2_ACCOMPLICES_TITLE_CHIP')"
			:data-task-id="taskId"
			:data-task-chip-id="accomplicesMeta.id"
			:data-task-chip-value="task.accomplicesIds.join(',')"
			@click="handleClick"
		/>
	`
	};

	exports.Accomplices = Accomplices;
	exports.AccomplicesChip = AccomplicesChip;
	exports.accomplicesMeta = accomplicesMeta;

})(this.BX.Tasks.V2.Component.Fields = this.BX.Tasks.V2.Component.Fields || {}, BX, BX.Tasks.V2, BX.Tasks.V2.Const, BX.Tasks.V2.Component.Elements, BX.Tasks.V2.Component, BX.Tasks.V2.Lib, BX.Tasks.V2.Provider.Service, BX.Tasks.V2.Lib, BX.UI.System.Chip.Vue, BX.UI.IconSet, window, BX.Tasks.V2.Lib, BX.Tasks.V2.Lib, BX.Tasks.V2.Lib);
//# sourceMappingURL=accomplices.bundle.js.map
