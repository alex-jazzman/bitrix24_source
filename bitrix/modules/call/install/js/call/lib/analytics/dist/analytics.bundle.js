/* eslint-disable */
this.BX = this.BX || {};
this.BX.Call = this.BX.Call || {};
(function (exports, main_core, ui_analytics, im_v2_const, im_v2_lib_analytics, call_const) {
	'use strict';

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
		recordPaused: 'record_paused',
		recordResumed: 'record_resumed',
		recordDelete: 'record_delete',
		clickAnswer: 'click_answer',
		clickDeny: 'click_deny',
		cameraOn: 'camera_on',
		cameraOff: 'camera_off',
		micOn: 'mic_on',
		micOff: 'mic_off',
		clickUserFrame: 'click_user_frame',
		handOn: 'hand_on',
		clickChat: 'click_chat',
		click: 'click',
		create: 'create',
		edit: 'edit',
		save: 'save',
		upload: 'upload',
		openResume: 'open_resume',
		clickCallButton: 'click_call_button',
		clickStartConf: 'click_start_conf',
		clickJoin: 'click_join',
		aiRecordStart: 'ai_record_start',
		aiOn: 'ai_on',
		aiOff: 'ai_off',
		openTab: 'open_tab',
		openSlider: 'open_slider',
		clickCreateEvent: 'click_create_event',
		clickCreateTask: 'click_create_task',
		viewPopup: 'view_popup',
		viewNotification: 'view_notification',
		clickTimeCode: 'click_timecode',
		playRecord: 'play_record',
		clickAiOff: 'click_ai_off',
		delete: 'delete',
		openSettings: 'open_settings',
		restrictCamera: 'restrict_camera',
		restrictMic: 'restrict_mic',
		restrictScreenshare: 'restrict_screenshare',
		allCamerasOff: 'all_cameras_off',
		allMicOff: 'all_mic_off',
		allScreenshareOff: 'all_screenshare_off',
		userCameraOff: 'user_camera_off',
		userMicOff: 'user_mic_off',
		userScreenshareOff: 'user_screenshare_off',
		deleteUser: 'delete_user',
		denyRequest: 'deny_request',
		approveRequest: 'approve_request',
		joinCall: 'join_call',
		clickOpenSlots: 'click_open_slots',
		clickBooking: 'click_booking',
		openSection: 'open_section'
	});
	const AnalyticsTool = Object.freeze({
		im: 'im',
		ai: 'ai',
		task: 'task',
		sync: 'sync'
	});
	const AnalyticsCategory = Object.freeze({
		call: 'call',
		callDocs: 'call_docs',
		messenger: 'messenger',
		callsOperations: 'calls_operations',
		chatOperations: 'chat_operations',
		callFollowup: 'call_followup',
		callRecord: 'call_record',
		collabCall: 'collab_call',
		sync: 'sync'
	});
	const AnalyticsType = Object.freeze({
		private: 'private',
		group: 'group',
		videoconf: 'videoconf',
		video: 'video',
		audio: 'audio',
		resume: 'resume',
		doc: 'doc',
		presentation: 'presentation',
		sheet: 'sheet',
		privateCall: 'private',
		groupCall: 'group',
		aiOn: 'ai_on',
		turnOnAi: 'turn_on_ai',
		sync: 'sync'
	});
	const AnalyticsSection = Object.freeze({
		callWindow: 'call_window',
		callPopup: 'call_popup',
		chatList: 'chat_list',
		chatWindow: 'chat_window',
		taskChat: 'task_chat',
		taskCard: 'task_card',
		chatTasks: 'chat_tasks',
		callMessage: 'call_message',
		callFollowup: 'call_followup',
		call: 'call',
		syncPage: 'sync_page'
	});
	const AnalyticsSubSection = Object.freeze({
		finishButton: 'finish_button',
		contextMenu: 'context_menu',
		window: 'window',
		taskCard: 'task_card',
		mainButton: 'main_button'
	});
	const AnalyticsElement = Object.freeze({
		answerButton: 'answer_button',
		joinButton: 'join_button',
		videocall: 'videocall',
		audiocall: 'audiocall',
		recordButton: 'record_button',
		disconnectButton: 'disconnect_button',
		finishForAllButton: 'finish_for_all_button',
		videoButton: 'video_button',
		audioButton: 'audio_button',
		startButton: 'start_button',
		initialBanner: 'initial_banner',
		startMessage: 'start_message',
		finishMessage: 'finish_message'
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
		errorB24: 'error_b24'
	});
	const AnalyticsDeviceStatus = Object.freeze({
		videoOn: 'video_on',
		videoOff: 'video_off',
		micOn: 'mic_on',
		micOff: 'mic_off'
	});
	const AnalyticsAIStatus = Object.freeze({
		aiOn: 'ai_on',
		aiOff: 'ai_off'
	});
	const AnalyticsVpnStatus = Object.freeze({
		vpnOn: 'vpn_on',
		vpnOff: 'vpn_off'
	});

	const PRESET_TOOL_MAP = {
		sync: AnalyticsTool.sync
	};
	function getCallTool() {
		const presetCode = main_core.Extension.getSettings('call.core')?.activePresetCode ?? '';
		return PRESET_TOOL_MAP[presetCode] ?? AnalyticsTool.im;
	}

	class Sync {
		onOpenSection() {
			ui_analytics.sendData({
				tool: getCallTool(),
				category: AnalyticsCategory.sync,
				event: AnalyticsEvent.openSection,
				type: AnalyticsType.sync
			});
		}
		onStartCallClick() {
			ui_analytics.sendData({
				tool: getCallTool(),
				category: AnalyticsCategory.sync,
				event: AnalyticsEvent.clickCallButton,
				type: AnalyticsType.video,
				c_section: AnalyticsSection.syncPage,
				c_sub_section: AnalyticsSubSection.mainButton
			});
		}
		onJoinClick() {
			ui_analytics.sendData({
				tool: getCallTool(),
				category: AnalyticsCategory.sync,
				event: AnalyticsEvent.clickJoin,
				type: AnalyticsType.video,
				c_section: AnalyticsSection.syncPage
			});
		}
		onJoinCall() {
			ui_analytics.sendData({
				tool: getCallTool(),
				category: AnalyticsCategory.sync,
				event: AnalyticsEvent.joinCall,
				type: AnalyticsType.video,
				c_section: AnalyticsSection.syncPage
			});
		}
		onCreateEventClick() {
			ui_analytics.sendData({
				tool: getCallTool(),
				category: AnalyticsCategory.sync,
				event: AnalyticsEvent.clickCreateEvent,
				c_section: AnalyticsSection.syncPage
			});
		}
		onOpenSlotsClick() {
			ui_analytics.sendData({
				tool: getCallTool(),
				category: AnalyticsCategory.sync,
				event: AnalyticsEvent.clickOpenSlots,
				c_section: AnalyticsSection.syncPage
			});
		}
		onBookingClick() {
			ui_analytics.sendData({
				tool: getCallTool(),
				category: AnalyticsCategory.sync,
				event: AnalyticsEvent.clickBooking,
				c_section: AnalyticsSection.syncPage
			});
		}
	}

	class Copilot {
		#callAutoStartRecordSent = [];
		onAIRecordStart(params) {
			if (params?.isAutostart && this.#callAutoStartRecordSent.includes(params.callId)) {
				return;
			}
			this.#callAutoStartRecordSent.push(params.callId);
			const errorCodes = {
				AI_UNAVAILABLE_ERROR: AnalyticsStatus.errorB24,
				AI_SETTINGS_ERROR: AnalyticsStatus.errorB24,
				AI_AGREEMENT_ERROR: AnalyticsStatus.errorAgreement,
				AI_NOT_ENOUGH_BAAS_ERROR: AnalyticsStatus.errorLimitBaas
			};
			const resultData = {
				tool: AnalyticsTool.ai,
				category: AnalyticsCategory.callsOperations,
				event: AnalyticsEvent.aiRecordStart,
				type: params.callType,
				c_section: AnalyticsSection.callFollowup,
				p2: `chatUserCount_${params.chatUserCount}`,
				p5: `callId_${params.callId}`
			};
			resultData.p1 = params?.isAutostart ? 'launchType_auto' : 'launchType_manual';
			if (params?.userCount) {
				resultData.p3 = `userCount_${params.userCount}`;
			}
			resultData.status = params?.errorCode ? errorCodes[params.errorCode] : AnalyticsStatus.success;
			ui_analytics.sendData(resultData);
		}
		onAIRecordStatusChanged(params) {
			ui_analytics.sendData({
				tool: getCallTool(),
				category: AnalyticsCategory.call,
				event: params.isAIOn ? AnalyticsEvent.aiOn : AnalyticsEvent.aiOff,
				type: params.callType,
				status: params?.error ? `error_${params.error}` : AnalyticsStatus.success,
				p5: `callId_${params.callId}`
			});
		}
		onOpenFollowUpTab(params) {
			ui_analytics.sendData({
				tool: getCallTool(),
				category: AnalyticsCategory.callFollowup,
				event: AnalyticsEvent.openTab,
				type: params.tabName,
				p5: `callId_${params.callId}`
			});
		}
		onOpenFollowUpSlider(params) {
			ui_analytics.sendData({
				tool: getCallTool(),
				category: AnalyticsCategory.callFollowup,
				event: AnalyticsEvent.openSlider,
				p5: `callId_${params.callId}`
			});
		}
		onFollowUpCreateEventClick(params) {
			ui_analytics.sendData({
				tool: getCallTool(),
				category: AnalyticsCategory.callFollowup,
				event: AnalyticsEvent.clickCreateEvent,
				p5: `callId_${params.callId}`
			});
		}
		onFollowUpCreateTaskClick(params) {
			ui_analytics.sendData({
				tool: getCallTool(),
				category: AnalyticsCategory.callFollowup,
				event: AnalyticsEvent.clickCreateTask,
				p5: `callId_${params.callId}`
			});
		}
		onAIRestrictionsPopupShow(params) {
			ui_analytics.sendData({
				tool: getCallTool(),
				category: AnalyticsCategory.call,
				event: AnalyticsEvent.viewPopup,
				type: params.popupType,
				p5: `callId_${params.callId}`
			});
		}
		onCopilotNotifyShow(params) {
			ui_analytics.sendData({
				tool: getCallTool(),
				category: AnalyticsCategory.call,
				event: AnalyticsEvent.viewNotification,
				type: params.isCopilotActive ? AnalyticsType.aiOn : AnalyticsType.turnOnAi,
				p5: `callId_${params.callId}`
			});
		}
		onAIRecordTimeCodeClick(params) {
			ui_analytics.sendData({
				tool: getCallTool(),
				category: AnalyticsCategory.callFollowup,
				event: AnalyticsEvent.clickTimeCode,
				p5: `callId_${params.callId}`
			});
		}
		onAIPlayRecord(params) {
			ui_analytics.sendData({
				tool: getCallTool(),
				category: AnalyticsCategory.callFollowup,
				event: AnalyticsEvent.playRecord,
				p5: `callId_${params.callId}`
			});
		}
		onClickAIOff(params) {
			ui_analytics.sendData({
				tool: getCallTool(),
				category: AnalyticsCategory.call,
				event: AnalyticsEvent.clickAiOff,
				type: params.callType,
				p5: `callId_${params.callId}`
			});
		}
		onSelectAIOff(params) {
			ui_analytics.sendData({
				tool: getCallTool(),
				category: AnalyticsCategory.call,
				event: AnalyticsEvent.aiOff,
				type: params.callType,
				p5: `callId_${params.callId}`
			});
		}
		onSelectAIDelete(params) {
			ui_analytics.sendData({
				tool: getCallTool(),
				category: AnalyticsCategory.callFollowup,
				event: AnalyticsEvent.delete,
				type: params.callType,
				c_section: AnalyticsSection.call,
				p5: `callId_${params.callId}`
			});
		}
	}

	const CALL_ALREADY_FINISHED_STATUS = 'call_already_finished';
	function buildCallIdParam(callId) {
		const hasIdentifier = !main_core.Type.isNil(callId) && callId !== '' && callId !== 0;
		return hasIdentifier ? {
			p5: `callId_${callId}`
		} : {};
	}
	class Analytics {
		static #instance;
		static AnalyticsType = AnalyticsType;
		static AnalyticsStatus = AnalyticsStatus;
		static AnalyticsSection = AnalyticsSection;
		static AnalyticsElement = AnalyticsElement;
		static AnalyticsSubSection = AnalyticsSubSection;
		copilot = new Copilot();
		sync = new Sync();
		#screenShareStarted = false;
		static getInstance() {
			if (!this.#instance) {
				this.#instance = new this();
			}
			return this.#instance;
		}
		safeDecode(str) {
			if (!str || !main_core.Type.isString(str)) {
				return str;
			}
			if (!str.includes('%')) {
				return str;
			}
			try {
				const decoded = decodeURIComponent(str);
				if (decoded.includes('%25') || decoded !== str && decoded.includes('%')) {
					return decodeURIComponent(decoded);
				}
				return decoded;
			} catch {
				return str;
			}
		}
		#buildErrorStatus(errorCode) {
			return this.safeDecode(`error_${errorCode}`).replaceAll(/\s+/g, '_');
		}
		onScreenShareBtnClick({
			callId,
			callType
		}) {
			if (this.#screenShareStarted) {
				return;
			}
			ui_analytics.sendData({
				tool: getCallTool(),
				category: AnalyticsCategory.call,
				event: AnalyticsEvent.clickScreenshare,
				type: callType,
				c_section: AnalyticsSection.callWindow,
				p5: `callId_${callId}`
			});
		}
		onScreenShareStarted({
			callId,
			callType
		}) {
			this.#screenShareStarted = true;
			ui_analytics.sendData({
				tool: getCallTool(),
				category: AnalyticsCategory.call,
				event: AnalyticsEvent.startScreenshare,
				type: callType,
				c_section: AnalyticsSection.callWindow,
				p5: `callId_${callId}`
			});
		}
		onScreenShareStopped({
			callId,
			callType,
			status,
			screenShareLength
		}) {
			if (!this.#screenShareStarted) {
				return;
			}
			this.#screenShareStarted = false;
			ui_analytics.sendData({
				tool: getCallTool(),
				category: AnalyticsCategory.call,
				event: AnalyticsEvent.finishScreenshare,
				type: callType,
				c_section: AnalyticsSection.callWindow,
				status,
				p1: `shareLength_${screenShareLength}`,
				p5: `callId_${callId}`
			});
		}
		onAnswerConference(params) {
			ui_analytics.sendData({
				tool: getCallTool(),
				category: AnalyticsCategory.call,
				event: AnalyticsEvent.clickAnswer,
				type: AnalyticsType.videoconf,
				c_section: AnalyticsSection.callPopup,
				p5: `callId_${params.callId}`
			});
		}
		onDeclineConference(params) {
			ui_analytics.sendData({
				tool: getCallTool(),
				category: AnalyticsCategory.call,
				event: AnalyticsEvent.clickDeny,
				type: AnalyticsType.videoconf,
				c_section: AnalyticsSection.callPopup,
				p5: `callId_${params.callId}`
			});
		}
		onStartVideoconf(params) {
			ui_analytics.sendData({
				tool: getCallTool(),
				category: AnalyticsCategory.call,
				event: AnalyticsEvent.startCall,
				type: AnalyticsType.videoconf,
				c_element: params.withVideo ? AnalyticsElement.videoButton : AnalyticsElement.audioButton,
				status: params.status,
				p1: params.mediaParams.video ? AnalyticsDeviceStatus.videoOn : AnalyticsDeviceStatus.videoOff,
				p2: `chatUserCount_${params.userCounter}`,
				p3: params.isCopilotActive ? AnalyticsAIStatus.aiOn : AnalyticsAIStatus.aiOff,
				p4: params.isVpnActive ? AnalyticsVpnStatus.vpnOn : AnalyticsVpnStatus.vpnOff,
				p5: `callId_${params.callId}`
			});
		}
		onJoinVideoconf(params) {
			ui_analytics.sendData({
				tool: getCallTool(),
				category: AnalyticsCategory.call,
				event: AnalyticsEvent.connect,
				type: AnalyticsType.videoconf,
				c_element: params.withVideo ? AnalyticsElement.videoButton : AnalyticsElement.audioButton,
				status: params.status,
				p1: params.mediaParams.video ? AnalyticsDeviceStatus.videoOn : AnalyticsDeviceStatus.videoOff,
				p2: params.mediaParams.audio ? AnalyticsDeviceStatus.micOn : AnalyticsDeviceStatus.micOff,
				p4: params.isVpnActive ? AnalyticsVpnStatus.vpnOn : AnalyticsVpnStatus.vpnOff,
				p5: `callId_${params.callId}`
			});
		}
		onStartCall(params) {
			const chatType = params.associatedEntity?.advanced?.chatType;
			const resultData = {
				tool: getCallTool(),
				category: AnalyticsCategory.call,
				event: AnalyticsEvent.startCall,
				type: params.callType,
				status: params.status,
				p1: params.mediaParams.video ? AnalyticsDeviceStatus.videoOn : AnalyticsDeviceStatus.videoOff,
				p2: `chatUserCount_${params.associatedEntity?.userCounter}`,
				p3: params.isCopilotActive ? AnalyticsAIStatus.aiOn : AnalyticsAIStatus.aiOff,
				p4: params.isVpnActive ? AnalyticsVpnStatus.vpnOn : AnalyticsVpnStatus.vpnOff,
				p5: `callId_${params.callId}`
			};
			if (chatType === im_v2_const.ChatType.collab && params.status === AnalyticsStatus.success) {
				const resultDataCollab = {
					tool: getCallTool(),
					category: AnalyticsCategory.collabCall,
					event: AnalyticsEvent.startCallCollab,
					type: params.callType,
					status: params.status,
					p4: im_v2_lib_analytics.getCollabId(Number(this.normalizeChatId(params.associatedEntity.id))) ?? undefined,
					p5: `callId_${params.callId}`
				};
				ui_analytics.sendData(resultDataCollab);
			} else if (chatType === im_v2_const.ChatType.collab && params.status !== AnalyticsStatus.success) {
				return;
			}
			ui_analytics.sendData(resultData);
		}
		onStartCallError(params) {
			const resultData = {
				tool: getCallTool(),
				category: AnalyticsCategory.call,
				event: AnalyticsEvent.startCall,
				type: params.callType,
				status: this.#buildErrorStatus(params.errorCode),
				p3: params.errorMessage ? `msg_${params.errorMessage}`.slice(0, 100) : undefined,
				p4: params.isVpnActive ? AnalyticsVpnStatus.vpnOn : AnalyticsVpnStatus.vpnOff,
				...buildCallIdParam(params.callId)
			};
			ui_analytics.sendData(resultData);
		}
		onJoinCall(params) {
			const chatType = params.associatedEntity?.advanced?.chatType;
			const sendParams = {
				tool: getCallTool(),
				category: AnalyticsCategory.call,
				event: AnalyticsEvent.connect,
				type: params.callType,
				status: params.status,
				p3: im_v2_lib_analytics.getUserType(),
				p4: params.isVpnActive ? AnalyticsVpnStatus.vpnOn : AnalyticsVpnStatus.vpnOff,
				p5: `callId_${params.callId}`
			};
			if (params.section) {
				sendParams.c_section = params.section;
			}
			if (params.element) {
				sendParams.c_element = params.element;
			}
			if (params.mediaParams) {
				sendParams.p1 = params.mediaParams.video ? AnalyticsDeviceStatus.videoOn : AnalyticsDeviceStatus.videoOff;
				sendParams.p2 = params.mediaParams.audio ? AnalyticsDeviceStatus.micOn : AnalyticsDeviceStatus.micOff;
			}
			if (chatType === im_v2_const.ChatType.collab && params.status === AnalyticsStatus.success) {
				const collabId = params.associatedEntity.advanced.entityId;
				const resultDataCollab = {
					tool: getCallTool(),
					category: AnalyticsCategory.collabCall,
					event: AnalyticsEvent.connectCallCollab,
					type: params.callType,
					status: params.status,
					p4: `collabId_${collabId}`,
					p5: `callId_${params.callId}`
				};
				ui_analytics.sendData(resultDataCollab);
			} else if (chatType === im_v2_const.ChatType.collab && params.status !== AnalyticsStatus.success) {
				return;
			}
			ui_analytics.sendData(sendParams);
		}
		onJoinCallError(params) {
			const resultData = {
				tool: getCallTool(),
				category: AnalyticsCategory.call,
				event: AnalyticsEvent.connect,
				type: params.callType,
				status: params.isRoomClosed ? CALL_ALREADY_FINISHED_STATUS : this.#buildErrorStatus(params.errorCode),
				p3: params.errorMessage ? `msg_${params.errorMessage}`.slice(0, 100) : undefined,
				p4: params.isVpnActive ? AnalyticsVpnStatus.vpnOn : AnalyticsVpnStatus.vpnOff,
				...buildCallIdParam(params.callId)
			};
			ui_analytics.sendData(resultData);
		}
		onReconnect(params) {
			const reconnectionReasonInfo = params.reconnectionReasonInfo?.replace('Handling a remote offer failed: InvalidAccessError: ', '*').replaceAll('_', '').slice(0, 100);
			ui_analytics.sendData({
				tool: getCallTool(),
				category: AnalyticsCategory.call,
				event: AnalyticsEvent.reconnect,
				type: params.callType,
				c_section: AnalyticsSection.callWindow,
				status: params.reconnectionReason || '',
				p2: params.isVpnActive ? AnalyticsVpnStatus.vpnOn : AnalyticsVpnStatus.vpnOff,
				p3: `msg_${reconnectionReasonInfo}`,
				p4: `attemptNumber_${params.reconnectionEventCount}`,
				p5: `callId_${params.callId}`
			});
		}
		onReconnectError(params) {
			ui_analytics.sendData({
				tool: getCallTool(),
				category: AnalyticsCategory.call,
				event: AnalyticsEvent.reconnect,
				type: params.callType,
				status: this.#buildErrorStatus(params.errorCode),
				p3: params.errorMessage ? `msg_${params.errorMessage}`.slice(0, 100) : undefined,
				p4: params.isVpnActive ? AnalyticsVpnStatus.vpnOn : AnalyticsVpnStatus.vpnOff,
				p5: `callId_${params.callId}`
			});
		}
		onInviteUser(params) {
			ui_analytics.sendData({
				tool: getCallTool(),
				category: AnalyticsCategory.call,
				event: AnalyticsEvent.addUser,
				type: params.callType,
				c_section: AnalyticsSection.callWindow,
				p4: `chatId_${this.normalizeChatId(params.chatId)}`,
				p5: `callId_${params.callId}`
			});
		}
		onDisconnectCall(params) {
			ui_analytics.sendData({
				tool: getCallTool(),
				category: AnalyticsCategory.call,
				event: AnalyticsEvent.disconnect,
				type: params.callType,
				c_section: AnalyticsSection.callWindow,
				c_sub_section: params.subSection,
				status: AnalyticsStatus.quit,
				p1: params.mediaParams.video ? AnalyticsDeviceStatus.videoOn : AnalyticsDeviceStatus.videoOff,
				p2: params.mediaParams.audio ? AnalyticsDeviceStatus.micOn : AnalyticsDeviceStatus.micOff,
				p5: `callId_${params.callId}`
			});
		}
		onFinishCall(params) {
			ui_analytics.sendData({
				tool: getCallTool(),
				category: AnalyticsCategory.call,
				event: AnalyticsEvent.finishCall,
				type: params.callType,
				c_section: AnalyticsSection.callWindow,
				status: params.status,
				p1: `callLength_${params.callLength}`,
				p3: `maxUserCount_${params.callUsersCount}`,
				p4: `chatId_${this.normalizeChatId(params.chatId)}`,
				p5: `callId_${params.callId}`
			});
		}
		onRecordBtnClick(params) {
			ui_analytics.sendData({
				tool: getCallTool(),
				category: AnalyticsCategory.call,
				event: AnalyticsEvent.clickRecord,
				type: params.callType,
				c_section: AnalyticsSection.callWindow,
				c_element: AnalyticsElement.recordButton,
				p5: `callId_${params.callId}`
			});
		}
		onRecordStart(params) {
			ui_analytics.sendData({
				tool: getCallTool(),
				category: AnalyticsCategory.call,
				event: AnalyticsEvent.recordStart,
				type: params.callType,
				c_section: AnalyticsSection.callWindow,
				status: params.errorCode ? this.#buildErrorStatus(params.errorCode) : AnalyticsStatus.success,
				p1: `recordType_${params.recordType}`,
				p5: `callId_${params.callId}`
			});
		}
		onRecordPaused(params) {
			ui_analytics.sendData({
				tool: getCallTool(),
				category: AnalyticsCategory.call,
				event: AnalyticsEvent.recordPaused,
				type: params.callType,
				c_section: AnalyticsSection.callWindow,
				status: params.errorCode ? this.#buildErrorStatus(params.errorCode) : AnalyticsStatus.success,
				p5: `callId_${params.callId}`
			});
		}
		onRecordResumed(params) {
			ui_analytics.sendData({
				tool: getCallTool(),
				category: AnalyticsCategory.call,
				event: AnalyticsEvent.recordResumed,
				type: params.callType,
				c_section: AnalyticsSection.callWindow,
				status: params.errorCode ? this.#buildErrorStatus(params.errorCode) : AnalyticsStatus.success,
				p5: `callId_${params.callId}`
			});
		}
		onRecordDelete(params) {
			ui_analytics.sendData({
				tool: getCallTool(),
				category: AnalyticsCategory.call,
				event: AnalyticsEvent.recordDelete,
				type: params.callType,
				status: params.errorCode ? this.#buildErrorStatus(params.errorCode) : AnalyticsStatus.success,
				p5: `callId_${params.callId}`
			});
		}
		onRecordStop(params) {
			ui_analytics.sendData({
				tool: getCallTool(),
				category: AnalyticsCategory.call,
				event: AnalyticsEvent.recordStop,
				type: params.callType,
				c_section: AnalyticsSection.callWindow,
				c_sub_section: params.subSection,
				c_element: params.element,
				p1: `recordLength_${params?.recordTime}`,
				p5: `callId_${params.callId}`
			});
		}
		onCloudRecordPopupShow(params) {
			ui_analytics.sendData({
				tool: getCallTool(),
				category: AnalyticsCategory.callRecord,
				event: AnalyticsEvent.viewPopup,
				type: params.popupType,
				p5: `callId_${params.callId}`
			});
		}
		onToggleCamera(params) {
			ui_analytics.sendData({
				tool: getCallTool(),
				category: AnalyticsCategory.call,
				event: params.video ? AnalyticsEvent.cameraOn : AnalyticsEvent.cameraOff,
				type: params.callType,
				c_section: AnalyticsSection.callWindow,
				p5: `callId_${params.callId}`
			});
		}
		onToggleMicrophone(params) {
			ui_analytics.sendData({
				tool: getCallTool(),
				category: AnalyticsCategory.call,
				event: params.muted ? AnalyticsEvent.micOff : AnalyticsEvent.micOn,
				type: params.callType,
				c_section: AnalyticsSection.callWindow,
				p5: `callId_${params.callId}`
			});
		}
		onClickUser(params) {
			ui_analytics.sendData({
				tool: getCallTool(),
				category: AnalyticsCategory.call,
				event: AnalyticsEvent.clickUserFrame,
				type: params.callType,
				c_section: AnalyticsSection.callWindow,
				c_sub_section: params.layout.toLowerCase(),
				p5: `callId_${params.callId}`
			});
		}
		onFloorRequest(params) {
			ui_analytics.sendData({
				tool: getCallTool(),
				category: AnalyticsCategory.call,
				event: AnalyticsEvent.handOn,
				type: params.callType,
				c_section: AnalyticsSection.callWindow,
				p5: `callId_${params.callId}`
			});
		}
		onShowChat(params) {
			ui_analytics.sendData({
				tool: getCallTool(),
				category: AnalyticsCategory.call,
				event: AnalyticsEvent.clickChat,
				type: params.callType,
				c_section: AnalyticsSection.callWindow,
				p5: `callId_${params.callId}`
			});
		}
		onDocumentBtnClick(params) {
			ui_analytics.sendData({
				tool: getCallTool(),
				category: AnalyticsCategory.callDocs,
				event: AnalyticsEvent.click,
				p4: `callType_${params.callType}`,
				p5: `callId_${params.callId}`
			});
		}
		onDocumentCreate(params) {
			ui_analytics.sendData({
				tool: getCallTool(),
				category: AnalyticsCategory.callDocs,
				event: AnalyticsEvent.create,
				type: params.type,
				p4: `callType_${params.callType}`,
				p5: `callId_${params.callId}`
			});
		}
		onDocumentClose(params) {
			ui_analytics.sendData({
				tool: getCallTool(),
				category: AnalyticsCategory.callDocs,
				event: AnalyticsEvent.save,
				type: params.type,
				p4: `callType_${params.callType}`,
				p5: `callId_${params.callId}`
			});
		}
		onDocumentUpload(params) {
			ui_analytics.sendData({
				tool: getCallTool(),
				category: AnalyticsCategory.callDocs,
				event: AnalyticsEvent.upload,
				type: params.type,
				p4: `callType_${params.callType}`,
				p5: `callId_${params.callId}`
			});
		}
		onLastResumeOpen(params) {
			ui_analytics.sendData({
				tool: getCallTool(),
				category: AnalyticsCategory.callDocs,
				event: AnalyticsEvent.openResume,
				p4: `callType_${params.callType}`,
				p5: `callId_${params.callId}`
			});
		}
		normalizeChatId(chatId) {
			if (!chatId) {
				return 0;
			}
			return chatId.includes('chat') ? chatId.replace('chat', '') : chatId;
		}
		onChatHeaderStartCallClick(params) {
			const resultData = {
				tool: getCallTool(),
				category: AnalyticsCategory.messenger,
				event: AnalyticsEvent.clickCallButton,
				c_section: this.#getSectionParamByChatType(params.dialog.type),
				c_sub_section: AnalyticsSubSection.window,
				p5: `chatId_${params.dialog.chatId}`
			};
			resultData.type = this.#getCallTypeParam(params.dialog.type);
			resultData.c_element = this.#getCallElementParam(params.callType);
			if (params.dialog.type === im_v2_const.ChatType.collab) {
				resultData.p4 = im_v2_lib_analytics.getCollabId(params.dialog.chatId) ?? undefined;
			}
			this.#sendTaskCardCallClick(params.dialog, params.callType);
			ui_analytics.sendData(resultData);
		}
		onContextMenuStartCallClick(params) {
			const resultData = {
				tool: getCallTool(),
				category: AnalyticsCategory.messenger,
				event: AnalyticsEvent.clickCallButton,
				c_section: this.#getSectionParamByChatType(params.context.type),
				c_sub_section: AnalyticsSubSection.contextMenu,
				p5: `chatId_${params.context.chatId}`
			};
			resultData.type = this.#getCallTypeParam(params.context.type);
			resultData.c_element = this.#getCallElementParam(params.callType);
			if (params.context.type === im_v2_const.ChatType.collab) {
				resultData.p4 = im_v2_lib_analytics.getCollabId(params.context.chatId) ?? undefined;
			}
			this.#sendTaskCardCallClick(params.context, params.callType);
			ui_analytics.sendData(resultData);
		}
		#getCallElementParam(callType) {
			return callType === call_const.CallTypes.video.id ? AnalyticsElement.videocall : AnalyticsElement.audiocall;
		}
		#getCallTypeParam(type) {
			return type === im_v2_const.ChatType.user ? AnalyticsType.private : AnalyticsType.group;
		}
		#getSectionParamByChatType(chatType) {
			const isTaskChat = chatType === im_v2_const.ChatType.taskComments;
			if (!isTaskChat) {
				return AnalyticsSection.chatWindow;
			}
			return this.#isTaskCardSliderOpen() ? AnalyticsSection.taskCard : AnalyticsSection.taskChat;
		}
		#isTaskCardSliderOpen() {
			const topSlider = BX.SidePanel?.Instance?.getTopSlider();
			return topSlider !== null && topSlider !== undefined && /\/tasks\/task\/view\/\d+\//.test(topSlider.getUrl());
		}
		#getTaskIdParam(dialogData) {
			const isTaskChat = dialogData?.type === im_v2_const.ChatType.taskComments;
			if (!isTaskChat) {
				return '';
			}
			const taskId = Number.parseInt(String(dialogData?.entityLink?.id), 10);
			if (!Number.isInteger(taskId)) {
				return 'taskId_0';
			}
			return `taskId_${taskId}`;
		}
		#sendTaskCardCallClick(dialogData, callType) {
			const isTaskChat = dialogData?.type === im_v2_const.ChatType.taskComments;
			if (!isTaskChat) {
				return;
			}
			const taskIdParam = this.#getTaskIdParam(dialogData);
			if (!taskIdParam) {
				return;
			}
			const isTaskCard = this.#isTaskCardSliderOpen();
			const resultData = {
				tool: AnalyticsTool.task,
				category: AnalyticsCategory.chatOperations,
				event: AnalyticsEvent.clickCallButton,
				type: callType === call_const.CallTypes.audio.id ? AnalyticsType.audio : AnalyticsType.video,
				p1: taskIdParam
			};
			if (isTaskCard) {
				resultData.c_sub_section = AnalyticsSubSection.taskCard;
			} else {
				resultData.c_section = AnalyticsSection.chatTasks;
			}
			ui_analytics.sendData(resultData);
		}
		onStartConferenceClick(params) {
			ui_analytics.sendData({
				tool: getCallTool(),
				category: AnalyticsCategory.call,
				event: AnalyticsEvent.clickStartConf,
				type: AnalyticsType.videoconf,
				c_section: AnalyticsSection.chatWindow,
				c_element: AnalyticsElement.startButton,
				p5: `chatId_${params.chatId}`
			});
		}
		onChatCreationMessageStartCallClick(params) {
			ui_analytics.sendData({
				tool: getCallTool(),
				category: AnalyticsCategory.messenger,
				event: AnalyticsEvent.clickCallButton,
				type: AnalyticsType.groupCall,
				c_section: AnalyticsSection.chatWindow,
				c_sub_section: AnalyticsSubSection.window,
				c_element: AnalyticsElement.initialBanner,
				p5: `chatId_${params.chatId}`
			});
		}
		onRecentStartCallClick(params) {
			ui_analytics.sendData({
				tool: getCallTool(),
				category: AnalyticsCategory.messenger,
				event: AnalyticsEvent.clickCallButton,
				type: params.isGroupChat ? AnalyticsType.groupCall : AnalyticsType.privateCall,
				c_section: AnalyticsSection.chatList,
				c_sub_section: AnalyticsSubSection.contextMenu,
				c_element: AnalyticsElement.videocall,
				p5: `chatId_${params.chatId}`
			});
		}
		onChatStartConferenceClick(params) {
			ui_analytics.sendData({
				tool: getCallTool(),
				category: AnalyticsCategory.call,
				event: AnalyticsEvent.clickStartConf,
				type: AnalyticsType.videoconf,
				c_section: AnalyticsSection.chatWindow,
				c_element: AnalyticsElement.initialBanner,
				p5: `chatId_${params.chatId}`
			});
		}
		onJoinConferenceClick(params) {
			ui_analytics.sendData({
				tool: getCallTool(),
				category: AnalyticsCategory.call,
				event: AnalyticsEvent.clickJoin,
				type: AnalyticsType.videoconf,
				c_section: AnalyticsSection.chatList,
				p5: `callId_${params.callId}`
			});
		}
		onStartCallMessageClick(params) {
			this.#onCallMessageClick(params, AnalyticsElement.startMessage);
		}
		onFinishCallMessageClick(params) {
			this.#onCallMessageClick(params, AnalyticsElement.finishMessage);
		}
		onOpenCallSettings(params) {
			ui_analytics.sendData({
				tool: getCallTool(),
				category: AnalyticsCategory.call,
				event: AnalyticsEvent.openSettings,
				type: params.callType,
				p5: `callId_${params.callId}`
			});
		}
		onDeleteUser(params) {
			ui_analytics.sendData({
				tool: getCallTool(),
				category: AnalyticsCategory.call,
				event: AnalyticsEvent.deleteUser,
				type: params.callType,
				p5: `callId_${params.callId}`
			});
		}
		onCallSettingsChanged(params) {
			let event = '';
			switch (params.typeOfSetting) {
				case 'mic':
					event = AnalyticsEvent.restrictMic;
					break;
				case 'cam':
					event = AnalyticsEvent.restrictCamera;
					break;
				case 'screenshare':
					event = AnalyticsEvent.restrictScreenshare;
					break;
			}
			if (event) {
				ui_analytics.sendData({
					tool: getCallTool(),
					category: AnalyticsCategory.call,
					event,
					type: params.callType,
					p5: `callId_${params.callId}`
				});
			}
		}
		onTurnOffAllParticipansStream(params) {
			let event = '';
			switch (params.typeOfStream) {
				case 'mic':
					event = AnalyticsEvent.allMicOff;
					break;
				case 'cam':
					event = AnalyticsEvent.allCamerasOff;
					break;
				case 'screenshare':
					event = AnalyticsEvent.allScreenshareOff;
					break;
			}
			if (event) {
				ui_analytics.sendData({
					tool: getCallTool(),
					category: AnalyticsCategory.call,
					event,
					type: params.callType,
					p5: `callId_${params.callId}`
				});
			}
		}
		onTurnOffParticipantStream(params) {
			let event = '';
			switch (params.typeOfSetting) {
				case 'mic':
					event = AnalyticsEvent.userMicOff;
					break;
				case 'cam':
					event = AnalyticsEvent.userCameraOff;
					break;
				case 'screenshare':
					event = AnalyticsEvent.userScreenshareOff;
					break;
			}
			if (event) {
				ui_analytics.sendData({
					tool: getCallTool(),
					category: AnalyticsCategory.call,
					event,
					type: params.callType,
					p5: `callId_${params.callId}`
				});
			}
		}
		onAllowPermissionToSpeakResponse(params) {
			ui_analytics.sendData({
				tool: getCallTool(),
				category: AnalyticsCategory.call,
				event: AnalyticsEvent.approveRequest,
				type: params.callType,
				p5: `callId_${params.callId}`
			});
		}
		onDisallowPermissionToSpeakResponse(params) {
			ui_analytics.sendData({
				tool: getCallTool(),
				category: AnalyticsCategory.call,
				event: AnalyticsEvent.denyRequest,
				type: params.callType,
				p5: `callId_${params.callId}`
			});
		}
		#onCallMessageClick(params, element) {
			const resultData = {
				tool: AnalyticsTool.im,
				category: AnalyticsCategory.messenger,
				event: AnalyticsEvent.clickCallButton,
				c_section: this.#getSectionParamByChatType(params.dialog.type),
				c_element: element,
				p5: `chatId_${params.dialog.chatId}`
			};
			resultData.type = this.#getCallTypeParam(params.dialog.type);
			if (params.dialog.type === im_v2_const.ChatType.collab) {
				resultData.p4 = im_v2_lib_analytics.getCollabId(params.dialog.chatId) ?? undefined;
			}
			this.#sendTaskCardCallClick(params.dialog, call_const.CallTypes.video.id);
			ui_analytics.sendData(resultData);
		}
	}

	exports.Analytics = Analytics;

})(this.BX.Call.Lib = this.BX.Call.Lib || {}, BX, BX.UI.Analytics, BX.Messenger.v2.Const, BX.Messenger.v2.Lib, BX.Call.Const);
//# sourceMappingURL=analytics.bundle.js.map
