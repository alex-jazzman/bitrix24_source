/* eslint-disable */
this.BX = this.BX || {};
this.BX.Call = this.BX.Call || {};
this.BX.Call.Component = this.BX.Call.Component || {};
(function (exports, ui_vue3, call_component_ui_button, call_component_ui_icon, call_component_ui_tooltip, call_store, call_helper_hotkey) {
	'use strict';

	const CallCameraButton = ui_vue3.defineComponent({
		name: 'CallCameraButton',
		components: {
			CallButton: call_component_ui_button.CallButton,
			CallIcon: call_component_ui_icon.CallIcon,
			CallTooltip: call_component_ui_tooltip.CallTooltip
		},
		inject: {
			loc: {
				default: () => key => key
			}
		},
		setup() {
			return {
				mediaStore: call_store.useMediaStore(),
				uiStore: call_store.useUiStore()
			};
		},
		props: {
			testId: {
				type: String,
				default: null,
				required: true
			},
			isPopupOpen: {
				type: Boolean,
				default: false
			},
			isPip: {
				type: Boolean,
				default: false
			},
			isDesktop: {
				type: Boolean,
				default: false
			}
		},
		emits: ['corner-click'],
		computed: {
			isActive() {
				return this.mediaStore.isCameraOn;
			},
			disabled() {
				return this.uiStore.isButtonBlocked('camera');
			},
			hotkey() {
				return call_helper_hotkey.hotkey;
			},
			tooltip() {
				return `${this.hotkey.action} + Shift + V`;
			},
			testState() {
				return this.isActive ? 'active' : 'inactive';
			},
			testMeta() {
				return this.isPip ? 'pip' : null;
			}
		},
		methods: {
			handleClick() {
				this.mediaStore.toggleCamera();
			},
			handleCornerClick(event) {
				this.$emit('corner-click', event);
			}
		},
		template: `
		<CallTooltip :value="tooltip" :disabled="disabled || !isDesktop || isPip">
			<CallButton
				:test-id="testId"
				:test-state="testState"
				:test-meta="testMeta"
				:color="isActive ? 'transparent' : 'transparent-red'"
				:size="38"
				:label="loc('CALL_BLOCK_CAMERA_BUTTON_LABEL')"
				label-position="bottom"
				square
				:corner="!isPip"
				:disabled="disabled"
				@click="handleClick"
				@corner-click="handleCornerClick"
			>
				<CallIcon :icon="isActive ? 'video' : 'video-off'" :color="isActive ? 'white' : 'red'" :size="28" />
				<template v-if="!isPip" #corner>
					<CallIcon
						animated
						:style="{ transform: isPopupOpen ? 'rotate(180deg)' : null }"
						icon="chevron-down"
						:size="16"
					/>
				</template>
			</CallButton>
		</CallTooltip>
	`
	});

	exports.CallCameraButton = CallCameraButton;

})(this.BX.Call.Component.Block = this.BX.Call.Component.Block || {}, BX.Vue3, BX.Call.Component.Ui, BX.Call.Component.Ui, BX.Call.Component.Ui, BX.Call.Store, BX.Call.Helper);
//# sourceMappingURL=camera-button.bundle.js.map
