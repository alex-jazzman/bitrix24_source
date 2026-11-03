import { Runtime } from 'main.core';

// @vue/component
export const LobbyBottomPanel = {
	name: 'LobbyBottomPanel',
	props: {
		micEnabled: {
			type: Boolean,
			default: true,
		},
		cameraEnabled: {
			type: Boolean,
			default: true,
		},
		micBlocked: {
			type: Boolean,
			default: false,
		},
		cameraBlocked: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['toggleMic', 'toggleCamera', 'decline', 'micSelected', 'cameraSelected'],
	setup()
	{
		// non-reactive state of showDeviceSelector(): the selector instance it owns
		// and the unmount flag that stops it from building one for a dead component
		return {
			deviceSelector: null,
			isUnmounted: false,
		};
	},
	computed: {
		micContainerClasses()
		{
			const base = 'bx-messenger-videocall-panel-item-with-arrow-icon-container';

			return [
				base,
				this.micEnabled
					? `${base}-microphone`
					: `${base}-microphone-off`,
			];
		},
		micIconClasses()
		{
			const base = 'bx-messenger-videocall-panel-item-with-arrow-icon';

			return [
				base,
				this.micEnabled
					? `${base}-microphone`
					: `${base}-microphone-off`,
			];
		},
		micItemClasses()
		{
			return {
				'bx-messenger-videocall-panel-item-with-arrow': true,
				blocked: this.micBlocked,
			};
		},
		cameraContainerClasses()
		{
			const base = 'bx-messenger-videocall-panel-item-with-arrow-icon-container';

			return [
				base,
				this.cameraEnabled
					? `${base}-camera`
					: `${base}-camera-off`,
			];
		},
		cameraIconClasses()
		{
			const base = 'bx-messenger-videocall-panel-item-with-arrow-icon';

			return [
				base,
				this.cameraEnabled
					? `${base}-camera`
					: `${base}-camera-off`,
			];
		},
		cameraItemClasses()
		{
			return {
				'bx-messenger-videocall-panel-item-with-arrow': true,
				blocked: this.cameraBlocked,
			};
		},
	},
	beforeUnmount()
	{
		this.isUnmounted = true;
		this.destroyDeviceSelector();
	},
	methods: {
		onToggleMic()
		{
			if (this.micBlocked)
			{
				return;
			}

			this.$emit('toggleMic');
		},
		onToggleCamera()
		{
			if (this.cameraBlocked)
			{
				return;
			}

			this.$emit('toggleCamera');
		},
		destroyDeviceSelector()
		{
			if (this.deviceSelector)
			{
				this.deviceSelector.destroy();
				this.deviceSelector = null;
			}
		},
		async showDeviceSelector(arrowElement)
		{
			this.destroyDeviceSelector();

			const viewElement = this.$el.closest('.call-lobby-overlay');

			const { DeviceSelector } = await Runtime.loadExtension('call.view');

			// The lobby could have been left while the extension was loading: a popup built now
			// would belong to a dead component, and nobody would be left to release it
			if (this.isUnmounted)
			{
				return;
			}

			// A click on the other arrow could have opened its own selector while the extension
			// was loading, so the field is re-checked after the wait, not only before it
			this.destroyDeviceSelector();

			const selector = new DeviceSelector({
				parentElement: arrowElement,
				viewElement,
				microphoneEnabled: this.micEnabled,
				cameraEnabled: this.cameraEnabled,
				microphoneId: BX.Call.Hardware.defaultMicrophone,
				cameraId: BX.Call.Hardware.defaultCamera,
				switchMicrophoneBlocked: this.micBlocked,
				switchCameraBlocked: this.cameraBlocked,
				callbacks: {
					onMicrophoneSelect: (deviceId) => {
						this.$emit('micSelected', deviceId);
					},
					onCameraSelect: (deviceId) => {
						this.$emit('cameraSelected', deviceId);
					},
					onMicrophoneSwitch: () => {
						this.$emit('toggleMic');
					},
					onCameraSwitch: () => {
						this.$emit('toggleCamera');
					},
					onDestroy: () => {
						// Only the instance that still owns the field may clear it
						if (this.deviceSelector === selector)
						{
							this.deviceSelector = null;
						}
					},
				},
			});

			this.deviceSelector = selector;
			selector.show();
		},
		onMicArrowClick(event)
		{
			if (this.micBlocked)
			{
				return;
			}

			// Nobody awaits the selector, so a failed extension load is reported here
			this.showDeviceSelector(event.currentTarget).catch((error) => console.error(error));
		},
		onCameraArrowClick(event)
		{
			if (this.cameraBlocked)
			{
				return;
			}

			// Nobody awaits the selector, so a failed extension load is reported here
			this.showDeviceSelector(event.currentTarget).catch((error) => console.error(error));
		},
		onDecline()
		{
			this.$emit('decline');
		},
	},
	template: /* HTML */`
		<div class="bx-messenger-videocall-panel call-lobby-bottom-panel">
			<div class="bx-messenger-videocall-panel-inner">
				<div class="bx-messenger-videocall-panel-inner-left">
					<div :class="micItemClasses">
						<div class="bx-messenger-videocall-panel-item-with-arrow-left">
							<div :class="micContainerClasses" @click.stop="onToggleMic">
								<div :class="micIconClasses"></div>
							</div>
							<div
								class="bx-messenger-videocall-panel-item-with-arrow-right"
								@click.stop="onMicArrowClick"
							>
								<div class="bx-messenger-videocall-panel-item-with-arrow-right-icon"></div>
							</div>
						</div>
						<div class="bx-messenger-videocall-panel-text">
							<div class="bx-messenger-videocall-panel-text-content">
								{{ $Bitrix.Loc.getMessage('IM_M_CALL_BTN_MIC') }}
							</div>
						</div>
					</div>
					<div :class="cameraItemClasses">
						<div class="bx-messenger-videocall-panel-item-with-arrow-left">
							<div :class="cameraContainerClasses" @click.stop="onToggleCamera">
								<div :class="cameraIconClasses"></div>
							</div>
							<div
								class="bx-messenger-videocall-panel-item-with-arrow-right"
								@click.stop="onCameraArrowClick"
							>
								<div class="bx-messenger-videocall-panel-item-with-arrow-right-icon"></div>
							</div>
						</div>
						<div class="bx-messenger-videocall-panel-text">
							<div class="bx-messenger-videocall-panel-text-content">
								{{ $Bitrix.Loc.getMessage('IM_M_CALL_BTN_CAMERA') }}
							</div>
						</div>
					</div>
				</div>
				<div class="bx-messenger-videocall-panel-inner-center"></div>
				<div class="bx-messenger-videocall-panel-inner-right">
					<div class="bx-messenger-videocall-panel-item" @click.stop="onDecline">
						<div class="bx-messenger-videocall-panel-icon-background bx-messenger-videocall-panel-icon-background-hangup">
							<div class="bx-messenger-videocall-panel-icon bx-messenger-videocall-panel-icon-hangup"></div>
						</div>
						<div class="bx-messenger-videocall-panel-text">
							<div class="bx-messenger-videocall-panel-text-content">
								{{ $Bitrix.Loc.getMessage('IM_M_CALL_BTN_CLOSE') }}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	`,
};
