import { Runtime } from 'main.core';

import { Core } from 'im.v2.application.core';
import { type ImModelChat } from 'im.v2.model';

export type FeatureMenuInstance = {
	showFeatures: () => Promise<void>,
};

export async function createFeatureMenu(bindElement: HTMLElement, parentChatId: number): Promise<FeatureMenuInstance>
{
	const { FeatureMenu } = await Runtime.loadExtension('socialnetwork.feature-menu');

	const { entityLink }: ImModelChat = Core.getStore().getters['chats/getByChatId'](parentChatId, true);

	return new FeatureMenu({
		projectId: entityLink.id,
		bindElement,
	});
}
