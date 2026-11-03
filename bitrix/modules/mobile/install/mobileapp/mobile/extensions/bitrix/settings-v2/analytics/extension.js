/**
 * @module settings-v2/analytics
 */
jn.define('settings-v2/analytics', (require, exports, module) => {
	const { AnalyticsEvent } = require('analytics');

	const TOOL = 'intranet';
	const CATEGORY = 'appearance';
	const SECTION = 'settings';
	const SUB_SECTION = 'appearance';
	const BUNDLES_ELEMENT = 'bundles';

	const AppearanceAnalyticsEvent = {
		VIEW_APPEARANCE: 'view_appearance',
		APPLY_BUNDLE: 'apply_bundle',
	};

	class AppearanceAnalytics
	{
		/**
		 * @param {{ bundlesAvailability: AppearanceBundlesAvailability }} params
		 */
		static sendViewAppearance({ bundlesAvailability })
		{
			AppearanceAnalytics.createEvent(AppearanceAnalyticsEvent.VIEW_APPEARANCE)
				.setP1(bundlesAvailability)
				.send();
		}

		/**
		 * @param {{ bundleId: string, status: string }} params
		 */
		static sendApplyBundle({ bundleId, status })
		{
			AppearanceAnalytics.createEvent(AppearanceAnalyticsEvent.APPLY_BUNDLE)
				.setElement(BUNDLES_ELEMENT)
				.setStatus(status)
				.setP1(bundleId)
				.send();
		}

		/**
		 * @param {string} event
		 * @return {AnalyticsEvent}
		 */
		static createEvent(event)
		{
			return new AnalyticsEvent()
				.setTool(TOOL)
				.setCategory(CATEGORY)
				.setEvent(event)
				.setSection(SECTION)
				.setSubSection(SUB_SECTION);
		}
	}

	module.exports = {
		AppearanceAnalytics,
		AppearanceAnalyticsEvent,
	};
});
