/**
 * @module im/messenger/controller/messenger-header/src/controller
 */
jn.define('im/messenger/controller/messenger-header/src/controller', (require, exports, module) => {
	/**
	 * @class MessengerHeaderController
	 *
	 * Controls the header (title + right buttons) for a single navigation widget.
	 * Created by HeaderConfigurator.
	 */
	class MessengerHeaderController
	{
		/**
		 * @param {HeaderTitleController} titleController
		 * @param {HeaderButtonsController} buttonsController
		 */
		constructor(titleController, buttonsController)
		{
			/** @private */
			this.titleController = titleController;
			/** @private */
			this.buttonsController = buttonsController;
		}

		/**
		 * @return {void}
		 */
		redrawTitleIfNeeded()
		{
			this.titleController.redrawTitleIfNeeded();
		}

		/**
		 * @param {string} tabId
		 * @return {void}
		 */
		redrawRightButtonsIfNeeded(tabId)
		{
			this.buttonsController.redrawRightButtonsIfNeeded(tabId);
		}
	}

	module.exports = { MessengerHeaderController };
});
