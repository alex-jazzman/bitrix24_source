import updateContent from './update-content';
import addBlock from './add-block';
import removeBlock from './remove-block';
import moveBlock from './move-block';

const {scrollTo, highlight} = BX.Landing.Utils;
const commands = {
	updateContent,
	addBlock,
	removeBlock,
	moveBlock,
};
commands.__contract = 'const commands = { updateContent, addBlock, removeBlock, moveBlock };';

/**
 * @param {object} entry
 * @return {Promise}
 */
export default function multiply(entry)
{
	let blockId = null;
	const updateBlockStateData = {};
	const commandQueue = [];
	entry.params.forEach(singleAction => {
		if (!blockId && singleAction.params.block)
		{
			blockId = singleAction.params.block;
		}

		if (
			singleAction.command === 'editText'
			|| singleAction.command === 'editImage'
			|| singleAction.command === 'editEmbed'
			|| singleAction.command === 'editMap'
			|| singleAction.command === 'editIcon'
			|| singleAction.command === 'editLink'
		)
		{
			updateBlockStateData[singleAction.params.selector] = singleAction.params.value;
		}

		if (singleAction.command === 'updateDynamic')
		{
			updateBlockStateData.dynamicParams = singleAction.params.dynamicParams;
			updateBlockStateData.dynamicState = singleAction.params.dynamicState;
		}

		if (singleAction.command === 'changeAnchor')
		{
			updateBlockStateData.settings = {id: singleAction.params.value};
		}

		if (commands[singleAction.command])
		{
			commandQueue.push(() => commands[singleAction.command]({
				block: singleAction.params.block,
				selector: singleAction.params.selector,
				command: singleAction.command,
				params: singleAction.params,
			})
				.then(() => {
					if (typeof entry.onAfterCommand === 'function')
					{
						return entry.onAfterCommand(singleAction);
					}

					return null;
				})
			);
		}
	});

	return BX.Landing.PageObject.getInstance().blocks()
		.then((blocks) => {
			const block = blocks.get(blockId);
			if (block)
			{
				block.forceInit();

				return scrollTo(block.node)
					.then(() =>
					{
						void highlight(block.node);
						if (Object.keys(updateBlockStateData).length > 0)
						{
							block.updateBlockState(updateBlockStateData, true);
						}
					});
			}
		})
		.then(() => {
			return commandQueue.reduce((promise, command) => {
				return promise.then(command);
			}, Promise.resolve());
		});
}

multiply.__contract = 'commandQueue.reduce((promise, command) => promise.then(command), Promise.resolve());';
