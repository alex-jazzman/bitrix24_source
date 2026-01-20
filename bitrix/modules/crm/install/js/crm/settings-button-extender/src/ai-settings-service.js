import { ajax as Ajax } from 'main.core';

export class AISettingsService
{
	constructor(entityTypeId, categoryId): void
	{
		this.entityTypeId = entityTypeId;
		this.categoryId = categoryId;
	}

	saveAutostartSettings(settings: Object): Promise
	{
		return Ajax.runAction('crm.settings.ai.saveAutostartSettings', {
			json: {
				entityTypeId: this.entityTypeId,
				categoryId: this.categoryId,
				settings,
			},
		});
	}

	getAutostartSettings(): Promise
	{
		return Ajax.runAction('crm.settings.ai.getAutostartSettings', {
			json: {
				entityTypeId: this.entityTypeId,
				categoryId: this.categoryId,
			},
		});
	}

	async saveWithErrorHandling(settings): Promise
	{
		try
		{
			const response = await this.saveAutostartSettings(settings);

			return response.data.settings;
		}
		catch (error)
		{
			await console.error('Could not save ai settings', error);

			try
			{
				const response = await this.getAutostartSettings();

				return response.data.settings;
			}
			catch (fetchError)
			{
				await console.error('Could not fetch ai settings after error in save', fetchError);

				throw fetchError;
			}
		}
	}
}
