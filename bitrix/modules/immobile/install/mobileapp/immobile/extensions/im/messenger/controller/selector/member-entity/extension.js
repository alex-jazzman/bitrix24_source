/**
 * @module im/messenger/controller/selector/member-entity
 */
jn.define('im/messenger/controller/selector/member-entity', (require, exports, module) => {
	const {
		MemberEntitySelector,
		MemberEntitySelectorGoal,
	} = require('im/messenger/controller/selector/member-entity/member-entity-selector');

	module.exports = { MemberEntitySelector, MemberEntitySelectorGoal };
});
