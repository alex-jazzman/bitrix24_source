/* eslint-disable */
this.BX = this.BX || {};
this.BX.IM = this.BX.IM || {};
this.BX.IM.V2 = this.BX.IM.V2 || {};
(function (exports, main_core_events, tasks_v2_application_taskResultButton, im_v2_component_textarea, im_v2_const, im_v2_lib_feature) {
	'use strict';

	class TaskResultButtonController {
		#context = null;
		#button = null;
		#subscribed = false;
		mount(container, context) {
			this.#context = context;
			if (!im_v2_lib_feature.FeatureManager.isFeatureAvailable(im_v2_lib_feature.Feature.isTaskResultButtonAvailable)) {
				return;
			}
			if (!this.#subscribed) {
				main_core_events.EventEmitter.subscribe(im_v2_const.EventType.textarea.onBeforeSendMessage, this.#onBeforeSend);
				this.#subscribed = true;
			}
			this.#button?.unmounted();
			this.#button = new tasks_v2_application_taskResultButton.TaskResultButton();
			void this.#button.mounted(container, {
				taskId: context.taskId
			});
		}
		destroy() {
			if (this.#subscribed) {
				main_core_events.EventEmitter.unsubscribe(im_v2_const.EventType.textarea.onBeforeSendMessage, this.#onBeforeSend);
				this.#subscribed = false;
			}
			this.#button?.unmounted();
			this.#button = null;
		}
		#onBeforeSend = async event => {
			const {
				dialogId,
				text
			} = event.getData();
			if (!this.#context || dialogId !== this.#context.dialogId || !this.#button) {
				return im_v2_component_textarea.BeforeSendMessageAction.proceed;
			}
			const {
				handled,
				keepText
			} = await this.#button.handleBeforeSend(text);
			if (!handled) {
				return im_v2_component_textarea.BeforeSendMessageAction.proceed;
			}
			return keepText ? im_v2_component_textarea.BeforeSendMessageAction.cancelKeepText : im_v2_component_textarea.BeforeSendMessageAction.cancel;
		};
	}

	exports.TaskResultButtonController = TaskResultButtonController;

})(this.BX.IM.V2.Lib = this.BX.IM.V2.Lib || {}, BX.Event, BX.Tasks.V2.Application, BX.Messenger.v2.Component, BX.Messenger.v2.Const, BX.Messenger.v2.Lib);
//# sourceMappingURL=task-result-button.bundle.js.map
