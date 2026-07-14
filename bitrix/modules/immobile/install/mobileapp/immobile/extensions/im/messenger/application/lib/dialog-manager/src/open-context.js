/**
 * @module im/messenger/application/lib/dialog-manager/src/open-context
 */
jn.define('im/messenger/application/lib/dialog-manager/src/open-context', (require, exports, module) => {
	const { DialogType } = require('im/messenger/const');
	const { isProjectsGroupsRestricted } = require('im/messenger/lib/plan-limit');

	/**
	 * Child chat types that remain openable as regular chats under tariff restriction
	 * even when their parent project is locally cached.
	 */
	const STANDALONE_CHILD_TYPES = new Set([DialogType.tasksTask, DialogType.calendar]);

	/**
	 * @class DialogOpenContext
	 *
	 * Carries data a single openDialog invocation produces: dialog model, options,
	 * parent widget, plus lazy-memoized derived facts. Filters and gate checks consume
	 * this context, so the manager doesn't have to precompute every fact upfront and
	 * the filter pipeline doesn't grow a field per fact.
	 */
	class DialogOpenContext
	{
		/** @type {Promise<boolean>|null} */
		#isProjectOrChildOfProjectPromise = null;
		/** @type {(dialogId: string) => Promise<DialoguesModelState|null>} */
		#loadDialogModel;

		/**
		 * @param {object} params
		 * @param {DialoguesModelState|null} params.dialogModel
		 * @param {DialogOpenOptions} params.options
		 * @param {PageManager} params.parentWidget
		 * @param {(dialogId: string) => Promise<DialoguesModelState|null>} params.loadDialogModel
		 */
		constructor({ dialogModel, options, parentWidget, loadDialogModel })
		{
			this.dialogModel = dialogModel;
			this.options = options;
			this.parentWidget = parentWidget;
			this.#loadDialogModel = loadDialogModel;
		}

		/**
		 * Resolves to true when the dialog being opened is a project itself or a child
		 * chat of a project. Memoized — the underlying parent lookup runs at most once
		 * per context, so multiple consumers (filters, nested-strategy gate) share the
		 * same async work.
		 *
		 * @return {Promise<boolean>}
		 */
		isProjectOrChildOfProject()
		{
			this.#isProjectOrChildOfProjectPromise = this.#isProjectOrChildOfProjectPromise
				?? this.#computeIsProjectOrChildOfProject();

			return this.#isProjectOrChildOfProjectPromise;
		}

		/**
		 * @return {Promise<boolean>}
		 */
		async #computeIsProjectOrChildOfProject()
		{
			const dialogModel = this.dialogModel;
			if (!dialogModel)
			{
				return false;
			}

			if (dialogModel.type === DialogType.collab)
			{
				return true;
			}

			if (!dialogModel.parentChatId)
			{
				return false;
			}

			// Under tariff restriction, task and calendar child chats stay openable
			// as regular chats — skip the project flow entirely so the tariff widget
			// is not shown and nested navigation is not applied, even if the parent
			// project is already in the local store from before the tariff change.
			if (isProjectsGroupsRestricted() && STANDALONE_CHILD_TYPES.has(dialogModel.type))
			{
				return false;
			}

			const parentDialogId = `chat${dialogModel.parentChatId}`;
			const parentModel = await this.#loadDialogModel(parentDialogId);

			return parentModel?.type === DialogType.collab;
		}
	}

	module.exports = { DialogOpenContext };
});