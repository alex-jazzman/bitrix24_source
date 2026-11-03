import { Builder } from 'crm.integration.analytics';

// TypeScript copy of templates/.default/src/helpers/analytics.js (Flow source cannot be pulled into the
// TS hub bundle, same reason as src/store/index.ts). Builds the Create/Edit analytics event for save and cancel.
export function createSaveAnalyticsBuilder(store: any): any
{
	const builder = store.getters.isNew
		? new Builder.Automation.AutomatedSolution.CreateEvent()
		: new Builder.Automation.AutomatedSolution.EditEvent();

	return builder
		.setId(store.state.automatedSolution.id)
		.setTypeIds(store.state.automatedSolution.typeIds);
}
