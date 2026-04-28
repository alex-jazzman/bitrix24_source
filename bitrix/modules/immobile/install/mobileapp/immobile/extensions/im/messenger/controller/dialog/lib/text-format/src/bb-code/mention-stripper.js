/**
 * @module im/messenger/controller/dialog/lib/text-format/src/bb-code/mention-stripper
 */
jn.define('im/messenger/controller/dialog/lib/text-format/src/bb-code/mention-stripper', (require, exports, module) => {
	/**
	 * @class BBCodeMentionStripper
	 *
	 * @description Strips [user=N]...[/user] and [chat=N]...[/chat] mention tags
	 * when the selection overlaps with a mention range. Formatting inside mentions
	 * is not supported on the web, so the mention must be removed before applying any BB-code.
	 */
	class BBCodeMentionStripper
	{
		static MENTION_OPEN_TAG_REGEX = /\[(user|chat)=\d+]/gi;

		/**
		 * @param {string} fullText
		 * @param {number} startIndex
		 * @param {number} endIndex
		 * @returns {{ text: string, startIndex: number, endIndex: number }}
		 *
		 * @example selection inside mention — both tags stripped
		 * "[user=123]John Smith here[/user]"
		 * select |Smith| (15-20)
		 * => "John Smith here", startIndex=5, endIndex=10
		 *
		 * @example selection includes opening tag without closing tag
		 * "|[user=123]John Smith here|[/user]"
		 * select (0-25)
		 * => "John Smith here", startIndex=0, endIndex=15
		 *
		 * @example selection inside chat mention — both tags stripped
		 * "[chat=1]Team chat[/chat]"
		 * select |Team| (8-12)
		 * => "Team chat", startIndex=0, endIndex=4
		 *
		 * @example selection outside mention — no changes
		 * "Hello [user=123]John[/user] |world|"
		 * => text unchanged, indices unchanged
		 */
		strip(fullText, startIndex, endIndex)
		{
			const tagsToRemove = this.#findTagsToRemove(fullText, startIndex, endIndex);

			if (tagsToRemove.length === 0)
			{
				return { text: fullText, startIndex, endIndex };
			}

			return this.#removeTags(fullText, startIndex, endIndex, tagsToRemove);
		}

		/**
		 * Finds all mention tag positions that overlap with the selection.
		 * @param {string} fullText
		 * @param {number} startIndex
		 * @param {number} endIndex
		 * @returns {Array<{ start: number, end: number }>}
		 */
		#findTagsToRemove(fullText, startIndex, endIndex)
		{
			const tagsToRemove = [];
			const openTags = [...fullText.matchAll(BBCodeMentionStripper.MENTION_OPEN_TAG_REGEX)];

			for (const openMatch of openTags)
			{
				const openStart = openMatch.index;
				const openEnd = openStart + openMatch[0].length;
				const tagName = openMatch[1];

				const closeTag = this.#findMatchingCloseTag(fullText, openEnd, tagName);
				const mentionEnd = closeTag ? closeTag.end : openEnd;

				if (!this.#rangesOverlap(openStart, mentionEnd, startIndex, endIndex))
				{
					continue;
				}

				tagsToRemove.push({ start: openStart, end: openEnd });
				if (closeTag)
				{
					tagsToRemove.push(closeTag);
				}
			}

			return tagsToRemove;
		}

		/**
		 * Finds the first matching close tag after the given position.
		 * @param {string} fullText
		 * @param {number} afterIndex
		 * @param {string} tagName
		 * @returns {{ start: number, end: number }|null}
		 */
		#findMatchingCloseTag(fullText, afterIndex, tagName)
		{
			const closeRegex = new RegExp(`\\[\\/${tagName}\\]`, 'gi');
			closeRegex.lastIndex = afterIndex;
			const closeMatch = closeRegex.exec(fullText);
			if (!closeMatch)
			{
				return null;
			}

			return {
				start: closeMatch.index,
				end: closeMatch.index + closeMatch[0].length,
			};
		}

		/**
		 * @param {number} aStart
		 * @param {number} aEnd
		 * @param {number} bStart
		 * @param {number} bEnd
		 * @returns {boolean}
		 */
		#rangesOverlap(aStart, aEnd, bStart, bEnd)
		{
			return aStart < bEnd && bStart < aEnd;
		}

		/**
		 * Removes tags from the text (right-to-left) and adjusts selection indices.
		 * @param {string} fullText
		 * @param {number} startIndex
		 * @param {number} endIndex
		 * @param {Array<{ start: number, end: number }>} tagsToRemove
		 * @returns {{ text: string, startIndex: number, endIndex: number }}
		 */
		#removeTags(fullText, startIndex, endIndex, tagsToRemove)
		{
			const sorted = [...tagsToRemove].sort((a, b) => b.start - a.start);

			let text = fullText;
			let newStart = startIndex;
			let newEnd = endIndex;

			for (const tag of sorted)
			{
				text = text.slice(0, tag.start) + text.slice(tag.end);

				const tagLength = tag.end - tag.start;

				if (tag.end <= newStart)
				{
					newStart -= tagLength;
					newEnd -= tagLength;
				}
				else if (tag.start < newStart)
				{
					newStart = tag.start;
					newEnd -= tagLength;
				}
				else if (tag.end <= newEnd)
				{
					newEnd -= tagLength;
				}
				else if (tag.start < newEnd)
				{
					newEnd = tag.start;
				}
			}

			return { text, startIndex: newStart, endIndex: newEnd };
		}
	}

	module.exports = { BBCodeMentionStripper };
});
