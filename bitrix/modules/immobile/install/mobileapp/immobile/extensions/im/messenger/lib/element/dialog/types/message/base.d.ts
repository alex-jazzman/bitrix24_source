import {AttachConfig} from "../../../../../model/messages/src/types/attach";
import {AvatarDetail} from "../../chat-avatar";
import {CommentInfoMessageFormat} from "./element/comment-info";
import {KeyboardButtonConfig} from "../../../../../model/messages/src/types/keyboard";
import {MessageVideo} from "./element/video";
import {MessageImage} from "./element/image";
import {MessageFile} from "./element/file";
import {MessageAudio} from "./element/audio";
import {
	CopilotMessageCopilotData,
	InitialPromptMessageData
} from "./copilot";
import {VoteMessageData} from "../../../src/dialog/message/vote/types/vote";
import {CheckInMessageData} from "../../../src/dialog/message/check-in/types/check-in-configuration";
import {CallMessageData} from "../../../src/dialog/message/call/types/call-configuration";
import {MessageVideoNote} from "./element/video-note";
import {StickerState} from "../../../../../model/sticker-pack/src/types";
import {DialogWidgetBuilderItem} from "../../../../../model/messages/src/types/builder";

declare type MessageRichLink = {
	description: string,
	previewUrl: string,
	link: string,
	name: string,
	attachId: string,
	previewSize: {
		height: number,
		width: number,
	},
}

declare type MessageFootnote = {
	text: string,
	textColor: string,
	backgroundColor: string,
}

declare type MessageButton = {
	id: string,
	text: string,
	leftIcon?: string | Array<string>,
	editable: boolean,
	code?: string,
}

export type DialogWidgetItem = MediaGalleryDialogWidgetItem|FileGalleryDialogWidgetItem|
	FileDialogWidgetItem|ImageDialogWidgetItem|VideoDialogWidgetItem|AudioDialogWidgetItem|
	CopilotDialogWidgetItem|CopilotPromptDialogWidgetItem|CopilotErrorDialogWidgetItem|
	VoteDialogWidgetItem|CheckInDialogWidgetItem|CallDialogWidgetItem|BannerDialogWidgetItem|
	VideoNoteDialogWidgetItem|VideoNoteTextDialogWidgetItem|AiBizprocDialogWidgetItem|BuilderDialogWidgetItem;

export type BaseDialogWidgetItem = {
	align: 'center' | 'left' | 'right' | null,
	attach: Array<AttachConfig>,
	avatar: AvatarDetail | null,
	avatarUrl: string | null,
	canBeChecked: boolean,
	canBeQuoted: boolean,
	commentInfo: CommentInfoMessageFormat | null,
	forwardText: string,
	id: string,
	isAuthorBottomMessage: boolean,
	isAuthorTopMessage: boolean,
	isBackgroundWide: boolean,
	keyboard: Array<KeyboardButtonConfig>,
	loadText: string,
	me: boolean,
	message: Array<{ type: string, text: string }>,
	reactions: Array<DialogWidgetItemReactions>,
	read: boolean,
	richLink: MessageRichLink | null,
	showAvatar: boolean,
	showAvatarsInReaction: boolean,
	showReaction: boolean,
	showUsername: boolean,
	status: null | string,
	statusText: string,
	style: MessageStyle,
	testId: string,
	time: string,
	title: { text?: string, color?: string, },
	type: string,
	userColor: string,
	username: string,
}

type MessageStyle = {
	textAlign: string,
	isBackgroundOn: boolean,
	isBackgroundWide?: boolean,
	roundedCorners: boolean,
	fontColor?: string,
	marginTop?: number,
	marginBottom?: number,
	userNameColor: string,
	message?: {
		fontColor?: string,
		linkColor?: string,
		quoteColor?: string,
		mentionColor?: string,
		timeColor?: string,
		linkUnderlined?: boolean,
		backgroundQuoteColor?: string,
	},
	file?: {
		nameColor?: string,
		downloadIconColor?: string,
		progressIconColor?: string,
		fileSizeColor?: string,
	},
	audio?: {
		rateBorderColor?: string,
		rateBackgroundColor?: string,
		rateTextColor?: string,
		speech2TextBackgroundColor?: string,
		speech2TextIconColor?: string,
		speech2TextLoaderColor?: string,
		speech2TextCollapseIconColor?: string,
		speech2TextSeparatorColor?: string,
		durationColor?: string,
		playButtonBackgroundColor?: string,
		playButtonIconColor?: string,
		waveColor?: string,
		waveActiveColor?: string,
	},
};

export type DialogWidgetItemReactions = {
	id: string,
	testId: string,
	counter: number,
	meLiked: boolean,
	users?: Array<object>,
}

export type MediaGalleryDialogWidgetItem = BaseDialogWidgetItem & {
	mediaList: Array<MessageVideo | MessageImage>,
}

export type ImageDialogWidgetItem = BaseDialogWidgetItem & {
	image: MessageImage,
	imageUrl: string,
	previewParams: {
		height: number,
		width: number,
	},
}

export type FileGalleryDialogWidgetItem = BaseDialogWidgetItem & {
	fileList: Array<MessageFile>,
}
export type FileDialogWidgetItem = BaseDialogWidgetItem & {
	file: MessageFile,
	fileName: string,
	fileSize: number,
	fileIconDownloadSvg: string,
	fileIconSvg: string,
}

export type VideoDialogWidgetItem = BaseDialogWidgetItem & {
	video: MessageVideo,
	videoUrl: string,
	localVideoUrl: string,
	previewImage: string,
	previewParams: {
		height: number,
		width: number,
	},
}

export type VideoNoteDialogWidgetItem = BaseDialogWidgetItem & {
	videoNote: MessageVideoNote,
}

export type VideoNoteTextDialogWidgetItem = AudioDialogWidgetItem & {
	previewUrl: string,
}

export type AudioDialogWidgetItem = BaseDialogWidgetItem & {
	audio: MessageAudio,
	audioUrl: string,
	localAudioUrl: string,
	size: number,
}

export type CopilotDialogWidgetItem = BaseDialogWidgetItem & {
	copilot: CopilotMessageCopilotData,
}
export type CopilotErrorDialogWidgetItem = BaseDialogWidgetItem & {
	copilot: CopilotMessageCopilotData,
}
export type CopilotPromptDialogWidgetItem = BaseDialogWidgetItem & {
	copilot: CopilotMessageCopilotData,
	initialPrompt: InitialPromptMessageData,
}

export type VoteDialogWidgetItem = BaseDialogWidgetItem & {
	vote: VoteMessageData,
}

export type CheckInDialogWidgetItem = BaseDialogWidgetItem & {
	checkIn: CheckInMessageData,
}

export type CallDialogWidgetItem = BaseDialogWidgetItem & {
	call: CallMessageData,
}

export type BannerDialogWidgetItem = BaseDialogWidgetItem & {
	banner: CallMessageData,
}

export type AiAssistantDialogWidgetItem = BaseDialogWidgetItem & {
	buttons: MessageButton[],
	footnote: MessageFootnote,
}

export type AiBizprocDialogWidgetItem = BaseDialogWidgetItem & {
	footnote: MessageFootnote,
}

export type StickerDialogWidgetItem = BaseDialogWidgetItem & {
	sticker: StickerState,
}

export type BuilderDialogWidgetItem = BaseDialogWidgetItem & {
	builder: DialogWidgetBuilderItem,
}

export type Speech2Text = {
	text: string,
	textColor: string,
	status: 'ready' | 'progress' | 'expanded' | 'error',
}
