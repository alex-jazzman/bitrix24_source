import { Type } from 'main.core';
import { QueueManager } from 'pull.queuemanager';
import 'pull.client';

import { type PullClient } from 'pull.client';
import { type CallScoringPullData } from './types';

const CALL_SCORING_ADD_COMMAND = 'call_scoring_add';

export class Pull
{
	private unsubscribeFromCallScoring: null | Function = null;

	public constructor(callScoringCallback: (params: CallScoringPullData) => void)
	{
		const pullClient: PullClient = (BX as any).PULL;
		if (!pullClient)
		{
			console.error('pull is not initialized');

			return;
		}

		this.unsubscribeFromCallScoring = pullClient.subscribe({
			moduleId: 'crm',
			command: CALL_SCORING_ADD_COMMAND,
			callback: (params: CallScoringPullData) => {
				if (Type.isStringFilled(params.eventId) && QueueManager.eventIds.has(params.eventId))
				{
					return;
				}

				callScoringCallback(params);
			},
		});

		pullClient.extendWatch(CALL_SCORING_ADD_COMMAND);
	}

	public unsubscribe(): void
	{
		this.unsubscribeFromCallScoring?.();
		this.unsubscribeFromCallScoring = null;
	}
}
