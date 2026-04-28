import { ChatService } from 'im.v2.provider.service.chat';

import { LoadServiceOl } from './classes/load';

export class ChatServiceOl extends ChatService
{
	createLoadService(): LoadServiceOl
	{
		return new LoadServiceOl();
	}
}
