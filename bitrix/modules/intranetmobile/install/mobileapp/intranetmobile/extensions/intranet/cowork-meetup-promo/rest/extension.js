/**
 * @module intranet/cowork-meetup-promo/rest
 */
jn.define('intranet/cowork-meetup-promo/rest', (require, exports, module) => {
	const { RunActionExecutor } = require('rest');

	/**
	 * The answer is deliberately not cached: the campaign is shorter than any reasonable cache ttl.
	 * @returns {Promise<ActionResponse>}
	 */
	function canShowCoworkMeetupPromo()
	{
		return new RunActionExecutor('intranetmobile.coworkmeetuppromo.canShow').call();
	}

	module.exports = {
		canShowCoworkMeetupPromo,
	};
});
