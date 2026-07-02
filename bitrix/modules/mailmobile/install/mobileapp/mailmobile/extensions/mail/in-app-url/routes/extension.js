/**
 * @module mail/in-app-url/routes
 */
jn.define('mail/in-app-url/routes', (require, exports, module) => {
	const { Loc } = require('loc');

	/**
	 * @param {InAppUrl} inAppUrl
	 */
	module.exports = (inAppUrl) => {
		inAppUrl.register('/mail/message/:threadId(\\?source=:source)?$', eventOpenMessageHandler)
			.name('mail:message:open');
		inAppUrl.register('/mail/list/:threadId', eventOpenMailboxHandler)
			.name('mail:mailbox:open');
		inAppUrl.register('/mail/mailbox-list\\?CONNECTION_REQUESTS=Y', eventOpenConnectionRequestsHandler)
			.name('mail:connectionRequests:open');
	};

	const eventOpenMessageHandler = ({ threadId, source }) => {
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
				source: source ?? 'mail',
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
