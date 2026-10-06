import { Type } from 'main.core';

import { PORT_TYPES } from '../../../shared/constants';
import { normalyzeInputOutputConnection } from './normalyze-connection';
import { validationInputOutputRule } from './validate-connection-rules';

// The exact own-key set a replaceable connection may carry. An unknown key means the connection
// schema has outgrown this policy, and the insertion is refused instead of being rebuilt from these
// fields alone: rebuilding would drop the unknown field from both replacement connections, while a
// refusal costs only the insertion and leaves the drag an ordinary move. Extend the list together
// with the connection schema to keep insertion available.
const SOURCE_CONNECTION_FIELDS = Object.freeze([
	'createdAt',
	'id',
	'sourceBlockId',
	'sourcePortId',
	'targetBlockId',
	'targetPortId',
]);
const SOURCE_CONNECTION_FIELDS_WITH_NULL_TYPE = Object.freeze([
	...SOURCE_CONNECTION_FIELDS,
	'type',
]);
const INVALID_CANONICAL_VALUE = Symbol('invalid canonical value');

function hasOwn(object, property)
{
	return Object.prototype.hasOwnProperty.call(object, property);
}

function getOwnStringKeys(value)
{
	try
	{
		const keys = Reflect.ownKeys(value);
		if (keys.some((key) => !Type.isString(key)))
		{
			return null;
		}

		return keys.sort();
	}
	catch
	{
		return null;
	}
}

function toCanonicalValue(value, ancestors = new WeakSet())
{
	if (Type.isUndefined(value))
	{
		return { valueType: 'undefined' };
	}

	if (Type.isNull(value) || Type.isString(value) || Type.isBoolean(value))
	{
		return value;
	}

	if (Type.isNumber(value))
	{
		return Number.isFinite(value) ? value : INVALID_CANONICAL_VALUE;
	}

	if (!Type.isObjectLike(value) || ancestors.has(value))
	{
		return INVALID_CANONICAL_VALUE;
	}

	ancestors.add(value);
	let result = null;

	if (Type.isArray(value))
	{
		result = [];
		for (let index = 0; index < value.length; index++)
		{
			const item = hasOwn(value, index)
				? toCanonicalValue(value[index], ancestors)
				: { valueType: 'array-hole' }
			;
			if (item === INVALID_CANONICAL_VALUE)
			{
				ancestors.delete(value);

				return INVALID_CANONICAL_VALUE;
			}

			result.push(item);
		}
	}
	else
	{
		const keys = getOwnStringKeys(value);
		if (keys === null)
		{
			ancestors.delete(value);

			return INVALID_CANONICAL_VALUE;
		}

		result = {};
		for (const key of keys)
		{
			let item = null;
			try
			{
				item = toCanonicalValue(value[key], ancestors);
			}
			catch
			{
				item = INVALID_CANONICAL_VALUE;
			}

			if (item === INVALID_CANONICAL_VALUE)
			{
				ancestors.delete(value);

				return INVALID_CANONICAL_VALUE;
			}

			result[key] = item;
		}
	}

	ancestors.delete(value);

	return result;
}

function stableSerialize(value)
{
	const canonicalValue = toCanonicalValue(value);
	if (canonicalValue === INVALID_CANONICAL_VALUE)
	{
		return null;
	}

	try
	{
		return JSON.stringify(canonicalValue);
	}
	catch
	{
		return null;
	}
}

function getSourceConnectionSnapshot(connection)
{
	if (!Type.isObjectLike(connection))
	{
		return null;
	}

	const keys = getOwnStringKeys(connection);
	const hasType = hasOwn(connection, 'type');
	const expectedFields = hasType
		? SOURCE_CONNECTION_FIELDS_WITH_NULL_TYPE
		: SOURCE_CONNECTION_FIELDS
	;
	if (
		keys === null
		|| keys.length !== expectedFields.length
		|| keys.some((key) => !expectedFields.includes(key))
	)
	{
		return null;
	}
	let snapshot = null;
	try
	{
		snapshot = Object.fromEntries(
			expectedFields.map((field) => [field, connection[field]]),
		);
	}
	catch
	{
		return null;
	}

	if (
		(hasType && !Type.isNull(snapshot.type))
		|| !Type.isStringFilled(snapshot.id)
		|| !Type.isStringFilled(snapshot.sourceBlockId)
		|| !Type.isStringFilled(snapshot.sourcePortId)
		|| !Type.isStringFilled(snapshot.targetBlockId)
		|| !Type.isStringFilled(snapshot.targetPortId)
		|| !Type.isNumber(snapshot.createdAt)
		|| !Number.isFinite(snapshot.createdAt)
	)
	{
		return null;
	}

	return snapshot;
}

function getUniqueEntityById(items, id)
{
	const matches = items.filter((item) => item?.id === id);

	return matches.length === 1 ? matches[0] : null;
}

function getBlockPort(block, portId)
{
	if (!Type.isArray(block?.ports))
	{
		return null;
	}

	return getUniqueEntityById(block.ports, portId);
}

function isPort(port)
{
	return Type.isObjectLike(port)
		&& Type.isStringFilled(port.id)
		&& Type.isStringFilled(port.type)
	;
}

function isActivePort(port)
{
	return isPort(port) && port.isActive !== false;
}

function getPortProjection(port, fallbackPosition)
{
	if (!isPort(port))
	{
		return null;
	}

	const hasPosition = hasOwn(port, 'position');
	const position = hasPosition ? port.position : fallbackPosition;
	if (
		!Type.isNumber(position)
		|| !Number.isFinite(position)
		|| (!Type.isUndefined(port.isActive) && !Type.isBoolean(port.isActive))
	)
	{
		return null;
	}

	const isActive = toCanonicalValue(port.isActive);
	if (isActive === INVALID_CANONICAL_VALUE)
	{
		return null;
	}

	return {
		id: port.id,
		type: port.type,
		position,
		isActive,
	};
}

function getBlockPortProjection(block, port)
{
	if (!Type.isArray(block?.ports))
	{
		return null;
	}

	const index = block.ports.indexOf(port);

	return index === -1 ? null : getPortProjection(port, index);
}

function getMovingBlockProjection(block)
{
	if (!Type.isStringFilled(block?.id) || !Type.isStringFilled(block?.type) || !Type.isArray(block?.ports))
	{
		return null;
	}

	const ports = [];
	for (const [index, port] of block.ports.entries())
	{
		const projection = getPortProjection(port, index);
		if (projection === null)
		{
			return null;
		}

		ports.push(projection);
	}

	ports.sort((left, right) => {
		return stableSerialize(left).localeCompare(stableSerialize(right));
	});

	return {
		id: block.id,
		type: block.type,
		ports,
	};
}

function isPlacedBlock(block)
{
	return Type.isObjectLike(block)
		&& Type.isNumber(block.position?.x)
		&& Number.isFinite(block.position.x)
		&& Type.isNumber(block.position?.y)
		&& Number.isFinite(block.position.y)
	;
}

function isConnectionEqual(left, right)
{
	const leftSignature = stableSerialize(left);
	const rightSignature = stableSerialize(right);

	return leftSignature !== null && leftSignature === rightSignature;
}

function findCurrentSourceConnection(connections, sourceConnection)
{
	const matches = connections.filter((connection) => connection?.id === sourceConnection.id);

	return matches.length === 1 && isConnectionEqual(matches[0], sourceConnection) ? matches[0] : null;
}

function touchesBlock(connection, blockId)
{
	return connection.sourceBlockId === blockId || connection.targetBlockId === blockId;
}

function touchesPort(connection, blockId, portId)
{
	return (
		connection.sourceBlockId === blockId
		&& connection.sourcePortId === portId
	) || (
		connection.targetBlockId === blockId
		&& connection.targetPortId === portId
	);
}

function getAffectedConnectionSignatures(connections, movingBlockId, affectedPorts)
{
	const signatures = [];
	for (const connection of connections)
	{
		const isAffected = touchesBlock(connection, movingBlockId)
			|| affectedPorts.some(({ blockId, portId }) => touchesPort(connection, blockId, portId))
		;
		if (!isAffected)
		{
			continue;
		}

		const signature = stableSerialize(connection);
		if (signature === null)
		{
			return null;
		}

		signatures.push(signature);
	}

	return signatures.sort();
}

export function createInsertConnectionAffectedSignature(options)
{
	const {
		gestureToken,
		movingBlockId,
		selectedBlockIds,
		effectiveCanEdit,
		blocks,
		connections,
		sourceConnection,
		inputPortId,
		outputPortId,
	} = options ?? {};

	if (
		!Type.isStringFilled(movingBlockId)
		|| !Type.isStringFilled(inputPortId)
		|| !Type.isStringFilled(outputPortId)
		|| !Type.isArray(selectedBlockIds)
		|| !Type.isArray(blocks)
		|| !Type.isArray(connections)
	)
	{
		return null;
	}

	const selectedIds = [...selectedBlockIds].sort();
	const sourceSnapshot = getSourceConnectionSnapshot(sourceConnection);
	if (
		selectedIds.length !== 1
		|| selectedIds[0] !== movingBlockId
		|| sourceSnapshot === null
		|| findCurrentSourceConnection(connections, sourceSnapshot) === null
	)
	{
		return null;
	}

	const movingBlock = getUniqueEntityById(blocks, movingBlockId);
	const sourceBlock = getUniqueEntityById(blocks, sourceSnapshot.sourceBlockId);
	const targetBlock = getUniqueEntityById(blocks, sourceSnapshot.targetBlockId);
	const sourcePort = getBlockPort(sourceBlock, sourceSnapshot.sourcePortId);
	const targetPort = getBlockPort(targetBlock, sourceSnapshot.targetPortId);
	const inputPort = getBlockPort(movingBlock, inputPortId);
	const outputPort = getBlockPort(movingBlock, outputPortId);
	const movingBlockProjection = getMovingBlockProjection(movingBlock);
	const portProjections = [
		getBlockPortProjection(sourceBlock, sourcePort),
		getBlockPortProjection(targetBlock, targetPort),
		getBlockPortProjection(movingBlock, inputPort),
		getBlockPortProjection(movingBlock, outputPort),
	];
	if (
		!isPlacedBlock(movingBlock)
		|| movingBlockProjection === null
		|| portProjections.some((projection) => projection === null)
	)
	{
		return null;
	}

	const affectedPorts = [
		{ blockId: sourceBlock.id, portId: sourcePort.id },
		{ blockId: targetBlock.id, portId: targetPort.id },
		{ blockId: movingBlock.id, portId: inputPort.id },
		{ blockId: movingBlock.id, portId: outputPort.id },
	];
	const affectedConnections = getAffectedConnectionSignatures(
		connections,
		movingBlockId,
		affectedPorts,
	);
	if (affectedConnections === null)
	{
		return null;
	}

	return stableSerialize({
		gesture: {
			gestureToken: toCanonicalValue(gestureToken),
			movingBlockId,
			selectedBlockIds: selectedIds,
		},
		effectiveCanEdit: effectiveCanEdit === true,
		sourceConnection: {
			hasType: hasOwn(sourceConnection, 'type'),
			fields: sourceSnapshot,
		},
		blocks: {
			source: { id: sourceBlock.id, present: true },
			target: { id: targetBlock.id, present: true },
			moving: { ...movingBlockProjection, present: true },
		},
		ports: {
			source: portProjections[0],
			target: portProjections[1],
			input: portProjections[2],
			output: portProjections[3],
		},
		affectedConnections,
	});
}

function createNewConnection(sourceBlock, sourcePort, targetBlock, targetPort)
{
	const newConnection = {
		id: '',
		sourceBlockId: sourceBlock.id,
		sourcePortId: sourcePort.id,
		sourcePort: { ...sourcePort },
		sourcePortPosition: sourcePort.position,
		targetBlockId: targetBlock.id,
		targetPortId: targetPort.id,
		targetPort: { ...targetPort },
		start: null,
		center: null,
		end: null,
	};
	if (!validationInputOutputRule(newConnection))
	{
		return null;
	}

	const { id, ...connection } = normalyzeInputOutputConnection(newConnection);

	return connection;
}

function findUniquePortPair(sourceBlock, sourcePort, targetBlock, targetPort, movingBlock)
{
	const inputPorts = movingBlock.ports.filter((port) => {
		return isActivePort(port)
			&& port.type === PORT_TYPES.input
			&& createNewConnection(sourceBlock, sourcePort, movingBlock, port) !== null
		;
	});
	const outputPorts = movingBlock.ports.filter((port) => {
		return isActivePort(port)
			&& port.type === PORT_TYPES.output
			&& createNewConnection(movingBlock, port, targetBlock, targetPort) !== null
		;
	});

	return inputPorts.length === 1 && outputPorts.length === 1
		? { inputPort: inputPorts[0], outputPort: outputPorts[0] }
		: null
	;
}

function isSameEndpoints(left, right)
{
	return left.sourceBlockId === right.sourceBlockId
		&& left.sourcePortId === right.sourcePortId
		&& left.targetBlockId === right.targetBlockId
		&& left.targetPortId === right.targetPortId
	;
}

function isDuplicateConnection(connection, connections)
{
	return connections.some((existingConnection) => {
		return isSameEndpoints(existingConnection, connection) || (
			existingConnection.sourceBlockId === connection.targetBlockId
			&& existingConnection.sourcePortId === connection.targetPortId
			&& existingConnection.targetBlockId === connection.sourceBlockId
			&& existingConnection.targetPortId === connection.sourcePortId
		);
	});
}

function normalizeValidationRules(rules)
{
	if (Type.isUndefined(rules) || Type.isNull(rules))
	{
		return [];
	}

	const normalizedRules = Type.isArray(rules) ? rules : [rules];

	return normalizedRules.some((rule) => !Type.isFunction(rule)) ? null : normalizedRules;
}

function validateProjectedGraph(rules, context)
{
	try
	{
		return rules.every((rule) => rule(context) === true);
	}
	catch
	{
		return false;
	}
}

export function validateInsertConnectionSet(options)
{
	const {
		gestureToken,
		movingBlockId,
		selectedBlockIds,
		effectiveCanEdit,
		blocks,
		connections,
		sourceConnection,
		inputPortId = null,
		outputPortId = null,
		validateConnectionRules = null,
	} = options ?? {};

	if (
		effectiveCanEdit !== true
		|| !Type.isArray(blocks)
		|| !Type.isArray(connections)
		|| !Type.isArray(selectedBlockIds)
		|| selectedBlockIds.length !== 1
		|| selectedBlockIds[0] !== movingBlockId
	)
	{
		return null;
	}

	const sourceSnapshot = getSourceConnectionSnapshot(sourceConnection);
	if (sourceSnapshot === null || findCurrentSourceConnection(connections, sourceSnapshot) === null)
	{
		return null;
	}

	const movingBlock = getUniqueEntityById(blocks, movingBlockId);
	const sourceBlock = getUniqueEntityById(blocks, sourceSnapshot.sourceBlockId);
	const targetBlock = getUniqueEntityById(blocks, sourceSnapshot.targetBlockId);
	if (
		!isPlacedBlock(movingBlock)
		|| !Type.isArray(movingBlock?.ports)
		|| sourceBlock === null
		|| targetBlock === null
		|| connections.some((connection) => touchesBlock(connection, movingBlockId))
	)
	{
		return null;
	}

	const sourcePort = getBlockPort(sourceBlock, sourceSnapshot.sourcePortId);
	const targetPort = getBlockPort(targetBlock, sourceSnapshot.targetPortId);
	if (
		!isActivePort(sourcePort)
		|| sourcePort.type !== PORT_TYPES.output
		|| !isActivePort(targetPort)
		|| targetPort.type !== PORT_TYPES.input
	)
	{
		return null;
	}

	const portPair = findUniquePortPair(sourceBlock, sourcePort, targetBlock, targetPort, movingBlock);
	const isInputOmitted = Type.isNull(inputPortId);
	const isOutputOmitted = Type.isNull(outputPortId);
	if (
		portPair === null
		|| (isInputOmitted !== isOutputOmitted)
		|| (!isInputOmitted && !Type.isStringFilled(inputPortId))
		|| (!isOutputOmitted && !Type.isStringFilled(outputPortId))
		|| (!isInputOmitted && inputPortId !== portPair.inputPort.id)
		|| (!isOutputOmitted && outputPortId !== portPair.outputPort.id)
	)
	{
		return null;
	}

	const rawIncomingConnection = createNewConnection(
		sourceBlock,
		sourcePort,
		movingBlock,
		portPair.inputPort,
	);
	const rawOutgoingConnection = createNewConnection(
		movingBlock,
		portPair.outputPort,
		targetBlock,
		targetPort,
	);
	const remainingConnections = connections
		.filter((connection) => connection.id !== sourceSnapshot.id)
	;
	if (rawIncomingConnection === null || rawOutgoingConnection === null)
	{
		return null;
	}

	const connectionDrafts = [rawIncomingConnection, rawOutgoingConnection].map((connection) => {
		return hasOwn(sourceSnapshot, 'type')
			? { ...connection, type: sourceSnapshot.type }
			: connection
		;
	});
	if (
		isDuplicateConnection(connectionDrafts[0], remainingConnections)
		|| isDuplicateConnection(connectionDrafts[1], [...remainingConnections, connectionDrafts[0]])
	)
	{
		return null;
	}

	const normalizedValidationRules = normalizeValidationRules(validateConnectionRules);
	if (normalizedValidationRules === null)
	{
		return null;
	}

	if (normalizedValidationRules.length > 0)
	{
		const projectedConnections = [
			...remainingConnections.map((connection) => ({ ...connection })),
			...connectionDrafts,
		];
		const validationContext = {
			blocks,
			connections,
			sourceConnection: sourceSnapshot,
			connectionDrafts,
			projectedConnections,
		};
		if (!validateProjectedGraph(normalizedValidationRules, validationContext))
		{
			return null;
		}
	}

	const affectedSignature = createInsertConnectionAffectedSignature({
		gestureToken,
		movingBlockId,
		selectedBlockIds,
		effectiveCanEdit,
		blocks,
		connections,
		sourceConnection: sourceSnapshot,
		inputPortId: portPair.inputPort.id,
		outputPortId: portPair.outputPort.id,
	});
	if (affectedSignature === null)
	{
		return null;
	}

	const result = {
		sourceConnection: sourceSnapshot,
		sourcePort: { ...sourcePort },
		targetPort: { ...targetPort },
		inputPort: { ...portPair.inputPort },
		outputPort: { ...portPair.outputPort },
		connectionDrafts,
		affectedSignature,
	};

	return stableSerialize(result) === null ? null : result;
}

export function isSameInsertConnectionCandidate(left, right)
{
	return Type.isObjectLike(left)
		&& Type.isObjectLike(right)
		&& left.sourceConnection?.id === right.sourceConnection?.id
		&& left.inputPort?.id === right.inputPort?.id
		&& left.outputPort?.id === right.outputPort?.id
		&& left.affectedSignature === right.affectedSignature
	;
}
