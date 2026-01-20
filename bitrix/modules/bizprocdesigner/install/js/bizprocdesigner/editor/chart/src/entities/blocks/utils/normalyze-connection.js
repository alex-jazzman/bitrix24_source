import { PORT_TYPES } from '../../../shared/constants';
import type { DiagramNewConnection, DiagramAddConnection } from 'ui.block-diagram';

const AUX = 'aux';

export function normalyzeInputOutputConnection(newConnection: DiagramNewConnection): DiagramAddConnection
{
	const {
		sourceBlockId,
		sourcePortId,
		sourcePort,
		targetBlockId,
		targetPortId,
	} = newConnection;

	if (sourcePort.type === PORT_TYPES.output)
	{
		return {
			sourceBlockId,
			sourcePortId,
			targetBlockId,
			targetPortId,
		};
	}

	return {
		sourceBlockId: targetBlockId,
		sourcePortId: targetPortId,
		targetBlockId: sourceBlockId,
		targetPortId: sourcePortId,
	};
}

export function normalyzeAuxConnection(newConnection: DiagramNewConnection): DiagramAddConnection
{
	const {
		sourceBlockId,
		sourcePortId,
		sourcePort,
		targetBlockId,
		targetPortId,
	} = newConnection;

	if (sourcePort.type === PORT_TYPES.aux)
	{
		return {
			sourceBlockId,
			sourcePortId,
			targetBlockId,
			targetPortId,
			type: AUX,
		};
	}

	return {
		sourceBlockId: targetBlockId,
		sourcePortId: targetPortId,
		targetBlockId: sourceBlockId,
		targetPortId: sourcePortId,
		type: AUX,
	};
}
