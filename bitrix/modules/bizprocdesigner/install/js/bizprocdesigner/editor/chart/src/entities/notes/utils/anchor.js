import { Type } from 'main.core';

import { type NoteAnchor, type NotePoint, type TemplateNote } from '../types';

const NODE_ANCHOR = 'node';
const CONNECTION_ANCHOR = 'connection';

export type NoteSchemaRect = {
	x: number,
	y: number,
	width: number,
	height: number,
};

/**
 * The two ends of a link. A note carries them inside its anchor, the canvas inside a connection of
 * the model, and both are read here through the same shape.
 */
export type NoteSchemaConnection = {
	sourceBlockId?: string,
	sourcePortId?: string,
	targetBlockId?: string,
	targetPortId?: string,
};

/**
 * The connections of the drawn schema by their signature. An anchor of a note finds its connection by
 * one lookup, so the cost of drawing the markers of a frame stays linear in the number of the notes.
 */
export type NoteConnectionIndex = Map<string, NoteSchemaConnection>;

/**
 * The drawn schema as the canvas holds it: the rect maps of the blocks and of their ports plus the
 * connections of the model. Nothing travels the other way - a marker never becomes a part of the graph.
 *
 * `connectionIndex` is built by `createConnectionIndex` and belongs to the set of the connections
 * alone: whoever holds the schema rebuilds it when the connections change and never on a camera that
 * moved. A schema handed over without it resolves no anchor on a connection.
 */
export type NotesSchema = {
	nodeRects: { [blockId: string]: NoteSchemaRect },
	portRects: { [blockId: string]: { [portId: string]: NoteSchemaRect } },
	connections: NoteSchemaConnection[],
	connectionIndex: NoteConnectionIndex,
};

// Identifiers come from a template graph, so a rect is only ever taken as an own property.
function ownValue<T>(map: { [key: string]: T } | null | undefined, key: string | undefined): T | null
{
	if (!Type.isObjectLike(map) || !Type.isStringFilled(key) || !Object.hasOwn(map, key))
	{
		return null;
	}

	return map[key];
}

function pointOf(point: NotePoint | null | undefined): NotePoint
{
	return {
		x: Type.isNumber(point?.x) ? point.x : 0,
		y: Type.isNumber(point?.y) ? point.y : 0,
	};
}

function withOffset(anchorPoint: NotePoint, offset: NotePoint | null | undefined): NotePoint
{
	const shift = pointOf(offset);

	return {
		x: anchorPoint.x + shift.x,
		y: anchorPoint.y + shift.y,
	};
}

function topLeftOf(rect: NoteSchemaRect): NotePoint
{
	return pointOf(rect);
}

function centerOf(rect: NoteSchemaRect): NotePoint | null
{
	if (!Type.isNumber(rect.width) || !Type.isNumber(rect.height))
	{
		return null;
	}

	const topLeft = topLeftOf(rect);

	return {
		x: topLeft.x + (rect.width / 2),
		y: topLeft.y + (rect.height / 2),
	};
}

// Length-prefixed parts: an identifier carrying the separator cannot forge the key of another end.
function endKey(blockId: string, portId: string): string
{
	return `${blockId.length}:${blockId}:${portId}`;
}

/**
 * The signature of a link that does not depend on the order of its ends: the same link whose ends
 * arrived reversed has to be found by the anchor of a note all the same.
 */
function normalized(ends: NoteSchemaConnection | null | undefined): string | null
{
	const source = Type.isStringFilled(ends?.sourceBlockId) && Type.isStringFilled(ends?.sourcePortId)
		? endKey(ends.sourceBlockId, ends.sourcePortId)
		: null
	;
	const target = Type.isStringFilled(ends?.targetBlockId) && Type.isStringFilled(ends?.targetPortId)
		? endKey(ends.targetBlockId, ends.targetPortId)
		: null
	;

	if (source === null || target === null)
	{
		return null;
	}

	return source <= target ? `${source}|${target}` : `${target}|${source}`;
}

function findNode(schema: NotesSchema, nodeId: string | undefined): NoteSchemaRect | null
{
	return ownValue(schema?.nodeRects, nodeId);
}

/**
 * The index of the connections of a schema, in one pass over them. The signature of a connection is
 * built here once and not once per pair of a note and a connection; the first of the connections
 * sharing a signature is the one kept, as a search through them would have found it.
 */
export function createConnectionIndex(connections: NoteSchemaConnection[] | null | undefined): NoteConnectionIndex
{
	const index: NoteConnectionIndex = new Map();

	if (!Type.isArray(connections))
	{
		return index;
	}

	for (const connection of connections)
	{
		const signature = normalized(connection);

		if (signature !== null && !index.has(signature))
		{
			index.set(signature, connection);
		}
	}

	return index;
}

function findConnection(schema: NotesSchema, anchor: NoteAnchor): NoteSchemaConnection | null
{
	const signature = normalized(anchor);

	if (signature === null || !(schema?.connectionIndex instanceof Map))
	{
		return null;
	}

	return schema.connectionIndex.get(signature) ?? null;
}

/**
 * The point of the canvas a marker of this connection sits at. A connection whose ends the canvas has
 * not measured has no such point, and that is what the answer of `null` says.
 */
export function resolveConnectionMidpoint(schema: NotesSchema, connection: NoteSchemaConnection): NotePoint | null
{
	const sourceRect = ownValue(ownValue(schema?.portRects, connection.sourceBlockId), connection.sourcePortId);
	const targetRect = ownValue(ownValue(schema?.portRects, connection.targetBlockId), connection.targetPortId);
	const sourceEnd = sourceRect === null ? null : centerOf(sourceRect);
	const targetEnd = targetRect === null ? null : centerOf(targetRect);

	if (sourceEnd === null || targetEnd === null)
	{
		return null;
	}

	return {
		x: (sourceEnd.x + targetEnd.x) / 2,
		y: (sourceEnd.y + targetEnd.y) / 2,
	};
}

/**
 * ALG-02. The position of a marker in the coordinates of the canvas; screen coordinates are the
 * business of the drawing layer. `offset` is a shift from the anchor - it is what makes a marker
 * travel with its node; `position` is an absolute point of the canvas and is only good once the
 * anchor is gone. The two are not interchangeable, so neither substitutes for the other here.
 *
 * An anchor missing from the drawn schema leaves the note where its own coordinates put it, and
 * changes no data: nothing is sent to the server over a marker that failed to find its anchor.
 */
export function resolveMarkerPosition(note: TemplateNote, schema: NotesSchema): NotePoint
{
	if (note.anchor?.type === NODE_ANCHOR)
	{
		const node = findNode(schema, note.anchor.nodeId);

		if (node !== null)
		{
			return withOffset(topLeftOf(node), note.offset);
		}
	}

	if (note.anchor?.type === CONNECTION_ANCHOR)
	{
		const connection = findConnection(schema, note.anchor);
		const midpoint = connection === null ? null : resolveConnectionMidpoint(schema, connection);

		if (midpoint !== null)
		{
			return withOffset(midpoint, note.offset);
		}
	}

	return pointOf(note.position);
}
