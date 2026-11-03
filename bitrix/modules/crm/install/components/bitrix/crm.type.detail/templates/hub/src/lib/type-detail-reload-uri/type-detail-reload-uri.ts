// After a type is created the slider must land on the address of the new type instead of closing.
// The three decisions that need testing — what the server actually created, whether to navigate at
// all, and what the target address looks like — live here as plain string/number functions. The
// executors stay outside: Router.Instance builds the base address, window.location performs the
// navigation, and neither is touched from src/lib (the bare unit harness has no BX at all).
export type CreatedTypeInfo = { id: number, entityTypeId: number } | null;

const IFRAME_PARAMS: ReadonlyArray<[string, string]> = [
	// The slider adds these itself only when it navigates the frame through setFrameSrc; a
	// self-navigation of the document inside the frame bypasses that, so they go in by hand
	// (same as crm.automated_solution.details/…/types-control.ts:264–277).
	['IFRAME', 'Y'],
	['IFRAME_TYPE', 'SIDE_SLIDER'],
];

// The response of crm.api.type.add comes from the DB converter, which can hand a column over as a
// string ('1032'), so numeric strings count as numbers here. Anything that is not a finite number
// after that is not an id.
function readNumber(raw: unknown): number | null
{
	if (typeof raw === 'number')
	{
		return Number.isFinite(raw) ? raw : null;
	}

	if (typeof raw === 'string' && raw.trim() !== '')
	{
		const parsed = Number(raw);

		return Number.isFinite(parsed) ? parsed : null;
	}

	return null;
}

function readRecord(raw: unknown): Record<string, unknown> | null
{
	return (typeof raw === 'object' && raw !== null && !Array.isArray(raw))
		? raw as Record<string, unknown>
		: null;
}

// Input is response.data of crm.api.type.add, whose payload is { type: { id, entityTypeId, … } }
// (crm/lib/controller/type.php getAction + the camelCase converter). Everything else on the way —
// a failed request that answered null, an error envelope without `type`, a `type` that lost its ids
// — yields null, which the caller reads as "nothing was created, behave as before". The two ids are
// returned together because a half-read type would be a lie: the shape promises both.
// The value of entityTypeId is not judged here, only its presence — shouldReloadAfterSave is the
// place where "is this id usable" is decided.
export function readCreatedType(responseData: unknown): CreatedTypeInfo
{
	const data = readRecord(responseData);
	if (data === null)
	{
		return null;
	}

	const type = readRecord(data.type);
	if (type === null)
	{
		return null;
	}

	const id = readNumber(type.id);
	const entityTypeId = readNumber(type.entityTypeId);
	if (id === null || entityTypeId === null)
	{
		return null;
	}

	return { id, entityTypeId };
}

// True only for the creation path with a type that really exists now and an address to go to.
// False means "do not navigate" — navigating to type/detail/0/, to the address of a type that was never
// created, or nowhere at all is worse than not going anywhere; what the screen does instead is decided
// by resolveAfterSaveAction (src/lib/after-save). reloadUri is the output of buildTypeDetailReloadUri:
// pass it and the caller never has to guess afterwards whether the address it is about to use exists,
// since an address that could not be built (empty string) is answered with false. Omitting it keeps
// the older two-input decision for call sites that build the address later.
export function shouldReloadAfterSave(input: {
	wasCreationPreview: boolean,
	created: CreatedTypeInfo,
	reloadUri?: string | null,
}): boolean
{
	if (!input.wasCreationPreview || input.created === null)
	{
		return false;
	}

	if (input.created.entityTypeId <= 0)
	{
		return false;
	}

	if (input.reloadUri !== undefined && (input.reloadUri === null || input.reloadUri.trim() === ''))
	{
		return false;
	}

	return true;
}

function splitOnce(value: string, separator: string): [string, string | null]
{
	const at = value.indexOf(separator);

	return at === -1 ? [value, null] : [value.slice(0, at), value.slice(at + separator.length)];
}

// A key of the base address may be percent-encoded while the same key arrives plain from the caller,
// so the comparison in setParam is made on decoded names. A malformed escape is left as it stands
// instead of throwing: this address is being handed to the browser, not validated.
function decodeQueryPart(value: string): string
{
	try
	{
		return decodeURIComponent(value);
	}
	catch
	{
		return value;
	}
}

function parseQuery(query: string): Array<[string, string]>
{
	if (query === '')
	{
		return [];
	}

	return query
		.split('&')
		.filter((pair) => pair !== '')
		.map((pair): [string, string] => {
			const [name, value] = splitOnce(pair, '=');

			return [name, value ?? ''];
		});
}

// Overwrite in place instead of appending: the address may already carry IFRAME=Y (the slider put it
// there on the first load), and a second IFRAME=N later in the query would be the one PHP reads.
function setParam(pairs: Array<[string, string]>, name: string, value: string): void
{
	const encodedName = encodeURIComponent(name);
	const encodedValue = encodeURIComponent(value);
	const at = pairs.findIndex((pair) => pair[0] === encodedName || decodeQueryPart(pair[0]) === name);
	if (at === -1)
	{
		pairs.push([encodedName, encodedValue]);

		return;
	}

	pairs[at] = [encodedName, encodedValue];
}

// Builds the address the frame navigates to. The base comes from the outside (Router.Instance builds
// it for the new entityTypeId — a custom root section lives in the template registry and must not be
// hand-assembled), and everything already in its query survives untouched.
// carryQueryParams are the params of the page the creation was started from: a smart process created
// from an automated solution arrives with isExternal=Y, automatedSolutionId and c_sub_section in the
// address, and dropping them on the way would land the user in a hub that lost its context. They win
// over what the base address carries under the same key, blank values are not carried at all, and the
// two IFRAME params are written last because nothing may overrule them.
export function buildTypeDetailReloadUri(input: {
	typeDetailUrl: string,
	activeTabId?: string | null,
	carryQueryParams?: Record<string, string> | null,
}): string
{
	if (!input.typeDetailUrl)
	{
		return '';
	}

	const [withoutHash, hash] = splitOnce(input.typeDetailUrl, '#');
	const [path, query] = splitOnce(withoutHash, '?');
	const pairs = parseQuery(query ?? '');

	const carried = readRecord(input.carryQueryParams) ?? {};
	Object.keys(carried).forEach((name) => {
		const value = carried[name];
		if (name === '' || typeof value !== 'string' || value.trim() === '')
		{
			return;
		}

		setParam(pairs, name, value);
	});

	const activeTabId = typeof input.activeTabId === 'string' ? input.activeTabId.trim() : '';
	if (activeTabId !== '')
	{
		setParam(pairs, 'activeTabId', activeTabId);
	}

	IFRAME_PARAMS.forEach(([name, value]) => {
		setParam(pairs, name, value);
	});

	const built = `${path}?${pairs.map(([name, value]) => `${name}=${value}`).join('&')}`;

	return hash === null ? built : `${built}#${hash}`;
}
