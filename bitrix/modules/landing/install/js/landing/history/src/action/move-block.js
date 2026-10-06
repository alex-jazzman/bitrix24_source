/**
 * @param {object} entry
 * @return {Promise}
 */
export default function moveBlock(entry)
{
	const {scrollTo, highlight} = BX.Landing.Utils;

	return BX.Landing.PageObject.getInstance().blocks()
		.then((blocks) => {
			const order = Array.isArray(entry.params.order)
				? entry.params.order.map((blockId) => parseInt(blockId, 10)).filter((blockId) => blockId > 0)
				: [];
			if (order.length === 0)
			{
				return Promise.reject();
			}

			const reorderedBlocks = order.map((blockId) => blocks.get(blockId));
			if (reorderedBlocks.some((block) => !block || !block.node || !block.node.parentNode))
			{
				return Promise.reject();
			}

			const container = reorderedBlocks[0].node.parentNode;
			reorderedBlocks.forEach((block) => {
				block.forceInit();
				container.appendChild(block.node);
			});

			blocks.clear();
			reorderedBlocks.forEach((block) => {
				blocks.add(block);
			});

			const movedIds = Array.isArray(entry.params.movedIds)
				? entry.params.movedIds.map((blockId) => parseInt(blockId, 10)).filter((blockId) => blockId > 0)
				: [];
			const focusBlock = blocks.get(movedIds[0] || order[0]);
			if (!focusBlock)
			{
				return Promise.resolve();
			}

			return scrollTo(focusBlock.node)
				.then(() => {
					void highlight(focusBlock.node);
				});
		});
}
