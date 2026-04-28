/**
 * @module im/messenger/application/lib/dialog-manager/integration-settings
 */
jn.define('im/messenger/application/lib/dialog-manager/integration-settings', (require, exports, module) => {
	const { mergeImmutable } = require('utils/object');

	/**
	 * @param {ChatIntegrationSettings} [integrationSettings]
	 * @return {ChatIntegrationSettings}
	 */
	function createCommentChatIntegrationSettings(integrationSettings = {})
	{
		const baseSettings = {
			header: {
				title: {
					controller: {
						extensionName: 'im:messenger/controller/dialog/lib/header/title/comments',
						className: 'CommentsHeaderTitle',
					},
				},
			},
		};

		return mergeImmutable(baseSettings, integrationSettings);
	}

	module.exports = { createCommentChatIntegrationSettings };
});
