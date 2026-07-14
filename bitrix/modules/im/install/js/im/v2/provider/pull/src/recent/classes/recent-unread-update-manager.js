import { Core } from 'im.v2.application.core';
import { type RecentTypeItem } from 'im.v2.const';
import { type ImModelRecentItem } from 'im.v2.model';

import { RecentUpdateManager } from './recent-update-manager';

export class RecentUnreadUpdateManager extends RecentUpdateManager
{
	addItemToCollection(sections: RecentTypeItem[], recentItem: ImModelRecentItem, parentChatId: number)
	{
		sections.forEach((recentSection) => {
			void Core.getStore().dispatch('recent/setUnreadCollection', {
				type: recentSection,
				items: [recentItem],
				parentChatId,
			});
		});
	}
}
