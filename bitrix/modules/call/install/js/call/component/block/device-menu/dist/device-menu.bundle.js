/* eslint-disable */
this.BX = this.BX || {};
this.BX.Call = this.BX.Call || {};
this.BX.Call.Component = this.BX.Call.Component || {};
(function (exports, ui_vue3, call_component_ui_popup, call_component_ui_toggle, call_component_ui_checkbox, call_component_ui_menu, call_component_ui_icon) {
	'use strict';

	const CallDeviceMenu = ui_vue3.defineComponent({
		name: 'CallDeviceMenu',
		components: {
			CallToggle: call_component_ui_toggle.CallToggle,
			CallIcon: call_component_ui_icon.CallIcon,
			CallMenu: call_component_ui_menu.CallMenu,
			CallPopup: call_component_ui_popup.CallPopup,
			CallCheckbox: call_component_ui_checkbox.CallCheckbox
		},
		inject: {
			loc: {
				default: () => key => key
			}
		},
		props: {
			microphoneOn: {
				type: Boolean,
				default: false
			},
			cameraOn: {
				type: Boolean,
				default: false
			},
			audioOn: {
				type: Boolean,
				default: false
			}
		},
		emits: ['toggle:microphone', 'toggle:camera', 'toggle:audio', 'background', 'test', 'hidden'],
		data() {
			return {
				selectedMicrophoneId: 1,
				selectedCameraId: 1,
				selectedAudioId: 1
			};
		},
		computed: {
			microphoneSources() {
				return [{
					label: this.loc('CALL_BLOCK_DEVICE_MENU_MICROPHONE'),
					items: [{
						id: 1,
						label: this.loc('CALL_BLOCK_DEVICE_MENU_BY_DEFAULT')
					}, {
						id: 2,
						label: 'Built-in Microphone'
					}, {
						id: 3,
						label: 'Steinberg UR44'
					}]
				}];
			},
			cameraSources() {
				return [{
					label: this.loc('CALL_BLOCK_DEVICE_MENU_CAMERA'),
					items: [{
						id: 1,
						label: this.loc('CALL_BLOCK_DEVICE_MENU_BY_DEFAULT')
					}, {
						id: 2,
						label: 'Built-in Camera'
					}]
				}];
			},
			audioSources() {
				return [{
					label: this.loc('CALL_BLOCK_DEVICE_MENU_AUDIO'),
					items: [{
						id: 1,
						label: this.loc('CALL_BLOCK_DEVICE_MENU_BY_DEFAULT')
					}]
				}];
			}
		},
		methods: {
			show(target) {
				this.$refs.popup?.show(target);
			},
			hide() {
				this.$refs.popup?.hide();
			},
			toggle(target) {
				this.$refs.popup?.toggle(target);
			},
			handleSelectMicrophone(id) {
				this.selectedMicrophoneId = id;
			},
			handleSelectCamera(id) {
				this.selectedCameraId = id;
			},
			handleSelectAudio(id) {
				this.selectedAudioId = id;
			},
			handleRunTest() {
				this.$emit('test');
			},
			handleChangeBackground() {
				this.$emit('background');
			}
		},
		template: `
		<CallPopup
			ref="popup"
			class-name="call-device-menu"
			background="#00428F"
			:offset-left="22"
			@hidden="$emit('hidden')"
		>
			<div class="call-device-menu__lists">
				<CallMenu :items="microphoneSources" @item:click="handleSelectMicrophone($event.item.id)">
					<template #submenu="{ item }">
						<CallIcon
							:icon="microphoneOn ? 'microphone' : 'microphone-off'"
							:color="microphoneOn ? null : 'red'"
							:size="28"
						/>
						<span>{{ item.label }}</span>
						<CallToggle color="green" :model-value="microphoneOn" @change="$emit('toggle:microphone', $event.value)" />
					</template>
					<template #item="{ item }">
						<div class="call-device-menu__menu-item">
							<CallIcon :icon="selectedMicrophoneId === item.id ? 'check' : 'none'" :size="24" />
							<span>{{ item.label }}</span>
						</div>
					</template>
					<template #end>
						<div class="call-device-menu__checkbox">
							<CallCheckbox input-id="noise-reduction" color="green" size="sm"></CallCheckbox>
							<label for="noise-reduction">{{ loc('CALL_BLOCK_DEVICE_MENU_NOISE_REDUCTION') }}</label>
						</div>
					</template>
				</CallMenu>

				<CallMenu :items="cameraSources" @item:click="handleSelectCamera($event.item.id)">
					<template #submenu="{ item }">
						<CallIcon :icon="cameraOn ? 'video' : 'video-slash'" :color="cameraOn ? null : 'red'" :size="28" />
						<span>{{ item.label }}</span>
						<CallToggle color="green" :model-value="cameraOn" @change="$emit('toggle:camera', $event.value)" />
					</template>
					<template #item="{ item, props }">
						<div class="call-device-menu__menu-item">
							<CallIcon :icon="selectedCameraId === item.id ? 'check' : 'none'" :size="24" />
							<span>{{ item.label }}</span>
						</div>
					</template>
				</CallMenu>
				<CallMenu :items="audioSources" @item:click="handleSelectAudio($event.item.id)">
					<template #submenu="{ item }">
						<CallIcon :icon="audioOn ? 'volume' : 'volume-cross'" :color="audioOn ? null : 'red'" :size="28" />
						<span>{{ item.label }}</span>
						<CallToggle color="green" :model-value="audioOn" @change="$emit('toggle:audio', $event.value)" />
					</template>
					<template #item="{ item, props }">
						<div class="call-device-menu__menu-item">
							<CallIcon :icon="selectedAudioId === item.id ? 'check' : 'none'" :size="24" />
							<span>{{ item.label }}</span>
						</div>
					</template>
				</CallMenu>
			</div>
			<div class="call-device-menu__separator"></div>
			<div class="call-device-menu__actions">
				<div class="call-device-menu__action" @click="handleRunTest">
					{{ loc('CALL_BLOCK_DEVICE_MENU_RUN_TEST') }}
				</div>
				<div class="call-device-menu__action" @click="handleChangeBackground">
					{{ loc('CALL_BLOCK_DEVICE_MENU_CHANGE_BACKGROUND') }}
				</div>
			</div>
		</CallPopup>
	`
	});

	exports.CallDeviceMenu = CallDeviceMenu;

})(this.BX.Call.Component.Block = this.BX.Call.Component.Block || {}, BX.Vue3, BX.Call.Component.UI, BX.Call.Component.Ui, BX.Call.Component.Ui, BX.Call.Component.Ui, BX.Call.Component.Ui);
//# sourceMappingURL=device-menu.bundle.js.map
