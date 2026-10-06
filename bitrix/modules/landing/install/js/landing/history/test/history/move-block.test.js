import moveBlock from '../../src/action/move-block';

let originalBXDescriptor;
let currentCollection = null;
let appendedNodes = [];
let scrollCalls = [];
let highlightCalls = [];

const restoreGlobal = (name, descriptor) => {
	if (descriptor)
	{
		Object.defineProperty(globalThis, name, descriptor);
	}
	else
	{
		delete globalThis[name];
	}
};

const createBlocksCollection = (blocksArray) => {
	const state = [...blocksArray];

	return {
		get: (blockId) => state.find((block) => `${block.id}` === `${blockId}`) || null,
		clear: () => {
			state.splice(0, state.length);
		},
		add: (block) => {
			state.push(block);
		},
		toArray: () => [...state],
	};
};

const createHistoryBlocks = (ids) => {
	const forceInitCalls = [];
	const area = document.createElement('div');
	area.className = 'landing-area';
	document.body.appendChild(area);
	appendedNodes.push(area);

	const blocks = ids.map((id) => {
		const node = document.createElement('div');
		node.className = 'block-wrapper';
		node.setAttribute('data-block-id', `${id}`);
		area.appendChild(node);

		return {
			id,
			node,
			forceInit: () => {
				forceInitCalls.push(id);
			},
		};
	});

	return {
		area,
		blocks,
		forceInitCalls,
		collection: createBlocksCollection(blocks),
	};
};

describe('History moveBlock', () => {
	beforeEach(() => {
		originalBXDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'BX');
		appendedNodes = [];
		scrollCalls = [];
		highlightCalls = [];
		currentCollection = null;

		Object.defineProperty(globalThis, 'BX', {
			value: {
				Landing: {
					Utils: {
						scrollTo: (node) => {
							scrollCalls.push(node?.getAttribute?.('data-block-id') || null);

							return Promise.resolve(node);
						},
						highlight: (node) => {
							highlightCalls.push(node?.getAttribute?.('data-block-id') || null);

							return Promise.resolve(node);
						},
					},
					PageObject: {
						getInstance: () => ({
							blocks: () => Promise.resolve(currentCollection),
						}),
					},
				},
			},
			writable: true,
			configurable: true,
		});
	});

	afterEach(() => {
		appendedNodes.forEach((node) => node.remove());
		restoreGlobal('BX', originalBXDescriptor);
		currentCollection = null;
	});

	it('Should reorder DOM and storage by explicit order and focus moved block', () => {
		const historyBlocks = createHistoryBlocks([101, 202, 303]);
		currentCollection = historyBlocks.collection;

		return moveBlock({
			params: {
				order: [303, 101, 202],
				movedIds: [303],
			},
		})
			.then(() => {
				assert.deepEqual(
					[...historyBlocks.area.children].map((node) => node.getAttribute('data-block-id')),
					['303', '101', '202'],
				);
				assert.deepEqual(
					historyBlocks.collection.toArray().map((block) => block.id),
					[303, 101, 202],
				);
				assert.deepEqual(historyBlocks.forceInitCalls, [303, 101, 202]);
				assert.deepEqual(scrollCalls, ['303']);
				assert.deepEqual(highlightCalls, ['303']);
			})
		;
	});

	it('Should focus the first ordered block when movedIds are absent', () => {
		const historyBlocks = createHistoryBlocks([101, 202]);
		currentCollection = historyBlocks.collection;

		return moveBlock({
			params: {
				order: [202, 101],
			},
		})
			.then(() => {
				assert.deepEqual(
					[...historyBlocks.area.children].map((node) => node.getAttribute('data-block-id')),
					['202', '101'],
				);
				assert.deepEqual(scrollCalls, ['202']);
				assert.deepEqual(highlightCalls, ['202']);
			})
		;
	});

	it('Should reject when order is empty without touching DOM or storage', () => {
		const historyBlocks = createHistoryBlocks([101, 202]);
		currentCollection = historyBlocks.collection;

		return moveBlock({
			params: {
				order: [],
				movedIds: [101],
			},
		})
			.then(() => {
				assert.fail('moveBlock() must reject for empty order');
			}, () => {
				assert.deepEqual(
					[...historyBlocks.area.children].map((node) => node.getAttribute('data-block-id')),
					['101', '202'],
				);
				assert.deepEqual(
					historyBlocks.collection.toArray().map((block) => block.id),
					[101, 202],
				);
				assert.deepEqual(historyBlocks.forceInitCalls, []);
				assert.deepEqual(scrollCalls, []);
				assert.deepEqual(highlightCalls, []);
			})
		;
	});

	it('Should reject when ordered block is missing from collection', () => {
		const historyBlocks = createHistoryBlocks([101, 202]);
		currentCollection = historyBlocks.collection;

		return moveBlock({
			params: {
				order: [202, 303, 101],
				movedIds: [202],
			},
		})
			.then(() => {
				assert.fail('moveBlock() must reject when block is missing');
			}, () => {
				assert.deepEqual(
					[...historyBlocks.area.children].map((node) => node.getAttribute('data-block-id')),
					['101', '202'],
				);
				assert.deepEqual(
					historyBlocks.collection.toArray().map((block) => block.id),
					[101, 202],
				);
				assert.deepEqual(historyBlocks.forceInitCalls, []);
			})
		;
	});

	it('Should reject when ordered block node is detached before move', () => {
		const historyBlocks = createHistoryBlocks([101, 202, 303]);
		currentCollection = historyBlocks.collection;
		historyBlocks.blocks[1].node.remove();

		return moveBlock({
			params: {
				order: [202, 101, 303],
				movedIds: [202],
			},
		})
			.then(() => {
				assert.fail('moveBlock() must reject when node is detached');
			}, () => {
				assert.deepEqual(
					[...historyBlocks.area.children].map((node) => node.getAttribute('data-block-id')),
					['101', '303'],
				);
				assert.deepEqual(
					historyBlocks.collection.toArray().map((block) => block.id),
					[101, 202, 303],
				);
				assert.deepEqual(historyBlocks.forceInitCalls, []);
				assert.deepEqual(scrollCalls, []);
				assert.deepEqual(highlightCalls, []);
			})
		;
	});
});
