import { ajax } from 'main.core';
import type { ActivityData } from '../../shared/types';
import type { ActionDictEntry, AvailableBlocks, CapabilityCatalog, NodeSettings, Rule } from './types';

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

// Reserved name of the rules container of a node without input ports: the transport keys that
// container by this name instead of a port id (server side: ComplexActivityService::PORTLESS_RULES_KEY).
// It is not a port: no port is created on the canvas, none reaches the saved template, and the node
// keeps no incoming wire.
export const PORTLESS_RULES_KEY = 'n0';

export type RelationSource = {
	blockId: string,
	documentType: Array<string>,
	outputs: Array<string>,
	documentOutput: string,
}

export type ComplexNodeLoadSettingsPayload = {
	title: string,
	description: string,
	// Keyed by input port id, or by PORTLESS_RULES_KEY for a node without input ports: the value has
	// the same shape either way.
	rules: Record<Rule["portId"], Rule>,
	actions: Record<string, ActionDictEntry>,
	fixedDocumentType: Array<string> | null,
	filterSupported: boolean,
	availableBlocks?: AvailableBlocks,
	// Field code -> bizproc expression "{=blockId:propertyId}". Absent/empty when there is no match.
	// Backend gates this behind complexNodeConnections + CreateWorkflow; empty map = autofill inactive.
	autofillMap?: Record<string, string>,
}

export const complexNodeApi = Object.freeze({
	loadSettings: async (
		activity: ActivityData,
		sources: Array<RelationSource> = [],
		documentType: Array<string> = [],
	): ComplexNodeLoadSettingsPayload | null => {
		const payload: {
			activity: ActivityData,
			sources?: Array<RelationSource>,
			documentType?: Array<string>,
		} = { activity };
		// Keep the request identical to the legacy one when there are no relation sources. Autofill is
		// authorized against the server-resolved target type, so it needs no document type; documentType is
		// forwarded only to resolve the node's available blocks when it has no fixed document type.
		if (sources.length > 0)
		{
			payload.sources = sources;
		}
		if (documentType.length > 0)
		{
			payload.documentType = documentType;
		}

		const data = await post('Activity.Complex.loadSettings', payload);
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
			relations: Object.fromEntries(settings.relations),
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
	getCapabilityCatalog: async (
		activity: ActivityData,
		documentType: Array<string>,
	): Promise<CapabilityCatalog | null> => {
		const data = await post('Activity.Complex.getCapabilityCatalog', {
			activity,
			documentType,
		});

		return data ?? null;
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
