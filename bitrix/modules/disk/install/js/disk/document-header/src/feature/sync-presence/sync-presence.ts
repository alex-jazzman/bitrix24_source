import { Type } from 'main.core';

import { HeaderErrorCode } from '../../const/error';
import { type PresenceConfig, PresencePullContract } from '../../const/presence';
import { documentHeaderService } from '../../infrastructure/service/document-header/document-header';
import { type HeaderServiceError } from '../../infrastructure/service/document-header/types';
import { usePresenceStore } from '../../model/presence/presence';
import { type PresenceParticipant } from '../../model/presence/types';

export type PresenceLoadResult =
	| { success: true }
	| { success: false, error: HeaderServiceError }
;

/** The refusal of a request there is nothing to make it by; the block stays as unavailable as it starts. */
const NoSessionError: HeaderServiceError = { code: HeaderErrorCode.NoDocumentSession, message: '' };

/** The roster as the `documentPresence` command delivers it on the wire. */
type RosterEvent = {
	scope: string,
	revision: number,
	participants: PresenceParticipant[],
};

/**
 * The starting roster of the opening. A roster that could not be received leaves the block
 * unavailable: an empty stack and a knowingly incomplete one are both worse than no stack at all.
 *
 * The answer travels next to the live channel and may arrive after it: a roster older than the one
 * already applied describes a state which is no longer true, so it confirms the block and changes
 * nothing else.
 */
export async function loadInitialPresence(documentSessionHash: string | undefined): Promise<PresenceLoadResult>
{
	// the roster belongs to a session of a document; an opening without one carries no such element at all
	if (!Type.isStringFilled(documentSessionHash))
	{
		return { success: false, error: NoSessionError };
	}

	const store = usePresenceStore();
	const result = await documentHeaderService.getPresence(documentSessionHash);
	if (!result.success)
	{
		store.setAvailable(false);

		return { success: false, error: result.error };
	}

	if (result.data.revision >= store.revision)
	{
		store.setParticipants(result.data.participants);
		store.setRevision(result.data.revision);
	}

	store.setAvailable(true);

	return { success: true };
}

/**
 * The presence configuration the server gave to this opening. The name of the pull command comes from
 * it and is compared with the one the header expects, so a configuration built for anything else than
 * the `documentPresence` command of `disk` leaves the live channel unused: the block then keeps the
 * last confirmed roster.
 *
 * @returns whether the live channel described by the configuration may be listened to.
 */
export function applyPresenceConfig(config: PresenceConfig): boolean
{
	const store = usePresenceStore();
	const isUsable = Type.isPlainObject(config)
		&& config.enabled === true
		&& config.moduleId === PresencePullContract.moduleId
		&& config.command === PresencePullContract.command
		&& Type.isStringFilled(config.scope)
	;

	store.setScope(isUsable ? config.scope : '');

	return isUsable;
}

/**
 * A change of the roster reported by the live channel. The event carries named participants only, so the
 * guest of the starting roster is kept as it is: the live channel neither adds nor removes it.
 */
export function syncPresenceFromPull(payload: unknown): void
{
	const roster = readRosterEvent(payload);
	if (roster === null)
	{
		return;
	}

	const store = usePresenceStore();
	if (store.scope === '' || roster.scope !== store.scope || roster.revision <= store.revision)
	{
		return;
	}

	const guest = store.guest;
	const named = roster.participants.filter((participant: PresenceParticipant) => participant.id > 0);

	store.setParticipants(guest === null ? named : [guest, ...named]);
	store.setRevision(roster.revision);
}

/**
 * @returns `null` for anything that does not describe a roster; a single unreadable participant
 *          refuses the whole event, because a partly read roster would silently lose someone.
 */
function readRosterEvent(payload: unknown): RosterEvent | null
{
	if (!Type.isPlainObject(payload))
	{
		return null;
	}

	const event = payload as Record<string, unknown>;
	if (!Type.isStringFilled(event.scope) || !isRevision(event.revision) || !Type.isArray(event.participants))
	{
		return null;
	}

	const participants: PresenceParticipant[] = [];
	for (const item of event.participants as unknown[])
	{
		const participant = readParticipant(item);
		if (participant === null)
		{
			return null;
		}

		participants.push(participant);
	}

	return {
		scope: event.scope as string,
		revision: event.revision as number,
		participants,
	};
}

function readParticipant(item: unknown): PresenceParticipant | null
{
	if (!Type.isPlainObject(item))
	{
		return null;
	}

	const participant = item as Record<string, unknown>;
	if (!Type.isNumber(participant.id) || !Type.isStringFilled(participant.name))
	{
		return null;
	}

	const avatar = participant.avatar;
	if (!Type.isString(avatar) && !Type.isNil(avatar))
	{
		return null;
	}

	return {
		id: participant.id as number,
		name: participant.name as string,
		avatar: Type.isString(avatar) ? (avatar as string) : '',
		// the live channel serves named participants only; anonymous ones exist in the starting roster
		isGuest: false,
	};
}

function isRevision(value: unknown): boolean
{
	return Type.isNumber(value) && Number.isFinite(value) && (value as number) >= 0;
}
