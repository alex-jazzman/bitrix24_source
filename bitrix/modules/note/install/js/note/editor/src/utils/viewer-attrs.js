import { Text, Type } from 'main.core';

// Attachment node attributes are part of the collaboratively edited document, so any editor
// can author them. The `ui` viewer evaluates some of its `data-*` inputs (`data-actions` goes
// through eval, `data-viewer-type-class` through BX.getClass), hence an allow list instead of
// a deny list: only keys the backend is the sole source of truth for reach the DOM.
const ALLOWED_KEYS = ['viewerType', 'viewerResized'];

function isPrimitive(value: mixed): boolean
{
	return Type.isString(value) || Type.isNumber(value) || Type.isBoolean(value);
}

export function buildViewerDataAttrs(source: mixed): Object
{
	const result = {};
	if (!Type.isPlainObject(source))
	{
		return result;
	}

	Object.entries(source).forEach(([key, value]) => {
		if (!ALLOWED_KEYS.includes(key) || !isPrimitive(value))
		{
			return;
		}

		result[`data-${Text.toKebabCase(key)}`] = value;
	});

	return result;
}

// Attachment urls come from node attributes, so they are author-controlled too. Beyond the
// obvious `javascript:` in href, `data-src` is fetched by the viewer, hence the origin check:
// a foreign host would render its own content inside the portal page.
export function sanitizeAttachmentUrl(url: mixed): string | null
{
	if (!Type.isStringFilled(url))
	{
		return null;
	}

	// Trimmed once and reused: what gets returned must be exactly what was checked,
	// otherwise the string reaching the DOM is not the string that passed the policy.
	const candidate = url.trim();

	let parsed = null;
	try
	{
		parsed = new URL(candidate, window.location.origin);
	}
	catch
	{
		return null;
	}

	// Blob urls are inert outside their own context, and `URL.origin` for them differs
	// between browsers — comparing it would break upload previews for no security gain.
	if (parsed.protocol === 'blob:')
	{
		return candidate;
	}

	if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:')
	{
		return null;
	}

	if (parsed.origin !== window.location.origin)
	{
		return null;
	}

	// Not `parsed.toString()`: attachment urls are relative paths and absolutising them
	// is not this fix's business.
	return candidate;
}
