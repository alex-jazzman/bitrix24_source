/**
 * @module bitrix-gpt-onboarding/utils
 */
jn.define('bitrix-gpt-onboarding/utils', (require, exports, module) => {
	/**
	 * @param {string} dialogId
	 * @returns {Promise<void>}
	 */
	async function openChat(dialogId)
	{
		if (!dialogId)
		{
			return;
		}

		// eslint-disable-next-line no-undef
		const { DialogOpener } = await requireLazy('im:messenger/api/dialog-opener', false);
		await DialogOpener.open({ dialogId });
	}

	module.exports = {
		openChat,
	};
});
