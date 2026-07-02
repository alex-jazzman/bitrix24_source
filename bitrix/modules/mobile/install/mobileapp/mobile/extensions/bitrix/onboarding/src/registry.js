/**
 * @module onboarding/src/registry
 */
jn.define('onboarding/src/registry', (require, exports, module) => {
	const { ActionBase } = require('onboarding/action');
	const { BadgeCode, CaseName, Preset } = require('onboarding/const');
	const { Case } = require('onboarding/case');
	const { ConditionBase } = require('onboarding/condition');
	const { Loc } = require('loc');

	class CasesRegistry
	{
		static getAll()
		{
			return [
				new Case({
					id: CaseName.ON_PROFILE_SHOULD_BE_FILLED,
					presets: [Preset.ANY],
					activeTab: BadgeCode.ANY,
					conditions: [
						ConditionBase.isCurrentUserProfile(),
						ConditionBase.not(ConditionBase.isUserAlone()),
						ConditionBase.not(ConditionBase.profileRequiredFieldsFilledAtLeast(1)),
					],
					action: (context, onComplete) => ActionBase.showHint({
						title: context.title ?? Loc.getMessage('M_ONBOARDING_PROFILE_SHOULD_BE_FILLED_TITLE'),
						description: context.description ?? Loc.getMessage('M_ONBOARDING_PROFILE_SHOULD_BE_FILLED_DESCRIPTION'),
						targetRef: context.targetRef ?? 'profile-edit',
						delay: 200,
						spotlightParams: context.spotlightParams ?? null,
						onHide: () => {
							onComplete();
						},
					}),
				}),
			];
		}
	}

	module.exports = {
		CasesRegistry,
	};
});
