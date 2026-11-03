/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
(function (exports, main_core, ui_notificationManager, ui_vue3, ui_vue3_mixins_locMixin, tasks_v2_const, tasks_v2_core, tasks_v2_component_fields_deadline, tasks_v2_lib_deadlineRules, tasks_v2_lib_idUtils, tasks_v2_provider_service_taskService) {
	'use strict';

	const DeadlinePickerOpenStatus = Object.freeze({
		Opened: 'opened',
		InvalidRequest: 'invalidRequest',
		CoreUnavailable: 'coreUnavailable',
		Superseded: 'superseded',
		TaskUnavailable: 'taskUnavailable'
	});
	const analyticsParams = Object.freeze({
		context: tasks_v2_const.Analytics.Section.Tasks
	});
	const DeadlineChangeReasonPopupRoot = {
		name: 'TasksDeadlineChangeReasonPopupRoot',
		components: {
			DeadlineChangeReasonPopup: tasks_v2_component_fields_deadline.DeadlineChangeReasonPopup
		},
		props: {
			taskId: {
				type: Number,
				required: true
			},
			bindElement: {
				type: HTMLElement,
				required: true
			}
		},
		emits: ['close'],
		data() {
			return {
				reason: ''
			};
		},
		methods: {
			handleClose() {
				this.$emit('close', this.reason);
			}
		},
		template: `
		<DeadlineChangeReasonPopup
			:taskId
			:bindElement
			v-model="reason"
			@close="handleClose"
		/>
	`
	};
	class DeadlinePickerHost {
		#application = null;
		#container = null;
		#taskId = 0;
		#bindElement = null;
		#taskDeadlineTs = null;
		#pickedTs = null;
		#openId = 0;
		async open(request) {
			if (!this.#isValid(request)) {
				return DeadlinePickerOpenStatus.InvalidRequest;
			}
			this.close();
			const openId = ++this.#openId;
			try {
				await tasks_v2_core.Core.init();
			} catch {
				return DeadlinePickerOpenStatus.CoreUnavailable;
			}
			if (openId !== this.#openId) {
				return DeadlinePickerOpenStatus.Superseded;
			}
			const task = tasks_v2_provider_service_taskService.taskService.getStoreTask(request.taskId);
			if (!task) {
				return DeadlinePickerOpenStatus.TaskUnavailable;
			}
			this.#taskId = request.taskId;
			this.#bindElement = request.bindElement;
			this.#taskDeadlineTs = task.deadlineTs ?? null;
			this.#pickedTs = this.#taskDeadlineTs;
			this.#mount(tasks_v2_component_fields_deadline.DeadlinePopup, {
				taskId: request.taskId,
				deadlineTs: this.#pickedTs,
				bindElement: request.bindElement,
				coordinates: request.coordinates ?? null,
				'onUpdate:deadlineTs': deadlineTs => {
					this.#pickedTs = deadlineTs;
				},
				onClose: () => {
					void this.#handlePickerClose();
				}
			});
			return DeadlinePickerOpenStatus.Opened;
		}
		close() {
			const application = this.#application;
			const container = this.#container;
			this.#application = null;
			this.#container = null;
			main_core.Dom.attr(this.#bindElement, 'aria-haspopup', null);
			application?.unmount();
			container?.remove();
			this.#bindElement = null;
		}
		#mount(component, props) {
			const container = document.createElement('div');
			document.body.append(container);
			main_core.Dom.attr(this.#bindElement, 'aria-haspopup', 'dialog');
			const application = ui_vue3.BitrixVue.createApp(component, props);
			application.mixin(ui_vue3_mixins_locMixin.locMixin);
			application.use(tasks_v2_core.Core.getStore());
			this.#provide(application);
			application.mount(container);
			this.#application = application;
			this.#container = container;
		}
		#provide(application) {
			const taskId = this.#taskId;
			application.provide('settings', tasks_v2_core.Core.getParams());
			application.provide('analytics', analyticsParams);
			application.provide('analyticsSubSection', tasks_v2_const.Analytics.SubSection.Chat);
			application.provide('embedded', false);
			application.provide('onCloseEmbedded', null);
			application.provide('popupTeleportTarget', null);
			application.provide('cardType', tasks_v2_const.CardType.Full);
			application.provide('task', ui_vue3.computed(() => tasks_v2_provider_service_taskService.taskService.getStoreTask(taskId)));
			application.provide('taskId', ui_vue3.computed(() => taskId));
			application.provide('isEdit', ui_vue3.computed(() => tasks_v2_lib_idUtils.idUtils.isReal(taskId)));
			application.provide('isTemplate', ui_vue3.computed(() => tasks_v2_lib_idUtils.idUtils.isTemplate(taskId)));
		}
		async #handlePickerClose() {
			if (!this.#application) {
				return;
			}
			const deadlineTs = this.#pickedTs;
			const bindElement = this.#bindElement;
			this.close();
			if ((deadlineTs ?? 0) === (this.#taskDeadlineTs ?? 0)) {
				return;
			}
			if (tasks_v2_lib_deadlineRules.deadlineRules.requiresChangeReason(this.#taskId)) {
				this.#showChangeReasonPopup(bindElement);
				return;
			}
			await this.#saveDeadline(deadlineTs, '');
		}
		#showChangeReasonPopup(bindElement) {
			this.#bindElement = bindElement;
			this.#mount(DeadlineChangeReasonPopupRoot, {
				taskId: this.#taskId,
				bindElement,
				onClose: (changeReason = '') => {
					void this.#handleChangeReasonClose(changeReason);
				}
			});
		}
		async #handleChangeReasonClose(changeReason) {
			if (!this.#application) {
				return;
			}
			this.close();
			if (changeReason.trim() === '') {
				return;
			}
			await this.#saveDeadline(this.#pickedTs, changeReason);
		}
		async #saveDeadline(deadlineTs, changeReason) {
			const result = deadlineTs ? await tasks_v2_lib_deadlineRules.deadlineRules.saveDeadline(this.#taskId, {
				deadlineTs,
				changeReason
			}) : await tasks_v2_lib_deadlineRules.deadlineRules.clearDeadline(this.#taskId, {
				changeReason
			});
			if (result.status === tasks_v2_lib_deadlineRules.DeadlineSaveStatus.Failed) {
				ui_notificationManager.Notifier.notifyViaBrowserProvider({
					id: 'task-notify-deadline-update-error',
					text: result.errors?.[0]?.message
				});
			}
		}
		#isValid(request) {
			if (!main_core.Type.isPlainObject(request)) {
				return false;
			}
			return main_core.Type.isNumber(request.taskId) && request.taskId > 0 && main_core.Type.isDomNode(request.bindElement);
		}
	}
	const deadlinePickerHost = new DeadlinePickerHost();

	exports.DeadlinePickerHost = DeadlinePickerHost;
	exports.DeadlinePickerOpenStatus = DeadlinePickerOpenStatus;
	exports.deadlinePickerHost = deadlinePickerHost;

})(this.BX.Tasks.V2.Lib = this.BX.Tasks.V2.Lib || {}, BX, BX.UI.NotificationManager, BX.Vue3, BX.Vue3.Mixins, BX.Tasks.V2.Const, BX.Tasks.V2, BX.Tasks.V2.Component.Fields, BX.Tasks.V2.Lib, BX.Tasks.V2.Lib, BX.Tasks.V2.Provider.Service);
//# sourceMappingURL=deadline-picker-host.bundle.js.map
