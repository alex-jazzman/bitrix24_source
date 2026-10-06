export function updateIdUrl(templateId): void
{
	const url = new URL(window.location.href);
	url.searchParams.set('ID', templateId);
	url.searchParams.delete('START_TRIGGER');
	history.replaceState(null, '', url.toString());
}

// The editor without ID means a new template: the document type stays in the current page params.
export function getCreateTemplateUrl(): string
{
	const url = new URL(window.location.href);
	url.searchParams.delete('ID');

	return `${url.pathname}${url.search}`;
}

export const TEMPLATE_LIST_URL = '/bizproc/templateprocesses/';

/**
 * Where to send the user back from the editor: the back_url the editor was opened with,
 * or the workflow templates list, which is the only entry point to every document type.
 */
export function getBackToListUrl(): string
{
	return getSafeBackUrl() ?? TEMPLATE_LIST_URL;
}

// back_url comes from the page query, so only a site-relative path is accepted here. The origin
// check makes this stricter than the server-side validation: it also rejects "/\host" and values
// with control characters, which the URL parser normalizes into an address on another host.
// Values the parser rejects outright, like "/\[", are dropped the same way.
function getSafeBackUrl(): ?string
{
	const backUrl = new URL(window.location.href).searchParams.get('back_url');
	if (backUrl === null || !backUrl.startsWith('/') || backUrl[1] === '/')
	{
		return null;
	}

	try
	{
		return new URL(backUrl, window.location.origin).origin === window.location.origin
			? backUrl
			: null;
	}
	catch
	{
		return null;
	}
}
