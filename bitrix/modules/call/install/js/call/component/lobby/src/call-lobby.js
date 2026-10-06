import { Text } from 'main.core';

import { LobbyDeviceCheck } from './component/lobby-device-check';
import { LobbyUserForm } from './component/lobby-user-form';
import { LobbyBottomPanel } from './component/lobby-bottom-panel';

import './css/call-lobby.css';

const LobbyStep = Object.freeze({
	RequestingPermissions: 'requesting-permissions',
	Ready: 'ready',
});

// @vue/component
export const CallLobby = {
	name: 'CallLobby',
	components: {
		LobbyDeviceCheck,
		LobbyUserForm,
		LobbyBottomPanel,
	},
	props: {
		userName: {
			type: String,
			required: true,
		},
		userAvatar: {
			type: String,
			default: '',
		},
		callerName: {
			type: String,
			default: '',
		},
	},
	emits: ['join', 'decline'],
	setup()
	{
		return { LobbyStep };
	},
	data()
	{
		return {
			step: LobbyStep.RequestingPermissions,
			cameraEnabled: true,
			micEnabled: true,
			cameraBlocked: false,
			micBlocked: false,
		};
	},
	computed: {
		permissionsRequested()
		{
			return this.step === LobbyStep.Ready;
		},
		isRequestingPermissions()
		{
			return this.step === LobbyStep.RequestingPermissions;
		},
		callerInfoHtml()
		{
			const nameSpan = `<span class="call-lobby__caller-info-name">${Text.encode(this.callerName)}</span>`;

			return this.$Bitrix.Loc.getMessage('CALL_LOBBY_CALLER_INFO', { '#NAME#': nameSpan });
		},
	},
	mounted()
	{
		this.requestPermissions();
	},
	methods: {
		requestPermissions()
		{
			if (!navigator.mediaDevices?.getUserMedia)
			{
				this.cameraEnabled = false;
				this.cameraBlocked = true;
				this.micEnabled = false;
				this.micBlocked = true;
				this.step = LobbyStep.Ready;

				return;
			}

			navigator.mediaDevices.getUserMedia({ audio: true, video: true })
				.then((stream) =>
				{
					stream.getTracks().forEach((track) => track.stop());
					this.step = LobbyStep.Ready;
				})
				.catch(() =>
				{
					navigator.mediaDevices.getUserMedia({ audio: true, video: false })
						.then((stream) =>
						{
							stream.getTracks().forEach((track) => track.stop());
							this.cameraEnabled = false;
							this.cameraBlocked = true;
							this.step = LobbyStep.Ready;
						})
						.catch(() =>
						{
							navigator.mediaDevices.getUserMedia({ audio: false, video: true })
								.then((stream) =>
								{
									stream.getTracks().forEach((track) => track.stop());
									this.micEnabled = false;
									this.micBlocked = true;
									this.step = LobbyStep.Ready;
								})
								.catch(() =>
								{
									this.cameraEnabled = false;
									this.cameraBlocked = true;
									this.micEnabled = false;
									this.micBlocked = true;
									this.step = LobbyStep.Ready;
								});
						});
				});
		},
		onToggleMic()
		{
			if (this.micBlocked)
			{
				return;
			}

			this.micEnabled = !this.micEnabled;
		},
		onToggleCamera()
		{
			if (this.cameraBlocked)
			{
				return;
			}

			this.cameraEnabled = !this.cameraEnabled;
		},
		onJoin(params)
		{
			this.$emit('join', {
				...params,
				audio: params.audio && this.micEnabled,
				video: params.video && this.cameraEnabled,
			});
		},
		onMicSelected(deviceId)
		{
			this.$refs.deviceCheck?.selectMic(deviceId);
		},
		onCameraSelected(deviceId)
		{
			this.$refs.deviceCheck?.selectCamera(deviceId);
		},
		onDecline()
		{
			this.$emit('decline');
		},
	},
	template: /* HTML */`
		<div class="call-lobby" :aria-busy="isRequestingPermissions ? 'true' : null">
			<template v-if="step === LobbyStep.RequestingPermissions">
				<div class="call-lobby__permissions">
					<div class="call-lobby__permissions-text" role="status">
						{{ $Bitrix.Loc.getMessage('CALL_LOBBY_PERMISSIONS_LOADING') }}
					</div>
				</div>
			</template>
			<template v-if="step === LobbyStep.Ready">
				<div class="call-lobby__content">
					<div v-if="callerName" class="call-lobby__caller-info" v-html="callerInfoHtml"></div>
					<LobbyDeviceCheck
						ref="deviceCheck"
						:cameraEnabled="cameraEnabled"
						:micEnabled="micEnabled"
						@cameraStateChanged="cameraEnabled = $event"
						@micStateChanged="micEnabled = $event"
					/>
					<LobbyUserForm
						:userName="userName"
						:userAvatar="userAvatar"
						:permissionsRequested="permissionsRequested"
						:micBlocked="micBlocked"
						:cameraBlocked="cameraBlocked"
						@join="onJoin"
					/>
				</div>
				<LobbyBottomPanel
					:micEnabled="micEnabled"
					:cameraEnabled="cameraEnabled"
					:micBlocked="micBlocked"
					:cameraBlocked="cameraBlocked"
					@toggleMic="onToggleMic"
					@toggleCamera="onToggleCamera"
					@decline="onDecline"
					@micSelected="onMicSelected"
					@cameraSelected="onCameraSelected"
				/>
			</template>
		</div>
	`,
};
