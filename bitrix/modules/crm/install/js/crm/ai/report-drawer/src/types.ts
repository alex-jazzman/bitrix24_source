export type AppParams = {
	drawerRequest: DrawerRequest;
	ajaxAction: string;
};

export type ViewData = {
	title: string;
	subtitle: null | SubtitleData;
	settings: Array<SettingButton>;
	record: null | CallRecordData;
	infoPopup: null | InfoPopupData;
	anchors: Array<AnchorData>;
	assessmentBlocks: Array<AssessmentBlockData>;
	blocks: Array<BlockData>;
	aiDisclaimer: string;
	assessmentSetting: null | AssessmentSettingData;
};

export type SubtitleData =
	| {
		type: 'open-lines';
		data: OpenLinesSubtitleData;
	}
	| {
		type: 'email';
		data: EmailSubtitleData;
	}
	| {
		type: 'incoming-call' | 'outgoing-call';
		data: CallSubtitleData;
	}
;

export type SubtitleType = SubtitleData['type'];

export type ConversationSubtitleData = {
	client: null | ClientData;
	managers: ResponsibleData[];
};

export type OpenLinesSubtitleData = ConversationSubtitleData;
export type EmailSubtitleData = ConversationSubtitleData;

export type CallSubtitleData = {
	client: null | ClientData,
	responsible: null | ResponsibleData,
	date: string;
};

export type ClientData = {
	clientName: string;
	clientId: null | number;
	clientEntityTypeId: null | number;
	clientDetailsUrl: null | string;
	isCrmContact?: boolean;
};

export type ResponsibleData = {
	responsibleId: number;
	responsibleName: string;
	responsibleAvatarUrl: string;
	responsibleProfileUrl: string;
	rating: number;
};

export type SettingButtonId = 'choose-new-script' | 'analytics' | 'delimiter' | 'share-slider' | 'how-it-works';

export type SettingButton = {
	id: SettingButtonId;
	onclick?: null | string;
};

export type CallRecordData = {
	recordId: string,
	recordSrc: string,
};

export type InfoPopupEntityData = {
	title: string;
	href: null | string;
	ownerTypeId: number;
};

export type InfoPopupValueActionData = {
	type: 'open-lines-chat';
	value: string;
};

export type InfoPopupPhoneCallActionData = {
	type: 'phone-call';
	phoneNumber: string;
	entityTypeId: null | number;
	entityId: null | number;
	ownerTypeId: null | number;
	ownerId: null | number;
	activityId: null | number;
};

export type InfoPopupEmailActionData = {
	type: 'email-activity';
	value: number;
};

export type InfoPopupActionData =
	| InfoPopupValueActionData
	| InfoPopupPhoneCallActionData
	| InfoPopupEmailActionData
;

export type InfoPopupValueData = {
	text: string;
	isAccent?: boolean;
	action?: null | InfoPopupActionData;
};

type BaseInfoPopupData = {
	entity: InfoPopupEntityData;
	dateAndDuration: string;
};

export type CallInfoPopupData = BaseInfoPopupData & {
	type: 'call';
	isIncomingCall: boolean;
	hasClient: boolean;
	fromNumber: InfoPopupValueData;
	toNumber: InfoPopupValueData;
};

export type OpenLinesInfoPopupData = {
	type: 'open-lines';
	chat: InfoPopupValueData;
	startedAt: string;
	endedAt: string;
	channel: string;
};

export type EmailInfoPopupData = {
	type: 'email';
	entity: null | InfoPopupEntityData;
	conversationStartedAt: null | string;
	lastAnalyzedAt: null | string;
	managers: ResponsibleData[];
	threadContext: 'current';
	activity: {
		action: null | InfoPopupEmailActionData;
	};
};

export type InfoPopupData = CallInfoPopupData | OpenLinesInfoPopupData | EmailInfoPopupData;

export type AnchorData = {
	text: string;
	isActive: boolean;
	blockId: string;
};

export type AssessmentBlockData = {
	blockId: string;
	assessmentSettingId: null | number;
	scriptName: string;
	recommendation: string;
	callScore: number;
	lowerScoreBoundary: number;
	upperScoreBoundary: number;
	failedCriteria: Array<Criterion>;
	successCriteria: Array<Criterion>;
	unusedCriteria: Array<Criterion>;
	useInRating: boolean;
	createdAt: null | number;
	isHistory: boolean;
	shouldShowReassessmentBadge: boolean;
};

export type Criterion = {
	title: string;
	description: string;
	application: string;
	summary: string;
	status: CriterionStatus;
}

export type CriterionStatus = 'success' | 'failure' | 'unused'; // 'failure' is never used, but I added it for integrity

type BaseBlockData = {
	blockId: string;
	title: string;
	createdAt: null | number;
	aiLanguage: null | string;
	minimized: boolean;
};

export type SummaryBlockData = BaseBlockData & {
	blockType: 'summary';
	text: string;
	preserveWhitespace?: boolean;
};

export type TranscriptionBlockData = BaseBlockData & {
	blockType: 'transcription';
	text: string;
};

export type TextBlockData = SummaryBlockData | TranscriptionBlockData;

export type LegacyAssessmentBlockData = BaseBlockData & {
	blockType: 'legacyAssessment';
	text: string;
	scriptName: string;
	assessmentSettingId: null | number;
};

export type BlockData = TextBlockData | LegacyAssessmentBlockData;

export type BlockType = BlockData['blockType'];

export type AssessmentSettingData = {
	id: number;
	title: string;
	promptUpdatedAt: string;
	shouldShowReassessmentBadge: boolean;
};

export type ReassessmentSource = 'updated_script' | 'other_script';

// region Network types
export type ResponseData = {
	status?: string;
	data: any;
	errors: Array<ResponseError>;
};

export type ResponseError = {
	code?: string;
	message: string;
};

export type DrawerRequest = {
	activityId: number;
	ownerTypeId: number;
	ownerId: number;
	jobId: null | number;
	assessmentSettingsId: null | number;
};

export type CallScoringPullData = {
	activityId: number;
	jobId?: null | number;
	ratedUserId?: null | number;
	assessmentSettingsId?: null | number;
	status?: string;
	eventId?: string;
};
// endregion
