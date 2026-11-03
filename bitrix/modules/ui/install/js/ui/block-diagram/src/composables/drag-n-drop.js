import { Type } from 'main.core';
import { toValue } from 'ui.vue3';

import { useBlockDiagram } from './block-diagram';
import { useBlockPlacement } from './block-placement';
import { useDisplacedBlocks } from './displaced-blocks';
import { isSnapModifier } from './snap-modifier';

export function useDragAndDrop(): {...}
{
	const {
		zoom,
		blockDiagramRef,
		transformX,
		transformY,
		addBlock,
		snapPoint,
		hooks,
	} = useBlockDiagram();
	const { resolvePlacementDelta } = useBlockPlacement();
	const { mark: markDisplacedBlocks, announceRefusal } = useDisplacedBlocks();

	// Anything at all may be dropped onto the canvas - a selected piece of text, a link, a browser
	// tab - and all of it arrives as plain text through the very same channel a block does. So the
	// payload is parsed as untrusted input: what does not read as a block is not a block, and the
	// drop is over.
	function parseDroppedBlock(dataString: string): Object | null
	{
		let payload = null;

		try
		{
			payload = JSON.parse(dataString);
		}
		catch
		{
			return null;
		}

		if (!Type.isPlainObject(payload) || Type.isNil(payload.id))
		{
			return null;
		}

		return Type.isPlainObject(payload.dimensions) && Type.isPlainObject(payload.position)
			? payload
			: null;
	}

	function onDrop(event: DragEvent): void
	{
		event.preventDefault();

		const payload = parseDroppedBlock(event.dataTransfer.getData('text/plain'));

		if (payload === null)
		{
			return;
		}

		// The declaration of a container travels with the drag and stops here: the canvas keeps of a
		// block its geometry and whatever the consumer put there, and from the mount of the block
		// onwards the registry answers the same question. Left in, the flag would sit on the blocks
		// dropped in this session and on no other, which is a field with no meaning at all.
		const { isBackdrop = false, ...receivedData } = payload;

		const { width, height } = receivedData.dimensions;

		const el = toValue(blockDiagramRef);
		const { left, top } = el?.getBoundingClientRect() ?? { left: 0, top: 0 };

		receivedData.position.x = (event.clientX - (width * toValue(zoom) / 2)) / toValue(zoom);
		receivedData.position.y = (event.clientY - (height * toValue(zoom) / 2)) / toValue(zoom);

		receivedData.position.x += toValue(transformX);
		receivedData.position.y += toValue(transformY);

		receivedData.position.x -= left / toValue(zoom);
		receivedData.position.y -= top / toValue(zoom);

		const isSnapped = isSnapModifier(event);

		// Rounded before snapping: the divisions above leave fractions, and the model keeps
		// whole-pixel coordinates even when the drop is not snapped.
		receivedData.position = snapPoint({
			x: Math.round(receivedData.position.x),
			y: Math.round(receivedData.position.y),
		}, isSnapped);

		// Asked after the snapping and never before it: a correction taken first would be pulled
		// straight back into the occupied cell by the grid. The node is not in the index yet, so
		// there is nothing to strike out of the search - it is simply the only participant.
		//
		// What a block is made of is decided by the consumer markup, and the diagram learns of a
		// container only when its wrapper mounts - which happens after this write. Until then the only
		// word on it is the one the drag payload carries (see `DiagramDraggedBlock`), and the rule
		// takes it for this one operation. Pasting answers the same question its own way: there the
		// container was copied from one the canvas already knows.
		const placementDelta = resolvePlacementDelta([{
			id: receivedData.id,
			x: receivedData.position.x,
			y: receivedData.position.y,
			width,
			height,
		}], {
			followsGrid: isSnapped,
			backdropIds: isBackdrop ? new Set([receivedData.id]) : null,
		});

		// No free room within the budget: the node is not created at all, so the model never comes to
		// hold a forbidden overlap. There is nothing to revert here - the node has never reached it.
		// The refusal is still reported: the node the user aimed at simply not appearing is otherwise
		// indistinguishable from a drop that went nowhere.
		if (placementDelta === null)
		{
			announceRefusal();

			return;
		}

		receivedData.position = {
			x: receivedData.position.x + placementDelta.x,
			y: receivedData.position.y + placementDelta.y,
		};

		addBlock(receivedData);
		hooks.dropNewBlock.trigger(receivedData);

		if (placementDelta.x !== 0 || placementDelta.y !== 0)
		{
			markDisplacedBlocks([receivedData.id]);
		}
	}

	return {
		onDrop,
	};
}
