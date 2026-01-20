/**
 * @module tasks/layout/fields/result-v2/entry
 */
jn.define('tasks/layout/fields/result-v2/entry', (require, exports, module) => {
	const { TextEditor } = require('text-editor');
	const { Loc } = require('loc');
	const { TaskResultList } = require('tasks/layout/fields/result-v2/list');
	const { TaskResultView } = require('tasks/layout/fields/result-v2/view');
	const { removeResult, saveResult, fetchResult } = require('tasks/layout/fields/result-v2/entry/src/utils');
	const { showToast } = require('toast');

	class ResultEntry
	{
		/**
		 * @public
		 * @param {number} taskId
		 * @param {PageManager} parentWidget
		 */
		static openResultCreation(taskId, parentWidget)
		{
			void TextEditor.edit({
				parentWidget,
				textInput: {
					placeholder: Loc.getMessage('TASKS_FIELDS_RESULT_V2_ENTRY_ADD_WIDGET_PLACEHOLDER'),
				},
				title: Loc.getMessage('TASKS_FIELDS_RESULT_V2_ENTRY_ADD_WIDGET_TITLE'),
				fileField: {
					config: {
						controller: {
							endpoint: 'disk.uf.integration.diskUploaderController',
						},
						disk: {
							isDiskModuleInstalled: true,
							isWebDavModuleInstalled: true,
							fileAttachPath: `/mobile/?mobile_action=disk_folder_list&type=user&path=%2F&entityId=${env.userId}`,
						},
					},
					value: [],
				},
				closeOnSave: true,
				onSave: ({ bbcode: text, files }) => saveResult({ text, files }, taskId),
			});
		}

		/**
		 * @public
		 * @param {number} resultId
		 * @param {boolean} isFocused
		 * @param {number} taskId
		 * @param {PageManager} parentWidget
		 * @param {boolean} [isWithAnotherResultsEmptyState=false]
		 */
		static async openResult(resultId, isFocused, taskId, parentWidget, isWithAnotherResultsEmptyState = false)
		{
			const result = await fetchResult(resultId, taskId);

			if (!result)
			{
				showToast({
					message: Loc.getMessage('TASKS_FIELDS_RESULT_V2_ENTRY_ERROR_LOADING_RESULT'),
					layoutWidget: parentWidget,
				});

				return;
			}

			TaskResultView.open({
				resultId,
				isFocused,
				taskId,
				parentWidget,
				isWithAnotherResultsEmptyState,
				onSave: saveResult,
				onRemove: removeResult,
			});
		}

		/**
		 * @public
		 * @param {number} taskId
		 * @param {PageManager} parentWidget
		 */
		static openResultList(taskId, parentWidget)
		{
			TaskResultList.open({
				taskId,
				parentWidget,
				onResultClick: (resultId, layout) => this.openResult(resultId, false, taskId, layout),
				onCreateClick: (layout) => this.openResultCreation(taskId, layout),
			});
		}

		/**
		 * @public
		 * @param {number} id
		 * @param {number} taskId
		 */
		static removeResult(id, taskId)
		{
			removeResult(id, taskId);
		}
	}

	module.exports = { ResultEntry };
});
