/**
 * @module vibecode/app-opener
 */
jn.define('vibecode/app-opener', (require, exports, module) => {
	const { RunActionExecutor } = require('rest/run-action-executor');
	const {
		normalizePositiveInteger,
		openAppPage,
		openInApp,
	} = require('vibecode/app-opener/src/open-in-app');

	const RECORD_OPEN_ACTION = 'vibecodeconnector.Catalog.recordOpen';

	function createFailureOutcome()
	{
		return { isSuccess: false };
	}

	function createSuccessOutcome()
	{
		return { isSuccess: true };
	}

	class VibeCodeAppOpener
	{
		static async recordOpen(catalogItemId)
		{
			const normalizedCatalogItemId = normalizePositiveInteger(catalogItemId);
			if (normalizedCatalogItemId === null)
			{
				return createFailureOutcome();
			}

			try
			{
				const response = await (new RunActionExecutor(
					RECORD_OPEN_ACTION,
					{ catalogItemId: normalizedCatalogItemId },
				)).call(false);
				const errors = Array.isArray(response?.errors) ? response.errors : [];

				if (errors.length > 0)
				{
					throw response;
				}

				return createSuccessOutcome();
			}
			catch (error)
			{
				console.error('[vibecode/app-opener] failed to record item open', error);

				return createFailureOutcome();
			}
		}

		static async open(options = {})
		{
			const catalogItemId = normalizePositiveInteger(options?.catalogItemId);
			if (catalogItemId === null)
			{
				return createFailureOutcome();
			}

			const registrationPromise = VibeCodeAppOpener.recordOpen(catalogItemId);

			try
			{
				openAppPage(catalogItemId, { title: options?.title });
			}
			catch (error)
			{
				// the registration has already reached the server: keep the promised outcome
				// instead of losing it to a navigation failure
				console.error('[vibecode/app-opener] failed to open app page', error);
			}

			return registrationPromise;
		}
	}

	module.exports = { VibeCodeAppOpener, openAppPage, openInApp };
});
