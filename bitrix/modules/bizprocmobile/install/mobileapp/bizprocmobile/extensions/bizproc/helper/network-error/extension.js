/**
 * @module bizproc/helper/network-error
 */
jn.define('bizproc/helper/network-error', (require, exports, module) => {
	const { showOfflineToast } = require('toast/offline');

	const NETWORK_ERROR_CODE = 'NETWORK_ERROR';

	/**
	 * Accepts every shape a caller holds - an error list, a single error and the ajax
	 * rejection envelope - so that no caller unwraps the response on its own. Anything else,
	 * an absent set included, is wrapped as is, so entries without a `code` are expected.
	 *
	 * @param {NetworkErrorInput} [errors]
	 * @return {Array<{ code?: string }|undefined|null>}
	 */
	function normalizeErrors(errors)
	{
		if (Array.isArray(errors))
		{
			return errors;
		}

		if (Array.isArray(errors?.errors))
		{
			return errors.errors;
		}

		return [errors];
	}

	/**
	 * @param {NetworkErrorInput} [errors]
	 * @return {boolean}
	 */
	function isNetworkError(errors)
	{
		return normalizeErrors(errors).some((error) => error?.code === NETWORK_ERROR_CODE);
	}

	/**
	 * Shows the platform notification about a lost connection; the text belongs to the module
	 * `mobile`, so none is passed here. Returns whether the notification was shown:
	 * `false` also means a device without native notification support, so the caller
	 * keeps its own fallback. Navigation stays with the caller.
	 *
	 * @param {NetworkErrorInput} [errors]
	 * @param {LayoutWidget} [layoutWidget]
	 * @return {boolean}
	 */
	function handleNetworkError(errors, layoutWidget)
	{
		if (!isNetworkError(errors))
		{
			return false;
		}

		return Boolean(showOfflineToast({}, layoutWidget));
	}

	module.exports = {
		handleNetworkError,
		isNetworkError,
	};
});
