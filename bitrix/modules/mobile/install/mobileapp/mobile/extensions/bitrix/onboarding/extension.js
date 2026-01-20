/**
 * @module onboarding
 */
jn.define('onboarding', (require, exports, module) => {
	const { BadgeCode, CaseName, Preset } = require('onboarding/const');
	const { CaseHistory } = require('onboarding/src/history');
	const { CaseLimiter } = require('onboarding/limiter');
	const { CasesRegistry } = require('onboarding/src/registry');
	const { TabPresetsNewUtils } = require('tab-presets');
	const { ActiveTabStore } = require('onboarding/active-tab-store');
	const { MemoryStorage } = require('native/memorystore');

	const extensionData = jnExtensionData.get('onboarding');
	const isFeatureEnabled = extensionData?.isOnboardingEnabled;
	const presetCacheKey = 'presetCache';

	class OnboardingBase
	{
		/**
		 * @protected
		 */
		static queue = Promise.resolve();

		/**
		 * @protected
		 */
		static storage = new MemoryStorage('onboarding');

		/**
		 * @param {string} caseId
		 * @param {Object} [context={}]
		 * @returns {void}
		 */
		static async tryToShow(caseId, context = {})
		{
			return this.tryToShowCasesBatch([{ id: caseId, context }]);
		}

		/**
		 * @param {Array<{id: string, context?: Object}>} casesWithContext
		 * @returns {void}
		 */
		static async tryToShowCasesBatch(casesWithContext = [])
		{
			const normalizesCases = (casesWithContext || []).map(({ id, context }) => ({
				id,
				context: context ?? {},
			}));

			this.queue = (this.queue || Promise.resolve())
				.then(() => this.handleShow(normalizesCases))
				.catch((error) => console.error('Onboarding.show error:', error));

			return this.queue;
		}

		/**
		 * @returns {Array}
		 */
		static getCases()
		{
			return CasesRegistry.getAll() || [];
		}

		/**
		 * @protected
		 */
		static async handleShow(casesWithContext)
		{
			if (!isFeatureEnabled || !casesWithContext?.length)
			{
				return;
			}

			const activeTab = await ActiveTabStore.getActiveTab();
			const cases = this.getCases();
			const history = new CaseHistory();

			/* eslint-disable no-await-in-loop */
			for (const { id: caseId, context = {} } of casesWithContext)
			{
				const onboardingCase = cases.find((e) => e.id === caseId);
				if (!onboardingCase)
				{
					continue;
				}

				if (!await CaseLimiter.canShowMore(
					activeTab,
					onboardingCase.activeTab,
					onboardingCase.shouldSkipLimitCheck,
					onboardingCase.shouldSkipActiveTabCheck,
				))
				{
					continue;
				}

				if (!await this.isCaseAllowed(onboardingCase, history, activeTab))
				{
					continue;
				}

				if (await onboardingCase.checkConditions(context))
				{
					if (onboardingCase.shouldSkipUIQueue)
					{
						await this.showCase(onboardingCase, context, history, activeTab);

						return;
					}

					OnboardingBase.#subscribeToBackgroundUIManagerEvent(onboardingCase, context, history, activeTab);
					OnboardingBase.#ensureUIFree(onboardingCase);
				}
			}
		}

		/**
		 * @protected
		 */
		static async isCaseAllowed(onboardingCase, history, activeTab)
		{
			const presetId = await this.getCurrentPresetName();
			const isShown = await history.isAlreadyShown(onboardingCase.id);

			return !isShown
				&& (onboardingCase.presets.includes(Preset.ANY) || onboardingCase.presets.includes(presetId))
				&& (onboardingCase.activeTab === activeTab || onboardingCase.activeTab === BadgeCode.ANY);
		}

		/**
		 * @protected
		 */
		static async showCase(onboardingCase, context, history, activeTab)
		{
			return new Promise((resolve) => {
				onboardingCase.runAction(context, history, activeTab)
					.catch((error) => console.error('Onboarding.showCase error:', error))
					.finally(() => {
						resolve();
					});
			});
		}

		static #ensureUIFree(onboardingCase)
		{
			const componentName = `onboarding.${onboardingCase.id}`;
			const priority = 2000;

			BX.postComponentEvent(
				'BackgroundUIManagerEvents::tryToOpenComponentFromAnotherContext',
				[
					{
						componentName,
						priority,
						debounceMs: 10,
					},
				],
			);
		}

		static #subscribeToBackgroundUIManagerEvent(onboardingCase, context, history, activeTab)
		{
			BX.addCustomEvent(
				'BackgroundUIManager::openComponentInAnotherContext',
				async (componentName) => {
					if (componentName === `onboarding.${onboardingCase.id}`)
					{
						await this.showCase(onboardingCase, context, history, activeTab);
					}
				},
			);
		}

		/**
		 * @protected
		 */
		static async getCurrentPresetName()
		{
			const presetCache = await this.storage.get(presetCacheKey);
			if (presetCache && presetCache.value !== null)
			{
				return presetCache.value;
			}

			const currentPreset = await TabPresetsNewUtils.getCurrentPresetName();

			await this.storage.set(presetCacheKey, { value: currentPreset });

			return currentPreset;
		}
	}

	module.exports = {
		CaseHistory, // export for tests only
		CaseName,
		OnboardingBase,
	};
});
