import {GenerationObserver} from 'landing.copilot.generation-observer';
import {ChangeAiSiteEditorSync, __testHooks} from '../../src/change-ai-site-editor-sync';
import * as TailwindRuntimeSyncModule from 'landing.tailwind.runtimesync';
import {Env} from 'landing.env';

const TailwindRuntimeSync = TailwindRuntimeSyncModule?.TailwindRuntimeSync
	|| TailwindRuntimeSyncModule?.default
	|| TailwindRuntimeSyncModule
;

describe('ChangeAiSiteEditorSync', () => {
	let originalBXDescriptor;
	let originalFontsProxyUrlDescriptor;
	let originalTailwindPreload;
	let originalTailwindRebuild;
	let originalTailwindReloadWindow;
	let originalSetInterval;
	let originalClearInterval;
	let originalEnvInstance;
	let intervalIds = [];
	let appendedNodes = [];
	let changeAiSiteEditorSyncSourcePromise = null;

	beforeEach(() => {
		originalBXDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'BX');
		originalFontsProxyUrlDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'fontsProxyUrl');
		originalTailwindPreload = TailwindRuntimeSync.preloadRuntimeForWindow;
		originalTailwindRebuild = TailwindRuntimeSync.rebuildAndSaveForWindow;
		originalTailwindReloadWindow = TailwindRuntimeSync.reloadWindow;
		originalSetInterval = globalThis.setInterval;
		originalClearInterval = globalThis.clearInterval;
		originalEnvInstance = Env.instance;
		Env.createInstance({tailwindRuntimeEnabled: true});
		intervalIds = [];
		globalThis.setInterval = (...args) => {
			const intervalId = originalSetInterval(...args);
			intervalIds.push(intervalId);

			return intervalId;
		};
		globalThis.clearInterval = (intervalId) => {
			intervalIds = intervalIds.filter((currentId) => currentId !== intervalId);

			return originalClearInterval(intervalId);
		};
		TailwindRuntimeSync.preloadRuntimeForWindow = () => Promise.resolve();
		TailwindRuntimeSync.rebuildAndSaveForWindow = () => Promise.resolve('compiled css');
		TailwindRuntimeSync.reloadWindow = () => {};
		appendedNodes = [];
	});

	afterEach(() => {
		intervalIds.forEach((intervalId) => originalClearInterval(intervalId));
		globalThis.setInterval = originalSetInterval;
		globalThis.clearInterval = originalClearInterval;
		appendedNodes.forEach((node) => node.remove());
		TailwindRuntimeSync.preloadRuntimeForWindow = originalTailwindPreload;
		TailwindRuntimeSync.rebuildAndSaveForWindow = originalTailwindRebuild;
		TailwindRuntimeSync.reloadWindow = originalTailwindReloadWindow;
		__testHooks.resetReloadEditorWindowHandler();
		Env.instance = originalEnvInstance;
		restoreGlobal('BX', originalBXDescriptor);
		restoreGlobal('fontsProxyUrl', originalFontsProxyUrlDescriptor);
	});

	const mockGlobal = (name, value) => {
		if (name === 'BX' && value?.Landing && !value.Landing.TailwindRuntimeSync)
		{
			value.Landing.TailwindRuntimeSync = TailwindRuntimeSync;
		}
		if (name === 'BX' && value?.Landing && !value.Landing.Env)
		{
			value.Landing.Env = {
				getInstance: () => ({
					getOptions: () => ({
						tailwindRuntimeEnabled: true,
					}),
				}),
			};
		}

		Object.defineProperty(globalThis, name, {
			value,
			writable: true,
			configurable: true,
		});
	};

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

	const mockEditorReload = (handler) => {
		TailwindRuntimeSync.reloadWindow = handler;
		__testHooks.setReloadEditorWindowHandler(handler);
	};

	const createBlocksCollection = (blocksArray) => {
		const state = [...blocksArray];

		return {
			get: (blockId) => state.find((block) => `${block.id}` === `${blockId}`) || null,
			remove: (block) => {
				const index = state.indexOf(block);
				if (index > -1)
				{
					state.splice(index, 1);
				}
			},
			forEach: (callback) => state.forEach(callback),
			add: (block) => {
				if (!state.includes(block))
				{
					state.push(block);
				}
			},
			clear: () => {
				state.splice(0, state.length);
			},
			toArray: () => [...state],
		};
	};

	const createObserverBlocks = (calls, ids) => {
		const area = document.createElement('div');
		area.className = 'landing-area';
		area.setAttribute('data-landing', '77');
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
				parent: area,
				forceInit: () => {
					calls.push(`forceInit:${id}`);
				},
				createEvent: () => ({id}),
				reload: () => {
					calls.push(`reload:${id}`);

					return Promise.resolve();
				},
			};
		});

		return {
			area,
			blocks,
			collection: createBlocksCollection(blocks),
		};
	};

	const captureConsoleLogs = () => {
		const logs = [];
		const warnings = [];
		const infos = [];
		const errors = [];
		const originalLog = console.log;
		const originalWarn = console.warn;
		const originalInfo = console.info;
		const originalError = console.error;

		console.log = (...args) => {
			logs.push(args);
		};
		console.warn = (...args) => {
			warnings.push(args);
		};
		console.info = (...args) => {
			infos.push(args);
		};
		console.error = (...args) => {
			errors.push(args);
		};

		return {
			logs,
			warnings,
			infos,
			errors,
			restore: () => {
				console.log = originalLog;
				console.warn = originalWarn;
				console.info = originalInfo;
				console.error = originalError;
			},
		};
	};

	const createDeferred = () => {
		let resolve;
		let reject;
		const promise = new Promise((promiseResolve, promiseReject) => {
			resolve = promiseResolve;
			reject = promiseReject;
		});

		return {
			promise,
			resolve,
			reject,
		};
	};

	const waitForAsync = () => {
		return new Promise((resolve) => {
			setTimeout(resolve, 0);
		});
	};

	const waitForObserver = () => {
		return waitForAsync().then(() => waitForAsync());
	};

	const assertNoGlobalPendingOverlay = (style, visibleNodes = []) => {
		assert.notStrictEqual(style, null);
		const text = String(style.textContent || '');

		assert.equal(text.includes('html'), false);
		assert.equal(text.includes('body'), false);
		assert.equal(text.includes('position: fixed'), false);
		visibleNodes.forEach((node) => {
			assert.equal(node.style.visibility, '');
			assert.equal(node.getAttribute('data-change-ai-tailwind-pending'), null);
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
			.find((item) => String(item.src || '').includes('change-ai-site-editor-sync.bundle.js'))
		;

		if (script)
		{
			return new URL('change-ai-site-editor-sync.bundle.js.map', script.src).toString();
		}

		return '/bitrix/js/landing/copilot/change-ai-site-editor-sync/dist/change-ai-site-editor-sync.bundle.js.map';
	};

	const getChangeAiSiteEditorSyncSource = () => {
		if (!changeAiSiteEditorSyncSourcePromise)
		{
			if (isNode())
			{
				const fs = process.getBuiltinModule('fs');
				const path = process.getBuiltinModule('path');

				changeAiSiteEditorSyncSourcePromise = Promise.resolve(
					fs.readFileSync(path.resolve(__dirname, '../../src/change-ai-site-editor-sync.js'), 'utf8'),
				);
			}
			else
			{
				changeAiSiteEditorSyncSourcePromise = fetch(getBundleMapUrl())
					.then((response) => response.json())
					.then((map) => {
						const index = map.sources.findIndex((source) => source.endsWith('/src/change-ai-site-editor-sync.js'));

						assert.notStrictEqual(index, -1);

						return map.sourcesContent[index];
					})
				;
			}
		}

		return changeAiSiteEditorSyncSourcePromise;
	};

	const createObserverFixture = (options = {}) => {
		const calls = options.calls || [];
		let subscriptionCallback = null;
		const landingId = options.landingId || 77;
		Env.createInstance({tailwindRuntimeEnabled: options.tailwindRuntimeEnabled ?? true});
		const observerBlocks = createObserverBlocks(calls, options.ids || [101, 202, 303]);
		const main = {
			id: landingId,
			currentBlock: options.currentBlock || null,
			currentArea: options.currentArea || observerBlocks.area,
			insertBefore: options.insertBefore || false,
			addBlock: (response) => {
				calls.push('addBlock');
				const blockId = parseInt(response?.blockId || response?.id, 10) || 0;
				const node = document.createElement('div');
				node.className = 'block-wrapper';
				node.setAttribute('data-block-id', `${blockId}`);
				const area = main.currentArea || observerBlocks.area;
				const targetNode = main.currentBlock?.node || null;
				if (targetNode && main.insertBefore)
				{
					area.insertBefore(node, targetNode);
				}
				else if (targetNode)
				{
					area.insertBefore(node, targetNode.nextSibling);
				}
				else
				{
					area.appendChild(node);
				}

				const block = {
					id: blockId,
					node,
					parent: area,
					forceInit: () => {
						calls.push(`forceInit:${blockId}`);
					},
					createEvent: () => ({id: blockId}),
					reload: () => {
						calls.push(`reload:${blockId}`);

						return Promise.resolve();
					},
				};
				observerBlocks.collection.add(block);

				return Promise.resolve(block);
			},
			adjustEmptyAreas: () => {
				calls.push('adjustEmptyAreas');
			},
			...options.main,
		};

		mockGlobal('BX', {
			PULL: {
				subscribe: ({callback}) => {
					subscriptionCallback = callback;
				},
			},
			PullClient: {
				SubscriptionType: {
					Server: 'server',
				},
			},
			Landing: {
				Main: {
					getInstance: () => main,
				},
				PageObject: {
					getBlocks: () => observerBlocks.collection,
				},
				Backend: {
					getInstance: () => ({
						action: options.backendAction || ((actionName, payload) => {
							calls.push(`backend:${actionName}:${payload?.block || 0}`);

							return Promise.resolve({blockId: payload?.block});
						}),
					}),
				},
				History: {
					getInstance: () => ({
						reload: () => {
							calls.push('historyReload');

							return Promise.resolve();
						},
					}),
				},
				Env: {
					getInstance: () => ({
						getOptions: () => ({
							tailwindRuntimeEnabled: options.tailwindRuntimeEnabled ?? true,
						}),
					}),
				},
			},
			onCustomEvent: options.onCustomEvent || (() => {}),
			ajax: {
				runAction: () => Promise.resolve(),
			},
		});

		const observer = new GenerationObserver(options.generationId || null, {landingId});
		observer.observe();

		const createEventParams = (eventOptions = {}, payload = {}) => {
			const params = {
				generationId: eventOptions.generationId,
				params: payload,
			};
			if (eventOptions.omitLandingId !== true)
			{
				params.landingId = eventOptions.landingId === undefined ? landingId : eventOptions.landingId;
			}

			return params;
		};

		const triggerFinish = (actions, eventOptions = {}) => {
			subscriptionCallback({
				command: 'LandingCopilotGeneration:onChangeAiSiteFinish',
				params: createEventParams(eventOptions, {
					fonts: eventOptions.fonts,
					actions,
				}),
			});
		};

		const triggerPreload = (eventOptions = {}) => {
			subscriptionCallback({
				command: 'LandingCopilotGeneration:onChangeAiSiteTailwindPreload',
				params: createEventParams(eventOptions),
			});
		};

		return {
			calls,
			main,
			observer,
			observerBlocks,
			triggerFinish,
			triggerPreload,
		};
	};

	it('Should be a function', () => {
		assert(typeof ChangeAiSiteEditorSync === 'function');
	});

	it('Should register editor landing resolver and Pull handler on module load', () => {
		const fixture = createObserverFixture({ids: [101], landingId: 77});
		const observer = new GenerationObserver(null);

		assert.equal(observer.getLandingId(), 77);
		fixture.triggerFinish([
			{type: 'update_block', blockId: 101},
		]);

		return waitForObserver().then(() => {
			assert.deepEqual(fixture.calls, ['reload:101', 'historyReload']);
		});
	});

	it('Should ignore ChangeAiSite finish event without explicit landing id', () => {
		const fixture = createObserverFixture({ids: [101], landingId: 77});

		fixture.triggerFinish([
			{type: 'update_block', blockId: 101},
		], {
			omitLandingId: true,
		});

		return waitForObserver().then(() => {
			assert.deepEqual(fixture.calls, []);
		});
	});

	it('Should reload updated block and refresh history on ChangeAiSite finish', () => {
		const calls = [];
		const logs = captureConsoleLogs();
		let subscriptionCallback = null;
		const block = {
			reload: () => {
				calls.push('blockReload');

				return Promise.resolve();
			},
		};
		const blocks = new Map([[321, block]]);
		const blocksCollection = {
			get: (blockId) => blocks.get(blockId),
			remove: () => {},
			forEach: (callback) => blocks.forEach(callback),
		};

		mockGlobal('BX', {
			PULL: {
				subscribe: ({callback}) => {
					subscriptionCallback = callback;
				},
			},
			PullClient: {
				SubscriptionType: {
					Server: 'server',
				},
			},
			Landing: {
				Main: {
					getInstance: () => ({
						id: 77,
					}),
				},
				PageObject: {
					getBlocks: () => blocksCollection,
				},
				Backend: {
					getInstance: () => ({
						action: () => Promise.resolve({}),
					}),
				},
				History: {
					getInstance: () => ({
						reload: () => {
							calls.push('historyReload');

							return Promise.resolve();
						},
						push: () => {
							throw new Error('History.push() must not be used for ChangeAiSite sync');
						},
					}),
				},
			},
			ajax: {
				runAction: () => Promise.resolve(),
			},
			onCustomEvent: () => {},
		});

		const observer = new GenerationObserver(null, {landingId: 77});
		observer.observe();

		subscriptionCallback({
			command: 'LandingCopilotGeneration:onChangeAiSiteFinish',
			params: {
				landingId: 77,
				params: {
					actions: [
						{
							type: 'update_block',
							blockId: 321,
						},
					],
				},
			},
		});

		return waitForAsync().then(() => {
			assert.deepEqual(calls, ['blockReload', 'historyReload']);
			assert.equal(logs.logs.length, 0);
			logs.restore();
		});
	});

	it('Should preload Tailwind runtime on matching ChangeAiSite preload event', () => {
		const calls = [];
		const logs = captureConsoleLogs();
		let subscriptionCallback = null;

			TailwindRuntimeSync.preloadRuntimeForWindow = (targetWindow, options) => {
				calls.push({
					name: 'tailwindPreload',
					targetWindow,
					options,
				});

				return Promise.resolve();
			};

			mockGlobal('BX', {
				message: (code) => (code === 'SITE_TEMPLATE_PATH' ? '/change-template' : ''),
				PULL: {
					subscribe: ({callback}) => {
					subscriptionCallback = callback;
				},
			},
			PullClient: {
				SubscriptionType: {
					Server: 'server',
				},
			},
			Landing: {
				Main: {
					getInstance: () => ({
						id: 77,
					}),
				},
				PageObject: {
					getBlocks: () => ({
						get: () => null,
						remove: () => {},
						forEach: () => {},
					}),
				},
				Backend: {
					getInstance: () => ({
						action: () => Promise.resolve({}),
					}),
				},
				History: {
					getInstance: () => ({
						reload: () => {
							calls.push('historyReload');

							return Promise.resolve();
						},
					}),
				},
			},
			onCustomEvent: () => {},
		});

		const observer = new GenerationObserver(42, {landingId: 77});
		observer.observe();

		subscriptionCallback({
			command: 'LandingCopilotGeneration:onChangeAiSiteTailwindPreload',
			params: {
				generationId: 42,
				landingId: 77,
			},
		});
		subscriptionCallback({
			command: 'LandingCopilotGeneration:onChangeAiSiteTailwindPreload',
			params: {
				generationId: 99,
				landingId: 77,
			},
		});
		subscriptionCallback({
			command: 'LandingCopilotGeneration:onChangeAiSiteTailwindPreload',
			params: {
				generationId: 42,
				landingId: 88,
			},
		});

			return waitForAsync().then(() => {
				assert.equal(calls.length, 1);
				assert.equal(calls[0].name, 'tailwindPreload');
				assert.strictEqual(calls[0].targetWindow, window);
				assert.deepEqual(calls[0].options, {
					helpersBasePath: '/change-template/assets/js/helpers',
				});
				assert.equal(logs.logs.length, 0);
			logs.restore();
		});
	});

	it('Should skip Tailwind preload when capability is disabled', () => {
		const fixture = createObserverFixture({
			tailwindRuntimeEnabled: false,
			landingId: 77,
		});
		let preloadCalls = 0;
		TailwindRuntimeSync.preloadRuntimeForWindow = () => {
			preloadCalls++;

			return Promise.resolve();
		};

		fixture.triggerPreload({
			landingId: 77,
		});

		return waitForAsync().then(() => {
			assert.equal(preloadCalls, 0);
			assert.deepEqual(fixture.calls, []);
		});
	});

	it('Should handle matching ChangeAiSite start event without console log', () => {
		let subscriptionCallback = null;
		const logs = captureConsoleLogs();

		mockGlobal('BX', {
			PULL: {
				subscribe: ({callback}) => {
					subscriptionCallback = callback;
				},
			},
			PullClient: {
				SubscriptionType: {
					Server: 'server',
				},
			},
			Landing: {
				Main: {
					getInstance: () => ({
						id: 77,
					}),
				},
				PageObject: {
					getBlocks: () => ({
						get: () => null,
						remove: () => {},
						forEach: () => {},
					}),
				},
				Backend: {
					getInstance: () => ({
						action: () => Promise.resolve({}),
					}),
				},
			},
		});

		const observer = new GenerationObserver(42, {landingId: 77});
		observer.observe();

		subscriptionCallback({
			command: 'LandingCopilotGeneration:onChangeAiSiteStart',
			params: {
				generationId: 42,
				siteId: 15,
				landingId: 77,
				params: {
					scenario: 'change_ai_site',
					eventType: 'start',
					stepCode: 'init_context',
					input: ['Update hero', 'Add CTA'],
				},
			},
		});

		return waitForAsync().then(() => {
			assert.equal(logs.logs.length, 0);
			logs.restore();
		});
	});

	it('Should handle matching ChangeAiSite target-blocks event without console log and ignore mismatched editor scope', () => {
		let subscriptionCallback = null;
		const logs = captureConsoleLogs();

		mockGlobal('BX', {
			PULL: {
				subscribe: ({callback}) => {
					subscriptionCallback = callback;
				},
			},
			PullClient: {
				SubscriptionType: {
					Server: 'server',
				},
			},
			Landing: {
				Main: {
					getInstance: () => ({
						id: 77,
					}),
				},
				PageObject: {
					getBlocks: () => ({
						get: () => null,
						remove: () => {},
						forEach: () => {},
					}),
				},
				Backend: {
					getInstance: () => ({
						action: () => Promise.resolve({}),
					}),
				},
			},
		});

		const observer = new GenerationObserver(42, {landingId: 77});
		observer.observe();

		subscriptionCallback({
			command: 'LandingCopilotGeneration:onChangeAiSiteTargetBlocksResolved',
			params: {
				generationId: 99,
				landingId: 77,
				params: {
					scenario: 'change_ai_site',
					eventType: 'target_blocks_resolved',
					stepCode: 'init_target_blocks',
				},
			},
		});
		subscriptionCallback({
			command: 'LandingCopilotGeneration:onChangeAiSiteTargetBlocksResolved',
			params: {
				generationId: 42,
				landingId: 88,
				params: {
					scenario: 'change_ai_site',
					eventType: 'target_blocks_resolved',
					stepCode: 'init_target_blocks',
				},
			},
		});
		subscriptionCallback({
			command: 'LandingCopilotGeneration:onChangeAiSiteTargetBlocksResolved',
			params: {
				generationId: 42,
				landingId: 77,
				params: {
					scenario: 'change_ai_site',
					eventType: 'target_blocks_resolved',
					stepCode: 'init_target_blocks',
					actions: [
						{
							actionId: 'update_10',
							type: 'update_block',
							blockId: 10,
							sourceBlockId: 10,
							placement: null,
							editMode: 'targeted_edit',
							originalHtml: '<section>heavy</section>',
						},
					],
					htmlBlocks: [
						{
							actionId: 'update_10',
							actionType: 'update_block',
							blockId: 110,
							sourceBlockId: 10,
							placement: null,
							editMode: 'targeted_edit',
							generatedHtml: '<section>heavy</section>',
							aiMeta: {tokenUsage: 10},
						},
					],
					skippedIds: ['90'],
					skippedReasons: {
						90: 'BLOCK_NOT_FOUND_IN_EDIT_MODE',
					},
				},
			},
		});

		return waitForAsync().then(() => {
			assert.equal(logs.logs.length, 0);
			logs.restore();
		});
	});

	it('Should log preload warning and skip reloads when Tailwind preload fails', () => {
		const calls = [];
		let subscriptionCallback = null;
		const logs = captureConsoleLogs();

		TailwindRuntimeSync.preloadRuntimeForWindow = () => Promise.reject(new Error('tailwind preload failed'));
		mockEditorReload(() => {
			calls.push('windowReload');
		});

		mockGlobal('BX', {
			PULL: {
				subscribe: ({callback}) => {
					subscriptionCallback = callback;
				},
			},
			PullClient: {
				SubscriptionType: {
					Server: 'server',
				},
			},
			Landing: {
				Main: {
					getInstance: () => ({
						id: 77,
					}),
				},
				PageObject: {
					getBlocks: () => ({
						get: () => null,
						remove: () => {},
						forEach: () => {},
					}),
				},
				Backend: {
					getInstance: () => ({
						action: () => Promise.resolve({}),
					}),
				},
				History: {
					getInstance: () => ({
						reload: () => {
							calls.push('historyReload');

							return Promise.resolve();
						},
					}),
				},
			},
			onCustomEvent: () => {},
		});

		const observer = new GenerationObserver(42, {landingId: 77});
		observer.observe();

		subscriptionCallback({
			command: 'LandingCopilotGeneration:onChangeAiSiteTailwindPreload',
			params: {
				generationId: 42,
				landingId: 77,
			},
		});

		return waitForAsync()
			.then(() => {
				assert.deepEqual(calls, []);
				assert.equal(logs.warnings.length, 1);
				assert.equal(logs.warnings[0][0], 'ChangeAiSite Tailwind preload failed');
				assert.equal(logs.warnings[0][1].landingId, 77);
			})
			.finally(() => {
				logs.restore();
			})
		;
	});

	it('Should keep updated block hidden until Tailwind rebuild resolves', () => {
		const calls = [];
		let subscriptionCallback = null;
		const deferred = createDeferred();
		const node = document.createElement('div');
		node.className = 'block-wrapper';
		node.setAttribute('data-block-id', '321');
		document.body.appendChild(node);
		appendedNodes.push(node);

		TailwindRuntimeSync.rebuildAndSaveForWindow = () => {
			calls.push('tailwindRebuild');

			return deferred.promise;
		};

		const block = {
			id: 321,
			node,
			reload: () => {
				calls.push('blockReload');

				return Promise.resolve();
			},
		};
		const blocksCollection = {
			get: (blockId) => (`${blockId}` === '321' ? block : null),
			remove: () => {},
			forEach: (callback) => callback(block),
		};

		mockGlobal('BX', {
			PULL: {
				subscribe: ({callback}) => {
					subscriptionCallback = callback;
				},
			},
			PullClient: {
				SubscriptionType: {
					Server: 'server',
				},
			},
			Landing: {
				Main: {
					getInstance: () => ({
						id: 77,
					}),
				},
				PageObject: {
					getBlocks: () => blocksCollection,
				},
				Backend: {
					getInstance: () => ({
						action: () => Promise.resolve({}),
					}),
				},
				History: {
					getInstance: () => ({
						reload: () => {
							calls.push('historyReload');

							return Promise.resolve();
						},
					}),
				},
			},
			onCustomEvent: () => {},
		});

		const observer = new GenerationObserver(null, {landingId: 77});
		observer.observe();

		subscriptionCallback({
			command: 'LandingCopilotGeneration:onChangeAiSiteFinish',
			params: {
				landingId: 77,
				params: {
					actions: [
						{
							type: 'update_block',
							blockId: 321,
						},
					],
				},
			},
		});

		return waitForAsync()
			.then(() => {
				assert.deepEqual(calls, ['blockReload', 'tailwindRebuild']);
				assert.equal(node.getAttribute('data-change-ai-tailwind-pending'), '1');
				assert.equal(node.style.visibility, 'hidden');
			})
			.then(() => {
				deferred.resolve('compiled css');

				return waitForAsync();
			})
			.then(() => {
				assert.deepEqual(calls, ['blockReload', 'tailwindRebuild', 'historyReload']);
				assert.equal(node.hasAttribute('data-change-ai-tailwind-pending'), false);
				assert.equal(node.style.visibility, '');
			})
		;
	});

	it('Should sync actions without Tailwind batch when capability is disabled', () => {
		const fixture = createObserverFixture({
			ids: [101],
			tailwindRuntimeEnabled: false,
		});
		const node = fixture.observerBlocks.collection.get(101).node;
		TailwindRuntimeSync.rebuildAndSaveForWindow = () => {
			fixture.calls.push('tailwindRebuild');

			return Promise.resolve('compiled css');
		};

		fixture.triggerFinish([
			{type: 'update_block', blockId: 101},
		]);

		return waitForObserver().then(() => {
			assert.deepEqual(fixture.calls, ['reload:101', 'historyReload']);
			assert.equal(node.getAttribute('data-change-ai-tailwind-pending'), null);
			assert.equal(node.style.visibility, '');
		});
	});

	it('Should reveal two updated blocks after their own Tailwind rebuilds', () => {
		const calls = [];
		let subscriptionCallback = null;
		const firstRebuild = createDeferred();
		const secondRebuild = createDeferred();
		const observerBlocks = createObserverBlocks(calls, [101, 202]);
		const node101 = observerBlocks.collection.get(101).node;
		const node202 = observerBlocks.collection.get(202).node;
		const rebuildQueue = [firstRebuild, secondRebuild];

		TailwindRuntimeSync.rebuildAndSaveForWindow = () => {
			calls.push('tailwindRebuild');

			return rebuildQueue[calls.filter((item) => item === 'tailwindRebuild').length - 1].promise;
		};

		mockGlobal('BX', {
			PULL: {
				subscribe: ({callback}) => {
					subscriptionCallback = callback;
				},
			},
			PullClient: {
				SubscriptionType: {
					Server: 'server',
				},
			},
			Landing: {
				Main: {
					getInstance: () => ({
						id: 77,
					}),
				},
				PageObject: {
					getBlocks: () => observerBlocks.collection,
				},
				Backend: {
					getInstance: () => ({
						action: () => Promise.resolve({}),
					}),
				},
				History: {
					getInstance: () => ({
						reload: () => {
							calls.push('historyReload');

							return Promise.resolve();
						},
					}),
				},
			},
			onCustomEvent: () => {},
		});

		const observer = new GenerationObserver(null, {landingId: 77});
		observer.observe();

		subscriptionCallback({
			command: 'LandingCopilotGeneration:onChangeAiSiteFinish',
			params: {
				landingId: 77,
				params: {
					actions: [
						{
							type: 'update_block',
							blockId: 101,
						},
						{
							type: 'update_block',
							blockId: 202,
						},
					],
				},
			},
		});

		return waitForAsync()
			.then(() => {
				assert.equal(calls.filter((item) => item === 'tailwindRebuild').length, 1);
				assert.equal(node101.style.visibility, 'hidden');
				assert.equal(node202.style.visibility, 'hidden');
				firstRebuild.resolve('compiled css');

				return waitForAsync();
			})
			.then(() => {
				assert.equal(node101.style.visibility, '');
				assert.equal(node202.style.visibility, 'hidden');
				assert.equal(calls.filter((item) => item === 'tailwindRebuild').length, 2);
				assert.equal(calls.includes('historyReload'), false);
				secondRebuild.resolve('compiled css');

				return waitForAsync();
			})
			.then(() => {
				assert.equal(node101.style.visibility, '');
				assert.equal(node202.style.visibility, '');
				assert.equal(calls.includes('historyReload'), true);
			})
			;
	});

	it('Should not start next ChangeAiSite pending reveal before previous rebuild resolves', () => {
		const firstRebuild = createDeferred();
		const secondRebuild = createDeferred();
		const fixture = createObserverFixture({ids: [101, 202]});
		const node101 = fixture.observerBlocks.collection.get(101).node;
		const node202 = fixture.observerBlocks.collection.get(202).node;
		const rebuildQueue = [firstRebuild, secondRebuild];

		TailwindRuntimeSync.rebuildAndSaveForWindow = () => {
			fixture.calls.push('tailwindRebuild');

			return rebuildQueue[fixture.calls.filter((item) => item === 'tailwindRebuild').length - 1].promise;
		};

		fixture.triggerFinish([
			{type: 'update_block', blockId: 101},
			{type: 'update_block', blockId: 202},
		]);

		return waitForAsync()
			.then(() => {
				assert.deepEqual(fixture.calls, ['reload:101', 'tailwindRebuild']);
				assert.equal(node101.style.visibility, 'hidden');
				assert.equal(node202.style.visibility, 'hidden');
				assert.equal(node101.getAttribute('data-change-ai-tailwind-pending'), '1');
				assert.equal(node202.getAttribute('data-change-ai-tailwind-pending'), '1');

				return waitForAsync();
			})
			.then(() => {
				assert.deepEqual(fixture.calls, ['reload:101', 'tailwindRebuild']);
				firstRebuild.resolve('compiled css');

				return waitForAsync();
			})
			.then(() => {
				assert.deepEqual(fixture.calls, ['reload:101', 'tailwindRebuild', 'reload:202', 'tailwindRebuild']);
				assert.equal(node101.style.visibility, '');
				assert.equal(node202.style.visibility, 'hidden');
				secondRebuild.resolve('compiled css');

				return waitForObserver();
			})
			.then(() => {
				assert.deepEqual(fixture.calls, [
					'reload:101',
					'tailwindRebuild',
					'reload:202',
					'tailwindRebuild',
					'historyReload',
				]);
				assert.equal(node101.style.visibility, '');
				assert.equal(node202.style.visibility, '');
			})
		;
	});

	it('Should sync ChangeAiSite fonts into current head without duplicates', () => {
		const calls = [];
		let subscriptionCallback = null;

		mockGlobal('fontsProxyUrl', 'fonts.example.test');
		document.head.querySelectorAll('[data-font="g-font-manrope"], [data-id="g-font-manrope"]')
			.forEach((node) => node.remove())
		;
		mockGlobal('BX', {
			PULL: {
				subscribe: ({callback}) => {
					subscriptionCallback = callback;
				},
			},
			PullClient: {
				SubscriptionType: {
					Server: 'server',
				},
			},
			Landing: {
				Main: {
					getInstance: () => ({
						id: 77,
					}),
				},
				PageObject: {
					getBlocks: () => ({
						get: () => null,
						remove: () => {},
						forEach: () => {},
					}),
				},
				Backend: {
					getInstance: () => ({
						action: () => Promise.resolve({}),
					}),
				},
				History: {
					getInstance: () => ({
						reload: () => {
							calls.push('historyReload');

							return Promise.resolve();
						},
					}),
				},
			},
			onCustomEvent: () => {},
		});

		const observer = new GenerationObserver(null, {landingId: 77});
		observer.observe();

		const event = {
			command: 'LandingCopilotGeneration:onChangeAiSiteFinish',
			params: {
				landingId: 77,
				params: {
					fonts: [
						{
							class: 'g-font-manrope',
							name: 'Manrope',
							generic: 'sans-serif',
						},
					],
				},
			},
		};

		subscriptionCallback(event);
		subscriptionCallback(event);

		return waitForAsync().then(() => {
			const links = [...document.head.querySelectorAll('[data-font="g-font-manrope"]')];
			const styles = [...document.head.querySelectorAll('[data-id="g-font-manrope"]')];
			appendedNodes.push(...links, ...styles);

			assert.equal(links.length, 1);
			assert.equal(styles.length, 1);
			assert.equal(links[0].getAttribute('data-font'), 'g-font-manrope');
			assert(links[0].href.includes('fonts.example.test/css2?family=Manrope:wght@100'));
			assert.equal(styles[0].getAttribute('data-id'), 'g-font-manrope');
			assert(styles[0].textContent.includes('.g-font-manrope'));
			assert.deepEqual(calls, ['historyReload', 'historyReload']);
		});
	});

	it('Should sync ChangeAiSite fonts before reloading changed blocks', () => {
		const calls = [];
		let subscriptionCallback = null;
		const block = {
			reload: () => {
				calls.push({
					name: 'blockReload',
					hasFontLink: document.head.querySelector('[data-font="g-font-sora"]') !== null,
					hasFontStyle: document.head.querySelector('[data-id="g-font-sora"]') !== null,
				});

				return Promise.resolve();
			},
		};
		const blocks = new Map([[401, block]]);

		mockGlobal('fontsProxyUrl', 'fonts.example.test');
		document.head.querySelectorAll('[data-font="g-font-sora"], [data-id="g-font-sora"]')
			.forEach((node) => node.remove())
		;
		mockGlobal('BX', {
			PULL: {
				subscribe: ({callback}) => {
					subscriptionCallback = callback;
				},
			},
			PullClient: {
				SubscriptionType: {
					Server: 'server',
				},
			},
			Landing: {
				Main: {
					getInstance: () => ({
						id: 77,
					}),
				},
				PageObject: {
					getBlocks: () => ({
						get: (blockId) => blocks.get(blockId),
						remove: () => {},
						forEach: (callback) => blocks.forEach(callback),
					}),
				},
				Backend: {
					getInstance: () => ({
						action: () => Promise.resolve({}),
					}),
				},
				History: {
					getInstance: () => ({
						reload: () => {
							calls.push({name: 'historyReload'});

							return Promise.resolve();
						},
					}),
				},
			},
			onCustomEvent: () => {},
		});

		const observer = new GenerationObserver(null, {landingId: 77});
		observer.observe();

		subscriptionCallback({
			command: 'LandingCopilotGeneration:onChangeAiSiteFinish',
			params: {
				landingId: 77,
				params: {
					fonts: [
						{
							class: 'g-font-sora',
							name: 'Sora',
							generic: 'sans-serif',
						},
					],
					actions: [
						{
							type: 'update_block',
							blockId: 401,
						},
					],
				},
			},
		});

		return waitForAsync().then(() => {
			const links = [...document.head.querySelectorAll('[data-font="g-font-sora"]')];
			const styles = [...document.head.querySelectorAll('[data-id="g-font-sora"]')];
			appendedNodes.push(...links, ...styles);

			assert.deepEqual(calls, [
				{
					name: 'blockReload',
					hasFontLink: true,
					hasFontStyle: true,
				},
				{
					name: 'historyReload',
				},
			]);
		});
	});

	it('Should reveal update and add actions incrementally for mixed batch', () => {
		const calls = [];
		let subscriptionCallback = null;
		const firstRebuild = createDeferred();
		const secondRebuild = createDeferred();
		const observerBlocks = createObserverBlocks(calls, [101, 202]);
		const node101 = observerBlocks.collection.get(101).node;
		const backendResponse = {blockId: 303};
		const newNode = document.createElement('div');
		newNode.className = 'block-wrapper';
		newNode.setAttribute('data-block-id', '303');
		const rebuildQueue = [firstRebuild, secondRebuild];

		TailwindRuntimeSync.rebuildAndSaveForWindow = () => {
			calls.push('tailwindRebuild');

			return rebuildQueue[calls.filter((item) => item === 'tailwindRebuild').length - 1].promise;
		};

		mockGlobal('BX', {
			PULL: {
				subscribe: ({callback}) => {
					subscriptionCallback = callback;
				},
			},
			PullClient: {
				SubscriptionType: {
					Server: 'server',
				},
			},
			Landing: {
				Main: {
					getInstance: () => ({
						id: 77,
						currentBlock: null,
						currentArea: observerBlocks.area,
						insertBefore: false,
						addBlock: () => {
							calls.push('addBlock');
							observerBlocks.area.appendChild(newNode);
							const newBlock = {
								id: 303,
								node: newNode,
								parent: observerBlocks.area,
								forceInit: () => {
									calls.push('forceInit:303');
								},
								createEvent: () => ({id: 303}),
								reload: () => Promise.resolve(),
							};
							observerBlocks.collection.add(newBlock);

							return Promise.resolve(newBlock);
						},
						adjustEmptyAreas: () => {
							calls.push('adjustEmptyAreas');
						},
					}),
				},
				PageObject: {
					getBlocks: () => observerBlocks.collection,
				},
				Backend: {
					getInstance: () => ({
						action: (actionName) => {
							if (actionName === 'Block::getContent')
							{
								return Promise.resolve(backendResponse);
							}

							return Promise.resolve({});
						},
					}),
				},
				History: {
					getInstance: () => ({
						reload: () => {
							calls.push('historyReload');

							return Promise.resolve();
						},
					}),
				},
			},
			onCustomEvent: () => {},
		});

		const observer = new GenerationObserver(null, {landingId: 77});
		observer.observe();

		subscriptionCallback({
			command: 'LandingCopilotGeneration:onChangeAiSiteFinish',
			params: {
				landingId: 77,
				params: {
					actions: [
						{
							type: 'update_block',
							blockId: 101,
						},
						{
							type: 'move_block',
							blockId: 101,
							requestedPlacement: {
								mode: 'before',
								blockId: 202,
							},
							resolvedPlacement: {
								mode: 'after',
								blockId: 202,
							},
						},
						{
							type: 'add_block',
							blockId: 303,
							requestedPlacement: {
								mode: 'before',
								blockId: 101,
							},
							resolvedPlacement: {
								mode: 'append',
								blockId: 0,
							},
						},
					],
				},
			},
		});

		return waitForAsync()
			.then(() => {
				assert.equal(calls.filter((item) => item === 'tailwindRebuild').length, 1);
				assert.equal(calls.includes('historyReload'), false);
				assert.equal(node101.getAttribute('data-change-ai-tailwind-pending'), '1');
				assert.equal(node101.style.visibility, 'hidden');
				assert.equal(newNode.isConnected, false);
				firstRebuild.resolve('compiled css');

				return waitForAsync();
			})
			.then(() => {
				assert.equal(node101.hasAttribute('data-change-ai-tailwind-pending'), false);
				assert.equal(node101.style.visibility, '');
				assert.equal(calls.filter((item) => item === 'tailwindRebuild').length, 2);
				assert.equal(calls.includes('historyReload'), false);
				assert.equal(newNode.getAttribute('data-change-ai-tailwind-pending'), '1');
				assert.equal(newNode.style.visibility, 'hidden');
				secondRebuild.resolve('compiled css');

				return waitForAsync();
			})
			.then(() => {
				assert.equal(calls.filter((item) => item === 'tailwindRebuild').length, 2);
				assert.equal(calls.includes('historyReload'), true);
				assert.equal(newNode.hasAttribute('data-change-ai-tailwind-pending'), false);
				assert.equal(newNode.style.visibility, '');
				assert.deepEqual(
					observerBlocks.collection.toArray().map((block) => block.id),
					[202, 101, 303],
				);
			})
		;
	});

	it('Should keep only ChangeAiSite update and add blocks visually hidden during multi-action smoke', () => {
		const firstRebuild = createDeferred();
		const secondRebuild = createDeferred();
		const fixture = createObserverFixture({ids: [101, 202, 303]});
		const node101 = fixture.observerBlocks.collection.get(101).node;
		const node202 = fixture.observerBlocks.collection.get(202).node;
		const node303 = fixture.observerBlocks.collection.get(303).node;
		const rebuildQueue = [firstRebuild, secondRebuild];

		TailwindRuntimeSync.rebuildAndSaveForWindow = () => {
			fixture.calls.push('tailwindRebuild');

			return rebuildQueue[fixture.calls.filter((item) => item === 'tailwindRebuild').length - 1].promise;
		};

		fixture.triggerFinish([
			{
				type: 'update_block',
				blockId: 101,
			},
			{
				type: 'add_block',
				blockId: 404,
				resolvedPlacement: {
					mode: 'append',
					blockId: 0,
				},
			},
			{
				type: 'move_block',
				blockId: 303,
				resolvedPlacement: {
					mode: 'before',
					blockId: 101,
				},
			},
			{
				type: 'delete_block',
				blockId: 202,
			},
		]);

		return waitForAsync()
			.then(() => {
				const style = document.getElementById('change-ai-tailwind-pending-style');

				assert.equal(fixture.calls.filter((item) => item === 'tailwindRebuild').length, 1);
				assert.equal(node101.getAttribute('data-change-ai-tailwind-pending'), '1');
				assert.equal(node101.style.visibility, 'hidden');
				assertNoGlobalPendingOverlay(style, [node202, node303]);
				assert.equal(style.textContent.includes('[data-block-id="101"]'), true);
				assert.equal(style.textContent.includes('[data-block-id="404"]'), true);
				assert.equal(style.textContent.includes('[data-block-id="202"]'), false);
				assert.equal(style.textContent.includes('[data-block-id="303"]'), false);
				assert.equal(fixture.observerBlocks.collection.get(404), null);
				assert.equal(document.body.style.visibility, '');
				firstRebuild.resolve('compiled css');

				return waitForAsync();
			})
			.then(() => {
				const node404 = fixture.observerBlocks.collection.get(404).node;
				const style = document.getElementById('change-ai-tailwind-pending-style');

				assert.equal(node101.hasAttribute('data-change-ai-tailwind-pending'), false);
				assert.equal(node101.style.visibility, '');
				assert.equal(node404.getAttribute('data-change-ai-tailwind-pending'), '1');
				assert.equal(node404.style.visibility, 'hidden');
				assertNoGlobalPendingOverlay(style, [node101, node202, node303]);
				assert.equal(style.textContent.includes('[data-block-id="101"]'), false);
				assert.equal(style.textContent.includes('[data-block-id="404"]'), true);
				assert.equal(fixture.calls.includes('historyReload'), false);
				secondRebuild.resolve('compiled css');

				return waitForObserver();
			})
			.then(() => {
				const node404 = fixture.observerBlocks.collection.get(404).node;

				assert.equal(node404.hasAttribute('data-change-ai-tailwind-pending'), false);
				assert.equal(node404.style.visibility, '');
				assert.equal(node303.style.visibility, '');
				assert.equal(fixture.observerBlocks.collection.get(202), null);
				assert.strictEqual(document.getElementById('change-ai-tailwind-pending-style'), null);
				assert.deepEqual(
					[...fixture.observerBlocks.area.children].map((node) => node.getAttribute('data-block-id')),
					['303', '101', '404'],
				);
				assert.equal(fixture.calls.filter((item) => item === 'historyReload').length, 1);
			})
		;
	});

	it('Should skip Tailwind helper for move-only batch', () => {
		const calls = [];
		let subscriptionCallback = null;
		const observerBlocks = createObserverBlocks(calls, [101, 202, 303]);

		TailwindRuntimeSync.rebuildAndSaveForWindow = () => {
			calls.push('tailwindRebuild');

			return Promise.resolve('compiled css');
		};

		mockGlobal('BX', {
			PULL: {
				subscribe: ({callback}) => {
					subscriptionCallback = callback;
				},
			},
			PullClient: {
				SubscriptionType: {
					Server: 'server',
				},
			},
			Landing: {
				Main: {
					getInstance: () => ({
						id: 77,
						adjustEmptyAreas: () => {
							calls.push('adjustEmptyAreas');
						},
					}),
				},
				PageObject: {
					getBlocks: () => observerBlocks.collection,
				},
				Backend: {
					getInstance: () => ({
						action: () => Promise.resolve({}),
					}),
				},
				History: {
					getInstance: () => ({
						reload: () => {
							calls.push('historyReload');

							return Promise.resolve();
						},
					}),
				},
			},
			onCustomEvent: () => {},
		});

		const observer = new GenerationObserver(null, {landingId: 77});
		observer.observe();

		subscriptionCallback({
			command: 'LandingCopilotGeneration:onChangeAiSiteFinish',
			params: {
				landingId: 77,
				params: {
					actions: [
						{
							type: 'move_block',
							blockId: 303,
							placement: {
								mode: 'before',
								blockId: 101,
							},
						},
						{
							type: 'delete_block',
							blockId: 202,
						},
					],
				},
			},
		});

		return waitForAsync().then(() => {
			assert.equal(calls.includes('tailwindRebuild'), false);
			assert.deepEqual(calls, ['forceInit:303', 'adjustEmptyAreas', 'historyReload']);
			assert.deepEqual(
				[...observerBlocks.area.children].map((node) => node.getAttribute('data-block-id')),
				['303', '101'],
			);
		});
	});

	it('Should reload editor window and skip history reload when Tailwind rebuild fails', () => {
		const reloadDeferred = createDeferred();
		const fixture = createObserverFixture({ids: [401]});
		const block = fixture.observerBlocks.collection.get(401);

		TailwindRuntimeSync.rebuildAndSaveForWindow = () => {
			fixture.calls.push('tailwindRebuild');

			return Promise.reject(new Error('tailwind failed'));
		};
		mockEditorReload(() => {
			fixture.calls.push('windowReload');
			reloadDeferred.resolve();
		});

		fixture.triggerFinish([
			{type: 'update_block', blockId: 401},
		]);

		return reloadDeferred.promise
			.then(() => waitForAsync())
			.then(() => {
				const style = document.getElementById('change-ai-tailwind-pending-style');

				assert.deepEqual(fixture.calls, ['reload:401', 'tailwindRebuild', 'windowReload']);
				assert.equal(block.node.getAttribute('data-change-ai-tailwind-pending'), '1');
				assert.equal(block.node.style.visibility, 'hidden');
				assertNoGlobalPendingOverlay(style);
				assert.equal(style.textContent.includes('[data-block-id="401"]'), true);
				assert.equal(document.body.style.visibility, '');
			})
		;
	});

	it('Should move block before target and sync block storage order', () => {
		const calls = [];
		let subscriptionCallback = null;
		const observerBlocks = createObserverBlocks(calls, [101, 202, 303]);

		mockGlobal('BX', {
			PULL: {
				subscribe: ({callback}) => {
					subscriptionCallback = callback;
				},
			},
			PullClient: {
				SubscriptionType: {
					Server: 'server',
				},
			},
			Landing: {
				Main: {
					getInstance: () => ({
						id: 77,
						adjustEmptyAreas: () => {
							calls.push('adjustEmptyAreas');
						},
					}),
				},
				PageObject: {
					getBlocks: () => observerBlocks.collection,
				},
				Backend: {
					getInstance: () => ({
						action: () => Promise.resolve({}),
					}),
				},
				History: {
					getInstance: () => ({
						reload: () => {
							calls.push('historyReload');

							return Promise.resolve();
						},
					}),
				},
			},
			onCustomEvent: () => {},
		});

		const observer = new GenerationObserver(null, {landingId: 77});
		observer.observe();

		subscriptionCallback({
			command: 'LandingCopilotGeneration:onChangeAiSiteFinish',
			params: {
				landingId: 77,
				params: {
					actions: [
						{
							type: 'move_block',
							blockId: 303,
							placement: {
								mode: 'before',
								blockId: 101,
							},
						},
					],
				},
			},
		});

		return waitForAsync().then(() => {
			assert.deepEqual(
				[...observerBlocks.area.children].map((node) => node.getAttribute('data-block-id')),
				['303', '101', '202'],
			);
			assert.deepEqual(
				observerBlocks.collection.toArray().map((block) => block.id),
				[303, 101, 202],
			);
			assert.deepEqual(calls, ['forceInit:303', 'adjustEmptyAreas', 'historyReload']);
		});
	});

	it('Should apply repeated move actions sequentially for prepend after and append', () => {
		const calls = [];
		let subscriptionCallback = null;
		const observerBlocks = createObserverBlocks(calls, [101, 202, 303, 404]);

		mockGlobal('BX', {
			PULL: {
				subscribe: ({callback}) => {
					subscriptionCallback = callback;
				},
			},
			PullClient: {
				SubscriptionType: {
					Server: 'server',
				},
			},
			Landing: {
				Main: {
					getInstance: () => ({
						id: 77,
						adjustEmptyAreas: () => {
							calls.push('adjustEmptyAreas');
						},
					}),
				},
				PageObject: {
					getBlocks: () => observerBlocks.collection,
				},
				Backend: {
					getInstance: () => ({
						action: () => Promise.resolve({}),
					}),
				},
				History: {
					getInstance: () => ({
						reload: () => {
							calls.push('historyReload');

							return Promise.resolve();
						},
					}),
				},
			},
			onCustomEvent: () => {},
		});

		const observer = new GenerationObserver(null, {landingId: 77});
		observer.observe();

		subscriptionCallback({
			command: 'LandingCopilotGeneration:onChangeAiSiteFinish',
			params: {
				landingId: 77,
				params: {
					actions: [
						{
							type: 'move_block',
							blockId: 404,
							placement: {
								mode: 'prepend',
								blockId: 0,
							},
						},
						{
							type: 'move_block',
							blockId: 404,
							placement: {
								mode: 'after',
								blockId: 202,
							},
						},
						{
							type: 'move_block',
							blockId: 404,
							placement: {
								mode: 'append',
								blockId: 0,
							},
						},
					],
				},
			},
		});

		return waitForAsync().then(() => {
			assert.deepEqual(
				[...observerBlocks.area.children].map((node) => node.getAttribute('data-block-id')),
				['101', '202', '303', '404'],
			);
			assert.deepEqual(
				observerBlocks.collection.toArray().map((block) => block.id),
				[101, 202, 303, 404],
			);
			assert.equal(calls.filter((item) => item === 'historyReload').length, 1);
		});
	});

	it('Should apply update and move for the same block in payload order', () => {
		const calls = [];
		let subscriptionCallback = null;
		const observerBlocks = createObserverBlocks(calls, [101, 202, 303]);

		mockGlobal('BX', {
			PULL: {
				subscribe: ({callback}) => {
					subscriptionCallback = callback;
				},
			},
			PullClient: {
				SubscriptionType: {
					Server: 'server',
				},
			},
			Landing: {
				Main: {
					getInstance: () => ({
						id: 77,
						adjustEmptyAreas: () => {
							calls.push('adjustEmptyAreas');
						},
					}),
				},
				PageObject: {
					getBlocks: () => observerBlocks.collection,
				},
				Backend: {
					getInstance: () => ({
						action: () => Promise.resolve({}),
					}),
				},
				History: {
					getInstance: () => ({
						reload: () => {
							calls.push('historyReload');

							return Promise.resolve();
						},
					}),
				},
			},
			onCustomEvent: () => {},
		});

		const observer = new GenerationObserver(null, {landingId: 77});
		observer.observe();

		subscriptionCallback({
			command: 'LandingCopilotGeneration:onChangeAiSiteFinish',
			params: {
				landingId: 77,
				params: {
					actions: [
						{
							type: 'update_block',
							blockId: 202,
						},
						{
							type: 'move_block',
							blockId: 202,
							requestedPlacement: {
								mode: 'append',
								blockId: 0,
							},
							resolvedPlacement: {
								mode: 'after',
								blockId: 303,
							},
						},
					],
				},
			},
		});

		return waitForAsync().then(() => {
			assert.deepEqual(
				[...observerBlocks.area.children].map((node) => node.getAttribute('data-block-id')),
				['101', '303', '202'],
			);
			assert.deepEqual(
				observerBlocks.collection.toArray().map((block) => block.id),
				[101, 303, 202],
			);
			assert.deepEqual(calls, ['reload:202', 'forceInit:202', 'adjustEmptyAreas', 'historyReload']);
		});
	});

	it('Should log warning and continue batch sync when move source is missing', () => {
		const calls = [];
		let subscriptionCallback = null;
		const observerBlocks = createObserverBlocks(calls, [101, 202]);
		const logs = captureConsoleLogs();

		mockGlobal('BX', {
			PULL: {
				subscribe: ({callback}) => {
					subscriptionCallback = callback;
				},
			},
			PullClient: {
				SubscriptionType: {
					Server: 'server',
				},
			},
			Landing: {
				Main: {
					getInstance: () => ({
						id: 77,
						adjustEmptyAreas: () => {
							calls.push('adjustEmptyAreas');
						},
					}),
				},
				PageObject: {
					getBlocks: () => observerBlocks.collection,
				},
				Backend: {
					getInstance: () => ({
						action: () => Promise.resolve({}),
					}),
				},
				History: {
					getInstance: () => ({
						reload: () => {
							calls.push('historyReload');

							return Promise.resolve();
						},
					}),
				},
			},
			onCustomEvent: () => {},
		});

		const observer = new GenerationObserver(null, {landingId: 77});
		observer.observe();

		subscriptionCallback({
			command: 'LandingCopilotGeneration:onChangeAiSiteFinish',
			params: {
				landingId: 77,
				params: {
					actions: [
						{
							type: 'move_block',
							blockId: 999,
							placement: {
								mode: 'before',
								blockId: 101,
							},
						},
						{
							type: 'update_block',
							blockId: 202,
						},
					],
				},
			},
		});

		return waitForAsync()
			.then(() => {
				assert.deepEqual(
					[...observerBlocks.area.children].map((node) => node.getAttribute('data-block-id')),
					['101', '202'],
				);
				assert.deepEqual(calls, ['reload:202', 'historyReload']);
				assert.equal(logs.warnings.length, 1);
				assert.deepEqual(logs.warnings[0], [
					'ChangeAiSite move skipped: source block not found',
					{
						component: 'change_ai_site.move',
						blockId: 999,
						landingId: 77,
						reason: 'MOVE_BLOCK_SOURCE_NOT_FOUND_IN_EDITOR',
						placement: {
							mode: 'before',
							blockId: 101,
						},
						action: undefined,
						error: undefined,
					},
				]);
			})
			.finally(() => {
				logs.restore();
			})
		;
	});

	it('Should log warning and skip move when source equals target', () => {
		const calls = [];
		let subscriptionCallback = null;
		const observerBlocks = createObserverBlocks(calls, [101, 202, 303]);
		const logs = captureConsoleLogs();

		mockGlobal('BX', {
			PULL: {
				subscribe: ({callback}) => {
					subscriptionCallback = callback;
				},
			},
			PullClient: {
				SubscriptionType: {
					Server: 'server',
				},
			},
			Landing: {
				Main: {
					getInstance: () => ({
						id: 77,
						adjustEmptyAreas: () => {
							calls.push('adjustEmptyAreas');
						},
					}),
				},
				PageObject: {
					getBlocks: () => observerBlocks.collection,
				},
				Backend: {
					getInstance: () => ({
						action: () => Promise.resolve({}),
					}),
				},
				History: {
					getInstance: () => ({
						reload: () => {
							calls.push('historyReload');

							return Promise.resolve();
						},
					}),
				},
			},
			onCustomEvent: () => {},
		});

		const observer = new GenerationObserver(null, {landingId: 77});
		observer.observe();

		subscriptionCallback({
			command: 'LandingCopilotGeneration:onChangeAiSiteFinish',
			params: {
				landingId: 77,
				params: {
					actions: [
						{
							type: 'move_block',
							blockId: 202,
							placement: {
								mode: 'before',
								blockId: 202,
							},
						},
					],
				},
			},
		});

		return waitForAsync()
			.then(() => {
				assert.deepEqual(
					[...observerBlocks.area.children].map((node) => node.getAttribute('data-block-id')),
					['101', '202', '303'],
				);
				assert.deepEqual(calls, ['historyReload']);
				assert.equal(logs.warnings.length, 1);
				assert.deepEqual(logs.warnings[0], [
					'ChangeAiSite move skipped: source equals target',
					{
						component: 'change_ai_site.move',
						blockId: 202,
						landingId: 77,
						reason: 'MOVE_BLOCK_SAME_SOURCE_AND_TARGET',
						placement: {
							mode: 'before',
							blockId: 202,
						},
						action: undefined,
						error: undefined,
					},
				]);
			})
			.finally(() => {
				logs.restore();
			})
		;
	});

	it('Should log info and skip move when requested position does not change', () => {
		const calls = [];
		let subscriptionCallback = null;
		const observerBlocks = createObserverBlocks(calls, [101, 202, 303]);
		const logs = captureConsoleLogs();

		mockGlobal('BX', {
			PULL: {
				subscribe: ({callback}) => {
					subscriptionCallback = callback;
				},
			},
			PullClient: {
				SubscriptionType: {
					Server: 'server',
				},
			},
			Landing: {
				Main: {
					getInstance: () => ({
						id: 77,
						adjustEmptyAreas: () => {
							calls.push('adjustEmptyAreas');
						},
					}),
				},
				PageObject: {
					getBlocks: () => observerBlocks.collection,
				},
				Backend: {
					getInstance: () => ({
						action: () => Promise.resolve({}),
					}),
				},
				History: {
					getInstance: () => ({
						reload: () => {
							calls.push('historyReload');

							return Promise.resolve();
						},
					}),
				},
			},
			onCustomEvent: () => {},
		});

		const observer = new GenerationObserver(null, {landingId: 77});
		observer.observe();

		subscriptionCallback({
			command: 'LandingCopilotGeneration:onChangeAiSiteFinish',
			params: {
				landingId: 77,
				params: {
					actions: [
						{
							type: 'move_block',
							blockId: 101,
							placement: {
								mode: 'prepend',
								blockId: 0,
							},
						},
					],
				},
			},
		});

		return waitForAsync()
			.then(() => {
				assert.deepEqual(
					[...observerBlocks.area.children].map((node) => node.getAttribute('data-block-id')),
					['101', '202', '303'],
				);
				assert.deepEqual(calls, ['historyReload']);
				assert.deepEqual(logs.infos[1], [
					'ChangeAiSite move skipped: no position change',
					{
						component: 'change_ai_site.move',
						blockId: 101,
						landingId: 77,
						reason: 'MOVE_BLOCK_NO_POSITION_CHANGE',
						placement: {
							mode: 'prepend',
							blockId: 0,
						},
						action: undefined,
						error: undefined,
					},
				]);
			})
			.finally(() => {
				logs.restore();
			})
		;
	});

	it('Should continue batch sync when move target is missing', () => {
		const calls = [];
		let subscriptionCallback = null;
		const observerBlocks = createObserverBlocks(calls, [101, 202]);
		const logs = captureConsoleLogs();

		mockGlobal('BX', {
			PULL: {
				subscribe: ({callback}) => {
					subscriptionCallback = callback;
				},
			},
			PullClient: {
				SubscriptionType: {
					Server: 'server',
				},
			},
			Landing: {
				Main: {
					getInstance: () => ({
						id: 77,
						adjustEmptyAreas: () => {
							calls.push('adjustEmptyAreas');
						},
					}),
				},
				PageObject: {
					getBlocks: () => observerBlocks.collection,
				},
				Backend: {
					getInstance: () => ({
						action: () => Promise.resolve({}),
					}),
				},
				History: {
					getInstance: () => ({
						reload: () => {
							calls.push('historyReload');

							return Promise.resolve();
						},
					}),
				},
			},
			onCustomEvent: () => {},
		});

		const observer = new GenerationObserver(null, {landingId: 77});
		observer.observe();

		subscriptionCallback({
			command: 'LandingCopilotGeneration:onChangeAiSiteFinish',
			params: {
				landingId: 77,
				params: {
					actions: [
						{
							type: 'move_block',
							blockId: 101,
							placement: {
								mode: 'before',
								blockId: 999,
							},
						},
						{
							type: 'update_block',
							blockId: 202,
						},
					],
				},
			},
		});

		return waitForAsync()
			.then(() => {
				assert.deepEqual(
					observerBlocks.collection.toArray().map((block) => block.id),
					[101, 202],
				);
				assert.deepEqual(calls, ['reload:202', 'historyReload']);
				assert.equal(logs.warnings.length, 1);
				assert.deepEqual(logs.warnings[0], [
					'ChangeAiSite move skipped: target block not found',
					{
						component: 'change_ai_site.move',
						blockId: 101,
						landingId: 77,
						reason: 'MOVE_BLOCK_TARGET_NOT_FOUND_IN_EDITOR',
						placement: {
							mode: 'before',
							blockId: 999,
						},
						action: undefined,
						error: undefined,
					},
				]);
			})
			.finally(() => {
				logs.restore();
			})
		;
	});

	it('Should apply duplicate update_block for same block according to current Set pending contract', () => {
		const firstRebuild = createDeferred();
		const fixture = createObserverFixture({ids: [101, 202]});
		const node101 = fixture.observerBlocks.collection.get(101).node;

		TailwindRuntimeSync.rebuildAndSaveForWindow = () => {
			fixture.calls.push('tailwindRebuild');

			return firstRebuild.promise;
		};

		fixture.triggerFinish([
			{type: 'update_block', blockId: 101},
			{type: 'update_block', blockId: 101},
		]);

		return waitForAsync()
			.then(() => {
				const style = document.getElementById('change-ai-tailwind-pending-style');

				assert.equal(style.textContent.match(/\[data-block-id="101"\]/g).length, 1);
				assert.deepEqual(fixture.calls, ['reload:101', 'tailwindRebuild']);
				assert.equal(node101.getAttribute('data-change-ai-tailwind-pending'), '1');
				firstRebuild.resolve('compiled css');

				return waitForObserver();
			})
			.then(() => {
				assert.deepEqual(fixture.calls, ['reload:101', 'tailwindRebuild', 'reload:101', 'historyReload']);
				assert.equal(node101.hasAttribute('data-change-ai-tailwind-pending'), false);
			})
		;
	});

	it('Should apply duplicate add_block for same block according to current Set pending contract', () => {
		const firstRebuild = createDeferred();
		const fixture = createObserverFixture({ids: [101, 202]});

		TailwindRuntimeSync.rebuildAndSaveForWindow = () => {
			fixture.calls.push('tailwindRebuild');

			return firstRebuild.promise;
		};

		fixture.triggerFinish([
			{type: 'add_block', blockId: 303},
			{type: 'add_block', blockId: 303},
		]);

		return waitForAsync()
			.then(() => {
				const node303 = fixture.observerBlocks.collection.get(303).node;
				const style = document.getElementById('change-ai-tailwind-pending-style');

				assert.equal(style.textContent.match(/\[data-block-id="303"\]/g).length, 1);
				assert.equal(node303.getAttribute('data-change-ai-tailwind-pending'), '1');
				assert.deepEqual(fixture.calls, [
					'backend:Block::getContent:303',
					'addBlock',
					'adjustEmptyAreas',
					'tailwindRebuild',
				]);
				firstRebuild.resolve('compiled css');

				return waitForObserver();
			})
			.then(() => {
				assert.deepEqual(fixture.calls, [
					'backend:Block::getContent:303',
					'addBlock',
					'adjustEmptyAreas',
					'tailwindRebuild',
					'reload:303',
					'historyReload',
				]);
				assert.equal(fixture.observerBlocks.collection.get(303).node.hasAttribute('data-change-ai-tailwind-pending'), false);
			})
		;
	});

	it('Should handle update_block then move_block for same block with Tailwind reveal before move if payload order says update first', () => {
		const firstRebuild = createDeferred();
		const fixture = createObserverFixture({ids: [101, 202, 303]});
		const block202 = fixture.observerBlocks.collection.get(202);
		block202.forceInit = () => {
			fixture.calls.push(`forceInit:${block202.node.hasAttribute('data-change-ai-tailwind-pending')}`);
		};

		TailwindRuntimeSync.rebuildAndSaveForWindow = () => {
			fixture.calls.push('tailwindRebuild');

			return firstRebuild.promise;
		};

		fixture.triggerFinish([
			{type: 'update_block', blockId: 202},
			{type: 'move_block', blockId: 202, resolvedPlacement: {mode: 'after', blockId: 303}},
		]);

		return waitForAsync()
			.then(() => {
				assert.equal(block202.node.getAttribute('data-change-ai-tailwind-pending'), '1');
				assert.deepEqual(
					[...fixture.observerBlocks.area.children].map((node) => node.getAttribute('data-block-id')),
					['101', '202', '303'],
				);
				firstRebuild.resolve('compiled css');

				return waitForObserver();
			})
			.then(() => {
				assert.equal(block202.node.hasAttribute('data-change-ai-tailwind-pending'), false);
				assert.deepEqual(fixture.calls, ['reload:202', 'tailwindRebuild', 'forceInit:false', 'adjustEmptyAreas', 'historyReload']);
				assert.deepEqual(
					[...fixture.observerBlocks.area.children].map((node) => node.getAttribute('data-block-id')),
					['101', '303', '202'],
				);
			})
		;
	});

	it('Should handle move_block then update_block for same block with reveal on moved node', () => {
		const firstRebuild = createDeferred();
		const fixture = createObserverFixture({ids: [101, 202, 303]});
		const block202 = fixture.observerBlocks.collection.get(202);

		TailwindRuntimeSync.rebuildAndSaveForWindow = () => {
			fixture.calls.push('tailwindRebuild');

			return firstRebuild.promise;
		};

		fixture.triggerFinish([
			{type: 'move_block', blockId: 202, resolvedPlacement: {mode: 'after', blockId: 303}},
			{type: 'update_block', blockId: 202},
		]);

		return waitForAsync()
			.then(() => {
				assert.deepEqual(fixture.calls, ['forceInit:202', 'adjustEmptyAreas', 'reload:202', 'tailwindRebuild']);
				assert.equal(block202.node.getAttribute('data-change-ai-tailwind-pending'), '1');
				assert.deepEqual(
					[...fixture.observerBlocks.area.children].map((node) => node.getAttribute('data-block-id')),
					['101', '303', '202'],
				);
				firstRebuild.resolve('compiled css');

				return waitForObserver();
			})
			.then(() => {
				assert.equal(block202.node.hasAttribute('data-change-ai-tailwind-pending'), false);
				assert.deepEqual(fixture.calls, ['forceInit:202', 'adjustEmptyAreas', 'reload:202', 'tailwindRebuild', 'historyReload']);
			})
		;
	});

	it('Should apply update_block and delete_block for same block without revealing deleted node', () => {
		const firstRebuild = createDeferred();
		const fixture = createObserverFixture({ids: [101, 202]});
		const block202 = fixture.observerBlocks.collection.get(202);

		TailwindRuntimeSync.rebuildAndSaveForWindow = () => {
			fixture.calls.push('tailwindRebuild');

			return firstRebuild.promise;
		};

		fixture.triggerFinish([
			{type: 'update_block', blockId: 202},
			{type: 'delete_block', blockId: 202},
		]);

		return waitForAsync()
			.then(() => {
				assert.equal(block202.node.getAttribute('data-change-ai-tailwind-pending'), '1');
				firstRebuild.resolve('compiled css');

				return waitForObserver();
			})
			.then(() => {
				assert.equal(block202.node.isConnected, false);
				assert.equal(fixture.observerBlocks.collection.get(202), null);
				assert.equal(document.getElementById('change-ai-tailwind-pending-style'), null);
				assert.equal(fixture.calls.filter((item) => item === 'historyReload').length, 1);
			})
		;
	});

	it('Should apply delete_block and add_block for same block id without stale pending node', () => {
		const firstRebuild = createDeferred();
		const fixture = createObserverFixture({ids: [101, 303]});
		const oldNode303 = fixture.observerBlocks.collection.get(303).node;

		TailwindRuntimeSync.rebuildAndSaveForWindow = () => {
			fixture.calls.push('tailwindRebuild');

			return firstRebuild.promise;
		};

		fixture.triggerFinish([
			{type: 'delete_block', blockId: 303},
			{type: 'add_block', blockId: 303},
		]);

		return waitForAsync()
			.then(() => {
				const newNode303 = fixture.observerBlocks.collection.get(303).node;

				assert.notStrictEqual(newNode303, oldNode303);
				assert.equal(oldNode303.isConnected, false);
				assert.equal(newNode303.getAttribute('data-change-ai-tailwind-pending'), '1');
				firstRebuild.resolve('compiled css');

				return waitForObserver();
			})
			.then(() => {
				const newNode303 = fixture.observerBlocks.collection.get(303).node;

				assert.equal(newNode303.hasAttribute('data-change-ai-tailwind-pending'), false);
				assert.equal(oldNode303.isConnected, false);
				assert.equal(fixture.calls.filter((item) => item === 'historyReload').length, 1);
			})
		;
	});

	it('Should not call TailwindRuntimeBatchSync when actions contain only delete_block', () => {
		const fixture = createObserverFixture({ids: [101, 202]});
		TailwindRuntimeSync.rebuildAndSaveForWindow = () => {
			fixture.calls.push('tailwindRebuild');

			return Promise.resolve();
		};

		fixture.triggerFinish([
			{type: 'delete_block', blockId: 202},
		]);

		return waitForObserver().then(() => {
			assert.equal(fixture.observerBlocks.collection.get(202), null);
			assert.equal(document.getElementById('change-ai-tailwind-pending-style'), null);
			assert.deepEqual(fixture.calls, ['historyReload']);
		});
	});

	it('Should not call TailwindRuntimeBatchSync when actions are invalid or non-applied', () => {
		const fixture = createObserverFixture({ids: [101, 202]});
		TailwindRuntimeSync.rebuildAndSaveForWindow = () => {
			fixture.calls.push('tailwindRebuild');

			return Promise.resolve();
		};

		fixture.triggerFinish([
			{type: 'update_block', status: 'failed', blockId: 101},
			{type: 'update_block', status: 'skipped', blockId: 202},
			{type: 'add_block', blockId: 0},
			{type: 'update_block', status: '', blockId: 101},
		]);

		return waitForObserver().then(() => {
			assert.deepEqual(fixture.calls, ['reload:101', 'tailwindRebuild', 'historyReload']);
			assert.equal(document.getElementById('change-ai-tailwind-pending-style'), null);
		});
	});

	it('Should skip history reload when TailwindRuntimeBatchSync constructor is unavailable', () => {
		return getChangeAiSiteEditorSyncSource().then((source) => {
			const pendingCheckPosition = source.indexOf('if (pendingBlockIds.size <= 0)');
			const constructorCheckPosition = source.indexOf("if (typeof TailwindRuntimeBatchSync !== 'function')");
			const rejectionPosition = source.indexOf("return Promise.reject(new Error('Tailwind runtime batch sync is not available.'));");
			const constructorPosition = source.indexOf('const batchSync = new TailwindRuntimeBatchSync({');
			const constructorEndPosition = source.indexOf('});', constructorPosition);
			const constructorSource = source.slice(constructorPosition, constructorEndPosition);
			const finalizePosition = source.indexOf('.then(() => batchSync.finalize())');
			const failedCheckPosition = source.indexOf('if (batchSync.isFailed())', finalizePosition);
			const reloadPosition = source.indexOf('return this.#reloadHistory();', failedCheckPosition);
			const liveSyncCatchPosition = source.indexOf('syncPromise.catch((error)');
			const liveSyncErrorPosition = source.indexOf("this.#logError('ChangeAiSite live sync error'", liveSyncCatchPosition);

			assert.notStrictEqual(pendingCheckPosition, -1);
			assert.notStrictEqual(constructorCheckPosition, -1);
			assert.notStrictEqual(rejectionPosition, -1);
			assert.notStrictEqual(constructorPosition, -1);
			assert.notStrictEqual(constructorEndPosition, -1);
			assert.notStrictEqual(finalizePosition, -1);
			assert.notStrictEqual(failedCheckPosition, -1);
			assert.notStrictEqual(reloadPosition, -1);
			assert.notStrictEqual(liveSyncCatchPosition, -1);
			assert.notStrictEqual(liveSyncErrorPosition, -1);
			assert.equal(pendingCheckPosition < constructorCheckPosition, true);
				assert.equal(constructorCheckPosition < rejectionPosition, true);
				assert.equal(rejectionPosition < constructorPosition, true);
				assert.equal(
					constructorSource.includes('helpersBasePath: this.#resolveTailwindRuntimeHelpersBasePath()'),
					true,
				);
				assert.equal(constructorSource.includes('finalRebuildRequired: false'), true);
			assert.equal(constructorSource.includes('finalRebuildRequired: true'), false);
			assert.equal(finalizePosition < failedCheckPosition, true);
			assert.equal(failedCheckPosition < reloadPosition, true);
		});
	});

	it('Should keep pending blocks hidden when first incremental ChangeAiSite rebuild fails', () => {
		const fixture = createObserverFixture({ids: [101, 202]});
		const node101 = fixture.observerBlocks.collection.get(101).node;
		const node202 = fixture.observerBlocks.collection.get(202).node;
		mockEditorReload(() => {
			fixture.calls.push('windowReload');
		});
		TailwindRuntimeSync.rebuildAndSaveForWindow = () => {
			fixture.calls.push('tailwindRebuild');

			return Promise.reject(new Error('tailwind failed'));
		};

		fixture.triggerFinish([
			{type: 'update_block', blockId: 101},
			{type: 'update_block', blockId: 202},
		]);

		return waitForObserver().then(() => {
			assert.equal(node101.getAttribute('data-change-ai-tailwind-pending'), '1');
			assert.equal(node202.getAttribute('data-change-ai-tailwind-pending'), '1');
			assert.equal(node101.style.visibility, 'hidden');
			assert.equal(node202.style.visibility, 'hidden');
			assert.deepEqual(fixture.calls, ['reload:101', 'tailwindRebuild', 'windowReload', 'reload:202']);
		});
	});

	it('Should keep remaining pending block hidden when second incremental ChangeAiSite rebuild fails', () => {
		const firstRebuild = createDeferred();
		const fixture = createObserverFixture({ids: [101, 202]});
		const node101 = fixture.observerBlocks.collection.get(101).node;
		const node202 = fixture.observerBlocks.collection.get(202).node;
		let rebuildCount = 0;
		mockEditorReload(() => {
			fixture.calls.push('windowReload');
		});
		TailwindRuntimeSync.rebuildAndSaveForWindow = () => {
			rebuildCount++;
			fixture.calls.push('tailwindRebuild');

			return rebuildCount === 1
				? firstRebuild.promise
				: Promise.reject(new Error('second tailwind failed'))
			;
		};

		fixture.triggerFinish([
			{type: 'update_block', blockId: 101},
			{type: 'update_block', blockId: 202},
		]);

		return waitForAsync()
			.then(() => {
				firstRebuild.resolve('compiled css');

				return waitForObserver();
			})
			.then(() => {
				const style = document.getElementById('change-ai-tailwind-pending-style');

				assert.equal(node101.hasAttribute('data-change-ai-tailwind-pending'), false);
				assert.equal(node202.getAttribute('data-change-ai-tailwind-pending'), '1');
				assert.equal(style.textContent.includes('[data-block-id="101"]'), false);
				assert.equal(style.textContent.includes('[data-block-id="202"]'), true);
				assert.equal(fixture.calls.includes('historyReload'), false);
				assert.equal(fixture.calls.filter((item) => item === 'windowReload').length, 1);
			})
		;
	});

	it('Should not call final Tailwind rebuild after all ChangeAiSite pending operations revealed', () => {
		const fixture = createObserverFixture({ids: [101, 202]});
		TailwindRuntimeSync.rebuildAndSaveForWindow = () => {
			fixture.calls.push('tailwindRebuild');

			return Promise.resolve('compiled css');
		};

		fixture.triggerFinish([
			{type: 'update_block', blockId: 101},
			{type: 'update_block', blockId: 202},
		]);

		return waitForObserver().then(() => {
			assert.equal(fixture.calls.filter((item) => item === 'tailwindRebuild').length, 2);
			assert.equal(fixture.calls.filter((item) => item === 'historyReload').length, 1);
		});
	});

	it('Should finalize unrevealed pending blocks when add action fails before afterOperation', () => {
		const failure = new Error('content failed');
		const action = {type: 'add_block', blockId: 303};
		const fixture = createObserverFixture({
			ids: [101],
			backendAction: () => Promise.reject(failure),
		});
		const logs = captureConsoleLogs();

		TailwindRuntimeSync.rebuildAndSaveForWindow = () => {
			fixture.calls.push('tailwindRebuild');

			return Promise.resolve('compiled css');
		};

		fixture.triggerFinish([action]);

		return waitForObserver()
			.then(() => {
				assert.equal(fixture.calls.filter((item) => item === 'tailwindRebuild').length, 1);
				assert.equal(fixture.calls.filter((item) => item === 'historyReload').length, 1);
				assert.equal(document.getElementById('change-ai-tailwind-pending-style'), null);
				assert.equal(logs.errors.length, 1);
				assert.equal(logs.errors[0][0], 'ChangeAiSite action sync failed');
				assert.deepEqual(logs.errors[0][1], {
					component: 'change_ai_site.move',
					blockId: 0,
					landingId: 0,
					reason: '',
					placement: undefined,
					action,
					error: failure,
				});
			})
			.finally(() => {
				logs.restore();
			})
		;
	});

	it('Should restore Main insert state after add_block success and failure', () => {
		const successFixture = createObserverFixture({ids: [101]});
		const previousBlock = {id: 999};
		const previousArea = document.createElement('div');
		successFixture.main.currentBlock = previousBlock;
		successFixture.main.currentArea = previousArea;
		successFixture.main.insertBefore = true;
		TailwindRuntimeSync.rebuildAndSaveForWindow = () => Promise.resolve('compiled css');

		successFixture.triggerFinish([
			{type: 'add_block', blockId: 303},
		]);

		return waitForObserver()
			.then(() => {
				assert.strictEqual(successFixture.main.currentBlock, previousBlock);
					assert.strictEqual(successFixture.main.currentArea, previousArea);
					assert.equal(successFixture.main.insertBefore, true);

					const failureFixture = createObserverFixture({ids: [101]});
					const logs = captureConsoleLogs();
					const failureBlock = {id: 888};
					const failureArea = document.createElement('div');
					failureFixture.main.currentBlock = failureBlock;
					failureFixture.main.currentArea = failureArea;
				failureFixture.main.insertBefore = true;
				failureFixture.main.addBlock = () => Promise.reject(new Error('add failed'));

					failureFixture.triggerFinish([
						{type: 'add_block', blockId: 404},
					]);

					return waitForObserver()
						.then(() => {
							assert.strictEqual(failureFixture.main.currentBlock, failureBlock);
							assert.strictEqual(failureFixture.main.currentArea, failureArea);
							assert.equal(failureFixture.main.insertBefore, true);
							assert.equal(logs.errors.length, 1);
							assert.equal(logs.errors[0][0], 'ChangeAiSite action sync failed');
						})
						.finally(() => {
							logs.restore();
						})
					;
				})
			;
		});

	it('Should use resolvedPlacement over requestedPlacement for add_block', () => {
		const fixture = createObserverFixture({ids: [101, 202]});

		fixture.triggerFinish([
			{
				type: 'add_block',
				blockId: 303,
				requestedPlacement: {mode: 'before', blockId: 101},
				resolvedPlacement: {mode: 'before', blockId: 202},
			},
		]);

		return waitForObserver().then(() => {
			assert.deepEqual(
				[...fixture.observerBlocks.area.children].map((node) => node.getAttribute('data-block-id')),
				['101', '303', '202'],
			);
		});
	});

	it('Should fallback add_block placement to last block when target block is missing', () => {
		const fixture = createObserverFixture({ids: [101, 202]});
		const addContexts = [];
		fixture.main.addBlock = (response) => {
			addContexts.push({
				currentBlockId: fixture.main.currentBlock?.id || null,
				insertBefore: fixture.main.insertBefore,
			});
			const node = document.createElement('div');
			node.className = 'block-wrapper';
			node.setAttribute('data-block-id', `${response.blockId}`);
			fixture.observerBlocks.area.appendChild(node);
			fixture.observerBlocks.collection.add({
				id: response.blockId,
				node,
				parent: fixture.observerBlocks.area,
				reload: () => Promise.resolve(),
			});

			return Promise.resolve();
		};

		fixture.triggerFinish([
			{type: 'add_block', blockId: 303, requestedPlacement: {mode: 'before', blockId: 999}},
		]);

		return waitForObserver().then(() => {
			assert.deepEqual(addContexts, [{currentBlockId: 202, insertBefore: false}]);
			assert.deepEqual(
				[...fixture.observerBlocks.area.children].map((node) => node.getAttribute('data-block-id')),
				['101', '202', '303'],
			);
		});
	});

	it('Should fallback add_block placement to landing area when no blocks exist', () => {
		const fixture = createObserverFixture({ids: []});
		const addContexts = [];
		fixture.main.addBlock = (response) => {
			addContexts.push({
				currentBlock: fixture.main.currentBlock,
				currentArea: fixture.main.currentArea,
				insertBefore: fixture.main.insertBefore,
			});
			const node = document.createElement('div');
			node.className = 'block-wrapper';
			node.setAttribute('data-block-id', `${response.blockId}`);
			fixture.main.currentArea.appendChild(node);
			fixture.observerBlocks.collection.add({
				id: response.blockId,
				node,
				parent: fixture.main.currentArea,
				reload: () => Promise.resolve(),
			});

			return Promise.resolve();
		};

		fixture.triggerFinish([
			{type: 'add_block', blockId: 303},
		]);

		return waitForObserver().then(() => {
			assert.strictEqual(addContexts[0].currentBlock, null);
			assert.strictEqual(addContexts[0].currentArea, fixture.observerBlocks.area);
			assert.equal(addContexts[0].insertBefore, false);
			assert.deepEqual(
				[...fixture.observerBlocks.area.children].map((node) => node.getAttribute('data-block-id')),
				['303'],
			);
		});
	});

	it('Should reload existing block instead of adding when add_block target already exists', () => {
		const fixture = createObserverFixture({
			ids: [303],
			backendAction: () => {
				throw new Error('Block::getContent must not be called for an existing block');
			},
		});

		TailwindRuntimeSync.rebuildAndSaveForWindow = () => {
			fixture.calls.push('tailwindRebuild');

			return Promise.resolve('compiled css');
		};

		fixture.triggerFinish([
			{type: 'add_block', blockId: 303},
		]);

		return waitForObserver().then(() => {
			assert.deepEqual(fixture.calls, ['reload:303', 'tailwindRebuild', 'historyReload']);
		});
	});

	it('Should ignore ChangeAiSite finish event for another landing id without Tailwind side effects', () => {
		const fixture = createObserverFixture({ids: [101], landingId: 77});
		TailwindRuntimeSync.rebuildAndSaveForWindow = () => {
			fixture.calls.push('tailwindRebuild');

			return Promise.resolve('compiled css');
		};

		fixture.triggerFinish([
			{type: 'update_block', blockId: 101},
		], {landingId: 88});

		return waitForObserver().then(() => {
			assert.deepEqual(fixture.calls, []);
			assert.equal(document.getElementById('change-ai-tailwind-pending-style'), null);
			assert.equal(fixture.observerBlocks.collection.get(101).node.hasAttribute('data-change-ai-tailwind-pending'), false);
		});
	});

	it('Should ignore ChangeAiSite finish event for a lower foreign landing id', () => {
		const fixture = createObserverFixture({ids: [101], landingId: 77});
		TailwindRuntimeSync.rebuildAndSaveForWindow = () => {
			fixture.calls.push('tailwindRebuild');

			return Promise.resolve('compiled css');
		};

		fixture.triggerFinish([
			{type: 'update_block', blockId: 101},
		], {landingId: 66});

		return waitForObserver().then(() => {
			assert.deepEqual(fixture.calls, []);
			assert.equal(document.getElementById('change-ai-tailwind-pending-style'), null);
			assert.equal(fixture.observerBlocks.collection.get(101).node.hasAttribute('data-change-ai-tailwind-pending'), false);
		});
	});

	it('Should ignore ChangeAiSite Tailwind preload event for a lower foreign landing id', () => {
		const fixture = createObserverFixture({ids: [101], landingId: 77});
		TailwindRuntimeSync.preloadRuntimeForWindow = () => {
			fixture.calls.push('tailwindPreload');

			return Promise.resolve();
		};

		fixture.triggerPreload({landingId: 66});

		return waitForObserver().then(() => {
			assert.deepEqual(fixture.calls, []);
		});
	});

	it('Should ignore ChangeAiSite finish event without landing id', () => {
		const fixture = createObserverFixture({ids: [101], landingId: 77});

		fixture.triggerFinish([
			{type: 'update_block', blockId: 101},
		], {omitLandingId: true});

		return waitForObserver().then(() => {
			assert.deepEqual(fixture.calls, []);
		});
	});

	it('Should ignore ChangeAiSite finish event for another generation id without Tailwind side effects', () => {
		const fixture = createObserverFixture({ids: [101], landingId: 77, generationId: 42});
		TailwindRuntimeSync.rebuildAndSaveForWindow = () => {
			fixture.calls.push('tailwindRebuild');

			return Promise.resolve('compiled css');
		};

		fixture.triggerFinish([
			{type: 'update_block', blockId: 101},
		], {generationId: 99});

		return waitForObserver().then(() => {
			assert.deepEqual(fixture.calls, []);
			assert.equal(document.getElementById('change-ai-tailwind-pending-style'), null);
			assert.equal(fixture.observerBlocks.collection.get(101).node.hasAttribute('data-change-ai-tailwind-pending'), false);
		});
	});

	it('Should sync fonts before Tailwind pending prepare applies block reload sequence', () => {
		const fixture = createObserverFixture({ids: [101]});
		const block101 = fixture.observerBlocks.collection.get(101);
		const observations = [];
		mockGlobal('fontsProxyUrl', 'fonts.example.test');
		document.head.querySelectorAll('[data-font="g-font-inter"], [data-id="g-font-inter"]')
			.forEach((node) => node.remove())
		;
		block101.reload = () => {
			observations.push({
				hasFontLink: document.head.querySelector('[data-font="g-font-inter"]') !== null,
				hasFontStyle: document.head.querySelector('[data-id="g-font-inter"]') !== null,
				hasPendingAttribute: block101.node.getAttribute('data-change-ai-tailwind-pending') === '1',
			});

			return Promise.resolve();
		};

		fixture.triggerFinish([
			{type: 'update_block', blockId: 101},
		], {
			fonts: [
				{
					class: 'g-font-inter',
					name: 'Inter',
					generic: 'sans-serif',
				},
			],
		});

		return waitForObserver().then(() => {
			const links = [...document.head.querySelectorAll('[data-font="g-font-inter"]')];
			const styles = [...document.head.querySelectorAll('[data-id="g-font-inter"]')];
			appendedNodes.push(...links, ...styles);

			assert.deepEqual(observations, [
				{
					hasFontLink: true,
					hasFontStyle: true,
					hasPendingAttribute: true,
				},
			]);
		});
	});
});
