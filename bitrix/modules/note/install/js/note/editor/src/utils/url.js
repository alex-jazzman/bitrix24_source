// `/note` prefix optional (SPA is mounted on base `/note/`, so short form is user-typed but valid).
// `/collection/{id}/` is a legacy alias: no such route exists (real route is `/workspace/{id}/`,
// see app/src/router/routes.js), but already-saved documents may contain it, so it must still
// resolve — to the canonical `/note/workspace/{id}/` output, never to the dead `/note/collection` path.
const INTERNAL_NOTE_DOCUMENT_PATTERN = /^(?:\/note)?\/document\/(\d+)\/?$/;
const INTERNAL_NOTE_WORKSPACE_PATTERN = /^(?:\/note)?\/(?:workspace|collection)\/(\d+)\/?$/;
// Exactly the character set produced by slugify (heading-slug.js:46).
const ANCHOR_SLUG_PATTERN = /^[a-z0-9-]+$/;

function canonicalizeInternalNotePath(pathname: string): string | null
{
	const documentMatch = INTERNAL_NOTE_DOCUMENT_PATTERN.exec(pathname);
	if (documentMatch)
	{
		return `/note/document/${documentMatch[1]}/`;
	}

	const workspaceMatch = INTERNAL_NOTE_WORKSPACE_PATTERN.exec(pathname);
	if (workspaceMatch)
	{
		return `/note/workspace/${workspaceMatch[1]}/`;
	}

	return null;
}

export function sanitizeUrl(url: mixed): string | null
{
	if (!url)
	{
		return null;
	}

	const trimmed = String(url).trim();
	if (!trimmed)
	{
		return null;
	}

	if (trimmed.startsWith('#'))
	{
		const slug = trimmed.slice(1);

		return ANCHOR_SLUG_PATTERN.test(slug) ? trimmed : null;
	}

	const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(trimmed);
	const isAbsolutePath = trimmed.startsWith('/');
	const candidate = (hasScheme || isAbsolutePath) ? trimmed : `https://${trimmed}`;

	try
	{
		const parsed = new URL(candidate, window.location.origin);
		if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:' && parsed.protocol !== 'blob:')
		{
			return null;
		}

		if (parsed.origin === window.location.origin)
		{
			const canonicalPath = canonicalizeInternalNotePath(parsed.pathname);
			if (canonicalPath !== null)
			{
				return canonicalPath + parsed.search + parsed.hash;
			}
		}

		return parsed.toString();
	}
	catch
	{
		return null;
	}
}

export function formatFileSize(bytes: mixed): string
{
	if (!bytes || Number.isNaN(bytes))
	{
		return '';
	}

	if (bytes === 0)
	{
		return '0 Bytes';
	}

	const units = ['Bytes', 'KB', 'MB', 'GB'];
	const size = 1024;
	const unitIndex = Math.floor(Math.log(bytes) / Math.log(size));
	const value = bytes / size ** unitIndex;

	return `${value.toFixed(2)} ${units[unitIndex]}`;
}
