/**
 * @module im/messenger/lib/promotion
 */
jn.define('im/messenger/lib/promotion', (require, exports, module) => {
	const { Promotion } = require('im/messenger/lib/promotion/src/promotion');
	const { PromotionTriggerManager, PromotionTriggerType } = require('im/messenger/lib/promotion/src/trigger-manager');

	module.exports = {
		Promotion,
		PromotionTriggerManager,
		PromotionTriggerType,
	};
});
