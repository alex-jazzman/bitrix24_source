export function updateIdUrl(templateId): void
{
	const url = new URL(window.location.href);
	url.searchParams.set('ID', templateId);
	url.searchParams.delete('START_TRIGGER');
	history.replaceState(null, '', url.toString());
}
