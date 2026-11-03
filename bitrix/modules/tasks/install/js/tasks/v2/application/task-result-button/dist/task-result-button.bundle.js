/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
(function (exports, ui_vue3, ui_vue3_mixins_locMixin, tasks_v2_lib_apiClient, tasks_v2_const, main_core, main_core_events, ui_iconSet_api_core, ui_system_chip_vue, ui_notification) {
	'use strict';

	// @vue/component
	const TaskResultButtonContent = {
		name: 'TasksTaskResultButton',
		components: {
			Chip: ui_system_chip_vue.Chip
		},
		props: {
			context: {
				type: Object,
				required: true
			}
		},
		setup() {
			return {
				ChipSize: ui_system_chip_vue.ChipSize
			};
		},
		data() {
			return {
				isActive: false,
				isSaving: false
			};
		},
		computed: {
			chipText() {
				return this.loc('TASKS_V2_APPLICATION_TASK_RESULT_BUTTON_TEXT');
			},
			chipIcon() {
				return this.isSaving ? ui_iconSet_api_core.Outline.HOURGLASS : ui_iconSet_api_core.Outline.WINDOW_FLAG;
			},
			chipDesign() {
				return this.isActive ? ui_system_chip_vue.ChipDesign.ShadowOutlineAccent2 : ui_system_chip_vue.ChipDesign.OutlineNoAccent;
			}
		},
		methods: {
			handleClick() {
				if (this.isSaving) {
					return;
				}
				this.isActive = !this.isActive;
			},
			async handleBeforeSend(text) {
				if (!this.isActive) {
					return {
						handled: false,
						keepText: false
					};
				}
				if (this.isSaving) {
					return {
						handled: true,
						keepText: true
					};
				}
				const trimmed = (text ?? '').trim();
				if (trimmed === '') {
					return {
						handled: true,
						keepText: true
					};
				}
				const isAdded = await this.addResult(trimmed);
				if (isAdded) {
					return {
						handled: true,
						keepText: false
					};
				}
				this.showError();
				return {
					handled: true,
					keepText: true
				};
			},
			async addResult(text) {
				this.isSaving = true;
				try {
					await tasks_v2_lib_apiClient.apiClient.post(tasks_v2_const.Endpoint.TaskResultAdd, {
						results: [{
							taskId: this.context.taskId,
							text
						}]
					});
					this.emitResultAdded();
					this.sendAnalytics();
					this.isActive = false;
					return true;
				} catch {
					return false;
				} finally {
					this.isSaving = false;
				}
			},
			emitResultAdded() {
				const payload = {
					taskId: this.context.taskId
				};
				main_core_events.EventEmitter.emit(tasks_v2_const.EventName.ResultSuccessfulAdded, payload);
				main_core_events.EventEmitter.emit(tasks_v2_const.EventName.ResultAdded, payload);
			},
			sendAnalytics() {
				main_core.Runtime.loadExtension('tasks.v2.lib.analytics').then(extension => {
					extension.analytics.sendStatusSummaryAdd({
						context: '',
						additionalContext: '',
						element: tasks_v2_const.Analytics.Element.AddResult
					}, {
						isSuccess: true,
						cardType: tasks_v2_const.CardType.Full,
						taskId: this.context.taskId,
						element: tasks_v2_const.Analytics.Element.AddResult,
						subSection: tasks_v2_const.Analytics.SubSection.Chat
					});
				}).catch(error => {
					console.error('TaskResultButton: analytics failed', error);
				});
			},
			showError() {
				ui_notification.Center.notify({
					content: this.loc('TASKS_V2_APPLICATION_TASK_RESULT_BUTTON_ADD_ERROR')
				});
			}
		},
		template: `
		<Chip
			:size="ChipSize.Sm"
			:design="chipDesign"
			:text="chipText"
			:icon="chipIcon"
			data-testid="task-result-button"
			role="button"
			:aria-label="chipText"
			:aria-pressed="isActive ? 'true' : 'false'"
			:aria-disabled="isSaving ? 'true' : 'false'"
			rounded
			@click="handleClick"
			@keydown.space.prevent="handleClick"
		/>
	`
	};

	class TaskResultButton {
		#application = null;
		#instance = null;
		#unmounted = false;
		async mounted(container, context) {
			if (!Number.isInteger(context.taskId) || context.taskId <= 0) {
				return;
			}
			const canAddResult = await this.#canAddResult(context.taskId);
			if (!canAddResult || this.#unmounted) {
				return;
			}
			const application = ui_vue3.BitrixVue.createApp(TaskResultButtonContent, {
				context
			});
			application.mixin(ui_vue3_mixins_locMixin.locMixin);
			this.#instance = application.mount(container);
			this.#application = application;
		}
		async handleBeforeSend(text) {
			if (!this.#instance) {
				return {
					handled: false,
					keepText: false
				};
			}
			return this.#instance.handleBeforeSend(text);
		}
		unmounted() {
			this.#unmounted = true;
			this.#application?.unmount();
			this.#application = null;
			this.#instance = null;
		}
		async #canAddResult(taskId) {
			try {
				const response = await tasks_v2_lib_apiClient.apiClient.post(tasks_v2_const.Endpoint.TaskAccessGet, {
					task: {
						id: taskId
					}
				});
				return Boolean(response?.rights?.createResult);
			} catch (error) {
				console.error('TaskResultButton: access check failed', error);
				return false;
			}
		}
	}

	exports.TaskResultButton = TaskResultButton;

})(this.BX.Tasks.V2.Application = this.BX.Tasks.V2.Application || {}, BX.Vue3, BX.Vue3.Mixins, BX.Tasks.V2.Lib, BX.Tasks.V2.Const, BX, BX.Event, BX.UI.IconSet, BX.UI.System.Chip.Vue, BX.UI.Notification);
//# sourceMappingURL=task-result-button.bundle.js.map
