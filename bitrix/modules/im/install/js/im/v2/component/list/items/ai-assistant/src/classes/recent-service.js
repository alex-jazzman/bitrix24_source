import { RestMethod } from 'im.v2.const';
import { BaseRecentService } from 'im.v2.provider.service.recent';

export class AiAssistantRecentService extends BaseRecentService
{
	getRestMethodName(): string
	{
		return RestMethod.imV2RecentAiAssistantTail;
	}

	getRecentSaveActionName(): string
	{
		return 'recent/setAiAssistant';
	}
}
