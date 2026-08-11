type InternalNoteLink =
	| { type: 'document', id: number, hash?: string }
	| { type: 'collection', id: number, hash?: string }
	| { type: 'anchor', hash: string };

// `/note` prefix is optional: the SPA is mounted on base `/note/`, so `/document/{id}/` and
// `/note/document/{id}/` denote the same internal document link (user-typed short form must not reload).
const DOCUMENT_PATH_PATTERN = /^(?:\/note)?\/document\/(\d+)\/?$/;
// Real collection route is `/workspace/{id}/` (app/src/router/routes.js); `/collection/{id}/` is a
// dead route that never existed but is already saved in some documents, so it's kept as a legacy alias.
const COLLECTION_PATH_PATTERN = /^(?:\/note)?\/(?:workspace|collection)\/(\d+)\/?$/;

function resolveCurrentOrigin(): string | null
{
	if (typeof window === 'undefined' || !window.location)
	{
		return null;
	}

	const origin = window.location.origin;

	return typeof origin === 'string' && origin !== '' ? origin : null;
}

function extractPathname(href: string, currentOrigin: string | null): string | null
{
	if (href.startsWith('//'))
	{
		return null;
	}

	if (href.startsWith('/'))
	{
		return href.split(/[?#]/)[0];
	}

	if (!/^https?:\/\//i.test(href))
	{
		return null;
	}

	if (!currentOrigin)
	{
		return null;
	}

	try
	{
		const parsed = new URL(href);
		if (parsed.origin !== currentOrigin)
		{
			return null;
		}

		return parsed.pathname;
	}
	catch
	{
		return null;
	}
}

function extractHash(href: string): string
{
	const index = href.indexOf('#');
	if (index === -1)
	{
		return '';
	}

	return href.slice(index + 1).trim();
}

export function parseInternalNoteLink(href: mixed, origin?: string | null): InternalNoteLink | null
{
	if (typeof href !== 'string' || href === '')
	{
		return null;
	}

	// Pure in-document anchor: "#slug".
	if (href.startsWith('#'))
	{
		const hash = href.slice(1).trim();

		return hash === '' ? null : { type: 'anchor', hash };
	}

	const currentOrigin = origin === undefined ? resolveCurrentOrigin() : origin;
	const pathname = extractPathname(href, currentOrigin);
	if (pathname === null)
	{
		return null;
	}

	const documentMatch = DOCUMENT_PATH_PATTERN.exec(pathname);
	if (documentMatch)
	{
		const id = Number(documentMatch[1]);
		if (!Number.isInteger(id) || id <= 0)
		{
			return null;
		}

		const hash = extractHash(href);

		return hash === '' ? { type: 'document', id } : { type: 'document', id, hash };
	}

	const collectionMatch = COLLECTION_PATH_PATTERN.exec(pathname);
	if (collectionMatch)
	{
		const id = Number(collectionMatch[1]);
		if (!Number.isInteger(id) || id <= 0)
		{
			return null;
		}

		const hash = extractHash(href);

		return hash === '' ? { type: 'collection', id } : { type: 'collection', id, hash };
	}

	return null;
}
