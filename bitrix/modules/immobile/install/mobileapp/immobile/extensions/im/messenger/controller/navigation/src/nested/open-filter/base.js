/**
 * @module im/messenger/controller/navigation/src/nested/open-filter/base
 */
jn.define('im/messenger/controller/navigation/src/nested/open-filter/base', (require, exports, module) => {
	/**
	 * @abstract
	 * @class BaseNestedNavigationOpenFilter
	 *
	 * Filters run before opening nested navigation in NavigationManager and can block it
	 * (e.g. show a paywall). A filter owns its side effects when blocking; the manager
	 * only reacts to allow/deny.
	 */
	class BaseNestedNavigationOpenFilter
	{
		/**
		 * @param {NestedNavigationOpenFilterContext} context
		 * @return {Promise<boolean>} resolve true to allow opening, false to block
		 */
		async allow(context)
		{
			throw new Error('BaseNestedNavigationOpenFilter: allow must be implemented');
		}
	}

	module.exports = { BaseNestedNavigationOpenFilter };
});
