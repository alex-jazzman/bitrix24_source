/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {};
(function (exports, main_core, main_popup, ui_system_typography_vue, ui_iconSet_api_vue, ui_iconSet_outline, tasks_v2_core, tasks_v2_const, tasks_v2_component_absencePopup, tasks_v2_component_elements_participants, tasks_v2_component_elements_hint, tasks_v2_lib_ahaMoments, tasks_v2_lib_analytics, tasks_v2_lib_calendar, tasks_v2_lib_fieldHighlighter, tasks_v2_lib_idUtils, tasks_v2_lib_userSelectorDialog, tasks_v2_provider_service_taskService, ui_vue3_directives_hint, ui_switcher, ui_vue3_components_switcher, tasks_v2_component_elements_questionMark, ui_vue3, tasks_v2_component_elements_userAvatarList) {
	'use strict';

	const responsibleMeta = Object.freeze({
		id: tasks_v2_const.TaskField.Responsible,
		hint: main_core.Loc.getMessage('TASKS_V2_RESPONSIBLE_MANY_AHA'),
		getTitle: isMany => {
			return isMany ? main_core.Loc.getMessage('TASKS_V2_RESPONSIBLE_TITLE_MANY') : main_core.Loc.getMessage('TASKS_V2_RESPONSIBLE_TITLE');
		}
	});

	// @vue/component
	const ForNewUserSwitcher = {
		name: 'ForNewUserSwitcher',
		components: {
			Switcher: ui_vue3_components_switcher.Switcher,
			TextSm: ui_system_typography_vue.TextSm,
			QuestionMark: tasks_v2_component_elements_questionMark.QuestionMark
		},
		directives: {
			hint: ui_vue3_directives_hint.hint
		},
		inject: {
			task: {},
			isTemplate: {}
		},
		props: {
			isChecked: {
				type: Boolean,
				required: true
			}
		},
		emits: ['update:isChecked'],
		setup() {},
		computed: {
			disabled() {
				return this.isTemplate && (this.task.replicate || tasks_v2_lib_idUtils.idUtils.isTemplate(this.task.parentId));
			},
			options() {
				return {
					size: ui_switcher.SwitcherSize.extraSmall,
					useAirDesign: true
				};
			},
			tooltip() {
				if (!this.disabled) {
					return null;
				}
				return () => tasks_v2_component_elements_hint.tooltip({
					text: this.loc('TASKS_TASK_TEMPLATE_COMPONENT_TEMPLATE_NO_TYPE_NEW_TEMPLATE_NOTICE'),
					popupOptions: {
						offsetLeft: 10
					},
					timeout: 200
				});
			}
		},
		methods: {
			handleClick() {
				if (!this.disabled) {
					this.$emit('update:isChecked', !this.isChecked);
				}
			}
		},
		template: `
		<div :class="['tasks-field-responsible-new-user', { '--disabled': disabled }]">
			<div v-hint="tooltip" class="tasks-field-responsible-new-user-switcher" @click="handleClick">
				<Switcher :isChecked :options/>
				<TextSm className="tasks-field-responsible-new-user-text">
					{{ loc('TASKS_V2_RESPONSIBLE_FOR_NEW_USER') }}
				</TextSm>
			</div>
			<QuestionMark :hintText="loc('TASKS_V2_RESPONSIBLE_FOR_NEW_USER_HINT')" :hintMaxWidth="320" @click.stop/>
		</div>
	`
	};

	const NewUserLabel = ui_vue3.h(tasks_v2_component_elements_userAvatarList.UserAvatarListUsers, {
		users: [{
			name: main_core.Loc.getMessage('TASKS_V2_RESPONSIBLE_NEW_USER'),
			type: 'employee'
		}],
		readonly: true
	});

	// @vue/component
	const Responsible = {
		name: 'TaskResponsible',
		components: {
			AbsencePopup: tasks_v2_component_absencePopup.AbsencePopup,
			Participants: tasks_v2_component_elements_participants.Participants,
			BIcon: ui_iconSet_api_vue.BIcon,
			ForNewUserSwitcher,
			NewUserLabel,
			Hint: tasks_v2_component_elements_hint.Hint,
			TextXs: ui_system_typography_vue.TextXs
		},
		inject: {
			analytics: {},
			cardType: {}
		},
		props: {
			taskId: {
				type: [Number, String],
				required: true
			},
			isSingle: {
				type: Boolean,
				default: false
			},
			avatarOnly: {
				type: Boolean,
				default: false
			}
		},
		setup() {
			return {
				fetchingAbsenceUnwatch: null,
				Outline: ui_iconSet_api_vue.Outline,
				responsibleMeta
			};
		},
		data() {
			return {
				isManyAhaShown: false,
				activePopups: new Set(),
				activeAbsencePopups: new Set(),
				shownAbsencePopupUserIds: new Set(),
				armedAbsencePopupUserIds: new Set()
			};
		},
		computed: {
			forNewUser: {
				get() {
					return this.task.isForNewUser;
				},
				set(isForNewUser) {
					void tasks_v2_provider_service_taskService.taskService.update(this.taskId, {
						isForNewUser,
						responsibleIds: isForNewUser ? [0] : [this.currentUserId]
					});
				}
			},
			currentUserId() {
				return tasks_v2_core.Core.getParams().currentUser.id;
			},
			task() {
				return tasks_v2_provider_service_taskService.taskService.getStoreTask(this.taskId);
			},
			isEdit() {
				return tasks_v2_lib_idUtils.idUtils.isReal(this.taskId);
			},
			isTemplate() {
				return tasks_v2_lib_idUtils.idUtils.isTemplate(this.taskId);
			},
			canEdit() {
				return Boolean(this.task.rights.delegate || this.task.rights.changeResponsible);
			},
			isFlowFilledOnAdd() {
				return this.task.flowId > 0 && !this.isEdit;
			},
			single() {
				return this.isSingle || !this.isTemplate && this.isEdit;
			},
			dataset() {
				return {
					'data-task-id': this.taskId,
					'data-task-field-id': responsibleMeta.id,
					'data-task-field-value': this.task.responsibleIds[0]
				};
			},
			isAdmin() {
				return tasks_v2_core.Core.getParams().rights.user.admin;
			},
			fetchingAbsence() {
				return this.$store.state[tasks_v2_const.Model.Absences].fetching;
			},
			userAbsences() {
				return this.$store.getters[`${tasks_v2_const.Model.Absences}/getByUserIds`](this.task.responsibleIds);
			}
		},
		mounted() {
			const existingAbsences = this.$store.getters[`${tasks_v2_const.Model.Absences}/getByUserIds`](this.task.responsibleIds);
			existingAbsences.forEach(({
				userId
			}) => {
				this.armedAbsencePopupUserIds.add(userId);
			});
		},
		methods: {
			armAbsenceForUsers(userIds) {
				userIds.forEach(userId => {
					this.armedAbsencePopupUserIds.add(userId);
				});
			},
			updateTask(responsibleIds) {
				if (responsibleIds.length === 0) {
					responsibleIds.push(this.task.responsibleIds[0]);
				}
				const currentIds = new Set(this.task.responsibleIds);
				void tasks_v2_provider_service_taskService.taskService.update(this.taskId, {
					responsibleIds
				});
				this.normalizeShownAbsencePopupUserIds(responsibleIds);
				if (responsibleIds.some(id => !currentIds.has(id))) {
					tasks_v2_lib_analytics.analytics.sendAssigneeChange(this.analytics, {
						cardType: this.cardType,
						taskId: main_core.Type.isNumber(this.taskId) ? this.taskId : 0,
						viewersCount: this.task.auditorsIds?.length ?? 0,
						coexecutorsCount: this.task.accomplicesIds?.length ?? 0
					});
				}
				if (responsibleIds.length > 1) {
					setTimeout(() => this.executeIfNoAbsences(this.showManyAha), 100);
				}
			},
			handleHintClick() {
				void tasks_v2_provider_service_taskService.taskService.update(this.taskId, {
					creatorId: this.currentUserId
				});
			},
			executeIfNoAbsences(fn) {
				if (!this.fetchingAbsence && !this.hasUsersWithAbsence()) {
					fn();
					return;
				}
				this.fetchingAbsenceUnwatch = this.$watch('fetchingAbsence', fetching => {
					if (!fetching && !this.hasUsersWithAbsence()) {
						fn();
					}
					this.fetchingAbsenceUnwatch();
				});
			},
			showManyAha() {
				if (tasks_v2_lib_ahaMoments.ahaMoments.shouldShow(tasks_v2_const.Option.AhaResponsibleMany)) {
					tasks_v2_lib_ahaMoments.ahaMoments.setActive(tasks_v2_const.Option.AhaResponsibleMany);
					this.isManyAhaShown = true;
					tasks_v2_lib_ahaMoments.ahaMoments.setPopupShown(tasks_v2_const.Option.AhaResponsibleMany);
					void tasks_v2_lib_fieldHighlighter.fieldHighlighter.highlight(responsibleMeta.id);
				}
			},
			stopManyAha() {
				tasks_v2_lib_ahaMoments.ahaMoments.setShown(tasks_v2_const.Option.AhaResponsibleMany);
				this.closeManyAha();
			},
			closeManyAha() {
				this.isManyAhaShown = false;
				tasks_v2_lib_ahaMoments.ahaMoments.setInactive(tasks_v2_const.Option.AhaResponsibleMany);
			},
			hasUsersWithAbsence() {
				const userAbsences = this.$store.getters[`${tasks_v2_const.Model.Absences}/getByUserIds`](this.task.responsibleIds);
				const todayTs = tasks_v2_lib_calendar.calendar.todyTs;
				return userAbsences.some(({
					userId,
					fromTs,
					toTs
				}) => {
					return this.armedAbsencePopupUserIds.has(userId) && !this.shownAbsencePopupUserIds.has(userId) && todayTs >= fromTs && todayTs <= toTs;
				});
			},
			hasUserAbsence(userId) {
				return this.userAbsences.some(absence => absence.userId === userId);
			},
			addToActiveAbsencePopups(userId) {
				if (this.activeAbsencePopups.size === 0) {
					main_popup.PopupWindowManager.getPopups().map(p => p.getId()).forEach(popupId => this.activePopups.add(popupId));
				}
				this.activeAbsencePopups.add(userId);
				this.shownAbsencePopupUserIds.add(userId);
			},
			normalizeShownAbsencePopupUserIds(responsibleIds) {
				const responsibleIdsSet = new Set(responsibleIds);
				this.shownAbsencePopupUserIds.forEach(userId => {
					if (!responsibleIdsSet.has(userId)) {
						this.shownAbsencePopupUserIds.delete(userId);
					}
				});
				this.armedAbsencePopupUserIds.forEach(userId => {
					if (!responsibleIdsSet.has(userId)) {
						this.armedAbsencePopupUserIds.delete(userId);
					}
				});
			},
			removeFromActiveAbsencePopups(userId) {
				if (!this.activeAbsencePopups.has(userId)) {
					return;
				}
				this.activeAbsencePopups.delete(userId);
				if (this.activeAbsencePopups.size === 0 && this.task.responsibleIds.length > 1) {
					setTimeout(() => {
						if (this.isActivePopupsSame() && !tasks_v2_lib_userSelectorDialog.usersDialog.getDialog()?.isOpen()) {
							this.showManyAha();
						}
					}, 800);
				}
			},
			isActivePopupsSame() {
				const currentPopupIds = main_popup.PopupWindowManager.getPopups().map(popup => popup.getId());
				return this.activePopups.size === currentPopupIds.length && currentPopupIds.every(id => this.activePopups.has(id));
			}
		},
		template: `
		<div ref="container">
			<div v-if="isFlowFilledOnAdd" class="tasks-field-responsible-auto">
				<BIcon :name="Outline.BOTTLENECK"/>
				<div v-if="!avatarOnly">{{ loc('TASKS_V2_RESPONSIBLE_AUTO') }}</div>
			</div>
			<NewUserLabel v-else-if="forNewUser"/>
			<Participants
				v-else
				:taskId
				:context="responsibleMeta.id"
				:userIds="task.responsibleIds"
				:canAdd="canEdit"
				:canRemove="canEdit"
				:forceEdit="!isEdit"
				:withHint="!isAdmin && !isEdit && task.creatorId !== currentUserId"
				:hintText="loc('TASKS_V2_RESPONSIBLE_CANT_CHANGE')"
				:single
				:multipleOnPlus="!single && task.responsibleIds.length === 1"
				:inline="avatarOnly || single"
				:avatarOnly
				:dataset
				:showMenu="false"
				warnAboutAbsence
				@hintClick="handleHintClick"
				@update="updateTask"
				@absenceLoaded="armAbsenceForUsers"
			>
				<template #user="slotProps">
					<AbsencePopup
						v-if="slotProps?.getUserEl && armedAbsencePopupUserIds.has(slotProps.userId) && hasUserAbsence(slotProps.userId)"
						:getBindElement="slotProps?.getUserEl"
						:userId="slotProps.userId"
						:delay="task.responsibleIds.length - slotProps.index"
						@open="addToActiveAbsencePopups($event)"
						@close="removeFromActiveAbsencePopups($event)"
					/>
				</template>
			</Participants>
			<ForNewUserSwitcher
				v-if="!isEdit && isTemplate && !avatarOnly && task.context !== 'flow'"
				v-model:isChecked="forNewUser"
			/>
		</div>
		<Hint
			v-if="isManyAhaShown"
			:bindElement="$refs.container"
			@close="isManyAhaShown = false"
		>
			<div class="tasks-field-responsible-many-aha">
				<div>{{ loc('TASKS_V2_RESPONSIBLE_MANY_AHA') }}</div>
				<TextXs @click="stopManyAha">{{ loc('TASKS_V2_RESPONSIBLE_MANY_AHA_STOP') }}</TextXs>
			</div>
		</Hint>
	`
	};

	exports.Responsible = Responsible;
	exports.responsibleMeta = responsibleMeta;

})(this.BX.Tasks.V2.Component.Fields = this.BX.Tasks.V2.Component.Fields || {}, BX, BX.Main, BX.UI.System.Typography.Vue, BX.UI.IconSet, window, BX.Tasks.V2, BX.Tasks.V2.Const, BX.Tasks.V2.Component, BX.Tasks.V2.Component.Elements, BX.Tasks.V2.Component.Elements, BX.Tasks.V2.Lib, BX.Tasks.V2.Lib, BX.Tasks.V2.Lib, BX.Tasks.V2.Lib, BX.Tasks.V2.Lib, BX.Tasks.V2.Lib, BX.Tasks.V2.Provider.Service, BX.Vue3.Directives, BX.UI, BX.UI.Vue3.Components, BX.Tasks.V2.Component.Elements, BX.Vue3, BX.Tasks.V2.Component.Elements);
//# sourceMappingURL=responsible.bundle.js.map
