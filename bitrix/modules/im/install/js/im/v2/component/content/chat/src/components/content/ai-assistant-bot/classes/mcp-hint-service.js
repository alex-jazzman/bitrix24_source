import { Logger } from 'im.v2.lib.logger';
import { runAction, type RunActionError } from 'im.v2.lib.rest';
import { RestMethod } from 'im.v2.const';

export class McpHintService
{
	sendSelectionHintOnce(authId: number): Promise<void>
	{
		Logger.warn('McpHintService: sendSelectionHintOnce:', authId);

		const payload = {
			data: {
				authId,
			},
		};

		return runAction(RestMethod.imV2McpSendSelectionHintOnce, payload)
			.catch((errors: RunActionError[]) => {
				const [firstError] = errors;
				console.error('McpHintService: sendSelectionHintOnce error:', errors);

				throw firstError;
			});
	}
}