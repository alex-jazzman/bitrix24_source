/**
 * @module intranet/onboarding
 */
jn.define('intranet/onboarding', (require, exports, module) => {
	const { BadgeCode, Preset } = require('onboarding/const');
	const { ConditionBase } = require('onboarding/condition');
	const { Case } = require('onboarding/case');
	const { OnboardingBase } = require('onboarding');

	const { Action } = require('intranet/onboarding/src/action');
	const { CaseName } = require('intranet/onboarding/src/const');

	class Onboarding extends OnboardingBase
	{
		static getCases()
		{
			return [
				new Case({
					id: CaseName.IS_USER_ALONE,
					presets: [Preset.ANY],
					activeTab: BadgeCode.ANY,
					conditions: [ConditionBase.hasAppVisitsAtLeast(3), ConditionBase.isUserAlone()],
					action: Action.openInviteBox(),
					shouldSkipActiveTabCheck: true,
				}),
			];
		}
	}

	module.exports = {
		CaseName,
		Onboarding,
	};
});
