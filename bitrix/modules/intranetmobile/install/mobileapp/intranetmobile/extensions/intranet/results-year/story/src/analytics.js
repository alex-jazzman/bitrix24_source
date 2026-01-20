/**
 * @module intranet/results-year/story/src/analytics
 */
jn.define('intranet/results-year/story/src/analytics', (require, exports, module) => {

	const { AnalyticsEvent } = require('analytics');

	function sendAnalytics(options)
	{
		const event = new AnalyticsEvent({
			tool: 'intranet',
			c_section: 'profile',
			category: 'year_summary',
			...options,
		});

		event.send();
	}

	module.exports = {
		sendAnalytics,
	};
});
