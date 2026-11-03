import { Type } from 'main.core';

import { CONSTRUCTION_TYPES } from '../constants';
import { type PortId } from '../../../shared/types';
import { type Construction } from '../types';

export type ActionAuxPort = {
	portId: PortId,
	title: ?string,
};

type RulesCollection = Map<string, Object> | { [string]: Object } | null;
type ActivityWithRules = { Properties?: Object } | null;

export const carriesAuxPortReference = (construction: Construction): boolean => {
	if (construction?.type === CONSTRUCTION_TYPES.ACTION)
	{
		return true;
	}

	return construction?.type === CONSTRUCTION_TYPES.BASE_SETTINGS
		&& Type.isStringFilled(construction.expression?.actionId);
};

export function getActionAuxPortsFromRules(rules: RulesCollection): Map<PortId, ActionAuxPort>
{
	const ruleItems = rules instanceof Map ? [...rules.values()] : Object.values(rules ?? {});
	const actionAuxPorts = new Map();

	ruleItems.forEach((rule) => {
		(rule?.ruleCards ?? []).forEach((ruleCard) => {
			(ruleCard?.constructions ?? []).forEach((construction) => {
				const auxPortId = construction?.expression?.auxPortId;
				if (carriesAuxPortReference(construction) && Type.isStringFilled(auxPortId))
				{
					actionAuxPorts.set(auxPortId, {
						portId: auxPortId,
						title: construction?.expression?.auxPortTitle ?? null,
					});
				}
			});
		});
	});

	return actionAuxPorts;
}

export function getActionAuxPortIdsFromRules(rules: RulesCollection): Set<PortId>
{
	return new Set(getActionAuxPortsFromRules(rules).keys());
}

export function getActionAuxPortsFromActivity(activity: ActivityWithRules): Map<PortId, ActionAuxPort>
{
	return getActionAuxPortsFromRules(activity?.Properties?.Rules ?? null);
}

export function getActionAuxPortIdsFromActivity(activity: ActivityWithRules): Set<PortId>
{
	return getActionAuxPortIdsFromRules(activity?.Properties?.Rules ?? null);
}
