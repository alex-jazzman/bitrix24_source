/* eslint-disable */
this.BX = this.BX || {};
this.BX.Call = this.BX.Call || {};
(function (exports, ui_vue3, main_core) {
	'use strict';

	const BAR_COUNT = 20;
	const BAR_DISABLED_COLOR = 'rgba(255, 255, 255, 0.42)';
	const BAR_ENABLED_COLOR = '#1cae6a';

	// @vue/component
	const LobbyMicLevel = {
		name: 'LobbyMicLevel',
		props: {
			stream: {
				type: MediaStream,
				default: null
			}
		},
		setup() {
			// non-reactive audio analysis state, assigned in startAudioCheck()/stopAudioCheck()
			return {
				audioContext: null,
				analyser: null,
				frequencyData: null,
				lastBarsToColor: -1,
				rafId: null
			};
		},
		data() {
			return {
				barValues: new Array(BAR_COUNT).fill(false)
			};
		},
		watch: {
			stream(newStream) {
				this.stopAudioCheck();
				if (!main_core.Type.isNil(newStream)) {
					this.startAudioCheck();
				}
			}
		},
		mounted() {
			if (!main_core.Type.isNil(this.stream)) {
				this.startAudioCheck();
			}
		},
		beforeUnmount() {
			this.stopAudioCheck();
		},
		methods: {
			startAudioCheck() {
				this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
				this.analyser = this.audioContext.createAnalyser();
				this.analyser.smoothingTimeConstant = 0.8;
				this.analyser.fftSize = 1024;
				this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
				this.lastBarsToColor = -1;
				const microphone = this.audioContext.createMediaStreamSource(this.stream);
				microphone.connect(this.analyser);
				const tick = () => {
					this.processVolume();
					this.rafId = requestAnimationFrame(tick);
				};
				this.rafId = requestAnimationFrame(tick);
			},
			stopAudioCheck() {
				if (this.rafId) {
					cancelAnimationFrame(this.rafId);
					this.rafId = null;
				}
				if (this.audioContext) {
					this.audioContext.close();
					this.audioContext = null;
				}
				this.analyser = null;
				this.frequencyData = null;
				this.lastBarsToColor = -1;
				this.barValues = new Array(BAR_COUNT).fill(false);
			},
			processVolume() {
				this.analyser.getByteFrequencyData(this.frequencyData);
				const values = this.frequencyData.reduce((sum, val) => sum + val, 0);
				const average = values / this.frequencyData.length;

				// Note: getByteFrequencyData returns 0-255 per bin while the bar scale is 0-100.
				// The mismatch is intentional: it boosts sensitivity so normal speech fills the bars.
				const oneBarValue = 100 / BAR_COUNT;
				const barsToColor = Math.min(Math.round(average / oneBarValue), BAR_COUNT);
				if (barsToColor === this.lastBarsToColor) {
					return;
				}
				this.lastBarsToColor = barsToColor;
				this.barValues = new Array(BAR_COUNT).fill(false).map((_, i) => i < barsToColor);
			},
			getBarStyle(active) {
				return {
					backgroundColor: active ? BAR_ENABLED_COLOR : BAR_DISABLED_COLOR
				};
			}
		},
		template: /* HTML */`
		<div class="call-lobby-mic-level">
			<div class="call-lobby-mic-level__icon"></div>
			<div class="call-lobby-mic-level__bars" aria-hidden="true">
				<div
					v-for="(active, index) in barValues"
					:key="index"
					class="call-lobby-mic-level__bar"
					:style="getBarStyle(active)"
				></div>
			</div>
		</div>
	`
	};

	// @vue/component
	const LobbyDeviceCheck = {
		name: 'LobbyDeviceCheck',
		components: {
			LobbyMicLevel
		},
		props: {
			cameraEnabled: {
				type: Boolean,
				default: true
			},
			micEnabled: {
				type: Boolean,
				default: true
			}
		},
		emits: ['cameraSelected', 'micSelected', 'cameraStateChanged', 'micStateChanged'],
		data() {
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
				audioStreamPromise: null
			};
		},
		computed: {
			noVideoText() {
				if (this.gettingVideo) {
					return this.$Bitrix.Loc.getMessage('CALL_LOBBY_GETTING_CAMERA');
				}
				if (this.userDisabledCamera) {
					return this.$Bitrix.Loc.getMessage('CALL_LOBBY_CAMERA_DISABLED');
				}
				return this.$Bitrix.Loc.getMessage('CALL_LOBBY_NO_VIDEO');
			},
			cameraVideoClasses() {
				return {
					'call-lobby-device-check__video': true,
					'--flipped': this.isFlippedVideo
				};
			}
		},
		watch: {
			cameraEnabled(enabled) {
				if (enabled) {
					this.getLocalVideoStream();
				} else {
					this.stopLocalVideo();
					this.userDisabledCamera = true;
					this.noVideo = true;
				}
			},
			micEnabled(enabled) {
				if (enabled) {
					this.getLocalAudioStream();
				} else {
					this.stopLocalAudio();
				}
			}
		},
		created() {
			this.initDevices();
		},
		beforeUnmount() {
			this.isDestroyed = true;
			this.stopLocalVideo();
			this.stopLocalAudio();
		},
		methods: {
			initDevices() {
				if (BX.Call.Hardware.defaultCamera) {
					this.selectedCamera = BX.Call.Hardware.defaultCamera;
				}
				if (BX.Call.Hardware.defaultMicrophone) {
					this.selectedMic = BX.Call.Hardware.defaultMicrophone;
				}
				this.getLocalVideoStream().then(() => {
					if (!this.selectedCamera && this.videoStream) {
						const tracks = this.videoStream.getVideoTracks();
						if (tracks.length > 0) {
							this.selectedCamera = tracks[0].getSettings().deviceId;
							this.$emit('cameraSelected', this.selectedCamera);
						}
					}
				})
				// error is handled inside getLocalVideoStream
				.catch(() => {});
				this.getLocalAudioStream().then(() => {
					if (!this.selectedMic && this.audioStream) {
						const tracks = this.audioStream.getAudioTracks();
						if (tracks.length > 0) {
							this.selectedMic = tracks[0].getSettings().deviceId;
							this.$emit('micSelected', this.selectedMic);
						}
					}
				})
				// error is handled inside getLocalAudioStream
				.catch(() => {});
			},
			getLocalVideoStream() {
				if (this.videoStreamPromise) {
					return this.videoStreamPromise;
				}
				this.videoStreamPromise = new Promise((resolve, reject) => {
					this.gettingVideo = true;
					const tryGetVideo = useExact => {
						const constraints = {
							video: this.getVideoConstraints(useExact),
							audio: false
						};
						return navigator.mediaDevices.getUserMedia(constraints);
					};
					tryGetVideo(true).catch(error => {
						// Fallback from exact deviceId to ideal when device is not found
						if (this.selectedCamera && (error.name === 'OverconstrainedError' || error.name === 'NotFoundError')) {
							return tryGetVideo(false);
						}
						throw error;
					}).then(stream => {
						// If component is destroyed or camera was disabled while getting stream — stop tracks
						if (this.isDestroyed || !this.cameraEnabled) {
							stream.getTracks().forEach(track => track.stop());
							resolve();
							return;
						}
						if (this.videoStream) {
							this.videoStream.getTracks().forEach(track => track.stop());
						}
						this.videoStream = stream;
						this.$emit('cameraStateChanged', true);
						this.playLocalVideo();
						resolve();
					}).catch(error => {
						this.noVideo = true;
						this.$emit('cameraStateChanged', false);
						reject(error);
					}).finally(() => {
						this.gettingVideo = false;
						this.videoStreamPromise = null;
					});
				});
				return this.videoStreamPromise;
			},
			getLocalAudioStream() {
				if (this.audioStreamPromise) {
					return this.audioStreamPromise;
				}
				this.audioStreamPromise = new Promise((resolve, reject) => {
					const tryGetAudio = useExact => {
						const constraints = {
							audio: this.selectedMic ? {
								deviceId: useExact ? {
									exact: this.selectedMic
								} : {
									ideal: this.selectedMic
								}
							} : true,
							video: false
						};
						return navigator.mediaDevices.getUserMedia(constraints);
					};
					tryGetAudio(true).catch(error => {
						// Fallback from exact deviceId to ideal when device is not found
						if (this.selectedMic && (error.name === 'OverconstrainedError' || error.name === 'NotFoundError')) {
							return tryGetAudio(false);
						}
						throw error;
					}).then(stream => {
						// If component is destroyed or mic was disabled while getting stream — stop tracks
						if (this.isDestroyed || !this.micEnabled) {
							stream.getTracks().forEach(track => track.stop());
							resolve();
							return;
						}
						if (this.audioStream) {
							this.audioStream.getTracks().forEach(track => track.stop());
						}
						this.audioStream = stream;
						this.$emit('micStateChanged', true);
						resolve();
					}).catch(error => {
						this.$emit('micStateChanged', false);
						reject(error);
					}).finally(() => {
						this.audioStreamPromise = null;
					});
				});
				return this.audioStreamPromise;
			},
			playLocalVideo() {
				if (!this.$refs.video) {
					return;
				}
				this.noVideo = false;
				this.userDisabledCamera = false;
				this.$refs.video.volume = 0;
				this.$refs.video.srcObject = this.videoStream;
				this.$refs.video.play().catch(() => {});
			},
			stopLocalVideo() {
				if (!this.videoStream) {
					return;
				}
				this.videoStream.getTracks().forEach(track => track.stop());
				this.videoStream = null;
				if (this.$refs.video) {
					this.$refs.video.srcObject = null;
				}
			},
			stopLocalAudio() {
				if (!this.audioStream) {
					return;
				}
				this.audioStream.getTracks().forEach(track => track.stop());
				this.audioStream = null;
			},
			getVideoConstraints(useExact = true) {
				const videoConstraints = {};
				if (this.selectedCamera) {
					videoConstraints.deviceId = useExact ? {
						exact: this.selectedCamera
					} : {
						ideal: this.selectedCamera
					};
				}
				videoConstraints.width = {
					ideal: 1280
				};
				videoConstraints.height = {
					ideal: 720
				};
				return videoConstraints;
			},
			selectMic(deviceId) {
				this.stopLocalAudio();
				this.selectedMic = deviceId;
				this.getLocalAudioStream();
			},
			selectCamera(deviceId) {
				this.stopLocalVideo();
				this.selectedCamera = deviceId;
				this.getLocalVideoStream();
			}
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
	`
	};

	// Guards against double-encoding avatar URLs that already contain percent-encoded sequences;
	// mirrors call.view checkAndEncodeURI (kept local to avoid depending on call.view internals)
	const checkAndEncodeURI = uri => decodeURI(uri) === uri ? encodeURI(uri) : uri;

	// @vue/component
	const LobbyUserForm = {
		name: 'LobbyUserForm',
		props: {
			userName: {
				type: String,
				default: ''
			},
			userAvatar: {
				type: String,
				default: ''
			},
			permissionsRequested: {
				type: Boolean,
				default: false
			},
			micBlocked: {
				type: Boolean,
				default: false
			},
			cameraBlocked: {
				type: Boolean,
				default: false
			}
		},
		emits: ['join'],
		data() {
			return {
				editableName: this.userName
			};
		},
		computed: {
			hasRealName() {
				return this.userName.length > 0 && this.userName !== this.$Bitrix.Loc.getMessage('CALL_LOBBY_DEFAULT_USER_NAME');
			},
			avatarStyle() {
				if (this.userAvatar) {
					return {
						backgroundImage: `url("${checkAndEncodeURI(this.userAvatar)}")`
					};
				}
				return {};
			},
			joinVideoClasses() {
				return {
					'call-lobby-user-form__button': true,
					'--video': true,
					'--disabled': !this.permissionsRequested || this.cameraBlocked
				};
			},
			joinAudioClasses() {
				return {
					'call-lobby-user-form__button': true,
					'--audio': true,
					'--disabled': !this.permissionsRequested
				};
			}
		},
		methods: {
			onJoin(video) {
				if (!this.permissionsRequested) {
					return;
				}
				if (video && this.cameraBlocked) {
					return;
				}

				// fall back to the original name when the guest cleared the field (v-model.trim leaves '')
				const userName = this.editableName === '' ? this.userName : this.editableName;
				this.$emit('join', {
					video,
					audio: !this.micBlocked,
					userName
				});
			}
		},
		template: /* HTML */`
		<div class="call-lobby-user-form">
			<template v-if="hasRealName">
				<div class="call-lobby-user-form__name-container">
					<div
						v-if="userAvatar"
						class="call-lobby-user-form__avatar"
						:style="avatarStyle"
					></div>
					<div class="call-lobby-user-form__name-text">{{ userName }}</div>
				</div>
			</template>
			<template v-else>
				<input
					v-model.trim="editableName"
					type="text"
					autocomplete="name"
					:aria-label="$Bitrix.Loc.getMessage('CALL_LOBBY_NAME_PLACEHOLDER')"
					:placeholder="$Bitrix.Loc.getMessage('CALL_LOBBY_NAME_PLACEHOLDER')"
					class="call-lobby-user-form__name-input"
				/>
			</template>
			<div class="call-lobby-user-form__buttons">
				<button
					:class="joinVideoClasses"
					:disabled="!permissionsRequested || cameraBlocked"
					@click="onJoin(true)"
				>{{ $Bitrix.Loc.getMessage('CALL_LOBBY_JOIN_VIDEO') }}</button>
				<button
					:class="joinAudioClasses"
					:disabled="!permissionsRequested"
					@click="onJoin(false)"
				>{{ $Bitrix.Loc.getMessage('CALL_LOBBY_JOIN_AUDIO') }}</button>
			</div>
		</div>
	`
	};

	// @vue/component
	const LobbyBottomPanel = {
		name: 'LobbyBottomPanel',
		props: {
			micEnabled: {
				type: Boolean,
				default: true
			},
			cameraEnabled: {
				type: Boolean,
				default: true
			},
			micBlocked: {
				type: Boolean,
				default: false
			},
			cameraBlocked: {
				type: Boolean,
				default: false
			}
		},
		emits: ['toggleMic', 'toggleCamera', 'decline', 'micSelected', 'cameraSelected'],
		setup() {
			// non-reactive DeviceSelector instance, assigned in showDeviceSelector()
			return {
				deviceSelector: null
			};
		},
		beforeUnmount() {
			this.destroyDeviceSelector();
		},
		computed: {
			micContainerClasses() {
				const base = 'bx-messenger-videocall-panel-item-with-arrow-icon-container';
				return [base, this.micEnabled ? `${base}-microphone` : `${base}-microphone-off`];
			},
			micIconClasses() {
				const base = 'bx-messenger-videocall-panel-item-with-arrow-icon';
				return [base, this.micEnabled ? `${base}-microphone` : `${base}-microphone-off`];
			},
			micItemClasses() {
				return {
					'bx-messenger-videocall-panel-item-with-arrow': true,
					blocked: this.micBlocked
				};
			},
			cameraContainerClasses() {
				const base = 'bx-messenger-videocall-panel-item-with-arrow-icon-container';
				return [base, this.cameraEnabled ? `${base}-camera` : `${base}-camera-off`];
			},
			cameraIconClasses() {
				const base = 'bx-messenger-videocall-panel-item-with-arrow-icon';
				return [base, this.cameraEnabled ? `${base}-camera` : `${base}-camera-off`];
			},
			cameraItemClasses() {
				return {
					'bx-messenger-videocall-panel-item-with-arrow': true,
					blocked: this.cameraBlocked
				};
			}
		},
		methods: {
			onToggleMic() {
				if (this.micBlocked) {
					return;
				}
				this.$emit('toggleMic');
			},
			onToggleCamera() {
				if (this.cameraBlocked) {
					return;
				}
				this.$emit('toggleCamera');
			},
			destroyDeviceSelector() {
				if (this.deviceSelector) {
					this.deviceSelector.destroy();
					this.deviceSelector = null;
				}
			},
			async showDeviceSelector(arrowElement) {
				this.destroyDeviceSelector();
				const viewElement = this.$el.closest('.call-lobby-overlay');
				const {
					DeviceSelector
				} = await main_core.Runtime.loadExtension('call.view');
				this.deviceSelector = new DeviceSelector({
					parentElement: arrowElement,
					viewElement,
					microphoneEnabled: this.micEnabled,
					cameraEnabled: this.cameraEnabled,
					microphoneId: BX.Call.Hardware.defaultMicrophone,
					cameraId: BX.Call.Hardware.defaultCamera,
					switchMicrophoneBlocked: this.micBlocked,
					switchCameraBlocked: this.cameraBlocked,
					events: {
						[DeviceSelector.Events.onMicrophoneSelect]: event => {
							this.$emit('micSelected', event.data.deviceId);
						},
						[DeviceSelector.Events.onCameraSelect]: event => {
							this.$emit('cameraSelected', event.data.deviceId);
						},
						[DeviceSelector.Events.onMicrophoneSwitch]: () => {
							this.$emit('toggleMic');
						},
						[DeviceSelector.Events.onCameraSwitch]: () => {
							this.$emit('toggleCamera');
						},
						[DeviceSelector.Events.onDestroy]: () => {
							this.deviceSelector = null;
						}
					}
				});
				this.deviceSelector.show();
			},
			onMicArrowClick(event) {
				if (this.micBlocked) {
					return;
				}
				this.showDeviceSelector(event.currentTarget);
			},
			onCameraArrowClick(event) {
				if (this.cameraBlocked) {
					return;
				}
				this.showDeviceSelector(event.currentTarget);
			},
			onDecline() {
				this.$emit('decline');
			}
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
	`
	};

	const LobbyStep = Object.freeze({
		RequestingPermissions: 'requesting-permissions',
		Ready: 'ready'
	});

	// @vue/component
	const CallLobby = {
		name: 'CallLobby',
		components: {
			LobbyDeviceCheck,
			LobbyUserForm,
			LobbyBottomPanel
		},
		props: {
			userName: {
				type: String,
				required: true
			},
			userAvatar: {
				type: String,
				default: ''
			},
			callerName: {
				type: String,
				default: ''
			}
		},
		emits: ['join', 'decline'],
		setup() {
			return {
				LobbyStep
			};
		},
		data() {
			return {
				step: LobbyStep.RequestingPermissions,
				cameraEnabled: true,
				micEnabled: true,
				cameraBlocked: false,
				micBlocked: false
			};
		},
		computed: {
			permissionsRequested() {
				return this.step === LobbyStep.Ready;
			},
			isRequestingPermissions() {
				return this.step === LobbyStep.RequestingPermissions;
			},
			callerInfoHtml() {
				const nameSpan = `<span class="call-lobby__caller-info-name">${main_core.Text.encode(this.callerName)}</span>`;
				return this.$Bitrix.Loc.getMessage('CALL_LOBBY_CALLER_INFO', {
					'#NAME#': nameSpan
				});
			}
		},
		mounted() {
			this.requestPermissions();
		},
		methods: {
			requestPermissions() {
				if (!navigator.mediaDevices?.getUserMedia) {
					this.cameraEnabled = false;
					this.cameraBlocked = true;
					this.micEnabled = false;
					this.micBlocked = true;
					this.step = LobbyStep.Ready;
					return;
				}
				navigator.mediaDevices.getUserMedia({
					audio: true,
					video: true
				}).then(stream => {
					stream.getTracks().forEach(track => track.stop());
					this.step = LobbyStep.Ready;
				}).catch(() => {
					navigator.mediaDevices.getUserMedia({
						audio: true,
						video: false
					}).then(stream => {
						stream.getTracks().forEach(track => track.stop());
						this.cameraEnabled = false;
						this.cameraBlocked = true;
						this.step = LobbyStep.Ready;
					}).catch(() => {
						navigator.mediaDevices.getUserMedia({
							audio: false,
							video: true
						}).then(stream => {
							stream.getTracks().forEach(track => track.stop());
							this.micEnabled = false;
							this.micBlocked = true;
							this.step = LobbyStep.Ready;
						}).catch(() => {
							this.cameraEnabled = false;
							this.cameraBlocked = true;
							this.micEnabled = false;
							this.micBlocked = true;
							this.step = LobbyStep.Ready;
						});
					});
				});
			},
			onToggleMic() {
				if (this.micBlocked) {
					return;
				}
				this.micEnabled = !this.micEnabled;
			},
			onToggleCamera() {
				if (this.cameraBlocked) {
					return;
				}
				this.cameraEnabled = !this.cameraEnabled;
			},
			onJoin(params) {
				this.$emit('join', {
					...params,
					audio: params.audio && this.micEnabled,
					video: params.video && this.cameraEnabled
				});
			},
			onMicSelected(deviceId) {
				this.$refs.deviceCheck?.selectMic(deviceId);
			},
			onCameraSelected(deviceId) {
				this.$refs.deviceCheck?.selectCamera(deviceId);
			},
			onDecline() {
				this.$emit('decline');
			}
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
	`
	};

	class LobbyManager {
		#app = null;
		#reject = null;
		#shown = false;

		/**
		 * @param {Object} params
		 * @param {HTMLElement} params.container
		 * @param {string} params.userName
		 * @param {string} params.userAvatar
		 * @param {string} params.callerName
		 * @returns {Promise<{accepted: boolean, video?: boolean, audio?: boolean, userName?: string}>}
		 *          resolves with accepted=true and join params, or accepted=false on decline;
		 *          rejects only on a real failure (forced destroy, missing container, already shown)
		 */
		show({
			container,
			userName,
			userAvatar,
			callerName
		}) {
			if (this.#shown) {
				return Promise.reject(new Error('LobbyManager is already shown'));
			}
			if (!container) {
				return Promise.reject(new Error('LobbyManager: container is required'));
			}
			return new Promise((resolve, reject) => {
				this.#reject = reject;
				this.#shown = true;
				this.#app = ui_vue3.BitrixVue.createApp({
					name: 'CallLobbyApp',
					components: {
						CallLobby
					},
					data() {
						return {
							userName,
							userAvatar,
							callerName
						};
					},
					methods: {
						onJoin: params => {
							if (!this.#shown) {
								return;
							}
							resolve({
								accepted: true,
								...params
							});
							this.#reset();
						},
						onDecline: () => {
							if (!this.#shown) {
								return;
							}

							// declining the call is a normal outcome, not an error — resolve instead of reject
							resolve({
								accepted: false
							});
							this.#reset();
						}
					},
					template: /* HTML */`
					<CallLobby
						:userName="userName"
						:userAvatar="userAvatar"
						:callerName="callerName"
						@join="onJoin"
						@decline="onDecline"
					/>
				`
				});
				this.#app.mount(container);
			});
		}
		#unmountApp() {
			if (this.#app) {
				this.#app.unmount();
				this.#app = null;
			}
		}
		#reset() {
			this.#shown = false;
			this.#reject = null;
			this.#unmountApp();
		}
		destroy() {
			if (!this.#shown) {
				return;
			}
			const reject = this.#reject;
			this.#reset();
			reject(new Error('destroyed'));
		}
		isShown() {
			return this.#shown;
		}
	}

	exports.LobbyManager = LobbyManager;

})(this.BX.Call.Lobby = this.BX.Call.Lobby || {}, BX.Vue3, BX);
//# sourceMappingURL=lobby.bundle.js.map
