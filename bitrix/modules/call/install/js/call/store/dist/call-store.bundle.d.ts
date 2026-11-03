/* eslint-disable */
type CallStoreState = {
	callState: CallState;
	callId: number | null;
	callUuid: string | null;
	callProvider: string | null;
	callScheme: string | null;
	callType: string | null;
	associatedEntityId: number | null;
	associatedEntityType: string | null;
	isIncoming: boolean;
	callMode: CallMode;
	conferenceTitle: string;
	conferenceState: ConferenceState;
	conferenceCallEnded: boolean;
	conferenceStarted: boolean | null;
	conferenceStartDate: string | null;
	conferenceInited: boolean;
	conferenceAlias: string;
	conferenceError: string;
	conferenceComponentError: string;
	conferenceUsers: number[];
	conferenceUsersInCall: number[];
	conferencePresenters: number[];
	conferenceUserCount: number;
	conferenceMessageCount: number;
	conferenceUserInCallCount: number;
	currentUserHash: string;
	conferencePassChecked: boolean;
	conferenceShowChat: boolean;
	conferenceShowSmiles: boolean;
	conferencePermissionsRequested: boolean;
	conferenceJoinWithVideo: boolean | null;
	conferenceUserReadyToJoin: boolean;
	conferenceIsBroadcast: boolean;
	conferenceRightPanelMode: ConferenceRightPanelMode;
	conferenceHasErrorInCall: boolean;
};

/**
 * Lifecycle + conference state.
 *
 * Per-user / media / UI / recording state lives in their respective entity stores:
 * - {@link useUsersStore} — participants (incl. self), pin state via `usersStore`
 * - {@link useMediaStore} — local hardware (stream, devices, flip)
 * - {@link useUiStore} — layout, panels, notifications, buttons, copilot
 * - {@link useRecordingStore} — recording state
 *
 * This store is reserved for call lifecycle (callId/callState) and conference-specific
 * facts that don't fit elsewhere yet. As conference UI migrates, these may move into
 * a dedicated `useConferenceStore`.
 */
type CallState = 'Idle' | 'Proceeding' | 'Connected' | 'Held' | 'Disconnected';

type CallMode = 'direct' | 'group' | 'conference';

type ConferenceState = 'preparation' | 'call';

type ConferenceRightPanelMode = 'hidden' | 'chat' | 'users';

type InitCallParams = {
	callId?: number | null;
	callUuid?: string | null;
	callProvider?: string | null;
	callScheme?: string | null;
	callType?: string | null;
	associatedEntityId?: number | null;
	associatedEntityType?: string | null;
	isIncoming?: boolean;
};

type ConferenceCommonFields = {
	inited?: boolean;
	passChecked?: boolean;
	userCount?: number;
	messageCount?: number;
	userInCallCount?: number;
	isBroadcast?: boolean;
	hasErrorInCall?: boolean;
	showSmiles?: boolean;
	error?: string;
	componentError?: string;
	alias?: string;
};

type CallIncomingStoreState = {
	callType: IncomingCallType;
	callerName: string;
	callerAvatar: string;
	callerType: string;
	callerColor: string | null;
	video: boolean;
	hasCamera: boolean;
	initialMicrophoneState: boolean;
	initialCameraState: boolean;
	isDesktop: boolean;
};

type IncomingCallType = 'regular' | 'conference';

type IncomingCallParams = {
	callType?: string;
	callerName?: string;
	callerAvatar?: string;
	callerType?: string;
	callerColor?: string;
	video?: boolean;
	hasCamera?: boolean;
	microphoneState?: boolean;
	cameraState?: boolean;
	isDesktop?: boolean;
};

type UsersStoreState = {
	users: UsersMap;
	currentUserId: number | null;
	speakerId: number | null;
	raiseHandQueue: number[];
	talkingQueue: number[];
};

type UsersMap = Record<number, User>;

interface User {
	id: number;
	name: string;
	avatar: string;
	state: UserState;
	microphoneState: boolean;
	cameraState: boolean;
	screenSharingState: boolean;
	talking: boolean;
	floorRequestState: boolean;
	connectionQuality: number;
	videoPaused: boolean;
	streamVersion: number;
}

type UserState = 'Idle' | 'Calling' | 'Connecting' | 'Connected' | 'Reconnecting' | 'Declined' | 'Busy' | 'Unavailable' | 'Disconnected' | 'Failed';

type MediaStoreState = {
	localStreamVersion: number;
	flipLocalVideo: boolean;
	hasLocalVideo: boolean;
	hasLocalAudio: boolean;
	microphoneDeviceId: string | null;
	cameraDeviceId: string | null;
	speakerDeviceId: string | null;
	isSpeakerMuted: boolean;
	connectionQuality: number;
	_bridge: CallActionBridge | null;
};

type CallActionBridge = {
	emit: (eventName: string, data: Record<string, unknown>) => void;
};

type UiStoreState = {
	viewState: ViewState;
	isFullScreen: boolean;
	layout: LayoutMode;
	uiState: UiState;
	callTitle: string;
	size: ViewSize;
	maxWidth: number | null;
	isWindowFocus: boolean;
	roomState: string;
	pinnedUserId: number | null;
	layoutWidth: number;
	layoutHeight: number;
	layoutContentHeight: number;
	isCopilotActive: boolean;
	isCopilotFeaturesEnabled: boolean;
	buttons: Record<string, ButtonState>;
	notifications: Notification[];
	notificationTick: number;
	confirmModal: ConfirmModal;
	isRenameSliderOpen: boolean;
	_bridge: CallActionBridge | null;
};

type ViewState = 'Closed' | 'Folded' | 'Opened';

type LayoutMode = 'Grid' | 'Centered' | 'Mobile';

type UiState = 'Idle' | 'Preparing' | 'Connecting' | 'Connected' | 'Reconnecting' | 'Error';

type ViewSize = 'full' | 'compact';

type ButtonState = {
	active: boolean;
	blocked: boolean;
	visible: boolean;
	counter: number;
};

type Notification = {
	id: string;
	type: string;
	data: Record<string, unknown>;
	createdAt: number;
	ttl: number;
};

type ConfirmModal = {
	visible: boolean;
	title: string;
	message: string;
	buttons: ConfirmModalButton[];
	promiseId: string | null;
};

type ConfirmModalButton = {
	text: string;
	action: string;
	type?: string;
};

type RecordingStoreState = {
	state: RecordState;
	type: RecordType;
	initiatorId: number | null;
	startedAt: number | null;
	_bridge: CallActionBridge | null;
};

type RecordState = 'Inactive' | 'Recording' | 'Paused' | 'Destroyed';

type RecordType = 'video' | 'audio' | null;

type CallStoreInstance = ReturnType<typeof BX.Call.Store.useCallStore>;

type CallIncomingStoreInstance = ReturnType<typeof BX.Call.Store.useCallIncomingStore>;

type UsersStoreInstance = ReturnType<typeof BX.Call.Store.useUsersStore>;

type MediaStoreInstance = ReturnType<typeof BX.Call.Store.useMediaStore>;

type UiStoreInstance = ReturnType<typeof BX.Call.Store.useUiStore>;

type RecordingStoreInstance = ReturnType<typeof BX.Call.Store.useRecordingStore>;

declare namespace BX.Call.Store {
	const useCallStore: import("ui.vue3.pinia").StoreDefinition<"call-core", CallStoreState, {
		isConferenceCallActive: (state: {
			callState: CallState;
			callId: number | null;
			callUuid: string | null;
			callProvider: string | null;
			callScheme: string | null;
			callType: string | null;
			associatedEntityId: number | null;
			associatedEntityType: string | null;
			isIncoming: boolean;
			callMode: CallMode;
			conferenceTitle: string;
			conferenceState: ConferenceState;
			conferenceCallEnded: boolean;
			conferenceStarted: boolean | null;
			conferenceStartDate: string | null;
			conferenceInited: boolean;
			conferenceAlias: string;
			conferenceError: string;
			conferenceComponentError: string;
			conferenceUsers: number[];
			conferenceUsersInCall: number[];
			conferencePresenters: number[];
			conferenceUserCount: number;
			conferenceMessageCount: number;
			conferenceUserInCallCount: number;
			currentUserHash: string;
			conferencePassChecked: boolean;
			conferenceShowChat: boolean;
			conferenceShowSmiles: boolean;
			conferencePermissionsRequested: boolean;
			conferenceJoinWithVideo: boolean | null;
			conferenceUserReadyToJoin: boolean;
			conferenceIsBroadcast: boolean;
			conferenceRightPanelMode: ConferenceRightPanelMode;
			conferenceHasErrorInCall: boolean;
		} & import("ui.vue3.pinia").PiniaCustomStateProperties<CallStoreState>) => boolean;
	}, {
		initCall(params?: InitCallParams): void;
		resetCall(): void;
		setCallMode(mode: CallMode): void;
		setConferenceTitle(title: string): void;
		setConferenceCommon(fields: ConferenceCommonFields): void;
		setCurrentUserHash(hash: string): void;
		startConferenceCall(): void;
		endConferenceCall(): void;
		returnToPreparation(): void;
		addConferenceUsers(userIds: number | number[]): void;
		removeConferenceUsers(userIds: number | number[]): void;
		addConferenceUsersInCall(userIds: number | number[]): void;
		removeConferenceUsersInCall(userIds: number | number[]): void;
		setConferencePresenters(presenters: number | number[], replace?: boolean): void;
		setConferenceShowChat(newState: boolean): void;
		setConferenceRightPanelMode(mode: ConferenceRightPanelMode): void;
		setConferencePermissionsRequested(status: boolean): void;
		setConferenceJoinWithVideo(value: boolean | null): void;
		setConferenceUserReadyToJoin(): void;
		setConferenceStatus(started: boolean | null): void;
		setConferenceStartDate(date: string | null): void;
		setConferenceAlias(alias: string): void;
		setConferenceBroadcastMode(mode: boolean): void;
		setConferenceError(errorCode: string): void;
		toggleConferenceSmiles(): void;
		setConferenceHasErrorInCall(value: boolean): void;
		resetConference(): void;
	}>;

	const useCallIncomingStore: import("ui.vue3.pinia").StoreDefinition<"call-incoming", CallIncomingStoreState, {}, {
		initFromParams(params: IncomingCallParams): void;
		setHasCamera(value: boolean): void;
	}>;

	const useUsersStore: import("ui.vue3.pinia").StoreDefinition<"callUsers", UsersStoreState, {
		userById: (state: {
			users: UsersMap;
			currentUserId: number | null;
			speakerId: number | null;
			raiseHandQueue: number[];
			talkingQueue: number[];
		} & import("ui.vue3.pinia").PiniaCustomStateProperties<UsersStoreState>) => (userId: number) => User | null;
		currentUser: (state: {
			users: UsersMap;
			currentUserId: number | null;
			speakerId: number | null;
			raiseHandQueue: number[];
			talkingQueue: number[];
		} & import("ui.vue3.pinia").PiniaCustomStateProperties<UsersStoreState>) => User | null;
		isCurrentUser: (state: {
			users: UsersMap;
			currentUserId: number | null;
			speakerId: number | null;
			raiseHandQueue: number[];
			talkingQueue: number[];
		} & import("ui.vue3.pinia").PiniaCustomStateProperties<UsersStoreState>) => (userId: number) => boolean;
		usersArray: (state: {
			users: UsersMap;
			currentUserId: number | null;
			speakerId: number | null;
			raiseHandQueue: number[];
			talkingQueue: number[];
		} & import("ui.vue3.pinia").PiniaCustomStateProperties<UsersStoreState>) => User[];
		userIds: (state: {
			users: UsersMap;
			currentUserId: number | null;
			speakerId: number | null;
			raiseHandQueue: number[];
			talkingQueue: number[];
		} & import("ui.vue3.pinia").PiniaCustomStateProperties<UsersStoreState>) => number[];
		connectedUsers: (state: {
			users: UsersMap;
			currentUserId: number | null;
			speakerId: number | null;
			raiseHandQueue: number[];
			talkingQueue: number[];
		} & import("ui.vue3.pinia").PiniaCustomStateProperties<UsersStoreState>) => User[];
		talkingUsers: (state: {
			users: UsersMap;
			currentUserId: number | null;
			speakerId: number | null;
			raiseHandQueue: number[];
			talkingQueue: number[];
		} & import("ui.vue3.pinia").PiniaCustomStateProperties<UsersStoreState>) => User[];
		speakerUser: (state: {
			users: UsersMap;
			currentUserId: number | null;
			speakerId: number | null;
			raiseHandQueue: number[];
			talkingQueue: number[];
		} & import("ui.vue3.pinia").PiniaCustomStateProperties<UsersStoreState>) => User | null;
		raiseHandUsers: (state: {
			users: UsersMap;
			currentUserId: number | null;
			speakerId: number | null;
			raiseHandQueue: number[];
			talkingQueue: number[];
		} & import("ui.vue3.pinia").PiniaCustomStateProperties<UsersStoreState>) => User[];
		streamForUser(state: {
			users: UsersMap;
			currentUserId: number | null;
			speakerId: number | null;
			raiseHandQueue: number[];
			talkingQueue: number[];
		} & import("ui.vue3.pinia").PiniaCustomStateProperties<UsersStoreState>): (userId: number) => MediaStream | null;
		mirrorFor(state: {
			users: UsersMap;
			currentUserId: number | null;
			speakerId: number | null;
			raiseHandQueue: number[];
			talkingQueue: number[];
		} & import("ui.vue3.pinia").PiniaCustomStateProperties<UsersStoreState>): (userId: number) => boolean;
	}, {
		setCurrentUser(userId: number, fields?: Partial<User>): void;
		clearCurrentUser(): void;
		upsertUser(userId: number | string, fields?: Partial<User>): void;
		updateUser(userId: number | string, fields: Partial<User>): void;
		removeUser(userId: number | string): void;
		setSpeaker(userId: number | null): void;
		incrementStreamVersion(userId: number | string): void;
		addRaiseHand(userId: number | string): void;
		removeRaiseHand(userId: number | string): void;
		clearRaiseHands(): void;
		setFloorRequest(userId: number | string, raised: boolean): void;
		refreshTalkingQueue(): void;
		toggleRaiseHand(): void;
		resetUsers(): void;
	}>;

	const useMediaStore: import("ui.vue3.pinia").StoreDefinition<"callMedia", MediaStoreState, {
		localStream(state: {
			localStreamVersion: number;
			flipLocalVideo: boolean;
			hasLocalVideo: boolean;
			hasLocalAudio: boolean;
			microphoneDeviceId: string | null;
			cameraDeviceId: string | null;
			speakerDeviceId: string | null;
			isSpeakerMuted: boolean;
			connectionQuality: number;
			_bridge: {
				emit: (eventName: string, data: Record<string, unknown>) => void;
			} | null;
		} & import("ui.vue3.pinia").PiniaCustomStateProperties<MediaStoreState>): MediaStream | null;
		isMicrophoneMuted(): boolean;
		isCameraOn(): boolean;
		isScreenSharingActive(): boolean;
	}, {
		setFlipLocalVideo(flip: boolean): void;
		setLocalMediaMetadata(fields: {
			hasLocalVideo?: boolean;
			hasLocalAudio?: boolean;
		}): void;
		setDeviceIds(fields: {
			microphoneId?: string | null;
			cameraId?: string | null;
			speakerId?: string | null;
		}): void;
		setSpeakerMuted(muted: boolean): void;
		setConnectionQuality(quality: number): void;
		incrementLocalStreamVersion(): void;
		attachBridge(bridge: CallActionBridge): void;
		detachBridge(): void;
		toggleMicrophone(): void;
		toggleCamera(): void;
		toggleScreenSharing(): void;
		toggleRaiseHand(): void;
	}>;

	const useUiStore: import("ui.vue3.pinia").StoreDefinition<"callUi", UiStoreState, {
		isGridMode: (state: {
			viewState: ViewState;
			isFullScreen: boolean;
			layout: LayoutMode;
			uiState: UiState;
			callTitle: string;
			size: ViewSize;
			maxWidth: number | null;
			isWindowFocus: boolean;
			roomState: string;
			pinnedUserId: number | null;
			layoutWidth: number;
			layoutHeight: number;
			layoutContentHeight: number;
			isCopilotActive: boolean;
			isCopilotFeaturesEnabled: boolean;
			buttons: Record<string, ButtonState>;
			notifications: {
				id: string;
				type: string;
				data: Record<string, unknown>;
				createdAt: number;
				ttl: number;
			}[];
			notificationTick: number;
			confirmModal: {
				visible: boolean;
				title: string;
				message: string;
				buttons: {
					text: string;
					action: string;
					type?: string | undefined;
				}[];
				promiseId: string | null;
			};
			isRenameSliderOpen: boolean;
			_bridge: {
				emit: (eventName: string, data: Record<string, unknown>) => void;
			} | null;
		} & import("ui.vue3.pinia").PiniaCustomStateProperties<UiStoreState>) => boolean;
		isCenteredMode: (state: {
			viewState: ViewState;
			isFullScreen: boolean;
			layout: LayoutMode;
			uiState: UiState;
			callTitle: string;
			size: ViewSize;
			maxWidth: number | null;
			isWindowFocus: boolean;
			roomState: string;
			pinnedUserId: number | null;
			layoutWidth: number;
			layoutHeight: number;
			layoutContentHeight: number;
			isCopilotActive: boolean;
			isCopilotFeaturesEnabled: boolean;
			buttons: Record<string, ButtonState>;
			notifications: {
				id: string;
				type: string;
				data: Record<string, unknown>;
				createdAt: number;
				ttl: number;
			}[];
			notificationTick: number;
			confirmModal: {
				visible: boolean;
				title: string;
				message: string;
				buttons: {
					text: string;
					action: string;
					type?: string | undefined;
				}[];
				promiseId: string | null;
			};
			isRenameSliderOpen: boolean;
			_bridge: {
				emit: (eventName: string, data: Record<string, unknown>) => void;
			} | null;
		} & import("ui.vue3.pinia").PiniaCustomStateProperties<UiStoreState>) => boolean;
		isMobileMode: (state: {
			viewState: ViewState;
			isFullScreen: boolean;
			layout: LayoutMode;
			uiState: UiState;
			callTitle: string;
			size: ViewSize;
			maxWidth: number | null;
			isWindowFocus: boolean;
			roomState: string;
			pinnedUserId: number | null;
			layoutWidth: number;
			layoutHeight: number;
			layoutContentHeight: number;
			isCopilotActive: boolean;
			isCopilotFeaturesEnabled: boolean;
			buttons: Record<string, ButtonState>;
			notifications: {
				id: string;
				type: string;
				data: Record<string, unknown>;
				createdAt: number;
				ttl: number;
			}[];
			notificationTick: number;
			confirmModal: {
				visible: boolean;
				title: string;
				message: string;
				buttons: {
					text: string;
					action: string;
					type?: string | undefined;
				}[];
				promiseId: string | null;
			};
			isRenameSliderOpen: boolean;
			_bridge: {
				emit: (eventName: string, data: Record<string, unknown>) => void;
			} | null;
		} & import("ui.vue3.pinia").PiniaCustomStateProperties<UiStoreState>) => boolean;
		isUserPinned: (state: {
			viewState: ViewState;
			isFullScreen: boolean;
			layout: LayoutMode;
			uiState: UiState;
			callTitle: string;
			size: ViewSize;
			maxWidth: number | null;
			isWindowFocus: boolean;
			roomState: string;
			pinnedUserId: number | null;
			layoutWidth: number;
			layoutHeight: number;
			layoutContentHeight: number;
			isCopilotActive: boolean;
			isCopilotFeaturesEnabled: boolean;
			buttons: Record<string, ButtonState>;
			notifications: {
				id: string;
				type: string;
				data: Record<string, unknown>;
				createdAt: number;
				ttl: number;
			}[];
			notificationTick: number;
			confirmModal: {
				visible: boolean;
				title: string;
				message: string;
				buttons: {
					text: string;
					action: string;
					type?: string | undefined;
				}[];
				promiseId: string | null;
			};
			isRenameSliderOpen: boolean;
			_bridge: {
				emit: (eventName: string, data: Record<string, unknown>) => void;
			} | null;
		} & import("ui.vue3.pinia").PiniaCustomStateProperties<UiStoreState>) => (userId: number) => boolean;
		isButtonBlocked: (state: {
			viewState: ViewState;
			isFullScreen: boolean;
			layout: LayoutMode;
			uiState: UiState;
			callTitle: string;
			size: ViewSize;
			maxWidth: number | null;
			isWindowFocus: boolean;
			roomState: string;
			pinnedUserId: number | null;
			layoutWidth: number;
			layoutHeight: number;
			layoutContentHeight: number;
			isCopilotActive: boolean;
			isCopilotFeaturesEnabled: boolean;
			buttons: Record<string, ButtonState>;
			notifications: {
				id: string;
				type: string;
				data: Record<string, unknown>;
				createdAt: number;
				ttl: number;
			}[];
			notificationTick: number;
			confirmModal: {
				visible: boolean;
				title: string;
				message: string;
				buttons: {
					text: string;
					action: string;
					type?: string | undefined;
				}[];
				promiseId: string | null;
			};
			isRenameSliderOpen: boolean;
			_bridge: {
				emit: (eventName: string, data: Record<string, unknown>) => void;
			} | null;
		} & import("ui.vue3.pinia").PiniaCustomStateProperties<UiStoreState>) => (buttonName: string) => boolean;
		isButtonVisible: (state: {
			viewState: ViewState;
			isFullScreen: boolean;
			layout: LayoutMode;
			uiState: UiState;
			callTitle: string;
			size: ViewSize;
			maxWidth: number | null;
			isWindowFocus: boolean;
			roomState: string;
			pinnedUserId: number | null;
			layoutWidth: number;
			layoutHeight: number;
			layoutContentHeight: number;
			isCopilotActive: boolean;
			isCopilotFeaturesEnabled: boolean;
			buttons: Record<string, ButtonState>;
			notifications: {
				id: string;
				type: string;
				data: Record<string, unknown>;
				createdAt: number;
				ttl: number;
			}[];
			notificationTick: number;
			confirmModal: {
				visible: boolean;
				title: string;
				message: string;
				buttons: {
					text: string;
					action: string;
					type?: string | undefined;
				}[];
				promiseId: string | null;
			};
			isRenameSliderOpen: boolean;
			_bridge: {
				emit: (eventName: string, data: Record<string, unknown>) => void;
			} | null;
		} & import("ui.vue3.pinia").PiniaCustomStateProperties<UiStoreState>) => (buttonName: string) => boolean;
		buttonCounter: (state: {
			viewState: ViewState;
			isFullScreen: boolean;
			layout: LayoutMode;
			uiState: UiState;
			callTitle: string;
			size: ViewSize;
			maxWidth: number | null;
			isWindowFocus: boolean;
			roomState: string;
			pinnedUserId: number | null;
			layoutWidth: number;
			layoutHeight: number;
			layoutContentHeight: number;
			isCopilotActive: boolean;
			isCopilotFeaturesEnabled: boolean;
			buttons: Record<string, ButtonState>;
			notifications: {
				id: string;
				type: string;
				data: Record<string, unknown>;
				createdAt: number;
				ttl: number;
			}[];
			notificationTick: number;
			confirmModal: {
				visible: boolean;
				title: string;
				message: string;
				buttons: {
					text: string;
					action: string;
					type?: string | undefined;
				}[];
				promiseId: string | null;
			};
			isRenameSliderOpen: boolean;
			_bridge: {
				emit: (eventName: string, data: Record<string, unknown>) => void;
			} | null;
		} & import("ui.vue3.pinia").PiniaCustomStateProperties<UiStoreState>) => (buttonName: string) => number;
		activeNotifications: (state: {
			viewState: ViewState;
			isFullScreen: boolean;
			layout: LayoutMode;
			uiState: UiState;
			callTitle: string;
			size: ViewSize;
			maxWidth: number | null;
			isWindowFocus: boolean;
			roomState: string;
			pinnedUserId: number | null;
			layoutWidth: number;
			layoutHeight: number;
			layoutContentHeight: number;
			isCopilotActive: boolean;
			isCopilotFeaturesEnabled: boolean;
			buttons: Record<string, ButtonState>;
			notifications: {
				id: string;
				type: string;
				data: Record<string, unknown>;
				createdAt: number;
				ttl: number;
			}[];
			notificationTick: number;
			confirmModal: {
				visible: boolean;
				title: string;
				message: string;
				buttons: {
					text: string;
					action: string;
					type?: string | undefined;
				}[];
				promiseId: string | null;
			};
			isRenameSliderOpen: boolean;
			_bridge: {
				emit: (eventName: string, data: Record<string, unknown>) => void;
			} | null;
		} & import("ui.vue3.pinia").PiniaCustomStateProperties<UiStoreState>) => Notification[];
	}, {
		setViewState(viewState: ViewState): void;
		setFullScreen(value: boolean): void;
		setLayout(layout: LayoutMode): void;
		setUiState(uiState: UiState): void;
		setCallTitle(title: string): void;
		setSize(size: ViewSize): void;
		setMaxWidth(maxWidth: number | null): void;
		setWindowFocus(focus: boolean): void;
		setRoomState(state: string): void;
		setLayoutDimensions(fields: {
			layoutWidth?: number;
			layoutHeight?: number;
			layoutContentHeight?: number;
		}): void;
		setPinnedUser(userId: number | null): void;
		togglePinnedUser(userId: number): void;
		setCopilotActive(value: boolean): void;
		setCopilotFeaturesEnabled(value: boolean): void;
		closeRenameSlider(): void;
		setButtonState(buttonName: string, fields: Partial<ButtonState>): void;
		blockButtons(names: string[]): void;
		unblockButtons(names: string[]): void;
		showButtons(names: string[]): void;
		hideButtons(names: string[]): void;
		addNotification(type: string, data: Record<string, unknown>): string;
		removeNotification(id: string): void;
		refreshNotificationTick(): void;
		showConfirmModal(params: Partial<ConfirmModal>): void;
		hideConfirmModal(): void;
		attachBridge(bridge: CallActionBridge): void;
		detachBridge(): void;
		toggleChat(): void;
		toggleFollowUp(): void;
		hangup(): void;
	}>;

	const useRecordingStore: import("ui.vue3.pinia").StoreDefinition<"callRecording", RecordingStoreState, {
		isActive: (state: {
			state: RecordState;
			type: RecordType;
			initiatorId: number | null;
			startedAt: number | null;
			_bridge: {
				emit: (eventName: string, data: Record<string, unknown>) => void;
			} | null;
		} & import("ui.vue3.pinia").PiniaCustomStateProperties<RecordingStoreState>) => boolean;
		isPaused: (state: {
			state: RecordState;
			type: RecordType;
			initiatorId: number | null;
			startedAt: number | null;
			_bridge: {
				emit: (eventName: string, data: Record<string, unknown>) => void;
			} | null;
		} & import("ui.vue3.pinia").PiniaCustomStateProperties<RecordingStoreState>) => boolean;
		duration(state: {
			state: RecordState;
			type: RecordType;
			initiatorId: number | null;
			startedAt: number | null;
			_bridge: {
				emit: (eventName: string, data: Record<string, unknown>) => void;
			} | null;
		} & import("ui.vue3.pinia").PiniaCustomStateProperties<RecordingStoreState>): number;
	}, {
		setState(fields: {
			state?: RecordState;
			type?: RecordType;
			initiatorId?: number | null;
		}): void;
		setStartedAt(timestamp: number | null): void;
		attachBridge(bridge: CallActionBridge): void;
		detachBridge(): void;
		menuAction(state: "started" | "stopped" | "paused" | "resumed" | "destroyed", kind: "audio" | "video" | "none"): void;
	}>;
}
