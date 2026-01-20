/**
 * @module onboarding/case
 */
jn.define('onboarding/case', (require, exports, module) => {
	const { CaseLimiter } = require('onboarding/limiter');
	const { Preset } = require('onboarding/const');

	/**
	 * @class Case
	 * @param {CaseParams} params
	 */
	class Case
	{
		/**
		 * @typedef {Object} CaseParams
		 * @property {string} id
		 * @property {Array<string>} [presets=[Preset.ANY]]
		 * @property {string} [activeTab='']
		 * @property {(function(Object): (boolean|Promise<boolean>))[]} [conditions=[]]
		 * @property {function(Object): (void|Promise<void>)} [action=() => {}]
		 * @property {boolean} [shouldSkipUIQueue=false]
		 * @property {boolean} [shouldSkipLimitCheck=false]
		 * @property {boolean} [shouldSkipActiveTabCheck=false]
		 */
		constructor({
			id,
			presets = [Preset.ANY],
			activeTab = '',
			conditions = [],
			action = () => {},
			shouldSkipUIQueue = false,
			shouldSkipLimitCheck = false,
			shouldSkipActiveTabCheck = false,
		})
		{
			this.id = id;
			this.presets = presets;
			this.activeTab = activeTab;
			this.conditions = conditions;
			this.action = action;
			this.shouldSkipUIQueue = shouldSkipUIQueue;
			this.shouldSkipLimitCheck = shouldSkipLimitCheck;
			this.shouldSkipActiveTabCheck = shouldSkipActiveTabCheck;
		}

		/**
		 * @param {Object} context
		 * @returns {Promise<boolean>}
		 */
		async checkConditions(context)
		{
			for (const cond of this.conditions)
			{
				// eslint-disable-next-line no-await-in-loop
				const result = await cond(context);

				if (!result)
				{
					return false;
				}
			}

			return true;
		}

		/**
		 * @param {Object} [context]
		 * @param {CaseHistory} history
		 * @param {string} activeTab
		 * @returns {Promise<void>}
		 */
		runAction(context, history, activeTab)
		{
			const promise = new Promise((resolve) => {
				this.action(context, resolve);

				history.markAsShown(this.id)
					.then(() => {
						CaseLimiter.increment(activeTab);
					})
					.catch((error) => console.error(error));
			});

			promise.then(() => {
				BX.postComponentEvent('BackgroundUIManager::onCloseActiveComponent', []);
			}).catch((error) => console.error(error));

			return promise;
		}
	}

	module.exports = {
		Case,
	};
});
