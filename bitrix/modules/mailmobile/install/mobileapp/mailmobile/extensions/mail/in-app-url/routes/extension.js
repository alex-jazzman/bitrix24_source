/**
 * @module mail/in-app-url/routes
 */
jn.define('mail/in-app-url/routes', (require, exports, module) => {
	const { Loc } = require('loc');

	/**
	 * @param {InAppUrl} inAppUrl
	 */
	module.exports = (inAppUrl) => {
		inAppUrl
			// the pattern is matched, not anchored at the front: an end of its own is what keeps the
			// route off every link that merely carries a message of the mail inside it. The query is
			// left uncaptured - params are mapped to capture groups by position, and the screen reads
			// the query of the url itself
			.addRoute('/mail/message/:threadId(?:\\?.*)?$')
			.handler(eventOpenMessageHandler)
			.name('mail:message:open');
		inAppUrl.register('/mail/list/:mailboxId', eventOpenMailboxHandler)
			.name('mail:mailbox:open');
		inAppUrl.register('/mail/mailbox-list\\?CONNECTION_REQUESTS=Y', eventOpenConnectionRequestsHandler)
			.name('mail:connectionRequests:open');
	};

	const eventOpenMessageHandler = ({ threadId }, { queryParams = {} } = {}) => {
		ComponentHelper.openLayout({
			canOpenInDefault: true,
			name: 'mail:mail.message.view',
			object: 'layout',
			widgetParams: {
				title: '',
			},
			componentParams: {
				isCrmMessage: 0,
				threadId,
				source: queryParams.source ?? 'mail',
				mailUfMessageToken: queryParams.mail_uf_message_token ?? '',
			},
		});
	};

	const eventOpenMailboxHandler = ({ mailboxId }) => {
		ComponentHelper.openLayout({
			canOpenInDefault: true,
			name: 'mail:mail.message.grid',
			object: 'layout',
			widgetParams: {
				title: '',
			},
			componentParams: {
				mailboxId,
			},
		});
	};

	const eventOpenConnectionRequestsHandler = async (_, { url }) => {
		try
		{
			const { qrauth } = await requireLazy('qrauth/utils');

			qrauth.open({
				title: Loc.getMessage('MAIL_IN_APP_URL_CONNECTION_REQUESTS_QRAUTH_TITLE'),
				hintText: Loc.getMessage('MAIL_IN_APP_URL_CONNECTION_REQUESTS_QRAUTH_HINT'),
				redirectUrl: url,
				showHint: true,
			});
		}
		catch (error)
		{
			console.error('mail:connectionRequests:open error', error);
		}
	};
});
