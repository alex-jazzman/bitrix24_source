export const CallState = {
	Idle: 'Idle',
	Proceeding: 'Proceeding',
	Connected: 'Connected',
	Finished: 'Finished'
};

export const UserState = {
	Idle: 'Idle',
	Busy: 'Busy',
	Calling: 'Calling',
	Unavailable: 'Unavailable',
	Declined: 'Declined',
	Ready: 'Ready',
	Connecting: 'Connecting',
	Connected: 'Connected',
	Failed: 'Failed'
};

export const EndpointDirection = {
	SendOnly: 'send',
	RecvOnly: 'recv',
	SendRecv: 'sendrecv',
};

export const CallType = {
	Instant: 1,
	Permanent: 2,
	Large: 3,
};

export const RoomType = {
	Small: 1,
	Conference: 2,
	Large: 3,
	Personal: 4,
};

export const Provider = {
	Plain: 'Plain',
	Bitrix: 'Bitrix',
};

export const StreamTag = {
	Main: 'main',
	Screen: 'screen'
};

export const Direction = {
	Incoming: 'Incoming',
	Outgoing: 'Outgoing'
};

export const Quality = {
	VeryHigh: "very_high",
	High: "high",
	Medium: "medium",
	Low: "low",
	VeryLow: "very_low"
};

export const StartCallErrorCode = {
	AuthorizeError: 'AUTHORIZE_ERROR',
	BlankAnswer: 'BLANK_ANSWER',
	BlankAnswerWithErrorCode: 'BLANK_ANSWER_WITH_ERROR_CODE',
	ErrorUnexpectedAnswer: 'ERROR_UNEXPECTED_ANSWER',
	AccessDenied: 'ACCESS_DENIED',
	NetworkError: 'NETWORK_ERROR',
	NoWebrtc: 'NO_WEBRTC',
	NotAllowedError: 'NotAllowedError',
	NotReadableError: 'NotReadableError',
	UnknownError: 'UNKNOWN_ERROR',
};

export const DisconnectReason = {
	SecurityKeyChanged: 'SECURITY_KEY_CHANGED',
	RoomClosed: 'ROOM_CLOSED',
	SignalingReconnectCooldown: 'SIGNALING_RECONNECT_COOLDOWN',
};

export const UserMnemonic = {
	all: 'all',
	none: 'none'
};

export const CallEvent = {
	onUserInvited: 'onUserInvited',
	onUserJoined: 'onUserJoined',
	onUserStateChanged: 'onUserStateChanged',
	onUserMicrophoneState: 'onUserMicrophoneState',
	onUserCameraState: 'onUserCameraState',
	onCameraPublishing: 'onCameraPublishing',
	onMicrophonePublishing: 'onMicrophonePublishing',
	onNeedResetMediaDevicesState: 'onNeedResetMediaDevicesState',
	onUserVideoPaused: 'onUserVideoPaused',
	onUserScreenState: 'onUserScreenState',
	onUserCommonRecordState: 'onUserCommonRecordState',
	onUserVoiceStarted: 'onUserVoiceStarted',
	onUserVoiceStopped: 'onUserVoiceStopped',
	onUserFloorRequest: 'onUserFloorRequest',
	onTurnOnCamera: 'onTurnOnCamera',
	onAllParticipantsAudioMuted: 'onAllParticipantsAudioMuted',
	onAllParticipantsVideoMuted: 'onAllParticipantsVideoMuted',
	onAllParticipantsScreenshareMuted: 'onAllParticipantsScreenshareMuted',
	onYouMuteAllParticipants: 'onYouMuteAllParticipants',
	onRoomSettingsChanged: 'onRoomSettingsChanged',
	onUserPermissionsChanged: 'onUserPermissionsChanged',
	onUserRoleChanged: 'onUserRoleChanged',
	onParticipantMuted: 'onParticipantMuted',
	onUserEmotion: 'onUserEmotion',
	onTrackSubscriptionFailed: 'onTrackSubscriptionFailed',
	onUserStatsReceived: 'onUserStatsReceived',
	onCustomMessage: 'onCustomMessage',
	onLocalMediaReceived: 'onLocalMediaReceived',
	onLocalMediaStopped: 'onLocalMediaStopped',
	onLocalScreenUpdated: 'onLocalScreenUpdated',
	onMicrophoneLevel: 'onMicrophoneLevel',
	onDeviceListUpdated: 'onDeviceListUpdated',
	onRTCStatsReceived: 'onRTCStatsReceived',
	onCallFailure: 'onCallFailure',
	onRemoteMediaAvailable: 'onRemoteMediaAvailable',
	onRemoteMediaUnavailable: 'onRemoteMediaUnavailable',
	onRemoteMediaReceived: 'onRemoteMediaReceived',
	onRemoteMediaStopped: 'onRemoteMediaStopped',
	onBadNetworkIndicator: 'onBadNetworkIndicator',
	onConnectionQualityChanged: 'onConnectionQualityChanged',
	onNetworkProblem: 'onNetworkProblem',
	onReconnecting: 'onReconnecting',
	onReconnected: 'onReconnected',
	onReconnectingFailed: 'onReconnectingFailed',
	onParticipantReconnecting: 'onParticipantReconnecting',
	onParticipantReconnected: 'onParticipantReconnected',
	onJoin: 'onJoin',
	onLeave: 'onLeave',
	onJoinRoomOffer: 'onJoinRoomOffer',
	onJoinRoom: 'onJoinRoom',
	onLeaveRoom: 'onLeaveRoom',
	onListRooms: 'onListRooms',
	onUpdateRoom: 'onUpdateRoom',
	onTransferRoomSpeakerRequest: 'onTransferRoomSpeakerRequest',
	onTransferRoomSpeaker: 'onTransferRoomSpeaker',
	onDestroy: 'onDestroy',
	onGetUserMediaEnded: 'onGetUserMediaEnded',
	onGetUserMediaFailed: 'onGetUserMediaFailed',
	onUpdateLastUsedCameraId: 'onUpdateLastUsedCameraId',
	onToggleRemoteParticipantVideo: 'onToggleRemoteParticipantVideo',
	onSwitchTrackRecordStatus: 'onSwitchTrackRecordStatus',
	onRecorderStatusChanged: 'onRecorderStatusChanged',
	onCloudRecordStatusChanged: 'onCloudRecordStatusChanged',
	onSpeakerConfirmed: 'onSpeakerConfirmed',
	onSpeakerFallback: 'onSpeakerFallback',
};

export const CallScheme = {
	classic: 1,
	jwt: 2,
};
