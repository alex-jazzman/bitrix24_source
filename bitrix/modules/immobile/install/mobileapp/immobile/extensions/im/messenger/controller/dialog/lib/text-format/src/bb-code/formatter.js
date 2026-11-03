/**
 * @module im/messenger/controller/dialog/lib/text-format/src/bb-code/formatter
 */
jn.define('im/messenger/controller/dialog/lib/text-format/src/bb-code/formatter', (require, exports, module) => {
	const { BBCodeContext } = require('im/messenger/controller/dialog/lib/text-format/src/bb-code/context');
	const { BBCodeDetector } = require('im/messenger/controller/dialog/lib/text-format/src/bb-code/detector');
	const { BBCodeMentionStripper } = require('im/messenger/controller/dialog/lib/text-format/src/bb-code/mention-stripper');
	const { BBCodeNormalizer } = require('im/messenger/controller/dialog/lib/text-format/src/bb-code/normalizer');
	const {
		StyleBBCodeCanonicalizer,
	} = require('im/messenger/lib/bbcode/style-canonicalizer');
	const { Logger } = require('im/messenger/lib/logger');
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
		/** @type {StyleBBCodeCanonicalizer} */
		#styleCanonicalizer;
		/** @type {BBCodeWrapper} */
		#wrapper;

		constructor()
		{
			this.#detector = new BBCodeDetector();
			this.#mentionStripper = new BBCodeMentionStripper();
			this.#normalizer = new BBCodeNormalizer(this.#detector);
			this.#styleCanonicalizer = new StyleBBCodeCanonicalizer();
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
			const original = {
				newText: fullText,
				newStart: startIndex,
				newEnd: endIndex,
			};
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

			if (this.#styleCanonicalizer.hasProtectedSelectionBoundary(
				context.fullText,
				context.bbCode,
				context.startIndex,
				context.endIndex,
			))
			{
				return original;
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

			const formatted = this.#wrapper.wrap(context);
			try
			{
				const canonical = this.#styleCanonicalizer.canonicalize(context.bbCode, formatted);
				if (canonical.status === 'failed')
				{
					Logger.error('BBCodeFormatter: style canonicalization failed');

					return original;
				}

				return canonical.result;
			}
			catch (error)
			{
				Logger.error('BBCodeFormatter: style canonicalization failed');

				return original;
			}
		}

		/**
		 * @param {string} fullText
		 * @returns {string}
		 */
		repairWholeText(fullText)
		{
			try
			{
				const repair = this.#styleCanonicalizer.repairWholeText(fullText);
				if (repair.status === 'failed')
				{
					Logger.error('BBCodeFormatter: draft style repair failed');

					return fullText;
				}

				return repair.result.newText;
			}
			catch (error)
			{
				Logger.error('BBCodeFormatter: draft style repair failed');

				return fullText;
			}
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
