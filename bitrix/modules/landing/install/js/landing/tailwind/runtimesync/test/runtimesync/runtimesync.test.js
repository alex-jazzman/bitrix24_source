import {
	TailwindRuntimeBatchSync,
	TailwindRuntimeSync,
	getPendingBlockIds,
	isPendingOperation,
	normalizeOperation,
	normalizeOperations,
} from '../../src/runtimesync';

describe('TailwindRuntimeSync', () => {
	let originalBXDescriptor;
	let originalRebuildAndSaveForWindow;

	beforeEach(() => {
		originalBXDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'BX');
		originalRebuildAndSaveForWindow = TailwindRuntimeSync.rebuildAndSaveForWindow;
	});

	afterEach(() => {
		TailwindRuntimeSync.rebuildAndSaveForWindow = originalRebuildAndSaveForWindow;

		if (originalBXDescriptor)
		{
			Object.defineProperty(globalThis, 'BX', originalBXDescriptor);
		}
		else
		{
			delete globalThis.BX;
		}
		document.head.innerHTML = '';
		document.body.innerHTML = '';
	});

	const mockBX = (value) => {
		Object.defineProperty(globalThis, 'BX', {
			value,
			writable: true,
			configurable: true,
		});
	};

	const createTargetWindow = () => {
		const targetDocument = document.implementation.createHTMLDocument('iframe');
		const targetWindow = {
			document: targetDocument,
			BX: {
				message: (code) => (code === 'SITE_TEMPLATE_PATH' ? '/site-template' : ''),
			},
			setTimeout,
			clearTimeout,
		};

		return {
			targetWindow,
			targetDocument,
		};
	};

	it('Should save rebuilt css with publish false', () => {
		const calls = [];
		const {targetWindow, targetDocument} = createTargetWindow();
		targetWindow.tailwind = {
			config: {},
		};

		mockBX({
			ajax: {
				runAction: (action, options) => {
					calls.push({action, options});

					return Promise.resolve({});
				},
			},
		});

		const promise = TailwindRuntimeSync.rebuildAndSaveForWindow(targetWindow, 77);
		const runtimeStyle = targetDocument.createElement('style');
		runtimeStyle.setAttribute('landing-tailwind-runtime', '1');
		runtimeStyle.textContent = '.compiled { display:block; }';
		targetDocument.head.appendChild(runtimeStyle);
		targetWindow.__landingTailwindRuntime.onCssReady(runtimeStyle.textContent);

		return promise.then((css) => {
			assert.equal(css, '.compiled { display:block; }');
			assert.deepEqual(calls, [
				{
					action: 'landing.tailwind.saveCss',
					options: {
						data: {
							landingId: 77,
							css: '.compiled { display:block; }',
							publish: false,
						},
					},
				},
			]);
			assert(targetDocument.head.querySelector('style[data-landing-tailwind-runtime-rebuild="1"]'));
		});
	});

		it('Should load tailwind runtime script when it is missing', () => {
			const {targetWindow, targetDocument} = createTargetWindow();
			const calls = [];

		mockBX({
			ajax: {
				runAction: (action, options) => {
					calls.push({action, options});

					return Promise.resolve({});
				},
			},
		});

		const promise = TailwindRuntimeSync.rebuildAndSaveForWindow(targetWindow, 88);
		const script = targetDocument.head.querySelector('script[data-landing-tailwind-runtime="1"]');
		assert(script);
		assert.equal(script.getAttribute('src'), '/site-template/assets/js/helpers/tailwind.js');
		targetWindow.tailwind = {
			config: {},
		};
		const loadEvent = targetDocument.createEvent('Event');
		loadEvent.initEvent('load', false, false);
		script.dispatchEvent(loadEvent);

		const runtimeStyle = targetDocument.createElement('style');
		runtimeStyle.setAttribute('landing-tailwind-runtime', '1');
		runtimeStyle.textContent = '.generated { color:red; }';
		targetDocument.head.appendChild(runtimeStyle);
		targetWindow.__landingTailwindRuntime.onCssReady(runtimeStyle.textContent);

		return promise.then(() => {
			assert.equal(calls.length, 1);
				assert.equal(calls[0].options.data.publish, false);
			});
		});

		it('Should use explicit helpers base path for runtime script', () => {
			const {targetWindow, targetDocument} = createTargetWindow();

			const promise = TailwindRuntimeSync.preloadRuntimeForWindow(
				targetWindow,
				{
					helpersBasePath: ' /custom/helpers/ ',
				},
			);
			const script = targetDocument.head.querySelector('script[data-landing-tailwind-runtime="1"]');
			assert(script);
			assert.equal(script.getAttribute('src'), '/custom/helpers/tailwind.js');

			targetWindow.tailwind = {
				config: {},
			};
			const loadEvent = targetDocument.createEvent('Event');
			loadEvent.initEvent('load', false, false);
			script.dispatchEvent(loadEvent);

			return promise;
		});

		it('Should not use Landing PageObject while resolving helpers base path', () => {
			const {targetWindow, targetDocument} = createTargetWindow();
			targetWindow.BX = {
				Landing: {
					PageObject: {
						getRootWindow: () => {
							throw new Error('PageObject fallback must not be used.');
						},
					},
				},
			};
			mockBX({
				Landing: {
					PageObject: {
						getRootWindow: () => {
							throw new Error('Global PageObject fallback must not be used.');
						},
					},
				},
			});

			const script = targetDocument.createElement('script');
			script.src = 'https://example.com/bitrix/templates/landing24/assets/js/helpers/tailwind-runtime-save.js?1';
			targetDocument.head.appendChild(script);

			assert.equal(
				TailwindRuntimeSync.getTailwindHelpersBasePath(targetWindow),
				'https://example.com/bitrix/templates/landing24/assets/js/helpers',
			);
		});

		it('Should preload tailwind runtime script without duplicates', () => {
			const {targetWindow, targetDocument} = createTargetWindow();

		const firstPromise = TailwindRuntimeSync.preloadRuntimeForWindow(targetWindow);
		const secondPromise = TailwindRuntimeSync.preloadRuntimeForWindow(targetWindow);
		const scripts = targetDocument.head.querySelectorAll('script[data-landing-tailwind-runtime="1"]');

		assert.equal(scripts.length, 1);
		assert.equal(scripts[0].getAttribute('src'), '/site-template/assets/js/helpers/tailwind.js');

		targetWindow.tailwind = {
			config: {},
		};
		const loadEvent = targetDocument.createEvent('Event');
		loadEvent.initEvent('load', false, false);
		scripts[0].dispatchEvent(loadEvent);

		return Promise.all([firstPromise, secondPromise]).then(() => {
			assert.equal(
				targetDocument.head.querySelectorAll('script[data-landing-tailwind-runtime="1"]').length,
				1,
			);
		});
	});

	it('Should resolve preload immediately when tailwind runtime is already available', () => {
		const {targetWindow, targetDocument} = createTargetWindow();
		targetWindow.tailwind = {
			config: {},
		};

		return TailwindRuntimeSync.preloadRuntimeForWindow(targetWindow).then(() => {
			assert.equal(targetDocument.head.querySelector('script[data-landing-tailwind-runtime="1"]'), null);
		});
	});

	it('Should reject when tailwind runtime script fails to load', () => {
		const {targetWindow, targetDocument} = createTargetWindow();

		mockBX({
			ajax: {
				runAction: () => Promise.resolve({}),
			},
		});

		const promise = TailwindRuntimeSync.waitForTailwindCss(targetWindow);
		const script = targetDocument.head.querySelector('script[data-landing-tailwind-runtime="1"]');
		const errorEvent = targetDocument.createEvent('Event');
		errorEvent.initEvent('error', false, false);
		script.dispatchEvent(errorEvent);

		return promise.then(() => {
			assert.fail('waitForTailwindCss() must reject on script error');
		}, (error) => {
			assert(error instanceof Error);
			assert(error.message.includes('Failed to load Tailwind runtime script'));
		});
	});

	it('Should reject when css readiness times out', () => {
		const clock = sinon.useFakeTimers();
		const {targetWindow} = createTargetWindow();
		targetWindow.tailwind = {
			config: {},
		};

		const promise = TailwindRuntimeSync.waitForTailwindCss(targetWindow);
		clock.tick(15001);

		return promise.then(() => {
			assert.fail('waitForTailwindCss() must reject on timeout');
		}, (error) => {
			assert(error instanceof Error);
			assert.equal(error.message, 'Tailwind CSS rebuild timed out.');
		}).finally(() => {
			clock.restore();
		});
	});

	it('Should render and clear pending style for affected blocks', () => {
		const {targetDocument} = createTargetWindow();
		const pendingBlockIds = new Set([101, 202]);

		TailwindRuntimeSync.renderPendingStyle(pendingBlockIds, targetDocument, 'landing-tailwind-test-pending-style');

		const style = targetDocument.getElementById('landing-tailwind-test-pending-style');
		assert.notStrictEqual(style, null);
		assert.equal(
			style.textContent,
			'[data-block-id="101"], #block101, .block-wrapper[data-id="101"], [data-block-id="202"], #block202, .block-wrapper[data-id="202"] { visibility: hidden !important; }',
		);

		pendingBlockIds.clear();
		TailwindRuntimeSync.renderPendingStyle(pendingBlockIds, targetDocument, 'landing-tailwind-test-pending-style');

		assert.strictEqual(targetDocument.getElementById('landing-tailwind-test-pending-style'), null);
	});

	it('Should replace existing pending style instead of appending duplicates', () => {
		const {targetDocument} = createTargetWindow();

		TailwindRuntimeSync.renderPendingStyle(
			new Set([101]),
			targetDocument,
			'landing-tailwind-test-pending-style',
		);
		TailwindRuntimeSync.renderPendingStyle(
			new Set([202]),
			targetDocument,
			'landing-tailwind-test-pending-style',
		);

		const styles = targetDocument.querySelectorAll('#landing-tailwind-test-pending-style');
		assert.equal(styles.length, 1);
		assert.equal(
			styles[0].textContent,
			'[data-block-id="202"], #block202, .block-wrapper[data-id="202"] { visibility: hidden !important; }',
		);
		assert.equal(styles[0].textContent.includes('101'), false);
	});

	it('Should document current pending selector validation boundary for non-positive ids', () => {
		const {targetDocument} = createTargetWindow();

		TailwindRuntimeSync.renderPendingStyle(
			new Set([0, -1, Number.NaN, 101]),
			targetDocument,
			'landing-tailwind-test-pending-style',
		);

		const style = targetDocument.getElementById('landing-tailwind-test-pending-style');
		assert.notStrictEqual(style, null);
		// TODO: move id validation here if renderPendingStyle becomes an untrusted input boundary.
		assert.equal(style.textContent.includes('[data-block-id="0"]'), true);
		assert.equal(style.textContent.includes('[data-block-id="-1"]'), true);
		assert.equal(style.textContent.includes('[data-block-id="NaN"]'), true);
		assert.equal(style.textContent.includes('[data-block-id="101"]'), true);
	});

	it('Should mark and unmark pending node preserving previous visibility', () => {
		const {targetDocument} = createTargetWindow();
		const node = targetDocument.createElement('div');
		node.style.visibility = 'collapse';

		TailwindRuntimeSync.markPendingNode(
			node,
			'data-tailwind-test-pending',
			'data-tailwind-test-previous-visibility',
		);

		assert.equal(node.getAttribute('data-tailwind-test-pending'), '1');
		assert.equal(node.getAttribute('data-tailwind-test-previous-visibility'), 'collapse');
		assert.equal(node.style.visibility, 'hidden');

		TailwindRuntimeSync.unmarkPendingNode(
			node,
			'data-tailwind-test-pending',
			'data-tailwind-test-previous-visibility',
		);

		assert.equal(node.hasAttribute('data-tailwind-test-pending'), false);
		assert.equal(node.hasAttribute('data-tailwind-test-previous-visibility'), false);
		assert.equal(node.style.visibility, 'collapse');
	});

	it('Should make markPendingNode idempotent and preserve original visibility only once', () => {
		const {targetDocument} = createTargetWindow();
		const node = targetDocument.createElement('div');
		node.style.visibility = 'collapse';

		TailwindRuntimeSync.markPendingNode(
			node,
			'data-tailwind-test-pending',
			'data-tailwind-test-previous-visibility',
		);
		TailwindRuntimeSync.markPendingNode(
			node,
			'data-tailwind-test-pending',
			'data-tailwind-test-previous-visibility',
		);
		TailwindRuntimeSync.unmarkPendingNode(
			node,
			'data-tailwind-test-pending',
			'data-tailwind-test-previous-visibility',
		);

		assert.equal(node.hasAttribute('data-tailwind-test-pending'), false);
		assert.equal(node.hasAttribute('data-tailwind-test-previous-visibility'), false);
		assert.equal(node.style.visibility, 'collapse');
	});

	it('Should unmark node without previous visibility attribute by clearing inline visibility', () => {
		const {targetDocument} = createTargetWindow();
		const node = targetDocument.createElement('div');
		node.style.visibility = 'hidden';
		node.setAttribute('data-tailwind-test-pending', '1');

		TailwindRuntimeSync.unmarkPendingNode(
			node,
			'data-tailwind-test-pending',
			'data-tailwind-test-previous-visibility',
		);

		assert.equal(node.hasAttribute('data-tailwind-test-pending'), false);
		assert.equal(node.style.visibility, '');
	});

	it('Should no-op mark and unmark for null nodes', () => {
		TailwindRuntimeSync.markPendingNode(
			null,
			'data-tailwind-test-pending',
			'data-tailwind-test-previous-visibility',
		);
		TailwindRuntimeSync.unmarkPendingNode(
			null,
			'data-tailwind-test-pending',
			'data-tailwind-test-previous-visibility',
		);
	});

	it('Should reload target window through shared recovery primitive', () => {
		const calls = [];
		const targetWindow = {
			location: {
				reload: () => {
					calls.push('reload');
				},
			},
		};

		TailwindRuntimeSync.reloadWindow(targetWindow);

		assert.deepEqual(calls, ['reload']);
	});

	it('Should reloadWindow no-op when target window has no location.reload', () => {
		TailwindRuntimeSync.reloadWindow({});
		TailwindRuntimeSync.reloadWindow({location: {}});
		TailwindRuntimeSync.reloadWindow(null);
	});

	it('Should restore previous onCssReady handler after waitForTailwindCss resolves', () => {
		const {targetWindow} = createTargetWindow();
		const calls = [];
		const previousOnCssReady = (css) => {
			calls.push(css);
		};
		targetWindow.tailwind = {
			config: {},
		};
		targetWindow.__landingTailwindRuntime = {
			onCssReady: previousOnCssReady,
		};

		const promise = TailwindRuntimeSync.waitForTailwindCss(targetWindow);
		targetWindow.__landingTailwindRuntime.onCssReady('.compiled { color: green; }');

		return promise.then((css) => {
			assert.equal(css, '.compiled { color: green; }');
			assert.deepEqual(calls, ['.compiled { color: green; }']);
			assert.equal(targetWindow.__landingTailwindRuntime.onCssReady, previousOnCssReady);
		});
	});

	it('Should clear timeout handler after waitForTailwindCss resolves', () => {
		const clock = sinon.useFakeTimers();
		const {targetWindow} = createTargetWindow();
		targetWindow.tailwind = {
			config: {},
		};

		const promise = TailwindRuntimeSync.waitForTailwindCss(targetWindow);
		targetWindow.__landingTailwindRuntime.onCssReady('.compiled { color: green; }');
		clock.tick(15001);

		return promise.then((css) => {
			assert.equal(css, '.compiled { color: green; }');
		}).finally(() => {
			clock.restore();
		});
	});

	it('Should reject and clean runtime callback after waitForTailwindCss timeout', () => {
		const clock = sinon.useFakeTimers();
		const {targetWindow} = createTargetWindow();
		const calls = [];
		const previousOnCssReady = (css) => {
			calls.push(css);
		};
		targetWindow.tailwind = {
			config: {},
		};
		targetWindow.__landingTailwindRuntime = {
			onCssReady: previousOnCssReady,
		};

		const promise = TailwindRuntimeSync.waitForTailwindCss(targetWindow);
		clock.tick(15001);

		return promise.then(() => {
			assert.fail('waitForTailwindCss() must reject on timeout');
		}, (error) => {
			assert(error instanceof Error);
			assert.equal(error.message, 'Tailwind CSS rebuild timed out.');
			assert.equal(targetWindow.__landingTailwindRuntime.onCssReady, previousOnCssReady);

			targetWindow.__landingTailwindRuntime.onCssReady('.late { color: red; }');
			assert.deepEqual(calls, ['.late { color: red; }']);
		}).finally(() => {
			clock.restore();
		});
	});

	it('Should reject when saveCss backend action fails', () => {
		const {targetWindow} = createTargetWindow();
		const failure = new Error('save failed');
		targetWindow.tailwind = {
			config: {},
		};

		mockBX({
			ajax: {
				runAction: () => Promise.reject(failure),
			},
		});

		const promise = TailwindRuntimeSync.rebuildAndSaveForWindow(targetWindow, 77);
		targetWindow.__landingTailwindRuntime.onCssReady('.compiled { color: green; }');

		return promise.then(() => {
			assert.fail('rebuildAndSaveForWindow() must reject when saveCss fails');
		}, (error) => {
			assert.equal(error, failure);
		});
	});
});

describe('TailwindRuntimeBatchSync', () => {
	let originalRebuildAndSaveForWindow;
	let batchSyncSourcePromise = null;

	beforeEach(() => {
		originalRebuildAndSaveForWindow = TailwindRuntimeSync.rebuildAndSaveForWindow;
	});

	afterEach(() => {
		TailwindRuntimeSync.rebuildAndSaveForWindow = originalRebuildAndSaveForWindow;
		document.head.innerHTML = '';
		document.body.innerHTML = '';
	});

	const createTargetWindow = () => {
		const targetDocument = document.implementation.createHTMLDocument('iframe');
		const targetWindow = {
			document: targetDocument,
		};

		return {
			targetWindow,
			targetDocument,
		};
	};

	const appendBlock = (targetDocument, blockId) => {
		const node = targetDocument.createElement('div');
		node.setAttribute('data-block-id', String(blockId));
		targetDocument.body.appendChild(node);

		return node;
	};

	const resolveBlockNode = (targetDocument) => {
		return (blockId) => targetDocument.querySelector(`[data-block-id="${blockId}"]`);
	};

	const countStringOccurrences = (haystack, needle) => {
		return String(haystack || '').split(needle).length - 1;
	};

	const isNode = () => {
		return typeof process === 'object'
			&& process !== null
			&& process.versions
			&& process.versions.node
			&& typeof __dirname === 'string'
		;
	};

	const getBundleMapUrl = () => {
		const script = [...document.scripts]
			.find((item) => String(item.src || '').includes('runtimesync.bundle.js'))
		;

		if (script)
		{
			return new URL('runtimesync.bundle.js.map', script.src).toString();
		}

		return '/bitrix/js/landing/tailwind/runtimesync/dist/runtimesync.bundle.js.map';
	};

	const getBatchSyncSource = () => {
		if (!batchSyncSourcePromise)
		{
			if (isNode())
			{
				const fs = process.getBuiltinModule('fs');
				const path = process.getBuiltinModule('path');

				batchSyncSourcePromise = Promise.resolve(
					fs.readFileSync(path.resolve(__dirname, '../../src/batch-sync.js'), 'utf8'),
				);
			}
			else
			{
				batchSyncSourcePromise = fetch(getBundleMapUrl())
					.then((response) => response.json())
					.then((map) => {
						const index = map.sources.findIndex((source) => source.endsWith('/src/batch-sync.js'));

						assert.notStrictEqual(index, -1);

						return map.sourcesContent[index];
					})
				;
			}
		}

		return batchSyncSourcePromise;
	};

	const createDeferred = () => {
		let resolve;
		let reject;
		const promise = new Promise((promiseResolve, promiseReject) => {
			resolve = promiseResolve;
			reject = promiseReject;
		});

		return {promise, resolve, reject};
	};

	const createConsumerBatch = ({
		consumer,
		operations,
		finalRebuildRequired,
		onFailure = null,
	}) => {
		const {targetWindow, targetDocument} = createTargetWindow();
		const pendingStyleId = `landing-tailwind-${consumer}-parity-pending-style`;
		const pendingAttribute = `data-tailwind-${consumer}-parity-pending`;
		const pendingVisibilityAttribute = `data-tailwind-${consumer}-parity-previous-visibility`;
		const batchSync = new TailwindRuntimeBatchSync({
			landingId: 77,
			targetWindow,
			targetDocument,
			pendingStyleId,
			pendingAttribute,
			pendingVisibilityAttribute,
			operations,
			resolveBlockNode: resolveBlockNode(targetDocument),
			finalRebuildRequired,
			onFailure,
		});

		return {
			consumer,
			targetWindow,
			targetDocument,
			pendingStyleId,
			pendingAttribute,
			batchSync,
			appendBlock: (blockId) => appendBlock(targetDocument, blockId),
			getBlock: (blockId) => targetDocument.querySelector(`[data-block-id="${blockId}"]`),
			getPendingStyle: () => targetDocument.getElementById(pendingStyleId),
		};
	};

	const createConsumerPair = (operations, onFailureMap = {}) => {
		const history = createConsumerBatch({
			consumer: 'history',
			operations,
			finalRebuildRequired: true,
			onFailure: onFailureMap.history,
		});
		const changeAiSite = createConsumerBatch({
			consumer: 'change-ai-site',
			operations,
			finalRebuildRequired: false,
			onFailure: onFailureMap.changeAiSite,
		});

		return [history, changeAiSite];
	};

	it('Should normalize canonical and legacy operation names', () => {
		assert.deepEqual(
			normalizeOperation({
				type: 'update_block',
				blockId: '101',
				raw: {test: true},
			}),
			{
				type: 'update_block',
				blockId: 101,
				raw: {test: true},
			},
		);
		assert.deepEqual(normalizeOperation({command: 'addBlock', id: 202}), {
			type: 'add_block',
			blockId: 202,
			raw: {
				command: 'addBlock',
				id: 202,
			},
		});
		assert.deepEqual(normalizeOperations([
			{type: 'move_block', blockId: 303},
			{type: 'unknown', blockId: 404},
			null,
		]), [
			{
				type: 'move_block',
				blockId: 303,
				raw: {
					type: 'move_block',
					blockId: 303,
				},
			},
		]);
	});

	it('Should expose shared pending policy', () => {
		const operations = [
			{type: 'update_block', blockId: 101},
			{type: 'add_block', blockId: 202},
			{type: 'delete_block', blockId: 303},
			{type: 'move_block', blockId: 404},
			{type: 'update_block', blockId: 101},
		];

		assert.equal(isPendingOperation({type: 'update_block', blockId: 101}), true);
		assert.equal(isPendingOperation({type: 'move_block', blockId: 101}), false);
		assert.deepEqual([...getPendingBlockIds(operations)], [101, 202]);
	});

	it('Should keep shared batch source contract for pending state and operation types', () => {
		return getBatchSyncSource().then((source) => {
			const pendingAssignmentPosition = source.indexOf('this.pendingBlockIds = getPendingBlockIds(this.operations);');
			const pendingTypesStartPosition = source.indexOf('const PENDING_OPERATION_TYPES = new Set([');
			const pendingTypesEndPosition = source.indexOf(']);', pendingTypesStartPosition);
			const pendingTypesSource = source.slice(pendingTypesStartPosition, pendingTypesEndPosition);

			assert.notStrictEqual(pendingAssignmentPosition, -1);
			assert.notStrictEqual(pendingTypesStartPosition, -1);
			assert.notStrictEqual(pendingTypesEndPosition, -1);
			assert.equal(pendingTypesSource.includes("'update_block'"), true);
			assert.equal(pendingTypesSource.includes("'add_block'"), true);
			assert.equal(pendingTypesSource.includes("'move_block'"), false);
			assert.equal(pendingTypesSource.includes("'delete_block'"), false);
		});
	});

	it('Should treat duplicate pending operations for the same block as one current-contract pending block', () => {
		const {targetWindow, targetDocument} = createTargetWindow();
		appendBlock(targetDocument, 101);
		appendBlock(targetDocument, 202);
		const batchSync = new TailwindRuntimeBatchSync({
			landingId: 77,
			targetWindow,
			targetDocument,
			pendingStyleId: 'landing-tailwind-test-pending-style',
			operations: [
				{type: 'update_block', blockId: 101},
				{type: 'update_block', blockId: 101},
				{type: 'add_block', blockId: 202},
			],
			resolveBlockNode: resolveBlockNode(targetDocument),
		});

		return batchSync.prepare().then(() => {
			const style = targetDocument.getElementById('landing-tailwind-test-pending-style');

			assert.deepEqual([...batchSync.getPendingBlockIds()], [101, 202]);
			assert.notStrictEqual(style, null);
			assert.equal(countStringOccurrences(style.textContent, '[data-block-id="101"]'), 1);
			assert.equal(countStringOccurrences(style.textContent, '#block101'), 1);
			assert.equal(countStringOccurrences(style.textContent, '.block-wrapper[data-id="101"]'), 1);
		});
	});

	it('Should not run a second incremental rebuild for a duplicate operation after the block was already revealed', () => {
		const {targetWindow, targetDocument} = createTargetWindow();
		const block = appendBlock(targetDocument, 101);
		const calls = [];
		TailwindRuntimeSync.rebuildAndSaveForWindow = () => {
			calls.push('rebuild');

			return Promise.resolve('compiled css');
		};
		const batchSync = new TailwindRuntimeBatchSync({
			landingId: 77,
			targetWindow,
			targetDocument,
			pendingStyleId: 'landing-tailwind-test-pending-style',
			pendingAttribute: 'data-tailwind-test-pending',
			pendingVisibilityAttribute: 'data-tailwind-test-previous-visibility',
			operations: [
				{type: 'update_block', blockId: 101},
				{type: 'update_block', blockId: 101},
			],
			resolveBlockNode: resolveBlockNode(targetDocument),
		});

		return batchSync.prepare()
			.then(() => batchSync.afterOperation({type: 'update_block', blockId: 101}))
			.then(() => batchSync.afterOperation({type: 'update_block', blockId: 101}))
			.then(() => {
				assert.deepEqual(calls, ['rebuild']);
				assert.equal(block.hasAttribute('data-tailwind-test-pending'), false);
				assert.deepEqual([...batchSync.getPendingBlockIds()], []);
			})
		;
	});

	it('Should keep duplicate operation contract explicit when finalizing after one duplicate was revealed', () => {
		const {targetWindow, targetDocument} = createTargetWindow();
		appendBlock(targetDocument, 101);
		const calls = [];
		TailwindRuntimeSync.rebuildAndSaveForWindow = () => {
			calls.push('rebuild');

			return Promise.resolve('compiled css');
		};
		const batchSync = new TailwindRuntimeBatchSync({
			landingId: 77,
			targetWindow,
			targetDocument,
			pendingStyleId: 'landing-tailwind-test-pending-style',
			operations: [
				{type: 'update_block', blockId: 101},
				{type: 'update_block', blockId: 101},
			],
			resolveBlockNode: resolveBlockNode(targetDocument),
			finalRebuildRequired: false,
		});

		return batchSync.prepare()
			.then(() => batchSync.afterOperation({type: 'update_block', blockId: 101}))
			.then(() => batchSync.finalize())
			.then(() => {
				assert.deepEqual(calls, ['rebuild']);
				assert.strictEqual(targetDocument.getElementById('landing-tailwind-test-pending-style'), null);
				assert.deepEqual([...batchSync.getPendingBlockIds()], []);
			})
		;
	});

	it('Should ignore invalid operations without creating pending selectors', () => {
		const {targetWindow, targetDocument} = createTargetWindow();
		const invalidOperations = [
			null,
			{},
			{type: 'unknown', blockId: 101},
			{type: 'update_block', blockId: 0},
			{type: 'add_block', blockId: -1},
			{type: 'update_block', blockId: 'abc'},
			{type: 'add_block'},
		];
		const batchSync = new TailwindRuntimeBatchSync({
			landingId: 77,
			targetWindow,
			targetDocument,
			pendingStyleId: 'landing-tailwind-test-pending-style',
			operations: invalidOperations,
			resolveBlockNode: resolveBlockNode(targetDocument),
		});

		assert.deepEqual(normalizeOperations(invalidOperations), []);
		assert.deepEqual([...batchSync.getPendingBlockIds()], []);

		return batchSync.prepare().then(() => {
			assert.strictEqual(targetDocument.getElementById('landing-tailwind-test-pending-style'), null);
		});
	});

	it('Should support all known operation aliases through one normalization contract', () => {
		const cases = [
			[{type: 'update_block', blockId: 101}, 'update_block', 101],
			[{action: 'add_block', block_id: 202}, 'add_block', 202],
			[{command: 'delete_block', id: 303}, 'delete_block', 303],
			[{type: 'move_block', blockId: 404}, 'move_block', 404],
			[{command: 'updateContent', blockId: 505}, 'update_block', 505],
			[{command: 'addBlock', block_id: 606}, 'add_block', 606],
			[{action: 'removeBlock', id: 707}, 'delete_block', 707],
			[{command: 'deleteBlock', blockId: 808}, 'delete_block', 808],
			[{command: 'moveBlock', blockId: 909}, 'move_block', 909],
		];

		cases.forEach(([operation, expectedType, expectedBlockId]) => {
			const normalizedOperation = normalizeOperation(operation);

			assert.equal(normalizedOperation.type, expectedType);
			assert.equal(normalizedOperation.blockId, expectedBlockId);
		});
		assert.deepEqual(
			[...getPendingBlockIds(cases.map(([operation]) => operation))],
			[101, 202, 505, 606],
		);
	});

	it('Should keep pending style selector guard when block node does not exist yet', () => {
		const {targetWindow, targetDocument} = createTargetWindow();
		const batchSync = new TailwindRuntimeBatchSync({
			landingId: 77,
			targetWindow,
			targetDocument,
			pendingStyleId: 'landing-tailwind-test-pending-style',
			operations: [
				{type: 'add_block', blockId: 303},
			],
			resolveBlockNode: () => null,
		});

		return batchSync.prepare().then(() => {
			const style = targetDocument.getElementById('landing-tailwind-test-pending-style');

			assert.notStrictEqual(style, null);
			assert.equal(
				style.textContent,
				'[data-block-id="303"], #block303, .block-wrapper[data-id="303"] { visibility: hidden !important; }',
			);
			assert.deepEqual([...batchSync.getPendingBlockIds()], [303]);
		});
	});

	it('Should mark fresh DOM node after add operation before rebuild and reveal it after rebuild', () => {
		const {targetWindow, targetDocument} = createTargetWindow();
		let resolveRebuild;
		TailwindRuntimeSync.rebuildAndSaveForWindow = () => {
			return new Promise((resolve) => {
				resolveRebuild = resolve;
			});
		};
		const batchSync = new TailwindRuntimeBatchSync({
			landingId: 77,
			targetWindow,
			targetDocument,
			pendingStyleId: 'landing-tailwind-test-pending-style',
			pendingAttribute: 'data-tailwind-test-pending',
			pendingVisibilityAttribute: 'data-tailwind-test-previous-visibility',
			operations: [
				{type: 'add_block', blockId: 303},
			],
			resolveBlockNode: resolveBlockNode(targetDocument),
		});

		return batchSync.prepare()
			.then(() => {
				const block = appendBlock(targetDocument, 303);
				const promise = batchSync.afterOperation({type: 'add_block', blockId: 303});

				assert.equal(block.getAttribute('data-tailwind-test-pending'), '1');
				assert.equal(block.style.visibility, 'hidden');

				resolveRebuild('compiled css');

				return promise.then(() => {
					assert.equal(block.hasAttribute('data-tailwind-test-pending'), false);
					assert.equal(block.style.visibility, '');
					assert.strictEqual(targetDocument.getElementById('landing-tailwind-test-pending-style'), null);
				});
			})
		;
	});

	it('Should recover when resolveBlockNode throws during prepare', () => {
		const {targetWindow, targetDocument} = createTargetWindow();
		const failure = new Error('resolve failed');
		const failureCalls = [];
		const batchSync = new TailwindRuntimeBatchSync({
			landingId: 77,
			targetWindow,
			targetDocument,
			operations: [
				{type: 'update_block', blockId: 101},
			],
			resolveBlockNode: () => {
				throw failure;
			},
			onFailure: (error, sync) => {
				failureCalls.push({error, sync});
			},
		});

		return batchSync.prepare().then(() => {
			assert.equal(batchSync.isFailed(), true);
			assert.deepEqual(failureCalls, [
				{
					error: failure,
					sync: batchSync,
				},
			]);
			assert.deepEqual([...batchSync.getPendingBlockIds()], [101]);
		});
	});

	it('Should recover when resolveBlockNode throws during afterOperation', () => {
		const {targetWindow, targetDocument} = createTargetWindow();
		appendBlock(targetDocument, 101);
		const failure = new Error('resolve failed');
		const failureCalls = [];
		const calls = [];
		let shouldThrow = false;
		TailwindRuntimeSync.rebuildAndSaveForWindow = () => {
			calls.push('rebuild');

			return Promise.resolve('compiled css');
		};
		const batchSync = new TailwindRuntimeBatchSync({
			landingId: 77,
			targetWindow,
			targetDocument,
			operations: [
				{type: 'update_block', blockId: 101},
			],
			resolveBlockNode: (blockId) => {
				if (shouldThrow)
				{
					throw failure;
				}

				return targetDocument.querySelector(`[data-block-id="${blockId}"]`);
			},
			onFailure: (error, sync) => {
				failureCalls.push({error, sync});
			},
		});

		return batchSync.prepare()
			.then(() => {
				shouldThrow = true;

				return batchSync.afterOperation({type: 'update_block', blockId: 101});
			})
			.then(() => batchSync.afterOperation({type: 'update_block', blockId: 101}))
			.then(() => batchSync.finalize())
			.then(() => {
				assert.equal(batchSync.isFailed(), true);
				assert.deepEqual(failureCalls, [
					{
						error: failure,
						sync: batchSync,
					},
				]);
				assert.deepEqual(calls, ['rebuild']);
				assert.deepEqual([...batchSync.getPendingBlockIds()], [101]);
			})
		;
	});

	it('Should call onFailure only once when multiple operations fail after failed state', () => {
		const {targetWindow, targetDocument} = createTargetWindow();
		appendBlock(targetDocument, 101);
		appendBlock(targetDocument, 202);
		const failure = new Error('tailwind failed');
		const failureCalls = [];
		const logger = {
			errors: [],
			error(message, error) {
				this.errors.push({message, error});
			},
		};
		TailwindRuntimeSync.rebuildAndSaveForWindow = () => Promise.reject(failure);
		const batchSync = new TailwindRuntimeBatchSync({
			landingId: 77,
			targetWindow,
			targetDocument,
			operations: [
				{type: 'update_block', blockId: 101},
				{type: 'add_block', blockId: 202},
			],
			resolveBlockNode: resolveBlockNode(targetDocument),
			onFailure: (error, sync) => {
				failureCalls.push({error, sync});
			},
			logger,
		});

		return batchSync.prepare()
			.then(() => batchSync.afterOperation({type: 'update_block', blockId: 101}))
			.then(() => batchSync.afterOperation({type: 'add_block', blockId: 202}))
			.then(() => batchSync.finalize())
			.then(() => {
				assert.equal(failureCalls.length, 1);
				assert.equal(failureCalls[0].error, failure);
				assert.equal(failureCalls[0].sync, batchSync);
				assert.deepEqual(logger.errors, [
					{
						message: 'TailwindRuntimeBatchSync failed.',
						error: failure,
					},
				]);
			})
		;
	});

	it('Should log shared batch failure once per failed batch', () => {
		const failure = new Error('tailwind failed');
		const lateFailure = new Error('late tailwind failed');
		const logger = {
			errors: [],
			error(message, error) {
				this.errors.push({message, error});
			},
		};
		const batchSync = new TailwindRuntimeBatchSync({
			operations: [
				{type: 'update_block', blockId: 101},
			],
			logger,
		});

		batchSync.fail(failure);
		batchSync.fail(lateFailure);

		assert.equal(batchSync.isFailed(), true);
		assert.equal(batchSync.failureError, failure);
		assert.deepEqual(logger.errors, [
			{
				message: 'TailwindRuntimeBatchSync failed.',
				error: failure,
			},
		]);
	});

	it('Should log but not replace original failure when onFailure throws', () => {
		const {targetWindow, targetDocument} = createTargetWindow();
		appendBlock(targetDocument, 101);
		const failure = new Error('tailwind failed');
		const callbackFailure = new Error('reload failed');
		const logger = {
			errors: [],
			error(message, error) {
				this.errors.push({message, error});
			},
		};
		TailwindRuntimeSync.rebuildAndSaveForWindow = () => Promise.reject(failure);
		const batchSync = new TailwindRuntimeBatchSync({
			landingId: 77,
			targetWindow,
			targetDocument,
			operations: [
				{type: 'update_block', blockId: 101},
			],
			resolveBlockNode: resolveBlockNode(targetDocument),
			onFailure: () => {
				throw callbackFailure;
			},
			logger,
		});

		return batchSync.prepare()
			.then(() => batchSync.afterOperation({type: 'update_block', blockId: 101}))
			.then(() => {
				assert.equal(batchSync.isFailed(), true);
				assert.equal(batchSync.failureError, failure);
				assert.deepEqual(logger.errors, [
					{
						message: 'TailwindRuntimeBatchSync failed.',
						error: failure,
					},
					{
						message: 'TailwindRuntimeBatchSync failed.',
						error: callbackFailure,
					},
				]);
			})
		;
	});

	it('Should return defensive copy from getPendingBlockIds', () => {
		const batchSync = new TailwindRuntimeBatchSync({
			operations: [
				{type: 'update_block', blockId: 101},
			],
		});
		const pendingBlockIds = batchSync.getPendingBlockIds();

		pendingBlockIds.clear();
		pendingBlockIds.add(202);

		assert.deepEqual([...batchSync.getPendingBlockIds()], [101]);
	});

	it('Should allow prepare to be called twice without duplicating style nodes or losing pending state', () => {
		const {targetWindow, targetDocument} = createTargetWindow();
		const firstBlock = appendBlock(targetDocument, 101);
		const secondBlock = appendBlock(targetDocument, 202);
		const batchSync = new TailwindRuntimeBatchSync({
			landingId: 77,
			targetWindow,
			targetDocument,
			pendingStyleId: 'landing-tailwind-test-pending-style',
			pendingAttribute: 'data-tailwind-test-pending',
			pendingVisibilityAttribute: 'data-tailwind-test-previous-visibility',
			operations: [
				{type: 'update_block', blockId: 101},
				{type: 'add_block', blockId: 202},
			],
			resolveBlockNode: resolveBlockNode(targetDocument),
		});

		return batchSync.prepare()
			.then(() => batchSync.prepare())
			.then(() => {
				assert.equal(targetDocument.querySelectorAll('#landing-tailwind-test-pending-style').length, 1);
				assert.equal(firstBlock.getAttribute('data-tailwind-test-pending'), '1');
				assert.equal(secondBlock.getAttribute('data-tailwind-test-pending'), '1');
				assert.deepEqual([...batchSync.getPendingBlockIds()], [101, 202]);
			})
		;
	});

	it('Should skip all work after fail was called manually', () => {
		const {targetWindow, targetDocument} = createTargetWindow();
		appendBlock(targetDocument, 101);
		const failure = new Error('manual failure');
		const calls = [];
		TailwindRuntimeSync.rebuildAndSaveForWindow = () => {
			calls.push('rebuild');

			return Promise.resolve('compiled css');
		};
		const batchSync = new TailwindRuntimeBatchSync({
			landingId: 77,
			targetWindow,
			targetDocument,
			pendingStyleId: 'landing-tailwind-test-pending-style',
			operations: [
				{type: 'update_block', blockId: 101},
			],
			resolveBlockNode: resolveBlockNode(targetDocument),
		});

		return batchSync.prepare()
			.then(() => {
				batchSync.fail(failure);

				return batchSync.afterOperation({type: 'update_block', blockId: 101});
			})
			.then(() => batchSync.finalize())
			.then(() => {
				assert.deepEqual(calls, []);
				assert.notStrictEqual(targetDocument.getElementById('landing-tailwind-test-pending-style'), null);
				assert.deepEqual([...batchSync.getPendingBlockIds()], [101]);
			})
		;
	});

	it('Should not throw when targetDocument or targetDocument.head is missing', () => {
		const nullDocumentBatchSync = new TailwindRuntimeBatchSync({
			operations: [
				{type: 'update_block', blockId: 101},
			],
			targetDocument: null,
		});
		const headlessDocumentBatchSync = new TailwindRuntimeBatchSync({
			operations: [
				{type: 'add_block', blockId: 202},
			],
			targetDocument: {
				getElementById: () => null,
			},
		});

		return nullDocumentBatchSync.prepare()
			.then(() => headlessDocumentBatchSync.prepare())
			.then(() => {
				assert.deepEqual([...nullDocumentBatchSync.getPendingBlockIds()], [101]);
				assert.deepEqual([...headlessDocumentBatchSync.getPendingBlockIds()], [202]);
			})
		;
	});

	it('Should prepare pending style and mark existing pending nodes', () => {
		const {targetWindow, targetDocument} = createTargetWindow();
		const firstBlock = appendBlock(targetDocument, 101);
		const secondBlock = appendBlock(targetDocument, 202);
		appendBlock(targetDocument, 303);
		const batchSync = new TailwindRuntimeBatchSync({
			landingId: 77,
			targetWindow,
			targetDocument,
			pendingStyleId: 'landing-tailwind-test-pending-style',
			pendingAttribute: 'data-tailwind-test-pending',
			pendingVisibilityAttribute: 'data-tailwind-test-previous-visibility',
			operations: [
				{type: 'update_block', blockId: 101},
				{type: 'add_block', blockId: 202},
				{type: 'delete_block', blockId: 303},
			],
			resolveBlockNode: resolveBlockNode(targetDocument),
		});

		return batchSync.prepare().then((pendingBlockIds) => {
			assert.deepEqual([...pendingBlockIds], [101, 202]);
			assert.equal(firstBlock.getAttribute('data-tailwind-test-pending'), '1');
			assert.equal(secondBlock.getAttribute('data-tailwind-test-pending'), '1');
			assert.equal(firstBlock.style.visibility, 'hidden');
			assert.equal(secondBlock.style.visibility, 'hidden');
			assert.notStrictEqual(targetDocument.getElementById('landing-tailwind-test-pending-style'), null);
		});
	});

	it('Should rebuild and reveal only completed pending operation', () => {
		const {targetWindow, targetDocument} = createTargetWindow();
		const firstBlock = appendBlock(targetDocument, 101);
		const secondBlock = appendBlock(targetDocument, 202);
		const calls = [];
			TailwindRuntimeSync.rebuildAndSaveForWindow = (actualWindow, landingId, options) => {
				calls.push({actualWindow, landingId, options});

			return Promise.resolve('compiled css');
		};
		const batchSync = new TailwindRuntimeBatchSync({
			landingId: 77,
			targetWindow,
			targetDocument,
			pendingStyleId: 'landing-tailwind-test-pending-style',
			pendingAttribute: 'data-tailwind-test-pending',
			pendingVisibilityAttribute: 'data-tailwind-test-previous-visibility',
				operations: [
					{type: 'update_block', blockId: 101},
					{type: 'add_block', blockId: 202},
				],
				helpersBasePath: '/batch/helpers',
				resolveBlockNode: resolveBlockNode(targetDocument),
			});

		return batchSync.prepare()
			.then(() => batchSync.afterOperation({type: 'update_block', blockId: 101}))
			.then(() => {
					assert.equal(calls.length, 1);
					assert.equal(calls[0].actualWindow, targetWindow);
					assert.equal(calls[0].landingId, 77);
					assert.deepEqual(calls[0].options, {
						helpersBasePath: '/batch/helpers',
					});
					assert.equal(firstBlock.hasAttribute('data-tailwind-test-pending'), false);
				assert.equal(firstBlock.style.visibility, '');
				assert.equal(secondBlock.getAttribute('data-tailwind-test-pending'), '1');
				assert.equal(secondBlock.style.visibility, 'hidden');
				assert.deepEqual([...batchSync.getPendingBlockIds()], [202]);
				assert.equal(
					targetDocument.getElementById('landing-tailwind-test-pending-style').textContent,
					'[data-block-id="202"], #block202, .block-wrapper[data-id="202"] { visibility: hidden !important; }',
				);
			})
		;
	});

	it('Should skip rebuild for non-pending operations', () => {
		const {targetWindow, targetDocument} = createTargetWindow();
		const calls = [];
		TailwindRuntimeSync.rebuildAndSaveForWindow = () => {
			calls.push('rebuild');

			return Promise.resolve('compiled css');
		};
		const batchSync = new TailwindRuntimeBatchSync({
			landingId: 77,
			targetWindow,
			targetDocument,
			operations: [
				{type: 'move_block', blockId: 101},
			],
			resolveBlockNode: resolveBlockNode(targetDocument),
		});

		return batchSync.prepare()
			.then(() => batchSync.afterOperation({type: 'move_block', blockId: 101}))
			.then(() => {
				assert.deepEqual(calls, []);
				assert.deepEqual([...batchSync.getPendingBlockIds()], []);
			})
		;
	});

	it('Should finalize remaining pending operations with one rebuild and clear pending style', () => {
		const {targetWindow, targetDocument} = createTargetWindow();
		const firstBlock = appendBlock(targetDocument, 101);
		const secondBlock = appendBlock(targetDocument, 202);
		const calls = [];
		TailwindRuntimeSync.rebuildAndSaveForWindow = () => {
			calls.push('rebuild');

			return Promise.resolve('compiled css');
		};
		const batchSync = new TailwindRuntimeBatchSync({
			landingId: 77,
			targetWindow,
			targetDocument,
			pendingStyleId: 'landing-tailwind-test-pending-style',
			pendingAttribute: 'data-tailwind-test-pending',
			pendingVisibilityAttribute: 'data-tailwind-test-previous-visibility',
			operations: [
				{type: 'update_block', blockId: 101},
				{type: 'add_block', blockId: 202},
			],
			resolveBlockNode: resolveBlockNode(targetDocument),
		});

		return batchSync.prepare()
			.then(() => batchSync.finalize())
			.then(() => {
				assert.deepEqual(calls, ['rebuild']);
				assert.equal(firstBlock.hasAttribute('data-tailwind-test-pending'), false);
				assert.equal(secondBlock.hasAttribute('data-tailwind-test-pending'), false);
				assert.strictEqual(targetDocument.getElementById('landing-tailwind-test-pending-style'), null);
				assert.deepEqual([...batchSync.getPendingBlockIds()], []);
			})
		;
	});

	it('Should skip final rebuild when pending is empty and final rebuild is not required', () => {
		const {targetWindow, targetDocument} = createTargetWindow();
		appendBlock(targetDocument, 101);
		const calls = [];
		TailwindRuntimeSync.rebuildAndSaveForWindow = () => {
			calls.push('rebuild');

			return Promise.resolve('compiled css');
		};
		const batchSync = new TailwindRuntimeBatchSync({
			landingId: 77,
			targetWindow,
			targetDocument,
			operations: [
				{type: 'update_block', blockId: 101},
			],
			resolveBlockNode: resolveBlockNode(targetDocument),
			finalRebuildRequired: false,
		});

		return batchSync.prepare()
			.then(() => batchSync.afterOperation({type: 'update_block', blockId: 101}))
			.then(() => batchSync.finalize())
			.then(() => {
				assert.deepEqual(calls, ['rebuild']);
				assert.equal(batchSync.getPendingBlockIds().size, 0);
			})
		;
	});

	it('Should run final rebuild when final rebuild is required after incremental reveal', () => {
		const {targetWindow, targetDocument} = createTargetWindow();
		appendBlock(targetDocument, 101);
		const calls = [];
		TailwindRuntimeSync.rebuildAndSaveForWindow = () => {
			calls.push('rebuild');

			return Promise.resolve('compiled css');
		};
		const batchSync = new TailwindRuntimeBatchSync({
			landingId: 77,
			targetWindow,
			targetDocument,
			operations: [
				{type: 'update_block', blockId: 101},
			],
			resolveBlockNode: resolveBlockNode(targetDocument),
			finalRebuildRequired: true,
		});

		return batchSync.prepare()
			.then(() => batchSync.afterOperation({type: 'update_block', blockId: 101}))
			.then(() => batchSync.finalize())
			.then(() => {
				assert.deepEqual(calls, ['rebuild', 'rebuild']);
				assert.equal(batchSync.getPendingBlockIds().size, 0);
			})
		;
	});

	it('Should keep pending nodes hidden after rebuild failure', () => {
		const {targetWindow, targetDocument} = createTargetWindow();
		const firstBlock = appendBlock(targetDocument, 101);
		const failure = new Error('tailwind failed');
		const failureCalls = [];
		TailwindRuntimeSync.rebuildAndSaveForWindow = () => Promise.reject(failure);
		const batchSync = new TailwindRuntimeBatchSync({
			landingId: 77,
			targetWindow,
			targetDocument,
			pendingStyleId: 'landing-tailwind-test-pending-style',
			pendingAttribute: 'data-tailwind-test-pending',
			pendingVisibilityAttribute: 'data-tailwind-test-previous-visibility',
			operations: [
				{type: 'update_block', blockId: 101},
			],
			resolveBlockNode: resolveBlockNode(targetDocument),
			onFailure: (error, sync) => {
				failureCalls.push({error, sync});
			},
		});

		return batchSync.prepare()
			.then(() => batchSync.afterOperation({type: 'update_block', blockId: 101}))
			.then(() => batchSync.finalize())
			.then(() => {
				assert.equal(batchSync.isFailed(), true);
				assert.deepEqual(failureCalls, [
					{
						error: failure,
						sync: batchSync,
					},
				]);
				assert.equal(firstBlock.getAttribute('data-tailwind-test-pending'), '1');
				assert.equal(firstBlock.style.visibility, 'hidden');
				assert.notStrictEqual(targetDocument.getElementById('landing-tailwind-test-pending-style'), null);
				assert.deepEqual([...batchSync.getPendingBlockIds()], [101]);
			})
		;
	});

	it('Should keep pending style correct while rebuild promise is unresolved', () => {
		const {targetWindow, targetDocument} = createTargetWindow();
		const firstBlock = appendBlock(targetDocument, 101);
		const secondBlock = appendBlock(targetDocument, 202);
		const firstRebuild = createDeferred();
		const secondRebuild = createDeferred();
		const rebuildQueue = [firstRebuild, secondRebuild];
		const calls = [];

		TailwindRuntimeSync.rebuildAndSaveForWindow = () => {
			calls.push('rebuild');

			return rebuildQueue[calls.length - 1].promise;
		};
		const batchSync = new TailwindRuntimeBatchSync({
			landingId: 77,
			targetWindow,
			targetDocument,
			pendingStyleId: 'landing-tailwind-test-pending-style',
			pendingAttribute: 'data-tailwind-test-pending',
			pendingVisibilityAttribute: 'data-tailwind-test-previous-visibility',
			operations: [
				{type: 'update_block', blockId: 101},
				{type: 'update_block', blockId: 202},
			],
			resolveBlockNode: resolveBlockNode(targetDocument),
		});

		return batchSync.prepare()
			.then(() => {
				const firstReveal = batchSync.afterOperation({type: 'update_block', blockId: 101});
				const style = targetDocument.getElementById('landing-tailwind-test-pending-style');

				assert.equal(calls.length, 1);
				assert.equal(style.textContent.includes('[data-block-id="101"]'), true);
				assert.equal(style.textContent.includes('[data-block-id="202"]'), true);
				assert.equal(firstBlock.style.visibility, 'hidden');
				assert.equal(secondBlock.style.visibility, 'hidden');
				firstRebuild.resolve('compiled css');

				return firstReveal;
			})
			.then(() => {
				const secondReveal = batchSync.afterOperation({type: 'update_block', blockId: 202});
				const style = targetDocument.getElementById('landing-tailwind-test-pending-style');

				assert.equal(calls.length, 2);
				assert.equal(style.textContent.includes('[data-block-id="101"]'), false);
				assert.equal(style.textContent.includes('[data-block-id="202"]'), true);
				assert.equal(firstBlock.style.visibility, '');
				assert.equal(secondBlock.style.visibility, 'hidden');
				secondRebuild.resolve('compiled css');

				return secondReveal;
			})
			.then(() => {
				assert.strictEqual(targetDocument.getElementById('landing-tailwind-test-pending-style'), null);
				assert.equal(firstBlock.style.visibility, '');
				assert.equal(secondBlock.style.visibility, '');
			})
		;
	});

	it('Should ignore late rebuild resolution after failed state', () => {
		const {targetWindow, targetDocument} = createTargetWindow();
		const firstBlock = appendBlock(targetDocument, 101);
		const secondBlock = appendBlock(targetDocument, 202);
		const firstRebuild = createDeferred();
		const secondRebuild = createDeferred();
		const rebuildQueue = [firstRebuild, secondRebuild];
		const failure = new Error('tailwind failed');
		const failureCalls = [];
		const calls = [];

		TailwindRuntimeSync.rebuildAndSaveForWindow = () => {
			calls.push('rebuild');

			return rebuildQueue[calls.length - 1].promise;
		};
		const batchSync = new TailwindRuntimeBatchSync({
			landingId: 77,
			targetWindow,
			targetDocument,
			pendingStyleId: 'landing-tailwind-test-pending-style',
			pendingAttribute: 'data-tailwind-test-pending',
			pendingVisibilityAttribute: 'data-tailwind-test-previous-visibility',
			operations: [
				{type: 'update_block', blockId: 101},
				{type: 'update_block', blockId: 202},
			],
			resolveBlockNode: resolveBlockNode(targetDocument),
			onFailure: (error, sync) => {
				failureCalls.push({error, sync});
			},
		});

		return batchSync.prepare()
			.then(() => {
				const firstReveal = batchSync.afterOperation({type: 'update_block', blockId: 101});
				const secondReveal = batchSync.afterOperation({type: 'update_block', blockId: 202});

				assert.deepEqual(calls, ['rebuild', 'rebuild']);
				firstRebuild.reject(failure);

				return firstReveal.then(() => {
					assert.equal(batchSync.isFailed(), true);
					secondRebuild.resolve('compiled css');

					return secondReveal;
				});
			})
			.then(() => {
				assert.deepEqual(failureCalls, [
					{
						error: failure,
						sync: batchSync,
					},
				]);
				assert.deepEqual([...batchSync.getPendingBlockIds()], [101, 202]);
				assert.equal(firstBlock.getAttribute('data-tailwind-test-pending'), '1');
				assert.equal(secondBlock.getAttribute('data-tailwind-test-pending'), '1');
				assert.equal(firstBlock.style.visibility, 'hidden');
				assert.equal(secondBlock.style.visibility, 'hidden');
				assert.equal(targetDocument.getElementById('landing-tailwind-test-pending-style').textContent.includes('[data-block-id="101"]'), true);
				assert.equal(targetDocument.getElementById('landing-tailwind-test-pending-style').textContent.includes('[data-block-id="202"]'), true);
			})
		;
	});

	it('Should keep state stable when finalize is called before any afterOperation', () => {
		const {targetWindow, targetDocument} = createTargetWindow();
		const firstBlock = appendBlock(targetDocument, 101);
		const secondBlock = appendBlock(targetDocument, 202);
		const finalRebuild = createDeferred();
		const calls = [];

		TailwindRuntimeSync.rebuildAndSaveForWindow = () => {
			calls.push('rebuild');

			return finalRebuild.promise;
		};
		const batchSync = new TailwindRuntimeBatchSync({
			landingId: 77,
			targetWindow,
			targetDocument,
			pendingStyleId: 'landing-tailwind-test-pending-style',
			pendingAttribute: 'data-tailwind-test-pending',
			pendingVisibilityAttribute: 'data-tailwind-test-previous-visibility',
			operations: [
				{type: 'update_block', blockId: 101},
				{type: 'add_block', blockId: 202},
			],
			resolveBlockNode: resolveBlockNode(targetDocument),
			finalRebuildRequired: false,
		});

		return batchSync.prepare()
			.then(() => {
				const finalizePromise = batchSync.finalize();
				const style = targetDocument.getElementById('landing-tailwind-test-pending-style');

				assert.deepEqual(calls, ['rebuild']);
				assert.equal(style.textContent.includes('[data-block-id="101"]'), true);
				assert.equal(style.textContent.includes('[data-block-id="202"]'), true);
				assert.equal(firstBlock.getAttribute('data-tailwind-test-pending'), '1');
				assert.equal(secondBlock.getAttribute('data-tailwind-test-pending'), '1');
				assert.equal(firstBlock.style.visibility, 'hidden');
				assert.equal(secondBlock.style.visibility, 'hidden');
				finalRebuild.resolve('compiled css');

				return finalizePromise;
			})
			.then(() => {
				assert.strictEqual(targetDocument.getElementById('landing-tailwind-test-pending-style'), null);
				assert.equal(firstBlock.hasAttribute('data-tailwind-test-pending'), false);
				assert.equal(secondBlock.hasAttribute('data-tailwind-test-pending'), false);
				assert.equal(firstBlock.style.visibility, '');
				assert.equal(secondBlock.style.visibility, '');
				assert.deepEqual([...batchSync.getPendingBlockIds()], []);
			})
		;
	});

	it('Should keep state stable when afterOperation is called before prepare', () => {
		const {targetWindow, targetDocument} = createTargetWindow();
		const firstBlock = appendBlock(targetDocument, 101);
		const rebuild = createDeferred();
		const calls = [];

		TailwindRuntimeSync.rebuildAndSaveForWindow = () => {
			calls.push('rebuild');

			return rebuild.promise;
		};
		const batchSync = new TailwindRuntimeBatchSync({
			landingId: 77,
			targetWindow,
			targetDocument,
			pendingStyleId: 'landing-tailwind-test-pending-style',
			pendingAttribute: 'data-tailwind-test-pending',
			pendingVisibilityAttribute: 'data-tailwind-test-previous-visibility',
			operations: [
				{type: 'update_block', blockId: 101},
			],
			resolveBlockNode: resolveBlockNode(targetDocument),
			finalRebuildRequired: false,
		});
		const revealPromise = batchSync.afterOperation({type: 'update_block', blockId: 101});

		assert.deepEqual(calls, ['rebuild']);
		assert.strictEqual(targetDocument.getElementById('landing-tailwind-test-pending-style'), null);
		assert.equal(firstBlock.getAttribute('data-tailwind-test-pending'), '1');
		assert.equal(firstBlock.style.visibility, 'hidden');
		rebuild.resolve('compiled css');

		return revealPromise
			.then(() => batchSync.prepare())
			.then(() => batchSync.finalize())
			.then(() => {
				assert.strictEqual(targetDocument.getElementById('landing-tailwind-test-pending-style'), null);
				assert.equal(firstBlock.hasAttribute('data-tailwind-test-pending'), false);
				assert.equal(firstBlock.style.visibility, '');
				assert.deepEqual([...batchSync.getPendingBlockIds()], []);
				assert.deepEqual(calls, ['rebuild']);
			})
		;
	});

	it('Should keep the same pending policy for History and ChangeAiSite', () => {
		const operations = [
			{type: 'update_block', blockId: 101},
			{type: 'add_block', blockId: 202},
			{type: 'move_block', blockId: 303},
			{type: 'delete_block', blockId: 404},
		];
		const contexts = createConsumerPair(operations);
		const rebuildCalls = [];
		const windowToConsumer = new Map(contexts.map((context) => [context.targetWindow, context.consumer]));

		contexts.forEach((context) => {
			[101, 202, 303, 404].forEach(context.appendBlock);
		});
		TailwindRuntimeSync.rebuildAndSaveForWindow = (targetWindow) => {
			rebuildCalls.push(windowToConsumer.get(targetWindow));

			return Promise.resolve('compiled css');
		};

		return Promise.all(contexts.map((context) => context.batchSync.prepare()))
			.then(() => {
				contexts.forEach((context) => {
					const style = context.getPendingStyle();

					assert.deepEqual([...context.batchSync.getPendingBlockIds()], [101, 202]);
					assert.equal(style.textContent.includes('[data-block-id="101"]'), true);
					assert.equal(style.textContent.includes('[data-block-id="202"]'), true);
					assert.equal(style.textContent.includes('[data-block-id="303"]'), false);
					assert.equal(style.textContent.includes('[data-block-id="404"]'), false);
					assert.equal(context.getBlock(303).hasAttribute(context.pendingAttribute), false);
					assert.equal(context.getBlock(404).hasAttribute(context.pendingAttribute), false);
				});

				return Promise.all(contexts.flatMap((context) => [
					context.batchSync.afterOperation({type: 'move_block', blockId: 303}),
					context.batchSync.afterOperation({type: 'delete_block', blockId: 404}),
				]));
			})
			.then(() => {
				assert.deepEqual(rebuildCalls, []);

				return Promise.all(contexts.map((context) => {
					return context.batchSync.afterOperation({type: 'update_block', blockId: 101})
						.then(() => context.batchSync.afterOperation({type: 'add_block', blockId: 202}))
						.then(() => context.batchSync.finalize())
					;
				}));
			})
			.then(() => {
				contexts.forEach((context) => {
					assert.equal(context.getBlock(101).hasAttribute(context.pendingAttribute), false);
					assert.equal(context.getBlock(101).style.visibility, '');
					assert.equal(context.getBlock(202).hasAttribute(context.pendingAttribute), false);
					assert.equal(context.getBlock(202).style.visibility, '');
					assert.strictEqual(context.getPendingStyle(), null);
					assert.deepEqual([...context.batchSync.getPendingBlockIds()], []);
				});
				assert.equal(rebuildCalls.filter((consumer) => consumer === 'history').length, 3);
				assert.equal(rebuildCalls.filter((consumer) => consumer === 'change-ai-site').length, 2);
			})
		;
	});

	it('Should reveal two updated blocks one by one in both History and ChangeAiSite', () => {
		const operations = [
			{type: 'update_block', blockId: 101},
			{type: 'update_block', blockId: 202},
		];
		const contexts = createConsumerPair(operations);
		const deferredsByConsumer = {
			history: [createDeferred(), createDeferred()],
			'change-ai-site': [createDeferred(), createDeferred()],
		};
		const rebuildCountByConsumer = {
			history: 0,
			'change-ai-site': 0,
		};
		const windowToConsumer = new Map(contexts.map((context) => [context.targetWindow, context.consumer]));

		contexts.forEach((context) => {
			context.appendBlock(101);
			context.appendBlock(202);
		});
		TailwindRuntimeSync.rebuildAndSaveForWindow = (targetWindow) => {
			const consumer = windowToConsumer.get(targetWindow);
			const index = rebuildCountByConsumer[consumer];
			rebuildCountByConsumer[consumer]++;

			return deferredsByConsumer[consumer][index].promise;
		};

		return Promise.all(contexts.map((context) => context.batchSync.prepare()))
			.then(() => {
				contexts.forEach((context) => {
					assert.equal(context.getBlock(101).style.visibility, 'hidden');
					assert.equal(context.getBlock(202).style.visibility, 'hidden');
				});

				const firstRevealPromises = contexts.map((context) => {
					return context.batchSync.afterOperation({type: 'update_block', blockId: 101});
				});

				contexts.forEach((context) => {
					assert.equal(context.getBlock(101).style.visibility, 'hidden');
					assert.equal(context.getBlock(202).style.visibility, 'hidden');
					deferredsByConsumer[context.consumer][0].resolve('compiled css');
				});

				return Promise.all(firstRevealPromises);
			})
			.then(() => {
				contexts.forEach((context) => {
					assert.equal(context.getBlock(101).style.visibility, '');
					assert.equal(context.getBlock(202).style.visibility, 'hidden');
					assert.equal(context.getPendingStyle().textContent.includes('[data-block-id="101"]'), false);
					assert.equal(context.getPendingStyle().textContent.includes('[data-block-id="202"]'), true);
				});

				const secondRevealPromises = contexts.map((context) => {
					return context.batchSync.afterOperation({type: 'update_block', blockId: 202});
				});

				contexts.forEach((context) => {
					assert.equal(context.getBlock(202).style.visibility, 'hidden');
					deferredsByConsumer[context.consumer][1].resolve('compiled css');
				});

				return Promise.all(secondRevealPromises);
			})
			.then(() => {
				contexts.forEach((context) => {
					assert.equal(context.getBlock(101).style.visibility, '');
					assert.equal(context.getBlock(202).style.visibility, '');
					assert.strictEqual(context.getPendingStyle(), null);
				});
				assert.deepEqual(rebuildCountByConsumer, {
					history: 2,
					'change-ai-site': 2,
				});
			})
		;
	});

	it('Should keep recovery semantics aligned on incremental rebuild failure', () => {
		const operations = [
			{type: 'update_block', blockId: 101},
			{type: 'add_block', blockId: 202},
		];
		const historyCommand = {
			tailwindRuntime: {},
		};
		const consumerSideEffects = [];
		const contexts = createConsumerPair(operations, {
			history: () => {
				historyCommand.tailwindRuntime.rebuildFailed = true;
				consumerSideEffects.push('history:editorReload');
			},
			changeAiSite: () => {
				consumerSideEffects.push('change-ai-site:editorReload');
			},
		});
		const failure = new Error('tailwind failed');
		const rebuildCalls = [];
		const windowToConsumer = new Map(contexts.map((context) => [context.targetWindow, context.consumer]));

		contexts.forEach((context) => {
			context.appendBlock(101);
			context.appendBlock(202);
		});
		TailwindRuntimeSync.rebuildAndSaveForWindow = (targetWindow) => {
			rebuildCalls.push(windowToConsumer.get(targetWindow));

			return Promise.reject(failure);
		};

		return Promise.all(contexts.map((context) => context.batchSync.prepare()))
			.then(() => Promise.all(contexts.map((context) => {
				return context.batchSync.afterOperation({type: 'update_block', blockId: 101});
			})))
			.then(() => Promise.all(contexts.map((context) => {
				return context.batchSync.afterOperation({type: 'add_block', blockId: 202})
					.then(() => context.batchSync.finalize())
				;
			})))
			.then(() => {
				const historyPublicationCalls = [];
				const changeAiSiteHistoryReloadCalls = [];
				const historyContext = contexts.find((context) => context.consumer === 'history');
				const changeAiSiteContext = contexts.find((context) => context.consumer === 'change-ai-site');

				if (!historyCommand.tailwindRuntime.rebuildFailed)
				{
					historyPublicationCalls.push('publication');
				}
				if (!changeAiSiteContext.batchSync.isFailed())
				{
					changeAiSiteHistoryReloadCalls.push('historyReload');
				}

				assert.equal(historyCommand.tailwindRuntime.rebuildFailed, true);
				assert.deepEqual(consumerSideEffects, ['history:editorReload', 'change-ai-site:editorReload']);
				assert.deepEqual(historyPublicationCalls, []);
				assert.deepEqual(changeAiSiteHistoryReloadCalls, []);
				assert.deepEqual(rebuildCalls, ['history', 'change-ai-site']);
				contexts.forEach((context) => {
					assert.equal(context.batchSync.isFailed(), true);
					assert.deepEqual([...context.batchSync.getPendingBlockIds()], [101, 202]);
					assert.equal(context.getBlock(101).getAttribute(context.pendingAttribute), '1');
					assert.equal(context.getBlock(101).style.visibility, 'hidden');
					assert.equal(context.getBlock(202).getAttribute(context.pendingAttribute), '1');
					assert.equal(context.getBlock(202).style.visibility, 'hidden');
					assert.notStrictEqual(context.getPendingStyle(), null);
				});
				assert.strictEqual(historyContext.batchSync.failureError, failure);
			})
		;
	});

	it('Should not introduce placeholder for move or delete in both consumers', () => {
		const operationGroups = [
			[{type: 'move_block', blockId: 101}],
			[{type: 'delete_block', blockId: 101}],
			[
				{type: 'move_block', blockId: 101},
				{type: 'delete_block', blockId: 202},
			],
		];
		const rebuildCalls = [];

		TailwindRuntimeSync.rebuildAndSaveForWindow = () => {
			rebuildCalls.push('rebuild');

			return Promise.resolve('compiled css');
		};

		return operationGroups.reduce((promise, operations) => {
			return promise.then(() => {
				const contexts = createConsumerPair(operations);

				contexts.forEach((context) => {
					context.appendBlock(101);
					context.appendBlock(202);
				});

				return Promise.all(contexts.map((context) => context.batchSync.prepare()))
					.then(() => Promise.all(contexts.flatMap((context) => {
						return operations.map((operation) => context.batchSync.afterOperation(operation));
					})))
					.then(() => {
						contexts.forEach((context) => {
							assert.deepEqual([...context.batchSync.getPendingBlockIds()], []);
							assert.strictEqual(context.getPendingStyle(), null);
							assert.equal(context.getBlock(101).hasAttribute(context.pendingAttribute), false);
							assert.equal(context.getBlock(202).hasAttribute(context.pendingAttribute), false);
						});
					})
				;
			});
		}, Promise.resolve()).then(() => {
			assert.deepEqual(rebuildCalls, []);
		});
	});
});
