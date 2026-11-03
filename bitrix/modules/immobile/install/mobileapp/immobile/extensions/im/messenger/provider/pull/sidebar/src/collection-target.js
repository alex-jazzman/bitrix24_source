/**
 * @module im/messenger/provider/pull/sidebar/src/collection-target
 */
jn.define('im/messenger/provider/pull/sidebar/src/collection-target', (require, exports, module) => {
	// A sidebar tab stores its files under the key of the WHOLE subtype set it asked the server for,
	// and SidebarFileService joins that set with this separator. The value is repeated here instead of
	// required: the module has to stay a leaf, and the pull provider must not depend on the sidebar
	// controller. The two definitions are pinned together by the unit suite.
	const COLLECTION_KEY_SEPARATOR = '&';

	/**
	 * @desc Whether a record of this subtype belongs to the collection kept under this key. The only
	 * definition of that condition: the pull provider asks it about the keys of the chat, the file
	 * service about the key of its own tab.
	 * @param {string} collectionKey
	 * @param {string} subType
	 * @return {boolean}
	 */
	function isCollectionTarget(collectionKey, subType)
	{
		return collectionKey.split(COLLECTION_KEY_SEPARATOR).includes(subType);
	}

	/**
	 * @desc Collections of the chat that a record of this subtype belongs to. A record of a single
	 * subtype belongs to every collection whose set contains it, and to none when no tab has loaded
	 * such a collection yet: the tab will fetch it with an ordinary request when it opens.
	 * @param {string[]} collectionKeys
	 * @param {string} subType
	 * @return {string[]}
	 */
	function resolveCollectionTargets(collectionKeys, subType)
	{
		return collectionKeys.filter((key) => isCollectionTarget(key, subType));
	}

	module.exports = {
		COLLECTION_KEY_SEPARATOR,
		isCollectionTarget,
		resolveCollectionTargets,
	};
});
