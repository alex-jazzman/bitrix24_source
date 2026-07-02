export function getUrl(): string
{
	return window.location.pathname + window.location.search + window.location.hash;
}
