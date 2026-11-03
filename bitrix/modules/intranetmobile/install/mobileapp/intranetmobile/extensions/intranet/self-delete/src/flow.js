/**
 * @module intranet/self-delete/src/flow
 */
jn.define('intranet/self-delete/src/flow', (require, exports, module) => {
	const { Alert, ButtonType } = require('alert');
	const { Loc } = require('loc');
	const { Notify } = require('notify');
	const { RunActionExecutor } = require('rest/run-action-executor');
	const { dispatch } = require('intranet/self-delete/src/dispatcher');

	/**
	 * Opens the self-delete flow for the current user.
	 * Fetches the scenario fresh on every call (no cache — TOCTOU invariant).
	 *
	 * @param {PageManager} parentWidget — widget to open child screens into
	 */
	async function openSelfDeleteFlow(parentWidget)
	{
		Notify.showIndicatorLoading();

		let response = {};

		try
		{
			response = await new RunActionExecutor('intranet.v2.SelfDelete.getOptionsForCurrentUser').call();
		}
		catch
		{
			Notify.hideCurrentIndicator();
			showNetworkError(parentWidget, () => openSelfDeleteFlow(parentWidget));

			return;
		}

		Notify.hideCurrentIndicator();

		const { data, errors } = response;

		if (errors && errors.length > 0)
		{
			showNetworkError(parentWidget, () => openSelfDeleteFlow(parentWidget));

			return;
		}

		dispatch(data, parentWidget);
	}

	/**
	 * Shows an error dialog with a retry button.
	 * The retry callback re-enters openSelfDeleteFlow from scratch — no extra widgets are spawned.
	 *
	 * @param {PageManager} parentWidget
	 * @param {() => void} onRetry
	 */
	function showNetworkError(parentWidget, onRetry)
	{
		Alert.confirm(
			Loc.getMessage('M_INTRANET_SELF_DELETE_ERROR_TITLE'),
			Loc.getMessage('M_INTRANET_SELF_DELETE_ERROR_DESCRIPTION'),
			[
				{
					type: ButtonType.DEFAULT,
					text: Loc.getMessage('M_INTRANET_SELF_DELETE_ERROR_RETRY'),
					onPress: onRetry,
				},
				{
					type: ButtonType.CANCEL,
				},
			],
		);
	}

	module.exports = { openSelfDeleteFlow };
});
