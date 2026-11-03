import { Type } from 'main.core';

/**
 * A chat opened from the search results with the keyboard owes the focus back to the search it was opened
 * from: exiting that chat leaves the focus on nobody, and the collapsed search is where the walk started.
 *
 * The identity is the whole triple: the area says whose search waits, the layout that the user is still
 * looking at the list it belongs to, the dialog which chat exit is being waited for. One promise per area,
 * because the left column and the collab drawer over it can be waiting at once — a single record would let
 * the inner walk overwrite the outer one without a trace.
 *
 * A promise is spent when the last surface the same action opened is closed: a collab opens two, its chat
 * and the nested list, and while that list is on screen the promise waits for it instead.
 *
 * Kept outside the results component on purpose: the lists that also return the focus after a chat exit
 * have to see that the search is the one waiting for it, and stand down.
 */
export type KeyboardFocusHandoff = {
	searchAreaId: string,
	layoutName: string,
	dialogId: string,
};

// The nested list is opened by the same action that opened its collab chat, so it is addressed by the chat
// it hangs under - the very dialog the promise was made for.
export type NestedListHandoff = {
	layoutName: string,
	dialogId: string,
};

type PendingHandoff = KeyboardFocusHandoff & { heldByNestedList: boolean };

const pendingHandoffs: Map<string, PendingHandoff> = new Map();

function findHandoff(matches: (handoff: PendingHandoff) => boolean): PendingHandoff | null
{
	return [...pendingHandoffs.values()].find((handoff) => matches(handoff)) ?? null;
}

function findHandoffOfNestedList(nestedList: NestedListHandoff): PendingHandoff | null
{
	return findHandoff((handoff: PendingHandoff) => {
		return handoff.layoutName === nestedList.layoutName && handoff.dialogId === nestedList.dialogId;
	});
}

export function armKeyboardFocusHandoff(handoff: KeyboardFocusHandoff): void
{
	// Fail closed on an incomplete handoff: an unaddressed search area would answer for every search on the
	// screen, and an empty dialog id would match the layout with no chat open at all.
	const isComplete = Type.isStringFilled(handoff.searchAreaId)
		&& Type.isStringFilled(handoff.layoutName)
		&& Type.isStringFilled(handoff.dialogId);

	if (!isComplete)
	{
		return;
	}

	pendingHandoffs.set(handoff.searchAreaId, { ...handoff, heldByNestedList: false });
}

/**
 * A copy of the promise, field by field: the record itself stays inside, and so does the state of the walk
 * kept next to it - the caller is told which walk is waiting, not how far it has got.
 */
export function getKeyboardFocusHandoff(searchAreaId: string): KeyboardFocusHandoff | null
{
	const pendingHandoff = pendingHandoffs.get(searchAreaId);
	if (!pendingHandoff)
	{
		return null;
	}

	return {
		searchAreaId: pendingHandoff.searchAreaId,
		layoutName: pendingHandoff.layoutName,
		dialogId: pendingHandoff.dialogId,
	};
}

export function isKeyboardFocusHandoffPending(handoff: KeyboardFocusHandoff): boolean
{
	const pendingHandoff = pendingHandoffs.get(handoff.searchAreaId);
	if (!pendingHandoff)
	{
		return false;
	}

	return pendingHandoff.layoutName === handoff.layoutName && pendingHandoff.dialogId === handoff.dialogId;
}

export function clearKeyboardFocusHandoff(searchAreaId: string): void
{
	// Only the area that armed the handoff may drop it: the other mounted searches see the same layout moves
	// and would otherwise cancel a promise that is not theirs.
	pendingHandoffs.delete(searchAreaId);
}

/**
 * The nested list opened together with that chat is on screen: from now on the promise waits for the list,
 * because it is the last surface that action opened.
 */
export function holdKeyboardFocusHandoffForNestedList(nestedList: NestedListHandoff): void
{
	const handoff = findHandoffOfNestedList(nestedList);
	if (handoff)
	{
		handoff.heldByNestedList = true;
	}
}

export function isKeyboardFocusHandoffHeldByNestedList(nestedList: NestedListHandoff): boolean
{
	return findHandoffOfNestedList(nestedList)?.heldByNestedList === true;
}

// The same state read by the area that owns the promise: its own walk is waiting for a nested list, so a chat
// exit above that list settles nothing.
export function isKeyboardFocusHandoffOfAreaHeldByNestedList(searchAreaId: string): boolean
{
	return pendingHandoffs.get(searchAreaId)?.heldByNestedList === true;
}

/**
 * The nested list is gone, and with it the last surface of the walk. Returns the area whose collapsed search
 * is owed the focus back, or null when there is none to hand it to.
 */
export function releaseKeyboardFocusHandoffFromNestedList(nestedList: NestedListHandoff): string | null
{
	// Matched by the chat alone and not by the pair: a list left behind by a section change is closed in the
	// new layout, and its promise has to be dropped there all the same. Ambiguity is not possible — holding
	// marks a single record, and a second would need two nested lists showing one collab at once.
	const handoff = findHandoff((pendingHandoff: PendingHandoff) => {
		return pendingHandoff.heldByNestedList && pendingHandoff.dialogId === nestedList.dialogId;
	});
	if (!handoff)
	{
		return null;
	}

	pendingHandoffs.delete(handoff.searchAreaId);

	// The promise is over either way, but the focus only goes back to a search the user is still looking at:
	// leaving the section takes the collapsed pill off the screen with it.
	return handoff.layoutName === nestedList.layoutName ? handoff.searchAreaId : null;
}
