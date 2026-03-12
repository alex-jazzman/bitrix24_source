import type { Point } from 'ui.block-diagram';
import { diagramStore as useDiagramStore, BUFFER_CONTENT_TYPES, useBufferStore } from '../../../entities/blocks';
import type { Block } from '../../../shared/types';

export class CopyPaste
{
	#diagramStore = null;
	#bufferStore = null;

	constructor()
	{
		this.#diagramStore = useDiagramStore();
		this.#bufferStore = useBufferStore();
	}

	paste(point: Point): void
	{
		const bufferContent = this.#bufferStore.getBufferContent();
		if (!bufferContent)
		{
			return;
		}

		if (bufferContent.type === BUFFER_CONTENT_TYPES.BLOCK)
		{
			this.#pasteBlock(bufferContent.content, point);

			return;
		}

		throw new Error('Unsupported buffer content type');
	}

	#pasteBlock(block: Block, point: Point): void
	{
		const positionedBlock = {
			...block,
			position: point,
		};
		this.#diagramStore.addBlock(positionedBlock);
		this.#diagramStore.updateBlockPublishStatus(positionedBlock);
	}
}
