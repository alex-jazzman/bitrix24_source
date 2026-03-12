(() => {
	const require = (ext) => jn.require(ext);
	const { MessageGrid } = require('mail/message-grid');
	const { MailDialog } = require('mail/dialog');
	const { AjaxMethod } = require('mail/const');
	const { AnalyticsEvent } = require('analytics');

	BX.onViewLoaded(() => {
		const mailboxId = BX.componentParameters.get('mailboxId', 0);

		return BX.ajax.runAction(AjaxMethod.mailGetAvailableMailboxes, {
			data: {},
		}).then(({ data }) => {
			if (data.length === 0)
			{
				new AnalyticsEvent({
					tool: 'mail',
					category: 'mail_general_ops',
					event: 'mailbox_types_view',
					c_section: 'mail',
				}).send();

				MailDialog.show({
					type: MailDialog.CONNECTING_MAIL_TYPE,
					needsToCloseLayout: false,
					layoutWidget: layout,
					successCallback: () => {
						layout.showComponent(new MessageGrid({ layout }));
					},
				});
			}
			else
			{
				layout.showComponent(new MessageGrid({
					layout,
					mailboxes: data,
					mailboxId,
				}));
			}
		});
	});
})();
