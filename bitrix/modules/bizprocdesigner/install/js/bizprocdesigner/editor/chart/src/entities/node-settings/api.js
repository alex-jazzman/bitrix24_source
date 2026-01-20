import { ajax } from 'main.core';
import type { ActivityData } from '../../shared/types';
import type { ActionDictEntry, NodeSettings, Rule } from './types';

const post = async (action: string, data: Object): Promise<Object | null> => {
	const response = await ajax.runAction(`bizprocdesigner.v2.${action}`, {
		method: 'POST',
		json: data,
	});

	if (response.status === 'success')
	{
		return response.data;
	}

	return null;
};

export type ComplexNodeLoadSettingsPayload = {
	title: string,
	description: string,
	rules: Record<Rule["portId"], Rule>,
	actionDictionary: Record<string, ActionDictEntry>,
}

export const complexNodeApi = Object.freeze({
	loadSettings: async (activity: ActivityData): ComplexNodeLoadSettingsPayload | null => {
		const data = await post('Activity.Complex.loadSettings', { activity });
		if (!data)
		{
			return null;
		}

		return data;
	},
	saveSettings: async (
		settings: NodeSettings,
		activity: ActivityData,
		documentType,
	): ActivityData | null => {
		const nodeSettingsPayload = {
			...settings,
			rules: Object.fromEntries(settings.rules),
			actions: Object.fromEntries(settings.actions),
		};

		const data = await post('Activity.Complex.saveSettings', {
			saveSettingsRequest: nodeSettingsPayload,
			activity,
			documentType,
		});
		if (!data?.activity)
		{
			return null;
		}

		return data.activity;
	},
	saveRuleSettings: async (rule: Rule, documentType): Promise<Rule | null> => {
		const data = await post('Activity.Complex.saveRule', {
			portRule: rule,
			documentType,
		});
		if (!data)
		{
			return null;
		}

		return data;
	},
});
