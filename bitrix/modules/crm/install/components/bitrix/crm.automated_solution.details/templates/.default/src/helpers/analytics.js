import { Builder } from 'crm.integration.analytics';

export function createSaveAnalyticsBuilder(store): Builder.Automation.AutomatedSolution.CreateEvent
	| Builder.Automation.AutomatedSolution.EditEvent
{
	const builder = store.getters.isNew
		? new Builder.Automation.AutomatedSolution.CreateEvent()
		: new Builder.Automation.AutomatedSolution.EditEvent()
	;

	return builder
		.setId(store.state.automatedSolution.id)
		.setTypeIds(store.state.automatedSolution.typeIds)
	;
}
