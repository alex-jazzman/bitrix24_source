/**
 * @module layout/ui/banners/universal-promo/src/analytics
 */
jn.define('layout/ui/banners/universal-promo/src/analytics', (require, exports, module) => {
	const { AnalyticsEvent } = require('analytics');

	// The platform holds for the whole session, so the native bridge is asked once instead of per event.
	const PLATFORM = Application.getPlatform();

	// A dismissed campaign is never rendered, so every event the banner sends carries this state.
	const PREVIOUS_STATE_NO_REACTION = 'none';

	const ERROR_CATEGORIES = new Set([
		'request',
		'dto',
		'image',
		'storage',
		'navigation',
	]);

	class UniversalPromoBannerAnalytics
	{
		static sendView(campaign)
		{
			return this.#send('view_banner', campaign.analytics.targetScenario, campaign);
		}

		static sendClick(campaign)
		{
			return this.#send('click_banner', campaign.analytics.targetScenario, campaign);
		}

		static sendOpenHideConfirmation(campaign)
		{
			return this.#send('open_hide_confirmation', 'promo', campaign);
		}

		static sendCancelHide(campaign)
		{
			return this.#send('cancel_hide', 'promo', campaign);
		}

		static sendHide(campaign)
		{
			return this.#send('hide_banner', 'promo', campaign);
		}

		static sendError(category, campaign = null)
		{
			if (!ERROR_CATEGORIES.has(category))
			{
				return false;
			}

			return this.#send('promo_banner_error', category, campaign);
		}

		static #send(event, type, campaign)
		{
			try
			{
				new AnalyticsEvent({
					tool: 'intranet',
					category: 'ava_menu',
					event,
					type,
					c_section: 'ava_menu',
					c_element: 'universal_promo_banner',
					...this.#getCampaignFields(campaign),
				}).send();

				return true;
			}
			catch
			{
				return false;
			}
		}

		static #getCampaignFields(campaign)
		{
			if (!campaign?.id || !campaign?.analytics)
			{
				return {};
			}

			const {
				region,
				portalType,
				ageSegment,
				targetScenario,
			} = campaign.analytics;

			return {
				p1: this.#getParameter('campaignId', campaign.id),
				p2: this.#getParameter('region', region),
				p3: this.#getParameter('portalType', portalType),
				p4: this.#getParameter('ageSegment', ageSegment),
				p5: this.#getSnapshot({
					platform: PLATFORM,
					targetScenario,
					previousState: PREVIOUS_STATE_NO_REACTION,
				}),
			};
		}

		/**
		 * The `p1..p5` contract is `parameterName_value` with the underscore as the single separator,
		 * so a value carrying one of its own would break the split.
		 */
		static #getParameter(name, value)
		{
			return `${name}_${this.#getValue(value)}`;
		}

		/**
		 * Regular reporting parses a snapshot as flat `fieldName: value` pairs, so it must stay one
		 * level deep with string values only.
		 */
		static #getSnapshot(fields)
		{
			const snapshot = {};

			for (const [name, value] of Object.entries(fields))
			{
				snapshot[name] = this.#getValue(value);
			}

			return `promoSnapshot_${JSON.stringify(snapshot)}`;
		}

		static #getValue(value)
		{
			return String(value).replaceAll('_', '-');
		}
	}

	module.exports = { UniversalPromoBannerAnalytics };
});
