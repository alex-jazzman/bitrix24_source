import { ajax as Ajax } from 'main.core';

export class AutomationSliderService
{
	constructor(entityTypeId, categoryId)
	{
		this.entityTypeId = entityTypeId;
		this.categoryId = categoryId;
	}

	getSlider(): Promise
	{
		return Ajax.runAction('crm.settings.ai.getAutomationSlider', {
			json: {
				entityTypeId: this.entityTypeId,
				categoryId: this.categoryId,
			},
		});
	}

	saveSlider(revision, scenarioUpdates): Promise
	{
		return Ajax.runAction('crm.settings.ai.saveAutomationSlider', {
			json: {
				entityTypeId: this.entityTypeId,
				categoryId: this.categoryId,
				revision,
				scenarioUpdates,
			},
		});
	}
}
