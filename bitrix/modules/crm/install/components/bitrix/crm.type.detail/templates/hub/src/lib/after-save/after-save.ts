import type { CustomSectionEntry } from '../../model/type-hub-store';
import { type CreatedTypeInfo, shouldReloadAfterSave } from '../type-detail-reload-uri/type-detail-reload-uri';

// What the screen does once a save has gone through. Decided here, as plain data, so that the three
// outcomes are unit-testable without BX; SaveType#afterSave in the app only carries the answer out.
//  - 'navigate' — the type was just created from the preview and there is an address to land on: the
//    frame goes to the settings of the new type (T5), and a page outside a slider goes there the same
//    way, so that the creation mode ends and the next "Сохранить" no longer calls add.
//  - 'stay'     — the screen remains where it is and the form becomes the saved state (T13): settings of
//    a saved type never close the slider, and a page outside a slider has nothing to close.
//  - 'close'    — the emergency exit of the creation screen in a slider when there is nowhere to go:
//    staying on the creation form would let the next "Сохранить" add a second type.
export type AfterSaveAction = 'navigate' | 'stay' | 'close';

export function resolveAfterSaveAction(input: {
	isInSlider: boolean,
	wasCreationPreview: boolean,
	created: CreatedTypeInfo,
	reloadUri: string | null,
}): AfterSaveAction
{
	if (!input.wasCreationPreview)
	{
		return 'stay';
	}

	if (shouldReloadAfterSave({
		wasCreationPreview: input.wasCreationPreview,
		created: input.created,
		reloadUri: input.reloadUri,
	}))
	{
		return 'navigate';
	}

	// Nowhere to go. A slider still has its way out; a page outside a slider has nothing to close.
	return input.isInSlider ? 'close' : 'stay';
}

// The two params buildTypeDetailReloadUri writes for the slider frame.
const FRAME_QUERY_PARAM_NAMES: ReadonlyArray<string> = ['IFRAME', 'IFRAME_TYPE'];

function decodeQueryName(name: string): string
{
	try
	{
		return decodeURIComponent(name);
	}
	catch
	{
		return name;
	}
}

// The address a page outside a slider goes to once the type is created: the one built for the slider
// frame, without the frame params. IFRAME=Y on a whole portal page would render the settings without
// the portal around them. Everything else — path, the other params in their order, the hash — is kept
// as it was written.
export function dropFrameQueryParams(uri: string): string
{
	const hashAt = uri.indexOf('#');
	const withoutHash = hashAt === -1 ? uri : uri.slice(0, hashAt);
	const hash = hashAt === -1 ? '' : uri.slice(hashAt);

	const queryAt = withoutHash.indexOf('?');
	if (queryAt === -1)
	{
		return uri;
	}

	const path = withoutHash.slice(0, queryAt);
	const pairs = withoutHash
		.slice(queryAt + 1)
		.split('&')
		.filter((pair) => pair !== '')
		.filter((pair) => {
			const at = pair.indexOf('=');
			const name = decodeQueryName(at === -1 ? pair : pair.slice(0, at));

			return !FRAME_QUERY_PARAM_NAMES.includes(name);
		});

	return `${path}${pairs.length > 0 ? `?${pairs.join('&')}` : ''}${hash}`;
}

export type SavedCustomSectionState = {
	customSectionId: number,
	customSections: CustomSectionEntry[],
};

function readRecord(raw: unknown): Record<string, unknown> | null
{
	return (typeof raw === 'object' && raw !== null && !Array.isArray(raw))
		? raw as Record<string, unknown>
		: null;
}

// Numbers and numeric strings count, the way buildInitialValues reads params.type.customSectionId
// (Number(… ?? 0)); null, absence and anything that is not a finite number is "placed nowhere", 0.
function readCustomSectionId(raw: unknown): number
{
	if (typeof raw === 'number')
	{
		return Number.isFinite(raw) ? raw : 0;
	}

	if (typeof raw === 'string' && raw.trim() !== '')
	{
		const parsed = Number(raw);

		return Number.isFinite(parsed) ? parsed : 0;
	}

	return 0;
}

// The placement the server really stored, read off response.data of the save. It comes through the
// same converter as params.type on load (crm/lib/service/converter/Type.php), so its isSelected flags
// are right, unlike the flags in the store, which only customSectionId follows while editing.
// Null when there is nothing to take: no object, no `type` in it, or no customSections list — a portal
// without workplaces does not write that key at all, and then the store keeps what it has.
export function readSavedCustomSectionState(responseData: unknown): SavedCustomSectionState | null
{
	const data = readRecord(responseData);
	if (data === null)
	{
		return null;
	}

	const type = readRecord(data.type);
	if (type === null || !Array.isArray(type.customSections))
	{
		return null;
	}

	return {
		customSectionId: readCustomSectionId(type.customSectionId),
		customSections: (type.customSections as unknown[])
			.filter((section) => readRecord(section) !== null)
			.map((section) => ({ ...(section as CustomSectionEntry) })),
	};
}
