// `/note` prefix optional (SPA is mounted on base `/note/`, so short form is user-typed but valid).
// `/collection/{id}/` is a legacy alias: no such route exists (real route is `/workspace/{id}/`,
// see app/src/router/routes.js), but already-saved documents may contain it, so it must still
// resolve — to the canonical `/note/workspace/{id}/` output, never to the dead `/note/collection` path.
const INTERNAL_NOTE_DOCUMENT_PATTERN = /^(?:\/note)?\/document\/(\d+)\/?$/;
const INTERNAL_NOTE_WORKSPACE_PATTERN = /^(?:\/note)?\/(?:workspace|collection)\/(\d+)\/?$/;
// Exactly the character set produced by slugify (heading-slug.js:46).
const ANCHOR_SLUG_PATTERN = /^[a-z0-9-]+$/;
const PUNYCODE_BASE = 36;
const PUNYCODE_TMIN = 1;
const PUNYCODE_TMAX = 26;
const PUNYCODE_SKEW = 38;
const PUNYCODE_DAMP = 700;
const PUNYCODE_INITIAL_BIAS = 72;
const PUNYCODE_INITIAL_N = 128;

function decodePunycodeDigit(code: number): number
{
	if (code >= 48 && code <= 57)
	{
		return code - 22;
	}

	if (code >= 65 && code <= 90)
	{
		return code - 65;
	}

	if (code >= 97 && code <= 122)
	{
		return code - 97;
	}

	return PUNYCODE_BASE;
}

function adaptPunycodeBias(delta: number, numPoints: number, firstTime: boolean): number
{
	let value = firstTime ? Math.floor(delta / PUNYCODE_DAMP) : Math.floor(delta / 2);
	value += Math.floor(value / numPoints);
	let k = 0;

	while (value > ((PUNYCODE_BASE - PUNYCODE_TMIN) * PUNYCODE_TMAX) / 2)
	{
		value = Math.floor(value / (PUNYCODE_BASE - PUNYCODE_TMIN));
		k += PUNYCODE_BASE;
	}

	return Math.floor(k + (((PUNYCODE_BASE - PUNYCODE_TMIN + 1) * value) / (value + PUNYCODE_SKEW)));
}

function decodePunycodeLabel(label: string): string
{
	if (!label.toLowerCase().startsWith('xn--'))
	{
		return label;
	}

	const input = label.slice(4);
	if (!input)
	{
		return label;
	}

	const delimiter = input.lastIndexOf('-');
	const basicCodePoints = delimiter === -1 ? '' : input.slice(0, delimiter);
	const output = [...basicCodePoints];
	let inputIndex = delimiter + 1;
	let n = PUNYCODE_INITIAL_N;
	let index = 0;
	let bias = PUNYCODE_INITIAL_BIAS;

	while (inputIndex < input.length)
	{
		const oldIndex = index;
		let weight = 1;

		for (let k = PUNYCODE_BASE; ; k += PUNYCODE_BASE)
		{
			const digit = decodePunycodeDigit(input.codePointAt(inputIndex++) ?? PUNYCODE_BASE);
			if (digit >= PUNYCODE_BASE)
			{
				return label;
			}

			index += digit * weight;
			let threshold = PUNYCODE_TMIN;
			if (k >= bias + PUNYCODE_TMAX)
			{
				threshold = PUNYCODE_TMAX;
			}
			else if (k > bias)
			{
				threshold = k - bias;
			}

			if (digit < threshold)
			{
				break;
			}

			weight *= PUNYCODE_BASE - threshold;
		}

		const outputLength = output.length + 1;
		bias = adaptPunycodeBias(index - oldIndex, outputLength, oldIndex === 0);
		n += Math.floor(index / outputLength);
		if (n > 0x10FFFF)
		{
			return label;
		}

		index %= outputLength;
		output.splice(index++, 0, String.fromCodePoint(n));
	}

	return output.join('');
}

function decodePunycodeHostname(hostname: string): string
{
	return hostname.split('.').map((label) => decodePunycodeLabel(label)).join('.');
}

// Only fully Cyrillic hostnames are decoded. Other IDNs stay in ACE form until a UTS #39 policy is defined.
function isFullyCyrillicHostname(hostname: string): boolean
{
	let hasCyrillicLetter = false;

	for (const character of hostname)
	{
		const codePoint = character.codePointAt(0) ?? 0;
		if (character === '.' || character === '-' || (codePoint >= 48 && codePoint <= 57))
		{
			continue;
		}

		const isCyrillic = (codePoint >= 0x0400 && codePoint <= 0x052F)
			|| (codePoint >= 0x2DE0 && codePoint <= 0x2DFF)
			|| (codePoint >= 0xA640 && codePoint <= 0xA69F);
		if (!isCyrillic)
		{
			return false;
		}

		hasCyrillicLetter = true;
	}

	return hasCyrillicLetter;
}

function decodeUrlTailForDisplay(tail: string): string
{
	// Reserved delimiters stay encoded in decodeURI, while a decoded percent sign would be ambiguous.
	if (tail.includes('%25'))
	{
		return tail;
	}

	try
	{
		return decodeURI(tail);
	}
	catch
	{
		return tail;
	}
}

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

export function formatUrlForDisplay(url: mixed): string
{
	const href = sanitizeUrl(url);
	if (!href || href.startsWith('/') || href.startsWith('#'))
	{
		return href ?? '';
	}

	try
	{
		const parsed = new URL(href);
		if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:')
		{
			return href;
		}

		const decodedHostname = decodePunycodeHostname(parsed.hostname);
		const displayHostname = isFullyCyrillicHostname(decodedHostname) ? decodedHostname : parsed.hostname;
		const authorityStart = parsed.protocol.length + 2;
		const authorityEnd = href.indexOf('/', authorityStart);
		if (authorityEnd === -1)
		{
			return href;
		}

		const credentialsEnd = href.lastIndexOf('@', authorityEnd);
		const hostnameStart = credentialsEnd < authorityStart ? authorityStart : credentialsEnd + 1;
		const hostnameEnd = parsed.port ? authorityEnd - parsed.port.length - 1 : authorityEnd;
		const authoritySuffix = href.slice(hostnameEnd, authorityEnd);
		const displayTail = decodeUrlTailForDisplay(href.slice(authorityEnd));
		const displayUrl = `${href.slice(0, hostnameStart)}${displayHostname}${authoritySuffix}${displayTail}`;

		return sanitizeUrl(displayUrl) === href ? displayUrl : href;
	}
	catch
	{
		return href;
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
