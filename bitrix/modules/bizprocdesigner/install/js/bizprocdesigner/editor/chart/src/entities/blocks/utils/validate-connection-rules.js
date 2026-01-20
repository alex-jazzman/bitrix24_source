import { PORT_TYPES } from '../../../shared/constants';
import type { DiagramNewConnection } from 'ui.block-diagram';

export const validationInputOutputRule = (newConnection: DiagramNewConnection): boolean => {
	const { type: sourceType } = newConnection.sourcePort;
	const { type: targetType } = newConnection.targetPort;

	const isSourcePortInputOrOutput = sourceType === PORT_TYPES.input || sourceType === PORT_TYPES.output;
	const isTargetPortInputOrOutput = targetType === PORT_TYPES.input || targetType === PORT_TYPES.output;

	return isSourcePortInputOrOutput && isTargetPortInputOrOutput && sourceType !== targetType;
};

export const validationAuxRule = (newConnection: DiagramNewConnection): boolean => {
	const { type: sourceType } = newConnection.sourcePort;
	const { type: targetType } = newConnection.targetPort;

	const isSourcePortInputOrOutput = sourceType === PORT_TYPES.aux || sourceType === PORT_TYPES.topAux;
	const isTargetPortInputOrOutput = targetType === PORT_TYPES.aux || targetType === PORT_TYPES.topAux;

	return isSourcePortInputOrOutput && isTargetPortInputOrOutput && sourceType !== targetType;
};
