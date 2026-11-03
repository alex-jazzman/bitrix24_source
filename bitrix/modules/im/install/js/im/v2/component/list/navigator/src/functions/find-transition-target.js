import {
	collectCollabTransitionCandidates,
	selectCollabTransitionTarget,
	type CollabTransitionCandidate,
} from 'im.v2.lib.collab';
import { Utils } from 'im.v2.lib.utils';

export const findCollabTransitionTarget = (parentDialogId: string): ?CollabTransitionCandidate => {
	if (!Utils.dialog.isChatDialogId(parentDialogId))
	{
		return null;
	}

	const parentChatId = Utils.dialog.getChatIdFromDialogId(parentDialogId);

	return selectCollabTransitionTarget(collectCollabTransitionCandidates(parentChatId));
};
