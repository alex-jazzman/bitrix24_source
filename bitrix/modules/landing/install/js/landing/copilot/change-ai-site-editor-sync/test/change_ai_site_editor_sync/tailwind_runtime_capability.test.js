import {
	isTailwindRuntimeEnabled,
	normalizeTailwindRuntimeEnabled,
} from '../../src/tailwind-runtime-capability';
import {Env} from 'landing.env';

describe('Tailwind runtime capability', () => {
	let originalEnvInstance;

	beforeEach(() => {
		originalEnvInstance = Env.instance;
		Env.instance = null;
	});

	afterEach(() => {
		Env.instance = originalEnvInstance;
	});

	const mockEnvOptions = (options) => {
		Env.createInstance(options);
	};

	it('Should normalize enabled values', () => {
		[true, 1, '1', 'Y', 'yes', 'true'].forEach((value) => {
			assert.equal(normalizeTailwindRuntimeEnabled(value), true);
		});
	});

	it('Should normalize disabled values', () => {
		[undefined, null, false, 0, '0', 'N', 'no', 'false', '', 'enabled'].forEach((value) => {
			assert.equal(normalizeTailwindRuntimeEnabled(value), false);
		});
	});

	it('Should read capability from Landing Env options', () => {
		mockEnvOptions({
			tailwindRuntimeEnabled: 'Y',
		});

		assert.equal(isTailwindRuntimeEnabled(), true);
	});

	it('Should treat missing Env or option as disabled', () => {
		Env.instance = null;
		assert.equal(isTailwindRuntimeEnabled(), false);

		mockEnvOptions({});
		assert.equal(isTailwindRuntimeEnabled(), false);
	});
});
