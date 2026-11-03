import { type PortId } from '../../../shared/types';
import { CONSTRUCTION_TYPES } from '../constants';
import { type Construction, type Rule, type TRuleCard } from '../types';

/**
 * Saved outputs of a node: an inner node reference (`{activity}:o0`) to the NUMBER of the output port
 * the flow leaves through, the way the save writes it
 * ({@see \Bitrix\BizprocDesigner\Internal\Command\Activity\Complex\ConvertRuleCommand::processOutputExpression}).
 */
export type OutputNamesMap = { [nodeRef: string]: number | string };

export type ActivityProperties = {
	OutputNames?: OutputNamesMap,
};

export type OutputReachabilitySources = {
	// Rules of the settings panel open on THIS node, the unsaved ones included; null while it is closed.
	settingsRules: Map<PortId, Rule> | null,
	// Saved Properties of the node activity. Omitted by a caller the saved map can never answer for:
	// one that only ever runs with the settings of the node loaded.
	activityProperties?: ActivityProperties | null,
};

type ReachabilityCheck = (portId: PortId) => boolean;

// Both a port id (`o3`) and a saved OutputNames value name the same thing - the number of the port -
// in two notations; the server reads the number off the id the very same way.
const toPortNumber = (value: PortId | number | string): number => {
	return Number.parseInt(String(value ?? '').replaceAll(/\D/g, ''), 10);
};

const collectRuleOutputPortIds = (settingsRules: Map<PortId, Rule>): Set<PortId> => {
	const portIds = new Set();

	for (const rule: Rule of settingsRules.values())
	{
		for (const ruleCard: TRuleCard of rule?.ruleCards ?? [])
		{
			for (const construction: Construction of ruleCard?.constructions ?? [])
			{
				const referencedPortId = construction?.expression?.portId;
				if (construction?.type === CONSTRUCTION_TYPES.OUTPUT && referencedPortId)
				{
					portIds.add(referencedPortId);
				}
			}
		}
	}

	return portIds;
};

const collectSavedOutputPortNumbers = (activityProperties: ActivityProperties | null): Set<number> => {
	const portNumbers = Object.values(activityProperties?.OutputNames ?? {})
		.map((outputPortNumber: number | string) => toPortNumber(outputPortNumber))
	;

	return new Set(portNumbers.filter((portNumber: number) => !Number.isNaN(portNumber)));
};

/**
 * The whole output column of a node is answered off one pass over the source: a pass per port would
 * be a pass per port too many, and the answer is the same for every port of the node.
 *
 * Only real port references make the sets, so a lookup answers for an empty port id as well.
 */
const createReachabilityCheck = (sources: OutputReachabilitySources): ReachabilityCheck => {
	const { settingsRules, activityProperties } = sources ?? {};

	if (settingsRules instanceof Map)
	{
		const boundPortIds = collectRuleOutputPortIds(settingsRules);

		return (portId: PortId): boolean => boundPortIds.has(portId);
	}

	const boundPortNumbers = collectSavedOutputPortNumbers(activityProperties);

	return (portId: PortId): boolean => boundPortNumbers.has(toPortNumber(portId));
};

/**
 * Whether the flow ever reaches the output port: an output exists on the canvas as soon as a
 * connection materialises it, but the flow leaves through it only while a rule of an input port
 * points at it with an "Output" construction.
 *
 * The source of the answer is the state the user is looking at. While the settings panel of this node
 * is open, its rules are - the unsaved constructions included, otherwise the answer would lie right
 * after the user adds one; with the panel closed the saved OutputNames map of the node is.
 */
export const isOutputReachable = (portId: PortId, sources: OutputReachabilitySources): boolean => {
	return createReachabilityCheck(sources)(portId);
};

/**
 * Whether the flow reaches the output in EITHER state of the node - the draft of the open panel or
 * the saved one. This is the question of a caller that DELETES the port, and not of one that draws a
 * signal: a signal describes the state the user is looking at and is redrawn with it, a deletion
 * outlives the draft it was decided by. An output a saved rule still points at, its "Output"
 * construction removed in the panel and not saved, therefore stays: cancelling the form restores the
 * rules of the node and never its ports, and the saved rule would be left aiming at an output that
 * is gone.
 */
export const isOutputReachableInAnyState = (portId: PortId, sources: OutputReachabilitySources): boolean => {
	const { settingsRules, activityProperties } = sources ?? {};

	return (settingsRules instanceof Map && collectRuleOutputPortIds(settingsRules).has(portId))
		|| collectSavedOutputPortNumbers(activityProperties).has(toPortNumber(portId));
};

/**
 * Outputs of a node the flow never reaches, in the order they were given. The caller decides which
 * ports are in scope: relation outputs live outside this rule.
 */
export const getUnreachableOutputPortIds = (
	portIds: Array<PortId>,
	sources: OutputReachabilitySources,
): Array<PortId> => {
	const isReachable = createReachabilityCheck(sources);

	return (portIds ?? []).filter((portId: PortId) => !isReachable(portId));
};
