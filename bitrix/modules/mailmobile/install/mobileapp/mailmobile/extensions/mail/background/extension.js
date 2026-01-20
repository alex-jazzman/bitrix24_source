(() => {
	class MailBackground
	{
		constructor()
		{
			this.bindEvents();
		}

		bindEvents()
		{
			BX.addCustomEvent('mailbackground::router', (threadId = 0, mailboxId = 0) => {

				const numMailboxId = Number(mailboxId);

				if (numMailboxId === 0)
				{
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
				}
				else
				{
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
				}
			});
		}
	}

	this.MailBackground = new MailBackground();
})();
