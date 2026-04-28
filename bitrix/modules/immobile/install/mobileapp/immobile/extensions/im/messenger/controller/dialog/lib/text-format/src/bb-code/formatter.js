/**
 * @module im/messenger/controller/dialog/lib/text-format/src/bb-code/formatter
 */
jn.define('im/messenger/controller/dialog/lib/text-format/src/bb-code/formatter', (require, exports, module) => {
	const { BBCodeContext } = require('im/messenger/controller/dialog/lib/text-format/src/bb-code/context');
	const { BBCodeDetector } = require('im/messenger/controller/dialog/lib/text-format/src/bb-code/detector');
	const { BBCodeMentionStripper } = require('im/messenger/controller/dialog/lib/text-format/src/bb-code/mention-stripper');
	const { BBCodeNormalizer } = require('im/messenger/controller/dialog/lib/text-format/src/bb-code/normalizer');
	const { BBCodeWrapper } = require('im/messenger/controller/dialog/lib/text-format/src/bb-code/wrapper');

	/**
	 * @class BBCodeFormatter
	 */
	class BBCodeFormatter
	{
		/** @type {BBCodeDetector} */
		#detector;
		/** @type {BBCodeMentionStripper} */
		#mentionStripper;
		/** @type {BBCodeNormalizer} */
		#normalizer;
		/** @type {BBCodeWrapper} */
		#wrapper;

		constructor()
		{
			this.#detector = new BBCodeDetector();
			this.#mentionStripper = new BBCodeMentionStripper();
			this.#normalizer = new BBCodeNormalizer(this.#detector);
			this.#wrapper = new BBCodeWrapper(this.#detector);
		}

		/**
		 * @param {string} fullText
		 * @param {string} bbCode
		 * @param {number} startIndex
		 * @param {number} endIndex
		 * @param {string|null} param
		 * @returns {{newText: string, newStart: number, newEnd: number}}
		 */
		format(fullText, bbCode, startIndex, endIndex, param = null)
		{
			const {
				text,
				startIndex: from,
				endIndex: to,
			} = this.#mentionStripper.strip(fullText, startIndex, endIndex);

			const context = new BBCodeContext(text, bbCode, from, to, param);
			if (this.#isInvalidSelection(context))
			{
				return context.noChange();
			}

			const normalized = this.#normalizer.normalize(context, this.format.bind(this));
			if (normalized)
			{
				return normalized;
			}

			const unwrapped = this.#wrapper.tryUnwrap(context);
			if (unwrapped)
			{
				return unwrapped;
			}

			return this.#wrapper.wrap(context);
		}

		/**
		 * @param {BBCodeContext} context
		 * @returns {boolean}
		 */
		#isInvalidSelection(context)
		{
			return this.#isEmpty(context) || this.#hasPartialTags(context);
		}

		/**
		 * @param {BBCodeContext} context
		 * @returns {boolean}
		 */
		#isEmpty(context)
		{
			return context.startIndex === context.endIndex
				|| context.selectedText.trim() === '';
		}

		/**
		 * @param {BBCodeContext} context
		 * @returns {boolean}
		 */
		#hasPartialTags(context)
		{
			return this.#detector.detectPartialTags(context.selectedText);
		}
	}

	module.exports = { BBCodeFormatter };
});
