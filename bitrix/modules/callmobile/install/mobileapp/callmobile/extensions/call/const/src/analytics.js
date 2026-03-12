/**
 * @module call/const/analytics
 */
jn.define('call/const/analytics', (require, exports, module) => {

	const AnalyticsEvent = Object.freeze({
		clickScreenshare: 'click_screenshare',
		startScreenshare: 'start_screenshare',
		finishScreenshare: 'finish_screenshare',
		connect: 'connect',
		startCall: 'start_call',
		startCallCollab: 'start_call_collab',
		connectCallCollab: 'connect_call_collab',
		reconnect: 'reconnect',
		addUser: 'add_user',
		disconnect: 'disconnect',
		finishCall: 'finish_call',
		clickRecord: 'click_record',
		recordStart: 'record_start',
		recordStop: 'record_stop',
		clickAnswer: 'click_answer',
		clickDeny: 'click_deny',
		cameraOn: 'camera_on',
		cameraOff: 'camera_off',
		micOn: 'mic_on',
		micOff: 'mic_off',
		clickUserFrame: 'click_user_frame',
		handOn: 'hand_on',
		clickChat: 'click_chat',
		aiRecordStart: 'ai_record_start',
		openTab: 'open_tab',
		openSlider: 'open_slider',
		openCallTab: 'open_call_tab',
		startSearch: 'start_search',
		clickCallButton: 'click_call_button',
		removeFromList: 'remove_from_list',
		openChat: 'open_chat',
		clickCreate: 'click_create',
		submitCreate: 'submit_create',
	});

	const AnalyticsTool = Object.freeze({
		im: 'im',
		ai: 'ai',
	});

	const AnalyticsCategory = Object.freeze({
		call: 'call',
		callsOperations: 'calls_operations',
		callFollowup: 'call_followup',
		callList: 'call_list',
		messenger: 'messenger',
		videoconf: 'videoconf',
		collabCall: 'collab_call',
	});

	const AnalyticsType = Object.freeze({
		private: 'private',
		group: 'group',
		videoconf: 'videoconf',
		about: 'about',
		efficiency: 'grade',
		agreements: 'notes',
		insights: 'ai_call_quality',
		summary: 'followup',
		transcribation: 'transcript',
		outgoing: 'outgoing',
		incoming: 'incoming',
		missed: 'missed',
	});

	const AnalyticsSection = Object.freeze({
		callWindow: 'call_window',
		callPopup: 'call_popup',
		chatList: 'chat_list',
		chatWindow: 'chat_window',
		callFollowup: 'call_followup',
		callTab: 'call_tab',
	});

	const AnalyticsSubSection = Object.freeze({
		finishButton: 'finish_button',
		contextMenu: 'context_menu',
		window: 'window',
		outgoing: 'outgoing',
		incoming: 'incoming',
		missed: 'missed',
		search: 'search',
		creationBox: 'creation_box',
		all: 'all',
		menu: 'menu',
	});

	const AnalyticsElement = Object.freeze({
		answerButton: 'answer_button',
		joinButton: 'join_button',
		videocall: 'videocall',
		recordButton: 'record_button',
		disconnectButton: 'disconnect_button',
		finishForAllButton: 'finish_for_all_button',
		videoButton: 'video_button',
		audioButton: 'audio_button',
	});

	const AnalyticsStatus = Object.freeze({
		success: 'success',
		decline: 'decline',
		busy: 'busy',
		noAnswer: 'no_answer',
		quit: 'quit',
		lastUserLeft: 'last_user_left',
		finishedForAll: 'finished_for_all',
		privateToGroup: 'private_to_group',
		errorAgreement: 'error_agreement',
		errorLimitBaas: 'error_limit_baas',
		errorB24: 'error_b24',
	});

	const AnalyticsDeviceStatus = Object.freeze({
		videoOn: 'video_on',
		videoOff: 'video_off',
		micOn: 'mic_on',
		micOff: 'mic_off',
	});

	const AnalyticsAIStatus = Object.freeze({
		aiOn: 'ai_on',
		aiOff: 'ai_off',
	});

	const AnalyticsVpnStatus = Object.freeze({
		vpnOn: 'vpn_on',
		vpnOff: 'vpn_off',
	});

	const Analytics = Object.freeze({
		AnalyticsEvent,
		AnalyticsTool,
		AnalyticsCategory,
		AnalyticsType,
		AnalyticsSection,
		AnalyticsSubSection,
		AnalyticsElement,
		AnalyticsStatus,
		AnalyticsDeviceStatus,
		AnalyticsAIStatus,
		AnalyticsVpnStatus,
	});

	module.exports = { Analytics };
});
