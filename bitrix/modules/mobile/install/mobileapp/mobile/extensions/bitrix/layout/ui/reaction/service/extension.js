/**
 * @module layout/ui/reaction/service
 */
jn.define('layout/ui/reaction/service', (require, exports, module) => {
	const { ReactionStorageManager } = require('layout/ui/reaction/service/storage');

	module.exports = {
		ReactionStorageManager,
	};
});
