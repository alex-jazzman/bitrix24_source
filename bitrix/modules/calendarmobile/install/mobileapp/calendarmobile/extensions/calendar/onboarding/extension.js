/**
 * @module calendar/onboarding
 */
jn.define('calendar/onboarding', (require, exports, module) => {
	const { ActionBase } = require('onboarding/action');
	const { BadgeCode, Preset } = require('onboarding/const');
	const { Case } = require('onboarding/case');
	const { Loc } = require('loc');
	const { OnboardingBase } = require('onboarding');

	const { Condition } = require('calendar/onboarding/src/condition');
	const { CaseName } = require('calendar/onboarding/src/const');

	class Onboarding extends OnboardingBase
	{
		static getCases()
		{
			return [
				new Case({
					id: CaseName.ON_MORE_THAN_THREE_CALENDAR_EVENTS,
					presets: [Preset.MESSENGER],
					activeTab: BadgeCode.CALENDAR,
					conditions: [
						async (context) => {
							const hasSync = Condition.hasSync()(context);

							return !hasSync;
						},
						Condition.hasCalendarEventsAtLeast(3),
					],
					action: (context, onComplete) => ActionBase.showHint({
						title: Loc.getMessage('M_CALENDAR_ONBOARDING_MORE_THAN_THREE_EVENTS_TITLE_MSGVER_1'),
						description: Loc.getMessage('M_CALENDAR_ONBOARDING_MORE_THAN_THREE_EVENTS_DESCRIPTION'),
						targetRef: 'calendar-more',
						onHide: () => {
							onComplete();
						},
					}),
				}),
				new Case({
					id: CaseName.ON_CALENDAR_NEW_MENU,
					presets: [Preset.ANY],
					activeTab: BadgeCode.ANY,
					conditions: [Condition.shouldShowNewMenuHint()],
					shouldSkipLimitCheck: true,
					action: (context, onComplete) => ActionBase.showHint({
						fadeInDuration: 300,
						title: Loc.getMessage('M_CALENDAR_AHA_NEW_MENU_TITLE'),
						description: Loc.getMessage('M_CALENDAR_AHA_NEW_MENU_DESC'),
						targetRef: 'calendar-more',
						testId: 'calendar-aha-moment-new-menu',
						delay: 500,
						onHide: () => {
							onComplete();
						},
					}),
				}),
				new Case({
					id: CaseName.ON_CALENDAR_SYNC_ERROR,
					presets: [Preset.ANY],
					activeTab: BadgeCode.ANY,
					conditions: [Condition.shouldShowSyncErrorHint()],
					shouldSkipLimitCheck: true,
					action: (context, onComplete) => ActionBase.showHint({
						fadeInDuration: 300,
						title: Loc.getMessage('M_CALENDAR_AHA_SYNC_ERROR_TITLE'),
						description: Loc.getMessage('M_CALENDAR_AHA_SYNC_ERROR_DESC'),
						targetRef: 'calendar-more',
						testId: 'calendar-aha-moment-sync-error',
						delay: 500,
						onHide: () => {
							context?.onHideAhaMoment?.();
							onComplete();
						},
					}),
				}),
			];
		}
	}

	module.exports = {
		Onboarding,
		CaseName,
	};
});
