import { Runtime, Type } from 'main.core';

import { Core } from 'im.v2.application.core';
import { Layout } from 'im.v2.const';
import { LayoutManager } from 'im.v2.lib.layout';
import { type ImModelChat } from 'im.v2.model';

export type FeatureMenuInstance = {
	showFeatures: () => Promise<void>,
};

export async function createFeatureMenu(bindElement: HTMLElement, parentChatId: number): Promise<FeatureMenuInstance>
{
	const { FeatureMenu } = await Runtime.loadExtension('socialnetwork.feature-menu');

	const { entityLink, dialogId }: ImModelChat = Core.getStore().getters['chats/getByChatId'](parentChatId, true);

	const onOpenStartupToolSettings = async (): Promise<void> => {
		const { ProjectWizard } = await Runtime.loadExtension('socialnetwork.v2.application.project-wizard');
		if (Type.isFunction(ProjectWizard?.requestStartupToolScroll))
		{
			ProjectWizard.requestStartupToolScroll();
		}

		void LayoutManager.getInstance().setLayout({ name: Layout.updateChat, entityId: dialogId });
	};

	return new FeatureMenu({
		projectId: entityLink.id,
		bindElement,
		onOpenStartupToolSettings,
	});
}
