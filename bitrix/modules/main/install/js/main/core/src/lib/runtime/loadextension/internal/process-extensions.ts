import Loc from '../../../loc';
import Type from '../../../type';
import { type LoadableExtensionEntry } from '../load-extension';
import { type ExtensionEntry, type ExtensionSettings, type LoadAssetsOptions, type LoadAssetsResult, loadAssets } from './load-assets';
import registerExtension, { getRegisteredNames, isCoreRegistered, markRegistered } from './register-extension';
import { tryLoad } from './try-load';
import { loadAll, registerAssetsAsLoaded } from './utils';

export type AssetLoader = (items: Array<string>) => Promise<void>;
export type RetryStrategy = <T>(extensions: Array<string>, callback: () => Promise<T>) => Promise<T>;
export type ExtensionsTransport = (options: LoadAssetsOptions) => LoadAssetsResult;

function isNotEmptyObject<T extends Record<string, any>>(value: T | Array<any> | null): value is T
{
	return Type.isPlainObject(value) && Object.keys(value).length > 0;
}

function hasSettings(settings: ExtensionSettings): boolean
{
	return Type.isArrayFilled(settings) || isNotEmptyObject(settings);
}

function appendSettingsTag(entry: ExtensionEntry): void
{
	const script = document.createElement('script');
	script.type = 'extension/settings';
	script.dataset.extension = entry.extension;
	script.textContent = JSON.stringify(entry.settings).replaceAll('<', '\\u003C');
	// The head, not the body: a batch requested from a script in <head> can resolve
	// before the parser reaches <body>. Extension.getSettings searches the whole document.
	document.head.append(script);
}

function collect(entries: Array<ExtensionEntry>, field: 'js' | 'css'): Array<string>
{
	return entries.flatMap((entry: ExtensionEntry) => entry[field] ?? []);
}

function collectCoreIncludes(entries: Array<ExtensionEntry>, field: 'js' | 'css'): Array<string>
{
	return entries.flatMap((entry: ExtensionEntry) => entry.coreIncludes?.[field] ?? []);
}

function findNamespace(entries: Array<ExtensionEntry>, name: string): string | null
{
	const entry = entries.find((item: ExtensionEntry) => item.extension === name);

	return entry ? entry.namespace : null;
}

function registerInActiveRuntime(options: { name: string; namespace: string }): void
{
	const runtime: any = (BX as any)?.Runtime;

	if (typeof runtime?.registerExtension === 'function')
	{
		runtime.registerExtension(options);

		return;
	}

	registerExtension(options);
}

export async function applyExtensions(
	entries: Array<ExtensionEntry>,
	queue: Map<string, LoadableExtensionEntry>,
	loader: AssetLoader = loadAll,
	retry: RetryStrategy = tryLoad,
): Promise<void>
{
	entries.forEach((entry: ExtensionEntry) => {
		if (isNotEmptyObject(entry.messages))
		{
			Loc.setMessage(entry.messages);
		}

		if (hasSettings(entry.settings))
		{
			appendSettingsTag(entry);
		}
	});

	const js: Array<string> = collect(entries, 'js');
	const css: Array<string> = collect(entries, 'css');
	const coreIncludesJs: Array<string> = collectCoreIncludes(entries, 'js');
	const coreIncludesCss: Array<string> = collectCoreIncludes(entries, 'css');
	const loadableExtensions: Array<string> = [...queue.keys()];

	try
	{
		await Promise.all([
			retry(loadableExtensions, () => loader(js)),
			retry(loadableExtensions, () => loader(css)),
		]);
	}
	catch (error)
	{
		queue.forEach((item: LoadableExtensionEntry) => item.reject(error));

		return;
	}

	// When the server served the full core (coreLoaded=N), core.js carries a set
	// of bundled extensions (polyfills, core_ajax, ...). Mark their URLs as loaded
	// so a later BX.load skips files that already run inside core.js. This happens
	// only after the assets actually loaded: setJSList/setCSSList have no removal
	// counterpart (their list lives in a closure), so marking before the load would
	// stick even when core.js never arrived, and the next BX.load would silently
	// skip a file that was never executed. The trade-off is that a bundled file
	// declared by another entry of THIS batch can still be fetched in parallel —
	// wasted traffic, not a broken state. Legacy CJSCore emitted these right after
	// core.js for the same reason.
	registerAssetsAsLoaded(coreIncludesJs, coreIncludesCss);

	// Register against the currently active BX.Runtime. On a minimal->full upgrade
	// the loaded core.js replaces BX.Runtime with a new instance owning a fresh
	// extensions storage; registering there (not into this bundle's captured
	// storage) is what keeps a later loadExtension from going back to the network.
	// The state gating the request parameters lives in this bundle, so it is
	// synced separately.
	entries.forEach((entry: ExtensionEntry) => {
		registerInActiveRuntime({ name: entry.extension, namespace: entry.namespace ?? 'window' });
		markRegistered(entry.extension);
	});

	queue.forEach((item: LoadableExtensionEntry, name: string) => {
		item.resolve(findNamespace(entries, name) ?? 'window');
	});
}

export async function processExtensions(
	queue: Map<string, LoadableExtensionEntry>,
	transport: ExtensionsTransport = loadAssets,
	retry: RetryStrategy = tryLoad,
): Promise<void>
{
	const loadableExtensions: Array<string> = [...queue.keys()];

	// The full core is considered loaded only after registerExtension('main.core')
	// has actually run: either from the page (CJSCore::Init) or after this pipeline
	// finished loading the core assets. A pending request of the core (its own or
	// an in-flight batch) does not count, so the server keeps serving the core and
	// the client deduplicates it by URL.
	const coreLoaded: boolean = isCoreRegistered();

	// Everything already registered is reported so the server can skip those
	// branches instead of re-serving them. Same rule as coreLoaded: a queued but
	// not yet registered name stays out of the list.
	const loadedExtension: Array<string> = getRegisteredNames();

	let entries: Array<ExtensionEntry> = [];

	try
	{
		entries = (await retry(
			loadableExtensions,
			() => transport({ extension: loadableExtensions, coreLoaded, loadedExtension }),
		)) ?? [];
	}
	catch (error)
	{
		queue.forEach((item: LoadableExtensionEntry) => item.reject(error));

		return;
	}

	// loadExtension fires this pipeline without awaiting it, so any error left
	// unhandled here would leave the queued promises pending forever.
	try
	{
		await applyExtensions(entries, queue, loadAll, retry);
	}
	catch (error)
	{
		queue.forEach((item: LoadableExtensionEntry) => item.reject(error));
	}
}
