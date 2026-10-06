import { Text, Type } from 'main.core';
import { ref, toValue, watch } from 'ui.vue3';

import {
	isSameInsertConnectionCandidate,
	validateInsertConnectionSet,
} from '../../../entities/blocks/utils';

const CONNECTION_ID_ATTEMPTS = 16;

function isPlacedBlock(block)
{
	return Type.isObjectLike(block)
		&& Type.isNumber(block.position?.x)
		&& Number.isFinite(block.position.x)
		&& Type.isNumber(block.position?.y)
		&& Number.isFinite(block.position.y)
	;
}

function getUniqueItemById(items, id)
{
	if (!Type.isArray(items))
	{
		return null;
	}

	const matches = items.filter((item) => item?.id === id);

	return matches.length === 1 ? matches[0] : null;
}

function createUniqueIdIndex(items)
{
	const index = new Map();
	for (const item of items)
	{
		const id = item?.id;
		if (!Type.isStringFilled(id))
		{
			continue;
		}

		index.set(id, index.has(id) ? null : item);
	}

	return index;
}

function hasOwn(object, property)
{
	return Object.prototype.hasOwnProperty.call(object, property);
}

function copyRect(rect)
{
	if (
		!Type.isObjectLike(rect)
		|| !['x', 'y', 'width', 'height'].every((field) => (
			Type.isNumber(rect[field]) && Number.isFinite(rect[field])
		))
	)
	{
		return null;
	}

	return {
		x: rect.x,
		y: rect.y,
		width: rect.width,
		height: rect.height,
	};
}

function canSerialize(value)
{
	try
	{
		return Type.isString(JSON.stringify(value));
	}
	catch
	{
		return false;
	}
}

function createPreviewConnectionId(prefix, activationKey, usedIds)
{
	let suffix = 0;
	let id = `${prefix}-${activationKey}`;
	while (usedIds.has(id))
	{
		suffix++;
		id = `${prefix}-${activationKey}-${suffix}`;
	}

	usedIds.add(id);

	return id;
}

function createUniqueConnectionId(createConnectionId, usedIds)
{
	for (let attempt = 0; attempt < CONNECTION_ID_ATTEMPTS; attempt++)
	{
		let id = null;
		try
		{
			id = createConnectionId();
		}
		catch
		{
			return null;
		}

		if (Type.isStringFilled(id) && id.trim() !== '' && !usedIds.has(id))
		{
			usedIds.add(id);

			return id;
		}
	}

	return null;
}

// eslint-disable-next-line max-lines-per-function
export function useInsertNodeIntoConnection(options = {})
{
	const {
		diagramStore,
		blockDiagram,
		selectedBlockIds = [],
		disabled = false,
		validateConnectionRules = null,
		createConnectionId = () => Text.getRandom(),
		now = () => Date.now(),
		scheduleSave = () => {},
		requestFrame = (callback) => requestAnimationFrame(callback),
		cancelFrame = (frameId) => cancelAnimationFrame(frameId),
	} = options;

	let nextGestureToken = 0;
	let nextPreviewActivation = 0;
	let gesture = null;
	let bufferedBlocks = null;
	let bufferedMovingBlock = null;
	let latestRect = null;
	let rectVersion = 0;
	let frameId = null;
	let modelVersion = 0;
	let gestureModelSnapshot = null;
	let shownCandidate = null;
	let shownCandidateModelVersion = null;
	let shownActivationKey = null;
	let isDisposed = false;
	const isRouteHitTestActive = ref(false);

	function getSelectedBlockIds()
	{
		const ids = toValue(selectedBlockIds);

		return Type.isArray(ids) ? [...ids] : [];
	}

	function effectiveCanEdit()
	{
		return toValue(disabled) !== true && diagramStore?.isEditorReadonly !== true;
	}

	function getCurrentBlocks()
	{
		return Type.isArray(diagramStore?.blocks) ? diagramStore.blocks : [];
	}

	function getCurrentConnections()
	{
		return Type.isArray(diagramStore?.connections) ? diagramStore.connections : [];
	}

	function invalidateModelSnapshot()
	{
		modelVersion++;
		gestureModelSnapshot = null;
	}

	function getPolicyConnection(connection, connectionTimestamps)
	{
		if (!Type.isObjectLike(connection) || hasOwn(connection, 'createdAt'))
		{
			return connection;
		}

		const createdAt = connectionTimestamps?.[connection.id];
		if (!Type.isNumber(createdAt) || !Number.isFinite(createdAt))
		{
			return connection;
		}

		return { ...connection, createdAt };
	}

	function isGestureSelectionEligible(movingBlockId)
	{
		const selectedIds = toValue(selectedBlockIds);

		return Type.isArray(selectedIds)
			&& selectedIds.length === 1
			&& selectedIds[0] === movingBlockId
		;
	}

	function createGestureModelSnapshot()
	{
		if (gesture === null)
		{
			return null;
		}

		const blocks = getCurrentBlocks();
		const connections = getCurrentConnections();
		const connectionTimestamps = diagramStore?.connectionCurrentTimestamps;
		const blocksById = createUniqueIdIndex(blocks);
		const policyConnections = connections.map((connection) => (
			getPolicyConnection(connection, connectionTimestamps)
		));
		const connectionsById = createUniqueIdIndex(policyConnections);

		const movingBlock = blocksById.get(gesture.movingBlockId) ?? null;
		const touchesMovingBlock = connections.some((connection) => (
			connection?.sourceBlockId === gesture.movingBlockId
			|| connection?.targetBlockId === gesture.movingBlockId
		));

		return {
			version: modelVersion,
			blocks,
			connections,
			blocksById,
			connectionsById,
			policyConnections,
			rejectedCandidateKeys: new Set(),
			validatedCandidateKey: null,
			validatedCandidate: null,
			isGestureEligible: isPlacedBlock(movingBlock) && !touchesMovingBlock,
		};
	}

	function getGestureModelSnapshot()
	{
		if (gestureModelSnapshot?.version !== modelVersion)
		{
			gestureModelSnapshot = createGestureModelSnapshot();
		}

		return gestureModelSnapshot;
	}

	function isCurrentModelSnapshot(snapshot)
	{
		return snapshot !== null && snapshot.version === modelVersion;
	}

	function readMovingRect()
	{
		if (gesture === null)
		{
			return null;
		}

		return copyRect(toValue(blockDiagram?.blocksRectMap)?.[gesture.movingBlockId]);
	}

	function cancelPendingFrame()
	{
		if (frameId === null)
		{
			return;
		}

		const pendingFrameId = frameId;
		frameId = null;
		try
		{
			cancelFrame(pendingFrameId);
		}
		catch
		{
			frameId = null;
		}
	}

	function clearShownPreview(force = false)
	{
		if (!force && shownActivationKey === null)
		{
			return;
		}

		try
		{
			blockDiagram?.clearConnectionPreview(
				force ? null : shownActivationKey,
			);
		}
		catch
		{
			shownActivationKey = null;
			shownCandidate = null;
			shownCandidateModelVersion = null;

			return;
		}

		shownActivationKey = null;
		shownCandidate = null;
		shownCandidateModelVersion = null;
	}

	function isShownPreviewActive()
	{
		return shownActivationKey !== null
			&& toValue(blockDiagram?.connectionPreview)?.activationKey === shownActivationKey
		;
	}

	function syncHistory(blocks = getCurrentBlocks(), connections = getCurrentConnections())
	{
		blockDiagram?.setHistoryBlocksCurrentState(blocks);
		blockDiagram?.setHistoryConnectionsCurrentState(connections);
	}

	function closeGesture({ clearPreview = true, syncCurrentHistory = false } = {})
	{
		const wasActive = gesture !== null;
		isRouteHitTestActive.value = false;
		nextGestureToken++;
		cancelPendingFrame();
		if (clearPreview)
		{
			clearShownPreview();
		}

		gesture = null;
		bufferedBlocks = null;
		bufferedMovingBlock = null;
		latestRect = null;
		rectVersion = 0;
		gestureModelSnapshot = null;

		if (wasActive && syncCurrentHistory)
		{
			syncHistory();
		}
	}

	function invalidateActiveGesture()
	{
		if (gesture === null || gesture.isInvalid === true)
		{
			return;
		}

		cancelPendingFrame();
		clearShownPreview();
		gesture.isInvalid = true;
		bufferedBlocks = null;
		bufferedMovingBlock = null;
		latestRect = null;
		rectVersion++;
		invalidateModelSnapshot();
		syncHistory();
	}

	function releaseGestureToDefaultMove()
	{
		if (
			gesture === null
			|| gesture.hadShownCandidate === true
			|| bufferedBlocks !== null
			|| !effectiveCanEdit()
		)
		{
			invalidateActiveGesture();

			return;
		}

		closeGesture();
	}

	function getPolicyOptions(
		snapshot,
		sourceConnection,
		inputPortId = null,
		outputPortId = null,
		canEdit = effectiveCanEdit(),
	)
	{
		const policyConnection = snapshot?.connectionsById.get(sourceConnection?.id);

		return {
			gestureToken: gesture?.token,
			movingBlockId: gesture?.movingBlockId,
			selectedBlockIds: [gesture?.movingBlockId],
			effectiveCanEdit: canEdit,
			blocks: snapshot?.blocks,
			connections: snapshot?.policyConnections,
			sourceConnection: policyConnection,
			inputPortId,
			outputPortId,
			validateConnectionRules,
		};
	}

	function getCandidateCacheKey(sourceConnection, inputPortId, outputPortId)
	{
		return JSON.stringify([sourceConnection?.id, inputPortId, outputPortId]);
	}

	function validateCandidate(
		snapshot,
		sourceConnection,
		inputPortId = null,
		outputPortId = null,
		canEdit = effectiveCanEdit(),
		force = false,
	)
	{
		const cacheKey = getCandidateCacheKey(sourceConnection, inputPortId, outputPortId);
		if (!force && snapshot.rejectedCandidateKeys.has(cacheKey))
		{
			return null;
		}
		if (!force && snapshot.validatedCandidateKey === cacheKey)
		{
			return snapshot.validatedCandidate;
		}

		const candidate = validateInsertConnectionSet(getPolicyOptions(
			snapshot,
			sourceConnection,
			inputPortId,
			outputPortId,
			canEdit,
		));
		if (!force)
		{
			if (candidate === null)
			{
				snapshot.rejectedCandidateKeys.add(cacheKey);
			}
			else
			{
				snapshot.validatedCandidateKey = cacheKey;
				snapshot.validatedCandidate = candidate;
			}
		}

		return candidate;
	}

	function findRouteHits(rect, snapshot)
	{
		try
		{
			const hits = blockDiagram?.findConnectionRouteHits(rect);
			if (!Type.isArray(hits))
			{
				return [];
			}

			return hits.reduce((result, hit) => {
				const connection = snapshot.connectionsById.get(hit?.connection?.id);
				if (!Type.isObjectLike(hit) || !connection)
				{
					return result;
				}

				result.push({ ...hit, connection });

				return result;
			}, []);
		}
		catch
		{
			return [];
		}
	}

	function createPreview(candidate, activationKey, snapshot)
	{
		const currentConnections = snapshot.connections;
		const connectionIds = currentConnections.map((connection) => connection?.id);
		const usedIds = new Set(connectionIds);
		if (
			connectionIds.some((id) => !Type.isStringFilled(id))
			|| usedIds.size !== currentConnections.length
		)
		{
			return null;
		}

		const temporaryConnections = candidate.connectionDrafts.map((draft, index) => ({
			...draft,
			id: createPreviewConnectionId(
				index === 0 ? '__insert-preview-in' : '__insert-preview-out',
				activationKey,
				usedIds,
			),
		}));
		const routingConnections = [
			...currentConnections.filter((connection) => (
				connection.id !== candidate.sourceConnection.id
			)),
			...temporaryConnections,
		];

		return {
			hiddenConnectionId: candidate.sourceConnection.id,
			temporaryConnections,
			routingConnections,
			portMarkers: [
				{ blockId: gesture.movingBlockId, portId: candidate.inputPort.id },
				{ blockId: gesture.movingBlockId, portId: candidate.outputPort.id },
			],
			activationKey,
		};
	}

	function showCandidate(candidate, snapshot)
	{
		const activationKey = `insert-${gesture.token}-${++nextPreviewActivation}`;
		const preview = createPreview(candidate, activationKey, snapshot);
		if (preview === null)
		{
			return false;
		}

		try
		{
			blockDiagram?.showConnectionPreview(preview);
		}
		catch
		{
			return false;
		}

		if (toValue(blockDiagram?.connectionPreview)?.activationKey !== activationKey)
		{
			try
			{
				blockDiagram?.clearConnectionPreview(activationKey);
			}
			catch
			{
				return false;
			}

			return false;
		}

		shownCandidate = candidate;
		shownCandidateModelVersion = snapshot.version;
		shownActivationKey = activationKey;
		gesture.hadShownCandidate = true;

		return true;
	}

	function isCurrentFrame(token, version)
	{
		return gesture?.token === token
			&& gesture.isInvalid !== true
			&& rectVersion === version
		;
	}

	function processFrame(token, version, rect)
	{
		if (!isCurrentFrame(token, version))
		{
			return;
		}

		const canEdit = effectiveCanEdit();
		if (!canEdit)
		{
			if (gesture?.token === token)
			{
				invalidateActiveGesture();
			}

			return;
		}
		if (!isGestureSelectionEligible(gesture.movingBlockId))
		{
			if (gesture?.token === token)
			{
				releaseGestureToDefaultMove();
			}

			return;
		}

		const snapshot = getGestureModelSnapshot();
		if (snapshot?.isGestureEligible !== true)
		{
			releaseGestureToDefaultMove();

			return;
		}

		if (shownCandidate !== null && shownCandidateModelVersion !== snapshot.version)
		{
			const refreshedCandidate = validateCandidate(
				snapshot,
				shownCandidate.sourceConnection,
				shownCandidate.inputPort.id,
				shownCandidate.outputPort.id,
				canEdit,
			);
			if (!isCurrentFrame(token, version) || !isCurrentModelSnapshot(snapshot))
			{
				return;
			}

			if (
				refreshedCandidate === null
				|| !isSameInsertConnectionCandidate(shownCandidate, refreshedCandidate)
			)
			{
				invalidateActiveGesture();

				return;
			}

			shownCandidateModelVersion = snapshot.version;
		}

		const hits = findRouteHits(rect, snapshot);
		if (!isCurrentFrame(token, version) || !isCurrentModelSnapshot(snapshot))
		{
			return;
		}

		if (shownCandidate !== null)
		{
			const currentHit = hits.find((hit) => (
				hit?.connection?.id === shownCandidate.sourceConnection.id
			));
			if (currentHit)
			{
				if (!isShownPreviewActive())
				{
					const candidateToRestore = validateCandidate(
						snapshot,
						shownCandidate.sourceConnection,
						shownCandidate.inputPort.id,
						shownCandidate.outputPort.id,
						canEdit,
					);
					if (
						candidateToRestore === null
						|| !isSameInsertConnectionCandidate(shownCandidate, candidateToRestore)
					)
					{
						invalidateActiveGesture();

						return;
					}

					clearShownPreview();
					showCandidate(candidateToRestore, snapshot);
				}

				return;
			}

			clearShownPreview();
		}

		for (const hit of hits)
		{
			const candidate = validateCandidate(
				snapshot,
				hit?.connection,
				null,
				null,
				canEdit,
			);
			if (candidate === null)
			{
				continue;
			}

			if (!isCurrentFrame(token, version) || !isCurrentModelSnapshot(snapshot))
			{
				return;
			}

			showCandidate(candidate, snapshot);

			return;
		}
	}

	function scheduleCandidateFrame()
	{
		if (frameId !== null || gesture === null || latestRect === null)
		{
			return;
		}

		const token = gesture.token;
		try
		{
			frameId = requestFrame(() => {
				frameId = null;
				const version = rectVersion;
				const rect = latestRect;
				if (rect !== null)
				{
					processFrame(token, version, rect);
				}
			});
		}
		catch
		{
			frameId = null;
		}
	}

	function getFinalBlocks()
	{
		if (gesture === null || !isPlacedBlock(bufferedMovingBlock))
		{
			return null;
		}

		const currentBlocks = getCurrentBlocks();
		const currentMovingBlock = getUniqueItemById(currentBlocks, gesture.movingBlockId);
		if (!isPlacedBlock(currentMovingBlock))
		{
			return null;
		}

		return currentBlocks.map((block) => {
			return block.id === gesture.movingBlockId
				? {
					...block,
					position: {
						x: bufferedMovingBlock.position.x,
						y: bufferedMovingBlock.position.y,
					},
				}
				: block
			;
		});
	}

	function prepareInsertionPublication(candidate, finalBlocks, snapshot, canEdit)
	{
		const finalCandidate = validateCandidate(
			snapshot,
			candidate.sourceConnection,
			candidate.inputPort.id,
			candidate.outputPort.id,
			canEdit,
			true,
		);
		if (
			finalCandidate === null
			|| !isCurrentModelSnapshot(snapshot)
			|| !isSameInsertConnectionCandidate(candidate, finalCandidate)
		)
		{
			return null;
		}

		let timestamp = null;
		try
		{
			timestamp = now();
		}
		catch
		{
			return null;
		}
		if (!Type.isNumber(timestamp) || !Number.isFinite(timestamp))
		{
			return null;
		}

		const usedIds = new Set(snapshot.connections.map((connection) => connection?.id));
		const incomingId = createUniqueConnectionId(createConnectionId, usedIds);
		if (incomingId === null)
		{
			return null;
		}

		const outgoingId = createUniqueConnectionId(createConnectionId, usedIds);
		if (outgoingId === null)
		{
			return null;
		}

		const newConnections = finalCandidate.connectionDrafts.map((draft, index) => ({
			...draft,
			id: index === 0 ? incomingId : outgoingId,
			createdAt: timestamp,
		}));
		if (!isCurrentModelSnapshot(snapshot))
		{
			return null;
		}

		const connections = [
			...snapshot.connections.filter((connection) => (
				connection.id !== finalCandidate.sourceConnection.id
			)),
			...newConnections,
		];
		const blockCurrentTimestamps = {
			...(diagramStore.blockCurrentTimestamps ?? {}),
			[gesture.movingBlockId]: timestamp,
		};
		const connectionCurrentTimestamps = {
			...(diagramStore.connectionCurrentTimestamps ?? {}),
		};
		delete connectionCurrentTimestamps[finalCandidate.sourceConnection.id];
		connectionCurrentTimestamps[incomingId] = timestamp;
		connectionCurrentTimestamps[outgoingId] = timestamp;

		const publication = {
			blocks: finalBlocks,
			connections,
			blockCurrentTimestamps,
			connectionCurrentTimestamps,
		};

		return canSerialize(publication) ? publication : null;
	}

	function requestSave()
	{
		try
		{
			const result = scheduleSave();
			if (Type.isFunction(result?.catch))
			{
				result.catch(() => null);
			}
		}
		catch
		{
			return;
		}
	}

	function publishOrdinaryMove(finalBlocks)
	{
		try
		{
			diagramStore.setBlocks(finalBlocks);
			syncHistory(finalBlocks, getCurrentConnections());
		}
		catch
		{
			closeGesture({ syncCurrentHistory: true });

			return;
		}

		closeGesture();
		requestSave();
	}

	function publishInsertion(publication)
	{
		try
		{
			diagramStore.applyGraphPublication(publication);
			syncHistory(publication.blocks, publication.connections);
		}
		catch
		{
			closeGesture({ syncCurrentHistory: true });

			return;
		}

		closeGesture();
		requestSave();
	}

	function onStartDragBlock(block)
	{
		if (isDisposed)
		{
			return;
		}

		closeGesture({ syncCurrentHistory: true });
		clearShownPreview(true);
		const movingBlock = toValue(block);
		if (!Type.isStringFilled(movingBlock?.id))
		{
			return;
		}

		gesture = {
			token: ++nextGestureToken,
			movingBlockId: movingBlock.id,
			isInvalid: false,
			hadShownCandidate: false,
		};
		const canEdit = effectiveCanEdit();
		const snapshot = getGestureModelSnapshot();
		if (
			!canEdit
			|| !isGestureSelectionEligible(movingBlock.id)
			|| snapshot?.isGestureEligible !== true
		)
		{
			closeGesture({ clearPreview: false });

			return;
		}

		const originalMovingBlock = snapshot.blocksById.get(movingBlock.id);
		gesture.originalMovingBlock = {
			...originalMovingBlock,
			position: { ...originalMovingBlock.position },
		};

		// The route index is asked for only once a gesture that could reach a connection is under
		// way: outside it the canvas would keep the whole index in step with every graph change for
		// nothing. Raised after the eligibility checks, dropped in closeGesture - the single exit of
		// every path, and later than the final hit test of onEndDragBlock.
		isRouteHitTestActive.value = true;
	}

	function onMoveDragBlock(block)
	{
		const movingBlock = toValue(block);
		if (
			gesture === null
			|| gesture.isInvalid === true
			|| movingBlock?.id !== gesture.movingBlockId
		)
		{
			return;
		}

		const rect = readMovingRect();
		if (rect === null)
		{
			return;
		}

		latestRect = rect;
		rectVersion++;
		scheduleCandidateFrame();
	}

	function interceptBlocksUpdate(newBlocks)
	{
		if (gesture === null)
		{
			return { handled: false };
		}

		const canEdit = effectiveCanEdit();
		const snapshot = getGestureModelSnapshot();
		if (
			gesture.isInvalid === true
			|| !canEdit
		)
		{
			closeGesture({ syncCurrentHistory: true });

			return { handled: true };
		}

		if (
			!isGestureSelectionEligible(gesture.movingBlockId)
			|| snapshot?.isGestureEligible !== true
		)
		{
			if (gesture.hadShownCandidate !== true && bufferedBlocks === null)
			{
				closeGesture();

				return { handled: false };
			}

			closeGesture({ syncCurrentHistory: true });

			return { handled: true };
		}

		const finalMovingBlock = getUniqueItemById(newBlocks, gesture.movingBlockId);
		if (!Type.isArray(newBlocks) || !isPlacedBlock(finalMovingBlock))
		{
			closeGesture({ syncCurrentHistory: true });

			return { handled: true };
		}

		bufferedBlocks = [...newBlocks];
		bufferedMovingBlock = {
			...finalMovingBlock,
			position: { ...finalMovingBlock.position },
		};

		return { handled: true };
	}

	function onEndDragBlock(block)
	{
		const movingBlock = toValue(block);
		if (gesture === null)
		{
			return;
		}
		if (movingBlock?.id !== gesture.movingBlockId)
		{
			closeGesture({ syncCurrentHistory: true });

			return;
		}

		cancelPendingFrame();
		const canEdit = effectiveCanEdit();
		const snapshot = getGestureModelSnapshot();
		if (
			gesture.isInvalid === true
			|| bufferedBlocks === null
			|| !canEdit
			|| !isGestureSelectionEligible(gesture.movingBlockId)
			|| snapshot?.isGestureEligible !== true
		)
		{
			closeGesture({ syncCurrentHistory: true });

			return;
		}

		const finalBlocks = getFinalBlocks();
		if (finalBlocks === null)
		{
			closeGesture({ syncCurrentHistory: true });

			return;
		}

		if (shownCandidate === null)
		{
			publishOrdinaryMove(finalBlocks);

			return;
		}

		if (!isShownPreviewActive())
		{
			clearShownPreview();
			publishOrdinaryMove(finalBlocks);

			return;
		}

		const finalRect = readMovingRect();
		const shownHit = finalRect === null
			? null
			: findRouteHits(finalRect, snapshot).find((hit) => (
				hit?.connection?.id === shownCandidate.sourceConnection.id
			))
		;
		if (!shownHit)
		{
			clearShownPreview();
			publishOrdinaryMove(finalBlocks);

			return;
		}

		const publication = prepareInsertionPublication(shownCandidate, finalBlocks, snapshot, canEdit);
		if (publication === null)
		{
			closeGesture({ syncCurrentHistory: true });

			return;
		}

		if (!isShownPreviewActive())
		{
			clearShownPreview();
			publishOrdinaryMove(finalBlocks);

			return;
		}

		publishInsertion(publication);
	}

	function cancel()
	{
		closeGesture({ syncCurrentHistory: true });
	}

	const stopModelUpdates = Type.isFunction(diagramStore?.$subscribe)
		? diagramStore.$subscribe(invalidateModelSnapshot, { flush: 'sync' })
		: watch(
			() => [
				diagramStore?.blocks,
				diagramStore?.connections,
				diagramStore?.blockCurrentTimestamps,
				diagramStore?.connectionCurrentTimestamps,
			],
			invalidateModelSnapshot,
			{ deep: true, flush: 'sync' },
		)
	;

	const stopEligibilityWatch = watch(
		() => ({
			disabled: toValue(disabled) === true,
			readonly: diagramStore?.isEditorReadonly === true,
			movingBlockId: toValue(blockDiagram?.movingBlockId),
			selectedBlockIds: getSelectedBlockIds().join('\u0000'),
		}),
		() => {
			if (gesture === null)
			{
				return;
			}

			const movingBlockId = toValue(blockDiagram?.movingBlockId);
			const isWaitingForEndAfterModelUpdate = movingBlockId === null && bufferedBlocks !== null;
			if (movingBlockId !== gesture.movingBlockId && !isWaitingForEndAfterModelUpdate)
			{
				closeGesture({ syncCurrentHistory: true });

				return;
			}

			if (!effectiveCanEdit())
			{
				invalidateActiveGesture();

				return;
			}

			if (!isGestureSelectionEligible(gesture.movingBlockId))
			{
				releaseGestureToDefaultMove();
			}
		},
		{ flush: 'sync' },
	);

	function dispose()
	{
		if (isDisposed)
		{
			return;
		}

		isDisposed = true;
		stopEligibilityWatch();
		stopModelUpdates();
		cancel();
	}

	return {
		isRouteHitTestActive,
		onStartDragBlock,
		onMoveDragBlock,
		onEndDragBlock,
		interceptBlocksUpdate,
		cancel,
		dispose,
	};
}
