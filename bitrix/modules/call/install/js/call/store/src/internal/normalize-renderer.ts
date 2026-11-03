/**
 * Normalizes a renderer stored in MediaStreamRegistry into a plain MediaStream.
 *
 * MediaStreamRegistry historically stores either a raw MediaStream or a legacy
 * mediaRenderer object with a `.stream` property. Consumers must not branch on
 * this shape — the normalization is centralized here.
 */
export function normalizeRenderer(renderer: unknown): MediaStream | null
{
	if (!renderer)
	{
		return null;
	}

	if (typeof (renderer as MediaStream).getTracks === 'function')
	{
		return renderer as MediaStream;
	}

	const inner = (renderer as { stream?: MediaStream }).stream;

	if (inner && typeof inner.getTracks === 'function')
	{
		return inner;
	}

	return null;
}
