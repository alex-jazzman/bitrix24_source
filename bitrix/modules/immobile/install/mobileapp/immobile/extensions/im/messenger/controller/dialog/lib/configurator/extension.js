/**
 * @module im/messenger/controller/dialog/lib/configurator
 */
jn.define('im/messenger/controller/dialog/lib/configurator', (require, exports, module) => {
	const { DialogConfigurator } = require('im/messenger/controller/dialog/lib/configurator/configurator');
	const {
		channelCommentDialogConfig,
		baseDialogConfig,
	} = require('im/messenger/controller/dialog/lib/configurator/configuration');

	module.exports = {
		DialogConfigurator,
		configs: {
			channelCommentDialogConfig,
			baseDialogConfig,
		},
	};
});
