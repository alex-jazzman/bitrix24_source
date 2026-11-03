/* eslint-disable */
type ToggleMicrophoneCommand = {
	source?: AnalyticsElementValue;
	muted: boolean;
	applied: boolean;
};

type AnalyticsElementValue = typeof BX.Call.Lib.AnalyticsElement[keyof typeof BX.Call.Lib.AnalyticsElement];

type AIRecordStartParams = BaseCallTypeParams & FailureParams & {
	chatUserCount: number;
	isAutostart?: boolean;
	userCount?: number;
};

type BaseCallTypeParams = BaseCallParams & {
	callType: string;
};

type BaseCallParams = {
	callId: string;
};

type FailureParams = {
	isFailure: boolean;
	errorCode?: unknown;
};

type AIRecordStatusChangedParams = BaseCallTypeParams & FailureParams & {
	isAIOn: boolean;
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
	callId?: CallIdentifier;
	errorCode: string;
	errorMessage?: string;
	isVpnActive: boolean;
	isOffline?: boolean;
};

type CallIdentifier = string | number;

type JoinCallParams = BaseCallTypeParams & {
	status: string;
	isVpnActive: boolean;
	section?: string;
	element?: string;
	mediaParams?: Required<MediaParams>;
	associatedEntity: AssociatedEntity;
};

type JoinCallErrorParams = Omit<CallErrorParams, 'callId'> & {
	callId?: CallIdentifier;
	isRoomClosed?: boolean;
	isOffline?: boolean;
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
};

type ReconnectResultParams = BaseCallTypeParams & {
	status: string;
	reconnectionReason?: string;
	attemptCount: number;
	isVpnActive: boolean;
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
	storageType?: AnalyticsStorageTypeValue;
};

type RecordWithErrorParams = BaseCallTypeParams & {
	errorCode?: string;
};

type AnalyticsStorageTypeValue = typeof BX.Call.Lib.AnalyticsStorageType[keyof typeof BX.Call.Lib.AnalyticsStorageType];

type RecordStateParams = RecordWithErrorParams & {
	storageType?: AnalyticsStorageTypeValue;
};

type RecordStopParams = BaseCallTypeParams & {
	subSection?: string;
	element?: string;
	recordTime?: number;
	storageType?: AnalyticsStorageTypeValue;
};

type ToggleCameraParams = BaseCallTypeParams & {
	video: boolean;
};

type ToggleMicrophoneParams = BaseCallTypeParams & {
	muted: boolean;
	source?: AnalyticsElementValue;
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
	readonly type: string;
	readonly chatId?: number;
	readonly entityLink?: {
		readonly id: string | number;
	};
};

type ContextMenuCallClickParams = {
	callType: string;
	context: DialogData;
};

type ConferenceClickParams = {
	chatId: string;
};

type RecentStartCallClickParams = {
	chatId: string;
	isGroupChat: boolean;
};

type ChatMessageCallClickParams = {
	dialog: DialogData;
};

type SettingTypeParams = BaseCallTypeParams & {
	typeOfSetting: 'mic' | 'cam' | 'screenshare';
};

type StreamTypeParams = BaseCallTypeParams & {
	typeOfStream: 'mic' | 'cam' | 'screenshare';
};

declare namespace BX.Call.Lib {
	/**
	 * A command that did not reach the device library is not reported at all. The microphone push-to-talk
	 * closes is not reported either - only the one it opens is.
	 */
	function shouldSendToggleMicrophone(command: ToggleMicrophoneCommand): boolean;

	const AnalyticsElement: Readonly<{
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
		micButton: "mic_button";
		pushToTalk: "push_to_talk";
	}>;

	/**
	 * Names a failure code for the status field. There is no dictionary of codes: the recording service
	 * is external and sends whatever it has.
	 */
	function toAnalyticsErrorStatus(errorCode?: unknown): string;

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
			sync: "sync";
			syncTabPromo: "synctabpromo";
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
			notRecovered: "not_recovered";
			notConnected: "not_connected";
			escalated: "escalated";
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
			syncPage: "sync_page";
			im: "im";
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
			micButton: "mic_button";
			pushToTalk: "push_to_talk";
		}>;
		static AnalyticsSubSection: Readonly<{
			finishButton: "finish_button";
			contextMenu: "context_menu";
			window: "window";
			taskCard: "task_card";
			mainButton: "main_button";
		}>;
		static AnalyticsStorageType: Readonly<{
			cloud: "cloud";
			local: "local";
		}>;
		copilot: Copilot;
		sync: Sync;
		syncTabBanner: SyncTabBanner;
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
		onJoinCallError(params: JoinCallErrorParams): void;
		onReconnect(params: ReconnectParams): void;
		/**
		 * The outcome of a reconnect series, sent once per series. `status` carries the outcome itself,
		 * so the reason the series started travels in `p3`; otherwise `success` and `not_recovered`
		 * would not say what they are about. Underscores of the reason become hyphens in `p3`: a value
		 * of p1-p5 with two of them drops the whole event, and the `msg_` prefix already spends the
		 * only one allowed. A series that started without a reason leaves the key out altogether, the
		 * same way the initiation does.
		 */
		onReconnectResult(params: ReconnectResultParams): void;
		onInviteUser(params: InviteUserParams): void;
		onDisconnectCall(params: DisconnectCallParams): void;
		onFinishCall(params: FinishCallParams): void;
		onRecordBtnClick(params: BaseCallTypeParams): void;
		onRecordStart(params: RecordStartParams): void;
		onRecordPaused(params: RecordStateParams): void;
		onRecordResumed(params: RecordStateParams): void;
		onRecordDelete(params: RecordStateParams): void;
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
		onRecentStartCallClick(params: RecentStartCallClickParams): void;
		onChatStartConferenceClick(params: ConferenceClickParams): void;
		onJoinConferenceClick(params: BaseCallParams): void;
		onStartCallMessageClick(params: ChatMessageCallClickParams): void;
		onFinishCallMessageClick(params: ChatMessageCallClickParams): void;
		onOpenCallSettings(params: BaseCallTypeParams): void;
		onDeleteUser(params: BaseCallTypeParams): void;
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

	class Sync {
		onOpenSection(): void;
		onStartCallClick(): void;
		onJoinClick(): void;
		onJoinCall(): void;
		onCreateEventClick(): void;
		onOpenSlotsClick(): void;
		onBookingClick(): void;
	}

	class SyncTabBanner {
		onBannerView(): void;
		onButtonClick(): void;
	}

	const AnalyticsStorageType: Readonly<{
		cloud: "cloud";
		local: "local";
	}>;
}
