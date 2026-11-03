/**
 * @module layout/ui/banners/universal-promo/src/dismissal-storage
 */
jn.define('layout/ui/banners/universal-promo/src/dismissal-storage', (require, exports, module) => {
	const STORAGE_ID = 'more-menu-universal-promo-banner';
	const STORAGE_KEY = 'dismissedCampaignIds';
	const MAX_CAMPAIGN_IDS = 20;

	class DismissalStorage
	{
		constructor(application = Application)
		{
			this.storage = application.sharedStorage(STORAGE_ID);
		}

		getDismissedCampaignIds()
		{
			const storedValue = this.storage.get(STORAGE_KEY);
			if (typeof storedValue !== 'string' || storedValue.trim() === '')
			{
				return [];
			}

			try
			{
				const campaignIds = JSON.parse(storedValue);

				return this.#isValidCampaignIds(campaignIds) ? campaignIds : [];
			}
			catch
			{
				return [];
			}
		}

		isDismissed(campaignId)
		{
			return this.getDismissedCampaignIds().includes(campaignId);
		}

		dismiss(campaignId)
		{
			const campaignIds = this.getDismissedCampaignIds().filter((id) => id !== campaignId);
			const nextCampaignIds = [...campaignIds, campaignId].slice(-MAX_CAMPAIGN_IDS);
			const serializedCampaignIds = JSON.stringify(nextCampaignIds);

			this.storage.set(STORAGE_KEY, serializedCampaignIds);

			const savedCampaignIds = this.getDismissedCampaignIds();
			if (JSON.stringify(savedCampaignIds) !== serializedCampaignIds)
			{
				throw new Error('Dismissal storage verification failed');
			}

			return true;
		}

		#isValidCampaignIds(campaignIds)
		{
			return Array.isArray(campaignIds)
				&& campaignIds.length <= MAX_CAMPAIGN_IDS
				&& campaignIds.every((campaignId) => typeof campaignId === 'string' && campaignId.trim() !== '')
				&& new Set(campaignIds).size === campaignIds.length
			;
		}
	}

	module.exports = { DismissalStorage };
});
