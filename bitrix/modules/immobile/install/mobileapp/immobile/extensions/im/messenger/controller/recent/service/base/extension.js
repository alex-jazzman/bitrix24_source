/**
 * @module im/messenger/controller/recent/service/base
 */
jn.define('im/messenger/controller/recent/service/base', (require, exports, module) => {
	const { BaseRecentService } = require('im/messenger/controller/recent/service/base/base');
	const { BaseUiRecentService } = require('im/messenger/controller/recent/service/base/base-ui');

	module.exports = {
		BaseRecentService,
		BaseUiRecentService,
	};
});
