/**
 * @module crm/onboarding
 */
jn.define('crm/onboarding', (require, exports, module) => {
	const { ActionBase } = require('onboarding/action');
	const { BadgeCode, Preset } = require('onboarding/const');
	const { Case } = require('onboarding/case');
	const { CaseName } = require('crm/onboarding/src/const');
	const { Condition } = require('crm/onboarding/src/condition');
	const { ConditionBase } = require('onboarding/condition');
	const { Loc } = require('loc');
	const { OnboardingBase } = require('onboarding');
	const { TypeName, TypeId } = require('crm/type');

	class Onboarding extends OnboardingBase
	{
		static getCases()
		{
			return [
				new Case({
					id: CaseName.ON_NO_CRM_DEALS,
					presets: [Preset.CRM],
					activeTab: BadgeCode.CRM,
					conditions: [
						Condition.matchesOneOfEntityType([TypeName.Deal]),
						Condition.canImportEntity(),
						ConditionBase.hasAppVisitsAtLeast(3),
						ConditionBase.not(Condition.hasItemsQuantityAtLeast(1)),
					],
					action: (ctx) => {
						const { QRCodeAuthComponent } = require('qrauth');
						void QRCodeAuthComponent.open(ctx?.parentWidget, {
							showHint: true,
							hintText: Loc.getMessage('M_CRM_ONBOARDING_GO_TO_WEB_IMPORT_DESCRIPTION'),
							title: Loc.getMessage('M_CRM_ONBOARDING_GO_TO_WEB_IMPORT_TITLE'),
							redirectUrl: `${currentDomain}/crm/deal/import/`,
						});
					},
				}),
				new Case({
					id: CaseName.ON_ACTIVE_TAB_COUNTER,
					presets: [Preset.CRM],
					activeTab: BadgeCode.CRM,
					conditions: [
						Condition.matchesOneOfEntityType([TypeName.Deal]),
						Condition.hasItemsQuantityAtLeast(5),
						Condition.hasTabCountersAtLeast(1),
					],
					action: (ctx, onComplete) => ActionBase.showHint({
						title: Loc.getMessage('M_CRM_ONBOARDING_ON_ACTIVE_TAB_COUNTER_TITLE'),
						description: Loc.getMessage('M_CRM_ONBOARDING_ON_ACTIVE_TAB_COUNTER_DESCRIPTION'),
						targetRef: 'search',
						delay: 300,
						onComplete,
					}),
				}),
				new Case({
					id: CaseName.ON_DEALS_AT_DIFFERENT_STAGES,
					presets: [Preset.CRM],
					activeTab: BadgeCode.CRM,
					conditions: [
						Condition.matchesOneOfEntityType([TypeName.Deal]),
						Condition.hasActiveStagesAtLeast(2, TypeId.Deal),
					],
					action: (ctx, onComplete) => ActionBase.showHint({
						title: Loc.getMessage('M_CRM_ONBOARDING_ON_DEALS_AT_DIFFERENT_STAGES_TITLE'),
						description: Loc.getMessage('M_CRM_ONBOARDING_ON_DEALS_AT_DIFFERENT_STAGES_DESCRIPTION'),
						targetRef: ctx.targetRef ?? 'kanban_categories_selector',
						delay: 300,
						onComplete,
					}),
				}),
				new Case({
					id: CaseName.ON_MORE_THAN_TWO_TUNNELS,
					presets: [Preset.CRM],
					activeTab: BadgeCode.CRM,
					conditions: [
						Condition.matchesOneOfEntityType([TypeName.Deal]),
						Condition.hasCategoriesAtLeast(2),
					],
					action: (ctx, onComplete) => ActionBase.showHint({
						description: Loc.getMessage('M_CRM_ONBOARDING_ON_MORE_THAN_TWO_TUNNELS_DESCRIPTION'),
						targetRef: ctx.targetRef ?? 'kanban_categories_selector',
						delay: 300,
						onComplete,
					}),
				}),
				new Case({
					id: CaseName.ON_DEAL_CONTACT_FILLED,
					presets: [Preset.CRM],
					activeTab: BadgeCode.CRM,
					conditions: [
						Condition.matchesOneOfEntityType([TypeName.Deal]),
						Condition.hasCommunicationMethodsAtLeast(1),
					],
					action: (ctx, onComplete) => ActionBase.showHint({
						title: Loc.getMessage('M_CRM_ONBOARDING_ON_DEAL_CONTACT_FILLED_TITLE'),
						description: Loc.getMessage('M_CRM_ONBOARDING_ON_DEAL_CONTACT_FILLED_DESCRIPTION'),
						targetRef: ctx.targetRef,
						delay: 300,
						onComplete,
					}),
				}),
				new Case({
					id: CaseName.ON_PAYMENT_ON_DEAL,
					presets: [Preset.CRM],
					activeTab: BadgeCode.CRM,
					conditions: [
						Condition.matchesOneOfEntityType([TypeName.Deal]),
						Condition.hasSMSProviderConnection(),
						Condition.hasUnpaidProducts(),
					],
					action: (ctx, onComplete) => ActionBase.showHint({
						title: Loc.getMessage('M_CRM_ONBOARDING_ON_PAYMENT_ON_DEAL_TITLE'),
						description: Loc.getMessage('M_CRM_ONBOARDING_ON_PAYMENT_ON_DEAL_DESCRIPTION'),
						targetRef: ctx.targetRef,
						delay: 200,
						onComplete,
					}),
				}),
				new Case({
					id: CaseName.ON_CUSTOM_PRESET_APPEARED,
					presets: [Preset.CRM],
					activeTab: BadgeCode.CRM,
					conditions: [Condition.hasCustomPresets()],
					action: (ctx, onComplete) => ActionBase.showHint({
						description: Loc.getMessage('M_CRM_ONBOARDING_ON_CUSTOM_PRESET_APPEARED_DESCRIPTION'),
						targetRef: 'search',
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
