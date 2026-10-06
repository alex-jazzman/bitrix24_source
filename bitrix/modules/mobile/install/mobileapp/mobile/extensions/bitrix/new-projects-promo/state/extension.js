/**
 * @module new-projects-promo/state
 */
jn.define('new-projects-promo/state', (require, exports, module) => {
	const PROMO_ID = 'PROJECT_AI';
	const PROMO_VERSION = 1;
	const STORAGE_ID = `new-projects-promo:${currentDomain}:${env.userId}:${PROMO_ID}:v${PROMO_VERSION}`;
	const VIEWED_KEY = 'viewed';
	const SYNCED_KEY = 'synced';
	const storage = Application.sharedStorage(STORAGE_ID);

	/**
	 * @return {boolean}
	 */
	function isViewed()
	{
		return storage.get(VIEWED_KEY) === '1';
	}

	/**
	 * @return {boolean}
	 */
	function isSynced()
	{
		return storage.get(SYNCED_KEY) === '1';
	}

	/**
	 * @return {void}
	 */
	function markViewed()
	{
		storage.set(VIEWED_KEY, '1');
	}

	/**
	 * @return {void}
	 */
	function markSynced()
	{
		storage.set(VIEWED_KEY, '1');
		storage.set(SYNCED_KEY, '1');
	}

	module.exports = {
		isViewed,
		isSynced,
		markViewed,
		markSynced,
	};
});
