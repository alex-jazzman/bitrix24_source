// The document's waterline as one session knows it: the journal id its text has been materialized up to.
// Together with the baseline checksum it says WHICH lineage a stored queue continues, which the queue
// itself cannot - a Y update carries no document identity.
//
// Absent is not zero. A response that carried no waterline says nothing about the document, while a real
// zero says the journal has never been materialized. Read as zero, every open whose response omits the
// value would look like the start of a fresh lineage, and the unsent queue of the session before it would
// be taken for the queue of a lineage that is gone - and dropped.
export function readBaselineCursor(value: mixed): number | null
{
	if (value === null || value === undefined || value === '')
	{
		return null;
	}

	const cursor = Number(value);

	return Number.isInteger(cursor) && cursor >= 0 ? cursor : null;
}
