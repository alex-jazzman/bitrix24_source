import { type Port } from '../../../shared/types';

export const getPortsSignature = (ports: Array<Port>): string => {
	return (ports ?? [])
		.map((port) => `${port.id}:${port.isActive === false ? '0' : '1'}`)
		.sort()
		.join('|');
};

const generateNextPortId = (ports: Array<Port>, prefix: string): string => {
	const nextPortNumber = ports.reduce(
		(acc, currentValue: Port) => Math.max(acc, parseInt(currentValue.id.slice(1), 10)),
		0,
	) + 1;

	return `${prefix}${nextPortNumber}`;
};

export const generateNextInputPortId = (ports: Array<Port>): string => {
	return generateNextPortId(ports, 'i');
};

export const generateNextOutputPortId = (ports: Array<Port>): string => {
	return generateNextPortId(ports, 'o');
};
