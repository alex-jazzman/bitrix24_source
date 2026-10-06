/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports, im_v2_lib_parser, im_v2_lib_quote, im_v2_lib_utils, main_core, main_core_events) {
	'use strict';

	const EVENT_NAMESPACE = 'BX.Messenger.v2.Textarea.ResizeManager';
	class ResizeManager extends main_core_events.EventEmitter {
		#observer;
		#textareaHeight;
		static events = {
			onHeightChange: 'onHeightChange'
		};
		constructor() {
			super();
			this.setEventNamespace(EVENT_NAMESPACE);
			this.#initObserver();
		}
		observeTextarea(element) {
			this.#observer.observe(element);
			this.#textareaHeight = element.clientHeight;
		}
		unobserveTextarea(element) {
			this.#observer.unobserve(element);
			this.#textareaHeight = 0;
		}
		#initObserver() {
			this.#observer = new ResizeObserver(entries => {
				entries.forEach(entry => {
					const height = entry.borderBoxSize?.[0].blockSize;
					if (main_core.Type.isNumber(height) && height !== this.#textareaHeight) {
						this.emit(ResizeManager.events.onHeightChange, {
							newHeight: height
						});
						this.#textareaHeight = height;
					}
				});
			});
		}
	}

	const TAB = '\t';
	const NEW_LINE = '\n';
	const LETTER_CODE_PREFIX = 'Key';

	// Markdown markers per decoration key. Must match the syntax accepted by the
	// converter (im.v2.lib.parser markdown rules): Bold -> **, Italic -> * (not _),
	// Strikethrough -> ~~, Code -> block fenced ```.
	// Underline has no Markdown equivalent and stays BB [u] (handled as an exception).
	const FENCE = '```';
	const MarkdownMarker = {
		b: {
			left: '**',
			right: '**'
		},
		i: {
			left: '*',
			right: '*'
		},
		s: {
			left: '~~',
			right: '~~'
		},
		code: {
			left: `${FENCE}${NEW_LINE}`,
			right: `${NEW_LINE}${FENCE}`
		}
	};

	/* eslint-disable no-param-reassign */
	const Textarea = {
		prepareInlineQuote(textarea) {
			const selectedText = textarea.value.slice(textarea.selectionStart, textarea.selectionEnd);
			if (!selectedText) {
				return textarea.value;
			}
			const quoteText = im_v2_lib_parser.Parser.prepareQuote({}, selectedText);
			const textBefore = textarea.value.slice(0, textarea.selectionStart);
			const textAfter = textarea.value.slice(textarea.selectionEnd);
			return im_v2_lib_quote.Quote.prepareInlineQuote(textBefore, textAfter, quoteText);
		},
		addTab(textarea) {
			const newSelectionPosition = textarea.selectionStart + 1;
			const textBefore = textarea.value.slice(0, textarea.selectionStart);
			const textAfter = textarea.value.slice(textarea.selectionEnd);
			const textWithTab = `${textBefore}${TAB}${textAfter}`;
			textarea.value = textWithTab;
			textarea.selectionStart = newSelectionPosition;
			textarea.selectionEnd = newSelectionPosition;
			return textWithTab;
		},
		removeTab(textarea) {
			const previousSymbol = textarea.value.slice(textarea.selectionStart - 1, textarea.selectionStart);
			if (previousSymbol !== TAB) {
				return textarea.value;
			}
			const newSelectionPosition = textarea.selectionStart - 1;
			const textBefore = textarea.value.slice(0, textarea.selectionStart - 1);
			const textAfter = textarea.value.slice(textarea.selectionEnd);
			const textWithoutTab = `${textBefore}${textAfter}`;
			textarea.value = textWithoutTab;
			textarea.selectionStart = newSelectionPosition;
			textarea.selectionEnd = newSelectionPosition;
			return textWithoutTab;
		},
		handleDecorationTag(textarea, decorationKey, useMarkdown = false) {
			decorationKey = decorationKey.replace(LETTER_CODE_PREFIX, '').toLowerCase();
			const selectedText = textarea.value.slice(textarea.selectionStart, textarea.selectionEnd);
			if (!selectedText) {
				return textarea.value;
			}
			const {
				left: LEFT_TAG,
				right: RIGHT_TAG
			} = this.getDecorationTags(decorationKey, useMarkdown);

			// Multiline Markdown inline markers wrap each line (see wrapSelection). Toggle-off must
			// be symmetric: detect a per-line-wrapped selection and strip the marker from every
			// line, otherwise removeDecorationTag would peel only the outer pair and leave broken
			// markup (`one**\n**two`).
			if (this.isPerLineMarker(LEFT_TAG, RIGHT_TAG) && selectedText.includes(NEW_LINE)) {
				if (this.isWrappedPerLine(selectedText, LEFT_TAG, RIGHT_TAG)) {
					return this.replaceSelectionWith(textarea, this.unwrapSelection(selectedText, LEFT_TAG, RIGHT_TAG));
				}
				return this.applyWrapping(textarea, LEFT_TAG, RIGHT_TAG);
			}
			const hasDecorationTag = selectedText.toLowerCase().startsWith(LEFT_TAG.toLowerCase()) && selectedText.toLowerCase().endsWith(RIGHT_TAG.toLowerCase()) && selectedText.length >= LEFT_TAG.length + RIGHT_TAG.length && this.isExactMarkerWrap(selectedText, LEFT_TAG, RIGHT_TAG);
			if (hasDecorationTag) {
				return this.removeDecorationTag(textarea, decorationKey, useMarkdown);
			}
			return this.addDecorationTag(textarea, decorationKey, useMarkdown);
		},
		getDecorationTags(decorationKey, useMarkdown = false) {
			// Underline is the only decoration without a Markdown equivalent — keep BB [u].
			if (useMarkdown && decorationKey !== 'u' && MarkdownMarker[decorationKey]) {
				return MarkdownMarker[decorationKey];
			}
			return {
				left: `[${decorationKey}]`,
				right: `[/${decorationKey}]`
			};
		},
		// Guards toggle-off against marker prefix collisions. A single-character marker
		// can be a prefix of a longer marker built from the same character: Italic `*`
		// is a prefix of Bold `**`. Without this guard, Italic on a selected `**bold**`
		// sees a leading/trailing `*`, treats it as already-italic and strips ONE `*`
		// per side → `*bold*`, destroying the bold.
		//
		// The guard fires ONLY for single-character symmetric markers (Italic `*`). For
		// such a marker the selection is an exact single-marker wrap only when the inner
		// content (selection minus the two markers) does not itself begin or end with the
		// marker character — otherwise the selection is really wrapped by a longer
		// same-character marker (`**…**`, `***…***`) and Italic must NEST, not strip.
		// This mirrors the converter's own italic boundary
		// (`/\*([^\s*]...[^\s*])?\*/` in markdown/rules/inline-rules.js), where
		// `*​**bold**​*` is NOT parsed as italic-wrapping-bold.
		//
		// Multi-character markers (Bold `**`, Strike `~~`, fenced code, all BB tags) are
		// left untouched: stripping `**` off `***x***` correctly leaves italic `*x*`, and
		// there is no shorter same-character marker that `~~`/`**` could be mistaken for.
		isExactMarkerWrap(selectedText, leftTag, rightTag) {
			const isSingleCharSymmetricMarker = leftTag.length === 1 && rightTag.length === 1 && leftTag === rightTag;
			if (!isSingleCharSymmetricMarker) {
				return true;
			}
			const markerChar = leftTag;
			const inner = selectedText.slice(leftTag.length, selectedText.length - rightTag.length);
			if (inner === '') {
				return true;
			}
			return !inner.startsWith(markerChar) && !inner.endsWith(markerChar);
		},
		addDecorationTag(textarea, decorationKey, useMarkdown = false) {
			const {
				left: LEFT_TAG,
				right: RIGHT_TAG
			} = this.getDecorationTags(decorationKey, useMarkdown);
			return this.applyWrapping(textarea, LEFT_TAG, RIGHT_TAG);
		},
		removeDecorationTag(textarea, decorationKey, useMarkdown = false) {
			const {
				left: LEFT_TAG,
				right: RIGHT_TAG
			} = this.getDecorationTags(decorationKey, useMarkdown);
			const decorationTagLength = LEFT_TAG.length + RIGHT_TAG.length;
			const newSelectionStart = textarea.selectionStart;
			const newSelectionEnd = textarea.selectionEnd - decorationTagLength;
			const textBefore = textarea.value.slice(0, textarea.selectionStart);
			const textInTagStart = textarea.selectionStart + LEFT_TAG.length;
			const textInTagEnd = textarea.selectionEnd - RIGHT_TAG.length;
			const textInTag = textarea.value.slice(textInTagStart, textInTagEnd);
			const textAfter = textarea.value.slice(textarea.selectionEnd);
			const textWithoutTag = `${textBefore}${textInTag}${textAfter}`;
			textarea.value = textWithoutTag;
			textarea.selectionStart = newSelectionStart;
			textarea.selectionEnd = newSelectionEnd;
			return textWithoutTag;
		},
		addNewLine(textarea) {
			const newSelectionPosition = textarea.selectionStart + 1;
			const textBefore = textarea.value.slice(0, textarea.selectionStart);
			const textAfter = textarea.value.slice(textarea.selectionEnd);
			const textWithNewLine = `${textBefore}${NEW_LINE}${textAfter}`;
			textarea.value = textWithNewLine;
			textarea.selectionStart = newSelectionPosition;
			textarea.selectionEnd = newSelectionPosition;
			return textWithNewLine;
		},
		insertText(textarea, config = {}) {
			const {
				text,
				withNewLine = false,
				replace = false
			} = config;
			const newSelectionPosition = textarea.selectionStart + text.length + 1;
			let resultText = '';
			if (replace) {
				resultText = '';
				textarea.value = '';
				textarea.selectionStart = 0;
				textarea.selectionEnd = 0;
			}
			if (textarea.value.length === 0) {
				resultText = text;
			} else {
				const textBefore = textarea.value.slice(0, textarea.selectionStart);
				const textAfter = textarea.value.slice(textarea.selectionEnd);
				resultText = withNewLine ? `${textarea.value}${NEW_LINE}${text}` : `${textBefore} ${text} ${textAfter}`;
			}
			textarea.focus({
				preventScroll: true
			});
			textarea.value = resultText;
			textarea.selectionStart = newSelectionPosition;
			textarea.selectionEnd = newSelectionPosition;
			return resultText;
		},
		insertMention(textarea, config = {}) {
			const {
				textToInsert,
				textToReplace = ''
			} = config;
			const isMentionWithSymbol = textToReplace.length > 0;
			let resultText = '';
			let newSelectionPosition = textarea.selectionStart + textToInsert.length + 1;
			if (isMentionWithSymbol) {
				newSelectionPosition -= textToReplace.length;
				const textBefore = textarea.value.slice(0, textarea.selectionStart - textToReplace.length);
				const textAfter = textarea.value.slice(textarea.selectionStart);
				resultText = `${textBefore}${textToInsert} ${textAfter}`;
			} else {
				const textBefore = textarea.value.slice(0, textarea.selectionStart);
				const textAfter = textarea.value.slice(textarea.selectionEnd);
				resultText = `${textBefore}${textToInsert} ${textAfter}`;
			}
			textarea.focus({
				preventScroll: true
			});
			textarea.value = resultText;
			textarea.selectionStart = newSelectionPosition;
			textarea.selectionEnd = newSelectionPosition;
			return resultText;
		},
		addUrlTag(textarea, linkUrl, useMarkdown = false) {
			if (!this.shouldHandleUrl(textarea, linkUrl, useMarkdown)) {
				return textarea.value;
			}
			return this.applyUrlWrapping(textarea, linkUrl, useMarkdown);
		},
		handlePasteUrl(textarea, event, useMarkdown = false) {
			const pastedLinkUrl = event.clipboardData?.getData('text/plain');
			if (!this.shouldHandleUrl(textarea, pastedLinkUrl, useMarkdown)) {
				return textarea.value;
			}
			event.preventDefault();
			return this.applyUrlWrapping(textarea, pastedLinkUrl, useMarkdown);
		},
		shouldHandleUrl(textarea, linkUrl, useMarkdown = false) {
			const {
				value,
				selectionStart,
				selectionEnd
			} = textarea;
			const selectedText = value.slice(selectionStart, selectionEnd);
			const isUrl = im_v2_lib_utils.Utils.text.checkUrl(linkUrl);
			if (!isUrl || !selectedText) {
				return false;
			}

			// The [text](url) guard only makes sense in markdown mode, where such a run is a real link:
			// a selection already inside one must fall through to a normal paste (replace the url) rather
			// than nest a second link. In BBCode mode [text](url) is literal text — applyUrlWrapping emits
			// [URL=...] tags — so it must still be wrappable; never suppress it there.
			if (useMarkdown && this.isSelectionInsideMarkdownLink(value, selectionStart, selectionEnd)) {
				return false;
			}
			return true;
		},
		// Whether [selectionStart, selectionEnd] sits inside a [text](url). A forward scan (no regex)
		// keeps this O(value length) — a bracket-heavy paste with unclosed "[" or "(" cannot trigger
		// the catastrophic backtracking a greedy /\[[^\]]*]\([^)]*\)/ would. The url part is walked
		// tracking paren depth, so links whose url itself contains balanced parens (e.g. the markdown
		// rule captures `https://ru.wikipedia.org/wiki/Foo_(bar)` whole) are matched to their real end.
		isSelectionInsideMarkdownLink(value, selectionStart, selectionEnd) {
			let open = value.indexOf('[');
			while (open !== -1) {
				const textClose = value.indexOf(']', open + 1);
				if (textClose === -1) {
					break;
				}
				if (value[textClose + 1] !== '(') {
					open = value.indexOf('[', textClose + 1);
					continue;
				}

				// Walk the url; it never contains whitespace, and closes on the balanced ")". The parser's
				// link grammar excludes the whole \s category ([^\s()]), so break on ANY Unicode whitespace
				// (nbsp, ideographic space, …) — otherwise the guard would treat a run the parser rejects as
				// a link and wrongly suppress wrapping.
				let depth = 1;
				let cursor = textClose + 2;
				while (cursor < value.length && depth > 0) {
					const char = value[cursor];
					if (/\s/.test(char)) {
						break;
					}
					if (char === '(') {
						depth++;
					} else if (char === ')') {
						depth--;
					}
					cursor++;
				}

				// depth === 0 means cursor is one past the closing ")" of a complete [text](url).
				if (depth === 0 && selectionStart >= open && selectionEnd <= cursor) {
					return true;
				}
				open = value.indexOf('[', cursor);
			}
			return false;
		},
		applyUrlWrapping(textarea, linkUrl, useMarkdown = false) {
			if (useMarkdown) {
				return this.applyMarkdownUrlWrapping(textarea, linkUrl);
			}
			const LEFT_TAG = `[URL=${linkUrl}]`;
			const RIGHT_TAG = '[/URL]';
			return this.applyWrapping(textarea, LEFT_TAG, RIGHT_TAG);
		},
		// Markdown links are asymmetric — [text](url) — so the generic symmetric
		// applyWrapping cannot be reused. Selection becomes the link text, the URL
		// goes into the parenthesised part.
		applyMarkdownUrlWrapping(textarea, linkUrl) {
			const selectedText = textarea.value.slice(textarea.selectionStart, textarea.selectionEnd);
			const textBefore = textarea.value.slice(0, textarea.selectionStart);
			const textAfter = textarea.value.slice(textarea.selectionEnd);
			const LEFT_TAG = '[';
			const middle = `](${linkUrl})`;
			const newSelectionStart = textarea.selectionStart + LEFT_TAG.length;
			const newSelectionEnd = newSelectionStart + selectedText.length;
			const textWithLink = `${textBefore}${LEFT_TAG}${selectedText}${middle}${textAfter}`;
			textarea.value = textWithLink;
			textarea.selectionStart = newSelectionStart;
			textarea.selectionEnd = newSelectionEnd;
			return textWithLink;
		},
		applyWrapping(textarea, leftTag, rightTag) {
			const selectedText = textarea.value.slice(textarea.selectionStart, textarea.selectionEnd);
			return this.replaceSelectionWith(textarea, this.wrapSelection(selectedText, leftTag, rightTag));
		},
		// Splices new text over the current selection and keeps the whole result selected.
		replaceSelectionWith(textarea, newSelectionText) {
			const newSelectionStart = textarea.selectionStart;
			const newSelectionEnd = textarea.selectionStart + newSelectionText.length;
			const textBefore = textarea.value.slice(0, textarea.selectionStart);
			const textAfter = textarea.value.slice(textarea.selectionEnd);
			const result = `${textBefore}${newSelectionText}${textAfter}`;
			textarea.value = result;
			textarea.selectionStart = newSelectionStart;
			textarea.selectionEnd = newSelectionEnd;
			return result;
		},
		// A marker that wraps each line of a multiline selection separately. Only the symmetric
		// Markdown inline markers (Bold **, Italic *, Strike ~~) qualify: their converter rules
		// (im.v2.lib.parser markdown/rules/inline-rules.js) match with `.` and no `s` flag, so a
		// single pair cannot span a line break. BB tags ([b], [code], [URL=…]) and the fenced-code
		// marker render across newlines as one block and must NOT be split — a per-line [code]
		// would become several separate code blocks, changing the meaning.
		isPerLineMarker(leftTag, rightTag) {
			const isBlockMarker = leftTag.includes(NEW_LINE) || rightTag.includes(NEW_LINE);
			return !isBlockMarker && leftTag === rightTag && ['**', '*', '~~'].includes(leftTag);
		},
		// Wrapping a multiline selection with one marker pair produces broken Markdown (see
		// isPerLineMarker). For per-line markers we wrap each non-empty line on its own; blank
		// lines and per-line indentation are left untouched.
		wrapSelection(selectedText, leftTag, rightTag) {
			if (!this.isPerLineMarker(leftTag, rightTag) || !selectedText.includes(NEW_LINE)) {
				return `${leftTag}${selectedText}${rightTag}`;
			}
			return selectedText.split(NEW_LINE).map(line => this.wrapLine(line, leftTag, rightTag)).join(NEW_LINE);
		},
		// Symmetric counterpart of wrapSelection: strips the marker from every wrapped line so a
		// per-line-wrapped multiline selection toggles cleanly back to its original text.
		unwrapSelection(selectedText, leftTag, rightTag) {
			return selectedText.split(NEW_LINE).map(line => this.unwrapLine(line, leftTag, rightTag)).join(NEW_LINE);
		},
		// True when every non-empty line of the selection is exactly wrapped by the marker (the
		// shape wrapSelection produces). Blank lines are ignored; at least one wrapped line is
		// required so an unwrapped multiline selection is not mistaken for a wrapped one.
		isWrappedPerLine(selectedText, leftTag, rightTag) {
			const lines = selectedText.split(NEW_LINE);
			let hasWrappedLine = false;
			for (const line of lines) {
				const trimmed = line.trim();
				if (trimmed === '') {
					continue;
				}
				if (!this.isLineWrapped(trimmed, leftTag, rightTag)) {
					return false;
				}
				hasWrappedLine = true;
			}
			return hasWrappedLine;
		},
		isLineWrapped(trimmedLine, leftTag, rightTag) {
			return trimmedLine.startsWith(leftTag) && trimmedLine.endsWith(rightTag) && trimmedLine.length >= leftTag.length + rightTag.length && this.isExactMarkerWrap(trimmedLine, leftTag, rightTag);
		},
		// Wraps a single line, preserving its leading/trailing whitespace outside the markers (so
		// indentation and the converter's "content must not start/end with space" italic rule are
		// respected). Whitespace-only lines are returned as-is to avoid empty `****` marker pairs.
		wrapLine(line, leftTag, rightTag) {
			const trimmed = line.trim();
			if (trimmed === '') {
				return line;
			}
			const leadingWhitespace = line.slice(0, line.length - line.trimStart().length);
			const trailingWhitespace = line.slice(line.trimEnd().length);
			return `${leadingWhitespace}${leftTag}${trimmed}${rightTag}${trailingWhitespace}`;
		},
		// Inverse of wrapLine: removes the marker pair from a wrapped line, keeping its surrounding
		// whitespace. A line that is not exactly wrapped is returned unchanged.
		unwrapLine(line, leftTag, rightTag) {
			const trimmed = line.trim();
			if (trimmed === '' || !this.isLineWrapped(trimmed, leftTag, rightTag)) {
				return line;
			}
			const leadingWhitespace = line.slice(0, line.length - line.trimStart().length);
			const trailingWhitespace = line.slice(line.trimEnd().length);
			const inner = trimmed.slice(leftTag.length, trimmed.length - rightTag.length);
			return `${leadingWhitespace}${inner}${trailingWhitespace}`;
		}
	};

	exports.ResizeManager = ResizeManager;
	exports.Textarea = Textarea;

})(this.BX.Messenger.v2.Lib = this.BX.Messenger.v2.Lib || {}, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX, BX.Event);
//# sourceMappingURL=textarea.bundle.js.map
