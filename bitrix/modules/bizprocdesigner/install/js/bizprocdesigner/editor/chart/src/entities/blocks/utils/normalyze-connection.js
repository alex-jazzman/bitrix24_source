import { PORT_TYPES } from '../../../shared/constants';
import type { DiagramNewConnection, DiagramAddConnection } from 'ui.block-diagram';

const AUX = 'aux';

const OUTPUT_SIDE_PORT_TYPES = new Set([PORT_TYPES.output, PORT_TYPES.outputRelation]);

export function normalyzeInputOutputConnection(newConnection: DiagramNewConnection): DiagramAddConnection
{
	const {
		id,
		sourceBlockId,
		sourcePortId,
		sourcePort,
		targetBlockId,
		targetPortId,
	} = newConnection;

	if (OUTPUT_SIDE_PORT_TYPES.has(sourcePort.type))
	{
		return {
			id,
			sourceBlockId,
			sourcePortId,
			targetBlockId,
			targetPortId,
		};
	}

	return {
		id,
		sourceBlockId: targetBlockId,
		sourcePortId: targetPortId,
		targetBlockId: sourceBlockId,
		targetPortId: sourcePortId,
	};
}

export function normalyzeAuxConnection(newConnection: DiagramNewConnection): DiagramAddConnection
{
	const {
		id,
		sourceBlockId,
		sourcePortId,
		sourcePort,
		targetBlockId,
		targetPortId,
	} = newConnection;

	if (sourcePort.type === PORT_TYPES.aux)
	{
		return {
			id,
			sourceBlockId,
			sourcePortId,
			targetBlockId,
			targetPortId,
			type: AUX,
		};
	}

	return {
		id,
		sourceBlockId: targetBlockId,
		sourcePortId: targetPortId,
		targetBlockId: sourceBlockId,
		targetPortId: sourcePortId,
		type: AUX,
	};
}
