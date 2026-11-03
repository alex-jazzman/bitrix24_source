/* eslint-disable */
this.BX = this.BX || {};
this.BX.Call = this.BX.Call || {};
this.BX.Call.Component = this.BX.Call.Component || {};
(function (exports, ui_vue3, call_component_block_microphoneButton, call_component_block_cameraButton, call_component_block_screenShareButton, call_store, call_component_ui_button, call_component_ui_icon, call_component_ui_tooltip, call_component_ui_badge, call_helper_hotkey) {
	'use strict';

	const CallFooterChatButton = ui_vue3.defineComponent({
		name: 'CallFooterChatButton',
		components: {
			CallButton: call_component_ui_button.CallButton,
			CallIcon: call_component_ui_icon.CallIcon,
			CallTooltip: call_component_ui_tooltip.CallTooltip,
			CallBadge: call_component_ui_badge.CallBadge
		},
		inject: {
			loc: {
				default: () => key => key
			}
		},
		setup() {
			return {
				uiStore: call_store.useUiStore()
			};
		},
		props: {
			messagesCount: {
				type: Number,
				default: 0
			},
			isDesktop: {
				type: Boolean,
				default: false
			}
		},
		emits: [],
		computed: {
			disabled() {
				return this.uiStore.isButtonBlocked('chat');
			},
			hotkey() {
				return call_helper_hotkey.hotkey;
			},
			tooltip() {
				return `${this.hotkey.action} + Shift + C`;
			},
			badge() {
				if (!this.messagesCount) {
					return '';
				}
				return this.messagesCount > 99 ? '99+' : String(this.messagesCount);
			}
		},
		methods: {
			handleClick() {
				this.uiStore.toggleChat();
			}
		},
		template: `
		<CallTooltip :value="tooltip" :disabled="disabled || !isDesktop">
			<CallButton
				test-id="call-footer-chat-button"
				color="transparent"
				:size="38"
				:label="loc('CALL_FOOTER_CHAT_BUTTON')"
				label-position="bottom"
				square
				:disabled="disabled"
				@click="handleClick"
			>
				<CallIcon icon="chats" color="white" :size="28" />
				<template v-if="badge" #badge>
					<CallBadge test-id="call-footer-chat-button-badge" :label="badge" color="red" />
				</template>
			</CallButton>
		</CallTooltip>
	`
	});

	const CallFooterRaiseHandButton = ui_vue3.defineComponent({
		name: 'CallFooterRaiseHandButton',
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
				usersStore: call_store.useUsersStore(),
				uiStore: call_store.useUiStore()
			};
		},
		props: {
			isDesktop: {
				type: Boolean,
				default: false
			}
		},
		emits: [],
		computed: {
			isActive() {
				return this.usersStore.currentUser?.floorRequestState ?? false;
			},
			disabled() {
				return this.uiStore.isButtonBlocked('floorRequest');
			},
			hotkey() {
				return call_helper_hotkey.hotkey;
			},
			tooltip() {
				return `${this.hotkey.action} + Shift + H`;
			},
			testState() {
				return this.isActive ? 'active' : 'inactive';
			}
		},
		methods: {
			handleClick() {
				this.usersStore.toggleRaiseHand();
			}
		},
		template: `
		<CallTooltip :value="tooltip" :disabled="disabled || !isDesktop">
			<CallButton
				test-id="call-footer-raise-hand-button"
				:test-state="testState"
				:color="isActive ? 'transparent-yellow' : 'transparent'"
				:size="38"
				:label="loc('CALL_FOOTER_RAISE_HAND_BUTTON')"
				label-position="bottom"
				square
				:disabled="disabled"
				@click="handleClick"
			>
				<CallIcon :icon="isActive ? 'stop-hand-solid' : 'stop-hand'" color="white" :size="28" />
			</CallButton>
		</CallTooltip>
	`
	});

	const CallFooterRecordButton = ui_vue3.defineComponent({
		name: 'CallFooterRecordButton',
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
				recordingStore: call_store.useRecordingStore(),
				uiStore: call_store.useUiStore()
			};
		},
		props: {
			isDesktop: {
				type: Boolean,
				default: false
			}
		},
		emits: ['click'],
		computed: {
			isActive() {
				return this.recordingStore.isActive;
			},
			disabled() {
				return this.uiStore.isButtonBlocked('record');
			},
			hotkey() {
				return call_helper_hotkey.hotkey;
			},
			tooltip() {
				return `${this.hotkey.action} + Shift + R`;
			},
			testState() {
				return this.isActive ? 'active' : 'inactive';
			}
		},
		methods: {
			handleClick(event) {
				this.$emit('click', event);
			}
		},
		template: `
		<CallTooltip :value="tooltip" :disabled="disabled || !isDesktop">
			<CallButton
				test-id="call-footer-record-button"
				:test-state="testState"
				:color="isActive ? 'transparent-red' : 'transparent'"
				:size="38"
				:label="loc('CALL_FOOTER_RECORD_BUTTON')"
				label-position="bottom"
				square
				:disabled="disabled"
				@click="handleClick"
			>
				<CallIcon :icon="isActive ? 'record-solid' : 'record'" color="white" :size="28" />
			</CallButton>
		</CallTooltip>
	`
	});

	const CallFooterDocumentButton = ui_vue3.defineComponent({
		name: 'CallFooterDocumentButton',
		components: {
			CallButton: call_component_ui_button.CallButton,
			CallIcon: call_component_ui_icon.CallIcon
		},
		inject: {
			loc: {
				default: () => key => key
			}
		},
		setup() {
			return {
				uiStore: call_store.useUiStore()
			};
		},
		emits: ['click'],
		computed: {
			disabled() {
				return this.uiStore.isButtonBlocked('document');
			}
		},
		methods: {
			handleClick(event) {
				this.$emit('click', event);
			}
		},
		template: `
		<CallButton
			test-id="call-footer-document-button"
			color="transparent"
			:size="38"
			:label="loc('CALL_FOOTER_DOCUMENT_BUTTON')"
			label-position="bottom"
			square
			:disabled="disabled"
			@click="handleClick"
		>
			<CallIcon icon="document" color="white" :size="28" />
		</CallButton>
	`
	});

	const CallFooterFollowUpButton = ui_vue3.defineComponent({
		name: 'CallFooterFollowUpButton',
		components: {
			CallButton: call_component_ui_button.CallButton,
			CallIcon: call_component_ui_icon.CallIcon,
			CallTooltip: call_component_ui_tooltip.CallTooltip,
			CallBadge: call_component_ui_badge.CallBadge
		},
		inject: {
			loc: {
				default: () => key => key
			}
		},
		setup() {
			return {
				uiStore: call_store.useUiStore()
			};
		},
		props: {
			isSoon: {
				type: Boolean,
				default: false
			}
		},
		emits: [],
		computed: {
			isActive() {
				return this.uiStore.isCopilotActive;
			},
			disabled() {
				return this.uiStore.isButtonBlocked('copilot');
			},
			tooltip() {
				if (this.isActive) {
					return this.loc('CALL_FOOTER_FOLLOW_UP_BUTTON_TOOLTIP_RECORDING');
				}
				return this.loc('CALL_FOOTER_FOLLOW_UP_BUTTON_TOOLTIP_ENABLE');
			},
			testState() {
				if (this.isSoon) {
					return null;
				}
				if (this.isActive) {
					return 'active';
				}
				return 'inactive';
			},
			testMeta() {
				if (this.isSoon) {
					return 'soon';
				}
				return null;
			}
		},
		methods: {
			handleClick() {
				if (this.isSoon) {
					return;
				}
				this.uiStore.toggleFollowUp();
			}
		},
		template: `
		<CallTooltip :value="tooltip" :disabled="disabled || isSoon">
			<CallButton
				test-id="call-footer-follow-up-button"
				:test-state="testState"
				:test-meta="testMeta"
				:color="isSoon ? 'transparent' : 'copilot'"
				:size="38"
				:label="loc('CALL_FOOTER_FOLLOW_UP_BUTTON')"
				label-position="bottom"
				:square="isSoon"
				:circle="!isSoon"
				:disabled="disabled"
				:animated="!isSoon && isActive"
				@click="handleClick"
			>
				<CallIcon :icon="isSoon ? 'copilot' : 'copilot-solid'" color="white" :size="28" />
				<template v-if="isSoon" #badge>
					<CallBadge test-id="call-footer-follow-up-button-badge" :label="loc('CALL_FOOTER_FOLLOW_UP_BUTTON_BADGE_SOON')" color="blue" />
				</template>
			</CallButton>
		</CallTooltip>
	`
	});

	const CallFooterMoreButton = ui_vue3.defineComponent({
		name: 'CallFooterMoreButton',
		components: {
			CallButton: call_component_ui_button.CallButton,
			CallIcon: call_component_ui_icon.CallIcon
		},
		inject: {
			loc: {
				default: () => key => key
			}
		},
		props: {
			disabled: {
				type: Boolean,
				default: false
			},
			isOpen: {
				type: Boolean,
				default: false
			}
		},
		emits: ['click'],
		computed: {
			testState() {
				return this.isOpen ? 'active' : 'inactive';
			}
		},
		methods: {
			handleClick(event) {
				this.$emit('click', event);
			}
		},
		template: `
		<CallButton
			test-id="call-footer-more-button"
			:test-state="testState"
			:color="isOpen ? 'transparent-blue' : 'transparent'"
			:size="38"
			:label="loc('CALL_FOOTER_MORE_BUTTON')"
			label-position="bottom"
			square
			:disabled="disabled"
			@click="handleClick"
		>
			<CallIcon icon="more" color="white" :size="28" />
		</CallButton>
	`
	});

	const CallFooterHangupButton = ui_vue3.defineComponent({
		name: 'CallFooterHangupButton',
		components: {
			CallButton: call_component_ui_button.CallButton,
			CallIcon: call_component_ui_icon.CallIcon
		},
		inject: {
			loc: {
				default: () => key => key
			}
		},
		setup() {
			return {
				uiStore: call_store.useUiStore()
			};
		},
		emits: [],
		methods: {
			handleClick() {
				this.uiStore.hangup();
			}
		},
		template: `
		<CallButton
			test-id="call-footer-hangup-button"
			color="hangup"
			:size="38"
			:label="loc('CALL_FOOTER_HANGUP_BUTTON')"
			label-position="bottom"
			:style="{'--call-button-padding-x': '16px'}"
			@click="handleClick"
		>
			<CallIcon icon="hangup" color="white" :size="28" />
		</CallButton>
	`
	});

	const CallFooterHangupControlButton = ui_vue3.defineComponent({
		name: 'CallFooterHangupControlButton',
		components: {
			CallButton: call_component_ui_button.CallButton,
			CallIcon: call_component_ui_icon.CallIcon
		},
		inject: {
			loc: {
				default: () => key => key
			}
		},
		emits: ['click'],
		methods: {
			handleClick(event) {
				this.$emit('click', event);
			}
		},
		template: `
		<CallButton
			test-id="call-footer-hangup-control-button"
			color="none"
			:size="38"
			square
			@click="handleClick"
		>
			<CallIcon icon="more" color="white" :size="28" />
		</CallButton>
	`
	});

	const CallFooterMorePopup = ui_vue3.defineComponent({
		name: 'CallFooterMorePopup',
		template: `
		<div class="call-footer-more-popup js-call-footer-more-popup"></div>
	`
	});

	const CallFooter = ui_vue3.defineComponent({
		name: 'CallFooter',
		components: {
			CallMicrophoneButton: call_component_block_microphoneButton.CallMicrophoneButton,
			CallCameraButton: call_component_block_cameraButton.CallCameraButton,
			CallFooterChatButton,
			CallFooterMoreButton,
			CallFooterHangupButton,
			CallFooterHangupControlButton,
			CallFooterMorePopup
		},
		setup() {
			return {
				uiStore: call_store.useUiStore()
			};
		},
		data() {
			return {
				isMoreOpen: false
			};
		},
		computed: {
			centerButtons() {
				return [{
					key: 'raise-hand',
					component: CallFooterRaiseHandButton,
					threshold: 640
				}, {
					key: 'screen-share',
					component: call_component_block_screenShareButton.CallScreenShareButton,
					threshold: 700,
					props: {
						'test-id': 'call-footer-screen-share-button'
					}
				}, {
					key: 'record',
					component: CallFooterRecordButton,
					threshold: 760,
					on: {
						click: this.onRecordClick
					}
				}, {
					key: 'document',
					component: CallFooterDocumentButton,
					threshold: 820,
					on: {
						click: this.onDocumentClick
					}
				}, {
					key: 'follow-up',
					component: CallFooterFollowUpButton,
					threshold: 880
				}];
			},
			collapsedButtons() {
				const w = this.uiStore.layoutWidth;
				return new Set(this.centerButtons.filter(btn => w < btn.threshold).map(btn => btn.key));
			},
			isMoreVisible() {
				return this.collapsedButtons.size > 0;
			}
		},
		watch: {
			isMoreVisible(visible) {
				if (!visible) {
					this.isMoreOpen = false;
				}
			}
		},
		methods: {
			isInCenter(key) {
				return !this.collapsedButtons.has(key);
			},
			toggleMore() {
				this.isMoreOpen = !this.isMoreOpen;
			},
			onRecordClick() {
			},
			onDocumentClick() {
			},
			onHangupControlClick() {
			},
			onMicCornerClick() {
			},
			onCameraCornerClick() {
			}
		},
		template: `
		<div class="call-footer">
			<div class="call-footer__buttons --left">
				<CallMicrophoneButton test-id="call-footer-microphone-button" @corner-click="onMicCornerClick" />
				<CallCameraButton test-id="call-footer-camera-button" @corner-click="onCameraCornerClick" />
			</div>
			<div class="call-footer__buttons --center">
				<CallFooterChatButton />
				<template v-for="btn in centerButtons" :key="btn.key">
					<Teleport
						v-if="isInCenter(btn.key) || isMoreOpen"
						to=".js-call-footer-more-popup"
						:disabled="isInCenter(btn.key)"
					>
						<component :is="btn.component" v-bind="btn.props || {}" v-on="btn.on || {}" />
					</Teleport>
				</template>
				<CallFooterMoreButton v-if="isMoreVisible" :is-open="isMoreOpen" @click="toggleMore" />
			</div>
			<div class="call-footer__buttons --right">
				<CallFooterHangupButton />
				<CallFooterHangupControlButton @click="onHangupControlClick" />
			</div>
			<CallFooterMorePopup v-if="isMoreOpen" />
		</div>
	`
	});

	exports.CallFooter = CallFooter;
	exports.CallFooterChatButton = CallFooterChatButton;
	exports.CallFooterDocumentButton = CallFooterDocumentButton;
	exports.CallFooterFollowUpButton = CallFooterFollowUpButton;
	exports.CallFooterHangupButton = CallFooterHangupButton;
	exports.CallFooterHangupControlButton = CallFooterHangupControlButton;
	exports.CallFooterMoreButton = CallFooterMoreButton;
	exports.CallFooterRaiseHandButton = CallFooterRaiseHandButton;
	exports.CallFooterRecordButton = CallFooterRecordButton;

})(this.BX.Call.Component.Block = this.BX.Call.Component.Block || {}, BX.Vue3, BX.Call.Component.Block, BX.Call.Component.Block, BX.Call.Component.Block, BX.Call.Store, BX.Call.Component.Ui, BX.Call.Component.Ui, BX.Call.Component.Ui, BX.Call.Component.Ui, BX.Call.Helper);
//# sourceMappingURL=footer.bundle.js.map
