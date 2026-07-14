/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
(function (exports, ui_vue3, main_core, main_date, ui_system_typography_vue, ui_vue3_components_button, ui_iconSet_api_vue, ui_iconSet_outline, tasks_v2_const, tasks_v2_component_elements_hint, tasks_v2_lib_calendar, tasks_v2_provider_service_absenceService, tasks_v2_core) {
	'use strict';

	const popupClassName = 'tasks-absence-popup';

	// @vue/component
	const AbsencePopupInstance = {
		name: 'AbsencePopupInstance',
		components: {
			Hint: tasks_v2_component_elements_hint.Hint,
			TextLg: ui_system_typography_vue.TextLg,
			TextXs: ui_system_typography_vue.TextXs,
			UiButton: ui_vue3_components_button.Button
		},
		inject: {
			taskId: {}
		},
		props: {
			bindElement: {
				type: HTMLElement,
				required: true
			},
			userId: {
				type: Number,
				required: true
			},
			shown: {
				type: Boolean,
				default: false
			}
		},
		emits: ['update:shown'],
		setup() {
			return {
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				ButtonSize: ui_vue3_components_button.ButtonSize,
				Outline: ui_iconSet_api_vue.Outline
			};
		},
		computed: {
			user() {
				return this.$store.getters[`${tasks_v2_const.Model.Users}/getById`](this.userId);
			},
			userAbsences() {
				return this.$store.getters[`${tasks_v2_const.Model.Absences}/getByUserId`](this.userId);
			},
			absence() {
				const todayTs = tasks_v2_lib_calendar.calendar.todyTs;
				return this.userAbsences.find(({
					fromTs,
					toTs
				}) => todayTs >= fromTs && todayTs <= toTs);
			},
			text() {
				if (!this.absence) {
					return '';
				}
				if (this.absence.fromTs === this.absence.toTs) {
					return this.loc('TASKS_V2_ABSENCE_POPUP_SINGLE_DATE_TEXT', {
						'#USER_NAME#': this.user.name,
						'#DATE#': this.formatDate(this.absence.fromTs)
					});
				}
				return this.loc('TASKS_V2_ABSENCE_POPUP_TEXT', {
					'#USER_NAME#': this.user.name,
					'#DATE_FROM#': this.formatDate(this.absence.fromTs),
					'#DATE_TO#': this.formatDate(this.absence.toTs)
				});
			},
			options() {
				return {
					id: `tasks-task-absence-popup-${this.userId}-${this.absence?.id}-${main_core.Text.getRandom()}`,
					className: `${popupClassName} tasks-hint-popup`,
					offsetLeft: 0,
					angle: {
						offset: 38
					},
					autoHideHandler: this.handleHide.bind(this),
					closeIcon: true,
					bindOptions: {
						forceBindPosition: true,
						forceTop: true,
						position: 'bottom'
					}
				};
			}
		},
		unmounted() {
			this.tooltip?.close();
		},
		methods: {
			close() {
				this.$emit('update:shown', false);
			},
			handleHide(event) {
				return !main_core.Dom.hasClass(event.target?.parentNode, popupClassName);
			},
			async handleViewed() {
				await tasks_v2_provider_service_absenceService.absenceService.setViewed(this.absence.id, this.userId);
				this.close();
			},
			formatDate(ts = 0) {
				return main_date.DateTimeFormat.format(main_date.DateTimeFormat.getFormat('LONG_DATE_FORMAT'), ts / 1000)?.replaceAll(' ', '\u00A0');
			}
		},
		template: `
		<Hint v-if="shown && absence?.userId === userId" :bindElement :options @close="close">
			<div class="tasks-task-absence-popup-content" data-testid="task-absence-popup">
				<div class="tasks-task-absence-popup-body">
					<TextLg class="tasks-task-absence-popup-body-text">{{ text }}</TextLg>
				</div>
				<div class="tasks-task-absence-popup-footer">
					<button
						class="tasks-task-absence-popup-footer-btn --ui-context-edge-dark"
						type="button"
						data-task-absence-button-id="viewed"
						data-testid="task-absence-popup-viewed-btn"
						@click="handleViewed"
					>
						<TextXs>{{ loc('TASKS_V2_ABSENCE_POPUP_VIEWED_BUTTON_LABEL') }}</TextXs>
					</button>
				</div>
			</div>
		</Hint>
	`
	};

	async function loadUsersAbsenceInfo(items = []) {
		const $store = tasks_v2_core.Core.getStore();
		const currentUserId = $store.getters[`${tasks_v2_const.Model.Interface}/currentUserId`];
		const userIds = items.filter(item => item.customData.get('isOnVacation') && item.getId() !== currentUserId).map(item => item.getId());
		if (userIds.length > 0) {
			await $store.dispatch(`${tasks_v2_const.Model.Absences}/setFetching`, true);
			await tasks_v2_provider_service_absenceService.absenceService.getUsersAbsenceInfo(userIds);
			await $store.dispatch(`${tasks_v2_const.Model.Absences}/setFetching`, false);
		}
		return userIds;
	}

	// @vue/component
	const AbsencePopup = {
		name: 'AbsencePopup',
		components: {
			AbsencePopupContent: AbsencePopupInstance
		},
		props: {
			getBindElement: {
				type: Function,
				required: true
			},
			userId: {
				type: Number,
				required: true
			},
			delay: {
				type: Number,
				default: 0
			}
		},
		emits: ['open', 'close'],
		data() {
			return {
				shown: false
			};
		},
		mounted() {
			this.showPopup();
		},
		methods: {
			showPopup() {
				setTimeout(() => {
					this.shown = true;
					this.$emit('open', this.userId);
				}, this.delay);
			}
		},
		render() {
			if (!this.shown) {
				return null;
			}
			return ui_vue3.h(AbsencePopupInstance, {
				shown: this.shown,
				userId: this.userId,
				bindElement: this.getBindElement(),
				'onUpdate:shown': shown => {
					this.shown = shown;
					if (!shown) {
						this.$emit('close', this.userId);
					}
				}
			});
		}
	};

	exports.AbsencePopup = AbsencePopup;
	exports.loadUsersAbsenceInfo = loadUsersAbsenceInfo;

})(this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {}, BX.Vue3, BX, BX.Main, BX.UI.System.Typography.Vue, BX.Vue3.Components, BX.UI.IconSet, window, BX.Tasks.V2.Const, BX.Tasks.V2.Component.Elements, BX.Tasks.V2.Lib, BX.Tasks.V2.Provider.Service, BX.Tasks.V2);
//# sourceMappingURL=absence-popup.bundle.js.map
