/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
(function (exports, ui_bbcode_model, main_core, ui_bbcode_parser, ui_bbcode_encoder) {
	'use strict';

	const ChecklistFormattingAction = Object.freeze({
		Bold: 'bold',
		Italic: 'italic',
		Underline: 'underline',
		Strikethrough: 'strikethrough',
		Link: 'link'
	});
	const FormattingTags = Object.freeze({
		[ChecklistFormattingAction.Bold]: {
			open: '[b]',
			close: '[/b]',
			type: 'bold'
		},
		[ChecklistFormattingAction.Italic]: {
			open: '[i]',
			close: '[/i]',
			type: 'italic'
		},
		[ChecklistFormattingAction.Underline]: {
			open: '[u]',
			close: '[/u]',
			type: 'underline'
		},
		[ChecklistFormattingAction.Strikethrough]: {
			open: '[s]',
			close: '[/s]',
			type: 'strikethrough'
		}
	});
	const TagToFormattingAction = Object.freeze({
		b: ChecklistFormattingAction.Bold,
		i: ChecklistFormattingAction.Italic,
		u: ChecklistFormattingAction.Underline,
		s: ChecklistFormattingAction.Strikethrough,
		URL: ChecklistFormattingAction.Link
	});
	const UrlOpenPrefix = '[URL=';
	const UrlClose = '[/URL]';
	const FormattingTagRegExp = /\[(\/?)(b|i|u|s|url)(?:=[^\]]*)?]/gi;
	const createCheckListBbCodeTagSchemes = (options = {}) => {
		const paragraph = options.paragraph === true;
		return [new ui_bbcode_model.BBCodeTagScheme({
			name: ['b', 'u', 'i', 's'],
			group: ['#inline', '#format'],
			allowedChildren: ['#text', '#linebreak', '#inline'],
			canBeEmpty: false
		}), new ui_bbcode_model.BBCodeTagScheme({
			name: ['url'],
			group: ['#inline'],
			allowedChildren: ['#text', '#linebreak', '#format'],
			canBeEmpty: false
		}), ...(paragraph ? [new ui_bbcode_model.BBCodeTagScheme({
			name: 'p',
			group: ['#block'],
			allowedChildren: ['#text', '#linebreak', '#inline'],
			allowedIn: ['#root'],
			onParse: ui_bbcode_model.BBCodeTagScheme.defaultOnBlockParseHandler
		})] : []), new ui_bbcode_model.BBCodeTagScheme({
			name: ['#root'],
			allowedChildren: ['#text', '#linebreak', '#inline', ...(paragraph ? ['p'] : [])]
		}), new ui_bbcode_model.BBCodeTagScheme({
			name: ['#text']
		}), new ui_bbcode_model.BBCodeTagScheme({
			name: ['#linebreak']
		})];
	};
	const CheckListBbCodeScheme = new ui_bbcode_model.BBCodeScheme({
		tagSchemes: createCheckListBbCodeTagSchemes(),
		outputTagCase: ui_bbcode_model.BBCodeScheme.Case.LOWER
	});

	class CheckListFormattingTag {
		static createRegExp() {
			return new RegExp(FormattingTagRegExp);
		}
	}

	// eslint-disable-next-line no-control-regex
	const AttributeWhitespaces = /[\u0000-\u0020\u00A0\u1680\u180E\u2000-\u2029\u205F\u3000]/g;
	const HttpUrl = /^https?:\/\//i;
	const ProtocolRelativeUrl = /^\/\//;
	const ExplicitScheme = /^[a-z][\d+.a-z-]*:/i;
	class CheckListUrl {
		static sanitize(url) {
			if (!main_core.Type.isStringFilled(url)) {
				return '';
			}
			const normalizedUrl = url.replaceAll(AttributeWhitespaces, '');
			return this.sanitizeHttpUrl(normalizedUrl);
		}
		static sanitizeHttpUrl(url) {
			const httpUrl = this.prepareHttpUrl(url);
			if (!httpUrl) {
				return '';
			}
			try {
				const parsedUrl = new URL(httpUrl);
				const hasAllowedProtocol = parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
				const hasValidHost = parsedUrl.hostname.includes('.') || parsedUrl.hostname === 'localhost';
				return hasAllowedProtocol && hasValidHost ? httpUrl : '';
			} catch {
				return '';
			}
		}
		static prepareHttpUrl(url) {
			if (HttpUrl.test(url)) {
				return url;
			}
			if (ProtocolRelativeUrl.test(url)) {
				return `https:${url}`;
			}
			if (ExplicitScheme.test(url)) {
				return '';
			}
			return `https://${url}`;
		}
	}

	class CheckListLink {
		static buildSource(url, text) {
			const safeUrl = CheckListUrl.sanitize(url);
			if (!safeUrl) {
				return '';
			}
			const linkText = (main_core.Type.isStringFilled(text) ? text : safeUrl).replaceAll(/\[\/?url(?:=[^\]]*)?]/gi, '');
			return `${UrlOpenPrefix}${safeUrl}]${linkText}${UrlClose}`;
		}
	}

	class CheckListSelection {
		static normalizeSource(source) {
			return main_core.Type.isString(source) ? source : '';
		}
		static normalizeSelection(source, selection) {
			const start = Math.max(0, Math.min(selection?.start ?? 0, source.length));
			const end = Math.max(start, Math.min(selection?.end ?? start, source.length));
			return {
				start,
				end
			};
		}
		static getTextareaSelection(textarea) {
			const start = textarea?.selectionStart ?? 0;
			const end = textarea?.selectionEnd ?? start;
			return {
				start,
				end
			};
		}
	}

	class CheckListFormatting {
		static handleDecorationTag(source, textarea, action) {
			return this.wrapSelection(source, CheckListSelection.getTextareaSelection(textarea), action);
		}
		static addUrlTag(source, textarea, url) {
			return this.wrapSelection(source, {
				...CheckListSelection.getTextareaSelection(textarea),
				url
			}, ChecklistFormattingAction.Link);
		}
		static getActiveFormattingActions(source, selection) {
			const normalizedSource = CheckListSelection.normalizeSource(source);
			const {
				start,
				end
			} = CheckListSelection.normalizeSelection(normalizedSource, selection);
			const activeTags = [];
			const activeActions = new Set();
			const formattingTagRegExp = CheckListFormattingTag.createRegExp();
			let match = formattingTagRegExp.exec(normalizedSource);
			while (match) {
				const tagEnd = match.index + match[0].length;
				if (tagEnd > start) {
					break;
				}
				const tagName = this.normalizeTagName(match[2]);
				if (match[1] === '/') {
					const tagIndex = activeTags.lastIndexOf(tagName);
					if (tagIndex !== -1) {
						activeTags.splice(tagIndex, 1);
					}
				} else {
					activeTags.push(tagName);
				}
				match = formattingTagRegExp.exec(normalizedSource);
			}
			activeTags.forEach(tagName => {
				const action = TagToFormattingAction[tagName];
				if (action) {
					activeActions.add(action);
				}
			});
			if (end > start) {
				Object.keys(TagToFormattingAction).forEach(tagName => {
					const wrapsSelection = this.getFormattingRanges(normalizedSource, tagName).some(range => {
						return start <= range.openStart && range.closeEnd <= end;
					});
					if (wrapsSelection) {
						activeActions.add(TagToFormattingAction[tagName]);
					}
				});
			}
			return [...activeActions];
		}
		static wrapSelection(source, selection, action) {
			const normalizedSource = CheckListSelection.normalizeSource(source);
			const selectionRange = CheckListSelection.normalizeSelection(normalizedSource, selection);
			const {
				start,
				end
			} = selectionRange;
			const selectedText = normalizedSource.slice(start, end);
			if (action === ChecklistFormattingAction.Link) {
				const selectedLinkRange = this.findSelectedFormattingRange(normalizedSource, selectionRange, 'URL');
				if (selectedLinkRange) {
					return this.unwrapFormattingSelection(normalizedSource, selectedLinkRange.selection, selectedLinkRange.range);
				}
				const linkSource = CheckListLink.buildSource(selection?.url ?? '', selectedText);
				if (!linkSource) {
					return {
						source: normalizedSource,
						selectionStart: start,
						selectionEnd: end
					};
				}
				return {
					source: `${normalizedSource.slice(0, start)}${linkSource}${normalizedSource.slice(end)}`,
					selectionStart: start,
					selectionEnd: start + linkSource.length
				};
			}
			const tag = FormattingTags[action];
			if (!tag) {
				return {
					source: normalizedSource,
					selectionStart: start,
					selectionEnd: end
				};
			}
			const selectedFormattingRange = this.findSelectedFormattingRange(normalizedSource, selectionRange, this.getFormattingTagName(tag));
			if (selectedFormattingRange && this.canUnwrapCleanly(normalizedSource, selectedFormattingRange.range, selectedFormattingRange.selection)) {
				return this.unwrapFormattingSelection(normalizedSource, selectedFormattingRange.selection, selectedFormattingRange.range);
			}
			const wrappedSource = `${normalizedSource.slice(0, start)}${tag.open}${selectedText}${tag.close}${normalizedSource.slice(end)}`;
			if (start === end) {
				const cursor = start + tag.open.length;
				return {
					source: wrappedSource,
					selectionStart: cursor,
					selectionEnd: cursor
				};
			}
			return {
				source: wrappedSource,
				selectionStart: start,
				selectionEnd: start + tag.open.length + selectedText.length + tag.close.length
			};
		}
		static getFormattingTagName(tag) {
			return tag.open.slice(1, -1);
		}
		static canUnwrapCleanly(source, range, selection) {
			const beforeSelection = source.slice(range.contentStart, selection.start);
			const afterSelection = source.slice(selection.end, range.contentEnd);
			if (CheckListFormattingTag.createRegExp().test(beforeSelection)) {
				return false;
			}
			return !CheckListFormattingTag.createRegExp().test(afterSelection);
		}
		static getFormattingRanges(source, tagName) {
			const openedTags = [];
			const ranges = [];
			const normalizedTagName = this.normalizeTagName(tagName);
			const formattingTagRegExp = CheckListFormattingTag.createRegExp();
			let match = formattingTagRegExp.exec(source);
			while (match) {
				const currentTagName = this.normalizeTagName(match[2]);
				if (currentTagName === normalizedTagName) {
					if (match[1] === '/') {
						const openedTag = openedTags.pop();
						if (openedTag) {
							ranges.push({
								openStart: openedTag.start,
								openEnd: openedTag.end,
								openTag: openedTag.tag,
								contentStart: openedTag.end,
								contentEnd: match.index,
								closeStart: match.index,
								closeEnd: match.index + match[0].length,
								closeTag: match[0]
							});
						}
					} else {
						openedTags.push({
							start: match.index,
							end: match.index + match[0].length,
							tag: match[0]
						});
					}
				}
				match = formattingTagRegExp.exec(source);
			}
			return ranges;
		}
		static normalizeTagName(tagName) {
			const normalizedTagName = tagName.toLowerCase();
			return normalizedTagName === 'url' ? 'URL' : normalizedTagName;
		}
		static findSelectedFormattingRange(source, selection, tagName) {
			const ranges = this.getFormattingRanges(source, tagName);
			const exactRange = ranges.find(range => {
				return range.openStart === selection.start && range.closeEnd === selection.end;
			});
			if (exactRange) {
				return {
					range: exactRange,
					selection: {
						start: exactRange.contentStart,
						end: exactRange.contentEnd
					}
				};
			}
			const containingRanges = ranges.filter(range => {
				return range.contentStart <= selection.start && selection.end <= range.contentEnd;
			}).sort((a, b) => {
				return a.contentEnd - a.contentStart - (b.contentEnd - b.contentStart);
			});
			const range = containingRanges[0];
			if (!range) {
				return null;
			}
			return {
				range,
				selection
			};
		}
		static unwrapFormattingSelection(source, selection, range) {
			const beforeRange = source.slice(0, range.openStart);
			const beforeSelection = source.slice(range.contentStart, selection.start);
			const selectedText = source.slice(selection.start, selection.end);
			const afterSelection = source.slice(selection.end, range.contentEnd);
			const afterRange = source.slice(range.closeEnd);
			const formattedBeforeSelection = beforeSelection ? `${range.openTag}${beforeSelection}${range.closeTag}` : '';
			const formattedAfterSelection = afterSelection ? `${range.openTag}${afterSelection}${range.closeTag}` : '';
			const selectionStart = beforeRange.length + formattedBeforeSelection.length;
			return {
				source: [beforeRange, formattedBeforeSelection, selectedText, formattedAfterSelection, afterRange].join(''),
				selectionStart,
				selectionEnd: selectionStart + selectedText.length
			};
		}
	}

	const HtmlTagByBbCodeTag = Object.freeze({
		b: 'b',
		i: 'i',
		u: 'u',
		s: 's'
	});
	const CheckListBbCodeParser = new ui_bbcode_parser.BBCodeParser({
		scheme: CheckListBbCodeScheme,
		linkify: true,
		normalize: false
	});
	class CheckListBbCodeRenderer {
		static formatHtml(source, linkColor = '') {
			const normalizedSource = CheckListSelection.normalizeSource(source);
			if (this.hasMalformedFormattingTags(normalizedSource)) {
				return this.formatMalformedSource(normalizedSource);
			}
			return this.renderNodeToHtml(CheckListBbCodeParser.parse(normalizedSource), linkColor);
		}
		static hasMalformedFormattingTags(source) {
			const openedTags = [];
			const formattingTagRegExp = CheckListFormattingTag.createRegExp();
			let match = formattingTagRegExp.exec(source);
			while (match) {
				const tagName = match[2].toUpperCase();
				if (match[1] === '/') {
					if (openedTags.pop() !== tagName) {
						return true;
					}
				} else {
					openedTags.push(tagName);
				}
				match = formattingTagRegExp.exec(source);
			}
			return openedTags.length > 0;
		}
		static formatMalformedSource(source) {
			return main_core.Text.encode(this.lowerCaseFormattingTags(source));
		}
		static lowerCaseFormattingTags(source) {
			return source.replace(CheckListFormattingTag.createRegExp(), (tag, closing, tagName) => {
				return tag.replace(`${closing}${tagName}`, `${closing}${tagName.toLowerCase()}`);
			});
		}
		static toPlainText(source) {
			const normalizedSource = CheckListSelection.normalizeSource(source);
			if (this.hasMalformedFormattingTags(normalizedSource)) {
				return this.lowerCaseFormattingTags(normalizedSource);
			}
			return CheckListBbCodeParser.parse(normalizedSource).toPlainText();
		}
		static renderChildrenToHtml(node, linkColor = '') {
			return node.getChildren().map(child => this.renderNodeToHtml(child, linkColor)).join('');
		}
		static renderUrlNodeToHtml(node, linkColor = '') {
			const sourceUrl = main_core.Type.isStringFilled(node.getValue()) ? node.getValue() : node.toPlainText();
			const safeUrl = CheckListUrl.sanitize(sourceUrl);
			if (!safeUrl) {
				return main_core.Text.encode(node.toString({
					encode: false
				}));
			}
			const content = this.renderChildrenToHtml(node, linkColor);
			const href = main_core.Text.encode(safeUrl);
			const style = main_core.Type.isStringFilled(linkColor) ? ` style="color: ${main_core.Text.encode(linkColor)};"` : '';
			return [`<a class="tasks-check-list-formatting-layer-link" href="${href}"${style}`, 'target="_blank" rel="noopener noreferrer"', `data-testid="tasks-check-list-formatting-link">${content}</a>`].join(' ');
		}
		static renderNodeToHtml(node, linkColor = '') {
			const name = node.getName();
			if (name === '#root' || name === '#fragment') {
				return this.renderChildrenToHtml(node, linkColor);
			}
			if (name === '#text' || name === '#linebreak') {
				return main_core.Text.encode(node.toPlainText());
			}
			const htmlTag = HtmlTagByBbCodeTag[name];
			if (htmlTag) {
				return `<${htmlTag}>${this.renderChildrenToHtml(node, linkColor)}</${htmlTag}>`;
			}
			if (name === 'url') {
				return this.renderUrlNodeToHtml(node, linkColor);
			}
			return main_core.Text.encode(node.toString({
				encode: false
			}));
		}
	}

	const encoder = new ui_bbcode_encoder.BBCodeEncoder();
	const EditorExportScheme = new ui_bbcode_model.BBCodeScheme({
		tagSchemes: createCheckListBbCodeTagSchemes({
			paragraph: true
		}),
		outputTagCase: ui_bbcode_model.BBCodeScheme.Case.LOWER
	});
	const createUnknownTagHandler = (node, scheme) => {
		if (node.getType() !== ui_bbcode_model.BBCodeNode.ELEMENT_NODE) {
			return;
		}
		const content = node.getChildren().map(child => child.toString({
			encode: false
		})).join('');
		const closingTag = node.isVoid() ? '' : node.getClosingTag();
		const literal = `${node.getOpeningTag()}${content}${closingTag}`;
		node.replace(scheme.createText(literal));
	};
	const sourceParser = new ui_bbcode_parser.BBCodeParser({
		scheme: CheckListBbCodeScheme,
		encoder,
		linkify: false,
		normalize: false,
		onUnknown: createUnknownTagHandler
	});
	const editorExportParser = new ui_bbcode_parser.BBCodeParser({
		scheme: EditorExportScheme,
		encoder,
		linkify: false,
		normalize: false,
		onUnknown: createUnknownTagHandler
	});
	class CheckListEditorBbCode {
		static prepare(source, malformed) {
			const originalSource = main_core.Type.isString(source) ? source : '';
			return {
				originalSource,
				editorSource: this.prepareSource(originalSource, malformed)
			};
		}
		static serialize(editorSource, originalSource, dirty, malformed) {
			if (dirty !== true) {
				return main_core.Type.isString(originalSource) ? originalSource : '';
			}
			return this.serializeSource(main_core.Type.isString(editorSource) ? editorSource : '', malformed);
		}
		static prepareSource(source, malformed) {
			if (malformed) {
				return encoder.encodeText(source);
			}
			const ast = sourceParser.parse(source);
			this.sanitizeUrls(ast);
			return ast.toString();
		}
		static serializeSource(source, malformed) {
			if (malformed) {
				return encoder.encodeText(source);
			}
			const ast = editorExportParser.parse(source);
			this.unwrapParagraphs(ast);
			this.sanitizeUrls(ast);
			return ast.toString();
		}
		static unwrapParagraphs(ast) {
			ui_bbcode_model.BBCodeNode.flattenAst(ast).forEach(node => {
				if (node.getName() === 'p') {
					node.replace(...node.getChildren());
				}
			});
		}
		static sanitizeUrls(ast) {
			ui_bbcode_model.BBCodeNode.flattenAst(ast).forEach(node => {
				if (node.getName() !== 'url') {
					return;
				}
				const sourceUrl = main_core.Type.isStringFilled(node.getValue()) ? node.getValue() : node.toPlainText();
				const safeUrl = CheckListUrl.sanitize(sourceUrl);
				if (safeUrl) {
					node.setValue(safeUrl);
					return;
				}
				const literal = node.toString({
					encode: false
				});
				node.replace(node.getScheme().createText(literal));
			});
		}
	}

	class CheckListBbCode {
		static handleDecorationTag(source, textarea, action) {
			return CheckListFormatting.handleDecorationTag(source, textarea, action);
		}
		static addUrlTag(source, textarea, url) {
			return CheckListFormatting.addUrlTag(source, textarea, url);
		}
		static getActiveFormattingActions(source, selection) {
			return CheckListFormatting.getActiveFormattingActions(source, selection);
		}
		static buildLinkSource(url, text) {
			return CheckListLink.buildSource(url, text);
		}
		static sanitizeUrl(url) {
			return CheckListUrl.sanitize(url);
		}
		static wrapSelection(source, selection, action) {
			return CheckListFormatting.wrapSelection(source, selection, action);
		}
		static formatHtml(source, linkColor = '') {
			return CheckListBbCodeRenderer.formatHtml(source, linkColor);
		}

		/**
		 * Visible text of a formatted source, for surfaces that show no formatting: accessible names,
		 * screen reader announcements, menu items.
		 */
		static toPlainText(source) {
			return CheckListBbCodeRenderer.toPlainText(source);
		}
		static prepareForEditor(source) {
			return CheckListEditorBbCode.prepare(source, this.hasMalformedFormattingTags(source));
		}
		static serializeFromEditor(editorSource, originalSource, dirty) {
			return CheckListEditorBbCode.serialize(editorSource, originalSource, dirty, this.hasMalformedFormattingTags(editorSource));
		}
		static hasMalformedFormattingTags(source) {
			return CheckListBbCodeRenderer.hasMalformedFormattingTags(source);
		}
	}

	exports.CheckListBbCode = CheckListBbCode;
	exports.ChecklistFormattingAction = ChecklistFormattingAction;

})(this.BX.Tasks.V2.Lib = this.BX.Tasks.V2.Lib || {}, BX.UI.BBCode, BX, BX.UI.BBCode, BX.UI.BBCode);
//# sourceMappingURL=check-list-bb-code.bundle.js.map
