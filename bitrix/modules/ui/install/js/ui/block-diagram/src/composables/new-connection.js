import { toValue, ref, computed, watch, onUnmounted } from 'ui.vue3';
import { Event, Text, Type } from 'main.core';

import { useBlockDiagram } from './block-diagram';
import { buildSnapCandidatePorts } from '../utils';
import { type DiagramBlock, type DiagramBlockId, type DiagramPort, type DiagramPortId, type DiagramPortRect, type DiagramAddConnection, type DiagramNewConnection, type DiagramValidationPortRuleFn, type DiagramValidationPortRules, type DiagramNormalyzeConnectionFn, type DiagramPortsMap } from '../types';

// Point insertion does not rebalance the tree: targets arriving along a column come in almost
// monotonic order and degrade it into a one-sided branch that nearest() walks on every frame of
// the ride. The cap has to bound that walk by a constant rather than by the size of the diagram,
// or the hot path grows with the schema exactly where the autoscroll is needed. A rebuild is paid
// for by the inserts that asked for it, so the cap is what those inserts amortize.
const SNAP_TARGETS_REBUILD_INSERTS_LIMIT = 50;

export type UseNewConnection = {
	isSourcePort: boolean;
	isTargetPort: boolean;
	onMouseDownPort: (event: MouseEvent) => void;
};

export type useNewConnectionOptions = {
	block: DiagramBlock,
	port: DiagramPort,
	position: DiagramPortPosition,
	validationRules: Array<DiagramValidationPortRuleFn> | null,
	normalyzeConnectionFn: DiagramNormalyzeConnectionFn | null,
	isVirtual?: boolean,
};

// eslint-disable-next-line max-lines-per-function
export function useNewConnection(options: useNewConnectionOptions): UseNewConnection
{
	const {
		isDisabledBlockDiagram,
		newConnection,
		portsRectMap,
		portsGeometryVersion,
		portsValidationsFnMap,
		validPortsMap,
		virtualPortsMap,
		addConnection,
		portsNearest,
		blockIntersections,
		transformMouseEventToPoint,
		startAutoScroll,
		stopAutoScroll,
		updateMousePosition,
	} = useBlockDiagram();
	const {
		block,
		port,
		position,
		normalyzeConnectionFn = null,
		isVirtual = false,
	} = options;
	const isSourcePort = ref(false);
	// A candidate the rules turned down stays turned down for the whole gesture: the source port
	// is fixed, so re-running the rules on every pass only rebuilds the same probe connection.
	// Hence the contract on DiagramValidationPortRuleFn: a verdict must hold for the whole gesture.
	const rejectedTargets = new Map();
	let lastMouseEvent: MouseEvent | null = null;
	let isAutoScrollStarted = false;
	let stopSnapTargetsWatch = null;
	let insertsSinceBuild = 0;

	const isTargetPort = computed((): boolean => {
		const {
			targetBlockId = null,
			targetPortId = null,
		} = toValue(newConnection) ?? {};

		return toValue(block).id === targetBlockId && toValue(port).id === targetPortId;
	});

	watch(isDisabledBlockDiagram, (isDisabled) => {
		if (isDisabled)
		{
			closeGesture();
		}
	});

	// Only the owner's unmount winds the gesture down - closeGesture leaves every other instance
	// alone. That distinction is the whole point here: culling unmounts neighbour ports while the
	// camera pans for a live gesture, and an unowned close would kill it. For the owner the
	// opposite holds - leaving the document handlers bound would keep the composable, the index
	// and the port snapshots alive until a mouseup that would then commit on a dead context.
	onUnmounted(closeGesture);

	function validateConnection(
		rules: DiagramValidationPortRules,
		connection: DiagramNewConnection,
	): boolean
	{
		if (rules === null)
		{
			return true;
		}

		if (Type.isArray(rules))
		{
			return rules.every((rule) => rule(toValue(connection)));
		}

		if (!Type.isFunction(rules))
		{
			return true;
		}

		return rules(toValue(connection));
	}

	function isValidTargetPort(
		blockId: DiagramBlockId,
		portId: DiagramPortId,
		targetPort: DiagramPort,
		connection: DiagramNewConnection,
	): boolean
	{
		// Rules are missing here only for a port that unmounted mid-pass: a candidate whose rules
		// are not registered yet is held back by hasValidationRules before it gets here. Without
		// that guard validateConnection would read undefined rules as universally valid.
		const rules = toValue(portsValidationsFnMap).get(blockId)?.get(portId);

		return validateConnection(rules, {
			...toValue(connection),
			targetBlockId: blockId,
			targetPortId: portId,
			targetPort: { ...toValue(targetPort) },
		});
	}

	function hasValidationRules(blockId: DiagramBlockId, portId: DiagramPortId): boolean
	{
		return toValue(portsValidationsFnMap).get(blockId)?.has(portId) ?? false;
	}

	function isRejectedTarget(blockId: DiagramBlockId, portId: DiagramPortId): boolean
	{
		return rejectedTargets.get(blockId)?.has(portId) ?? false;
	}

	function rememberRejectedTarget(blockId: DiagramBlockId, portId: DiagramPortId): void
	{
		if (!rejectedTargets.has(blockId))
		{
			rejectedTargets.set(blockId, new Set());
		}

		rejectedTargets.get(blockId).add(portId);
	}

	function getPortRect(blockId: DiagramBlockId, portId: DiagramPortId): DiagramPortRect | null
	{
		return toValue(portsRectMap)?.[blockId]?.[portId] ?? null;
	}

	function getValidPorts(
		portsMap: DiagramPortsMap,
		connection: DiagramNewConnection,
	): DiagramPortsMap
	{
		const filteredPortsMap = new Map();

		for (const [blockId, ports] of toValue(portsMap).entries())
		{
			for (const [portId, targetPort] of ports.entries())
			{
				// A port that has no measured geometry or no registered rules yet is no target: it
				// must stay out of the set and out of rejectedTargets, so a later pass can take it
				// once the port is mounted through.
				if (getPortRect(blockId, portId) === null || !hasValidationRules(blockId, portId))
				{
					continue;
				}

				if (!isValidTargetPort(blockId, portId, targetPort, connection))
				{
					rememberRejectedTarget(blockId, portId);

					continue;
				}

				if (!filteredPortsMap.has(blockId))
				{
					filteredPortsMap.set(blockId, new Map());
				}

				filteredPortsMap.get(blockId).set(portId, targetPort);
			}
		}

		return filteredPortsMap;
	}

	function collectSnapCandidatePorts(): DiagramPortsMap
	{
		return buildSnapCandidatePorts(
			toValue(blockIntersections.visiblePorts),
			toValue(virtualPortsMap),
		);
	}

	function hasSnapTarget(blockId: DiagramBlockId, portId: DiagramPortId): boolean
	{
		return toValue(validPortsMap).get(blockId)?.has(portId) ?? false;
	}

	function addSnapTarget(blockId: DiagramBlockId, portId: DiagramPortId, targetPort: DiagramPort): void
	{
		const targetsMap = toValue(validPortsMap);

		if (!targetsMap.has(blockId))
		{
			targetsMap.set(blockId, new Map());
		}

		targetsMap.get(blockId).set(portId, targetPort);
	}

	// A rebuild leaves out every target whose rect is gone, so the highlighted set drops it too:
	// what is highlighted stays exactly what accepts the connection. Culling alone never gets
	// here - it retains the geometry of a node that only left the viewport.
	function dropUnmeasuredSnapTargets(): void
	{
		const targetsMap = toValue(validPortsMap);

		for (const [blockId, ports] of targetsMap.entries())
		{
			for (const portId of ports.keys())
			{
				if (getPortRect(blockId, portId) === null)
				{
					ports.delete(portId);
				}
			}

			if (ports.size === 0)
			{
				targetsMap.delete(blockId);
			}
		}
	}

	// A target joins the highlighted set only together with the index, so what is highlighted is
	// exactly what accepts the connection.
	function tryAppendSnapTarget(
		blockId: DiagramBlockId,
		portId: DiagramPortId,
		candidatePort: DiagramPort,
	): boolean
	{
		if (hasSnapTarget(blockId, portId) || isRejectedTarget(blockId, portId))
		{
			return false;
		}

		const portRect = getPortRect(blockId, portId);

		if (portRect === null)
		{
			return false;
		}

		// A port whose node returned into the viewport already has its retained geometry, but its
		// rules are registered by the mount hook, which runs after this pass. Like a port without a
		// rect it is skipped without a rejection, so the pass after the mount takes it.
		if (!hasValidationRules(blockId, portId))
		{
			return false;
		}

		if (!isValidTargetPort(blockId, portId, candidatePort, newConnection))
		{
			rememberRejectedTarget(blockId, portId);

			return false;
		}

		if (!portsNearest.addPort(blockId, portId, candidatePort, portRect))
		{
			return false;
		}

		addSnapTarget(blockId, portId, candidatePort);

		return true;
	}

	// The set of targets only grows over a gesture: a node that arrived into the viewport becomes
	// droppable, while one that left keeps the target it already earned. A port without measured
	// geometry is skipped and taken on a later pass, once the rect is there.
	function appendSnapTargets(): void
	{
		const candidatePortsMap = collectSnapCandidatePorts();
		let inserted = 0;

		for (const [blockId, ports] of candidatePortsMap.entries())
		{
			for (const [portId, candidatePort] of ports.entries())
			{
				if (tryAppendSnapTarget(blockId, portId, candidatePort))
				{
					inserted += 1;
				}
			}
		}

		insertsSinceBuild += inserted;

		if (insertsSinceBuild > SNAP_TARGETS_REBUILD_INSERTS_LIMIT)
		{
			dropUnmeasuredSnapTargets();
			portsNearest.init(toValue(validPortsMap));
			insertsSinceBuild = 0;
		}
	}

	// The watcher is created per gesture instead of per port instance: every mounted port runs this
	// composable, and a permanent subscription would fire in each of them on every camera frame.
	function startSnapTargetsWatch(): void
	{
		stopSnapTargetsWatch?.();
		// Two signals, neither of which walks a structure. The candidate set changes when a node
		// enters or leaves the viewport - that alone is what makes new ports droppable, and it
		// holds whether or not the nodes are virtualized. Port geometry is the second signal: a
		// port measured after its node was already counted visible would otherwise wait for the
		// next arrival. Post flush folds a whole mount batch into one pass and still lands before
		// the next autoscroll frame queries the index.
		stopSnapTargetsWatch = watch(
			[blockIntersections.visiblePorts, portsGeometryVersion],
			appendSnapTargets,
			{ flush: 'post' },
		);
	}

	function unwatchSnapTargets(): void
	{
		stopSnapTargetsWatch?.();
		stopSnapTargetsWatch = null;
	}

	function normalyzeNewConnection(
		connection: DiagramNewConnection,
		normalyzeFn: DiagramNormalyzeConnectionFn | null = null,
	): DiagramAddConnection
	{
		if (Type.isFunction(normalyzeFn))
		{
			return normalyzeFn(connection);
		}

		return {
			id: connection.id,
			sourceBlockId: connection.sourceBlockId,
			sourcePortId: connection.sourcePortId,
			targetBlockId: connection.targetBlockId,
			targetPortId: connection.targetPortId,
		};
	}

	function onMouseDownPort(event: MouseEvent): void
	{
		event.stopPropagation();

		// Virtual (placeholder) ports are drop-only targets: they never originate
		// a connection, otherwise a drag would start from a not-yet-created port.
		if (toValue(isDisabledBlockDiagram) || isVirtual)
		{
			return;
		}

		// A non-primary press opens a gesture whose mouseup the context menu eats, and a press
		// over a live gesture leaves its owner with bound handlers, a live watch and an unmount
		// that would stop the autoscroll of the gesture that replaced it.
		if (event.button !== 0 || toValue(newConnection) !== null)
		{
			return;
		}

		const portRect = getPortRect(toValue(block).id, toValue(port).id);

		if (portRect === null)
		{
			return;
		}

		// Ownership is claimed only once the gesture is certain to start.
		isSourcePort.value = true;
		const start = {
			x: portRect.x + (portRect.width / 2),
			y: portRect.y + (portRect.height / 2),
		};
		const center = transformMouseEventToPoint(event);

		newConnection.value = {
			id: Text.getRandom(),
			sourceBlockId: toValue(block).id,
			sourcePortId: toValue(port).id,
			sourcePort: { ...toValue(port) },
			sourcePortPosition: position,
			targetBlockId: null,
			targetPortId: null,
			targetPort: null,
			start,
			center,
			end: null,
		};

		rejectedTargets.clear();
		validPortsMap.value = getValidPorts(collectSnapCandidatePorts(), newConnection);
		portsNearest.init(toValue(validPortsMap));
		insertsSinceBuild = 0;

		bindGestureHandlers();
		startSnapTargetsWatch();
	}

	function bindGestureHandlers(): void
	{
		Event.bind(document, 'mousemove', onMouseMove);
		Event.bind(document, 'mouseup', onMouseUp);
		Event.bind(document, 'pointercancel', closeGesture);
		Event.bind(window, 'blur', closeGesture);
	}

	function unbindGestureHandlers(): void
	{
		Event.unbind(document, 'mousemove', onMouseMove);
		Event.unbind(document, 'mouseup', onMouseUp);
		Event.unbind(document, 'pointercancel', closeGesture);
		Event.unbind(window, 'blur', closeGesture);
	}

	// Winds the gesture down without committing anything. Only the instance that owns the
	// gesture may close it: under render optimization neighbour ports are unmounted by culling
	// exactly while the camera pans for this gesture, so an unowned close would kill a live one.
	function closeGesture(): void
	{
		if (!toValue(isSourcePort))
		{
			return;
		}

		// The autoscroll instance is shared by the whole diagram, so only a gesture that started
		// it may stop it.
		if (isAutoScrollStarted)
		{
			stopAutoScroll();
		}

		unbindGestureHandlers();
		unwatchSnapTargets();
		newConnection.value = null;
		isSourcePort.value = false;
		lastMouseEvent = null;
		isAutoScrollStarted = false;
		insertsSinceBuild = 0;
		rejectedTargets.clear();
		validPortsMap.value = new Map();
		portsNearest.clear();
		// Move and resize change the model as they end, and the write path itself asks culling to
		// catch up. This gesture changes nothing, so the retained source node would stay in the
		// visible set until the camera moves next.
		blockIntersections.selectVisibleBlocks();
	}

	function onMouseMove(event: MouseEvent): void
	{
		if (!toValue(newConnection) || toValue(isDisabledBlockDiagram))
		{
			return;
		}

		lastMouseEvent = event;

		// Autoscroll waits for the first move on purpose: armed on mousedown it would pan the
		// camera on a plain click on a port that itself sits in the edge threshold, with no move
		// at all. start() only arms it - the loop is started by updateMousePosition(), so the very
		// move that arms the autoscroll must report the cursor to it as well. Otherwise the ride
		// begins one event late, and a gesture whose move is the only one never begins at all.
		if (!isAutoScrollStarted)
		{
			isAutoScrollStarted = true;
			startAutoScroll(event, onAutoScrollFrame);
		}

		updateMousePosition(event);
		updateConnectionTarget(event);
	}

	// The camera has already moved when autoscroll calls back, so the same cursor point maps to a
	// new world point and the connection follows without a mouse move. The pan delta is never
	// added to the gesture math - the recalculated point already carries it.
	function onAutoScrollFrame(): void
	{
		if (lastMouseEvent !== null)
		{
			onMouseMove(lastMouseEvent);
		}
	}

	function updateConnectionTarget(event: MouseEvent): void
	{
		const point = transformMouseEventToPoint(event);
		const [nearestPort] = portsNearest.nearest(point, 1, 100)?.[0] ?? [null];
		const isSamePorts = toValue(newConnection).sourceBlockId === nearestPort?.blockId
			&& toValue(newConnection).sourcePortId === nearestPort?.portId;
		// The gesture never revokes a target, but the rect behind it can still go: culling drops a
		// virtual port's measurement, and a bulk purge takes a whole block's geometry. A target
		// that can no longer be drawn counts as no target at all.
		const portRect = nearestPort === null ? null : getPortRect(nearestPort.blockId, nearestPort.portId);

		// Fields are written in place: every mounted port watches newConnection through its own
		// isTargetPort, so replacing the object would wake all of them on every frame of a ride
		// that usually does not change the target at all.
		const connection = toValue(newConnection);

		if (nearestPort && !isSamePorts && portRect !== null)
		{
			connection.targetBlockId = nearestPort.blockId;
			connection.targetPortId = nearestPort.portId;
			connection.targetPort = nearestPort.port;
			connection.center = point;
			connection.end = {
				x: portRect.x + (portRect.width / 2),
				y: portRect.y + (portRect.height / 2),
			};
		}
		else
		{
			connection.targetBlockId = null;
			connection.targetPortId = null;
			connection.targetPort = null;
			connection.center = point;
			connection.end = null;
		}
	}

	function onMouseUp(): void
	{
		if (toValue(newConnection) === null)
		{
			return;
		}

		if (toValue(isDisabledBlockDiagram))
		{
			closeGesture();

			return;
		}

		const {
			sourceBlockId = null,
			sourcePortId = null,
			targetBlockId = null,
			targetPortId = null,
		} = toValue(newConnection);

		const isSamePort = sourceBlockId === targetBlockId && sourcePortId === targetPortId;
		const hasSourceIds = sourceBlockId !== null && sourcePortId !== null;
		// A target that lost its rect is unresolvable: a virtual one is gone from virtualPortsMap
		// as well, and committing it would wire the connection to the placeholder id.
		const hasResolvableTarget = targetBlockId !== null
			&& targetPortId !== null
			&& getPortRect(targetBlockId, targetPortId) !== null;

		if (!isSamePort && hasSourceIds && hasResolvableTarget)
		{
			const virtualEntry = toValue(virtualPortsMap)
				.get(targetBlockId)
				?.get(targetPortId) ?? null;

			if (virtualEntry)
			{
				// Virtual target: hand the drop intent to the consumer BEFORE
				// resetting the drag state so it materializes the real port and
				// wires the connection to its real id. A virtual target without a
				// handler is cancelled — the engine must never commit a connection
				// to the placeholder id itself.
				virtualEntry.onDrop?.({ ...toValue(newConnection) });
			}
			else
			{
				// Real target: standard commit.
				addConnection(
					normalyzeNewConnection(
						toValue(newConnection),
						normalyzeConnectionFn,
					),
				);
			}
		}

		closeGesture();
	}

	return {
		isSourcePort,
		isTargetPort,
		onMouseDownPort,
	};
}
