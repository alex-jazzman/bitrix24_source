/**
 * @module bitrix-gpt-onboarding/api
 */
jn.define('bitrix-gpt-onboarding/api', (require, exports, module) => {
	const { RunActionExecutor } = require('rest/run-action-executor');

	const SHOULD_SHOW_CACHE_TTL = 12 * 60 * 60;

	// CopilotRoleType.copilotUniversalRole (im/messenger/const/copilot-role)
	const COPILOT_UNIVERSAL_ROLE = 'copilot_assistant';

	/**
	 * @returns {Promise<boolean>}
	 */
	function shouldShowBanner()
	{
		return new Promise((resolve, reject) => {
			const handle = (response) => {
				if (response?.status === 'success' && typeof response.data === 'boolean')
				{
					resolve(response.data);

					return;
				}

				reject(new Error('bitrix-gpt-onboarding: unexpected shouldShow response'));
			};

			void new RunActionExecutor('mobile.BitrixGptOnboarding.shouldShow')
				.enableJson()
				.setCacheId(`bitrixGpt.onboarding.shouldShow_${currentDomain}_${env.userId}`)
				.setCacheTtl(SHOULD_SHOW_CACHE_TTL)
				.setSkipRequestIfCacheExists()
				.setCacheHandler(handle)
				.setHandler(handle)
				.call(true);
		});
	}

	/**
	 * @returns {Promise<string>} dialogId of the created chat (e.g. "chat42")
	 */
	function createCopilotChat()
	{
		return new Promise((resolve, reject) => {
			void new RunActionExecutor('im.v2.Chat.add', {
				fields: {
					type: 'COPILOT',
					copilotMainRole: COPILOT_UNIVERSAL_ROLE,
				},
			})
				.setHandler((response) => {
					if (response?.status !== 'success')
					{
						reject(new Error('createCopilotChat: request failed'));

						return;
					}

					const data = response.data ?? {};
					const dialogId = data.dialogId ?? (data.chatId ? `chat${data.chatId}` : null);
					if (!dialogId)
					{
						reject(new Error('createCopilotChat: dialogId is missing'));

						return;
					}

					resolve(dialogId);
				})
				.call();
		});
	}

	module.exports = {
		shouldShowBanner,
		createCopilotChat,
	};
});
