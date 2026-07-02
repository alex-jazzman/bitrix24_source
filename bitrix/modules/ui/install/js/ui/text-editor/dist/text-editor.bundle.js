/* eslint-disable */
this.BX = this.BX || {};
this.BX.UI = this.BX.UI || {};
(function (exports, ui_lexical_core, ui_lexical_table, main_core, ui_lexical_link, ui_codeParser, ui_iconSet_api_core, ui_lexical_clipboard, ui_lexical_selection, ui_lexical_utils, ui_bbcode_model, ui_bbcode_parser, ui_textEditor, main_core_events, main_core_cache, main_popup, ui_smiley, ui_videoService, main_core_collections, ui_lexical_richText, ui_lexical_list, ui_lexical_text, ui_lexical_html, ui_lexical_history) {
	'use strict';

	const HIDE_DIALOG_COMMAND = ui_lexical_core.createCommand('HIDE_DIALOG_COMMAND');
	const DIALOG_VISIBILITY_COMMAND = ui_lexical_core.createCommand('DIALOG_VISIBILITY_COMMAND');
	const DRAG_START_COMMAND = ui_lexical_core.createCommand('DRAG_START_COMMAND');
	const DRAG_END_COMMAND = ui_lexical_core.createCommand('DRAG_END_COMMAND');

	var AllCommands = /*#__PURE__*/Object.freeze({
		__proto__: null,
		DIALOG_VISIBILITY_COMMAND: DIALOG_VISIBILITY_COMMAND,
		DRAG_END_COMMAND: DRAG_END_COMMAND,
		DRAG_START_COMMAND: DRAG_START_COMMAND,
		HIDE_DIALOG_COMMAND: HIDE_DIALOG_COMMAND
	});

	// Node flags
	const UNFORMATTED = 1;
	const NewLineMode = {
		LINE_BREAK: 'line-break',
		PARAGRAPH: 'paragraph',
		MIXED: 'mixed'
	};

	var AllConstants = /*#__PURE__*/Object.freeze({
		__proto__: null,
		NewLineMode: NewLineMode,
		UNFORMATTED: UNFORMATTED
	});

	const NON_SINGLE_WIDTH_CHARS_REPLACEMENT = Object.freeze({
		'\t': '\\t',
		'\n': '\\n'
	});
	const NON_SINGLE_WIDTH_CHARS_REGEX = new RegExp(Object.keys(NON_SINGLE_WIDTH_CHARS_REPLACEMENT).join('|'), 'g');
	const SYMBOLS = Object.freeze({
		ancestorHasNextSibling: '|',
		ancestorIsLastChild: ' ',
		hasNextSibling: '├',
		isLastChild: '└',
		selectedChar: '^',
		selectedLine: '>'
	});
	const FORMAT_PREDICATES = [node => node.hasFormat('bold') && 'Bold', node => node.hasFormat('code') && 'Code', node => node.hasFormat('italic') && 'Italic', node => node.hasFormat('strikethrough') && 'Strikethrough', node => node.hasFormat('subscript') && 'Subscript', node => node.hasFormat('superscript') && 'Superscript', node => node.hasFormat('underline') && 'Underline'];
	const DETAIL_PREDICATES = [node => node.isDirectionless() && 'Directionless', node => node.isUnmergeable() && 'Unmergeable'];
	const MODE_PREDICATES = [node => node.isToken() && 'Token', node => node.isSegmented() && 'Segmented'];

	function getSelectedNode(selection) {
		const anchor = selection.anchor;
		const focus = selection.focus;
		const anchorNode = selection.anchor.getNode();
		const focusNode = selection.focus.getNode();
		if (anchorNode === focusNode) {
			return anchorNode;
		}
		const isBackward = selection.isBackward();
		if (isBackward) {
			return ui_lexical_selection.$isAtNodeEnd(focus) ? anchorNode : focusNode;
		}
		return ui_lexical_selection.$isAtNodeEnd(anchor) ? anchorNode : focusNode;
	}

	const nodeNameToTextFormat = {
		b: 'bold',
		strong: 'bold',
		i: 'italic',
		em: 'italic',
		s: 'strikethrough',
		del: 'strikethrough',
		u: 'underline',
		sub: 'subscript',
		sup: 'superscript'
	};
	function convertTextFormatElement(node) {
		const format = nodeNameToTextFormat[node.getName()];
		if (format === undefined) {
			return {
				node: null
			};
		}
		return {
			forChild: lexicalNode => {
				if (ui_lexical_core.$isTextNode(lexicalNode) && !lexicalNode.hasFormat(format)) {
					lexicalNode.toggleFormat(format);
				}
				return lexicalNode;
			},
			node: null
		};
	}

	function $importFromBBCode(bbcode, editor, normalize = true) {
		const scheme = editor.getBBCodeScheme();
		const linkify = editor.getBBCodeImportMap().has('url');
		const parser = new ui_bbcode_parser.BBCodeParser({
			scheme,
			linkify
		});
		const ast = parser.parse(bbcode);
		const elements = ast.getChildren();

		// console.log(ast);

		let lexicalNodes = [];
		for (const element of elements) {
			const nodes = $createNodesFromBBCode(element, editor);
			if (nodes !== null) {
				lexicalNodes = [...lexicalNodes, ...nodes];
			}
		}
		return normalize ? $normalizeTextNodes(lexicalNodes) : lexicalNodes;
	}
	function $createNodesFromBBCode(node, editor, forChildMap = new Map(), parentLexicalNode = null) {
		if (node instanceof ui_bbcode_model.BBCodeNewLineNode) {
			return [ui_lexical_core.$createLineBreakNode()];
		}
		if (node instanceof ui_bbcode_model.BBCodeTabNode) {
			return [ui_lexical_core.$createTabNode()];
		}
		let lexicalNodes = [];
		let currentLexicalNode = null;
		const transformFunction = getConversionFunction(node, editor);
		const transformOutput = transformFunction ? transformFunction(node) : null;
		let postTransform = null;
		if (transformOutput !== null) {
			postTransform = transformOutput.after;
			const transformNodes = transformOutput.node;
			currentLexicalNode = Array.isArray(transformNodes) ? transformNodes[transformNodes.length - 1] : transformNodes;
			if (currentLexicalNode !== null) {
				for (const [, forChildFunction] of forChildMap) {
					currentLexicalNode = forChildFunction(currentLexicalNode, parentLexicalNode);
					if (!currentLexicalNode) {
						break;
					}
				}
				if (currentLexicalNode) {
					lexicalNodes.push(...(Array.isArray(transformNodes) ? transformNodes : [currentLexicalNode]));
				}
			}
			if (main_core.Type.isFunction(transformOutput.forChild)) {
				forChildMap.set(node.getName(), transformOutput.forChild);
			}
		}
		const children = node.getChildren();
		let childLexicalNodes = [];
		for (const child of children) {
			childLexicalNodes.push(...$createNodesFromBBCode(child, editor, new Map(forChildMap), currentLexicalNode));
		}
		if (main_core.Type.isFunction(postTransform)) {
			childLexicalNodes = postTransform(childLexicalNodes);
		}

		// Unknown node
		if (transformOutput === null) {
			if (node.getType() === ui_bbcode_model.BBCodeNode.ELEMENT_NODE) {
				const elementNode = node;
				if (elementNode.isVoid()) {
					childLexicalNodes = [ui_lexical_core.$createTextNode(elementNode.getOpeningTag()), ...childLexicalNodes];
				} else {
					childLexicalNodes = [ui_lexical_core.$createTextNode(elementNode.getOpeningTag()), ...childLexicalNodes, ui_lexical_core.$createTextNode(elementNode.getClosingTag())];
				}
			} else {
				childLexicalNodes = [ui_lexical_core.$createTextNode(node.toString()), ...childLexicalNodes];
			}
		}
		if (currentLexicalNode === null) {
			// If it hasn't been converted to a LexicalNode, we hoist its children
			// up to the same level as it.
			lexicalNodes = [...lexicalNodes, ...childLexicalNodes];
		} else if (ui_lexical_core.$isElementNode(currentLexicalNode)) {
			// If the current node is a ElementNode after conversion,
			// we can append all the children to it.
			currentLexicalNode.append(...childLexicalNodes);
		}
		return lexicalNodes;
	}
	function shouldWrapInParagraph(lexicalNode) {
		if (ui_lexical_core.$isElementNode(lexicalNode) && lexicalNode.isInline() === false) {
			return false;
		}
		return !(ui_lexical_core.$isDecoratorNode(lexicalNode) && lexicalNode.isInline() === false);
	}
	function $normalizeTextNodes(lexicalNodes) {
		const result = [];
		let currentParagraph = null;
		let lineBreaks = 0;
		for (const lexicalNode of lexicalNodes) {
			if (ui_lexical_core.$isLineBreakNode(lexicalNode)) {
				lineBreaks++;
				continue;
			}
			if (shouldWrapInParagraph(lexicalNode)) {
				if (currentParagraph === null || lineBreaks >= 2) {
					result.push(...$createEmptyParagraphs(lineBreaks - 2));
					currentParagraph = ui_lexical_core.$createParagraphNode();
					result.push(currentParagraph);
				} else if (lineBreaks === 1) {
					currentParagraph.append(ui_lexical_core.$createLineBreakNode());
				}
				currentParagraph.append(lexicalNode);
			} else {
				if (lineBreaks > 2) {
					result.push(...$createEmptyParagraphs(lineBreaks - 2));
				}
				result.push(lexicalNode);
				currentParagraph = null;
			}
			lineBreaks = 0;
		}
		if (result.length === 0) {
			return [ui_lexical_core.$createParagraphNode()];
		}
		return result;
	}
	function $createEmptyParagraphs(count = 1) {
		const result = [];
		for (let i = 0; i < count; i++) {
			result.push(ui_lexical_core.$createParagraphNode());
		}
		return result;
	}
	function getConversionFunction(node, editor) {
		const nodeName = node.getName();
		let currentConversion = null;
		const importMap = editor.getBBCodeImportMap();
		const conversions = importMap.get(nodeName.toLowerCase());
		if (conversions !== undefined) {
			for (const conversion of conversions) {
				const bbCodeConversion = conversion(node);
				if (bbCodeConversion !== null && (currentConversion === null || currentConversion.priority < bbCodeConversion.priority)) {
					currentConversion = bbCodeConversion;
				}
			}
		}
		if (currentConversion === null) {
			if (nodeName === '#text') {
				return convertTextNode;
			}
			return null;
		}
		return currentConversion.conversion;
	}
	function convertTextNode(textNode) {
		let textContent = textNode.getContent();
		textContent = textContent.replaceAll(/\r?\n|\t/gm, ' ').replace('\r', '');
		if (textContent === '') {
			return {
				node: null
			};
		}
		return {
			node: ui_lexical_core.$createTextNode(textContent)
		};
	}

	function $isParagraphEmpty(node) {
		if (!ui_lexical_core.$isParagraphNode(node)) {
			return false;
		}
		if (node.isEmpty()) {
			return true;
		}
		return node.getChildren().every(child => {
			return ui_lexical_core.$isLineBreakNode(child) || ui_lexical_core.$isTextNode(child) && /^\s*$/.test(child.getTextContent());
		});
	}

	function trimEmptyParagraphs(nodes) {
		const trimmedNodes = [...nodes];

		// trim from the start
		while (trimmedNodes.length > 0 && $isParagraphEmpty(trimmedNodes[0])) {
			trimmedNodes.splice(0, 1);
		}

		// trim from the end
		while (trimmedNodes.length > 0 && $isParagraphEmpty(trimmedNodes[trimmedNodes.length - 1])) {
			trimmedNodes.splice(-1, 1);
		}
		return trimmedNodes;
	}

	/* eslint-disable @bitrix24/bitrix24-rules/no-native-dom-methods */

	function $exportToBBCode(lexicalNode, editor) {
		const scheme = editor.getBBCodeScheme();
		const root = scheme.createRoot();
		const topLevelChildren = trimEmptyParagraphs(lexicalNode.getChildren());
		for (const topLevelNode of topLevelChildren) {
			$appendNodesToBBCode(topLevelNode, root, editor);
			// root.appendChild(scheme.createNewLine());
		}
		return root;
	}
	function $appendNodesToBBCode(currentNode, parentNode, editor) {
		const {
			node,
			after
		} = getExportFunction(currentNode, editor);
		if (!node) {
			return;
		}
		const scheme = editor.getBBCodeScheme();
		const fragment = scheme.createFragment();
		const children = ui_lexical_core.$isElementNode(currentNode) ? currentNode.getChildren() : [];
		for (const childNode of children) {
			$appendNodesToBBCode(childNode, fragment, editor);
		}
		node.appendChild(fragment);
		parentNode.appendChild(node);
		if (main_core.Type.isFunction(after)) {
			const newElement = after.call(currentNode, node);
			if (newElement) {
				node.getParent().replaceChild(node, newElement);
			}
		}
	}
	const formats = ['bold', 'italic', 'strikethrough', 'underline'];
	function getExportFunction(lexicalNode, editor) {
		const type = lexicalNode.getType();
		const exportMap = editor.getBBCodeExportMap();
		const exportFn = exportMap.get(type);
		if (main_core.Type.isFunction(exportFn)) {
			return exportFn(lexicalNode);
		}
		const scheme = editor.getBBCodeScheme();
		if (ui_lexical_core.$isTextNode(lexicalNode) && lexicalNode.getType() === 'text') {
			const node = scheme.createText({
				encode: false,
				content: lexicalNode.getTextContent()
			});
			if (lexicalNode.getFormat() === 0) {
				return {
					node
				};
			}
			let currentNode = node;
			formats.forEach(format => {
				const formatFn = exportMap.get(`text:${format}`);
				if (main_core.Type.isFunction(formatFn)) {
					currentNode = formatFn(lexicalNode, currentNode) || currentNode;
				}
			});
			return {
				node: currentNode
			};
		}
		if (ui_lexical_core.$isLineBreakNode(lexicalNode)) {
			return {
				node: scheme.createNewLine()
			};
		}
		if (ui_lexical_core.$isTabNode(lexicalNode)) {
			return {
				node: scheme.createTab()
			};
		}
		if (ui_lexical_core.$isTextNode(lexicalNode) || ui_lexical_core.$isElementNode(lexicalNode)) {
			const node = scheme.createText({
				encode: false,
				content: lexicalNode.getTextContent()
			});
			return {
				node
			};
		}
		return {
			node: null
		};
	}

	/* eslint-disable @bitrix24/bitrix24-rules/no-native-dom-methods */
	function wrapNodeWith(node, tag, editor) {
		const scheme = editor.getBBCodeScheme();
		const elementNode = scheme.createElement({
			name: tag
		});
		elementNode.appendChild(node);
		return elementNode;
	}

	/**
	 * @memberof BX.UI.TextEditor
	 */
	class BasePlugin {
		#textEditor = null;
		#destroyed = false;
		#removeListeners = () => {};
		constructor(textEditor) {
			this.#textEditor = textEditor;
		}
		static getName() {
			throw new Error('getName must be implemented in a child class');
		}
		static getNodes(editor) {
			return [];
		}
		importBBCode() {
			return null;
		}
		exportBBCode() {
			return null;
		}
		validateScheme() {
			return null;
		}
		afterInit() {
			// you can override this method
		}
		getName() {
			return this.constructor.getName();
		}
		getEditor() {
			return this.#textEditor;
		}
		getLexicalEditor() {
			return this.#textEditor.getLexicalEditor();
		}
		cleanUpRegister(...func) {
			this.#removeListeners = ui_lexical_utils.mergeRegister(this.#removeListeners, ...func);
		}
		isDestroyed() {
			return this.#destroyed;
		}
		destroy() {
			this.#destroyed = true;
			this.#removeListeners();
			this.#removeListeners = null;
		}
	}

	class ToolbarItem extends main_core_events.EventEmitter {
		constructor() {
			super();
			this.setEventNamespace('BX.UI.TextEditor.ToolbarItem');
		}
		getContainer() {
			throw new Error('You must implement getContainer() method.');
		}
		render() {
			throw new Error('You must implement render() method.');
		}
	}

	/**
	 * @memberof BX.UI.TextEditor
	 */
	class Button extends ToolbarItem {
		#format = null;
		#blockType = null;
		#active = false;
		#disabled = false;
		#disableInsideUnformatted = false;
		#disableCallback = null;
		#container = null;
		setContent(content) {
			if (main_core.Type.isString(content)) {
				this.getContainer().innerHTML = content;
			} else if (main_core.Type.isElementNode(content)) {
				this.getContainer().append(content);
			}
		}
		setIcon(icon) {
			this.setContent(`<span class="ui-icon-set --${main_core.Text.encode(icon)}"></span>`);
		}
		setFormat(format) {
			this.#format = format;
		}
		getFormat() {
			return this.#format;
		}
		hasFormat() {
			return this.#format;
		}
		setBlockType(type) {
			this.#blockType = type;
		}
		getBlockType() {
			return this.#blockType;
		}
		setTooltip(tooltip) {
			if (main_core.Type.isStringFilled(tooltip)) {
				main_core.Dom.attr(this.getContainer(), 'title', main_core.Text.encode(tooltip));
			} else if (tooltip === null) {
				main_core.Dom.attr(this.getContainer(), 'title', null);
			}
		}
		disableInsideUnformatted() {
			this.#disableInsideUnformatted = true;
		}
		enableInsideUnformatted() {
			this.#disableInsideUnformatted = false;
		}
		shouldDisableInsideUnformatted() {
			return this.#disableInsideUnformatted;
		}
		setActive(active = true) {
			if (active === this.#active) {
				return;
			}
			this.#active = active;
			if (active) {
				main_core.Dom.addClass(this.getContainer(), '--active');
			} else {
				main_core.Dom.removeClass(this.getContainer(), '--active');
			}
		}
		isActive() {
			return this.#active;
		}
		setDisabled(disabled = true) {
			if (disabled === this.#disabled) {
				return;
			}
			this.#disabled = disabled;
			if (disabled) {
				main_core.Dom.attr(this.getContainer(), {
					disabled: true
				});
			} else {
				main_core.Dom.attr(this.getContainer(), {
					disabled: null
				});
			}
		}
		disable() {
			this.setDisabled(true);
		}
		enable() {
			this.setDisabled(false);
		}
		isDisabled() {
			return this.#disabled;
		}
		hasOwnDisableCallback() {
			return this.#disableCallback !== null;
		}
		setDisableCallback(fn) {
			if (main_core.Type.isFunction(fn)) {
				this.#disableCallback = fn;
			}
		}
		invokeDisableCallback() {
			return this.#disableCallback();
		}
		getContainer() {
			if (this.#container === null) {
				this.#container = main_core.Tag.render`
				<button 
					type="button" 
					class="ui-text-editor-toolbar-button"
					onclick="${this.#handleClick.bind(this)}"
				>
				</button>
			`;
			}
			return this.#container;
		}
		render() {
			return this.getContainer();
		}
		#handleClick() {
			this.emit('onClick');
		}
	}

	function wrapTextInParagraph(text) {
		let result = '';
		const parts = text.split(/((?:\r?\n){2})/);
		for (const part of parts) {
			if (part === '\n\n' || part === '\r\n\r\n') {
				continue;
			}
			result += `<p>${part.replaceAll(/(\r?\n)/g, '<br>')}</p>`;
		}
		return result;
	}

	/* eslint-disable no-underscore-dangle */

	class QuoteNode extends ui_lexical_core.ElementNode {
		static getType() {
			return 'quote';
		}
		static clone(node) {
			return new QuoteNode(node.__key);
		}
		createDOM(config, editor) {
			const element = document.createElement('blockquote');
			element.setAttribute('spellcheck', 'false');
			if (main_core.Type.isStringFilled(config?.theme?.quote)) {
				main_core.Dom.addClass(element, config.theme.quote);
			}
			return element;
		}
		updateDOM(prevNode, anchor, config) {
			return false;
		}
		static importDOM() {
			return {
				blockquote: node => ({
					conversion: element => {
						return {
							node: $createQuoteNode()
						};
					},
					priority: 0
				})
			};
		}
		static importJSON(serializedNode) {
			const node = $createQuoteNode();
			node.setFormat(serializedNode.format);
			node.setIndent(serializedNode.indent);
			node.setDirection(serializedNode.direction);
			return node;
		}
		exportJSON() {
			return {
				...super.exportJSON(),
				type: 'quote'
			};
		}
		canIndent() {
			return false;
		}
		isInline() {
			return false;
		}
		canReplaceWith(replacement) {
			return false;
		}
		collapseAtStart(selection) {
			// const paragraph = $createParagraphNode();
			// const children = this.getChildren();
			// children.forEach((child) => paragraph.append(child));
			// this.replace(paragraph);
			$removeQuote(this);
			return true;
		}
		canBeEmpty() {
			return false;
		}
		isShadowRoot() {
			return true;
		}

		// insertNewAfter(selection: RangeSelection, restoreSelection = true): null | ParagraphNode
		// {
		// 	const children = this.getChildren();
		// 	const childrenLength = children.length;
		//
		// 	if (
		// 		childrenLength >= 2
		// 		&& children[childrenLength - 1].getTextContent() === '\n'
		// 		&& children[childrenLength - 2].getTextContent() === '\n'
		// 		&& selection.isCollapsed()
		// 		&& selection.anchor.key === this.__key
		// 		&& selection.anchor.offset === childrenLength
		// 	)
		// 	{
		// 		children[childrenLength - 1].remove();
		// 		children[childrenLength - 2].remove();
		// 		const newElement = $createParagraphNode();
		// 		this.insertAfter(newElement, restoreSelection);
		//
		// 		return newElement;
		// 	}
		//
		// 	selection.insertLineBreak();
		//
		// 	return null;
		// }
	}
	function $createQuoteNode() {
		return ui_lexical_core.$applyNodeReplacement(new QuoteNode());
	}
	function $isQuoteNode(node) {
		return node instanceof QuoteNode;
	}
	function $removeQuote(quoteNode) {
		if (!$isQuoteNode(quoteNode)) {
			return false;
		}
		let lastElement = quoteNode;
		for (const child of quoteNode.getChildren()) {
			if (ui_lexical_core.$isElementNode(child) || ui_lexical_core.$isDecoratorNode(child)) {
				lastElement = lastElement.insertAfter(child);
			} else {
				lastElement = lastElement.insertAfter(ui_lexical_core.$createParagraphNode().append(child));
			}
		}
		quoteNode.remove();
		return true;
	}

	function $getAncestor(node, predicate) {
		let parent = node;
		while (parent !== null && parent.getParent() !== null && !predicate(parent)) {
			parent = parent.getParentOrThrow();
		}
		return predicate(parent) ? parent : null;
	}

	function $isBlockNode(node) {
		return (ui_lexical_core.$isElementNode(node) || ui_lexical_core.$isDecoratorNode(node)) && !node.isInline() && !node.isParentRequired();
	}

	function $wrapNodes(selection, createElement) {
		if (selection === null) {
			return null;
		}
		const anchor = selection.anchor;
		const anchorNode = anchor.getNode();
		const element = createElement();
		if (ui_lexical_core.$isRootOrShadowRoot(anchorNode)) {
			const firstChild = anchorNode.getFirstChild();
			if (firstChild) {
				firstChild.replace(element, true);
			} else {
				anchorNode.append(element);
			}
			return element;
		}
		const handled = new Set();
		const nodes = selection.getNodes();
		const firstSelectedBlock = $getAncestor(selection.anchor.getNode(), $isBlockNode);
		if (firstSelectedBlock && !nodes.includes(firstSelectedBlock)) {
			nodes.unshift(firstSelectedBlock);
		}
		handled.add(element.getKey());
		let firstNode = true;
		for (const node of nodes) {
			if (!$isBlockNode(node) || handled.has(node.getKey())) {
				continue;
			}
			const isParentHandled = $getAncestor(node.getParent(), parentNode => handled.has(parentNode.getKey()));
			if (isParentHandled) {
				continue;
			}
			if (firstNode) {
				firstNode = false;
				node.replace(element);
				element.append(node);
			} else {
				element.append(node);
			}
			handled.add(node.getKey());
		}
		return element;
	}

	/** @memberof BX.UI.TextEditor.Plugins.Quote */
	const INSERT_QUOTE_COMMAND = ui_lexical_core.createCommand('INSERT_QUOTE_COMMAND');

	/** @memberof BX.UI.TextEditor.Plugins.Quote */
	const FORMAT_QUOTE_COMMAND = ui_lexical_core.createCommand('FORMAT_QUOTE_COMMAND');

	/** @memberof BX.UI.TextEditor.Plugins.Quote */
	const REMOVE_QUOTE_COMMAND = ui_lexical_core.createCommand('REMOVE_QUOTE_COMMAND');

	/** @memberof BX.UI.TextEditor.Plugins.Quote */
	const TOGGLE_QUOTE_COMMAND = ui_lexical_core.createCommand('TOGGLE_QUOTE_COMMAND');
	class QuotePlugin extends BasePlugin {
		constructor(editor) {
			super(editor);
			this.#registerCommands();
			this.#registerComponents();
		}
		static getName() {
			return 'Quote';
		}
		static getNodes(editor) {
			return [QuoteNode];
		}
		importBBCode() {
			return {
				quote: () => ({
					conversion: node => {
						return {
							node: $createQuoteNode(),
							after: childLexicalNodes => {
								return $normalizeTextNodes(childLexicalNodes);
							}
						};
					},
					priority: 0
				})
			};
		}
		exportBBCode() {
			return {
				quote: lexicalNode => {
					const scheme = this.getEditor().getBBCodeScheme();
					return {
						node: scheme.createElement({
							name: 'quote'
						})
					};
				}
			};
		}
		validateScheme() {
			return {
				nodes: [{
					nodeClass: QuoteNode,
					validate: quoteNode => {
						let prevParagraph = null;
						quoteNode.getChildren().forEach(child => {
							if (shouldWrapInParagraph(child)) {
								if (prevParagraph === null) {
									const paragraph = ui_lexical_core.$createParagraphNode();
									child.replace(paragraph);
									paragraph.append(child);
									prevParagraph = paragraph;
								} else {
									prevParagraph.append(child);
								}
							} else {
								prevParagraph = null;
							}
						});
						return false;
					}
				}],
				bbcodeMap: {
					quote: 'quote'
				}
			};
		}
		#registerCommands() {
			this.cleanUpRegister(this.getEditor().registerCommand(INSERT_QUOTE_COMMAND, payload => {
				const quoteNode = $createQuoteNode();
				if (main_core.Type.isPlainObject(payload) && main_core.Type.isStringFilled(payload.content)) {
					const nodes = $importFromBBCode(payload.content, this.getEditor(), false);
					quoteNode.append(...$normalizeTextNodes(nodes));
					ui_lexical_utils.$insertNodeToNearestRoot(quoteNode);
				} else {
					quoteNode.append(ui_lexical_core.$createParagraphNode());
					ui_lexical_utils.$insertNodeToNearestRoot(quoteNode);
				}
				quoteNode.selectStart();
				return true;
			}, ui_lexical_core.COMMAND_PRIORITY_LOW), this.getEditor().registerCommand(FORMAT_QUOTE_COMMAND, () => {
				const selection = ui_lexical_core.$getSelection() || ui_lexical_core.$getPreviousSelection();
				if (ui_lexical_core.$isRangeSelection(selection)) {
					const quoteNode = $createQuoteNode();
					$wrapNodes(selection, () => quoteNode);
					if (quoteNode.isEmpty()) {
						quoteNode.append(ui_lexical_core.$createParagraphNode());
					}
					quoteNode.selectStart();
				}
				return true;
			}, ui_lexical_core.COMMAND_PRIORITY_LOW), this.getEditor().registerCommand(REMOVE_QUOTE_COMMAND, () => {
				const selection = ui_lexical_core.$getSelection() || ui_lexical_core.$getPreviousSelection();
				if (!ui_lexical_core.$isRangeSelection(selection)) {
					return false;
				}
				let quoteNode = ui_lexical_utils.$findMatchingParent(selection.anchor.getNode(), $isQuoteNode);
				if (!quoteNode) {
					quoteNode = ui_lexical_utils.$findMatchingParent(selection.focus.getNode(), $isQuoteNode);
				}
				$removeQuote(quoteNode);
				return true;
			}, ui_lexical_core.COMMAND_PRIORITY_LOW), this.getEditor().registerCommand(TOGGLE_QUOTE_COMMAND, () => {
				const selection = ui_lexical_core.$getSelection() || ui_lexical_core.$getPreviousSelection();
				if (!ui_lexical_core.$isRangeSelection(selection)) {
					return false;
				}
				let quoteNode = ui_lexical_utils.$findMatchingParent(selection.anchor.getNode(), $isQuoteNode);
				if (!quoteNode) {
					quoteNode = ui_lexical_utils.$findMatchingParent(selection.focus.getNode(), $isQuoteNode);
				}
				if (quoteNode) {
					this.getEditor().dispatchCommand(REMOVE_QUOTE_COMMAND);
				} else if (this.getEditor().getNewLineMode() === NewLineMode.LINE_BREAK) {
					this.getEditor().dispatchCommand(INSERT_QUOTE_COMMAND);
				} else {
					this.getEditor().dispatchCommand(FORMAT_QUOTE_COMMAND);
				}
				return true;
			}, ui_lexical_core.COMMAND_PRIORITY_LOW));
		}
		#registerComponents() {
			this.getEditor().getComponentRegistry().register('quote', () => {
				const button = new Button();
				button.setIcon(ui_iconSet_api_core.Outline.QUOTE);
				button.setBlockType('quote');
				button.setTooltip(main_core.Loc.getMessage('TEXT_EDITOR_BTN_QUOTE'));
				button.subscribe('onClick', () => {
					this.getEditor().focus();
					this.getEditor().update(() => {
						if (button.isActive()) {
							this.getEditor().dispatchCommand(REMOVE_QUOTE_COMMAND);
						} else if (this.getEditor().getNewLineMode() === NewLineMode.LINE_BREAK) {
							this.getEditor().dispatchCommand(INSERT_QUOTE_COMMAND);
						} else {
							this.getEditor().dispatchCommand(FORMAT_QUOTE_COMMAND);
						}
					});
				});
				return button;
			});
		}
	}

	var Quote = /*#__PURE__*/Object.freeze({
		__proto__: null,
		$createQuoteNode: $createQuoteNode,
		$isQuoteNode: $isQuoteNode,
		$removeQuote: $removeQuote,
		FORMAT_QUOTE_COMMAND: FORMAT_QUOTE_COMMAND,
		INSERT_QUOTE_COMMAND: INSERT_QUOTE_COMMAND,
		QuoteNode: QuoteNode,
		QuotePlugin: QuotePlugin,
		REMOVE_QUOTE_COMMAND: REMOVE_QUOTE_COMMAND,
		TOGGLE_QUOTE_COMMAND: TOGGLE_QUOTE_COMMAND
	});

	/*
	eslint-disable no-underscore-dangle,
	@bitrix24/bitrix24-rules/no-pseudo-private,
	@bitrix24/bitrix24-rules/no-native-dom-methods
	*/

	function convertSpoilerContentElement(domNode) {
		const node = $createSpoilerContentNode();
		return {
			node
		};
	}
	class SpoilerContentNode extends ui_lexical_core.ElementNode {
		static getType() {
			return 'spoiler-content';
		}
		static clone(node) {
			return new SpoilerContentNode(node.__key);
		}
		createDOM(config, editor) {
			const dom = document.createElement('div');
			if (main_core.Type.isStringFilled(config?.theme?.spoiler?.content)) {
				main_core.Dom.addClass(dom, config.theme.spoiler.content);
			}
			return dom;
		}
		updateDOM(prevNode, dom, config) {
			return false;
		}
		static importDOM() {
			return {
				div: domNode => {
					if (!domNode.hasAttribute('data-spoiler-content')) {
						return null;
					}
					return {
						conversion: convertSpoilerContentElement,
						priority: 2
					};
				}
			};
		}
		static importJSON(serializedNode) {
			return $createSpoilerContentNode();
		}
		exportDOM() {
			const element = document.createElement('div');
			element.setAttribute('data-spoiler-content', 'true');
			return {
				element
			};
		}
		exportJSON() {
			return {
				...super.exportJSON(),
				type: 'spoiler-content',
				version: 1
			};
		}
		isShadowRoot() {
			return true;
		}
		isParentRequired() {
			return true;
		}
		createParentElementNode() {
			return $createSpoilerNode();
		}
		canIndent() {
			return false;
		}
		canInsertAfter(node) {
			return false;
		}
		canReplaceWith(replacement) {
			return false;
		}
		insertBefore(node) {
			const firstChild = this.getFirstChild();
			const nodeToInsert = ui_lexical_core.$isElementNode(node) || ui_lexical_core.$isDecoratorNode(node) ? node : ui_lexical_core.$createParagraphNode().append(node);
			if (firstChild === null) {
				this.append(nodeToInsert);
			} else if (firstChild !== nodeToInsert) {
				firstChild.insertBefore(nodeToInsert);
			}
			return nodeToInsert;
		}
		insertAfter(node) {
			const nodeToInsert = ui_lexical_core.$isElementNode(node) || ui_lexical_core.$isDecoratorNode(node) ? node : ui_lexical_core.$createParagraphNode().append(node);
			this.append(nodeToInsert);
			return nodeToInsert;
		}
	}
	function $createSpoilerContentNode() {
		return new SpoilerContentNode();
	}
	function $isSpoilerContentNode(node) {
		return node instanceof SpoilerContentNode;
	}

	/* eslint-disable no-underscore-dangle */

	class SpoilerTitleTextNode extends ui_lexical_core.TextNode {
		static getType() {
			return 'spoiler-title-text';
		}
		static clone(node) {
			return new SpoilerTitleTextNode(node.__text, node.__key);
		}
		createDOM(config) {
			return super.createDOM(config);
		}
		static importJSON(serializedNode) {
			return $createSpoilerTitleTextNode(serializedNode.text);
		}
		exportJSON() {
			return {
				...super.exportJSON(),
				type: 'spoiler-title-text'
			};
		}
	}
	function $createSpoilerTitleTextNode(text = '') {
		return ui_lexical_core.$applyNodeReplacement(new SpoilerTitleTextNode(text));
	}
	function $isSpoilerTitleTextNode(node) {
		return node instanceof SpoilerTitleTextNode;
	}

	/* eslint-disable @bitrix24/bitrix24-rules/no-native-dom-methods */

	/** @memberof BX.UI.TextEditor.Plugins.Spoiler */
	const INSERT_SPOILER_COMMAND = ui_lexical_core.createCommand('INSERT_SPOILER_COMMAND');

	/** @memberof BX.UI.TextEditor.Plugins.Spoiler */
	const REMOVE_SPOILER_COMMAND = ui_lexical_core.createCommand('REMOVE_SPOILER_COMMAND');

	/** @memberof BX.UI.TextEditor.Plugins.Spoiler */
	const TOGGLE_SPOILER_COMMAND = ui_lexical_core.createCommand('TOGGLE_SPOILER_COMMAND');
	class SpoilerPlugin extends BasePlugin {
		constructor(editor) {
			super(editor);
			this.#registerNodeTransforms();
			this.#registerCommands();
			this.#registerComponents();
		}
		static getName() {
			return 'Spoiler';
		}
		static getNodes(editor) {
			return [SpoilerNode, SpoilerTitleNode, SpoilerContentNode, SpoilerTitleTextNode];
		}
		importBBCode() {
			return {
				spoiler: () => ({
					conversion: node => {
						const title = main_core.Type.isStringFilled(node.getValue()) ? trimSpoilerTitle(node.getValue()) : main_core.Loc.getMessage('TEXT_EDITOR_SPOILER_TITLE');
						return {
							node: $createSpoilerNode(false),
							after: childLexicalNodes => {
								return [$createSpoilerTitleNode().append($createSpoilerTitleTextNode(title)), $createSpoilerContentNode().append(...$normalizeTextNodes(childLexicalNodes))];
							}
						};
					},
					priority: 0
				})
			};
		}
		exportBBCode() {
			return {
				spoiler: spoilerNode => {
					const scheme = this.getEditor().getBBCodeScheme();
					const titleNode = spoilerNode.getChildren()[0];
					const title = trimSpoilerTitle(titleNode.getTextContent());
					const value = title === main_core.Loc.getMessage('TEXT_EDITOR_SPOILER_TITLE') ? '' : title;
					return {
						node: scheme.createElement({
							name: 'spoiler',
							value
						})
					};
				},
				'spoiler-title': node => {
					return {
						node: null
					};
				},
				'spoiler-content': node => {
					const scheme = this.getEditor().getBBCodeScheme();
					return {
						node: scheme.createFragment()
					};
				}
			};
		}
		validateScheme() {
			return {
				nodes: [{
					nodeClass: SpoilerNode
				}, {
					nodeClass: SpoilerContentNode,
					validate: contentNode => {
						contentNode.getChildren().forEach(child => {
							if (shouldWrapInParagraph(child)) {
								const paragraph = ui_lexical_core.$createParagraphNode();
								child.replace(paragraph);
								paragraph.append(child);
							}
						});
						return false;
					}
				}],
				bbcodeMap: {
					spoiler: 'spoiler',
					'spoiler-content': 'spoiler',
					'spoiler-title': 'spoiler'
				}
			};
		}
		#registerComponents() {
			this.getEditor().getComponentRegistry().register('spoiler', () => {
				const button = new Button();
				button.setIcon(ui_iconSet_api_core.Outline.SPOILER);
				button.setBlockType('spoiler');
				button.setTooltip(main_core.Loc.getMessage('TEXT_EDITOR_BTN_SPOILER'));
				button.subscribe('onClick', () => {
					this.getEditor().focus();
					this.getEditor().update(() => {
						if (button.isActive()) {
							this.getEditor().dispatchCommand(REMOVE_SPOILER_COMMAND);
						} else {
							this.getEditor().dispatchCommand(INSERT_SPOILER_COMMAND);
						}
					});
				});
				return button;
			});
		}
		#registerCommands() {
			this.cleanUpRegister(
			// This handles the case when container is collapsed and we delete its previous sibling
			// into it, it would cause collapsed content deleted (since it's display: none, and selection
			// swallows it when deletes single char). Instead we expand container, which is although
			// not perfect, but avoids bigger problem
			this.getEditor().registerCommand(ui_lexical_core.DELETE_CHARACTER_COMMAND, this.#handleDeleteCharacter.bind(this), ui_lexical_core.COMMAND_PRIORITY_LOW), this.getEditor().registerCommand(ui_lexical_core.KEY_ENTER_COMMAND, this.#handleEnter.bind(this), ui_lexical_core.COMMAND_PRIORITY_NORMAL), this.getEditor().registerCommand(ui_lexical_core.INSERT_PARAGRAPH_COMMAND, event => {
				const selection = ui_lexical_core.$getSelection();
				if (ui_lexical_core.$isRangeSelection(selection)) {
					const spoilerTitleNode = ui_lexical_utils.$findMatchingParent(selection.anchor.getNode(), node => $isSpoilerTitleNode(node));
					if (spoilerTitleNode) {
						const newBlock = spoilerTitleNode.insertNewAfter(selection);
						if (newBlock) {
							newBlock.selectStart();
						}
						return true;
					}
				}
				return false;
			}, ui_lexical_core.COMMAND_PRIORITY_LOW), this.getEditor().registerCommand(ui_lexical_core.PASTE_COMMAND, this.#handlePaste.bind(this), ui_lexical_core.COMMAND_PRIORITY_NORMAL), this.getEditor().registerCommand(INSERT_SPOILER_COMMAND, payload => {
				this.getEditor().update(() => {
					const title = main_core.Type.isPlainObject(payload) && main_core.Type.isStringFilled(payload.title) ? payload.title : undefined;
					let selection = ui_lexical_core.$getSelection() || ui_lexical_core.$getPreviousSelection();
					if (selection === null) {
						selection = ui_lexical_core.$getRoot().selectEnd();
					}
					const spoiler = insertSpoiler(selection, title);
					if (spoiler !== null) {
						spoiler.getContentNode()?.getChildren()[0]?.select();
					}
				});
				return true;
			}, ui_lexical_core.COMMAND_PRIORITY_LOW), this.getEditor().registerCommand(REMOVE_SPOILER_COMMAND, () => {
				this.getEditor().update(() => {
					const selection = ui_lexical_core.$getSelection();
					if (!ui_lexical_core.$isRangeSelection(selection)) {
						return;
					}
					let spoilerNode = ui_lexical_utils.$findMatchingParent(selection.anchor.getNode(), $isSpoilerNode);
					if (!spoilerNode) {
						spoilerNode = ui_lexical_utils.$findMatchingParent(selection.focus.getNode(), $isSpoilerNode);
					}
					$removeSpoiler(spoilerNode);
				});
				return true;
			}, ui_lexical_core.COMMAND_PRIORITY_LOW), this.getEditor().registerCommand(TOGGLE_SPOILER_COMMAND, () => {
				const selection = ui_lexical_core.$getSelection() || ui_lexical_core.$getPreviousSelection();
				if (!ui_lexical_core.$isRangeSelection(selection)) {
					return false;
				}
				let spoilerNode = ui_lexical_utils.$findMatchingParent(selection.anchor.getNode(), $isSpoilerNode);
				if (!spoilerNode) {
					spoilerNode = ui_lexical_utils.$findMatchingParent(selection.focus.getNode(), $isSpoilerNode);
				}
				if (spoilerNode) {
					this.getEditor().dispatchCommand(REMOVE_SPOILER_COMMAND);
				} else {
					this.getEditor().dispatchCommand(INSERT_SPOILER_COMMAND);
				}
				return true;
			}, ui_lexical_core.COMMAND_PRIORITY_LOW));
		}
		#registerNodeTransforms() {
			this.cleanUpRegister(
			// Structure enforcing transformers for each node type. In case nesting structure is not
			// "Container > Title + Content" it'll unwrap nodes and convert it back
			// to regular content.
			this.getEditor().registerNodeTransform(SpoilerNode, node => {
				const children = node.getChildren();
				if (children.length !== 2 || !$isSpoilerTitleNode(children[0]) || !$isSpoilerContentNode(children[1])) {
					for (const child of children) {
						if (ui_lexical_core.$isElementNode(child) || ui_lexical_core.$isDecoratorNode(child)) {
							node.insertBefore(child);
						} else {
							node.insertBefore(ui_lexical_core.$createParagraphNode().append(child));
						}
					}
					node.remove();
				}
			}), this.getEditor().registerNodeTransform(SpoilerTitleNode, node => {
				const parent = node.getParent();
				if (!$isSpoilerNode(parent)) {
					node.replace(ui_lexical_core.$createParagraphNode().append(...node.getChildren()));
				} else if (node.getChildrenSize() === 1 && !$isSpoilerTitleTextNode(node.getFirstChild()) || node.getChildrenSize() > 1) {
					ui_lexical_core.$setSelection(null);
					const textContent = trimSpoilerTitle(node.getTextContent());
					node.clear();
					node.append($createSpoilerTitleTextNode(textContent));
					node.select();
				}
			}), this.getEditor().registerNodeTransform(SpoilerTitleTextNode, node => {
				const parent = node.getParent();
				if (!$isSpoilerTitleNode(parent)) {
					node.replace(ui_lexical_core.$createParagraphNode().append(ui_lexical_core.$createTextNode(node.getTextContent())));
				}
			}), this.getEditor().registerNodeTransform(SpoilerContentNode, node => {
				const parent = node.getParent();
				if (!$isSpoilerNode(parent)) {
					const children = node.getChildren();
					for (const child of children) {
						if (ui_lexical_core.$isElementNode(child) || ui_lexical_core.$isDecoratorNode(child)) {
							node.insertBefore(child);
						} else {
							node.insertBefore(ui_lexical_core.$createParagraphNode().append(child));
						}
					}
					node.remove();
				}
			}));
		}
		#handleDeleteCharacter() {
			const selection = ui_lexical_core.$getSelection();
			if (!ui_lexical_core.$isRangeSelection(selection) || !selection.isCollapsed() || selection.anchor.offset !== 0) {
				return false;
			}
			const anchorNode = selection.anchor.getNode();
			const topLevelElement = anchorNode.getTopLevelElement();
			if (topLevelElement === null) {
				return false;
			}
			const container = topLevelElement.getPreviousSibling();
			if (!$isSpoilerNode(container) || container.getOpen()) {
				return false;
			}
			container.setOpen(true);
			return true;
		}
		#handleEnter(event) {
			if (event && (event.ctrlKey || event.metaKey)) {
				// Handling CMD+Enter to toggle spoiler element collapsed state
				const selection = ui_lexical_core.$getPreviousSelection();
				if (ui_lexical_core.$isRangeSelection(selection) && selection.isCollapsed()) {
					const parent = ui_lexical_utils.$findMatchingParent(selection.anchor.getNode(), node => ui_lexical_core.$isElementNode(node) && !node.isInline());
					if ($isSpoilerTitleNode(parent)) {
						const container = parent.getParent();
						if ($isSpoilerNode(container)) {
							container.toggleOpen();
							ui_lexical_core.$setSelection(selection.clone());
							return true;
						}
					}
				}
			}
			return false;
		}
		#handlePaste(event) {
			const selection = ui_lexical_core.$getSelection();
			if (!ui_lexical_core.$isRangeSelection(selection) || !(event instanceof ClipboardEvent) || event.clipboardData === null) {
				return false;
			}
			const spoilerTitleNode = ui_lexical_utils.$findMatchingParent(selection.anchor.getNode(), node => $isSpoilerTitleNode(node));
			if (spoilerTitleNode) {
				event.preventDefault();
				this.getEditor().update(() => {
					ui_lexical_clipboard.$insertDataTransferForPlainText(event.clipboardData, selection);
				}, {
					tag: 'paste'
				});
				return true;
			}
			return false;
		}
	}
	function insertSpoiler(selection, title) {
		if (!ui_lexical_core.$isRangeSelection(selection)) {
			return null;
		}
		const anchor = selection.anchor;
		const anchorNode = anchor.getNode();
		const spoiler = $createSpoiler(true, title);
		if (ui_lexical_core.$isRootOrShadowRoot(anchorNode)) {
			const firstChild = anchorNode.getFirstChild();
			if (firstChild) {
				firstChild.replace(spoiler, true);
			} else {
				anchorNode.append(spoiler);
			}
			return spoiler;
		}
		const handled = new Set();
		const nodes = selection.getNodes();
		const firstSelectedBlock = $getAncestor(selection.anchor.getNode(), $isBlockNode);
		if (firstSelectedBlock && !nodes.includes(firstSelectedBlock)) {
			nodes.unshift(firstSelectedBlock);
		}
		handled.add(spoiler.getKey());
		handled.add(spoiler.getTitleNode().getKey());
		handled.add(spoiler.getContentNode().getKey());
		let firstNode = true;
		for (const node of nodes) {
			if (!$isBlockNode(node) || handled.has(node.getKey())) {
				continue;
			}
			const isParentHandled = $getAncestor(node.getParent(), parentNode => handled.has(parentNode.getKey()));
			if (isParentHandled) {
				continue;
			}
			if (firstNode) {
				firstNode = false;
				node.replace(spoiler);
				spoiler.getContentNode().append(node);
			} else {
				spoiler.getContentNode().append(node);
			}

			// let parent: ElementNode = node.getParent();
			// while (parent !== null)
			// {
			// 	const parentKey = parent.getKey();
			// 	const nextParent: ElementNode = parent.getParent();
			// 	if ($isRootOrShadowRoot(nextParent) && !handled.has(parentKey))
			// 	{
			// 		handled.add(parentKey);
			// 		createSpoilerOrMerge(parent);
			//
			// 		break;
			// 	}
			//
			// 	parent = nextParent;
			// }

			handled.add(node.getKey());
		}
		return spoiler;
	}
	function trimSpoilerTitle(title) {
		return title.trim().replaceAll(/\r?\n|\t/gm, '').replace('\r', '').replaceAll(/\s+/g, ' ');
	}

	/*
	eslint-disable no-underscore-dangle,
	@bitrix24/bitrix24-rules/no-pseudo-private,
	@bitrix24/bitrix24-rules/no-native-dom-methods
	*/

	function convertSummaryElement(domNode) {
		const node = $createSpoilerTitleNode();
		return {
			node
		};
	}
	class SpoilerTitleNode extends ui_lexical_core.ElementNode {
		__language = 'hack';
		__flags = UNFORMATTED;
		static getType() {
			return 'spoiler-title';
		}
		static clone(node) {
			return new SpoilerTitleNode(node.__key);
		}
		createDOM(config, editor) {
			const dom = document.createElement('summary');
			dom.tabIndex = -1;
			if (main_core.Type.isStringFilled(config?.theme?.spoiler?.title)) {
				main_core.Dom.addClass(dom, config.theme.spoiler.title);
			}
			main_core.Dom.addClass(dom, 'ui-icon-set__scope');
			return dom;
		}
		updateDOM(prevNode, dom, config) {
			return false;
		}
		static importDOM() {
			return {
				summary: domNode => {
					return {
						conversion: convertSummaryElement,
						priority: 1
					};
				}
			};
		}
		static importJSON(serializedNode) {
			return $createSpoilerTitleNode();
		}
		exportDOM() {
			const element = document.createElement('summary');
			return {
				element
			};
		}
		exportJSON() {
			return {
				...super.exportJSON(),
				type: 'spoiler-title',
				version: 1
			};
		}
		collapseAtStart(selection) {
			const spoilerNode = this.getParent();
			if (!$isSpoilerNode(spoilerNode)) {
				return false;
			}
			return $removeSpoiler(spoilerNode);
		}
		insertNewAfter(selection, restoreSelection = true) {
			const containerNode = this.getParentOrThrow();
			if (!$isSpoilerNode(containerNode)) {
				throw new Error('SpoilerTitleNode expects to be child of SpoilerNode');
			}
			if (containerNode.getOpen()) {
				const contentNode = this.getNextSibling();
				if (!$isSpoilerContentNode(contentNode)) {
					throw new Error('SpoilerTitleNode expects to have SpoilerContentNode sibling');
				}
				const firstChild = contentNode.getFirstChild();
				if (ui_lexical_core.$isElementNode(firstChild) || ui_lexical_core.$isDecoratorNode(firstChild)) {
					return firstChild;
				}
				const paragraph = ui_lexical_core.$createParagraphNode();
				contentNode.append(paragraph);
				return paragraph;
			}
			const paragraph = ui_lexical_core.$createParagraphNode();
			containerNode.insertAfter(paragraph, restoreSelection);
			return paragraph;
		}
		isParentRequired() {
			return true;
		}
		createParentElementNode() {
			return $createSpoilerNode();
		}
		canIndent() {
			return false;
		}
		insertAfter(nodeToInsert) {
			const textContent = nodeToInsert.getTextContent();
			this.clear();
			this.append($createSpoilerTitleTextNode(trimSpoilerTitle(textContent)));
			return this;
		}
	}
	function $createSpoilerTitleNode() {
		return new SpoilerTitleNode();
	}
	function $isSpoilerTitleNode(node) {
		return node instanceof SpoilerTitleNode;
	}
	function $removeSpoiler(spoilerNode) {
		if (!$isSpoilerNode(spoilerNode)) {
			return false;
		}
		const contentNode = spoilerNode.getContentNode();
		let lastElement = spoilerNode;
		if (contentNode !== null) {
			for (const child of contentNode.getChildren()) {
				if (ui_lexical_core.$isElementNode(child) || ui_lexical_core.$isDecoratorNode(child)) {
					lastElement = lastElement.insertAfter(child);
				} else {
					lastElement = lastElement.insertAfter(ui_lexical_core.$createParagraphNode().append(child));
				}
			}
		}
		spoilerNode.remove();
		return true;
	}

	/* eslint-disable no-underscore-dangle, @bitrix24/bitrix24-rules/no-pseudo-private */
	class SpoilerNode extends ui_lexical_core.ElementNode {
		constructor(open, key) {
			super(key);
			this.__open = open;
		}
		static getType() {
			return 'spoiler';
		}
		static clone(node) {
			return new SpoilerNode(node.__open, node.__key);
		}
		createDOM(config, editor) {
			const details = document.createElement('details');
			if (main_core.Type.isStringFilled(config?.theme?.spoiler?.container)) {
				main_core.Dom.addClass(details, config.theme.spoiler.container);
			}
			details.open = this.__open;
			main_core.Event.bind(details, 'toggle', () => {
				const open = editor.getEditorState().read(() => this.getOpen());
				if (open !== details.open) {
					editor.update(() => this.toggleOpen());
				}
			});
			return details;
		}
		updateDOM(prevNode, dom, config) {
			if (prevNode.__open !== this.__open) {
				dom.open = this.__open;
			}
			return false;
		}
		static importDOM() {
			return {
				details: domNode => {
					return {
						conversion: details => {
							const isOpen = main_core.Type.isBoolean(details.open) ? details.open : true;
							return {
								node: $createSpoiler(isOpen)
							};
						},
						priority: 1
					};
				}
			};
		}
		static importJSON(serializedNode) {
			return $createSpoilerNode(serializedNode.open);
		}
		exportDOM(editor) {
			const details = document.createElement('details');
			if (this.__open) {
				details.setAttribute('open', true);
			}
			return {
				element: details
			};
		}
		exportJSON() {
			return {
				...super.exportJSON(),
				open: this.__open,
				type: 'spoiler',
				version: 1
			};
		}

		// isShadowRoot(): boolean
		// {
		// 	return true;
		// }

		canBeEmpty() {
			return false;
		}
		append(...nodesToAppend) {
			for (const node of nodesToAppend) {
				if ($isSpoilerTitleNode(node)) {
					const titleNode = node;
					if (this.getTitleNode() === null) {
						super.append(titleNode);
					} else {
						this.getTitleNode().clear();
						this.getTitleNode().append($createSpoilerTitleTextNode(node.getTextContent()));
					}
				} else if ($isSpoilerContentNode(node)) {
					const contentNode = node;
					if (this.getContentNode() === null) {
						super.append(contentNode);
					} else {
						this.getContentNode().append(...contentNode.getChildren());
					}
				} else if (ui_lexical_core.$isElementNode(node) || ui_lexical_core.$isDecoratorNode(node)) {
					this.getContentNode().append(node);
				} else {
					this.getContentNode().append(ui_lexical_core.$createParagraphNode().append(node));
				}
			}
			return this;
		}
		getTitleNode() {
			return this.getChildren()[0] || null;
		}
		getContentNode() {
			return this.getChildren()[1] || null;
		}
		setOpen(open) {
			const writable = this.getWritable();
			writable.__open = open;
		}
		getOpen() {
			return this.getLatest().__open;
		}
		toggleOpen() {
			this.setOpen(!this.getOpen());
		}
	}
	function $createSpoiler(isOpen, title = main_core.Loc.getMessage('TEXT_EDITOR_SPOILER_TITLE')) {
		return $createSpoilerNode(isOpen).append($createSpoilerTitleNode().append($createSpoilerTitleTextNode(title)), $createSpoilerContentNode());
	}
	function $createSpoilerNode(isOpen) {
		return new SpoilerNode(isOpen);
	}
	function $isSpoilerNode(node) {
		return node instanceof SpoilerNode;
	}

	var Spoiler = /*#__PURE__*/Object.freeze({
		__proto__: null,
		$createSpoiler: $createSpoiler,
		$createSpoilerContentNode: $createSpoilerContentNode,
		$createSpoilerNode: $createSpoilerNode,
		$createSpoilerTitleNode: $createSpoilerTitleNode,
		$isSpoilerContentNode: $isSpoilerContentNode,
		$isSpoilerNode: $isSpoilerNode,
		$isSpoilerTitleNode: $isSpoilerTitleNode,
		$removeSpoiler: $removeSpoiler,
		INSERT_SPOILER_COMMAND: INSERT_SPOILER_COMMAND,
		REMOVE_SPOILER_COMMAND: REMOVE_SPOILER_COMMAND,
		SpoilerContentNode: SpoilerContentNode,
		SpoilerNode: SpoilerNode,
		SpoilerPlugin: SpoilerPlugin,
		SpoilerTitleNode: SpoilerTitleNode,
		TOGGLE_SPOILER_COMMAND: TOGGLE_SPOILER_COMMAND,
		convertSpoilerContentElement: convertSpoilerContentElement,
		convertSummaryElement: convertSummaryElement,
		insertSpoiler: insertSpoiler,
		trimSpoilerTitle: trimSpoilerTitle
	});

	/* eslint-disable no-underscore-dangle, @bitrix24/bitrix24-rules/no-pseudo-private */

	class CustomParagraphNode extends ui_lexical_core.ParagraphNode {
		__mode = NewLineMode.MIXED;
		constructor(__mode, key) {
			super(key);
			this.__mode = __mode;
		}
		static getType() {
			return 'custom-paragraph';
		}
		static clone(node) {
			return new CustomParagraphNode(node.__mode, node.__key);
		}
		insertNewAfter(selection, restoreSelection) {
			if (this.__mode === NewLineMode.PARAGRAPH) {
				return super.insertNewAfter(selection, restoreSelection);
			}
			if (this.__mode === NewLineMode.MIXED) {
				const children = this.getChildren();
				const childrenLength = children.length;
				if (childrenLength >= 1 && children[childrenLength - 1].getTextContent() === '\n' && selection.isCollapsed() && selection.anchor.key === this.__key && selection.anchor.offset === childrenLength) {
					children[childrenLength - 1].remove();
					const newElement = ui_lexical_core.$createParagraphNode();
					this.insertAfter(newElement, restoreSelection);
					return newElement;
				}
				if (ui_lexical_core.$hasUpdateTag('paste')) {
					return super.insertNewAfter(selection, restoreSelection);
				}
			}
			selection.insertLineBreak();
			return null;
		}

		// createDOM(config) {
		// 	const dom = super.createDOM(config);
		// 	dom.style = "border: 1px dashed tomato";
		//
		// 	return dom;
		// }

		exportJSON() {
			return {
				...super.exportJSON(),
				mode: this.__mode,
				type: 'custom-paragraph',
				version: 1
			};
		}
		static importDOM() {
			return {
				p: node => ({
					conversion: element => {
						return {
							node: ui_lexical_core.$createParagraphNode()
						};
					},
					priority: 1
				}),
				h1: node => ({
					conversion: convertHeadingElement,
					priority: 1
				}),
				h2: node => ({
					conversion: convertHeadingElement,
					priority: 1
				}),
				h3: node => ({
					conversion: convertHeadingElement,
					priority: 1
				}),
				h4: node => ({
					conversion: convertHeadingElement,
					priority: 1
				}),
				h5: node => ({
					conversion: convertHeadingElement,
					priority: 1
				}),
				h6: node => ({
					conversion: convertHeadingElement,
					priority: 1
				})
			};
		}
		collapseAtStart() {
			const children = this.getChildren();
			// If we have an empty (trimmed) first paragraph and try and remove it,
			// delete the paragraph as long as we have another sibling to go to
			if (children.length === 0 || ui_lexical_core.$isTextNode(children[0]) && children[0].getTextContent().trim() === '') {
				const nextSibling = this.getNextSibling();
				if (nextSibling !== null) {
					this.selectNext();
					this.remove();
					return true;
				}
				const prevSibling = this.getPreviousSibling();
				if (prevSibling !== null) {
					this.selectPrevious();
					this.remove();
					return true;
				}
				const parentNode = this.getParent();
				if (parentNode !== null && !ui_lexical_core.$isRootNode(parentNode) && Object.getPrototypeOf(parentNode).hasOwnProperty('collapseAtStart')) {
					return parentNode.collapseAtStart();
				}
			}
			return false;
		}
		static importJSON(serializedParagraphNode) {
			return super.importJSON(serializedParagraphNode);
		}
	}
	function convertHeadingElement(element) {
		return {
			node: ui_lexical_core.$createParagraphNode(),
			forChild: lexicalNode => {
				if (ui_lexical_core.$isTextNode(lexicalNode)) {
					lexicalNode.toggleFormat('bold');
				}
				return lexicalNode;
			}
		};
	}

	/** @memberof BX.UI.TextEditor.Plugins.Paragraph */
	const FORMAT_PARAGRAPH_COMMAND = ui_lexical_core.createCommand('FORMAT_PARAGRAPH_COMMAND');
	class ParagraphPlugin extends BasePlugin {
		constructor(editor) {
			super(editor);
			this.#registerCommands();
			this.#registerListeners();
		}
		static getName() {
			return 'Paragraph';
		}
		static getNodes(editor) {
			return [CustomParagraphNode, {
				replace: ui_lexical_core.ParagraphNode,
				with: node => {
					return new CustomParagraphNode(editor.getNewLineMode());
				},
				withClass: CustomParagraphNode
			}];
		}
		importBBCode() {
			return {
				p: () => ({
					conversion: node => convertParagraphNode(),
					priority: 0
				}),
				left: () => ({
					conversion: node => convertParagraphNode(),
					priority: 0
				}),
				right: () => ({
					conversion: node => convertParagraphNode(),
					priority: 0
				}),
				center: () => ({
					conversion: node => convertParagraphNode(),
					priority: 0
				}),
				justify: () => ({
					conversion: node => convertParagraphNode(),
					priority: 0
				})
			};
		}
		exportBBCode() {
			return {
				paragraph: lexicalNode => {
					const scheme = this.getEditor().getBBCodeScheme();
					return {
						node: scheme.createElement({
							name: 'p'
						})
					};
				},
				'custom-paragraph': lexicalNode => {
					const scheme = this.getEditor().getBBCodeScheme();
					return {
						node: scheme.createElement({
							name: 'p'
						})
					};
				}
			};
		}
		validateScheme() {
			return {
				nodes: [{
					nodeClass: CustomParagraphNode
				}],
				bbcodeMap: {
					root: '#root',
					tab: '#tab',
					text: '#text',
					paragraph: 'p',
					'custom-paragraph': 'p',
					linebreak: '#linebreak'
				}
			};
		}
		#registerCommands() {
			this.cleanUpRegister(this.getEditor().registerCommand(FORMAT_PARAGRAPH_COMMAND, () => {
				const selection = ui_lexical_core.$getSelection();
				if (ui_lexical_core.$isRangeSelection(selection)) {
					ui_lexical_selection.$setBlocksType(selection, () => ui_lexical_core.$createParagraphNode());
				}
				return true;
			}, ui_lexical_core.COMMAND_PRIORITY_EDITOR));
		}
		#registerListeners() {
			this.cleanUpRegister(this.getEditor().registerNodeTransform(ui_lexical_core.RootNode, root => {
				const selection = ui_lexical_core.$getSelection();
				if (ui_lexical_core.$isRangeSelection(selection)) {
					const anchorNode = selection.anchor.getNode();
					const focusNode = selection.focus.getNode();
					if (!anchorNode.isAttached() || !focusNode.isAttached()) {
						root.selectEnd();
						// eslint-disable-next-line no-console
						console.warn('TextEditor: selection has been moved to the end of the editor because the previously ' + 'selected nodes have been removed and selection wasn\'t moved to another node. ' + 'Ensure selection changes after removing/replacing a selected node.');
					}
				}
				const lastChild = root.getLastChild();
				if (!ui_lexical_core.$isParagraphNode(lastChild)) {
					root.append(ui_lexical_core.$createParagraphNode());
				}
			}),
			// When a block node is the first child pressing up/left arrow will insert paragraph
			// above it to allow adding more content. It's similar what $insertBlockNode
			// (mainly for decorators), except it'll always be possible to continue adding
			// new content even if leading paragraph is accidentally deleted
			this.getEditor().registerCommand(ui_lexical_core.KEY_ARROW_UP_COMMAND, this.#handleEscapeUp.bind(this), ui_lexical_core.COMMAND_PRIORITY_LOW), this.getEditor().registerCommand(ui_lexical_core.KEY_ARROW_LEFT_COMMAND, this.#handleEscapeUp.bind(this), ui_lexical_core.COMMAND_PRIORITY_LOW),
			// When a block node is the last child pressing down/right arrow will insert paragraph
			// below it to allow adding more content. It's similar what $insertBlockNode
			// (mainly for decorators), except it'll always be possible to continue adding
			// new content even if trailing paragraph is accidentally deleted
			this.getEditor().registerCommand(ui_lexical_core.KEY_ARROW_DOWN_COMMAND, this.#handleEscapeDown.bind(this), ui_lexical_core.COMMAND_PRIORITY_LOW), this.getEditor().registerCommand(ui_lexical_core.KEY_ARROW_RIGHT_COMMAND, this.#handleEscapeDown.bind(this), ui_lexical_core.COMMAND_PRIORITY_LOW), this.getEditor().registerCommand(ui_lexical_core.PASTE_COMMAND, this.#handlePaste.bind(this), ui_lexical_core.COMMAND_PRIORITY_LOW));
		}
		#isBlockNode(node) {
			return $isQuoteNode(node) || $isCodeNode(node) || $isSpoilerNode(node);
		}
		#handlePaste(event) {
			// if (this.getEditor().getNewLineMode() === NewLineMode.PARAGRAPH)
			// {
			// 	// use a build-in algorithm (Rich Text Plugin)
			// 	return false;
			// }

			if (this.getEditor().getNewLineMode() === NewLineMode.LINE_BREAK) {
				event.preventDefault();
				this.getEditor().update(() => {
					const selection = ui_lexical_core.$getSelection();
					const {
						clipboardData
					} = event;
					if (clipboardData !== null && ui_lexical_core.$isRangeSelection(selection)) {
						ui_lexical_clipboard.$insertDataTransferForPlainText(clipboardData, selection);
					}
				}, {
					tag: 'paste'
				});
				return true;
			}

			// Mixed Mode
			const clipboardData = event.clipboardData;
			if (!clipboardData || clipboardData.items.length !== 1 || clipboardData.items[0].type !== 'text/plain' && clipboardData.items[0].type !== 'text/uri-list') {
				return false;
			}
			const text = clipboardData.getData('text/plain') || clipboardData.getData('text/uri-list');
			const hasLineBreaks = /\n/.test(text);
			if (!hasLineBreaks) {
				return false;
			}
			event.preventDefault();
			event.stopPropagation();
			const html = wrapTextInParagraph(text);
			const dataTransfer = new DataTransfer();
			dataTransfer.setData('text/plain', clipboardData.getData('text/plain'));
			dataTransfer.setData('text/html', html);
			const pasteEvent = new ClipboardEvent('paste', {
				clipboardData: dataTransfer,
				bubbles: true,
				cancelable: true
			});
			if (pasteEvent.clipboardData.items.length === 0) {
				// Firefox
				pasteEvent.clipboardData.setData('text/plain', clipboardData.getData('text/plain'));
				pasteEvent.clipboardData.setData('text/html', html);
			}
			this.getEditor().getEditableContainer().dispatchEvent(pasteEvent);
			return true;
		}
		#handleEscapeUp() {
			const selection = ui_lexical_core.$getSelection();
			if (ui_lexical_core.$isRangeSelection(selection) && selection.isCollapsed() && selection.anchor.offset === 0) {
				const container = ui_lexical_utils.$findMatchingParent(selection.anchor.getNode(), this.#isBlockNode);
				if (this.#isBlockNode(container)) {
					const parent = container.getParent();
					if (parent !== null && parent.getFirstChild() === container && (selection.anchor.key === container.getFirstDescendant()?.getKey() || selection.anchor.key === container.getKey())) {
						container.insertBefore(ui_lexical_core.$createParagraphNode());
					}
				}
			}
			return false;
		}
		#handleEscapeDown() {
			const selection = ui_lexical_core.$getSelection();
			if (ui_lexical_core.$isRangeSelection(selection) && selection.isCollapsed()) {
				const container = ui_lexical_utils.$findMatchingParent(selection.anchor.getNode(), this.#isBlockNode);
				if (this.#isBlockNode(container)) {
					const parent = container.getParent();
					if (parent !== null && parent.getLastChild() === container) {
						const firstDescendant = container.getFirstDescendant();
						const lastDescendant = container.getLastDescendant();
						if (lastDescendant !== null && selection.anchor.key === lastDescendant.getKey() && selection.anchor.offset === lastDescendant.getTextContentSize() || firstDescendant !== null && selection.anchor.key === firstDescendant.getKey() && selection.anchor.offset === firstDescendant.getTextContentSize() || selection.anchor.key === container.getKey() && selection.anchor.offset === container.getTextContentSize()) {
							container.insertAfter(ui_lexical_core.$createParagraphNode());
						}
					}
				}
			}
			return false;
		}
	}
	function convertParagraphNode(bbcodeNode) {
		return {
			node: ui_lexical_core.$createParagraphNode()
			// after: (childLexicalNodes: Array<LexicalNode>): Array<LexicalNode> => {
			// 	return trimLineBreaks(childLexicalNodes);
			// },
		};
	}

	var Paragraph = /*#__PURE__*/Object.freeze({
		__proto__: null,
		FORMAT_PARAGRAPH_COMMAND: FORMAT_PARAGRAPH_COMMAND,
		ParagraphPlugin: ParagraphPlugin
	});

	/* eslint-disable no-underscore-dangle, @bitrix24/bitrix24-rules/no-pseudo-private */

	class CodeTokenNode extends ui_lexical_core.TextNode {
		/** @internal */

		__flags = UNFORMATTED;
		constructor(text, highlightType, key) {
			super(text, key);
			this.__highlightType = highlightType;
		}
		static getType() {
			return 'code-token';
		}
		static clone(node) {
			return new CodeTokenNode(node.__text, node.__highlightType || undefined, node.__key);
		}
		getHighlightType() {
			const self = this.getLatest();
			return self.__highlightType;
		}
		createDOM(config) {
			const element = super.createDOM(config);
			const className = getHighlightThemeClass(config.theme, this.__highlightType);
			ui_lexical_utils.addClassNamesToElement(element, className);
			return element;
		}
		updateDOM(prevNode, dom, config) {
			const update = super.updateDOM(prevNode, dom, config);
			const prevClassName = getHighlightThemeClass(config.theme, prevNode.__highlightType);
			const nextClassName = getHighlightThemeClass(config.theme, this.__highlightType);
			if (prevClassName !== nextClassName) {
				if (prevClassName) {
					ui_lexical_utils.removeClassNamesFromElement(dom, prevClassName);
				}
				if (nextClassName) {
					ui_lexical_utils.addClassNamesToElement(dom, nextClassName);
				}
			}
			return update;
		}
		static importJSON(serializedNode) {
			const node = $createCodeTokenNode(serializedNode.text, serializedNode.highlightType);
			node.setFormat(serializedNode.format);
			node.setDetail(serializedNode.detail);
			node.setMode(serializedNode.mode);
			node.setStyle(serializedNode.style);
			return node;
		}
		exportJSON() {
			return {
				...super.exportJSON(),
				highlightType: this.getHighlightType(),
				type: 'code-token',
				version: 1
			};
		}

		// Prevent formatting (bold, underline, etc)
		setFormat(format) {
			return this;
		}
		isParentRequired() {
			return true;
		}
		createParentElementNode() {
			return $createCodeNode();
		}
	}
	function getHighlightThemeClass(theme, highlightType) {
		return highlightType && theme && theme.codeHighlight && theme.codeHighlight[highlightType];
	}
	function $createCodeTokenNode(text, highlightType) {
		return ui_lexical_core.$applyNodeReplacement(new CodeTokenNode(text, highlightType));
	}
	function $isCodeTokenNode(node) {
		return node instanceof CodeTokenNode;
	}

	/* eslint-disable no-underscore-dangle */

	class CodeNode extends ui_lexical_core.ElementNode {
		__language = 'lexical-hack';
		__flags = UNFORMATTED;
		static getType() {
			return 'code';
		}
		static clone(node) {
			return new CodeNode(node.__key);
		}
		createDOM(config, editor) {
			const element = document.createElement('code');
			element.setAttribute('spellcheck', 'false');
			if (main_core.Type.isStringFilled(config?.theme?.code)) {
				main_core.Dom.addClass(element, config.theme.code);
			}
			return element;
		}
		updateDOM(prevNode, anchor, config) {
			return false;
		}
		exportDOM(editor) {
			const element = document.createElement('pre');
			element.setAttribute('spellcheck', 'false');
			if (main_core.Type.isStringFilled(editor._config?.theme?.code)) {
				main_core.Dom.addClass(element, editor._config.theme.code);
			}
			return {
				element
			};
		}
		static importDOM() {
			return {
				// Typically <pre> is used for code blocks, and <code> for inline code styles
				// but if it's a multi line <code> we'll create a block. Pass through to
				// inline format handled by TextNode otherwise.
				code: node => {
					const isMultiLine = node.textContent !== null && (/\r?\n/.test(node.textContent) || hasChildDOMNodeTag(node, 'BR'));
					return isMultiLine ? {
						conversion: convertPreElement,
						priority: 1
					} : null;
				},
				div: node => ({
					conversion: convertDivElement,
					priority: 1
				}),
				pre: node => ({
					conversion: convertPreElement,
					priority: 0
				}),
				table: node => {
					const table = node;
					// domNode is a <table> since we matched it by nodeName
					if (isGitHubCodeTable(table)) {
						return {
							conversion: convertTableElement,
							priority: 3
						};
					}
					return null;
				},
				td: node => {
					// element is a <td> since we matched it by nodeName
					const td = node;
					const table = td.closest('table');
					if (isGitHubCodeCell(td)) {
						return {
							conversion: convertTableCellElement,
							priority: 3
						};
					}
					if (table && isGitHubCodeTable(table)) {
						// Return a no-op if it's a table cell in a code table, but not a code line.
						// Otherwise it'll fall back to the T
						return {
							conversion: convertCodeNoop,
							priority: 3
						};
					}
					return null;
				},
				tr: node => {
					// element is a <tr> since we matched it by nodeName
					const tr = node;
					const table = tr.closest('table');
					if (table && isGitHubCodeTable(table)) {
						return {
							conversion: convertCodeNoop,
							priority: 3
						};
					}
					return null;
				}
			};
		}
		static importJSON(serializedNode) {
			const node = $createCodeNode();
			node.setFormat(serializedNode.format);
			node.setIndent(serializedNode.indent);
			node.setDirection(serializedNode.direction);
			return node;
		}
		exportJSON() {
			return {
				...super.exportJSON(),
				type: 'code'
			};
		}
		canIndent() {
			return false;
		}
		canReplaceWith(replacement) {
			return false;
		}
		isInline() {
			return false;
		}
		collapseAtStart(selection) {
			const paragraph = ui_lexical_core.$createParagraphNode();
			const children = this.getChildren();
			children.forEach(child => paragraph.append(child));
			this.replace(paragraph);
			return true;
		}
		insertNewAfter(selection, restoreSelection = true) {
			const children = this.getChildren();
			const childrenLength = children.length;
			if (childrenLength >= 2 && children[childrenLength - 1].getTextContent() === '\n' && children[childrenLength - 2].getTextContent() === '\n' && selection.isCollapsed() && selection.anchor.key === this.__key && selection.anchor.offset === childrenLength) {
				children[childrenLength - 1].remove();
				children[childrenLength - 2].remove();
				const newElement = ui_lexical_core.$createParagraphNode();
				this.insertAfter(newElement, restoreSelection);
				return newElement;
			}

			// If the selection is within the codeblock, find all leading tabs and
			// spaces of the current line. Create a new line that has all those
			// tabs and spaces, such that leading indentation is preserved.
			const {
				anchor,
				focus
			} = selection;
			const firstPoint = anchor.isBefore(focus) ? anchor : focus;
			const firstSelectionNode = firstPoint.getNode();
			if (ui_lexical_core.$isTextNode(firstSelectionNode)) {
				let node = getFirstCodeNodeOfLine(firstSelectionNode);
				const insertNodes = [];
				// eslint-disable-next-line no-constant-condition
				while (true) {
					if (ui_lexical_core.$isTabNode(node)) {
						insertNodes.push(ui_lexical_core.$createTabNode());
						node = node.getNextSibling();
					} else if ($isCodeTokenNode(node)) {
						let spaces = 0;
						const text = node.getTextContent();
						const textSize = node.getTextContentSize();
						while (spaces < textSize && text[spaces] === ' ') {
							spaces++;
						}
						if (spaces !== 0) {
							insertNodes.push($createCodeTokenNode(' '.repeat(spaces)));
						}
						if (spaces !== textSize) {
							break;
						}
						node = node.getNextSibling();
					} else {
						break;
					}
				}
				const split = firstSelectionNode.splitText(anchor.offset)[0];
				const x = anchor.offset === 0 ? 0 : 1;
				const index = split.getIndexWithinParent() + x;
				const codeNode = firstSelectionNode.getParentOrThrow();
				const nodesToInsert = [ui_lexical_core.$createLineBreakNode(), ...insertNodes];
				codeNode.splice(index, 0, nodesToInsert);
				const last = insertNodes[insertNodes.length - 1];
				if (last) {
					last.select();
				} else if (anchor.offset === 0) {
					split.selectPrevious();
				} else {
					split.getNextSibling()?.selectNext(0, 0);
				}
			}
			if ($isCodeNode(firstSelectionNode)) {
				const {
					offset
				} = selection.anchor;
				firstSelectionNode.splice(offset, 0, [ui_lexical_core.$createLineBreakNode()]);
				firstSelectionNode.select(offset + 1, offset + 1);
			}
			return null;
		}
	}
	function $createCodeNode() {
		return ui_lexical_core.$applyNodeReplacement(new CodeNode());
	}
	function $isCodeNode(node) {
		return node instanceof CodeNode;
	}
	function convertPreElement(domNode) {
		return {
			node: $createCodeNode()
		};
	}
	function convertDivElement(domNode) {
		// domNode is a <div> since we matched it by nodeName
		const div = domNode;
		const isCode = isCodeElement(div);
		if (!isCode && !isCodeChildElement(div)) {
			return {
				node: null
			};
		}
		return {
			after: childLexicalNodes => {
				const domParent = domNode.parentNode;
				if (domParent !== null && domNode !== domParent.lastChild) {
					childLexicalNodes.push(ui_lexical_core.$createLineBreakNode());
				}
				return childLexicalNodes;
			},
			node: isCode ? $createCodeNode() : null
		};
	}
	function convertTableElement() {
		return {
			node: $createCodeNode()
		};
	}
	function convertCodeNoop() {
		return {
			node: null
		};
	}
	function convertTableCellElement(domNode) {
		// domNode is a <td> since we matched it by nodeName
		const cell = domNode;
		return {
			after: childLexicalNodes => {
				if (cell.parentNode && cell.parentNode.nextSibling) {
					// Append newline between code lines
					childLexicalNodes.push(ui_lexical_core.$createLineBreakNode());
				}
				return childLexicalNodes;
			},
			node: null
		};
	}
	function isCodeElement(div) {
		return div.style.fontFamily.match('monospace') !== null;
	}
	function isCodeChildElement(node) {
		let parent = node.parentElement;
		while (parent !== null) {
			if (isCodeElement(parent)) {
				return true;
			}
			parent = parent.parentElement;
		}
		return false;
	}
	function isGitHubCodeCell(cell) {
		return cell.classList.contains('js-file-line');
	}
	function isGitHubCodeTable(table) {
		return table.classList.contains('js-file-line-container');
	}
	function hasChildDOMNodeTag(node, tagName) {
		let hasChild = false;
		for (const child of node.childNodes) {
			if (main_core.Type.isElementNode(child) && child.tagName === tagName) {
				return true;
			}
			hasChild = hasChildDOMNodeTag(child, tagName);
		}
		return hasChild;
	}

	/* eslint-disable no-underscore-dangle */

	/** @memberof BX.UI.TextEditor.Plugins.Code */
	const FORMAT_CODE_COMMAND = ui_lexical_core.createCommand('FORMAT_CODE_COMMAND');

	/** @memberof BX.UI.TextEditor.Plugins.Code */
	const TOGGLE_CODE_COMMAND = ui_lexical_core.createCommand('TOGGLE_CODE_COMMAND');

	/** @memberof BX.UI.TextEditor.Plugins.Code */
	const INSERT_CODE_COMMAND = ui_lexical_core.createCommand('INSERT_CODE_COMMAND');
	class CodePlugin extends BasePlugin {
		#nodesCurrentlyHighlighting = new Set();
		#codeParser = new ui_codeParser.CodeParser();
		constructor(editor) {
			super(editor);
			this.#registerCommands();
			this.#registerComponents();
			this.#registerListeners();
		}
		static getName() {
			return 'Code';
		}
		static getNodes(editor) {
			return [CodeNode, CodeTokenNode];
		}
		importBBCode() {
			return {
				code: () => ({
					conversion: node => {
						return {
							node: $createCodeNode(),
							after: childLexicalNodes => {
								// const childNodes = trimLineBreaks(childLexicalNodes);
								const content = childLexicalNodes.map(childNode => childNode.getTextContent()).join('');

								// return getCodeTokenNodes(parse(content));
								return [ui_lexical_core.$createTextNode(content)];
							}
						};
					},
					priority: 0
				})
			};
		}
		exportBBCode() {
			return {
				code: lexicalNode => {
					const scheme = this.getEditor().getBBCodeScheme();
					return {
						node: scheme.createElement({
							name: 'code'
						})
					};
				},
				'code-token': lexicalNode => {
					const scheme = this.getEditor().getBBCodeScheme();
					return {
						node: scheme.createText({
							content: lexicalNode.getTextContent(),
							encode: false
						})
					};
				}
			};
		}
		validateScheme() {
			return {
				nodes: [{
					nodeClass: CodeNode
				}],
				bbcodeMap: {
					code: 'code'
				}
			};
		}
		#registerComponents() {
			this.getEditor().getComponentRegistry().register('code', () => {
				const button = new Button();
				button.setIcon(ui_iconSet_api_core.Outline.DEVELOPER_RESOURCES);
				button.setTooltip(main_core.Loc.getMessage('TEXT_EDITOR_BTN_CODE'));
				button.setBlockType('code');
				button.subscribe('onClick', () => {
					this.getEditor().focus();
					this.getEditor().update(() => {
						if (button.isActive()) {
							this.getEditor().dispatchCommand(FORMAT_PARAGRAPH_COMMAND);
						} else {
							this.getEditor().dispatchCommand(FORMAT_CODE_COMMAND);
						}
					});
				});
				return button;
			});
		}
		#registerListeners() {
			const handleTextNodeTransform = this.#handleTextNodeTransform.bind(this);
			this.cleanUpRegister(
			// Prevent formatting
			this.getEditor().registerNodeTransform(CodeNode, this.#handleCodeNodeTransform.bind(this)), this.getEditor().registerNodeTransform(ui_lexical_core.TextNode, handleTextNodeTransform), this.getEditor().registerNodeTransform(CodeTokenNode, handleTextNodeTransform), this.getEditor().registerCommand(ui_lexical_core.FORMAT_TEXT_COMMAND, () => {
				const selection = ui_lexical_core.$getSelection();
				if (!ui_lexical_core.$isRangeSelection(selection)) {
					return false;
				}
				const node = getSelectedNode(selection);
				// const parent = node.getParent();

				return $isCodeTokenNode(node) || $isCodeNode(node);
			}, ui_lexical_core.COMMAND_PRIORITY_HIGH), this.getEditor().registerCommand(ui_lexical_core.KEY_TAB_COMMAND, event => {
				const command = this.#handleTab(event.shiftKey);
				if (command === null) {
					return false;
				}
				event.preventDefault();
				this.getEditor().dispatchCommand(command);
				return true;
			}, ui_lexical_core.COMMAND_PRIORITY_LOW), this.getEditor().registerCommand(ui_lexical_core.INSERT_TAB_COMMAND, () => {
				const selection = ui_lexical_core.$getSelection();
				if (!$isSelectionInCode(selection)) {
					return false;
				}
				ui_lexical_core.$insertNodes([ui_lexical_core.$createTabNode()]);
				return true;
			}, ui_lexical_core.COMMAND_PRIORITY_LOW), this.getEditor().registerCommand(ui_lexical_core.INDENT_CONTENT_COMMAND, payload => this.#handleMultilineIndent(ui_lexical_core.INDENT_CONTENT_COMMAND), ui_lexical_core.COMMAND_PRIORITY_NORMAL), this.getEditor().registerCommand(ui_lexical_core.OUTDENT_CONTENT_COMMAND, payload => this.#handleMultilineIndent(ui_lexical_core.OUTDENT_CONTENT_COMMAND), ui_lexical_core.COMMAND_PRIORITY_NORMAL), this.getEditor().registerCommand(ui_lexical_core.PASTE_COMMAND, event => {
				const selection = ui_lexical_core.$getSelection();
				if (!ui_lexical_core.$isRangeSelection(selection) || !(event instanceof ClipboardEvent) || event.clipboardData === null) {
					return false;
				}
				const codeNode = ui_lexical_utils.$findMatchingParent(selection.anchor.getNode(), node => $isCodeNode(node));
				if (codeNode) {
					event.preventDefault();
					this.getEditor().update(() => {
						ui_lexical_clipboard.$insertDataTransferForPlainText(event.clipboardData, selection);
					}, {
						tag: 'paste'
					});
					return true;
				}
				return false;
			}, ui_lexical_core.COMMAND_PRIORITY_NORMAL));
		}
		#registerCommands() {
			this.cleanUpRegister(this.getEditor().registerCommand(INSERT_CODE_COMMAND, payload => {
				const codeNode = $createCodeNode();
				if (main_core.Type.isPlainObject(payload) && main_core.Type.isStringFilled(payload.content)) {
					const tokenNodes = getCodeTokenNodes(this.#codeParser.parse(payload.content));
					codeNode.append(...tokenNodes);
					ui_lexical_utils.$insertNodeToNearestRoot(codeNode);
				} else {
					ui_lexical_utils.$insertNodeToNearestRoot(codeNode);
					codeNode.selectEnd();
				}
				return true;
			}, ui_lexical_core.COMMAND_PRIORITY_EDITOR), this.getEditor().registerCommand(FORMAT_CODE_COMMAND, () => {
				const selection = ui_lexical_core.$getSelection() || ui_lexical_core.$getPreviousSelection();
				if (ui_lexical_core.$isRangeSelection(selection)) {
					if (selection.isCollapsed()) {
						ui_lexical_selection.$setBlocksType(selection, () => $createCodeNode());
					} else {
						const textContent = selection.getTextContent();
						const codeNode = $createCodeNode();
						selection.insertNodes([codeNode]);
						const newSelection = ui_lexical_core.$getSelection();
						if (ui_lexical_core.$isRangeSelection(newSelection)) {
							newSelection.insertRawText(textContent);
						}
					}
				}
				return true;
			}, ui_lexical_core.COMMAND_PRIORITY_EDITOR), this.getEditor().registerCommand(TOGGLE_CODE_COMMAND, () => {
				const selection = ui_lexical_core.$getSelection() || ui_lexical_core.$getPreviousSelection();
				if (!ui_lexical_core.$isRangeSelection(selection)) {
					return false;
				}
				const codeParent = ui_lexical_utils.$findMatchingParent(selection.anchor.getNode(), node => {
					return $isCodeNode(node) || $isCodeTokenNode(node);
				});
				if (codeParent) {
					this.getEditor().dispatchCommand(FORMAT_PARAGRAPH_COMMAND);
				} else {
					this.getEditor().dispatchCommand(FORMAT_CODE_COMMAND);
				}
				return true;
			}, ui_lexical_core.COMMAND_PRIORITY_EDITOR));
		}
		#handleCodeNodeTransform(node) {
			const nodeKey = node.getKey();
			if (this.#nodesCurrentlyHighlighting.has(nodeKey)) {
				return;
			}
			this.#nodesCurrentlyHighlighting.add(nodeKey);

			// Using nested update call to pass `skipTransforms` since we don't want
			// each individual code-token node to be transformed again as it's already
			// in its final state
			this.getEditor().update(() => {
				updateAndRetainSelection(nodeKey, () => {
					const currentNode = ui_lexical_core.$getNodeByKey(nodeKey);
					if (!$isCodeNode(currentNode) || !currentNode.isAttached()) {
						return false;
					}
					const code = currentNode.getTextContent();
					const codeTokenNodes = getCodeTokenNodes(this.#codeParser.parse(code));
					const diffRange = getDiffRange(currentNode.getChildren(), codeTokenNodes);
					const {
						from,
						to,
						nodesForReplacement
					} = diffRange;
					if (from !== to || nodesForReplacement.length > 0) {
						node.splice(from, to - from, nodesForReplacement);
						return true;
					}
					return false;
				});
			}, {
				onUpdate: () => {
					this.#nodesCurrentlyHighlighting.delete(nodeKey);
				},
				skipTransforms: true
			});
		}
		#handleTextNodeTransform(node) {
			// Since CodeNode has flat children structure we only need to check
			// if node's parent is a code node and run highlighting if so
			const parentNode = node.getParent();
			if ($isCodeNode(parentNode)) {
				this.#handleCodeNodeTransform(parentNode);
			} else if ($isCodeTokenNode(node)) {
				// When code block converted into paragraph or other element
				// code token nodes converted back to normal text
				node.replace(ui_lexical_core.$createTextNode(node.__text));
			}
		}
		#handleTab(shiftKey) {
			const selection = ui_lexical_core.$getSelection();
			if (!ui_lexical_core.$isRangeSelection(selection) || !$isSelectionInCode(selection)) {
				return null;
			}
			const indentOrOutdent = shiftKey ? ui_lexical_core.OUTDENT_CONTENT_COMMAND : ui_lexical_core.INDENT_CONTENT_COMMAND;
			const tabOrOutdent = shiftKey ? ui_lexical_core.OUTDENT_CONTENT_COMMAND : ui_lexical_core.INSERT_TAB_COMMAND;

			// 1. If multiple lines selected: indent/outdent
			const codeLines = $getCodeLines(selection);
			if (codeLines.length > 1) {
				return indentOrOutdent;
			}

			// 2. If entire line selected: indent/outdent
			const selectionNodes = selection.getNodes();
			const firstNode = selectionNodes[0];
			if ($isCodeNode(firstNode)) {
				return indentOrOutdent;
			}
			const firstOfLine = getFirstCodeNodeOfLine(firstNode);
			const lastOfLine = getLastCodeNodeOfLine(firstNode);
			const anchor = selection.anchor;
			const focus = selection.focus;
			let selectionFirst = null;
			let selectionLast = null;
			if (focus.isBefore(anchor)) {
				selectionFirst = focus;
				selectionLast = anchor;
			} else {
				selectionFirst = anchor;
				selectionLast = focus;
			}
			if (firstOfLine !== null && lastOfLine !== null && selectionFirst.key === firstOfLine.getKey() && selectionFirst.offset === 0 && selectionLast.key === lastOfLine.getKey() && selectionLast.offset === lastOfLine.getTextContentSize()) {
				return indentOrOutdent;
			}

			// 3. Else: tab/outdent
			return tabOrOutdent;
		}
		#handleMultilineIndent(type) {
			const selection = ui_lexical_core.$getSelection();
			if (!ui_lexical_core.$isRangeSelection(selection) || !$isSelectionInCode(selection)) {
				return false;
			}
			const codeLines = $getCodeLines(selection);
			const codeLinesLength = codeLines.length;
			// Multiple lines selection
			if (codeLines.length > 1) {
				for (let i = 0; i < codeLinesLength; i++) {
					const line = codeLines[i];
					if (line.length > 0) {
						let firstOfLine = line[0];
						// First and last lines might not be complete
						if (i === 0) {
							firstOfLine = getFirstCodeNodeOfLine(firstOfLine);
						}
						if (firstOfLine !== null) {
							if (type === ui_lexical_core.INDENT_CONTENT_COMMAND) {
								// eslint-disable-next-line @bitrix24/bitrix24-rules/no-native-dom-methods
								firstOfLine.insertBefore(ui_lexical_core.$createTabNode());
							} else if (ui_lexical_core.$isTabNode(firstOfLine)) {
								firstOfLine.remove();
							}
						}
					}
				}
				return true;
			}

			// Just one line
			const selectionNodes = selection.getNodes();
			const firstNode = selectionNodes[0];
			if ($isCodeNode(firstNode)) {
				// CodeNode is empty
				if (type === ui_lexical_core.INDENT_CONTENT_COMMAND) {
					selection.insertNodes([ui_lexical_core.$createTabNode()]);
				}
				return true;
			}
			const firstOfLine = getFirstCodeNodeOfLine(firstNode);
			if (type === ui_lexical_core.INDENT_CONTENT_COMMAND) {
				if (ui_lexical_core.$isLineBreakNode(firstOfLine)) {
					firstOfLine.insertAfter(ui_lexical_core.$createTabNode());
				} else {
					// eslint-disable-next-line @bitrix24/bitrix24-rules/no-native-dom-methods
					firstOfLine.insertBefore(ui_lexical_core.$createTabNode());
				}
			} else if (ui_lexical_core.$isTabNode(firstOfLine)) {
				firstOfLine.remove();
			}
			return true;
		}
	}
	function $isSelectionInCode(selection) {
		if (!ui_lexical_core.$isRangeSelection(selection)) {
			return false;
		}
		const anchorNode = selection.anchor.getNode();
		const focusNode = selection.focus.getNode();
		if (anchorNode.is(focusNode) && $isCodeNode(anchorNode)) {
			return true;
		}
		const anchorParent = anchorNode.getParent();
		return $isCodeNode(anchorParent) && anchorParent.is(focusNode.getParent());
	}
	function $getCodeLines(selection) {
		const nodes = selection.getNodes();
		const lines = [[]];
		if (nodes.length === 1 && $isCodeNode(nodes[0])) {
			return lines;
		}
		let lastLine = lines[0];
		for (const [i, node] of nodes.entries()) {
			if (ui_lexical_core.$isLineBreakNode(node)) {
				if (i !== 0 && lastLine.length > 0) {
					lastLine = [];
					lines.push(lastLine);
				}
			} else {
				lastLine.push(node);
			}
		}
		return lines;
	}
	function getFirstCodeNodeOfLine(anchor) {
		let previousNode = anchor;
		let node = anchor;
		while ($isCodeTokenNode(node) || ui_lexical_core.$isTabNode(node)) {
			previousNode = node;
			node = node.getPreviousSibling();
		}
		return previousNode;
	}
	function getLastCodeNodeOfLine(anchor) {
		let nextNode = anchor;
		let node = anchor;
		while ($isCodeTokenNode(node) || ui_lexical_core.$isTabNode(node)) {
			nextNode = node;
			node = node.getNextSibling();
		}
		return nextNode;
	}
	// Finds minimal diff range between two nodes lists. It returns from/to range boundaries of prevNodes
	// that needs to be replaced with `nodes` (subset of nextNodes) to make prevNodes equal to nextNodes.
	function getDiffRange(prevNodes, nextNodes) {
		let leadingMatch = 0;
		while (leadingMatch < prevNodes.length) {
			if (!isEqual(prevNodes[leadingMatch], nextNodes[leadingMatch])) {
				break;
			}
			leadingMatch++;
		}
		const prevNodesLength = prevNodes.length;
		const nextNodesLength = nextNodes.length;
		const maxTrailingMatch = Math.min(prevNodesLength, nextNodesLength) - leadingMatch;
		let trailingMatch = 0;
		while (trailingMatch < maxTrailingMatch) {
			trailingMatch++;
			if (!isEqual(prevNodes[prevNodesLength - trailingMatch], nextNodes[nextNodesLength - trailingMatch])) {
				trailingMatch--;
				break;
			}
		}
		const from = leadingMatch;
		const to = prevNodesLength - trailingMatch;
		const nodesForReplacement = nextNodes.slice(leadingMatch, nextNodesLength - trailingMatch);
		return {
			from,
			nodesForReplacement,
			to
		};
	}
	function isEqual(nodeA, nodeB) {
		// Only checking for code token nodes, tabs and linebreaks. If it's regular text node
		// returning false so that it's transformed into code token node
		return $isCodeTokenNode(nodeA) && $isCodeTokenNode(nodeB) && nodeA.__text === nodeB.__text && nodeA.__highlightType === nodeB.__highlightType || ui_lexical_core.$isTabNode(nodeA) && ui_lexical_core.$isTabNode(nodeB) || ui_lexical_core.$isLineBreakNode(nodeA) && ui_lexical_core.$isLineBreakNode(nodeB);
	}
	function getCodeTokenNodes(tokens) {
		const nodes = [];
		tokens.forEach(token => {
			const partials = token.content.split(/([\t\n])/);
			const partialsLength = partials.length;
			for (let i = 0; i < partialsLength; i++) {
				const part = partials[i];
				if (part === '\n' || part === '\r\n') {
					nodes.push(ui_lexical_core.$createLineBreakNode());
				} else if (part === '\t') {
					nodes.push(ui_lexical_core.$createTabNode());
				} else if (part.length > 0) {
					nodes.push($createCodeTokenNode(part, token.type));
				}
			}
		});
		return nodes;
	}

	// Wrapping update function into selection retainer, that tries to keep cursor at the same
	// position as before.
	function updateAndRetainSelection(nodeKey, updateFn) {
		const node = ui_lexical_core.$getNodeByKey(nodeKey);
		if (!$isCodeNode(node) || !node.isAttached()) {
			return;
		}

		// If it's not range selection (or null selection) there's no need to change it,
		// but we can still run highlighting logic
		const selection = ui_lexical_core.$getSelection();
		if (!ui_lexical_core.$isRangeSelection(selection)) {
			updateFn();
			return;
		}
		const anchor = selection.anchor;
		const anchorOffset = anchor.offset;
		const isNewLineAnchor = anchor.type === 'element' && ui_lexical_core.$isLineBreakNode(node.getChildAtIndex(anchor.offset - 1));

		// Calculating previous text offset (all text node prior to anchor + anchor own text offset)
		let textOffset = 0;
		if (!isNewLineAnchor) {
			const anchorNode = anchor.getNode();
			textOffset = anchorOffset + anchorNode.getPreviousSiblings().reduce((offset, _node) => {
				return offset + _node.getTextContentSize();
			}, 0);
		}
		const hasChanges = updateFn();
		if (!hasChanges) {
			return;
		}

		// Non-text anchors only happen for line breaks, otherwise
		// selection will be within text node (code token node)
		if (isNewLineAnchor) {
			anchor.getNode().select(anchorOffset, anchorOffset);
			return;
		}

		// If it was non-element anchor then we walk through child nodes
		// and looking for a position of original text offset
		node.getChildren().some(child => {
			const isText = ui_lexical_core.$isTextNode(child);
			if (isText || ui_lexical_core.$isLineBreakNode(child)) {
				const textContentSize = child.getTextContentSize();
				if (isText && textContentSize >= textOffset) {
					child.select(textOffset, textOffset);
					return true;
				}
				textOffset -= textContentSize;
			}
			return false;
		});
	}

	var Code = /*#__PURE__*/Object.freeze({
		__proto__: null,
		$createCodeNode: $createCodeNode,
		$createCodeTokenNode: $createCodeTokenNode,
		$isCodeNode: $isCodeNode,
		$isCodeTokenNode: $isCodeTokenNode,
		CodeNode: CodeNode,
		CodePlugin: CodePlugin,
		CodeTokenNode: CodeTokenNode,
		FORMAT_CODE_COMMAND: FORMAT_CODE_COMMAND,
		INSERT_CODE_COMMAND: INSERT_CODE_COMMAND,
		TOGGLE_CODE_COMMAND: TOGGLE_CODE_COMMAND,
		getFirstCodeNodeOfLine: getFirstCodeNodeOfLine,
		getLastCodeNodeOfLine: getLastCodeNodeOfLine
	});

	function isNodeSelected(editor, key) {
		return editor.getEditorState().read(() => {
			const node = ui_lexical_core.$getNodeByKey(key);
			if (node === null) {
				return false;
			}
			return node.isSelected();
		});
	}
	function createNodeSelection(editor, key) {
		let isSelected = false;
		const subscribers = new Set();
		const onSelect = fn => {
			subscribers.add(fn);
		};
		const unregisterListener = ui_lexical_utils.mergeRegister(editor.registerUpdateListener(() => {
			isSelected = isNodeSelected(editor, key);
			for (const subscribeFunc of subscribers) {
				subscribeFunc(isSelected);
			}
		}), editor.registerEditableListener(isEditable => {
			isSelected = isNodeSelected(editor, key);
			for (const subscribeFunc of subscribers) {
				subscribeFunc(isSelected && isEditable);
			}
		}));
		const setSelected = selected => {
			editor.update(() => {
				let selection = ui_lexical_core.$getSelection();
				if (!ui_lexical_core.$isNodeSelection(selection)) {
					selection = ui_lexical_core.$createNodeSelection();
					ui_lexical_core.$setSelection(selection);
				}
				if (selected) {
					selection.add(key);
				} else {
					selection.delete(key);
				}
			});
		};
		const clearSelection = () => {
			editor.update(() => {
				const selection = ui_lexical_core.$getSelection();
				if (ui_lexical_core.$isNodeSelection(selection)) {
					selection.clear();
				}
			});
		};
		return {
			isSelected: () => {
				return isSelected;
			},
			dispose: () => {
				unregisterListener();
			},
			onSelect,
			setSelected,
			clearSelection
		};
	}

	class DecoratorComponent {
		#textEditor = null;
		#target = null;
		#nodeKey = null;
		#options = {};
		#nodeSelection = null;
		#unregisterCommands = null;
		constructor(componentOptions) {
			const {
				textEditor,
				target,
				nodeKey,
				options
			} = componentOptions;
			this.#textEditor = textEditor;
			this.#target = target;
			this.#nodeKey = nodeKey;
			this.#options = options;
			this.#nodeSelection = createNodeSelection(this.getEditor(), this.getNodeKey());
			this.#nodeSelection.onSelect(selected => {
				if (selected) {
					main_core.Dom.addClass(this.getTarget(), '--selected');
				} else {
					main_core.Dom.removeClass(this.getTarget(), '--selected');
				}
			});
			this.#unregisterCommands = this.#registerCommands();
		}
		update(options) {
			// update
		}
		destroy() {
			this.#nodeSelection.dispose();
			this.#unregisterCommands();
		}
		getEditor() {
			return this.#textEditor;
		}
		getNodeKey() {
			return this.#nodeKey;
		}
		getTarget() {
			return this.#target;
		}
		getNodeSelection() {
			return this.#nodeSelection;
		}
		isSelected() {
			return this.#nodeSelection.isSelected();
		}
		setSelected(selected) {
			this.#nodeSelection.setSelected(selected);
		}
		getOptions() {
			return this.#options;
		}
		getOption(option, defaultValue) {
			if (!main_core.Type.isUndefined(this.#options[option])) {
				return this.#options[option];
			}
			if (!main_core.Type.isUndefined(defaultValue)) {
				return defaultValue;
			}
			return null;
		}
		#registerCommands() {
			return ui_lexical_utils.mergeRegister(this.getEditor().registerCommand(ui_lexical_core.CLICK_COMMAND, event => {
				if (!this.getEditor().isEditable()) {
					return false;
				}
				if (this.getTarget().contains(event.target)) {
					if (event.shiftKey) {
						this.#nodeSelection.setSelected(!this.#nodeSelection.isSelected());
					} else {
						this.#nodeSelection.clearSelection();
						this.#nodeSelection.setSelected(true);
					}
					return true;
				}
				return false;
			}, ui_lexical_core.COMMAND_PRIORITY_LOW), this.getEditor().registerCommand(ui_lexical_core.KEY_DELETE_COMMAND, this.#handleDelete.bind(this), ui_lexical_core.COMMAND_PRIORITY_LOW), this.getEditor().registerCommand(ui_lexical_core.KEY_BACKSPACE_COMMAND, this.#handleDelete.bind(this), ui_lexical_core.COMMAND_PRIORITY_LOW));
		}
		#handleDelete(event) {
			if (this.#nodeSelection.isSelected() && ui_lexical_core.$isNodeSelection(ui_lexical_core.$getSelection())) {
				event.preventDefault();
				const node = ui_lexical_core.$getNodeByKey(this.getNodeKey());
				this.#nodeSelection.setSelected(false);
				if (node) {
					node.remove();
					return true;
				}
			}
			return false;
		}
	}

	function clamp(value, min, max) {
		return Math.min(Math.max(value, min), max);
	}
	const Direction$1 = {
		EAST: 1,
		SOUTH: 2,
		WEST: 4,
		NORTH: 8
	};
	class FigureResizer extends main_core_events.EventEmitter {
		#positioning = {
			currentHeight: 0,
			currentWidth: 0,
			direction: 0,
			isResizing: false,
			ratio: 0,
			startHeight: 0,
			startWidth: 0,
			startX: 0,
			startY: 0
		};
		#freeTransform = false;
		#onPointerDownHandler = null;
		#onPointerMoveHandler = null;
		#onPointerUpHandler = null;
		#container = null;
		#target = null;
		#editor = null;
		#maxWidth = 'none';
		#maxHeight = 'none';
		#minWidth = 16;
		#minHeight = 16;
		constructor({
			target,
			editor,
			originalWidth,
			originalHeight,
			minWidth,
			minHeight,
			maxWidth,
			maxHeight,
			events,
			freeTransform
		}) {
			super();
			this.setEventNamespace('BX.UI.TextEditor.FigureResizer');
			this.#target = target;
			this.#editor = editor;
			this.#minWidth = Math.min(Math.max(this.#minWidth, main_core.Type.isNumber(minWidth) ? minWidth : this.#minWidth), main_core.Type.isNumber(originalWidth) ? originalWidth : Infinity);
			this.#minHeight = Math.min(Math.max(this.#minHeight, main_core.Type.isNumber(minHeight) ? minHeight : this.#minHeight), main_core.Type.isNumber(originalHeight) ? originalHeight : Infinity);
			this.#maxWidth = main_core.Type.isNumber(maxWidth) ? maxWidth : 'none';
			this.#maxHeight = main_core.Type.isNumber(maxHeight) ? maxHeight : 'none';
			this.#freeTransform = freeTransform === true;
			this.#onPointerDownHandler = this.#handlePointerDown.bind(this);
			this.#onPointerMoveHandler = this.#handlePointerMove.bind(this);
			this.#onPointerUpHandler = this.#handlePointerUp.bind(this);
			this.subscribeFromOptions(events);
		}
		show() {
			main_core.Dom.addClass(this.getContainer(), '--shown');
		}
		hide() {
			main_core.Dom.removeClass(this.getContainer(), '--shown');
		}
		getContainer() {
			if (this.#container === null) {
				const freeTransform = main_core.Tag.render`
				<div
					class="ui-text-editor-figure-resizer-handle --north"
					data-direction="${Direction$1.NORTH}"
					onpointerdown="${this.#onPointerDownHandler}"
					></div>
				<div
					class="ui-text-editor-figure-resizer-handle --east"
					data-direction="${Direction$1.EAST}"
					onpointerdown="${this.#onPointerDownHandler}"
					></div>
				<div
					class="ui-text-editor-figure-resizer-handle --south"
					data-direction="${Direction$1.SOUTH}"
					onpointerdown="${this.#onPointerDownHandler}"
					></div>
				<div
					class="ui-text-editor-figure-resizer-handle --west"
					data-direction="${Direction$1.WEST}"
					onpointerdown="${this.#onPointerDownHandler}"
					></div>
			`;
				this.#container = main_core.Tag.render`
				<div class="ui-text-editor-figure-resizer">
					<div
						class="ui-text-editor-figure-resizer-handle --north-east"
						data-direction="${Direction$1.NORTH | Direction$1.EAST}" 
						onpointerdown="${this.#onPointerDownHandler}"
					></div>
					<div
						class="ui-text-editor-figure-resizer-handle --south-east"
						data-direction="${Direction$1.SOUTH | Direction$1.EAST}" 
						onpointerdown="${this.#onPointerDownHandler}"
						></div>
					<div
						class="ui-text-editor-figure-resizer-handle --south-west"
						data-direction="${Direction$1.SOUTH | Direction$1.WEST}" 
						onpointerdown="${this.#onPointerDownHandler}"
						></div>
					<div 
						class="ui-text-editor-figure-resizer-handle --north-west"
						data-direction="${Direction$1.NORTH | Direction$1.WEST}" 
						onpointerdown="${this.#onPointerDownHandler}"
						></div>
					${this.#freeTransform ? freeTransform : null}
				</div>
			`;
			}
			return this.#container;
		}
		getTarget() {
			return this.#target;
		}
		setTarget(target) {
			this.#target = target;
		}
		getEditor() {
			return this.#editor;
		}
		isResizing() {
			return this.#positioning.isResizing;
		}
		#handlePointerDown(event) {
			if (!this.getEditor().isEditable()) {
				return;
			}
			event.preventDefault();
			const direction = Number(event.target.dataset.direction);
			const target = this.getTarget();
			const {
				width,
				height
			} = target.getBoundingClientRect();
			this.#positioning.startWidth = width;
			this.#positioning.startHeight = height;
			this.#positioning.ratio = width / height;
			this.#positioning.currentWidth = width;
			this.#positioning.currentHeight = height;
			this.#positioning.startX = event.clientX;
			this.#positioning.startY = event.clientY;
			this.#positioning.isResizing = true;
			this.#positioning.direction = direction;

			// setStartCursor(direction);
			this.emit('onResizeStart');
			main_core.Dom.addClass(this.getContainer(), '--resizing');
			main_core.Dom.style(target, {
				width: `${width}px`,
				height: `${height}px`
			});
			main_core.Event.bind(document, 'pointermove', this.#onPointerMoveHandler);
			main_core.Event.bind(document, 'pointerup', this.#onPointerUpHandler);
		}
		#handlePointerMove(event) {
			const target = this.getTarget();
			const isHorizontal = this.#positioning.direction & (Direction$1.EAST | Direction$1.WEST);
			const isVertical = this.#positioning.direction & (Direction$1.SOUTH | Direction$1.NORTH);
			if (this.#positioning.isResizing) {
				// Corner cursor
				if (isHorizontal && isVertical) {
					let diff = Math.floor(this.#positioning.startX - event.clientX);
					diff = this.#positioning.direction & Direction$1.EAST ? -diff : diff;
					const width = Math.round(clamp(this.#positioning.startWidth + diff, this.#minWidth, this.#getMaxContainerWidth()));
					const height = Math.ceil(width / this.#positioning.ratio);
					main_core.Dom.style(target, {
						width: `${width}px`,
						height: `${height}px`
					});
					this.emit('onResize', {
						width,
						height
					});
					this.#positioning.currentHeight = height;
					this.#positioning.currentWidth = width;
				} else if (isVertical) {
					let diff = Math.floor(this.#positioning.startY - event.clientY);
					diff = this.#positioning.direction & Direction$1.SOUTH ? -diff : diff;
					const height = Math.round(Math.max(this.#positioning.startHeight + diff, this.#minHeight
					// this.#getMaxContainerHeight(),
					));
					main_core.Dom.style(target, 'height', `${height}px`);
					this.emit('onResize', {
						width: this.#positioning.currentWidth,
						height
					});
					this.#positioning.currentHeight = height;
				} else {
					let diff = Math.floor(this.#positioning.startX - event.clientX);
					diff = this.#positioning.direction & Direction$1.EAST ? -diff : diff;
					const width = Math.round(clamp(this.#positioning.startWidth + diff, this.#minWidth, this.#getMaxContainerWidth()));
					main_core.Dom.style(target, 'width', `${width}px`);
					this.emit('onResize', {
						width,
						height: this.#positioning.currentHeight
					});
					this.#positioning.currentWidth = width;
				}
			}
		}
		#handlePointerUp() {
			if (this.#positioning.isResizing) {
				setTimeout(() => {
					const width = this.#positioning.currentWidth;
					const height = this.#positioning.currentHeight;
					this.#positioning.startWidth = 0;
					this.#positioning.startHeight = 0;
					this.#positioning.ratio = 0;
					this.#positioning.startX = 0;
					this.#positioning.startY = 0;
					this.#positioning.currentWidth = 0;
					this.#positioning.currentHeight = 0;
					this.#positioning.isResizing = false;
					main_core.Dom.removeClass(this.getContainer(), '--resizing');
					this.emit('onResizeEnd', {
						width,
						height
					});
					// setEndCursor();

					main_core.Event.unbind(document, 'pointermove', this.#onPointerMoveHandler);
					main_core.Event.unbind(document, 'pointerup', this.#onPointerUpHandler);
				}, 200);
			}
		}
		#getMaxContainerWidth() {
			const maxWidth = main_core.Type.isNumber(this.#maxWidth) ? this.#maxWidth : Infinity;
			const editorRootElement = this.getEditor().getRootElement();
			if (editorRootElement !== null) {
				return Math.min(editorRootElement.getBoundingClientRect().width - 20, maxWidth);
			}
			return 100;
		}
		#getMaxContainerHeight() {
			if (main_core.Type.isNumber(this.#maxHeight)) {
				return this.#maxHeight;
			}
			const editorRootElement = this.getEditor().getRootElement();
			if (editorRootElement !== null) {
				return editorRootElement.getBoundingClientRect().height - 20;
			}
			return 100;
		}
	}

	class FileImageComponent extends DecoratorComponent {
		#refs = new main_core_cache.MemoryCache();
		#figureResizer = null;
		constructor(options) {
			super(options);
			this.#figureResizer = new FigureResizer({
				target: this.getImage(),
				editor: this.getEditor(),
				originalWidth: this.getOption('width'),
				originalHeight: this.getOption('height'),
				events: {
					onResizeStart: this.#handleResizeStart.bind(this),
					onResizeEnd: this.#handleResizeEnd.bind(this)
				}
			});
			this.getNodeSelection().onSelect(selected => {
				if (selected || this.#figureResizer.isResizing()) {
					main_core.Dom.addClass(this.#getContainer(), '--selected');
					this.#figureResizer.show();
				} else {
					main_core.Dom.removeClass(this.#getContainer(), '--selected');
					this.#figureResizer.hide();
				}
				const draggable = selected && !this.#figureResizer.isResizing();
				this.#setDraggable(draggable);
			});
			this.update(this.getOptions());
			this.#render();
		}
		#render() {
			main_core.Dom.append(this.#getContainer(), this.getTarget());
		}
		#getContainer() {
			return this.#refs.remember('container', () => {
				const figureResizer = this.#figureResizer.getContainer();
				return main_core.Tag.render`
				<div class="ui-text-editor-file-image-component">
					${this.#getImageContainer()}
					${figureResizer}
				</div>
			`;
			});
		}
		#getImageContainer() {
			return this.#refs.remember('image-container', () => {
				return main_core.Tag.render`
				<div class="ui-text-editor-file-image-container">
					${this.getImage()}
				</div>
			`;
			});
		}
		#setDraggable(draggable) {
			main_core.Dom.attr(this.#getImageContainer(), {
				draggable
			});
			if (draggable) {
				main_core.Dom.addClass(this.#getContainer(), '--draggable');
			} else {
				main_core.Dom.removeClass(this.#getContainer(), '--draggable');
			}
		}
		#handleResizeStart(event) {
			this.#setDraggable(false);
			this.setSelected(true);
		}
		#handleResizeEnd(event) {
			this.setSelected(true);
			this.getEditor().update(() => {
				const node = ui_lexical_core.$getNodeByKey(this.getNodeKey());
				if ($isFileImageNode(node)) {
					const {
						width,
						height
					} = event.getData();
					node.setWidthAndHeight(width, height);
				}
			});
		}
		getImage() {
			return this.#refs.remember('image', () => {
				const img = document.createElement('img');
				img.draggable = false;
				img.src = this.getOption('src');
				const config = this.getOption('config', {});
				if (config?.theme?.image?.img) {
					img.className = config.theme.image.img;
				}
				return img;
			});
		}
		update(options) {
			const width = options.width > 0 ? `${options.width}px` : 'inherit';
			const aspectRatio = options.width > 0 && options.height > 0 ? `${options.width} / ${options.height}` : 'auto';
			main_core.Dom.style(this.getImage(), {
				width,
				height: 'auto',
				aspectRatio
			});
		}
	}

	/* eslint-disable no-underscore-dangle, @bitrix24/bitrix24-rules/no-pseudo-private */


	/** @memberof BX.UI.TextEditor.Plugins.File */
	class FileImageNode extends ui_lexical_core.DecoratorNode {
		constructor(serverFileId, info, width, height, key) {
			super(key);
			this.__serverFileId = serverFileId;
			this.__info = main_core.Type.isPlainObject(info) ? info : {};
			this.__width = main_core.Type.isNumber(width) && width > 0 ? Math.round(width) : this.__info.previewWidth;
			this.__height = main_core.Type.isNumber(height) && height > 0 ? Math.round(height) : this.__info.previewHeight;
		}
		static useDecoratorComponent = true;
		static getType() {
			return 'file-image';
		}
		static clone(node) {
			return new FileImageNode(node.__serverFileId, node.__info, node.__width, node.__height, node.__key);
		}
		getId() {
			return this.__serverFileId;
		}
		getServerFileId() {
			return this.__serverFileId;
		}
		getInfo() {
			return this.__info;
		}
		setWidthAndHeight(width, height) {
			const writable = this.getWritable();
			if (main_core.Type.isNumber(width)) {
				writable.__width = Math.round(width);
			}
			if (main_core.Type.isNumber(height)) {
				writable.__height = Math.round(height);
			}
		}
		getWidth() {
			const self = this.getLatest();
			return self.__width;
		}
		getHeight() {
			const self = this.getLatest();
			return self.__height;
		}
		isResized() {
			return this.__info.previewWidth !== this.getWidth() || this.__info.previewHeight !== this.getHeight();
		}
		static importJSON(serializedNode) {
			return $createFileImageNode(serializedNode.serverFileId, serializedNode.info, serializedNode.width, serializedNode.height);
		}
		static importDOM() {
			return {
				img: domNode => {
					if (!domNode.hasAttribute('data-file-image-id')) {
						return null;
					}
					return {
						conversion: img => {
							const {
								fileImageId,
								fileImageInfo
							} = img.dataset;
							let info = null;
							try {
								info = JSON.parse(fileImageInfo);
							} catch {
								return null;
							}
							const node = $createFileImageNode(fileImageId, info);
							return {
								node
							};
						},
						priority: 1
					};
				}
			};
		}
		exportDOM() {
			return {
				element: null
			};
		}
		exportJSON() {
			return {
				info: this.__info,
				serverFileId: this.__serverFileId,
				width: this.getWidth(),
				height: this.getHeight(),
				type: 'file-image',
				version: 1
			};
		}
		createDOM(config, editor) {
			const span = document.createElement('span');
			if (main_core.Type.isStringFilled(config?.theme?.image?.container)) {
				main_core.Dom.addClass(span, config.theme.image.container);
			}
			return span;
		}
		updateDOM(prevNode, anchor, config) {
			return false;
		}
		decorate(editor, config) {
			return {
				componentClass: FileImageComponent,
				options: {
					src: this.__info.previewUrl,
					width: this.getWidth(),
					height: this.getHeight(),
					maxWidth: this.getWidth(),
					maxHeight: this.getHeight(),
					config
					// maxWidth: this.__info.previewWidth,
					// maxHeight: this.__info.previewHeight,
				}
			};
		}
		isInline() {
			return true;
		}
	}
	function $createFileImageNode(serverFileId, info = {}, width = null, height = null) {
		return new FileImageNode(serverFileId, info, width, height);
	}
	function $isFileImageNode(node) {
		return node instanceof FileImageNode;
	}

	/* eslint-disable no-underscore-dangle, @bitrix24/bitrix24-rules/no-pseudo-private */


	/** @memberof BX.UI.TextEditor.Plugins.File */
	class FileNode extends ui_lexical_core.TextNode {
		constructor(serverFileId, info, key) {
			const fileInfo = main_core.Type.isPlainObject(info) ? info : {};
			super(fileInfo.name || '', key);
			this.__serverFileId = serverFileId;
			this.__info = fileInfo;
		}
		static getType() {
			return 'file';
		}
		static clone(node) {
			return new FileNode(node.__serverFileId, node.__info, node.__key);
		}
		getId() {
			return this.__serverFileId;
		}
		getServerFileId() {
			return this.__serverFileId;
		}
		getInfo() {
			return this.__info;
		}
		getName() {
			return this.__info.name || 'unknown';
		}
		static importJSON(serializedNode) {
			return $createFileNode(serializedNode.serverFileId, serializedNode.info);
		}
		static importDOM() {
			return {
				span: domNode => {
					if (!domNode.hasAttribute('data-file-id')) {
						return null;
					}
					return {
						conversion: span => {
							const {
								fileId,
								fileInfo
							} = domNode.dataset;
							let info = null;
							try {
								info = JSON.parse(fileInfo);
							} catch {
								return null;
							}
							const node = $createFileNode(fileId, info);
							return {
								node
							};
						},
						priority: 1
					};
				}
			};
		}
		exportDOM() {
			const element = document.createElement('span');
			element.textContent = this.getName();
			element.setAttribute('data-file-id', this.__serverFileId);
			element.setAttribute('data-file-info', JSON.stringify(this.__info));
			return {
				element
			};
		}
		exportJSON() {
			return {
				...super.exportJSON(),
				info: this.__info,
				serverFileId: this.__serverFileId,
				type: 'file',
				version: 1
			};
		}
		createDOM(config, editor) {
			const span = document.createElement('span');
			if (main_core.Type.isStringFilled(config?.theme?.file)) {
				main_core.Dom.addClass(span, config.theme.file);
			}
			span.textContent = this.getName();
			return span;
		}
		updateDOM(prevNode, anchor, config) {
			return false;
		}
	}
	function $createFileNode(serverFileId, info = {}) {
		return new FileNode(serverFileId, info).setMode('token');
	}
	function $isFileNode(node) {
		return node instanceof FileNode;
	}

	function calcImageSize(previewWidth, previewHeight, renderWidth, renderHeight) {
		const ratioWidth = renderWidth / previewWidth;
		const ratioHeight = renderHeight / previewHeight;
		const ratio = Math.min(ratioWidth, ratioHeight);
		const useOriginalSize = ratio > 1; // image is too small
		const width = useOriginalSize ? previewWidth : previewWidth * ratio;
		const height = useOriginalSize ? previewHeight : previewHeight * ratio;
		return [width, height];
	}

	class FileVideoComponent extends DecoratorComponent {
		#refs = new main_core_cache.MemoryCache();
		#figureResizer = null;
		constructor(options) {
			super(options);
			this.#figureResizer = new FigureResizer({
				target: this.#getVideo(),
				editor: this.getEditor(),
				minWidth: 120,
				minHeight: 120,
				events: {
					onResize: this.#handleResize.bind(this),
					onResizeEnd: this.#handleResizeEnd.bind(this)
				}
			});
			this.getNodeSelection().onSelect(selected => {
				if (selected || this.#figureResizer.isResizing()) {
					main_core.Dom.addClass(this.#getContainer(), '--selected');
					this.#figureResizer.show();
				} else {
					main_core.Dom.removeClass(this.#getContainer(), '--selected');
					this.#figureResizer.hide();
				}
				this.#setDraggable(selected);
			});
			this.update(this.getOptions());
			this.#render();
		}
		#render() {
			main_core.Dom.append(this.#getContainer(), this.getTarget());
		}
		#getContainer() {
			return this.#refs.remember('container', () => {
				return main_core.Tag.render`
				<div class="ui-text-editor-video-component">
					<div class="ui-text-editor-video-object-container">${this.#getVideo()}</div>
					${this.#figureResizer.getContainer()}
				</div>
			`;
			});
		}
		#getVideo() {
			return this.#refs.remember('video', () => {
				const video = main_core.Dom.create({
					tag: 'video',
					attrs: {
						controls: true,
						preload: 'metadata',
						playsinline: true,
						src: this.getOption('src')
					},
					events: {
						loadedmetadata: event => {
							this.getEditor().update(() => {
								const node = ui_lexical_core.$getNodeByKey(this.getNodeKey());
								if ($isFileVideoNode(node) && node.getWidth() === 0) {
									const [width, height] = calcImageSize(event.target.videoWidth, event.target.videoHeight, 600, 600);
									node.setWidthAndHeight(width, height);
								}
							});
						}
					}
				});
				const config = this.getOption('config', {});
				if (config?.theme?.video?.object) {
					video.className = config.theme.video.object;
				}
				return video;
			});
		}
		#handleResize(event) {
			this.update(event.getData());
		}
		#handleResizeEnd(event) {
			this.setSelected(true);
			this.getEditor().update(() => {
				const node = ui_lexical_core.$getNodeByKey(this.getNodeKey());
				if ($isFileVideoNode(node)) {
					const {
						width,
						height
					} = event.getData();
					node.setWidthAndHeight(width, height);
				}
			});
		}
		#setDraggable(draggable) {
			main_core.Dom.attr(this.#getContainer(), {
				draggable
			});
			if (draggable) {
				main_core.Dom.addClass(this.#getContainer(), '--draggable');
			} else {
				main_core.Dom.removeClass(this.#getContainer(), '--draggable');
			}
		}
		update(options) {
			const width = main_core.Type.isNumber(options.width) && options.width > 0 ? options.width : null;
			const height = main_core.Type.isNumber(options.height) && options.height > 0 ? options.height : null;
			const aspectRatio = width > 0 && height > 0 ? `${width} / ${height}` : 'auto';
			main_core.Dom.adjust(this.#getVideo(), {
				attrs: {
					width,
					height: null
				},
				style: {
					width,
					height: 'auto',
					aspectRatio
				}
			});
		}
	}

	/* eslint-disable no-underscore-dangle, @bitrix24/bitrix24-rules/no-pseudo-private */


	/** @memberof BX.UI.TextEditor.Plugins.File */
	class FileVideoNode extends ui_lexical_core.DecoratorNode {
		__width = 0;
		__height = 0;
		constructor(serverFileId, info, width, height, key) {
			super(key);
			this.__serverFileId = serverFileId;
			this.__info = main_core.Type.isPlainObject(info) ? info : {};
			this.__width = main_core.Type.isNumber(width) && width > 0 ? Math.round(width) : this.__info.previewWidth > 0 ? this.__info.previewWidth : this.__width;
			this.__height = main_core.Type.isNumber(height) && height > 0 ? Math.round(height) : this.__info.previewHeight > 0 ? this.__info.previewHeight : this.__height;
		}
		static useDecoratorComponent = true;
		static getType() {
			return 'file-video';
		}
		static clone(node) {
			return new FileVideoNode(node.__serverFileId, node.__info, node.__width, node.__height, node.__key);
		}
		getId() {
			return this.__serverFileId;
		}
		getServerFileId() {
			return this.__serverFileId;
		}
		getInfo() {
			return this.__info;
		}
		setWidthAndHeight(width, height) {
			const writable = this.getWritable();
			if (main_core.Type.isNumber(width)) {
				writable.__width = Math.round(width);
			}
			if (main_core.Type.isNumber(height)) {
				writable.__height = Math.round(height);
			}
		}
		getWidth() {
			const self = this.getLatest();
			return self.__width;
		}
		getHeight() {
			const self = this.getLatest();
			return self.__height;
		}
		static importJSON(serializedNode) {
			return $createFileVideoNode(serializedNode.serverFileId, serializedNode.info, serializedNode.width, serializedNode.height);
		}
		static importDOM() {
			return null;
		}
		exportDOM() {
			return {
				element: null
			};
		}
		exportJSON() {
			return {
				info: this.__info,
				serverFileId: this.__serverFileId,
				width: this.getWidth(),
				height: this.getHeight(),
				type: 'file-video',
				version: 1
			};
		}
		createDOM(config, editor) {
			const div = document.createElement('span');
			if (main_core.Type.isStringFilled(config?.theme?.video?.container)) {
				main_core.Dom.addClass(div, config.theme.video.container);
			}
			return div;
		}
		updateDOM(prevNode, anchor, config) {
			return false;
		}
		decorate(editor, config) {
			return {
				componentClass: FileVideoComponent,
				options: {
					src: this.__info.downloadUrl,
					width: this.getWidth(),
					height: this.getHeight(),
					maxWidth: this.getWidth(),
					maxHeight: this.getHeight(),
					config
				}
			};
		}
		isInline() {
			return true;
		}
	}
	function $createFileVideoNode(serverFileId, info = {}, width = null, height = null) {
		const node = new FileVideoNode(serverFileId, info, width, height);
		return ui_lexical_core.$applyNodeReplacement(node);
	}
	function $isFileVideoNode(node) {
		return node instanceof FileVideoNode;
	}

	function getDragSelection(event) {
		const target = event.target;
		let targetWindow = null;
		if (target !== null) {
			targetWindow = target.nodeType === 9 ? target.defaultView : target.ownerDocument.defaultView;
		}
		let range = null;
		const domSelection = (targetWindow || window).getSelection();
		if (document.caretRangeFromPoint) {
			range = document.caretRangeFromPoint(event.clientX, event.clientY);
		} else if (event.rangeParent && domSelection !== null) {
			domSelection.collapse(event.rangeParent, event.rangeOffset || 0);
			range = domSelection.getRangeAt(0);
		} else {
			throw new Error('Cannot get the selection when dragging');
		}
		return range;
	}

	function getNodeInSelection(predicate) {
		const selection = ui_lexical_core.$getSelection();
		if (!ui_lexical_core.$isNodeSelection(selection)) {
			return null;
		}
		const nodes = selection.getNodes();
		const node = nodes[0];
		return predicate(node) ? node : null;
	}

	const DRAG_DATA_FORMAT$1 = 'application/x-lexical-drag-image';
	const TRANSPARENT_IMAGE = main_core.Tag.render`<img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7">`;
	function registerDraggableNode(editor, targetNode, onDrop) {
		const isTargetNode = node => {
			return node instanceof targetNode;
		};
		const getDraggableNode = () => {
			return getNodeInSelection(node => isTargetNode(node));
		};
		return ui_lexical_utils.mergeRegister(editor.registerCommand(ui_lexical_core.DRAGSTART_COMMAND, event => {
			const draggableNode = getDraggableNode();
			if (!draggableNode) {
				return false;
			}
			const success = handleDragStart(event, draggableNode);
			if (success) {
				editor.dispatchCommand(DRAG_START_COMMAND);
			}
			return success;
		}, ui_lexical_core.COMMAND_PRIORITY_HIGH), editor.registerCommand(ui_lexical_core.DRAGOVER_COMMAND, event => {
			const draggableNode = getDraggableNode();
			if (!draggableNode) {
				return false;
			}
			return handleDragOver(event, editor);
		}, ui_lexical_core.COMMAND_PRIORITY_LOW), editor.registerCommand(ui_lexical_core.DROP_COMMAND, event => {
			const draggableNode = getDraggableNode();
			if (!draggableNode) {
				return false;
			}
			editor.dispatchCommand(DRAG_END_COMMAND);
			return handleDragDrop(event, editor, draggableNode, onDrop);
		}, ui_lexical_core.COMMAND_PRIORITY_HIGH));
	}
	function handleDragStart(event, draggableNode) {
		const dataTransfer = event.dataTransfer;
		if (!dataTransfer) {
			return false;
		}
		dataTransfer.setData('text/plain', '_');
		dataTransfer.setDragImage(TRANSPARENT_IMAGE, 0, 0);
		dataTransfer.setData(DRAG_DATA_FORMAT$1, JSON.stringify({
			data: draggableNode.exportJSON(),
			type: draggableNode.getType()
		}));
		return true;
	}
	function handleDragOver(event, editor) {
		if (!canDrop(event, editor)) {
			event.preventDefault();
		}
		return true;
	}
	function handleDragDrop(event, editor, draggableNode, onDrop) {
		const dragData = event.dataTransfer?.getData(DRAG_DATA_FORMAT$1);
		if (!dragData) {
			return false;
		}
		const {
			type,
			data
		} = JSON.parse(dragData);
		if (type !== draggableNode.getType() || !main_core.Type.isPlainObject(data)) {
			return false;
		}
		event.preventDefault();
		if (canDrop(event, editor) && main_core.Type.isFunction(onDrop)) {
			const range = getDragSelection(event);
			draggableNode.remove();
			const rangeSelection = ui_lexical_core.$createRangeSelection();
			if (range !== null && range !== undefined) {
				rangeSelection.applyDOMRange(range);
			}
			ui_lexical_core.$setSelection(rangeSelection);
			onDrop(data);
		}
		return true;
	}
	function canDrop(event, editor) {
		const target = event.target;
		const selectors = ['code', '.ui-text-editor__file-image'];
		const imageClassName = editor.getThemeClass('image');
		if (main_core.Type.isStringFilled(imageClassName)) {
			selectors.push(`.${imageClassName}`);
		}

		// editor.getBBCodeScheme().isAllowedTag();

		return target instanceof HTMLElement && target.closest(selectors.join(',')) === null && editor.getEditableContainer().contains(target.parentElement);
	}

	/** @memberof BX.UI.TextEditor.Plugins.File */
	const FileType = {
		FILE: 'file',
		IMAGE: 'image',
		VIDEO: 'video'
	};

	/** @memberof BX.UI.TextEditor.Plugins.File */
	const ADD_FILE_COMMAND = ui_lexical_core.createCommand('ADD_FILE_COMMAND');
	const ADD_FILES_COMMAND = ui_lexical_core.createCommand('ADD_FILES_COMMAND');
	const INSERT_FILE_COMMAND = ui_lexical_core.createCommand('INSERT_FILE_COMMAND');

	/** @memberof BX.UI.TextEditor.Plugins.File */
	const REMOVE_FILE_COMMAND = ui_lexical_core.createCommand('REMOVE_FILE_COMMAND');

	/** @memberof BX.UI.TextEditor.Plugins.File */
	const GET_INSERTED_FILES_COMMAND = ui_lexical_core.createCommand('GET_INSERTED_FILES_COMMAND');

	/** @memberof BX.UI.TextEditor.Plugins.File */
	class FilePlugin extends BasePlugin {
		#enabled = false;
		#mode = 'file';
		#files = new Map();
		constructor(editor) {
			super(editor);
			const modeOption = editor.getOption('file.mode');
			this.#enabled = ['file', 'disk'].includes(modeOption);
			if (!this.#enabled) {
				return;
			}
			this.#mode = modeOption;
			const files = editor.getOption('file.files', []);
			this.addFiles(files);
			this.#registerListeners();
			this.cleanUpRegister(registerDraggableNode(this.getEditor(), FileImageNode, data => {
				this.getEditor().dispatchCommand(INSERT_FILE_COMMAND, data);
			}), registerDraggableNode(this.getEditor(), FileVideoNode, data => {
				this.getEditor().dispatchCommand(INSERT_FILE_COMMAND, data);
			}));
		}
		static getName() {
			return 'File';
		}
		static getNodes(editor) {
			return [FileNode, FileImageNode, FileVideoNode];
		}
		importBBCode() {
			if (!this.isEnabled()) {
				return null;
			}
			return {
				[this.getMode()]: () => ({
					conversion: node => {
						// [DISK FILE ID=n14194]
						// [DISK FILE ID=14194]

						// [FILE ID=5b87ba3b-edb1-49df-a840-50d17b6c3e8c.fbbdd477d5ff19d61...a875e731fa89cfd1e1]
						// [FILE ID=14194]
						let serverFileId = node.getAttribute('id');
						const createTextNode = () => {
							return {
								node: ui_lexical_core.$createTextNode(node.toString())
							};
						};
						if (!main_core.Type.isStringFilled(serverFileId) || this.getMode() === 'disk' && !/^n?\d+$/i.test(serverFileId) || this.getMode() === 'file' && !/^(\d+|[\da-f-]{36}\.[\da-f]{32,})$/i.test(serverFileId)) {
							return createTextNode();
						}
						const info = this.getFile(serverFileId);
						if (info === null) {
							return createTextNode();
						}
						if (info.serverFileId.toString() !== serverFileId.toString()) {
							serverFileId = info.serverFileId.toString();
						}
						const fileType = this.getFileType(info);
						if (fileType === FileType.IMAGE) {
							const width = main_core.Text.toInteger(node.getAttribute('width'));
							const height = main_core.Text.toInteger(node.getAttribute('height'));
							return {
								node: $createFileImageNode(serverFileId, info, width, height)
							};
						}
						if (fileType === FileType.VIDEO) {
							const width = main_core.Text.toInteger(node.getAttribute('width'));
							const height = main_core.Text.toInteger(node.getAttribute('height'));
							return {
								node: $createFileVideoNode(serverFileId, info, width, height)
							};
						}
						return {
							node: $createFileNode(serverFileId, info)
						};
					},
					priority: 0
				})
			};
		}
		exportBBCode() {
			if (!this.isEnabled()) {
				return null;
			}
			return {
				file: lexicalNode => {
					const scheme = this.getEditor().getBBCodeScheme();
					const attributes = this.getMode() === 'disk' ? {
						file: ''
					} : {};
					attributes.id = lexicalNode.getServerFileId();
					return {
						node: scheme.createElement({
							name: this.getMode(),
							attributes,
							inline: true
						})
					};
				},
				'file-video': lexicalNode => {
					const scheme = this.getEditor().getBBCodeScheme();
					const attributes = this.getMode() === 'disk' ? {
						file: ''
					} : {};
					attributes.id = lexicalNode.getServerFileId();
					const node = scheme.createElement({
						name: this.getMode(),
						attributes,
						inline: false
					});
					node.setAttribute('width', lexicalNode.getWidth());
					node.setAttribute('height', lexicalNode.getHeight());
					return {
						node
					};
				},
				'file-image': lexicalNode => {
					const scheme = this.getEditor().getBBCodeScheme();
					const attributes = this.getMode() === 'disk' ? {
						file: ''
					} : {};
					attributes.id = lexicalNode.getServerFileId();
					const node = scheme.createElement({
						name: this.getMode(),
						attributes,
						inline: true
					});
					if (lexicalNode.isResized()) {
						node.setAttribute('width', lexicalNode.getWidth());
						node.setAttribute('height', lexicalNode.getHeight());
					}
					return {
						node
					};
				}
			};
		}
		validateScheme() {
			if (!this.isEnabled()) {
				return null;
			}
			return {
				bbcodeMap: {
					file: this.getMode(),
					'file-image': this.getMode(),
					'file-video': this.getMode()
				}
			};
		}
		isEnabled() {
			return this.#enabled;
		}
		getMode() {
			return this.#mode;
		}
		addFile(file) {
			if (main_core.Type.isPlainObject(file) && (main_core.Type.isStringFilled(file.serverFileId) || main_core.Type.isNumber(file.serverFileId))) {
				const serverFileId = file.serverFileId.toString();
				if (!this.#files.has(serverFileId)) {
					this.#files.set(file.serverFileId.toString(), file);
				}
			}
		}
		addFiles(files) {
			if (main_core.Type.isArrayFilled(files)) {
				files.forEach(file => {
					this.addFile(file);
				});
			}
		}
		getFile(serverFileId) {
			if (main_core.Type.isStringFilled(serverFileId) || main_core.Type.isNumber(serverFileId)) {
				const file = this.#files.get(serverFileId.toString()) || null;
				if (file) {
					return file;
				}
				for (const item of this.#files.values()) {
					if (item.serverFileId.toString() === serverFileId.toString() || item.customData?.objectId && `n${item.customData.objectId.toString()}` === serverFileId.toString()) {
						return item;
					}
				}
			}
			return null;
		}
		getFileType(file) {
			if (file?.isImage) {
				return FileType.IMAGE;
			}
			if (file?.isVideo) {
				return FileType.VIDEO;
			}
			return FileType.FILE;
		}
		removeFile(serverFileId, skipHistoryStack = true) {
			if (main_core.Type.isStringFilled(serverFileId) || main_core.Type.isNumber(serverFileId)) {
				this.#files.delete(serverFileId.toString());
				this.getEditor().update(() => {
					const nodes = [...ui_lexical_core.$nodesOfType(FileNode), ...ui_lexical_core.$nodesOfType(FileImageNode), ...ui_lexical_core.$nodesOfType(FileVideoNode)];
					nodes.forEach(node => {
						if (node.getServerFileId().toString() === serverFileId.toString()) {
							node.remove();
						}
					});
				}, skipHistoryStack ? {
					tag: 'history-merge'
				} : {});
			}
		}
		#registerListeners() {
			this.cleanUpRegister(this.getEditor().registerCommand(INSERT_FILE_COMMAND, payload => {
				if (!main_core.Type.isPlainObject(payload) || !main_core.Type.isPlainObject(payload.info) || !main_core.Type.isNumber(payload.serverFileId) && !main_core.Type.isStringFilled(payload.serverFileId)) {
					return false;
				}
				this.addFile(payload.info);
				const fileType = this.getFileType(payload.info);
				let node = null;
				const previewWidth = payload.info.previewWidth;
				const previewHeight = payload.info.previewHeight;
				const renderWidth = payload.width;
				const renderHeight = payload.height;
				if (fileType === FileType.IMAGE) {
					const [width, height] = calcImageSize(previewWidth, previewHeight, renderWidth, renderHeight);
					node = $createFileImageNode(payload.serverFileId, payload.info, width, height);
				} else if (fileType === FileType.VIDEO) {
					let width = 0;
					let height = 0;
					if (previewWidth > 0 && previewHeight > 0) {
						[width, height] = calcImageSize(previewWidth, previewHeight, renderWidth, renderHeight);
					}
					node = $createFileVideoNode(payload.serverFileId, payload.info, width, height);
				} else {
					node = $createFileNode(payload.serverFileId, payload.info);
				}
				const selection = ui_lexical_core.$getSelection();
				if (ui_lexical_core.$isRangeSelection(selection) && fileType !== FileType.FILE && payload.inline !== true) {
					const focus = selection.focus;
					const focusNode = focus.getNode();
					if (!selection.isCollapsed()) {
						focusNode.selectEnd();
					}
					const parentNode = ui_lexical_utils.$findMatchingParent(focusNode, parent => ui_lexical_core.$isParagraphNode(parent));
					if (parentNode === null) {
						ui_lexical_core.$insertNodes([node]);
						if (ui_lexical_core.$isRootOrShadowRoot(node.getParentOrThrow())) {
							ui_lexical_utils.$wrapNodeInElement(node, ui_lexical_core.$createParagraphNode).selectEnd();
						}
					} else if (parentNode.isEmpty()) {
						parentNode.append(node);
						node.selectEnd();
					} else {
						if (this.getEditor().getNewLineMode() === NewLineMode.LINE_BREAK) {
							parentNode.append(ui_lexical_core.$createLineBreakNode());
							parentNode.append(node);
						} else {
							const paragraph = ui_lexical_core.$createParagraphNode();
							paragraph.append(node);
							parentNode.insertAfter(paragraph);
						}
						node.selectEnd();
					}
				} else {
					ui_lexical_core.$insertNodes([node]);
					if (ui_lexical_core.$isRootOrShadowRoot(node.getParentOrThrow())) {
						ui_lexical_utils.$wrapNodeInElement(node, ui_lexical_core.$createParagraphNode).selectEnd();
					}
				}
				return true;
			}, ui_lexical_core.COMMAND_PRIORITY_EDITOR), this.getEditor().registerCommand(REMOVE_FILE_COMMAND, payload => {
				if (!main_core.Type.isPlainObject(payload) || !main_core.Type.isNumber(payload.serverFileId) && !main_core.Type.isStringFilled(payload.serverFileId)) {
					return false;
				}
				this.removeFile(payload.serverFileId, payload.skipHistoryStack);
				return true;
			}, ui_lexical_core.COMMAND_PRIORITY_EDITOR), this.getEditor().registerCommand(GET_INSERTED_FILES_COMMAND, fn => {
				if (!main_core.Type.isFunction(fn)) {
					return false;
				}
				const nodes = [...ui_lexical_core.$nodesOfType(FileNode), ...ui_lexical_core.$nodesOfType(FileImageNode), ...ui_lexical_core.$nodesOfType(FileVideoNode)];
				fn(nodes);
				return true;
			}, ui_lexical_core.COMMAND_PRIORITY_EDITOR), this.getEditor().registerCommand(ADD_FILE_COMMAND, file => {
				this.addFile(file);
				return true;
			}, ui_lexical_core.COMMAND_PRIORITY_EDITOR), this.getEditor().registerCommand(ADD_FILES_COMMAND, files => {
				this.addFiles(files);
				return true;
			}, ui_lexical_core.COMMAND_PRIORITY_EDITOR));
		}
	}

	var File = /*#__PURE__*/Object.freeze({
		__proto__: null,
		$createFileImageNode: $createFileImageNode,
		$createFileNode: $createFileNode,
		$createFileVideoNode: $createFileVideoNode,
		$isFileImageNode: $isFileImageNode,
		$isFileNode: $isFileNode,
		$isFileVideoNode: $isFileVideoNode,
		ADD_FILES_COMMAND: ADD_FILES_COMMAND,
		ADD_FILE_COMMAND: ADD_FILE_COMMAND,
		FileImageComponent: FileImageComponent,
		FileImageNode: FileImageNode,
		FileNode: FileNode,
		FilePlugin: FilePlugin,
		FileType: FileType,
		FileVideoNode: FileVideoNode,
		GET_INSERTED_FILES_COMMAND: GET_INSERTED_FILES_COMMAND,
		INSERT_FILE_COMMAND: INSERT_FILE_COMMAND,
		REMOVE_FILE_COMMAND: REMOVE_FILE_COMMAND
	});

	function validateImageUrl(url) {
		return /^(http:|https:|ftp:|blob:|\/)/i.test(url);
	}

	class ImageComponent extends DecoratorComponent {
		#refs = new main_core_cache.MemoryCache();
		#figureResizer = null;
		#maxWidth = 'none';
		constructor(options) {
			super(options);
			this.#figureResizer = new FigureResizer({
				target: this.getImage(),
				editor: this.getEditor(),
				originalWidth: this.getOption('width'),
				originalHeight: this.getOption('height'),
				maxWidth: this.getMaxWidth(),
				events: {
					onResizeStart: this.#handleResizeStart.bind(this),
					onResizeEnd: this.#handleResizeEnd.bind(this)
				}
			});
			this.getNodeSelection().onSelect(selected => {
				if (selected || this.#figureResizer.isResizing()) {
					main_core.Dom.addClass(this.#getContainer(), '--selected');
					this.#figureResizer.show();
				} else {
					main_core.Dom.removeClass(this.#getContainer(), '--selected');
					this.#figureResizer.hide();
				}
				const draggable = selected && !this.#figureResizer.isResizing();
				this.#setDraggable(draggable);
			});
			this.update(this.getOptions());
			this.#render();
		}
		#render() {
			main_core.Dom.append(this.#getContainer(), this.getTarget());
		}
		#getContainer() {
			return this.#refs.remember('container', () => {
				const figureResizer = this.#figureResizer.getContainer();
				return main_core.Tag.render`
				<div class="ui-text-editor-image-component">
					${this.#getImageContainer()}
					${figureResizer}
				</div>
			`;
			});
		}
		#getImageContainer() {
			return this.#refs.remember('image-container', () => {
				return main_core.Tag.render`
				<div class="ui-text-editor-image-container">
					${this.getImage()}
				</div>
			`;
			});
		}
		#setDraggable(draggable) {
			main_core.Dom.attr(this.#getImageContainer(), {
				draggable
			});
			if (draggable) {
				main_core.Dom.addClass(this.#getContainer(), '--draggable');
			} else {
				main_core.Dom.removeClass(this.#getContainer(), '--draggable');
			}
		}
		#handleResizeStart(event) {
			this.#setDraggable(false);
			this.setSelected(true);
		}
		#handleResizeEnd(event) {
			this.setSelected(true);
			this.getEditor().update(() => {
				const node = ui_lexical_core.$getNodeByKey(this.getNodeKey());
				if ($isImageNode(node)) {
					const {
						width,
						height
					} = event.getData();
					node.setWidthAndHeight(width, height);
				}
			});
		}
		getImage() {
			return this.#refs.remember('image', () => {
				const img = document.createElement('img');
				img.draggable = false;
				img.src = this.getOption('src');
				const config = this.getOption('config', {});
				if (config?.theme?.image?.img) {
					img.className = config.theme.image.img;
				}
				img.onerror = event => {
					img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
					main_core.Dom.addClass(this.getTarget(), '--error ui-icon-set__scope');
				};
				return img;
			});
		}
		getMaxWidth() {
			return this.#maxWidth;
		}
		update(options) {
			const width = options.width > 0 ? `${options.width}px` : 'inherit';
			const aspectRatio = options.width > 0 && options.height > 0 ? `${options.width} / ${options.height}` : 'auto';
			this.#maxWidth = options.maxWidth;
			main_core.Dom.style(this.getImage(), {
				width,
				height: 'auto',
				aspectRatio
			});
		}
	}

	/* eslint-disable no-underscore-dangle, @bitrix24/bitrix24-rules/no-pseudo-private */

	class ImageNode extends ui_lexical_core.DecoratorNode {
		__width = 'inherit';
		__height = 'inherit';
		__maxWidth = 'none';
		constructor(src, width, height, maxWidth, key) {
			super(key);
			if (validateImageUrl(src)) {
				this.__src = src;
			} else {
				this.__src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
			}
			if (main_core.Type.isNumber(width)) {
				this.__width = Math.round(width);
			}
			if (main_core.Type.isNumber(height)) {
				this.__height = Math.round(height);
			}
			if (main_core.Type.isNumber(maxWidth)) {
				this.__maxWidth = Math.round(maxWidth);
			}
		}
		static useDecoratorComponent = true;
		static getType() {
			return 'image';
		}
		static clone(node) {
			return new ImageNode(node.__src, node.__width, node.__height, node.__maxWidth, node.__key);
		}
		static importJSON(serializedNode) {
			const {
				width,
				height,
				src,
				maxWidth
			} = serializedNode;
			return $createImageNode({
				src,
				width,
				height,
				maxWidth
			});
		}
		exportDOM() {
			const element = document.createElement('img');
			element.setAttribute('src', this.__src);
			element.setAttribute('width', this.__width.toString());
			element.setAttribute('height', this.__height.toString());
			return {
				element
			};
		}
		static importDOM() {
			return {
				img: node => ({
					conversion: domNode => {
						if (domNode instanceof HTMLImageElement && validateImageUrl(domNode.src)) {
							const {
								src,
								width,
								height
							} = domNode;
							const imageNode = $createImageNode({
								src,
								width,
								height
							});
							return {
								node: imageNode
							};
						}
						return null;
					},
					priority: 0
				})
			};
		}
		exportJSON() {
			return {
				src: this.getSrc(),
				width: this.getWidth(),
				height: this.getHeight(),
				maxWidth: this.getMaxWidth(),
				type: 'image',
				version: 1
			};
		}
		setWidthAndHeight(width, height) {
			const writable = this.getWritable();
			if (main_core.Type.isNumber(width)) {
				writable.__width = Math.round(width);
			} else if (width === 'inherit') {
				writable.__width = width;
			}
			if (main_core.Type.isNumber(height)) {
				writable.__height = Math.round(height);
			} else if (height === 'inherit') {
				writable.__height = height;
			}
		}
		setMaxWidth(maxWidth) {
			if (main_core.Type.isNumber(maxWidth) || maxWidth === 'none') {
				const writable = this.getWritable();
				writable.__maxWidth = main_core.Type.isNumber(maxWidth) ? Math.round(maxWidth) : maxWidth;
			}
		}
		createDOM(config) {
			const span = document.createElement('span');
			const theme = config.theme;
			const className = theme?.image?.container;
			if (className !== undefined) {
				span.className = className;
			}
			return span;
		}
		updateDOM() {
			return false;
		}
		getSrc() {
			return this.__src;
		}
		getWidth() {
			const self = this.getLatest();
			return self.__width;
		}
		getHeight() {
			const self = this.getLatest();
			return self.__height;
		}
		getMaxWidth() {
			const self = this.getLatest();
			return self.__maxWidth;
		}
		decorate(editor, config) {
			return {
				componentClass: ImageComponent,
				options: {
					src: this.getSrc(),
					width: this.getWidth(),
					height: this.getHeight(),
					maxWidth: this.getMaxWidth(),
					config
				}
			};
		}
		isInline() {
			return true;
		}
	}
	function $createImageNode({
		src,
		width,
		height,
		maxWidth,
		key
	}) {
		return ui_lexical_core.$applyNodeReplacement(new ImageNode(src, width, height, maxWidth, key));
	}
	function $isImageNode(node) {
		return node instanceof ImageNode;
	}

	const paddings = new WeakMap();
	function getEditorPaddings(editor) {
		if (paddings.has(editor)) {
			return paddings.get(editor);
		}
		const scrollerContainer = editor.getEditableContainer();
		const computedStyle = window.getComputedStyle(scrollerContainer);
		const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;
		const paddingRight = parseFloat(computedStyle.paddingRight) || 0;
		const result = {
			left: paddingLeft,
			right: paddingRight
		};
		paddings.set(editor, result);
		return result;
	}

	function $getSelectionPosition(editor, selection, scrollerContainer) {
		// const range: Range = window.getSelection().getRangeAt(0);
		const range = createRange(selection, editor);
		if (range === null) {
			return null;
		}
		const rangeRects = range.getClientRects();
		const isMultiline = rangeRects.length > 1;
		const isBackward = selection.isBackward();
		let rangeRect = isBackward ? rangeRects[0] : rangeRects[rangeRects.length - 1];
		if (selection.isCollapsed() && (!rangeRect || rangeRect.left === 0 && rangeRect.top === 0)) {
			let anchorNode = editor.getElementByKey(selection.anchor.key);
			let anchorOffset = selection.anchor.offset;
			if (anchorNode === null) {
				anchorNode = range.startContainer;
				anchorOffset = range.startOffset;
			}
			const targetNode = anchorNode.childNodes[anchorOffset] || anchorNode;
			const position = targetNode.getBoundingClientRect();
			rangeRect = new DOMRect(position.left, position.top, 1, position.height);
		}
		if (!rangeRect) {
			return null;
		}
		const verticalGap = 10;
		const isBodyContainer = scrollerContainer === document.body;
		const scrollLeft = isBodyContainer ? window.pageXOffset : scrollerContainer.scrollLeft;
		const scrollTop = isBodyContainer ? window.pageYOffset : scrollerContainer.scrollTop;
		let left = (isBackward ? rangeRect.left : rangeRect.right) + scrollLeft;
		let top = rangeRect.top + scrollTop;
		let bottom = rangeRect.bottom + scrollTop + verticalGap;
		if (!isBodyContainer) {
			const scrollerRect = scrollerContainer.getBoundingClientRect();
			top -= scrollerRect.top;
			left -= scrollerRect.left;
			bottom -= scrollerRect.top;
		}
		return {
			left,
			top,
			bottom,
			isBackward,
			isMultiline
		};
	}
	function createRange(selection, editor) {
		if (!ui_lexical_core.$isRangeSelection(selection)) {
			return null;
		}
		const range = document.createRange();
		const anchorNode = selection.anchor.getNode();
		const focusNode = selection.focus.getNode();
		const anchorKey = anchorNode.getKey();
		const focusKey = focusNode.getKey();
		let anchorDOM = editor.getElementByKey(anchorKey);
		let focusDOM = editor.getElementByKey(focusKey);
		let anchorOffset = selection.anchor.offset;
		let focusOffset = selection.focus.offset;
		if (ui_lexical_core.$isTextNode(anchorNode)) {
			anchorDOM = getDOMTextNode(anchorDOM);
		}
		if (ui_lexical_core.$isTextNode(focusNode)) {
			focusDOM = getDOMTextNode(focusDOM);
		}
		if (anchorDOM === null || focusDOM === null) {
			return null;
		}
		if (anchorDOM.nodeName === 'BR') {
			[anchorDOM, anchorOffset] = getDOMIndexWithinParent(anchorDOM);
		}
		if (focusDOM.nodeName === 'BR') {
			[focusDOM, focusOffset] = getDOMIndexWithinParent(focusDOM);
		}
		const firstChild = anchorDOM.firstChild;
		if (anchorDOM === focusDOM && firstChild !== null && firstChild.nodeName === 'BR' && anchorOffset === 0 && focusOffset === 0) {
			focusOffset = 1;
		}
		try {
			range.setStart(anchorDOM, anchorOffset);
			range.setEnd(focusDOM, focusOffset);
		} catch {
			return null;
		}
		if (range.collapsed && (anchorOffset !== focusOffset || anchorKey !== focusKey)) {
			// Range is backwards, we need to reverse it
			range.setStart(focusDOM, focusOffset);
			range.setEnd(anchorDOM, anchorOffset);
		}
		return range;
	}
	function getDOMTextNode(element) {
		let node = element;
		while (node !== null) {
			if (node.nodeType === Node.TEXT_NODE) {
				return node;
			}
			node = node.firstChild;
		}
		return null;
	}
	function getDOMIndexWithinParent(node) {
		const parent = node.parentNode;
		if (parent === null) {
			throw new Error('Should never happen');
		}
		return [parent, [...parent.childNodes].indexOf(node)];
	}

	const lastPositionMap = new WeakMap();
	function $adjustDialogPosition(popup, editor, initPosition) {
		const selection = ui_lexical_core.$getSelection();
		if (!ui_lexical_core.$isRangeSelection(selection)) {
			return false;
		}

		// for an embedded popup: document.body -> editor.getScrollerContainer()
		const selectionPosition = $getSelectionPosition(editor, selection, document.body);
		if (selectionPosition === null) {
			return false;
		}
		const {
			top,
			left,
			bottom,
			isBackward
		} = selectionPosition;
		const scrollerRect = main_core.Dom.getPosition(editor.getScrollerContainer());
		const popupRect = main_core.Dom.getPosition(popup.getPopupContainer());
		const popupWidth = popupRect.width;
		let offsetLeft = popupWidth / 2;
		const editorPaddings = getEditorPaddings(editor);

		// Try to fit a popup within a scroll area
		if (left - offsetLeft < scrollerRect.left) {
			// Left boundary
			const overflow = scrollerRect.left - (left - offsetLeft);
			offsetLeft -= overflow + editorPaddings.left;
		} else if (scrollerRect.right < left + popupWidth - offsetLeft) {
			// Right boundary
			offsetLeft += left + popupWidth - offsetLeft - scrollerRect.right + editorPaddings.right;
		}
		popup.setOffset({
			offsetLeft: -offsetLeft
		});
		if (bottom < scrollerRect.top || top > scrollerRect.bottom) {
			// hide our popup
			main_core.Dom.style(popup.getPopupContainer(), {
				left: '-9999px',
				top: '-9999px'
			});
		} else {
			const initialPosition = main_core.Type.isFunction(initPosition) ? initPosition(selectionPosition) : isBackward ? 'top' : 'bottom';
			const lastPosition = lastPositionMap.get(popup) || null;
			let position = lastPosition === null ? initialPosition : lastPosition;
			if (top + popupRect.height > scrollerRect.bottom && scrollerRect.top < top - popupRect.height) {
				position = 'top';
			} else if (top - popupRect.height < scrollerRect.top) {
				position = 'bottom';
			}
			lastPositionMap.set(popup, position);
			popup.setBindElement({
				left,
				top,
				bottom
			});
			popup.adjustPosition({
				position,
				forceBindPosition: true
			});
		}
		return true;
	}
	function clearDialogPosition(popup) {
		lastPositionMap.delete(popup);
	}

	function $restoreSelection(lastSelection) {
		const selection = ui_lexical_core.$getSelection();
		if (!ui_lexical_core.$isRangeSelection(selection) && lastSelection !== null) {
			const isSelectionAlive = ui_lexical_core.$getNodeByKey(lastSelection.anchor.key) !== null && ui_lexical_core.$getNodeByKey(lastSelection.focus.key) !== null;
			if (isSelectionAlive) {
				ui_lexical_core.$setSelection(lastSelection);
				return true;
			}
			return false;
		}
		return false;
	}

	// eslint-disable-next-line no-control-regex
	const ATTRIBUTE_WHITESPACES = /[\u0000-\u0020\u00A0\u1680\u180E\u2000-\u2029\u205F\u3000]/g;
	const SAFE_URL = /^(?:(?:https?|ftps?|mailto):|[^a-z]|[+.a-z-]+(?:[^+.:a-z-]|$))/i;
	function sanitizeUrl(url) {
		if (!main_core.Type.isStringFilled(url)) {
			return '';
		}
		const normalizedUrl = url.replaceAll(ATTRIBUTE_WHITESPACES, '');
		return SAFE_URL.test(normalizedUrl) ? normalizedUrl : '';
	}

	class ImageDialog extends main_core_events.EventEmitter {
		#popup = null;
		#imageUrl = '';
		#targetContainer = null;
		#refs = new main_core_cache.MemoryCache();
		constructor(options) {
			super();
			this.setEventNamespace('BX.UI.TextEditor.ImageDialog');
			const imageDialogOptions = main_core.Type.isPlainObject(options) ? options : {};
			this.setTargetContainer(imageDialogOptions.targetContainer);
			this.subscribeFromOptions(imageDialogOptions.events);
		}
		show(options = {}) {
			const target = options.target ?? undefined;
			const targetOptions = main_core.Type.isPlainObject(options.targetOptions) ? options.targetOptions : {};
			if (!main_core.Type.isUndefined(target)) {
				this.getPopup().setBindElement(target);
			}
			this.getPopup().adjustPosition({
				...targetOptions,
				forceBindPosition: true
			});
			this.getPopup().show();
		}
		hide() {
			this.getPopup().close();
		}
		isShown() {
			return this.#popup !== null && this.#popup.isShown();
		}
		destroy() {
			this.getPopup().destroy();
		}
		setImageUrl(url) {
			if (main_core.Type.isString(url)) {
				this.#imageUrl = sanitizeUrl(url);
			}
		}
		getImageUrl() {
			return this.#imageUrl;
		}
		setTargetContainer(container) {
			if (main_core.Type.isElementNode(container)) {
				this.#targetContainer = container;
			}
		}
		getTargetContainer() {
			return this.#targetContainer;
		}
		getPopup() {
			if (this.#popup === null) {
				this.#popup = new main_popup.Popup({
					autoHide: true,
					cacheable: false,
					padding: 0,
					closeByEsc: true,
					targetContainer: this.getTargetContainer(),
					content: this.getContainer(),
					events: {
						onClose: () => {
							this.emit('onClose');
						},
						onDestroy: () => {
							this.emit('onDestroy');
						},
						onShow: () => {
							this.emit('onShow');
						},
						onAfterShow: () => {
							this.emit('onAfterShow');
						}
					}
				});
			}
			return this.#popup;
		}
		getContainer() {
			return this.#refs.remember('container', () => {
				return main_core.Tag.render`
				<div class="ui-text-editor-image-dialog">
					<div class="ui-text-editor-image-dialog-form">
						<div class="ui-ctl ui-ctl-textbox ui-ctl-s ui-ctl-inline ui-ctl-w100 ui-text-editor-image-dialog-textbox">
							<div class="ui-ctl-tag">${main_core.Loc.getMessage('TEXT_EDITOR_IMAGE_URL')}</div>
							${this.getUrlTextBox()}
						</div>
						<button type="button" 
							class="ui-text-editor-image-dialog-button" 
							onclick="${this.#handleSaveBtnClick.bind(this)}"
							data-testid="image-dialog-save-btn"
						>
							<span class="ui-icon-set --${ui_iconSet_api_core.Outline.CHECK_L}"></span>
						</button>
						<button 
							type="button" 
							class="ui-text-editor-image-dialog-button"
							onclick="${this.#handleCancelBtnClick.bind(this)}"
							data-testid="image-dialog-cancel-btn"
						>
							<span class="ui-icon-set --${ui_iconSet_api_core.Outline.CROSS_L}"></span>
						</button>
					</div>
				</div>
			`;
			});
		}
		getUrlTextBox() {
			return this.#refs.remember('url-textbox', () => {
				return main_core.Tag.render`
				<input 
					type="text"
					class="ui-ctl-element"
					placeholder="https://example.com/image.jpeg"
					value="${this.getImageUrl()}"
					onkeydown="${this.#handleTextBoxKeyDown.bind(this)}"
					data-testid="image-dialog-textbox"
				>
			`;
			});
		}
		#handleSaveBtnClick() {
			const url = this.getUrlTextBox().value.trim();
			if (url.length > 0) {
				this.setImageUrl(url);
				this.emit('onSave');
			} else {
				this.getUrlTextBox().focus();
			}
		}
		#handleTextBoxKeyDown(event) {
			if (event.key === 'Enter') {
				event.preventDefault();
				this.#handleSaveBtnClick();
			}
		}
		#handleCancelBtnClick() {
			this.emit('onCancel');
		}
	}

	const INSERT_IMAGE_COMMAND = ui_lexical_core.createCommand('INSERT_IMAGE_COMMAND');
	const INSERT_IMAGE_DIALOG_COMMAND = ui_lexical_core.createCommand('INSERT_IMAGE_DIALOG_COMMAND');
	class ImagePlugin extends BasePlugin {
		#imageDialog = null;
		#onEditorScroll = this.#handleEditorScroll.bind(this);
		#lastSelection = null;
		constructor(editor) {
			super(editor);
			this.cleanUpRegister(this.#registerCommands(), registerDraggableNode(this.getEditor(), ImageNode, data => {
				this.getEditor().dispatchCommand(INSERT_IMAGE_COMMAND, data);
			}));
			this.#registerComponents();
		}
		static getName() {
			return 'Image';
		}
		static getNodes(editor) {
			return [ImageNode];
		}
		importBBCode() {
			return {
				img: () => ({
					conversion: node => {
						// [img]{url}[/img]
						// [img width={width} height={height}]{url}[/img]
						const src = node.getContent().trim();
						const width = Number(node.getAttribute('width'));
						const height = Number(node.getAttribute('height'));
						if (validateImageUrl(src)) {
							return {
								node: $createImageNode({
									src,
									width,
									height
								})
							};
						}
						return {
							node: ui_lexical_core.$createTextNode(node.toString())
						};
					},
					priority: 0
				})
			};
		}
		exportBBCode() {
			return {
				image: lexicalNode => {
					const attributes = {};
					const width = lexicalNode.getWidth();
					const height = lexicalNode.getHeight();
					if (main_core.Type.isNumber(width) && main_core.Type.isNumber(height)) {
						attributes.width = width;
						attributes.height = height;
					}
					const scheme = this.getEditor().getBBCodeScheme();
					return {
						node: scheme.createElement({
							name: 'img',
							inline: true,
							attributes
						}),
						after: elementNode => {
							elementNode.setChildren([scheme.createText(lexicalNode.getSrc())]);
						}
					};
				}
			};
		}
		validateScheme() {
			return {
				nodes: [{
					nodeClass: ImageNode
				}],
				bbcodeMap: {
					image: 'img'
				}
			};
		}
		#registerCommands() {
			return ui_lexical_utils.mergeRegister(this.getEditor().registerCommand(INSERT_IMAGE_COMMAND, payload => {
				if (!validateImageUrl(payload?.src)) {
					return false;
				}
				const imageNode = $createImageNode(payload);
				ui_lexical_core.$insertNodes([imageNode]);
				if (ui_lexical_core.$isRootOrShadowRoot(imageNode.getParentOrThrow())) {
					ui_lexical_utils.$wrapNodeInElement(imageNode, ui_lexical_core.$createParagraphNode).selectEnd();
				}
				return true;
			}, ui_lexical_core.COMMAND_PRIORITY_EDITOR), this.getEditor().registerCommand(INSERT_IMAGE_DIALOG_COMMAND, () => {
				const selection = ui_lexical_core.$getSelection();
				if (!ui_lexical_core.$isRangeSelection(selection)) {
					return false;
				}
				this.#lastSelection = selection.clone();
				if (this.#imageDialog !== null) {
					this.#imageDialog.destroy();
				}
				this.getEditor().dispatchCommand(HIDE_DIALOG_COMMAND, {
					sender: 'image-dialog'
				});
				this.#imageDialog = new ImageDialog({
					// for an embedded popup: document.body -> this.getEditor().getScrollerContainer()
					targetContainer: document.body,
					events: {
						onSave: () => {
							const url = this.#imageDialog.getImageUrl();
							if (!main_core.Type.isStringFilled(url)) {
								this.#imageDialog.hide();
								return;
							}
							this.getEditor().dispatchCommand(INSERT_IMAGE_COMMAND, {
								src: url
							});
							this.#imageDialog.hide();
						},
						onCancel: () => {
							this.#imageDialog.hide();
						},
						onClose: () => {
							this.#handleDialogDestroy();
						},
						onDestroy: () => {
							this.#handleDialogDestroy();
						},
						onShow: () => {
							if ($adjustDialogPosition(this.#imageDialog.getPopup(), this.getEditor())) {
								main_core.Event.bind(this.getEditor().getScrollerContainer(), 'scroll', this.#onEditorScroll);
								this.getEditor().highlightSelection();
							}
						},
						onAfterShow: () => {
							this.#imageDialog.getUrlTextBox().focus();
						}
					}
				});
				this.#imageDialog.show();
				return true;
			}, ui_lexical_core.COMMAND_PRIORITY_LOW), this.getEditor().registerCommand(HIDE_DIALOG_COMMAND, payload => {
				if (payload?.sender === 'image-dialog') {
					return false;
				}
				this.#lastSelection = null;
				if (this.#imageDialog !== null) {
					this.#imageDialog.destroy();
				}
				return false;
			}, ui_lexical_core.COMMAND_PRIORITY_LOW), this.getEditor().registerCommand(DIALOG_VISIBILITY_COMMAND, () => {
				return this.#imageDialog !== null && this.#imageDialog.isShown();
			}, ui_lexical_core.COMMAND_PRIORITY_LOW));
		}
		#restoreSelection() {
			const success = $restoreSelection(this.#lastSelection);
			this.#lastSelection = null;
			return success;
		}
		#handleDialogDestroy() {
			if (this.#imageDialog === null) {
				return;
			}
			this.#imageDialog = null;
			main_core.Event.unbind(this.getEditor().getScrollerContainer(), 'scroll', this.#onEditorScroll);
			this.getEditor().resetHighlightSelection();
			this.getEditor().update(() => {
				this.#restoreSelection();
				// this.getEditor().focus();
			});
		}
		#handleEditorScroll() {
			this.getEditor().update(() => {
				$adjustDialogPosition(this.#imageDialog.getPopup(), this.getEditor());
			});
		}
		#registerComponents() {
			this.getEditor().getComponentRegistry().register('image', () => {
				const button = new Button();
				button.setIcon(ui_iconSet_api_core.Outline.IMAGE);
				button.setTooltip(main_core.Loc.getMessage('TEXT_EDITOR_BTN_IMAGE'));
				button.disableInsideUnformatted();
				button.subscribe('onClick', () => {
					if (this.#imageDialog !== null && this.#imageDialog.isShown()) {
						return;
					}
					this.getEditor().focus(() => {
						this.getEditor().dispatchCommand(INSERT_IMAGE_DIALOG_COMMAND);
					});
				});
				return button;
			});
		}
		destroy() {
			super.destroy();
			if (this.#imageDialog !== null) {
				this.#imageDialog.destroy();
			}
		}
	}

	var Image = /*#__PURE__*/Object.freeze({
		__proto__: null,
		$createImageNode: $createImageNode,
		$isImageNode: $isImageNode,
		INSERT_IMAGE_COMMAND: INSERT_IMAGE_COMMAND,
		INSERT_IMAGE_DIALOG_COMMAND: INSERT_IMAGE_DIALOG_COMMAND,
		ImageNode: ImageNode,
		ImagePlugin: ImagePlugin
	});

	/* eslint-disable no-underscore-dangle, @bitrix24/bitrix24-rules/no-pseudo-private */

	class MentionNode extends ui_lexical_core.ElementNode {
		constructor(entityId, id, key) {
			super(key);
			this.__entityId = entityId;
			this.__id = id;
		}
		static getType() {
			return 'mention';
		}
		static clone(node) {
			return new MentionNode(node.__entityId, node.__id, node.__key);
		}
		getId() {
			const self = this.getLatest();
			return self.__id;
		}
		getEntityId() {
			const self = this.getLatest();
			return self.__entityId;
		}
		static importJSON(serializedNode) {
			const node = $createMentionNode(serializedNode.entityId, serializedNode.id);
			node.setFormat(serializedNode.format);
			node.setDirection(serializedNode.direction);
			return node;
		}
		static importDOM() {
			return {
				span: domNode => {
					if (!domNode.hasAttribute('data-mention-id')) {
						return null;
					}
					return {
						conversion: convertMentionElement,
						priority: 1
					};
				},
				a: domNode => {
					if (!domNode.hasAttribute('data-mention-id')) {
						return null;
					}
					return {
						conversion: convertMentionElement,
						priority: 1
					};
				}
			};
		}
		exportDOM() {
			const element = document.createElement('span');
			element.setAttribute('data-mention-entity-id', this.__entityId);
			element.setAttribute('data-mention-id', this.__id.toString());
			return {
				element
			};
		}
		exportJSON() {
			return {
				...super.exportJSON(),
				entityId: this.__entityId,
				id: this.__id,
				type: 'mention',
				version: 1
			};
		}
		createDOM(config, editor) {
			const element = document.createElement('span');
			if (main_core.Type.isStringFilled(config?.theme?.mention)) {
				main_core.Dom.addClass(element, config.theme.mention);
			}
			return element;
		}
		updateDOM(prevNode, anchor, config) {
			return false;
		}
		canInsertTextBefore() {
			return false;
		}
		canInsertTextAfter() {
			return false;
		}
		canBeEmpty() {
			return false;
		}
		isInline() {
			return true;
		}
		insertNewAfter(selection, restoreSelection) {
			const newElement = ui_lexical_core.$createParagraphNode();
			const direction = this.getDirection();
			newElement.setDirection(direction);
			this.insertAfter(newElement, restoreSelection);
			return newElement;
		}
		extractWithChild(child, selection, destination) {
			if (!ui_lexical_core.$isRangeSelection(selection)) {
				return false;
			}
			const anchor = selection.anchor;
			const focus = selection.focus;
			const anchorNode = anchor.getNode();
			const focusNode = focus.getNode();
			const isBackward = selection.isBackward();
			const selectionLength = isBackward ? anchor.offset - focus.offset : focus.offset - anchor.offset;
			return this.isParentOf(anchorNode) && this.isParentOf(focusNode) && this.getTextContent().length === selectionLength;
		}
	}
	function convertMentionElement(domNode) {
		const textContent = domNode.textContent;
		if (textContent !== null) {
			const {
				mentionEntityId,
				mentionId
			} = domNode.dataset;
			const node = $createMentionNode(mentionEntityId, mentionId);
			return {
				node
			};
		}
		return null;
	}
	function $createMentionNode(entityId, id) {
		const mentionNode = new MentionNode(entityId, id);
		return ui_lexical_core.$applyNodeReplacement(mentionNode);
	}
	function $isMentionNode(node) {
		return node instanceof MentionNode;
	}

	const PUNCTUATION = '\\.,\\+\\*\\?\\$\\@\\|#{}\\(\\)\\^\\-\\[\\]\\\\/!%\'"~=<>_:;';
	const TRIGGERS = ['@', '+'].join('');

	// Chars we expect to see in a mention (non-space, non-punctuation).
	const VALID_CHARS = `[^${TRIGGERS}${PUNCTUATION}\\s]`;

	// Non-standard series of chars. Each series must be preceded and followed by
	// a valid char.
	const VALID_JOINS = '(?:' + '\\.[ |$]|' // E.g. "r. " in "Mr. Smith"
	+ ' |' // E.g. " " in "Josh Duck"
	+ `[${PUNCTUATION}]|` // E.g. "-' in "Salier-Hellendag"
	+ ')';
	const LENGTH_LIMIT = 25;
	const mentionRegex = new RegExp('(^|\\s|\\()(' + `[${TRIGGERS}]` + `((?:${VALID_CHARS}${VALID_JOINS}){0,${LENGTH_LIMIT}})` + ')$');
	const INSERT_MENTION_COMMAND = ui_lexical_core.createCommand('INSERT_MENTION_COMMAND');
	const INSERT_MENTION_DIALOG_COMMAND = ui_lexical_core.createCommand('INSERT_MENTION_DIALOG_COMMAND');
	class MentionPlugin extends BasePlugin {
		#dialog = null;
		#lastQueryMatch = null;
		#mentionListening = false;
		#removeKeyboardCommandsLock = null;
		#removeUpdateListener = null;
		#onEditorScroll = this.#handleEditorScroll.bind(this);
		#timeoutId = null;
		#triggerByAtSign = false;
		#dialogOptions = null;
		#entities = new Set();
		constructor(editor) {
			super(editor);
			const entities = editor.getOption('mention.entities', []);
			this.#entities = main_core.Type.isArrayFilled(entities) ? new Set(entities) : new Set();
			const dialogOptions = editor.getOption('mention.dialogOptions');
			if (main_core.Type.isPlainObject(dialogOptions)) {
				this.#dialogOptions = dialogOptions;
				if (main_core.Type.isArrayFilled(this.#dialogOptions.entities)) {
					for (const entity of this.#dialogOptions.entities) {
						if (main_core.Type.isPlainObject(entity) && main_core.Type.isStringFilled(entity.id)) {
							this.#entities.add(entity.id);
						}
					}
				}
				this.#registerKeyDownListener();
			}
			if (this.#entities.size > 0) {
				this.#registerCommands();
				this.#registerComponents();
			}
		}
		static getName() {
			return 'Mention';
		}
		static getNodes(editor) {
			return [MentionNode];
		}
		importBBCode() {
			if (this.#entities.size > 0) {
				const map = {};
				for (const entityId of this.#entities) {
					map[entityId] = () => ({
						conversion: this.#convertMentionElement,
						priority: 0
					});
				}
				return map;
			}
			return null;
		}
		exportBBCode() {
			return {
				mention: lexicalNode => {
					const scheme = this.getEditor().getBBCodeScheme();
					return {
						node: scheme.createElement({
							name: lexicalNode.getEntityId(),
							value: lexicalNode.getId(),
							inline: true
						})
					};
				}
			};
		}
		validateScheme() {
			return {
				nodes: [{
					nodeClass: MentionNode
				}],
				bbcodeMap: {
					mention: '#mention'
				}
			};
		}
		shouldTriggerByAtSign() {
			return this.#triggerByAtSign;
		}
		#registerCommands() {
			this.cleanUpRegister(this.getEditor().registerCommand(INSERT_MENTION_COMMAND, payload => {
				if (!main_core.Type.isPlainObject(payload) || !main_core.Type.isStringFilled(payload.entityId) || !main_core.Type.isStringFilled(payload.text) || !main_core.Type.isStringFilled(payload.id) && !main_core.Type.isNumber(payload.id)) {
					return false;
				}
				if (!this.#entities.has(payload.entityId)) {
					console.error(`TextEditor: MentionPlugin: entity id "${payload.entityId}" was not found.`);
					return false;
				}
				const mentionNode = $createMentionNode(payload.entityId, payload.id);
				mentionNode.append(ui_lexical_core.$createTextNode(payload.text));
				const nodesToInsert = [];
				if (main_core.Type.isStringFilled(payload.before)) {
					nodesToInsert.push(ui_lexical_core.$createTextNode(payload.before));
				}
				nodesToInsert.push(mentionNode);
				if (main_core.Type.isStringFilled(payload.after)) {
					nodesToInsert.push(ui_lexical_core.$createTextNode(payload.after));
				}
				ui_lexical_core.$insertNodes(nodesToInsert);
				if (ui_lexical_core.$isRootOrShadowRoot(mentionNode.getParentOrThrow())) {
					ui_lexical_utils.$wrapNodeInElement(mentionNode, ui_lexical_core.$createParagraphNode).selectEnd();
				}
				return true;
			}, ui_lexical_core.COMMAND_PRIORITY_EDITOR), this.getEditor().registerCommand(INSERT_MENTION_DIALOG_COMMAND, payload => {
				const selection = ui_lexical_core.$getSelection();
				if (!ui_lexical_core.$isRangeSelection(selection)) {
					return false;
				}
				this.getEditor().update(() => {
					const currentText = this.#getTextUpToAnchor(selection);
					let needSpace = currentText !== null && !/(\s|\()$/.test(currentText);
					if (needSpace) {
						const anchor = selection.anchor;
						const anchorNode = anchor.getNode();
						if (anchorNode.getIndexWithinParent() === 0 && anchor.offset === 0) {
							needSpace = false;
						}
					}
					selection.insertText(needSpace ? ' @' : '@');
				}, {
					onUpdate: () => {
						this.getEditor().update(() => {
							const match = this.#getQueryMatch(ui_lexical_core.$getSelection());
							if (match !== null && !this.#isSelectionOnEntityBoundary(match.leadOffset)) {
								this.#openDialog(match);
							}
						});
					}
				});
				return true;
			}, ui_lexical_core.COMMAND_PRIORITY_LOW), this.getEditor().registerCommand(HIDE_DIALOG_COMMAND, payload => {
				if (payload?.sender === 'mention' || payload?.context === 'resize' && this.#mentionListening) {
					return false;
				}
				this.#hideDialog();
				return false;
			}, ui_lexical_core.COMMAND_PRIORITY_LOW), this.getEditor().registerCommand(DIALOG_VISIBILITY_COMMAND, () => {
				return this.isDialogVisible();
			}, ui_lexical_core.COMMAND_PRIORITY_LOW));
		}
		#registerComponents() {
			this.getEditor().getComponentRegistry().register('mention', () => {
				const button = new Button();
				button.setIcon(ui_iconSet_api_core.Outline.MENTION);
				button.setTooltip(main_core.Loc.getMessage('TEXT_EDITOR_BTN_MENTION'));
				button.disableInsideUnformatted();
				button.subscribe('onClick', () => {
					if (this.isDialogVisible()) {
						return;
					}
					this.getEditor().focus(() => {
						this.getEditor().dispatchCommand(INSERT_MENTION_DIALOG_COMMAND);
					});
				});
				return button;
			});
		}
		#convertMentionElement(node) {
			return {
				node: $createMentionNode(node.getName(), node.getValue())
			};
		}
		#registerKeyDownListener() {
			this.#triggerByAtSign = true;
			const keyDownListener = event => {
				if (this.#mentionListening) {
					if (event.key === 'Escape' || event.key === 'Enter') {
						this.#stopMentionListening();
					}
				} else if (!this.#mentionListening && (event.key === '+' || event.key === '@')) {
					this.#timeoutId = setTimeout(() => {
						this.getEditor().update(() => {
							const selection = ui_lexical_core.$getSelection();
							const match = this.#getQueryMatch(selection);
							if (match !== null && !this.#isSelectionOnEntityBoundary(match.leadOffset)) {
								this.#openDialog(match);
							}
						});
					}, 300);
				}
				return false;
			};
			this.cleanUpRegister(this.getEditor().registerCommand(ui_lexical_core.KEY_DOWN_COMMAND, keyDownListener, ui_lexical_core.COMMAND_PRIORITY_LOW));
		}
		#registerTextContentListener() {
			this.#unregisterTextContentListener();
			this.#removeUpdateListener = this.getEditor().registerTextContentListener(this.#textContentListener.bind(this));
		}
		#unregisterTextContentListener() {
			if (this.#removeUpdateListener !== null) {
				this.#removeUpdateListener();
				this.#removeUpdateListener = null;
			}
		}
		#textContentListener() {
			this.getEditor().getEditorState().read(() => {
				const selection = ui_lexical_core.$getSelection();
				const match = this.#getQueryMatch(selection);
				if (match !== null && !this.#isSelectionOnEntityBoundary(match.leadOffset)) {
					this.#openDialog(match);
				} else {
					this.#hideDialog();
				}
			});
		}
		#startMentionListening() {
			this.#mentionListening = true;
			this.#registerTextContentListener();
		}
		#stopMentionListening() {
			this.#mentionListening = false;
			this.#unregisterTextContentListener();
		}
		#getQueryMatch(selection, minMatchLength = 0) {
			if (!ui_lexical_core.$isRangeSelection(selection) || !selection.isCollapsed()) {
				return null;
			}
			const anchor = selection.anchor;
			const anchorNode = anchor.getNode();
			if (!ui_lexical_core.$isTextNode(anchorNode) || !anchorNode.isSimpleText()) {
				return null;
			}
			const text = this.#getTextUpToAnchor(selection);

			// console.log("text:", text);

			if (!main_core.Type.isStringFilled(text)) {
				return null;
			}
			return this.#matchMention(text, minMatchLength);
		}
		#getTextUpToAnchor(selection) {
			const anchor = selection.anchor;
			if (anchor.type !== 'text') {
				return null;
			}
			const anchorNode = anchor.getNode();
			if (!anchorNode.isSimpleText()) {
				return null;
			}
			const anchorOffset = anchor.offset;
			return anchorNode.getTextContent().slice(0, anchorOffset);
		}
		#isSelectionOnEntityBoundary(offset) {
			if (offset !== 0) {
				return false;
			}
			return this.getEditor().getEditorState().read(() => {
				const selection = ui_lexical_core.$getSelection();
				if (ui_lexical_core.$isRangeSelection(selection)) {
					const anchor = selection.anchor;
					const anchorNode = anchor.getNode();
					const prevSibling = anchorNode.getPreviousSibling();
					return ui_lexical_core.$isTextNode(prevSibling) && prevSibling.isTextEntity();
				}
				return false;
			});
		}
		#matchMention(text, minMatchLength) {
			const match = mentionRegex.exec(text);
			if (match !== null) {
				// The strategy ignores leading whitespace but we need to know it's
				// length to add it to the leadOffset
				const maybeLeadingWhitespace = match[1];
				const matchingString = match[3];
				if (matchingString.length >= minMatchLength) {
					return {
						leadOffset: match.index + maybeLeadingWhitespace.length,
						matchingString,
						replaceableString: match[2]
					};
				}
			}
			return null;
		}

		/**
		 * Split Lexical TextNode and return a new TextNode only containing matched text.
		 * Common use cases include: removing the node, replacing with a new node.
		 */
		#splitNodeContainingQuery(match) {
			const selection = ui_lexical_core.$getSelection();
			if (!ui_lexical_core.$isRangeSelection(selection) || !selection.isCollapsed()) {
				return null;
			}
			const anchor = selection.anchor;
			if (anchor.type !== 'text') {
				return null;
			}
			const anchorNode = anchor.getNode();
			if (!anchorNode.isSimpleText()) {
				return null;
			}
			const selectionOffset = anchor.offset;
			const textContent = anchorNode.getTextContent().slice(0, selectionOffset);
			const characterOffset = match.replaceableString.length;
			const queryOffset = this.#getFullMatchOffset(textContent, match.matchingString, characterOffset);
			const startOffset = selectionOffset - queryOffset;
			if (startOffset < 0) {
				return null;
			}
			let newNode = null;
			if (startOffset === 0) {
				[newNode] = anchorNode.splitText(selectionOffset);
			} else {
				[, newNode] = anchorNode.splitText(startOffset, selectionOffset);
			}
			return newNode;
		}

		/**
			* Walk backwards along user input and forward through entity title to try
			* and replace more of the user's text with entity.
			*/
		#getFullMatchOffset(documentText, entryText, offset) {
			let triggerOffset = offset;
			for (let i = triggerOffset; i <= entryText.length; i++) {
				if (documentText.slice(-i) === entryText.slice(0, Math.max(0, i))) {
					triggerOffset = i;
				}
			}
			return triggerOffset;
		}
		#openDialog(queryMatch) {
			if (this.isDestroyed()) {
				return;
			}
			this.#lastQueryMatch = queryMatch;
			if (this.#dialog === null) {
				const dialogOptions = main_core.Type.isPlainObject(this.#dialogOptions) ? {
					...this.#dialogOptions
				} : {};
				const userEvents = dialogOptions.events;
				main_core.Runtime.loadExtension('ui.entity-selector').then(exports => {
					if (this.isDestroyed()) {
						return;
					}
					const {
						Dialog
					} = exports;
					const entitySelectorOptions = {
						multiple: false,
						enableSearch: false,
						clearSearchOnSelect: true,
						hideOnSelect: true,
						hideByEsc: true,
						autoHide: true,
						height: 300,
						width: 400,
						offsetAnimation: false,
						compactView: true,
						...dialogOptions,
						events: {
							onShow: () => {
								this.#lockKeyboardCommands();
								this.#startMentionListening();
								main_core.Event.bind(this.getEditor().getScrollerContainer(), 'scroll', this.#onEditorScroll);
							},
							onHide: () => {
								this.#handleHideOrDestroy();
							},
							onDestroy: () => {
								this.#handleHideOrDestroy();
							},
							'Item:onBeforeSelect': event => {
								const selectedItem = event.getData().item;
								event.preventDefault();
								this.getEditor().update(() => {
									const nodeToReplace = this.#splitNodeContainingQuery(this.#lastQueryMatch);
									const mentionNode = $createMentionNode(selectedItem.getEntityId(), selectedItem.getId());
									mentionNode.append(ui_lexical_core.$createTextNode(selectedItem.getTitle()));
									if (nodeToReplace) {
										nodeToReplace.replace(mentionNode);
										mentionNode.select();
									}
									this.#hideDialog();
								});
							}
						}
					};
					this.#dialog = new Dialog(entitySelectorOptions);
					this.getEditor().dispatchCommand(HIDE_DIALOG_COMMAND, {
						sender: 'mention'
					});
					this.#dialog.subscribeFromOptions(userEvents);
					this.#dialog.show();
					this.#dialog.search(queryMatch.matchingString);
					this.#adjustDialogPosition();
				}).catch(error => {
					console.error('TextEditor: MentionPlugin: cannot load "ui.entity-selector"', error);
				});
			} else {
				this.getEditor().dispatchCommand(HIDE_DIALOG_COMMAND, {
					sender: 'mention'
				});
				this.#dialog.show();
				this.#dialog.search(queryMatch.matchingString);
				this.#adjustDialogPosition();
			}
		}
		isDialogVisible() {
			return this.#dialog !== null && this.#dialog.isRendered() && this.#dialog.getPopup().isShown();
		}
		#adjustDialogPosition() {
			this.getEditor().update(() => {
				$adjustDialogPosition(this.#dialog.getPopup(), this.getEditor());
			});
		}
		#handleEditorScroll() {
			this.#adjustDialogPosition();
		}
		#handleHideOrDestroy() {
			this.#unlockKeyboardCommands();
			this.#stopMentionListening();
			main_core.Event.unbind(this.getEditor().getScrollerContainer(), 'scroll', this.#onEditorScroll);
		}
		#hideDialog() {
			if (this.#dialog !== null) {
				this.#dialog.hide();
			}
		}
		#lockKeyboardCommands() {
			if (this.#removeKeyboardCommandsLock === null) {
				this.#removeKeyboardCommandsLock = ui_lexical_utils.mergeRegister(this.getEditor().registerCommand(ui_lexical_core.KEY_ARROW_DOWN_COMMAND, () => true, ui_lexical_core.COMMAND_PRIORITY_LOW), this.getEditor().registerCommand(ui_lexical_core.KEY_ARROW_UP_COMMAND, () => true, ui_lexical_core.COMMAND_PRIORITY_LOW), this.getEditor().registerCommand(ui_lexical_core.KEY_ESCAPE_COMMAND, () => true, ui_lexical_core.COMMAND_PRIORITY_LOW), this.getEditor().registerCommand(ui_lexical_core.KEY_TAB_COMMAND, () => true, ui_lexical_core.COMMAND_PRIORITY_LOW), this.getEditor().registerCommand(ui_lexical_core.KEY_ENTER_COMMAND, () => true, ui_lexical_core.COMMAND_PRIORITY_LOW));
			}
		}
		#unlockKeyboardCommands() {
			if (this.#removeKeyboardCommandsLock !== null) {
				this.#removeKeyboardCommandsLock();
				this.#removeKeyboardCommandsLock = null;
			}
		}
		destroy() {
			super.destroy();
			if (this.#timeoutId !== null) {
				clearTimeout(this.#timeoutId);
				this.#timeoutId = null;
			}
			if (this.#dialog !== null) {
				this.#dialog.destroy();
			}
			this.#unregisterTextContentListener();
			this.#unlockKeyboardCommands();
		}
	}

	var Mention = /*#__PURE__*/Object.freeze({
		__proto__: null,
		$createMentionNode: $createMentionNode,
		$isMentionNode: $isMentionNode,
		INSERT_MENTION_COMMAND: INSERT_MENTION_COMMAND,
		INSERT_MENTION_DIALOG_COMMAND: INSERT_MENTION_DIALOG_COMMAND,
		MentionNode: MentionNode,
		MentionPlugin: MentionPlugin
	});

	/* eslint-disable no-underscore-dangle,@bitrix24/bitrix24-rules/no-pseudo-private */

	class SmileyNode extends ui_lexical_core.DecoratorNode {
		__width = null;
		__height = null;
		static getType() {
			return 'smiley';
		}
		static clone(node) {
			return new SmileyNode(node.__src, node.__typing, node.__width, node.__height, node.__key);
		}
		constructor(src, typing, width, height, key) {
			super(key);
			this.__src = src;
			this.__typing = typing;
			if (main_core.Type.isNumber(width)) {
				this.__width = width;
			}
			if (main_core.Type.isNumber(height)) {
				this.__height = height;
			}
		}
		getSrc() {
			return this.__src;
		}
		getTyping() {
			return this.__typing;
		}
		getWidth() {
			return this.__width;
		}
		getHeight() {
			return this.__height;
		}
		createDOM(config) {
			const img = document.createElement('img');
			img.src = encodeURI(this.__src);
			if (this.getWidth() > 0 && this.getHeight() > 0) {
				main_core.Dom.style(img, {
					width: `${this.getWidth()}px`,
					height: `${this.getHeight()}px`
				});
			}
			if (main_core.Type.isStringFilled(config?.theme?.smiley)) {
				main_core.Dom.addClass(img, config.theme.smiley);
			}
			main_core.Dom.attr(img, {
				draggable: false
			});
			return img;
		}
		updateDOM(prevNode, dom, config) {
			return false;
		}
		static importJSON(serializedNode) {
			const {
				src,
				typing,
				width,
				height
			} = serializedNode;
			return $createSmileyNode(src, typing, width, height);
		}
		exportDOM() {
			const span = document.createElement('span');
			span.textContent = this.getTyping();
			return {
				element: span
			};
		}
		exportJSON() {
			return {
				src: this.getSrc(),
				typing: this.getTyping(),
				width: this.getWidth(),
				height: this.getHeight(),
				type: 'smiley',
				version: 1
			};
		}
		decorate(editor, config) {
			return {};
		}
		getTextContent() {
			return this.getTyping();
		}
		isInline() {
			return true;
		}
		isKeyboardSelectable() {
			return false;
		}
		isIsolated() {
			return false;
		}
	}
	function $isSmileyNode(node) {
		return node instanceof SmileyNode;
	}
	function $createSmileyNode(src, typing, width, height) {
		const node = new SmileyNode(src, typing, width, height);
		// node.setMode('token');
		// node.setDetail('unmergeable');

		return ui_lexical_core.$applyNodeReplacement(node);
	}

	class SmileyDialog extends main_core_events.EventEmitter {
		#popup = null;
		#targetNode = null;
		constructor(dialogOptions) {
			super();
			this.setEventNamespace('BX.UI.TextEditor.SmileyDialog');
			const options = main_core.Type.isPlainObject(dialogOptions) ? dialogOptions : {};
			this.setTargetNode(options.targetNode);
			this.subscribeFromOptions(options.events);
		}
		show() {
			this.getPopup().adjustPosition({
				forceBindPosition: true
			});
			this.getPopup().show();
		}
		hide() {
			this.getPopup().close();
		}
		isShown() {
			return this.#popup !== null && this.#popup.isShown();
		}
		destroy() {
			this.getPopup().destroy();
		}
		setTargetNode(container) {
			if (main_core.Type.isElementNode(container)) {
				this.#targetNode = container;
			}
		}
		getTargetNode() {
			return this.#targetNode;
		}
		getPopup() {
			if (this.#popup === null) {
				const popupWidth = 332;
				const targetNode = this.getTargetNode();
				const rect = targetNode.getBoundingClientRect();
				const targetNodeWidth = rect.width;
				this.#popup = new main_popup.Popup({
					background: '#F7F9FA',
					autoHide: true,
					padding: 0,
					closeByEsc: true,
					width: popupWidth,
					height: 360,
					bindElement: this.getTargetNode(),
					events: {
						onClose: () => {
							this.emit('onClose');
						},
						onDestroy: () => {
							this.emit('onDestroy');
						},
						onFirstShow: () => {
							const dialog = this;
							main_core.Runtime.loadExtension('ui.vue3', 'ui.vue3.components.smiles').then(exports => {
								const {
									BitrixVue,
									Smiles
								} = exports;
								const app = BitrixVue.createApp({
									methods: {
										handleSelect(text) {
											dialog.emit('onSelect', {
												smiley: text.trim()
											});
										}
									},
									components: {
										Smiles
									},
									template: '<Smiles @selectSmile="handleSelect($event.text)"/>'
								});
								app.mount(this.#popup.getContentContainer());
							}).catch(() => {
								this.#popup.close();
							});
						},
						onShow: event => {
							const popup = event.getTarget();
							const offsetLeft = targetNodeWidth / 2 - popupWidth / 2;
							const angleShift = main_popup.Popup.getOption('angleLeftOffset') - main_popup.Popup.getOption('angleMinTop');
							popup.setAngle({
								offset: popupWidth / 2 - angleShift
							});
							popup.setOffset({
								offsetLeft: offsetLeft + main_popup.Popup.getOption('angleLeftOffset')
							});
						}
					}
				});
			}
			return this.#popup;
		}
	}

	/* eslint-disable no-underscore-dangle */
	const INSERT_SMILEY_COMMAND = ui_lexical_core.createCommand('INSERT_SMILEY_COMMAND');
	const INSERT_SMILEY_DIALOG_COMMAND = ui_lexical_core.createCommand('INSERT_SMILEY_DIALOG_COMMAND');
	class SmileyPlugin extends BasePlugin {
		#smileyParser = null;
		#smileyDialog = null;
		constructor(editor) {
			super(editor);
			if (ui_smiley.SmileyManager.getSize() > 0) {
				this.#smileyParser = new ui_smiley.SmileyParser(ui_smiley.SmileyManager.getAll());
				this.#registerListeners();
				this.#registerInsertSmileyCommand();
				this.#registerComponents();
			}
		}
		static getName() {
			return 'Smiley';
		}
		static getNodes(editor) {
			return [SmileyNode];
		}
		importBBCode() {
			return null;
		}
		exportBBCode() {
			return {
				smiley: lexicalNode => {
					const scheme = this.getEditor().getBBCodeScheme();
					return {
						node: scheme.createText(lexicalNode.getTyping())
					};
				}
			};
		}
		validateScheme() {
			return {
				bbcodeMap: {
					smiley: '#text'
				}
			};
		}
		#registerListeners() {
			const handledTextNodes = new Set();
			this.cleanUpRegister(this.getEditor().registerNodeTransform(ui_lexical_core.TextNode, node => {
				if (!node.isSimpleText() || handledTextNodes.has(node.getKey())) {
					return;
				}
				const $isUnformatted = ui_lexical_utils.$findMatchingParent(node, parentNode => {
					return (parentNode.__flags & UNFORMATTED) !== 0;
				});
				if ($isUnformatted) {
					return;
				}
				const splits = this.#smileyParser.parse(node.getTextContent());
				if (splits.length > 0) {
					const splitOffsets = splits.reduce((acc, smiley) => {
						acc.push(smiley.start, smiley.end);
						return acc;
					}, []);
					const textNodes = node.splitText(...splitOffsets);
					// console.log("textNodes", splitOffsets, textNodes);

					for (const textNode of textNodes) {
						const smiley = ui_smiley.SmileyManager.get(textNode.getTextContent()) || null;
						if (smiley) {
							// console.log('replace');
							const smileyNode = $createSmileyNode(smiley.getImage(), smiley.getTyping(), smiley.getWidth(), smiley.getHeight());
							textNode.replace(smileyNode);
							// smileyNode.selectNext(0, 0);
						} else {
							handledTextNodes.add(textNode.getKey());
						}
					}
				}
			}), this.getEditor().registerUpdateListener(() => {
				handledTextNodes.clear();
			}),
			// Workaround for a disappearing cursor in FireFox and Safari.
			// Lexical always sets contentEditable = 'false' for all decorator nodes.
			this.getEditor().registerMutationListener(SmileyNode, nodeMutations => {
				for (const [nodeKey, mutation] of nodeMutations) {
					if (mutation === 'created') {
						const dom = this.getEditor().getElementByKey(nodeKey);
						dom.contentEditable = true;
					}
				}
			}), this.getEditor().registerCommand(HIDE_DIALOG_COMMAND, () => {
				if (this.#smileyDialog !== null) {
					this.#smileyDialog.hide();
				}
				return false;
			}, ui_lexical_core.COMMAND_PRIORITY_LOW), this.getEditor().registerCommand(DIALOG_VISIBILITY_COMMAND, () => {
				return this.#smileyDialog !== null && this.#smileyDialog.isShown();
			}, ui_lexical_core.COMMAND_PRIORITY_LOW));
		}
		#registerInsertSmileyCommand() {
			this.cleanUpRegister(this.getEditor().registerCommand(INSERT_SMILEY_COMMAND, payload => {
				const smiley = ui_smiley.SmileyManager.get(payload) || null;
				if (!smiley) {
					return false;
				}
				const smileyNode = $createSmileyNode(smiley.getImage(), smiley.getTyping(), smiley.getWidth(), smiley.getHeight());
				ui_lexical_core.$insertNodes([ui_lexical_core.$createTextNode(' '), smileyNode, ui_lexical_core.$createTextNode(' ')]);
				if (ui_lexical_core.$isRootOrShadowRoot(smileyNode.getParentOrThrow())) {
					ui_lexical_utils.$wrapNodeInElement(smileyNode, ui_lexical_core.$createParagraphNode).selectEnd();
				}
				return true;
			}, ui_lexical_core.COMMAND_PRIORITY_EDITOR), this.getEditor().registerCommand(INSERT_SMILEY_DIALOG_COMMAND, payload => {
				if (!main_core.Type.isPlainObject(payload) || !main_core.Type.isElementNode(payload.targetNode)) {
					return false;
				}
				if (this.#smileyDialog !== null) {
					if (this.#smileyDialog.getTargetNode() === payload.targetNode) {
						this.#smileyDialog.show();
						return true;
					}
					this.#smileyDialog.destroy();
				}
				this.#smileyDialog = new SmileyDialog({
					targetNode: payload.targetNode,
					events: {
						onSelect: event => {
							this.getEditor().dispatchCommand(INSERT_SMILEY_COMMAND, event.getData().smiley);
							this.#smileyDialog.hide();
						},
						onDestroy: () => {
							this.#smileyDialog = null;
						}
					}
				});
				this.#smileyDialog.show();
				return true;
			}, ui_lexical_core.COMMAND_PRIORITY_LOW));
		}
		#registerComponents() {
			this.getEditor().getComponentRegistry().register('smileys', () => {
				const button = new Button();
				button.setIcon(ui_iconSet_api_core.Outline.SMILE);
				button.disableInsideUnformatted();
				button.setTooltip(main_core.Loc.getMessage('TEXT_EDITOR_BTN_SMILEYS'));
				button.subscribe('onClick', () => {
					this.getEditor().update(() => {
						this.getEditor().dispatchCommand(INSERT_SMILEY_DIALOG_COMMAND, {
							targetNode: button.getContainer()
						});
					});
				});
				return button;
			});
		}
		destroy() {
			super.destroy();
			if (this.#smileyDialog !== null) {
				this.#smileyDialog.destroy();
			}
		}
	}

	var Smiley = /*#__PURE__*/Object.freeze({
		__proto__: null,
		$createSmileyNode: $createSmileyNode,
		$isSmileyNode: $isSmileyNode,
		INSERT_SMILEY_COMMAND: INSERT_SMILEY_COMMAND,
		INSERT_SMILEY_DIALOG_COMMAND: INSERT_SMILEY_DIALOG_COMMAND,
		SmileyDialog: SmileyDialog,
		SmileyNode: SmileyNode,
		SmileyPlugin: SmileyPlugin
	});

	class VideoComponent extends DecoratorComponent {
		#refs = new main_core_cache.MemoryCache();
		#figureResizer = null;
		#trusted = false;
		constructor(options) {
			super(options);
			this.#trusted = main_core.Type.isStringFilled(this.getOption('provider'));
			this.#figureResizer = new FigureResizer({
				target: this.#getVideo(),
				editor: this.getEditor(),
				minWidth: 120,
				minHeight: 120,
				freeTransform: true,
				events: {
					onResize: this.#handleResize.bind(this),
					onResizeEnd: this.#handleResizeEnd.bind(this)
				}
			});
			this.getNodeSelection().onSelect(selected => {
				if (selected || this.#figureResizer.isResizing()) {
					main_core.Dom.addClass(this.#getContainer(), '--selected');
					this.#figureResizer.show();
				} else {
					main_core.Dom.removeClass(this.#getContainer(), '--selected');
					this.#figureResizer.hide();
				}
			});
			this.update(this.getOptions());
			this.#render();
		}
		#render() {
			main_core.Dom.append(this.#getContainer(), this.getTarget());
		}
		#getContainer() {
			return this.#refs.remember('container', () => {
				return main_core.Tag.render`
				<div class="ui-text-editor-video-component">
					<div class="ui-text-editor-video-object-container">${this.#getVideo()}</div>
					${this.#figureResizer.getContainer()}
				</div>
			`;
			});
		}
		#getVideo() {
			return this.#refs.remember('video', () => {
				let video = null;
				const src = this.getOption('src');
				if (this.#trusted) {
					video = main_core.Tag.render`<iframe frameborder="0" src="about:blank" draggable="false" tabindex="-1"></iframe>`;
					video.src = src;
				} else {
					video = main_core.Dom.create({
						tag: 'video',
						attrs: {
							controls: true,
							preload: 'metadata',
							playsinline: true,
							tabIndex: -1,
							src
						},
						events: {
							loadedmetadata: event => {
								this.getEditor().update(() => {
									const node = ui_lexical_core.$getNodeByKey(this.getNodeKey());
									if ($isVideoNode(node) && node.getWidth() === 0) {
										const [width, height] = calcImageSize(event.target.videoWidth, event.target.videoHeight, 600, 600);
										node.setWidthAndHeight(width, height);
									}
								});
							}
						}
					});
				}
				const config = this.getOption('config', {});
				if (config?.theme?.video?.object) {
					video.className = config.theme.video.object;
				}
				return video;
			});
		}
		#handleResize(event) {
			this.update(event.getData());
		}
		#handleResizeEnd(event) {
			this.setSelected(true);
			this.getEditor().update(() => {
				const node = ui_lexical_core.$getNodeByKey(this.getNodeKey());
				if ($isVideoNode(node)) {
					const {
						width,
						height
					} = event.getData();
					node.setWidthAndHeight(width, height);
				}
			});
		}
		update(options) {
			const width = main_core.Type.isNumber(options.width) && options.width > 0 ? options.width : null;
			const height = main_core.Type.isNumber(options.height) && options.height > 0 ? options.height : null;
			const aspectRatio = width > 0 && height > 0 ? `${width} / ${height}` : 'auto';
			main_core.Dom.adjust(this.#getVideo(), {
				attrs: {
					width
				},
				style: {
					width,
					height: 'auto',
					aspectRatio
				}
			});
		}
	}

	/* eslint-disable no-underscore-dangle, @bitrix24/bitrix24-rules/no-pseudo-private */

	class VideoNode extends ui_lexical_core.DecoratorNode {
		__width = 560;
		__height = 315;
		__provider = null;
		constructor(src, width, height, key) {
			super(key);
			this.__src = src;
			if (main_core.Type.isNumber(width)) {
				this.__width = Math.round(width);
			}
			if (main_core.Type.isNumber(height)) {
				this.__height = Math.round(height);
			}
			const url = /^https?:/.test(src) ? src : `https://${src.replace(/^\/\//, '')}`;
			const uri = new main_core.Uri(url);
			const videoService = ui_videoService.VideoService.createByHost(uri.getHost());
			if (videoService) {
				this.__provider = videoService.getId();
			}
		}
		static useDecoratorComponent = true;
		static getType() {
			return 'video';
		}
		static clone(node) {
			return new VideoNode(node.__src, node.__width, node.__height, node.__key);
		}
		static importJSON(serializedNode) {
			const {
				width,
				height,
				src
			} = serializedNode;
			return $createVideoNode({
				src,
				width,
				height
			});
		}
		exportDOM() {
			return {
				element: null
			};
		}
		static importDOM() {
			return null;
		}
		exportJSON() {
			return {
				src: this.getSrc(),
				width: this.getWidth(),
				height: this.getHeight(),
				type: 'video',
				version: 1
			};
		}
		setWidthAndHeight(width, height) {
			const writable = this.getWritable();
			if (main_core.Type.isNumber(width)) {
				writable.__width = Math.round(width);
			}
			if (main_core.Type.isNumber(height)) {
				writable.__height = Math.round(height);
			}
		}
		createDOM(config) {
			const span = document.createElement('span');
			const theme = config.theme;
			const className = theme?.video?.container;
			if (className !== undefined) {
				span.className = className;
			}
			return span;
		}
		updateDOM() {
			return false;
		}
		getSrc() {
			return this.__src;
		}
		getWidth() {
			const self = this.getLatest();
			return self.__width;
		}
		getHeight() {
			const self = this.getLatest();
			return self.__height;
		}
		getProvider() {
			const self = this.getLatest();
			return self.__provider;
		}
		decorate(editor, config) {
			return {
				componentClass: VideoComponent,
				options: {
					src: this.getSrc(),
					width: this.getWidth(),
					height: this.getHeight(),
					provider: this.getProvider(),
					config
				}
			};
		}
		isInline() {
			return true;
		}
	}
	function $createVideoNode({
		src,
		width,
		height,
		key
	}) {
		return ui_lexical_core.$applyNodeReplacement(new VideoNode(src, width, height, key));
	}
	function $isVideoNode(node) {
		return node instanceof VideoNode;
	}

	class VideoDialog extends main_core_events.EventEmitter {
		#popup = null;
		#videoUrl = '';
		#targetContainer = null;
		#refs = new main_core_cache.MemoryCache();
		constructor(options) {
			super();
			this.setEventNamespace('BX.UI.TextEditor.VideoDialog');
			const videoDialogOptions = main_core.Type.isPlainObject(options) ? options : {};
			this.setTargetContainer(videoDialogOptions.targetContainer);
			this.subscribeFromOptions(videoDialogOptions.events);
		}
		show(options = {}) {
			const target = options.target ?? undefined;
			const targetOptions = main_core.Type.isPlainObject(options.targetOptions) ? options.targetOptions : {};
			if (!main_core.Type.isUndefined(target)) {
				this.getPopup().setBindElement(target);
			}
			this.getPopup().adjustPosition({
				...targetOptions,
				forceBindPosition: true
			});
			this.getPopup().show();
		}
		hide() {
			this.getPopup().close();
		}
		isShown() {
			return this.#popup !== null && this.#popup.isShown();
		}
		destroy() {
			this.getPopup().destroy();
		}
		setVideoUrl(url) {
			if (main_core.Type.isString(url)) {
				this.#videoUrl = sanitizeUrl(url);
			}
		}
		getVideoUrl() {
			return this.#videoUrl;
		}
		setTargetContainer(container) {
			if (main_core.Type.isElementNode(container)) {
				this.#targetContainer = container;
			}
		}
		getTargetContainer() {
			return this.#targetContainer;
		}
		getPopup() {
			if (this.#popup === null) {
				this.#popup = new main_popup.Popup({
					autoHide: true,
					cacheable: false,
					padding: 0,
					closeByEsc: true,
					targetContainer: this.getTargetContainer(),
					content: this.getContainer(),
					events: {
						onShow: () => {
							this.emit('onShow');
						},
						onClose: () => {
							this.emit('onClose');
						},
						onDestroy: () => {
							this.emit('onDestroy');
						},
						onAfterShow: () => {
							this.getUrlTextBox().focus();
						}
					}
				});
			}
			return this.#popup;
		}
		getContainer() {
			return this.#refs.remember('container', () => {
				return main_core.Tag.render`
				<div class="ui-text-editor-video-dialog">
					<div class="ui-text-editor-video-dialog-form">
						<div class="ui-ctl ui-ctl-textbox ui-ctl-s ui-ctl-inline ui-ctl-w100 ui-text-editor-video-dialog-textbox">
							<div class="ui-ctl-tag">${main_core.Loc.getMessage('TEXT_EDITOR_VIDEO_INSERT_TITLE')}</div>
							${this.getUrlTextBox()}
						</div>
						<button type="button" 
							class="ui-text-editor-video-dialog-button" 
							onclick="${this.#handleSaveBtnClick.bind(this)}"
							data-testid="video-dialog-save-btn"
						>
							<span class="ui-icon-set --${ui_iconSet_api_core.Outline.CHECK_L}"></span>
						</button>
						<button 
							type="button" 
							class="ui-text-editor-video-dialog-button"
							onclick="${this.#handleCancelBtnClick.bind(this)}"
							data-testid="video-dialog-cancel-btn"
						>
							<span class="ui-icon-set --${ui_iconSet_api_core.Outline.CROSS_L}"></span>
						</button>
					</div>
					${this.getStatusContainer()}
				</div>
			`;
			});
		}
		getUrlTextBox() {
			return this.#refs.remember('url-textbox', () => {
				return main_core.Tag.render`
				<input 
					type="text"
					class="ui-ctl-element"
					placeholder="https://"
					value="${this.getVideoUrl()}"
					onkeydown="${this.#handleTextBoxKeyDown.bind(this)}"
					oninput="${this.#handleTextBoxInput.bind(this)}"
					data-testid="video-dialog-textbox"
				>
			`;
			});
		}
		getStatusContainer() {
			return this.#refs.remember('status', () => {
				return main_core.Tag.render`
				<div class="ui-text-editor-video-dialog-status">${main_core.Loc.getMessage('TEXT_EDITOR_VIDEO_INSERT_HINT')}</div>
			`;
			});
		}
		showError(error) {
			main_core.Dom.addClass(this.getStatusContainer(), '--error');
			main_core.Dom.addClass(this.getUrlTextBox().parentNode, 'ui-ctl-warning');
			if (main_core.Type.isStringFilled(error)) {
				this.getStatusContainer().textContent = error;
			}
		}
		clearError() {
			main_core.Dom.removeClass(this.getStatusContainer(), '--error');
			main_core.Dom.removeClass(this.getUrlTextBox().parentNode, 'ui-ctl-warning');
			this.getStatusContainer().textContent = main_core.Loc.getMessage('TEXT_EDITOR_VIDEO_INSERT_HINT');
		}
		#handleSaveBtnClick() {
			const url = this.getUrlTextBox().value.trim();
			if (url.length > 0) {
				this.setVideoUrl(url);
				this.emit('onSave');
			} else {
				this.getUrlTextBox().focus();
			}
		}
		#handleTextBoxKeyDown(event) {
			if (event.key === 'Enter') {
				event.preventDefault();
				this.#handleSaveBtnClick();
			}
		}
		#handleTextBoxInput(event) {
			this.emit('onInput');
		}
		#handleCancelBtnClick() {
			this.emit('onCancel');
		}
	}

	function validateVideoUrl(url) {
		return /^(http:|https:|\/)/i.test(url);
	}

	/** @memberof BX.UI.TextEditor.Plugins.Video */
	const INSERT_VIDEO_COMMAND = ui_lexical_core.createCommand('INSERT_VIDEO_COMMAND');

	/** @memberof BX.UI.TextEditor.Plugins.Video */
	const INSERT_VIDEO_DIALOG_COMMAND = ui_lexical_core.createCommand('INSERT_VIDEO_DIALOG_COMMAND');
	class VideoPlugin extends BasePlugin {
		#videoDialog = null;
		#onEditorScroll = this.#handleEditorScroll.bind(this);
		#lastSelection = null;
		constructor(editor) {
			super(editor);
			this.#registerCommands();
			this.#registerComponents();
		}
		static getName() {
			return 'Video';
		}
		static getNodes(editor) {
			return [VideoNode];
		}
		importBBCode() {
			return {
				video: () => ({
					conversion: node => {
						// [video type={type} width={width} height={height}]{url}[/video]
						const src = node.getContent().trim();
						const width = Number(node.getAttribute('width'));
						const height = Number(node.getAttribute('height'));
						if (validateVideoUrl(src)) {
							return {
								node: $createVideoNode({
									src: sanitizeUrl(src),
									width,
									height
								})
							};
						}
						return {
							node: ui_lexical_core.$createTextNode(node.toString())
						};
					},
					priority: 0
				})
			};
		}
		exportBBCode() {
			return {
				video: lexicalNode => {
					const attributes = {};
					const width = lexicalNode.getWidth();
					const height = lexicalNode.getHeight();
					if (main_core.Type.isNumber(width) && main_core.Type.isNumber(height)) {
						attributes.width = width;
						attributes.height = height;
					}
					const provider = lexicalNode.getProvider();
					if (main_core.Type.isStringFilled(provider)) {
						attributes.type = provider;
					}
					const scheme = this.getEditor().getBBCodeScheme();
					return {
						node: scheme.createElement({
							name: 'video',
							inline: false,
							attributes
						}),
						after: elementNode => {
							elementNode.setChildren([scheme.createText(lexicalNode.getSrc())]);
						}
					};
				}
			};
		}
		validateScheme() {
			return {
				nodes: [{
					nodeClass: VideoNode
				}],
				bbcodeMap: {
					video: 'video'
				}
			};
		}
		#registerCommands() {
			this.cleanUpRegister(this.getEditor().registerCommand(INSERT_VIDEO_COMMAND, payload => {
				if (main_core.Type.isPlainObject(payload) && validateVideoUrl(payload.src)) {
					const videoNode = $createVideoNode({
						src: ui_videoService.VideoService.getEmbeddedUrl(payload.src) || payload.src,
						width: payload.width,
						height: payload.height
					});
					ui_lexical_utils.$insertNodeToNearestRoot(videoNode);
					return true;
				}
				return false;
			}, ui_lexical_core.COMMAND_PRIORITY_EDITOR), this.getEditor().registerCommand(INSERT_VIDEO_DIALOG_COMMAND, () => {
				const selection = ui_lexical_core.$getSelection();
				if (!ui_lexical_core.$isRangeSelection(selection)) {
					return false;
				}
				this.#lastSelection = selection.clone();
				if (this.#videoDialog !== null) {
					this.#videoDialog.destroy();
				}
				this.getEditor().dispatchCommand(HIDE_DIALOG_COMMAND, {
					sender: 'video-dialog'
				});
				this.#videoDialog = new VideoDialog({
					// for an embedded popup: document.body -> this.getEditor().getScrollerContainer()
					targetContainer: document.body,
					events: {
						onSave: () => {
							const url = this.#videoDialog.getVideoUrl();
							if (!main_core.Type.isStringFilled(url)) {
								this.#videoDialog.hide();
								return;
							}
							if (!validateVideoUrl(url)) {
								this.#videoDialog.showError(main_core.Loc.getMessage('TEXT_EDITOR_INVALID_URL'));
								return;
							}
							this.getEditor().dispatchCommand(INSERT_VIDEO_COMMAND, {
								src: url
							});
							this.#videoDialog.hide();
						},
						onInput: () => {
							this.#videoDialog.clearError();
						},
						onCancel: () => {
							this.#videoDialog.hide();
						},
						onShow: () => {
							if ($adjustDialogPosition(this.#videoDialog.getPopup(), this.getEditor())) {
								main_core.Event.bind(this.getEditor().getScrollerContainer(), 'scroll', this.#onEditorScroll);
								this.getEditor().highlightSelection();
							}
						},
						onClose: () => {
							this.#handleDialogDestroy();
						},
						onDestroy: () => {
							this.#handleDialogDestroy();
						}
					}
				});
				this.#videoDialog.show();
				return true;
			}, ui_lexical_core.COMMAND_PRIORITY_LOW), this.getEditor().registerCommand(HIDE_DIALOG_COMMAND, payload => {
				if (payload?.sender === 'video-dialog') {
					return false;
				}
				this.#lastSelection = null;
				if (this.#videoDialog !== null) {
					this.#videoDialog.hide();
				}
				return false;
			}, ui_lexical_core.COMMAND_PRIORITY_LOW), this.getEditor().registerCommand(DIALOG_VISIBILITY_COMMAND, () => {
				return this.#videoDialog !== null && this.#videoDialog.isShown();
			}, ui_lexical_core.COMMAND_PRIORITY_LOW));
		}
		#restoreSelection() {
			const success = $restoreSelection(this.#lastSelection);
			this.#lastSelection = null;
			return success;
		}
		#handleDialogDestroy() {
			if (this.#videoDialog === null) {
				return;
			}
			this.#videoDialog = null;
			main_core.Event.unbind(this.getEditor().getScrollerContainer(), 'scroll', this.#onEditorScroll);
			this.getEditor().resetHighlightSelection();
			this.getEditor().update(() => {
				this.#restoreSelection();
				// this.getEditor().focus();
			});
		}
		#handleEditorScroll() {
			this.getEditor().update(() => {
				$adjustDialogPosition(this.#videoDialog.getPopup(), this.getEditor());
			});
		}
		#registerComponents() {
			this.getEditor().getComponentRegistry().register('video', () => {
				const button = new Button();
				button.setIcon(ui_iconSet_api_core.Outline.RECORD_VIDEO);
				button.disableInsideUnformatted();
				button.setTooltip(main_core.Loc.getMessage('TEXT_EDITOR_BTN_VIDEO'));
				button.subscribe('onClick', () => {
					if (this.#videoDialog !== null && this.#videoDialog.isShown()) {
						return;
					}
					this.getEditor().focus(() => {
						this.getEditor().dispatchCommand(INSERT_VIDEO_DIALOG_COMMAND);
					});
				});
				return button;
			});
		}
		destroy() {
			super.destroy();
			if (this.#videoDialog !== null) {
				this.#videoDialog.destroy();
			}
		}
	}

	var Video = /*#__PURE__*/Object.freeze({
		__proto__: null,
		$createVideoNode: $createVideoNode,
		$isVideoNode: $isVideoNode,
		INSERT_VIDEO_COMMAND: INSERT_VIDEO_COMMAND,
		INSERT_VIDEO_DIALOG_COMMAND: INSERT_VIDEO_DIALOG_COMMAND,
		VideoNode: VideoNode,
		VideoPlugin: VideoPlugin
	});

	function printFormatProperties(nodeOrSelection) {
		let str = FORMAT_PREDICATES.map(predicate => predicate(nodeOrSelection)).filter(Boolean).join(', ').toLocaleLowerCase();
		if (str !== '') {
			str = `format: ${str}`;
		}
		return str;
	}

	function printNode(node) {
		if ($isCodeTokenNode(node)) {
			const codeTokenNode = node;
			return `{ ${codeTokenNode.__highlightType}: "${normalize(codeTokenNode.getTextContent())}" }`;
		}
		if ($isCodeNode(node)) {
			const codeTokenNode = node;
			return `{ children: ${codeTokenNode.getChildrenSize()} }`;
		}
		if (ui_lexical_core.$isTextNode(node)) {
			const text = node.getTextContent();
			const title = text.length === 0 ? '(empty)' : `"${normalize(text)}"`;
			const properties = printAllTextNodeProperties(node);
			return [title, properties.length > 0 ? `{ ${properties} }` : null].filter(Boolean).join(' ').trim();
		}
		if ($isFileImageNode(node)) {
			const fileImageNode = node;
			return `{ id: ${fileImageNode.getId()}, width: ${fileImageNode.getWidth()}, height: ${fileImageNode.getHeight()} }`;
		}
		if ($isFileNode(node)) {
			const fileNode = node;
			return `{ id: ${fileNode.getId()} }`;
		}
		if ($isFileVideoNode(node)) {
			const fileVideoNode = node;
			return `{ id: ${fileVideoNode.getId()} }`;
		}
		if ($isSmileyNode(node)) {
			const smileyNode = node;
			return `{ typing: ${smileyNode.getTyping()}, width: ${smileyNode.getWidth()}, height: ${smileyNode.getHeight()} }`;
		}
		if ($isVideoNode(node)) {
			const videoNode = node;
			return `{ width: ${videoNode.getWidth()}, height: ${videoNode.getHeight()} }`;
		}
		if ($isMentionNode(node)) {
			const mentionNode = node;
			return `{ entityId: ${mentionNode.getEntityId()}, id: ${mentionNode.getId()} }`;
		}
		if ($isImageNode(node)) {
			const imageNode = node;
			return `{ width: ${imageNode.getWidth()}, height: ${imageNode.getHeight()} }`;
		}
		if (ui_lexical_link.$isLinkNode(node)) {
			const linkNode = node;
			const link = linkNode.getURL();
			const title = link.length === 0 ? '(empty)' : `"${normalize(link)}"`;
			const properties = printAllLinkNodeProperties(linkNode);
			return [title, properties.length > 0 ? `{ ${properties} }` : null].filter(Boolean).join(' ').trim();
		}
		return '';
	}
	function normalize(text) {
		return Object.entries(NON_SINGLE_WIDTH_CHARS_REPLACEMENT).reduce((acc, [key, value]) => acc.replace(new RegExp(key, 'g'), String(value)), text);
	}
	function printAllTextNodeProperties(node) {
		return [printFormatProperties(node), printDetailProperties(node), printModeProperties(node)].filter(Boolean).join(', ');
	}
	function printAllLinkNodeProperties(node) {
		return [printTargetProperties(node), printRelProperties(node), printTitleProperties(node)].filter(Boolean).join(', ');
	}
	function printTargetProperties(node) {
		let str = node.getTarget();
		if (!main_core.Type.isNil(str)) {
			str = `target: ${str}`;
		}
		return str;
	}
	function printRelProperties(node) {
		let str = node.getRel();
		if (!main_core.Type.isNil(str)) {
			str = `rel: ${str}`;
		}
		return str;
	}
	function printTitleProperties(node) {
		let str = node.getTitle();
		if (!main_core.Type.isNil(str)) {
			str = `title: ${str}`;
		}
		return str;
	}
	function printDetailProperties(nodeOrSelection) {
		let str = DETAIL_PREDICATES.map(predicate => predicate(nodeOrSelection)).filter(Boolean).join(', ').toLocaleLowerCase();
		if (str !== '') {
			str = `detail: ${str}`;
		}
		return str;
	}
	function printModeProperties(nodeOrSelection) {
		let str = MODE_PREDICATES.map(predicate => predicate(nodeOrSelection)).filter(Boolean).join(', ').toLocaleLowerCase();
		if (str !== '') {
			str = `mode: ${str}`;
		}
		return str;
	}

	function printNodeSelection(selection) {
		if (!ui_lexical_core.$isNodeSelection(selection)) {
			return '';
		}
		return `: node\n  └ [${[...selection._nodes].join(', ')}]`;
	}

	function printRangeSelection(selection) {
		let res = '';
		const formatText = printFormatProperties(selection);
		res += `: range ${formatText !== '' ? `{ ${formatText} }` : ''} ${selection.style !== '' ? `{ style: ${selection.style} } ` : ''}`;
		const anchor = selection.anchor;
		const focus = selection.focus;
		const anchorOffset = anchor.offset;
		const focusOffset = focus.offset;
		res += `\n  ├ anchor { key: ${anchor.key}, offset: ${anchorOffset === null ? 'null' : anchorOffset}, type: ${anchor.type} }`;
		res += `\n  └ focus { key: ${focus.key}, offset: ${focusOffset === null ? 'null' : focusOffset}, type: ${focus.type} }`;
		return res;
	}

	function printTableSelection(selection) {
		return `: table\n  └ { table: ${selection.tableKey}, anchorCell: ${selection.anchor.key}, focusCell: ${selection.focus.key} }`;
	}

	function visitTree(currentNode, visitor, indent = []) {
		const childNodes = currentNode.getChildren();
		const childNodesLength = childNodes.length;
		childNodes.forEach((childNode, i) => {
			visitor(childNode, indent.concat(i === childNodesLength - 1 ? SYMBOLS.isLastChild : SYMBOLS.hasNextSibling));
			if (ui_lexical_core.$isElementNode(childNode)) {
				visitTree(childNode, visitor, indent.concat(i === childNodesLength - 1 ? SYMBOLS.ancestorIsLastChild : SYMBOLS.ancestorHasNextSibling));
			}
		});
	}

	/* eslint-disable no-underscore-dangle */

	function generateContent(editor) {
		const editorState = editor.getEditorState();

		// if (exportDOM)
		// {
		// 	let htmlString = '';
		// 	editorState.read(() => {
		// 		htmlString = printPrettyHTML($generateHtmlFromNodes(editor));
		// 	});
		// 	return htmlString;
		// }

		let res = ' root\n';
		const selectionString = editorState.read(() => {
			const selection = ui_lexical_core.$getSelection();
			visitTree(ui_lexical_core.$getRoot(), (node, indent) => {
				const nodeKey = node.getKey();
				const nodeKeyDisplay = `(${nodeKey})`;
				const typeDisplay = node.getType() || '';
				const isSelected = node.isSelected();
				res += `${isSelected ? SYMBOLS.selectedLine : ' '} ${indent.join(' ')} ${nodeKeyDisplay} ${typeDisplay} ${printNode(node)}\n`;
				res += printSelectedCharsLine({
					indent,
					isSelected,
					node,
					nodeKeyDisplay,
					selection,
					typeDisplay
				});
			});
			if (selection === null) {
				return ': null';
			}
			if (ui_lexical_core.$isRangeSelection(selection)) {
				return printRangeSelection(selection);
			}
			if (ui_lexical_table.$isTableSelection(selection)) {
				return printTableSelection(selection);
			}
			return printNodeSelection(selection);
		});
		res += `\n selection${selectionString}`;
		return res;
	}
	function printSelectedCharsLine({
		indent,
		isSelected,
		node,
		nodeKeyDisplay,
		selection,
		typeDisplay
	}) {
		// No selection or node is not selected.
		if (!ui_lexical_core.$isTextNode(node) || !ui_lexical_core.$isRangeSelection(selection) || !isSelected || ui_lexical_core.$isElementNode(node)) {
			return '';
		}

		// No selected characters.
		const anchor = selection.anchor;
		const focus = selection.focus;
		if (node.getTextContent() === '' || anchor.getNode() === selection.focus.getNode() && anchor.offset === focus.offset) {
			return '';
		}
		const [start, end] = $getSelectionStartEnd(node, selection);
		if (start === end) {
			return '';
		}
		const selectionLastIndent = indent[indent.length - 1] === SYMBOLS.hasNextSibling ? SYMBOLS.ancestorHasNextSibling : SYMBOLS.ancestorIsLastChild;
		const indentionChars = [...indent.slice(0, -1), selectionLastIndent];
		const unselectedChars = Array.from({
			length: start + 1
		}).fill(' ');
		const selectedChars = Array.from({
			length: end - start
		}).fill(SYMBOLS.selectedChar);
		const paddingLength = typeDisplay.length + 3; // 2 for the spaces around + 1 for the double quote.
		const nodePrintSpaces = Array.from({
			length: nodeKeyDisplay.length + paddingLength
		}).fill(' ');
		return `${[SYMBOLS.selectedLine, indentionChars.join(' '), [...nodePrintSpaces, ...unselectedChars, ...selectedChars].join('')].join(' ')}\n`;
	}
	function $getSelectionStartEnd(node, selection) {
		const anchorAndFocus = selection.getStartEndPoints();
		if (ui_lexical_core.$isNodeSelection(selection) || anchorAndFocus === null) {
			return [-1, -1];
		}
		const [anchor, focus] = anchorAndFocus;
		const textContent = node.getTextContent();
		const textLength = textContent.length;
		let start = -1;
		let end = -1;

		// Only one node is being selected.
		if (anchor.type === 'text' && focus.type === 'text') {
			const anchorNode = anchor.getNode();
			const focusNode = focus.getNode();
			if (anchorNode === focusNode && node === anchorNode && anchor.offset !== focus.offset) {
				[start, end] = anchor.offset < focus.offset ? [anchor.offset, focus.offset] : [focus.offset, anchor.offset];
			} else if (node === anchorNode) {
				[start, end] = anchorNode.isBefore(focusNode) ? [anchor.offset, textLength] : [0, anchor.offset];
			} else if (node === focusNode) {
				[start, end] = focusNode.isBefore(anchorNode) ? [focus.offset, textLength] : [0, focus.offset];
			} else {
				// Node is within selection but not the anchor nor focus.
				[start, end] = [0, textLength];
			}
		}

		// Account for non-single width characters.
		const numNonSingleWidthCharBeforeSelection = (textContent.slice(0, start).match(NON_SINGLE_WIDTH_CHARS_REGEX) || []).length;
		const numNonSingleWidthCharInSelection = (textContent.slice(start, end).match(NON_SINGLE_WIDTH_CHARS_REGEX) || []).length;
		return [start + numNonSingleWidthCharBeforeSelection, end + numNonSingleWidthCharBeforeSelection + numNonSingleWidthCharInSelection];
	}

	function createHashCode(s) {
		return [...s].reduce((hash, c) => Math.trunc(Math.imul(31, hash) + c.codePointAt(0)), 0);
	}

	function $isRootEmpty(trim = true) {
		const root = ui_lexical_core.$getRoot();
		let text = root.getTextContent();
		if (trim) {
			text = text.trim();
		}
		if (text !== '') {
			return false;
		}
		const children = root.getChildren();
		const childrenLength = children.length;
		if (childrenLength > 1) {
			return false;
		}
		for (let i = 0; i < childrenLength; i++) {
			const topBlock = children[i];
			if (ui_lexical_core.$isDecoratorNode(topBlock)) {
				return false;
			}
			if (ui_lexical_core.$isElementNode(topBlock)) {
				if (!ui_lexical_core.$isParagraphNode(topBlock)) {
					return false;
				}
				if (topBlock.__indent !== 0) {
					return false;
				}
				const topBlockChildren = topBlock.getChildren();
				const topBlockChildrenLength = topBlockChildren.length;
				for (let s = 0; s < topBlockChildrenLength; s++) {
					const child = topBlockChildren[i];
					if (!ui_lexical_core.$isTextNode(child)) {
						return false;
					}
				}
			}
		}
		return true;
	}

	const defaultTheme = {
		blockCursor: 'ui-text-editor__block-cursor',
		indent: 'ui-text-editor__indent',
		ltr: 'ui-text-editor__ltr',
		rtl: 'ui-text-editor__rtl',
		heading: {
			h1: 'ui-typography-heading-h1',
			h2: 'ui-typography-heading-h2',
			h3: 'ui-typography-heading-h3',
			h4: 'ui-typography-heading-h4',
			h5: 'ui-typography-heading-h5',
			h6: 'ui-typography-heading-h6'
		},
		hashtag: 'ui-typography-hashtag',
		link: 'ui-typography-link',
		list: {
			listitem: 'ui-typography-li',
			nested: {
				list: '--nested',
				listitem: 'ui-text-editor__nestedListItem --nested'
			},
			olDepth: ['ui-typography-ol ui-text-editor__ol1', 'ui-typography-ol ui-text-editor__ol2', 'ui-typography-ol ui-text-editor__ol3', 'ui-typography-ol ui-text-editor__ol4', 'ui-typography-ol ui-text-editor__ol5'],
			ul: 'ui-typography-ul'
		},
		paragraph: 'ui-typography-paragraph ui-text-editor__paragraph',
		text: {
			bold: 'ui-typography-text-bold',
			code: 'ui-typography-text-code',
			italic: 'ui-typography-text-italic',
			strikethrough: 'ui-typography-text-strikethrough',
			subscript: 'ui-typography-text-subscript',
			superscript: 'ui-typography-text-superscript',
			underline: 'ui-typography-text-underline',
			underlineStrikethrough: 'ui-typography-text-underline-strikethrough'
		},
		mention: 'ui-typography-mention',
		quote: 'ui-typography-quote',
		spoiler: {
			container: 'ui-typography-spoiler',
			title: 'ui-typography-spoiler-title ui-icon-set__scope',
			content: 'ui-typography-spoiler-content'
		},
		smiley: 'ui-typography-smiley',
		code: 'ui-typography-code',
		codeHighlight: {
			operator: 'ui-typography-token-operator',
			punctuation: 'ui-typography-token-punctuation',
			comment: 'ui-typography-token-comment',
			word: 'ui-typography-token-word',
			keyword: 'ui-typography-token-keyword',
			boolean: 'ui-typography-token-boolean',
			regex: 'ui-typography-token-regex',
			string: 'ui-typography-token-string',
			number: 'ui-typography-token-number',
			semicolon: 'ui-typography-token-semicolon',
			bracket: 'ui-typography-token-bracket',
			brace: 'ui-typography-token-brace',
			parentheses: 'ui-typography-token-parentheses'
		},
		table: 'ui-typography-table',
		tableRow: 'ui-typography-table-row',
		tableCell: 'ui-typography-table-cell',
		tableCellHeader: 'ui-typography-table-cell-header',
		tableSelection: 'ui-typography-table-selection',
		image: {
			container: 'ui-typography-image-container ui-text-editor__image-container',
			img: 'ui-typography-image'
		},
		video: {
			container: 'ui-typography-video-container ui-text-editor__video-container',
			object: 'ui-typography-video-object ui-text-editor__video-object'
		},
		file: 'ui-text-editor__file'
	};

	class PluginCollection {
		#pluginConstructors = new Map();
		#plugins = new Map();
		#availablePlugins = new Map();
		constructor(builtinPlugins = [], plugins = [], pluginsToRemove = []) {
			for (const pluginConstructor of builtinPlugins) {
				if (pluginConstructor.getName()) {
					this.#availablePlugins.set(pluginConstructor.getName(), pluginConstructor);
				}
			}
			for (const plugin of plugins) {
				if (main_core.Type.isFunction(plugin) && plugin.getName() && !this.#availablePlugins.has(plugin.getName())) {
					this.#availablePlugins.set(plugin.getName(), plugin);
				}
			}
			const pluginsToLoad = plugins.filter(plugin => {
				if (pluginsToRemove.includes(plugin)) {
					return false;
				}
				if (main_core.Type.isFunction(plugin) && pluginsToRemove.includes(plugin.getName())) {
					return false;
				}
				return !pluginsToRemove.includes(this.#availablePlugins.get(plugin));
			});
			pluginsToLoad.map(plugin => {
				return main_core.Type.isFunction(plugin) ? plugin : this.#availablePlugins.get(plugin);
			}).forEach(pluginConstructor => {
				if (main_core.Type.isFunction(pluginConstructor)) {
					this.#pluginConstructors.set(pluginConstructor.getName(), pluginConstructor);
				}
			});
		}
		init(textEditor) {
			const instances = [];
			for (const [, PluginConstruct] of this.#pluginConstructors) {
				const plugin = new PluginConstruct(textEditor);
				if (!(plugin instanceof BasePlugin)) {
					throw new TypeError('TextEditor: a plugin must be an instance of TextEditor.BasePlugin.');
				}
				this.#plugins.set(PluginConstruct.getName(), plugin);
				instances.push(plugin);
			}
			instances.forEach(instance => {
				instance.afterInit();
			});
		}
		getConstructors() {
			return [...this.#pluginConstructors.values()];
		}
		getPlugins() {
			return this.#plugins;
		}
		[Symbol.iterator]() {
			return this.#plugins[Symbol.iterator]();
		}
		get(key) {
			const name = main_core.Type.isFunction(key) ? key.getName() : key;
			return this.#plugins.get(name) || null;
		}
		has(key) {
			const name = main_core.Type.isFunction(key) ? key.getName() : key;
			return this.#plugins.has(name);
		}
	}

	class ComponentRegistry {
		#components = new Map();
		register(name, callback) {
			this.#components.set(this.constructor.#normalizeName(name), {
				callback
			});
		}
		create(name) {
			const component = this.#components.get(this.constructor.#normalizeName(name));
			return component ? component.callback() : null;
		}
		static #normalizeName(name) {
			return String(name).toLowerCase();
		}
	}

	/* eslint-disable @bitrix24/bitrix24-rules/no-native-dom-methods */

	class SchemeValidation {
		#editor = null;
		#nodeTypeToBBCodeType = new Map();
		#nodeValidation = new Map();
		constructor(editor) {
			this.#editor = editor;
			this.#initNodeValidation();
		}
		isNodeAllowed(parent, child) {
			const parentCode = main_core.Type.isString(parent) ? parent : this.#nodeTypeToBBCodeType.get(parent.getType());
			const childCode = main_core.Type.isString(child) ? child : this.#nodeTypeToBBCodeType.get(child.getType());
			if (!parentCode) {
				// eslint-disable-next-line no-console
				console.warn(`TextEditor: parent node (${parent.getType()}) doesn't have a bbcode tag.`);
			}
			if (!childCode) {
				// eslint-disable-next-line no-console
				console.warn(`TextEditor: child node (${child.getType()}) doesn't have a bbcode tag.`);
			}
			return this.#editor.getBBCodeScheme().isChildAllowed(parentCode, childCode);
		}
		findAllowedParent(node) {
			let parent = node.getParent();
			while (parent !== null) {
				if (this.isNodeAllowed(parent, node)) {
					return parent;
				}
				parent = parent.getParent();
			}
			return null;
		}
		#initNodeValidation() {
			const handleNodeTransform = this.#handleNodeTransform.bind(this);
			for (const [, plugin] of this.#editor.getPlugins()) {
				const validation = plugin.validateScheme();
				if (!main_core.Type.isPlainObject(validation)) {
					continue;
				}
				if (main_core.Type.isArrayFilled(validation.nodes)) {
					validation.nodes.forEach(nodeValidation => {
						this.#editor.registerNodeTransform(nodeValidation.nodeClass, handleNodeTransform);
						if (main_core.Type.isFunction(nodeValidation.validate)) {
							this.#nodeValidation.set(nodeValidation.nodeClass.getType(), {
								validate: nodeValidation.validate
							});
						}
					});
				}
				if (main_core.Type.isPlainObject(validation.bbcodeMap)) {
					for (const [nodeType, bbcodeTag] of Object.entries(validation.bbcodeMap)) {
						this.#nodeTypeToBBCodeType.set(nodeType, bbcodeTag);
					}
				}
			}
		}
		#handleNodeTransform(node) {
			const {
				validate = null
			} = this.#nodeValidation.get(node.getType()) || {};
			if (validate !== null && validate(node, this) === true) {
				return;
			}
			const parent = node.getParent();
			if (this.isNodeAllowed(parent, node)) {
				return;
			}

			// eslint-disable-next-line no-console
			console.warn(`TextEditor: ${node.getType()} is not allowed in ${parent.getType()}`);
			this.moveToNextParent(node);
		}
		moveToNextParent(node, removeOnFail = true) {
			let parent = node.getParent();
			let targetNode = null;
			while (parent.getParent() !== null) {
				if (this.isNodeAllowed(parent.getParent(), node)) {
					targetNode = parent;
					break;
				}
				parent = parent.getParent();
			}
			if (targetNode === null) {
				if (removeOnFail) {
					node.remove();
				}
				return false;
			}
			if (ui_lexical_core.$isRootNode(targetNode.getParent()) && (ui_lexical_core.$isTextNode(node) || ui_lexical_core.$isElementNode(node) && node.isInline())) {
				targetNode.insertBefore(ui_lexical_core.$createParagraphNode().append(node));
				return true;
			}
			targetNode.insertBefore(node);
			return true;
		}
	}

	class RichTextPlugin extends BasePlugin {
		constructor(editor) {
			super(editor);
			this.cleanUpRegister(ui_lexical_richText.registerRichText(editor.getLexicalEditor()));
		}
		static getName() {
			return 'RichText';
		}
	}

	class ClipboardPlainTableNode extends ui_lexical_core.ElementNode {
		static getType() {
			return 'plain-table-node';
		}
		static clone(node) {
			throw new Error('Not implemented');
		}
		static importJSON(serializedNode) {
			throw new Error('Not implemented');
		}
		exportJSON() {
			throw new Error('Not implemented');
		}
		static importDOM() {
			return {
				table: () => {
					return {
						conversion: convertTableToPlainText,
						priority: 0
					};
				},
				tr: () => {
					return {
						conversion: () => ({
							node: null
						}),
						priority: 0
					};
				},
				td: () => {
					return {
						conversion: () => ({
							node: null
						}),
						priority: 0
					};
				},
				th: () => {
					return {
						conversion: () => ({
							node: null
						}),
						priority: 0
					};
				}
			};
		}
	}
	function convertTableToPlainText(table) {
		const nodes = [];
		const rows = [...table.rows];
		for (const row of rows) {
			if (nodes.length > 0) {
				nodes.push(ui_lexical_core.$createLineBreakNode());
			}
			const cells = [];
			for (const cell of row.cells) {
				if (cells.length > 0) {
					// cells.push($createTabNode());
					cells.push(ui_lexical_core.$createTextNode(' '));
				}
				cells.push(ui_lexical_core.$createTextNode(cell.textContent.trim()));
			}
			nodes.push(...cells);
		}
		return {
			node: nodes
		};
	}

	class ClipboardPlugin extends BasePlugin {
		static getName() {
			return 'Clipboard';
		}
		static getNodes(editor) {
			const nodes = [];
			const tablePluginExists = editor.getPlugins().getConstructors().some(plugin => {
				return plugin.getName() === 'Table';
			});
			if (!tablePluginExists) {
				nodes.push(ClipboardPlainTableNode);
			}
			return nodes;
		}
	}

	class BoldPlugin extends BasePlugin {
		constructor(editor) {
			super(editor);
			this.#registerComponents();
		}
		static getName() {
			return 'Bold';
		}
		importBBCode() {
			return {
				b: () => ({
					conversion: convertTextFormatElement,
					priority: 0
				}),
				color: () => ({
					conversion: convertTextFormatElement,
					priority: 0
				}),
				background: () => ({
					conversion: convertTextFormatElement,
					priority: 0
				}),
				size: () => ({
					conversion: convertTextFormatElement,
					priority: 0
				})
			};
		}
		exportBBCode() {
			return {
				'text:bold': (lexicalNode, node) => {
					if (lexicalNode.hasFormat('bold')) {
						return wrapNodeWith(node, 'b', this.getEditor());
					}
					return null;
				}
			};
		}
		#registerComponents() {
			this.getEditor().getComponentRegistry().register('bold', () => {
				const button = new Button();
				button.setIcon(ui_iconSet_api_core.Outline.BOLD);
				button.setFormat('bold');
				button.disableInsideUnformatted();
				button.setTooltip(main_core.Loc.getMessage('TEXT_EDITOR_BTN_BOLD', {
					'#keystroke#': main_core.Browser.isMac() ? '⌘B' : 'Ctrl+B'
				}));
				button.subscribe('onClick', () => {
					this.getEditor().focus();
					this.getEditor().update(() => {
						this.getEditor().dispatchCommand(ui_lexical_core.FORMAT_TEXT_COMMAND, 'bold');
					});
				});
				return button;
			});
		}
	}

	var Bold = /*#__PURE__*/Object.freeze({
		__proto__: null,
		BoldPlugin: BoldPlugin
	});

	class ItalicPlugin extends BasePlugin {
		constructor(editor) {
			super(editor);
			this.#registerComponents();
		}
		static getName() {
			return 'Italic';
		}
		importBBCode() {
			return {
				i: () => ({
					conversion: convertTextFormatElement,
					priority: 0
				})
			};
		}
		exportBBCode() {
			return {
				'text:italic': (lexicalNode, node) => {
					if (lexicalNode.hasFormat('italic')) {
						return wrapNodeWith(node, 'i', this.getEditor());
					}
					return null;
				}
			};
		}
		#registerComponents() {
			this.getEditor().getComponentRegistry().register('italic', () => {
				const button = new Button();
				button.setIcon(ui_iconSet_api_core.Outline.ITALIC);
				button.setFormat('italic');
				button.disableInsideUnformatted();
				button.setTooltip(main_core.Loc.getMessage('TEXT_EDITOR_BTN_ITALIC', {
					'#keystroke#': main_core.Browser.isMac() ? '⌘I' : 'Ctrl+I'
				}));
				button.subscribe('onClick', () => {
					this.getEditor().focus();
					this.getEditor().update(() => {
						this.getEditor().dispatchCommand(ui_lexical_core.FORMAT_TEXT_COMMAND, 'italic');
					});
				});
				return button;
			});
		}
	}

	var Italic = /*#__PURE__*/Object.freeze({
		__proto__: null,
		ItalicPlugin: ItalicPlugin
	});

	class StrikethroughPlugin extends BasePlugin {
		constructor(editor) {
			super(editor);
			this.#registerComponents();
			this.#registerKeyModifierCommand();
		}
		static getName() {
			return 'Strikethrough';
		}
		importBBCode() {
			return {
				s: () => ({
					conversion: convertTextFormatElement,
					priority: 0
				}),
				del: () => ({
					conversion: convertTextFormatElement,
					priority: 0
				})
			};
		}
		exportBBCode() {
			return {
				'text:strikethrough': (lexicalNode, node) => {
					if (lexicalNode.hasFormat('strikethrough')) {
						return wrapNodeWith(node, 's', this.getEditor());
					}
					return null;
				}
			};
		}
		#registerKeyModifierCommand() {
			this.cleanUpRegister(this.getEditor().registerCommand(ui_lexical_core.KEY_MODIFIER_COMMAND, payload => {
				const event = payload;
				const {
					code,
					ctrlKey,
					metaKey,
					shiftKey
				} = event;
				if (code === 'KeyX' && (ctrlKey || metaKey) && shiftKey) {
					event.preventDefault();
					this.getEditor().dispatchCommand(ui_lexical_core.FORMAT_TEXT_COMMAND, 'strikethrough');
					return true;
				}
				return false;
			}, ui_lexical_core.COMMAND_PRIORITY_NORMAL));
		}
		#registerComponents() {
			this.getEditor().getComponentRegistry().register('strikethrough', () => {
				const button = new Button();
				button.setIcon(ui_iconSet_api_core.Outline.STRIKETHROUGH);
				button.setFormat('strikethrough');
				button.disableInsideUnformatted();
				button.setTooltip(main_core.Loc.getMessage('TEXT_EDITOR_BTN_STRIKETHROUGH', {
					'#keystroke#': main_core.Browser.isMac() ? '⌘⇧X' : 'Ctrl+Shift+X'
				}));
				button.subscribe('onClick', () => {
					this.getEditor().focus();
					this.getEditor().update(() => {
						this.getEditor().dispatchCommand(ui_lexical_core.FORMAT_TEXT_COMMAND, 'strikethrough');
					});
				});
				return button;
			});
		}
	}

	var Strikethrough = /*#__PURE__*/Object.freeze({
		__proto__: null,
		StrikethroughPlugin: StrikethroughPlugin
	});

	class UnderlinePlugin extends BasePlugin {
		constructor(editor) {
			super(editor);
			this.#registerComponents();
		}
		static getName() {
			return 'Underline';
		}
		importBBCode() {
			return {
				u: () => ({
					conversion: convertTextFormatElement,
					priority: 0
				})
			};
		}
		exportBBCode() {
			return {
				'text:underline': (lexicalNode, node) => {
					if (lexicalNode.hasFormat('underline')) {
						return wrapNodeWith(node, 'u', this.getEditor());
					}
					return null;
				}
			};
		}
		#registerComponents() {
			this.getEditor().getComponentRegistry().register('underline', () => {
				const button = new Button();
				button.setIcon(ui_iconSet_api_core.Outline.UNDERLINE);
				button.setFormat('underline');
				button.disableInsideUnformatted();
				button.setTooltip(main_core.Loc.getMessage('TEXT_EDITOR_BTN_UNDERLINE', {
					'#keystroke#': main_core.Browser.isMac() ? '⌘U' : 'Ctrl+U'
				}));
				button.subscribe('onClick', () => {
					this.getEditor().focus();
					this.getEditor().update(() => {
						this.getEditor().dispatchCommand(ui_lexical_core.FORMAT_TEXT_COMMAND, 'underline');
					});
				});
				return button;
			});
		}
	}

	var Underline = /*#__PURE__*/Object.freeze({
		__proto__: null,
		UnderlinePlugin: UnderlinePlugin
	});

	const CLEAR_FORMATTING_COMMAND = ui_lexical_core.createCommand('CLEAR_FORMATTING_COMMAND');
	class ClearFormatPlugin extends BasePlugin {
		constructor(editor) {
			super(editor);
			this.#registerCommands();
			this.#registerComponents();
		}
		static getName() {
			return 'ClearFormat';
		}
		#registerCommands() {
			this.cleanUpRegister(this.getEditor().registerCommand(CLEAR_FORMATTING_COMMAND, () => {
				const selection = ui_lexical_core.$getSelection();
				if (!ui_lexical_core.$isRangeSelection(selection) && !ui_lexical_table.$isTableSelection(selection)) {
					return false;
				}
				const anchor = selection.anchor;
				const focus = selection.focus;
				const nodes = selection.getNodes();
				const extractedNodes = selection.extract();
				if (anchor.key === focus.key && anchor.offset === focus.offset) {
					return false;
				}
				nodes.forEach((node, idx) => {
					// We split the first and last node by the selection
					// So that we don't format unselected text inside those nodes
					if (ui_lexical_core.$isTextNode(node)) {
						// Use a separate variable to ensure TS does not lose the refinement
						let textNode = node;
						if (idx === 0 && anchor.offset !== 0) {
							textNode = textNode.splitText(anchor.offset)[1] || textNode;
						}
						if (idx === nodes.length - 1) {
							textNode = textNode.splitText(focus.offset)[0] || textNode;
						}
						/**
						 * If the selected text has one format applied
						 * selecting a portion of the text, could
						 * clear the format to the wrong portion of the text.
						 *
						 * The cleared text is based on the length of the selected text.
						 */
						// We need this in case the selected text only has one format
						const extractedTextNode = extractedNodes[0];
						if (nodes.length === 1 && ui_lexical_core.$isTextNode(extractedTextNode)) {
							textNode = extractedTextNode;
						}
						if (textNode.__style !== '') {
							textNode.setStyle('');
						}
						if (textNode.__format !== 0) {
							textNode.setFormat(0);
							ui_lexical_utils.$getNearestBlockElementAncestorOrThrow(textNode).setFormat('');
						}
					}
					/* else if ($isHeadingNode(node) || $isQuoteNode(node))
					{
						node.replace($createParagraphNode(), true);
					} */
				});
				return true;
			}, ui_lexical_core.COMMAND_PRIORITY_EDITOR));
		}
		#registerComponents() {
			this.getEditor().getComponentRegistry().register('clear-format', () => {
				const button = new Button();
				button.setIcon(ui_iconSet_api_core.Outline.TEXT_FORMAT_RESET);
				button.disableInsideUnformatted();
				button.setTooltip(main_core.Loc.getMessage('TEXT_EDITOR_BTN_CLEAR_FORMATTING'));
				button.subscribe('onClick', () => {
					this.getEditor().focus();
					this.getEditor().update(() => {
						this.getEditor().dispatchCommand(CLEAR_FORMATTING_COMMAND);
					});
				});
				return button;
			});
		}
	}

	class LinkEditor extends main_core_events.EventEmitter {
		#popup = null;
		#editMode = null;
		#autoLinkMode = null;
		#linkUrl = '';
		#targetContainer = null;
		#refs = new main_core_cache.MemoryCache();
		constructor(options) {
			super();
			this.setEventNamespace('BX.UI.TextEditor.LinkEditor');
			const linkEditorOptions = main_core.Type.isPlainObject(options) ? options : {};
			this.setTargetContainer(linkEditorOptions.targetContainer);
			this.setLinkUrl(linkEditorOptions.linkUrl);
			if (main_core.Type.isBoolean(linkEditorOptions.editMode)) {
				this.setEditMode(linkEditorOptions.editMode);
			} else {
				this.setEditMode(this.#linkUrl === '');
			}
			this.setAutoLinkMode(options.autoLinkMode);
			this.subscribeFromOptions(linkEditorOptions.events);
		}
		show(options = {}) {
			const target = options.target ?? undefined;
			const targetOptions = main_core.Type.isPlainObject(options.targetOptions) ? options.targetOptions : {};
			if (!main_core.Type.isUndefined(target)) {
				this.getPopup().setBindElement(target);
			}
			this.getPopup().adjustPosition({
				...targetOptions,
				forceBindPosition: true
			});
			this.getPopup().show();
		}
		isShown() {
			return this.#popup !== null && this.#popup.isShown();
		}
		hide() {
			this.getPopup().close();
		}
		destroy() {
			this.getPopup().destroy();
		}
		setAutoLinkMode(autoLinkMode = true) {
			if (autoLinkMode === this.#autoLinkMode) {
				return;
			}
			if (autoLinkMode) {
				main_core.Dom.addClass(this.getContainer(), '--auto-link-mode');
			} else {
				main_core.Dom.removeClass(this.getContainer(), '--auto-link-mode');
			}
			if (this.#popup !== null) {
				this.#popup.adjustPosition();
			}
			this.#autoLinkMode = autoLinkMode;
		}
		setEditMode(editMode = true) {
			if (editMode === this.#editMode) {
				return;
			}
			if (editMode) {
				main_core.Dom.addClass(this.getContainer(), '--edit-mode');
			} else {
				main_core.Dom.removeClass(this.getContainer(), '--edit-mode');
			}
			if (this.#popup !== null) {
				this.#popup.adjustPosition();
			}
			this.#editMode = editMode;
		}
		setLinkUrl(url) {
			if (main_core.Type.isString(url)) {
				this.#linkUrl = sanitizeUrl(url);
				this.getLinkTextBox().value = this.#linkUrl;
				this.getLinkLabel().textContent = this.#linkUrl;
				this.getLinkLabel().href = this.#linkUrl;
			}
		}
		getLinkUrl() {
			return this.#linkUrl;
		}
		setTargetContainer(container) {
			if (main_core.Type.isElementNode(container)) {
				this.#targetContainer = container;
			}
		}
		getTargetContainer() {
			return this.#targetContainer;
		}
		getPopup() {
			if (this.#popup === null) {
				this.#popup = new main_popup.Popup({
					autoHide: true,
					cacheable: false,
					padding: 0,
					closeByEsc: true,
					targetContainer: this.getTargetContainer(),
					content: this.getContainer(),
					events: {
						onClose: () => {
							this.emit('onClose');
						},
						onDestroy: () => {
							this.emit('onDestroy');
						},
						onShow: () => {
							this.emit('onShow');
						},
						onAfterShow: () => {
							if (this.#editMode) {
								this.getLinkTextBox().focus();
							}
						}
					}
				});
			}
			return this.#popup;
		}
		getContainer() {
			return this.#refs.remember('container', () => {
				return main_core.Tag.render`
				<div class="ui-text-editor-link-editor">
					<div class="ui-text-editor-link-form">
						<div class="ui-ctl ui-ctl-textbox ui-ctl-s ui-ctl-inline ui-ctl-w100 ui-text-editor-link-textbox">
							<div class="ui-ctl-tag">${main_core.Loc.getMessage('TEXT_EDITOR_LINK_URL')}</div>
							${this.getLinkTextBox()}
						</div>
						<button type="button" 
							class="ui-text-editor-link-form-button" 
							onclick="${this.#handleSaveBtnClick.bind(this)}"
							data-testid="save-link-btn"
						>
							<span class="ui-icon-set --${ui_iconSet_api_core.Outline.CHECK_L}"></span>
						</button>
						<button 
							type="button" 
							class="ui-text-editor-link-form-button"
							onclick="${this.#handleCancelBtnClick.bind(this)}"
							data-testid="cancel-link-btn"
						>
							<span class="ui-icon-set --${ui_iconSet_api_core.Outline.CROSS_L}"></span>
						</button>
					</div>
					<div class="ui-text-editor-link-preview">
						${this.getLinkLabel()}
						<button 
							type="button" 
							class="ui-text-editor-link-form-button"
							onclick="${this.#handleEditBtnClick.bind(this)}"
							data-testid="edit-link-btn"
						>
							<span class="ui-icon-set --${ui_iconSet_api_core.Outline.EDIT_L}"></span>
						</button>
						<button 
							type="button" 
							class="ui-text-editor-link-form-button ui-text-editor-link-form-delete-btn"
							onclick="${this.#handleUnlinkBtnClick.bind(this)}"
							data-testid="unlink-btn"
						>
							<span class="ui-icon-set --${ui_iconSet_api_core.Outline.UNLINK}"></span>
						</button>
					</div>
				</div>
			`;
			});
		}
		getLinkTextBox() {
			return this.#refs.remember('link-textbox', () => {
				return main_core.Tag.render`
				<input 
					type="text"
					class="ui-ctl-element"
					placeholder="https://"
					value="${this.getLinkUrl()}"
					onkeydown="${this.#handleLinkTextBoxKeyDown.bind(this)}"
					data-testid="link-textbox-input"
				>
			`;
			});
		}
		getLinkLabel() {
			return this.#refs.remember('link-label', () => {
				return main_core.Tag.render`
				<a href="" target="_blank" class="ui-text-editor-link-label"></a>
			`;
			});
		}
		#handleSaveBtnClick() {
			const url = this.getLinkTextBox().value.trim();
			if (url.length > 0) {
				this.setLinkUrl(url);
				this.emit('onSave');
			} else {
				this.getLinkTextBox().focus();
			}
		}
		#handleLinkTextBoxKeyDown(event) {
			if (event.key === 'Enter') {
				event.preventDefault();
				this.#handleSaveBtnClick();
			}
		}
		#handleCancelBtnClick() {
			this.emit('onCancel');
		}
		#handleEditBtnClick() {
			this.setEditMode(true);
			this.getLinkTextBox().focus();
			this.getLinkTextBox().select();
		}
		#handleUnlinkBtnClick() {
			this.emit('onUnlink');
		}
	}

	/* eslint-disable no-underscore-dangle */

	class CustomLinkNode extends ui_lexical_link.LinkNode {
		constructor(url = '', attributes = {}, key = null) {
			super(url, attributes, key);
		}
		static getType() {
			return 'custom-link';
		}
		static clone(node) {
			return new CustomLinkNode(node.__url, {
				rel: node.__rel,
				target: node.__target,
				title: node.__title
			}, node.__key);
		}
		static importJSON(serializedLinkNode) {
			return super.importJSON(serializedLinkNode);
		}
		exportJSON() {
			return {
				...super.exportJSON(),
				type: 'custom-link',
				version: 1
			};
		}
		createDOM(config) {
			const element = super.createDOM(config);
			element.setAttribute('data-slider-ignore-autobinding', 'true');
			return element;
		}
	}
	function $createCustomLinkNode(url = '', attributes = {}) {
		return ui_lexical_core.$applyNodeReplacement(new CustomLinkNode(url, attributes));
	}

	function validateUrl(url, allowDomainRelativeUrl = true) {
		if (allowDomainRelativeUrl) {
			return /^(http:|https:|mailto:|tel:|sms:|\/)/i.test(url);
		}
		return /^(http:|https:|mailto:|tel:|sms:)/i.test(url);
	}
	const URL_REGEX$1 = /^((https?:\/\/(www\.)?)|(www\.))[\w#%+.:=@~-]{1,256}\.[\d()A-Za-z]{1,6}\b([\w#%&()+./:=?@[\]~-]*)(?<![%()+.:\]-])$/;

	/* eslint-disable no-underscore-dangle */
	const INSERT_LINK_DIALOG_COMMAND = ui_lexical_core.createCommand('INSERT_LINK_DIALOG_COMMAND');
	class LinkPlugin extends BasePlugin {
		#linkEditor = null;
		#onEditorScroll = this.#handleEditorScroll.bind(this);
		#lastSelection = null;
		constructor(editor) {
			super(editor);
			this.#registerCommands();
			this.#registerListeners();
			this.#registerComponents();
		}
		static getName() {
			return 'Link';
		}
		static getNodes(editor) {
			return [ui_lexical_link.LinkNode, CustomLinkNode, {
				replace: ui_lexical_link.LinkNode,
				with: node => {
					return $createCustomLinkNode(node.__url, {
						rel: node.__rel,
						target: node.__target,
						title: node.__title
					});
				},
				withClass: CustomLinkNode
			}];
		}
		importBBCode() {
			return {
				url: () => ({
					conversion: node => {
						// [url]{url}[/url]
						// [url={url}]{text}[/url]
						let url = node.getValue();
						if (!validateUrl(url)) {
							url = node.toPlainText();
							if (!validateUrl(url)) {
								return {
									node: null
								};
							}
						}
						return {
							node: ui_lexical_link.$createLinkNode(sanitizeUrl(url), {
								target: '_blank'
							})
						};
					},
					priority: 0
				})
			};
		}
		exportBBCode() {
			return {
				link: lexicalNode => exportLinkNode(lexicalNode, this.getEditor()),
				'custom-link': lexicalNode => exportLinkNode(lexicalNode, this.getEditor())
			};
		}
		validateScheme() {
			return {
				nodes: [{
					nodeClass: CustomLinkNode
				}],
				bbcodeMap: {
					link: 'url',
					'custom-link': 'url'
				}
			};
		}
		#registerListeners() {
			this.cleanUpRegister(this.getEditor().registerEventListener(ui_lexical_link.LinkNode, 'click', (event, nodeKey) => {
				const linkNode = ui_lexical_core.$getNodeByKey(nodeKey);
				if (ui_lexical_link.$isLinkNode(linkNode)) {
					this.getEditor().dispatchCommand(INSERT_LINK_DIALOG_COMMAND, linkNode);
				}
			}));
		}
		#registerCommands() {
			this.cleanUpRegister(this.#registerToggleLinkCommand(), this.#registerInsertLinkCommand(), this.#registerKeyModifierCommand(), this.#registerPasteCommand());
		}
		#registerToggleLinkCommand() {
			return this.getEditor().registerCommand(ui_lexical_link.TOGGLE_LINK_COMMAND, payload => {
				if (payload === null) {
					ui_lexical_link.$toggleLink(payload);
					return true;
				}
				const selection = ui_lexical_core.$getSelection();
				if (!ui_lexical_core.$isRangeSelection(selection)) {
					return false;
				}
				let url = null;
				let originalUrl = null;
				let attributes = {};
				if (main_core.Type.isStringFilled(payload)) {
					url = payload;
				} else if (main_core.Type.isPlainObject(payload)) {
					const {
						target,
						rel,
						title
					} = payload;
					attributes = {
						rel,
						target,
						title
					};
					url = payload.url;
					originalUrl = payload.originalUrl || null;
				}
				if (main_core.Type.isStringFilled(url)) {
					if (!main_core.Type.isStringFilled(attributes.target)) {
						attributes.target = '_blank';
					}
					if (validateUrl(url)) {
						if (selection.isCollapsed() && !this.#isLinkSelected(selection)) {
							this.#insertLink(selection, url, attributes, originalUrl);
						} else {
							ui_lexical_link.$toggleLink(url, attributes);
						}
						return true;
					}
					return false;
				}
				return false;
			}, ui_lexical_core.COMMAND_PRIORITY_LOW);
		}
		#registerInsertLinkCommand() {
			return ui_lexical_utils.mergeRegister(this.getEditor().registerCommand(INSERT_LINK_DIALOG_COMMAND, payload => {
				const selection = ui_lexical_core.$getSelection();
				if (!ui_lexical_core.$isRangeSelection(selection) || !this.getEditor().isEditable()) {
					return false;
				}
				this.#lastSelection = selection.clone();
				if (this.#linkEditor !== null) {
					this.#linkEditor.destroy();
				}
				let lineNode = null;
				let linkUrl = null;
				if (ui_lexical_link.$isLinkNode(payload)) {
					lineNode = payload;
					linkUrl = lineNode.getURL();
				} else {
					const $isUnformatted = ui_lexical_utils.$findMatchingParent(selection.anchor.getNode(), node => {
						return (node.__flags & UNFORMATTED) !== 0;
					});
					if ($isUnformatted) {
						return false;
					}
					const node = getSelectedNode(selection);
					const linkParent = ui_lexical_utils.$findMatchingParent(node, ui_lexical_link.$isLinkNode);
					if (linkParent) {
						lineNode = linkParent;
						linkUrl = lineNode.getURL();
						lineNode.select();
					} else if (ui_lexical_link.$isLinkNode(node)) {
						lineNode = node;
						linkUrl = lineNode.getURL();
						lineNode.select();
					}
				}
				this.getEditor().dispatchCommand(HIDE_DIALOG_COMMAND, {
					sender: 'link-dialog'
				});
				this.#linkEditor = new LinkEditor({
					linkUrl,
					autoLinkMode: ui_lexical_link.$isAutoLinkNode(lineNode),
					// for an embedded popup: document.body -> this.getEditor().getScrollerContainer()
					targetContainer: document.body,
					events: {
						onSave: event => {
							const linkEditor = event.getTarget();
							let url = linkEditor.getLinkUrl();
							if (!main_core.Type.isStringFilled(url)) {
								linkEditor.hide();
								return;
							}
							const protocol = main_core.Validation.isEmail(url) ? 'mailto:' : 'https://';
							const originalUrl = url;
							if (!validateUrl(url)) {
								url = `${protocol}${url}`;
								linkEditor.setLinkUrl(url);
							}
							if (lineNode === null) {
								this.getEditor().update(() => {
									this.#restoreSelection();
									this.getEditor().dispatchCommand(ui_lexical_link.TOGGLE_LINK_COMMAND, {
										url,
										originalUrl,
										rel: null
									});
									linkEditor.setEditMode(false);
									const currentSelection = ui_lexical_core.$getSelection();
									if (ui_lexical_core.$isRangeSelection(currentSelection)) {
										this.#lastSelection = currentSelection.clone();
									}
									if (!ui_lexical_core.$isRangeSelection(currentSelection) || currentSelection.isCollapsed()) {
										linkEditor.hide();
									}
									this.#convertAutoLinkToLink(currentSelection);
								});
							} else {
								this.getEditor().update(() => {
									lineNode.setURL(url);
									this.#convertAutoLinkToLink(ui_lexical_core.$getSelection());
									linkEditor.setAutoLinkMode(false);
								});
								linkEditor.setEditMode(false);
							}
							this.getEditor().resetHighlightSelection();
						},
						onCancel: event => {
							const linkEditor = event.getTarget();
							linkEditor.hide();
						},
						onUnlink: event => {
							if (lineNode === null) {
								this.getEditor().dispatchCommand(ui_lexical_link.TOGGLE_LINK_COMMAND, null);
							} else {
								this.getEditor().update(() => {
									const children = lineNode.getChildren();
									for (const child of children) {
										// eslint-disable-next-line @bitrix24/bitrix24-rules/no-native-dom-methods
										lineNode.insertBefore(child);
									}
									lineNode.remove();
								});
							}
							const linkEditor = event.getTarget();
							linkEditor.hide();
						},
						onShow: () => {
							if ($adjustDialogPosition(this.#linkEditor.getPopup(), this.getEditor())) {
								main_core.Event.bind(this.getEditor().getScrollerContainer(), 'scroll', this.#onEditorScroll);
								this.getEditor().highlightSelection();
							}
						},
						onClose: () => {
							this.#handleDialogDestroy();
						},
						onDestroy: () => {
							this.#handleDialogDestroy();
						}
					}
				});
				this.#linkEditor.show();
				return true;
			}, ui_lexical_core.COMMAND_PRIORITY_LOW), this.getEditor().registerCommand(HIDE_DIALOG_COMMAND, payload => {
				if (payload?.sender === 'link-dialog') {
					return false;
				}
				this.#lastSelection = null;
				if (this.#linkEditor !== null) {
					this.#linkEditor.destroy();
				}
				return false;
			}, ui_lexical_core.COMMAND_PRIORITY_LOW), this.getEditor().registerCommand(DIALOG_VISIBILITY_COMMAND, () => {
				return this.#linkEditor !== null && this.#linkEditor.isShown();
			}, ui_lexical_core.COMMAND_PRIORITY_LOW));
		}
		#restoreSelection() {
			$restoreSelection(this.#lastSelection);
			this.#lastSelection = null;
		}
		#handleDialogDestroy() {
			if (this.#linkEditor === null) {
				return;
			}
			this.#linkEditor = null;
			main_core.Event.unbind(this.getEditor().getScrollerContainer(), 'scroll', this.#onEditorScroll);
			this.getEditor().resetHighlightSelection();
			this.getEditor().update(() => {
				this.#restoreSelection();
				// this.getEditor().focus();
			});
		}
		#handleEditorScroll() {
			this.getEditor().update(() => {
				$adjustDialogPosition(this.#linkEditor.getPopup(), this.getEditor());
			});
		}
		#registerKeyModifierCommand() {
			return this.getEditor().registerCommand(ui_lexical_core.KEY_MODIFIER_COMMAND, payload => {
				const event = payload;
				const {
					code,
					ctrlKey,
					metaKey
				} = event;
				if (code === 'KeyK' && (ctrlKey || metaKey)) {
					event.preventDefault();
					this.getEditor().dispatchCommand(INSERT_LINK_DIALOG_COMMAND);
					return true;
				}
				return false;
			}, ui_lexical_core.COMMAND_PRIORITY_NORMAL);
		}
		#registerPasteCommand() {
			return this.getEditor().registerCommand(ui_lexical_core.PASTE_COMMAND, event => {
				const selection = ui_lexical_core.$getSelection();
				if (!ui_lexical_core.$isRangeSelection(selection) || !(event instanceof ClipboardEvent) || event.clipboardData === null) {
					return false;
				}
				const clipboardText = event.clipboardData.getData('text');
				if (!URL_REGEX$1.test(clipboardText)) {
					return false;
				}
				const url = clipboardText.startsWith('http') ? clipboardText : `https://${clipboardText}`;
				if (selection.isCollapsed()) {
					const success = this.getEditor().dispatchCommand(ui_lexical_link.TOGGLE_LINK_COMMAND, {
						url
					});
					if (success) {
						event.preventDefault();
						return true;
					}
				} else if (!selection.getNodes().some(node => ui_lexical_core.$isElementNode(node))) {
					ui_lexical_link.$toggleLink(url);
					event.preventDefault();
					return true;
				}
				return false;
			}, ui_lexical_core.COMMAND_PRIORITY_NORMAL);
		}
		#insertLink(selection, url, attributes, originalUrl) {
			const linkUrl = sanitizeUrl(url);
			const linkNode = ui_lexical_link.$createLinkNode(linkUrl, attributes);
			linkNode.append(ui_lexical_core.$createTextNode(main_core.Type.isStringFilled(originalUrl) ? originalUrl : linkUrl));
			const anchor = selection.anchor;
			if (anchor.type === 'text' && anchor.getNode().isSimpleText()) {
				const anchorNode = anchor.getNode();
				const selectionOffset = anchor.offset;
				const splitNodes = anchorNode.splitText(selectionOffset);
				if (selectionOffset === 0) {
					// eslint-disable-next-line @bitrix24/bitrix24-rules/no-native-dom-methods
					splitNodes[0].insertBefore(linkNode);
					linkNode.select();
				} else {
					splitNodes[0].insertAfter(linkNode);
					linkNode.select();
				}
			} else {
				ui_lexical_core.$insertNodes([linkNode]);
				if (ui_lexical_core.$isRootOrShadowRoot(linkNode.getParentOrThrow())) {
					ui_lexical_utils.$wrapNodeInElement(linkNode, ui_lexical_core.$createParagraphNode).selectEnd();
				}
			}
		}
		#isLinkSelected(selection) {
			const node = getSelectedNode(selection);
			const parent = node.getParent();
			return ui_lexical_link.$isLinkNode(parent) || ui_lexical_link.$isLinkNode(node);
		}
		#convertAutoLinkToLink(selection) {
			if (ui_lexical_core.$isRangeSelection(selection)) {
				const parent = getSelectedNode(selection).getParent();
				if (ui_lexical_link.$isAutoLinkNode(parent)) {
					const linkNode = ui_lexical_link.$createLinkNode(parent.getURL(), {
						rel: parent.getRel(),
						target: main_core.Type.isStringFilled(parent.getTarget()) ? parent.getTarget() : '_blank',
						title: parent.getTitle()
					});
					parent.replace(linkNode, true);
					return true;
				}
			}
			return false;
		}
		#registerComponents() {
			this.getEditor().getComponentRegistry().register('link', () => {
				const button = new Button();
				button.setIcon(ui_iconSet_api_core.Outline.LINK);
				button.setTooltip(main_core.Loc.getMessage('TEXT_EDITOR_BTN_LINK'));
				button.setBlockType('link');
				button.disableInsideUnformatted();
				button.setTooltip(main_core.Loc.getMessage('TEXT_EDITOR_BTN_LINK', {
					'#keystroke#': main_core.Browser.isMac() ? '⌘K' : 'Ctrl+K'
				}));
				button.subscribe('onClick', () => {
					if (this.#linkEditor !== null && this.#linkEditor.isShown()) {
						return;
					}
					this.getEditor().focus(() => {
						this.getEditor().dispatchCommand(INSERT_LINK_DIALOG_COMMAND);
					});
				});
				return button;
			});
		}
		destroy() {
			super.destroy();
			if (this.#linkEditor !== null) {
				this.#linkEditor.destroy();
			}
		}
	}
	function exportLinkNode(lexicalNode, editor) {
		const url = lexicalNode.getURL();
		const children = lexicalNode.getChildren();
		const isSimpleText = children.length === 1 && ui_lexical_core.$isTextNode(children[0]) && children[0].getFormat() === 0;
		const scheme = editor.getBBCodeScheme();
		if (isSimpleText && children[0].getTextContent() === url) {
			return {
				node: scheme.createElement({
					name: 'url'
				})
			};
		}
		return {
			node: scheme.createElement({
				name: 'url',
				value: url
			})
		};
	}

	var Link = /*#__PURE__*/Object.freeze({
		__proto__: null,
		INSERT_LINK_DIALOG_COMMAND: INSERT_LINK_DIALOG_COMMAND,
		LinkPlugin: LinkPlugin,
		exportLinkNode: exportLinkNode
	});

	/* eslint-disable no-underscore-dangle */

	class CustomAutoLinkNode extends ui_lexical_link.AutoLinkNode {
		constructor(url = '', attributes = {}, key = null) {
			super(url, attributes, key);
		}
		static getType() {
			return 'custom-autolink';
		}
		static clone(node) {
			return new CustomAutoLinkNode(node.__url, {
				isUnlinked: node.__isUnlinked,
				rel: node.__rel,
				target: node.__target,
				title: node.__title
			}, node.__key);
		}
		static importJSON(serializedLinkNode) {
			return super.importJSON(serializedLinkNode);
		}
		exportJSON() {
			return {
				...super.exportJSON(),
				type: 'custom-autolink',
				version: 1
			};
		}
		createDOM(config) {
			const element = super.createDOM(config);
			element.setAttribute('data-slider-ignore-autobinding', 'true');
			return element;
		}
	}
	function $createCustomAutoLinkNode(url = '', attributes = {}) {
		return ui_lexical_core.$applyNodeReplacement(new CustomAutoLinkNode(url, attributes));
	}

	/* eslint-disable no-underscore-dangle */

	const URL_REGEX = /((https?:\/\/(www\.)?)|(www\.))[\w#%+.:=@~-]{1,256}\.[\d()A-Za-z]{1,6}\b([\w#%&()+./:=?@[\]~-]*)(?<![%()+.:\]-])/;
	const EMAIL_REGEX = /(([^\s"(),.:;<>@[\\\]]+(\.[^\s"(),.:;<>@[\\\]]+)*)|(".+"))@((\[(?:\d{1,3}\.){3}\d{1,3}])|(([\dA-Za-z-]+\.)+[A-Za-z]{2,}))/;
	const MATCHERS = [createLinkMatcherWithRegExp(URL_REGEX, text => {
		return text.startsWith('http') ? text : `https://${text}`;
	}), createLinkMatcherWithRegExp(EMAIL_REGEX, text => {
		return `mailto:${text}`;
	})];
	class AutoLinkPlugin extends BasePlugin {
		constructor(editor) {
			super(editor);
			this.#registerListeners();
		}
		static getName() {
			return 'AutoLink';
		}
		static getNodes(editor) {
			return [ui_lexical_link.AutoLinkNode, CustomAutoLinkNode, {
				replace: ui_lexical_link.AutoLinkNode,
				with: node => {
					return $createCustomAutoLinkNode(node.__url, {
						isUnlinked: node.__isUnlinked,
						rel: node.__rel,
						target: node.__target,
						title: node.__title
					});
				},
				withClass: CustomAutoLinkNode
			}];
		}
		exportBBCode() {
			return {
				autolink: lexicalNode => exportLinkNode(lexicalNode, this.getEditor()),
				'custom-autolink': lexicalNode => exportLinkNode(lexicalNode, this.getEditor())
			};
		}
		validateScheme() {
			return {
				nodes: [{
					nodeClass: CustomAutoLinkNode
				}],
				bbcodeMap: {
					autolink: 'url',
					'custom-autolink': 'url'
				}
			};
		}
		#registerListeners() {
			const onChange = (url, prevUrl) => {};
			this.cleanUpRegister(this.getEditor().registerNodeTransform(ui_lexical_core.TextNode, textNode => {
				const parent = textNode.getParentOrThrow();
				const previous = textNode.getPreviousSibling();
				if (ui_lexical_link.$isAutoLinkNode(parent)) {
					handleLinkEdit(parent, MATCHERS, onChange);
				} else if (!ui_lexical_link.$isLinkNode(parent)) {
					if (textNode.isSimpleText() && (startsWithSeparator(textNode.getTextContent()) || !ui_lexical_link.$isAutoLinkNode(previous))) {
						const $isUnformatted = ui_lexical_utils.$findMatchingParent(textNode, parentNode => {
							return (parentNode.__flags & UNFORMATTED) !== 0;
						});
						if (!$isUnformatted) {
							handleLinkCreation(textNode, MATCHERS, onChange);
						}
					}
					handleBadNeighbors(textNode, MATCHERS, onChange);
				}
			}));
		}
	}
	function createLinkMatcherWithRegExp(regExp, urlTransformer = text => text) {
		return text => {
			const match = regExp.exec(text);
			if (match === null) {
				return null;
			}
			return {
				index: match.index,
				length: match[0].length,
				text: match[0],
				url: urlTransformer(text)
			};
		};
	}
	function findFirstMatch(text, matchers) {
		for (const matcher of matchers) {
			const match = matcher(text);
			if (match) {
				return match;
			}
		}
		return null;
	}
	const PUNCTUATION_OR_SPACE = /[\s(),.;[\]]/;
	function isSeparator(char) {
		return PUNCTUATION_OR_SPACE.test(char);
	}
	function endsWithSeparator(textContent) {
		return isSeparator(textContent[textContent.length - 1]);
	}
	function startsWithSeparator(textContent) {
		return isSeparator(textContent[0]);
	}
	function startsWithFullStop(textContent) {
		return /^\.[\dA-Za-z]+/.test(textContent);
	}
	function isPreviousNodeValid(node) {
		let previousNode = node.getPreviousSibling();
		if (ui_lexical_core.$isElementNode(previousNode)) {
			previousNode = previousNode.getLastDescendant();
		}
		return previousNode === null || ui_lexical_core.$isLineBreakNode(previousNode) || ui_lexical_core.$isTextNode(previousNode) && endsWithSeparator(previousNode.getTextContent());
	}
	function isNextNodeValid(node) {
		let nextNode = node.getNextSibling();
		if (ui_lexical_core.$isElementNode(nextNode)) {
			nextNode = nextNode.getFirstDescendant();
		}
		return nextNode === null || ui_lexical_core.$isLineBreakNode(nextNode) || ui_lexical_core.$isTextNode(nextNode) && startsWithSeparator(nextNode.getTextContent());
	}
	function isContentAroundIsValid(matchStart, matchEnd, text, node) {
		const contentBeforeIsValid = matchStart > 0 ? isSeparator(text[matchStart - 1]) : isPreviousNodeValid(node);
		if (!contentBeforeIsValid) {
			return false;
		}

		// contentAfterIsValid
		return matchEnd < text.length ? isSeparator(text[matchEnd]) : isNextNodeValid(node);
	}
	function handleLinkCreation(node, matchers, onChange) {
		const nodeText = node.getTextContent();
		let text = nodeText;
		let invalidMatchEnd = 0;
		let remainingTextNode = node;
		let match = findFirstMatch(text, matchers);
		while (match !== null) {
			const matchStart = match.index;
			const matchLength = match.length;
			const matchEnd = matchStart + matchLength;
			const isValid = isContentAroundIsValid(invalidMatchEnd + matchStart, invalidMatchEnd + matchEnd, nodeText, node);
			if (isValid) {
				let linkTextNode = null;
				if (invalidMatchEnd + matchStart === 0) {
					[linkTextNode, remainingTextNode] = remainingTextNode.splitText(invalidMatchEnd + matchLength);
				} else {
					[, linkTextNode, remainingTextNode] = remainingTextNode.splitText(invalidMatchEnd + matchStart, invalidMatchEnd + matchStart + matchLength);
				}
				const attributes = main_core.Type.isPlainObject(match.attributes) ? {
					...match.attributes
				} : {};
				if (!main_core.Type.isStringFilled(attributes.target)) {
					attributes.target = '_blank';
				}
				const linkNode = ui_lexical_link.$createAutoLinkNode(match.url, attributes);
				const textNode = ui_lexical_core.$createTextNode(match.text);
				textNode.setFormat(linkTextNode.getFormat());
				textNode.setDetail(linkTextNode.getDetail());
				linkNode.append(textNode);
				linkTextNode.replace(linkNode);
				onChange(match.url, null);
				invalidMatchEnd = 0;
			} else {
				invalidMatchEnd += matchEnd;
			}
			text = text.slice(Math.max(0, matchEnd));
			match = findFirstMatch(text, matchers);
		}
	}
	function handleLinkEdit(linkNode, matchers, onChange) {
		// Check children are simple text
		const children = linkNode.getChildren();
		const childrenLength = children.length;
		for (let i = 0; i < childrenLength; i++) {
			const child = children[i];
			if (!ui_lexical_core.$isTextNode(child) || !child.isSimpleText()) {
				replaceWithChildren(linkNode);
				onChange(null, linkNode.getURL());
				return;
			}
		}

		// Check text content fully matches
		const text = linkNode.getTextContent();
		const match = findFirstMatch(text, matchers);
		if (match === null || match.text !== text) {
			replaceWithChildren(linkNode);
			onChange(null, linkNode.getURL());
			return;
		}

		// Check neighbors
		if (!isPreviousNodeValid(linkNode) || !isNextNodeValid(linkNode)) {
			replaceWithChildren(linkNode);
			onChange(null, linkNode.getURL());
			return;
		}
		const url = linkNode.getURL();
		if (url !== match.url) {
			linkNode.setURL(match.url);
			onChange(match.url, url);
		}
		if (match.attributes) {
			const rel = linkNode.getRel();
			if (rel !== match.attributes.rel) {
				linkNode.setRel(match.attributes.rel || null);
				onChange(match.attributes.rel || null, rel);
			}
			const target = linkNode.getTarget();
			if (target !== match.attributes.target) {
				linkNode.setTarget(match.attributes.target || null);
				onChange(match.attributes.target || null, target);
			}
		}
	}

	// Bad neighbours are edits in neighbor nodes that make AutoLinks incompatible.
	// Given the creation preconditions, these can only be simple text nodes.
	function handleBadNeighbors(textNode, matchers, onChange) {
		const previousSibling = textNode.getPreviousSibling();
		const nextSibling = textNode.getNextSibling();
		const text = textNode.getTextContent();
		if (ui_lexical_link.$isAutoLinkNode(previousSibling) && (!startsWithSeparator(text) || startsWithFullStop(text))) {
			previousSibling.append(textNode);
			handleLinkEdit(previousSibling, matchers, onChange);
			onChange(null, previousSibling.getURL());
		}
		if (ui_lexical_link.$isAutoLinkNode(nextSibling) && !endsWithSeparator(text)) {
			replaceWithChildren(nextSibling);
			handleLinkEdit(nextSibling, matchers, onChange);
			onChange(null, nextSibling.getURL());
		}
	}
	function replaceWithChildren(node) {
		const children = node.getChildren();
		const childrenLength = children.length;
		for (let j = childrenLength - 1; j >= 0; j--) {
			node.insertAfter(children[j]);
		}
		node.remove();
		return children.map(child => child.getLatest());
	}

	var AutoLink = /*#__PURE__*/Object.freeze({
		__proto__: null,
		AutoLinkPlugin: AutoLinkPlugin
	});

	class TabIndentPlugin extends BasePlugin {
		constructor(editor) {
			super(editor);
			this.#registerListeners();
		}
		static getName() {
			return 'TabIndent';
		}
		#registerListeners() {
			this.cleanUpRegister(this.getEditor().registerCommand(ui_lexical_core.KEY_TAB_COMMAND, event => {
				const selection = ui_lexical_core.$getSelection();
				if (!ui_lexical_core.$isRangeSelection(selection)) {
					return false;
				}
				return this.getEditor().dispatchCommand(event.shiftKey ? ui_lexical_core.OUTDENT_CONTENT_COMMAND : ui_lexical_core.INDENT_CONTENT_COMMAND, {
					event,
					triggerByTab: true
				});
			}, ui_lexical_core.COMMAND_PRIORITY_EDITOR),
			// Turn off RichText built-in indents
			this.getEditor().registerCommand(ui_lexical_core.INDENT_CONTENT_COMMAND, payload => {
				const selection = ui_lexical_core.$getSelection();
				if ($isSelectionInList(selection)) {
					payload?.event.preventDefault();
					return false;
				}
				return true;
			}, ui_lexical_core.COMMAND_PRIORITY_LOW), this.getEditor().registerCommand(ui_lexical_core.OUTDENT_CONTENT_COMMAND, payload => {
				const selection = ui_lexical_core.$getSelection();
				if ($isSelectionInList(selection)) {
					payload?.event.preventDefault();
					return false;
				}
				return true;
			}, ui_lexical_core.COMMAND_PRIORITY_LOW));
		}
	}
	function $isSelectionInList(selection) {
		if (!ui_lexical_core.$isRangeSelection(selection)) {
			return false;
		}
		const isBackward = selection.isBackward();
		const firstPoint = isBackward ? selection.focus : selection.anchor;
		const firstNode = firstPoint.getNode();
		if (ui_lexical_list.$isListItemNode(firstNode)) {
			return true;
		}
		const parentNode = ui_lexical_utils.$findMatchingParent(firstNode, node => ui_lexical_core.$isElementNode(node) && !node.isInline());
		return ui_lexical_list.$isListItemNode(parentNode);
	}

	var TabIndent = /*#__PURE__*/Object.freeze({
		__proto__: null,
		TabIndentPlugin: TabIndentPlugin
	});

	class ListPlugin extends BasePlugin {
		#maxIndent = 5;
		constructor(editor) {
			super(editor);
			this.#maxIndent = editor.getOption('list.maxIndent', this.#maxIndent);
			this.#registerListeners();
			this.#registerComponents();
		}
		static getName() {
			return 'List';
		}
		static getNodes(editor) {
			return [ui_lexical_list.ListNode, ui_lexical_list.ListItemNode];
		}
		importBBCode() {
			return {
				list: () => ({
					conversion: node => {
						return {
							node: node.getValue() === '1' ? ui_lexical_list.$createListNode('number', 1) : ui_lexical_list.$createListNode('bullet')
							// after: (childLexicalNodes: Array<LexicalNode>): Array<LexicalNode> => {
							// 	const normalizedListItems: Array<ListItemNode> = [];
							// 	for (const node of childLexicalNodes)
							// 	{
							// 		if ($isListItemNode(node))
							// 		{
							// 			normalizedListItems.push(node);
							// 			const children = node.getChildren();
							// 			if (children.length > 1)
							// 			{
							// 				children.forEach((child) => {
							// 					if ($isListNode(child))
							// 					{
							// 						normalizedListItems.push(this.#wrapInListItem(child));
							// 					}
							// 				});
							// 			}
							// 		}
							// 		else
							// 		{
							// 			normalizedListItems.push(this.#wrapInListItem(node));
							// 		}
							// 	}
							//
							// 	return normalizedListItems;
							// },
						};
					},
					priority: 0
				}),
				'*': () => ({
					conversion: node => {
						return {
							node: ui_lexical_list.$createListItemNode()
						};
					},
					priority: 0
				})
			};
		}
		exportBBCode() {
			return {
				list: lexicalNode => {
					const scheme = this.getEditor().getBBCodeScheme();
					const node = scheme.createElement({
						name: 'list'
					});
					if (lexicalNode.getListType() === 'number') {
						node.setValue('1');
					}
					return {
						node
					};
				},
				listitem: lexicalNode => {
					const scheme = this.getEditor().getBBCodeScheme();
					return {
						node: scheme.createElement({
							name: '*'
						})
					};
				}
			};
		}
		validateScheme() {
			return {
				nodes: [{
					nodeClass: ui_lexical_list.ListNode
				}],
				bbcodeMap: {
					list: 'list',
					listitem: '*'
				}
			};
		}

		// static #wrapInListItem(node: LexicalNode): ListItemNode
		// {
		// 	const listItemWrapper = $createListItemNode();
		//
		// 	return listItemWrapper.append(node);
		// }

		#registerListeners() {
			this.cleanUpRegister(this.getEditor().registerCommand(ui_lexical_list.INSERT_ORDERED_LIST_COMMAND, () => {
				ui_lexical_list.insertList(this.getLexicalEditor(), 'number');
				return true;
			}, ui_lexical_core.COMMAND_PRIORITY_LOW), this.getEditor().registerCommand(ui_lexical_list.INSERT_UNORDERED_LIST_COMMAND, () => {
				ui_lexical_list.insertList(this.getLexicalEditor(), 'bullet');
				return true;
			}, ui_lexical_core.COMMAND_PRIORITY_LOW), this.getEditor().registerCommand(ui_lexical_list.REMOVE_LIST_COMMAND, () => {
				ui_lexical_list.removeList(this.getLexicalEditor());
				return true;
			}, ui_lexical_core.COMMAND_PRIORITY_LOW), this.getEditor().registerCommand(ui_lexical_core.INSERT_PARAGRAPH_COMMAND, () => {
				return ui_lexical_list.$handleListInsertParagraph();
			}, ui_lexical_core.COMMAND_PRIORITY_LOW), this.getEditor().registerCommand(ui_lexical_core.INDENT_CONTENT_COMMAND, payload => {
				const totalDepth = this.#getTotalListDepth();
				if (totalDepth > 0) {
					payload?.event.preventDefault();
					return totalDepth > this.#maxIndent;
				}
				return false;
			}, ui_lexical_core.COMMAND_PRIORITY_CRITICAL));
		}
		#registerComponents() {
			this.getEditor().getComponentRegistry().register('bulleted-list', () => {
				const button = new Button();
				button.setIcon(ui_iconSet_api_core.Outline.BULLETED_LIST);
				button.setBlockType('bullet');
				button.setTooltip(main_core.Loc.getMessage('TEXT_EDITOR_BTN_BULLETED_LIST'));
				button.subscribe('onClick', () => {
					this.getEditor().focus();
					this.getEditor().update(() => {
						if (button.isActive()) {
							this.getEditor().dispatchCommand(ui_lexical_list.REMOVE_LIST_COMMAND);
						} else {
							this.getEditor().dispatchCommand(ui_lexical_list.INSERT_UNORDERED_LIST_COMMAND);
						}
					});
				});
				return button;
			});
			this.getEditor().getComponentRegistry().register('numbered-list', () => {
				const button = new Button();
				button.setIcon(ui_iconSet_api_core.Outline.NUMBERED_LIST);
				button.setTooltip(main_core.Loc.getMessage('TEXT_EDITOR_BTN_NUMBERED_LIST'));
				button.setBlockType('number');
				button.subscribe('onClick', () => {
					this.getEditor().focus();
					this.getEditor().update(() => {
						if (button.isActive()) {
							this.getEditor().dispatchCommand(ui_lexical_list.REMOVE_LIST_COMMAND);
						} else {
							this.getEditor().dispatchCommand(ui_lexical_list.INSERT_ORDERED_LIST_COMMAND);
						}
					});
				});
				return button;
			});
		}
		#getTotalListDepth() {
			const selection = ui_lexical_core.$getSelection();
			if (!ui_lexical_core.$isRangeSelection(selection)) {
				return 0;
			}
			const elementNodesInSelection = this.#getElementNodesInSelection(selection);
			let totalDepth = 0;
			for (const elementNode of elementNodesInSelection) {
				if (ui_lexical_list.$isListNode(elementNode)) {
					totalDepth = Math.max(ui_lexical_list.$getListDepth(elementNode) + 1, totalDepth);
				} else if (ui_lexical_list.$isListItemNode(elementNode)) {
					const parent = elementNode.getParent();
					if (!ui_lexical_list.$isListNode(parent)) {
						throw new Error('TextEditor: A ListItemNode must have a ListNode for a parent.');
					}
					totalDepth = Math.max(ui_lexical_list.$getListDepth(parent) + 1, totalDepth);
				}
			}
			return totalDepth;
		}
		#getElementNodesInSelection(selection) {
			const nodesInSelection = selection.getNodes();
			const predicate = node => ui_lexical_core.$isElementNode(node) && !node.isInline();
			if (nodesInSelection.length === 0) {
				return new Set([ui_lexical_utils.$findMatchingParent(selection.anchor.getNode(), predicate), ui_lexical_utils.$findMatchingParent(selection.focus.getNode(), predicate)]);
			}
			return new Set(nodesInSelection.map(n => ui_lexical_core.$isElementNode(n) ? n : ui_lexical_utils.$findMatchingParent(n, predicate)));
		}
	}

	var List = /*#__PURE__*/Object.freeze({
		__proto__: null,
		ListPlugin: ListPlugin
	});

	class TableDialog extends main_core_events.EventEmitter {
		#popup = null;
		#targetNode = null;
		#refs = new main_core_cache.MemoryCache();
		#lastSelectedBox = null;
		constructor(dialogOptions) {
			super();
			this.setEventNamespace('BX.UI.TextEditor.TableDialog');
			const options = main_core.Type.isPlainObject(dialogOptions) ? dialogOptions : {};
			this.setTargetNode(options.targetNode);
			this.subscribeFromOptions(options.events);
		}
		show() {
			this.getPopup().adjustPosition({
				forceBindPosition: true
			});
			this.getPopup().show();
		}
		hide() {
			this.getPopup().close();
		}
		isShown() {
			return this.#popup !== null && this.#popup.isShown();
		}
		destroy() {
			this.getPopup().destroy();
		}
		setTargetNode(container) {
			if (main_core.Type.isElementNode(container)) {
				this.#targetNode = container;
			}
		}
		getTargetNode() {
			return this.#targetNode;
		}
		getPopup() {
			if (this.#popup === null) {
				const targetNode = this.getTargetNode();
				const rect = targetNode.getBoundingClientRect();
				const targetNodeWidth = rect.width;
				this.#popup = new main_popup.Popup({
					autoHide: true,
					closeByEsc: true,
					padding: 0,
					content: main_core.Tag.render`
					<div class="ui-text-editor-table-dialog" onclick="${this.#handleClick.bind(this)}">
						${this.getGridContainer()}
						${this.getCaptionContainer()}
					</div>
				`,
					bindElement: this.getTargetNode(),
					events: {
						onClose: () => {
							this.emit('onClose');
						},
						onDestroy: () => {
							this.emit('onDestroy');
						},
						onShow: event => {
							const popup = event.getTarget();
							const popupWidth = popup.getPopupContainer().offsetWidth;
							const offsetLeft = targetNodeWidth / 2 - popupWidth / 2;
							const angleShift = main_popup.Popup.getOption('angleLeftOffset') - main_popup.Popup.getOption('angleMinTop');
							popup.setAngle({
								offset: popupWidth / 2 - angleShift
							});
							popup.setOffset({
								offsetLeft: offsetLeft + main_popup.Popup.getOption('angleLeftOffset')
							});
							this.#lastSelectedBox = null;
							this.#highlightBoxes(1, 1);
						}
					}
				});
			}
			return this.#popup;
		}
		getGridContainer() {
			return this.#refs.remember('grid', () => {
				const buttons = [];
				for (let index = 0; index < 100; index++) {
					const row = Math.floor(index / 10);
					const column = index % 10;
					buttons.push(main_core.Tag.render`
					<button
						class="ui-text-editor-table-dialog-box"
						data-column="${column + 1}"
						data-row="${row + 1}"
					></button>
				`);
				}
				return main_core.Tag.render`
				<div 
					class="ui-text-editor-table-dialog-grid" 
					onmousemove="${this.#handleMouseMove.bind(this)}"
				>${buttons}</div>
			`;
			});
		}
		getCaptionContainer() {
			return this.#refs.remember('caption', () => {
				return main_core.Tag.render`<div class="ui-text-editor-table-dialog-caption"></div>`;
			});
		}
		#handleMouseMove(event) {
			if (this.#lastSelectedBox !== event.target && main_core.Dom.hasClass(event.target, 'ui-text-editor-table-dialog-box')) {
				const {
					row,
					column
				} = event.target.dataset;
				this.#highlightBoxes(row, column);
				this.#lastSelectedBox = event.target;
			}
		}
		#handleClick(event) {
			if (this.#lastSelectedBox) {
				const {
					row,
					column
				} = this.#lastSelectedBox.dataset;
				this.emit('onSelect', {
					rows: row,
					columns: column
				});
			}
		}
		#highlightBoxes(rows, columns) {
			let index = 0;
			for (const box of this.getGridContainer().children) {
				const boxRow = Math.floor(index / 10);
				const boxColumn = index % 10;
				const selected = boxRow < rows && boxColumn < columns;
				if (selected) {
					main_core.Dom.addClass(box, '--selected');
				} else {
					main_core.Dom.removeClass(box, '--selected');
				}
				index++;
			}
			this.getCaptionContainer().textContent = rows && columns ? `${rows} x ${columns}` : '';
		}
	}

	/* eslint-disable @bitrix24/bitrix24-rules/no-native-dom-methods */
	const INSERT_TABLE_DIALOG_COMMAND = ui_lexical_core.createCommand('INSERT_TABLE_DIALOG_COMMAND');
	class TablePlugin extends BasePlugin {
		#tableDialog = null;
		constructor(editor) {
			super(editor);
			this.#registerCommands();
			this.#registerListeners();
			this.#registerComponents();
		}
		static getName() {
			return 'Table';
		}
		static getNodes(editor) {
			return [ui_lexical_table.TableNode, ui_lexical_table.TableCellNode, ui_lexical_table.TableRowNode];
		}
		importBBCode() {
			return {
				table: () => ({
					conversion: node => {
						return {
							node: ui_lexical_table.$createTableNode()
						};
					},
					priority: 0
				}),
				tr: () => ({
					conversion: node => {
						return {
							node: ui_lexical_table.$createTableRowNode()
						};
					},
					priority: 0
				}),
				td: () => ({
					conversion: node => {
						return {
							node: ui_lexical_table.$createTableCellNode(),
							after: childLexicalNodes => {
								return $normalizeTextNodes(childLexicalNodes);
							}
						};
					},
					priority: 0
				}),
				th: () => ({
					conversion: node => {
						return {
							node: ui_lexical_table.$createTableCellNode(ui_lexical_table.TableCellHeaderStates.ROW),
							after: childLexicalNodes => {
								return $normalizeTextNodes(childLexicalNodes);
							}
						};
					},
					priority: 0
				})
			};
		}
		exportBBCode() {
			return {
				table: () => {
					const scheme = this.getEditor().getBBCodeScheme();
					return {
						node: scheme.createElement({
							name: 'table'
						})
					};
				},
				tablerow: () => {
					const scheme = this.getEditor().getBBCodeScheme();
					return {
						node: scheme.createElement({
							name: 'tr'
						})
					};
				},
				tablecell: node => {
					const scheme = this.getEditor().getBBCodeScheme();
					return {
						node: scheme.createElement({
							name: node.hasHeader() ? 'th' : 'td'
						})
					};
				}
			};
		}
		validateScheme() {
			return {
				nodes: [{
					nodeClass: ui_lexical_table.TableNode,
					validate: tableNode => {
						if (tableNode.getChildrenSize() === 0) {
							tableNode.remove();
							return true;
						}
						return false;
					}
				}, {
					nodeClass: ui_lexical_table.TableCellNode,
					validate: tableCellNode => {
						tableCellNode.getChildren().forEach(child => {
							if (shouldWrapInParagraph(child)) {
								const paragraph = ui_lexical_core.$createParagraphNode();
								child.replace(paragraph);
								paragraph.append(child);
							}
						});
						return false;
					}
				}],
				bbcodeMap: {
					table: 'table',
					tablerow: 'tr',
					tablecell: 'td'
				}
			};
		}
		#registerComponents() {
			this.getEditor().getComponentRegistry().register('table', () => {
				const button = new Button();
				button.setIcon(ui_iconSet_api_core.Outline.TABLE);
				button.setTooltip(main_core.Loc.getMessage('TEXT_EDITOR_BTN_TABLE'));
				button.subscribe('onClick', () => {
					this.getEditor().dispatchCommand(INSERT_TABLE_DIALOG_COMMAND, {
						targetNode: button.getContainer()
					});
				});
				return button;
			});
		}
		#registerCommands() {
			this.cleanUpRegister(this.getEditor().registerCommand(ui_lexical_table.INSERT_TABLE_COMMAND, ({
				columns,
				rows
			}) => {
				const rowCount = Math.max(1, main_core.Text.toNumber(rows));
				const columnCount = Math.max(1, main_core.Text.toNumber(columns));
				const tableNode = ui_lexical_table.$createTableNodeWithDimensions(rowCount, columnCount, false);
				ui_lexical_utils.$insertNodeToNearestRoot(tableNode);
				const firstDescendant = tableNode.getFirstDescendant();
				if (ui_lexical_core.$isTextNode(firstDescendant)) {
					firstDescendant.select();
				}
				return true;
			}, ui_lexical_core.COMMAND_PRIORITY_EDITOR), this.getEditor().registerCommand(INSERT_TABLE_DIALOG_COMMAND, payload => {
				if (!main_core.Type.isPlainObject(payload) || !main_core.Type.isElementNode(payload.targetNode)) {
					return false;
				}
				if (this.#tableDialog !== null) {
					if (this.#tableDialog.getTargetNode() === payload.targetNode) {
						this.#tableDialog.show();
						return true;
					}
					this.#tableDialog.destroy();
				}
				this.#tableDialog = new TableDialog({
					targetNode: payload.targetNode,
					events: {
						onSelect: event => {
							this.getEditor().dispatchCommand(ui_lexical_table.INSERT_TABLE_COMMAND, event.getData());
							this.#tableDialog.hide();
						},
						onDestroy: () => {
							this.#tableDialog = null;
						}
					}
				});
				this.#tableDialog.show();
				return true;
			}, ui_lexical_core.COMMAND_PRIORITY_LOW), this.getEditor().registerCommand(HIDE_DIALOG_COMMAND, () => {
				if (this.#tableDialog !== null) {
					this.#tableDialog.hide();
				}
				return false;
			}, ui_lexical_core.COMMAND_PRIORITY_LOW), this.getEditor().registerCommand(DIALOG_VISIBILITY_COMMAND, () => {
				return this.#tableDialog !== null && this.#tableDialog.isShown();
			}, ui_lexical_core.COMMAND_PRIORITY_LOW));
		}
		#registerListeners() {
			const tableSelections = new Map();
			const initializeTableNode = tableNode => {
				const nodeKey = tableNode.getKey();
				const tableElement = this.getEditor().getElementByKey(nodeKey);
				if (tableElement && !tableSelections.has(nodeKey)) {
					const tableSelection = ui_lexical_table.applyTableHandlers(tableNode, tableElement, this.getLexicalEditor(), true);
					tableSelections.set(nodeKey, tableSelection);
				}
			};
			this.cleanUpRegister(this.getEditor().registerMutationListener(ui_lexical_table.TableNode, nodeMutations => {
				for (const [nodeKey, mutation] of nodeMutations) {
					if (mutation === 'created') {
						this.getEditor().getEditorState().read(() => {
							const tableNode = ui_lexical_core.$getNodeByKey(nodeKey);
							if (ui_lexical_table.$isTableNode(tableNode)) {
								initializeTableNode(tableNode);
							}
						});
					} else if (mutation === 'destroyed') {
						const tableSelection = tableSelections.get(nodeKey);
						if (tableSelection !== undefined) {
							tableSelection.removeListeners();
							tableSelections.delete(nodeKey);
						}
					}
				}
			}));
		}
		destroy() {
			super.destroy();
			if (this.#tableDialog !== null) {
				this.#tableDialog.destroy();
			}
		}
	}

	var Table = /*#__PURE__*/Object.freeze({
		__proto__: null,
		INSERT_TABLE_DIALOG_COMMAND: INSERT_TABLE_DIALOG_COMMAND,
		TablePlugin: TablePlugin
	});

	/* eslint-disable no-underscore-dangle */
	class HashtagNode extends ui_lexical_core.TextNode {
		static getType() {
			return 'hashtag';
		}
		static clone(node) {
			return new HashtagNode(node.__text, node.__key);
		}
		constructor(text, key) {
			super(text, key);
		}
		createDOM(config) {
			const element = super.createDOM(config);
			if (main_core.Type.isStringFilled(config?.theme?.hashtag)) {
				main_core.Dom.addClass(element, config.theme.hashtag);
			}
			return element;
		}
		static importJSON(serializedNode) {
			const node = $createHashtagNode(serializedNode.text);
			node.setFormat(serializedNode.format);
			node.setDetail(serializedNode.detail);
			node.setMode(serializedNode.mode);
			node.setStyle(serializedNode.style);
			return node;
		}
		exportJSON() {
			return {
				...super.exportJSON(),
				type: 'hashtag'
			};
		}
		canInsertTextBefore() {
			return false;
		}
		isTextEntity() {
			return true;
		}
	}
	function $createHashtagNode(text = '') {
		return ui_lexical_core.$applyNodeReplacement(new HashtagNode(text));
	}
	function $isHashtagNode(node) {
		return node instanceof HashtagNode;
	}

	class HashtagPlugin extends BasePlugin {
		constructor(editor) {
			super(editor);
			this.#registerListeners();
		}
		static getName() {
			return 'Hashtag';
		}
		static getNodes(editor) {
			return [HashtagNode];
		}
		importBBCode() {
			return null;
		}
		exportBBCode() {
			return {
				hashtag: (lexicalNode, node) => {
					const scheme = this.getEditor().getBBCodeScheme();
					return {
						node: scheme.createText(lexicalNode.getTextContent())
					};
				}
			};
		}
		validateScheme() {
			return {
				bbcodeMap: {
					hashtag: '#text'
				}
			};
		}
		#registerListeners() {
			const createHashtagNode = textNode => {
				return $createHashtagNode(textNode.getTextContent());
			};
			const getHashtagMatch = text => {
				const match = /(?<=\s+|^)#([^\s,.<>[\]]+)/is.exec(text);
				if (match === null) {
					return null;
				}
				const hashtagLength = match[0].length;
				const startOffset = match.index;
				const endOffset = startOffset + hashtagLength;
				return {
					end: endOffset,
					start: startOffset
				};
			};
			this.cleanUpRegister(...ui_lexical_text.registerLexicalTextEntity(this.getLexicalEditor(), getHashtagMatch, HashtagNode, createHashtagNode));
		}
	}

	var Hashtag = /*#__PURE__*/Object.freeze({
		__proto__: null,
		$createHashtagNode: $createHashtagNode,
		$isHashtagNode: $isHashtagNode,
		HashtagNode: HashtagNode,
		HashtagPlugin: HashtagPlugin
	});

	function $createNodesFromText(text) {
		if (!main_core.Type.isStringFilled(text)) {
			return [];
		}
		const nodes = [];
		const parts = text.split(/(\r?\n|\t)/);
		const length = parts.length;
		for (let i = 0; i < length; i++) {
			const part = parts[i];
			if (part === '\n' || part === '\r\n') {
				nodes.push(ui_lexical_core.$createLineBreakNode());
			} else if (part === '\t') {
				nodes.push(ui_lexical_core.$createTabNode());
			} else {
				nodes.push(ui_lexical_core.$createTextNode(part));
			}
		}
		return nodes;
	}

	const INSERT_COPILOT_DIALOG_COMMAND = ui_lexical_core.createCommand('INSERT_COPILOT_DIALOG_COMMAND');
	const CopilotStatus = {
		INIT: 'init',
		LOADING: 'loading',
		LOADED: 'loaded'
	};
	class CopilotPlugin extends BasePlugin {
		#copilot = null;
		#copilotStatus = CopilotStatus.INIT;
		#copilotOptions = null;
		#targetParagraph = null;
		#lastSelection = null;
		#onEditorScroll = this.#handleEditorScroll.bind(this);
		#triggerBySpace = false;
		constructor(editor) {
			super(editor);
			this.#copilotOptions = editor.getOption('copilot.copilotOptions');
			if (main_core.Type.isPlainObject(this.#copilotOptions)) {
				this.#registerListeners();
				this.#registerComponents();
			}
		}
		static getName() {
			return 'Copilot';
		}
		#registerListeners() {
			this.#triggerBySpace = this.getEditor().getOption('copilot.triggerBySpace', false);
			this.cleanUpRegister(this.getEditor().registerCommand(INSERT_COPILOT_DIALOG_COMMAND, payload => {
				const options = main_core.Type.isPlainObject(payload) ? payload : {};
				this.show(options);
				return true;
			}, ui_lexical_core.COMMAND_PRIORITY_EDITOR), this.getEditor().registerCommand(HIDE_DIALOG_COMMAND, payload => {
				if (payload?.sender === 'copilot') {
					return false;
				}
				this.#lastSelection = null;
				this.#hide();
				return false;
			}, ui_lexical_core.COMMAND_PRIORITY_LOW), this.getEditor().registerCommand(DIALOG_VISIBILITY_COMMAND, () => {
				return this.isCopilotShown();
			}, ui_lexical_core.COMMAND_PRIORITY_LOW), this.#triggerBySpace ? this.#registerParagraphNodeTransform() : () => {});
		}
		#registerParagraphNodeTransform() {
			return this.getEditor().registerNodeTransform(CustomParagraphNode, node => {
				if (node.getChildrenSize() !== 1 || !ui_lexical_core.$isRootNode(node.getParent())) {
					return;
				}
				if (!ui_lexical_core.$isTextNode(node.getFirstChild()) || node.getFirstChild().getTextContent() !== ' ') {
					this.#resetLoader();
					return;
				}
				const selection = ui_lexical_core.$getSelection();
				if (!ui_lexical_core.$isRangeSelection(selection) || !selection.isCollapsed()) {
					return;
				}
				const anchorNode = selection.anchor.getNode();
				if (anchorNode !== node.getFirstChild()) {
					return;
				}
				if (!this.isCopilotLoaded() && !this.isCopilotLoading()) {
					this.#resetLoader();
					this.#targetParagraph = this.getEditor().getElementByKey(node.getKey());
					if (this.#targetParagraph) {
						main_core.Dom.addClass(this.#targetParagraph, 'ui-text-editor-loading-ellipsis');
					}
				}
				node.getFirstChild().remove();
				node.select();
				this.show({
					onShow: () => this.#resetLoader(),
					onError: () => this.#resetLoader()
				});
			});
		}
		#registerComponents() {
			this.getEditor().getComponentRegistry().register('copilot', () => {
				const button = new Button();
				const copilotIconClass = `--${ui_iconSet_api_core.Outline.COPILOT}`;
				const refreshIconClass = `--${ui_iconSet_api_core.Outline.REFRESH} ui-text-editor-copilot-loading`;
				const icon = main_core.Tag.render`
				<span class="ui-icon-set ${copilotIconClass}" style="--ui-icon-set__icon-color: var(--ui-color-copilot-primary)"></span>
			`;
				button.setContent(icon);
				button.setTooltip(this.getCopilotName());
				button.subscribe('onClick', () => {
					this.getEditor().focus();
					if (this.isCopilotLoading()) {
						return;
					}
					const resetRefresh = () => {
						if (!main_core.Dom.hasClass(icon, copilotIconClass)) {
							main_core.Dom.removeClass(icon, refreshIconClass);
							main_core.Dom.addClass(icon, copilotIconClass);
						}
					};
					this.getEditor().dispatchCommand(INSERT_COPILOT_DIALOG_COMMAND, {
						onShow: resetRefresh,
						onError: resetRefresh
					});
					if (!this.isCopilotLoaded()) {
						setTimeout(() => {
							if (!this.isCopilotLoaded()) {
								main_core.Dom.removeClass(icon, copilotIconClass);
								main_core.Dom.addClass(icon, refreshIconClass);
							}
						}, 500);
					}
				});
				return button;
			});
		}
		shouldTriggerBySpace() {
			return this.#triggerBySpace;
		}
		isCopilotLoaded() {
			return this.#copilotStatus === CopilotStatus.LOADED;
		}
		isCopilotLoading() {
			return this.#copilotStatus === CopilotStatus.LOADING;
		}
		isCopilotShown() {
			return this.#copilot !== null && this.#copilot.isShown();
		}
		getCopilotName() {
			return TextEditor.getGlobalOption('copilot.name', main_core.Loc.getMessage('TEXT_EDITOR_BTN_COPILOT'));
		}
		show({
			onShow,
			onError
		} = {}) {
			if (this.isCopilotLoaded()) {
				this.#show({
					onShow
				});
			} else if (!this.isCopilotLoading()) {
				this.#createCopilot().then(() => {
					this.#show({
						onShow
					});
				}).catch(() => {
					if (main_core.Type.isFunction(onError)) {
						onError();
					}
				});
			}
		}
		#show({
			onShow
		} = {}) {
			this.getEditor().update(() => {
				const selection = ui_lexical_core.$getSelection();
				if (!ui_lexical_core.$isRangeSelection(selection) || !this.getEditor().isEditable()) {
					return;
				}
				this.getEditor().dispatchCommand(HIDE_DIALOG_COMMAND, {
					sender: 'copilot'
				});
				const selectionText = selection.getTextContent();
				const editorPosition = main_core.Dom.getPosition(this.getEditor().getScrollerContainer());
				const width = Math.min(editorPosition.width, 600);
				this.#lastSelection = selection.clone();
				const selectedText = selectionText.trim();
				if (selectedText.length > 0) {
					this.#copilot.setSelectedText(selectedText);
				} else {
					const wholeText = ui_lexical_core.$getRoot().getTextContent().trim();
					if (wholeText.length > 0) {
						this.#copilot.setContext(wholeText);
					}
				}
				this.#copilot.show({
					width
				});
				this.#adjustDialogPosition();
				main_core.Event.bind(this.getEditor().getScrollerContainer(), 'scroll', this.#onEditorScroll);
				if (!selection.isCollapsed()) {
					this.getEditor().highlightSelection();
				}
				if (main_core.Type.isFunction(onShow)) {
					onShow();
				}
			});
		}
		#hide() {
			if (this.isCopilotLoaded() && this.#copilot.isShown()) {
				this.#copilot.hide();
			}
		}
		#createCopilot() {
			if (this.isDestroyed()) {
				return Promise.reject(new Error('Copilot plugin was destroyed.'));
			}
			this.#copilotStatus = CopilotStatus.LOADING;
			return new Promise((resolve, reject) => {
				main_core.Runtime.loadExtension('ai.copilot').then(({
					Copilot,
					CopilotEvents
				}) => {
					if (this.isDestroyed()) {
						reject(new Error('Copilot plugin was destroyed.'));
						return;
					}
					this.#copilot = new Copilot({
						showResultInCopilot: true,
						...this.#copilotOptions,
						autoHide: true
					});
					this.#copilot.subscribe(CopilotEvents.FINISH_INIT, () => {
						if (this.isDestroyed()) {
							reject(new Error('Copilot plugin was destroyed.'));
							return;
						}
						this.#copilotStatus = CopilotStatus.LOADED;
						resolve();
					});
					this.#copilot.subscribe(CopilotEvents.TEXT_SAVE, this.#handleCopilotSave.bind(this));
					this.#copilot.subscribe(CopilotEvents.TEXT_PLACE_BELOW, this.#handleCopilotAddBelow.bind(this));
					this.#copilot.subscribe(CopilotEvents.HIDE, this.#handleCopilotHide.bind(this));
					this.#copilot.init();
				}).catch(() => {
					reject();
				});
			});
		}
		#resetLoader() {
			if (this.#targetParagraph) {
				main_core.Dom.removeClass(this.#targetParagraph, 'ui-text-editor-loading-ellipsis');
			}
		}

		// #handleCopilotResult(event: BaseEvent): void
		// {
		// 	console.log('#handleCopilotResult', event.getData());
		// 	const { result } = event.getData();
		// 	this.getEditor().update(
		// 		() => {
		// 			this.#targetParagraph.clear();
		// 			this.#targetParagraph.append($createTextNode(result));
		// 		},
		// 		{
		// 			onUpdate: () => {
		// 				const targetNode: HTMLElement = this.getEditor().getElementByKey(this.#targetParagraph.getKey());
		// 				this.#copilot.adjustPosition(targetNode);
		// 			},
		// 		},
		// 	);
		// }

		#adjustDialogPosition() {
			this.getEditor().update(() => {
				this.#restoreSelection();
				const selection = ui_lexical_core.$getSelection();
				const selectionPosition = $getSelectionPosition(this.getEditor(), selection, document.body);
				if (selectionPosition === null) {
					return;
				}
				this.#lastSelection = selection.clone();
				const {
					top,
					left,
					bottom
				} = selectionPosition;
				const scrollerRect = main_core.Dom.getPosition(this.getEditor().getScrollerContainer());
				const popupWidth = Math.min(scrollerRect.width, 600);
				const editorPaddings = getEditorPaddings(this.getEditor());
				let offsetLeft = popupWidth / 2;
				if (left - offsetLeft < scrollerRect.left) {
					// Left boundary
					const overflow = scrollerRect.left - (left - offsetLeft);
					offsetLeft -= overflow + editorPaddings.left;
				} else if (scrollerRect.right < left + popupWidth - offsetLeft) {
					// Right boundary
					offsetLeft += left + popupWidth - offsetLeft - scrollerRect.right + editorPaddings.right;
				}
				if (bottom < scrollerRect.top || top > scrollerRect.bottom) {
					this.#copilot.adjust({
						hide: true
					});
				} else {
					this.#copilot.adjust({
						hide: false,
						position: {
							left: left - offsetLeft,
							top: bottom
						}
					});
				}
			});
		}
		#handleEditorScroll() {
			this.#adjustDialogPosition();
		}
		#restoreSelection() {
			const success = $restoreSelection(this.#lastSelection);
			this.#lastSelection = null;
			return success;
		}
		#handleCopilotSave(event) {
			const {
				result
			} = event.getData();
			this.getEditor().update(() => {
				this.#restoreSelection();
				const selection = ui_lexical_core.$getSelection();
				if (ui_lexical_core.$isRangeSelection(selection)) {
					if (this.#isHtmlResponseFormat()) {
						selection.removeText();
						const nodes = this.#createNodesFromHtml(result);
						ui_lexical_core.$insertNodes(nodes);
					} else {
						selection.insertRawText(result);
					}
				}
				this.#hide();
			});
		}
		#handleCopilotAddBelow(event) {
			const {
				result
			} = event.getData();
			this.getEditor().update(() => {
				this.#restoreSelection();
				const selection = ui_lexical_core.$getSelection();
				if (ui_lexical_core.$isRangeSelection(selection)) {
					const focus = selection.focus;
					const focusNode = focus.getNode();
					if (!selection.isCollapsed()) {
						focusNode.selectEnd();
					}
					const parentNode = focusNode.getParent();
					if (ui_lexical_core.$isParagraphNode(parentNode)) {
						if (this.#isHtmlResponseFormat()) {
							const nodes = this.#createNodesFromHtml(result);
							const wrapper = ui_lexical_core.$createParagraphNode();
							wrapper.append(...nodes);
							parentNode.insertAfter(wrapper);
						} else {
							const paragraph = ui_lexical_core.$createParagraphNode();
							paragraph.append(...$createNodesFromText(result));
							parentNode.insertAfter(paragraph);
						}
					} else {
						selection.insertLineBreak();
						if (this.#isHtmlResponseFormat()) {
							const nodes = this.#createNodesFromHtml(result);
							ui_lexical_core.$insertNodes(nodes);
						} else {
							selection.insertRawText(result);
						}
					}
				}
				this.#hide();
			});
		}
		#handleCopilotHide() {
			main_core.Event.unbind(this.getEditor().getScrollerContainer(), 'scroll', this.#onEditorScroll);
			this.getEditor().resetHighlightSelection();
			this.getEditor().update(() => {
				this.#restoreSelection();
				// this.getEditor().focus();
			});
		}
		#isHtmlResponseFormat() {
			return this.#copilotOptions?.responseFormat === 'html';
		}
		#createNodesFromHtml(html) {
			const parser = new DOMParser();
			const dom = parser.parseFromString(html, 'text/html');
			return ui_lexical_html.$generateNodesFromDOM(this.getLexicalEditor(), dom);
		}
		destroy() {
			super.destroy();
			if (this.#copilot !== null) {
				this.#copilot.hide();
				this.#copilot = null;
			}
		}
	}

	var Copilot = /*#__PURE__*/Object.freeze({
		__proto__: null,
		CopilotPlugin: CopilotPlugin,
		INSERT_COPILOT_DIALOG_COMMAND: INSERT_COPILOT_DIALOG_COMMAND
	});

	class HistoryPlugin extends BasePlugin {
		constructor(editor) {
			super(editor);
			const historyState = ui_lexical_history.createEmptyHistoryState();
			this.cleanUpRegister(ui_lexical_history.registerHistory(editor.getLexicalEditor(), historyState, 1000));
			this.#registerComponents();
		}
		static getName() {
			return 'History';
		}
		#registerComponents() {
			let canUndo = false;
			this.getEditor().getComponentRegistry().register('undo', () => {
				const button = new Button();
				button.setIcon(ui_iconSet_api_core.Outline.UNDO);
				button.setDisabled(!canUndo);
				button.setTooltip(main_core.Loc.getMessage('TEXT_EDITOR_BTN_UNDO', {
					'#keystroke#': main_core.Browser.isMac() ? '⌘Z' : 'Ctrl+Z'
				}));
				button.subscribe('onClick', () => {
					this.getEditor().dispatchCommand(ui_lexical_core.UNDO_COMMAND);
				});
				button.setDisableCallback(() => {
					return !canUndo || !this.getEditor().isEditable();
				});
				this.getEditor().registerCommand(ui_lexical_core.CAN_UNDO_COMMAND, payload => {
					canUndo = payload;
					button.setDisabled(!canUndo);
					return false;
				}, ui_lexical_core.COMMAND_PRIORITY_CRITICAL);
				return button;
			});
			let canRedo = false;
			this.getEditor().getComponentRegistry().register('redo', () => {
				const button = new Button();
				button.setIcon(ui_iconSet_api_core.Outline.REDO);
				button.setDisabled(!canRedo);
				button.setTooltip(main_core.Loc.getMessage('TEXT_EDITOR_BTN_REDO', {
					'#keystroke#': main_core.Browser.isMac() ? '⌘⇧Z' : 'Ctrl+Y'
				}));
				button.subscribe('onClick', () => {
					this.getEditor().dispatchCommand(ui_lexical_core.REDO_COMMAND);
				});
				button.setDisableCallback(() => {
					return !canRedo || !this.getEditor().isEditable();
				});
				this.getEditor().registerCommand(ui_lexical_core.CAN_REDO_COMMAND, payload => {
					canRedo = payload;
					button.setDisabled(!canRedo);
					return false;
				}, ui_lexical_core.COMMAND_PRIORITY_CRITICAL);
				return button;
			});
		}
	}

	var History = /*#__PURE__*/Object.freeze({
		__proto__: null,
		HistoryPlugin: HistoryPlugin
	});

	const Direction = {
		DOWNWARD: 1,
		UPWARD: -1,
		INDETERMINATE: 0
	};
	const DRAG_DATA_FORMAT = 'application/x-ui-text-editor-drag-block';
	class BlockToolbarPlugin extends BasePlugin {
		#draggableBlockElement = null;
		#lastBlockElementIndex = Infinity;
		#lastTargetElement = null;
		#container = null;
		#dropLine = null;
		#isDragging = false;
		#bodyDragDropHandler = null;
		#bodyDragOverHandler = null;
		constructor(editor) {
			super(editor);
			this.cleanUpRegister(this.#registerEvents(), this.#registerListeners());
			this.#bodyDragDropHandler = event => {
				this.getEditor().dispatchCommand(ui_lexical_core.DROP_COMMAND, event);
			};
			this.#bodyDragOverHandler = event => {
				// prevent default to allow drop
				event.preventDefault();
			};
			main_core.Dom.append(this.getContainer(), this.getEditor().getScrollerContainer());
			main_core.Dom.append(this.getDropLine(), this.getEditor().getScrollerContainer());
		}
		static getName() {
			return 'BlockToolbar';
		}
		#registerEvents() {
			const scroller = this.getEditor().getScrollerContainer();
			const onMouseMove = this.#handleMouseMove.bind(this);
			const onMouseLeave = this.#handleMouseLeave.bind(this);
			main_core.Event.bind(scroller, 'mousemove', onMouseMove);
			main_core.Event.bind(scroller, 'mouseleave', onMouseLeave);
			return () => {
				main_core.Event.unbind(scroller, 'mousemove', onMouseMove);
				main_core.Event.unbind(scroller, 'mouseleave', onMouseLeave);
			};
		}
		#registerListeners() {
			return ui_lexical_utils.mergeRegister(this.getEditor().registerCommand(ui_lexical_core.DRAGOVER_COMMAND, this.#handleDragOver.bind(this), ui_lexical_core.COMMAND_PRIORITY_LOW), this.getEditor().registerCommand(ui_lexical_core.DROP_COMMAND, this.#handleDragDrop.bind(this), ui_lexical_core.COMMAND_PRIORITY_HIGH), this.getEditor().registerTextContentListener(() => {
				this.#setDraggableBlockElement(null);
				this.#updatePosition();
			}));
		}
		#handleMouseMove(event) {
			if (!this.getEditor().isEditable()) {
				return;
			}
			const target = event.target;
			if (!(target instanceof HTMLElement)) {
				this.#setDraggableBlockElement(null);
				return;
			}
			if (target.closest('.ui-text-editor-block-toolbar') !== null) {
				return;
			}
			const element = this.#findBlockElement(event);
			this.#setDraggableBlockElement(element);
		}
		#handleMouseLeave() {
			this.#setDraggableBlockElement(null);
		}
		#findBlockElement(event) {
			const scroller = this.getEditor().getScrollerContainer();
			const anchorElementRect = scroller.getBoundingClientRect();
			let blockElem = null;
			this.getEditor().getEditorState().read(() => {
				const root = ui_lexical_core.$getRoot();
				const topLevelNodeKeys = root.getChildrenKeys();
				let index = this.#getCurrentIndex(topLevelNodeKeys.length);
				let direction = Direction.INDETERMINATE;
				while (index >= 0 && index < topLevelNodeKeys.length) {
					const key = topLevelNodeKeys[index];
					const elem = this.getEditor().getElementByKey(key);
					if (elem === null) {
						break;
					}
					const domRect = elem.getBoundingClientRect();
					const {
						marginLeft,
						marginRight,
						marginTop,
						marginBottom
					} = window.getComputedStyle(elem);
					const rect = new DOMRect(anchorElementRect.left + parseFloat(marginLeft), domRect.y - parseFloat(marginTop), domRect.width + parseFloat(marginRight), domRect.height + parseFloat(marginBottom));
					const {
						x,
						y
					} = event;
					const isOnTopSide = y < rect.top;
					const isOnBottomSide = y > rect.bottom;
					const isOnLeftSide = x < rect.left;
					const isOnRightSide = x > rect.right;
					const contains = !isOnTopSide && !isOnBottomSide && !isOnLeftSide && !isOnRightSide;
					if (contains) {
						blockElem = elem;
						this.#lastBlockElementIndex = index;
						break;
					}
					if (direction === Direction.INDETERMINATE) {
						if (isOnTopSide) {
							direction = Direction.UPWARD;
						} else if (isOnBottomSide) {
							direction = Direction.DOWNWARD;
						} else {
							// stop search block element
							direction = Infinity;
						}
					}
					index += direction;
				}
			});
			return blockElem;
		}
		#getCurrentIndex(keysLength) {
			if (keysLength === 0) {
				return Infinity;
			}
			if (this.#lastBlockElementIndex >= 0 && this.#lastBlockElementIndex < keysLength) {
				return this.#lastBlockElementIndex;
			}
			return Math.floor(keysLength / 2);
		}
		#updatePosition() {
			if (this.#draggableBlockElement === null) {
				main_core.Dom.style(this.getContainer(), {
					opacity: 0,
					transform: 'translateY(-10000px)'
				});
			} else {
				// const styles: CSSStyleDeclaration = window.getComputedStyle(this.#draggableBlockElement);
				// const lineHeight: number = Text.toNumber(styles.lineHeight);
				// const toolbarHeight: number = this.getContainer().offsetHeight;
				// const offset = lineHeight > 0 ? (lineHeight - toolbarHeight) / 2 : 3;

				const offset = main_core.Text.toNumber(main_core.Dom.style(this.#draggableBlockElement, 'margin-top'));
				const top = this.#draggableBlockElement.offsetTop + offset;
				main_core.Dom.style(this.getContainer(), {
					opacity: 1,
					transform: `translateY(${top}px)`
				});
			}
		}
		#setDraggableBlockElement(element) {
			const changed = this.#draggableBlockElement !== element;
			this.#draggableBlockElement = element;
			if (changed) {
				this.#updatePosition();
			}
		}
		getContainer() {
			if (this.#container === null) {
				this.#container = main_core.Tag.render`
				<div class="ui-text-editor-block-toolbar">
					<div 
						class="ui-text-editor-block-drag-icon" 
						draggable="true"
						ondragstart="${this.#handleDragStart.bind(this)}" 
						ondragend="${this.#handleDragEnd.bind(this)}"
					>
						<div 
							class="ui-icon-set --${ui_iconSet_api_core.Outline.DRAG_S}" 
							style="--ui-icon-set__icon-size: 24px; margin-left: -4px"
						></div>
					</div>
				</div>
			`;
			}
			return this.#container;
		}
		getDropLine() {
			if (this.#dropLine === null) {
				this.#dropLine = main_core.Tag.render`
				<div class="ui-text-editor-block-drop-line"></div>
			`;
			}
			return this.#dropLine;
		}
		#handleDragStart(event) {
			const dataTransfer = event.dataTransfer;
			if (!dataTransfer || this.#draggableBlockElement === null) {
				return;
			}
			this.getEditor().dispatchCommand(HIDE_DIALOG_COMMAND);
			dataTransfer.setDragImage(this.#draggableBlockElement, 0, 0);
			let nodeKey = '';
			this.getEditor().update(() => {
				const node = ui_lexical_core.$getNearestNodeFromDOMNode(this.#draggableBlockElement);
				if (node) {
					nodeKey = node.getKey();
				}
			});
			dataTransfer.setData(DRAG_DATA_FORMAT, nodeKey);
			this.#isDragging = true;
			main_core.Event.bind(document.body, 'drop', this.#bodyDragDropHandler);
			main_core.Event.bind(document.body, 'dragover', this.#bodyDragOverHandler);
		}
		#handleDragEnd(event) {
			this.#isDragging = false;
			this.#hideDropLine();
			main_core.Event.unbind(document.body, 'drop', this.#bodyDragDropHandler);
			main_core.Event.unbind(document.body, 'dragover', this.#bodyDragOverHandler);
		}
		#handleDragOver(event) {
			if (this.#isDragging === false) {
				return false;
			}
			const hasFiles = event.dataTransfer.types.includes('Files');
			if (hasFiles || !(event.target instanceof HTMLElement)) {
				return false;
			}
			const targetBlockElement = this.#findBlockElement(event);
			if (targetBlockElement === null) {
				return false;
			}
			this.#lastTargetElement = targetBlockElement;
			this.#showDropLine(targetBlockElement, event);
			event.preventDefault();
			return true;
		}
		#handleDragDrop(event) {
			if (this.#isDragging === false) {
				return false;
			}
			const hasFiles = event.dataTransfer.types.includes('Files');
			const dragData = event.dataTransfer?.getData(DRAG_DATA_FORMAT) || '';
			if (hasFiles || !(event.target instanceof HTMLElement) || !main_core.Type.isStringFilled(dragData)) {
				return false;
			}
			const draggedNode = ui_lexical_core.$getNodeByKey(dragData);
			if (!draggedNode || !(event.target instanceof HTMLElement)) {
				return false;
			}
			const targetBlockElement = this.#findBlockElement(event) || this.#lastTargetElement;
			if (!targetBlockElement) {
				return false;
			}
			const targetNode = ui_lexical_core.$getNearestNodeFromDOMNode(targetBlockElement);
			if (!targetNode) {
				return false;
			}
			main_core.Event.unbind(document.body, 'drop', this.#bodyDragDropHandler);
			main_core.Event.unbind(document.body, 'dragover', this.#bodyDragOverHandler);
			if (targetNode === draggedNode) {
				return true;
			}
			const {
				top: targetBlockElemTop,
				height: targetBlockElemHeight
			} = targetBlockElement.getBoundingClientRect();
			const shouldInsertAfter = event.clientY - targetBlockElemTop > targetBlockElemHeight / 2;
			if (shouldInsertAfter) {
				targetNode.insertAfter(draggedNode);
			} else {
				// eslint-disable-next-line @bitrix24/bitrix24-rules/no-native-dom-methods
				targetNode.insertBefore(draggedNode);
			}
			this.#setDraggableBlockElement(null);
			return true;
		}
		#showDropLine(targetBlockElement, event) {
			const {
				top: targetBlockElemTop,
				height: targetBlockElemHeight
			} = targetBlockElement.getBoundingClientRect();
			const targetStyle = window.getComputedStyle(targetBlockElement);
			const relativePosition = main_core.Dom.getRelativePosition(targetBlockElement, targetBlockElement.offsetParent);
			let lineTop = relativePosition.top;
			const showAtBottom = event.clientY - targetBlockElemTop > targetBlockElemHeight / 2;
			if (showAtBottom) {
				lineTop += targetBlockElemHeight + parseFloat(targetStyle.marginBottom) * 1.5;
			} else {
				lineTop += parseFloat(targetStyle.marginTop) / 2;
			}
			const DROP_LINE_HALF_HEIGHT = 2;
			const CONTENT_EDITABLE_AREA_PADDING = 16;
			const top = lineTop - DROP_LINE_HALF_HEIGHT;
			main_core.Dom.style(this.getDropLine(), {
				opacity: 0.4,
				left: `${CONTENT_EDITABLE_AREA_PADDING}px`,
				right: `${CONTENT_EDITABLE_AREA_PADDING}px`,
				transform: `translateY(${top}px)`
			});
		}
		#hideDropLine() {
			main_core.Dom.style(this.getDropLine(), {
				opacity: 0,
				transform: 'translate(-10000px, -10000px)'
			});
		}
		destroy() {
			super.destroy();
			main_core.Dom.remove(this.getContainer());
			main_core.Dom.remove(this.getDropLine());
		}
	}

	var BlockToolbar = /*#__PURE__*/Object.freeze({
		__proto__: null,
		BlockToolbarPlugin: BlockToolbarPlugin
	});

	class Separator extends ToolbarItem {
		#container = null;
		getContainer() {
			if (this.#container === null) {
				this.#container = main_core.Tag.render`<span class="ui-text-editor-toolbar-separator"></span>`;
			}
			return this.#container;
		}
		render() {
			return this.getContainer();
		}
	}

	/* eslint-disable no-underscore-dangle */
	let Toolbar$1 = class Toolbar {
		#textEditor = null;
		#items = [];
		#rendered = false;
		#moreBtn = null;
		#refs = new main_core_cache.MemoryCache();
		#resizeObserver = null;
		#timeoutId = null;
		#removeListeners = null;
		constructor(textEditor, options) {
			this.#textEditor = textEditor;
			const toolbarOptions = main_core.Type.isArray(options) ? options : [];
			this.#fillFromOptions(toolbarOptions);
			if (this.#items.length > 0) {
				this.#removeListeners = this.#registerListeners();
				this.#resizeObserver = new ResizeObserver(this.#handleResize.bind(this));
			}
		}
		renderTo(container) {
			if (this.isRendered()) {
				return;
			}
			if (main_core.Type.isElementNode(container)) {
				this.#items.forEach(item => {
					main_core.Dom.append(item.render(), this.getItemsContainer());
				});
				main_core.Dom.append(this.getContainer(), container);
				if (this.#resizeObserver !== null) {
					this.#resizeObserver.observe(this.getContainer());
				}
				this.#rendered = true;
			}
		}
		isEmpty() {
			return this.#items.length === 0;
		}
		getContainer() {
			return this.#refs.remember('container', () => {
				return main_core.Tag.render`
				<div class="ui-text-editor-toolbar-container">
					${this.getItemsContainer()}
					${this.getMoreBtnContainer()}
				</div>
			`;
			});
		}
		getItemsContainer() {
			return this.#refs.remember('items-container', () => {
				return main_core.Tag.render`
				<div class="ui-text-editor-toolbar-items"></div>
			`;
			});
		}
		getMoreBtnContainer() {
			return this.#refs.remember('more-btn-container', () => {
				return main_core.Tag.render`
				<div class="ui-text-editor-toolbar-more-btn">
				${this.getMoreBtn().render()}
				</div>
			`;
			});
		}
		getMoreBtn() {
			if (this.#moreBtn === null) {
				const resetAnimation = () => {
					main_core.Event.unbind(this.getItemsContainer(), 'transitionend', resetAnimation);
					main_core.Dom.style(this.getItemsContainer(), {
						height: null
					});
					main_core.Dom.removeClass(this.getItemsContainer(), '--animating');
				};
				this.#moreBtn = new Button();
				this.#moreBtn.setContent('<span class="ui-text-editor-toolbar-more-btn-icon"></span>');
				this.#moreBtn.subscribe('onClick', () => {
					main_core.Event.unbind(this.getItemsContainer(), 'transitionend', resetAnimation);
					if (main_core.Dom.hasClass(this.getContainer(), '--expanded')) {
						main_core.Dom.style(this.getItemsContainer(), {
							height: `${this.getItemsContainer().scrollHeight}px`
						});
						requestAnimationFrame(() => {
							main_core.Dom.removeClass(this.getContainer(), '--expanded');
							main_core.Dom.addClass(this.getItemsContainer(), '--animating');
							main_core.Dom.style(this.getItemsContainer(), {
								height: null
							});
						});
					} else {
						main_core.Dom.addClass(this.getItemsContainer(), '--animating');
						main_core.Dom.style(this.getItemsContainer(), {
							height: `${this.getItemsContainer().scrollHeight}px`
						});
						main_core.Dom.addClass(this.getContainer(), '--expanded');
					}
					main_core.Event.bind(this.getItemsContainer(), 'transitionend', resetAnimation);
				});
			}
			return this.#moreBtn;
		}
		getItems() {
			return this.#items;
		}
		isRendered() {
			return this.#rendered;
		}
		destroy() {
			if (this.#removeListeners !== null) {
				this.#removeListeners();
			}
			if (this.#resizeObserver !== null) {
				this.#resizeObserver.disconnect();
				this.#resizeObserver = null;
			}
			if (this.isRendered()) {
				main_core.Dom.remove(this.getContainer());
			}
			if (this.#timeoutId) {
				clearTimeout(this.#timeoutId);
			}
			this.#items = null;
			this.#refs = null;
		}
		#registerListeners() {
			return ui_lexical_utils.mergeRegister(this.#textEditor.registerCommand(ui_lexical_core.SELECTION_CHANGE_COMMAND, () => {
				this.update();
				return false;
			}, ui_lexical_core.COMMAND_PRIORITY_CRITICAL), this.#textEditor.registerCommand(ui_lexical_core.FOCUS_COMMAND, () => {
				if (this.#timeoutId) {
					clearTimeout(this.#timeoutId);
					this.#timeoutId = null;
				}
				return false;
			}, ui_lexical_core.COMMAND_PRIORITY_CRITICAL), this.#textEditor.registerCommand(ui_lexical_core.BLUR_COMMAND, () => {
				if (this.#timeoutId) {
					clearTimeout(this.#timeoutId);
				}
				this.#timeoutId = setTimeout(() => {
					const activeElement = document.activeElement;
					const rootElement = this.#textEditor.getScrollerContainer();
					if (activeElement === null || !rootElement.contains(activeElement)) {
						this.reset();
					}
				}, 400);
				return false;
			}, ui_lexical_core.COMMAND_PRIORITY_CRITICAL), this.#textEditor.registerUpdateListener(() => {
				this.update();
			}), this.#textEditor.registerEditableListener(() => {
				this.update();
			}));
		}
		#fillFromOptions(options) {
			options.forEach(item => {
				if (item === '|') {
					this.#items.push(new Separator());
				} else {
					const component = this.#textEditor.getComponentRegistry().create(item);
					if (component === null) {
						// eslint-disable-next-line no-console
						console.warn(`TextEditor Toolbar: "${item}" component doesn't exist.`);
					} else {
						this.#items.push(component);
					}
				}
			});
		}
		#handleResize(entries) {
			if (this.getContainer().offsetWidth === 0 || main_core.Dom.hasClass(this.getItemsContainer(), '--animating')) {
				return;
			}
			const lastItem = this.#items.at(-1);
			if (!lastItem || lastItem.getContainer().offsetTop >= lastItem.getContainer().offsetHeight) {
				main_core.Dom.addClass(this.getContainer(), '--overflowed');
			} else {
				main_core.Dom.removeClass(this.getContainer(), ['--overflowed', '--expanded']);
			}
		}
		update() {
			this.#textEditor.getEditorState().read(() => {
				let selection = ui_lexical_core.$getSelection();
				if (!ui_lexical_core.$isRangeSelection(selection)) {
					selection = null;
				}
				let unformattedNode = null;
				if (selection !== null) {
					unformattedNode = ui_lexical_utils.$findMatchingParent(selection.anchor.getNode(), node => {
						return (node.__flags & UNFORMATTED) !== 0;
					});
				}
				const blockTypes = selection === null ? new Set() : this.#getSelectionBlockTypes(selection);
				const isReadOnly = !this.#textEditor.isEditable();
				this.#items.forEach(item => {
					if (!(item instanceof Button)) {
						return;
					}

					// First let's figure out a disabled status
					if (item.hasOwnDisableCallback()) {
						item.setDisabled(item.invokeDisableCallback());
					} else if (isReadOnly) {
						item.disable();
					} else if (unformattedNode !== null && item.shouldDisableInsideUnformatted()) {
						item.disable();
					} else {
						item.enable();
					}

					// Now set an active status
					if (item.isDisabled()) {
						item.setActive(false);
					} else if (item.hasFormat()) {
						const format = item.getFormat();
						item.setActive(selection === null ? false : selection.hasFormat(format));
					} else if (item.getBlockType() !== null) {
						item.setActive(blockTypes.has(item.getBlockType()));
					}
				});
			});
		}
		reset() {
			this.#items.forEach(item => {
				if (item instanceof Button) {
					item.setActive(false);
				}
			});
		}
		#getSelectionBlockTypes(selection) {
			const anchorNode = selection.anchor.getNode();
			const blockTypes = new Set();
			let currentNode = anchorNode;
			while (currentNode !== ui_lexical_core.$getRoot() && currentNode !== null) {
				const blockType = this.#getBlockType(currentNode);
				blockTypes.add(blockType);
				currentNode = currentNode.getParent();
			}
			return blockTypes;
		}
		#getBlockType(node) {
			if (ui_lexical_list.$isListNode(node)) {
				const listNode = node;
				const parentList = ui_lexical_utils.$getNearestNodeOfType(listNode, ui_lexical_list.ListNode);
				return parentList ? parentList.getListType() : listNode.getListType();
			}
			if (ui_lexical_link.$isLinkNode(node) || ui_lexical_link.$isAutoLinkNode(node)) {
				return 'link';
			}
			if ($isCodeTokenNode(node)) {
				return 'code';
			}
			return node.getType();
		}
	};

	/*
	eslint-disable no-underscore-dangle,
	@bitrix24/bitrix24-rules/no-pseudo-private,
	@bitrix24/bitrix24-rules/no-native-dom-methods
	*/

	class FloatingToolbarPlugin extends BasePlugin {
		#popup = null;
		#toolbar = null;
		#showDebounced = null;
		#onEditorScroll = this.#handleEditorScroll.bind(this);
		constructor(editor) {
			super(editor);
			this.#showDebounced = main_core.Runtime.debounce(() => {
				this.getEditor().update(() => {
					if (this.#shouldShowDialog()) {
						this.#show();
					}
				});
			}, 700);
		}
		static getName() {
			return 'FloatingToolbar';
		}
		afterInit() {
			const toolbarOptions = this.getEditor().getOption('floatingToolbar', []);
			this.#toolbar = new Toolbar$1(this.getEditor(), toolbarOptions);
			if (!this.#toolbar.isEmpty()) {
				this.cleanUpRegister(this.#registerListeners());
			}
		}
		#registerListeners() {
			return ui_lexical_utils.mergeRegister(this.getEditor().registerCommand(ui_lexical_core.SELECTION_CHANGE_COMMAND, () => {
				this.update();
				return false;
			}, ui_lexical_core.COMMAND_PRIORITY_CRITICAL), this.getEditor().registerUpdateListener(({
				editorState
			}) => {
				editorState.read(() => {
					this.update();
				});
			}), this.getEditor().registerCommand(HIDE_DIALOG_COMMAND, () => {
				this.hide();
				return false;
			}, ui_lexical_core.COMMAND_PRIORITY_LOW));
		}
		update() {
			if (this.#shouldShowDialog()) {
				if (this.getPopup().isShown()) {
					this.#show();
				} else {
					this.#showDebounced();
				}
			} else {
				this.hide();
			}
		}
		#show() {
			this.getPopup().show();
			clearDialogPosition(this.getPopup());
			this.#adjustDialogPosition();
		}
		#adjustDialogPosition() {
			return $adjustDialogPosition(this.getPopup(), this.getEditor(), this.#initDialogPosition);
		}
		#initDialogPosition(selectionPosition) {
			const {
				isBackward,
				isMultiline
			} = selectionPosition;
			return isBackward || !isMultiline ? 'top' : 'bottom';
		}
		#handleEditorScroll() {
			this.getEditor().update(() => {
				this.#adjustDialogPosition();
			});
		}
		#shouldShowDialog() {
			if (this.getEditor().isComposing() || !this.getEditor().isEditable()) {
				return false;
			}
			const selection = ui_lexical_core.$getSelection();
			if (!ui_lexical_core.$isRangeSelection(selection) || selection.isCollapsed()) {
				return false;
			}
			const nativeSelection = window.getSelection();
			if (nativeSelection === null || nativeSelection.isCollapsed) {
				return false;
			}
			const scrollerContainer = this.getEditor().getScrollerContainer();
			if (!scrollerContainer.contains(nativeSelection.anchorNode)) {
				return false;
			}
			const $isUnformatted = ui_lexical_utils.$findMatchingParent(selection.anchor.getNode(), node => {
				return (node.__flags & UNFORMATTED) !== 0;
			});
			if ($isUnformatted || selection.getTextContent() === '') {
				return false;
			}
			const rawTextContent = selection.getTextContent().replaceAll('\n', '');
			if (!selection.isCollapsed() && rawTextContent === '') {
				return false;
			}
			const isSomeDialogVisible = this.getEditor().dispatchCommand(DIALOG_VISIBILITY_COMMAND);
			if (isSomeDialogVisible) {
				return false;
			}
			const node = getSelectedNode(selection);
			return ui_lexical_core.$isTextNode(node);
		}
		getPopup() {
			if (this.#popup === null) {
				const container = main_core.Tag.render`<div class="ui-text-editor-floating-toolbar"></div>`;
				this.#popup = new main_popup.Popup({
					closeByEsc: true,
					// for an embedded popup: document.body -> this.getEditor().getScrollerContainer()
					targetContainer: document.body,
					autoHide: true,
					content: container,
					autoHideHandler: event => {
						let collapsed = true;
						const nativeSelection = window.getSelection();
						if (nativeSelection.isCollapsed) {
							return true;
						}
						this.getEditor().update(() => {
							const selection = ui_lexical_core.$getSelection();
							collapsed = selection === null || selection.isCollapsed();
						});
						return collapsed;
					},
					events: {
						onShow: () => {
							if (this.#adjustDialogPosition()) {
								main_core.Event.bind(this.getEditor().getScrollerContainer(), 'scroll', this.#onEditorScroll);
							}
						},
						onClose: () => {
							main_core.Event.unbind(this.getEditor().getScrollerContainer(), 'scroll', this.#onEditorScroll);
							clearDialogPosition(this.getPopup());
						}
					}
				});
				this.#toolbar.renderTo(container);
			}
			return this.#popup;
		}
		hide() {
			if (this.#popup === null) {
				return;
			}
			this.getPopup().close();
		}
		destroy() {
			super.destroy();
			if (this.#popup !== null) {
				this.#popup.destroy();
				this.#popup = null;
			}
			this.#toolbar.destroy();
			this.#toolbar = null;
		}
	}

	var FloatingToolbar = /*#__PURE__*/Object.freeze({
		__proto__: null,
		FloatingToolbarPlugin: FloatingToolbarPlugin
	});

	const TOGGLE_TOOLBAR_COMMAND = ui_lexical_core.createCommand('TOGGLE_TOOLBAR_COMMAND');
	const SHOW_TOOLBAR_COMMAND = ui_lexical_core.createCommand('SHOW_TOOLBAR_COMMAND');
	const HIDE_TOOLBAR_COMMAND = ui_lexical_core.createCommand('HIDE_TOOLBAR_COMMAND');
	class ToolbarPlugin extends BasePlugin {
		#toolbar = null;
		static getName() {
			return 'Toolbar';
		}
		getToolbar() {
			return this.#toolbar;
		}
		isRendered() {
			return this.#toolbar !== null && this.#toolbar.isRendered();
		}
		show() {
			if (this.isRendered()) {
				main_core.Dom.removeClass(this.getEditor().getToolbarContainer(), '--hidden');
			}
		}
		hide() {
			if (this.isRendered()) {
				main_core.Dom.addClass(this.getEditor().getToolbarContainer(), '--hidden');
			}
		}
		isShown() {
			return this.isRendered() && !main_core.Dom.hasClass(this.getEditor().getToolbarContainer(), '--hidden');
		}
		toggle() {
			if (this.isShown()) {
				this.hide();
			} else {
				this.show();
			}
		}
		afterInit() {
			this.#toolbar = new Toolbar$1(this.getEditor(), this.getEditor().getOption('toolbar'));
			if (!this.#toolbar.isEmpty()) {
				this.#registerCommands();
				this.#toolbar.renderTo(this.getEditor().getToolbarContainer());
				const hideToolbar = this.getEditor().getOption('hideToolbar', false);
				if (hideToolbar) {
					this.hide();
				}
			}
		}
		destroy() {
			super.destroy();
			this.#toolbar.destroy();
		}
		#registerCommands() {
			this.cleanUpRegister(this.getEditor().registerCommand(TOGGLE_TOOLBAR_COMMAND, () => {
				this.toggle();
				return true;
			}, ui_lexical_core.COMMAND_PRIORITY_LOW), this.getEditor().registerCommand(SHOW_TOOLBAR_COMMAND, () => {
				this.show();
				return true;
			}, ui_lexical_core.COMMAND_PRIORITY_LOW), this.getEditor().registerCommand(HIDE_TOOLBAR_COMMAND, () => {
				this.hide();
				return true;
			}, ui_lexical_core.COMMAND_PRIORITY_LOW));
		}
	}

	var Toolbar = /*#__PURE__*/Object.freeze({
		__proto__: null,
		HIDE_TOOLBAR_COMMAND: HIDE_TOOLBAR_COMMAND,
		SHOW_TOOLBAR_COMMAND: SHOW_TOOLBAR_COMMAND,
		TOGGLE_TOOLBAR_COMMAND: TOGGLE_TOOLBAR_COMMAND,
		ToolbarPlugin: ToolbarPlugin
	});

	class PlaceholderPlugin extends BasePlugin {
		#placeholder = null;
		#placeholderNode = null;
		#paragraphPlaceholder = null;
		afterInit() {
			const placeholder = this.getEditor().getOption('placeholder');
			if (main_core.Type.isStringFilled(placeholder)) {
				this.#placeholder = placeholder;
				this.#placeholderNode = main_core.Tag.render`
				<div class="ui-text-editor-placeholder">${main_core.Text.encode(this.#placeholder)}</div>
			`;
				main_core.Dom.append(this.#placeholderNode, this.getEditor().getScrollerContainer());
				this.#registerPlaceholderListeners();
			}
			let paragraphPlaceholder = this.getEditor().getOption('paragraphPlaceholder');
			if (main_core.Type.isStringFilled(paragraphPlaceholder)) {
				if (paragraphPlaceholder === 'auto') {
					const copilotPlugin = this.getEditor().getPlugin('Copilot');
					const copilotEnabled = copilotPlugin !== null && copilotPlugin.shouldTriggerBySpace();
					const mentionPlugin = this.getEditor().getPlugin('Mention');
					const mentionEnabled = mentionPlugin !== null && mentionPlugin.shouldTriggerByAtSign();
					if (copilotEnabled && mentionEnabled) {
						paragraphPlaceholder = main_core.Loc.getMessage('TEXT_EDITOR_PLACEHOLDER_MENTION_BITRIX_GPT', {
							'#COPILOT_NAME#': copilotPlugin.getCopilotName()
						});
					} else if (copilotEnabled) {
						paragraphPlaceholder = main_core.Loc.getMessage('TEXT_EDITOR_PLACEHOLDER_BITRIX_GPT', {
							'#COPILOT_NAME#': copilotPlugin.getCopilotName()
						});
					} else if (mentionEnabled) {
						paragraphPlaceholder = main_core.Loc.getMessage('TEXT_EDITOR_PLACEHOLDER_MENTION');
					}
				}
				if (paragraphPlaceholder !== 'auto') {
					this.#paragraphPlaceholder = paragraphPlaceholder;
					this.#registerParagraphListeners();
				}
			}
		}
		static getName() {
			return 'Placeholder';
		}
		#registerPlaceholderListeners() {
			this.cleanUpRegister(this.getEditor().registerUpdateListener(() => {
				this.getEditor().getEditorState().read(() => {
					this.#togglePlaceholder();
				});
			}));
		}
		#togglePlaceholder() {
			if (this.#placeholder === null) {
				return;
			}
			let canShowPlaceholder = ui_lexical_text.$canShowPlaceholder(this.getLexicalEditor().isComposing());
			if (canShowPlaceholder && this.#paragraphPlaceholder !== null && this.#hasFocus()) {
				canShowPlaceholder = false;
			}
			if (canShowPlaceholder) {
				main_core.Dom.addClass(this.#placeholderNode, '--shown');
			} else {
				main_core.Dom.removeClass(this.#placeholderNode, '--shown');
			}
		}
		#hasFocus() {
			const activeElement = document.activeElement;
			const rootElement = this.getEditor().getRootElement();
			return rootElement !== null && activeElement !== null && rootElement.contains(activeElement);
		}
		#hidePlaceholder() {
			if (this.#placeholderNode !== null) {
				main_core.Dom.removeClass(this.#placeholderNode, '--shown');
			}
		}
		#registerParagraphListeners() {
			let lastEmptyParagraph = null;
			const resetParagraphPlaceholder = () => {
				if (lastEmptyParagraph) {
					const htmlElement = this.getEditor().getElementByKey(lastEmptyParagraph.getKey());
					if (htmlElement) {
						delete htmlElement.dataset.placeholder;
					}
				}
			};
			this.cleanUpRegister(this.getEditor().registerCommand(ui_lexical_core.SELECTION_CHANGE_COMMAND, () => {
				if (!this.getEditor().isEditable()) {
					return false;
				}
				const selection = ui_lexical_core.$getSelection();
				let currentParagraph = null;
				if (ui_lexical_core.$isRangeSelection(selection) && selection.isCollapsed()) {
					const node = selection.anchor.getNode();
					if (ui_lexical_core.$isParagraphNode(node) && ui_lexical_core.$isRootNode(node.getParent()) && node.isEmpty()) {
						const htmlElement = this.getEditor().getElementByKey(node.getKey());
						if (htmlElement && this.#hasFocus()) {
							htmlElement.dataset.placeholder = this.#paragraphPlaceholder;
							currentParagraph = node;
							this.#hidePlaceholder();
						}
					}
				}
				if (lastEmptyParagraph && lastEmptyParagraph !== currentParagraph) {
					resetParagraphPlaceholder();
				}
				lastEmptyParagraph = currentParagraph;
				return false;
			}, ui_lexical_core.COMMAND_PRIORITY_CRITICAL), this.getEditor().registerCommand(ui_lexical_core.PASTE_COMMAND, () => {
				resetParagraphPlaceholder();
				return false;
			}, ui_lexical_core.COMMAND_PRIORITY_CRITICAL),
			// this.getEditor().registerCommand(
			// 	FOCUS_COMMAND,
			// 	(): boolean => {
			// 		resetParagraphPlaceholder();
			//
			// 		return false;
			// 	},
			// 	COMMAND_PRIORITY_CRITICAL,
			// ),
			this.getEditor().registerCommand(ui_lexical_core.BLUR_COMMAND, () => {
				resetParagraphPlaceholder();
				this.#togglePlaceholder();
				return false;
			}, ui_lexical_core.COMMAND_PRIORITY_CRITICAL));
		}
	}

	/* eslint-disable @bitrix24/bitrix24-rules/no-native-dom-methods */
	const CollapsingState = {
		COLLAPSED: 'collapsed',
		COLLAPSING: 'collapsing',
		EXPANDED: 'expanded',
		EXPANDING: 'expanding'
	};

	/**
	 * @memberof BX.UI.TextEditor
	 */
	class TextEditor extends main_core_events.EventEmitter {
		#lexicalEditor = null;
		#componentRegistry = new ComponentRegistry();
		#refs = new main_core.Cache.MemoryCache();
		#options = null;
		#plugins = null;
		#newLineMode = NewLineMode.MIXED;
		#bbcodeScheme = null;
		#schemeValidation = null;
		#bbcodeImportMap;
		#bbcodeExportMap;
		#themeClasses = {};
		#decoratorNodes = new Set();
		#decoratorComponents = new Map();
		#removeListeners = null;
		#highlightContainer = main_core.Tag.render`<div class="ui-text-editor-selection-highlighting"></div>`;
		#autoFocus = false;
		#minHeight = null;
		#maxHeight = null;
		#collapsingMode = false;
		#collapsingState = CollapsingState.EXPANDED;
		#collapsingTransitionEnd = this.#handleCollapsingTransition.bind(this);
		#paragraphHeight = null;
		#resizeObserver = null;
		#destroying = false;
		#rendered = false;
		#prevEmptyStatus = true;
		constructor(editorOptions) {
			super();
			this.setEventNamespace('BX.UI.TextEditor.Editor');
			const defaultOptions = this.constructor.getDefaultOptions();
			const options = main_core.Type.isPlainObject(editorOptions) ? editorOptions : {};
			this.#options = new main_core_collections.SettingsCollection({
				...defaultOptions,
				...options
			});
			const builtinPlugins = [...this.constructor.getBuiltinPlugins()];
			const plugins = this.#options.get('plugins', builtinPlugins);
			const extraPlugins = this.#options.get('extraPlugins', []);
			const pluginsToRemove = this.#options.get('removePlugins', []);
			const newLineMode = this.#options.get('newLineMode');
			if ([NewLineMode.LINE_BREAK, NewLineMode.PARAGRAPH].includes(newLineMode)) {
				this.#newLineMode = newLineMode;
			}
			this.#themeClasses = defaultTheme;
			this.#plugins = new PluginCollection(builtinPlugins, [...plugins, ...extraPlugins], pluginsToRemove);
			const constructors = this.#plugins.getConstructors();
			const nodes = constructors.map(pluginConstructor => {
				return pluginConstructor.getNodes(this);
			});
			this.#lexicalEditor = ui_lexical_core.createEditor({
				// uses when you copy-paste from one to another editor
				namespace: main_core.Type.isStringFilled(options.namespace) ? options.namespace : this.#createNamespace(constructors),
				nodes: nodes.flat(),
				onError: error => {
					console.error(error);
				},
				theme: this.#themeClasses,
				editable: this.#options.get('editable') !== false
			});
			this.setMinHeight(options.minHeight);
			this.setMaxHeight(options.maxHeight);
			this.setAutoFocus(options.autoFocus);
			this.setVisualOptions(options.visualOptions);
			this.#removeListeners = ui_lexical_utils.mergeRegister(this.#registerCommands(), this.#initDecorateNodes(nodes.flat()));
			this.#plugins.init(this);
			this.#bbcodeImportMap = this.#initBBCodeImportMap();
			this.#bbcodeExportMap = this.#initBBCodeExportMap();
			this.#bbcodeScheme = this.#initBBCodeScheme();
			this.#schemeValidation = new SchemeValidation(this);
			this.subscribeFromOptions(options.events);
		}
		static getBuiltinPlugins() {
			return [RichTextPlugin, ParagraphPlugin, ClipboardPlugin, BoldPlugin, UnderlinePlugin, ItalicPlugin, StrikethroughPlugin, ClearFormatPlugin, TabIndentPlugin, CodePlugin, QuotePlugin, ListPlugin, MentionPlugin, LinkPlugin, AutoLinkPlugin, ImagePlugin, VideoPlugin, SmileyPlugin, SpoilerPlugin, TablePlugin, HashtagPlugin, CopilotPlugin, HistoryPlugin, BlockToolbarPlugin, FloatingToolbarPlugin, ToolbarPlugin, PlaceholderPlugin, FilePlugin];
		}
		static getDefaultOptions() {
			return {};
		}
		static getGlobalOption(path, defaultValue = null) {
			const settings = main_core.Extension.getSettings('ui.text-editor');
			return settings.get(path, defaultValue);
		}
		getComponentRegistry() {
			return this.#componentRegistry;
		}
		getOptions() {
			return this.#options;
		}
		getOption(path, defaultValue = null) {
			return this.#options.get(path, defaultValue);
		}
		getThemeClasses() {
			return this.#themeClasses;
		}
		getThemeClass(tagName) {
			const className = this.#themeClasses[tagName];
			if (className !== undefined) {
				return className;
			}
			return '';
		}
		getNewLineMode() {
			return this.#newLineMode;
		}
		#initEditorState(initialEditorState, options) {
			if (main_core.Type.isNil(initialEditorState)) {
				this.#lexicalEditor.update(() => {
					const root = ui_lexical_core.$getRoot();
					if (root.isEmpty()) {
						const paragraph = ui_lexical_core.$createParagraphNode();
						root.append(paragraph);
					}
				}, options);
			} else if (main_core.Type.isPlainObject(initialEditorState) || main_core.Type.isStringFilled(initialEditorState)) {
				const parsedEditorState = this.#lexicalEditor.parseEditorState(initialEditorState);
				this.#lexicalEditor.setEditorState(parsedEditorState);
			} else if (main_core.Type.isFunction(initialEditorState)) {
				this.#lexicalEditor.update(() => {
					const root = ui_lexical_core.$getRoot();
					if (root.isEmpty()) {
						initialEditorState(this.#lexicalEditor);
					}
				}, options);
			}
		}
		#initDecorateNodes(editorNodes) {
			const removeListeners = [];
			editorNodes.forEach(nodeClass => {
				if (nodeClass.useDecoratorComponent) {
					const removeListener = this.registerMutationListener(nodeClass, (nodes, payload) => {
						for (const [key, val] of nodes) {
							if (val === 'destroyed') {
								const component = this.#decoratorComponents.get(key);
								if (component) {
									component.destroy();
								}
								this.#decoratorComponents.delete(key);
							} else {
								this.#decoratorNodes.add(key);
							}
						}
					});
					removeListeners.push(removeListener);
				}
			});
			const removeListener = this.#lexicalEditor.registerDecoratorListener(decorators => {
				this.#decoratorNodes.forEach(nodeKey => {
					const decorator = decorators[nodeKey];
					const {
						componentClass: DecoratorClass,
						options: decoratorOptions
					} = decorator;
					const component = this.#decoratorComponents.get(nodeKey);
					const htmlElement = this.#lexicalEditor.getElementByKey(nodeKey);
					if (htmlElement?.innerHTML && component) {
						component.update(decoratorOptions);
					} else if (htmlElement) {
						this.#decoratorComponents.set(nodeKey, new DecoratorClass({
							textEditor: this,
							target: htmlElement,
							nodeKey,
							options: decoratorOptions
						}));
					}
				});
				this.#decoratorNodes.clear();
			});
			removeListeners.push(removeListener);
			return ui_lexical_utils.mergeRegister(...removeListeners);
		}
		#registerCommands() {
			return ui_lexical_utils.mergeRegister(this.registerCommand(ui_lexical_core.FOCUS_COMMAND, () => {
				if (this.isCollapsingModeEnabled() && this.#collapsingState === CollapsingState.COLLAPSED && this.isEmpty(false)) {
					this.expand();
					return true;
				}
				this.emit('onFocus');
				return false;
			}, ui_lexical_core.COMMAND_PRIORITY_CRITICAL), this.registerCommand(ui_lexical_core.BLUR_COMMAND, event => {
				if (this.isCollapsingModeEnabled() && (this.#collapsingState === CollapsingState.COLLAPSING || this.#collapsingState === CollapsingState.EXPANDING)) {
					return true;
				}
				this.emit('onBlur');
				return false;
			}, ui_lexical_core.COMMAND_PRIORITY_CRITICAL), this.registerUpdateListener(({
				dirtyElements,
				dirtyLeaves,
				prevEditorState,
				tags
			}) => {
				const isComposing = this.isComposing();
				const hasContentChanges = dirtyLeaves.size > 0 || dirtyElements.size > 0;
				if (isComposing || !hasContentChanges) {
					return;
				}
				const isInitialChange = prevEditorState.isEmpty();
				if (this.#options.get('collapsingMode') === true) {
					if (isInitialChange) {
						this.#initCollapsingMode();
					} else if (this.isCollapsed() && !this.isEmpty()) {
						this.expand(false);
					}
				}
				if (!isInitialChange && tags.has('history-merge')) {
					return;
				}
				this.emit('onChange', {
					isInitialChange,
					tags
				});
				const isEmpty = this.isEmpty();
				if (this.#prevEmptyStatus !== isEmpty) {
					this.#prevEmptyStatus = isEmpty;
					this.emit('onEmptyContentToggle', {
						isEmpty,
						isInitialChange
					});
				}
			}), this.registerCommand(ui_lexical_core.KEY_ENTER_COMMAND, event => {
				const {
					code,
					ctrlKey,
					metaKey
				} = event;
				if (main_core.Browser.isMac() && metaKey || ctrlKey) {
					this.emit('onMetaEnter');
					return true;
				}
				if (code === 'Escape') {
					this.emit('onEscape');
					return true;
				}
				return false;
			}, ui_lexical_core.COMMAND_PRIORITY_LOW), this.registerEditableListener(isEditable => {
				this.getEditableContainer().contentEditable = isEditable;
				if (isEditable) {
					main_core.Dom.removeClass(this.getRootContainer(), '--read-only');
					main_core.Dom.addClass(this.getRootContainer(), '--editable');
				} else {
					main_core.Dom.removeClass(this.getRootContainer(), '--editable');
					main_core.Dom.addClass(this.getRootContainer(), '--read-only');
				}
				this.emit('onEditable', {
					isEditable
				});
			}));
		}
		#createNamespace(plugins) {
			const hashCode = createHashCode(plugins.map(node => node.getName()).sort().join('-'));
			return String(hashCode);
		}
		getBBCodeScheme() {
			return this.#bbcodeScheme;
		}
		getSchemeValidation() {
			return this.#schemeValidation;
		}
		#initBBCodeImportMap() {
			const importMap = new Map();
			for (const [, plugin] of this.#plugins) {
				const map = plugin.importBBCode();
				if (map !== null) {
					Object.keys(map).forEach(key => {
						let currentValue = importMap.get(key);
						if (currentValue === undefined) {
							currentValue = [];
							importMap.set(key, currentValue);
						}
						currentValue.push(map[key]);
					});
				}
			}
			return importMap;
		}
		#initBBCodeExportMap() {
			const exportMap = new Map();
			for (const [, plugin] of this.#plugins) {
				const map = plugin.exportBBCode();
				if (map !== null) {
					Object.keys(map).forEach(nodeType => {
						if (main_core.Type.isFunction(map[nodeType])) {
							exportMap.set(nodeType, map[nodeType]);
						}
					});
				}
			}
			return exportMap;
		}
		#initBBCodeScheme() {
			const filePlugin = this.getPlugin('File');
			const fileTag = filePlugin?.isEnabled() ? filePlugin.getMode() : 'none';
			return new ui_bbcode_model.DefaultBBCodeScheme({
				fileTag
			});
		}
		setText(text, options) {
			if (main_core.Type.isString(text)) {
				const updateOptions = {
					discrete: main_core.Type.isPlainObject(options) && options.discrete === true
				};
				this.#lexicalEditor.update(() => {
					const lexicalNodes = $importFromBBCode(text, this);
					const root = ui_lexical_core.$getRoot();
					root.clear();
					root.append(...lexicalNodes);
					ui_lexical_core.$setSelection(null);
				}, updateOptions);
			}
		}
		clear(focus = true, options = {}) {
			const updateOptions = {
				discrete: main_core.Type.isPlainObject(options) && options.discrete === true
			};
			this.#lexicalEditor.update(() => {
				const root = ui_lexical_core.$getRoot();
				const paragraph = ui_lexical_core.$createParagraphNode();
				root.clear();
				root.append(paragraph);
				ui_lexical_core.$setSelection(null);
				if (focus) {
					paragraph.select();
				}
			}, updateOptions);
		}
		clearHistory() {
			this.dispatchCommand(ui_lexical_core.CLEAR_HISTORY_COMMAND);
		}
		getText() {
			return this.#lexicalEditor.getEditorState().read(() => {
				const bbCodeAst = $exportToBBCode(ui_lexical_core.$getRoot(), this);

				// console.log("bbCodeAst", bbCodeAst);

				return bbCodeAst.toString();
			});
		}
		isEmpty(trim = true) {
			return this.#lexicalEditor.getEditorState().read(() => {
				return $isRootEmpty(trim);
			});
		}
		setAutoFocus(flag) {
			if (main_core.Type.isBoolean(flag)) {
				this.#autoFocus = flag;
			}
		}
		hasAutoFocus() {
			return this.#autoFocus;
		}
		setMinHeight(minHeight) {
			if (main_core.Type.isNumber(minHeight) && minHeight > 0 || minHeight === null) {
				const changed = this.#minHeight !== minHeight;
				this.#minHeight = minHeight;
				if (changed) {
					main_core.Dom.style(this.getScrollerContainer(), '--ui-text-editor-min-height', minHeight > 0 ? `${minHeight}px` : null);
				}
			}
		}
		getMinHeight() {
			return this.#minHeight;
		}
		setMaxHeight(maxHeight) {
			if (main_core.Type.isNumber(maxHeight) && maxHeight > 0 || maxHeight === null) {
				const changed = this.#maxHeight !== maxHeight;
				this.#maxHeight = maxHeight;
				if (changed) {
					main_core.Dom.style(this.getScrollerContainer(), '--ui-text-editor-max-height', maxHeight > 0 ? `${maxHeight}px` : null);
				}
			}
		}
		getMaxHeight() {
			return this.#maxHeight;
		}
		setVisualOptions(options) {
			if (!main_core.Type.isPlainObject(options)) {
				return;
			}
			for (const [option, value] of Object.entries(options)) {
				const name = main_core.Text.toKebabCase(option);
				main_core.Dom.style(this.getRootContainer(), `--ui-text-editor-${name}`, value);
			}
		}
		#initCollapsingMode() {
			this.#collapsingMode = true;
			if (this.isEmpty()) {
				this.#collapse('hide', false, true);
			} else {
				this.expand(false);
			}
		}
		isCollapsingModeEnabled() {
			return this.#collapsingMode;
		}
		isCollapsed() {
			return this.#collapsingState === CollapsingState.COLLAPSED;
		}
		#collapse(mode = 'hide', animate = true, initialState = false) {
			if (!this.isCollapsingModeEnabled()) {
				return;
			}
			const collapsed = this.#collapsingState === CollapsingState.COLLAPSED || this.#collapsingState === CollapsingState.COLLAPSING;
			const expanded = this.#collapsingState === CollapsingState.EXPANDED || this.#collapsingState === CollapsingState.EXPANDING;
			if (mode === 'hide' && collapsed || mode === 'show' && expanded) {
				return;
			}
			if (animate === false) {
				if (collapsed) {
					this.#collapsingState = CollapsingState.EXPANDED;
					main_core.Dom.removeClass(this.getRootContainer(), '--collapsed');
					this.emit('onCollapsingToggle', {
						isOpen: true
					});
					this.focus();
				} else {
					this.#collapsingState = CollapsingState.COLLAPSED;
					main_core.Dom.addClass(this.getRootContainer(), '--collapsed');
					this.emit('onCollapsingToggle', {
						isOpen: false
					});
					this.clear(false);
					this.clearHistory();
					if (!initialState) {
						this.blur();
					}
				}
				return;
			}
			main_core.Event.unbind(this.getRootContainer(), 'transitionend', this.#collapsingTransitionEnd);
			if (collapsed) {
				this.#collapsingState = CollapsingState.EXPANDING;
				this.blur(); // to avoid a root container scrolling because of a browser focus

				const currentHeight = this.getRootContainer().offsetHeight;
				main_core.Dom.removeClass(this.getRootContainer(), ['--collapsed', '--collapsing']);
				main_core.Dom.style(this.getRootContainer(), {
					height: `${currentHeight}px`,
					overflow: 'hidden'
				});
				main_core.Dom.style(this.getInnerContainer(), {
					opacity: 0
				});
				requestAnimationFrame(() => {
					main_core.Dom.addClass(this.getRootContainer(), '--expanding');
					main_core.Dom.style(this.getRootContainer(), {
						height: `${this.getRootContainer().scrollHeight}px`
					});
					main_core.Dom.style(this.getInnerContainer(), {
						opacity: 1
					});
					this.emit('onCollapsingToggle', {
						isOpen: true
					});
				});
			} else {
				this.#collapsingState = CollapsingState.COLLAPSING;
				const currentHeight = this.getRootContainer().offsetHeight;
				main_core.Dom.removeClass(this.getRootContainer(), ['--expanding']);
				main_core.Dom.style(this.getRootContainer(), {
					height: `${currentHeight}px`,
					overflow: 'hidden'
				});
				main_core.Dom.style(this.getInnerContainer(), {
					opacity: 1
				});
				this.blur();
				const paragraphHeight = this.getParagraphHeight();
				requestAnimationFrame(() => {
					main_core.Dom.addClass(this.getRootContainer(), '--collapsing');
					main_core.Dom.style(this.getRootContainer(), {
						height: `${paragraphHeight}px`
					});
					main_core.Dom.style(this.getInnerContainer(), {
						opacity: 0
					});
					this.emit('onCollapsingToggle', {
						isOpen: false
					});
				});
			}
			main_core.Event.bind(this.getRootContainer(), 'transitionend', this.#collapsingTransitionEnd);
		}
		collapse(animate = true) {
			this.#collapse('hide', animate);
		}
		expand(animate = true) {
			this.#collapse('show', animate);
		}
		toggle(animate = true) {
			this.#collapse('toggle', animate);
		}
		getParagraphHeight() {
			if (this.#paragraphHeight !== null) {
				return this.#paragraphHeight;
			}
			const className = this.getThemeClasses().paragraph || '';
			const paragraph = main_core.Tag.render`<p class="${className}"><br /></p>`;
			main_core.Dom.style(paragraph, {
				position: 'absolute',
				transform: 'translateY(-1000px)'
			});
			main_core.Dom.append(paragraph, this.getScrollerContainer());
			this.#paragraphHeight = paragraph.offsetHeight + main_core.Text.toNumber(main_core.Dom.style(paragraph, 'margin-top')) + main_core.Text.toNumber(main_core.Dom.style(paragraph, 'margin-bottom'));
			main_core.Dom.remove(paragraph);
			return this.#paragraphHeight;
		}
		#handleCollapsingTransition() {
			main_core.Event.unbind(this.getRootContainer(), 'transitionend', this.#collapsingTransitionEnd);
			main_core.Dom.style(this.getRootContainer(), {
				height: null,
				overflow: null
			});
			main_core.Dom.style(this.getInnerContainer(), {
				opacity: null
			});
			main_core.Dom.removeClass(this.getRootContainer(), ['--expanding', '--collapsing']);
			if (this.#collapsingState === CollapsingState.COLLAPSING) {
				main_core.Dom.addClass(this.getRootContainer(), '--collapsed');
				this.#collapsingState = CollapsingState.COLLAPSED;
				this.clear(false);
				this.clearHistory();
				this.blur();
			} else {
				this.focus();
				this.#collapsingState = CollapsingState.EXPANDED;
			}
		}
		getLexicalEditor() {
			return this.#lexicalEditor;
		}
		setRootElement(contentEditableElement) {
			if (main_core.Type.isElementNode(contentEditableElement) || contentEditableElement === null) {
				this.#lexicalEditor.setRootElement(contentEditableElement);
			}
		}
		getBBCodeExportMap() {
			return this.#bbcodeExportMap;
		}
		getBBCodeImportMap() {
			return this.#bbcodeImportMap;
		}
		getEditorState() {
			return this.#lexicalEditor.getEditorState();
		}
		getPlugins() {
			return this.#plugins;
		}
		getPlugin(key) {
			return this.#plugins.get(key);
		}
		getElementByKey(key) {
			return this.#lexicalEditor.getElementByKey(key);
		}
		setEditorState(editorState, options) {
			this.#lexicalEditor.setEditorState(editorState, options);
		}
		setEditable(editable) {
			if (main_core.Type.isBoolean(editable)) {
				this.dispatchCommand(HIDE_DIALOG_COMMAND);
				if (!editable) {
					this.blur();
				}
				this.#lexicalEditor.setEditable(editable);
			}
		}
		isEditable() {
			return this.#lexicalEditor.isEditable();
		}
		registerUpdateListener(listener) {
			return this.#lexicalEditor.registerUpdateListener(listener);
		}
		registerEditableListener(listener) {
			return this.#lexicalEditor.registerEditableListener(listener);
		}
		registerCommand(command, listener, priority) {
			return this.#lexicalEditor.registerCommand(command, listener, priority);
		}
		dispatchCommand(type, payload) {
			return this.#lexicalEditor.dispatchCommand(type, payload);
		}
		registerMutationListener(klass, listener) {
			return this.#lexicalEditor.registerMutationListener(klass, listener);
		}
		registerNodeTransform(klass, listener) {
			return this.#lexicalEditor.registerNodeTransform(klass, listener);
		}
		registerTextContentListener(listener) {
			return this.#lexicalEditor.registerTextContentListener(listener);
		}
		registerDecoratorListener(listener) {
			return this.#lexicalEditor.registerDecoratorListener(listener);
		}
		registerRootListener(listener) {
			return this.#lexicalEditor.registerRootListener(listener);
		}
		registerEventListener(nodeType, eventType, eventListener) {
			const isCaptured = ['mouseenter', 'mouseleave'].includes(eventType);
			const handleEvent = event => {
				this.update(() => {
					const nearestNode = ui_lexical_core.$getNearestNodeFromDOMNode(event.target);
					if (nearestNode !== null) {
						const targetNode = isCaptured ? nearestNode instanceof nodeType ? nearestNode : null : ui_lexical_utils.$findMatchingParent(nearestNode, node => node instanceof nodeType);
						if (targetNode !== null) {
							eventListener(event, targetNode.getKey());
						}
					}
				});
			};
			return this.registerRootListener((rootElement, prevRootElement) => {
				if (rootElement) {
					main_core.Event.bind(rootElement, eventType, handleEvent, isCaptured);
				}
				if (prevRootElement) {
					main_core.Event.unbind(prevRootElement, eventType, handleEvent, isCaptured);
				}
			});
		}
		update(updateFn, options) {
			this.#lexicalEditor.update(updateFn, options);
		}
		focus(callbackFn, options) {
			if (!document.hasFocus()) {
				window.focus();
			}
			this.#lexicalEditor.focus(main_core.Type.isFunction(callbackFn) ? callbackFn : null, main_core.Type.isPlainObject(options) ? options : {
				defaultSelection: 'rootStart'
			});
		}
		hasFocus() {
			return this.getRootElement().contains(document.activeElement);
		}
		blur() {
			this.#lexicalEditor.blur();
		}
		isComposing() {
			return this.#lexicalEditor.isComposing();
		}
		getRootElement() {
			return this.#lexicalEditor.getRootElement();
		}
		hasNodes(nodes) {
			return this.#lexicalEditor.hasNodes(nodes);
		}
		getRootContainer() {
			return this.#refs.remember('root', () => {
				const classes = [this.isEditable() ? '--editable' : '--read-only'];
				return main_core.Tag.render`
				<div class="ui-text-editor ${classes.join(' ')}">
					${this.getInnerContainer()}
				</div>
			`;
			});
		}
		getInnerContainer() {
			return this.#refs.remember('inner', () => {
				return main_core.Tag.render`
				<div class="ui-text-editor-inner">
					${this.getHeaderContainer()}
					${this.getToolbarContainer()}
					${this.getScrollerContainer()}
					${this.getFooterContainer()}
				</div>
			`;
			});
		}
		getToolbarContainer() {
			return this.#refs.remember('toolbar', () => {
				return main_core.Tag.render`
				<div class="ui-text-editor-toolbar" tabindex="-1"></div>
			`;
			});
		}
		getScrollerContainer() {
			return this.#refs.remember('scroller', () => {
				return main_core.Tag.render`
				<div class="ui-text-editor-scroller">
					${this.getEditableContainer()}
				</div>
			`;
			});
		}
		getEditableContainer() {
			return this.#refs.remember('editable', () => {
				return main_core.Tag.render`
				<div 
					class="ui-text-editor-editable" 
					contenteditable="${this.isEditable() ? 'true' : 'false'}" 
					spellcheck="true"
				></div>
			`;
			});
		}
		getFooterContainer() {
			return this.#refs.remember('footer', () => {
				return main_core.Tag.render`
				<div class="ui-text-editor-slot ui-text-editor-footer" tabindex="-1"></div>
			`;
			});
		}
		getHeaderContainer() {
			return this.#refs.remember('header', () => {
				return main_core.Tag.render`
				<div class="ui-text-editor-slot ui-text-editor-header" tabindex="-1"></div>
			`;
			});
		}
		renderTo(container, replaceNode = false) {
			if (!main_core.Type.isElementNode(container)) {
				return;
			}
			if (!this.isRendered()) {
				if (main_core.Type.isStringFilled(this.#options.get('content'))) {
					this.setText(this.#options.get('content'));
				} else {
					this.#initEditorState(this.#options.get('editorState'));
				}
			}
			if (replaceNode) {
				main_core.Dom.replace(container, this.getRootContainer());
			} else {
				main_core.Dom.append(this.getRootContainer(), container);
			}
			this.#lexicalEditor.setRootElement(this.getEditableContainer());
			if (this.hasAutoFocus()) {
				this.focus(null, {
					defaultSelection: 'rootStart'
				});
			}
			if (!this.#rendered) {
				this.#resizeObserver = new ResizeObserver(() => {
					this.emit('onResize');
					this.dispatchCommand(HIDE_DIALOG_COMMAND, {
						context: 'resize'
					});
				});
				this.#resizeObserver.observe(this.getScrollerContainer());
			}
			this.#rendered = true;
		}
		isRendered() {
			return this.#rendered;
		}
		highlightSelection() {
			this.getEditorState().read(() => {
				const selection = ui_lexical_core.$getSelection();
				if (!ui_lexical_core.$isRangeSelection(selection) || selection.isCollapsed()) {
					return;
				}
				const anchor = selection.anchor;
				const focus = selection.focus;
				const range = ui_lexical_selection.createDOMRange(this.#lexicalEditor, anchor.getNode(), anchor.offset, focus.getNode(), focus.offset);
				if (range !== null) {
					const scrollerContainer = this.getScrollerContainer();
					const scrollerRect = scrollerContainer.getBoundingClientRect();
					const selectionRects = ui_lexical_selection.createRectsFromDOMRange(this.#lexicalEditor, range);
					const selectionRectsLength = selectionRects.length;
					this.#highlightContainer.innerHTML = '';
					for (let i = 0; i < selectionRectsLength; i++) {
						const selectionRect = selectionRects[i];
						const elem = main_core.Tag.render`<span class="ui-text-editor-selection-part"></span>`;
						const top = selectionRect.top - scrollerRect.top + scrollerContainer.scrollTop;
						const left = selectionRect.left - scrollerRect.left + scrollerContainer.scrollLeft;
						main_core.Dom.style(elem, {
							top: `${top}px`,
							left: `${left}px`,
							height: `${selectionRect.height}px`,
							width: `${selectionRect.width}px`
						});
						main_core.Dom.append(elem, this.#highlightContainer);
					}
					main_core.Dom.append(this.#highlightContainer, this.getScrollerContainer());
				}
			});
		}
		resetHighlightSelection() {
			main_core.Dom.remove(this.#highlightContainer);
		}
		destroy() {
			if (this.#destroying) {
				return;
			}
			this.#destroying = true;
			this.emit('onDestroy');
			for (const [, plugin] of this.#plugins) {
				plugin.destroy();
			}
			this.#removeListeners();
			if (this.isRendered()) {
				this.#resizeObserver.disconnect();
				this.setRootElement(null);
				main_core.Dom.remove(this.getRootContainer());
			}
			this.#resizeObserver = null;
			this.#plugins = null;
			this.#lexicalEditor = null;
			this.$refs = null;
			this.#schemeValidation = null;
			this.#bbcodeImportMap = null;
			this.#bbcodeExportMap = null;
			this.#decoratorNodes = null;
			this.#decoratorComponents = null;
			Object.setPrototypeOf(this, null);
		}
	}

	const TextEditorComponent = {
		name: 'TextEditorComponent',
		props: {
			editorOptions: {
				type: Object
			},
			editorInstance: {
				type: TextEditor,
				default: null
			},
			events: {
				type: Object,
				default: {}
			},
			editable: {
				type: Boolean,
				default: null
			}
		},
		setup() {
			return {
				editorClass: TextEditor
			};
		},
		provide() {
			return {
				editor: this.editor
			};
		},
		beforeCreate() {
			if (this.editorInstance === null) {
				this.hasOwnEditor = true;
				const EditorClass = this.editorClass;
				this.editor = new EditorClass(this.editorOptions);
			} else {
				this.hasOwnEditor = false;
				this.editor = this.editorInstance;
			}
			if (main_core.Type.isPlainObject(this.events)) {
				for (const [eventName, fn] of Object.entries(this.events)) {
					this.editor.subscribe(eventName, fn);
				}
			}
		},
		computed: {
			headerContainer() {
				return this.editor.getHeaderContainer();
			},
			footerContainer() {
				return this.editor.getFooterContainer();
			}
		},
		watch: {
			editable(value) {
				this.editor.setEditable(value);
			}
		},
		mounted() {
			this.editor.renderTo(this.$refs.container, true);
		},
		unmounted() {
			if (this.hasOwnEditor) {
				this.editor.destroy();
				this.editor = null;
			}
		},
		template: `
		<div ref="container"></div>
		<Teleport :to="headerContainer">
			<slot name="header"></slot>
		</Teleport>
		<Teleport :to="footerContainer">
			<slot name="footer"></slot>
		</Teleport>
	`
	};

	/**
	 * @memberof BX.UI.TextEditor
	 */
	class BasicEditor extends TextEditor {
		static getDefaultOptions() {
			return {
				plugins: ['RichText', 'Paragraph', 'Clipboard', 'Bold', 'Underline', 'Italic', 'Strikethrough', 'TabIndent', 'List', 'Mention', 'Link', 'AutoLink', 'Image', 'Copilot', 'History', 'BlockToolbar', 'FloatingToolbar', 'Toolbar', 'Placeholder', 'File'],
				toolbar: ['bold', 'italic', 'underline', 'strikethrough', '|', 'numbered-list', 'bulleted-list', '|', 'link', 'copilot'],
				newLineMode: NewLineMode.MIXED
			};
		}
	}

	const BasicEditorComponent = {
		name: 'BasicEditorComponent',
		extends: TextEditorComponent,
		setup() {
			return {
				editorClass: BasicEditor
			};
		}
	};

	/**
	 * @namespace BX.UI.TextEditor.Plugins
	 */
	const Plugins = {
		Paragraph,
		AutoLink,
		BlockToolbar,
		Bold,
		Code,
		FloatingToolbar,
		History,
		Image,
		Italic,
		Link,
		List,
		Mention,
		Quote,
		Strikethrough,
		TabIndent,
		Toolbar,
		Underline,
		Video,
		Spoiler,
		Smiley,
		Table,
		Hashtag,
		File,
		Copilot
	};

	/**
	 * @namespace BX.UI.TextEditor.Commands
	 */
	const Commands = {
		...AllCommands
	};

	/**
	 * @namespace BX.UI.TextEditor.Commands
	 */
	const Constants = {
		...AllConstants
	};

	/**
	 * @namespace BX.UI.TextEditor.Debug
	 */
	const Debug = {
		generateContent
	};

	exports.BasePlugin = BasePlugin;
	exports.BasicEditor = BasicEditor;
	exports.BasicEditorComponent = BasicEditorComponent;
	exports.Button = Button;
	exports.Commands = Commands;
	exports.Constants = Constants;
	exports.Debug = Debug;
	exports.Plugins = Plugins;
	exports.TextEditor = TextEditor;
	exports.TextEditorComponent = TextEditorComponent;

})(this.BX.UI.TextEditor = this.BX.UI.TextEditor || {}, BX.UI.Lexical.Core, BX.UI.Lexical.Table, BX, BX.UI.Lexical.Link, BX.UI.CodeParser, BX.UI.IconSet, BX.UI.Lexical.Clipboard, BX.UI.Lexical.Selection, BX.UI.Lexical.Utils, BX.UI.BBCode, BX.UI.BBCode, BX.UI.TextEditor, BX.Event, BX.Cache, BX.Main, BX.UI.Smiley, BX.UI.VideoService, BX.Collections, BX.UI.Lexical.RichText, BX.UI.Lexical.List, BX.UI.Lexical.Text, BX.UI.Lexical.Html, BX.UI.Lexical.History);
//# sourceMappingURL=text-editor.bundle.js.map
