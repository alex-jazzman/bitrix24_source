/**
 * @module intent/entry
 */
jn.define('intent/entry', (require, exports, module) => {
	const { IntentRegistry } = require('intent/registry');
	const { intentActions } = require('intent/handlers');

	const intentRegistry = new IntentRegistry(intentActions);

	module.exports = {
		/**
		 * Entry of the portal address: the code comes from the address itself.
		 *
		 * @param {string} code
		 * @return {boolean} the code is known and its action applied
		 */
		applyIntentCode: (code) => intentRegistry.apply(code),

		/**
		 * Entry of the application layer start: the code comes from the native slot of the last
		 * notification and is applied at most once per start.
		 *
		 * @return {boolean} the code of the slot is known and its action applied
		 */
		applyIntentFromBridge: () => intentRegistry.applyFromBridge(),
	};
});
