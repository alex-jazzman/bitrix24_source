/**
 * How a field of what arrived over a wire is read. The readers sit in the layer that owns the wire and
 * beside neither of their callers: the adapter of the channel and the router of incoming signals read
 * the same envelope, so a reader kept in the router would make the port depend on the signaling layer
 * to reuse it, and a copy on each side would be one reader in two versions.
 *
 * Nothing here decides what a field means - that is the business of whoever asked for it.
 */

/**
 * What the wire sent as an object; a value of any other shape carries no field to read. It is the
 * shape check of everything that arrives over a wire - the envelope, the payload inside it and the
 * answer of a server action alike - and it says nothing about lists: a caller that has to tell an
 * array apart states that itself.
 */
export function isWireRecord(value: unknown): value is { [field: string]: unknown }
{
	return typeof value === 'object' && value !== null;
}

/** A numeric id on the wire becomes the string of the contract; anything else counts as absent. */
export function readWireId(value: unknown): string | undefined
{
	if (typeof value === 'string')
	{
		return value;
	}

	return typeof value === 'number' ? String(value) : undefined;
}
