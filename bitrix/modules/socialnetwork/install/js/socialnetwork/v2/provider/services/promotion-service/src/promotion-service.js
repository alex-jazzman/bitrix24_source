import { ajax } from 'main.core';

export class PromotionService
{
	async setNewProjectsPopupViewed(): Promise<void>
	{
		try
		{
			await ajax.runAction('socialnetwork.promotion.setViewed', {
				data: { promotion: 'project_ai' },
			});
		}
		catch (error)
		{
			console.error(error);
		}
	}
}

export const promotionService = new PromotionService();
