/* eslint-disable */
this.BX = this.BX || {};
this.BX.Call = this.BX.Call || {};
this.BX.Call.Component = this.BX.Call.Component || {};
(function (exports, ui_vue3, call_component_ui_button, call_component_ui_icon, call_component_ui_tooltip, call_store, call_helper_hotkey) {
	'use strict';

	const CallScreenShareButton = ui_vue3.defineComponent({
		name: 'CallScreenShareButton',
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
			isPip: {
				type: Boolean,
				default: false
			},
			isDesktop: {
				type: Boolean,
				default: false
			}
		},
		emits: [],
		computed: {
			isActive() {
				return this.mediaStore.isScreenSharingActive;
			},
			disabled() {
				return this.uiStore.isButtonBlocked('screen');
			},
			hotkey() {
				return call_helper_hotkey.hotkey;
			},
			tooltip() {
				return `${this.hotkey.action} + Shift + S`;
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
				this.mediaStore.toggleScreenSharing();
			}
		},
		template: `
		<CallTooltip :value="tooltip" :disabled="disabled || !isDesktop || isPip">
			<CallButton
				:test-id="testId"
				:test-state="testState"
				:test-meta="testMeta"
				:color="isActive ? 'transparent-blue' : 'transparent'"
				:size="38"
				:label="loc('CALL_BLOCK_SCREEN_SHARE_BUTTON_LABEL')"
				label-position="bottom"
				square
				:disabled="disabled"
				@click="handleClick"
			>
				<CallIcon :icon="isActive ? 'screen-share-pause' : 'screen-share'" color="white" :size="28" />
			</CallButton>
		</CallTooltip>
	`
	});

	exports.CallScreenShareButton = CallScreenShareButton;

})(this.BX.Call.Component.Block = this.BX.Call.Component.Block || {}, BX.Vue3, BX.Call.Component.Ui, BX.Call.Component.Ui, BX.Call.Component.Ui, BX.Call.Store, BX.Call.Helper);
//# sourceMappingURL=screen-share-button.bundle.js.map
