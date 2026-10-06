export const ClientPlatform = 'web';
export const ClientVersion = '1.0.0';
export const MediaStreamsKinds = {
	Camera: 1,
	Microphone: 2,
	Screen: 3,
	ScreenAudio: 4,
};

export const CALL_STATE = {
	CONNECTED: 'Connected',
	PROGRESSING: 'Progressing',
	TERMINATED: 'Terminated',
};

export const VIDEO_QUEUE = {
	INITIAL: '',
	ENABLE: 'enable',
	DISABLE: 'disable',
};

export const AUDIO_QUEUE = {
	INITIAL: '',
	ENABLE: 'enable',
	DISABLE: 'disable',
};

export const MONITORING_METRICS = {
	COUNT_TRACKS: 'COUNT_TRACKS',
	COUNT_VIDEO_TRACKS: 'COUNT_VIDEO_TRACKS',
	COUNT_AUDIO_TRACKS: 'COUNT_AUDIO_TRACKS',
	PACKET_LOST_RECEIVE: 'PACKET_LOST_RECEIVE',
	PACKET_LOST_SEND: 'PACKET_LOST_SEND',
	BITRATE_IN: 'BITRATE_IN',
	BITRATE_OUT: 'BITRATE_OUT',
	CONN_SCORE_CURRENT: 'CONN_SCORE_CURRENT',
	FRAMES_LOSS: 'FRAMES_LOSS',
	FREEZE_COUNT: 'FREEZE_COUNT',
	TOTAL_FREEZE_DURATION: 'TOTAL_FREEZE_DURATION',
	JITTER: 'JITTER',
	FRAMES_DECODED: 'FRAMES_DECODED',
	FRAMES_DROPPED: 'FRAMES_DROPPED',
	FRAMES_RECEIVED: 'FRAMES_RECEIVED',
};

export const MONITORING_METRICS_PROMETHEUS = {
	COUNT_TRACKS: 'webrtc_active_tracks',
	COUNT_VIDEO_TRACKS: 'webrtc_active_video_tracks',
	COUNT_AUDIO_TRACKS: 'webrtc_active_audio_tracks',
	PACKET_LOST_RECEIVE: 'webrtc_packets_lost_receive_total',
	PACKET_LOST_SEND: 'webrtc_packets_lost_send_total',
	BITRATE_IN: 'webrtc_bitrate_receive_bps',
	BITRATE_OUT: 'webrtc_bitrate_send_bps',
	CONN_SCORE_CURRENT: 'webrtc_connection_score',
	FRAMES_LOSS: 'webrtc_frames_lost_total',
	FREEZE_COUNT: 'webrtc_freeze_count_total',
	TOTAL_FREEZE_DURATION: 'webrtc_freeze_duration_seconds_total',
	JITTER: 'webrtc_jitter_seconds',
	FRAMES_DECODED: 'webrtc_frames_decoded_total',
	FRAMES_DROPPED: 'webrtc_frames_dropped_total',
	FRAMES_RECEIVED: 'webrtc_frames_received_total',
};

export const RecorderStatus = {
	UNAVAILABLE: 0, // recording not available at the moment
	NONE: 1, // recording not started but available
	ENABLED: 2, // recording started and not paused
	DISABLED: 3, // recording stopped and can not be resumed
	PAUSED: 4, // recording started and paused
	DESTROYED: 5, // recording will be aborted and no results will be provided
};

export const CloudRecordStatus = {
	NONE: 1, // record not started
	STARTED: 2, // record started and not paused
	STOPPED: 3, // record stopped and can not be resumed
	PAUSED: 4, // record started and paused
	DESTROYED: 5, // record will be aborted and no results will be provided
};

export const CloudRecordKind = {
	AUDIO: 1,
	VIDEO: 2,
};

export const JoinRequestFailedCodes = {
	CanNotCreateRoom: 1,
	InputError: 2,
	AccessDenied: 3,
	RoomNotFound: 5,
	MalfunctioningSignaling: 7,
	JsonParsingError: 'JsonParsingError',
	UnexpectedResponse: 'UnexpectedResponse',
	FailedRequest: 'FailedRequest',
	AbortedRequest: 'AbortedRequest',
	BodyReadError: 'BodyReadError',
	UnknownError: 'UnknownError',
};

export const ConnectionType = {
	PeerToPeer: 0,
	MediaServer: 1,
};

export const CloseCode = {
	Normal: 1000,
	Reconnect: 4001,
};

export const CallApiEvent = {
	Reconnected: 'Reconnected',
	Connected: 'Connected',
};

export const LOG_LEVEL = {
	INFO: 'INFO',
	WARNING: 'WARNING',
	ERROR: 'ERROR',
};

export const MONITORING_EVENTS_NAME_LIST = {
	TRACK_SUBSCRIPTION_FAILED: 'webrtc_track_subscription_failed',
	TRACK_SUBSCRIPTION_DELAY: 'webrtc_track_subscription_delay',
	HIGH_PACKET_LOSS_SEND: 'webrtc_high_packet_loss_send',
	HIGH_PACKET_LOSS_RECEIVE: 'webrtc_high_packet_loss_receive',
	CPU_ISSUES: 'webrtc_cpu_issues',
	NETWORK_ISSUES: 'webrtc_network_issues',
	NETWORK_LATENCY_MS: 'webrtc_network_latency_ms',
	PEER_CONNECTION_REFUSED: 'webrtc_peer_connection_refused',
	// PEER_CONNECTION_ISSUES: 'webrtc_peer_connection_issues', // removed
	PEER_CONNECTION_ISSUES_HANDLING_OFFER: 'webrtc_peer_connection_issues_handling_offer',
	PEER_CONNECTION_ISSUES_HANDLING_ANSWER: 'webrtc_peer_connection_issues_handling_answer',
	PEER_CONNECTION_ISSUES_ADDING_ICE_CANDIDATE: 'webrtc_peer_connection_issues_adding_ice_candidate',
	USER_CAMERA_DISABLED: 'webrtc_user_camera_disabled',
	USER_RECONNECTED: 'webrtc_user_reconnected',
	LOCAL_VIDEO_STREAM_RECEIVING_FAILED: 'webrtc_local_video_stream_receiving_failed',
	LOCAL_MICROPHONE_STREAM_RECEIVING_FAILED: 'webrtc_local_microphone_stream_receiving_failed',
	LOCAL_SCREEN_STREAM_RECEIVING_FAILED: 'webrtc_local_screen_stream_receiving_failed',
	LOCAL_VIDEO_STREAM_PUBLICATION_FAILED: 'webrtc_local_video_stream_publication_failed',
	LOCAL_MICROPHONE_STREAM_PUBLICATION_FAILED: 'webrtc_local_microphone_stream_publication_failed',
	LOCAL_SCREEN_STREAM_PUBLICATION_FAILED: 'webrtc_local_screen_stream_publication_failed',

	STREAM_FAILURE_TOTAL: 'webrtc_stream_failure_total', // not implemented yet
	RECONNECT_ATTEMPTS: 'webrtc_reconnect_attempts', // not implemented yet
	RECONNECT_DURATION_SECONDS: 'webrtc_reconnect_duration_seconds', // not implemented yet
	CPU_USAGE_PERCENT: 'webrtc_cpu_usage_percent', // not implemented yet
	HIGH_PACKET_LOSS_PERCENT: 'webrtc_packet_loss_percent', // not implemented yet
	SUBSCRIPTION_DELAY_MS: 'webrtc_subscription_delay_ms', // not implemented yet
};

export const ReconnectionReason = {
	NetworkError: 'NetworkError',
	PingPongMissed: 'PingPongMissed',
	PeerConnectionFailed: 'PeerConnectionFailed',
	WsTransportClosed: 'WsTransportClosed',
	LeaveCommand: 'LeaveCommand',
	JoinResponseError: 'JoinResponseError',
};
