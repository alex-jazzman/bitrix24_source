import { Type } from 'main.core';

const restoreParameter = '__rpa_slider_restore';

function escapeRegExp(value: string): string
{
	let escaped = '';
	for (const character of value)
	{
		escaped += '\\^$.*+?()[]{}|'.includes(character) ? `\\${character}` : character;
	}

	return escaped;
}

function matchTemplate(path: string, template: string): ?Object
{
	if (!Type.isStringFilled(template) || !template.startsWith('/'))
	{
		return null;
	}

	const placeholder = /#(typeId|id)#/g;
	const names = [];
	let pattern = '^';
	let offset = 0;
	let match = placeholder.exec(template);
	while (match)
	{
		pattern += escapeRegExp(template.slice(offset, match.index));
		pattern += '(\\d+)';
		names.push(match[1]);
		offset = match.index + match[0].length;
		match = placeholder.exec(template);
	}
	pattern += escapeRegExp(template.slice(offset));
	pattern = `${pattern.replace(/\/$/, '/?')}$`;

	const matches = path.match(new RegExp(pattern));
	if (!matches)
	{
		return null;
	}

	const parameters = {};
	names.forEach((name, index) => {
		parameters[name] = matches[index + 1];
	});

	return parameters;
}

function getUrl(value: string, origin: string): ?URL
{
	if (!Type.isStringFilled(value))
	{
		return null;
	}

	try
	{
		const url = new URL(value, origin);

		return url.origin === origin && /^https?:$/.test(url.protocol) ? url : null;
	}
	catch
	{
		return null;
	}
}

function getItemSliderHistoryState(itemUrl: string, pageUrl: string, origin: string, urlTemplates: Object): ?Object
{
	const item = getUrl(itemUrl, origin);
	const page = getUrl(pageUrl, origin);
	if (!item || !page || item.searchParams.has(restoreParameter) || !Type.isPlainObject(urlTemplates))
	{
		return null;
	}

	const itemParameters = matchTemplate(item.pathname, urlTemplates['bitrix:rpa.item.detail']);
	const pageParameters = matchTemplate(page.pathname, urlTemplates['bitrix:rpa.item.list'])
		|| matchTemplate(page.pathname, urlTemplates['bitrix:rpa.kanban']);
	if (!itemParameters?.typeId || !itemParameters?.id || itemParameters.typeId !== pageParameters?.typeId)
	{
		return null;
	}

	return {
		itemUrl: item.pathname + item.search + item.hash,
		pageUrl: page.pathname + page.search + page.hash,
	};
}

function getItemSliderRestoreUrl(itemUrl: string, origin: string): ?string
{
	const item = getUrl(itemUrl, origin);
	if (!item || item.searchParams.has(restoreParameter))
	{
		return null;
	}

	item.searchParams.set(restoreParameter, '1');

	return item.pathname + item.search + item.hash;
}

function getItemSliderCanonicalUrl(currentUrl: string, origin: string): ?string
{
	const current = getUrl(currentUrl, origin);
	if (!current || !current.searchParams.has(restoreParameter))
	{
		return null;
	}

	current.searchParams.delete(restoreParameter);

	return current.pathname + current.search + current.hash;
}

function getItemSliderHistoryAction(currentUrl: string, state: ?Object, origin: string, urlTemplates: Object): ?Object
{
	if (!Type.isPlainObject(state))
	{
		return null;
	}

	const current = getUrl(currentUrl, origin);
	if (!current)
	{
		return null;
	}

	const currentPath = getItemSliderCanonicalUrl(currentUrl, origin)
		|| current.pathname + current.search + current.hash;
	for (const [key, type, matchingUrl] of [
		['rpaItemSlider', 'restorePage', 'itemUrl'],
		['rpaItemSliderPending', 'openSlider', 'pageUrl'],
	])
	{
		const value = state[key];
		if (!Type.isPlainObject(value))
		{
			continue;
		}

		const urls = getItemSliderHistoryState(value.itemUrl, value.pageUrl, origin, urlTemplates);
		if (urls && urls[matchingUrl] === currentPath)
		{
			return type === 'restorePage' ? { type, ...urls } : { type, itemUrl: urls.itemUrl };
		}
	}

	return null;
}

export {
	getItemSliderHistoryState,
	getItemSliderHistoryAction,
	getItemSliderRestoreUrl,
	getItemSliderCanonicalUrl,
};
