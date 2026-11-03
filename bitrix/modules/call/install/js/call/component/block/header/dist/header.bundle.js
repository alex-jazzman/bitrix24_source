/* eslint-disable */
this.BX = this.BX || {};
this.BX.Call = this.BX.Call || {};
this.BX.Call.Component = this.BX.Call.Component || {};
(function (exports, ui_vue3, call_component_ui_logo, call_component_ui_icon, call_component_ui_tooltip, call_component_block_recordIndicator, call_component_ui_button, call_store) {
	'use strict';

	const CallHeaderSecurityIndicator = ui_vue3.defineComponent({
		name: 'CallHeaderSecurityIndicator',
		components: {
			CallIcon: call_component_ui_icon.CallIcon,
			CallTooltip: call_component_ui_tooltip.CallTooltip
		},
		inject: {
			loc: {
				default: () => key => key
			}
		},
		template: `
		<CallTooltip
			test-id="call-header-security-indicator"
			:value="loc('CALL_SECURITY_INDICATOR_SECURE_DESC')"
			position="bottom"
			tooltip-class="call-header-security-indicator__tooltip"
			class="call-header-security-indicator"
		>
			<CallIcon icon="shield-checked" color="green" :size="20"/>
			<div class="call-header-security-indicator__text">{{ loc('CALL_SECURITY_INDICATOR_SECURE') }}</div>
		</CallTooltip>
	`
	});

	const CallHeaderControlButton = ui_vue3.defineComponent({
		name: 'CallHeaderControlButton',
		components: {
			CallButton: call_component_ui_button.CallButton,
			CallIcon: call_component_ui_icon.CallIcon
		},
		inject: {
			loc: {
				default: () => key => key
			}
		},
		emits: [],
		methods: {
			handleClick() {
			}
		},
		template: `
		<CallButton test-id="call-header-control-button" color="transparent" :label="loc('CALL_HEADER_CONTROL_BUTTON')" @click="handleClick">
			<template #prepend>
				<CallIcon icon="setting" :size="20" />
			</template>
		</CallButton>
	`
	});

	const CallHeaderFullscreenButton = ui_vue3.defineComponent({
		name: 'CallHeaderFullscreenButton',
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
			isFullscreen: {
				type: Boolean,
				default: false
			}
		},
		emits: [],
		methods: {
			handleClick() {
			}
		},
		template: `
		<CallButton
			test-id="call-header-fullscreen-button"
			color="transparent"
			:label="isFullscreen ? loc('CALL_HEADER_FULLSCREEN_BUTTON_COLLAPSE') : loc('CALL_HEADER_FULLSCREEN_BUTTON_EXPAND')"
			@click="handleClick"
		>
			<template #prepend>
				<CallIcon :icon="isFullscreen ? 'collapse' : 'expand'" :size="20" />
			</template>
		</CallButton>
	`
	});

	const CallHeaderParticipantButton = ui_vue3.defineComponent({
		name: 'CallHeaderParticipantButton',
		components: {
			CallButton: call_component_ui_button.CallButton,
			CallButtonSplit: call_component_ui_button.CallButtonSplit,
			CallIcon: call_component_ui_icon.CallIcon
		},
		inject: {
			loc: {
				default: () => key => key
			}
		},
		props: {
			isConference: {
				type: Boolean,
				default: false
			},
			count: {
				type: Number,
				default: 0
			}
		},
		emits: [],
		methods: {
			handleClick() {
			}
		},
		template: `
		<CallButtonSplit v-if="!isConference">
			<CallButton test-id="call-header-participant-button" readonly>
				<CallIcon icon="persons" :size="20" />
				{{ count }}
			</CallButton>
			<CallButton
				test-id="call-button-participants-add"
				:label="loc('CALL_HEADER_PARTICIPANT_BUTTON')"
				@click="handleClick"
			>
				<template #append>
					<CallIcon icon="plus" :size="16" />
				</template>
			</CallButton>
		</CallButtonSplit>
		<CallButton v-else test-id="call-header-participant-button" readonly>
			<CallIcon icon="persons" :size="20" />
			{{ count }}
		</CallButton>
	`
	});

	const CallHeaderRateButton = ui_vue3.defineComponent({
		name: 'CallHeaderRateButton',
		components: {
			CallButton: call_component_ui_button.CallButton,
			CallIcon: call_component_ui_icon.CallIcon
		},
		inject: {
			loc: {
				default: () => key => key
			}
		},
		methods: {
			handleClick() {
			}
		},
		template: `
		<CallButton test-id="call-header-rate-button" color="transparent" :label="loc('CALL_HEADER_RATE_BUTTON')" @click="handleClick">
			<template #prepend>
				<CallIcon icon="feedback" :size="20" />
			</template>
		</CallButton>
	`
	});

	const CallHeaderViewModeButton = ui_vue3.defineComponent({
		name: 'CallHeaderViewModeButton',
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
			mode: {
				type: String,
				default: 'speaker'
			}
		},
		methods: {
			handleClick() {
			}
		},
		template: `
		<CallButton
			test-id="call-header-view-mode-button"
			color="transparent"
			:label="mode === 'speaker' ? loc('CALL_HEADER_VIEW_MODE_BUTTON_GRID') : loc('CALL_HEADER_VIEW_MODE_BUTTON_SPEAKER')"
			@click="handleClick"
		>
			<template #prepend>
				<CallIcon :icon="mode === 'speaker' ? 'apps' : 'person-speak'" :size="20" />
			</template>
		</CallButton>
	`
	});

	const CallHeader = ui_vue3.defineComponent({
		name: 'CallHeader',
		components: {
			CallLogo: call_component_ui_logo.CallLogo,
			CallHeaderSecurityIndicator,
			CallRecordingIndicator: call_component_block_recordIndicator.CallRecordingIndicator,
			CallHeaderControlButton,
			CallHeaderFullscreenButton,
			CallHeaderParticipantButton,
			CallHeaderRateButton,
			CallHeaderViewModeButton
		},
		inject: {
			loc: {
				default: () => key => key
			},
			languageId: {
				default: 'en'
			}
		},
		setup() {
			return {
				uiStore: call_store.useUiStore()
			};
		},
		computed: {
			isGridMode() {
				return this.uiStore.isGridMode;
			},
			isFullscreen() {
				return this.uiStore.isFullScreen;
			}
		},
		template: `
		<div class="call-header">
			<div class="call-header__left">
				<CallLogo color="white" :language="languageId"/>
				<CallHeaderSecurityIndicator/>
				<CallRecordingIndicator/>
			</div>
			<div class="call-header__right">
				<CallHeaderViewModeButton/>
				<CallHeaderFullscreenButton/>
				<CallHeaderRateButton/>
				<CallHeaderControlButton/>
				<CallHeaderParticipantButton/>
			</div>
		</div>
	`
	});

	exports.CallHeader = CallHeader;
	exports.CallHeaderSecurityIndicator = CallHeaderSecurityIndicator;

})(this.BX.Call.Component.Block = this.BX.Call.Component.Block || {}, BX.Vue3, BX.Call.Component.Ui, BX.Call.Component.Ui, BX.Call.Component.Ui, BX.Call.Component.Block, BX.Call.Component.Ui, BX.Call.Store);
//# sourceMappingURL=header.bundle.js.map
