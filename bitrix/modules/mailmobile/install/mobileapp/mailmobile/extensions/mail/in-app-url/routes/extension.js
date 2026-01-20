/**
 * @module mail/in-app-url/routes
 */
jn.define('mail/in-app-url/routes', (require, exports, module) => {

	/**
	 * @param {InAppUrl} inAppUrl
	 */
	module.exports = (inAppUrl) => {
		inAppUrl.register('/mail/message/:threadId', eventOpenMessageHandler)
			.name('mail:message:open');
		inAppUrl.register('/mail/list/:threadId', eventOpenMailboxHandler)
			.name('mail:mailbox:open');
	};

	const eventOpenMessageHandler = ({ threadId }) => {
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
});
