/**
 * @module im/messenger/const/src/counter
 */
jn.define('im/messenger/const/src/counter', (require, exports, module) => {
	const COUNTER_OVERFLOW_LIMIT = 100;

	/**
	 * Mirror of the server-side \Bitrix\Im\V2\Chat\Tree\ChatAncestorNavigator::DEFAULT_DEPTH.
	 * The backend subtree read (Reader::readAllByRecentSection) bounds ChatTreeScope to this many
	 * descendant levels, so every client-side subtree traversal of a "read all" must use the same
	 * bound: counters and recent items have to end up in the same state as on the server.
	 * @type {number}
	 */
	const SUBTREE_MAX_DEPTH = 2;

	module.exports = {
		COUNTER_OVERFLOW_LIMIT,
		SUBTREE_MAX_DEPTH,
	};
});
