/**
 * @module im/messenger/assets/copilot
 */
jn.define('im/messenger/assets/copilot', (require, exports, module) => {
	const { Feature } = require('im/messenger/lib/feature');

	class CopilotAsset
	{
		static get errorSvgUrl()
		{
			return `${currentDomain}/bitrix/mobileapp/immobile/extensions/im/messenger/assets/copilot/svg/error.svg`;
		}

		static get mentionPngUrl()
		{
			if (Feature.isBitrixGptV2Available)
			{
				return `${currentDomain}/bitrix/mobileapp/immobile/extensions/im/messenger/assets/copilot/png/mention-v2.png`;
			}

			return `${currentDomain}/bitrix/mobileapp/immobile/extensions/im/messenger/assets/copilot/png/mention.png`;
		}
	}

	module.exports = { CopilotAsset };
});
