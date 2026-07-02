import {DialogId} from "../../../../types/common";
import {MessagesModelState} from "../../../../model/messages/src/types/messages";

type CreateMessageOptions = {
	showUsername?: boolean,
	showAvatar?: boolean,
	showReactions?: boolean,
	fontColor?: string,
	canBeQuoted?: boolean,
	canBeChecked?: boolean,
	isBackgroundOn?: boolean,
	showReaction?: boolean,
	marginTop?: number,
	marginBottom?: number,
	showCommentInfo?: boolean,
	audioRate?: number,
	showAvatarsInReaction?: boolean,
	initialPostMessageId?: string,
	dialogId?: DialogId,
	dialogCode?: string,
};

/**
 * Represents a rule for determining and creating a specific message type.
 */
export type MessageTypeRule<TMessage = any, THelper = any> = {
	/**
	 * The unique type name of the message (should match MessageType constant).
	 */
	type: string,
	/**
	 * Predicate function to check if the rule is suitable.
	 */
	isSuitable: (helper: THelper) => boolean,
	/**
	 * Factory function to create a message UI element.
	 */
	create: (model: MessagesModelState, options: CreateMessageOptions) => TMessage,
};

/**
 * Array of all message type rules, in priority order.
 */
export type MessageTypeRules = Array<MessageTypeRule>;
