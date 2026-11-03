/**
 * @module im/messenger/lib/promotion/src/hint/spotlight
 */
jn.define('im/messenger/lib/promotion/src/hint/spotlight', (require, exports, module) => {
	const { Feature } = require('im/messenger/lib/feature');

	const TARGET_PARAMS = {
		useHighlight: false,
		type: 'rectangle',
		// taps past the hint and on its target keep it: the cross and the last step close the onboarding
		disableHideByOutsideClick: true,
		disableHideByTargetClick: true,
	};

	const COMPONENT_PARAMS = {
		showPointer: false,
		pointerMargin: 2,
	};

	/**
	 * Native spotlight of a promo hint: it anchors a component to an element of the messenger, and the
	 * body of the hint is drawn by this extension.
	 *
	 * @class HintSpotlight
	 */
	class HintSpotlight
	{
		#spotlight = null;

		#targetRef = null;

		/**
		 * @param {string|object} targetRef
		 */
		constructor(targetRef)
		{
			this.#targetRef = targetRef;
			// the builds whose setTargetAsync takes the app down drop TARGET_PARAMS in the deprecated
			// setTarget, so they get no spotlight at all rather than a wrong one
			this.#spotlight = Feature.isSpotlightTargetAsyncBroken ? null : dialogs.createSpotlight();
		}

		/**
		 * createSpotlight() may return nothing, and then every method below throws. Consumers ask this
		 * instead of reaching for the native instance themselves.
		 *
		 * @return {boolean}
		 */
		get isCreated()
		{
			return Boolean(this.#spotlight);
		}

		/**
		 * Resolves with the measured target rect, and with an empty one when the target is not on the
		 * screen: there the native resolves with null, which every reader of the rect destructures.
		 *
		 * The deprecated setTarget() is the fallback for native builds that predate the async method: it
		 * measures a target given by string id before the view settles, but a misplaced ear beats no
		 * hint at all.
		 *
		 * @param {string|object} [targetRef] another target to move to; the one of the constructor by default
		 * @return {Promise<MeasuredTargetRect>}
		 */
		async setTargetAsync(targetRef = null)
		{
			this.#targetRef = targetRef ?? this.#targetRef;

			const measuredTarget = this.#spotlight.setTargetAsync
				? await this.#spotlight.setTargetAsync(this.#targetRef, TARGET_PARAMS)
				: this.#spotlight.setTarget(this.#targetRef, TARGET_PARAMS);

			return measuredTarget ?? {};
		}

		/**
		 * @param {LayoutComponent} component
		 */
		setComponent(component)
		{
			this.#spotlight.setComponent(component, COMPONENT_PARAMS);
		}

		/**
		 * @param {function(SpotlightHandlersType): void} handler
		 */
		setHandler(handler)
		{
			this.#spotlight.setHandler(handler);
		}

		show()
		{
			this.#spotlight.show();
		}

		hide()
		{
			this.#spotlight.hide();
		}
	}

	module.exports = {
		HintSpotlight,
	};
});
