(() => {
	const require = (ext) => jn.require(ext);

	const { inAppUrl } = require('in-app-url');
	const { OpenDialogContextType } = require('im/messenger/const');
	const { DialogOpener } = require('im/messenger/api/dialog-opener');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');

	const logger = getLoggerWithContext('im-in-app-url-background', 'GuestDeeplinkRoute');

	/**
	 * Guest invite deep-link handler.
	 *
	 * Triggered by `universalLinkReceived` in the background JSComponent for URLs like
	 * `http(s)://{portal}/guest/{code}?IM_DIALOG=chat{id}`. Without this route, InAppUrl
	 * falls back to `PageManager.openPage`, which surfaces a web page on top of the app.
	 *
	 * @param {object} _ Path params — unused; `:code` is delivered as part of the URL.
	 * @param {{ queryParams: Record<string, string>, url: string }} ctx
	 */
	inAppUrl.register('/guest/:code', (_, { queryParams = {}, url = '' }) => {
		const dialogId = queryParams.IM_DIALOG;
		if (!dialogId)
		{
			logger.warn('skip: no IM_DIALOG in query', url);

			return;
		}

		/** @type {DialogOpenOptions} */
		const options = { dialogId, context: OpenDialogContextType.link };
		DialogOpener.open(options).catch((error) => {
			logger.error('DialogOpener.open failed', error);
		});
	}).name('im:guest:openDialog');
})();
