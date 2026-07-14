/**
 * @module im/messenger/application/lib/dialog-manager/src/open-filter/base
 */
jn.define('im/messenger/application/lib/dialog-manager/src/open-filter/base', (require, exports, module) => {
	/**
	 * @abstract
	 * @class BaseOpenDialogFilter
	 *
	 * Filters run before nested-strategy in DialogManager.openDialog and can block
	 * dialog opening (e.g. show a paywall, navigate elsewhere). A filter is responsible
	 * for its own side effects when blocking; the manager only reacts to allow/deny.
	 *
	 * Filters consume {@link DialogOpenContext} — read derived facts via its memoized
	 * getters (e.g. `await context.isCollabOrChildOfCollab()`) instead of receiving
	 * them as fields.
	 */
	class BaseOpenDialogFilter
	{
		/**
		 * @param {DialogOpenContext} context
		 * @return {Promise<boolean>} resolve true to allow opening, false to block
		 */
		async allow(context)
		{
			throw new Error('BaseOpenDialogFilter: allow must be implemented');
		}
	}

	module.exports = { BaseOpenDialogFilter };
});