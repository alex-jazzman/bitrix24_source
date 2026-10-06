import { PORT_TYPES } from '../../../shared/constants';
import type { DiagramNewConnection } from 'ui.block-diagram';

// `output` дополнительно матчится с `inputRelation`: точка входа шаблона автоматизации (обычный
// `output`) должна уметь соединяться с input-relation портом complex-узлов (Лид/Сделка), у которых
// ещё нет собственного `outputRelation` (см. task-678874). `input` при этом по-прежнему матчится
// только с `output`, чтобы не допустить `input <-> outputRelation`.
const MATCHING_PORT_TYPES = new Map([
	[PORT_TYPES.output, new Set([PORT_TYPES.input, PORT_TYPES.inputRelation])],
	[PORT_TYPES.input, new Set([PORT_TYPES.output])],
	[PORT_TYPES.outputRelation, new Set([PORT_TYPES.inputRelation])],
	[PORT_TYPES.inputRelation, new Set([PORT_TYPES.outputRelation, PORT_TYPES.output])],
]);

export const validationInputOutputRule = (newConnection: DiagramNewConnection): boolean => {
	const { type: sourceType } = newConnection.sourcePort;
	const { type: targetType } = newConnection.targetPort;

	return MATCHING_PORT_TYPES.get(sourceType)?.has(targetType) ?? false;
};

export const validationAuxRule = (newConnection: DiagramNewConnection): boolean => {
	const { type: sourceType } = newConnection.sourcePort;
	const { type: targetType } = newConnection.targetPort;

	const isSourcePortInputOrOutput = sourceType === PORT_TYPES.aux || sourceType === PORT_TYPES.topAux;
	const isTargetPortInputOrOutput = targetType === PORT_TYPES.aux || targetType === PORT_TYPES.topAux;

	return isSourcePortInputOrOutput && isTargetPortInputOrOutput && sourceType !== targetType;
};
