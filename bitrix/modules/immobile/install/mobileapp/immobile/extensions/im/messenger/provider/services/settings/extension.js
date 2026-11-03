/**
 * @module im/messenger/provider/services/settings
 */
jn.define('im/messenger/provider/services/settings', (require, exports, module) => {
	const { DefaultReactionService } = require('im/messenger/provider/services/settings/default-reaction');
	const { DefaultReactionPolicy } = require('im/messenger/provider/services/settings/default-reaction-policy');

	module.exports = {
		DefaultReactionService,
		DefaultReactionPolicy,
	};
});
