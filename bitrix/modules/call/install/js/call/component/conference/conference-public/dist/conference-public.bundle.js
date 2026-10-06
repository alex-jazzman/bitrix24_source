/* eslint-disable */
(function (ui_designTokens, ui_fonts_opensans, ui_vue, ui_vue_vuex, im_lib_utils, im_const, call_const, im_eventHandler, im_lib_logger, main_core_events, im_component_dialog, im_component_textarea, ui_switcher, ui_vue_components_smiles, main_core, ui_dialogs_messagebox, ui_forms, im_lib_cookie, call_core, call_component_callFeedback, im_lib_desktop, im_v2_lib_utils, main_popup, im_lib_clipboard) {
	'use strict';

	class ConferenceTextareaHandler extends im_eventHandler.TextareaHandler {
		application = null;
		constructor($Bitrix) {
			super($Bitrix);
			this.application = $Bitrix.Application.get();
		}
		onAppButtonClick({
			data: event
		}) {
			if (event.appId === 'smile') {
				this.application.toggleSmiles();
			}
		}
	}

	class ConferenceTextareaUploadHandler extends im_eventHandler.TextareaUploadHandler {
		addMessageWithFile(event) {
			const message = event.getData();
			if (!this.getDiskFolderId()) {
				this.requestDiskFolderId(message.chatId).then(() => {
					this.addMessageWithFile(event);
				}).catch(error => {
					im_lib_logger.Logger.error('addMessageWithFile error', error);
					return false;
				});
				return false;
			}
			message.chatId = this.getChatId();
			this.setUploaderCustomHeaders();
			this.uploader.addTask({
				taskId: message.file.id,
				fileData: message.file.source.file,
				fileName: message.file.source.file.name,
				generateUniqueName: true,
				diskFolderId: this.getDiskFolderId(),
				previewBlob: message.file.previewBlob
			});
		}
		setUploaderCustomHeaders() {
			if (!this.uploader.senderOptions.customHeaders) {
				this.uploader.senderOptions.customHeaders = {};
			}
			this.uploader.senderOptions.customHeaders['Call-Auth-Id'] = this.getUserHash();
			this.uploader.senderOptions.customHeaders['Call-Chat-Id'] = this.getChatId();
		}
		getUserHash() {
			return this.controller.store.state.conference.user.hash;
		}
		getActionCommitFile() {
			return 'call.Disk.commit';
		}
		getActionUploadChunk() {
			return 'call.Disk.upload';
		}
	}

	const ConferenceSmiles = {
		methods: {
			onSelectSmile(event) {
				this.$emit('selectSmile', event);
			},
			onSelectSet(event) {
				this.$emit('selectSet', event);
			},
			hideSmiles() {
				main_core_events.EventEmitter.emit(im_const.EventType.conference.hideSmiles);
			}
		},
		// language=Vue
		template: `
		<div class="bx-im-component-smiles-box">
			<div class="bx-im-component-smiles-box-close" @click="hideSmiles"></div>
			<div class="bx-im-component-smiles-box-list">
				<bx-smiles
					@selectSmile="onSelectSmile"
					@selectSet="onSelectSet"
				/>
			</div>
		</div>
	`
	};

	const MicLevel = {
		props: ['localStream'],
		data() {
			return {
				bars: [],
				barDisabledColor: 'rgba(255,255,255,0.42)',
				barEnabledColor: '#1CAE6A'
			};
		},
		watch: {
			localStream(stream) {
				if (!main_core.Type.isNil(stream)) {
					this.startAudioCheck();
				}
			}
		},
		mounted() {
			this.bars = [...document.querySelectorAll('.bx-im-component-call-check-devices-micro-level-item')];
		},
		computed: {
			localize() {
				return ui_vue.BitrixVue.getFilteredPhrases('BX_IM_COMPONENT_CALL_CHECK_DEVICES_');
			}
		},
		methods: {
			startAudioCheck() {
				this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
				this.analyser = this.audioContext.createAnalyser();
				this.microphone = this.audioContext.createMediaStreamSource(this.localStream);
				this.scriptNode = this.audioContext.createScriptProcessor(2048, 1, 1);
				this.analyser.smoothingTimeConstant = 0.8;
				this.analyser.fftSize = 1024;
				this.microphone.connect(this.analyser);
				this.analyser.connect(this.scriptNode);
				this.scriptNode.connect(this.audioContext.destination);
				this.scriptNode.onaudioprocess = this.processVolume;
			},
			processVolume() {
				let arr = new Uint8Array(this.analyser.frequencyBinCount);
				this.analyser.getByteFrequencyData(arr);
				let values = 0;
				for (let i = 0; i < arr.length; i++) {
					values += arr[i];
				}
				let average = values / arr.length;
				let oneBarValue = 100 / this.bars.length;
				let barsToColor = Math.round(average / oneBarValue);
				let elementsToColor = this.bars.slice(0, barsToColor);
				this.bars.forEach(elem => {
					elem.style.backgroundColor = this.barDisabledColor;
				});
				elementsToColor.forEach(elem => {
					elem.style.backgroundColor = this.barEnabledColor;
				});
			}
		},
		template: `
		<div class="bx-im-component-call-check-devices-row">
			<div class="bx-im-component-call-check-devices-micro-icon"></div>
			<div class="bx-im-component-call-check-devices-micro-level">
				<div class="bx-im-component-call-check-devices-micro-level-item"></div>
				<div class="bx-im-component-call-check-devices-micro-level-item"></div>
				<div class="bx-im-component-call-check-devices-micro-level-item"></div>
				<div class="bx-im-component-call-check-devices-micro-level-item"></div>
				<div class="bx-im-component-call-check-devices-micro-level-item"></div>
				<div class="bx-im-component-call-check-devices-micro-level-item"></div>
				<div class="bx-im-component-call-check-devices-micro-level-item"></div>
				<div class="bx-im-component-call-check-devices-micro-level-item"></div>
				<div class="bx-im-component-call-check-devices-micro-level-item"></div>
				<div class="bx-im-component-call-check-devices-micro-level-item"></div>
				<div class="bx-im-component-call-check-devices-micro-level-item"></div>
				<div class="bx-im-component-call-check-devices-micro-level-item"></div>
				<div class="bx-im-component-call-check-devices-micro-level-item"></div>
				<div class="bx-im-component-call-check-devices-micro-level-item"></div>
				<div class="bx-im-component-call-check-devices-micro-level-item"></div>
				<div class="bx-im-component-call-check-devices-micro-level-item"></div>
				<div class="bx-im-component-call-check-devices-micro-level-item"></div>
				<div class="bx-im-component-call-check-devices-micro-level-item"></div>
				<div class="bx-im-component-call-check-devices-micro-level-item"></div>
				<div class="bx-im-component-call-check-devices-micro-level-item"></div>
			</div>
		</div>
	`
	};

	const CheckDevices = {
		data() {
			return {
				isDestroyed: false,
				noVideo: true,
				selectedCamera: null,
				selectedMic: null,
				videoStream: null,
				audioStream: null,
				videoStreamPromise: null,
				audioStreamPromise: null,
				showMic: true,
				userDisabledCamera: false,
				gettingVideo: false,
				isFlippedVideo: BX.Call.Hardware.enableMirroring
			};
		},
		created() {
			this.$root.$on('setCameraState', state => {
				this.onCameraStateChange(state);
			});
			this.$root.$on('setMicState', state => {
				this.onMicStateChange(state);
			});
			this.$root.$on('callLocalMediaReceived', () => {
				this.stopLocalVideo();
				this.stopLocalAudio();
			});
			this.$root.$on('cameraSelected', cameraId => {
				this.onCameraSelected(cameraId);
			});
			this.$root.$on('micSelected', micId => {
				this.onMicSelected(micId);
			});
			this.getApplication().initHardware().then(() => {
				this.getDefaultDevices();
			}).catch(() => {
				ui_dialogs_messagebox.MessageBox.show({
					message: this.$Bitrix.Loc.getMessage('BX_IM_COMPONENT_CALL_HARDWARE_ERROR'),
					modal: true,
					buttons: ui_dialogs_messagebox.MessageBoxButtons.OK
				});
			});
		},
		destroyed() {
			this.isDestroyed = true;
			this.stopLocalVideo();
			this.stopLocalAudio();
		},
		computed: {
			noVideoText() {
				if (this.gettingVideo) {
					return this.localize['BX_IM_COMPONENT_CALL_CHECK_DEVICES_GETTING_CAMERA'];
				}
				if (this.userDisabledCamera) {
					return this.localize['BX_IM_COMPONENT_CALL_CHECK_DEVICES_DISABLED_CAMERA'];
				}
				return this.localize['BX_IM_COMPONENT_CALL_CHECK_DEVICES_NO_VIDEO'];
			},
			localize() {
				return ui_vue.BitrixVue.getFilteredPhrases('BX_IM_COMPONENT_CALL_CHECK_DEVICES_');
			},
			cameraVideoClasses() {
				return {
					'bx-im-component-call-check-devices-camera-video': true,
					'bx-im-component-call-check-devices-camera-video-flipped': this.isFlippedVideo
				};
			}
		},
		methods: {
			getDefaultDevices() {
				if (BX.Call.Hardware.defaultCamera) {
					this.selectedCamera = BX.Call.Hardware.defaultCamera;
				}
				if (BX.Call.Hardware.defaultMicrophone) {
					this.selectedMic = BX.Call.Hardware.defaultMicrophone;
				}
				this.getLocalVideoStream().then(() => {
					this.getApplication().updateMediaDevices();
					if (!this.selectedCamera) {
						this.selectedCamera = this.videoStream.getVideoTracks()[0].getSettings().deviceId;
					}
					this.getApplication().setSelectedCamera(this.selectedCamera);
				}).catch(error => {
					im_lib_logger.Logger.warn('Error getting default video stream', error);
				});
				this.getLocalAudioStream().then(() => {
					if (!this.selectedMic) {
						this.selectedMic = this.audioStream.getAudioTracks()[0].getSettings().deviceId;
					}
					this.getApplication().setSelectedMic(this.selectedMic);
				}).catch(error => {
					im_lib_logger.Logger.warn('Error getting default audio stream', error);
				});
			},
			getLocalVideoStream() {
				if (this.videoStreamPromise) {
					return this.videoStreamPromise;
				}
				this.videoStreamPromise = new Promise((resolve, reject) => {
					this.gettingVideo = true;
					const constraints = {
						video: this.getVideoConstraints(),
						audio: false
					};
					navigator.mediaDevices.getUserMedia(constraints).then(stream => {
						this.setLocalStream(stream);
						this.playLocalVideo();
						if (this.isDestroyed) {
							this.stopLocalVideo();
						}
						resolve();
					}).catch(error => {
						im_lib_logger.Logger.warn('Getting video from camera error', error);
						this.noVideo = true;
						this.getApplication().setCameraState(false);
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
					const constraints = {
						audio: {
							deviceId: {
								exact: this.selectedMic
							}
						},
						video: false
					};
					navigator.mediaDevices.getUserMedia(constraints).then(stream => {
						this.audioStream = stream;
						if (this.isDestroyed) {
							this.stopLocalAudio();
						}
						resolve();
					}).catch(error => {
						im_lib_logger.Logger.warn('Getting audio from microphone error', error);
						reject(error);
					}).finally(() => {
						this.audioStreamPromise = null;
					});
				});
				return this.audioStreamPromise;
			},
			setLocalStream(stream) {
				this.videoStream = stream;
				this.getApplication().setLocalVideoStream(this.videoStream);
			},
			playLocalVideo() {
				im_lib_logger.Logger.warn('playing local video');
				this.noVideo = false;
				this.userDisabledCamera = false;
				this.getApplication().setCameraState(true);
				this.$refs.video.volume = 0;
				this.$refs.video.srcObject = this.videoStream;
				this.$refs.video.play();
			},
			stopLocalVideo() {
				if (!this.videoStream) {
					return;
				}
				this.videoStream.getTracks().forEach(track => track.stop());
				this.videoStream = null;
				this.getApplication().stopLocalVideoStream();
			},
			stopLocalAudio() {
				if (!this.audioStream) {
					return;
				}
				this.audioStream.getTracks().forEach(track => track.stop());
				this.audioStream = null;
			},
			onCameraSelected(cameraId) {
				this.stopLocalVideo();
				this.selectedCamera = cameraId;
				this.getLocalVideoStream();
			},
			onMicSelected(micId) {
				/*this.stopLocalVideo();
				this.selectedMic = micId;
				this.getLocalStream();*/
			},
			onCameraStateChange(state) {
				if (state) {
					this.noVideo = false;
					this.getLocalVideoStream();
				} else {
					this.stopLocalVideo();
					this.userDisabledCamera = true;
					this.noVideo = true;
					this.getApplication().setCameraState(false);
				}
			},
			onMicStateChange(state) {
				if (state) {
					this.getLocalAudioStream();
				} else {
					this.stopLocalAudio();
				}
				this.showMic = state;
			},
			isMobile() {
				return im_lib_utils.Utils.device.isMobile();
			},
			getApplication() {
				return this.$Bitrix.Application.get();
			},
			getVideoConstraints() {
				const videoConstraints = {};
				if (this.selectedCamera) {
					videoConstraints.deviceId = {
						exact: this.selectedCamera
					};
				}
				if (!im_lib_utils.Utils.device.isMobile()) {
					videoConstraints.width = {
						ideal: 1280
					};
					videoConstraints.height = {
						ideal: 720
					};
				}
				return videoConstraints;
			}
		},
		components: {
			MicLevel
		},
		template: `
	<div class="bx-im-component-call-device-check-container">
		<div class="bx-im-component-call-check-devices">
			<div v-show="noVideo">
				<div class="bx-im-component-call-check-devices-camera-no-video">
					<div class="bx-im-component-call-check-devices-camera-no-video-icon"></div>
					<div class="bx-im-component-call-check-devices-camera-no-video-text">{{ noVideoText }}</div>
				</div>
			</div>
			<div v-show="!noVideo">
				<div class="bx-im-component-call-check-devices-camera-video-container">
					<video :class="cameraVideoClasses" ref="video" muted autoplay playsinline></video>
				</div>
			</div>
			<template v-if="!isMobile()">
				<mic-level v-show="showMic" :localStream="audioStream"/>
			</template>
		</div>
	</div>
	`
	};

	const Error = {
		data() {
			return {
				downloadAppArticleCode: 11387752,
				callFeedbackSent: false
			};
		},
		computed: {
			errorCode() {
				return this.conference.common.error;
			},
			bitrix24only() {
				return this.errorCode === call_const.ConferenceErrorCode.bitrix24only;
			},
			detectIntranetUser() {
				return this.errorCode === call_const.ConferenceErrorCode.detectIntranetUser;
			},
			userLimitReached() {
				return this.errorCode === call_const.ConferenceErrorCode.userLimitReached;
			},
			kickedFromCall() {
				return this.errorCode === call_const.ConferenceErrorCode.kickedFromCall;
			},
			wrongAlias() {
				return this.errorCode === call_const.ConferenceErrorCode.wrongAlias;
			},
			conferenceFinished() {
				return this.errorCode === call_const.ConferenceErrorCode.finished;
			},
			unsupportedBrowser() {
				return this.errorCode === call_const.ConferenceErrorCode.unsupportedBrowser;
			},
			missingMicrophone() {
				return this.errorCode === call_const.ConferenceErrorCode.missingMicrophone;
			},
			unsafeConnection() {
				return this.errorCode === call_const.ConferenceErrorCode.unsafeConnection;
			},
			noSignalFromCamera() {
				return this.errorCode === call_const.ConferenceErrorCode.noSignalFromCamera;
			},
			userLeftCall() {
				return this.errorCode === call_const.ConferenceErrorCode.userLeftCall;
			},
			showFeedback() {
				return this.$Bitrix.Application.get().showFeedback;
			},
			callDetails() {
				return this.$Bitrix.Application.get().callDetails;
			},
			isExternalUser() {
				return this.$Bitrix.Application.get().isExternalUser();
			},
			isFinishedByOrganizer() {
				return this.$Bitrix.Application.get().currentCall?.state === call_core.State.Finished;
			},
			localize() {
				return ui_vue.BitrixVue.getFilteredPhrases('BX_IM_COMPONENT_CALL_');
			},
			...ui_vue_vuex.Vuex.mapState({
				conference: state => state.conference
			})
		},
		methods: {
			reloadPage() {
				location.reload();
			},
			redirectToAuthorize() {
				location.href = location.origin + '/auth/?backurl=' + location.pathname;
			},
			continueAsGuest() {
				im_lib_cookie.Cookie.set(null, `VIDEOCONF_GUEST_${this.conference.common.alias}`, '', {
					path: '/'
				});
				location.reload(true);
			},
			getBxLink() {
				return `bx://videoconf/code/${this.$Bitrix.Application.get().getAlias()}`;
			},
			openHelpArticle() {
				if (BX.Helper) {
					BX.Helper.show("redirect=detail&code=" + this.downloadAppArticleCode);
				}
			},
			isMobile() {
				return im_lib_utils.Utils.device.isMobile();
			},
			onFeedbackSent() {
				setTimeout(() => {
					this.callFeedbackSent = true;
				}, 1500);
			}
		},
		template: `
		<div class="bx-im-component-call-error-wrap">
			<template v-if="bitrix24only">
				<div class="bx-im-component-call-error-container">
					<div class="bx-im-component-call-error-icon bx-im-component-call-error-icon-b24only"></div>
					<div class="bx-im-component-call-error-content">
						<div class="bx-im-component-call-error-text">{{ localize['BX_IM_COMPONENT_CALL_ERROR_MESSAGE_B24_ONLY'] }}</div>
						<template v-if="!isMobile()">
							<a @click.prevent="openHelpArticle" class="bx-im-component-call-error-more-link">{{ localize['BX_IM_COMPONENT_CALL_BUTTON_CREATE_OWN'] }}</a>
						</template>
					</div>
				</div>
			</template>
			<template v-if="detectIntranetUser">
				<div class="bx-im-component-call-error-container">
					<div class="bx-im-component-call-error-icon bx-im-component-call-error-icon-intranet"></div>
					<div class="bx-im-component-call-error-content">
						<div class="bx-im-component-call-error-text">{{ localize['BX_IM_COMPONENT_CALL_ERROR_MESSAGE_PLEASE_LOG_IN'] }}</div>
						<div class="bx-im-component-call-error-buttons">
							<button @click="redirectToAuthorize" class="bx-im-component-call-error-button-authorize">{{ this.localize['BX_IM_COMPONENT_CALL_BUTTON_AUTHORIZE'] }}</button>
							<button @click="continueAsGuest" class="bx-im-component-call-error-button-as-guest">{{ this.localize['BX_IM_COMPONENT_CALL_BUTTON_AS_GUEST'] }}</button>
						</div>
					</div>
				</div>
			</template>
			<template v-if="userLimitReached">
				<div class="bx-im-component-call-error-container">
					<div class="bx-im-component-call-error-icon bx-im-component-call-error-icon-full"></div>
					<div class="bx-im-component-call-error-content">
						<div class="bx-im-component-call-error-text">{{ localize['BX_IM_COMPONENT_CALL_ERROR_MESSAGE_USER_LIMIT'] }}</div>
					</div>
				</div>
			</template>
			<template v-if="kickedFromCall">
				<div class="bx-im-component-call-error-container">
					<div class="bx-im-component-call-error-icon bx-im-component-call-error-icon-kicked"></div>
					<div class="bx-im-component-call-error-content">
						<div class="bx-im-component-call-error-text">{{ localize['BX_IM_COMPONENT_CALL_ERROR_MESSAGE_KICKED'] }}</div>
					</div>
				</div>
			</template>
			<template v-if="wrongAlias || conferenceFinished">
				<div class="bx-im-component-call-error-container">
					<div class="bx-im-component-call-error-icon bx-im-component-call-error-icon-finished"></div>
					<div class="bx-im-component-call-error-content">
						<div class="bx-im-component-call-error-text">{{ localize['BX_IM_COMPONENT_CALL_ERROR_FINISHED'] }}</div>
						<template v-if="!isMobile()">
							<a @click.prevent="openHelpArticle" class="bx-im-component-call-error-more-link">{{ localize['BX_IM_COMPONENT_CALL_BUTTON_CREATE_OWN'] }}</a>
						</template>
					</div>
				</div>
			</template>
			<template v-if="unsupportedBrowser">
				<div class="bx-im-component-call-error-container">
					<div class="bx-im-component-call-error-icon bx-im-component-call-error-icon-browser"></div>
					<div class="bx-im-component-call-error-content">
						<div class="bx-im-component-call-error-text">{{ localize['BX_IM_COMPONENT_CALL_ERROR_UNSUPPORTED_BROWSER'] }}</div>
						<template v-if="!isMobile()">
							<a @click.prevent="openHelpArticle" class="bx-im-component-call-error-more-link">{{ localize['BX_IM_COMPONENT_CALL_BUTTON_DETAILS'] }}</a>
						</template>
					</div>
				</div>
			</template>
			<template v-if="missingMicrophone">
				<div class="bx-im-component-call-error-container">
					<div class="bx-im-component-call-error-content">
						<div class="bx-im-component-call-error-text">{{ localize['BX_IM_COMPONENT_CALL_ERROR_NO_MIC'] }}</div>
					</div>
				</div>
			</template>
			<template v-if="unsafeConnection">
				<div class="bx-im-component-call-error-container">
					<div class="bx-im-component-call-error-icon bx-im-component-call-error-icon-https"></div>
					<div class="bx-im-component-call-error-content">
						<div class="bx-im-component-call-error-text">{{ localize['BX_IM_COMPONENT_CALL_ERROR_NO_HTTPS'] }}</div>
					</div>
				</div>
			</template>
			<template v-if="noSignalFromCamera">
				<div class="bx-im-component-call-error-container">
					<div class="bx-im-component-call-error-content">
						<div class="bx-im-component-call-error-text">{{ localize['BX_IM_COMPONENT_CALL_ERROR_NO_SIGNAL_FROM_CAMERA'] }}</div>
						<div class="bx-im-component-call-error-buttons">
							<button @click="reloadPage" class="bx-im-component-call-error-button-reload">{{ localize['BX_IM_COMPONENT_CALL_BUTTON_RELOAD'] }}</button>
						</div>
					</div>
				</div>
			</template>
			<template v-if="userLeftCall">
				<template v-if="!callFeedbackSent && showFeedback">
					<bx-im-component-call-feedback @feedbackSent="onFeedbackSent" :callDetails="callDetails" :darkMode="true"/>
				</template>
				<template v-else>
					<div class="bx-im-component-call-error-container">
						<div class="bx-im-component-call-error-content">
							<div class="bx-im-component-call-error-text">
								<span v-if="isFinishedByOrganizer">
									{{ localize['BX_IM_COMPONENT_CALL_ERROR_ORGANIZER_FINISHED_CONFERENCE'] }}
								</span>
								<span v-else>
									{{ localize['BX_IM_COMPONENT_CALL_ERROR_USER_LEFT_THE_CALL'] }}
								</span>
								<br />
								<a v-if="!isExternalUser" href="/" class="bx-im-component-call-error-link">{{ localize['BX_IM_COMPONENT_CALL_ERROR_RETURN_TO_PORTAL'] }}</a>
							</div>
						</div>
					</div>
				</template>
			</template>
		</div>
	`
	};

	const OrientationDisabled = {
		template: `
		<div class="bx-im-component-call-orientation-disabled-wrap">
			<div class="bx-im-component-call-orientation-disabled-icon"></div>
			<div class="bx-im-component-call-orientation-disabled-text">
				{{ $Bitrix.Loc.getMessage('BX_IM_COMPONENT_CALL_ROTATE_DEVICE') }}
			</div>
		</div>
	`
	};

	const PasswordCheck = {
		data() {
			return {
				password: '',
				checkingPassword: '',
				wrongPassword: ''
			};
		},
		created() {
			main_core_events.EventEmitter.subscribe(im_const.EventType.conference.setPasswordFocus, this.onSetPasswordFocus);
		},
		beforeDestroy() {
			main_core_events.EventEmitter.unsubscribe(im_const.EventType.conference.setPasswordFocus, this.onSetPasswordFocus);
		},
		computed: {
			conferenceTitle() {
				return this.conference.common.conferenceTitle;
			},
			localize() {
				return ui_vue.BitrixVue.getFilteredPhrases('BX_IM_COMPONENT_CALL_');
			},
			...ui_vue_vuex.Vuex.mapState({
				conference: state => state.conference
			})
		},
		methods: {
			onSetPasswordFocus() {
				this.$refs['passwordInput'].focus();
			},
			checkPassword() {
				if (!this.password || this.checkingPassword) {
					this.wrongPassword = true;
					return false;
				}
				this.checkingPassword = true;
				this.wrongPassword = false;
				this.getApplication().checkPassword(this.password).catch(() => {
					this.wrongPassword = true;
				}).finally(() => {
					this.checkingPassword = false;
				});
			},
			getApplication() {
				return this.$Bitrix.Application.get();
			}
		},
		// language=Vue
		template: `
		<div>
			<div class="bx-im-component-call-info-container">
				<div class="bx-im-component-call-info-logo"></div>
				<div class="bx-im-component-call-info-title">{{ conferenceTitle }}</div>
			</div>
			<div class="bx-im-component-call-password-container">
				<template v-if="wrongPassword">
					<div class="bx-im-component-call-password-error">
						{{ localize['BX_IM_COMPONENT_CALL_PASSWORD_WRONG'] }}
					</div>
				</template>
				<template v-else>
					<div class="bx-im-component-call-password-title">
						<div class="bx-im-component-call-password-title-logo"></div>
						<div class="bx-im-component-call-password-title-text">
							{{ localize['BX_IM_COMPONENT_CALL_PASSWORD_TITLE'] }}
						</div>
					</div>
				</template>
				<input
					@keyup.enter="checkPassword"
					type="text"
					v-model="password"
					class="bx-im-component-call-password-input"
					:placeholder="localize['BX_IM_COMPONENT_CALL_PASSWORD_PLACEHOLDER']"
					ref="passwordInput"
				/>
				<button @click="checkPassword" class="ui-btn ui-btn-sm ui-btn-primary bx-im-component-call-password-button">
						{{ localize['BX_IM_COMPONENT_CALL_PASSWORD_JOIN'] }}
				</button>
			</div>
		</div>
	`
	};

	const LoadingStatus = {
		computed: {
			localize() {
				return ui_vue.BitrixVue.getFilteredPhrases('BX_IM_COMPONENT_CALL_');
			}
		},
		// language=Vue
		template: `
		<div class="bx-im-component-call-loading">
			<div class="bx-im-component-call-loading-text">{{ localize['BX_IM_COMPONENT_CALL_LOADING'] }}</div>
		</div>
	`
	};

	const NOT_ALLOWED_ERROR_CODE = 'NotAllowedError';
	const RequestPermissions = {
		props: {
			skipRequest: {
				type: Boolean,
				required: false,
				default: false
			}
		},
		created() {
			main_core_events.EventEmitter.subscribe(im_const.EventType.conference.requestPermissions, this.onRequestPermissions);
			this.getApplication().viewPort.blockButtons(['microphone', 'camera']);
		},
		beforeDestroy() {
			main_core_events.EventEmitter.unsubscribe(im_const.EventType.conference.requestPermissions, this.onRequestPermissions);
		},
		computed: {
			localize() {
				return ui_vue.BitrixVue.getFilteredPhrases('BX_IM_COMPONENT_CALL_');
			}
		},
		methods: {
			onRequestPermissions() {
				this.requestPermissions();
			},
			async requestPermissions() {
				const tryGetUserMedia = async (params = {
					video: 'exact'
				}) => {
					const videoParams = params.video ? {
						width: {
							ideal: 1280
						},
						height: {
							ideal: 720
						},
						deviceId: {
							[params.video]: BX.Call.Hardware.defaultCamera
						}
					} : false;
					const constraints = {
						audio: true,
						video: videoParams
					};
					let stream = null;
					try {
						stream = await navigator.mediaDevices.getUserMedia(constraints);
						this.setPermissionsRequestedFlag();
						return videoParams ? ['microphone', 'camera'] : ['microphone'];
					} catch (error) {
						if (error.name === NOT_ALLOWED_ERROR_CODE) {
							throw error;
						}
						if (params.video === 'exact') {
							return tryGetUserMedia({
								video: 'ideal'
							});
						} else if (params.video === 'ideal') {
							return tryGetUserMedia({
								video: false
							});
						}
						throw error;
					} finally {
						stream?.getTracks().forEach(track => track.stop());
					}
				};
				try {
					await this.getApplication().initHardware();
					const devices = await tryGetUserMedia({
						video: 'exact'
					});
					this.getApplication().viewPort.showButtons(['camera', 'microphone']);
					this.getApplication().viewPort.unblockButtons(devices);
				} catch (error) {
					if (error.name === NOT_ALLOWED_ERROR_CODE) {
						this.showMessageBox(this.localize['BX_IM_COMPONENT_CALL_NOT_ALLOWED_ERROR']);
						return false;
					}
					this.showMessageBox(this.localize['BX_IM_COMPONENT_CALL_HARDWARE_ERROR']);
				} finally {
					BX.Call.Hardware.getCurrentDeviceList();
				}
			},
			setPermissionsRequestedFlag() {
				this.$nextTick(() => this.$store.dispatch('conference/setPermissionsRequested', {
					status: true
				}));
			},
			showMessageBox(text) {
				ui_dialogs_messagebox.MessageBox.show({
					message: text,
					modal: true,
					buttons: ui_dialogs_messagebox.MessageBoxButtons.OK
				});
			},
			getApplication() {
				return this.$Bitrix.Application.get();
			}
		},
		// language=Vue
		template: `
		<div class="bx-im-component-call-permissions-container">
			<template v-if="!skipRequest">
				<div class="bx-im-component-call-permissions-text">{{ localize['BX_IM_COMPONENT_CALL_PERMISSIONS_TEXT'] }}</div>
				<button @click="requestPermissions" class="bx-im-component-call-permissions-button">
					{{ localize['BX_IM_COMPONENT_CALL_ENABLE_DEVICES_BUTTON'] }}
				</button>
				<slot></slot>
			</template>
			<template v-else>
				<div class="bx-im-component-call-permissions-text">{{ localize['BX_IM_COMPONENT_CALL_PERMISSIONS_LOADING'] }}</div>
				<button class="ui-btn ui-btn-sm ui-btn-wait bx-im-component-call-permissions-button">
					{{ localize['BX_IM_COMPONENT_CALL_PERMISSIONS_BUTTON'] }}
				</button>
			</template>
		</div>
	`
	};

	const MobileChatButton = {
		computed: {
			dialogCounter() {
				if (this.dialog) {
					return this.dialog.counter;
				}
			},
			localize() {
				return ui_vue.BitrixVue.getFilteredPhrases('BX_IM_COMPONENT_CALL_');
			},
			...ui_vue_vuex.Vuex.mapState({
				dialog: state => state.dialogues.collection[state.application.dialog.dialogId],
				conference: state => state.conference
			})
		},
		methods: {
			openChat() {
				this.getApplication().toggleChat();
			},
			getApplication() {
				return this.$Bitrix.Application.get();
			}
		},
		template: `
		<div class="bx-im-component-call-open-chat-button-container">
			<div @click="openChat" class="ui-btn-sm ui-btn-icon-chat bx-im-component-call-open-chat-button">
				{{ localize['BX_IM_COMPONENT_CALL_OPEN_CHAT'] }}
				<div v-if="dialogCounter > 0" class="bx-im-component-call-open-chat-button-counter">{{ dialogCounter }}</div>
			</div>
		</div>
	`
	};

	const ConferenceInfo = {
		props: {
			compactMode: {
				type: Boolean,
				required: false,
				default: false
			}
		},
		data() {
			return {
				conferenceDuration: '',
				durationInterval: null
			};
		},
		created() {
			if (this.conferenceStarted) {
				this.updateConferenceDuration();
				this.durationInterval = setInterval(() => {
					this.updateConferenceDuration();
				}, 1000);
			}
		},
		beforeDestroy() {
			clearInterval(this.durationInterval);
		},
		computed: {
			conferenceStarted() {
				return this.conference.common.conferenceStarted;
			},
			conferenceStartDate() {
				return this.conference.common.conferenceStartDate;
			},
			conferenceTitle() {
				return this.conference.common.conferenceTitle;
			},
			userId() {
				return this.application.common.userId;
			},
			isBroadcast() {
				return this.conference.common.isBroadcast;
			},
			presentersList() {
				return this.conference.common.presenters;
			},
			presentersInfo() {
				return this.$store.getters['users/getList'](this.presentersList);
			},
			formattedPresentersList() {
				const presentersCount = this.presentersList.length;
				const prefix = presentersCount > 1 ? this.localize['BX_IM_COMPONENT_CALL_SPEAKERS_MULTIPLE'] : this.localize['BX_IM_COMPONENT_CALL_SPEAKER'];
				const presenters = this.presentersInfo.map(user => user.name).join(', ');
				return `${prefix}: ${presenters}`;
			},
			isCurrentUserPresenter() {
				return this.presentersList.includes(this.userId);
			},
			conferenceStatusText() {
				if (this.conferenceStarted === true) {
					return `${this.localize['BX_IM_COMPONENT_CALL_STATUS_STARTED']}, ${this.conferenceDuration}`;
				} else if (this.conferenceStarted === false) {
					return this.localize['BX_IM_COMPONENT_CALL_STATUS_NOT_STARTED'];
				} else if (this.conferenceStarted === null) {
					return this.localize['BX_IM_COMPONENT_CALL_STATUS_LOADING'];
				}
			},
			conferenceStatusClasses() {
				return ['bx-im-component-call-info-status', this.conferenceStarted ? 'bx-im-component-call-info-status-active' : 'bx-im-component-call-info-status-not-active'];
			},
			containerClasses() {
				return [this.compactMode ? 'bx-im-component-call-info-container-compact' : 'bx-im-component-call-info-container'];
			},
			localize() {
				return ui_vue.BitrixVue.getFilteredPhrases('BX_IM_COMPONENT_CALL_');
			},
			...ui_vue_vuex.Vuex.mapState({
				conference: state => state.conference
			})
		},
		watch: {
			conferenceStarted(newValue) {
				if (newValue === true) {
					this.durationInterval = setInterval(() => {
						this.updateConferenceDuration();
					}, 1000);
				}
				this.updateConferenceDuration();
			}
		},
		methods: {
			updateConferenceDuration() {
				if (!this.conferenceStartDate) {
					return false;
				}
				const startDate = this.conferenceStartDate;
				const currentDate = new Date();
				let durationInSeconds = Math.floor((currentDate - startDate) / 1000);
				let minutes = 0;
				if (durationInSeconds > 60) {
					minutes = Math.floor(durationInSeconds / 60);
					if (minutes < 10) {
						minutes = '0' + minutes;
					}
				}
				let seconds = durationInSeconds - minutes * 60;
				if (seconds < 10) {
					seconds = '0' + seconds;
				}
				this.conferenceDuration = `${minutes}:${seconds}`;
				return true;
			}
		},
		// language=Vue
		template: `
		<div :class="containerClasses">
			<template v-if="compactMode">
				<div class="bx-im-component-call-info-title-container">
					<div class="bx-im-component-call-info-logo"></div>
					<div class="bx-im-component-call-info-title">{{ conferenceTitle }}</div>
				</div>
				<div v-if="isBroadcast" class="bx-im-component-call-info-speakers">{{ formattedPresentersList }}</div>
			</template>
			<template v-else>
				<div class="bx-im-component-call-info-logo"></div>
				<div class="bx-im-component-call-info-title">{{ conferenceTitle }}</div>
					<div v-if="isBroadcast" class="bx-im-component-call-info-speakers">{{ formattedPresentersList }}</div>	
			</template>
			<div :class="conferenceStatusClasses">{{ conferenceStatusText }}</div>
		</div>
	`
	};

	const UserForm = {
		data() {
			return {
				userNewName: ''
			};
		},
		computed: {
			conferenceStarted() {
				return this.conference.common.conferenceStarted;
			},
			userHasRealName() {
				if (this.user) {
					return this.user.name !== this.localize['BX_IM_COMPONENT_CALL_DEFAULT_USER_NAME'];
				}
				return false;
			},
			intranetAvatarStyle() {
				if (this.user && !this.user.extranet && this.user.avatar) {
					return {
						backgroundImage: `url('${this.user.avatar}')`
					};
				}
				return '';
			},
			logoutLink() {
				return `${this.publicLink}?logout=yes&sessid=${BX.bitrix_sessid()}`;
			},
			publicLink() {
				if (this.dialog) {
					return this.dialog.public.link;
				}
			},
			userId() {
				return this.application.common.userId;
			},
			isBroadcast() {
				return this.conference.common.isBroadcast;
			},
			presentersList() {
				return this.conference.common.presenters;
			},
			isCurrentUserPresenter() {
				return this.presentersList.includes(this.userId);
			},
			localize() {
				return ui_vue.BitrixVue.getFilteredPhrases('BX_IM_COMPONENT_CALL_');
			},
			videoModeButtonClasses() {
				const classes = ['bx-im-component-call-join-video'];
				if (!this.getApplication().hardwareInited) {
					classes.push('disabled');
				}
				return classes;
			},
			audioModeButtonClasses() {
				const classes = ['bx-im-component-call-join-audio'];
				if (!this.getApplication().hardwareInited) {
					classes.push('disabled');
				}
				return classes;
			},
			...ui_vue_vuex.Vuex.mapState({
				user: state => state.users.collection[state.application.common.userId],
				application: state => state.application,
				conference: state => state.conference
			})
		},
		methods: {
			startConference({
				video
			}) {
				this.getApplication().startCall(video);
			},
			async joinConference({
				video
			}) {
				if (this.user.extranet && !this.userHasRealName) {
					await this.setNewName();
				}
				if (!this.conferenceStarted) {
					main_core_events.EventEmitter.emit(im_const.EventType.conference.waitForStart);
					this.getApplication().setUserReadyToJoin();
					this.getApplication().setJoinType(video);
				} else {
					const viewerMode = this.isBroadcast && !this.isCurrentUserPresenter;
					im_lib_logger.Logger.warn('ready to join call', video, viewerMode);
					if (viewerMode) {
						this.getApplication().joinCall(this.getApplication().preCall.id, this.getApplication().preCall.uuid, {
							joinAsViewer: true
						});
					} else {
						this.getApplication().joinCall(this.getApplication().preCall.id, this.getApplication().preCall.uuid, {
							video
						});
					}
				}
			},
			async setNewName() {
				if (this.userNewName.length > 0) {
					await this.getApplication().renameGuest(this.userNewName);
				}
			},
			getApplication() {
				return this.$Bitrix.Application.get();
			},
			isDesktop() {
				return im_lib_utils.Utils.platform.isBitrixDesktop();
			}
		},
		template: `
		<div class="bx-im-component-call-form">
			<template v-if="user && userHasRealName">
				<template v-if="!user.extranet">
					<div class="bx-im-component-call-intranet-name-container">
						<div class="bx-im-component-call-intranet-name-title">
							{{ localize['BX_IM_COMPONENT_CALL_INTRANET_NAME_TITLE'] }}
						</div>
						<div class="bx-im-component-call-intranet-name-content">
							<div class="bx-im-component-call-intranet-name-content-left">
								<div class="bx-im-component-call-intranet-name-text">{{ user.name }}</div>
							</div>
							<template v-if="!isDesktop()">
								<a :href="logoutLink" class="bx-im-component-call-intranet-name-logout">
									{{ localize['BX_IM_COMPONENT_CALL_INTRANET_LOGOUT'] }}
								</a>
							</template>
						</div>
					</div>
				</template>
				<template v-else-if="user.extranet">
					<div class="bx-im-component-call-guest-name-container">
						<div class="bx-im-component-call-guest-name-text">{{ user.name }}</div>
					</div>
				</template>
			</template>
			<!-- New guest, need to specify name -->
			<template v-else-if="user && !userHasRealName">
				<input
					v-model.trim="userNewName"
					type="text"
					:placeholder="localize['BX_IM_COMPONENT_CALL_NAME_PLACEHOLDER']"
					class="bx-im-component-call-name-input"
					ref="nameInput"
				/>
			</template>
			<!-- Buttons -->
			<template v-if="user">
				<!-- Broadcast mode -->
				<template v-if="isBroadcast">
					<!-- Speaker can start conference -->
					<template v-if="isCurrentUserPresenter && !conferenceStarted">
						<button
							@click="startConference({video: true})"
							:class="videoModeButtonClasses"
						>
							{{ localize['BX_IM_COMPONENT_CALL_START_WITH_VIDEO'] }}
						</button>
						<button
							@click="startConference({video: false})"
							:class="audioModeButtonClasses"
						>
							{{ localize['BX_IM_COMPONENT_CALL_START_WITH_AUDIO'] }}
						</button>
					</template>
					<!-- Speakers can join with audio/video -->
					<template v-else-if="conferenceStarted && isCurrentUserPresenter">
						<button
							@click="joinConference({video: true})"
							:class="videoModeButtonClasses"
						>
							{{ localize['BX_IM_COMPONENT_CALL_JOIN_WITH_VIDEO'] }}
						</button>
						<button
							@click="joinConference({video: false})"
							:class="audioModeButtonClasses"
						>
							{{ localize['BX_IM_COMPONENT_CALL_JOIN_WITH_AUDIO'] }}
						</button>
					</template>
					<!-- Others can join as viewers -->
					<template v-else-if="!isCurrentUserPresenter">
						<button
							@click="joinConference({video: false})"
							class="bx-im-component-call-join-video"
						>
							{{ localize['BX_IM_COMPONENT_CALL_JOIN'] }}
						</button>
					</template>
				</template>
				<!-- End broadcast mode -->
				<template v-else-if="!isBroadcast">
					<!-- Intranet user can start conference -->
					<template v-if="!user.extranet && !conferenceStarted">
						<button
							@click="startConference({video: true})"
							:class="videoModeButtonClasses"
						>
							{{ localize['BX_IM_COMPONENT_CALL_START_WITH_VIDEO'] }}
						</button>
						<button
							@click="startConference({video: false})"
							:class="audioModeButtonClasses"
						>
							{{ localize['BX_IM_COMPONENT_CALL_START_WITH_AUDIO'] }}
						</button>
					</template>
					<!-- Others can join -->
					<template v-else>
						<button
							@click="joinConference({video: true})"
							:class="videoModeButtonClasses"
						>
							{{ localize['BX_IM_COMPONENT_CALL_JOIN_WITH_VIDEO'] }}
						</button>
						<button
							@click="joinConference({video: false})"
							:class="audioModeButtonClasses"
						>
							{{ localize['BX_IM_COMPONENT_CALL_JOIN_WITH_AUDIO'] }}
						</button>
					</template>
				</template>
			</template>
			<!--End normal (not broadcast) mode-->
		</div>
	`
	};

	const ChatHeader = {
		created() {
			this.desktop = new im_lib_desktop.Desktop();
		},
		computed: {
			showTotalCounter() {
				return im_lib_utils.Utils.platform.isBitrixDesktop() && (this.desktop.getApiVersion() >= 60 || !im_lib_utils.Utils.platform.isWindows()) && !this.getApplication().isExternalUser() && this.messageCount > 0;
			},
			messageCount() {
				return this.conference.common.messageCount;
			},
			formattedCounter() {
				return this.messageCount > 99 ? '99+' : this.messageCount;
			},
			localize() {
				return ui_vue.BitrixVue.getFilteredPhrases('BX_IM_COMPONENT_CALL_');
			},
			...ui_vue_vuex.Vuex.mapState({
				conference: state => state.conference
			})
		},
		methods: {
			onCloseChat() {
				this.getApplication().toggleChat();
			},
			onTotalCounterClick() {
				if (opener && opener.BXDesktopWindow) {
					opener.BXDesktopWindow.ExecuteCommand('show.active');
				}
			},
			getApplication() {
				return this.$Bitrix.Application.get();
			}
		},
		template: `
		<div class="bx-im-component-call-right-header">
			<div class="bx-im-component-call-right-header-left">
				<div @click="onCloseChat" class="bx-im-component-call-right-header-close" :title="localize['BX_IM_COMPONENT_CALL_CHAT_CLOSE_TITLE']"></div>
				<div class="bx-im-component-call-right-header-title">{{ localize['BX_IM_COMPONENT_CALL_CHAT_TITLE'] }}</div>
 
			</div>
			<template v-if="showTotalCounter">
				<div @click="onTotalCounterClick" class="bx-im-component-call-right-header-right bx-im-component-call-right-header-all-chats">
					<div class="bx-im-component-call-right-header-all-chats-title">{{ localize['BX_IM_COMPONENT_CALL_ALL_CHATS'] }}</div>
					<div class="bx-im-component-call-right-header-all-chats-counter">{{ messageCount }}</div>
				</div>
			</template>
		</div>
	`
	};

	const WaitingForStart = {
		computed: {
			userCounter() {
				return this.dialog.userCounter;
			},
			localize() {
				return ui_vue.BitrixVue.getFilteredPhrases('BX_IM_COMPONENT_CALL_');
			},
			...ui_vue_vuex.Vuex.mapState({
				conference: state => state.conference,
				dialog: state => state.dialogues.collection[state.application.dialog.dialogId]
			})
		},
		// language=Vue
		template: `
		<div class="bx-im-component-call-wait-container">
			<div class="bx-im-component-call-wait-main">
				<div class="bx-im-component-call-wait-logo"></div>
				<div class="bx-im-component-call-wait-title">{{ localize['BX_IM_COMPONENT_CALL_WAIT_START_TITLE'] }}</div>
			</div>
			<div class="bx-im-component-call-wait-user-counter">
				{{ localize['BX_IM_COMPONENT_CALL_WAIT_START_USER_COUNT'] }} {{ userCounter }}
			</div>
			<slot></slot>
		</div>
	`
	};

	const UserListItem = {
		props: {
			user: {
				type: Object,
				required: true
			},
			userCallStatus: {
				type: Object,
				required: true
			},
			currentUserId: {
				type: Number,
				required: true
			},
			isCurrentUserExternal: {
				type: Boolean,
				required: true
			},
			isBroadcast: {
				type: Boolean,
				required: true
			},
			isUserPresenter: {
				type: Boolean,
				required: true
			},
			pinAvailable: {
				type: Boolean,
				required: true
			},
			chatOwner: {
				type: Number,
				required: true
			},
			conferenceState: {
				type: String,
				required: true
			}
		},
		data: function () {
			return {
				renameMode: false,
				newName: '',
				renameRequested: false,
				menuId: 'bx-messenger-context-popup-external-data',
				onlineStates: [call_const.ConferenceUserState.Ready, call_const.ConferenceUserState.Connected]
			};
		},
		computed: {
			isCurrentUserOwner() {
				return this.chatOwner === this.currentUserId;
			},
			isMobile() {
				return im_lib_utils.Utils.device.isMobile();
			},
			isDesktop() {
				return im_lib_utils.Utils.platform.isBitrixDesktop();
			},
			isGuestWithDefaultName() {
				const guestDefaultName = this.$Bitrix.Loc.getMessage('BX_IM_COMPONENT_CALL_DEFAULT_USER_NAME');
				return this.user.id === this.currentUserId && this.user.extranet && this.user.name === guestDefaultName;
			},
			isUserInCall() {
				return this.onlineStates.includes(this.userCallStatus.state);
			},
			// end statuses
			formattedSubtitle() {
				let subtitle = '';
				const role = this.$Bitrix.Loc.getMessage(this.user.id === this.chatOwner ? 'BX_IM_COMPONENT_CALL_USER_LIST_STATUS_OWNER' : 'BX_IM_COMPONENT_CALL_USER_LIST_STATUS_PARTICIPANT');
				if (this.user.id === this.currentUser) {
					subtitle = this.$Bitrix.Loc.getMessage('BX_IM_COMPONENT_CALL_USER_LIST_STATUS_CURRENT_USER_MSGVER_1', {
						'#ROLE#': role
					});
				} else {
					subtitle = role;
				}

				// if (!this.user.extranet && !this.user.isOnline)
				// {
				// 	subtitles.push(this.$Bitrix.Loc.getMessage('BX_IM_COMPONENT_CALL_USER_LIST_STATUS_OFFLINE'));
				// }

				return subtitle;
			},
			isMenuNeeded() {
				return this.menuItems.length > 0;
			},
			menuItems() {
				const items = [];
				// for self
				if (this.user.id === this.currentUserId) {
					// self-rename
					if (this.isCurrentUserExternal) {
						items.push({
							text: this.$Bitrix.Loc.getMessage('BX_IM_COMPONENT_CALL_USER_LIST_MENU_RENAME_SELF'),
							onclick: () => {
								this.closeMenu();
								this.onRenameStart();
							}
						});
					}
					// change background
					if (this.isDesktop) {
						items.push({
							text: this.$Bitrix.Loc.getMessage('BX_IM_COMPONENT_CALL_USER_LIST_MENU_CHANGE_BACKGROUND'),
							onclick: () => {
								this.closeMenu();
								this.$emit('userChangeBackground');
							}
						});
					}
				}
				// for other users
				else {
					// force-rename
					if (this.isCurrentUserOwner && this.user.externalAuthId === 'call') {
						items.push({
							text: this.$Bitrix.Loc.getMessage('BX_IM_COMPONENT_CALL_USER_LIST_MENU_RENAME'),
							onclick: () => {
								this.closeMenu();
								this.onRenameStart();
							}
						});
					}
					// kick
					if (this.isCurrentUserOwner && !this.isUserPresenter) {
						items.push({
							text: this.$Bitrix.Loc.getMessage('BX_IM_COMPONENT_CALL_USER_LIST_MENU_KICK'),
							onclick: () => {
								this.closeMenu();
								this.$emit('userKick', {
									user: this.user
								});
							}
						});
					}
					if (this.isUserInCall && this.userCallStatus.cameraState && this.pinAvailable) {
						// pin
						if (!this.userCallStatus.pinned) {
							items.push({
								text: this.$Bitrix.Loc.getMessage('BX_IM_COMPONENT_CALL_USER_LIST_MENU_PIN'),
								onclick: () => {
									this.closeMenu();
									this.$emit('userPin', {
										user: this.user
									});
								}
							});
						}
						// unpin
						else {
							items.push({
								text: this.$Bitrix.Loc.getMessage('BX_IM_COMPONENT_CALL_USER_LIST_MENU_UNPIN'),
								onclick: () => {
									this.closeMenu();
									this.$emit('userUnpin');
								}
							});
						}
					}
					// open 1-1 chat and profile
					if (this.isDesktop && !this.user.extranet) {
						items.push({
							text: this.$Bitrix.Loc.getMessage('BX_IM_COMPONENT_CALL_USER_LIST_MENU_OPEN_CHAT'),
							onclick: () => {
								this.closeMenu();
								this.$emit('userOpenChat', {
									user: this.user
								});
							}
						});
						items.push({
							text: this.$Bitrix.Loc.getMessage('BX_IM_COMPONENT_CALL_USER_LIST_MENU_OPEN_PROFILE'),
							onclick: () => {
								this.closeMenu();
								this.$emit('userOpenProfile', {
									user: this.user
								});
							}
						});
					}
					// insert name
					items.push({
						text: this.$Bitrix.Loc.getMessage('BX_IM_COMPONENT_CALL_USER_LIST_MENU_INSERT_NAME'),
						onclick: () => {
							this.closeMenu();
							this.$emit('userInsertName', {
								user: this.user
							});
						}
					});
				}
				return items;
			},
			avatarWrapClasses() {
				const classes = ['bx-im-component-call-user-list-item-avatar-wrap'];
				if (this.userCallStatus.talking) {
					classes.push('bx-im-component-call-user-list-item-avatar-wrap-talking');
				}
				return classes;
			},
			avatarClasses() {
				const classes = ['bx-im-component-call-user-list-item-avatar'];
				if (!this.user.avatar && this.user.extranet) {
					classes.push('bx-im-component-call-user-list-item-avatar-extranet');
				} else if (!this.user.avatar && !this.user.extranet) {
					classes.push('bx-im-component-call-user-list-item-avatar-default');
				}
				return classes;
			},
			avatarStyle() {
				const style = {};
				if (this.user.avatar) {
					style.backgroundImage = `url('${this.user.avatar}')`;
				} else if (!this.user.avatar && !this.user.extranet) {
					style.backgroundColor = this.user.color;
				}
				return style;
			},
			avatarInnerText() {
				if (!this.user.avatar && !this.user.extranet) {
					return im_v2_lib_utils.Utils.text.getFirstLetters(this.user.name).toUpperCase();
				}
				return '';
			},
			isCallStatusPanelNeeded() {
				if (this.isBroadcast) {
					return this.conferenceState === call_const.ConferenceStateType.call && this.isUserInCall && this.isUserPresenter;
				} else {
					return this.conferenceState === call_const.ConferenceStateType.call && this.isUserInCall;
				}
			},
			callMenuIconClasses() {
				return ['bx-im-component-call-user-list-item-icons-icon bx-im-component-call-user-list-item-icons-menu'];
			},
			callLeftIconClasses() {
				const classes = ['bx-im-component-call-user-list-item-icons-icon bx-im-component-call-user-list-item-icons-left'];
				if (this.userCallStatus.floorRequestState) {
					classes.push('bx-im-component-call-user-list-item-icons-floor-request visible');
				} else if (this.userCallStatus.screenState) {
					classes.push('bx-im-component-call-user-list-item-icons-screen visible');
				}
				return classes;
			},
			callCenterIconClasses() {
				const classes = ['bx-im-component-call-user-list-item-icons-icon bx-im-component-call-user-list-item-icons-center'];
				if (this.userCallStatus.microphoneState) {
					classes.push('bx-im-component-call-user-list-item-icons-mic-on');
				} else {
					classes.push('bx-im-component-call-user-list-item-icons-mic-off');
				}
				return classes;
			},
			callRightIconClasses() {
				const classes = ['bx-im-component-call-user-list-item-icons-icon bx-im-component-call-user-list-item-icons-right'];
				if (this.userCallStatus.cameraState) {
					classes.push('bx-im-component-call-user-list-item-icons-camera-on');
				} else {
					classes.push('bx-im-component-call-user-list-item-icons-camera-off');
				}
				return classes;
			},
			bodyClasses() {
				const classes = ['bx-im-component-call-user-list-item-body'];
				if (!this.isUserInCall) {
					classes.push('bx-im-component-call-user-list-item-body-offline');
				}
				return classes;
			},
			itemClasses() {
				const classes = ['bx-im-component-call-user-list-item'];
				if (this.user.id === this.chatOwner) {
					classes.push('bx-im-component-call-user-list-item-owner');
				}
				return classes;
			}
		},
		methods: {
			openMenu() {
				if (this.menuPopup) {
					this.closeMenu();
					return false;
				}

				//menu for other items
				const existingMenu = main_popup.MenuManager.getMenuById(this.menuId);
				if (existingMenu) {
					existingMenu.destroy();
				}
				this.menuPopup = main_popup.MenuManager.create({
					id: this.menuId,
					className: 'bx-conference-user-list-item-context-menu',
					background: '#00428F',
					contentBackground: '#00428F',
					darkMode: true,
					contentBorderRadius: '6px',
					borderRadius: '6px',
					bindElement: this.$refs['user-menu'],
					items: this.menuItems,
					events: {
						onPopupClose: () => this.menuPopup.destroy(),
						onPopupDestroy: () => this.menuPopup = null
					}
				});
				this.menuPopup.show();
			},
			closeMenu() {
				this.menuPopup.destroy();
				this.menuPopup = null;
			},
			onRenameStart() {
				this.newName = this.user.name;
				this.renameMode = true;
				this.$nextTick(() => {
					this.$refs['rename-input'].focus();
					this.$refs['rename-input'].select();
				});
			},
			onRenameKeyDown(event) {
				//enter
				if (event.keyCode === 13) {
					this.changeName();
				}
				//escape
				else if (event.keyCode === 27) {
					this.renameMode = false;
				}
			},
			changeName() {
				if (this.user.name === this.newName.trim() || this.newName === '') {
					this.renameMode = false;
					return false;
				}
				this.$emit('userChangeName', {
					user: this.user,
					newName: this.newName
				});
				this.$nextTick(() => {
					this.renameMode = false;
				});
			},
			onFocus(event) {
				main_core_events.EventEmitter.emit(im_const.EventType.conference.userRenameFocus, event);
			},
			onBlur(event) {
				main_core_events.EventEmitter.emit(im_const.EventType.conference.userRenameBlur, event);
			}
		},
		//language=Vue
		template: `
		<div :class="itemClasses">
			<!-- Avatar -->
			<div :class="avatarWrapClasses">
				<div :class="avatarClasses" :style="avatarStyle">
					<div class="bx-im-component-call-user-list-item-avatar-inner-text" v-if="avatarInnerText">{{ avatarInnerText }}</div>
				</div>
			</div>
			<!-- Body -->
			<div :class="bodyClasses">
				<!-- Introduce yourself blinking mode -->
				<template v-if="!renameMode && isGuestWithDefaultName">
					<div class="bx-im-component-call-user-list-item-body-left">
						<div @click="onRenameStart" class="bx-im-component-call-user-list-introduce-yourself">
							<div class="bx-im-component-call-user-list-introduce-yourself-text">{{ $Bitrix.Loc.getMessage('BX_IM_COMPONENT_CALL_USER_LIST_INTRODUCE_YOURSELF') }}</div>
						</div>
					</div>
				</template>
				<!-- Rename mode -->
				<template v-else-if="renameMode">
					<div class="bx-im-component-call-user-list-item-body-left">
						<div class="bx-im-component-call-user-list-change-name-container">
							<div @click="renameMode = false" class="bx-im-component-call-user-list-change-name-cancel"></div>
							<input @keydown="onRenameKeyDown" @focus="onFocus" @blur="onBlur" v-model="newName" :ref="'rename-input'" type="text" class="bx-im-component-call-user-list-change-name-input">
							<div v-if="!renameRequested" @click="changeName" class="bx-im-component-call-user-list-change-name-confirm"></div>
							<div v-else class="bx-im-component-call-user-list-change-name-loader">
								<div class="bx-im-component-call-user-list-change-name-loader-icon"></div>
							</div>
						</div>
					</div>
				</template>
				<template v-if="!renameMode && !isGuestWithDefaultName">
					<div class="bx-im-component-call-user-list-item-body-left">
						<div class="bx-im-component-call-user-list-item-name-wrap">
							<!-- Name -->
							<div class="bx-im-component-call-user-list-item-name">{{ user.name }}</div>
							<!-- Status subtitle -->
							<div v-if="formattedSubtitle !== ''" class="bx-im-component-call-user-list-item-name-subtitle">{{ formattedSubtitle }}</div>
						</div>
					</div>
				</template>
				<template v-if="isCallStatusPanelNeeded">
					<div class="bx-im-component-call-user-list-item-icons">
						<!-- Context menu icon -->
						<div :class="callMenuIconClasses" v-if="menuItems.length > 0 && !isMobile" @click="openMenu" ref="user-menu"></div>
						<div :class="callLeftIconClasses"></div>
						<div :class="callCenterIconClasses"></div>
						<div :class="callRightIconClasses"></div>
					</div>
				</template>
			</div>
		</div>
	`
	};

	const UserList = {
		components: {
			UserListItem
		},
		data() {
			return {
				usersPerPage: 50,
				firstPageLoaded: false,
				pagesLoaded: 0,
				hasMoreToLoad: true,
				rename: {
					user: 0,
					newName: '',
					renameRequested: false
				},
				onlineStates: [call_const.ConferenceUserState.Ready, call_const.ConferenceUserState.Connected]
			};
		},
		created() {
			im_lib_logger.Logger.warn('Conference: user list created');
			this.requestUsers({
				firstPage: true
			});
		},
		beforeDestroy() {
			this.loaderObserver = null;
		},
		computed: {
			chatOwner() {
				return this.dialog?.ownerId || 0;
			},
			pinAvailable() {
				const users = Object.values(this.call.users);
				const onlineCount = users.filter(user => this.onlineStates.includes(user.state)).length;
				return onlineCount > 2;
			},
			isCurrentUserExternal() {
				return Boolean(this.conference.user.hash);
			},
			userId() {
				return this.application.common.userId;
			},
			isBroadcast() {
				return this.conference.common.isBroadcast;
			},
			usersList() {
				const users = this.conference.common.users.filter(user => {
					return !this.presentersList.includes(user) && this.call.users[user] && [call_const.ConferenceUserState.Ready, call_const.ConferenceUserState.Connected].includes(this.call.users[user].state);
				});
				return [...users].sort(this.userSortFunction);
			},
			presentersList() {
				return [...this.conference.common.presenters].sort(this.userSortFunction);
			},
			rightPanelMode() {
				return this.conference.common.rightPanelMode;
			},
			...ui_vue_vuex.Vuex.mapState({
				user: state => state.users.collection[state.application.common.userId],
				application: state => state.application,
				conference: state => state.conference,
				call: state => state.call,
				dialog: state => state.dialogues.collection[state.application.dialog.dialogId]
			})
		},
		methods: {
			getUserInfo(userId) {
				return this.$store.getters['users/get'](userId, true);
			},
			getUserStatus(userId) {
				return this.$store.getters['call/getUser'](userId);
			},
			requestUsers({
				firstPage = false
			} = {}) {
				this.$Bitrix.RestClient.get().callMethod('im.dialog.users.list', {
					'DIALOG_ID': this.application.dialog.dialogId,
					'LIMIT': this.usersPerPage,
					'OFFSET': firstPage ? 0 : this.pagesLoaded * this.usersPerPage
				}).then(result => {
					im_lib_logger.Logger.warn('Conference: getting next user list result', result.data());
					const users = result.data();
					this.pagesLoaded++;
					if (users.length < this.usersPerPage) {
						this.hasMoreToLoad = false;
					}
					this.$store.dispatch('users/set', users);
					const usersIds = users.map(user => user.id);
					return this.$store.dispatch('conference/setUsers', {
						users: usersIds
					});
				}).then(() => {
					if (firstPage) {
						this.firstPageLoaded = true;
					}
				}).catch(result => {
					im_lib_logger.Logger.warn('Conference: error getting users list', result.error().ex);
				});
			},
			onUserMenuKick({
				user
			}) {
				this.showUserKickConfirm(user);
			},
			showUserKickConfirm(user) {
				if (this.userKickConfirm) {
					this.userKickConfirm.close();
				}
				let confirmMessage = this.$Bitrix.Loc.getMessage('BX_IM_COMPONENT_CALL_KICK_INTRANET_USER_CONFIRM_TEXT');
				if (user.extranet) {
					confirmMessage = this.$Bitrix.Loc.getMessage('BX_IM_COMPONENT_CALL_KICK_GUEST_USER_CONFIRM_TEXT');
				}
				this.userKickConfirm = ui_dialogs_messagebox.MessageBox.create({
					message: confirmMessage,
					modal: true,
					buttons: ui_dialogs_messagebox.MessageBoxButtons.OK_CANCEL,
					onOk: () => {
						this.kickUser(user);
						this.userKickConfirm.close();
					},
					onCancel: () => {
						this.userKickConfirm.close();
					}
				});
				this.userKickConfirm.show();
			},
			kickUser(user) {
				this.$store.dispatch('conference/removeUsers', {
					users: [user.id]
				});
				this.$Bitrix.RestClient.get().callMethod('im.chat.user.delete', {
					user_id: user.id,
					chat_id: this.application.dialog.chatId
				}).catch(error => {
					im_lib_logger.Logger.error('Conference: removing user from chat error', error);
					this.$store.dispatch('conference/setUsers', {
						users: [user.id]
					});
				});
			},
			onUserMenuInsertName({
				user
			}) {
				if (this.rightPanelMode === call_const.ConferenceRightPanelMode.hidden || this.rightPanelMode === call_const.ConferenceRightPanelMode.users) {
					this.getApplication().toggleChat();
				}
				this.$nextTick(() => {
					main_core_events.EventEmitter.emit(im_const.EventType.textarea.insertText, {
						text: `${user.name}, `,
						focus: true
					});
				});
			},
			onUserChangeName({
				user,
				newName
			}) {
				const method = user.id === this.userId ? 'call.user.update' : 'call.user.force.rename';
				const oldName = user.name;
				this.$store.dispatch('users/update', {
					id: user.id,
					fields: {
						name: newName,
						lastActivityDate: new Date()
					}
				});
				this.$Bitrix.RestClient.get().callMethod(method, {
					name: newName,
					chat_id: this.application.dialog.chatId,
					user_id: user.id
				}).then(() => {
					im_lib_logger.Logger.warn('Conference: rename completed', user.id, newName);
					if (oldName === this.$Bitrix.Loc.getMessage('BX_IM_COMPONENT_CALL_DEFAULT_USER_NAME')) {
						this.getApplication().setUserWasRenamed();
					}
				}).catch(error => {
					im_lib_logger.Logger.error('Conference: renaming error', error);
					this.$store.dispatch('users/update', {
						id: user.id,
						fields: {
							name: oldName,
							lastActivityDate: new Date()
						}
					});
				});
			},
			onUserMenuPin({
				user
			}) {
				this.getApplication().pinUser(user);
			},
			onUserMenuUnpin() {
				this.getApplication().unpinUser();
			},
			onUserMenuChangeBackground() {
				this.getApplication().changeBackground();
			},
			onUserMenuOpenChat({
				user
			}) {
				this.getApplication().openChat(user);
			},
			onUserMenuOpenProfile({
				user
			}) {
				this.getApplication().openProfile(user);
			},
			// Helpers
			getLoaderObserver() {
				const options = {
					root: document.querySelector('.bx-im-component-call-right-users'),
					threshold: 0.01
				};
				const callback = (entries, observer) => {
					entries.forEach(entry => {
						if (entry.isIntersecting && entry.intersectionRatio > 0.01) {
							im_lib_logger.Logger.warn('Conference: UserList: I see loader! Load next page!');
							this.requestUsers();
						}
					});
				};
				return new IntersectionObserver(callback, options);
			},
			userSortFunction(userA, userB) {
				if (userA === this.userId) {
					return -1;
				}
				if (userB === this.userId) {
					return 1;
				}
				if (this.call.users[userA] && (this.call.users[userA].floorRequestState || this.call.users[userA].screenState)) {
					return -1;
				}
				if (this.call.users[userB] && (this.call.users[userB].floorRequestState || this.call.users[userB].screenState)) {
					return 1;
				}
				if (this.call.users[userA] && [call_const.ConferenceUserState.Ready, call_const.ConferenceUserState.Connected].includes(this.call.users[userA].state)) {
					return -1;
				}
				if (this.call.users[userB] && [call_const.ConferenceUserState.Ready, call_const.ConferenceUserState.Connected].includes(this.call.users[userB].state)) {
					return 1;
				}
				return 0;
			},
			getApplication() {
				return this.$Bitrix.Application.get();
			}
		},
		directives: {
			'bx-im-directive-user-list-observer': {
				inserted(element, bindings, vnode) {
					vnode.context.loaderObserver = vnode.context.getLoaderObserver();
					vnode.context.loaderObserver.observe(element);
					return true;
				},
				unbind(element, bindings, vnode) {
					if (vnode.context.loaderObserver) {
						vnode.context.loaderObserver.unobserve(element);
					}
					return true;
				}
			}
		},
		template: `
		<div class="bx-im-component-call-user-list">
			<!-- Loading first page -->
			<div v-if="!firstPageLoaded" class="bx-im-component-call-user-list-loader">
				<div class="bx-im-component-call-user-list-loader-icon"></div>
				<div class="bx-im-component-call-user-list-loader-text">
					{{ $Bitrix.Loc.getMessage('BX_IM_COMPONENT_CALL_USER_LIST_LOADING_USERS') }}
				</div>
			</div>
			<!-- Loading completed -->
			<template v-else>
				<!-- Speakers list section (if broadcast) -->
				<template v-if="isBroadcast">
					<!-- Speakers category title -->
					<div class="bx-im-component-call-user-list-category">
						<div class="bx-im-component-call-user-list-category-text">
							{{ $Bitrix.Loc.getMessage('BX_IM_COMPONENT_CALL_USER_LIST_CATEGORY_PRESENTERS') }}
						</div>
						<div class="bx-im-component-call-user-list-category-counter">
							{{ presentersList.length }}
						</div>
					</div>
					<!-- Speakers list -->
					<div class="bx-im-component-call-user-list-items">
						<template v-for="presenter in presentersList">
							<UserListItem
								@userChangeName="onUserChangeName"
								@userKick="onUserMenuKick"
								@userInsertName="onUserMenuInsertName"
								@userPin="onUserMenuPin"
								@userUnpin="onUserMenuUnpin"
								@userChangeBackground="onUserMenuChangeBackground"
								@userOpenChat="onUserMenuOpenChat"
								@userOpenProfile="onUserMenuOpenProfile"
								:user="getUserInfo(presenter)"
								:userCallStatus="getUserStatus(presenter)"
								:currentUserId="userId"
								:isCurrentUserExternal="isCurrentUserExternal"
								:isBroadcast="isBroadcast"
								:isUserPresenter="presentersList.includes(presenter)"
								:pinAvailable="pinAvailable"
								:chatOwner="dialog.ownerId"
								:conferenceState="conference.common.state"
								:key="presenter"
							/>
						</template>
					</div>
				</template>
				<!-- Participants list section (if there are any users) -->
				<template v-if="usersList.length > 0">
					<!-- Show participants category title if broadcast -->
					<div v-if="isBroadcast" class="bx-im-component-call-user-list-category bx-im-component-call-user-list-category-participants">
						<div class="bx-im-component-call-user-list-category-text">
							{{ $Bitrix.Loc.getMessage('BX_IM_COMPONENT_CALL_USER_LIST_CATEGORY_PARTICIPANTS') }}
						</div>
						<div class="bx-im-component-call-user-list-category-counter">
							{{ usersList.length }}
						</div>
					</div>
					<!-- Participants list -->
					<div class="bx-im-component-call-user-list-items">
						<template v-for="user in usersList">
							<UserListItem
								@userChangeName="onUserChangeName"
								@userKick="onUserMenuKick"
								@userInsertName="onUserMenuInsertName" 
								@userPin="onUserMenuPin"
								@userUnpin="onUserMenuUnpin"
								@userChangeBackground="onUserMenuChangeBackground"
								@userOpenChat="onUserMenuOpenChat"
								@userOpenProfile="onUserMenuOpenProfile"
								:user="getUserInfo(user)"
								:userCallStatus="getUserStatus(user)"
								:currentUserId="userId"
								:isCurrentUserExternal="isCurrentUserExternal"
								:isBroadcast="isBroadcast"
								:isUserPresenter="presentersList.includes(user)"
								:pinAvailable="pinAvailable"
								:chatOwner="dialog.ownerId"
								:conferenceState="conference.common.state"
								:key="user" />
						</template>
					</div>
				</template>
				<!-- Next page loader -->
				<div v-if="hasMoreToLoad" v-bx-im-directive-user-list-observer class="bx-im-component-call-user-list-loader">
					<div class="bx-im-component-call-user-list-loader-icon"></div>
					<div class="bx-im-component-call-user-list-loader-text">
						{{ $Bitrix.Loc.getMessage('BX_IM_COMPONENT_CALL_USER_LIST_LOADING_USERS') }}
					</div>
				</div>
			</template>	
		</div>
	`
	};

	const UserListHeader = {
		computed: {
			userId() {
				return this.application.common.userId;
			},
			isCurrentUserOwner() {
				if (!this.dialog) {
					return false;
				}
				return this.dialog.ownerId === this.userId;
			},
			...ui_vue_vuex.Vuex.mapState({
				user: state => state.users.collection[state.application.common.userId],
				application: state => state.application,
				conference: state => state.conference,
				dialog: state => state.dialogues.collection[state.application.dialog.dialogId]
			})
		},
		methods: {
			onCloseUsers() {
				this.getApplication().toggleUserList();
			},
			openMenu() {
				if (this.menuPopup) {
					this.closeMenu();
					return false;
				}
				this.menuPopup = main_popup.MenuManager.create({
					id: 'bx-im-component-call-user-list-header-popup',
					className: 'bx-conference-user-list-context-menu',
					background: '#00428F',
					contentBackground: '#00428F',
					darkMode: true,
					contentBorderRadius: '6px',
					borderRadius: '6px',
					bindElement: this.$refs['user-list-header-menu'],
					items: this.getMenuItems(),
					events: {
						onPopupClose: () => this.menuPopup.destroy(),
						onPopupDestroy: () => this.menuPopup = null
					}
				});
				this.menuPopup.show();
			},
			closeMenu() {
				this.menuPopup.destroy();
				this.menuPopup = null;
			},
			getMenuItems() {
				const items = [{
					text: this.$Bitrix.Loc.getMessage('BX_IM_COMPONENT_CALL_USER_LIST_HEADER_MENU_COPY_LINK'),
					onclick: () => {
						this.closeMenu();
						this.onMenuCopyLink();
					}
				}];
				if (this.isCurrentUserOwner) {
					items.push({
						text: this.$Bitrix.Loc.getMessage('BX_IM_COMPONENT_CALL_USER_LIST_HEADER_MENU_CHANGE_LINK'),
						onclick: () => {
							this.closeMenu();
							this.onMenuChangeLink();
						}
					});
				}
				return items;
			},
			onMenuCopyLink() {
				const publicLink = this.dialog.public.link;
				im_lib_clipboard.Clipboard.copy(publicLink);
				const notificationText = this.$Bitrix.Loc.getMessage('BX_IM_COMPONENT_CALL_LINK_COPIED');
				BX.UI.Notification.Center.notify({
					content: notificationText,
					autoHideDelay: 4000
				});
			},
			onMenuChangeLink() {
				const confirmMessage = this.$Bitrix.Loc.getMessage('BX_IM_COMPONENT_CALL_CHANGE_LINK_CONFIRM_TEXT');
				this.changeLinkConfirm = ui_dialogs_messagebox.MessageBox.create({
					message: confirmMessage,
					modal: true,
					buttons: ui_dialogs_messagebox.MessageBoxButtons.OK_CANCEL,
					onOk: () => {
						this.changeLink();
						this.changeLinkConfirm.getPopupWindow().destroy();
					},
					onCancel: () => {
						this.changeLinkConfirm.getPopupWindow().destroy();
					}
				});
				this.changeLinkConfirm.show();
			},
			changeLink() {
				this.getApplication().changeLink().then(() => {
					const notificationText = this.$Bitrix.Loc.getMessage('BX_IM_COMPONENT_CALL_LINK_CHANGED');
					BX.UI.Notification.Center.notify({
						content: notificationText,
						autoHideDelay: 4000
					});
				}).catch(error => {
					console.error('Conference: change link error', error);
				});
			},
			getApplication() {
				return this.$Bitrix.Application.get();
			}
		},
		template: `
		<div class="bx-im-component-call-user-list-header">
			<div class="bx-im-component-call-user-list-header-top-actions">
				<div class="bx-im-component-call-user-list-header-left">
					<div @click="onCloseUsers" class="bx-im-component-call-user-list-header-close" :title="$Bitrix.Loc.getMessage['BX_IM_COMPONENT_CALL_CHAT_CLOSE_TITLE']"></div>
				</div>
				<div class="bx-im-component-call-user-list-header-right">
					<div @click="openMenu" class="bx-im-component-call-user-list-header-more" ref="user-list-header-menu"></div>
				</div>
			</div>
			<div class="bx-im-component-call-user-list-header-users-summary">
				<div class="bx-im-component-call-user-list-header-title">{{ $Bitrix.Loc.getMessage('BX_IM_COMPONENT_CALL_USERS_LIST_TITLE') }}</div>
			</div>
		</div>
	`
	};

	/**
	 * Bitrix im
	 * Pubic conference Vue component
	 *
	 * @package bitrix
	 * @subpackage im
	 * @copyright 2001-2021 Bitrix
	 */


	//const
	const popupModes = Object.freeze({
		preparation: 'preparation'
	});
	ui_vue.BitrixVue.component('bx-im-component-conference-public', {
		components: {
			Error,
			CheckDevices,
			OrientationDisabled,
			PasswordCheck,
			LoadingStatus,
			RequestPermissions,
			MobileChatButton,
			ConferenceInfo,
			UserForm,
			ChatHeader,
			WaitingForStart,
			UserList,
			UserListHeader,
			ConferenceSmiles
		},
		props: {
			dialogId: {
				type: String,
				default: "0"
			}
		},
		data: function () {
			return {
				waitingForStart: false,
				popupMode: popupModes.preparation,
				viewPortMetaNode: null,
				chatDrag: false,
				// in %
				rightPanelSplitMode: {
					usersHeight: 50,
					chatHeight: 50,
					chatMinHeight: 30,
					chatMaxHeight: 80
				}
			};
		},
		created() {
			this.initEventHandlers();
			main_core_events.EventEmitter.subscribe(im_const.EventType.conference.waitForStart, this.onWaitForStart);
			main_core_events.EventEmitter.subscribe(im_const.EventType.conference.hideSmiles, this.onHideSmiles);
			if (this.isMobile()) {
				this.setMobileMeta();
			} else {
				document.body.classList.add('bx-im-application-call-desktop-state');
			}
			if (!this.isDesktop()) {
				window.addEventListener('beforeunload', this.onBeforeUnload.bind(this));
			}
		},
		mounted() {
			if (!this.isHttps()) {
				this.getApplication().setError(call_const.ConferenceErrorCode.unsafeConnection);
			}
			if (!this.passwordChecked) {
				main_core_events.EventEmitter.emit(im_const.EventType.conference.setPasswordFocus);
			}
		},
		beforeDestroy() {
			this.destroyHandlers();
			main_core_events.EventEmitter.unsubscribe(im_const.EventType.conference.waitForStart, this.onWaitForStart);
			main_core_events.EventEmitter.unsubscribe(im_const.EventType.conference.hideSmiles, this.onHideSmiles);
			clearInterval(this.durationInterval);
		},
		computed: {
			EventType: () => im_const.EventType,
			RightPanelMode: () => call_const.ConferenceRightPanelMode,
			userId() {
				return this.application.common.userId;
			},
			dialogInited() {
				if (this.dialog) {
					return this.dialog.init;
				}
			},
			conferenceStarted() {
				return this.conference.common.conferenceStarted;
			},
			hasErrorInCall() {
				return this.conference.common.hasErrorInCall;
			},
			userInited() {
				return this.conference.common.inited;
			},
			userHasRealName() {
				if (this.user) {
					return this.user.name !== this.localize['BX_IM_COMPONENT_CALL_DEFAULT_USER_NAME'];
				}
				return false;
			},
			rightPanelMode() {
				return this.conference.common.rightPanelMode;
			},
			userListClasses() {
				const result = [];
				if (this.rightPanelMode === 'split') {
					result.push('bx-im-component-call-right-top');
				} else if (this.rightPanelMode === 'users') {
					result.push('bx-im-component-call-right-full');
				}
				return result;
			},
			userListStyles() {
				if (this.rightPanelMode !== call_const.ConferenceRightPanelMode.split) {
					return {};
				}
				return {
					height: `${this.rightPanelSplitMode.usersHeight}%`
				};
			},
			chatClasses() {
				const result = [];
				if (this.rightPanelMode === 'split') {
					result.push('bx-im-component-call-right-bottom');
				} else if (this.rightPanelMode === 'chat') {
					result.push('bx-im-component-call-right-full');
				}
				return result;
			},
			chatStyles() {
				if (this.rightPanelMode !== call_const.ConferenceRightPanelMode.split) {
					return {};
				}
				return {
					height: `${this.rightPanelSplitMode.chatHeight}%`
				};
			},
			isChatShowed() {
				return this.conference.common.showChat;
			},
			isPreparationStep() {
				return this.conference.common.state === call_const.ConferenceStateType.preparation;
			},
			isBroadcast() {
				return this.conference.common.isBroadcast;
			},
			presentersList() {
				return this.conference.common.presenters;
			},
			isCurrentUserPresenter() {
				return this.presentersList.includes(this.userId);
			},
			errorCode() {
				return this.conference.common.error;
			},
			passwordChecked() {
				return this.conference.common.passChecked;
			},
			permissionsRequested() {
				return this.conference.common.permissionsRequested;
			},
			callContainerClasses() {
				return [this.conference.common.callEnded ? 'with-clouds' : ''];
			},
			wrapClasses() {
				const classes = ['bx-im-component-call-wrap'];
				if (this.isMobile() && this.isBroadcast && !this.isCurrentUserPresenter && this.isPreparationStep) {
					classes.push('bx-im-component-call-mobile-viewer-mode');
				}
				return classes;
			},
			callComponentClasses() {
				return ['bx-im-component-call'];
			},
			chatId() {
				if (this.application) {
					return this.application.dialog.chatId;
				}
				return 0;
			},
			localize() {
				return ui_vue.BitrixVue.getFilteredPhrases(['BX_IM_COMPONENT_CALL_', 'IM_DIALOG_CLIPBOARD_']);
			},
			...ui_vue_vuex.Vuex.mapState({
				conference: state => state.conference,
				application: state => state.application,
				user: state => state.users.collection[state.application.common.userId],
				dialog: state => state.dialogues.collection[state.application.dialog.dialogId]
			})
		},
		watch: {
			isChatShowed(newValue) {
				if (this.isMobile()) {
					return false;
				}
				if (newValue === true) {
					this.$nextTick(() => {
						main_core_events.EventEmitter.emit(im_const.EventType.dialog.scrollOnStart, {
							chatId: this.chatId
						});
						main_core_events.EventEmitter.emit(im_const.EventType.textarea.setFocus);
					});
				}
			},
			rightPanelMode(newValue) {
				if (newValue === call_const.ConferenceRightPanelMode.chat || newValue === call_const.ConferenceRightPanelMode.split) {
					this.$nextTick(() => {
						main_core_events.EventEmitter.emit(im_const.EventType.dialog.scrollOnStart, {
							chatId: this.chatId
						});
						main_core_events.EventEmitter.emit(im_const.EventType.textarea.setFocus);
					});
				}
			},
			dialogInited(newValue) {
				if (newValue === true) {
					this.getApplication().setDialogInited();
				}
			},
			//to skip request permissions step in desktop
			userInited(newValue) {
				if (newValue === true && this.isDesktop() && this.passwordChecked) {
					this.$nextTick(() => {
						main_core_events.EventEmitter.emit(im_const.EventType.conference.requestPermissions);
					});
				}
			},
			user() {
				if (this.user && this.userHasRealName) {
					this.getApplication().setUserWasRenamed();
				}
			}
		},
		methods: {
			initEventHandlers() {
				this.sendMessageHandler = new im_eventHandler.SendMessageHandler(this.$Bitrix);
				this.textareaHandler = new ConferenceTextareaHandler(this.$Bitrix);
				this.readingHandler = new im_eventHandler.ReadingHandler(this.$Bitrix);
				this.reactionHandler = new im_eventHandler.ReactionHandler(this.$Bitrix);
				this.textareaUploadHandler = new ConferenceTextareaUploadHandler(this.$Bitrix);
			},
			destroyHandlers() {
				this.sendMessageHandler.destroy();
				this.textareaHandler.destroy();
				this.readingHandler.destroy();
				this.reactionHandler.destroy();
				this.textareaUploadHandler.destroy();
			},
			onHideSmiles() {
				this.getApplication().toggleSmiles();
			},
			onBeforeUnload(event) {
				if (!this.getApplication().viewPort) {
					return;
				}
				if (!this.isPreparationStep) {
					event.preventDefault();
					event.returnValue = '';
				}
			},
			onSmilesSelectSmile(event) {
				main_core_events.EventEmitter.emit(im_const.EventType.textarea.insertText, {
					text: event.text
				});
			},
			onSmilesSelectSet() {
				main_core_events.EventEmitter.emit(im_const.EventType.textarea.setFocus);
			},
			onWaitForStart() {
				this.waitingForStart = true;
			},
			onChatStartDrag(event) {
				if (this.chatDrag) {
					return;
				}
				this.chatDrag = true;
				this.chatDragStartPoint = event.clientY;
				this.chatDragStartHeight = this.rightPanelSplitMode.chatHeight;
				this.addChatDragEvents();
			},
			onChatContinueDrag(event) {
				if (!this.chatDrag) {
					return;
				}
				this.chatDragControlPoint = event.clientY;
				const availableHeight = document.body.clientHeight;
				const maxHeightInPx = availableHeight * (this.rightPanelSplitMode.chatMaxHeight / 100);
				const minHeightInPx = availableHeight * (this.rightPanelSplitMode.chatMinHeight / 100);
				const startHeightInPx = availableHeight * (this.chatDragStartHeight / 100);
				const chatHeightInPx = Math.max(Math.min(startHeightInPx + this.chatDragStartPoint - this.chatDragControlPoint, maxHeightInPx), minHeightInPx);
				const chatHeight = chatHeightInPx / availableHeight * 100;
				if (this.rightPanelSplitMode.chatHeight !== chatHeight) {
					this.rightPanelSplitMode.chatHeight = chatHeight;
					this.rightPanelSplitMode.usersHeight = 100 - chatHeight;
				}
			},
			onChatStopDrag(event) {
				if (!this.chatDrag) {
					return;
				}
				this.chatDrag = false;
				this.removeChatDragEvents();
				main_core_events.EventEmitter.emit(im_const.EventType.dialog.scrollToBottom, {
					chatId: this.chatId,
					force: true
				});
			},
			addChatDragEvents() {
				document.addEventListener('mousemove', this.onChatContinueDrag);
				document.addEventListener('mouseup', this.onChatStopDrag);
				document.addEventListener('mouseleave', this.onChatStopDrag);
			},
			removeChatDragEvents() {
				document.removeEventListener('mousemove', this.onChatContinueDrag);
				document.removeEventListener('mouseup', this.onChatStopDrag);
				document.removeEventListener('mouseleave', this.onChatStopDrag);
			},
			isMobile() {
				return im_lib_utils.Utils.device.isMobile();
			},
			isDesktop() {
				return im_lib_utils.Utils.platform.isBitrixDesktop();
			},
			setMobileMeta() {
				if (!this.viewPortMetaNode) {
					this.viewPortMetaNode = document.createElement('meta');
					this.viewPortMetaNode.setAttribute('name', 'viewport');
					this.viewPortMetaNode.setAttribute("content", "width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0");
					document.head.appendChild(this.viewPortMetaNode);
				}
				document.body.classList.add('bx-im-application-call-mobile-state');
				if (im_lib_utils.Utils.browser.isSafariBased()) {
					document.body.classList.add('bx-im-application-call-mobile-safari-based');
				}
			},
			isHttps() {
				return location.protocol === 'https:';
			},
			getUserHash() {
				return this.conference.user.hash;
			},
			getApplication() {
				return this.$Bitrix.Application.get();
			},
			openChat() {
				this.getApplication().toggleChat();
			}
			/* endregion 03. Helpers */
		},
		template: `
	<div :class="wrapClasses">
		<div :class="callComponentClasses">
			<div class="bx-im-component-call-left">
				<div id="bx-im-component-call-container" :class="callContainerClasses"></div>
				<div v-if="isPreparationStep" class="bx-im-component-call-left-preparation" v-show="!hasErrorInCall">
					<!-- Step 1: Errors page -->
					<Error v-if="errorCode"/>
					<!-- Step 2: Password page -->
					<PasswordCheck v-else-if="!passwordChecked"/>
					<template v-else-if="!errorCode && passwordChecked">
						<!-- Step 3: Loading page -->
						<LoadingStatus v-if="!userInited"/>
						<template v-else-if="userInited">
							<!-- BROADCAST MODE -->
								<template v-if="isBroadcast">
									<template v-if="!isDesktop() && !permissionsRequested && isCurrentUserPresenter">
									<ConferenceInfo/>
									<RequestPermissions>
										<template v-if="isMobile()">
											<MobileChatButton/>
										</template>
									</RequestPermissions>
								</template>
								<!-- Skip permissions request for desktop and show button with loader  -->
								<template v-if="isDesktop() && (!permissionsRequested || !user) && isCurrentUserPresenter">
									<ConferenceInfo/>
									<div class="bx-im-component-call-info-separator"></div>
									<RequestPermissions :skipRequest="true"/>
								</template>
								<!-- Step 5: Page with video and mic check -->
								<div v-if="permissionsRequested || !isCurrentUserPresenter" class="bx-im-component-call-video-step-container">
									<!-- Compact conference info -->
									<ConferenceInfo :compactMode="true"/>
									<CheckDevices v-if="isCurrentUserPresenter" />
									<!-- Bottom part of interface -->
									<div class="bx-im-component-call-bottom-container">
										<UserForm v-if="!waitingForStart"/>
										<WaitingForStart v-else>
											<template v-if="isMobile()">
												<MobileChatButton/>
											</template>
										</WaitingForStart>
									</div>
								</div>
								<button v-if="!isMobile()" class="bx-im-component-call-open-chat-button bx-im-component-call-open-preview-chat-button" @click="openChat">
									{{ localize['BX_IM_COMPONENT_CALL_OPEN_CHAT'] }}
								</button>
							</template>
							<!-- END BROADCAST MODE -->
							<!-- NORMAL MODE (NOT BROADCAST) -->
								<template v-else-if="!isBroadcast">
								<!-- Step 4: Permissions page -->
								<template v-if="!isDesktop() && !permissionsRequested">
									<ConferenceInfo/>
									<div class="bx-im-component-call-info-separator"></div>
									<RequestPermissions>
										<template v-if="isMobile()">
											<MobileChatButton/>
										</template>
									</RequestPermissions>
								</template>
								<!-- Skip permissions request for desktop and show button with loader  -->
								<template v-if="isDesktop() && (!permissionsRequested || !user)">
									<ConferenceInfo/>
									<div class="bx-im-component-call-info-separator"></div>
									<RequestPermissions :skipRequest="true"/>
								</template>
								<!-- Step 5: Page with video and mic check -->
								<div v-else-if="permissionsRequested" class="bx-im-component-call-video-step-container">
									<!-- Compact conference info -->
									<ConferenceInfo :compactMode="true"/>
									<CheckDevices/>
									<!-- Bottom part of interface -->
									<div class="bx-im-component-call-bottom-container">
										<UserForm v-if="!waitingForStart"/>
										<WaitingForStart v-else>
											<template v-if="isMobile()">
												<MobileChatButton/>
											</template>
										</WaitingForStart>
									</div>
								</div>
								<button v-if="!isMobile()" class="bx-im-component-call-open-chat-button bx-im-component-call-open-preview-chat-button" @click="openChat">
									{{ localize['BX_IM_COMPONENT_CALL_OPEN_CHAT'] }}
								</button>
							</template>
							<!-- END NORMAL MODE (NOT BROADCAST) -->
						</template>
					</template>
				</div>
			</div>
			<template v-if="userInited && !errorCode">
				<transition :name="!isMobile()? 'videoconf-chat-slide': ''">
					<div v-show="rightPanelMode !== RightPanelMode.hidden" class="bx-im-component-call-right">
						<!-- Start users list -->
						<div v-show="rightPanelMode === RightPanelMode.split || rightPanelMode === RightPanelMode.users" :class="userListClasses" :style="userListStyles">
							<UserListHeader />
							<div class="bx-im-component-call-right-users">
								<UserList />
							</div>
						</div>
						<!-- End users list -->
						<!-- Start chat -->
						<div v-show="rightPanelMode === RightPanelMode.split || rightPanelMode === RightPanelMode.chat" :class="chatClasses" :style="chatStyles">
							<!-- Resize handler -->
							<div
								v-if="rightPanelMode === RightPanelMode.split"
								@mousedown="onChatStartDrag"
								class="bx-im-component-call-right-bottom-resize-handle"
							></div>
							<ChatHeader />
							<div class="bx-im-component-call-right-chat">
								<bx-im-component-dialog
									:userId="userId"
									:dialogId="dialogId"
								/>
								<keep-alive include="bx-im-component-call-smiles">
									<ConferenceSmiles
										v-if="conference.common.showSmiles"
										@selectSmile="onSmilesSelectSmile"
										@selectSet="onSmilesSelectSet"
									/>
								</keep-alive>
								<div v-if="user" class="bx-im-component-call-textarea">
									<bx-im-component-textarea
										:userId="userId"
										:dialogId="dialogId"
										:writesEventLetter="3"
										:enableFile="true"
										:enableEdit="true"
										:enableCommand="false"
										:enableMention="false"
										:autoFocus="true"
									/>
								</div>
							</div>
						<!-- End chat -->
						</div>
					</div>
				</transition>
			</template>
		</div>
	</div>
	`
	});

})(window, BX, BX, BX, BX.Messenger.Lib, BX.Messenger.Const, BX.Call.Const, BX.Messenger.EventHandler, BX.Messenger.Lib, BX.Event, BX.Messenger, window, BX.UI, window, BX, BX.UI.Dialogs, BX, BX.Messenger.Lib, BX.Call, BX.Call.Component, BX.Messenger.Lib, BX.Messenger.v2.Lib, BX.Main, BX.Messenger.Lib);
//# sourceMappingURL=conference-public.bundle.js.map
