import { LobbyMicLevel } from './lobby-mic-level';

import './css/lobby-device-check.css';

// @vue/component
export const LobbyDeviceCheck = {
	name: 'LobbyDeviceCheck',
	components: {
		LobbyMicLevel,
	},
	props: {
		cameraEnabled: {
			type: Boolean,
			default: true,
		},
		micEnabled: {
			type: Boolean,
			default: true,
		},
	},
	emits: ['cameraSelected', 'micSelected', 'cameraStateChanged', 'micStateChanged'],
	data()
	{
		return {
			isDestroyed: false,
			noVideo: true,
			gettingVideo: false,
			userDisabledCamera: false,
			isFlippedVideo: BX.Call.Hardware.enableMirroring,
			selectedCamera: null,
			selectedMic: null,
			videoStream: null,
			audioStream: null,
			videoStreamPromise: null,
			audioStreamPromise: null,
		};
	},
	computed: {
		noVideoText()
		{
			if (this.gettingVideo)
			{
				return this.$Bitrix.Loc.getMessage('CALL_LOBBY_GETTING_CAMERA');
			}

			if (this.userDisabledCamera)
			{
				return this.$Bitrix.Loc.getMessage('CALL_LOBBY_CAMERA_DISABLED');
			}

			return this.$Bitrix.Loc.getMessage('CALL_LOBBY_NO_VIDEO');
		},
		cameraVideoClasses()
		{
			return {
				'call-lobby-device-check__video': true,
				'--flipped': this.isFlippedVideo,
			};
		},
	},
	watch: {
		cameraEnabled(enabled)
		{
			if (enabled)
			{
				this.getLocalVideoStream();
			}
			else
			{
				this.stopLocalVideo();
				this.userDisabledCamera = true;
				this.noVideo = true;
			}
		},
		micEnabled(enabled)
		{
			if (enabled)
			{
				this.getLocalAudioStream();
			}
			else
			{
				this.stopLocalAudio();
			}
		},
	},
	created()
	{
		this.initDevices();
	},
	beforeUnmount()
	{
		this.isDestroyed = true;
		this.stopLocalVideo();
		this.stopLocalAudio();
	},
	methods: {
		initDevices()
		{
			if (BX.Call.Hardware.defaultCamera)
			{
				this.selectedCamera = BX.Call.Hardware.defaultCamera;
			}

			if (BX.Call.Hardware.defaultMicrophone)
			{
				this.selectedMic = BX.Call.Hardware.defaultMicrophone;
			}

			this.getLocalVideoStream()
				.then(() =>
				{
					if (!this.selectedCamera && this.videoStream)
					{
						const tracks = this.videoStream.getVideoTracks();
						if (tracks.length > 0)
						{
							this.selectedCamera = tracks[0].getSettings().deviceId;
							this.$emit('cameraSelected', this.selectedCamera);
						}
					}
				})
				// error is handled inside getLocalVideoStream
				.catch(() => {});

			this.getLocalAudioStream()
				.then(() =>
				{
					if (!this.selectedMic && this.audioStream)
					{
						const tracks = this.audioStream.getAudioTracks();
						if (tracks.length > 0)
						{
							this.selectedMic = tracks[0].getSettings().deviceId;
							this.$emit('micSelected', this.selectedMic);
						}
					}
				})
				// error is handled inside getLocalAudioStream
				.catch(() => {});
		},
		getLocalVideoStream()
		{
			if (this.videoStreamPromise)
			{
				return this.videoStreamPromise;
			}

			this.videoStreamPromise = new Promise((resolve, reject) =>
			{
				this.gettingVideo = true;

				const tryGetVideo = (useExact) =>
				{
					const constraints = {
						video: this.getVideoConstraints(useExact),
						audio: false,
					};

					return navigator.mediaDevices.getUserMedia(constraints);
				};

				tryGetVideo(true)
					.catch((error) =>
					{
						// Fallback from exact deviceId to ideal when device is not found
						if (
							this.selectedCamera
							&& (error.name === 'OverconstrainedError' || error.name === 'NotFoundError')
						)
						{
							return tryGetVideo(false);
						}

						throw error;
					})
					.then((stream) =>
					{
						// If component is destroyed or camera was disabled while getting stream — stop tracks
						if (this.isDestroyed || !this.cameraEnabled)
						{
							stream.getTracks().forEach((track) => track.stop());
							resolve();

							return;
						}

						if (this.videoStream)
						{
							this.videoStream.getTracks().forEach((track) => track.stop());
						}

						this.videoStream = stream;
						this.$emit('cameraStateChanged', true);
						this.playLocalVideo();
						resolve();
					})
					.catch((error) =>
					{
						this.noVideo = true;
						this.$emit('cameraStateChanged', false);
						reject(error);
					})
					.finally(() =>
					{
						this.gettingVideo = false;
						this.videoStreamPromise = null;
					});
			});

			return this.videoStreamPromise;
		},
		getLocalAudioStream()
		{
			if (this.audioStreamPromise)
			{
				return this.audioStreamPromise;
			}

			this.audioStreamPromise = new Promise((resolve, reject) =>
			{
				const tryGetAudio = (useExact) =>
				{
					const constraints = {
						audio: this.selectedMic
							? { deviceId: useExact ? { exact: this.selectedMic } : { ideal: this.selectedMic } }
							: true,
						video: false,
					};

					return navigator.mediaDevices.getUserMedia(constraints);
				};

				tryGetAudio(true)
					.catch((error) =>
					{
						// Fallback from exact deviceId to ideal when device is not found
						if (
							this.selectedMic
							&& (error.name === 'OverconstrainedError' || error.name === 'NotFoundError')
						)
						{
							return tryGetAudio(false);
						}

						throw error;
					})
					.then((stream) =>
					{
						// If component is destroyed or mic was disabled while getting stream — stop tracks
						if (this.isDestroyed || !this.micEnabled)
						{
							stream.getTracks().forEach((track) => track.stop());
							resolve();

							return;
						}

						if (this.audioStream)
						{
							this.audioStream.getTracks().forEach((track) => track.stop());
						}

						this.audioStream = stream;
						this.$emit('micStateChanged', true);
						resolve();
					})
					.catch((error) =>
					{
						this.$emit('micStateChanged', false);
						reject(error);
					})
					.finally(() =>
					{
						this.audioStreamPromise = null;
					});
			});

			return this.audioStreamPromise;
		},
		playLocalVideo()
		{
			if (!this.$refs.video)
			{
				return;
			}

			this.noVideo = false;
			this.userDisabledCamera = false;
			this.$refs.video.volume = 0;
			this.$refs.video.srcObject = this.videoStream;
			this.$refs.video.play().catch(() => {});
		},
		stopLocalVideo()
		{
			if (!this.videoStream)
			{
				return;
			}

			this.videoStream.getTracks().forEach((track) => track.stop());
			this.videoStream = null;

			if (this.$refs.video)
			{
				this.$refs.video.srcObject = null;
			}
		},
		stopLocalAudio()
		{
			if (!this.audioStream)
			{
				return;
			}

			this.audioStream.getTracks().forEach((track) => track.stop());
			this.audioStream = null;
		},
		getVideoConstraints(useExact = true)
		{
			const videoConstraints = {};

			if (this.selectedCamera)
			{
				videoConstraints.deviceId = useExact
					? { exact: this.selectedCamera }
					: { ideal: this.selectedCamera };
			}

			videoConstraints.width = { ideal: 1280 };
			videoConstraints.height = { ideal: 720 };

			return videoConstraints;
		},
		selectMic(deviceId)
		{
			this.stopLocalAudio();
			this.selectedMic = deviceId;
			this.getLocalAudioStream();
		},
		selectCamera(deviceId)
		{
			this.stopLocalVideo();
			this.selectedCamera = deviceId;
			this.getLocalVideoStream();
		},
	},
	template: /* HTML */`
		<div class="call-lobby-device-check">
			<div v-show="noVideo" class="call-lobby-device-check__no-video">
				<div class="call-lobby-device-check__no-video-icon"></div>
				<div class="call-lobby-device-check__no-video-text" role="status" aria-live="polite">{{ noVideoText }}</div>
			</div>
			<div v-show="!noVideo" class="call-lobby-device-check__video-container">
				<video
					:class="cameraVideoClasses"
					ref="video"
					muted
					autoplay
					playsinline
				></video>
			</div>
			<LobbyMicLevel v-if="micEnabled" :stream="audioStream" />
		</div>
	`,
};
