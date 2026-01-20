import { PULL } from 'pull.client';
import type { Block, Connection } from '../../../shared/types';

type AiDraftPushData = {
	templateId: number,
	draftId: number,
	blocks: Array<Block>,
	connections: Array<Connection>,
};

export function initAiUpdatePull(callback: (params: {
	blocks: Array<Block>,
	connections: Array<Connection>,
	templateId: number,
	draftId: number,
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
