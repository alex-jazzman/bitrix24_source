export type MemberSearchItem = {
	id: string,
	name: string,
	position: string,
};

/**
 * Client-side members filter. Pure function: keeps the source order (server sort) and
 * matches the query against both the member name AND the member position, case-insensitively.
 * An empty query returns the full list unchanged.
 *
 * @param {MemberSearchItem[]} members ordered members list (server order)
 * @param {string} query raw search query
 * @returns {MemberSearchItem[]} filtered members preserving the source order
 */
export function filterMembers(members: MemberSearchItem[], query: string): MemberSearchItem[]
{
	if (!Array.isArray(members))
	{
		return [];
	}

	const preparedQuery = (query ?? '').trim().toLowerCase();
	if (preparedQuery.length === 0)
	{
		return members;
	}

	return members.filter((member) => {
		const name = (member?.name ?? '').toLowerCase();
		const position = (member?.position ?? '').toLowerCase();

		// Whole-query substring match, intentionally stricter than the per-word highlighting: a member
		// is kept only when the full query is a substring of the name or the position (so a multi-word
		// query is not split across fields). Keep this in mind if the highlighting ever looks broader.
		return name.includes(preparedQuery) || position.includes(preparedQuery);
	});
}
