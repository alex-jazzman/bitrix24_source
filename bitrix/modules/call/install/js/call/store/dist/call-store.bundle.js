/* eslint-disable */
this.BX = this.BX || {};
this.BX.Call = this.BX.Call || {};
(function (exports, ui_vue3_pinia) {
	'use strict';

	const useCallStore = ui_vue3_pinia.defineStore('call-core', {
		state: () => ({
			// region Call lifecycle
			callState: 'Idle',
			callId: null,
			callUuid: null,
			callProvider: null,
			callScheme: null,
			callType: null,
			associatedEntityId: null,
			associatedEntityType: null,
			isIncoming: false,
			localUserId: null,
			// endregion Call lifecycle

			// region Participants
			users: {},
			// endregion Participants

			// region Media state
			isMicrophoneMuted: false,
			isCameraOn: false,
			isScreenSharingActive: false,
			isSpeakerMuted: false,
			currentMicrophoneId: null,
			currentCameraId: null,
			currentSpeakerId: null,
			// endregion Media state

			// region Recording
			commonRecordState: 'Inactive',
			commonRecordType: null,
			commonRecordInitiatorId: null,
			// endregion Recording

			// region UI state
			viewState: 'Closed',
			isFullScreen: false,
			pinnedUserId: null,
			layout: 'Grid',
			uiState: 'Idle',
			callTitle: '',
			size: 'full',
			maxWidth: null,
			isWindowFocus: true,
			roomState: '',
			isRenameSliderOpen: false,
			allowRename: false,
			renameRequested: false,
			wasRenamed: false,
			// endregion UI state

			// region Buttons
			buttons: {},
			// endregion Buttons

			// region Copilot
			isCopilotActive: false,
			isCopilotFeaturesEnabled: false,
			// endregion Copilot

			// region Notifications
			notifications: [],
			notificationTick: Date.now(),
			// endregion Notifications

			// region Local media metadata
			hasLocalVideo: false,
			hasLocalAudio: false,
			flipLocalVideo: false,
			localStreamVersion: 0,
			// endregion Local media metadata

			// region Confirm modal
			confirmModal: {
				visible: false,
				title: '',
				message: '',
				buttons: [],
				promiseId: null
			},
			// endregion Confirm modal

			// region Talking queue
			talkingQueueData: [],
			// endregion Talking queue

			// region Call mode
			callMode: 'direct',
			// 'direct' | 'group' | 'conference'
			// endregion Call mode

			// region Conference context (used when callMode === 'conference')
			conferenceTitle: '',
			conferenceState: 'preparation',
			// 'preparation' | 'call'
			conferenceCallEnded: false,
			conferenceStarted: null,
			conferenceStartDate: null,
			conferenceInited: false,
			conferenceAlias: '',
			conferenceError: '',
			conferenceComponentError: '',
			// endregion Conference context

			// region Conference participants
			conferenceUsers: [],
			conferenceUsersInCall: [],
			conferencePresenters: [],
			conferenceUserCount: 0,
			conferenceMessageCount: 0,
			conferenceUserInCallCount: 0,
			currentUserHash: '',
			// endregion Conference participants

			// region Conference UI
			conferencePassChecked: true,
			conferenceShowChat: false,
			conferenceShowSmiles: false,
			conferencePermissionsRequested: false,
			conferenceJoinWithVideo: null,
			conferenceUserReadyToJoin: false,
			conferenceIsBroadcast: false,
			conferenceRightPanelMode: 'hidden',
			conferenceHasErrorInCall: false
			// endregion Conference UI
		}),
		getters: {
			connectedUsers: state => Object.values(state.users).filter(u => u.state === 'Connected'),
			userById: state => userId => state.users[userId] || null,
			hasConnectedUsers: state => Object.values(state.users).some(u => u.state === 'Connected'),
			talkingUsers: state => Object.values(state.users).filter(u => u.talking),
			isRecordingActive: state => state.commonRecordState !== 'Inactive' && state.commonRecordState !== 'Destroyed',
			activeNotifications: state => state.notifications.filter(n => n.createdAt + n.ttl > state.notificationTick),
			isButtonBlocked: state => buttonName => state.buttons[buttonName]?.blocked ?? false,
			talkingQueue: state => state.talkingQueueData,
			isConferenceCallActive: state => state.conferenceState === 'call' && !state.conferenceCallEnded,
			isCurrentUserPresenter: state => state.conferencePresenters.includes(state.localUserId),
			isViewerMode: state => state.conferenceIsBroadcast && !state.conferencePresenters.includes(state.localUserId)
		},
		actions: {
			/**
			 * Initializes call metadata. Sets callState to 'Proceeding'.
			 *
			 * @param {object} params
			 * @param {number|null} params.callId
			 * @param {string|null} params.callUuid
			 * @param {string|null} params.callProvider
			 * @param {string|null} params.callScheme
			 * @param {string|null} params.callType
			 * @param {number|null} params.associatedEntityId
			 * @param {string|null} params.associatedEntityType
			 * @param {boolean} params.isIncoming
			 * @param {number|null} params.localUserId
			 */
			initCall(params = {}) {
				const nullableFields = ['callId', 'callUuid', 'callProvider', 'callScheme', 'callType', 'associatedEntityId', 'associatedEntityType', 'localUserId'];
				nullableFields.forEach(key => {
					this[key] = params[key] === undefined ? null : params[key];
				});
				this.isIncoming = params.isIncoming === true;
				this.callState = 'Proceeding';
			},
			/**
			 * Resets all state to defaults.
			 */
			resetCall() {
				this.$reset();
			},
			/**
			 * Creates a new UserEntry with defaults on first call or merges fields on subsequent calls.
			 *
			 * @param {number|string} userId
			 * @param {object} fields
			 */
			updateUser(userId, fields) {
				const id = parseInt(userId, 10);
				if (this.users[id]) {
					this.users[id] = {
						...this.users[id],
						...fields
					};
				} else {
					this.users[id] = {
						id,
						state: 'Idle',
						talking: false,
						pinned: false,
						cameraState: false,
						microphoneState: false,
						screenState: false,
						floorRequestState: false,
						videoPaused: false,
						connectionQuality: 0,
						direction: null,
						name: '',
						avatar: '',
						streamVersion: 0,
						permissionToSpeakState: false,
						badNetworkIndicator: false,
						...fields
					};
				}
			},
			/**
			 * Updates user.state field.
			 *
			 * @param {number|string} userId
			 * @param {string} state
			 */
			setUserState(userId, state) {
				const id = parseInt(userId, 10);
				if (this.users[id]) {
					this.users[id].state = state;
				}
			},
			/**
			 * Updates user.microphoneState field.
			 *
			 * @param {number|string} userId
			 * @param {boolean} microphoneState
			 */
			setUserMicrophoneState(userId, microphoneState) {
				const id = parseInt(userId, 10);
				if (this.users[id]) {
					this.users[id].microphoneState = microphoneState;
				}
			},
			/**
			 * Updates user.cameraState field.
			 *
			 * @param {number|string} userId
			 * @param {boolean} cameraState
			 */
			setUserCameraState(userId, cameraState) {
				const id = parseInt(userId, 10);
				if (this.users[id]) {
					this.users[id].cameraState = cameraState;
				}
			},
			/**
			 * Updates user.talking field.
			 *
			 * @param {number|string} userId
			 * @param {boolean} talking
			 */
			setUserTalking(userId, talking) {
				const id = parseInt(userId, 10);
				if (this.users[id]) {
					this.users[id].talking = talking;
				}
			},
			/**
			 * Updates user.floorRequestState field.
			 *
			 * @param {number|string} userId
			 * @param {boolean} floorRequestState
			 */
			setUserFloorRequestState(userId, floorRequestState) {
				const id = parseInt(userId, 10);
				if (this.users[id]) {
					this.users[id].floorRequestState = floorRequestState;
				}
			},
			/**
			 * Updates user.videoPaused field.
			 *
			 * @param {number|string} userId
			 * @param {boolean} videoPaused
			 */
			setUserVideoPaused(userId, videoPaused) {
				const id = parseInt(userId, 10);
				if (this.users[id]) {
					this.users[id].videoPaused = videoPaused;
				}
			},
			/**
			 * Updates user.connectionQuality field.
			 *
			 * @param {number|string} userId
			 * @param {number} connectionQuality
			 */
			setUserConnectionQuality(userId, connectionQuality) {
				const id = parseInt(userId, 10);
				if (this.users[id]) {
					this.users[id].connectionQuality = connectionQuality;
				}
			},
			/**
			 * Pins a user: unpins previously pinned user, sets pinned flag and updates pinnedUserId.
			 *
			 * @param {number|string} userId
			 */
			pinUser(userId) {
				const id = parseInt(userId, 10);
				if (this.pinnedUserId !== null && this.users[this.pinnedUserId]) {
					this.users[this.pinnedUserId].pinned = false;
				}
				if (this.users[id]) {
					this.users[id].pinned = true;
				}
				this.pinnedUserId = id;
			},
			/**
			 * Unpins current pinned user and clears pinnedUserId.
			 */
			unpinUser() {
				if (this.pinnedUserId !== null && this.users[this.pinnedUserId]) {
					this.users[this.pinnedUserId].pinned = false;
				}
				this.pinnedUserId = null;
			},
			/**
			 * Updates local media state fields. Ignores undefined fields.
			 *
			 * @param {object} fields
			 * @param {boolean} [fields.isMicrophoneMuted]
			 * @param {boolean} [fields.isCameraOn]
			 * @param {boolean} [fields.isScreenSharingActive]
			 * @param {boolean} [fields.isSpeakerMuted]
			 */
			setMediaState(fields) {
				const allowedFields = ['isMicrophoneMuted', 'isCameraOn', 'isScreenSharingActive', 'isSpeakerMuted'];
				allowedFields.forEach(key => {
					if (fields[key] !== undefined) {
						this[key] = fields[key];
					}
				});
			},
			/**
			 * Updates device IDs. Ignores undefined fields.
			 *
			 * @param {object} fields
			 * @param {string|null} [fields.microphoneId]
			 * @param {string|null} [fields.cameraId]
			 * @param {string|null} [fields.speakerId]
			 */
			setDeviceIds(fields) {
				if (fields.microphoneId !== undefined) {
					this.currentMicrophoneId = fields.microphoneId;
				}
				if (fields.cameraId !== undefined) {
					this.currentCameraId = fields.cameraId;
				}
				if (fields.speakerId !== undefined) {
					this.currentSpeakerId = fields.speakerId;
				}
			},
			/**
			 * Updates recording state fields.
			 *
			 * @param {object} fields
			 * @param {string} [fields.state]
			 * @param {string|null} [fields.type]
			 * @param {number|null} [fields.initiatorId]
			 */
			setRecordState(fields) {
				if (fields.state !== undefined) {
					this.commonRecordState = fields.state;
				}
				if (fields.type !== undefined) {
					this.commonRecordType = fields.type;
				}
				if (fields.initiatorId !== undefined) {
					this.commonRecordInitiatorId = fields.initiatorId;
				}
			},
			/**
			 * Updates viewState.
			 *
			 * @param {string} viewState
			 */
			setViewState(viewState) {
				this.viewState = viewState;
			},
			/**
			 * Updates isFullScreen flag.
			 *
			 * @param {boolean} isFullScreen
			 */
			setFullScreen(isFullScreen) {
				this.isFullScreen = isFullScreen;
			},
			// region UI state actions

			/**
			 * Sets layout mode.
			 *
			 * @param {string} layout
			 */
			setLayout(layout) {
				this.layout = layout;
			},
			/**
			 * Sets UI lifecycle state.
			 *
			 * @param {string} uiState
			 */
			setUiState(uiState) {
				this.uiState = uiState;
			},
			/**
			 * Sets call screen title.
			 *
			 * @param {string} title
			 */
			setCallTitle(title) {
				this.callTitle = title;
			},
			/**
			 * Sets view size hint.
			 *
			 * @param {string} size
			 */
			setSize(size) {
				this.size = size;
			},
			/**
			 * Sets max width constraint.
			 *
			 * @param {number|null} maxWidth
			 */
			setMaxWidth(maxWidth) {
				this.maxWidth = maxWidth;
			},
			/**
			 * Sets window focus state.
			 *
			 * @param {boolean} isActive
			 */
			setWindowFocus(isActive) {
				this.isWindowFocus = isActive;
			},
			/**
			 * Sets current room state.
			 *
			 * @param {string} roomState
			 */
			setRoomState(roomState) {
				this.roomState = roomState;
			},
			/**
			 * Closes the rename slider.
			 */
			closeRenameSlider() {
				this.isRenameSliderOpen = false;
			},
			/**
			 * Sets whether the local user may rename.
			 *
			 * @param {boolean} allow
			 */
			setAllowRename(allow) {
				this.allowRename = allow;
			},
			setRenameRequested(value) {
				this.renameRequested = value;
			},
			setWasRenamed(value) {
				this.wasRenamed = value;
			},
			// endregion UI state actions

			// region Button actions

			/**
			 * Creates or merges button state entry.
			 *
			 * @param {string} buttonName
			 * @param {object} fields
			 */
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
			/**
			 * Blocks specified buttons.
			 *
			 * @param {string[]} buttonNames
			 */
			blockButtons(buttonNames) {
				buttonNames.forEach(name => {
					this.setButtonState(name, {
						blocked: true
					});
				});
			},
			/**
			 * Unblocks specified buttons.
			 *
			 * @param {string[]} buttonNames
			 */
			unblockButtons(buttonNames) {
				buttonNames.forEach(name => {
					this.setButtonState(name, {
						blocked: false
					});
				});
			},
			/**
			 * Makes specified buttons visible.
			 *
			 * @param {string[]} buttonNames
			 */
			showButtons(buttonNames) {
				buttonNames.forEach(name => {
					this.setButtonState(name, {
						visible: true
					});
				});
			},
			hideButtons(buttonNames) {
				buttonNames.forEach(name => {
					this.setButtonState(name, {
						visible: false
					});
				});
			},
			// endregion Button actions

			// region Notification actions

			/**
			 * Adds a notification and returns its id.
			 *
			 * @param {string} type
			 * @param {object} data
			 * @returns {string}
			 */
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
			/**
			 * Removes a notification by id.
			 *
			 * @param {string} id
			 */
			removeNotification(id) {
				this.notifications = this.notifications.filter(n => n.id !== id);
			},
			/**
			 * Updates notificationTick to force recomputation of activeNotifications getter.
			 */
			refreshNotificationTick() {
				this.notificationTick = Date.now();
			},
			// endregion Notification actions

			// region Confirm modal actions

			/**
			 * Shows confirm modal with given params.
			 *
			 * @param {object} params
			 */
			showConfirmModal(params) {
				this.confirmModal = {
					visible: true,
					...params
				};
			},
			/**
			 * Hides confirm modal and resets its state.
			 */
			hideConfirmModal() {
				this.confirmModal = {
					visible: false,
					title: '',
					message: '',
					buttons: [],
					promiseId: null
				};
			},
			// endregion Confirm modal actions

			// region Talking queue actions

			/**
			 * Recomputes talkingQueue ordered by talking priority.
			 */
			refreshTalkingQueue() {
				const talking = Object.values(this.users).filter(u => u.talking === true).map(u => u.id).sort((a, b) => a - b);
				const connected = Object.values(this.users).filter(u => u.state === 'Connected' && u.talking !== true).map(u => u.id);
				this.talkingQueueData = [...talking, ...connected];
			},
			// endregion Talking queue actions

			// region Local media metadata actions

			/**
			 * Merges local media metadata fields into state.
			 *
			 * @param {object} fields
			 */
			setLocalMediaMetadata(fields) {
				const allowedFields = ['hasLocalVideo', 'hasLocalAudio', 'flipLocalVideo'];
				allowedFields.forEach(key => {
					if (fields[key] !== undefined) {
						this[key] = fields[key];
					}
				});
			},
			/**
			 * Increments local stream version counter.
			 */
			incrementLocalStreamVersion() {
				this.localStreamVersion += 1;
			},
			/**
			 * Increments stream version counter for a specific user.
			 *
			 * @param {number} userId
			 */
			incrementUserStreamVersion(userId) {
				if (this.users[userId]) {
					this.users[userId].streamVersion += 1;
				}
			},
			// endregion Local media metadata actions

			// region Copilot actions

			/**
			 * Sets copilot active state.
			 *
			 * @param {boolean} isActive
			 */
			setCopilotState(isActive) {
				this.isCopilotActive = isActive;
			},
			/**
			 * Sets copilot features enabled flag.
			 *
			 * @param {boolean} isEnabled
			 */
			setCopilotFeaturesEnabled(isEnabled) {
				this.isCopilotFeaturesEnabled = isEnabled;
			},
			// endregion Copilot actions

			// region Conference actions

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
					const parsed = parseInt(id, 10);
					if (!this.conferenceUsers.includes(parsed)) {
						this.conferenceUsers.push(parsed);
					}
				});
			},
			removeConferenceUsers(userIds) {
				const ids = Array.isArray(userIds) ? userIds : [userIds];
				const idsToRemove = new Set(ids.map(id => parseInt(id, 10)));
				this.conferenceUsers = this.conferenceUsers.filter(id => !idsToRemove.has(id));
			},
			addConferenceUsersInCall(userIds) {
				const ids = Array.isArray(userIds) ? userIds : [userIds];
				ids.forEach(id => {
					const parsed = parseInt(id, 10);
					if (!this.conferenceUsersInCall.includes(parsed)) {
						this.conferenceUsersInCall.push(parsed);
					}
				});
			},
			removeConferenceUsersInCall(userIds) {
				const ids = Array.isArray(userIds) ? userIds : [userIds];
				const idsToRemove = new Set(ids.map(id => parseInt(id, 10)));
				this.conferenceUsersInCall = this.conferenceUsersInCall.filter(id => !idsToRemove.has(id));
			},
			setConferencePresenters(presenters, replace = false) {
				const ids = Array.isArray(presenters) ? presenters : [presenters];
				if (replace) {
					this.conferencePresenters = ids.map(id => parseInt(id, 10));
				} else {
					ids.forEach(id => {
						const parsed = parseInt(id, 10);
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
			},
			resetAll() {
				this.$reset();
			}

			// endregion Conference actions
		}
	});

	exports.useCallStore = useCallStore;

})(this.BX.Call.Store = this.BX.Call.Store || {}, BX.Vue3.Pinia);
//# sourceMappingURL=call-store.bundle.js.map
