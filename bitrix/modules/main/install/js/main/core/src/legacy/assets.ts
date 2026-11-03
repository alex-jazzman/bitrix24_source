import { BX } from './internal/global';
import { util } from './util';
import { DoNothing } from './events';

/**
 * Resource loading and the public script/style lists (MOD-01).
 *
 * The largest group in the file and the one MOD-01 is most emphatic about: four variables - the
 * two lists and the two one-shot init flags - are read and written by the public list API, by the
 * loader, by the reload helper and by the cache clearing. Splitting them would not throw; it would
 * quietly give the loader a list that the consumers of `BX.getJSList()` never see, and an
 * extension would then be fetched a second time with nothing in the console to show for it.
 *
 * Two functions named `isCssLoaded` live in the source, one nested inside `loadAsset` and one at
 * the top of the group, and they do different things: the inner one polls `document.styleSheets`
 * for a sheet that has actually arrived, the outer one asks whether a path is already in
 * `cssList`. In the source the inner one shadows the outer one for the length of `loadAsset`;
 * written out as two module-level functions of one name, one would simply overwrite the other and
 * the result would be either a wrong answer or an unbounded recursion. FIX-01 #6 therefore names
 * them apart explicitly: `pollStyleSheet` for the inner one, `isCssLoaded` for the outer.
 *
 * `clearCache` calls `BX.showWait`, which belongs to `wait.ts`. That edge crosses a group
 * boundary, so it stays late-bound through the global (ADR 3.4). `normalizeUrl` reaches
 * `BX.getJSPath` the same way even though the symbol is published by this very module - the
 * indirection is what the source does and what a consumer who replaces `BX.getJSPath` relies on.
 */

/* list of loaded CSS files */
let cssList: any[] = [];
let cssInit = false;

/* list of loaded JS files */
let jsList: any[] = [];
let jsInit = false;

const LOADING = 3;
const LOADED = 4;
const assets: Record<string, any> = {};
const loadingAssetCallbacks: Record<string, any[]> = {};

export function setJSList(scripts: any): void
{
	if (BX.type.isArray(scripts))
	{
		scripts = scripts.map(function(script: any) {
			return normalizeUrl(script);
		});

		jsList = jsList.concat(scripts);
	}
}

export function getJSList(): any[]
{
	initJsList();

	return jsList;
}

export function setCSSList(cssFiles: any): void
{
	if (BX.type.isArray(cssFiles))
	{
		cssFiles = cssFiles.map(function(cssFile: any) {
			return normalizeUrl(cssFile);
		});

		cssList = cssList.concat(cssFiles);
	}
}

export function getCSSList(): any[]
{
	initCssList();

	return cssList;
}

export function getJSPath(js: any): string
{
	return js.replace(/^(http[s]*:)*\/\/[^/]+/i, '');
}

export function getCSSPath(css: any): string
{
	return css.replace(/^(http[s]*:)*\/\/[^/]+/i, '');
}

export function getCDNPath(path: any): any
{
	return path;
}

export function loadScript(script: any, callback?: any, doc?: any): any
{
	if (BX.type.isString(script))
	{
		script = [script];
	}

	// through the global on purpose: a consumer who replaces BX.load replaces this too
	return BX.load(script, callback, doc);
}

/**
 * The asymmetry with `loadScript` is carried over: no callback parameter, `null` passed down in
 * its place, a `win` parameter that is declared and never read, and no return value.
 */
export function loadCSS(css: any, doc?: any, win?: any): void
{
	if (BX.type.isString(css))
	{
		css = [css];
	}

	if (BX.type.isArray(css))
	{
		css = css.map(function(url: any) {
			return { url, ext: 'css' };
		});

		BX.load(css, null, doc);
	}
}

export function load(items: any, callback?: any, doc?: any, reject?: any): any
{
	if (!BX.isReady)
	{
		const _args = arguments;
		BX.ready(function(this: any) {
			BX.load.apply(this, _args);
		});

		return null;
	}

	doc = doc || document;

	callback = BX.Type.isFunction(callback) ? callback : () => {};

	return loadAsync(items, callback, doc, reject);
}

function loadAsync(items: any, callback: any, doc: any, reject: any): void
{
	if (!BX.type.isArray(items))
	{
		callback();

		return;
	}

	function onLoad(): void
	{
		const nextAsset = queue.shift();
		if (nextAsset)
		{
			loadSingleAsset(nextAsset, onLoad, doc, reject);
		}
		else if (allLoaded())
		{
			callback();
		}
	}

	function allLoaded(): boolean
	{
		for (const name in assetMap)
		{
			if (assetMap[name].state !== LOADED)
			{
				return false;
			}
		}

		return true;
	}

	const queue: any[] = [];
	const assetMap: Record<string, any> = {};
	items.forEach((item: any) => {
		const asset = getAsset(item);
		if (asset && asset.state !== LOADED)
		{
			queue.push(asset);
			assetMap[asset.name] = asset;
		}
	});

	if (queue.length > 0)
	{
		const maxParallelLoads = 6;
		const parallelLoads = Math.min(queue.length, maxParallelLoads);
		const firstPackage = queue.splice(0, parallelLoads);
		firstPackage.forEach((asset) => {
			loadSingleAsset(asset, onLoad, doc, reject);
		});
	}
	else
	{
		callback();
	}
}

// renamed from `load`: the public loader above carries that name now that it is an export
// rather than an assignment to `BX`, and the two cannot share it inside one module scope
function loadSingleAsset(asset: any, callback: any, doc: any, reject: any): void
{
	callback = callback || DoNothing;

	if (asset.state === LOADED)
	{
		callback();

		return;
	}

	if (asset.state === LOADING)
	{
		if (!BX.Type.isArray(loadingAssetCallbacks[asset.name]))
		{
			loadingAssetCallbacks[asset.name] = [];
		}

		loadingAssetCallbacks[asset.name].push(callback);

		return;
	}

	asset.state = LOADING;

	const onReject = () => {
		delete assets[asset.name];
		delete loadingAssetCallbacks[asset.name];
		reject();
	};

	loadAsset(
		asset,
		function() {
			asset.state = LOADED;
			callback();
			if (BX.Type.isArrayFilled(loadingAssetCallbacks[asset.name]))
			{
				for (const cb of loadingAssetCallbacks[asset.name])
				{
					cb();
				}
			}

			delete loadingAssetCallbacks[asset.name];
		},
		doc,
		BX.Type.isFunction(reject) ? onReject : null,
	);
}

function loadAsset(asset: any, callback: any, doc: any, reject: any): void
{
	callback = callback || DoNothing;

	function error(event?: any): void
	{
		window.clearTimeout(asset.errorTimeout);
		window.clearTimeout(asset.cssTimeout);
		ele.onload = ele.onreadystatechange = ele.onerror = null;
		if (BX.Type.isFunction(reject))
		{
			reject();
		}
		else
		{
			// carried verbatim: without a reject handler a failed load is reported as a success
			callback();
		}
	}

	function process(event?: any): void
	{
		if (ext === 'css')
		{
			cssList.push(normalizeMinUrl(normalizeUrl(asset.url)));
		}
		else
		{
			jsList.push(normalizeMinUrl(normalizeUrl(asset.url)));
		}

		event = event || (window as any).event;
		if (event.type === 'load' || (/loaded|complete/.test(ele.readyState) && (!doc.documentMode || doc.documentMode < 9)))
		{
			window.clearTimeout(asset.errorTimeout);
			window.clearTimeout(asset.cssTimeout);
			ele.onload = ele.onreadystatechange = ele.onerror = null;
			callback();
		}
	}

	/**
	 * FIX-01 #6. In the source this is a second function called `isCssLoaded`, nested inside
	 * `loadAsset` and shadowing the module-level one. It answers a different question - has the
	 * sheet actually arrived in `document.styleSheets` - and after 20 retries it gives up without
	 * calling anything, leaving the 7000 ms error timeout as the only way out.
	 */
	function pollStyleSheet(): void
	{
		if (asset.state !== LOADED && asset.cssRetries <= 20)
		{
			for (let i = 0, l = doc.styleSheets.length; i < l; i++)
			{
				if (doc.styleSheets[i].href === ele.href)
				{
					process({ type: 'load' });

					return;
				}
			}

			asset.cssRetries++;
			asset.cssTimeout = window.setTimeout(pollStyleSheet, 250);
		}
	}

	let ele: any = null;
	const ext = BX.type.isNotEmptyString(asset.ext) ? asset.ext : util.getExtension(asset.url);

	if (ext === 'css')
	{
		ele = doc.createElement('link');
		ele.type = `text/${asset.type || 'css'}`;
		ele.rel = 'stylesheet';
		ele.href = asset.url;

		asset.cssRetries = 0;
		asset.cssTimeout = window.setTimeout(pollStyleSheet, 500);
	}
	else
	{
		ele = doc.createElement('script');
		ele.type = `text/${asset.type || 'javascript'}`;
		ele.src = asset.url;
	}

	ele.onload = ele.onreadystatechange = process;
	ele.onerror = error;

	ele.async = asset.async === true;
	ele.defer = false;

	asset.errorTimeout = window.setTimeout(function() {
		error({ type: 'timeout' });
	}, 7000);

	let templateLink = null;
	const head = doc.head || doc.getElementsByTagName('head')[0];
	if (ext === 'css' && (templateLink = getTemplateLink(head)) !== null)
	{
		templateLink.parentNode.insertBefore(ele, templateLink);
	}
	else
	{
		// before the last child, not the first - carried verbatim
		head.insertBefore(ele, head.lastChild);
	}
}

function getAsset(item: any): any
{
	let asset: any = {};
	if (typeof item === 'object')
	{
		asset = item;
		asset.name = asset.name ? asset.name : util.hashCode(item.url);
	}
	else
	{
		asset = { name: util.hashCode(item), url: item };
	}

	const ext = BX.type.isNotEmptyString(asset.ext) ? asset.ext : util.getExtension(asset.url);
	if ((ext === 'css' && isCssLoaded(asset.url)) || isScriptLoaded(asset.url))
	{
		asset.state = LOADED;
	}

	const existing = assets[asset.name];
	if (existing && existing.url === asset.url)
	{
		return existing;
	}

	assets[asset.name] = asset;

	return asset;
}

function normalizeUrl(url: any): string
{
	if (!BX.type.isNotEmptyString(url))
	{
		return '';
	}

	// through the global on purpose: a consumer who replaces BX.getJSPath replaces this too
	url = BX.getJSPath(url);
	url = url.replace(/\?[0-9]*$/, '');

	return url;
}

function normalizeMinUrl(url: any): string
{
	if (!BX.type.isNotEmptyString(url))
	{
		return '';
	}

	const minPos = url.indexOf('.min');

	return minPos >= 0 ? url.substr(0, minPos) + url.substr(minPos + 4) : url;
}

/**
 * FIX-01 #6, the outer one: asks whether a path is already in the list of loaded styles. Not to
 * be confused with `pollStyleSheet` above.
 */
function isCssLoaded(fileSrc: any): boolean
{
	initCssList();

	fileSrc = normalizeUrl(fileSrc);
	const fileSrcMin = normalizeMinUrl(fileSrc);

	return (fileSrc !== fileSrcMin && util.in_array(fileSrcMin, cssList)) || util.in_array(fileSrc, cssList);
}

function initCssList(): void
{
	if (!cssInit)
	{
		const linksCol = document.getElementsByTagName('link');

		if (!!linksCol && linksCol.length > 0)
		{
			for (let i = 0; i < linksCol.length; i++)
			{
				let href = linksCol[i].getAttribute('href');
				if (BX.type.isNotEmptyString(href))
				{
					href = normalizeMinUrl(normalizeUrl(href));
					cssList.push(href);
				}
			}
		}
		cssInit = true;
	}
}

function getTemplateLink(head: any): any
{
	const findLink = function(tag: string): any {
		const links = head.getElementsByTagName(tag);
		for (let i = 0, length = links.length; i < length; i++)
		{
			const templateStyle = links[i].getAttribute('data-template-style');
			if (BX.type.isNotEmptyString(templateStyle) && templateStyle == 'true')
			{
				return links[i];
			}
		}

		return null;
	};

	let link = findLink('link');
	if (link === null)
	{
		link = findLink('style');
	}

	return link;
}

function isScriptLoaded(fileSrc: any): boolean
{
	initJsList();

	fileSrc = normalizeUrl(fileSrc);
	const fileSrcMin = normalizeMinUrl(fileSrc);

	return (fileSrc !== fileSrcMin && util.in_array(fileSrcMin, jsList)) || util.in_array(fileSrc, jsList);
}

function initJsList(): void
{
	if (!jsInit)
	{
		const scriptCol = document.getElementsByTagName('script');

		if (!!scriptCol && scriptCol.length > 0)
		{
			for (let i = 0; i < scriptCol.length; i++)
			{
				let src = scriptCol[i].getAttribute('src');

				if (BX.type.isNotEmptyString(src))
				{
					src = normalizeMinUrl(normalizeUrl(src));
					jsList.push(src);
				}
			}
		}
		jsInit = true;
	}
}

function reloadInternal(back_url: any, bAddClearCache?: any): void
{
	// a literal true in the first position means "add the cache-clearing flag" - this is how
	// BX.clearCache calls it
	if (back_url === true)
	{
		bAddClearCache = true;
		back_url = null;
	}

	const topWindow = (function() {
		if (BX.PageObject && BX.PageObject.getRootWindow)
		{
			return BX.PageObject.getRootWindow();
		}

		return window.top;
	})();
	let new_href = back_url || topWindow.location.href;

	const hashpos = new_href.indexOf('#');
	let hash = '';

	if (hashpos != -1)
	{
		hash = new_href.substr(hashpos);
		new_href = new_href.substr(0, hashpos);
	}

	if (bAddClearCache && new_href.indexOf('clear_cache=Y') < 0)
	{
		new_href += (new_href.indexOf('?') == -1 ? '?' : '&') + 'clear_cache=Y';
	}

	if (hash)
	{
		// hack for clearing cache in ajax mode components with history emulation
		if (bAddClearCache && (hash.substr(0, 5) == 'view/' || hash.substr(0, 6) == '#view/') && hash.indexOf('clear_cache%3DY') < 0)
		{
			hash += (hash.indexOf('%3F') == -1 ? '%3F' : '%26') + 'clear_cache%3DY';
		}

		new_href = new_href.replace(/([?&])_r=\d*/, '');
		new_href += `${(new_href.indexOf('?') == -1 ? '?' : '&') + '_r='}${Math.round(Math.random() * 10000)}${hash}`;
	}

	topWindow.location.href = new_href;
}

export function reload(back_url?: any, bAddClearCache?: any): void
{
	reloadInternal(back_url, bAddClearCache);
}

export function clearCache(): void
{
	// crosses into wait.ts - late-bound through the global on purpose (ADR 3.4)
	BX.showWait();
	// through the global on purpose: a consumer who replaces BX.reload replaces this too
	BX.reload(true);
}
