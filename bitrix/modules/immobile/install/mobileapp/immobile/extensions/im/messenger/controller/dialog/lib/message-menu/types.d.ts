import { MessagesModelState } from '../../../../model/messages/src/types/messages';
import { FilesModelState } from '../../../../model/files/src/types';
import { DialoguesModelState } from '../../../../model/dialogues/src/types';
import { UsersModelState } from '../../../../model/users/src/types';
import {DialogLocator} from "../../types/dialog";
import {DialogWidgetMessageMenu, DialogWidgetMessageMultiLevelMenu} from "../../../../view/dialog/types/dialog";

export type MessageContextMenuActionItem = MessageContextMenuSeparator | MessageContextMultiLevelMenuActionItem | {
	id: string,
	testId: string,
	type: 'button',
	text: string,
	iconName: string,
	iconFallbackUrl: string,
	/** @deprecated after API 54 use iconName and iconFallbackUrl instead */
	iconSvg?: string,
	style?: {
		fontColor?: string,
		iconColor?: string
	},
};

export type MessageContextMenuSectionItem = {
	id: string,
	title: string,
	iconName: string,
	iconUrl: string,
	style?: {
		title?: object
		icon?: object
	},
};

export type MessageContextMultiLevelMenuActionItem = {
	type: 'base' | 'subtitle',
	id: string,
	title: string,
	sectionCode: string,
	iconName: string,
	iconUrl: string,
	counterValue: string,
	titleIconName: string,
	titleIconUrl: string,
	titleBadgeValue: string,
	checked: boolean,
	disable: boolean,
	nextMenu?: MessageContextMultiLevelNextMenuActionItem,
	styles?: {
		counter?: MultiLevelMenuActionItemStyleData,
		title?: MultiLevelMenuActionItemStyleData,
		subtitle?: MultiLevelMenuActionItemStyleData,
		titleIcon?: MultiLevelMenuActionItemStyleData,
		titleBadge?: MultiLevelMenuActionItemStyleData,
		checked?: MultiLevelMenuActionItemStyleData,
	}
};

export type MessageContextMultiLevelNextMenuActionItem = {
	items: MessageContextMultiLevelMenuActionItem[],
	sections: MessageContextMenuSectionItem[],
	icon: string
	title: string
	styles: object,
};

export type MultiLevelMenuActionItemStyleData = {
	color: string
	backgroundColor: string,
	font: {
		color: string,
		colorGradient?: {
			colors: Array<string>,
			positions: Array<number>,
			angle: number,
		}
	}
};

export type MessageContextMenuReactionItem = {
	id: string,
	testId: string,
	imageUrl: string,
	lottieUrl: string,
	svgUrl: string,
};

export type MessageContextTreeSectionNode = {
	sectionId: string,
	children: string[],
	nextMenuActionType?: string,
};

declare type MessageContextMenuSeparator = {
	type: 'separator',
};

interface IMessageMenuActionHelper {
	messageModel: MessagesModelState;
	fileModel?: FilesModelState;
	dialogModel: DialoguesModelState;
	userModel: UsersModelState;
	isPinned: boolean;
	isUserSubscribed: boolean;

	isPossibleReact(): boolean;

	isPossibleReply(): boolean;

	isPossibleCopy(): boolean;

	isPossibleCopyLink(): boolean;

	isPossibleMark(): boolean;

	isPossiblePin(): boolean;

	isPossibleUnpin(): boolean;

	isPossibleForward(): boolean;

	isPossibleCreate(): boolean;

	isPossibleTaskCreate(): boolean;

	isPossibleEventCreate(): boolean;

	isPossibleSaveFile(): boolean;

	isPossibleDownloadToDevice(): boolean;

	isPossibleSaveGallery(): boolean;

	isPossibleSaveToLibrary(): boolean;

	isPossibleSaveMediaToLibrary(): boolean;

	isPossibleShowProfile(): boolean;

	isPossibleCallFeedback(): boolean;

	isPossibleMultiselect(): boolean;

	isPossibleEdit(): boolean;

	isPossibleDelete(): boolean;

	isPossibleSubscribe(): boolean;

	isPossibleUnsubscribe(): boolean;

	isPossibleResend(): boolean;

	isPossibleFinishVote(): boolean;

	isPossibleRevote(): boolean;

	isPossibleOpenVoteResult(): boolean;

	isPossibleAskCopilot(): boolean;

	isDialogCopilot(): boolean;

	isAiAssistantMessage(): boolean;

	isAdmin(): boolean;

	isManager(): boolean;
}

interface IMessageMenuView {
	reactionList: string[];
	showMoreReactions: boolean;

	get actions(): Array<MessageContextMultiLevelMenuActionItem>;

	addReaction(reaction: MessageContextMenuReactionItem): this;
	addSeparator(): this;
	addAction(action: MessageContextMenuActionItem, options: object): this;

	setMoreReactionsSetting(value: boolean): this;
	setReactionVersion(value: number): this;

	clearUnnecessarySeparators(): void;

	toDialogWidgetMessageMenu(): DialogWidgetMessageMenu;
}

interface IMessageMultiMenuView {
	showMoreReactions: boolean;
	reactionList: MessageContextMenuReactionItem[],
	actionListItems: MessageContextMultiLevelMenuActionItem[],
	actionListSections: MessageContextMenuSectionItem[],

	get actions(): Array<MessageContextMultiLevelMenuActionItem>;

	addReaction(reaction: MessageContextMenuReactionItem): this;
	addSeparator(): this;
	addAction(action: MessageContextMenuActionItem, options: object): this;
	addSection(section: MessageContextMenuSectionItem): this;

	setMoreReactionsSetting(value: boolean): this;

	toDialogWidgetMessageMenu(): DialogWidgetMessageMultiLevelMenu;
}

type MessageMenuControllerCreateParams = {
	serviceLocator: DialogLocator,
	getDialog: () => DialoguesModelState,
}

export interface IOneLevelMessageMenuManager {
	readonly actionHelper: IMessageMenuActionHelper;
	get handlers(): Record<string, (actionHelper: IMessageMenuActionHelper) => void>;
	get actions(): Record<string, (menu: IMessageMenuView, actionHelper: IMessageMenuActionHelper) => void>;

	createMenu(): Promise<DialogWidgetMessageMenu>;
	createErrorMenu(): Promise<DialogWidgetMessageMenu>;
	createSendingMenu(): Promise<DialogWidgetMessageMenu>;

	getActions(messageId?: number): Promise<Record<string, (menu: IMessageMenuView, actionHelper: IMessageMenuActionHelper) => void>>;
	getActionHandlers(messageId?: number): Promise<Record<string, (actionHelper: IMessageMenuActionHelper) => void>>;

	getOrderedActions(): Promise<string[]>;
	getOrderedActionsForErrorMessage(): Promise<string[]>;

	invokeActionHandler(actionId: string, params: MessageMenuActionTapParams): void;
}

export interface IMultiLevelMessageMenuManager {
	readonly actionHelper: IMessageMenuActionHelper;

	get handlers(): Record<string, (actionHelper: IMessageMenuActionHelper) => void>;
	get actions(): Record<string, (menu: IMessageMenuView, actionHelper: IMessageMenuActionHelper) => void>;
	get sections(): Record<string, MessageContextMenuSectionItem>;

	createMenu(): Promise<DialogWidgetMessageMultiLevelMenu>;
	createErrorMenu(): Promise<DialogWidgetMessageMultiLevelMenu>;
	createSendingMenu(): Promise<DialogWidgetMessageMultiLevelMenu>;

	getActions(messageId?: number): Promise<Record<string, (menu: IMessageMenuView, actionHelper: IMessageMenuActionHelper) => void>>;
	getActionHandlers(messageId?: number): Promise<Record<string, (actionHelper: IMessageMenuActionHelper) => void>>;

	getOrderedActionTree(messageId?: number): Promise<(string|object)[]>;
	getOrderedErrorActionTree(messageId?: number): Promise<(string|object)[]>;
	getOrderedSendingActionTree(messageId?: number): Promise<(string|object)[]>;

	getSection(messageId?: number): Promise<Record<string, MessageContextMenuSectionItem>>;
	getErrorMenuSection(messageId?: number): Promise<Record<string, MessageContextMenuSectionItem>>;
	getSendingMenuSection(messageId?: number): Promise<Record<string, MessageContextMenuSectionItem>>;

	invokeAction(actionId: string, view: IMessageMultiMenuView, options: object): void;
	invokeActionHandler(actionId: string, params: MessageMenuActionTapParams): void;
	invokeSection(actionId: string): MessageContextMenuSectionItem;
}

export type MessageMenuActionTapParams = {
	sectionId: string
}

export type MessageMenuActionHandlerParams = MessageMenuActionTapParams & {
	actionId: string,
}
