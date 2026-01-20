/**
 * @module intranet/invite-opener-new/src/component-opener
 */
jn.define('intranet/invite-opener-new/src/component-opener', (require, exports, module) => {
	const { AnalyticsEvent } = require('analytics');
	const { Invite } = require('intranet/invite-new');
	const { IntranetInviteAnalytics } = require('intranet/invite-new');

	class InviteComponent
	{
		static open(props = {})
		{
			const {
				layout,
				analyticsSection,
				onInviteSentHandler,
				onInviteError,
				canInviteBySMS,
				canInviteByLink,
				canInviteByEmail,
				creatorEmailConfirmed,
				multipleInvite,
				adminConfirm,
				isBitrix24Included,
				isInviteWithLocalEmailAppEnabled,
			} = props;

			const analytics = new AnalyticsEvent()?.setSection(analyticsSection);
			const inviteAnalytics = new IntranetInviteAnalytics({ analytics });
			inviteAnalytics.sendDrawerOpenEvent();
			inviteAnalytics.setDepartmentParam(false);

			return new Invite({
				layout,
				analytics: inviteAnalytics,
				onInviteSentHandler: (users) => {
					if (onInviteSentHandler)
					{
						onInviteSentHandler(users);
					}
				},
				onInviteError: (errors) => {
					if (onInviteError)
					{
						onInviteError(errors);
					}
				},
				canInviteBySMS,
				canInviteByLink,
				canInviteByEmail,
				creatorEmailConfirmed,
				multipleInvite,
				adminConfirm,
				isBitrix24Included,
				isInviteWithLocalEmailAppEnabled,
			});
		}
	}

	module.exports = {
		InviteComponent,
	};
});
