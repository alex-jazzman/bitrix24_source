/**
 * @module intranet/intranet-background
 */
jn.define('intranet/intranet-background', (require, exports, module) => {
	const { isModuleInstalled } = require('module');
	const { Qualification } = require('intranet/qualification');
	const { UserMiniProfile } = require('intranet/user-mini-profile');

	class IntranetBackground
	{
		static async init()
		{
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
