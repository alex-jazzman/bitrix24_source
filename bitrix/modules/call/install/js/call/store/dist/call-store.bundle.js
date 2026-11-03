/* eslint-disable */
this.BX = this.BX || {};
this.BX.Call = this.BX.Call || {};
(function (exports, ui_vue3_pinia, main_core, call_lib_mediaRegistry) {
	'use strict';

	const useCallStore = ui_vue3_pinia.defineStore('call-core', {
		state: () => ({
			callState: 'Idle',
			callId: null,
			callUuid: null,
			callProvider: null,
			callScheme: null,
			callType: null,
			associatedEntityId: null,
			associatedEntityType: null,
			isIncoming: false,
			callMode: 'direct',
			conferenceTitle: '',
			conferenceState: 'preparation',
			conferenceCallEnded: false,
			conferenceStarted: null,
			conferenceStartDate: null,
			conferenceInited: false,
			conferenceAlias: '',
			conferenceError: '',
			conferenceComponentError: '',
			conferenceUsers: [],
			conferenceUsersInCall: [],
			conferencePresenters: [],
			conferenceUserCount: 0,
			conferenceMessageCount: 0,
			conferenceUserInCallCount: 0,
			currentUserHash: '',
			conferencePassChecked: true,
			conferenceShowChat: false,
			conferenceShowSmiles: false,
			conferencePermissionsRequested: false,
			conferenceJoinWithVideo: null,
			conferenceUserReadyToJoin: false,
			conferenceIsBroadcast: false,
			conferenceRightPanelMode: 'hidden',
			conferenceHasErrorInCall: false
		}),
		getters: {
			isConferenceCallActive: state => state.conferenceState === 'call' && !state.conferenceCallEnded
		},
		actions: {
			initCall(params = {}) {
				const nullableFields = ['callId', 'callUuid', 'callProvider', 'callScheme', 'callType', 'associatedEntityId', 'associatedEntityType'];
				nullableFields.forEach(key => {
					this[key] = params[key] === undefined ? null : params[key];
				});
				this.isIncoming = params.isIncoming === true;
				this.callState = 'Proceeding';
			},
			resetCall() {
				this.$reset();
			},
			setCallMode(mode) {
				this.callMode = mode;
			},
			setConferenceTitle(title) {
				this.conferenceTitle = title;
			},
			setConferenceCommon(fields) {
				const fieldMap = {
					inited: 'conferenceInited',
					passChecked: 'conferencePassChecked',
					userCount: 'conferenceUserCount',
					messageCount: 'conferenceMessageCount',
					userInCallCount: 'conferenceUserInCallCount',
					isBroadcast: 'conferenceIsBroadcast',
					hasErrorInCall: 'conferenceHasErrorInCall',
					showSmiles: 'conferenceShowSmiles',
					error: 'conferenceError',
					componentError: 'conferenceComponentError',
					alias: 'conferenceAlias'
				};
				Object.entries(fields).forEach(([key, value]) => {
					const stateKey = fieldMap[key];
					if (stateKey !== undefined && value !== undefined) {
						this[stateKey] = value;
					}
				});
			},
			setCurrentUserHash(hash) {
				this.currentUserHash = hash;
			},
			startConferenceCall() {
				this.conferenceState = 'call';
				this.conferenceCallEnded = false;
			},
			endConferenceCall() {
				this.conferenceState = 'preparation';
				this.conferenceCallEnded = true;
			},
			returnToPreparation() {
				this.conferenceState = 'preparation';
			},
			addConferenceUsers(userIds) {
				const ids = Array.isArray(userIds) ? userIds : [userIds];
				ids.forEach(id => {
					const parsed = parseInt(String(id), 10);
					if (!this.conferenceUsers.includes(parsed)) {
						this.conferenceUsers.push(parsed);
					}
				});
			},
			removeConferenceUsers(userIds) {
				const ids = Array.isArray(userIds) ? userIds : [userIds];
				const idsToRemove = new Set(ids.map(id => parseInt(String(id), 10)));
				this.conferenceUsers = this.conferenceUsers.filter(id => !idsToRemove.has(id));
			},
			addConferenceUsersInCall(userIds) {
				const ids = Array.isArray(userIds) ? userIds : [userIds];
				ids.forEach(id => {
					const parsed = parseInt(String(id), 10);
					if (!this.conferenceUsersInCall.includes(parsed)) {
						this.conferenceUsersInCall.push(parsed);
					}
				});
			},
			removeConferenceUsersInCall(userIds) {
				const ids = Array.isArray(userIds) ? userIds : [userIds];
				const idsToRemove = new Set(ids.map(id => parseInt(String(id), 10)));
				this.conferenceUsersInCall = this.conferenceUsersInCall.filter(id => !idsToRemove.has(id));
			},
			setConferencePresenters(presenters, replace = false) {
				const ids = Array.isArray(presenters) ? presenters : [presenters];
				if (replace) {
					this.conferencePresenters = ids.map(id => parseInt(String(id), 10));
				} else {
					ids.forEach(id => {
						const parsed = parseInt(String(id), 10);
						if (!this.conferencePresenters.includes(parsed)) {
							this.conferencePresenters.push(parsed);
						}
					});
				}
			},
			setConferenceShowChat(newState) {
				this.conferenceShowChat = newState;
			},
			setConferenceRightPanelMode(mode) {
				this.conferenceRightPanelMode = mode;
			},
			setConferencePermissionsRequested(status) {
				this.conferencePermissionsRequested = status;
			},
			setConferenceJoinWithVideo(value) {
				this.conferenceJoinWithVideo = value;
			},
			setConferenceUserReadyToJoin() {
				this.conferenceUserReadyToJoin = true;
			},
			setConferenceStatus(started) {
				this.conferenceStarted = started;
			},
			setConferenceStartDate(date) {
				this.conferenceStartDate = date;
			},
			setConferenceAlias(alias) {
				this.conferenceAlias = alias;
			},
			setConferenceBroadcastMode(mode) {
				this.conferenceIsBroadcast = mode;
			},
			setConferenceError(errorCode) {
				this.conferenceError = errorCode;
			},
			toggleConferenceSmiles() {
				this.conferenceShowSmiles = !this.conferenceShowSmiles;
			},
			setConferenceHasErrorInCall(value) {
				this.conferenceHasErrorInCall = value;
			},
			resetConference() {
				this.conferenceTitle = '';
				this.conferenceState = 'preparation';
				this.conferenceCallEnded = false;
				this.conferenceStarted = null;
				this.conferenceStartDate = null;
				this.conferenceInited = false;
				this.conferenceAlias = '';
				this.conferenceError = '';
				this.conferenceComponentError = '';
				this.conferenceUsers = [];
				this.conferenceUsersInCall = [];
				this.conferencePresenters = [];
				this.conferenceUserCount = 0;
				this.conferenceMessageCount = 0;
				this.conferenceUserInCallCount = 0;
				this.currentUserHash = '';
				this.conferencePassChecked = true;
				this.conferenceShowChat = false;
				this.conferenceShowSmiles = false;
				this.conferencePermissionsRequested = false;
				this.conferenceJoinWithVideo = null;
				this.conferenceUserReadyToJoin = false;
				this.conferenceIsBroadcast = false;
				this.conferenceRightPanelMode = 'hidden';
				this.conferenceHasErrorInCall = false;
			}
		}
	});

	const useCallIncomingStore = ui_vue3_pinia.defineStore('call-incoming', {
		state: () => ({
			callType: 'regular',
			callerName: '',
			callerAvatar: '',
			callerType: '',
			callerColor: null,
			video: false,
			hasCamera: false,
			initialMicrophoneState: true,
			initialCameraState: false,
			isDesktop: false
		}),
		actions: {
			initFromParams(params) {
				if (params.callType === 'regular' || params.callType === 'conference') {
					this.callType = params.callType;
				}
				if (main_core.Type.isString(params.callerName)) {
					this.callerName = main_core.Text.decode(params.callerName);
				}
				if (main_core.Type.isString(params.callerAvatar)) {
					this.callerAvatar = params.callerAvatar;
				} else {
					this.callerAvatar = '';
				}
				if (main_core.Type.isString(params.callerType)) {
					this.callerType = params.callerType;
				} else {
					this.callerType = '';
				}
				if (main_core.Type.isStringFilled(params.callerColor)) {
					this.callerColor = params.callerColor;
				}
				this.video = Boolean(params.video);
				this.hasCamera = Boolean(params.hasCamera);
				this.initialMicrophoneState = Boolean(params.microphoneState ?? true);
				this.initialCameraState = Boolean(params.cameraState ?? false);
				this.isDesktop = Boolean(params.isDesktop);
			},
			setHasCamera(value) {
				if (this.callType !== 'regular') {
					return;
				}
				this.hasCamera = Boolean(value);
			}
		}
	});

	function normalizeRenderer(renderer) {
		if (!renderer) {
			return null;
		}
		if (typeof renderer.getTracks === 'function') {
			return renderer;
		}
		const inner = renderer.stream;
		if (inner && typeof inner.getTracks === 'function') {
			return inner;
		}
		return null;
	}

	function useMediaStore$1() {
		const pinia = ui_vue3_pinia.getActivePinia();
		return pinia?._s?.get('callMedia') ?? null;
	}
	function defaultUser(id, overrides = {}) {
		return {
			id,
			name: '',
			avatar: '',
			state: 'Idle',
			microphoneState: true,
			cameraState: false,
			screenSharingState: false,
			talking: false,
			floorRequestState: false,
			connectionQuality: 100,
			videoPaused: false,
			streamVersion: 0,
			...overrides
		};
	}
	const useUsersStore = ui_vue3_pinia.defineStore('callUsers', {
		state: () => ({
			users: {},
			currentUserId: null,
			speakerId: null,
			raiseHandQueue: [],
			talkingQueue: []
		}),
		getters: {
			userById: state => userId => state.users[userId] ?? null,
			currentUser: state => state.currentUserId === null ? null : state.users[state.currentUserId] ?? null,
			isCurrentUser: state => userId => userId === state.currentUserId,
			usersArray: state => Object.values(state.users),
			userIds: state => Object.keys(state.users).map(Number),
			connectedUsers: state => Object.values(state.users).filter(u => u.state === 'Connected'),
			talkingUsers: state => Object.values(state.users).filter(u => u.talking),
			speakerUser: state => state.speakerId === null ? null : state.users[state.speakerId] ?? null,
			raiseHandUsers: state => state.raiseHandQueue.map(id => state.users[id]).filter(Boolean),
			streamForUser(state) {
				return userId => {
					if (userId === state.currentUserId) {
						const mediaStore = useMediaStore$1();
						if (mediaStore !== null) {
							void mediaStore.localStreamVersion;
						}
						return normalizeRenderer(call_lib_mediaRegistry.MediaStreamRegistry.getLocalStream());
					}
					void state.users[userId]?.streamVersion;
					return normalizeRenderer(call_lib_mediaRegistry.MediaStreamRegistry.getRenderer(userId));
				};
			},
			mirrorFor(state) {
				return userId => {
					if (userId !== state.currentUserId) {
						return false;
					}
					return useMediaStore$1()?.flipLocalVideo ?? false;
				};
			}
		},
		actions: {
			setCurrentUser(userId, fields = {}) {
				this.currentUserId = userId;
				this.users[userId] = {
					...defaultUser(userId, {
						state: 'Connected'
					}),
					...this.users[userId],
					...fields,
					id: userId
				};
			},
			clearCurrentUser() {
				this.currentUserId = null;
			},
			upsertUser(userId, fields = {}) {
				const id = parseInt(String(userId), 10);
				this.users[id] = {
					...(this.users[id] ?? defaultUser(id)),
					...fields,
					id
				};
			},
			updateUser(userId, fields) {
				const id = parseInt(String(userId), 10);
				if (this.users[id]) {
					this.users[id] = {
						...this.users[id],
						...fields
					};
				} else {
					this.upsertUser(id, fields);
				}
			},
			removeUser(userId) {
				const id = parseInt(String(userId), 10);
				if (id === this.currentUserId) {
					return;
				}
				delete this.users[id];
				this.raiseHandQueue = this.raiseHandQueue.filter(uid => uid !== id);
				this.talkingQueue = this.talkingQueue.filter(uid => uid !== id);
			},
			setSpeaker(userId) {
				this.speakerId = userId;
			},
			incrementStreamVersion(userId) {
				const id = parseInt(String(userId), 10);
				if (this.users[id]) {
					this.users[id].streamVersion += 1;
				} else {
					this.upsertUser(id, {
						streamVersion: 1
					});
				}
			},
			addRaiseHand(userId) {
				const id = parseInt(String(userId), 10);
				if (!this.raiseHandQueue.includes(id)) {
					this.raiseHandQueue.push(id);
				}
			},
			removeRaiseHand(userId) {
				const id = parseInt(String(userId), 10);
				this.raiseHandQueue = this.raiseHandQueue.filter(uid => uid !== id);
			},
			clearRaiseHands() {
				this.raiseHandQueue = [];
			},
			setFloorRequest(userId, raised) {
				const id = parseInt(String(userId), 10);
				this.updateUser(id, {
					floorRequestState: raised
				});
				if (raised) {
					this.addRaiseHand(id);
				} else {
					this.removeRaiseHand(id);
				}
			},
			refreshTalkingQueue() {
				const talking = Object.values(this.users).filter(u => u.talking).map(u => u.id).sort((a, b) => a - b);
				const connected = Object.values(this.users).filter(u => u.state === 'Connected' && !u.talking).map(u => u.id);
				this.talkingQueue = [...talking, ...connected];
			},
			toggleRaiseHand() {
				const me = this.currentUser;
				if (!me) {
					return;
				}
				const next = !me.floorRequestState;
				this.setFloorRequest(me.id, next);
				useMediaStore$1()?._bridge?.emit('onButtonClick', {
					buttonName: 'floorRequest'
				});
			},
			resetUsers() {
				this.users = {};
				this.currentUserId = null;
				this.speakerId = null;
				this.raiseHandQueue = [];
				this.talkingQueue = [];
			}
		}
	});

	const useMediaStore = ui_vue3_pinia.defineStore('callMedia', {
		state: () => ({
			localStreamVersion: 0,
			flipLocalVideo: false,
			hasLocalVideo: false,
			hasLocalAudio: false,
			microphoneDeviceId: null,
			cameraDeviceId: null,
			speakerDeviceId: null,
			isSpeakerMuted: false,
			connectionQuality: 100,
			_bridge: null
		}),
		getters: {
			localStream(state) {
				void state.localStreamVersion;
				return normalizeRenderer(call_lib_mediaRegistry.MediaStreamRegistry.getLocalStream());
			},
			isMicrophoneMuted() {
				const me = useUsersStore().currentUser;
				return me ? !me.microphoneState : false;
			},
			isCameraOn() {
				return useUsersStore().currentUser?.cameraState ?? false;
			},
			isScreenSharingActive() {
				return useUsersStore().currentUser?.screenSharingState ?? false;
			}
		},
		actions: {
			setFlipLocalVideo(flip) {
				this.flipLocalVideo = flip;
			},
			setLocalMediaMetadata(fields) {
				if (fields.hasLocalVideo !== undefined) {
					this.hasLocalVideo = fields.hasLocalVideo;
				}
				if (fields.hasLocalAudio !== undefined) {
					this.hasLocalAudio = fields.hasLocalAudio;
				}
			},
			setDeviceIds(fields) {
				if (fields.microphoneId !== undefined) {
					this.microphoneDeviceId = fields.microphoneId;
				}
				if (fields.cameraId !== undefined) {
					this.cameraDeviceId = fields.cameraId;
				}
				if (fields.speakerId !== undefined) {
					this.speakerDeviceId = fields.speakerId;
				}
			},
			setSpeakerMuted(muted) {
				this.isSpeakerMuted = muted;
			},
			setConnectionQuality(quality) {
				this.connectionQuality = quality;
			},
			incrementLocalStreamVersion() {
				this.localStreamVersion += 1;
			},
			attachBridge(bridge) {
				this._bridge = bridge;
			},
			detachBridge() {
				this._bridge = null;
			},
			toggleMicrophone() {
				const usersStore = useUsersStore();
				const me = usersStore.currentUser;
				if (!me) {
					return;
				}
				const next = !me.microphoneState;
				usersStore.updateUser(me.id, {
					microphoneState: next
				});
				this._bridge?.emit('onButtonClick', {
					buttonName: 'microphone'
				});
			},
			toggleCamera() {
				const usersStore = useUsersStore();
				const me = usersStore.currentUser;
				if (!me) {
					return;
				}
				const next = !me.cameraState;
				usersStore.updateUser(me.id, {
					cameraState: next
				});
				this._bridge?.emit('onButtonClick', {
					buttonName: 'camera'
				});
			},
			toggleScreenSharing() {
				this._bridge?.emit('onButtonClick', {
					buttonName: 'screen'
				});
			},
			toggleRaiseHand() {
				this._bridge?.emit('onButtonClick', {
					buttonName: 'floorRequest'
				});
			}
		}
	});

	const useUiStore = ui_vue3_pinia.defineStore('callUi', {
		state: () => ({
			viewState: 'Closed',
			isFullScreen: false,
			layout: 'Grid',
			uiState: 'Idle',
			callTitle: '',
			size: 'full',
			maxWidth: null,
			isWindowFocus: true,
			roomState: '',
			pinnedUserId: null,
			layoutWidth: 0,
			layoutHeight: 0,
			layoutContentHeight: 0,
			isCopilotActive: false,
			isCopilotFeaturesEnabled: false,
			buttons: {},
			notifications: [],
			notificationTick: Date.now(),
			confirmModal: {
				visible: false,
				title: '',
				message: '',
				buttons: [],
				promiseId: null
			},
			isRenameSliderOpen: false,
			_bridge: null
		}),
		getters: {
			isGridMode: state => state.layout === 'Grid',
			isCenteredMode: state => state.layout === 'Centered',
			isMobileMode: state => state.layout === 'Mobile',
			isUserPinned: state => userId => state.pinnedUserId === userId,
			isButtonBlocked: state => buttonName => state.buttons[buttonName]?.blocked ?? false,
			isButtonVisible: state => buttonName => state.buttons[buttonName]?.visible ?? true,
			buttonCounter: state => buttonName => state.buttons[buttonName]?.counter ?? 0,
			activeNotifications: state => state.notifications.filter(n => n.createdAt + n.ttl > state.notificationTick)
		},
		actions: {
			setViewState(viewState) {
				this.viewState = viewState;
			},
			setFullScreen(value) {
				this.isFullScreen = value;
			},
			setLayout(layout) {
				this.layout = layout;
			},
			setUiState(uiState) {
				this.uiState = uiState;
			},
			setCallTitle(title) {
				this.callTitle = title;
			},
			setSize(size) {
				this.size = size;
			},
			setMaxWidth(maxWidth) {
				this.maxWidth = maxWidth;
			},
			setWindowFocus(focus) {
				this.isWindowFocus = focus;
			},
			setRoomState(state) {
				this.roomState = state;
			},
			setLayoutDimensions(fields) {
				if (fields.layoutWidth !== undefined) this.layoutWidth = fields.layoutWidth;
				if (fields.layoutHeight !== undefined) this.layoutHeight = fields.layoutHeight;
				if (fields.layoutContentHeight !== undefined) this.layoutContentHeight = fields.layoutContentHeight;
			},
			setPinnedUser(userId) {
				this.pinnedUserId = userId;
			},
			togglePinnedUser(userId) {
				this.pinnedUserId = this.pinnedUserId === userId ? null : userId;
			},
			setCopilotActive(value) {
				this.isCopilotActive = value;
			},
			setCopilotFeaturesEnabled(value) {
				this.isCopilotFeaturesEnabled = value;
			},
			closeRenameSlider() {
				this.isRenameSliderOpen = false;
			},
			setButtonState(buttonName, fields) {
				if (!this.buttons[buttonName]) {
					this.buttons[buttonName] = {
						active: false,
						blocked: false,
						visible: true,
						counter: 0
					};
				}
				this.buttons[buttonName] = {
					...this.buttons[buttonName],
					...fields
				};
			},
			blockButtons(names) {
				names.forEach(n => this.setButtonState(n, {
					blocked: true
				}));
			},
			unblockButtons(names) {
				names.forEach(n => this.setButtonState(n, {
					blocked: false
				}));
			},
			showButtons(names) {
				names.forEach(n => this.setButtonState(n, {
					visible: true
				}));
			},
			hideButtons(names) {
				names.forEach(n => this.setButtonState(n, {
					visible: false
				}));
			},
			addNotification(type, data) {
				const id = crypto.randomUUID();
				this.notifications.push({
					id,
					type,
					data,
					createdAt: Date.now(),
					ttl: 5000
				});
				return id;
			},
			removeNotification(id) {
				this.notifications = this.notifications.filter(n => n.id !== id);
			},
			refreshNotificationTick() {
				this.notificationTick = Date.now();
			},
			showConfirmModal(params) {
				this.confirmModal = {
					visible: true,
					title: '',
					message: '',
					buttons: [],
					promiseId: null,
					...params
				};
			},
			hideConfirmModal() {
				this.confirmModal = {
					visible: false,
					title: '',
					message: '',
					buttons: [],
					promiseId: null
				};
			},
			attachBridge(bridge) {
				this._bridge = bridge;
			},
			detachBridge() {
				this._bridge = null;
			},
			toggleChat() {
				this._bridge?.emit('onButtonClick', {
					buttonName: 'chat'
				});
			},
			toggleFollowUp() {
				this._bridge?.emit('onButtonClick', {
					buttonName: 'copilot'
				});
			},
			hangup() {
				this._bridge?.emit('onButtonClick', {
					buttonName: 'hangup'
				});
			}
		}
	});

	const useRecordingStore = ui_vue3_pinia.defineStore('callRecording', {
		state: () => ({
			state: 'Inactive',
			type: null,
			initiatorId: null,
			startedAt: null,
			_bridge: null
		}),
		getters: {
			isActive: state => state.state !== 'Inactive' && state.state !== 'Destroyed',
			isPaused: state => state.state === 'Paused',
			duration(state) {
				return state.startedAt === null ? 0 : Date.now() - state.startedAt;
			}
		},
		actions: {
			setState(fields) {
				if (fields.state !== undefined) this.state = fields.state;
				if (fields.type !== undefined) this.type = fields.type;
				if (fields.initiatorId !== undefined) this.initiatorId = fields.initiatorId;
			},
			setStartedAt(timestamp) {
				this.startedAt = timestamp;
			},
			attachBridge(bridge) {
				this._bridge = bridge;
			},
			detachBridge() {
				this._bridge = null;
			},
			menuAction(state, kind) {
				this._bridge?.emit('onCommonRecordMenu', {
					state,
					kind
				});
			}
		}
	});

	exports.useCallIncomingStore = useCallIncomingStore;
	exports.useCallStore = useCallStore;
	exports.useMediaStore = useMediaStore;
	exports.useRecordingStore = useRecordingStore;
	exports.useUiStore = useUiStore;
	exports.useUsersStore = useUsersStore;

})(this.BX.Call.Store = this.BX.Call.Store || {}, BX.Vue3.Pinia, BX, BX.Call.Lib.MediaRegistry);
//# sourceMappingURL=call-store.bundle.js.map
