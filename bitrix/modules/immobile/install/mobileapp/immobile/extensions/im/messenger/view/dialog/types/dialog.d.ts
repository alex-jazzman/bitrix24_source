import { JNBaseClassInterface } from "../../../../../../../../../../mobile/dev/janative/api";
import { DialogWidgetItem } from "../../../lib/element/dialog/types/message/base";
import {DialogReactionSettingCurrentUserAvatar} from "../../../controller/dialog/types/dialog";
import {
	MessageContextMenuActionItem,
	MessageContextMenuReactionItem, MessageContextMenuSectionItem, MessageContextMultiLevelMenuActionItem
} from "../../../controller/dialog/lib/message-menu/types";

declare type MessagesContextOptions = {
	targetMessageId: string | number,
	withMessageHighlight: boolean,
	targetMessagePosition: string,
}

export type UpdateMessageByIdUpdatingBlocksParam = UpdatingBlocksEnum | null;

export enum UpdatingBlocksEnum {
	status = 'status',
	showAvatar = 'showAvatar',
	isAuthorBottomMessage = 'isAuthorBottomMessage',
	isAuthorTopMessage = 'isAuthorTopMessage',
	showUsername = 'showUsername',
	commentInfo = 'commentInfo',
	vote ='vote',
	reactionAnimate ='reaction_animate_',
	withoutUi ='without-ui',
	aiAnimation ='aiAnimation',
	actions = 'actions',
}

export interface ChatWidgetViewInterface extends JNBaseClassInterface {
	addMessages(messages: DialogWidgetItem[]): Promise<void>;
	pushMessages(messages: DialogWidgetItem[]): Promise<void>;
	removeMessagesByIds(ids: string[]): Promise<void>;
	setMessages(messages: DialogWidgetItem[], options?: MessagesContextOptions): Promise<void>;
	insertMessages(messageId: string, messages: DialogWidgetItem[], target: string): Promise<void>;
	updateMessageById(id: string, message: DialogWidgetItem, updatingBlocks?: string[]): Promise<void>;
	updateMessagesByIds(messages: Record<string, DialogWidgetItem>): Promise<void>;
	highlightMessageById(messageId: string): void;
	showTopLoader(): void;
	hideTopLoader(): void;
	setNewMessageCounter(counter: string | number): void;
	/** @deprecated Use getViewableMessagesAsync instead */
	getViewableMessages(): Promise<{ indexList: number[]; messageList: DialogWidgetItem[] }>;
	getViewableMessagesAsync(): Promise<{ indexList: number[]; messageList: DialogWidgetItem[] }>;
	showScrollToNewMessagesButton(): void;
	hideScrollToNewMessagesButton(): void;
	updateUploadProgressByMessageId(
		messageId: string,
		currentBytes?: number,
		totalBytes?: number,
		textProgress?: string,
		mediaId?: string,
	): void;
	setCurrentUserAvatar(avatar: DialogReactionSettingCurrentUserAvatar): void;
	showFloatingText(): void;
	hideFloatingText(): void;
	setFloatingText(text: string): void;
	showLoader(): void;
	hideLoader(): void;
	showMenuForMessage(message: DialogWidgetItem, menu: DialogWidgetMessageMenu): void;
	showMultiLevelMenuForMessage(message: DialogWidgetItem, menu: DialogWidgetMessageMultiLevelMenu): void;
	scrollToMessageByIndex(
		index: number,
		animate?: boolean,
		onComplete?: () => void,
		position?: string
	): Promise<void>;
	scrollToMessageById(
		messageId: string | number,
		animate?: boolean,
		onComplete?: () => void,
		position?: string
	): Promise<void>;
	getPlayingTime(messageId: string | number): number;
	getLocalPathListForMessage(messageId: string): Promise<string[]>;
	downloadFilesForMessage(messageId: string): Promise<boolean>;
	isAllContentCache(messageId: string): Promise<boolean>;
}

export type DialogWidgetMessageMenu = {
	showMoreReactions: false,
	reactionVersion: false,
	reactionList: MessageContextMenuReactionItem[],
	actionList: MessageContextMenuActionItem[],
}

export type DialogWidgetMessageMultiLevelMenu = {
	showMoreReactions: false,
	reactionList: MessageContextMenuReactionItem[],
	actionListItems: MessageContextMultiLevelMenuActionItem[],
	actionListSections: MessageContextMenuSectionItem[],
}
