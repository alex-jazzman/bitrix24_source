import { type CollabTransitionCandidate } from '../types/transition';

export const selectCollabTransitionTarget = (
	candidates: CollabTransitionCandidate[],
): ?CollabTransitionCandidate => {
	if (candidates.length === 0)
	{
		return null;
	}

	const shownInRecent = candidates.find((candidate: CollabTransitionCandidate) => candidate.isShownInRecent);
	if (shownInRecent)
	{
		return shownInRecent;
	}

	const isOrderKnown = candidates.every((candidate: CollabTransitionCandidate) => candidate.lastMessageId > 0);

	return candidates.reduce((best: CollabTransitionCandidate, candidate: CollabTransitionCandidate) => {
		return isNewer(candidate, best, isOrderKnown) ? candidate : best;
	});
};

// Keys count only when every candidate has one; on a draw a child chat wins over the project
// chat, and among children the newer chat (the larger chatId) wins.
function isNewer(
	candidate: CollabTransitionCandidate,
	best: CollabTransitionCandidate,
	isOrderKnown: boolean,
): boolean
{
	if (isOrderKnown && candidate.lastMessageId !== best.lastMessageId)
	{
		return candidate.lastMessageId > best.lastMessageId;
	}

	if (candidate.isParent !== best.isParent)
	{
		return best.isParent;
	}

	return candidate.chatId > best.chatId;
}
