/**
 * @module ui-system/popups/aha-moment/src/spotlight
 */
jn.define('ui-system/popups/aha-moment/src/spotlight', (require, exports, module) => {
	/**
	 * @class Spotlight
	 * @property {string|object} targetRef
	 * @property {object} options
	 * @return Spotlight
	 */
	class Spotlight
	{
		constructor(targetRef, options = {})
		{
			this.targetRef = targetRef;
			this.options = options;
			this.spotlight = dialogs.createSpotlight();
		}

		/**
		 * createSpotlight() may return nothing, and then every method below throws.
		 * Consumers ask this instead of reaching for the native instance themselves.
		 *
		 * @returns {boolean}
		 */
		get isCreated()
		{
			return Boolean(this.spotlight);
		}

		/**
		 * Resolves with the measured target rect, and with an empty one when the target is not on
		 * screen: there the native resolves with null, which every reader of the rect destructures
		 * and blows up on — the deprecated setTarget() returned undefined and so defaulted cleanly.
		 *
		 * That setTarget() is also the fallback for native builds that predate the async method:
		 * it measures a target given by string id before the view settles, but a misplaced ear
		 * beats no aha-moments at all.
		 *
		 * @param {object} targetParams
		 * @returns {Promise<object>}
		 */
		async setTargetAsync(targetParams = {})
		{
			const { disableHideByOutsideClick = true } = this.options;
			const params = {
				useHighlight: false,
				type: 'rectangle',
				disableHideByOutsideClick,
				...targetParams,
			};

			const measuredTarget = this.spotlight.setTargetAsync
				? await this.spotlight.setTargetAsync(this.targetRef, params)
				: this.spotlight.setTarget(this.targetRef, params);

			return measuredTarget ?? {};
		}

		/**
		 * @param {LayoutComponent} component
		 * @param {object} spotlightParams
		 * @returns {void}
		 */
		setComponent(component, spotlightParams = {})
		{
			this.spotlight.setComponent(component, spotlightParams);
		}

		/**
		 * @param {function} handler
		 * @returns {void}
		 */
		setHandler(handler)
		{
			this.spotlight.setHandler(handler);
		}

		show()
		{
			this.spotlight.show();
		}

		hide()
		{
			this.spotlight.hide();
		}
	}

	module.exports = {
		Spotlight,
	};
});
