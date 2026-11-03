/**
 * @module im/messenger/lib/bbcode/style-canonicalizer
 */
jn.define(
	'im/messenger/lib/bbcode/style-canonicalizer',
	(require, exports, module) => {
		const STYLE_TAGS = new Set(['b', 'i', 'u', 's']);
		const TRANSPARENT_CONTAINER_TAGS = new Set(['color', 'size']);
		const STANDALONE_TAGS = new Set(['br', '*', 'icon', 'like', 'dislike', 'rating', 'disk', 'timestamp']);
		const BB_CODE_TAG_PATTERN = /\[\/?(\w+|\*)(?:=[^\]]*)?]/g;
		const MIN_INSERTION_BUDGET = 1024;

		class StyleBBCodeCanonicalizer
		{
			/**
			 * @param {string} text
			 * @param {string} tagName
			 * @param {number} start
			 * @param {number} end
			 * @returns {boolean}
			 */
			hasProtectedSelectionBoundary(text, tagName, start, end)
			{
				const normalizedTagName = tagName.toLowerCase();
				if (normalizedTagName === 'code')
				{
					return this.#hasStyleSelectionBoundary(text, start, end);
				}

				if (!STYLE_TAGS.has(normalizedTagName))
				{
					return false;
				}

				return this.#getProtectedRanges(text).some((range) => {
					return this.#isInsideRange(start, range)
						|| this.#isInsideRange(end, range);
				});
			}

			#hasStyleSelectionBoundary(text, start, end)
			{
				const tokens = this.#getStyleTokens(text, this.#getProtectedRanges(text));
				this.#matchPairs(tokens);

				return tokens.some((token) => {
					if (token.isClose || token.pairIndex === null)
					{
						return false;
					}

					const range = { start: token.start, end: tokens[token.pairIndex].end };

					return this.#isInsideRange(start, range) !== this.#isInsideRange(end, range);
				});
			}

			/**
			 * @param {string} tagName
			 * @param {{newText: string, newStart: number, newEnd: number}} result
			 * @returns {{status: 'unchanged'|'repaired'|'failed', result: {newText: string, newStart: number, newEnd: number}}}
			 */
			canonicalize(tagName, result)
			{
				if (!STYLE_TAGS.has(tagName.toLowerCase()))
				{
					return { status: 'unchanged', result };
				}

				const protectedRanges = this.#getProtectedRanges(result.newText);
				const tokens = this.#getStyleTokens(result.newText, protectedRanges);
				this.#matchPairs(tokens);

				const crossingResult = this.#getCrossings(
					tokens,
					Math.max(MIN_INSERTION_BUDGET, result.newText.length),
				);
				if (crossingResult.status === 'failed')
				{
					return { status: 'failed', result };
				}

				const { crossings } = crossingResult;
				const repair = this.#getRepair(tokens, crossings, result.newStart, result.newEnd);
				if (repair.status === 'none')
				{
					return { status: 'unchanged', result };
				}

				if (repair.status === 'failed')
				{
					return { status: 'failed', result };
				}

				return {
					status: 'repaired',
					result: this.#applyRepair(result, tokens, repair.crossings),
				};
			}

			/**
			 * @param {string} text
			 * @returns {{status: 'unchanged'|'repaired'|'failed', result: {newText: string, newStart: number, newEnd: number}}}
			 */
			repairWholeText(text)
			{
				if (!/\[\/?[bius](?:=[^\]]*)?]/i.test(text))
				{
					return {
						status: 'unchanged',
						result: { newText: text, newStart: 0, newEnd: text.length },
					};
				}

				return this.canonicalize('b', {
					newText: text,
					newStart: 0,
					newEnd: text.length,
				});
			}

			/**
			 * @param {string} text
			 * @returns {Array<{start: number, end: number}>}
			 */
			#getProtectedRanges(text)
			{
				const stacks = new Map();
				const ranges = [];

				for (const match of text.matchAll(BB_CODE_TAG_PATTERN))
				{
					const raw = match[0];
					const name = match[1].toLowerCase();
					const isClose = raw.startsWith('[/');
					if (!isClose)
					{
						const stack = stacks.get(name) ?? [];
						const isProtected = !STANDALONE_TAGS.has(name)
							&& (
								(!STYLE_TAGS.has(name) && !TRANSPARENT_CONTAINER_TAGS.has(name))
								|| (STYLE_TAGS.has(name) && raw.includes('='))
							);
						const range = isProtected ? { start: match.index, end: null } : null;
						if (range)
						{
							ranges.push(range);
						}
						stack.push({ range });
						stacks.set(name, stack);

						continue;
					}

					const stack = stacks.get(name);
					if (stack?.length > 0)
					{
						const { range } = stack.pop();
						if (range)
						{
							range.end = match.index + raw.length;
						}
					}
				}

				return this.#mergeRanges(ranges.map((range) => ({
					...range,
					end: range.end ?? text.length,
				})));
			}

			/**
			 * @param {Array<{start: number, end: number}>} ranges
			 * @returns {Array<{start: number, end: number}>}
			 */
			#mergeRanges(ranges)
			{
				const merged = [];

				for (const range of ranges)
				{
					const previous = merged.at(-1);
					if (previous && range.start < previous.end)
					{
						previous.end = Math.max(previous.end, range.end);

						continue;
					}

					merged.push({ ...range });
				}

				return merged;
			}

			/**
			 * @param {number} offset
			 * @param {{start: number, end: number}} range
			 * @returns {boolean}
			 */
			#isInsideRange(offset, range)
			{
				return offset > range.start && offset < range.end;
			}

			/**
			 * @param {string} text
			 * @param {Array<{start: number, end: number}>} protectedRanges
			 * @returns {Array}
			 */
			#getStyleTokens(text, protectedRanges)
			{
				const tokens = [];
				let protectedIndex = 0;

				for (const match of text.matchAll(BB_CODE_TAG_PATTERN))
				{
					while (protectedRanges[protectedIndex]?.end <= match.index)
					{
						protectedIndex++;
					}

					const protectedRange = protectedRanges[protectedIndex];
					if (protectedRange && match.index >= protectedRange.start && match.index < protectedRange.end)
					{
						continue;
					}

					const raw = match[0];
					const name = match[1].toLowerCase();
					const isClose = raw.startsWith('[/');
					if (!STYLE_TAGS.has(name) || (!isClose && raw.includes('=')))
					{
						continue;
					}

					tokens.push({
						raw,
						name,
						isClose,
						start: match.index,
						end: match.index + raw.length,
						pairIndex: null,
					});
				}

				return tokens;
			}

			/**
			 * @param {Array} tokens
			 */
			#matchPairs(tokens)
			{
				const stacks = new Map();

				tokens.forEach((token, index) => {
					if (!token.isClose)
					{
						const stack = stacks.get(token.name) ?? [];
						stack.push(index);
						stacks.set(token.name, stack);

						return;
					}

					const stack = stacks.get(token.name);
					if (stack?.length > 0)
					{
						const openIndex = stack.pop();
						tokens[openIndex].pairIndex = index;
						token.pairIndex = openIndex;
					}
				});
			}

			/**
			 * @param {Array} tokens
			 * @param {number} insertionBudget
			 * @returns {{status: 'success'|'failed', crossings: Array<{closeIndex: number, involvedOpenIndexes: Array<number>}>}}
			 */
			#getCrossings(tokens, insertionBudget)
			{
				const activeOpenNodes = new Map();
				const crossings = [];
				let failed = false;
				let insertedLength = 0;
				let top = null;

				tokens.forEach((token, index) => {
					if (failed)
					{
						return;
					}

					if (!token.isClose)
					{
						const node = {
							tokenIndex: index,
							previous: top,
							next: null,
						};
						if (top)
						{
							top.next = node;
						}
						top = node;
						activeOpenNodes.set(index, node);

						return;
					}

					const matched = activeOpenNodes.get(token.pairIndex);
					if (!matched)
					{
						return;
					}

					if (matched !== top)
					{
						const involvedOpenIndexes = [];
						let current = matched;
						while (current)
						{
							involvedOpenIndexes.push(current.tokenIndex);
							if (current !== matched)
							{
								const { name } = tokens[current.tokenIndex];
								insertedLength += (name.length * 2) + 5;
								if (insertedLength > insertionBudget)
								{
									failed = true;

									return;
								}
							}
							current = current.next;
						}

						crossings.push({
							closeIndex: index,
							involvedOpenIndexes,
						});
					}

					if (matched.previous)
					{
						matched.previous.next = matched.next;
					}
					if (matched.next)
					{
						matched.next.previous = matched.previous;
					}
					else
					{
						top = matched.previous;
					}
					activeOpenNodes.delete(token.pairIndex);
				});
				if (failed)
				{
					return { status: 'failed', crossings: [] };
				}

				return { status: 'success', crossings };
			}

			/**
			 * @param {Array} tokens
			 * @param {Array} crossings
			 * @param {number} start
			 * @param {number} end
			 * @returns {{status: string, crossings?: Array}}
			 */
			#getRepair(tokens, crossings, start, end)
			{
				let rangeStart = start;
				let rangeEnd = end;
				let firstCrossingIndex = -1;
				let lastCrossingIndex = -1;

				crossings.forEach((crossing, index) => {
					const close = tokens[crossing.closeIndex];
					if (close.start >= rangeStart && close.start <= rangeEnd)
					{
						firstCrossingIndex = firstCrossingIndex === -1 ? index : firstCrossingIndex;
						lastCrossingIndex = index;
					}
				});

				if (firstCrossingIndex === -1)
				{
					return { status: 'none' };
				}

				const pendingCrossingIndexes = [];
				for (let index = firstCrossingIndex; index <= lastCrossingIndex; index++)
				{
					pendingCrossingIndexes.push(index);
				}

				for (let pendingIndex = 0; pendingIndex < pendingCrossingIndexes.length; pendingIndex++)
				{
					const crossing = crossings[pendingCrossingIndexes[pendingIndex]];
					for (const openIndex of crossing.involvedOpenIndexes)
					{
						const open = tokens[openIndex];
						if (open.pairIndex === null)
						{
							return { status: 'failed' };
						}

						const close = tokens[open.pairIndex];
						rangeStart = Math.min(rangeStart, open.start);
						rangeEnd = Math.max(rangeEnd, close.end);
					}

					while (
						firstCrossingIndex > 0
						&& tokens[crossings[firstCrossingIndex - 1].closeIndex].start >= rangeStart
					)
					{
						firstCrossingIndex--;
						pendingCrossingIndexes.push(firstCrossingIndex);
					}

					while (
						lastCrossingIndex < crossings.length - 1
						&& tokens[crossings[lastCrossingIndex + 1].closeIndex].start <= rangeEnd
					)
					{
						lastCrossingIndex++;
						pendingCrossingIndexes.push(lastCrossingIndex);
					}
				}

				return {
					status: 'repair',
					crossings: crossings.slice(firstCrossingIndex, lastCrossingIndex + 1),
				};
			}

			/**
			 * @param {{newText: string, newStart: number, newEnd: number}} result
			 * @param {Array} tokens
			 * @param {Array} crossings
			 * @returns {{newText: string, newStart: number, newEnd: number}}
			 */
			#applyRepair(result, tokens, crossings)
			{
				const insertions = [];

				for (const crossing of crossings)
				{
					const close = tokens[crossing.closeIndex];
					const intervening = crossing.involvedOpenIndexes.slice(1);
					const prefix = [...intervening]
						.reverse()
						.map((openIndex) => `[/${tokens[openIndex].name}]`)
						.join('');
					const suffix = intervening
						.map((openIndex) => `[${tokens[openIndex].name}]`)
						.join('');

					insertions.push({ position: close.start, text: prefix });
					insertions.push({ position: close.end, text: suffix });
				}

				const chunks = [];
				let sourceOffset = 0;
				for (const insertion of insertions)
				{
					chunks.push(result.newText.slice(sourceOffset, insertion.position), insertion.text);
					sourceOffset = insertion.position;
				}
				chunks.push(result.newText.slice(sourceOffset));

				return {
					newText: chunks.join(''),
					newStart: this.#moveOffset(result.newStart, insertions, 'right'),
					newEnd: this.#moveOffset(result.newEnd, insertions, 'left'),
				};
			}

			/**
			 * @param {number} offset
			 * @param {Array<{position: number, text: string}>} insertions
			 * @param {'left'|'right'} affinity
			 * @returns {number}
			 */
			#moveOffset(offset, insertions, affinity)
			{
				return insertions.reduce((mapped, insertion) => {
					if (insertion.position < offset || (insertion.position === offset && affinity === 'right'))
					{
						return mapped + insertion.text.length;
					}

					return mapped;
				}, offset);
			}
		}

		const styleBBCodeCanonicalizer = new StyleBBCodeCanonicalizer();
		const repairVisualStyleBBCode = (text) => styleBBCodeCanonicalizer.repairWholeText(text);

		module.exports = {
			repairVisualStyleBBCode,
			StyleBBCodeCanonicalizer,
		};
	},
);
