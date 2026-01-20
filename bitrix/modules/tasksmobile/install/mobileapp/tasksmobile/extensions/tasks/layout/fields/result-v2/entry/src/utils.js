/**
 * @module tasks/layout/fields/result-v2/entry/src/utils
 */
jn.define('tasks/layout/fields/result-v2/entry/src/utils', (require, exports, module) => {
	const { Icon } = require('assets/icons');
	const { Haptics } = require('haptics');
	const { Loc } = require('loc');
	const { showToast, Position } = require('toast');

	const { dispatch, getState } = require('statemanager/redux/store');
	const { add, update, remove, get, selectResultById } = require('tasks/statemanager/redux/slices/tasks-results-v2');

	/**
	 * @param {number} id
	 * @param {number} taskId
	 */
	function removeResult(id, taskId)
	{
		dispatch(
			remove({
				taskId,
				resultId: id,
			}),
		)
			.then(() => Haptics.notifySuccess())
			.catch(console.error)
		;
	}

	/**
	 * @param {string} text
	 * @param {array} files
	 * @param {number} id
	 * @param {number} taskId
	 * @return {Promise}
	 */
	function saveResult({ text, files, id = 0 }, taskId)
	{
		return new Promise((resolve, reject) => {
			if (text.length === 0)
			{
				showEmptyEditorError();
				reject();

				return;
			}

			const isNewResult = id === 0;
			const args = {
				taskId,
				result: {
					id,
					taskId,
					fileIds: processFiles(files),
					text: processInlineFiles(files, text),
				},
			};

			dispatch((isNewResult ? add : update)(args))
				.then(() => {
					Haptics.notifySuccess();
					resolve();
				})
				.catch(console.error)
			;
		});
	}

	function processFiles(files)
	{
		const loadedFiles = files.filter((file) => !file.isUploading);
		const newFileIds = loadedFiles.filter((file) => file.token).map((file) => file.serverFileId);
		const oldFileIds = loadedFiles.filter((file) => !file.token).map((file) => file.id);

		return [...oldFileIds, ...newFileIds];
	}

	function processInlineFiles(files, text)
	{
		let preparedText = text;

		files
			.filter((file) => !file.isUploading && file.token)
			.forEach(({ id, serverFileId }) => {
				const regex = new RegExp(`\\[disk file id=${id}\\]`, 'g');
				preparedText = preparedText.replace(regex, `[disk file id=${serverFileId}]`);
			})
		;

		return preparedText;
	}

	function showEmptyEditorError()
	{
		showToast({
			position: Position.TOP,
			message: Loc.getMessage('TASKS_FIELDS_RESULT_V2_ENTRY_EMPTY_ERROR'),
			iconName: Icon.INFO_CIRCLE.getIconName(),
		});
	}

	/**
	 * @param {number} resultId
	 * @param {number} taskId
	 */
	async function fetchResult(resultId, taskId)
	{
		await dispatch(
			get({
				resultId,
				taskId,
			}),
		);

		return selectResultById(getState(), resultId);
	}

	module.exports = {
		removeResult,
		saveResult,
		fetchResult,
	};
});
