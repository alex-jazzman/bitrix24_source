import {GenerationObserver} from '../../src/generation-observer';

describe('GenerationObserver', () => {
	let originalBXDescriptor;
	let originalSetInterval;
	let originalClearInterval;
	let intervalId = 0;
	let activeIntervals = [];
	let unregisterCallbacks = [];

	beforeEach(() => {
		originalBXDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'BX');
		originalSetInterval = globalThis.setInterval;
		originalClearInterval = globalThis.clearInterval;
		intervalId = 0;
		activeIntervals = [];
		unregisterCallbacks = [];

		globalThis.setInterval = () => {
			intervalId += 1;
			activeIntervals.push(intervalId);

			return intervalId;
		};
		globalThis.clearInterval = (id) => {
			activeIntervals = activeIntervals.filter((currentId) => currentId !== id);
		};
	});

	afterEach(() => {
		unregisterCallbacks.forEach((unregister) => unregister());
		globalThis.setInterval = originalSetInterval;
		globalThis.clearInterval = originalClearInterval;
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

	const register = (unregister) => {
		unregisterCallbacks.push(unregister);

		return unregister;
	};

	const mockGlobal = (name, value) => {
		Object.defineProperty(globalThis, name, {
			value,
			writable: true,
			configurable: true,
		});
	};

	const createObserverFixture = () => {
		const calls = [];
		let subscriptionCallback = null;

		mockGlobal('BX', {
			PULL: {
				subscribe: (config) => {
					subscriptionCallback = config.callback;
					calls.push(['subscribe', config.moduleId, config.type]);
				},
			},
			PullClient: {
				SubscriptionType: {
					Server: 'server',
				},
			},
			ajax: {
				runAction: (action, options) => {
					calls.push(['runAction', action, options?.data?.generationId]);

					return Promise.resolve();
				},
			},
		});

		return {
			calls,
			trigger: (command, params = {}) => {
				subscriptionCallback({
					command,
					params,
				});
			},
		};
	};

	it('Should be a function', () => {
		assert(typeof GenerationObserver === 'function');
	});

	it('Should restart and stop generation polling from generic Pull commands', () => {
		const fixture = createObserverFixture();
		const observer = new GenerationObserver(42);

		observer.observe();
		assert.deepEqual(activeIntervals, [1]);

		fixture.trigger('LandingCopilotGeneration:onStepExecute', {generationId: 42});
		assert.deepEqual(activeIntervals, [2]);

		fixture.trigger('LandingCopilotGeneration:onGenerationFinish', {generationId: 42});
		assert.deepEqual(activeIntervals, []);
		assert.deepEqual(fixture.calls, [
			['subscribe', 'landing', 'server'],
		]);
	});

	it('Should continue generation execution when time is over', () => {
		const fixture = createObserverFixture();
		const observer = new GenerationObserver(42);

		observer.observe();
		fixture.trigger('LandingCopilotGeneration:onCopilotTimeIsOver', {generationId: 42});

		assert.deepEqual(fixture.calls, [
			['subscribe', 'landing', 'server'],
			['runAction', 'landing.api.copilot.executeGeneration', 42],
		]);
		assert.deepEqual(activeIntervals, [2]);
	});

	it('Should ignore Pull events for another generation id', () => {
		const fixture = createObserverFixture();
		const observer = new GenerationObserver(42);

		observer.observe();
		fixture.trigger('LandingCopilotGeneration:onCopilotTimeIsOver', {generationId: 100});

		assert.deepEqual(fixture.calls, [
			['subscribe', 'landing', 'server'],
		]);
		assert.deepEqual(activeIntervals, [1]);
	});

	it('Should let registered Pull handlers consume events before generic generation handling', () => {
		const fixture = createObserverFixture();
		const handledEvents = [];
		register(GenerationObserver.registerPullHandler({
			handle: (event, observer) => {
				handledEvents.push([event.command, observer.getGenerationId()]);

				return true;
			},
		}));

		const observer = new GenerationObserver(42);
		observer.observe();
		fixture.trigger('LandingCopilotGeneration:onCopilotTimeIsOver', {generationId: 42});

		assert.deepEqual(handledEvents, [
			['LandingCopilotGeneration:onCopilotTimeIsOver', 42],
		]);
		assert.deepEqual(fixture.calls, [
			['subscribe', 'landing', 'server'],
		]);
	});

	it('Should use registered landing id resolvers in constructor and getter fallback', () => {
		register(GenerationObserver.registerLandingIdResolver(() => 77));
		const resolvedInConstructor = new GenerationObserver(null);
		assert.equal(resolvedInConstructor.getLandingId(), 77);

		unregisterCallbacks.pop()();
		const fallbackObserver = new GenerationObserver(null, {landingId: 0});
		register(GenerationObserver.registerLandingIdResolver(() => 55));
		assert.equal(fallbackObserver.getLandingId(), 55);
	});

	it('Should not touch editor globals when no Pull handler is registered', () => {
		const fixture = createObserverFixture();
		Object.defineProperty(globalThis.BX, 'Landing', {
			configurable: true,
			get()
			{
				throw new Error('BX.Landing must not be read by generation observer.');
			},
		});

		const observer = new GenerationObserver(42);
		observer.observe();
		fixture.trigger('LandingCopilotGeneration:onStepExecute', {generationId: 42});

		assert.deepEqual(activeIntervals, [2]);
	});
});
