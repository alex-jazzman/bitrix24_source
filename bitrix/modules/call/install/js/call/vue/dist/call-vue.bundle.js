/* eslint-disable */
this.BX = this.BX || {};
this.BX.Call = this.BX.Call || {};
(function (exports, main_core, call_lib_mediaRegistry, call_store, call_mapping, ui_vue3) {
	'use strict';

	// @vue/component
	const UserTile = {
		name: 'call-user-tile',
		props: {
			userId: {
				type: Number,
				required: true
			},
			isLocal: {
				type: Boolean,
				default: false
			},
			localStreamVersion: {
				type: Number,
				default: 0
			}
		},
		setup() {
			const callStore = call_store.useCallStore();
			return {
				callStore
			};
		},
		computed: {
			user() {
				return this.callStore.users[this.userId] || null;
			},
			userName() {
				return this.user?.name || '';
			},
			userAvatar() {
				return this.user?.avatar || '';
			},
			isTalking() {
				return this.user?.talking || false;
			},
			isMuted() {
				if (this.isLocal) {
					return this.callStore.isMicrophoneMuted;
				}
				return !(this.user?.microphoneState ?? true);
			},
			isCameraOn() {
				if (this.isLocal) {
					return this.callStore.hasLocalVideo;
				}
				return this.user?.cameraState || false;
			},
			isScreenSharing() {
				return this.user?.screenState || false;
			},
			hasFloorRequest() {
				return this.user?.floorRequestState || false;
			},
			streamVersion() {
				return this.user?.streamVersion || 0;
			},
			isPinned() {
				return this.callStore.pinnedUserId === this.userId;
			},
			shouldFlipVideo() {
				return this.isLocal && this.callStore.flipLocalVideo;
			},
			mutedText() {
				return main_core.Loc.getMessage('CALL_VUE_USER_MUTED');
			},
			screenShareText() {
				return main_core.Loc.getMessage('CALL_VUE_USER_SHARING_SCREEN');
			},
			floorRequestText() {
				return main_core.Loc.getMessage('CALL_VUE_USER_RAISED_HAND');
			}
		},
		watch: {
			streamVersion() {
				this.$nextTick(() => this.attachStream());
			},
			localStreamVersion() {
				if (this.isLocal) {
					this.$nextTick(() => this.attachStream());
				}
			},
			isCameraOn(newVal) {
				if (newVal) {
					this.$nextTick(() => this.attachStream());
				}
			}
		},
		mounted() {
			this.$nextTick(() => this.attachStream());
		},
		beforeUnmount() {
			if (this.$refs.video) {
				this.$refs.video.srcObject = null;
			}
		},
		methods: {
			attachStream() {
				if (!this.$refs.video) {
					return;
				}
				const renderer = this.isLocal ? call_lib_mediaRegistry.MediaStreamRegistry.getLocalStream() : call_lib_mediaRegistry.MediaStreamRegistry.getRenderer(this.userId);
				if (renderer === null || renderer === undefined) {
					this.$refs.video.srcObject = null;
					return;
				}

				// MediaStream has getTracks — use it as duck-type check
				if (main_core.Type.isFunction(renderer.getTracks)) {
					this.$refs.video.srcObject = renderer;
					return;
				}
				if (main_core.Type.isFunction(renderer.attach)) {
					renderer.attach(this.$refs.video);
					return;
				}

				// MediaRenderer wrapping a stream object
				if (renderer.stream && main_core.Type.isFunction(renderer.stream.getTracks)) {
					this.$refs.video.srcObject = renderer.stream;
				}
			}
		},
		template: /* HTML */`
		<div class="call-user-tile" :class="{ '--talking': isTalking, '--pinned': isPinned }">
			<video
				ref="video"
				class="call-user-tile__video"
				autoplay
				playsinline
				muted
				:class="{ '--hidden': !isCameraOn, '--mirror': shouldFlipVideo }"
			></video>
			<div class="call-user-tile__avatar" :class="{ '--hidden': isCameraOn }">
				<img
					v-if="userAvatar"
					:src="userAvatar"
					:alt="userName"
					:title="userName"
					class="call-user-tile__avatar_image"
				/>
				<span v-else class="call-user-tile__avatar_initials">{{ userName[0] || '?' }}</span>
			</div>
			<div class="call-user-tile__info">
				<span class="call-user-tile__name">{{ userName }}</span>
				<span v-if="isMuted" class="call-user-tile__mute-icon">{{ mutedText }}</span>
			</div>
			<div v-if="isScreenSharing" class="call-user-tile__screen-share-badge">{{ screenShareText }}</div>
			<div v-if="hasFloorRequest" class="call-user-tile__floor-request">{{ floorRequestText }}</div>
		</div>
	`
	};

	// @vue/component
	const VideoGrid = {
		name: 'call-video-grid',
		components: {
			UserTile
		},
		inject: {
			callActionBridge: {
				default: () => ({
					emit: () => {}
				})
			}
		},
		setup() {
			const callStore = call_store.useCallStore();
			return {
				callStore
			};
		},
		computed: {
			users() {
				return this.callStore.users;
			},
			pinnedUserId() {
				return this.callStore.pinnedUserId;
			},
			layout() {
				return this.callStore.layout;
			},
			localUserId() {
				return this.callStore.localUserId;
			},
			localStreamVersion() {
				return this.callStore.localStreamVersion;
			},
			layoutModifier() {
				return '--layout-' + String(this.layout).toLowerCase();
			},
			sortedUserIds() {
				const ids = Object.keys(this.users).map(Number).filter(id => id !== this.localUserId);
				return ids.sort((a, b) => {
					if (a === this.pinnedUserId) {
						return -1;
					}
					if (b === this.pinnedUserId) {
						return 1;
					}
					return a - b;
				});
			}
		},
		methods: {
			onUserClick(userId) {
				this.callActionBridge.emit('onSetCentralUser', {
					userId
				});
			}
		},
		template: /* HTML */`
		<div class="call-video-grid" :class="layoutModifier">
			<UserTile
				v-if="localUserId"
				:userId="localUserId"
				:isLocal="true"
				:localStreamVersion="localStreamVersion"
				key="local"
			/>
			<UserTile
				v-for="userId in sortedUserIds"
				:key="userId"
				:userId="userId"
				@click="onUserClick(userId)"
			/>
		</div>
	`
	};

	const BUTTON_ORDER = ['microphone', 'camera'];

	// @vue/component
	const Toolbar = {
		name: 'call-toolbar',
		inject: {
			callActionBridge: {
				default: () => ({
					emit: () => {}
				})
			}
		},
		setup() {
			const callStore = call_store.useCallStore();
			return {
				callStore
			};
		},
		computed: {
			visibleButtons() {
				return BUTTON_ORDER.filter(name => {
					const btn = this.callStore.buttons[name];
					return btn && btn.visible !== false;
				}).map(name => ({
					name,
					...this.callStore.buttons[name]
				}));
			},
			hangupButton() {
				return this.callStore.buttons?.hangup ?? null;
			},
			hangupText() {
				return 'hangup';
			}
		},
		methods: {
			onButtonClick(buttonName) {
				this.callActionBridge.emit('onButtonClick', {
					buttonName
				});
			}
		},
		template: /* HTML */`
		<div class="call-toolbar">
			<button
				v-for="btn in visibleButtons"
				:key="btn.name"
				class="call-toolbar_button"
				:class="{ '--active': btn.active, '--blocked': btn.blocked }"
				:data-button-id="btn.name"
				data-element-type="root"
				:disabled="btn.blocked"
				@click="onButtonClick(btn.name)"
			>
				<span :data-button-id="btn.name" data-element-type="icon">{{ btn.name }}</span>
			</button>
			<button
				class="call-toolbar_button --danger"
				:class="{ '--blocked': hangupButton?.blocked }"
				data-button-id="hangup"
				data-element-type="root"
				:disabled="hangupButton?.blocked"
				@click="onButtonClick('hangup')"
			>{{ hangupText }}</button>
		</div>
	`
	};

	// @vue/component
	const Screen = {
		name: 'call-screen',
		components: {
			VideoGrid,
			Toolbar
		},
		inject: {
			callActionBridge: {
				default: () => ({
					emit: () => {}
				})
			}
		},
		setup() {
			const callStore = call_store.useCallStore();
			return {
				callStore
			};
		},
		computed: {
			uiState() {
				return this.callStore.uiState;
			},
			isIncoming() {
				return this.callStore.isIncoming;
			},
			viewState() {
				return this.callStore.viewState;
			},
			isProceedingOutgoing() {
				return this.uiState === 'Preparing' && !this.callStore.isIncoming;
			},
			isProceedingIncoming() {
				return this.uiState === 'Preparing' && this.callStore.isIncoming;
			},
			isConnected() {
				return this.uiState === 'Connected';
			},
			isFolded() {
				return this.callStore.viewState === 'Folded';
			},
			callTitle() {
				return this.callStore.callTitle;
			},
			answerText() {
				return main_core.Loc.getMessage('CALL_VUE_BUTTON_ANSWER');
			},
			declineText() {
				return main_core.Loc.getMessage('CALL_VUE_BUTTON_DECLINE');
			},
			callingText() {
				return main_core.Loc.getMessage('CALL_VUE_STATUS_CALLING');
			},
			hangupText() {
				return main_core.Loc.getMessage('CALL_VUE_BUTTON_HANGUP');
			}
		},
		methods: {
			onButtonClick(buttonName) {
				this.callActionBridge.emit('onButtonClick', {
					buttonName
				});
			}
		},
		template: /* HTML */`
		<div class="call-screen" :class="{ '--folded': isFolded }">
			<template v-if="isFolded">
				<div class="call-screen_folded">
					<span class="call-screen_folded-title">{{ callTitle }}</span>
				</div>
			</template>
			<template v-else-if="isProceedingIncoming">
				<div class="call-screen_incoming">
					<span class="call-screen_incoming-title">{{ callTitle }}</span>
					<div class="call-screen_incoming-actions">
						<button
							class="call-screen_button --answer"
							@click="onButtonClick('answer')"
						>{{ answerText }}</button>
						<button
							class="call-screen_button --decline"
							@click="onButtonClick('hangup')"
						>{{ declineText }}</button>
					</div>
				</div>
			</template>
			<template v-else-if="isProceedingOutgoing">
				<div class="call-screen_outgoing">
					<span class="call-screen_outgoing-title">{{ callTitle }}</span>
					<span class="call-screen_outgoing-status">{{ callingText }}</span>
					<div class="call-screen_outgoing-actions">
						<button
							class="call-screen_button --danger"
							@click="onButtonClick('hangup')"
						>{{ hangupText }}</button>
					</div>
				</div>
			</template>
		<template v-else-if="isConnected">
			<VideoGrid />
			<Toolbar />
		</template>
		</div>
	`
	};

	/**
	 * Manages the Vue application lifecycle for the call view.
	 * Responsible exclusively for mount/unmount — does NOT implement CallView.
	 */
	class CallVueApplication {
		#pinia = null;
		#providers = {};
		#bitrixVue = null;
		constructor({
			pinia
		}) {
			this.#pinia = pinia;
		}

		/**
		 * Registers a value to be provided to the Vue component tree via inject.
		 *
		 * @param {string} key
		 * @param {any} value
		 */
		provide(key, value) {
			this.#providers[key] = value;
		}

		/**
		 * Mounts the Vue application into the given container.
		 *
		 * @param {HTMLElement} container
		 */
		mount(container) {
			this.unmount();
			this.#bitrixVue = ui_vue3.BitrixVue.createApp({
				name: 'CallApplication',
				components: {
					CallScreen: Screen
				},
				template: /* HTML */`
				<CallScreen />
			`
			});
			this.#bitrixVue.use(this.#pinia);
			Object.entries(this.#providers).forEach(([key, value]) => {
				this.#bitrixVue.provide(key, value);
			});
			this.#bitrixVue.mount(container);
		}

		/**
		 * Unmounts the Vue application.
		 */
		unmount() {
			if (this.#bitrixVue === null) {
				return;
			}
			this.#bitrixVue.unmount();
			this.#bitrixVue = null;
		}

		/**
		 * Destroys the application and releases all resources.
		 */
		destroy() {
			this.unmount();
			this.#pinia = null;
			this.#providers = {};
		}
	}

	/**
	 * Vue-based implementation of the CallView interface.
	 */
	class VueCallViewAdapter {
		#container = null;
		#app = null;
		#isMounted = false;
		#isDestroyed = false;
		#isVisible = false;
		#isActivePiP = false;
		#eventEmitter = null;
		#deprecationWarned = new Set();

		// Map<eventName, Map<originalHandler, wrappedHandler>>
		#callbackWrappers = null;

		/**
		 * Returns the call Pinia store instance.
		 * Safe to call multiple times — Pinia returns the same cached instance per active Pinia.
		 *
		 * @returns {object}
		 */
		#getCallStore() {
			return call_store.useCallStore();
		}
		#translateEventData(eventName, data) {
			if (eventName === 'onButtonClick' && data?.buttonName) {
				const translated = {
					...data,
					buttonName: call_mapping.toControllerAction(data.buttonName)
				};
				if (data.buttonName === 'microphone') {
					translated.muted = !this.#getCallStore().isMicrophoneMuted;
				} else if (data.buttonName === 'camera') {
					translated.video = !this.#getCallStore().isCameraOn;
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
			this.#eventEmitter = new main_core.Event.EventEmitter();
			this.#callbackWrappers = new Map();
			this.#app = new CallVueApplication({
				pinia
			});
			this.#app.provide('callActionBridge', {
				emit: (eventName, data) => {
					this.#eventEmitter.emit(eventName, this.#translateEventData(eventName, data));
				}
			});
			if (Array.isArray(hiddenButtons) && hiddenButtons.length > 0) {
				this.#getCallStore().hideButtons(hiddenButtons);
			}
		}

		// region Properties

		get speakerId() {
			return this.#getCallStore().currentSpeakerId ?? '';
		}
		set speakerId(id) {
			this.#getCallStore().setDeviceIds({
				speakerId: id
			});
		}
		get speakerMuted() {
			return this.#getCallStore().isSpeakerMuted;
		}
		get visible() {
			return this.#isVisible;
		}
		get size() {
			return this.#getCallStore().size ?? 'full';
		}
		get isFullScreen() {
			return this.#getCallStore().isFullScreen;
		}
		get isPreparing() {
			return this.#getCallStore().uiState === 'Preparing';
		}
		set isPreparing(value) {
			this.#getCallStore().setUiState(value ? 'Preparing' : 'Connected');
		}
		get isActivePiPFromController() {
			return this.#isActivePiP;
		}
		set isActivePiPFromController(value) {
			this.#isActivePiP = value;
		}
		get microphoneId() {
			return this.#getCallStore().currentMicrophoneId ?? '';
		}
		set microphoneId(id) {
			this.#getCallStore().setDeviceIds({
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
				console.warn('[VueCallViewAdapter] userRegistry is deprecated. Use callStore.users instead.');
				this.#deprecationWarned.add('userRegistry');
			}
			return null;
		}
		get talkingService() {
			if (!this.#deprecationWarned.has('talkingService')) {
				console.warn('[VueCallViewAdapter] talkingService is deprecated. Use callStore.talkingQueue instead.');
				this.#deprecationWarned.add('talkingService');
			}
			return null;
		}
		isHidden() {
			return !this.#isVisible;
		}
		get renameSlider() {
			return {
				close: () => {
					this.#getCallStore().closeRenameSlider();
				}
			};
		}

		// endregion

		// region Lifecycle

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
			this.#app.destroy();
			this.#app = null;
			this.#isMounted = false;
			this.#isDestroyed = true;
			call_lib_mediaRegistry.MediaStreamRegistry.clear();
			this.#eventEmitter.unsubscribeAll();
			this.#callbackWrappers = null;
		}

		// endregion

		// region New method

		/**
		 * Returns a specific HTML element of a button by querying data-attributes in the Vue DOM.
		 *
		 * @param {string} buttonId
		 * @param {string} elementType
		 * @returns {HTMLElement | null}
		 */
		getButtonElement(buttonId, elementType = 'root') {
			if (!this.#container) {
				return null;
			}
			const escapedId = CSS.escape(buttonId);
			const escapedType = CSS.escape(elementType);
			return this.#container.querySelector(`[data-button-id="${escapedId}"][data-element-type="${escapedType}"]`) ?? null;
		}

		// endregion

		// region Users

		addUser(userId, state, direction) {
			this.#getCallStore().updateUser(userId, {
				state: state ?? 'Idle',
				direction: direction ?? null
			});
		}
		appendUsers(userStates) {
			const store = this.#getCallStore();
			Object.entries(userStates).forEach(([id, state]) => {
				store.updateUser(parseInt(id, 10), {
					state
				});
			});
		}
		updateUserData(userData) {
			const store = this.#getCallStore();
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
				store.updateUser(parseInt(userId, 10), fields);
			});
		}
		setLocalUserId(userId) {
			this.#getCallStore().localUserId = userId;
		}
		setLocalUserDirection(direction) {
			// store doesn't track local direction separately — no-op
		}
		setUserState(userId, newState) {
			this.#getCallStore().setUserState(userId, newState);
		}
		setUserMicrophoneState(userId, isMicrophoneOn) {
			this.#getCallStore().setUserMicrophoneState(userId, isMicrophoneOn);
		}
		setUserCameraState(userId, cameraState) {
			this.#getCallStore().setUserCameraState(userId, cameraState);
		}
		setUserVideoPaused(userId, videoPaused) {
			this.#getCallStore().setUserVideoPaused(userId, videoPaused);
		}
		setUserMedia(userId, kind, track) {
			if (kind === 'audio' || kind === 'sharingAudio') {
				call_lib_mediaRegistry.MediaStreamRegistry.setAudioTrack(userId, track ?? null);
			}
		}
		setUserConnectionQuality(userId, connectionQuality) {
			this.#getCallStore().setUserConnectionQuality(userId, connectionQuality);
		}
		setUserFloorRequestState(userId, userFloorRequestState) {
			this.#getCallStore().setUserFloorRequestState(userId, userFloorRequestState);
		}
		setUserTalking(userId, talking) {
			this.#getCallStore().setUserTalking(userId, talking);
		}
		setUserPermissionToSpeakState(userId, permissionToSpeakState) {
			this.#getCallStore().updateUser(userId, {
				permissionToSpeakState
			});
		}
		setAllUserPermissionToSpeakState(permissionToSpeakState) {
			const store = this.#getCallStore();
			Object.keys(store.users).forEach(userId => {
				store.updateUser(parseInt(userId, 10), {
					permissionToSpeakState
				});
			});
		}
		setUserScreenState(userId, screenState) {
			this.#getCallStore().updateUser(userId, {
				screenState
			});
		}
		setUserStats(userId, stats) {
			// stub — stats not tracked in store
		}
		setUserDirection(userId, direction) {
			this.#getCallStore().updateUser(userId, {
				direction
			});
		}
		removeScreenUsers() {
			// stub
		}
		getUserFloorRequestState(userId) {
			return this.#getCallStore().users[userId]?.floorRequestState ?? false;
		}
		getUserTalking(userId) {
			return this.#getCallStore().users[userId]?.talking ?? false;
		}
		getConnectedUserCount(withYou = false) {
			const count = this.#getCallStore().connectedUsers.length;
			return withYou ? count + 1 : count;
		}
		pinUser(userId) {
			this.#getCallStore().pinUser(userId);
		}
		unpinUser() {
			this.#getCallStore().unpinUser();
		}
		resetTalkingUsers() {
			const store = this.#getCallStore();
			Object.keys(store.users).forEach(userId => {
				store.setUserTalking(parseInt(userId, 10), false);
			});
		}
		notifyUserJoined(userId) {
			// no-op
		}
		notifyUserLeft(userId) {
			// no-op
		}

		// endregion

		// region Buttons

		setButtonActive(buttonName, isActive) {
			this.#getCallStore().setButtonState(buttonName, {
				active: isActive
			});
		}
		setButtonCounter(buttonName, counter) {
			this.#getCallStore().setButtonState(buttonName, {
				counter
			});
		}
		blockButtons(buttons) {
			this.#getCallStore().blockButtons(buttons);
		}
		unblockButtons(buttons) {
			this.#getCallStore().unblockButtons(buttons);
		}
		blockAddUser() {
			this.#getCallStore().blockButtons(['addUser']);
		}
		unblockAddUser() {
			this.#getCallStore().unblockButtons(['addUser']);
		}
		blockSwitchCamera() {
			this.#getCallStore().blockButtons(['camera']);
		}
		unblockSwitchCamera() {
			this.#getCallStore().unblockButtons(['camera']);
		}
		blockSwitchMicrophone() {
			this.#getCallStore().blockButtons(['microphone']);
		}
		unblockSwitchMicrophone() {
			this.#getCallStore().unblockButtons(['microphone']);
		}
		blockScreenSharing() {
			this.#getCallStore().blockButtons(['screen']);
		}
		blockHistoryButton() {
			this.#getCallStore().blockButtons(['history']);
		}
		disableMediaSelection() {
			this.#getCallStore().blockButtons(['microphone', 'camera', 'speaker']);
		}
		enableMediaSelection() {
			this.#getCallStore().unblockButtons(['microphone', 'camera', 'speaker']);
		}
		showButtons(buttons) {
			this.#getCallStore().showButtons(buttons);
		}
		hideButtons(buttons) {
			this.#getCallStore().hideButtons(buttons);
		}
		updateButtons(skippedElementsList) {
			// no-op: Vue reactivity handles button rendering automatically
		}
		isButtonBlocked(buttonName) {
			return this.#getCallStore().isButtonBlocked(buttonName);
		}

		// endregion

		// region UI State

		setUiState(uiState) {
			this.#getCallStore().setUiState(uiState);
		}
		setLayout(newLayout) {
			this.#getCallStore().setLayout(newLayout);
		}
		setSize(size) {
			this.#getCallStore().setSize(size);
		}
		setTitle(title) {
			this.#getCallStore().setCallTitle(title);
		}
		setMaxWidth(maxWidth) {
			this.#getCallStore().setMaxWidth(maxWidth);
		}
		removeMaxWidth() {
			this.#getCallStore().setMaxWidth(null);
		}
		setWindowFocusState(isActive) {
			this.#getCallStore().setWindowFocus(isActive);
		}
		setRoomState(roomState) {
			this.#getCallStore().setRoomState(roomState);
		}
		setHotKeyTemporaryBlock(isActive, force) {
			// no-op: hotkey management is not relevant to Vue rendering
		}
		toggleStatePictureInPictureCallWindow(isActive) {
			// no-op: PiP window state managed externally
		}

		// endregion

		// region Media

		setLocalStream(streamData) {
			const {
				stream = null,
				flipVideo = false
			} = streamData;
			const store = this.#getCallStore();
			if (!stream) {
				call_lib_mediaRegistry.MediaStreamRegistry.removeLocalStream();
				store.setLocalMediaMetadata({
					hasLocalVideo: false,
					hasLocalAudio: false
				});
				store.incrementLocalStreamVersion();
				return;
			}
			call_lib_mediaRegistry.MediaStreamRegistry.setLocalStream(stream);
			store.setLocalMediaMetadata({
				hasLocalVideo: stream.getVideoTracks().length > 0,
				hasLocalAudio: stream.getAudioTracks().length > 0,
				flipLocalVideo: Boolean(flipVideo)
			});
			store.incrementLocalStreamVersion();
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
			const store = this.#getCallStore();
			call_lib_mediaRegistry.MediaStreamRegistry.setLocalStream(stream);
			store.setLocalMediaMetadata({
				hasLocalVideo: Boolean(videoTrack)
			});
			store.incrementLocalStreamVersion();
		}
		flipLocalVideo(flipVideo) {
			this.#getCallStore().setLocalMediaMetadata({
				flipLocalVideo: flipVideo
			});
		}
		setMicrophoneId(microphoneId) {
			this.#getCallStore().setDeviceIds({
				microphoneId
			});
		}
		setSpeakerId(speakerId) {
			this.#getCallStore().setDeviceIds({
				speakerId
			});
		}
		setCameraId(cameraId) {
			this.#getCallStore().setDeviceIds({
				cameraId
			});
		}
		muteSpeaker(mute) {
			this.#getCallStore().setMediaState({
				isSpeakerMuted: mute
			});
		}
		releaseLocalMedia() {
			const store = this.#getCallStore();
			call_lib_mediaRegistry.MediaStreamRegistry.removeLocalStream();
			store.setLocalMediaMetadata({
				hasLocalVideo: false,
				hasLocalAudio: false
			});
			store.incrementLocalStreamVersion();
		}
		setVideoRenderer(userId, mediaRenderer) {
			if (!mediaRenderer) {
				call_lib_mediaRegistry.MediaStreamRegistry.removeRenderer(userId);
				return;
			}
			call_lib_mediaRegistry.MediaStreamRegistry.setRenderer(userId, mediaRenderer);
			this.#getCallStore().incrementUserStreamVersion(userId);
		}
		releaseVideoRenderer(userId) {
			call_lib_mediaRegistry.MediaStreamRegistry.removeRenderer(userId);
			this.#getCallStore().incrementUserStreamVersion(userId);
		}
		setBadNetworkIndicator(userId, badNetworkIndicator) {
			this.#getCallStore().updateUser(userId, {
				badNetworkIndicator
			});
		}
		setTrackSubscriptionFailed(data) {
			// stub
		}
		setMicrophoneLevel(level) {
			// stub
		}

		// endregion

		// region Recording

		setCommonRecordState(commonRecordState) {
			this.#getCallStore().setRecordState({
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

		// endregion

		// region Notifications & Popups

		showSelfTest() {
			// stub
		}
		showSecurityKeyError() {
			// stub
		}
		showFatalError(params) {
			// stub
		}
		showCloudRecordPromo(isCloudRecordFeaturesEnabled, callId) {
			// stub
		}
		showCloudRecordInfoPopup(isCloudRecordFeaturesEnabled, callId) {
			// stub
		}
		showCommonRecordMenuPopup(isDesktopRecord) {
			// stub
		}
		showCommonRecordStartModal() {
			// stub
		}
		showCommonRecordStartNotify(userId, state) {
			// stub
		}
		showCopilotErrorNotify(errorType) {
			// stub
		}
		showCopilotNotify(callId, errorCode) {
			// stub
		}
		showCopilotResultNotify() {
			// stub
		}
		closeCopilotNotify() {
			// stub
		}
		updateCopilotState(isActive) {
			this.#getCallStore().setCopilotState(isActive);
		}
		updateCopilotFeatureState(isEnabled) {
			this.#getCallStore().setCopilotFeaturesEnabled(isEnabled);
		}
		updateFloorRequestNotification() {
			// stub
		}

		// endregion

		// region Modals

		showConfirmModal(params) {
			return Promise.resolve('cancel');
		}

		// endregion

		// region Events

		subscribe(eventName, listener) {
			this.#eventEmitter.subscribe(eventName, listener);
		}
		unsubscribe(eventName, listener) {
			this.#eventEmitter.unsubscribe(eventName, listener);
		}

		/**
		 * Wraps handler to receive unwrapped event.data, matching legacy View behavior.
		 * The wrapper is stored keyed by [eventName][originalHandler] for future unsubscription.
		 *
		 * @param {string} name
		 * @param {Function} cb
		 */
		setCallback(name, cb) {
			const wrapper = event => cb(event.data);
			if (!this.#callbackWrappers.has(name)) {
				this.#callbackWrappers.set(name, new Map());
			}
			this.#callbackWrappers.get(name).set(cb, wrapper);
			this.#eventEmitter.subscribe(name, wrapper);
		}

		/**
		 * Removes a previously set callback by retrieving its wrapper from #callbackWrappers.
		 *
		 * @param {string} name
		 * @param {Function} cb
		 */
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

		// endregion
	}

	exports.CallVueApplication = CallVueApplication;
	exports.VueCallViewAdapter = VueCallViewAdapter;

})(this.BX.Call.Vue = this.BX.Call.Vue || {}, BX, BX.Call.Lib.MediaRegistry, BX.Call.Store, BX.Call.Mapping, BX.Vue3);
//# sourceMappingURL=call-vue.bundle.js.map
