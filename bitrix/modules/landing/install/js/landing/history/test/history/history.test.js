import {
	TailwindRuntimeBatchSync,
	TailwindRuntimeSync,
	getPendingBlockIds,
} from 'landing.tailwind.runtimesync';

describe('History', () => {
	let originalBX;
	let originalTailwindRebuild;
	let originalTailwindPreload;
	let originalHistoryClass;
	let originalWorker;
	let originalBabelHelpers;
	let historySourcePromise = null;

	beforeEach(() => {
		originalBX = globalThis.BX;
		originalTailwindRebuild = TailwindRuntimeSync.rebuildAndSaveForWindow;
		originalTailwindPreload = TailwindRuntimeSync.preloadRuntimeForWindow;
		originalHistoryClass = globalThis.BX?.Landing?.History;
		originalWorker = globalThis.Worker;
		originalBabelHelpers = globalThis.babelHelpers;
	});

	afterEach(() => {
		if (typeof originalBX === 'undefined')
		{
			delete globalThis.BX;
		}
		else
		{
			Object.defineProperty(globalThis, 'BX', {
				value: originalBX,
				writable: true,
				configurable: true,
			});
		}
		TailwindRuntimeSync.rebuildAndSaveForWindow = originalTailwindRebuild;
		TailwindRuntimeSync.preloadRuntimeForWindow = originalTailwindPreload;
		if (globalThis.BX?.Landing)
		{
			globalThis.BX.Landing.History = originalHistoryClass;
		}
		if (typeof originalWorker === 'undefined')
		{
			delete globalThis.Worker;
		}
		else
		{
			Object.defineProperty(globalThis, 'Worker', {
				value: originalWorker,
				writable: true,
				configurable: true,
			});
		}
		if (typeof originalBabelHelpers === 'undefined')
		{
			delete globalThis.babelHelpers;
		}
		else
		{
			Object.defineProperty(globalThis, 'babelHelpers', {
				value: originalBabelHelpers,
				writable: true,
				configurable: true,
			});
		}
	});

	const mockGlobal = (name, value) => {
		Object.defineProperty(globalThis, name, {
			value,
			writable: true,
			configurable: true,
		});
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

	const waitForAsync = () => new Promise((resolve) => {
		setTimeout(resolve, 0);
	});

	const assertNoGlobalPendingOverlay = (style, visibleNodes = []) => {
		assert.notStrictEqual(style, null);
		const text = String(style.textContent || '');

		assert.equal(text.includes('html'), false);
		assert.equal(text.includes('body'), false);
		assert.equal(text.includes('position: fixed'), false);
		visibleNodes.forEach((node) => {
			assert.equal(node.style.visibility, '');
			assert.equal(node.getAttribute('data-history-tailwind-pending'), null);
		});
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
			.find((item) => String(item.src || '').includes('history.bundle.js'))
		;

		if (script)
		{
			return new URL('history.bundle.js.map', script.src).toString();
		}

		return '/bitrix/js/landing/history/dist/history.bundle.js.map';
	};

	const getHistorySource = () => {
		if (!historySourcePromise)
		{
			if (isNode())
			{
				const fs = process.getBuiltinModule('fs');
				const path = process.getBuiltinModule('path');

				historySourcePromise = Promise.resolve(
					fs.readFileSync(path.resolve(__dirname, '../../src/history.js'), 'utf8'),
				);
			}
			else
			{
				historySourcePromise = fetch(getBundleMapUrl())
					.then((response) => response.json())
					.then((map) => {
						const index = map.sources.findIndex((source) => source.endsWith('/src/history.js'));

						assert.notStrictEqual(index, -1);

						return map.sourcesContent[index];
					})
				;
			}
		}

		return historySourcePromise;
	};

	const loadHistoryClass = () => {
		if (typeof require === 'undefined')
		{
			const mockedBX = globalThis.BX;
			if (originalBX?.Landing?.History)
			{
				Object.keys(mockedBX || {}).forEach((key) => {
					if (key !== 'Landing')
					{
						originalBX[key] = mockedBX[key];
					}
				});
				originalBX.Landing = Object.assign(originalBX.Landing || {}, mockedBX?.Landing || {});
				globalThis.BX = originalBX;

				return originalBX.Landing.History;
			}
		}

		const fs = require('fs');
		const path = require('path');
		if (typeof globalThis.babelHelpers === 'undefined')
		{
			const vm = require('vm');
			const helpersPath = '/opt/homebrew/lib/node_modules/@bitrix/cli/public/babel-external-helpers.js';
			const helpersSource = fs.readFileSync(helpersPath, 'utf8');
			const sandbox = {
				global: null,
				self: null,
			};
			sandbox.global = sandbox;
			sandbox.self = sandbox;
			vm.createContext(sandbox);
			vm.runInContext(helpersSource, sandbox);
			mockGlobal('babelHelpers', sandbox.babelHelpers);
		}

		const bundlePath = path.resolve(__dirname, '../../dist/history.bundle.js');
		const source = fs.readFileSync(bundlePath, 'utf8');
		if (globalThis.BX?.Landing)
		{
			globalThis.BX.Landing.TailwindRuntimeSync = TailwindRuntimeSync;
			globalThis.BX.Landing.TailwindRuntimeBatchSync = TailwindRuntimeBatchSync;
			globalThis.BX.Landing.getPendingBlockIds = getPendingBlockIds;
		}
		Function(source).call(globalThis);

		return globalThis.BX.Landing.History;
	};

	const createHighlightStub = () => {
		return class HighlightStub
		{
			constructor()
			{
				this.layout = document.createElement('div');
			}

			show()
			{
				return Promise.resolve();
			}

			hide()
			{}
		};
	};

	const setupHistoryGlobals = ({
		pageObject = {},
		backendAction = () => Promise.resolve(),
		rootWindow = {window: {}},
		editorWindow = null,
		envOptions = {},
		onCustomEvent = () => {},
	} = {}) => {
		const resolvedEnvOptions = {
			tailwindRuntimeEnabled: true,
			...envOptions,
		};

		mockGlobal('Worker', function Worker() {});
		mockGlobal('BX', {
			Type: {
				isStringFilled: (value) => typeof value === 'string' && value.trim() !== '',
			},
			Landing: {
				Main: {},
				Env: {
					getInstance: () => ({
						getOptions: () => resolvedEnvOptions,
					}),
				},
				Utils: {
					scrollTo: () => Promise.resolve(),
					highlight: () => Promise.resolve(),
				},
				TailwindRuntimeSync,
				Backend: {
					getInstance: () => ({
						action: backendAction,
					}),
				},
				PageObject: {
					getInstance: () => pageObject,
					getEditorWindow: () => editorWindow,
					getRootWindow: () => rootWindow,
				},
				UI: {
					Highlight: createHighlightStub(),
				},
			},
			onCustomEvent,
		});
	};

	const createEnvMock = (envOptions = {}) => {
		const resolvedEnvOptions = {
			tailwindRuntimeEnabled: true,
			...envOptions,
		};

		return {
			getInstance: () => ({
				getOptions: () => resolvedEnvOptions,
			}),
		};
	};

	const createHistoryInstance = (History, options = {}) => {
		const history = Object.create(History.prototype);
		history.entityType = options.entityType || 'L';
		history.entityId = options.entityId || 77;
		history.stack = options.stack || {
			getCommandEntityId: () => history.entityId,
		};

		return history;
	};

	const createBlockStorage = (blockMap) => {
		return {
			get: (blockId) => blockMap.get(parseInt(blockId, 10)) || null,
			add: (block) => {
				blockMap.set(parseInt(block.id, 10), block);
			},
			clear: () => {
				blockMap.clear();
			},
		};
	};

	const countStringOccurrences = (haystack, needle) => {
		return String(haystack || '').split(needle).length - 1;
	};

	it('Should reload stack and emit update event', () => {
		const events = [];
		mockGlobal('Worker', function Worker() {});
		class HighlightStub
		{
			constructor()
			{
				this.layout = document.createElement('div');
			}

			show()
			{
				return Promise.resolve();
			}

			hide()
			{}
		}
		mockGlobal('BX', {
			Type: {
				isStringFilled: (value) => typeof value === 'string' && value.trim() !== '',
			},
			Landing: {
				Main: {},
				Env: createEnvMock(),
				Utils: {
					scrollTo: () => Promise.resolve(),
					highlight: () => Promise.resolve(),
				},
				TailwindRuntimeSync,
				Backend: {},
				PageObject: {
					getRootWindow: () => ({
						window: {},
					}),
				},
				UI: {
					Highlight: HighlightStub,
				},
			},
			onCustomEvent: (target, eventName, params) => {
				events.push(eventName);
				events.push(params[0]);
			},
		});
		const History = loadHistoryClass();
		const history = Object.create(History.prototype);

		history.stack = {
			reload: () => {
				events.push('stackReload');

				return Promise.resolve();
			},
		};

		return history.reload().then((result) => {
			assert.strictEqual(result, history);
			assert.strictEqual(events[0], 'stackReload');
			assert.strictEqual(events[1], 'BX.Landing.History:update');
			assert.strictEqual(events[2], history);
		});
	});

	it('Should delegate Tailwind rebuild after history command to shared runtime sync', () => {
		const iframe = {
			contentWindow: {
				document,
			},
			contentDocument: document,
		};

		mockGlobal('Worker', function Worker() {});
		class HighlightStub
		{
			constructor()
			{
				this.layout = document.createElement('div');
			}

			show()
			{
				return Promise.resolve();
			}

			hide()
			{}
		}
		mockGlobal('BX', {
			Type: {
				isStringFilled: (value) => typeof value === 'string' && value.trim() !== '',
			},
			Landing: {
				Main: {},
				Env: createEnvMock(),
				Utils: {
					scrollTo: () => Promise.resolve(),
					highlight: () => Promise.resolve(),
				},
				TailwindRuntimeSync,
				Backend: {},
				PageObject: {
					getInstance: () => ({
						view: () => Promise.resolve(iframe),
					}),
				},
				UI: {
					Highlight: HighlightStub,
				},
			},
		});
		const History = loadHistoryClass();
		const history = Object.create(History.prototype);
		const calls = [];

		history.entityType = 'L';
		history.entityId = 77;

		TailwindRuntimeSync.rebuildAndSaveForWindow = (targetWindow, landingId) => {
			calls.push({targetWindow, landingId});

			return Promise.resolve('compiled css');
		};
		const batchSync = new TailwindRuntimeBatchSync({
			landingId: 77,
			targetWindow: iframe.contentWindow,
			targetDocument: document,
			operations: [
				{
					type: 'update_block',
					blockId: 321,
				},
			],
			resolveBlockNode: () => null,
		});

		return history.rebuildTailwindAfterHistoryCommand(
			history,
			77,
			{
				tailwindRuntime: {
					landingId: 77,
					rebuildRequired: true,
				},
			},
			batchSync,
		).then((result) => {
			assert.strictEqual(result, history);
			assert.deepEqual(calls, [
				{
					targetWindow: iframe.contentWindow,
					landingId: 77,
				},
			]);
		});
	});

	it('Should preload Tailwind runtime before applying undo command', () => {
		const iframe = {
			contentWindow: {
				document,
			},
			contentDocument: document,
		};
		const command = {
			command: 'updateContent',
			params: {
				block: 321,
				selector: '.landing-block',
				content: '<section class="bg-red-500"></section>',
			},
			tailwindRuntime: {
				landingId: 77,
				rebuildRequired: true,
			},
		};
		const calls = [];
		const preload = createDeferred();

		mockGlobal('Worker', function Worker() {});
		class HighlightStub
		{
			constructor()
			{
				this.layout = document.createElement('div');
			}

			show()
			{
				return Promise.resolve();
			}

			hide()
			{}
		}
		mockGlobal('BX', {
			Type: {
				isStringFilled: (value) => typeof value === 'string' && value.trim() !== '',
			},
			Landing: {
				Main: {},
				Env: createEnvMock(),
				Utils: {
					scrollTo: () => Promise.resolve(),
					highlight: () => Promise.resolve(),
				},
				TailwindRuntimeSync,
				Backend: {
					getInstance: () => ({
						action: () => {
							calls.push('backend');

							return Promise.resolve(command);
						},
					}),
				},
				PageObject: {
					getInstance: () => ({
						view: () => {
							calls.push('view');

							return Promise.resolve(iframe);
						},
						blocks: () => {
							calls.push('blocks');

							return Promise.resolve({
								get: () => null,
							});
						},
						}),
						getRootWindow: () => ({
							window: {},
							BX: {
								message: (code) => (code === 'SITE_TEMPLATE_PATH' ? '/root-template' : ''),
							},
						}),
					},
				UI: {
					Highlight: HighlightStub,
				},
			},
			onCustomEvent: () => {
				calls.push('updateEvent');
			},
		});
		const History = loadHistoryClass();
		const history = Object.create(History.prototype);

		history.entityType = 'L';
		history.entityId = 77;
		history.stack = {
			getCommandEntityId: () => 77,
		};
		history.canUndo = () => true;
		history.beforeUndo = () => Promise.resolve();
		history.getBackendActionName = () => 'History::undoLanding';
		history.getBackendActionParams = () => ({lid: 77});
		history.runCommand = () => {
			calls.push('runCommand');

			return Promise.resolve(history);
		};
		history.offset = () => {
			calls.push('offset');

			return Promise.resolve(history);
		};
		history.rebuildTailwindAfterHistoryCommand = (currentHistory) => {
			calls.push('rebuild');

			return Promise.resolve(currentHistory);
		};
		history.publicationAfterHistoryCommand = (currentHistory) => {
			calls.push('publication');

			return Promise.resolve(currentHistory);
		};

			TailwindRuntimeSync.preloadRuntimeForWindow = (targetWindow, options) => {
				calls.push('preload');
				assert.strictEqual(targetWindow, iframe.contentWindow);
				assert.deepEqual(options, {
					helpersBasePath: '/root-template/assets/js/helpers',
				});

				return preload.promise;
			};

		const promise = history.undo();

		return waitForAsync()
			.then(() => {
				assert.deepEqual(calls, ['backend', 'view', 'preload']);
				preload.resolve();

				return promise;
			})
			.then((result) => {
				assert.strictEqual(result, history);
				assert.deepEqual(calls, [
					'backend',
					'view',
					'preload',
					'view',
					'blocks',
					'runCommand',
					'offset',
					'updateEvent',
					'rebuild',
					'publication',
				]);
			})
		;
	});

	it('Should skip Tailwind history runtime when capability is disabled', () => {
		document.getElementById('history-tailwind-pending-style')?.remove();
		const iframe = {
			contentWindow: {
				document,
			},
			contentDocument: document,
		};
		const command = {
			command: 'updateContent',
			params: {
				block: 321,
				selector: '.landing-block',
				content: '<section class="bg-red-500"></section>',
			},
			tailwindRuntime: {
				landingId: 77,
				rebuildRequired: true,
			},
		};
		const calls = [];

		TailwindRuntimeSync.preloadRuntimeForWindow = () => {
			calls.push('preload');

			return Promise.resolve();
		};
		TailwindRuntimeSync.rebuildAndSaveForWindow = () => {
			calls.push('rebuild');

			return Promise.resolve('compiled css');
		};

		setupHistoryGlobals({
			envOptions: {
				tailwindRuntimeEnabled: false,
			},
			pageObject: {
				view: () => {
					calls.push('view');

					return Promise.resolve(iframe);
				},
				blocks: () => {
					calls.push('blocks');

					return Promise.resolve({
						get: () => null,
					});
				},
			},
		});
		const History = loadHistoryClass();
		const history = Object.create(History.prototype);
		history.entityType = 'L';
		history.entityId = 77;

		return history.prepareTailwindRuntimeBeforeHistoryCommand(77, command)
			.then(() => history.prepareTailwindRuntimeBatchBeforeHistoryCommand(77, command))
			.then((batchSync) => {
				assert.strictEqual(batchSync, null);
				assert.strictEqual(
					history.createTailwindRuntimeAfterHistoryCommandCallback(77, {
						command: 'multiply',
						params: [command],
						tailwindRuntime: command.tailwindRuntime,
					}, {
						afterOperation: () => {
							calls.push('afterOperation');

							return Promise.resolve();
						},
						getPendingBlockIds: () => new Set([321]),
					}),
					null,
				);

				return history.rebuildTailwindAfterHistoryCommand(history, 77, command, {
					finalize: () => {
						calls.push('finalize');

						return Promise.resolve();
					},
				});
			})
			.then((result) => {
				assert.strictEqual(result, history);
				assert.deepEqual(calls, []);
				assert.strictEqual(document.getElementById('history-tailwind-pending-style'), null);
			})
		;
	});

	it('Should wait for first cold Tailwind runtime script load before applying history command', () => {
			const targetWindow = {
				document,
				BX: {},
			};
		const iframe = {
			contentWindow: targetWindow,
			contentDocument: document,
		};
		const command = {
			command: 'updateContent',
			params: {
				block: 321,
				selector: '.landing-block',
				content: '<section class="bg-red-500"></section>',
			},
			tailwindRuntime: {
				landingId: 77,
				rebuildRequired: true,
			},
		};
		const calls = [];

		mockGlobal('Worker', function Worker() {});
		class HighlightStub
		{
			constructor()
			{
				this.layout = document.createElement('div');
			}

			show()
			{
				return Promise.resolve();
			}

			hide()
			{}
		}
		mockGlobal('BX', {
			Type: {
				isStringFilled: (value) => typeof value === 'string' && value.trim() !== '',
			},
			Landing: {
				Main: {},
				Env: createEnvMock(),
				Utils: {
					scrollTo: () => Promise.resolve(),
					highlight: () => Promise.resolve(),
				},
				TailwindRuntimeSync,
				Backend: {
					getInstance: () => ({
						action: () => {
							calls.push('backend');

							return Promise.resolve(command);
						},
					}),
				},
				PageObject: {
					getInstance: () => ({
						view: () => {
							calls.push('view');

							return Promise.resolve(iframe);
						},
						blocks: () => {
							calls.push('blocks');

							return Promise.resolve({
								get: () => null,
							});
						},
						}),
						getRootWindow: () => ({
							window: {},
							BX: {
								message: (code) => (code === 'SITE_TEMPLATE_PATH' ? '/root-template' : ''),
							},
						}),
					},
				UI: {
					Highlight: HighlightStub,
				},
			},
			onCustomEvent: () => {
				calls.push('updateEvent');
			},
		});
		const History = loadHistoryClass();
		const history = Object.create(History.prototype);

		history.entityType = 'L';
		history.entityId = 77;
		history.stack = {
			getCommandEntityId: () => 77,
		};
		history.canUndo = () => true;
		history.beforeUndo = () => Promise.resolve();
		history.getBackendActionName = () => 'History::undoLanding';
		history.getBackendActionParams = () => ({lid: 77});
		history.runCommand = () => {
			calls.push('runCommand');

			return Promise.resolve(history);
		};
		history.offset = () => {
			calls.push('offset');

			return Promise.resolve(history);
		};
		history.rebuildTailwindAfterHistoryCommand = (currentHistory) => {
			calls.push('rebuild');

			return Promise.resolve(currentHistory);
		};
		history.publicationAfterHistoryCommand = (currentHistory) => {
			calls.push('publication');

			return Promise.resolve(currentHistory);
		};

		const promise = history.undo();

		return waitForAsync()
			.then(() => {
					const script = document.head.querySelector('script[data-landing-tailwind-runtime="1"]');
					assert.notStrictEqual(script, null);
					assert.equal(script.getAttribute('src'), '/root-template/assets/js/helpers/tailwind.js');
					assert.deepEqual(calls, ['backend', 'view']);

				script.onload();

				return promise;
			})
			.then((result) => {
				assert.strictEqual(result, history);
				assert.deepEqual(calls, [
					'backend',
					'view',
					'view',
					'blocks',
					'runCommand',
					'offset',
					'updateEvent',
					'rebuild',
					'publication',
				]);
				document.head.querySelectorAll('script[data-landing-tailwind-runtime="1"]').forEach((node) => node.remove());
			})
			.catch((error) => {
				document.head.querySelectorAll('script[data-landing-tailwind-runtime="1"]').forEach((node) => node.remove());
				throw error;
			})
		;
	});

	it('Should keep affected history block hidden until Tailwind rebuild resolves', () => {
		const node = document.createElement('div');
		node.setAttribute('data-block-id', '321');
		document.body.appendChild(node);

		const iframe = {
			contentWindow: {
				document,
			},
			contentDocument: document,
		};
		const command = {
			command: 'updateContent',
			params: {
				block: 321,
				selector: '.landing-block',
				content: '<section class="bg-red-500"></section>',
			},
			tailwindRuntime: {
				landingId: 77,
				rebuildRequired: true,
			},
		};
		const calls = [];
		const rebuild = createDeferred();
		const block = {
			id: 321,
			node,
		};
		const blocks = {
			get: (blockId) => (`${blockId}` === '321' ? block : null),
		};

		mockGlobal('Worker', function Worker() {});
		class HighlightStub
		{
			constructor()
			{
				this.layout = document.createElement('div');
			}

			show()
			{
				return Promise.resolve();
			}

			hide()
			{}
		}
		mockGlobal('BX', {
			Type: {
				isStringFilled: (value) => typeof value === 'string' && value.trim() !== '',
			},
			Landing: {
				Main: {},
				Env: createEnvMock(),
				Utils: {
					scrollTo: () => Promise.resolve(),
					highlight: () => Promise.resolve(),
				},
				TailwindRuntimeSync,
				Backend: {
					getInstance: () => ({
						action: () => {
							calls.push('backend');

							return Promise.resolve(command);
						},
					}),
				},
				PageObject: {
					getInstance: () => ({
						view: () => {
							calls.push('view');

							return Promise.resolve(iframe);
						},
						blocks: () => {
							calls.push('blocks');

							return Promise.resolve(blocks);
						},
					}),
					getRootWindow: () => ({
						window: {},
					}),
				},
				UI: {
					Highlight: HighlightStub,
				},
			},
			onCustomEvent: () => {
				calls.push('updateEvent');
			},
		});
		const History = loadHistoryClass();
		const history = Object.create(History.prototype);

		history.entityType = 'L';
		history.entityId = 77;
		history.stack = {
			getCommandEntityId: () => 77,
		};
		history.canUndo = () => true;
		history.beforeUndo = () => Promise.resolve();
		history.getBackendActionName = () => 'History::undoLanding';
		history.getBackendActionParams = () => ({lid: 77});
		history.runCommand = () => {
			calls.push('runCommand');
			assert.equal(node.getAttribute('data-history-tailwind-pending'), '1');
			assert.equal(node.style.visibility, 'hidden');

			return Promise.resolve(history);
		};
		history.offset = () => {
			calls.push('offset');

			return Promise.resolve(history);
		};
		history.publicationAfterHistoryCommand = (currentHistory) => {
			calls.push('publication');

			return Promise.resolve(currentHistory);
		};

		TailwindRuntimeSync.preloadRuntimeForWindow = () => {
			calls.push('preload');

			return Promise.resolve();
		};
		TailwindRuntimeSync.rebuildAndSaveForWindow = () => {
			calls.push('rebuild');

			return rebuild.promise;
		};

		const promise = history.undo();

		return waitForAsync()
			.then(waitForAsync)
			.then(() => {
				assert.equal(node.getAttribute('data-history-tailwind-pending'), '1');
				assert.equal(node.style.visibility, 'hidden');
				assert.notStrictEqual(document.getElementById('history-tailwind-pending-style'), null);
				assert.equal(calls.includes('rebuild'), true);
				rebuild.resolve('compiled css');

				return promise;
			})
			.then((result) => {
				assert.strictEqual(result, history);
				assert.equal(node.hasAttribute('data-history-tailwind-pending'), false);
				assert.equal(node.style.visibility, '');
				assert.strictEqual(document.getElementById('history-tailwind-pending-style'), null);
				node.remove();
			})
			.catch((error) => {
				node.remove();
				throw error;
			})
		;
	});

	it('Should cover newly added history block by pending style before block object exists', () => {
		const iframe = {
			contentWindow: {
				document,
			},
			contentDocument: document,
		};
		const command = {
			command: 'addBlock',
			params: {
				block: 404,
				lid: 77,
				currentBlock: 321,
				code: 'repo_404',
				insertBefore: false,
			},
			tailwindRuntime: {
				landingId: 77,
				rebuildRequired: true,
			},
		};

		mockGlobal('Worker', function Worker() {});
		mockGlobal('BX', {
			Type: {
				isStringFilled: (value) => typeof value === 'string' && value.trim() !== '',
			},
			Landing: {
				Main: {},
				Env: createEnvMock(),
				Utils: {
					scrollTo: () => Promise.resolve(),
					highlight: () => Promise.resolve(),
				},
				TailwindRuntimeSync,
				PageObject: {
					getInstance: () => ({
						view: () => Promise.resolve(iframe),
						blocks: () => Promise.resolve({
							get: () => null,
						}),
					}),
					getRootWindow: () => ({
						window: {},
					}),
				},
				UI: {
					Highlight: class
					{
						constructor()
						{
							this.layout = document.createElement('div');
						}
					},
				},
			},
		});
		const History = loadHistoryClass();
		const history = Object.create(History.prototype);
		history.entityType = 'L';
		history.entityId = 77;
		assert.strictEqual(history.resolveTailwindRuntimeLandingId(77, command), 77);

		return history.prepareTailwindRuntimeBatchBeforeHistoryCommand(77, command)
			.then((batchSync) => {
				assert.deepEqual([...batchSync.getPendingBlockIds()], [404]);

				const style = document.getElementById('history-tailwind-pending-style');
				assert.notStrictEqual(style, null);
				assert.equal(style.textContent.includes('#block404'), true);
				assert.equal(style.textContent.includes('.block-wrapper[data-id="404"]'), true);

				const addedNode = document.createElement('div');
				addedNode.id = 'block404';
				addedNode.className = 'block-wrapper';
				addedNode.setAttribute('data-id', '404');
				document.body.appendChild(addedNode);

				assert.notStrictEqual(document.querySelector('#block404.block-wrapper[data-id="404"]'), null);

				addedNode.remove();
				style.remove();
			})
		;
	});

	it('Should not apply history Tailwind pending guard for delete or move commands', () => {
		const calls = [];
		mockGlobal('Worker', function Worker() {});
		mockGlobal('BX', {
			Type: {
				isStringFilled: (value) => typeof value === 'string' && value.trim() !== '',
			},
			Landing: {
				Main: {},
				Env: createEnvMock(),
				Utils: {
					scrollTo: () => Promise.resolve(),
					highlight: () => Promise.resolve(),
				},
				TailwindRuntimeSync,
				PageObject: {
					getInstance: () => {
						calls.push('pageObject');

						return {
							view: () => {
								calls.push('view');

								return Promise.resolve({
									contentWindow: {document},
									contentDocument: document,
								});
							},
							blocks: () => {
								calls.push('blocks');

								return Promise.resolve({
									get: () => null,
								});
							},
						};
					},
					getRootWindow: () => ({
						window: {},
					}),
				},
				UI: {
					Highlight: class
					{
						constructor()
						{
							this.layout = document.createElement('div');
						}
					},
				},
			},
		});
		const History = loadHistoryClass();
		const history = Object.create(History.prototype);
		history.entityType = 'L';
		history.entityId = 77;
		const tailwindRuntime = {
			landingId: 77,
			rebuildRequired: true,
		};

		const removeOperations = history.normalizeTailwindHistoryOperations({
			command: 'removeBlock',
			params: {
				block: 404,
			},
			tailwindRuntime,
		});
		const moveOperations = history.normalizeTailwindHistoryOperations({
			command: 'moveBlock',
			params: {
				block: 404,
				order: [404, 505],
				movedIds: [404],
			},
			tailwindRuntime,
		});

		assert.deepEqual(removeOperations, [
			{
				type: 'delete_block',
				blockId: 404,
				raw: removeOperations[0].raw,
			},
		]);
		assert.deepEqual(moveOperations, [
			{
				type: 'move_block',
				blockId: 404,
				raw: moveOperations[0].raw,
			},
		]);
		assert.equal(getPendingBlockIds(removeOperations).size, 0);
		assert.equal(getPendingBlockIds(moveOperations).size, 0);

		return Promise.all([
			history.prepareTailwindRuntimeBatchBeforeHistoryCommand(77, {
				command: 'removeBlock',
				params: {
					block: 404,
				},
				tailwindRuntime,
			}),
			history.prepareTailwindRuntimeBatchBeforeHistoryCommand(77, {
				command: 'moveBlock',
				params: {
					block: 404,
					order: [404, 505],
					movedIds: [404],
				},
				tailwindRuntime,
			}),
		]).then(([removeBatchSync, moveBatchSync]) => {
			assert.strictEqual(removeBatchSync, null);
			assert.strictEqual(moveBatchSync, null);
			assert.deepEqual(calls, []);
			assert.strictEqual(document.getElementById('history-tailwind-pending-style'), null);
		});
	});

	it('Should collect history Tailwind pending ids from multiply add and update only', () => {
		mockGlobal('Worker', function Worker() {});
		mockGlobal('BX', {
			Type: {
				isStringFilled: (value) => typeof value === 'string' && value.trim() !== '',
			},
			Landing: {
				Main: {},
				Env: createEnvMock(),
				Utils: {
					scrollTo: () => Promise.resolve(),
					highlight: () => Promise.resolve(),
				},
				TailwindRuntimeSync,
				PageObject: {
					getRootWindow: () => ({
						window: {},
					}),
				},
				UI: {
					Highlight: class
					{
						constructor()
						{
							this.layout = document.createElement('div');
						}
					},
				},
			},
		});
		const History = loadHistoryClass();
		const history = Object.create(History.prototype);
		const operations = history.normalizeTailwindHistoryOperations({
			command: 'multiply',
			params: [
				{
					command: 'updateContent',
					params: {
						block: 101,
					},
				},
				{
					command: 'addBlock',
					params: {
						block: 202,
					},
				},
				{
					command: 'removeBlock',
					params: {
						block: 303,
					},
				},
				{
					command: 'moveBlock',
					params: {
						block: 404,
						order: [404, 101, 202],
					},
				},
			],
		});

		assert.deepEqual(operations.map((operation) => operation.type), [
			'update_block',
			'add_block',
			'delete_block',
			'move_block',
		]);
		assert.deepEqual([...getPendingBlockIds(operations)], [101, 202]);
	});

	it('Should reveal multiply Tailwind pending blocks one by one after incremental rebuilds', () => {
		const node101 = document.createElement('div');
		node101.setAttribute('data-block-id', '101');
		document.body.appendChild(node101);
		const node202 = document.createElement('div');
		node202.setAttribute('data-block-id', '202');
		document.body.appendChild(node202);

		const iframe = {
			contentWindow: {
				document,
			},
			contentDocument: document,
		};
		const blockMap = new Map([
			[101, {id: 101, node: node101}],
			[202, {id: 202, node: node202}],
		]);
		const blocks = {
			get: (blockId) => blockMap.get(parseInt(blockId, 10)) || null,
		};
		const command = {
			command: 'multiply',
			params: [
				{
					command: 'updateContent',
					params: {
						block: 101,
					},
				},
				{
					command: 'updateContent',
					params: {
						block: 202,
					},
				},
			],
			tailwindRuntime: {
				landingId: 77,
				rebuildRequired: true,
			},
		};
		const rebuildQueue = [createDeferred(), createDeferred(), createDeferred()];
		const rebuildCalls = [];

		mockGlobal('Worker', function Worker() {});
		mockGlobal('BX', {
			Type: {
				isStringFilled: (value) => typeof value === 'string' && value.trim() !== '',
			},
			Landing: {
				Main: {},
				Env: createEnvMock(),
				Utils: {
					scrollTo: () => Promise.resolve(),
					highlight: () => Promise.resolve(),
				},
				TailwindRuntimeSync,
				PageObject: {
					getInstance: () => ({
						view: () => Promise.resolve(iframe),
						blocks: () => Promise.resolve(blocks),
					}),
					getRootWindow: () => ({
						window: {},
					}),
				},
				UI: {
					Highlight: class
					{
						constructor()
						{
							this.layout = document.createElement('div');
						}
					},
				},
			},
		});
		const History = loadHistoryClass();
		const history = Object.create(History.prototype);

		history.entityType = 'L';
		history.entityId = 77;
		TailwindRuntimeSync.rebuildAndSaveForWindow = (targetWindow, landingId) => {
			rebuildCalls.push({targetWindow, landingId});

			return rebuildQueue[rebuildCalls.length - 1].promise;
		};

		return history.prepareTailwindRuntimeBatchBeforeHistoryCommand(77, command)
			.then((batchSync) => {
				assert.deepEqual([...batchSync.getPendingBlockIds()], [101, 202]);
				assert.equal(node101.style.visibility, 'hidden');
				assert.equal(node202.style.visibility, 'hidden');

				const callback = history.createTailwindRuntimeAfterHistoryCommandCallback(
					77,
					command,
					batchSync,
				);
				const firstReveal = callback(command.params[0]);

				return waitForAsync()
					.then(() => {
						assert.equal(rebuildCalls.length, 1);
						assert.equal(node101.style.visibility, 'hidden');
						assert.equal(node202.style.visibility, 'hidden');
						rebuildQueue[0].resolve();

						return firstReveal;
					})
					.then(() => {
						const style = document.getElementById('history-tailwind-pending-style');
						assert.equal(node101.style.visibility, '');
						assert.equal(node202.style.visibility, 'hidden');
						assert.deepEqual([...batchSync.getPendingBlockIds()], [202]);
						assert.notStrictEqual(style, null);
						assert.equal(style.textContent.includes('#block101'), false);
						assert.equal(style.textContent.includes('#block202'), true);

						const secondReveal = callback(command.params[1]);

						return waitForAsync()
							.then(() => {
								assert.equal(rebuildCalls.length, 2);
								rebuildQueue[1].resolve();

								return secondReveal;
							});
					})
					.then(() => {
						assert.equal(node101.style.visibility, '');
						assert.equal(node202.style.visibility, '');
						assert.equal(batchSync.getPendingBlockIds().size, 0);
						assert.strictEqual(document.getElementById('history-tailwind-pending-style'), null);

						const finalRebuild = history.rebuildTailwindAfterHistoryCommand(history, 77, command, batchSync);

						return waitForAsync()
							.then(() => {
								assert.equal(rebuildCalls.length, 3);
								rebuildQueue[2].resolve();

								return finalRebuild;
							})
						;
					})
					.then(() => {
						assert.equal(batchSync.getPendingBlockIds().size, 0);
					})
				;
			})
			.then(() => {
				node101.remove();
				node202.remove();
			})
			.catch((error) => {
				node101.remove();
				node202.remove();
				document.getElementById('history-tailwind-pending-style')?.remove();
				throw error;
			})
		;
		});

		it('Should keep only History pending block areas hidden during visual smoke', () => {
			const node101 = document.createElement('section');
			node101.setAttribute('data-block-id', '101');
			node101.textContent = 'updated block 101';
			document.body.appendChild(node101);
			const node202 = document.createElement('section');
			node202.setAttribute('data-block-id', '202');
			node202.textContent = 'updated block 202';
			document.body.appendChild(node202);
			const node303 = document.createElement('section');
			node303.setAttribute('data-block-id', '303');
			node303.textContent = 'stable block 303';
			document.body.appendChild(node303);

			const iframe = {
				contentWindow: {
					document,
				},
				contentDocument: document,
			};
			const command = {
				command: 'multiply',
				params: [
					{
						command: 'updateContent',
						params: {
							block: 101,
						},
					},
					{
						command: 'updateContent',
						params: {
							block: 202,
						},
					},
					{
						command: 'moveBlock',
						params: {
							block: 303,
						},
					},
				],
				tailwindRuntime: {
					landingId: 77,
					rebuildRequired: true,
				},
			};
			const rebuildQueue = [createDeferred(), createDeferred(), createDeferred()];
			const rebuildCalls = [];

			setupHistoryGlobals({
				pageObject: {
					view: () => Promise.resolve(iframe),
					blocks: () => Promise.resolve(createBlockStorage(new Map([
						[101, {id: 101, node: node101}],
						[202, {id: 202, node: node202}],
						[303, {id: 303, node: node303}],
					]))),
				},
			});
			const History = loadHistoryClass();
			const history = createHistoryInstance(History);
			TailwindRuntimeSync.rebuildAndSaveForWindow = (targetWindow, landingId) => {
				rebuildCalls.push({targetWindow, landingId});

				return rebuildQueue[rebuildCalls.length - 1].promise;
			};

			return history.prepareTailwindRuntimeBatchBeforeHistoryCommand(77, command)
				.then((batchSync) => {
					const style = document.getElementById('history-tailwind-pending-style');
					const callback = history.createTailwindRuntimeAfterHistoryCommandCallback(77, command, batchSync);

					assertNoGlobalPendingOverlay(style, [node303]);
					assert.equal(node101.style.visibility, 'hidden');
					assert.equal(node202.style.visibility, 'hidden');
					assert.equal(style.textContent.includes('[data-block-id="101"]'), true);
					assert.equal(style.textContent.includes('[data-block-id="202"]'), true);
					assert.equal(style.textContent.includes('[data-block-id="303"]'), false);
					assert.equal(document.body.style.visibility, '');

					const firstReveal = callback(command.params[0]);

					return waitForAsync()
						.then(() => {
							assert.equal(rebuildCalls.length, 1);
							assert.equal(node101.style.visibility, 'hidden');
							assert.equal(node202.style.visibility, 'hidden');
							assertNoGlobalPendingOverlay(document.getElementById('history-tailwind-pending-style'), [node303]);
							rebuildQueue[0].resolve();

							return firstReveal;
						})
						.then(() => {
							const nextStyle = document.getElementById('history-tailwind-pending-style');
							assert.equal(node101.style.visibility, '');
							assert.equal(node202.style.visibility, 'hidden');
							assertNoGlobalPendingOverlay(nextStyle, [node101, node303]);
							assert.equal(nextStyle.textContent.includes('[data-block-id="101"]'), false);
							assert.equal(nextStyle.textContent.includes('[data-block-id="202"]'), true);

							const secondReveal = callback(command.params[1]);

							return waitForAsync()
								.then(() => {
									assert.equal(rebuildCalls.length, 2);
									assert.equal(node101.style.visibility, '');
									assert.equal(node202.style.visibility, 'hidden');
									assertNoGlobalPendingOverlay(document.getElementById('history-tailwind-pending-style'), [node101, node303]);
									rebuildQueue[1].resolve();

									return secondReveal;
								})
							;
						})
						.then(() => {
							assert.equal(node101.style.visibility, '');
							assert.equal(node202.style.visibility, '');
							assert.equal(node303.style.visibility, '');
							assert.strictEqual(document.getElementById('history-tailwind-pending-style'), null);

							const finalRebuild = history.rebuildTailwindAfterHistoryCommand(history, 77, command, batchSync);

							return waitForAsync()
								.then(() => {
									assert.equal(rebuildCalls.length, 3);
									rebuildQueue[2].resolve();

									return finalRebuild;
								})
							;
						})
					;
				})
				.finally(() => {
					node101.remove();
					node202.remove();
					node303.remove();
					document.getElementById('history-tailwind-pending-style')?.remove();
				})
			;
		});

		it('Should not start next History multiply pending reveal before previous rebuild resolves', () => {
			const node101 = document.createElement('div');
			node101.setAttribute('data-block-id', '101');
			document.body.appendChild(node101);
			const node202 = document.createElement('div');
			node202.setAttribute('data-block-id', '202');
			document.body.appendChild(node202);

			const iframe = {
				contentWindow: {
					document,
				},
				contentDocument: document,
			};
			const blocks = createBlockStorage(new Map([
				[101, {id: 101, node: node101}],
				[202, {id: 202, node: node202}],
			]));
			const command = {
				command: 'multiply',
				params: [
					{
						command: 'updateContent',
						params: {
							block: 101,
						},
					},
					{
						command: 'updateContent',
						params: {
							block: 202,
						},
					},
				],
				tailwindRuntime: {
					landingId: 77,
					rebuildRequired: true,
				},
			};
			const rebuildQueue = [createDeferred(), createDeferred()];
			const calls = [];

			setupHistoryGlobals({
				pageObject: {
					view: () => Promise.resolve(iframe),
					blocks: () => Promise.resolve(blocks),
				},
			});
			const History = loadHistoryClass();
			const history = createHistoryInstance(History);
			TailwindRuntimeSync.rebuildAndSaveForWindow = () => {
				calls.push('tailwindRebuild');

				return rebuildQueue[calls.filter((item) => item === 'tailwindRebuild').length - 1].promise;
			};

			return history.prepareTailwindRuntimeBatchBeforeHistoryCommand(77, command)
				.then((batchSync) => {
					const callback = history.createTailwindRuntimeAfterHistoryCommandCallback(77, command, batchSync);
					const queuePromise = command.params.reduce((promise, singleCommand) => {
						return promise.then(() => {
							calls.push(`apply:${singleCommand.params.block}`);

							return callback(singleCommand);
						});
					}, Promise.resolve());

					return waitForAsync()
						.then(() => {
							assert.deepEqual(calls, ['apply:101', 'tailwindRebuild']);
							assert.equal(node101.style.visibility, 'hidden');
							assert.equal(node202.style.visibility, 'hidden');

							return waitForAsync();
						})
						.then(() => {
							assert.deepEqual(calls, ['apply:101', 'tailwindRebuild']);
							rebuildQueue[0].resolve('compiled css');

							return waitForAsync();
						})
						.then(() => {
							assert.deepEqual(calls, ['apply:101', 'tailwindRebuild', 'apply:202', 'tailwindRebuild']);
							assert.equal(node101.style.visibility, '');
							assert.equal(node202.style.visibility, 'hidden');
							rebuildQueue[1].resolve('compiled css');

							return queuePromise;
						})
						.then(() => {
							assert.deepEqual(calls, ['apply:101', 'tailwindRebuild', 'apply:202', 'tailwindRebuild']);
							assert.equal(node101.style.visibility, '');
							assert.equal(node202.style.visibility, '');
							assert.equal(batchSync.getPendingBlockIds().size, 0);
						});
				})
				.finally(() => {
					node101.remove();
					node202.remove();
					document.getElementById('history-tailwind-pending-style')?.remove();
				})
			;
		});

		it('Should reveal added block after its incremental Tailwind rebuild', () => {
			const iframe = {
				contentWindow: {
				document,
			},
			contentDocument: document,
		};
		const blockMap = new Map();
		const blocks = {
			get: (blockId) => blockMap.get(parseInt(blockId, 10)) || null,
		};
		const command = {
			command: 'multiply',
			params: [
				{
					command: 'addBlock',
					params: {
						block: 303,
					},
				},
			],
			tailwindRuntime: {
				landingId: 77,
				rebuildRequired: true,
			},
		};
		const rebuild = createDeferred();
		const rebuildCalls = [];

		mockGlobal('Worker', function Worker() {});
		mockGlobal('BX', {
			Type: {
				isStringFilled: (value) => typeof value === 'string' && value.trim() !== '',
			},
			Landing: {
				Main: {},
				Env: createEnvMock(),
				Utils: {
					scrollTo: () => Promise.resolve(),
					highlight: () => Promise.resolve(),
				},
				TailwindRuntimeSync,
				PageObject: {
					getInstance: () => ({
						view: () => Promise.resolve(iframe),
						blocks: () => Promise.resolve(blocks),
					}),
					getRootWindow: () => ({
						window: {},
					}),
				},
				UI: {
					Highlight: class
					{
						constructor()
						{
							this.layout = document.createElement('div');
						}
					},
				},
			},
		});
		const History = loadHistoryClass();
		const history = Object.create(History.prototype);

		history.entityType = 'L';
		history.entityId = 77;
		TailwindRuntimeSync.rebuildAndSaveForWindow = () => {
			rebuildCalls.push('rebuild');

			return rebuild.promise;
		};

		return history.prepareTailwindRuntimeBatchBeforeHistoryCommand(77, command)
			.then((batchSync) => {
				const style = document.getElementById('history-tailwind-pending-style');
				assert.notStrictEqual(style, null);
				assert.equal(style.textContent.includes('#block303'), true);

				const addedNode = document.createElement('div');
				addedNode.id = 'block303';
				addedNode.className = 'block-wrapper';
				addedNode.setAttribute('data-id', '303');
				document.body.appendChild(addedNode);
				blockMap.set(303, {id: 303, node: addedNode});

				const callback = history.createTailwindRuntimeAfterHistoryCommandCallback(
					77,
					command,
					batchSync,
				);
				const reveal = callback(command.params[0]);

				return waitForAsync()
					.then(() => {
						assert.deepEqual(rebuildCalls, ['rebuild']);
						assert.equal(addedNode.style.visibility, 'hidden');
						rebuild.resolve();

						return reveal;
					})
					.then(() => {
						assert.equal(addedNode.style.visibility, '');
						assert.equal(batchSync.getPendingBlockIds().size, 0);
						assert.strictEqual(document.getElementById('history-tailwind-pending-style'), null);
						addedNode.remove();
					})
					.catch((error) => {
						addedNode.remove();
						throw error;
					})
				;
			})
			.catch((error) => {
				document.getElementById('history-tailwind-pending-style')?.remove();
				throw error;
			})
		;
	});

	it('Should skip incremental Tailwind reveal for multiply delete and move actions', () => {
		const command = {
			command: 'multiply',
			params: [
				{
					command: 'removeBlock',
					params: {
						block: 303,
					},
				},
				{
					command: 'moveBlock',
					params: {
						block: 404,
						order: [404, 303],
					},
				},
			],
			tailwindRuntime: {
				landingId: 77,
				rebuildRequired: true,
			},
		};

		mockGlobal('Worker', function Worker() {});
		mockGlobal('BX', {
			Type: {
				isStringFilled: (value) => typeof value === 'string' && value.trim() !== '',
			},
			Landing: {
				Main: {},
				Env: createEnvMock(),
				Utils: {
					scrollTo: () => Promise.resolve(),
					highlight: () => Promise.resolve(),
				},
				TailwindRuntimeSync,
				PageObject: {
					getRootWindow: () => ({
						window: {},
					}),
				},
				UI: {
					Highlight: class
					{
						constructor()
						{
							this.layout = document.createElement('div');
						}
					},
				},
			},
		});
		const History = loadHistoryClass();
		const history = Object.create(History.prototype);

		history.entityType = 'L';
		history.entityId = 77;

		const operations = history.normalizeTailwindHistoryOperations(command);
		assert.equal(getPendingBlockIds(operations).size, 0);

		return history.prepareTailwindRuntimeBatchBeforeHistoryCommand(77, command)
			.then((batchSync) => {
				assert.strictEqual(batchSync, null);
				assert.strictEqual(
					history.createTailwindRuntimeAfterHistoryCommandCallback(77, command, batchSync),
					null,
				);
			})
		;
	});

	it('Should keep pending blocks hidden and skip final rebuild after incremental Tailwind failure', () => {
		const node101 = document.createElement('div');
		node101.setAttribute('data-block-id', '101');
		document.body.appendChild(node101);
		const node202 = document.createElement('div');
		node202.setAttribute('data-block-id', '202');
		document.body.appendChild(node202);

		const iframe = {
			contentWindow: {
				document,
			},
			contentDocument: document,
		};
		const blocks = {
			get: (blockId) => {
				const id = parseInt(blockId, 10);
				if (id === 101)
				{
					return {id, node: node101};
				}

				if (id === 202)
				{
					return {id, node: node202};
				}

				return null;
			},
		};
		const command = {
			command: 'multiply',
			params: [
				{
					command: 'updateContent',
					params: {
						block: 101,
					},
				},
				{
					command: 'updateContent',
					params: {
						block: 202,
					},
				},
			],
			tailwindRuntime: {
				landingId: 77,
				rebuildRequired: true,
			},
		};
		const rebuildCalls = [];
		const reloadCalls = [];
		const publicationCalls = [];

		mockGlobal('Worker', function Worker() {});
		mockGlobal('BX', {
			Type: {
				isStringFilled: (value) => typeof value === 'string' && value.trim() !== '',
			},
			Landing: {
				Main: {},
				Env: createEnvMock(),
				Utils: {
					scrollTo: () => Promise.resolve(),
					highlight: () => Promise.resolve(),
				},
				TailwindRuntimeSync,
				Backend: {
					getInstance: () => ({
						action: (name) => {
							publicationCalls.push(name);

							return Promise.resolve();
						},
					}),
				},
				PageObject: {
					getInstance: () => ({
						view: () => Promise.resolve(iframe),
						blocks: () => Promise.resolve(blocks),
					}),
					getEditorWindow: () => ({
						location: {
							reload: () => {
								reloadCalls.push('editorReload');
							},
						},
					}),
					getRootWindow: () => ({
						window: {},
					}),
				},
				UI: {
					Highlight: class
					{
						constructor()
						{
							this.layout = document.createElement('div');
						}
					},
				},
			},
		});
		const History = loadHistoryClass();
		const history = Object.create(History.prototype);

		history.entityType = 'L';
		history.entityId = 77;
		history.isAutoPublicationEnabled = () => true;
		TailwindRuntimeSync.rebuildAndSaveForWindow = () => {
			rebuildCalls.push('rebuild');

			return Promise.reject(new Error('tailwind failed'));
		};

		return history.prepareTailwindRuntimeBatchBeforeHistoryCommand(77, command)
			.then((batchSync) => {
				const callback = history.createTailwindRuntimeAfterHistoryCommandCallback(
					77,
					command,
					batchSync,
				);

				return callback(command.params[0])
					.then(() => {
						assert.equal(command.tailwindRuntime.rebuildFailed, true);
						assert.deepEqual(rebuildCalls, ['rebuild']);
						assert.deepEqual(reloadCalls, ['editorReload']);
						assert.equal(node101.style.visibility, 'hidden');
						assert.equal(node202.style.visibility, 'hidden');
						assert.notStrictEqual(document.getElementById('history-tailwind-pending-style'), null);

						return history.rebuildTailwindAfterHistoryCommand(history, 77, command, batchSync);
					})
					.then((result) => {
						assert.strictEqual(result, history);
						assert.deepEqual(rebuildCalls, ['rebuild']);

						return history.publicationAfterHistoryCommand(history, 77, command);
					})
					.then((result) => {
						assert.strictEqual(result, history);
						assert.deepEqual(publicationCalls, []);
					})
				;
			})
			.then(() => {
				node101.remove();
				node202.remove();
				document.getElementById('history-tailwind-pending-style')?.remove();
			})
			.catch((error) => {
				node101.remove();
				node202.remove();
				document.getElementById('history-tailwind-pending-style')?.remove();
				throw error;
			})
		;
	});

	it('Should keep affected history block hidden when Tailwind rebuild fails', () => {
		const node = document.createElement('div');
		node.setAttribute('data-block-id', '321');
		document.body.appendChild(node);

		const iframe = {
			contentWindow: {
				document,
			},
			contentDocument: document,
		};
		const command = {
			command: 'updateContent',
			params: {
				block: 321,
				selector: '.landing-block',
				content: '<section class="bg-red-500"></section>',
			},
			tailwindRuntime: {
				landingId: 77,
				rebuildRequired: true,
			},
		};
		const block = {
			id: 321,
			node,
		};
		const blocks = {
			get: (blockId) => (`${blockId}` === '321' ? block : null),
		};
		const calls = [];

		mockGlobal('Worker', function Worker() {});
		class HighlightStub
		{
			constructor()
			{
				this.layout = document.createElement('div');
			}

			show()
			{
				return Promise.resolve();
			}

			hide()
			{}
		}
		mockGlobal('BX', {
			Type: {
				isStringFilled: (value) => typeof value === 'string' && value.trim() !== '',
			},
			Landing: {
				Main: {},
				Env: createEnvMock(),
				Utils: {
					scrollTo: () => Promise.resolve(),
					highlight: () => Promise.resolve(),
				},
				TailwindRuntimeSync,
				Backend: {
					getInstance: () => ({
						action: () => Promise.resolve(command),
					}),
				},
				PageObject: {
					getInstance: () => ({
						view: () => Promise.resolve(iframe),
						blocks: () => Promise.resolve(blocks),
					}),
					getEditorWindow: () => ({
						location: {
							reload: () => {
								calls.push('editorReload');
							},
						},
					}),
					getRootWindow: () => ({
						window: {},
					}),
				},
				UI: {
					Highlight: HighlightStub,
				},
			},
			onCustomEvent: () => {},
		});
		const History = loadHistoryClass();
		const history = Object.create(History.prototype);

		history.entityType = 'L';
		history.entityId = 77;
		history.stack = {
			getCommandEntityId: () => 77,
		};
		history.canUndo = () => true;
		history.beforeUndo = () => Promise.resolve();
		history.getBackendActionName = () => 'History::undoLanding';
		history.getBackendActionParams = () => ({lid: 77});
		history.runCommand = () => Promise.resolve(history);
		history.offset = () => Promise.resolve(history);
		history.publicationAfterHistoryCommand = (currentHistory) => Promise.resolve(currentHistory);

		TailwindRuntimeSync.preloadRuntimeForWindow = () => Promise.resolve();
		TailwindRuntimeSync.rebuildAndSaveForWindow = () => Promise.reject(new Error('tailwind failed'));

		return history.undo()
			.then((result) => {
				assert.strictEqual(result, history);
				assert.equal(command.tailwindRuntime.rebuildFailed, true);
				assert.equal(node.getAttribute('data-history-tailwind-pending'), '1');
				assert.equal(node.style.visibility, 'hidden');
				assert.notStrictEqual(document.getElementById('history-tailwind-pending-style'), null);
				assert.deepEqual(calls, ['editorReload']);
				node.remove();
				document.getElementById('history-tailwind-pending-style')?.remove();
			})
			.catch((error) => {
				node.remove();
				document.getElementById('history-tailwind-pending-style')?.remove();
				throw error;
			})
		;
	});

	it('Should apply duplicate updateContent for same block according to current Set pending contract', () => {
		const node = document.createElement('div');
		node.setAttribute('data-block-id', '101');
		document.body.appendChild(node);

		const iframe = {
			contentWindow: {
				document,
			},
			contentDocument: document,
		};
		const blocks = createBlockStorage(new Map([
			[101, {id: 101, node}],
		]));
		const command = {
			command: 'multiply',
			params: [
				{
					command: 'updateContent',
					params: {
						block: 101,
					},
				},
				{
					command: 'updateContent',
					params: {
						block: 101,
					},
				},
			],
			tailwindRuntime: {
				landingId: 77,
				rebuildRequired: true,
			},
		};
		const rebuildQueue = [createDeferred(), createDeferred()];
		const rebuildCalls = [];

		setupHistoryGlobals({
			pageObject: {
				view: () => Promise.resolve(iframe),
				blocks: () => Promise.resolve(blocks),
			},
		});
		const History = loadHistoryClass();
		const history = createHistoryInstance(History);
		TailwindRuntimeSync.rebuildAndSaveForWindow = () => {
			rebuildCalls.push('rebuild');

			return rebuildQueue[rebuildCalls.length - 1].promise;
		};

		return history.prepareTailwindRuntimeBatchBeforeHistoryCommand(77, command)
			.then((batchSync) => {
				const style = document.getElementById('history-tailwind-pending-style');
				const callback = history.createTailwindRuntimeAfterHistoryCommandCallback(77, command, batchSync);

				assert.deepEqual([...batchSync.getPendingBlockIds()], [101]);
				assert.equal(countStringOccurrences(style.textContent, '[data-block-id="101"]'), 1);

				const firstReveal = callback(command.params[0]);

				return waitForAsync()
					.then(() => {
						assert.deepEqual(rebuildCalls, ['rebuild']);
						rebuildQueue[0].resolve();

						return firstReveal;
					})
					.then(() => {
						assert.equal(node.style.visibility, '');
						assert.equal(batchSync.getPendingBlockIds().size, 0);

						return callback(command.params[1]);
					})
					.then(() => {
						assert.deepEqual(rebuildCalls, ['rebuild']);

						const finalRebuild = history.rebuildTailwindAfterHistoryCommand(history, 77, command, batchSync);

						return waitForAsync()
							.then(() => {
								assert.deepEqual(rebuildCalls, ['rebuild', 'rebuild']);
								rebuildQueue[1].resolve();

								return finalRebuild;
							});
					});
			})
			.then(() => {
				node.remove();
			})
			.catch((error) => {
				node.remove();
				document.getElementById('history-tailwind-pending-style')?.remove();
				throw error;
			})
		;
	});

	it('Should keep order for updateContent then moveBlock of the same block', () => {
		const container = document.createElement('div');
		const node101 = document.createElement('div');
		const node202 = document.createElement('div');
		node101.setAttribute('data-block-id', '101');
		node202.setAttribute('data-block-id', '202');
		container.appendChild(node101);
		container.appendChild(node202);
		document.body.appendChild(container);

		const iframe = {
			contentWindow: {
				document,
			},
			contentDocument: document,
		};
		const blocks = createBlockStorage(new Map([
			[101, {id: 101, node: node101}],
			[202, {id: 202, node: node202}],
		]));
		const command = {
			command: 'multiply',
			params: [
				{
					command: 'updateContent',
					params: {
						block: 202,
					},
				},
				{
					command: 'moveBlock',
					params: {
						block: 202,
						order: [202, 101],
						movedIds: [202],
					},
				},
			],
			tailwindRuntime: {
				landingId: 77,
				rebuildRequired: true,
			},
		};
		const rebuildQueue = [createDeferred(), createDeferred()];
		const rebuildCalls = [];

		setupHistoryGlobals({
			pageObject: {
				view: () => Promise.resolve(iframe),
				blocks: () => Promise.resolve(blocks),
			},
		});
		const History = loadHistoryClass();
		const history = createHistoryInstance(History);
		TailwindRuntimeSync.rebuildAndSaveForWindow = () => {
			rebuildCalls.push('rebuild');

			return rebuildQueue[rebuildCalls.length - 1].promise;
		};

		return history.prepareTailwindRuntimeBatchBeforeHistoryCommand(77, command)
			.then((batchSync) => {
				const callback = history.createTailwindRuntimeAfterHistoryCommandCallback(77, command, batchSync);
				const firstReveal = callback(command.params[0]);

				return waitForAsync()
					.then(() => {
						rebuildQueue[0].resolve();

						return firstReveal;
					})
					.then(() => {
						container.insertBefore(node202, node101);

						return callback(command.params[1]);
					})
					.then(() => {
						assert.deepEqual(rebuildCalls, ['rebuild']);
						assert.deepEqual([...container.children].map((node) => node.getAttribute('data-block-id')), ['202', '101']);

						const finalRebuild = history.rebuildTailwindAfterHistoryCommand(history, 77, command, batchSync);

						return waitForAsync()
							.then(() => {
								rebuildQueue[1].resolve();

								return finalRebuild;
							});
					})
					.then(() => {
						assert.deepEqual(rebuildCalls, ['rebuild', 'rebuild']);
					});
			})
			.finally(() => {
				container.remove();
				document.getElementById('history-tailwind-pending-style')?.remove();
			})
		;
	});

	it('Should keep order for moveBlock then updateContent of the same block', () => {
		const container = document.createElement('div');
		const node101 = document.createElement('div');
		const node202 = document.createElement('div');
		node101.setAttribute('data-block-id', '101');
		node202.setAttribute('data-block-id', '202');
		container.appendChild(node101);
		container.appendChild(node202);
		document.body.appendChild(container);

		const iframe = {
			contentWindow: {
				document,
			},
			contentDocument: document,
		};
		const blocks = createBlockStorage(new Map([
			[101, {id: 101, node: node101}],
			[202, {id: 202, node: node202}],
		]));
		const command = {
			command: 'multiply',
			params: [
				{
					command: 'moveBlock',
					params: {
						block: 202,
						order: [202, 101],
						movedIds: [202],
					},
				},
				{
					command: 'updateContent',
					params: {
						block: 202,
					},
				},
			],
			tailwindRuntime: {
				landingId: 77,
				rebuildRequired: true,
			},
		};
		const rebuild = createDeferred();
		const rebuildCalls = [];

		setupHistoryGlobals({
			pageObject: {
				view: () => Promise.resolve(iframe),
				blocks: () => Promise.resolve(blocks),
			},
		});
		const History = loadHistoryClass();
		const history = createHistoryInstance(History);
		TailwindRuntimeSync.rebuildAndSaveForWindow = () => {
			rebuildCalls.push('rebuild');

			return rebuild.promise;
		};

		return history.prepareTailwindRuntimeBatchBeforeHistoryCommand(77, command)
			.then((batchSync) => {
				const callback = history.createTailwindRuntimeAfterHistoryCommandCallback(77, command, batchSync);
				container.insertBefore(node202, node101);

				return callback(command.params[0])
					.then(() => {
						assert.deepEqual(rebuildCalls, []);
						assert.equal(node202.style.visibility, 'hidden');
						assert.deepEqual([...container.children].map((node) => node.getAttribute('data-block-id')), ['202', '101']);

						const reveal = callback(command.params[1]);

						return waitForAsync()
							.then(() => {
								assert.deepEqual(rebuildCalls, ['rebuild']);
								rebuild.resolve();

								return reveal;
							});
					})
					.then(() => {
						assert.equal(node202.style.visibility, '');
						assert.deepEqual([...container.children].map((node) => node.getAttribute('data-block-id')), ['202', '101']);
					});
			})
			.finally(() => {
				container.remove();
				document.getElementById('history-tailwind-pending-style')?.remove();
			})
		;
	});

	it('Should finalize and publish after caught updateContent action failure under current history command policy', () => {
		const node = document.createElement('div');
		node.setAttribute('data-block-id', '101');
		document.body.appendChild(node);

		const iframe = {
			contentWindow: {
				document,
			},
			contentDocument: document,
		};
		const command = {
			command: 'multiply',
			params: [
				{
					command: 'updateContent',
					params: {
						block: 101,
					},
				},
			],
			tailwindRuntime: {
				landingId: 77,
				rebuildRequired: true,
			},
		};
		const publicationCalls = [];

		setupHistoryGlobals({
			pageObject: {
				view: () => Promise.resolve(iframe),
				blocks: () => Promise.resolve(createBlockStorage(new Map([
					[101, {id: 101, node}],
				]))),
			},
			backendAction: (name, params) => {
				publicationCalls.push({name, params});

				return Promise.resolve();
			},
			envOptions: {
				autoPublicationEnabled: true,
			},
		});
		const History = loadHistoryClass();
		const history = createHistoryInstance(History);
		TailwindRuntimeSync.rebuildAndSaveForWindow = () => Promise.resolve('compiled css');

		return history.prepareTailwindRuntimeBatchBeforeHistoryCommand(77, command)
			.then((batchSync) => {
				assert.equal(node.style.visibility, 'hidden');

				return history.rebuildTailwindAfterHistoryCommand(history, 77, command, batchSync);
			})
			.then(() => {
				assert.equal(node.style.visibility, '');

				return history.publicationAfterHistoryCommand(history, 77, command);
			})
			.then(() => {
				assert.deepEqual(publicationCalls, [
					{
						name: 'Landing::publication',
						params: {
							lid: 77,
						},
					},
				]);
			})
			.finally(() => {
				node.remove();
				document.getElementById('history-tailwind-pending-style')?.remove();
			})
		;
	});

	it('Should skip publication when final Tailwind rebuild fails after successful incremental reveals', () => {
		const node = document.createElement('div');
		node.setAttribute('data-block-id', '101');
		document.body.appendChild(node);

		const iframe = {
			contentWindow: {
				document,
			},
			contentDocument: document,
		};
		const command = {
			command: 'multiply',
			params: [
				{
					command: 'updateContent',
					params: {
						block: 101,
					},
				},
			],
			tailwindRuntime: {
				landingId: 77,
				rebuildRequired: true,
			},
		};
		const rebuildCalls = [];
		const reloadCalls = [];
		const publicationCalls = [];

		setupHistoryGlobals({
			pageObject: {
				view: () => Promise.resolve(iframe),
				blocks: () => Promise.resolve(createBlockStorage(new Map([
					[101, {id: 101, node}],
				]))),
			},
			editorWindow: {
				location: {
					reload: () => {
						reloadCalls.push('reload');
					},
				},
			},
			backendAction: (name) => {
				publicationCalls.push(name);

				return Promise.resolve();
			},
			envOptions: {
				autoPublicationEnabled: true,
			},
		});
		const History = loadHistoryClass();
		const history = createHistoryInstance(History);
		TailwindRuntimeSync.rebuildAndSaveForWindow = () => {
			rebuildCalls.push('rebuild');

			return rebuildCalls.length === 1
				? Promise.resolve('compiled css')
				: Promise.reject(new Error('final rebuild failed'))
			;
		};

		return history.prepareTailwindRuntimeBatchBeforeHistoryCommand(77, command)
			.then((batchSync) => {
				const callback = history.createTailwindRuntimeAfterHistoryCommandCallback(77, command, batchSync);

				return callback(command.params[0])
					.then(() => {
						assert.equal(node.style.visibility, '');

						return history.rebuildTailwindAfterHistoryCommand(history, 77, command, batchSync);
					})
					.then(() => history.publicationAfterHistoryCommand(history, 77, command));
			})
			.then(() => {
				assert.equal(command.tailwindRuntime.rebuildFailed, true);
				assert.deepEqual(reloadCalls, ['reload']);
				assert.deepEqual(publicationCalls, []);
			})
			.finally(() => {
				node.remove();
				document.getElementById('history-tailwind-pending-style')?.remove();
			})
		;
	});

	it('Should not call final rebuild or publication after preload failure', () => {
		const command = {
			command: 'updateContent',
			params: {
				block: 101,
			},
			tailwindRuntime: {
				landingId: 77,
				rebuildRequired: true,
			},
		};
		const calls = [];
		const errors = [];
		const preloadFailure = new Error('preload failed');
		const originalConsoleError = console.error;
		console.error = (...args) => {
			errors.push(args);
		};

		setupHistoryGlobals({
			pageObject: {
				view: () => Promise.resolve({
					contentWindow: {
						document,
					},
					contentDocument: document,
				}),
			},
			backendAction: () => {
				calls.push('backend');

				return Promise.resolve(command);
			},
		});
		const History = loadHistoryClass();
		const history = createHistoryInstance(History);
		history.canUndo = () => true;
		history.beforeUndo = () => Promise.resolve();
		history.getBackendActionName = () => 'History::undoLanding';
		history.getBackendActionParams = () => ({lid: 77});
		history.runCommand = () => {
			calls.push('runCommand');

			return Promise.resolve(history);
		};
		history.offset = () => {
			calls.push('offset');

			return Promise.resolve(history);
		};
		TailwindRuntimeSync.preloadRuntimeForWindow = () => Promise.reject(preloadFailure);
		TailwindRuntimeSync.rebuildAndSaveForWindow = () => {
			calls.push('rebuild');

			return Promise.resolve();
		};

		return history.undo()
			.then(() => {
				assert.fail('undo() must reject when Tailwind preload fails');
			}, () => {
				assert.deepEqual(calls, ['backend']);
				assert.deepEqual(errors, [
					['History Tailwind runtime preload failed.', preloadFailure],
				]);
				assert.equal(history.commandState, 'resolved');
			})
			.finally(() => {
				console.error = originalConsoleError;
			})
		;
	});

	it('Should reject visual guard when iframe document head is unavailable', () => {
		const command = {
			command: 'updateContent',
			params: {
				block: 101,
			},
			tailwindRuntime: {
				landingId: 77,
				rebuildRequired: true,
			},
		};
		const calls = [];
		const errors = [];
		const originalConsoleError = console.error;
		console.error = (...args) => {
			errors.push(args);
		};

		setupHistoryGlobals({
			pageObject: {
				view: () => Promise.resolve({
					contentWindow: {
						document: {},
					},
					contentDocument: null,
				}),
			},
			backendAction: () => {
				calls.push('backend');

				return Promise.resolve(command);
			},
		});
		const History = loadHistoryClass();
		const history = createHistoryInstance(History);
		history.canUndo = () => true;
		history.beforeUndo = () => Promise.resolve();
		history.getBackendActionName = () => 'History::undoLanding';
		history.getBackendActionParams = () => ({lid: 77});
		history.runCommand = () => {
			calls.push('runCommand');

			return Promise.resolve(history);
		};
		TailwindRuntimeSync.preloadRuntimeForWindow = () => Promise.resolve();
		TailwindRuntimeSync.rebuildAndSaveForWindow = () => {
			calls.push('rebuild');

			return Promise.resolve();
		};

		return history.undo()
			.then(() => {
				assert.fail('undo() must reject when visual guard document is unavailable');
			}, (error) => {
				assert.deepEqual(calls, ['backend']);
				assert.deepEqual(errors, [
					['History Tailwind visual guard failed.', error],
				]);
				assert.equal(error.message, 'History Tailwind visual guard target document is not available.');
				assert.equal(history.commandState, 'resolved');
			})
			.finally(() => {
				console.error = originalConsoleError;
			})
		;
	});

	it('Should log Tailwind rebuild failure diagnostics', () => {
		const targetDocument = document.implementation.createHTMLDocument('iframe');
		const node = targetDocument.createElement('div');
		node.setAttribute('data-block-id', '101');
		targetDocument.body.appendChild(node);

		const iframe = {
			contentWindow: {
				document: targetDocument,
			},
			contentDocument: targetDocument,
		};
		const command = {
			command: 'updateContent',
			params: {
				block: 101,
			},
			tailwindRuntime: {
				landingId: 77,
				rebuildRequired: true,
			},
		};
		const rebuildFailure = new Error('tailwind failed');
		const reloadCalls = [];
		const errors = [];
		const originalConsoleError = console.error;
		console.error = (...args) => {
			errors.push(args);
		};

		setupHistoryGlobals({
			pageObject: {
				view: () => Promise.resolve(iframe),
				blocks: () => Promise.resolve(createBlockStorage(new Map([
					[101, {id: 101, node}],
				]))),
			},
			editorWindow: {
				location: {
					reload: () => {
						reloadCalls.push('reload');
					},
				},
			},
		});
		const History = loadHistoryClass();
		const history = createHistoryInstance(History);
		TailwindRuntimeSync.rebuildAndSaveForWindow = () => Promise.reject(rebuildFailure);

		return history.prepareTailwindRuntimeBatchBeforeHistoryCommand(77, command)
			.then((batchSync) => history.rebuildTailwindAfterHistoryCommand(history, 77, command, batchSync))
			.then(() => {
				assert.equal(command.tailwindRuntime.rebuildFailed, true);
				assert.deepEqual(reloadCalls, ['reload']);
				assert.deepEqual(errors, [
					['History Tailwind CSS rebuild failed.', rebuildFailure],
				]);
			})
			.finally(() => {
				console.error = originalConsoleError;
				document.getElementById('history-tailwind-pending-style')?.remove();
			})
		;
	});

	it('Should keep failed History visual smoke pending and skip publication before editor reload', () => {
		const node101 = document.createElement('section');
		node101.setAttribute('data-block-id', '101');
		document.body.appendChild(node101);
		const node202 = document.createElement('section');
		node202.setAttribute('data-block-id', '202');
		document.body.appendChild(node202);
		const node303 = document.createElement('section');
		node303.setAttribute('data-block-id', '303');
		document.body.appendChild(node303);

		const iframe = {
			contentWindow: {
				document,
			},
			contentDocument: document,
		};
		const command = {
			command: 'multiply',
			params: [
				{
					command: 'updateContent',
					params: {
						block: 101,
					},
				},
				{
					command: 'updateContent',
					params: {
						block: 202,
					},
				},
			],
			tailwindRuntime: {
				landingId: 77,
				rebuildRequired: true,
			},
		};
		const calls = [];
		const originalConsoleError = console.error;
		console.error = () => {};

		setupHistoryGlobals({
			pageObject: {
				view: () => Promise.resolve(iframe),
				blocks: () => Promise.resolve(createBlockStorage(new Map([
					[101, {id: 101, node: node101}],
					[202, {id: 202, node: node202}],
					[303, {id: 303, node: node303}],
				]))),
			},
			editorWindow: {
				location: {
					reload: () => {
						calls.push('editorReload');
					},
				},
			},
			backendAction: (name) => {
				calls.push(name);

				return Promise.resolve();
			},
			envOptions: {
				autoPublicationEnabled: true,
			},
		});
		const History = loadHistoryClass();
		const history = createHistoryInstance(History);
		TailwindRuntimeSync.rebuildAndSaveForWindow = () => Promise.reject(new Error('tailwind failed'));

		return history.prepareTailwindRuntimeBatchBeforeHistoryCommand(77, command)
			.then((batchSync) => {
				const callback = history.createTailwindRuntimeAfterHistoryCommandCallback(77, command, batchSync);

				return callback(command.params[0])
					.then(() => history.rebuildTailwindAfterHistoryCommand(history, 77, command, batchSync))
					.then(() => history.publicationAfterHistoryCommand(history, 77, command))
					.then(() => {
						const style = document.getElementById('history-tailwind-pending-style');

						assert.equal(command.tailwindRuntime.rebuildFailed, true);
						assert.deepEqual(calls, ['editorReload']);
						assert.equal(node101.style.visibility, 'hidden');
						assert.equal(node202.style.visibility, 'hidden');
						assertNoGlobalPendingOverlay(style, [node303]);
						assert.equal(style.textContent.includes('[data-block-id="101"]'), true);
						assert.equal(style.textContent.includes('[data-block-id="202"]'), true);
						assert.equal(style.textContent.includes('[data-block-id="303"]'), false);
					});
			})
			.finally(() => {
				console.error = originalConsoleError;
				node101.remove();
				node202.remove();
				node303.remove();
				document.getElementById('history-tailwind-pending-style')?.remove();
			})
		;
	});

	it('Should fallback to document when iframe contentDocument is missing but contentWindow.document exists', () => {
		const targetDocument = document.implementation.createHTMLDocument('iframe');
		const node = targetDocument.createElement('div');
		node.setAttribute('data-block-id', '101');
		targetDocument.body.appendChild(node);

		const targetWindow = {
			document: targetDocument,
		};
		const command = {
			command: 'multiply',
			params: [
				{
					command: 'updateContent',
					params: {
						block: 101,
					},
				},
			],
			tailwindRuntime: {
				landingId: 77,
				rebuildRequired: true,
			},
		};
		const rebuildCalls = [];

		setupHistoryGlobals({
			pageObject: {
				view: () => Promise.resolve({
					contentWindow: targetWindow,
				}),
				blocks: () => Promise.resolve(createBlockStorage(new Map([
					[101, {id: 101, node}],
				]))),
			},
		});
		const History = loadHistoryClass();
		const history = createHistoryInstance(History);
		TailwindRuntimeSync.rebuildAndSaveForWindow = (actualWindow) => {
			rebuildCalls.push(actualWindow);

			return Promise.resolve('compiled css');
		};

		return history.prepareTailwindRuntimeBatchBeforeHistoryCommand(77, command)
			.then((batchSync) => {
				assert.notStrictEqual(targetDocument.getElementById('history-tailwind-pending-style'), null);
				assert.strictEqual(document.getElementById('history-tailwind-pending-style'), null);

				const callback = history.createTailwindRuntimeAfterHistoryCommandCallback(77, command, batchSync);

				return callback(command.params[0]);
			})
			.then(() => {
				assert.deepEqual(rebuildCalls, [targetWindow]);
				assert.strictEqual(targetDocument.getElementById('history-tailwind-pending-style'), null);
			})
		;
	});

	it('Should fallback block node resolution to selector-only guard when PageObject blocks fails', () => {
		const command = {
			command: 'addBlock',
			params: {
				block: 303,
			},
			tailwindRuntime: {
				landingId: 77,
				rebuildRequired: true,
			},
		};

		setupHistoryGlobals({
			pageObject: {
				view: () => Promise.resolve({
					contentWindow: {
						document,
					},
					contentDocument: document,
				}),
				blocks: () => Promise.reject(new Error('blocks failed')),
			},
		});
		const History = loadHistoryClass();
		const history = createHistoryInstance(History);

		return history.prepareTailwindRuntimeBatchBeforeHistoryCommand(77, command)
			.then((batchSync) => {
				const style = document.getElementById('history-tailwind-pending-style');

				assert.deepEqual([...batchSync.getPendingBlockIds()], [303]);
				assert.notStrictEqual(style, null);
				assert.equal(style.textContent.includes('#block303'), true);
			})
			.finally(() => {
				document.getElementById('history-tailwind-pending-style')?.remove();
			})
		;
	});

	it('Should not create batch sync for non-landing history entity even with tailwindRuntime payload', () => {
		const command = {
			command: 'updateContent',
			params: {
				block: 101,
			},
			tailwindRuntime: {
				landingId: 77,
				rebuildRequired: true,
			},
		};
		const calls = [];

		setupHistoryGlobals({
			pageObject: {
				view: () => {
					calls.push('view');

					return Promise.resolve({
						contentWindow: {
							document,
						},
						contentDocument: document,
					});
				},
			},
			backendAction: (name) => {
				calls.push(name);

				return Promise.resolve(command);
			},
			envOptions: {
				autoPublicationEnabled: true,
			},
		});
		const History = loadHistoryClass();
		const history = createHistoryInstance(History, {
			entityType: 'designerBlock',
		});
		history.canUndo = () => true;
		history.beforeUndo = () => Promise.resolve();
		history.getBackendActionName = () => 'History::undoDesignerBlock';
		history.getBackendActionParams = () => ({blockId: 77});
		history.runCommand = () => {
			calls.push('runCommand');

			return Promise.resolve(history);
		};
		history.offset = () => Promise.resolve(history);
		TailwindRuntimeSync.preloadRuntimeForWindow = () => {
			calls.push('preload');

			return Promise.resolve();
		};

		return history.undo().then(() => {
			assert.deepEqual(calls, ['History::undoDesignerBlock', 'runCommand']);
			assert.strictEqual(document.getElementById('history-tailwind-pending-style'), null);
		});
	});

	it('Should not create batch sync when tailwindRuntime rebuildRequired is false', () => {
		const command = {
			command: 'updateContent',
			params: {
				block: 101,
			},
			tailwindRuntime: {
				landingId: 77,
				rebuildRequired: false,
			},
		};
		const calls = [];

		setupHistoryGlobals({
			pageObject: {
				view: () => {
					calls.push('view');

					return Promise.resolve({
						contentWindow: {
							document,
						},
						contentDocument: document,
					});
				},
			},
			backendAction: (name) => {
				calls.push(name);

				return Promise.resolve(command);
			},
		});
		const History = loadHistoryClass();
		const history = createHistoryInstance(History);
		history.canUndo = () => true;
		history.beforeUndo = () => Promise.resolve();
		history.getBackendActionName = () => 'History::undoLanding';
		history.getBackendActionParams = () => ({lid: 77});
		history.runCommand = () => {
			calls.push('runCommand');

			return Promise.resolve(history);
		};
		history.offset = () => Promise.resolve(history);
		TailwindRuntimeSync.preloadRuntimeForWindow = () => {
			calls.push('preload');

			return Promise.resolve();
		};
		TailwindRuntimeSync.rebuildAndSaveForWindow = () => {
			calls.push('rebuild');

			return Promise.resolve();
		};

		return history.undo().then(() => {
			assert.deepEqual(calls, ['History::undoLanding', 'runCommand']);
			assert.strictEqual(document.getElementById('history-tailwind-pending-style'), null);
		});
	});

	it('Should resolve landing id priority from command tailwindRuntime landingId before entityId', () => {
		const node = document.createElement('div');
		node.setAttribute('data-block-id', '101');
		document.body.appendChild(node);

		const command = {
			command: 'multiply',
			params: [
				{
					command: 'updateContent',
					params: {
						block: 101,
					},
				},
			],
			tailwindRuntime: {
				landingId: 88,
				rebuildRequired: true,
			},
		};
		const rebuildLandingIds = [];
		const publicationCalls = [];

		setupHistoryGlobals({
			pageObject: {
				view: () => Promise.resolve({
					contentWindow: {
						document,
					},
					contentDocument: document,
				}),
				blocks: () => Promise.resolve(createBlockStorage(new Map([
					[101, {id: 101, node}],
				]))),
			},
			backendAction: (name, params) => {
				publicationCalls.push({name, params});

				return Promise.resolve();
			},
			envOptions: {
				autoPublicationEnabled: true,
			},
		});
		const History = loadHistoryClass();
		const history = createHistoryInstance(History, {
			entityId: 77,
		});
		TailwindRuntimeSync.rebuildAndSaveForWindow = (targetWindow, landingId) => {
			rebuildLandingIds.push(landingId);

			return Promise.resolve('compiled css');
		};

		assert.strictEqual(history.resolveTailwindRuntimeLandingId(77, command), 88);

		return history.prepareTailwindRuntimeBatchBeforeHistoryCommand(77, command)
			.then((batchSync) => {
				const callback = history.createTailwindRuntimeAfterHistoryCommandCallback(77, command, batchSync);

				return callback(command.params[0])
					.then(() => history.rebuildTailwindAfterHistoryCommand(history, 77, command, batchSync));
			})
			.then(() => history.publicationAfterHistoryCommand(history, 77, command))
			.then(() => {
				assert.deepEqual(rebuildLandingIds, [88, 88]);
				assert.deepEqual(publicationCalls, [
					{
						name: 'Landing::publication',
						params: {
							lid: 88,
						},
					},
				]);
			})
			.finally(() => {
				node.remove();
				document.getElementById('history-tailwind-pending-style')?.remove();
			})
		;
	});

	it('Should keep History Tailwind batch source contract', () => {
		return getHistorySource().then((source) => {
			const batchPosition = source.indexOf('const batchSync = new TailwindRuntimeBatchSync({');
			const preparePosition = source.indexOf('return batchSync.prepare()', batchPosition);
			const batchSource = source.slice(batchPosition, preparePosition);
				const finalTruePosition = batchSource.indexOf('finalRebuildRequired: true');
				const finalFalsePosition = batchSource.indexOf('finalRebuildRequired: false');
				const helpersBasePathPosition = batchSource.indexOf('helpersBasePath: this.resolveTailwindRuntimeHelpersBasePath()');
				const callbackPosition = source.indexOf('createTailwindRuntimeAfterHistoryCommandCallback(');
			const afterOperationGuardPosition = source.indexOf("typeof batchSync.afterOperation !== 'function'", callbackPosition);
			const afterOperationCallPosition = source.indexOf(
				'return batchSync.afterOperation(this.normalizeTailwindHistoryOperation(singleCommand));',
				callbackPosition,
			);

			assert.notStrictEqual(batchPosition, -1);
			assert.notStrictEqual(preparePosition, -1);
				assert.notStrictEqual(finalTruePosition, -1);
				assert.strictEqual(finalFalsePosition, -1);
				assert.notStrictEqual(helpersBasePathPosition, -1);
				assert.notStrictEqual(callbackPosition, -1);
			assert.notStrictEqual(afterOperationGuardPosition, -1);
			assert.notStrictEqual(afterOperationCallPosition, -1);
			assert.equal(callbackPosition < afterOperationGuardPosition, true);
			assert.equal(afterOperationGuardPosition < afterOperationCallPosition, true);
		});
	});

	it('Should preserve previous inline visibility through history pending lifecycle', () => {
		const node = document.createElement('div');
		node.setAttribute('data-block-id', '101');
		node.style.visibility = 'collapse';
		document.body.appendChild(node);

		const command = {
			command: 'multiply',
			params: [
				{
					command: 'updateContent',
					params: {
						block: 101,
					},
				},
			],
			tailwindRuntime: {
				landingId: 77,
				rebuildRequired: true,
			},
		};

		setupHistoryGlobals({
			pageObject: {
				view: () => Promise.resolve({
					contentWindow: {
						document,
					},
					contentDocument: document,
				}),
				blocks: () => Promise.resolve(createBlockStorage(new Map([
					[101, {id: 101, node}],
				]))),
			},
		});
		const History = loadHistoryClass();
		const history = createHistoryInstance(History);
		TailwindRuntimeSync.rebuildAndSaveForWindow = () => Promise.resolve('compiled css');

		return history.prepareTailwindRuntimeBatchBeforeHistoryCommand(77, command)
			.then((batchSync) => {
				assert.equal(node.style.visibility, 'hidden');

				const callback = history.createTailwindRuntimeAfterHistoryCommandCallback(77, command, batchSync);

				return callback(command.params[0]);
			})
			.then(() => {
				assert.equal(node.style.visibility, 'collapse');
			})
			.finally(() => {
				node.remove();
				document.getElementById('history-tailwind-pending-style')?.remove();
			})
		;
	});

	it('Should call editor window reload only once when multiple pending blocks fail', () => {
		const node101 = document.createElement('div');
		const node202 = document.createElement('div');
		node101.setAttribute('data-block-id', '101');
		node202.setAttribute('data-block-id', '202');
		document.body.appendChild(node101);
		document.body.appendChild(node202);

		const command = {
			command: 'multiply',
			params: [
				{
					command: 'updateContent',
					params: {
						block: 101,
					},
				},
				{
					command: 'updateContent',
					params: {
						block: 202,
					},
				},
			],
			tailwindRuntime: {
				landingId: 77,
				rebuildRequired: true,
			},
		};
		const reloadCalls = [];
		const rebuildCalls = [];

		setupHistoryGlobals({
			pageObject: {
				view: () => Promise.resolve({
					contentWindow: {
						document,
					},
					contentDocument: document,
				}),
				blocks: () => Promise.resolve(createBlockStorage(new Map([
					[101, {id: 101, node: node101}],
					[202, {id: 202, node: node202}],
				]))),
			},
			editorWindow: {
				location: {
					reload: () => {
						reloadCalls.push('reload');
					},
				},
			},
		});
		const History = loadHistoryClass();
		const history = createHistoryInstance(History);
		TailwindRuntimeSync.rebuildAndSaveForWindow = () => {
			rebuildCalls.push('rebuild');

			return Promise.reject(new Error('tailwind failed'));
		};

		return history.prepareTailwindRuntimeBatchBeforeHistoryCommand(77, command)
			.then((batchSync) => {
				const callback = history.createTailwindRuntimeAfterHistoryCommandCallback(77, command, batchSync);

				return callback(command.params[0])
					.then(() => callback(command.params[1]))
					.then(() => history.rebuildTailwindAfterHistoryCommand(history, 77, command, batchSync));
			})
			.then(() => {
				assert.deepEqual(reloadCalls, ['reload']);
				assert.deepEqual(rebuildCalls, ['rebuild']);
				assert.equal(command.tailwindRuntime.rebuildFailed, true);
			})
			.finally(() => {
				node101.remove();
				node202.remove();
				document.getElementById('history-tailwind-pending-style')?.remove();
			})
		;
	});

	it('Should pass normalized single command into TailwindRuntimeBatchSync afterOperation callback', () => {
		const command = {
			command: 'multiply',
			params: [],
			tailwindRuntime: {
				landingId: 77,
				rebuildRequired: true,
			},
		};
		const operations = [];

		setupHistoryGlobals();
		const History = loadHistoryClass();
		const history = createHistoryInstance(History);
		const batchSync = {
			getPendingBlockIds: () => new Set([101]),
			afterOperation: (operation) => {
				operations.push(operation);

				return Promise.resolve();
			},
		};
		const singleCommand = {
			command: 'updateContent',
			params: {
				block: '101',
				selector: '.landing-block',
			},
		};
		const callback = history.createTailwindRuntimeAfterHistoryCommandCallback(77, command, batchSync);

		return callback(singleCommand).then(() => {
			assert.deepEqual(operations, [
				{
					type: 'update_block',
					blockId: 101,
					raw: singleCommand,
				},
			]);
		});
	});
});
