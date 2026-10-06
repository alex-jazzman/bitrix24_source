export const LIST_SECTION_PARAM = 'list_section';
export const FAVORITES_SECTION = 'favorites';

function parse(url: string): URL
{
	return new URL(url, window.location.origin);
}

function serialize(url: URL): string
{
	return `${url.pathname}${url.search}${url.hash}`;
}

export function isFavoritesSectionUrl(url: string): boolean
{
	return parse(url).searchParams.get(LIST_SECTION_PARAM) === FAVORITES_SECTION;
}

export function withFavoritesSection(url: string): string
{
	const parsed = parse(url);
	parsed.searchParams.set(LIST_SECTION_PARAM, FAVORITES_SECTION);

	return serialize(parsed);
}

export function withoutFavoritesSection(url: string): string
{
	const parsed = parse(url);
	parsed.searchParams.delete(LIST_SECTION_PARAM);

	return serialize(parsed);
}
