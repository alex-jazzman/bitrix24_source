import { useBlockDiagram } from 'ui.block-diagram';
import { toValue } from 'ui.vue3';

import { diagramStore as useDiagramStore, FRAME_TEXT_ALIGN_OPTIONS } from '../../../entities/blocks';
import { textEditorServices } from '../../../shared/ui';
import { type BlockId } from '../../../shared/types';

export type UseEditFrameContent = {
	canEditFrameContent: () => boolean,
	editFrameContent: (blockId: BlockId) => void,
};

// The single way into editing the content of a frame. The toolbar button, the context menu item and
// the double click on the frame body all go through here, so a frame opens the same way whichever of
// them the user takes - before this the button knew how to turn the content area on and the menu item
// did not, and on a frame without one the item was simply hidden.
export const useEditFrameContent = (): UseEditFrameContent => {
	const { getBlockById, updateBlock, isDisabledBlockDiagram } = useBlockDiagram();
	const diagram = useDiagramStore();

	// The ban is checked here rather than by each entry point: the toolbar is hidden and the context
	// menu does not open while the diagram is disabled, but the body of the frame is rendered always,
	// so a gesture on it would inherit the way in without the ban. The write lock keeps the editor from
	// opening over a version the user is merely viewing - the server keeps the real boundary there, the
	// draft never reaches it under the lock. The disabled diagram also covers the layout animation,
	// which rewrites the very model the editor would write the content area into.
	const canEditFrameContent = (): boolean => !diagram.isWriteLocked && !toValue(isDisabledBlockDiagram);

	const editFrameContent = (blockId: BlockId): void => {
		if (!canEditFrameContent())
		{
			return;
		}

		const editorService = textEditorServices.get(blockId);

		if (editorService.isEdit.value)
		{
			return;
		}

		const block = getBlockById(blockId);

		// The content area comes first: an editor opened over a frame that has none has nothing to
		// draw itself in. A missing frameTextAlign reads as none, the same way the frame body reads it.
		if (
			block
			&& (block.node?.frameTextAlign ?? FRAME_TEXT_ALIGN_OPTIONS.NONE) === FRAME_TEXT_ALIGN_OPTIONS.NONE
		)
		{
			updateBlock({
				...block,
				node: {
					...block.node,
					frameTextAlign: FRAME_TEXT_ALIGN_OPTIONS.LEFT,
				},
			});
		}

		editorService.onEdit();
	};

	return {
		canEditFrameContent,
		editFrameContent,
	};
};
