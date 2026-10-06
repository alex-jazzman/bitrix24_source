// The cursor of a journal read. The patch list and the last id are answered by two queries of their
// own, with no transaction shared between them: a patch inserted between the two reads is counted by
// the id and absent from the list, so taking the id would declare applied what we never received.
// Nothing would ever catch that hole either - the next patch reports a predecessor equal to our
// cursor. What we applied speaks for itself; the server id is only needed when the list is empty and
// cannot answer at all.
export function resolveAppliedCursor(patches: Array<Object>, lastPatchId: mixed): number
{
	if (!Array.isArray(patches) || patches.length === 0)
	{
		return Number(lastPatchId ?? 0) || 0;
	}

	let appliedId = 0;
	for (const patch of patches)
	{
		const id = Number(patch.ID ?? patch.id ?? 0) || 0;
		if (id > appliedId)
		{
			appliedId = id;
		}
	}

	return appliedId;
}
