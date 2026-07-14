/**
 * @module im/messenger/lib/params/src/shared-storage
 */
jn.define('im/messenger/lib/params/src/shared-storage', (require, exports, module) => {
	const { MemoryStorage } = require('native/memorystore');

	const SHARED_PARAMS_STORAGE_NAME = 'immobileMessengerSharedParams';
	const SHARED_PARAMS_STORAGE_KEY = 'sharedParams';
	const SHARED_PARAMS_READY_ENTITY_ID = 'immobile:sharedParams::ready';
	const SHARED_PARAMS_DEFAULT_TIMEOUT_MS = 1500;
	const MESSENGER_COMPONENT_CODE = 'im.messenger';

	const sharedParamsStorage = new MemoryStorage(SHARED_PARAMS_STORAGE_NAME);

	/**
	 * @return {boolean} true iff the current JS context is the messenger app (im.messenger).
	 * Other contexts (mailmobile, etc.) get false and read params from the shared snapshot.
	 */
	const isMessengerContext = () => BX.componentParameters.get('COMPONENT_CODE') === MESSENGER_COMPONENT_CODE;

	module.exports = {
		sharedParamsStorage,
		isMessengerContext,
		SHARED_PARAMS_STORAGE_KEY,
		SHARED_PARAMS_READY_ENTITY_ID,
		SHARED_PARAMS_DEFAULT_TIMEOUT_MS,
	};
});
