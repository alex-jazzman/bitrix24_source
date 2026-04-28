/**
 * @module im/messenger/controller/dialog/lib/text-format/src/action/link
 */
jn.define('im/messenger/controller/dialog/lib/text-format/src/action/link', (require, exports, module) => {
	const {
		Alert,
		ButtonType,
	} = require('alert');
	const { isValidLink } = require('utils/url');
	const { Loc } = require('im/messenger/loc');
	const { BaseAction } = require('im/messenger/controller/dialog/lib/text-format/src/action/abstract/base');
	const { BBCodeDetector } = require('im/messenger/controller/dialog/lib/text-format/src/bb-code/detector');

	const isAndroid = Application.getPlatform() === 'android';
	const doneButtonIndex = 2;

	/**
	 * @class LinkAction
	 */
	class LinkAction extends BaseAction
	{
		/** @type {BBCodeDetector} */
		#detector;

		constructor()
		{
			super(
				'link',
				Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_TEXT_FORMAT_LINK'),
			);

			this.#detector = new BBCodeDetector();
		}

		/**
		 * @returns {string}
		 */
		getBBCode()
		{
			return 'url';
		}

		/**
		 * @param {DialogId} dialogId
		 * @param {string} text
		 * @param {number} startIndex
		 * @param {number} endIndex
		 * @param {Function} applyFormat
		 */
		execute(dialogId, text, startIndex, endIndex, applyFormat)
		{
			this.sendAnalytics(dialogId);

			this.#showPrompt(dialogId, text, startIndex, endIndex, applyFormat);
		}

		/**
		 * Show prompt dialog to enter URL
		 * @private
		 * @param {DialogId} dialogId
		 * @param {string} text
		 * @param {number} startIndex
		 * @param {number} endIndex
		 * @param {Function} applyFormat
		 */
		#showPrompt(dialogId, text, startIndex, endIndex, applyFormat)
		{
			// TODO: switch to a new control in the future
			// because on iOS it's not a placeholder but part of the text,
			// and this breaks the paste-from-clipboard script
			const placeholder = isAndroid ? 'https://' : '';

			const buttons = [
				{
					type: ButtonType.CANCEL,
					text: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_TEXT_FORMAT_CANCEL'),
				},
				{
					type: ButtonType.DEFAULT,
					text: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_TEXT_FORMAT_DONE'),
				},
			];

			navigator.notification.prompt(
				'',
				({ input1: url, buttonIndex }) => {
					if (buttonIndex !== doneButtonIndex)
					{
						return;
					}

					if (!isValidLink(url))
					{
						Alert.alert(
							Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_TEXT_FORMAT_LINK_INVALID'),
							'',
							() => {
								this.#showPrompt(dialogId, text, startIndex, endIndex, applyFormat);
							},
						);

						return;
					}

					applyFormat(text, this.getBBCode(), startIndex, endIndex, url);
				},
				Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_TEXT_FORMAT_LINK_TITLE'),
				buttons,
				placeholder,
			);
		}

		/**
		 * @TODO use after switch to a new prompt control with set input text support
		 *
		 * Extract existing URL from BB-code if selection is already a link
		 * @example
		 * selectedText == "[url=https://example.com]click here[/url]"
		 * returns "https://example.com"
		 * @private
		 * @param {string} text
		 * @param {number} startIndex
		 * @param {number} endIndex
		 * @returns {string|null}
		 */
		#extractExistingUrl(text, startIndex, endIndex)
		{
			const selectedText = text.slice(startIndex, endIndex);
			const textBefore = text.slice(0, startIndex);
			const textAfter = text.slice(endIndex);
			const completeMatch = this.#detector.isWrappedInside(selectedText, 'url');
			if (completeMatch)
			{
				const urlParam = this.#detector.extractTagParameter(selectedText);

				return urlParam || completeMatch[1] || null;
			}

			const closeTag = this.#detector.findCloseTagAfter(textAfter, 'url');
			if (!closeTag)
			{
				return null;
			}

			let openTag = selectedText.match(/^\[url(?:=[^\]]+)?\]/i)?.[0];
			const contentStart = startIndex + (openTag?.length ?? 0);
			if (!openTag)
			{
				// Try to find opening tag before selection
				openTag = this.#detector.findOpenTagBefore(textBefore, 'url');
				if (!openTag)
				{
					return null;
				}
			}

			const urlParam = this.#detector.extractTagParameter(openTag);
			if (urlParam)
			{
				return urlParam;
			}

			const linkContent = text.slice(contentStart, endIndex).trim();

			return linkContent || null;
		}
	}

	module.exports = { LinkAction };
});
