import Type from '../../type';
import { AssetLoadError, maskUrl } from '../errors';
import { isSameOrigin } from './internal/same-origin';
import { type AssetType } from '../types';

/**
 * The `data.assets` payload of an envelope marked with the `X-Process-Assets` header.
 */
export type AjaxAssets = {
	css?: string[];
	js?: string[];
	string?: string[];
};

const settingsScriptType = 'extension/settings';

// in-flight loads keyed by the normalized asset url: a DOM element appears the moment
// the tag is created, long before its `load`/`error` fires, so a parallel call must await
// the same promise instead of treating the half-loaded tag as "already loaded". A settled
// load is removed from the registry — a finished load is confirmed by `loadedAssets`
// and the legacy loader registries instead.
const inFlightAssets: Map<string, Promise<void>> = new Map();

// the settled loads of this pipeline, keyed by the resolved url: a repeated action
// response must not re-execute an asset already delivered here. The legacy registries
// are consulted too — this set covers the environments where the legacy core is absent
const loadedAssets: Set<string> = new Set();

function loadOnce(url: string, load: (assetUrl: string) => Promise<void>): Promise<void>
{
	const pending = inFlightAssets.get(url);
	if (!Type.isUndefined(pending))
	{
		return pending;
	}

	const promise = load(url).finally(() => inFlightAssets.delete(url));
	inFlightAssets.set(url, promise);

	return promise;
}

/**
 * Resolves an asset url and enforces the same-origin invariant: the library
 * loads resources by url only and never from a foreign origin. A cross-origin
 * or unparsable url is dropped with a console error, the request is not broken.
 *
 * The invariant checks the url delivered in the response. A same-origin url
 * answered with an HTTP redirect to an external address is still followed by
 * the browser: a tag load (`<script src>`/`<link href>`) gives no way to
 * intercept the final url, exactly as the legacy `BX.load` behaves. An open
 * redirect on the own origin is a server-side vulnerability, not a client one.
 */
function resolveAssetUrl(url: unknown): string | null
{
	if (!Type.isStringFilled(url))
	{
		return null;
	}

	if (!isSameOrigin(url))
	{
		console.error(`main.core HttpClient: a cross-origin asset is skipped: ${maskUrl(url)}`);

		return null;
	}

	return new URL(url, window.location.href).toString();
}

function collectAssetUrls(urls: unknown): string[]
{
	if (!Type.isArray(urls))
	{
		return [];
	}

	const result: Set<string> = new Set();
	urls.forEach((url) => {
		const resolved = resolveAssetUrl(url);
		if (!Type.isNull(resolved))
		{
			result.add(resolved);
		}
	});

	return [...result];
}

function findAssetElement(
	selector: string,
	urlProperty: 'href' | 'src',
	url: string,
): HTMLLinkElement | HTMLScriptElement | null
{
	const found = [...document.querySelectorAll(selector)].find((element) => {
		return (element as HTMLLinkElement & HTMLScriptElement)[urlProperty] === url;
	});

	return (found as HTMLLinkElement | HTMLScriptElement | undefined) ?? null;
}

// the url form of the legacy loader registries (`normalizeUrl` of old/core.js):
// a path-only url without the numeric query suffix
function toLegacyRegistryUrl(url: string): string
{
	return url.replace(/^(?:https?:)?\/\/[^/]+/i, '').replace(/\?\d*$/, '');
}

// the second registry form (`normalizeMinUrl` of old/core.js): the ".min" marker dropped
function dropMinMarker(url: string): string
{
	const minPosition = url.indexOf('.min');

	return minPosition >= 0 ? url.slice(0, minPosition) + url.slice(minPosition + 4) : url;
}

const legacyRegistryGetters = { css: 'getCSSList', js: 'getJSList' } as const;
const legacyRegistrySetters = { css: 'setCSSList', js: 'setJSList' } as const;

/**
 * Checks the legacy loader registries (`BX.getJSList`/`BX.getCSSList`): a file
 * listed there is a part of an already executed page bundle even when it has
 * no own tag in the document, so it must never be fetched and executed again.
 */
function isInLegacyRegistry(url: string, assetType: AssetType): boolean
{
	const bx = (window as { BX?: Record<string, unknown> }).BX;
	const getList = bx?.[legacyRegistryGetters[assetType]];
	if (!Type.isFunction(getList))
	{
		return false;
	}

	const list = (getList as () => unknown).call(bx);
	if (!Type.isArray(list))
	{
		return false;
	}

	const normalized = toLegacyRegistryUrl(url);
	const normalizedMin = dropMinMarker(normalized);

	return list.includes(normalized) || (normalized !== normalizedMin && list.includes(normalizedMin));
}

/**
 * Records a settled load both here and in the legacy loader registry (in the
 * same form the legacy loader records its own loads): a parallel `BX.load` of
 * the same file must see it as loaded instead of fetching and executing it again.
 */
function registerLoadedAsset(url: string, assetType: AssetType): void
{
	loadedAssets.add(url);

	const bx = (window as { BX?: Record<string, unknown> }).BX;
	const setList = bx?.[legacyRegistrySetters[assetType]];
	if (Type.isFunction(setList))
	{
		(setList as (files: string[]) => void).call(bx, [dropMinMarker(toLegacyRegistryUrl(url))]);
	}
}

function assetLoadingFailure(url: string, assetType: AssetType): AssetLoadError
{
	return new AssetLoadError({ url, assetType });
}

// the time limit of one asset load, the same 7 seconds the legacy `BX.load`
// arms as its `errorTimeout`: a load that neither succeeds nor fails within
// the limit must not keep the action promise pending forever
const assetLoadTimeout = 7000;

/**
 * Waits for the settlement of an asset element over its `load`/`error` events
 * and the shared time limit (see `assetLoadTimeout`). An own element
 * (`removeOnFailure`) is removed from the document on a failure; a foreign one
 * is left as is. Every confirmed load is recorded in the loader registries.
 */
function watchAssetElement(
	element: HTMLLinkElement | HTMLScriptElement,
	url: string,
	assetType: AssetType,
	removeOnFailure: boolean,
): Promise<void>
{
	return new Promise((resolve, reject) => {
		let cleanup = (): void => {};

		const succeed = (): void => {
			cleanup();
			registerLoadedAsset(url, assetType);
			resolve();
		};

		const fail = (): void => {
			cleanup();
			if (removeOnFailure)
			{
				element.remove();
			}

			reject(assetLoadingFailure(url, assetType));
		};

		const timer = window.setTimeout(fail, assetLoadTimeout);
		cleanup = () => {
			window.clearTimeout(timer);
			element.removeEventListener('load', succeed);
			element.removeEventListener('error', fail);
		};

		element.addEventListener('load', succeed);
		element.addEventListener('error', fail);
	});
}

/**
 * Appends an asset element to the document head and waits for its settlement.
 * A failed or stalled load removes the element from the document and rejects
 * with `AssetLoadError`; a loaded element stays.
 */
function awaitAssetElement(
	element: HTMLLinkElement | HTMLScriptElement,
	url: string,
	assetType: AssetType,
): Promise<void>
{
	const settlement = watchAssetElement(element, url, assetType, true);
	document.head.append(element);

	return settlement;
}

/**
 * Coordinates with an asset element created by someone else — a parallel legacy
 * `BX.load`, a tag left behind by a failed foreign load: an element that merely
 * exists is not trusted to be settled. A stylesheet with an applied `sheet` is
 * complete; anything else is awaited over its own events and the shared time
 * limit. A foreign element is never removed, even on a failure.
 *
 * The `sheet` check accepts a foreign stylesheet whose load actually failed: a
 * `link` that ended with an error still exposes a non-null `sheet` with zero
 * rules, and an empty but successfully loaded file is indistinguishable from it
 * (same `sheet`, same empty `cssRules`, same entry in `document.styleSheets`) —
 * the browser exposes no outcome of a load whose events we already missed. The
 * false accept is preferred over the alternative: rule counting would turn every
 * valid empty stylesheet into a 7s wait and an `AssetLoadError`. A failed foreign
 * stylesheet is therefore recorded as loaded until the page is reloaded, matching
 * how legacy `BX.load` treats an already present tag.
 */
function awaitForeignAssetElement(
	element: HTMLLinkElement | HTMLScriptElement,
	url: string,
	assetType: AssetType,
): Promise<void>
{
	if (assetType === 'css' && (element as HTMLLinkElement).sheet !== null)
	{
		registerLoadedAsset(url, assetType);

		return Promise.resolve();
	}

	return watchAssetElement(element, url, assetType, false);
}

function loadStyle(url: string): Promise<void>
{
	if (loadedAssets.has(url) || isInLegacyRegistry(url, 'css'))
	{
		return Promise.resolve();
	}

	const existing = findAssetElement('link[rel="stylesheet"]', 'href', url);
	if (existing !== null)
	{
		return awaitForeignAssetElement(existing, url, 'css');
	}

	const link = document.createElement('link');
	link.rel = 'stylesheet';
	link.href = url;

	return awaitAssetElement(link, url, 'css');
}

function loadScript(url: string): Promise<void>
{
	if (loadedAssets.has(url) || isInLegacyRegistry(url, 'js'))
	{
		return Promise.resolve();
	}

	const existing = findAssetElement('script[src]', 'src', url);
	if (existing !== null)
	{
		return awaitForeignAssetElement(existing, url, 'js');
	}

	const script = document.createElement('script');
	script.src = url;
	script.async = false;

	return awaitAssetElement(script, url, 'js');
}

// the server-side asset registry calls emitted by `Asset::showFilesList()`:
// a strict shape with a json array as the only argument, nothing else is accepted
const assetListCallPattern = /^BX\.set(JS|CSS)List\((\[[\s\S]*\])\);?$/;

type AssetListRegistry = 'setJSList' | 'setCSSList';

type SettingsStringOperation =
	| { insert: HTMLScriptElement }
	| { registry: AssetListRegistry; files: string[] };

/**
 * Rebuilds a `<script type="extension/settings">` element from scratch: only
 * the settings type and the `data-*` attributes survive (`data-extension` is
 * the extension system contract, event-handler and url attributes never make
 * it into the document). A script element built by hand never executes:
 * "extension/settings" is not a scripting type.
 */
function rebuildSettingsScript(source: HTMLScriptElement): HTMLScriptElement
{
	const script = document.createElement('script');
	script.type = settingsScriptType;
	script.textContent = source.textContent;
	[...source.attributes].forEach((attribute) => {
		if (attribute.name.startsWith('data-'))
		{
			script.setAttribute(attribute.name, attribute.value);
		}
	});

	return script;
}

/**
 * Extracts a `BX.setJSList([...])`/`BX.setCSSList([...])` registry call from
 * a plain `<script>` element without executing it: the argument is parsed as
 * json and must be an array of strings. Anything else is rejected.
 */
function parseAssetListCall(source: HTMLScriptElement): SettingsStringOperation | null
{
	const match = assetListCallPattern.exec(source.textContent?.trim() ?? '');
	if (match === null)
	{
		return null;
	}

	let files: unknown;
	try
	{
		files = JSON.parse(match[2]);
	}
	catch
	{
		return null;
	}

	if (!Type.isArray(files) || files.some((file) => !Type.isString(file)))
	{
		return null;
	}

	return {
		registry: match[1] === 'JS' ? 'setJSList' : 'setCSSList',
		files: files as string[],
	};
}

/**
 * Strictly parses one settings string inside a detached template (fragment
 * parsing, nothing can execute). The only top-level nodes accepted are
 * whitespace-only text, `<script type="extension/settings">` elements with
 * text-only content and plain `<script>` elements (no `type` attribute)
 * carrying a `BX.setJSList`/`BX.setCSSList` registry call. Any other node
 * rejects the string as a whole and nothing from it is applied.
 */
function parseSettingsString(item: string): SettingsStringOperation[] | null
{
	const template = document.createElement('template');
	template.innerHTML = item;

	const operations: SettingsStringOperation[] = [];
	for (const node of template.content.childNodes)
	{
		if (node.nodeType === Node.TEXT_NODE && (node.textContent ?? '').trim() === '')
		{
			continue;
		}

		if (!(node instanceof HTMLScriptElement))
		{
			return null;
		}

		if (node.getAttribute('type') === settingsScriptType)
		{
			if ([...node.childNodes].some((child) => child.nodeType !== Node.TEXT_NODE))
			{
				return null;
			}

			operations.push({ insert: rebuildSettingsScript(node) });

			continue;
		}

		if (node.hasAttribute('type'))
		{
			return null;
		}

		const call = parseAssetListCall(node);
		if (call === null)
		{
			return null;
		}

		operations.push(call);
	}

	return operations;
}

function applyAssetListCall(registry: AssetListRegistry, files: string[]): void
{
	const bx = (window as { BX?: Record<string, unknown> }).BX;
	const register = bx?.[registry];
	if (Type.isFunction(register))
	{
		// the registry receives the parsed data only, no code from the response runs
		(register as (list: string[]) => void).call(bx, files);
	}
}

type SettingsStringState = 'inserted' | 'applied';

type PendingSettingsString = {
	item: string;
	registryCalls: Array<{ registry: AssetListRegistry; files: string[] }>;
};

// settings strings already handled, keyed by the exact string value: repeated action
// responses deliver the same strings again and must not duplicate the inert settings
// scripts or replay the registry calls. `inserted` means the settings scripts are in
// the document, but the registry calls have not run (the loads of the same response
// failed) — such a string is retried with the next response without a second insert;
// `applied` means every operation has run and the string is skipped silently.
// Rejected (invalid) strings are never registered and are reported on every appearance.
const settingsStringStates: Map<string, SettingsStringState> = new Map();

/**
 * Parses the settings strings of an action response and applies their inert
 * part: `<script type="extension/settings">` elements go into the document
 * head at once (a data container for the extension system), while the
 * server-side `BX.setJSList`/`BX.setCSSList` registry calls are only collected
 * and returned to be replayed after the asset loads. Any other inline string
 * is dropped as a whole: the library never executes code delivered in a
 * response body.
 */
function insertSettingsStrings(strings: unknown): PendingSettingsString[]
{
	if (!Type.isArray(strings))
	{
		return [];
	}

	const pending: PendingSettingsString[] = [];
	const unique = new Set(strings.filter((item): item is string => Type.isStringFilled(item)));
	unique.forEach((item) => {
		if (settingsStringStates.get(item) === 'applied')
		{
			return;
		}

		const operations = parseSettingsString(item);
		if (operations === null)
		{
			console.error('main.core HttpClient: an inline script asset is skipped, response code is never executed.');

			return;
		}

		if (!settingsStringStates.has(item))
		{
			operations.forEach((operation) => {
				if ('insert' in operation)
				{
					document.head.append(operation.insert);
				}
			});
			settingsStringStates.set(item, 'inserted');
		}

		pending.push({
			item,
			registryCalls: operations.filter(
				(operation): operation is { registry: AssetListRegistry; files: string[] } => 'registry' in operation,
			),
		});
	});

	return pending;
}

/**
 * Replays the collected registry calls once their files are actually loaded
 * and marks the strings as fully applied. A string applied by a parallel call
 * in the meantime is skipped, exactly as a repeated string of a new response.
 */
function applySettingsRegistryCalls(pending: PendingSettingsString[]): void
{
	pending.forEach(({ item, registryCalls }) => {
		if (settingsStringStates.get(item) === 'applied')
		{
			return;
		}

		registryCalls.forEach(({ registry, files }) => applyAssetListCall(registry, files));
		settingsStringStates.set(item, 'applied');
	});
}

/**
 * Loads the assets delivered with an action response: styles first, then
 * scripts (in the listed order). Settings strings are parsed upfront and their
 * inert settings scripts are inserted at once, but the registry calls they
 * carry are replayed only after both asset waves have loaded — a parallel
 * legacy `BX.load` must never treat a still-loading (or failed) file as ready.
 * A failed asset rejects the whole action call and skips the registry calls;
 * already applied assets are not rolled back.
 *
 * The loads are coordinated with the legacy loader in both directions: the
 * registries (`BX.getJSList`/`BX.getCSSList`) are consulted before fetching,
 * so a file of an already executed page bundle is never executed again; every
 * own settled load is registered back for the legacy loader to see; and a tag
 * created by someone else is awaited for its own settlement instead of being
 * trusted as loaded just because it exists.
 */
export async function processAssets(assets: AjaxAssets | null | undefined): Promise<void>
{
	if (!Type.isPlainObject(assets))
	{
		return;
	}

	const pendingSettings = insertSettingsStrings(assets.string);
	await Promise.all(collectAssetUrls(assets.css).map((url) => loadOnce(url, loadStyle)));
	await Promise.all(collectAssetUrls(assets.js).map((url) => loadOnce(url, loadScript)));
	applySettingsRegistryCalls(pendingSettings);
}
