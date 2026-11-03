import { PULL } from 'pull.client';
import type { Block, Connection } from '../../../shared/types';

// draftRevision is zero when the arrived draft is no longer the freshest one of the template:
// the server has nothing to confirm for it.
type AiDraftPushData = {
	templateId: number,
	draftId: number,
	draftRevision: number,
	blocks: Array<Block>,
	connections: Array<Connection>,
};

export function initAiUpdatePull(callback: (params: {
	blocks: Array<Block>,
	connections: Array<Connection>,
	templateId: number,
	draftId: number,
	draftRevision: number,
}) => void): void
{
	PULL.subscribe({
		moduleId: 'bizprocdesigner',
		command: 'bizprocdesigner_ai_draft_updated',
		callback: async (pushData: AiDraftPushData): Promise<void> => {
			callback(pushData);
		},
	});
}
