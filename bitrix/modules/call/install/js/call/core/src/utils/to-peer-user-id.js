/**
 * The user id of a peer series travels in an event payload, so it can arrive as a string or not
 * arrive at all. Anything that is not a number becomes null: the reconnect history refuses a peer
 * series without a numeric id loudly, and a silent zero would merge every interlocutor into one
 * series again.
 */
export function toPeerUserId(value)
{
	const userId = Number.parseInt(value, 10);

	return Number.isFinite(userId) ? userId : null;
}
