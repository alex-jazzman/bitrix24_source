/**
 * @module im/messenger/controller/dialog/lib/onboarding
 */
jn.define('im/messenger/controller/dialog/lib/onboarding', (require, exports, module) => {
	const { ActionBase } = require('onboarding/action');
	const { BadgeCode, Preset } = require('onboarding/const');
	const { Case } = require('onboarding/case');
	const { Loc } = require('loc');
	const { OnboardingBase } = require('onboarding');

	const { CaseName } = require('im/messenger/controller/dialog/lib/onboarding/src/const');
	const { Condition } = require('im/messenger/controller/dialog/lib/onboarding/src/condition');

	class Onboarding extends OnboardingBase
	{
		static getCases()
		{
			return [
				new Case({
					id: CaseName.ON_ONE_TO_ONE_CHAT_VIEW,
					presets: [Preset.MESSENGER],
					activeTab: BadgeCode.ANY,
					conditions: [
						Condition.isAttachmentButtonEnabled(),
						Condition.isOnboardingInChatSupported(),
						Condition.isDirectChat(),
						Condition.not(Condition.isChatWithBot()),
						Condition.hasMessagesAtLeast(10),
					],
					action: (ctx, onComplete) => ActionBase.showHint({
						title: Loc.getMessage('M_ONBOARDING_CREATE_MEETINGS_FROM_CLIP_TITLE'),
						description: Loc.getMessage('M_ONBOARDING_CREATE_MEETINGS_FROM_CLIP_DESCRIPTION'),
						delay: 300,
						targetRef: 'attachButton',
						spotlightParams: {
							pointerMargin: 10,
						},
						onComplete,
					}),
				}),
				new Case({
					id: CaseName.ON_GROUP_CHAT_VIEW,
					presets: [Preset.MESSENGER],
					activeTab: BadgeCode.ANY,
					conditions: [
						Condition.isAttachmentButtonEnabled(),
						Condition.isOnboardingInChatSupported(),
						Condition.isGroupChat(),
						Condition.canCreateVote(),
						Condition.hasParticipantsMoreThan(3),
						Condition.hasMessagesAtLeast(10),
					],
					action: (ctx, onComplete) => ActionBase.showHint({
						title: Loc.getMessage('M_ONBOARDING_CREATE_VOTE_FROM_CLIP_TITLE'),
						description: Loc.getMessage('M_ONBOARDING_CREATE_VOTE_FROM_CLIP_DESCRIPTION'),
						delay: 300,
						targetRef: 'attachButton',
						spotlightParams: {
							pointerMargin: 10,
						},
						onComplete,
					}),
				}),
				new Case({
					id: CaseName.ON_FILES_APPEARS_IN_CHAT,
					presets: [Preset.MESSENGER],
					activeTab: BadgeCode.ANY,
					conditions: [
						Condition.isOnboardingInChatSupported(),
						Condition.any([
							Condition.isDirectChat(),
							Condition.isGroupChat(),
							Condition.isChannel(),
						]),
						Condition.not(Condition.isChatWithBot()),
						Condition.hasFilesAtLeast(4),
					],
					action: (ctx, onComplete) => ActionBase.showHint({
						title: Loc.getMessage('M_ONBOARDING_CHAT_SEARCH_TITLE'),
						description: Loc.getMessage('M_ONBOARDING_CHAT_SEARCH_DESCRIPTION'),
						targetRef: 'titlePanel',
						delay: 300,
						onComplete,
					}),
				}),
			];
		}
	}

	module.exports = {
		CaseName,
		Onboarding,
	};
});
