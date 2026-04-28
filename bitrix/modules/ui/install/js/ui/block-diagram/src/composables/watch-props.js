import { watch, effectScope } from 'ui.vue3';
import { useBlockDiagram } from './block-diagram';

export type UseWatchProps = {
	dispose: () => void,
};

export function useWatchProps(props): UseWatchProps
{
	const {
		blocks,
		connections,
		zoom,
		isDisabled,
		connectionOffset,
		connectionBendOffset,
		connectionBorderRadius,
		setUnmountedBlocks,
		setUnmountedPorts,
		setConnectionsOffsets,
		setHistoryBlocksCurrentState,
		setHistoryConnectionsCurrentState,
		updateTree,
		calculateIntersectedBlockIds,
		isBoxIntersection,
	} = useBlockDiagram();
	const scope = effectScope(true);

	scope.run(() => {
		watch([
			() => props.blocks,
			() => props.blocks.length,
		], ([newBlocks = [], newLength = 0], [oldBlocks = [], oldLength = 0]) => {
			if (newBlocks && Array.isArray(newBlocks))
			{
				setHistoryBlocksCurrentState(newBlocks);
				setUnmountedPorts(newBlocks, oldBlocks);
				setUnmountedBlocks(newBlocks, oldBlocks);
				blocks.value = newBlocks;
				if (newLength !== oldLength && isBoxIntersection.value)
				{
					updateTree(blocks.value);
					calculateIntersectedBlockIds();
				}
			}
		}, { immediate: true, deep: true });

		watch([() => props.connections, () => props.connections.length], ([newConnections]) => {
			setConnectionsOffsets(newConnections);
			setHistoryConnectionsCurrentState(newConnections);
			connections.value = [...newConnections];
		}, { immediate: true, deep: true });

		watch(() => props.zoom, (newZoom: number) => {
			zoom.value = newZoom;
		}, { immediate: true });

		watch(() => props.minZoom, (newMinZoom: number) => {
			zoom.value = newMinZoom;
		}, { immediate: true });

		watch(() => props.maxZoom, (newMaxZoom: number) => {
			zoom.value = newMaxZoom;
		}, { immediate: true });

		watch(() => props.connectionOffset, (newConnectionOffset: number): void => {
			connectionOffset.value = newConnectionOffset;
		}, { immediate: true });

		watch(() => props.connectionBendOffset, (newConnectionOffsetBend: number): void => {
			connectionBendOffset.value = newConnectionOffsetBend;
		}, { immediate: true });

		watch(() => props.connectionBorderRadius, (newConnectionBorderRadius: number): void => {
			connectionBorderRadius.value = newConnectionBorderRadius;
		}, { immediate: true });

		watch(() => props.disabled, (disabled: boolean) => {
			isDisabled.value = disabled;
		}, { immediate: true });
	});

	function dispose(): void
	{
		scope.stop();
	}

	return {
		dispose,
	};
}
