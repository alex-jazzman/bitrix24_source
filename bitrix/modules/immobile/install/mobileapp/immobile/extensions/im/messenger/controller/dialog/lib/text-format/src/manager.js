/**
 * @module im/messenger/controller/dialog/lib/text-format/src/manager
 */
jn.define('im/messenger/controller/dialog/lib/text-format/src/manager', (require, exports, module) => {
	const { Type } = require('type');
	const { EventType } = require('im/messenger/const');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');
	const {
		getTextActionsConfig,
		getFormatActionById,
	} = require('im/messenger/controller/dialog/lib/text-format/src/config');
	const { BBCodeFormatter } = require('im/messenger/controller/dialog/lib/text-format/src/bb-code/formatter');

	const INIT_DELAY_MS = 100;
	const TextFormatEvent = Object.freeze({
		afterFormat: 'afterFormat',
	});

	/**
	 * @class TextFormatManager
	 */
	class TextFormatManager
	{
		/** @type {ITextFormatTextField} */
		#textField;
		/** @type {() => DialogId} */
		#getDialogId;
		/** @type {Array} */
		#textActionsConfig;
		/** @type {boolean} */
		#isActionsRendered = false;
		/** @type {BBCodeFormatter} */
		#formatter;
		/** @type {JNEventEmitter} */
		#emitter = new JNEventEmitter();

		/**
		 * @param {Object} params
		 * @param {ITextFormatTextField} params.textField
		 * @param {() => DialogId} params.getDialogId
		 */
		constructor({ textField, getDialogId })
		{
			this.logger = getLoggerWithContext('dialog--text-format', this);

			this.#textField = textField;
			this.#getDialogId = getDialogId;
			this.#formatter = new BBCodeFormatter();

			this.textActionTapHandler = this.#onTextActionTap.bind(this);
			this.changeTextHandler = this.#onChangeText.bind(this);
		}

		destructor()
		{
			this.#emitter.removeAll();
			this.#unsubscribeViewEvents();
		}

		/**
		 * @returns {DialogId}
		 */
		get dialogId()
		{
			return this.#getDialogId();
		}

		init()
		{
			this.#textActionsConfig = getTextActionsConfig();

			// TODO: Remove the initialization delay when the textField.setText method
			//  starts returning a promise and the draft setting can be processed.
			setTimeout(() => {
				const currentText = this.#textField.getText();
				if (Type.isStringFilled(currentText))
				{
					this.#showTextActions();
				}
				else
				{
					this.#hideTextActions();
				}

				this.logger.log('init: text:', currentText);
			}, INIT_DELAY_MS);

			this.logger.log('init: actions:', this.#textActionsConfig);
		}

		subscribeViewEvents()
		{
			this.#textField.on(EventType.dialog.textField.textActionTap, this.textActionTapHandler);
			this.#textField.on(EventType.dialog.textField.changeText, this.changeTextHandler);
			this.#textField.on(EventType.dialog.textField.textSet, this.changeTextHandler);
		}

		/**
		 * @param {Function} handler
		 * @return {this}
		 */
		onAfterFormat(handler)
		{
			this.#emitter.on(TextFormatEvent.afterFormat, handler);

			return this;
		}

		/**
		 * @param {Function} handler
		 * @return {this}
		 */
		offAfterFormat(handler)
		{
			this.#emitter.off(TextFormatEvent.afterFormat, handler);

			return this;
		}

		#unsubscribeViewEvents()
		{
			this.#textField.off(EventType.dialog.textField.textActionTap, this.textActionTapHandler);
			this.#textField.off(EventType.dialog.textField.changeText, this.changeTextHandler);
			this.#textField.off(EventType.dialog.textField.textSet, this.changeTextHandler);
		}

		/**
		 * @param {string} text
		 */
		#onChangeText(text)
		{
			this.logger.log('#onChangeText:', text);

			const shouldShowActions = Type.isStringFilled(text);
			if (shouldShowActions === this.#isActionsRendered)
			{
				return;
			}

			if (shouldShowActions)
			{
				this.#showTextActions();

				return;
			}

			this.#hideTextActions();
		}

		#showTextActions()
		{
			this.#textField.setTextActions(this.#textActionsConfig);
			this.#isActionsRendered = true;
			this.logger.log('showTextActions: text actions shown');
		}

		#hideTextActions()
		{
			this.#textField.setTextActions([]);
			this.#isActionsRendered = false;
			this.logger.log('#hideTextActions: text actions hidden');
		}

		/**
		 * @param {TextActionTapEvent} event
		 */
		#onTextActionTap(event)
		{
			this.logger.log('#onTextActionTap:', event);

			const { text, actionId, startIndex, endIndex } = event;
			const action = getFormatActionById(actionId);
			if (!action)
			{
				return;
			}

			try
			{
				action.execute(
					this.dialogId,
					text,
					startIndex,
					endIndex,
					this.applyFormat.bind(this),
				);
			}
			catch (error)
			{
				this.logger.error('#onTextActionTap: action.execute error: ', error);
			}
		}

		/**
		 * @private
		 * @param {string} text
		 * @param {string} bbCode
		 * @param {number} startIndex
		 * @param {number} endIndex
		 * @param {string|null} [param=null]
		 */
		applyFormat(text, bbCode, startIndex, endIndex, param = null)
		{
			this.logger.log('applyFormat: started:', text, bbCode, startIndex, endIndex, param);
			const { newText, newStart, newEnd } = this.toggleBBCodeWrapping(
				text,
				bbCode,
				startIndex,
				endIndex,
				param,
			);

			this.#textField.setText(newText);
			this.#textField.setSelectionRange(newStart, newEnd);

			this.#emitter.emit(TextFormatEvent.afterFormat, [newText]);

			this.logger.log('applyFormat: finished:', newText, newStart, newEnd);
		}

		/**
		 * @private
		 * @param {string} fullText
		 * @param {string} bbCode
		 * @param {number} startIndex
		 * @param {number} endIndex
		 * @param {string|null} param
		 * @returns {{newText: string, newStart: number, newEnd: number}}
		 */
		toggleBBCodeWrapping(fullText, bbCode, startIndex, endIndex, param)
		{
			return this.#formatter.format(fullText, bbCode, startIndex, endIndex, param);
		}
	}

	module.exports = { TextFormatManager, TextFormatEvent };
});
