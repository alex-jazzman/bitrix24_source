/**
 * @module disk/create-board
 */
jn.define('disk/create-board', (require, exports, module) => {
	const { Loc } = require('loc');
	const { Alert } = require('alert');
	const { showOfflineToast } = require('toast');
	const { isOnline } = require('device/connection');
	const { requireLazy } = require('require-lazy');
	const { RunActionExecutor } = require('rest/run-action-executor');

	/**
	 * @param {object} options
	 * @param {number} options.folderId - Target folder id (0 means "Created files" fallback).
	 * @param {object} [options.parentWidget] - Parent layout widget for the board opener.
	 * @returns {Promise<void>}
	 */
	async function createBoard({ folderId, parentWidget })
	{
		if (!isOnline())
		{
			showOfflineToast();

			return;
		}

		dialogs.showLoadingIndicator();

		const showCreateError = (messageId = 'M_DISK_CREATE_BOARD_ERROR_TEXT') => {
			dialogs.hideLoadingIndicator();
			Alert.alert(
				null,
				Loc.getMessage(messageId),
			);
		};

		const response = await new RunActionExecutor('diskmobile.Document.createBoard', { folderId }).call();

		if (!response || response.errors?.length > 0)
		{
			console.error(response?.errors);
			const isAccessDenied = response?.errors?.some((error) => error?.code === 'ACCESS_DENIED');
			showCreateError(isAccessDenied ? 'M_DISK_CREATE_BOARD_ACCESS_DENIED_ERROR_TEXT' : 'M_DISK_CREATE_BOARD_ERROR_TEXT');

			return;
		}

		const result = response?.data;

		dialogs.hideLoadingIndicator();

		if (!result?.id)
		{
			showCreateError();

			return;
		}

		try
		{
			const { boardOpener } = await requireLazy('disk:opener/board');

			const widget = await boardOpener({
				id: result.id,
				title: result.name,
				parentWidget,
				analytics: {
					moduleId: 'diskmobile',
				},
			});

			// boardOpener's inner #openBoardWidget silently catches native widget errors
			// (returns undefined instead of rejecting). Treat a falsy result as an open failure.
			if (!widget)
			{
				Alert.alert(
					null,
					Loc.getMessage('M_DISK_CREATE_BOARD_OPEN_ERROR_TEXT'),
				);
			}
		}
		catch (error)
		{
			console.error(error);

			Alert.alert(
				null,
				Loc.getMessage('M_DISK_CREATE_BOARD_OPEN_ERROR_TEXT'),
			);
		}
	}

	module.exports = { createBoard };
});