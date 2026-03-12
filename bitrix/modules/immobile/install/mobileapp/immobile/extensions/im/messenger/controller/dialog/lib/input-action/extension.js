/**
 * @module im/messenger/controller/dialog/lib/input-action
 */
jn.define('im/messenger/controller/dialog/lib/input-action', (require, exports, module) => {
	const { UserInputAction } = require('im/messenger/const');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');

	const logger = getLoggerWithContext('dialog--input-action-manager', 'InputActionManager');

	/**
	 * @desc Handles input action API operations.
	 * WARNING: All input action operations require prior initialization
	 * of dialog. Call Dialog.initManagers() before using this class.
	 *
	 * @requires Dialog.initManagers
	 * @class InputActionManager
	 */
	class InputActionManager
	{
		/**
		 * @param {DialogLocator} dialogLocator
		 */
		constructor(dialogLocator)
		{
			/** @type {DialogLocator} */
			this.dialogLocator = dialogLocator;

			/**
			 * @desc Id timer timeout for canceling request rest
			 * @private
			 * @type {number|null}
			 */
			this.holdInputActionTimerId = null;

			/**
			 * @desc This hold for start request to rest method 'im.dialog.writing'
			 * @constant
			 * @private
			 * @type {number}
			 */
			this.HOLD_REST = 3000;
		}

		/**
		 * @private
		 * @return {ChatService}
		 */
		get chatService()
		{
			return this.dialogLocator.get('chat-service');
		}

		/**
		 * @private
		 * @return {DialogView}
		 */
		get view()
		{
			return this.dialogLocator.get('view');
		}

		/**
		 * @private
		 * @return {number | string}
		 */
		get dialogId()
		{
			return this.dialogLocator.get('dialogId');
		}

		/**
		 * @desc Method is canceling timeout with request rest 'im.v2.Chat.InputAction.notify'
		 * @void
		 */
		cancelInputActionRequest()
		{
			if (!this.holdInputActionTimerId)
			{
				return;
			}

			clearTimeout(this.holdInputActionTimerId);
			this.holdInputActionTimerId = null;
		}

		/**
		 * @desc Call dialog rest request writing message method
		 */
		startWriting()
		{
			this.cancelInputActionRequest();
			this.holdInputActionTimerId = setTimeout(() => {
				this.chatService.inputActionNotify(this.dialogId, UserInputAction.writing)
					.catch((error) => logger.error('writingMessageNotify.response', error));
			}, this.HOLD_REST);
		}

		/**
		 * @desc Call dialog rest request record voice message method
		 */
		startRecordVoice()
		{
			this.cancelInputActionRequest();
			this.holdInputActionTimerId = setTimeout(() => {
				this.chatService.inputActionNotify(this.dialogId, UserInputAction.recordingVoice)
					.catch((err) => logger.error('startRecordVoice.recordVoiceMessageNotify', err));
			}, this.HOLD_REST);
		}

		startSendingFile()
		{
			this.chatService.inputActionNotify(this.dialogId, UserInputAction.sendingFile)
				.catch((error) => logger.log(
					'startSendingFile.uploadFileMessageNotify',
					error,
				))
			;
		}

		startRecordVideoNote()
		{
			this.cancelInputActionRequest();
			this.holdInputActionTimerId = setTimeout(() => {
				this.chatService.inputActionNotify(this.dialogId, UserInputAction.recordingVideoNote)
					.catch((error) => logger.error('startRecordVideoNote.recordVideoNoteMessageNotify.response', error));
			}, this.HOLD_REST);
		}
	}

	module.exports = { InputActionManager };
});
