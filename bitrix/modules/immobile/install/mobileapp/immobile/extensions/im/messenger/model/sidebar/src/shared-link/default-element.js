/**
 * @module im/messenger/model/sidebar/src/shared-link/default-element
 */

jn.define('im/messenger/model/sidebar/src/shared-link/default-element', (require, exports, module) => {
	const sharedLinkItem = Object.freeze({
		id: 0,
		code: '',
		dateCreate: new Date(),
		dateExpire: null,
		entityId: '',
		entityType: '',
		requireApproval: false,
		type: '',
		url: '',
	});

	module.exports = {
		sharedLinkItem,
	};
});
