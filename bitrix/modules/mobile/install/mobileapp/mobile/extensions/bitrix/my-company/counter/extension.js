/**
 * @module my-company/counter
 */
jn.define('my-company/counter', (require, exports, module) => {
	const { Type } = require('type');

	const getPositiveCounter = (value) => (Type.isNumber(value) && value > 0 ? value : 0);

	/**
	 * The entry plate projects counters of the cards inside the section. The same values remain in the
	 * total of the Menu tab, so this sum must never be added to that total as another menu counter.
	 *
	 * @param {object} [counters]
	 * @param {number} [whatsNewCounter]
	 * @return {number}
	 */
	const getMyCompanyCounter = (counters = {}, whatsNewCounter = 0) => (
		getPositiveCounter(counters.total_invitation)
		+ getPositiveCounter(counters.menu_invite)
		+ getPositiveCounter(whatsNewCounter)
	);

	module.exports = { getMyCompanyCounter };
});
