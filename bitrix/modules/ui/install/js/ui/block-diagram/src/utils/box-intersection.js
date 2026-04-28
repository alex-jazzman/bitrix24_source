import RBush from '../lib/r-bush/r-bush';
import { ref } from 'ui.vue3';

type Viewport = {
	transformX: number,
	transformY: number,
	width: number,
	height: number,
	zoom: number,
};

export class BoxIntersection
{
	#tree = new RBush();

	#rectangles = new Map();

	intersectedBlocksIds = ref(new Set());

	updateTree(blocks: Array<Block>): void
	{
		const insertedRectangles = [];
		blocks.forEach(({ id, position, dimensions }) => {
			if (this.#rectangles.has(id))
			{
				return;
			}

			const rectangle = {
				minX: position.x,
				minY: position.y,
				maxX: position.x + dimensions.width,
				maxY: position.y + dimensions.height,
				id,
			};
			this.#rectangles.set(id, rectangle);
			insertedRectangles.push(rectangle);
		});
		if (insertedRectangles.length > 0)
		{
			this.#tree.load(insertedRectangles);
		}

		const blocksIds = new Set(blocks.map((block) => block.id));
		this.#rectangles.forEach(({ id: blockId }) => {
			if (!blocksIds.has(blockId))
			{
				const rectangle = this.#rectangles.get(blockId);
				this.#tree.remove(rectangle);
				this.#rectangles.delete(blockId);
			}
		});
	}

	calculateIntersectedBlockIds(viewPort: Viewport): void
	{
		const { transformX, transformY, width, height, zoom } = viewPort;
		const minX = transformX;
		const minY = transformY;
		const intersectedRectangles = this.#tree.search({
			minX,
			minY,
			maxX: minX + width / zoom,
			maxY: minY + height / zoom,
		});
		this.intersectedBlocksIds.value = new Set(intersectedRectangles.map((r) => r.id));
	}

	updateRectangle(blockId: BlockId, { x, y, width, height }: Partial<DOMRect>): void
	{
		const rectangle = this.#rectangles.get(blockId);
		const minX = x ?? rectangle.minX;
		const minY = y ?? rectangle.minY;
		const maxX = width ? minX + width : minX + (rectangle.maxX - rectangle.minX);
		const maxY = height ? minY + height : minY + (rectangle.maxY - rectangle.minY);
		const newRectangle = {
			...rectangle,
			minX,
			minY,
			maxX,
			maxY,
		};
		this.#tree.remove(rectangle);
		this.#tree.insert(newRectangle);
		this.#rectangles.set(blockId, newRectangle);
	}
}
