/**
 * @module im/messenger/assets/promotion
 */
jn.define('im/messenger/assets/promotion', (require, exports, module) => {
	class PromotionAsset
	{
		static get copilotInDefaultTabUrl()
		{
			return `${currentDomain}/bitrix/mobileapp/immobile/extensions/im/messenger/assets/promotion/svg/copilot-in-default-tab.svg`;
		}

		static get recentTasksUrl()
		{
			return `${currentDomain}/bitrix/mobileapp/immobile/extensions/im/messenger/assets/promotion/png/tasks-recent-tab.png`;
		}

		static get folderAllOnboardingFolderUrl()
		{
			return `${currentDomain}/bitrix/mobileapp/immobile/extensions/im/messenger/assets/promotion/png/folder-all-onboarding-folder.png`;
		}

		static get folderAllOnboardingTasksUrl()
		{
			return `${currentDomain}/bitrix/mobileapp/immobile/extensions/im/messenger/assets/promotion/png/folder-all-onboarding-tasks.png`;
		}

		static get folderAllOnboardingSettingsUrl()
		{
			return `${currentDomain}/bitrix/mobileapp/immobile/extensions/im/messenger/assets/promotion/png/folder-all-onboarding-settings.png`;
		}
	}

	module.exports = { PromotionAsset };
});
