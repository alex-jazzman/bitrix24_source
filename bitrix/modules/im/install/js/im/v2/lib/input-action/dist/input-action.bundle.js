/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports, im_v2_application_core, im_v2_const) {
	'use strict';

	const InputAction = {
		writing: 'writing',
		recordingVoice: 'recordingVoice',
		sendingFile: 'sendingFile'
	};
	const DEFAULT_ACTION_DURATION = 25000;
	const ActionDurationMap = {
		[InputAction.writing]: {
			[im_v2_const.ChatType.copilot]: 180_000,
			default: DEFAULT_ACTION_DURATION
		},
		[InputAction.recordingVoice]: {
			default: DEFAULT_ACTION_DURATION
		},
		[InputAction.sendingFile]: {
			default: DEFAULT_ACTION_DURATION
		}
	};
	class InputActionListener {
		static #instance;
		#actionTimers = {};
		static getInstance() {
			if (!this.#instance) {
				this.#instance = new this();
			}
			return this.#instance;
		}
		startAction(actionPayload) {
			if (this.#isAlreadyActive(actionPayload)) {
				this.stopAction(actionPayload);
			}
			void im_v2_application_core.Core.getStore().dispatch('chats/inputActions/start', actionPayload);
			const timerId = this.#buildTimerId(actionPayload);
			this.#actionTimers[timerId] = this.#setTimer(actionPayload);
		}
		stopAction(actionPayload) {
			if (!this.#isAlreadyActive(actionPayload)) {
				return;
			}
			const timerId = this.#buildTimerId(actionPayload);
			this.#clearTimer(timerId);
			void im_v2_application_core.Core.getStore().dispatch('chats/inputActions/stop', actionPayload);
		}
		clear() {
			Object.values(this.#actionTimers).forEach(timerId => {
				clearTimeout(timerId);
			});
			this.#actionTimers = {};
		}
		#isAlreadyActive(payload) {
			return im_v2_application_core.Core.getStore().getters['chats/inputActions/isActionActive'](payload);
		}
		#buildTimerId(payload) {
			const {
				dialogId,
				userId
			} = payload;
			return `${dialogId}|${userId}`;
		}
		#setTimer(payload) {
			const actionDuration = this.#getActionDuration(payload);
			return setTimeout(() => {
				this.stopAction(payload);
			}, actionDuration);
		}
		#clearTimer(timerId) {
			clearTimeout(this.#actionTimers[timerId]);
			delete this.#actionTimers[timerId];
		}
		#getActionDuration(payload) {
			const {
				type,
				dialogId,
				duration
			} = payload;
			if (duration && duration > 0) {
				return duration;
			}
			const typeDurationMap = ActionDurationMap[type];
			const chat = im_v2_application_core.Core.getStore().getters['chats/get'](dialogId, true);
			return typeDurationMap[chat.type] ?? typeDurationMap.default;
		}
	}

	exports.InputAction = InputAction;
	exports.InputActionListener = InputActionListener;

})(this.BX.Messenger.v2.Lib = this.BX.Messenger.v2.Lib || {}, BX.Messenger.v2.Application, BX.Messenger.v2.Const);
//# sourceMappingURL=input-action.bundle.js.map
