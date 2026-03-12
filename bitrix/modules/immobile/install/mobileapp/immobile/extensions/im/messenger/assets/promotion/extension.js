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

		static get videoNoteUrl()
		{
			return `${currentDomain}/bitrix/mobileapp/immobile/extensions/im/messenger/assets/promotion/png/video-note.png`;
		}

		static get recentTasksUrl()
		{
			return `${currentDomain}/bitrix/mobileapp/immobile/extensions/im/messenger/assets/promotion/png/tasks-recent-tab.png`;
		}
	}

	module.exports = { PromotionAsset };
});
