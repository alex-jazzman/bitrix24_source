(() => {
	const require = (ext) => jn.require(ext);
	const { MessageGrid } = require('mail/message-grid');
	const { MailDialog } = require('mail/dialog');
	const { MigrationAnnouncement } = require('mail/dialog/banners/announcement');
	const { AjaxMethod } = require('mail/const');
	const { AnalyticsEvent } = require('analytics');
	const { PerfPoint } = require('debug/prism');

	/**
	 * ANN-1. The announcement is drawn over the section once the section is there, and never before it.
	 *
	 * @param {MigrationNoticeDecision|null} decision
	 */
	const showAnnouncement = (decision) => {
		if (decision === null)
		{
			return;
		}

		MailDialog.show({
			type: MailDialog.MIGRATION_ANNOUNCEMENT,
			decision,
			parentWidget: layout,
		});
	};

	BX.onViewLoaded(() => {
		const mailboxId = BX.componentParameters.get('mailboxId', 0);

		/*
			ANN-1. The decision of the portal surface is asked for on the way in, before the list of
			letters is mounted and asks for a decision of its own: the server writes the announcement
			down the moment it hands it out and answers every request of the same sitting with nothing
			afterwards, so the list puts no second fullscreen message on top of this one.

			Asking for it is all the way in does with it. What the screen of the letters waits for is the
			mailboxes and nothing else: an announcement that is slow, or never answered at all, then
			costs a person the one message they were owed and not the time it takes their mail to open -
			and on a portal where the feature is switched off, or beside a mail module that knows nothing
			of it, there is no message owed in the first place.
		*/
		const announcementPoint = new PerfPoint('Mail Migration Announcement', 'onViewLoaded').start();
		announcementPoint.startPoint('Decision');
		const announcementDue = MigrationAnnouncement.resolve()
			.then((announcement) => {
				announcementPoint.endPoint('Decision', { code: announcement?.code ?? 'none' });
				announcementPoint.end();

				return announcement;
			})
			.catch(() => {
				announcementPoint.endPoint('Decision');
				announcementPoint.end();

				return null;
			})
		;

		// what the person waits for on the way in, and the answer they wait for inside it
		const enterPoint = new PerfPoint('Mail Section Enter', 'onViewLoaded').start();
		enterPoint.startPoint('Available Mailboxes');

		return BX.ajax.runAction(AjaxMethod.mailGetAvailableMailboxes, {
			data: {},
		}).then(({ data }) => {
			enterPoint.endPoint('Available Mailboxes', { mailboxCount: data.length });

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

			enterPoint.end();
		}).catch((error) => {
			enterPoint.endPoint('Available Mailboxes');
			enterPoint.end();

			throw error;
		})
			// A portal without a single connected mailbox gets the announcement too (AC-001), and a
			// section that never opened gets none: the rejection above skips what follows it
			.then(() => announcementDue)
			.then(showAnnouncement)
		;
	});
})();
