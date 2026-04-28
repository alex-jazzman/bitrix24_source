/**
 * @module im/messenger/controller/dialog/lib/text-format/src/bb-code/normalizer
 */
jn.define('im/messenger/controller/dialog/lib/text-format/src/bb-code/normalizer', (require, exports, module) => {
	const {
		escapeRegex,
		createOpenTagPattern,
		createCloseTagPattern,
		createCompleteWrapPattern,
	} = require('im/messenger/controller/dialog/lib/text-format/src/bb-code/utils');

	/**
	 * @class BBCodeNormalizer
	 */
	class BBCodeNormalizer
	{
		/** @type {BBCodeDetector} */
		#detector;

		/**
		 * @param {BBCodeDetector} detector
		 */
		constructor(detector)
		{
			this.#detector = detector;
		}

		/**
		 * @param {BBCodeContext} context
		 * @param {Function} formatterCallback
		 * @returns {{newText: string, newStart: number, newEnd: number}|null}
		 *
		 * @example extra opening tag — closing tag found after selection
		 * bbCode = 'b'
		 * "hello |[b]world| today[/b]" => expands selection to include "[/b]"
		 *
		 * @example extra closing tag — opening tag found before selection
		 * bbCode = 'b'
		 * "[b]hello |world[/b]| today" => expands selection to include "[b]"
		 *
		 * @example single opening tag — no matching close tag exists
		 * bbCode = 'b'
		 * "hello |[b]world| today" => strips "[b]", re-formats "|world|"
		 */
		normalize(context, formatterCallback)
		{
			const tagCounts = this.#detector.countTags(context.selectedText);
			const unbalanced = this.#findUnbalancedTag(tagCounts);

			if (!unbalanced)
			{
				return null;
			}

			if (unbalanced.open > unbalanced.close)
			{
				return this.#handleOpeningTagOverflow(context, unbalanced.tagName, formatterCallback);
			}

			if (unbalanced.close > unbalanced.open)
			{
				return this.#handleClosingTagOverflow(context, unbalanced.tagName, formatterCallback);
			}

			return null;
		}

		/**
		 * @param {Object} tagCounts
		 * @returns {{tagName: string, open: number, close: number}|null}
		 *
		 * @example
		 * { b: { open: 2, close: 1 }, i: { open: 1, close: 1 } }
		 * => { tagName: 'b', open: 2, close: 1 }
		 *
		 * @example
		 * { b: { open: 1, close: 1 } }
		 * => null (all tags balanced)
		 */
		#findUnbalancedTag(tagCounts)
		{
			for (const tagName in tagCounts)
			{
				const { open, close } = tagCounts[tagName];

				if (open !== close)
				{
					return { tagName, open, close };
				}
			}

			return null;
		}

		/**
		 * If target bbCode is already balanced in expanded range → formatterCallback (toggle-off)
		 * @param {BBCodeContext} context
		 * @param {number} expandedStart
		 * @param {number} expandedEnd
		 * @param {Function} formatterCallback
		 * @returns {{newText: string, newStart: number, newEnd: number}|null}
		 */
		#tryFormatterForToggleOff(context, expandedStart, expandedEnd, formatterCallback)
		{
			const expandedText = context.fullText.slice(expandedStart, expandedEnd);
			const expandedCounts = this.#detector.countTags(expandedText);
			const targetCounts = expandedCounts[context.bbCode.toLowerCase()];
			if (targetCounts && targetCounts.open > 0 && targetCounts.open === targetCounts.close)
			{
				const result = formatterCallback(
					context.fullText,
					context.bbCode,
					expandedStart,
					expandedEnd,
					context.param,
				);

				const startExpansion = context.startIndex - expandedStart;
				const endExpansion = expandedEnd - context.endIndex;
				if (startExpansion > 0 || endExpansion > 0)
				{
					return {
						newText: result.newText,
						newStart: result.newStart + startExpansion,
						newEnd: result.newEnd - endExpansion,
					};
				}

				return result;
			}

			return null;
		}

		/**
		 * @param {BBCodeContext} context
		 * @param {string} tagName
		 * @param {Function} formatterCallback
		 * @returns {{newText: string, newStart: number, newEnd: number}|null}
		 *
		 * @example closing tag found after selection — expand
		 * bbCode = 'b', tagName = 'b'
		 * "hello |[b]world| today[/b]"
		 * => re-formats with endIndex expanded to include "[/b]"
		 *
		 * @example different tag — expand and wrap
		 * bbCode = 'i', tagName = 'b'
		 * "hello |[b]world| today[/b]"
		 * => "[i][b]world[/b][/i]", cursor on inner content
		 *
		 * @example no closing tag found — strip single opening tag
		 * "hello |[b]world|" => re-formats "|world|" without "[b]"
		 */
		#handleOpeningTagOverflow(context, tagName, formatterCallback)
		{
			const escapedTagName = escapeRegex(tagName);
			const openTagPattern = createOpenTagPattern(escapedTagName, { atStart: true });

			if (!openTagPattern.test(context.selectedText))
			{
				return null;
			}

			const closeTag = this.#detector.findCloseTagAfter(context.getTextAfter(), tagName);
			if (closeTag)
			{
				const adjustedEnd = context.endIndex + closeTag.length;
				if (tagName === context.bbCode.toLowerCase())
				{
					return formatterCallback(
						context.fullText,
						context.bbCode,
						context.startIndex,
						adjustedEnd,
						context.param,
					);
				}

				const result = this.#tryFormatterForToggleOff(
					context,
					context.startIndex,
					adjustedEnd,
					formatterCallback,
				);
				if (result)
				{
					return result;
				}

				return this.#expandAndWrap(context, tagName, adjustedEnd, closeTag);
			}

			return this.#stripOpeningTag(context, openTagPattern, formatterCallback);
		}

		/**
		 * @param {BBCodeContext} context
		 * @param {string} tagName
		 * @param {Function} formatterCallback
		 * @returns {{newText: string, newStart: number, newEnd: number}|null}
		 *
		 * @example opening tag found before selection — expand
		 * bbCode = 'b', tagName = 'b'
		 * "[b]hello |world[/b]| today"
		 * => re-formats with startIndex expanded to include "[b]"
		 *
		 * @example different tag — expand and wrap
		 * bbCode = 'i', tagName = 'b'
		 * "[b]hello |world[/b]| today"
		 * => "[i][b]hello world[/b][/i]", cursor on inner content
		 *
		 * @example no opening tag found — strip single closing tag
		 * "|world[/b]| today" => re-formats "|world|" without "[/b]"
		 */
		#handleClosingTagOverflow(context, tagName, formatterCallback)
		{
			const escapedTagName = escapeRegex(tagName);
			const closeTagPattern = createCloseTagPattern(escapedTagName, { atEnd: true });

			if (!closeTagPattern.test(context.selectedText))
			{
				return null;
			}

			const openTag = this.#detector.findOpenTagBefore(context.getTextBefore(), tagName);
			if (openTag)
			{
				const adjustedStart = context.startIndex - openTag.length;
				if (tagName === context.bbCode.toLowerCase())
				{
					return formatterCallback(
						context.fullText,
						context.bbCode,
						adjustedStart,
						context.endIndex,
						context.param,
					);
				}

				const result = this.#tryFormatterForToggleOff(
					context,
					adjustedStart,
					context.endIndex,
					formatterCallback,
				);
				if (result)
				{
					return result;
				}

				return this.#expandAndWrap(context, tagName, adjustedStart, openTag);
			}

			return this.#stripClosingTag(context, closeTagPattern, formatterCallback);
		}

		/**
		 * @description Expands selection to include complete BB-code and wraps it
		 * @param {BBCodeContext} context
		 * @param {string} tagName
		 * @param {number} adjustedBoundary
		 * @param {string} foundTag
		 * @returns {{newText: string, newStart: number, newEnd: number}|null}
		 *
		 * @example closing tag found after selection
		 * bbCode = 'i', tagName = 'b'
		 * selection: "|[b]text|", "[/b]" found after
		 * expanded: "[b]text[/b]"
		 * => "[i][b]|text|[/b][/i]" — wraps around existing tag, cursor on inner content
		 *
		 * @example opening tag found before selection
		 * bbCode = 'i', tagName = 'b'
		 * "[b]" found before, selection: "|text[/b]|"
		 * expanded: "[b]text[/b]"
		 * => "[i][b]|text|[/b][/i]" — wraps around existing tag, cursor on inner content
		 */
		#expandAndWrap(context, tagName, adjustedBoundary, foundTag)
		{
			const escapedTagName = escapeRegex(tagName);
			let expandedSelection;
			let adjustedStart = context.startIndex;
			let adjustedEnd = context.endIndex;

			if (adjustedBoundary < context.startIndex)
			{
				adjustedStart = adjustedBoundary;
				expandedSelection = context.fullText.slice(adjustedStart, adjustedEnd);
			}
			else
			{
				adjustedEnd = adjustedBoundary;
				expandedSelection = context.fullText.slice(adjustedStart, adjustedEnd);
			}

			const completeBBCodePattern = createCompleteWrapPattern(escapedTagName);
			const innerMatch = expandedSelection.match(completeBBCodePattern);
			if (innerMatch)
			{
				const innerContent = innerMatch[1];
				const openTag = context.getOpenTag();
				const closeTag = context.getCloseTag();

				const expandedOpenTagLength = expandedSelection.indexOf(innerContent);

				const wrapped = openTag + expandedSelection + closeTag;
				const newText = context.fullText.slice(0, adjustedStart) + wrapped + context.fullText.slice(adjustedEnd);

				const newStart = adjustedStart + openTag.length + expandedOpenTagLength;
				const newEnd = newStart + innerContent.length;

				return { newText, newStart, newEnd };
			}

			return null;
		}

		/**
		 * @param {BBCodeContext} context
		 * @param {RegExp} openTagPattern
		 * @param {Function} formatterCallback
		 * @returns {{newText: string, newStart: number, newEnd: number}|null}
		 *
		 * @example
		 * selection: "|[b]world|" (no matching [/b] anywhere)
		 * strips "[b]", re-runs formatterCallback for "|world|"
		 */
		#stripOpeningTag(context, openTagPattern, formatterCallback)
		{
			const openMatch = context.selectedText.match(openTagPattern);
			if (openMatch)
			{
				const adjustedStart = context.startIndex + openMatch[0].length;
				if (adjustedStart < context.endIndex)
				{
					return formatterCallback(
						context.fullText,
						context.bbCode,
						adjustedStart,
						context.endIndex,
						context.param,
					);
				}
			}

			return null;
		}

		/**
		 * @param {BBCodeContext} context
		 * @param {RegExp} closeTagPattern
		 * @param {Function} formatterCallback
		 * @returns {{newText: string, newStart: number, newEnd: number}|null}
		 *
		 * @example
		 * selection: "|world[/b]|" (no matching [b] anywhere)
		 * strips "[/b]", re-runs formatterCallback for "|world|"
		 */
		#stripClosingTag(context, closeTagPattern, formatterCallback)
		{
			const closeMatch = context.selectedText.match(closeTagPattern);
			if (closeMatch)
			{
				const adjustedEnd = context.endIndex - closeMatch[0].length;
				if (adjustedEnd > context.startIndex)
				{
					return formatterCallback(
						context.fullText,
						context.bbCode,
						context.startIndex,
						adjustedEnd,
						context.param,
					);
				}
			}

			return null;
		}
	}

	module.exports = { BBCodeNormalizer };
});
