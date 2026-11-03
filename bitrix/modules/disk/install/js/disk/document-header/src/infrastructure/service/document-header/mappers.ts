import { Text, Type } from 'main.core';

import { HeaderElement, type HeaderElementValue } from '../../../const/element';
import {
	type CompositionMode,
	type CompositionModel,
	type EditorItem,
	type ObjectType,
} from '../../../model/composition/types';
import { type PresenceParticipant, type PresenceRoster } from '../../../model/presence/types';
import { type RenameDto } from './types';

const objectTypes: readonly ObjectType[] = ['document', 'board'];
const modes: readonly CompositionMode[] = ['view', 'edit'];
const headerElements: readonly HeaderElementValue[] = Object.values(HeaderElement);

/**
 * The composition description from the server to the client model. The header renders exactly the
 * composition it was given: an unknown element is dropped, a missing one is never added back.
 *
 * `presence` and `boost` nodes of the answer are not read on purpose - they repeat the presence of
 * the matching elements in `elements`, and that is what the components ask about.
 *
 * @returns `null` when the answer cannot describe an opening at all - such a composition is refused
 *          instead of being rendered half-way.
 */
export function mapCompositionDtoToModel(response: unknown): CompositionModel | null
{
	if (!Type.isPlainObject(response))
	{
		return null;
	}

	const dto = response as Record<string, unknown>;
	const objectType = matchValue(objectTypes, dto.objectType);
	const mode = matchValue(modes, dto.mode);
	if (objectType === null || mode === null || !Type.isArray(dto.elements) || !Type.isPlainObject(dto.object))
	{
		return null;
	}

	const object = asRecord(dto.object);
	const urls = asRecord(dto.urls);
	const access = asRecord(dto.access);

	return {
		elements: (dto.elements as unknown[]).filter(isHeaderElement),
		objectType,
		mode,
		object: {
			id: Text.toInteger(object.id),
			name: readString(object, 'name'),
			uniqueCode: readString(object, 'uniqueCode'),
			extension: readString(object, 'extension'),
		},
		urls: {
			unifiedLink: readString(urls, 'unifiedLink'),
			download: readString(urls, 'download'),
		},
		access: {
			controlType: readString(access, 'controlType'),
		},
		editors: mapEditors(dto.editors),
	};
}

/**
 * The starting roster to the client model. A participant without a name cannot be shown at all and
 * is dropped.
 *
 * @returns `null` when the answer describes no roster - a refused roster and an empty one are
 *          different things, and only the first one hides the block.
 */
export function mapPresenceDtoToModel(response: unknown): PresenceRoster | null
{
	if (!Type.isPlainObject(response))
	{
		return null;
	}

	const dto = asRecord(response);
	if (!Type.isArray(dto.participants))
	{
		return null;
	}

	return {
		revision: Text.toInteger(dto.revision),
		participants: (dto.participants as unknown[])
			.filter((item: unknown) => Type.isPlainObject(item))
			.map((item: unknown) => mapParticipant(asRecord(item)))
			.filter((participant: PresenceParticipant) => participant.name !== '')
		,
	};
}

/**
 * @returns `null` when the answer carries no stored name - the caller has nothing to apply then.
 */
export function mapRenameDto(response: unknown): RenameDto | null
{
	if (!Type.isPlainObject(response))
	{
		return null;
	}

	const dto = asRecord(response);
	const name = readString(dto, 'name');

	return name === '' ? null : { name, editorSynchronized: dto.editorSynchronized === true };
}

function mapParticipant(participant: Record<string, unknown>): PresenceParticipant
{
	return {
		id: Text.toInteger(participant.id),
		name: readString(participant, 'name'),
		avatar: readString(participant, 'avatar'),
		isGuest: participant.isGuest === true,
	};
}

function mapEditors(value: unknown): EditorItem[]
{
	if (!Type.isArray(value))
	{
		return [];
	}

	return (value as unknown[])
		.filter((item: unknown) => Type.isPlainObject(item))
		.map((item: unknown) => {
			const editor = asRecord(item);

			return {
				code: readString(editor, 'code'),
				name: readString(editor, 'name'),
				isDefault: editor.isDefault === true,
			};
		})
	;
}

function isHeaderElement(value: unknown): value is HeaderElementValue
{
	return headerElements.includes(value as HeaderElementValue);
}

function matchValue<TValue extends string>(allowed: readonly TValue[], value: unknown): TValue | null
{
	return allowed.find((item: TValue) => item === value) ?? null;
}

function asRecord(value: unknown): Record<string, unknown>
{
	return Type.isPlainObject(value) ? (value as Record<string, unknown>) : {};
}

function readString(source: Record<string, unknown>, key: string): string
{
	const value = source[key];

	return Type.isString(value) ? value : '';
}
