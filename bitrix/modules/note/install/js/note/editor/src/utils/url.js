const INTERNAL_NOTE_PATH_PATTERN = /^\/note\/(document|collection)\/\d+\/?$/;

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

		if (parsed.origin === window.location.origin && INTERNAL_NOTE_PATH_PATTERN.test(parsed.pathname))
		{
			return parsed.pathname + parsed.search + parsed.hash;
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
