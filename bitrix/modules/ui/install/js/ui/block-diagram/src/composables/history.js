import { computed, toValue, nextTick, markRaw } from 'ui.vue3';
import { useBlockDiagram } from './block-diagram';
import { pruneSelection } from './watch-props';
import { commandToArray } from '../utils';
import type { DiagramBlock, DiagramBlockId, DiagramPort, Point, State, Snapshot } from '../types';

export type SnapshotHandler = (state: State) => {...};
export type RevertHandler = (snapshot: Snapshot) => void;

export type UseHistoryOptions = {
	snapshotHandler?: SnapshotHandler,
	revertHandler?: RevertHandler,
	maxCount?: number,
};

export type HandlerOptions = {
	snapshotHandler?: SnapshotHandler,
	revertHandler?: RevertHandler,
	emptyHistorySnapshot: {...},
};

export type UseHistory = {
	hasNext: boolean,
	hasPrev: boolean,
	setHandlers: (options: HandlerOptions) => void,
	// Takes no options and defers the snapshot to nextTick: the returned promise settles once the
	// snapshot is taken, so awaiting the call is how a caller waits for it.
	makeSnapshot: () => Promise<void>,
	next: () => void,
	prev: () => void,
	clear: () => void,
};

// eslint-disable-next-line max-lines-per-function
export function useHistory(options: UseHistoryOptions = {}): UseHistory
{
	const commonSnapshotHandler = (newState) => {
		return markRaw({
			blocks: markRaw(JSON.parse(JSON.stringify(newState.blocks))),
			connections: markRaw(JSON.parse(JSON.stringify(newState.connections))),
		});
	};

	const commonRevertHandler = (snapshot): void => {
		hooks.changedBlocks.trigger(
			commandToArray.commandReplace(snapshot.blocks),
		);
		hooks.changedConnections.trigger(
			commandToArray.commandReplace(snapshot.connections),
		);
	};

	const commonEmptyHistorySnapshot = {
		blocks: [],
		connections: [],
	};

	const instance = useBlockDiagram();
	const {
		headSnapshot,
		tailSnapshot,
		currentSnapshot,
		maxCountSnapshots,
		hooks,
		snapshotHandler,
		revertHandler,
		setHistoryHandlers,
		historyCurrentState,
		translateBlocksGeometry,
		highlitedBlockIds,
		blockIdsInModel,
	} = instance;

	const {
		snapshotHandler: newSnapshotHandler = null,
		revertHandler: newRevertHandler = null,
		emptyHistorySnapshot = commonEmptyHistorySnapshot,
		maxCount,
	} = options;
	setHandlers({ snapshotHandler: newSnapshotHandler, revertHandler: newRevertHandler });
	maxCountSnapshots.value = maxCount || toValue(maxCountSnapshots);

	const hasNext = computed(() => toValue(currentSnapshot) && toValue(currentSnapshot).next !== null);
	const hasPrev = computed(() => toValue(currentSnapshot) && toValue(currentSnapshot).prev !== null);

	function setHandlers(newHandlerOptions: HandlerOptions): void
	{
		const handlerOptions = {
			snapshotHandler: newHandlerOptions.snapshotHandler ?? toValue(snapshotHandler) ?? commonSnapshotHandler,
			revertHandler: newHandlerOptions.revertHandler ?? toValue(revertHandler) ?? commonRevertHandler,
		};

		setHistoryHandlers(handlerOptions);
	}

	function getCountSnapshots(): number
	{
		let count = 0;
		let current: Snapshot | null = toValue(headSnapshot);

		while (current)
		{
			current = current.next;
			count += 1;
		}

		return count;
	}

	let serializedSnapshot = null;
	let serializedSnapshotSource = null;

	// Serialized form of the current snapshot, cached by snapshot reference so a burst
	// of makeSnapshot calls (see dedup below) reuses the string instead of re-stringifying
	// the whole graph each time. Reference change (new snapshot, undo/redo, clear) invalidates it.
	function getSerializedCurrentSnapshot(): string | null
	{
		const current = toValue(currentSnapshot);
		const snapshot = current?.snapshot ?? null;
		if (snapshot === null)
		{
			serializedSnapshotSource = null;
			serializedSnapshot = null;

			return null;
		}

		if (current !== serializedSnapshotSource)
		{
			serializedSnapshotSource = current;
			serializedSnapshot = JSON.stringify(snapshot);
		}

		return serializedSnapshot;
	}

	function makeSnapshot(options: HandlerOptions = {}): void
	{
		const {
			snapshotHandler: newSnapshotHandler = null,
			revertHandler: newRevertHandler = null,
			emptySnapshot: newEmptySnapshot = null,
		} = options;

		const snapshotHistoryHandler = newSnapshotHandler || toValue(snapshotHandler);
		const revertHistoryHandler = newRevertHandler || toValue(revertHandler);
		const emptySnapshot = newEmptySnapshot || emptyHistorySnapshot;

		const nextSnapshotState = snapshotHistoryHandler(toValue(historyCurrentState));
		const nextSerializedState = JSON.stringify(nextSnapshotState);

		// Skip the history step when the serialized new state equals the current snapshot.
		// A single user action can trigger several hooks (endDragBlock/addBlock/deleteBlock/...),
		// each scheduling makeSnapshot; deferred to nextTick they all read the same final state
		// and would otherwise create identical snapshots that surface as dead empty undo steps.
		const currentSerializedState = getSerializedCurrentSnapshot();
		if (currentSerializedState !== null
			&& nextSerializedState === currentSerializedState)
		{
			return;
		}

		const newSnapshot = markRaw({
			snapshot: nextSnapshotState,
			revertHandler: revertHistoryHandler,
			emptySnapshot,
			next: null,
			prev: tailSnapshot.value,
		});

		if (toValue(currentSnapshot) && toValue(currentSnapshot)?.next !== null)
		{
			currentSnapshot.value.next = newSnapshot;
			newSnapshot.prev = currentSnapshot.value;
			tailSnapshot.value.prev = null;
			tailSnapshot.value.next = null;
			tailSnapshot.value = newSnapshot;
		}
		else if (toValue(headSnapshot) === null)
		{
			headSnapshot.value = newSnapshot;
			tailSnapshot.value = newSnapshot;
		}
		else
		{
			tailSnapshot.value.next = newSnapshot;
			tailSnapshot.value = newSnapshot;
		}

		currentSnapshot.value = newSnapshot;

		if (getCountSnapshots() <= toValue(maxCountSnapshots) + 1)
		{
			return;
		}

		const firstSnapshot = headSnapshot.value;
		headSnapshot.value = firstSnapshot.next;
		headSnapshot.value.prev = null;
		firstSnapshot.next = null;
	}

	function toPortList(block: DiagramBlock): Array<DiagramPort>
	{
		return Array.isArray(block.ports) ? block.ports : [];
	}

	// A port is plain graph data, so its own keys are exactly the fields a serialized
	// comparison used to cover, and comparing them directly is indifferent to the order
	// the keys happen to have.
	function hasSamePortAttributes(current: DiagramPort, target: DiagramPort): boolean
	{
		const currentKeys = Object.keys(current);

		return currentKeys.length === Object.keys(target).length
			&& currentKeys.every((key: string) => current[key] === target[key]);
	}

	// Ports of one side are laid out in the order of the array, and a measured rect keeps the
	// coordinates of its own row along with that order, so a reordered port list is a changed
	// measured shape. Hence the comparison is positional: such a pair of states must leave the
	// fast path for the slow one, which recreates the elements and measures them anew.
	function hasSamePorts(currentPorts: Array<DiagramPort>, targetPorts: Array<DiagramPort>): boolean
	{
		if (currentPorts.length !== targetPorts.length)
		{
			return false;
		}

		return currentPorts.every((port: DiagramPort, index: number) => {
			const targetPort = targetPorts[index];

			return targetPort !== undefined
				&& targetPort.id === port.id
				&& hasSamePortAttributes(port, targetPort);
		});
	}

	// Everything a measured rect depends on except the position, the only thing an
	// in-place revert is allowed to change. Compared field by field: a revert runs this
	// for every block, and a serialized form would cost a string per block.
	//
	// Hence the assumption this fast path makes about a consumer: the rendered size of a block
	// follows from its dimensions and its ports and from nothing else. A field outside them that
	// drives the size (a type mapped to its own height, say) must not change for an id that stays
	// in the graph — the keyed v-for would not remount the block, so its rect would keep the
	// translated value while the real size changed. Widening the comparison would cost that extra
	// work on every block of every undo instead.
	//
	// Known limitation of that assumption: the height of an ordinary block comes from its content
	// (useMoveableBlock styles top/left only), and content is invisible here, so an undo of a step
	// that changed the content alone — a title wrapping onto a second line, say — keeps the rect
	// measured before it. A rect is measured once per mount (useBlockState.onMountedBlock), so the
	// stale one lives until the block remounts: a slow-path revert, a cull/uncull under render
	// optimization, or the next mount of the diagram. Accepted as is, because the forward path never
	// re-measured such an edit either: the fast path drops an incidental refresh, it does not add a
	// new invariant.
	function hasSameBlockShape(current: DiagramBlock, target: DiagramBlock): boolean
	{
		const { width: currentWidth = 0, height: currentHeight = 0 } = current.dimensions ?? {};
		const { width: targetWidth = 0, height: targetHeight = 0 } = target.dimensions ?? {};

		return currentWidth === targetWidth
			&& currentHeight === targetHeight
			&& hasSamePorts(toPortList(current), toPortList(target));
	}

	// Ids come from an untrusted graph, so membership is only ever kept in a Set.
	// Consuming the matched id keeps this a single pass over each side: a repeated id
	// finds nothing the second time, so a differing composition never passes.
	function hasSameIds(current: Array<{ id: string }>, target: Array<{ id: string }>): boolean
	{
		if (current.length !== target.length)
		{
			return false;
		}

		const unmatchedIds = new Set();

		for (const { id } of current)
		{
			unmatchedIds.add(id);
		}

		for (const { id } of target)
		{
			if (!unmatchedIds.delete(id))
			{
				return false;
			}
		}

		return true;
	}

	// How far every block has to move to reach the snapshot, or null when the snapshot is
	// not reachable by moving blocks alone: the composition of the graph differs, or a block
	// changed shape and its measured geometry no longer follows from a translation.
	function getRevertOffsets(snapshot): Map<DiagramBlockId, Point> | null
	{
		const { blocks: currentBlocks, connections: currentConnections } = toValue(historyCurrentState) ?? {};

		const isComparable = Array.isArray(currentBlocks)
			&& Array.isArray(currentConnections)
			&& Array.isArray(snapshot?.blocks)
			&& Array.isArray(snapshot?.connections);

		if (!isComparable
			|| currentBlocks.length !== snapshot.blocks.length
			|| !hasSameIds(currentConnections, snapshot.connections))
		{
			return null;
		}

		const unmatchedBlocks = new Map();

		for (const block of currentBlocks)
		{
			unmatchedBlocks.set(block.id, block);
		}

		const offsets = new Map();

		// One pass matches the composition, compares the shape and collects the offset.
		// The matched block is consumed, so with the lengths already equal a block the
		// snapshot does not know about leaves a later lookup empty.
		for (const block of snapshot.blocks)
		{
			const currentBlock = unmatchedBlocks.get(block.id);

			if (currentBlock === undefined || !hasSameBlockShape(currentBlock, block))
			{
				return null;
			}

			unmatchedBlocks.delete(block.id);

			const offset = {
				x: (block.position?.x ?? 0) - (currentBlock.position?.x ?? 0),
				y: (block.position?.y ?? 0) - (currentBlock.position?.y ?? 0),
			};

			if (offset.x !== 0 || offset.y !== 0)
			{
				offsets.set(block.id, offset);
			}
		}

		return offsets;
	}

	// A snapshot that only moves blocks is restored by a single replacement: measured
	// geometry follows the move arithmetically, in the same step the coordinates change.
	// The empty snapshot in between recreates the whole graph, the historical way of
	// getting measurements refreshed, and the reason undo costs several applies. It stays
	// for the case the composition really changed and elements have to be recreated.
	//
	// Both paths end with the same selection rule: what was selected before the revert, minus
	// the blocks the model no longer has. The fast path keeps that by itself — the composition
	// does not change, so the selection survives untouched. The empty snapshot of the slow path
	// empties the model for a tick and useWatchProps trims the selection to nothing along with
	// it, so the selection is kept here and trimmed against the restored model instead.
	async function revertState({ revertHandler, snapshot, emptySnapshot }): void
	{
		const offsets = getRevertOffsets(snapshot);

		if (offsets !== null)
		{
			revertHandler(snapshot);
			translateBlocksGeometry(offsets);

			return;
		}

		const selectionBeforeRevert = [...(toValue(highlitedBlockIds) ?? [])];

		revertHandler(emptySnapshot);
		await nextTick();
		revertHandler(snapshot);

		if (selectionBeforeRevert.length === 0)
		{
			return;
		}

		// The restored model reaches the state on the next flush, together with the trimming
		// useWatchProps does, so the kept selection is put back only after that.
		await nextTick();
		highlitedBlockIds.value = selectionBeforeRevert;
		pruneSelection(highlitedBlockIds, blockIdsInModel);
	}

	async function next(): void
	{
		if (toValue(currentSnapshot) === null || toValue(currentSnapshot).next === null)
		{
			return;
		}

		await revertState(toValue(currentSnapshot).next);
		currentSnapshot.value = toValue(currentSnapshot).next;
		hooks.historyNext.trigger(currentSnapshot.value);
	}

	async function prev(): void
	{
		if (toValue(currentSnapshot) === null || toValue(currentSnapshot).prev === null)
		{
			return;
		}

		await revertState(toValue(currentSnapshot).prev);
		currentSnapshot.value = toValue(currentSnapshot).prev;
		hooks.historyPrev.trigger(currentSnapshot.value);
	}

	function clear(): void
	{
		headSnapshot.value = null;
		tailSnapshot.value = null;
		currentSnapshot.value = null;
	}

	return {
		hasNext,
		hasPrev,
		setHandlers,
		makeSnapshot: () => nextTick(() => makeSnapshot()),
		next,
		prev,
		clear,
		commonSnapshotHandler,
		commonRevertHandler,
	};
}
