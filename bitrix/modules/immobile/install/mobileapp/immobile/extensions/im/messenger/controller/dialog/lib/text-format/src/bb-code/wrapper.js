/**
 * @module im/messenger/controller/dialog/lib/text-format/src/bb-code/wrapper
 */
jn.define('im/messenger/controller/dialog/lib/text-format/src/bb-code/wrapper', (require, exports, module) => {
	const {
		buildOpenTag,
		buildCloseTag,
		createOpenTagPattern,
		createCloseTagPattern,
	} = require('im/messenger/controller/dialog/lib/text-format/src/bb-code/utils');

	/**
	 * @class BBCodeWrapper
	 */
	class BBCodeWrapper
	{
		static URL_WITH_PARAM_REGEX = /^\[url=([^\]]+)](.*)\[\/url]$/is;
		static URL_SIMPLE_REGEX = /^\[url](.*)\[\/url]$/is;
		static URL_OPEN_TAG_REGEX = /\[url(?:=([^\]]+))?]/i;
		static ANY_BB_TAG_REGEX = /\[[A-Za-z]+(?:=[^\]]*)?]|\[\/[A-Za-z]+]/g;

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
		 * @returns {{newText: string, newStart: number, newEnd: number}}
		 *
		 * @example
		 * bbCode = 'b', no param
		 * "hello |world| today" => "hello [b]|world|[/b] today"
		 *
		 * @example
		 * bbCode = 'url', param = 'https://example.com'
		 * "click |here| please" => "click [url=https://example.com]|here|[/url] please"
		 */
		wrap(context)
		{
			const openTag = context.getOpenTag();
			const closeTag = context.getCloseTag();

			const wrapped = openTag + context.selectedText + closeTag;
			const newText = context.replaceSelection(wrapped);

			return context.createResult(
				newText,
				context.startIndex + openTag.length,
				context.startIndex + openTag.length + context.selectedText.length,
			);
		}

		/**
		 * @param {BBCodeContext} context
		 * @returns {{newText: string, newStart: number, newEnd: number}|null}
		 *
		 * @example tags inside selection
		 * bbCode = 'b'
		 * "hello |[b]world[/b]| today" => "hello |world| today"
		 *
		 * @example tags outside selection
		 * bbCode = 'b'
		 * "hello [b]|world|[/b] today" => "hello |world| today"
		 *
		 * @example url tag with new param
		 * bbCode = 'url', param = 'https://new.link'
		 * "|[url=https://old.link]click[/url]|" => "[url=https://new.link]|click|[/url]"
		 */
		tryUnwrap(context)
		{
			if (context.bbCode.toLowerCase() === 'url' && context.param)
			{
				const updated = this.updateUrlParameter(context);
				if (updated)
				{
					return updated;
				}
			}

			const unwrappedInside = this.unwrapInside(context);
			if (unwrappedInside)
			{
				return unwrappedInside;
			}

			const unwrappedOutside = this.unwrapOutside(context);
			if (unwrappedOutside)
			{
				return unwrappedOutside;
			}

			return this.unwrapNested(context);
		}

		/**
		 * Updates URL parameter for existing url BB-code instead of unwrapping
		 * @param {BBCodeContext} context
		 * @returns {{newText: string, newStart: number, newEnd: number}|null}
		 *
		 * @example selection contains full url tag with param
		 * bbCode = 'url', param = 'https://new.link'
		 * "|[url=https://old.link]click[/url]|" => "[url=https://new.link]|click|[/url]"
		 *
		 * @example selection contains simple url tag
		 * bbCode = 'url', param = 'https://new.link'
		 * "|[url]click[/url]|" => "[url=https://new.link]|click|[/url]"
		 *
		 * @example url tags wrap selection from outside
		 * bbCode = 'url', param = 'https://new.link'
		 * "[url=https://old.link]|click|[/url]" => "[url=https://new.link]|click|[/url]"
		 */
		updateUrlParameter(context)
		{
			const matchWithParam = context.selectedText.match(BBCodeWrapper.URL_WITH_PARAM_REGEX);
			const matchSimple = context.selectedText.match(BBCodeWrapper.URL_SIMPLE_REGEX);

			if (matchWithParam)
			{
				return this.#replaceUrlTag(context, matchWithParam[2]);
			}

			if (matchSimple)
			{
				return this.#replaceUrlTag(context, matchSimple[1]);
			}

			const wrapping = this.#detector.isWrappedOutside(context);
			if (wrapping)
			{
				const { openTag, closeTag } = wrapping;
				const urlParamMatch = openTag.match(BBCodeWrapper.URL_OPEN_TAG_REGEX);
				if (urlParamMatch)
				{
					const newOpenTag = context.getOpenTag();
					const newCloseTag = context.getCloseTag();
					const newText = context.fullText.slice(0, context.startIndex - openTag.length)
						+ newOpenTag
						+ context.selectedText
						+ newCloseTag
						+ context.fullText.slice(context.endIndex + closeTag.length);

					return context.createResult(
						newText,
						context.startIndex - openTag.length + newOpenTag.length,
						context.startIndex - openTag.length + newOpenTag.length + context.selectedText.length,
					);
				}
			}

			return null;
		}

		/**
		 * Helper method to replace URL tag with new parameter
		 * @private
		 * @param {BBCodeContext} context
		 * @param {string} content
		 * @returns {{newText: string, newStart: number, newEnd: number}}
		 *
		 * @example
		 * bbCode = 'url', param = 'https://new.link', content = 'click me'
		 * replaces selection with "[url=https://new.link]|click me|[/url]"
		 */
		#replaceUrlTag(context, content)
		{
			const openTag = buildOpenTag('url', context.param);
			const closeTag = buildCloseTag('url');
			const newTag = openTag + content + closeTag;
			const newText = context.replaceSelection(newTag);

			return context.createResult(
				newText,
				context.startIndex + openTag.length,
				context.startIndex + openTag.length + content.length,
			);
		}

		/**
		 * Removes BB-code tags that are inside the selection
		 * Pattern: [bbCode]content[/bbCode]
		 * @param {BBCodeContext} context
		 * @returns {{newText: string, newStart: number, newEnd: number}|null}
		 *
		 * @example
		 * bbCode = 'b'
		 * "hello |[b]world[/b]| today" => "hello |world| today"
		 *
		 * @example
		 * bbCode = 'i'
		 * "|[i]some text[/i]|" => "|some text|"
		 */
		unwrapInside(context)
		{
			const match = this.#detector.isWrappedInside(context.selectedText, context.escapedBBCode);

			if (!match)
			{
				return null;
			}

			const unwrapped = match[1];
			const newText = context.replaceSelection(unwrapped);

			return context.createResult(
				newText,
				context.startIndex,
				context.startIndex + unwrapped.length,
			);
		}

		/**
		 * Removes BB-code tags that are nested inside other tags in the selection.
		 * If all text content is covered by the target tag, strips them (toggle off).
		 * If only part is covered, strips existing tags and wraps everything (normalize).
		 * @param {BBCodeContext} context
		 * @returns {{newText: string, newStart: number, newEnd: number}|null}
		 *
		 * @example fully covered — toggle off
		 * bbCode = 's'
		 * "|[B][S]Test[/S][/B]|" => "|[B]Test[/B]|"
		 *
		 * @example partially covered — strip + wrap
		 * bbCode = 's'
		 * "|prefix [B][S]Test[/S][/B] suffix|" => "|[s]prefix [B]Test[/B] suffix[/s]|"
		 */
		unwrapNested(context)
		{
			const openTagRegex = createOpenTagPattern(context.escapedBBCode, { global: true });
			const closeTagRegex = createCloseTagPattern(context.escapedBBCode, { global: true });

			const openCount = [...context.selectedText.matchAll(openTagRegex)].length;
			const closeCount = [...context.selectedText.matchAll(closeTagRegex)].length;

			if (openCount === 0 || openCount !== closeCount)
			{
				return null;
			}

			const stripped = context.selectedText
				.replaceAll(openTagRegex, '')
				.replaceAll(closeTagRegex, '');

			if (this.#isFullyCoveredByTag(context.selectedText, context.escapedBBCode))
			{
				const newText = context.replaceSelection(stripped);

				return context.createResult(
					newText,
					context.startIndex,
					context.startIndex + stripped.length,
				);
			}

			const openTag = context.getOpenTag();
			const closeTag = context.getCloseTag();
			const wrapped = openTag + stripped + closeTag;
			const newText = context.replaceSelection(wrapped);

			return context.createResult(
				newText,
				context.startIndex + openTag.length,
				context.startIndex + openTag.length + stripped.length,
			);
		}

		/**
		 * Checks if all plain text content is inside the target BB-code tag pairs
		 * @param {string} text
		 * @param {string} escapedBBCode
		 * @returns {boolean}
		 */
		#isFullyCoveredByTag(text, escapedBBCode)
		{
			const completeTagPattern = new RegExp(
				`\\[${escapedBBCode}(?:=[^\\]]*)?\\][\\s\\S]*?\\[\\/${escapedBBCode}\\]`,
				'gi',
			);
			const outsideText = text.replaceAll(completeTagPattern, '');
			const outsidePlain = outsideText.replaceAll(BBCodeWrapper.ANY_BB_TAG_REGEX, '');

			return outsidePlain.trim() === '';
		}

		/**
		 * Removes BB-code tags that are outside the selection
		 * Pattern: [bbCode]|content|[/bbCode]
		 * @param {BBCodeContext} context
		 * @returns {{newText: string, newStart: number, newEnd: number}|null}
		 *
		 * @example
		 * bbCode = 'b'
		 * "hello [b]|world|[/b] today" => "hello |world| today"
		 *
		 * @example
		 * bbCode = 'url'
		 * "[url=https://example.com]|click|[/url]" => "|click|"
		 */
		unwrapOutside(context)
		{
			const wrapping = this.#detector.isWrappedOutside(context);

			if (!wrapping)
			{
				return null;
			}

			const { openTag, closeTag } = wrapping;
			const newText = context.fullText.slice(0, context.startIndex - openTag.length)
				+ context.selectedText
				+ context.fullText.slice(context.endIndex + closeTag.length);

			return context.createResult(
				newText,
				context.startIndex - openTag.length,
				context.startIndex - openTag.length + context.selectedText.length,
			);
		}
	}

	module.exports = { BBCodeWrapper };
});
