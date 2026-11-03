/* eslint-disable */
this.BX = this.BX || {};
this.BX.Call = this.BX.Call || {};
this.BX.Call.Component = this.BX.Call.Component || {};
(function (exports, ui_vue3, call_component_ui_modal) {
	'use strict';

	const CallConfirmModal = ui_vue3.defineComponent({
		name: 'CallConfirmModal',
		components: {
			CallModal: call_component_ui_modal.CallModal
		},
		inject: {
			loc: {
				default: () => key => key
			}
		},
		props: {
			visible: {
				type: Boolean,
				default: false
			},
			title: {
				type: String,
				default: ''
			},
			message: {
				type: String,
				default: ''
			},
			yesButtonText: {
				type: String,
				default: ''
			},
			noButtonText: {
				type: String,
				default: ''
			},
			targetContainer: {
				type: [HTMLElement, String],
				default: null
			}
		},
		emits: ['update:visible', 'yes', 'no', 'close'],
		computed: {
			hasYesButton() {
				return this.yesButtonText.length > 0;
			},
			hasNoButton() {
				return this.noButtonText.length > 0;
			}
		},
		methods: {
			onUpdateVisible(value) {
				this.$emit('update:visible', value);
			},
			onYes(close) {
				this.$emit('yes');
				close();
			},
			onNo(close) {
				this.$emit('no');
				close();
			},
			onClose() {
				this.$emit('close');
			}
		},
		template: `
		<CallModal
			:visible="visible"
			:title="title || null"
			:targetContainer="targetContainer"
			:closeByEsc="false"
			@update:visible="onUpdateVisible"
			@close="onClose"
		>
			<template #default>
				<div v-if="message" class="call-confirm-modal__message" data-testid="call-confirm-modal-message">
					{{ message }}
				</div>
			</template>
			<template v-if="hasYesButton || hasNoButton" #footer="{ close }">
				<button
					v-if="hasYesButton"
					type="button"
					class="call-confirm-modal__button --yes"
					data-testid="call-confirm-modal-button-yes"
					@click="onYes(close)"
				>
					{{ yesButtonText }}
				</button>
				<button
					v-if="hasNoButton"
					type="button"
					class="call-confirm-modal__button --no"
					data-testid="call-confirm-modal-button-no"
					@click="onNo(close)"
				>
					{{ noButtonText }}
				</button>
			</template>
		</CallModal>
	`
	});

	exports.CallConfirmModal = CallConfirmModal;

})(this.BX.Call.Component.Block = this.BX.Call.Component.Block || {}, BX.Vue3, BX.Call.Component.UI);
//# sourceMappingURL=confirm-modal.bundle.js.map
