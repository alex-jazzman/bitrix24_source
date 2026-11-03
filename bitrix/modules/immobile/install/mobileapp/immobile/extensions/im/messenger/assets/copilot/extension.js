/**
 * @module im/messenger/assets/copilot
 */
jn.define('im/messenger/assets/copilot', (require, exports, module) => {
	const { makeLibraryImagePath } = require('im/messenger/assets');

	class CopilotAsset
	{
		static get errorSvgUrl()
		{
			return `${currentDomain}/bitrix/mobileapp/immobile/extensions/im/messenger/assets/copilot/svg/error.svg`;
		}

		/**
		 * @desc The native Avatar ignores backColor, so the background is baked into the image.
		 * The path must be built on every call: it depends on the current theme.
		 * @return {string}
		 */
		static get starPngUrl()
		{
			return makeLibraryImagePath('star-v2.png', 'copilot/png');
		}

		static get mentionPngUrl()
		{
			return `${currentDomain}/bitrix/mobileapp/immobile/extensions/im/messenger/assets/copilot/png/mention.png`;
		}
	}

	module.exports = { CopilotAsset };
});
