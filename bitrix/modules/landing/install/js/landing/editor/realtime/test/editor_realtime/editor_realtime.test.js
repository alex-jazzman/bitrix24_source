import {beforeEach, afterEach, describe, it} from 'mocha';
import {assert} from 'chai';

import {EditorRealtime, __testHooks} from '../../src/index';

describe('landing.editor.realtime', () => {
	let originalBXDescriptor;
	let handlers;

	beforeEach(() => {
		originalBXDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'BX');
		handlers = [];
		__testHooks.reset();
	});

	afterEach(() => {
		__testHooks.reset();
		restoreGlobal('BX', originalBXDescriptor);
	});

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

	const mockGlobal = (name, value) => {
		Object.defineProperty(globalThis, name, {
			value,
			writable: true,
			configurable: true,
		});
	};

	const createSubscriber = () => {
		return (handler) => {
			handlers.push(handler);

			return () => {};
		};
	};

	const mockEditorContext = ({landingId = 3382, block = null, history = null} = {}) => {
		const blocks = {
			get: (blockId) => (`${block?.id}` === `${blockId}` ? block : null),
		};

		mockGlobal('BX', {
			Landing: {
				Main: {
					getInstance: () => ({id: landingId}),
				},
				PageObject: {
					getBlocks: () => blocks,
				},
				History: {
					getInstance: () => history,
				},
			},
		});
	};

	const emit = (payload) => {
		assert.equal(handlers.length, 1);

		return handlers[0](payload);
	};

	const createPayload = (overrides = {}) => ({
		eventName: 'block.changed',
		entityType: 'block',
		entityId: 901,
		action: 'update',
		scope: {
			landingId: 3382,
		},
		meta: {
			reason: 'crm_form_switch',
		},
		...overrides,
	});

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

	it('reloads matching block', async () => {
		const calls = [];
		const block = {
			id: 901,
			reload: () => {
				calls.push('block.reload');

				return Promise.resolve();
			},
		};
		const history = {
			reload: () => {
				calls.push('history.reload');

				return Promise.resolve();
			},
		};

		mockEditorContext({block, history});

		EditorRealtime.init(createSubscriber());
		await emit(createPayload());

		assert.include(calls, 'block.reload');
	});

	it('reloads history after successful block reload', async () => {
		const calls = [];
		const reloadDeferred = createDeferred();
		const block = {
			id: 901,
			reload: () => {
				calls.push('block.reload');

				return reloadDeferred.promise;
			},
		};
		const history = {
			reload: () => {
				calls.push('history.reload');

				return Promise.resolve();
			},
		};

		mockEditorContext({block, history});

		EditorRealtime.init(createSubscriber());
		const handlingPromise = emit(createPayload());

		assert.deepEqual(calls, [
			'block.reload',
		]);

		reloadDeferred.resolve();
		await handlingPromise;

		assert.deepEqual(calls, [
			'block.reload',
			'history.reload',
		]);
	});

	it('ignores payload from another landing', async () => {
		const calls = [];
		const block = {
			id: 901,
			reload: () => {
				calls.push('block.reload');
			},
		};

		mockEditorContext({block});

		EditorRealtime.init(createSubscriber());
		await emit(createPayload({
			scope: {
				landingId: 777,
			},
		}));

		assert.deepEqual(calls, []);
	});

	it('ignores unsupported entity type', async () => {
		const calls = [];
		const block = {
			id: 901,
			reload: () => {
				calls.push('block.reload');
			},
		};

		mockEditorContext({block});

		EditorRealtime.init(createSubscriber());
		await emit(createPayload({entityType: 'site'}));

		assert.deepEqual(calls, []);
	});

	it('ignores unsupported action', async () => {
		const calls = [];
		const block = {
			id: 901,
			reload: () => {
				calls.push('block.reload');
			},
		};

		mockEditorContext({block});

		EditorRealtime.init(createSubscriber());
		await emit(createPayload({action: 'delete'}));

		assert.deepEqual(calls, []);
	});

	it('does not fail when block is unavailable', async () => {
		mockEditorContext();

		EditorRealtime.init(createSubscriber());
		await emit(createPayload());
	});

	it('does not fail when block reload is rejected', async () => {
		const calls = [];
		const block = {
			id: 901,
			reload: () => {
				calls.push('block.reload');

				return Promise.reject(new Error('Reload failed'));
			},
		};
		const history = {
			reload: () => {
				calls.push('history.reload');

				return Promise.resolve();
			},
		};

		mockEditorContext({block, history});

		EditorRealtime.init(createSubscriber());
		await emit(createPayload());

		assert.deepEqual(calls, [
			'block.reload',
		]);
	});

	it('reloads block and does not fail when history is unavailable', async () => {
		const calls = [];
		const block = {
			id: 901,
			reload: () => {
				calls.push('block.reload');

				return Promise.resolve();
			},
		};

		mockEditorContext({block});

		EditorRealtime.init(createSubscriber());
		await emit(createPayload());

		assert.deepEqual(calls, [
			'block.reload',
		]);
	});
});
