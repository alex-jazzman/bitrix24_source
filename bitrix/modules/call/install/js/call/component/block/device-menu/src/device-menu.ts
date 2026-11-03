import { defineComponent } from 'ui.vue3';

import { CallPopup, type CallPopupTarget } from 'call.component.ui.popup';

import { CallToggle } from 'call.component.ui.toggle';
import { CallCheckbox } from 'call.component.ui.checkbox';
import { CallMenu } from 'call.component.ui.menu';
import { CallIcon } from 'call.component.ui.icon';

import type { LocFunction } from 'call.plugin.loc';

import './css/device-menu.css';

interface DeviceSource
{
	label: string;
	items: Array<{ id: number; label: string }>;
}

export const CallDeviceMenu = defineComponent({
	name: 'CallDeviceMenu',
	components: { CallToggle, CallIcon, CallMenu, CallPopup, CallCheckbox },
	inject: {
		loc: { default: (): LocFunction => (key: string): string => key },
	},
	props: {
		microphoneOn: {
			type: Boolean,
			default: false,
		},
		cameraOn: {
			type: Boolean,
			default: false,
		},
		audioOn: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['toggle:microphone', 'toggle:camera', 'toggle:audio', 'background', 'test', 'hidden'],
	data(): { selectedMicrophoneId: number; selectedCameraId: number; selectedAudioId: number }
	{
		return {
			selectedMicrophoneId: 1,
			selectedCameraId: 1,
			selectedAudioId: 1,
		};
	},
	computed: {
		microphoneSources(): DeviceSource[]
		{
			return [
				{
					label: (this.loc as LocFunction)('CALL_BLOCK_DEVICE_MENU_MICROPHONE'),
					items: [
						{ id: 1, label: (this.loc as LocFunction)('CALL_BLOCK_DEVICE_MENU_BY_DEFAULT') },
						{ id: 2, label: 'Built-in Microphone' },
						{ id: 3, label: 'Steinberg UR44' },
					],
				},
			];
		},
		cameraSources(): DeviceSource[]
		{
			return [
				{
					label: (this.loc as LocFunction)('CALL_BLOCK_DEVICE_MENU_CAMERA'),
					items: [
						{ id: 1, label: (this.loc as LocFunction)('CALL_BLOCK_DEVICE_MENU_BY_DEFAULT') },
						{ id: 2, label: 'Built-in Camera' },
					],
				},
			];
		},
		audioSources(): DeviceSource[]
		{
			return [
				{
					label: (this.loc as LocFunction)('CALL_BLOCK_DEVICE_MENU_AUDIO'),
					items: [{ id: 1, label: (this.loc as LocFunction)('CALL_BLOCK_DEVICE_MENU_BY_DEFAULT') }],
				},
			];
		},
	},
	methods: {
		show(target: CallPopupTarget): void
		{
			(this.$refs.popup as InstanceType<typeof CallPopup> | undefined)?.show(target);
		},
		hide(): void
		{
			(this.$refs.popup as InstanceType<typeof CallPopup> | undefined)?.hide();
		},
		toggle(target?: CallPopupTarget): void
		{
			(this.$refs.popup as InstanceType<typeof CallPopup> | undefined)?.toggle(target);
		},
		handleSelectMicrophone(id: number): void
		{
			this.selectedMicrophoneId = id;
		},
		handleSelectCamera(id: number): void
		{
			this.selectedCameraId = id;
		},
		handleSelectAudio(id: number): void
		{
			this.selectedAudioId = id;
		},
		handleRunTest(): void
		{
			this.$emit('test');
		},
		handleChangeBackground(): void
		{
			this.$emit('background');
		},
	},
	template: /* HTML */`
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
	`,
});
