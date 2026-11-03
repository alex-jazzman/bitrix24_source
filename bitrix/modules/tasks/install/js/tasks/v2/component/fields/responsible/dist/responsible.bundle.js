/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {};
(function (exports, main_core, main_popup, ui_vue3, ui_system_typography_vue, ui_iconSet_api_vue, ui_iconSet_outline, tasks_v2_core, tasks_v2_const, tasks_v2_component_absencePopup, tasks_v2_component_elements_participants, tasks_v2_component_elements_hint, tasks_v2_lib_ahaMoments, tasks_v2_lib_onboardingBanners, tasks_v2_lib_analytics, tasks_v2_lib_calendar, tasks_v2_lib_fieldHighlighter, tasks_v2_lib_idUtils, tasks_v2_lib_userSelectorDialog, tasks_v2_provider_service_taskService, ui_vue3_directives_hint, ui_switcher, ui_vue3_components_switcher, tasks_v2_component_elements_questionMark, tasks_v2_component_elements_userAvatarList) {
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
		data() {
			return {
				labelId: `tasks-for-new-user-switch-${main_core.Text.getRandom()}`
			};
		},
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
			},
			handleKeydown(event) {
				if (event.key !== 'Enter' && event.key !== ' ') {
					return;
				}
				event.preventDefault();
				this.handleClick();
			}
		},
		template: `
		<div :class="['tasks-field-responsible-new-user', { '--disabled': disabled }]">
			<div
				v-hint="tooltip"
				class="tasks-field-responsible-new-user-switcher"
				role="switch"
				:aria-checked="isChecked"
				:aria-labelledby="labelId"
				:aria-disabled="disabled ? 'true' : null"
				tabindex="0"
				@click="handleClick"
				@keydown="handleKeydown"
			>
				<Switcher :isChecked :options/>
				<TextSm :id="labelId" className="tasks-field-responsible-new-user-text">
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

	// SC-002: carries the banner's async-load failure from ResponsibleBanner.onError (which
	// has no component instance in scope) to the Responsible field's errorCaptured() below.
	// The acquireSlot() mutex guarantees at most one banner load is ever in flight, so a
	// single module-scoped slot needs no per-instance keying.
	let responsibleBannerLoadError = null;

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
			TextXs: ui_system_typography_vue.TextXs,
			// SC-002: inline onboarding banner loaded lazily so its extension (banner/css/
			// asset) stays out of the responsible field's rel; it renders only once the v-if
			// gate arms it for an eligible new user on the create form.
			// Built with a raw async component (not BitrixVue.defineAsyncComponent, whose loader
			// swallows load failures) so a failed chunk load reaches onError and frees the
			// onboarding slot mounted() grabbed — otherwise the mutex would suppress
			// SC-001/SC-003 for the whole card session.
			ResponsibleBanner: ui_vue3.defineAsyncComponent({
				loader: () => main_core.Runtime.loadExtension('tasks.v2.component.onboarding.responsible-banner').then(exports => exports.ResponsibleBanner),
				onError(error, retry, fail) {
					// The banner chunk failed to load: the async component will never mount and
					// the user can never dismiss it. Release the shared onboarding slot so the
					// mutex stops suppressing SC-001/SC-003 (best-effort, mirrors
					// onboardingBanners.setViewed()). fail() settles the wrapper (nulls Vue's
					// cached request so a later card retries) and routes the error to the
					// Responsible field's errorCaptured(), which disarms this instance's banner.
					tasks_v2_lib_onboardingBanners.onboardingBanners.releaseSlot('responsible');
					responsibleBannerLoadError = error;
					fail(error);
				}
			})
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
				isResponsibleOnboardingShown: false,
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
			},
			manyAhaHintOptions() {
				return {
					closeByEsc: true,
					focusTrap: {
						initialFocus: false
					},
					ariaLabel: this.loc('TASKS_V2_RESPONSIBLE_MANY_AHA')
				};
			}
		},
		watch: {
			// SC-002: hide the banner after actual delegation (responsible changed to someone else).
			'task.responsibleIds': function watchResponsibleIds(ids) {
				if (!this.isResponsibleOnboardingShown) {
					return;
				}
				const isSelfOnly = Array.isArray(ids) && ids.length === 1 && Number(ids[0]) === Number(this.currentUserId);
				if (!isSelfOnly) {
					this.isResponsibleOnboardingShown = false;
					tasks_v2_lib_onboardingBanners.onboardingBanners.releaseSlot('responsible');
				}
			}
		},
		mounted() {
			const existingAbsences = this.$store.getters[`${tasks_v2_const.Model.Absences}/getByUserIds`](this.task.responsibleIds);
			existingAbsences.forEach(({
				userId
			}) => {
				this.armedAbsencePopupUserIds.add(userId);
			});

			// SC-002: on opening the create form, show the «delegate» banner under this field
			// if the server-side trigger («3 self-assigned in a row») is met (ALG-01). Shown only
			// in states where the Participants selector is actually rendered and editable — the CTA
			// opens that selector, so it would be a no-op with the auto assignee (isFlowFilledOnAdd),
			// the NewUserLabel (forNewUser) or without delegate rights (!canEdit).
			// Skip when the assignee is already delegated to someone else (e.g. the create form was
			// opened as a copy with a non-self responsible): the delegation is already done, so mirror
			// the watcher's isSelfOnly check here and do not grab the slot for an already-done action.
			const isSelfOnly = Array.isArray(this.task.responsibleIds) && this.task.responsibleIds.length === 1 && Number(this.task.responsibleIds[0]) === Number(this.currentUserId);
			if (isSelfOnly && !this.isEdit && !this.isTemplate && !this.isFlowFilledOnAdd && !this.forNewUser && this.canEdit && tasks_v2_lib_onboardingBanners.onboardingBanners.shouldShow('responsible') && tasks_v2_lib_onboardingBanners.onboardingBanners.acquireSlot('responsible')) {
				this.isResponsibleOnboardingShown = true;
			}
		},
		beforeUnmount() {
			// SC-002: release slot if banner is still shown on unmount.
			if (this.isResponsibleOnboardingShown) {
				tasks_v2_lib_onboardingBanners.onboardingBanners.releaseSlot('responsible');
				this.isResponsibleOnboardingShown = false;
			}
		},
		// SC-002: the async banner failed to load (its slot was already freed in
		// ResponsibleBanner.onError). Disarm this instance's banner and stop the error here
		// (return false) so it does not reach the global handler. Identity-matched against the
		// banner load error so unrelated descendant errors keep propagating (return true).
		errorCaptured(error) {
			const isBannerLoadError = error === responsibleBannerLoadError;
			if (isBannerLoadError) {
				responsibleBannerLoadError = null;
				this.isResponsibleOnboardingShown = false;
			}
			return !isBannerLoadError;
		},
		methods: {
			// AC-010: user closed the SC-002 inline banner.
			onResponsibleOnboardingClose() {
				tasks_v2_lib_analytics.analytics.sendBannerInteraction(this.analytics, {
					event: tasks_v2_const.Analytics.Event.CloseSuggestBanner,
					element: tasks_v2_const.Analytics.Element.Executor,
					cardType: this.cardType
				});
				tasks_v2_lib_onboardingBanners.onboardingBanners.setViewed('responsible');
				this.isResponsibleOnboardingShown = false;
				tasks_v2_lib_onboardingBanners.onboardingBanners.releaseSlot('responsible');
			},
			// AC-011: user clicked the CTA "Delegate tasks" in the SC-002 banner.
			// Opens the responsible selector; banner hides only after actual delegation (watcher).
			onResponsibleOnboardingAction() {
				tasks_v2_lib_analytics.analytics.sendBannerInteraction(this.analytics, {
					event: tasks_v2_const.Analytics.Event.ClickSuggestBanner,
					element: tasks_v2_const.Analytics.Element.Executor,
					cardType: this.cardType
				});
				this.$refs.participants?.showDialog?.();
			},
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
				ref="participants"
				:taskId
				:context="responsibleMeta.id"
				:userIds="task.responsibleIds"
				:ariaLabel="canEdit ? loc('TASKS_V2_RESPONSIBLE_ARIA_LABEL') : ''"
				:userAriaLabelTemplate="canEdit ? loc('TASKS_V2_RESPONSIBLE_VALUE_ARIA_LABEL') : ''"
				:addAriaLabel="canEdit ? loc('TASKS_V2_RESPONSIBLE_ADD_ARIA_LABEL') : ''"
				:ariaHaspopup="canEdit ? 'dialog' : ''"
				:clearAriaLabel="loc('TASKS_V2_RESPONSIBLE_CLEAR_ARIA_LABEL')"
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
		<ResponsibleBanner
			v-if="isResponsibleOnboardingShown"
			@close="onResponsibleOnboardingClose"
			@action="onResponsibleOnboardingAction"
		/>
		<Hint
			v-if="isManyAhaShown"
			:bindElement="$refs.container"
			:options="manyAhaHintOptions"
			@close="isManyAhaShown = false"
		>
			<div class="tasks-field-responsible-many-aha">
				<div>{{ loc('TASKS_V2_RESPONSIBLE_MANY_AHA') }}</div>
				<TextXs
						tag="button"
						type="button"
						className="tasks-field-responsible-many-aha-stop"
						@click="stopManyAha"
					>{{ loc('TASKS_V2_RESPONSIBLE_MANY_AHA_STOP') }}</TextXs>
			</div>
		</Hint>
	`
	};

	exports.Responsible = Responsible;
	exports.responsibleMeta = responsibleMeta;

})(this.BX.Tasks.V2.Component.Fields = this.BX.Tasks.V2.Component.Fields || {}, BX, BX.Main, BX.Vue3, BX.UI.System.Typography.Vue, BX.UI.IconSet, window, BX.Tasks.V2, BX.Tasks.V2.Const, BX.Tasks.V2.Component, BX.Tasks.V2.Component.Elements, BX.Tasks.V2.Component.Elements, BX.Tasks.V2.Lib, BX.Tasks.V2.Lib, BX.Tasks.V2.Lib, BX.Tasks.V2.Lib, BX.Tasks.V2.Lib, BX.Tasks.V2.Lib, BX.Tasks.V2.Lib, BX.Tasks.V2.Provider.Service, BX.Vue3.Directives, BX.UI, BX.UI.Vue3.Components, BX.Tasks.V2.Component.Elements, BX.Tasks.V2.Component.Elements);
//# sourceMappingURL=responsible.bundle.js.map
