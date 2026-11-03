/**
 * @module layout/ui/feedback-router/opener
 */
jn.define('layout/ui/feedback-router/opener', (require, exports, module) => {
	const { checkFeatureFlag, FeatureFlagType } = require('feature-flag');
	const { FeedbackForm } = require('layout/ui/feedback-form-opener');
	const { requireLazy } = require('require-lazy');
	const { RunActionExecutor } = require('rest/run-action-executor');

	const GET_BOT_ID_ACTION = 'mobile.Support.getBotId';
	const GET_BOT_ID_CACHE_TTL = 3600;

	/**
	 * Feedback flow entry point. Behavior depends on the FEEDBACK_ROUTER feature flag
	 * (the check is cached for 24h, so it is cheap):
	 * - flag OFF (default): open the feedback form right away, without the getBotId
	 *   request and without the routing drawer (legacy behavior);
	 * - flag ON: resolve support chat availability via `mobile.Support.getBotId`:
	 *   - chat available (`botId`): show the routing drawer "How can we help?";
	 *   - no chat (box / support off) or a failed request: open the form directly.
	 */
	class FeedbackRouterOpener
	{
		/**
		 * @param {{ formTitle?: string, senderPage?: string, parentWidget?: object }} options
		 * @returns {Promise<void>}
		 */
		static async open(options = {})
		{
			const { formTitle, senderPage, parentWidget } = options;

			const openFeedbackForm = () => {
				(new FeedbackForm({ senderPage })).open({ title: formTitle });
			};

			try
			{
				const routerEnabled = await checkFeatureFlag(FeatureFlagType.FEEDBACK_ROUTER);
				if (!routerEnabled)
				{
					openFeedbackForm();

					return;
				}

				const botId = await FeedbackRouterOpener.#getBotId();
				if (!botId)
				{
					openFeedbackForm();

					return;
				}

				// The drawer extension is optional and off by default, so it is loaded lazily.
				const { FeedbackRouter } = await requireLazy('layout/ui/feedback-router');

				FeedbackRouter.open({
					botId,
					formTitle,
					senderPage,
					parentWidget,
				});
			}
			catch (error)
			{
				console.error(error);
				openFeedbackForm();
			}
		}

		/**
		 * Warms up the feature flag and botId caches in the background, so the tap
		 * on the feedback item does not wait for the network.
		 * @returns {void}
		 */
		static prefetch()
		{
			checkFeatureFlag(FeatureFlagType.FEEDBACK_ROUTER)
				.then((routerEnabled) => (routerEnabled ? FeedbackRouterOpener.#getBotId() : null))
				.catch(console.error);
		}

		/**
		 * @returns {Promise<number|string|null>}
		 */
		static async #getBotId()
		{
			// setCacheHandler is required, otherwise call(true) never reads the cache and always
			// hits the network (the cache short-circuit is gated by onCacheFetched being set).
			const response = await (new RunActionExecutor(GET_BOT_ID_ACTION))
				.setCacheTtl(GET_BOT_ID_CACHE_TTL)
				.setCacheHandler(() => {})
				.setSkipRequestIfCacheExists()
				.call(true);

			// call() resolves even on an error response (does not reject), so check botId explicitly.
			return response?.data?.botId ?? null;
		}
	}

	module.exports = { FeedbackRouterOpener };
});
