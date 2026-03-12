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
		 * @param {object} targetParams
		 * @returns {object}
		 */
		setTarget(targetParams = {})
		{
			const { disableHideByOutsideClick = true } = this.options;

			return this.spotlight.setTarget(this.targetRef, {
				useHighlight: false,
				type: 'rectangle',
				disableHideByOutsideClick,
				...targetParams,
			});
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
