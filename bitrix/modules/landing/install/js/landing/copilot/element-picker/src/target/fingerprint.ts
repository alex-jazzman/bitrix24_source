import { contentElementChildren, isQuarantineContainer, isServiceElement } from './target-model';

const TEXT_LENGTH_LIMIT = 64;

// exactly the whitespace class the PHP side (preg_replace('/\s+/u')) collapses:
// unicode spaces plus U+0085/U+180E, but not U+FEFF/U+200B — the JS \s class
// differs on those three, so the set is spelled out
const WHITESPACE_RUN_REGEX = new RegExp(
	'[\\t-\\r \\u0085\\u00A0\\u1680\\u180E\\u2000-\\u200A\\u2028\\u2029\\u202F\\u205F\\u3000]+',
	'g',
);

// only the references html_entity_decode(ENT_QUOTES | ENT_HTML5) decodes:
// exact `&name;`/`&#N;`/`&#xN;` with the trailing semicolon; legacy references
// without it stay literal text on both sides
const ENTITY_REGEX = /&(?:[a-zA-Z][a-zA-Z0-9]*|#(?:[0-9]+|[xX][0-9a-fA-F]+));/g;

/**
 * Builds the target fingerprint (DTO-02): "<tag>|<childCount>|<textHash>".
 *
 * The backend builds the same string from the saved block HTML, so the text
 * is collected without editor service elements and quarantine subtrees, then
 * entity-decoded (both sides decode once more on top of their DOM text),
 * unicode-whitespace-collapsed, trimmed and cut to the first 64 characters.
 */
export function buildFingerprint(target: Element): string
{
	const tag = target.tagName.toLowerCase();
	const childCount = contentElementChildren(target).length;
	const text = normalizeFingerprintText(collectContentText(target));

	return `${tag}|${childCount}|${hashFnv1a32(text)}`;
}

function collectContentText(target: Element): string
{
	let text = '';
	for (const child of target.childNodes)
	{
		if (child.nodeType === Node.TEXT_NODE)
		{
			text += child.nodeValue ?? '';
		}
		else if (child.nodeType === Node.ELEMENT_NODE)
		{
			// every element counts, foreign content (svg/math) included: the
			// backend collects the text of the whole saved subtree the same way
			const element = child as Element;
			if (!isServiceElement(element) && !isQuarantineContainer(element))
			{
				text += collectContentText(element);
			}
		}
	}

	return text;
}

function normalizeFingerprintText(text: string): string
{
	const decoded = decodeHtmlEntities(text);
	const collapsed = decoded.replace(WHITESPACE_RUN_REGEX, ' ');
	// the PHP side trims after collapsing, when every whitespace run is already
	// a plain space; a unicode-aware .trim() would diverge on edge U+FEFF
	const trimmed = collapsed.replace(/^ +/, '').replace(/ +$/, '');

	// cut by code points, not UTF-16 units, to match the PHP mb_substr
	return [...trimmed].slice(0, TEXT_LENGTH_LIMIT).join('');
}

// the HTML5 "allowed character reference" set, measured against
// html_entity_decode: control/C1/surrogate/noncharacter refs stay literal
function isDecodableCodePoint(code: number): boolean
{
	if (code === 0x09 || code === 0x0A || code === 0x0C)
	{
		return true;
	}
	if (code >= 0x20 && code <= 0x7E)
	{
		return true;
	}
	if (code < 0xA0 || code > 0x10FFFF)
	{
		return false;
	}
	if (code >= 0xD800 && code <= 0xDFFF)
	{
		return false;
	}
	if (code >= 0xFDD0 && code <= 0xFDEF)
	{
		return false;
	}

	return (code & 0xFFFE) !== 0xFFFE;
}

function decodeHtmlEntities(text: string): string
{
	if (!text.includes('&'))
	{
		return text;
	}

	let decoder: HTMLTextAreaElement | null = null;

	return text.replace(ENTITY_REGEX, (entity: string): string => {
		if (entity[1] === '#')
		{
			const code = entity[2] === 'x' || entity[2] === 'X'
				? Number.parseInt(entity.slice(3, -1), 16)
				: Number.parseInt(entity.slice(2, -1), 10);

			return isDecodableCodePoint(code) ? String.fromCodePoint(code) : entity;
		}

		// one exact reference at a time through the RCDATA fragment parser of
		// <textarea>: the surrounding text is never parsed, so markup-like text
		// ("R&D <b>bold</b>", a literal "</textarea>") stays intact
		decoder = decoder ?? document.createElement('textarea');
		decoder.innerHTML = entity;
		const decoded = decoder.value;
		if (decoded === entity)
		{
			return entity;
		}

		// a leftover semicolon means the parser matched a legacy prefix of the
		// name ("&notit;" -> "¬it;") — html_entity_decode never does that
		if (decoded.endsWith(';') && decoded !== ';')
		{
			return entity;
		}

		return decoded;
	});
}

/**
 * FNV-1a 32-bit over the UTF-8 bytes of the text, 8 lowercase hex characters;
 * must stay identical to the PHP implementation on the backend side.
 */
export function hashFnv1a32(text: string): string
{
	const bytes = new TextEncoder().encode(text);
	let hash = 0x811C9DC5;
	for (const byte of bytes)
	{
		hash ^= byte;
		hash = Math.imul(hash, 0x01000193) >>> 0;
	}

	return hash.toString(16).padStart(8, '0');
}
