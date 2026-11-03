/**
 * @module timeman/work-reports/actions/src/discuss-chat
 */
jn.define('timeman/work-reports/actions/src/discuss-chat', (require, exports, module) => {
	const { DialogOpener } = require('im/messenger/api/dialog-opener');
	const { WorkReportsApi } = require('timeman/work-reports/api');

	const api = new WorkReportsApi();

	/**
	 * @param {OpenDiscussChatParams} params
	 */
	async function openDiscussChat({ reportId })
	{
		const { dialogId } = await api.discussReport(reportId);

		if (!dialogId)
		{
			throw new Error('Discuss chat is unavailable');
		}

		await DialogOpener.open({ dialogId });
	}

	module.exports = {
		openDiscussChat,
	};
});
