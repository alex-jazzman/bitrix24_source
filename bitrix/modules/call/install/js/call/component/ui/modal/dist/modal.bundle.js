/* eslint-disable */
this.BX = this.BX || {};
this.BX.Call = this.BX.Call || {};
this.BX.Call.Component = this.BX.Call.Component || {};
(function (exports, main_core, ui_vue3, ui_vue3_components_popup, call_component_ui_icon) {
	'use strict';

	const CallModal = ui_vue3.defineComponent({
		name: 'CallModal',
		components: {
			UiPopup: ui_vue3_components_popup.Popup,
			CallIcon: call_component_ui_icon.CallIcon
		},
		props: {
			id: {
				type: String,
				default: () => `call-modal-${main_core.Text.getRandom()}`
			},
			visible: {
				type: Boolean,
				default: false
			},
			title: {
				type: String,
				default: null
			},
			width: {
				type: Number,
				default: 420
			},
			maxWidth: {
				type: Number,
				default: 420
			},
			closeByEsc: {
				type: Boolean,
				default: true
			},
			closable: {
				type: Boolean,
				default: true
			},
			dismissableMask: {
				type: Boolean,
				default: false
			},
			targetContainer: {
				type: [HTMLElement, String],
				default: null
			},
			className: {
				type: String,
				default: null
			},
			options: {
				type: Object,
				default: null
			}
		},
		emits: ['update:visible', 'close'],
		data() {
			return {
				internalVisible: this.visible
			};
		},
		computed: {
			popupOptions() {
				return {
					bindElement: null,
					overlay: {
						opacity: 20
					},
					width: this.width,
					maxWidth: this.maxWidth,
					closeByEsc: this.closeByEsc,
					closeIcon: false,
					autoHide: this.dismissableMask,
					targetContainer: this.targetContainer,
					className: this.className,
					darkMode: true,
					contentBackground: '#22272B',
					contentBorderRadius: '10px',
					contentNoPaddings: true,
					animation: 'fading',
					cacheable: false,
					...(this.options ?? {})
				};
			}
		},
		watch: {
			visible(value) {
				if (value !== this.internalVisible) {
					this.internalVisible = value;
				}
			}
		},
		methods: {
			show() {
				this.setVisible(true);
			},
			hide() {
				this.setVisible(false);
			},
			toggle() {
				this.setVisible(!this.internalVisible);
			},
			close() {
				this.setVisible(false);
			},
			setVisible(value) {
				if (value === this.internalVisible) {
					return;
				}
				this.internalVisible = value;
				this.$emit('update:visible', value);
			},
			onClose() {
				const wasVisible = this.internalVisible;
				this.setVisible(false);
				if (wasVisible) {
					this.$emit('close');
				}
			}
		},
		template: `
		<UiPopup v-if="internalVisible" ref="popup" :id="id" :options="popupOptions" @close="onClose">
			<template #default="{ freeze, unfreeze }">
				<div class="call-modal__content">
					<button
						v-if="closable"
						type="button"
						class="call-modal__close"
						data-testid="call-modal-close"
						:aria-label="'Close'"
						@click="close"
					>
						<CallIcon icon="cross" :size="16" color="white" />
					</button>
					<div v-if="title || $slots.header" class="call-modal__header">
						<slot name="header">{{ title }}</slot>
					</div>
					<div class="call-modal__body">
						<slot :close="close" :freeze="freeze" :unfreeze="unfreeze"></slot>
					</div>
					<div v-if="$slots.footer" class="call-modal__footer">
						<slot name="footer" :close="close"></slot>
					</div>
				</div>
			</template>
		</UiPopup>
	`
	});

	exports.CallModal = CallModal;

})(this.BX.Call.Component.UI = this.BX.Call.Component.UI || {}, BX, BX.Vue3, BX.UI.Vue3.Components, BX.Call.Component.Ui);
//# sourceMappingURL=modal.bundle.js.map
