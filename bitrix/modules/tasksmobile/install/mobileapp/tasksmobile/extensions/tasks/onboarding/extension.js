/**
 * @module tasks/onboarding
 */
jn.define('tasks/onboarding', (require, exports, module) => {
	const { ActionBase } = require('onboarding/action');
	const { BadgeCode, Preset } = require('onboarding/const');
	const { Case } = require('onboarding/case');
	const { ConditionBase } = require('onboarding/condition');
	const { Loc } = require('loc');
	const { OnboardingBase } = require('onboarding');

	const { CaseName } = require('tasks/onboarding/src/const');
	const { Condition } = require('tasks/onboarding/src/condition');

	class Onboarding extends OnboardingBase
	{
		static getCases()
		{
			return [
				new Case({
					id: CaseName.ON_EMPTY_TASK_LIST,
					presets: [Preset.TASKS],
					activeTab: BadgeCode.TASKS,
					conditions: [Condition.isEmptyTaskList(), ConditionBase.hasAppVisitsAtLeast(2)],
					action: async (context, onComplete) => {
						if (context?.onShow)
						{
							await context.onShow(context, onComplete);
						}
					},
				}),
				new Case({
					id: CaseName.MORE_THAN_THREE_TASKS,
					presets: [Preset.ANY],
					activeTab: BadgeCode.TASKS,
					conditions: [Condition.hasTasksMoreThan(3)],
					action: (context, onComplete) => ActionBase.showHint({
						title: Loc.getMessage('M_ONBOARDING_MORE_THAN_THREE_TASKS_TITLE'),
						description: Loc.getMessage('M_ONBOARDING_MORE_THAN_THREE_TASKS_DESCRIPTION'),
						targetRef: 'tasks_button_more',
						onComplete,
						delay: 300,
					}),
				}),
				new Case({
					id: CaseName.MORE_THAN_SIX_TASKS,
					presets: [Preset.ANY],
					activeTab: BadgeCode.TASKS,
					conditions: [Condition.hasTasksMoreThan(6)],
					shouldSkipUIQueue: true,
					action: (context, onComplete) => ActionBase.showHint({
						title: Loc.getMessage('M_ONBOARDING_MORE_THAN_FIVE_TASKS_TITLE'),
						description: Loc.getMessage('M_ONBOARDING_MORE_THAN_FIVE_TASKS_DESCRIPTION'),
						targetRef: 'tasks_search',
						onComplete,
						delay: 300,
					}),
				}),
				new Case({
					id: CaseName.UNREAD_TASKS_COUNTERS,
					presets: [Preset.ANY],
					activeTab: BadgeCode.TASKS,
					conditions: [],
					action: (context, onComplete) => ActionBase.showHint({
						title: Loc.getMessage('M_ONBOARDING_UNREAD_TASKS_COUNTERS_TITLE'),
						description: Loc.getMessage('M_ONBOARDING_UNREAD_TASKS_COUNTERS_DESCRIPTION'),
						targetRef: context.targetRef,
						onComplete,
						delay: 300,
					}),
				}),
				new Case({
					id: CaseName.SUPPOSEDLY_COMPLETED_TASKS,
					presets: [Preset.ANY],
					activeTab: BadgeCode.TASKS,
					conditions: [],
					action: async (context, onComplete) => {
						if (context?.onShow)
						{
							await context.onShow(context, onComplete);
						}
					},
				}),
			];
		}
	}

	module.exports = {
		CaseName,
		Onboarding,
	};
});
