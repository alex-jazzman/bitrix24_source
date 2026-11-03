/* eslint-disable */
this.BX = this.BX || {};
this.BX.Call = this.BX.Call || {};
(function (exports, main_core, call_lib_mediaRegistry, call_store, call_mapping, ui_vue3, call_component_view_call, call_plugin_loc) {
	'use strict';

	class CallVueApplication {
		#pinia;
		#providers = {};
		#application = null;
		constructor({
			pinia
		}) {
			this.#pinia = pinia;
		}
		provide(key, value) {
			this.#providers[key] = value;
		}
		mount(container) {
			this.unmount();
			const app = ui_vue3.BitrixVue.createApp({
				name: 'CallApplication',
				components: {
					CallLayout: call_component_view_call.CallLayout
				},
				template: ` <CallLayout /> `
			});
			app.use(call_plugin_loc.LocPlugin, {
				getMessage: (id, replacements) => main_core.Loc.getMessage(id, replacements) ?? id,
				languageId: main_core.Loc.getMessage('LANGUAGE_ID') ?? 'en'
			});
			app.use(this.#pinia);
			Object.entries(this.#providers).forEach(([key, value]) => {
				app.provide(key, value);
			});
			app.mount(container);
			this.#application = app;
		}
		unmount() {
			if (this.#application === null) {
				return;
			}
			this.#application.unmount();
			this.#application = null;
		}
		destroy() {
			this.unmount();
			this.#pinia = null;
			this.#providers = {};
		}
	}

	class VueCallViewAdapter {
		#container;
		#app = null;
		#isMounted = false;
		#isDestroyed = false;
		#isVisible = false;
		#isActivePiP = false;
		#eventEmitter = new main_core.Event.EventEmitter();
		#deprecationWarned = new Set();
		#callbackWrappers = new Map();
		#getUsersStore() {
			return call_store.useUsersStore();
		}
		#getMediaStore() {
			return call_store.useMediaStore();
		}
		#getUiStore() {
			return call_store.useUiStore();
		}
		#getRecordingStore() {
			return call_store.useRecordingStore();
		}
		#translateEventData(eventName, data) {
			if (eventName === 'onButtonClick' && data?.buttonName) {
				const translated = {
					...data,
					buttonName: call_mapping.toControllerAction(data.buttonName)
				};
				if (data.buttonName === 'microphone') {
					translated.muted = !this.#getMediaStore().isMicrophoneMuted;
				} else if (data.buttonName === 'camera') {
					translated.video = !this.#getMediaStore().isCameraOn;
				}
				return translated;
			}
			return data;
		}
		constructor({
			container,
			pinia,
			hiddenButtons,
			...extraOptions
		}) {
			this.#container = container;
			this.#isMounted = false;
			this.#isDestroyed = false;
			this.#eventEmitter.setEventNamespace('BX.Call.VueCallViewAdapter');
			this.#app = new CallVueApplication({
				pinia
			});
			const bridge = {
				emit: (eventName, data) => {
					this.#eventEmitter.emit(eventName, this.#translateEventData(eventName, data));
				}
			};
			this.#getMediaStore().attachBridge(bridge);
			this.#getUiStore().attachBridge(bridge);
			this.#getRecordingStore().attachBridge(bridge);
			if (Array.isArray(hiddenButtons) && hiddenButtons.length > 0) {
				this.#getUiStore().hideButtons(hiddenButtons);
			}
		}
		get speakerId() {
			return this.#getMediaStore().speakerDeviceId ?? '';
		}
		set speakerId(id) {
			this.#getMediaStore().setDeviceIds({
				speakerId: id
			});
		}
		get speakerMuted() {
			return this.#getMediaStore().isSpeakerMuted;
		}
		get visible() {
			return this.#isVisible;
		}
		get size() {
			return this.#getUiStore().size ?? 'full';
		}
		get isFullScreen() {
			return this.#getUiStore().isFullScreen;
		}
		get isPreparing() {
			return this.#getUiStore().uiState === 'Preparing';
		}
		set isPreparing(value) {
			this.#getUiStore().setUiState(value ? 'Preparing' : 'Connected');
		}
		get isActivePiPFromController() {
			return this.#isActivePiP;
		}
		set isActivePiPFromController(value) {
			this.#isActivePiP = value;
		}
		get microphoneId() {
			return this.#getMediaStore().microphoneDeviceId ?? '';
		}
		set microphoneId(id) {
			this.#getMediaStore().setDeviceIds({
				microphoneId: id
			});
		}
		get container() {
			return this.#container;
		}
		get enableAutoPip() {
			return false;
		}
		get buttons() {
			return null;
		}
		get elements() {
			return {
				root: this.#container
			};
		}
		get localUser() {
			return null;
		}
		get userRegistry() {
			if (!this.#deprecationWarned.has('userRegistry')) {
				console.warn('[VueCallViewAdapter] userRegistry is deprecated. Use usersStore.users instead.');
				this.#deprecationWarned.add('userRegistry');
			}
			return null;
		}
		get talkingService() {
			if (!this.#deprecationWarned.has('talkingService')) {
				console.warn('[VueCallViewAdapter] talkingService is deprecated. Use usersStore.talkingQueue instead.');
				this.#deprecationWarned.add('talkingService');
			}
			return null;
		}
		get viewVisibility() {
			return {
				getCurrentVisibility: () => this.#isVisible ? 'visible' : 'hidden'
			};
		}
		get renameSlider() {
			return {
				close: () => {
					this.#getUiStore().closeRenameSlider();
				}
			};
		}
		show() {
			if (this.#isDestroyed) {
				return;
			}
			this.#isVisible = true;
			if (this.#isMounted) {
				main_core.Dom.style(this.#container, 'display', '');
				return;
			}
			this.#app.mount(this.#container);
			this.#isMounted = true;
			main_core.Dom.style(this.#container, 'display', '');
			this.#eventEmitter.emit('onShow', {});
		}
		hide() {
			if (this.#isDestroyed || !this.#isMounted) {
				return;
			}
			this.#isVisible = false;
			main_core.Dom.style(this.#container, 'display', 'none');
		}
		close() {
			if (this.#isDestroyed) {
				return;
			}
			this.#isVisible = false;
			main_core.Dom.style(this.#container, 'display', 'none');
			this.#eventEmitter.emit('onClose', {});
		}
		destroy() {
			if (this.#isDestroyed) {
				return;
			}
			this.#isVisible = false;
			this.#eventEmitter.emit('onDestroy', {});
			this.#app?.destroy();
			this.#app = null;
			this.#isMounted = false;
			this.#isDestroyed = true;
			call_lib_mediaRegistry.MediaStreamRegistry.clear();
			this.#eventEmitter.unsubscribeAll();
			this.#callbackWrappers.clear();
		}
		getButtonElement(buttonId, elementType = 'root') {
			if (!this.#container) {
				return null;
			}
			const escapedId = CSS.escape(buttonId);
			const escapedType = CSS.escape(elementType);
			return this.#container.querySelector(`[data-button-id="${escapedId}"][data-element-type="${escapedType}"]`) ?? null;
		}
		addUser(userId, state, direction) {
			this.#getUsersStore().upsertUser(userId, {
				state: state ?? 'Idle'
			});
		}
		appendUsers(userStates) {
			const usersStore = this.#getUsersStore();
			Object.entries(userStates).forEach(([id, state]) => {
				usersStore.upsertUser(parseInt(id, 10), {
					state
				});
			});
		}
		updateUserData(userData) {
			const usersStore = this.#getUsersStore();
			Object.entries(userData).forEach(([userId, data]) => {
				const fields = {};
				if (data.name !== undefined) {
					fields.name = data.name;
				}
				if (data.avatar_hr !== undefined) {
					fields.avatar = data.avatar_hr;
				} else if (data.avatar !== undefined) {
					fields.avatar = data.avatar;
				}
				usersStore.updateUser(parseInt(userId, 10), fields);
			});
		}
		setLocalUserId(userId) {
			this.#getUsersStore().setCurrentUser(userId);
		}
		setLocalUserDirection(direction) {
		}
		setUserState(userId, newState) {
			this.#getUsersStore().updateUser(userId, {
				state: newState
			});
		}
		setUserMicrophoneState(userId, isMicrophoneOn) {
			this.#getUsersStore().updateUser(userId, {
				microphoneState: isMicrophoneOn
			});
		}
		setUserCameraState(userId, cameraState) {
			this.#getUsersStore().updateUser(userId, {
				cameraState
			});
		}
		setUserVideoPaused(userId, videoPaused) {
			this.#getUsersStore().updateUser(userId, {
				videoPaused
			});
		}
		setUserMedia(userId, kind, track) {
			if (kind === 'audio' || kind === 'sharingAudio') {
				call_lib_mediaRegistry.MediaStreamRegistry.setAudioTrack(userId, track ?? null);
				return;
			}
			if (kind === 'video') {
				if (track) {
					const stream = new MediaStream([track]);
					call_lib_mediaRegistry.MediaStreamRegistry.setRenderer(userId, stream);
				} else {
					call_lib_mediaRegistry.MediaStreamRegistry.removeRenderer(userId);
				}
				this.#getUsersStore().incrementStreamVersion(userId);
			}
		}
		setUserConnectionQuality(userId, connectionQuality) {
			this.#getUsersStore().updateUser(userId, {
				connectionQuality
			});
		}
		setUserFloorRequestState(userId, userFloorRequestState) {
			this.#getUsersStore().setFloorRequest(userId, userFloorRequestState);
		}
		setUserTalking(userId, talking) {
			this.#getUsersStore().updateUser(userId, {
				talking
			});
		}
		setUserPermissionToSpeakState(userId, permissionToSpeakState) {
		}
		setAllUserPermissionToSpeakState(permissionToSpeakState) {
		}
		setUserScreenState(userId, screenState) {
			this.#getUsersStore().updateUser(userId, {
				screenSharingState: screenState
			});
		}
		setUserStats(userId, stats) {
		}
		setUserDirection(userId, direction) {
		}
		removeScreenUsers() {
		}
		getUserFloorRequestState(userId) {
			return this.#getUsersStore().userById(userId)?.floorRequestState ?? false;
		}
		getUserTalking(userId) {
			return this.#getUsersStore().userById(userId)?.talking ?? false;
		}
		getConnectedUserCount(withYou = false) {
			const count = this.#getUsersStore().connectedUsers.length;
			return withYou ? count + 1 : count;
		}
		pinUser(userId) {
			this.#getUiStore().setPinnedUser(userId);
		}
		unpinUser() {
			this.#getUiStore().setPinnedUser(null);
		}
		resetTalkingUsers() {
			const usersStore = this.#getUsersStore();
			Object.keys(usersStore.users).forEach(userId => {
				usersStore.updateUser(parseInt(userId, 10), {
					talking: false
				});
			});
		}
		notifyUserJoined(userId) {
		}
		notifyUserLeft(userId) {
		}
		setButtonActive(buttonName, isActive) {
			this.#getUiStore().setButtonState(buttonName, {
				active: isActive
			});
		}
		setButtonPopupKind(buttonName, kind) {
		}
		setButtonCounter(buttonName, counter) {
			this.#getUiStore().setButtonState(buttonName, {
				counter
			});
		}
		blockButtons(buttons, options) {
			this.#getUiStore().blockButtons(buttons);
		}
		unblockButtons(buttons, options) {
			this.#getUiStore().unblockButtons(buttons);
		}
		blockAddUser() {
			this.#getUiStore().blockButtons(['addUser']);
		}
		unblockAddUser() {
			this.#getUiStore().unblockButtons(['addUser']);
		}
		blockSwitchCamera(options) {
			this.#getUiStore().blockButtons(['camera']);
		}
		unblockSwitchCamera(options) {
			this.#getUiStore().unblockButtons(['camera']);
		}
		blockSwitchMicrophone(options) {
			this.#getUiStore().blockButtons(['microphone']);
		}
		unblockSwitchMicrophone(options) {
			this.#getUiStore().unblockButtons(['microphone']);
		}
		blockScreenSharing() {
			this.#getUiStore().blockButtons(['screen']);
		}
		blockHistoryButton() {
			this.#getUiStore().blockButtons(['history']);
		}
		disableMediaSelection() {
			this.#getUiStore().blockButtons(['microphone', 'camera', 'speaker']);
		}
		enableMediaSelection() {
			this.#getUiStore().unblockButtons(['microphone', 'camera', 'speaker']);
		}
		showButtons(buttons) {
			this.#getUiStore().showButtons(buttons);
		}
		hideButtons(buttons) {
			this.#getUiStore().hideButtons(buttons);
		}
		updateButtons(skippedElementsList) {
		}
		isButtonBlocked(buttonName) {
			return this.#getUiStore().isButtonBlocked(buttonName);
		}
		setUiState(uiState) {
			this.#getUiStore().setUiState(uiState);
		}
		setLayout(newLayout) {
			this.#getUiStore().setLayout(newLayout);
		}
		setSize(size) {
			this.#getUiStore().setSize(size);
		}
		setTitle(title) {
			this.#getUiStore().setCallTitle(title);
		}
		setAccessibleName() {
		}
		focusWindow(options) {
		}
		releaseFocusBeforeHide() {
			return false;
		}
		restoreFocusAfterHide() {
		}
		setMaxWidth(maxWidth) {
			this.#getUiStore().setMaxWidth(maxWidth);
		}
		removeMaxWidth() {
			this.#getUiStore().setMaxWidth(null);
		}
		setWindowFocusState(isActive) {
			this.#getUiStore().setWindowFocus(isActive);
		}
		setRoomState(roomState) {
			this.#getUiStore().setRoomState(roomState);
		}
		setHotKeyTemporaryBlock(isActive, force) {
		}
		toggleStatePictureInPictureCallWindow(isActive) {
		}
		notifyConnectionLost() {}
		notifyBroadcastRightLost() {}
		notifySpeechSignal(_signal, _speaking) {}
		setLocalStream(streamData) {
			const {
				stream = null,
				flipVideo = false
			} = streamData;
			const mediaStore = this.#getMediaStore();
			if (!stream) {
				call_lib_mediaRegistry.MediaStreamRegistry.removeLocalStream();
				mediaStore.setLocalMediaMetadata({
					hasLocalVideo: false,
					hasLocalAudio: false
				});
				mediaStore.incrementLocalStreamVersion();
				return;
			}
			call_lib_mediaRegistry.MediaStreamRegistry.setLocalStream(stream);
			mediaStore.setLocalMediaMetadata({
				hasLocalVideo: stream.getVideoTracks().length > 0,
				hasLocalAudio: stream.getAudioTracks().length > 0
			});
			mediaStore.setFlipLocalVideo(Boolean(flipVideo));
			mediaStore.incrementLocalStreamVersion();
		}
		setLocalStreamVideoTrack(videoTrack) {
			const stream = call_lib_mediaRegistry.MediaStreamRegistry.getLocalStream();
			if (!stream) {
				return;
			}
			stream.getVideoTracks().forEach(track => {
				stream.removeTrack(track);
			});
			if (videoTrack) {
				stream.addTrack(videoTrack);
			}
			const mediaStore = this.#getMediaStore();
			call_lib_mediaRegistry.MediaStreamRegistry.setLocalStream(stream);
			mediaStore.setLocalMediaMetadata({
				hasLocalVideo: Boolean(videoTrack)
			});
			mediaStore.incrementLocalStreamVersion();
		}
		flipLocalVideo(flipVideo) {
			this.#getMediaStore().setFlipLocalVideo(flipVideo);
		}
		setMicrophoneId(microphoneId) {
			this.#getMediaStore().setDeviceIds({
				microphoneId
			});
		}
		setSpeakerId(speakerId) {
			this.#getMediaStore().setDeviceIds({
				speakerId
			});
		}
		setCameraId(cameraId) {
			this.#getMediaStore().setDeviceIds({
				cameraId
			});
		}
		muteSpeaker(mute) {
			this.#getMediaStore().setSpeakerMuted(mute);
		}
		releaseLocalMedia() {
			const mediaStore = this.#getMediaStore();
			call_lib_mediaRegistry.MediaStreamRegistry.removeLocalStream();
			mediaStore.setLocalMediaMetadata({
				hasLocalVideo: false,
				hasLocalAudio: false
			});
			mediaStore.incrementLocalStreamVersion();
		}
		setVideoRenderer(userId, mediaRenderer) {
			if (!mediaRenderer) {
				call_lib_mediaRegistry.MediaStreamRegistry.removeRenderer(userId);
				this.#getUsersStore().incrementStreamVersion(userId);
				return;
			}
			call_lib_mediaRegistry.MediaStreamRegistry.setRenderer(userId, mediaRenderer);
			this.#getUsersStore().incrementStreamVersion(userId);
		}
		releaseVideoRenderer(userId) {
			call_lib_mediaRegistry.MediaStreamRegistry.removeRenderer(userId);
			this.#getUsersStore().incrementStreamVersion(userId);
		}
		setBadNetworkIndicator(userId, badNetworkIndicator) {
		}
		setTrackSubscriptionFailed(data) {
		}
		setMicrophoneLevel(level) {
		}
		setCommonRecordState(commonRecordState) {
			this.#getRecordingStore().setState({
				state: commonRecordState.state,
				type: commonRecordState.type,
				initiatorId: commonRecordState.initiatorId
			});
		}
		getDefaultCommonRecordState() {
			return {
				state: 'Inactive',
				type: null,
				initiatorId: null
			};
		}
		showSelfTest() {}
		showSecurityKeyError() {}
		showFatalError(params) {}
		showCloudRecordPromo(isCloudRecordFeaturesEnabled, callId) {}
		showCloudRecordInfoPopup(isCloudRecordFeaturesEnabled, callId, options) {}
		showCommonRecordMenuPopup(isDesktopRecord) {}
		showCommonRecordStartModal() {}
		showCommonRecordStartNotify(userId, state) {}
		showCopilotErrorNotify(errorType) {}
		showCopilotNotify(callId, errorCode) {}
		showCopilotResultNotify() {}
		closeCopilotNotify() {}
		updateCopilotState(isActive) {
			this.#getUiStore().setCopilotActive(isActive);
		}
		updateCopilotFeatureState(isEnabled) {
			this.#getUiStore().setCopilotFeaturesEnabled(isEnabled);
		}
		updateFloorRequestNotification() {}
		showConfirmModal(params) {
			return Promise.resolve('cancel');
		}
		trackAvailabilityChanged() {}
		confirmSpeakerSelection() {}
		subscribe(eventName, listener) {
			this.#eventEmitter.subscribe(eventName, listener);
		}
		unsubscribe(eventName, listener) {
			this.#eventEmitter.unsubscribe(eventName, listener);
		}
		setCallback(name, cb) {
			const wrapper = event => cb(event.data);
			if (!this.#callbackWrappers.has(name)) {
				this.#callbackWrappers.set(name, new Map());
			}
			this.#callbackWrappers.get(name).set(cb, wrapper);
			this.#eventEmitter.subscribe(name, wrapper);
		}
		removeCallback(name, cb) {
			const nameMap = this.#callbackWrappers.get(name);
			if (!nameMap) {
				return;
			}
			const wrapper = nameMap.get(cb);
			if (wrapper) {
				this.#eventEmitter.unsubscribe(name, wrapper);
				nameMap.delete(cb);
			}
		}
		isHidden() {
			return false;
		}
		setGuestLink(link) {
		}
	}

	exports.CallVueApplication = CallVueApplication;
	exports.VueCallViewAdapter = VueCallViewAdapter;

})(this.BX.Call.Application = this.BX.Call.Application || {}, BX, BX.Call.Lib.MediaRegistry, BX.Call.Store, BX.Call.Mapping, BX.Vue3, BX.Call.Component.View, BX.Call.Plugin);
//# sourceMappingURL=call.bundle.js.map
