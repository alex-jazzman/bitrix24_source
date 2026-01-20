(() => {
	const require = (ext) => jn.require(ext);

	const { describe, it, expect } = require('testing');
	const { Case } = require('onboarding/case');
	const { Preset } = require('onboarding/const');

	describe('Onboarding: Case', () => {
		it('should init with default values', () => {
			const onboardingCase = new Case({ id: 'test' });

			expect(onboardingCase.id).toBe('test');
			expect(onboardingCase.presets).toEqual([Preset.ANY]);
			expect(onboardingCase.activeTab).toBe('');
			expect(onboardingCase.conditions).toEqual([]);
			expect(typeof onboardingCase.action).toBe('function');
		});

		it('should call action with provided context', async () => {
			const context = { called: false };
			const onboardingCase = new Case({
				id: 'test4',
				action: async (ctx, done) => {
					Object.assign(ctx, { called: true });
					done();
				},
			});

			await onboardingCase.runAction(context);

			expect(context.called).toBeTrue();
		});

		it('should pass conditions when all return true', async () => {
			const onboardingCase = new Case({
				id: 'test2',
				conditions: [
					async () => true,
					async () => 1 < 2,
				],
			});

			const result = await onboardingCase.checkConditions({});
			expect(result).toBeTrue();
		});

		it('should fail conditions when at least one returns false', async () => {
			const onboardingCase = new Case({
				id: 'test3',
				conditions: [
					async () => true,
					async () => false,
					async () => true,
				],
			});

			const result = await onboardingCase.checkConditions({});
			expect(result).toBeFalse();
		});

		it('should support synchronous conditions', async () => {
			const onboardingCase = new Case({
				id: 'test5',
				conditions: [
					() => true,
					() => 42 > 0,
				],
			});

			const result = await onboardingCase.checkConditions({});
			expect(result).toBeTrue();
		});

		it('should stop evaluation of conditions after first false', async () => {
			let secondCheckCalled = false;
			const onboardingCase = new Case({
				id: 'test6',
				conditions: [
					() => false,
					() => {
						secondCheckCalled = true;

						return true;
					},
				],
			});

			const result = await onboardingCase.checkConditions({});
			expect(result).toBeFalse();
			expect(secondCheckCalled).toBeFalse();
		});
	});
})();
