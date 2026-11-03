import { RoomType } from '../domain/connection-descriptor';

/**
 * Readers every acquisition needs to turn an untyped answer into values it may trust. They live apart
 * from the implementations because the wires differ while the reading does not: a number that arrived
 * as a string is the same number for the classic action and for the balancer alike, and a second copy
 * of that rule is a second place for it to drift.
 *
 * Only what is shared belongs here. A reader that means something to one schema alone - the id of a
 * classic call, the start date the classic answer may spell as a date - stays with the implementation
 * that owns that meaning. Telling an answer from a value of another shape means nothing to acquisition
 * either: that is `isWireRecord` of the port layer, and it holds for every wire.
 */

/** Fields of an answer as they arrived: named, with nothing known about their values yet. */
export type AnswerFields = { [field: string]: unknown };

const ROOM_TYPES: readonly number[] = Object.values(RoomType);

/** A number on the wire may arrive as its own string; anything else is not a number at all. */
export function readNumber(value: unknown): number | undefined
{
	if (typeof value !== 'number' && typeof value !== 'string')
	{
		return undefined;
	}

	const parsed = Number(value);

	return Number.isFinite(parsed) ? parsed : undefined;
}

/** An empty string names nothing, so it counts as absent rather than as a value of its own. */
export function readNonEmptyText(value: unknown): string | undefined
{
	return typeof value === 'string' && value.length > 0 ? value : undefined;
}

/** A room type outside the vocabulary is not carried on: a descriptor would state a kind nobody knows. */
export function readRoomType(value: unknown): RoomType | undefined
{
	const roomType = readNumber(value);

	return roomType !== undefined && ROOM_TYPES.includes(roomType) ? (roomType as RoomType) : undefined;
}
