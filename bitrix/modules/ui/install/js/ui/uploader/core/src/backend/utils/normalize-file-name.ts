/**
 * Returns a Unicode-normalised file name (NFC by default). Used before sending
 * the name to the server so that visually identical glyphs encoded with
 * different code-point sequences (e.g. from macOS HFS+ which prefers NFD) hash
 * and compare identically across platforms.
 *
 * Older browsers lacking String.prototype.normalize return the original string
 * unchanged — non-normalised names are tolerated server-side, so we degrade
 * gracefully instead of erroring out.
 */
export function normalizeFileName(name: string): string
{
	return name && name.normalize ? name.normalize() : name;
}
