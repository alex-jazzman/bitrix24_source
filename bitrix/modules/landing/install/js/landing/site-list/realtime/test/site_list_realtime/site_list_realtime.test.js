import {SiteListRealtime, __testHooks} from '../../src/index';

describe('SiteListRealtime', () => {
	let originalBXDescriptor;
	let originalTopDescriptor;
	let originalSetTimeout;
	let originalClearTimeout;
	let timerId = 0;
	let timers = new Map();

	beforeEach(() => {
		originalBXDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'BX');
		originalTopDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'top');
		originalSetTimeout = globalThis.setTimeout;
		originalClearTimeout = globalThis.clearTimeout;
		timerId = 0;
		timers = new Map();
		__testHooks.reset();

		globalThis.setTimeout = (callback, ms) => {
			timerId += 1;
			timers.set(timerId, {callback, ms});

			return timerId;
		};
		globalThis.clearTimeout = (id) => {
			timers.delete(id);
		};
	});

	afterEach(() => {
		__testHooks.reset();
		globalThis.setTimeout = originalSetTimeout;
		globalThis.clearTimeout = originalClearTimeout;
		restoreGlobal('BX', originalBXDescriptor);
		restoreGlobal('top', originalTopDescriptor);
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

	it('Should call landing filter refresh once for debounced site changed events', () => {
		const calls = [];
		const handlers = [];
		const bx = {
			onCustomEvent: (eventName) => {
				calls.push(eventName);
			},
		};

		mockGlobal('BX', bx);
		mockGlobal('top', {BX: bx});

		SiteListRealtime.init((handler) => {
			handlers.push(handler);

			return () => {};
		});

		handlers[0]({entityType: 'landing'});
		handlers[0]({entityType: 'site'});
		handlers[0]({entityType: 'site'});

		assert.equal(timers.size, 1);
		const [timer] = [...timers.values()];
		assert.equal(timer.ms, 500);

		timer.callback();

		assert.deepEqual(calls, [
			'BX.Landing.Filter:apply',
		]);
	});
});
