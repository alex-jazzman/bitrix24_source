import { Type } from 'main.core';

import { COMPLEX_NODE_PORT_LABELS, PORT_TYPES } from '../../../shared/constants';
import { type Block, type Connection, type Port, type PortId } from '../../../shared/types';

type ActionAuxPort = {
	portId: PortId,
	title: ?string,
};

export function normalizeAuxPortTitle(portId: string, title: ?string): string
{
	if (Type.isStringFilled(title))
	{
		return title;
	}

	const portNumber = parseInt(portId.slice(1), 10);
	const titleNumber = Number.isNaN(portNumber) ? 1 : portNumber + 1;

	return `${COMPLEX_NODE_PORT_LABELS.aux}${titleNumber}`;
}

export function getConnectedPortIds(connections: Array<Connection>, blockId: string): Set<string>
{
	const ids = new Set();

	for (const connection of connections)
	{
		if (connection.sourceBlockId === blockId)
		{
			ids.add(connection.sourcePortId);
		}

		if (connection.targetBlockId === blockId)
		{
			ids.add(connection.targetPortId);
		}
	}

	return ids;
}

export function syncPortsWithActionAuxPorts(
	block: Block,
	actionAuxPorts: Map<string, ActionAuxPort>,
	connectedAuxPortIds: Set<string> = new Set(),
): Array<Port>
{
	let changed = false;
	const actionAuxPortIds = new Set(actionAuxPorts.keys());
	const ports = block.ports.map((port) => {
		if (port.type !== PORT_TYPES.aux || !actionAuxPortIds.has(port.id) || port.isActive !== false)
		{
			return port;
		}

		changed = true;

		return { ...port, isActive: true };
	});

	const existingAuxPortIds = new Set(
		ports.filter((port) => port.type === PORT_TYPES.aux).map((port) => port.id),
	);
	ports.forEach((port, index) => {
		if (
			port.type === PORT_TYPES.aux
			&& port.isActive !== false
			&& !actionAuxPortIds.has(port.id)
			&& !connectedAuxPortIds.has(port.id)
		)
		{
			ports[index] = { ...port, isActive: false };
			changed = true;
		}
	});

	actionAuxPorts.forEach(({ title }, portId) => {
		if (existingAuxPortIds.has(portId))
		{
			return;
		}

		ports.push({
			id: portId,
			title: normalizeAuxPortTitle(portId, title),
			type: PORT_TYPES.aux,
			position: 'bottom',
			isActive: true,
		});
		changed = true;
	});

	return changed ? ports : block.ports;
}

export function shouldRemoveOrphanedAuxPort(
	port: Port,
	firstAuxPortId: string,
	connectedPortIds: Set<string>,
	actionAuxPortIds: Set<string>,
): boolean
{
	return port.id !== firstAuxPortId
		&& !connectedPortIds.has(port.id)
		&& !actionAuxPortIds.has(port.id);
}

export function getUnconfiguredConnectedAuxPortIds(
	connections: Array<Connection>,
	blockId: string,
	auxPortIds: Set<string>,
	actionAuxPortIds: Set<string>,
): Set<string>
{
	const result = new Set();
	const connectedPortIds = getConnectedPortIds(connections, blockId);

	connectedPortIds.forEach((portId) => {
		if (auxPortIds.has(portId) && !actionAuxPortIds.has(portId))
		{
			result.add(portId);
		}
	});

	return result;
}
