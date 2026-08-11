/* eslint-disable */
type AIRecordStartParams = BaseCallTypeParams & {
	chatUserCount: number;
	isAutostart?: boolean;
	userCount?: number;
	errorCode?: 'AI_UNAVAILABLE_ERROR' | 'AI_SETTINGS_ERROR' | 'AI_AGREEMENT_ERROR' | 'AI_NOT_ENOUGH_BAAS_ERROR';
};

type BaseCallTypeParams = BaseCallParams & {
	callType: string;
};

type BaseCallParams = {
	callId: string;
};

type AIRecordStatusChangedParams = BaseCallTypeParams & {
	isAIOn: boolean;
	error?: string;
};

type OpenFollowUpTabParams = BaseCallParams & {
	tabName: string;
};

type AIRestrictionsPopupShowParams = BaseCallParams & {
	popupType: string;
};

type CopilotNotifyShowParams = BaseCallParams & {
	isCopilotActive: boolean;
};

type BaseCallTypeParams = BaseCallParams & {
	callType: string;
};

type BaseCallParams = {
	callId: string;
};

type ScreenShareStoppedParams = BaseCallTypeParams & {
	status: string;
	screenShareLength: number;
};

type StartVideoconfParams = BaseCallParams & {
	withVideo: boolean;
	status: string;
	mediaParams: MediaParams;
	userCounter: number;
	isCopilotActive: boolean;
	isVpnActive: boolean;
};

type MediaParams = {
	video: boolean;
	audio?: boolean;
};

type JoinVideoconfParams = BaseCallParams & {
	withVideo: boolean;
	status: string;
	mediaParams: Required<MediaParams>;
	isVpnActive: boolean;
};

type StartCallParams = BaseCallTypeParams & {
	status: string;
	mediaParams: MediaParams;
	associatedEntity: AssociatedEntity;
	isCopilotActive: boolean;
	isVpnActive: boolean;
};

type AssociatedEntity = {
	id?: string;
	userCounter?: number;
	advanced: {
		chatType: string;
		entityId?: string | number;
	};
};

type StartCallErrorParams = {
	callType: string;
	errorCode: string;
	errorMessage?: string;
	isVpnActive: boolean;
};

type JoinCallParams = BaseCallTypeParams & {
	status: string;
	isVpnActive: boolean;
	section?: string;
	element?: string;
	mediaParams?: Required<MediaParams>;
	associatedEntity: AssociatedEntity;
};

type CallErrorParams = BaseCallTypeParams & {
	errorCode: string;
	errorMessage?: string;
	isVpnActive: boolean;
};

type ReconnectParams = BaseCallTypeParams & {
	reconnectionReason?: string;
	reconnectionReasonInfo?: string;
	isVpnActive: boolean;
	reconnectionEventCount: number;
};

type InviteUserParams = BaseCallTypeParams & {
	chatId: string;
};

type DisconnectCallParams = BaseCallTypeParams & {
	subSection?: string;
	mediaParams: Required<MediaParams>;
};

type FinishCallParams = BaseCallTypeParams & {
	status: string;
	callLength: number;
	callUsersCount: number;
	chatId: string;
};

type RecordStartParams = RecordWithErrorParams & {
	recordType: string;
};

type RecordWithErrorParams = BaseCallTypeParams & {
	errorCode?: string;
};

type RecordStopParams = BaseCallTypeParams & {
	subSection?: string;
	element?: string;
	recordTime?: number;
};

type ToggleCameraParams = BaseCallTypeParams & {
	video: boolean;
};

type ToggleMicrophoneParams = BaseCallTypeParams & {
	muted: boolean;
};

type ClickUserParams = BaseCallTypeParams & {
	layout: string;
};

type DocumentWithTypeParams = BaseCallTypeParams & {
	type: string;
};

type ChatCallClickParams = {
	callType: string;
	dialog: DialogData;
};

type DialogData = {
	type: string;
	chatId?: string;
	entityLink?: {
		id: string | number;
	};
};

type ContextMenuCallClickParams = {
	callType: string;
	context: DialogData;
};

type ConferenceClickParams = {
	chatId: string;
};

type SettingTypeParams = BaseCallTypeParams & {
	typeOfSetting: 'mic' | 'cam' | 'screenshare';
};

type StreamTypeParams = BaseCallTypeParams & {
	typeOfStream: 'mic' | 'cam' | 'screenshare';
};

declare namespace BX.Call.Lib {
	class Analytics {
		static AnalyticsType: Readonly<{
			private: "private";
			group: "group";
			videoconf: "videoconf";
			video: "video";
			audio: "audio";
			resume: "resume";
			doc: "doc";
			presentation: "presentation";
			sheet: "sheet";
			privateCall: "private";
			groupCall: "group";
			aiOn: "ai_on";
			turnOnAi: "turn_on_ai";
		}>;
		static AnalyticsStatus: Readonly<{
			success: "success";
			decline: "decline";
			busy: "busy";
			noAnswer: "no_answer";
			quit: "quit";
			lastUserLeft: "last_user_left";
			finishedForAll: "finished_for_all";
			privateToGroup: "private_to_group";
			errorAgreement: "error_agreement";
			errorLimitBaas: "error_limit_baas";
			errorB24: "error_b24";
		}>;
		static AnalyticsSection: Readonly<{
			callWindow: "call_window";
			callPopup: "call_popup";
			chatList: "chat_list";
			chatWindow: "chat_window";
			taskChat: "task_chat";
			taskCard: "task_card";
			chatTasks: "chat_tasks";
			callMessage: "call_message";
			callFollowup: "call_followup";
			call: "call";
		}>;
		static AnalyticsElement: Readonly<{
			answerButton: "answer_button";
			joinButton: "join_button";
			videocall: "videocall";
			audiocall: "audiocall";
			recordButton: "record_button";
			disconnectButton: "disconnect_button";
			finishForAllButton: "finish_for_all_button";
			videoButton: "video_button";
			audioButton: "audio_button";
			startButton: "start_button";
			initialBanner: "initial_banner";
			startMessage: "start_message";
			finishMessage: "finish_message";
		}>;
		static AnalyticsSubSection: Readonly<{
			finishButton: "finish_button";
			contextMenu: "context_menu";
			window: "window";
			taskCard: "task_card";
		}>;
		copilot: Copilot;
		static getInstance(): Analytics;
		safeDecode(str: string): string;
		onScreenShareBtnClick({ callId, callType }: BaseCallTypeParams): void;
		onScreenShareStarted({ callId, callType }: BaseCallTypeParams): void;
		onScreenShareStopped({ callId, callType, status, screenShareLength }: ScreenShareStoppedParams): void;
		onAnswerConference(params: BaseCallParams): void;
		onDeclineConference(params: BaseCallParams): void;
		onStartVideoconf(params: StartVideoconfParams): void;
		onJoinVideoconf(params: JoinVideoconfParams): void;
		onStartCall(params: StartCallParams): void;
		onStartCallError(params: StartCallErrorParams): void;
		onJoinCall(params: JoinCallParams): void;
		onJoinCallError(params: CallErrorParams): void;
		onReconnect(params: ReconnectParams): void;
		onReconnectError(params: CallErrorParams): void;
		onInviteUser(params: InviteUserParams): void;
		onDisconnectCall(params: DisconnectCallParams): void;
		onFinishCall(params: FinishCallParams): void;
		onRecordBtnClick(params: BaseCallTypeParams): void;
		onRecordStart(params: RecordStartParams): void;
		onRecordPaused(params: RecordWithErrorParams): void;
		onRecordResumed(params: RecordWithErrorParams): void;
		onRecordDelete(params: RecordWithErrorParams): void;
		onRecordStop(params: RecordStopParams): void;
		onCloudRecordPopupShow(params: BaseCallParams & {
			popupType: string;
		}): void;
		onToggleCamera(params: ToggleCameraParams): void;
		onToggleMicrophone(params: ToggleMicrophoneParams): void;
		onClickUser(params: ClickUserParams): void;
		onFloorRequest(params: BaseCallTypeParams): void;
		onShowChat(params: BaseCallTypeParams): void;
		onDocumentBtnClick(params: BaseCallTypeParams): void;
		onDocumentCreate(params: DocumentWithTypeParams): void;
		onDocumentClose(params: DocumentWithTypeParams): void;
		onDocumentUpload(params: DocumentWithTypeParams): void;
		onLastResumeOpen(params: BaseCallTypeParams): void;
		normalizeChatId(chatId: string | undefined): string | number;
		onChatHeaderStartCallClick(params: ChatCallClickParams): void;
		onContextMenuStartCallClick(params: ContextMenuCallClickParams): void;
		onStartConferenceClick(params: ConferenceClickParams): void;
		onChatCreationMessageStartCallClick(params: ConferenceClickParams): void;
		onChatStartConferenceClick(params: ConferenceClickParams): void;
		onJoinConferenceClick(params: BaseCallParams): void;
		onStartCallMessageClick(params: ChatCallClickParams): void;
		onFinishCallMessageClick(params: ChatCallClickParams): void;
		onOpenCallSettings(params: BaseCallTypeParams): void;
		onCallSettingsChanged(params: SettingTypeParams): void;
		onTurnOffAllParticipansStream(params: StreamTypeParams): void;
		onTurnOffParticipantStream(params: SettingTypeParams): void;
		onAllowPermissionToSpeakResponse(params: BaseCallTypeParams): void;
		onDisallowPermissionToSpeakResponse(params: BaseCallTypeParams): void;
	}

	class Copilot {
		onAIRecordStart(params: AIRecordStartParams): void;
		onAIRecordStatusChanged(params: AIRecordStatusChangedParams): void;
		onOpenFollowUpTab(params: OpenFollowUpTabParams): void;
		onOpenFollowUpSlider(params: BaseCallParams): void;
		onFollowUpCreateEventClick(params: BaseCallParams): void;
		onFollowUpCreateTaskClick(params: BaseCallParams): void;
		onAIRestrictionsPopupShow(params: AIRestrictionsPopupShowParams): void;
		onCopilotNotifyShow(params: CopilotNotifyShowParams): void;
		onAIRecordTimeCodeClick(params: BaseCallParams): void;
		onAIPlayRecord(params: BaseCallParams): void;
		onClickAIOff(params: BaseCallTypeParams): void;
		onSelectAIOff(params: BaseCallTypeParams): void;
		onSelectAIDelete(params: BaseCallTypeParams): void;
	}
}
