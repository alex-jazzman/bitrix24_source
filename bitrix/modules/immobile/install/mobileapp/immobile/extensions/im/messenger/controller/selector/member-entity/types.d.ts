/* eslint-disable no-unused-vars */

/** A member of a chat as `Chat.MemberEntities.list` returns it: an `[entityId, id]` pair. */
type MemberEntityId = [string, number | string];

/** An entity the selector returns: a person or a node of the org structure. */
type MemberEntity = {
	type: string,
	id: number | string,
};

/** The selection split by the way its parts reach a chat, plus what neither call takes. */
type MemberEntitySplit = {
	userIds: number[],
	structureNodes: MemberEntityId[],
	unsupportedEntities: MemberEntity[],
};

/**
 * Boundaries of the two calls a selection reaches a chat by, reported so that an entry point can
 * measure them. The marking itself stays with the entry points: they mark the send differently, and
 * one of them does not mark it at all.
 */
type MemberEntitySendProbe = {
	onUsersCallStart?: () => void,
	onUsersCallEnd?: () => void,
	onNodesCallStart?: () => void,
	onNodesCallEnd?: () => void,
};

type MemberEntitySendParams = {
	chatService: ChatService,
	chatId: number,
	userIds: number[],
	structureNodes: MemberEntityId[],
	historyShow: boolean,
	probe?: MemberEntitySendProbe,
};

/** Errors of each of the two calls: `null` for a call that went through or was never made. */
type MemberEntitySendResult = {
	usersErrors: BackendError[] | null,
	nodesErrors: BackendError[] | null,
};

type MemberEntitySelectorProps = {
	dialogId?: DialogId,
	goal?: 'chat' | 'collabProject',
	title?: string,
	/** Wording of the confirm button: left out, the widget falls back to its own text. */
	sendButtonName?: string,
	integrateSelectorToParentLayout?: boolean,
	onSelectedChanged?: (selectedEntities: MemberEntity[]) => void,
	/** Called with the part of the selection the chat does not have yet, never with the whole of it. */
	onSelectMemberEntities: (addedEntities: MemberEntity[]) => void,
};
