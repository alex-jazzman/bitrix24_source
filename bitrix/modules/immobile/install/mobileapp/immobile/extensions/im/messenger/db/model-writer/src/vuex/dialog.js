/* eslint-disable es/no-optional-chaining */

/**
 * @module im/messenger/db/model-writer/vuex/dialog
 */
jn.define('im/messenger/db/model-writer/vuex/dialog', (require, exports, module) => {
	const { Type } = require('type');

	const { DialogHelper } = require('im/messenger/lib/helper');

	const { Logger } = require('im/messenger/lib/logger');
	const { Writer } = require('im/messenger/db/model-writer/vuex/writer');

	// The collection mutations of the model are shared by two sources: the seed of a server page
	// (`setCollection`), which has to be saved, and the restore from the local database
	// (`setCollectionFromLocalDatabase`), which must not be written back.
	const COLLECTION_SAVE_ACTIONS = new Set([
		'setCollection',
	]);

	class DialogWriter extends Writer
	{
		initRouters()
		{
			super.initRouters();

			this.addCollectionRouter = this.addCollectionRouter.bind(this);
			this.updateCollectionRouter = this.updateCollectionRouter.bind(this);
		}

		subscribeEvents()
		{
			this.storeManager
				.on('dialoguesModel/add', this.addRouter)
				.on('dialoguesModel/update', this.updateRouter)
				.on('dialoguesModel/addCollection', this.addCollectionRouter)
				.on('dialoguesModel/updateCollection', this.updateCollectionRouter)
				.on('dialoguesModel/delete', this.deleteRouter)
			;
		}

		unsubscribeEvents()
		{
			this.storeManager
				.off('dialoguesModel/add', this.addRouter)
				.off('dialoguesModel/update', this.updateRouter)
				.off('dialoguesModel/addCollection', this.addCollectionRouter)
				.off('dialoguesModel/updateCollection', this.updateCollectionRouter)
				.off('dialoguesModel/delete', this.deleteRouter)
			;
		}

		/**
		 * @param {MutationPayload<DialoguesAddData, DialoguesAddActions>} mutation.payload
		 */
		addRouter(mutation)
		{
			if (this.checkIsValidMutation(mutation) === false)
			{
				return;
			}

			const actionName = mutation?.payload?.actionName;
			const data = mutation?.payload?.data || {};
			const saveActions = [
				'set',
				'add',
			];
			if (!saveActions.includes(actionName))
			{
				return;
			}

			const dialogId = data.dialogId;
			if (!dialogId)
			{
				return;
			}

			const dialog = this.store.getters['dialoguesModel/getById'](dialogId);
			if (!dialog)
			{
				Logger.warn(`DialogWriter.addRouter: there is no dialog with dialogId "${dialogId}" in model`);

				return;
			}

			const dialogHelper = DialogHelper.createByModel(dialog);
			if (!dialogHelper?.isLocalStorageSupported)
			{
				return;
			}

			this.repository.dialog.saveFromModel([dialog]);
		}

		/**
		 * @param {MutationPayload<DialoguesUpdateData, DialoguesUpdateActions>} mutation.payload
		 */
		updateRouter(mutation)
		{
			if (this.checkIsValidMutation(mutation) === false)
			{
				return;
			}

			const actionName = mutation?.payload?.actionName;
			const data = mutation?.payload?.data || {};
			const updateActions = [
				'set',
				'update',
				'mute',
				'unmute',
				'updateType',
				'updateUserCounter',
				'updatePermissions',
				'setLastMessageViews',
				'incrementLastMessageViews',
			];
			if (!updateActions.includes(actionName))
			{
				return;
			}

			const dialogId = data.dialogId;
			if (!dialogId)
			{
				return;
			}

			const dialog = this.store.getters['dialoguesModel/getById'](dialogId);
			if (!dialog)
			{
				Logger.warn(`DialogWriter.updateRouter: there is no dialog with dialogId "${dialogId}" in model`);

				return;
			}

			const dialogHelper = DialogHelper.createByModel(dialog);
			if (!dialogHelper?.isLocalStorageSupported)
			{
				return;
			}

			this.repository.dialog.saveFromModel([dialog]);
		}

		/**
		 * @param {MutationPayload<DialoguesAddCollectionData, DialoguesAddActions>} mutation.payload
		 */
		addCollectionRouter(mutation)
		{
			this.#saveCollection(mutation, mutation?.payload?.data?.addItems);
		}

		/**
		 * @param {MutationPayload<DialoguesUpdateCollectionData, DialoguesUpdateActions>} mutation.payload
		 */
		updateCollectionRouter(mutation)
		{
			this.#saveCollection(mutation, mutation?.payload?.data?.updateItems);
		}

		/**
		 * The whole page reaches the tables in one call: `saveFromModel` takes a list, so the write
		 * costs a pair of statements per page instead of a pair per dialogue.
		 *
		 * @param {object} mutation
		 * @param {Array<{dialogId: string}>} [items]
		 */
		#saveCollection(mutation, items)
		{
			if (this.checkIsValidMutation(mutation) === false)
			{
				return;
			}

			if (!COLLECTION_SAVE_ACTIONS.has(mutation?.payload?.actionName) || !Type.isArrayFilled(items))
			{
				return;
			}

			const dialogList = [];
			items.forEach((item) => {
				if (!item.dialogId)
				{
					return;
				}

				const dialog = this.store.getters['dialoguesModel/getById'](item.dialogId);
				if (!dialog)
				{
					Logger.warn(`DialogWriter.#saveCollection: there is no dialog with dialogId "${item.dialogId}" in model`);

					return;
				}

				if (DialogHelper.createByModel(dialog)?.isLocalStorageSupported)
				{
					dialogList.push(dialog);
				}
			});

			if (dialogList.length === 0)
			{
				return;
			}

			this.repository.dialog.saveFromModel(dialogList);
		}

		/**
		 * @param {MutationPayload<DialoguesDeleteData, DialoguesDeleteActions>} mutation.payload
		 */
		deleteRouter(mutation)
		{
			if (this.checkIsValidMutation(mutation) === false)
			{
				return;
			}

			const actionName = mutation?.payload?.actionName;
			const data = mutation?.payload?.data || {};
			const deleteActions = [
				'delete',
			];
			if (!deleteActions.includes(actionName))
			{
				return;
			}

			const dialogId = data.dialogId;
			if (Type.isNumber(dialogId) || Type.isStringFilled(dialogId))
			{
				this.repository.dialog.deleteById(dialogId);
			}
		}
	}

	module.exports = {
		DialogWriter,
	};
});
