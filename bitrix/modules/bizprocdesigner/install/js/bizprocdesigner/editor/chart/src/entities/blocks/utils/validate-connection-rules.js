import { type DiagramNewConnection } from 'ui.block-diagram';

import { PORT_TYPES } from '../../../shared/constants';

/**
 * Port types a connection may join. The map is symmetric: the wire can be started from either end.
 *
 * Besides the plain output-to-input pair, `output` also matches `inputRelation`: the entry point of an
 * automation template (a plain `output`) has to reach the input-relation port of a complex node (Lead,
 * Deal) that has no `outputRelation` of its own yet (see task-678874). And `outputRelation` also
 * matches `input`: a relation of a node may lead to the ordinary input of the target node
 * (see task-725261).
 */
const MATCHING_PORT_TYPES = new Map([
	[PORT_TYPES.output, new Set([PORT_TYPES.input, PORT_TYPES.inputRelation])],
	[PORT_TYPES.input, new Set([PORT_TYPES.output, PORT_TYPES.outputRelation])],
	[PORT_TYPES.outputRelation, new Set([PORT_TYPES.inputRelation, PORT_TYPES.input])],
	[PORT_TYPES.inputRelation, new Set([PORT_TYPES.outputRelation, PORT_TYPES.output])],
]);

const areConnectionPortsActive = (newConnection: DiagramNewConnection): boolean => {
	return newConnection.sourcePort?.isActive !== false && newConnection.targetPort?.isActive !== false;
};

export const validationInputOutputRule = (newConnection: DiagramNewConnection): boolean => {
	if (!areConnectionPortsActive(newConnection))
	{
		return false;
	}

	const { type: sourceType } = newConnection.sourcePort;
	const { type: targetType } = newConnection.targetPort;

	return MATCHING_PORT_TYPES.get(sourceType)?.has(targetType) ?? false;
};

export const validationAuxRule = (newConnection: DiagramNewConnection): boolean => {
	if (!areConnectionPortsActive(newConnection))
	{
		return false;
	}

	const { type: sourceType } = newConnection.sourcePort;
	const { type: targetType } = newConnection.targetPort;

	const isSourcePortInputOrOutput = sourceType === PORT_TYPES.aux || sourceType === PORT_TYPES.topAux;
	const isTargetPortInputOrOutput = targetType === PORT_TYPES.aux || targetType === PORT_TYPES.topAux;

	return isSourcePortInputOrOutput && isTargetPortInputOrOutput && sourceType !== targetType;
};
