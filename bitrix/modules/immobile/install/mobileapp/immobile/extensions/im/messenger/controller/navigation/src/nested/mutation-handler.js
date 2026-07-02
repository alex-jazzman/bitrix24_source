/**
 * @module im/messenger/controller/navigation/src/nested/mutation-handler
 */
jn.define('im/messenger/controller/navigation/src/nested/mutation-handler', (require, exports, module) => {
	const { Type } = require('type');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');

	/**
	 * @class NestedMutationHandler
	 *
	 * Subscribes to dialoguesModel/update mutations for a specific dialog
	 * and triggers header title redraw when name or avatar changes.
	 */
	class NestedMutationHandler
	{
		#dialogId;
		#headerController;

		/**
		 * @param {string} dialogId
		 * @param {MessengerHeaderController} headerController
		 */
		constructor(dialogId, headerController)
		{
			this.#dialogId = dialogId;
			this.#headerController = headerController;

			this.#subscribe();
		}

		#subscribe()
		{
			const storeManager = serviceLocator.get('core').getStoreManager();
			storeManager
				.on('dialoguesModel/update', this.#handleDialogUpdate)
				.on('dialoguesModel/setFromPush', this.#handleDialogSetFromPush)
			;
		}

		/**
		 * @param {MutationPayload<DialoguesUpdateData, DialoguesUpdateActions>} mutation
		 */
		#handleDialogUpdate = ({ payload }) => {
			if (payload.data?.dialogId !== this.#dialogId)
			{
				return;
			}

			const { fields } = payload.data;
			if (Type.isStringFilled(fields.name) || Type.isStringFilled(fields.avatar))
			{
				this.#headerController.redrawTitleIfNeeded();
			}
		};

		/**
		 * @param {MutationPayload<DialoguesSetFromPushData, DialoguesSetFromPushActions>} mutation
		 */
		#handleDialogSetFromPush = ({ payload }) => {
			const dialog = payload.data?.dialogList
				?.find((item) => item.dialogId === this.#dialogId);

			if (Type.isStringFilled(dialog?.name) || Type.isStringFilled(dialog?.avatar))
			{
				this.#headerController.redrawTitleIfNeeded();
			}
		};

		destructor()
		{
			const storeManager = serviceLocator.get('core').getStoreManager();
			storeManager
				.off('dialoguesModel/update', this.#handleDialogUpdate)
				.off('dialoguesModel/setFromPush', this.#handleDialogSetFromPush)
			;
			this.#headerController = null;
		}
	}

	module.exports = { NestedMutationHandler };
});
