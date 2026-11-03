/**
 * @module intranet/intranet-background
 */
jn.define('intranet/intranet-background', (require, exports, module) => {
	const { isModuleInstalled } = require('module');
	const { Qualification } = require('intranet/qualification');
	const { UserMiniProfile } = require('intranet/user-mini-profile');
	const { CoworkMeetupPromoUIManager } = require('intranet/cowork-meetup-promo/ui-manager');

	class IntranetBackground
	{
		static async init()
		{
			// asked first: the background queue opens a single window per app start
			CoworkMeetupPromoUIManager.openInBackgroundIfNeeded().catch(console.error);

			if (env.isAdmin && isModuleInstalled('bitrix24'))
			{
				const qualificationInstance = await Qualification.init().catch(console.error);
				if (qualificationInstance?.shouldShowQualification())
				{
					qualificationInstance.tryShowComponent();
				}
				else
				{
					void UserMiniProfile.tryShowComponent();
				}
			}
			else
			{
				void UserMiniProfile.tryShowComponent();
			}

			const { Onboarding, CaseName } = require('intranet/onboarding');
			void Onboarding.tryToShow(CaseName.IS_USER_ALONE);
		}
	}

	module.exports = {
		IntranetBackground,
	};
});
