/**
 * @module new-projects-promo/trigger
 */
jn.define('new-projects-promo/trigger', (require, exports, module) => {
	const { TRIGGER_EVENT } = require('new-projects-promo/const');

	/**
	 * @return {void}
	 */
	function triggerNewProjectsPromo()
	{
		BX.postComponentEvent(TRIGGER_EVENT, [], 'background');
	}

	module.exports = {
		triggerNewProjectsPromo,
	};
});
