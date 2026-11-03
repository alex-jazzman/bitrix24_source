/**
 * @module mail/message/tools/screen-params
 */
jn.define('mail/message/tools/screen-params', (require, exports, module) => {
	const { getChainPromise } = require('mail/message/tools/connector');

	/**
	 * Reads what the message screen was opened with.
	 *
	 * The signed pass is the whole of the caller's access when the screen is reached from a task
	 * card, so it is read as it was given: any normalising of an opaque value reads to the server
	 * as no access at all.
	 *
	 * @param {object} componentParameters
	 * @return {MessageScreenParams}
	 */
	const readMessageScreenParams = (componentParameters) => ({
		threadId: componentParameters.get('threadId', null),
		isCrmMessage: Number(componentParameters.get('isCrmMessage', 1)),
		folder: String(componentParameters.get('folder', 'default')),
		source: String(componentParameters.get('source', 'mail')),
		startEmailSender: componentParameters.get('startEmailSender', null),
		act: String(componentParameters.get('act', '')),
		mailUfMessageToken: String(componentParameters.get('mailUfMessageToken', '')),
	});

	/**
	 * @param {MessageScreenParams} params
	 * @param {MessageThemeRequestParams} [themeRequestParams] Appearance to prepare the bodies for; see
	 *     `mail/message/theme-request`. An empty object leaves the bodies as they are stored.
	 * @return {Promise}
	 */
	const requestMessageChain = (params, themeRequestParams = {}) => getChainPromise(
		params.threadId,
		params.isCrmMessage,
		params.act,
		params.mailUfMessageToken,
		themeRequestParams,
	);

	/**
	 * The pass has to reach the chain screen as well: every request the screen makes afterwards
	 * carries it, and without it the thread stops at the letter the link pointed to.
	 *
	 * @param {MessageScreenParams} params
	 * @param {object} chain Response payload of the chain request.
	 * @param {object} widget
	 * @return {object}
	 */
	const buildMessageChainParams = (params, chain, widget) => {
		const chainParams = {
			isCrmMessage: params.isCrmMessage,
			threadId: params.threadId,
			chain,
			widget,
			source: params.isCrmMessage ? 'crm' : params.source,
			readOnly: chain?.properties?.readOnly === true,
			act: params.act,
			mailUfMessageToken: params.mailUfMessageToken,
		};

		if (params.startEmailSender)
		{
			chainParams.startEmailSender = params.startEmailSender;
		}

		return chainParams;
	};

	module.exports = {
		buildMessageChainParams,
		readMessageScreenParams,
		requestMessageChain,
	};
});
