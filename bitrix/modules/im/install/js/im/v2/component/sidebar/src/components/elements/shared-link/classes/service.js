import { Core } from 'im.v2.application.core';
import { RestMethod } from 'im.v2.const';
import { runAction } from 'im.v2.lib.rest';

import type { ImModelSidebarSharedLinkItem } from 'im.v2.model';

export class SharedLinkService
{
	async regenerate(code: string): Promise<ImModelSidebarSharedLinkItem>
	{
		try
		{
			const { sharingLink }: { sharingLink: ImModelSidebarSharedLinkItem } = await runAction(
				RestMethod.imV2ChatSharedLinkRegenerateIndividual,
				{ data: { code } },
			);

			void Core.getStore().dispatch('sidebar/sharedLink/regenerate', {
				newLink: sharingLink,
			});

			return sharingLink;
		}
		catch (error)
		{
			console.error('SharedLinkService: regenerate error', error);
			throw error;
		}
	}
}
