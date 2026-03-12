/**
 * @module im/messenger/assets/copilot
 */
jn.define('im/messenger/assets/copilot', (require, exports, module) => {
	class CopilotAsset
	{
		static get errorSvgUrl()
		{
			return `${currentDomain}/bitrix/mobileapp/immobile/extensions/im/messenger/assets/copilot/svg/error.svg`;
		}

		static get mentionSvgUrl()
		{
			return `${currentDomain}/bitrix/mobileapp/immobile/extensions/im/messenger/assets/copilot/svg/mention.svg`;
		}

		static get mentionPngUrl()
		{
			return `${currentDomain}/bitrix/mobileapp/immobile/extensions/im/messenger/assets/copilot/png/mention.png`;
		}
	}

	module.exports = { CopilotAsset };
});
