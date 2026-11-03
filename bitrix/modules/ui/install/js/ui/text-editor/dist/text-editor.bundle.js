/* eslint-disable */
this.BX = this.BX || {};
this.BX.UI = this.BX.UI || {};
(function (exports, ui_designTokens, ui_designTokens_air, ui_forms, ui_typography, ui_lexical_core, ui_lexical_table, main_core, ui_lexical_link, ui_codeParser, ui_iconSet_api_core, ui_lexical_clipboard, ui_lexical_selection, ui_lexical_utils, ui_bbcode_model, ui_bbcode_parser, ui_lexical_extension, main_core_events, main_core_cache, ui_a11y, main_popup, ui_smiley, ui_videoService, ui_lexical_html, main_core_collections, ui_lexical_text, ui_lexical_history, ui_lexical_list, ui_lexical_richText) {
	'use strict';

	const HIDE_DIALOG_COMMAND = ui_lexical_core.createCommand('HIDE_DIALOG_COMMAND');
	const DIALOG_VISIBILITY_COMMAND = ui_lexical_core.createCommand('DIALOG_VISIBILITY_COMMAND');
	const DRAG_START_COMMAND = ui_lexical_core.createCommand('DRAG_START_COMMAND');
	const DRAG_END_COMMAND = ui_lexical_core.createCommand('DRAG_END_COMMAND');

	var AllCommands = Object.freeze({
		__proto__: null,
		DIALOG_VISIBILITY_COMMAND: DIALOG_VISIBILITY_COMMAND,
		DRAG_END_COMMAND: DRAG_END_COMMAND,
		DRAG_START_COMMAND: DRAG_START_COMMAND,
		HIDE_DIALOG_COMMAND: HIDE_DIALOG_COMMAND
	});

	const UNFORMATTED = 1;
	const SLIDER_IGNORE_AUTOBINDING_ATTRIBUTE = 'data-slider-ignore-autobinding';
	const TRANSPARENT_GIF_SRC = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
	const NewLineMode = {
		LINE_BREAK: 'line-break',
		PARAGRAPH: 'paragraph',
		MIXED: 'mixed'
	};

	var AllConstants = Object.freeze({
		__proto__: null,
		NewLineMode: NewLineMode,
		SLIDER_IGNORE_AUTOBINDING_ATTRIBUTE: SLIDER_IGNORE_AUTOBINDING_ATTRIBUTE,
		TRANSPARENT_GIF_SRC: TRANSPARENT_GIF_SRC,
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

	function createBBCodeElement(scheme, options) {
		return scheme.createElement(options);
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
			lexicalNodes = [...lexicalNodes, ...childLexicalNodes];
		} else if (ui_lexical_core.$isElementNode(currentLexicalNode)) {
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
		textContent = textContent.replaceAll(/\r?\n|\t/gm, ' ').replaceAll('\r', '');
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
		while (trimmedNodes.length > 0 && $isParagraphEmpty(trimmedNodes[0])) {
			trimmedNodes.splice(0, 1);
		}
		while (trimmedNodes.length > 0 && $isParagraphEmpty(trimmedNodes[trimmedNodes.length - 1])) {
			trimmedNodes.splice(-1, 1);
		}
		return trimmedNodes;
	}

	function $exportToBBCode(lexicalNode, editor) {
		const scheme = editor.getBBCodeScheme();
		const root = scheme.createRoot();
		const topLevelChildren = trimEmptyParagraphs(lexicalNode.getChildren());
		for (const topLevelNode of topLevelChildren) {
			$appendNodesToBBCode(topLevelNode, root, editor);
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
					node: node
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
				node: node
			};
		}
		return {
			node: null
		};
	}

	function wrapNodeWith(node, tag, editor) {
		const scheme = editor.getBBCodeScheme();
		const elementNode = scheme.createElement({
			name: tag
		});
		elementNode.appendChild(node);
		return elementNode;
	}

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
		destroy() {}
	}

	class Button extends ToolbarItem {
		#format = null;
		#blockType = null;
		#active = false;
		#disabled = false;
		#disableInsideUnformatted = false;
		#disableCallback = null;
		#container = null;
		#disabledSource = null;
		#disposers = [];
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
			this.#markAsToggle();
		}
		getFormat() {
			return this.#format;
		}
		setBlockType(type) {
			this.#blockType = type;
			this.#markAsToggle();
		}
		getBlockType() {
			return this.#blockType;
		}
		setTooltip(tooltip) {
			if (main_core.Type.isStringFilled(tooltip)) {
				main_core.Dom.attr(this.getContainer(), 'title', tooltip);
				main_core.Dom.attr(this.getContainer(), 'aria-label', tooltip);
			} else if (tooltip === null) {
				main_core.Dom.attr(this.getContainer(), 'title', null);
				main_core.Dom.attr(this.getContainer(), 'aria-label', null);
			}
		}
		setHasPopup(type) {
			main_core.Dom.attr(this.getContainer(), 'aria-haspopup', type);
		}
		setExpanded(expanded) {
			main_core.Dom.attr(this.getContainer(), 'aria-expanded', expanded ? 'true' : 'false');
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
			if (this.#isToggle()) {
				main_core.Dom.attr(this.getContainer(), 'aria-pressed', active ? 'true' : 'false');
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
			this.getContainer().disabled = disabled;
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
		bindDisabled(source) {
			this.#disabledSource = source;
			this.#disposers.push(ui_lexical_extension.effect(() => {
				this.setDisabled(source.value);
			}));
		}
		hasReactiveDisabled() {
			return this.#disabledSource !== null;
		}
		getDisabledSignal() {
			return this.#disabledSource;
		}
		bindActive(source) {
			this.#disposers.push(ui_lexical_extension.effect(() => {
				this.setActive(source.value);
			}));
		}
		destroy() {
			this.#disposers.forEach(dispose => {
				dispose();
			});
			this.#disposers = [];
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
		#isToggle() {
			return this.#format !== null || this.#blockType !== null;
		}
		#markAsToggle() {
			main_core.Dom.attr(this.getContainer(), 'aria-pressed', this.#active ? 'true' : 'false');
		}
	}

	class BasePlugin {
		#textEditor = null;
		#destroyed = false;
		#removeListeners = () => {};
		#afterInitCleanup = null;
		#abortController = new AbortController();
		constructor(textEditor) {
			this.#textEditor = textEditor;
		}
		static getName() {
			throw new Error('getName must be implemented in a child class');
		}
		static getNodes(editor) {
			return [];
		}
		static getDependencies() {
			return [];
		}
		static getPeerDependencies() {
			return [];
		}
		static getDefaultOptions() {
			return {};
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
			if (this.#destroyed) {
				func.forEach(cleanUp => cleanUp());
				return;
			}
			this.#removeListeners = ui_lexical_utils.mergeRegister(this.#removeListeners, ...func);
		}
		getAbortSignal() {
			return this.#abortController.signal;
		}
		registerTimeout(handler, timeout) {
			this.#registerDeferred(handler, run => {
				const timeoutId = setTimeout(run, timeout);
				return () => clearTimeout(timeoutId);
			});
		}
		registerAnimationFrame(handler) {
			this.#registerDeferred(handler, run => {
				const frameId = requestAnimationFrame(run);
				return () => cancelAnimationFrame(frameId);
			});
		}
		#registerDeferred(handler, schedule) {
			const signal = this.getAbortSignal();
			if (signal.aborted) {
				return;
			}
			let cancel = () => {};
			const cancelOnAbort = () => cancel();
			cancel = schedule(() => {
				main_core.Event.unbind(signal, 'abort', cancelOnAbort);
				handler();
			});
			main_core.Event.bind(signal, 'abort', cancelOnAbort, {
				once: true
			});
		}
		setAfterInitCleanup(cleanup) {
			this.#afterInitCleanup = cleanup;
		}
		isDestroyed() {
			return this.#destroyed;
		}
		destroy() {
			if (this.#destroyed) {
				return;
			}
			this.#destroyed = true;
			this.#abortController.abort();
			this.#removeListeners();
			this.#removeListeners = null;
			if (this.#afterInitCleanup !== null) {
				const cleanup = this.#afterInitCleanup;
				this.#afterInitCleanup = null;
				cleanup();
			}
		}
	}

	function $isEscapableBlock(node) {
		return ui_lexical_core.$isElementNode(node) && node.isEscapableBlock?.() === true;
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

	class CustomParagraphNode extends ui_lexical_core.ParagraphNode {
		__mode = NewLineMode.MIXED;
		constructor(mode = NewLineMode.MIXED, key) {
			super(key);
			this.__mode = mode;
		}
		$config() {
			return this.config('custom-paragraph', {
				extends: ui_lexical_core.ParagraphNode
			});
		}
		afterCloneFrom(prevNode) {
			super.afterCloneFrom(prevNode);
			this.__mode = prevNode.__mode;
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
		exportJSON() {
			return {
				...super.exportJSON(),
				mode: this.__mode
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
				if (parentNode !== null && !ui_lexical_core.$isRootNode(parentNode) && Object.hasOwn(Object.getPrototypeOf(parentNode), 'collapseAtStart')) {
					return parentNode.collapseAtStart();
				}
			}
			return false;
		}
		static importJSON(serializedParagraphNode) {
			return ui_lexical_core.$createParagraphNode().updateFromJSON(serializedParagraphNode);
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
				withKlass: CustomParagraphNode
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
						node: createBBCodeElement(scheme, {
							name: 'p'
						})
					};
				},
				'custom-paragraph': lexicalNode => {
					const scheme = this.getEditor().getBBCodeScheme();
					return {
						node: createBBCodeElement(scheme, {
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
						console.warn('TextEditor: selection has been moved to the end of the editor because the previously ' + "selected nodes have been removed and selection wasn't moved to another node. " + 'Ensure selection changes after removing/replacing a selected node.');
					}
				}
				const lastChild = root.getLastChild();
				if (!ui_lexical_core.$isParagraphNode(lastChild)) {
					root.append(ui_lexical_core.$createParagraphNode());
				}
			}),
			this.getEditor().registerCommand(ui_lexical_core.KEY_ARROW_UP_COMMAND, this.#handleEscapeUp.bind(this), ui_lexical_core.COMMAND_PRIORITY_LOW), this.getEditor().registerCommand(ui_lexical_core.KEY_ARROW_LEFT_COMMAND, this.#handleEscapeUp.bind(this), ui_lexical_core.COMMAND_PRIORITY_LOW),
			this.getEditor().registerCommand(ui_lexical_core.KEY_ARROW_DOWN_COMMAND, this.#handleEscapeDown.bind(this), ui_lexical_core.COMMAND_PRIORITY_LOW), this.getEditor().registerCommand(ui_lexical_core.KEY_ARROW_RIGHT_COMMAND, this.#handleEscapeDown.bind(this), ui_lexical_core.COMMAND_PRIORITY_LOW), this.getEditor().registerCommand(ui_lexical_core.PASTE_COMMAND, this.#handlePaste.bind(this), ui_lexical_core.COMMAND_PRIORITY_LOW));
		}
		#handlePaste(event) {
			if (!ui_lexical_utils.objectKlassEquals(event, ClipboardEvent)) {
				return false;
			}
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
				pasteEvent.clipboardData.setData('text/plain', clipboardData.getData('text/plain'));
				pasteEvent.clipboardData.setData('text/html', html);
			}
			this.getEditor().getEditableContainer().dispatchEvent(pasteEvent);
			return true;
		}
		#handleEscapeUp(event) {
			return ui_lexical_utils.$onEscapeUp($isEscapableBlock, event);
		}
		#handleEscapeDown(event) {
			return ui_lexical_utils.$onEscapeDown($isEscapableBlock, event);
		}
	}
	function convertParagraphNode(bbcodeNode) {
		return {
			node: ui_lexical_core.$createParagraphNode()
		};
	}

	var Paragraph = Object.freeze({
		__proto__: null,
		FORMAT_PARAGRAPH_COMMAND: FORMAT_PARAGRAPH_COMMAND,
		ParagraphPlugin: ParagraphPlugin
	});

	class CodeTokenNode extends ui_lexical_core.TextNode {
		__highlightType;
		constructor(text = '', highlightType, key) {
			super(text, key);
			this.__highlightType = highlightType;
		}
		$config() {
			return this.config('code-token', {
				extends: ui_lexical_core.TextNode
			});
		}
		isUnformatted() {
			return true;
		}
		getToolbarBlockType() {
			return 'code';
		}
		afterCloneFrom(prevNode) {
			super.afterCloneFrom(prevNode);
			this.__highlightType = prevNode.__highlightType;
		}
		getHighlightType() {
			const self = this.getLatest();
			return self.__highlightType;
		}
		setHighlightType(highlightType) {
			const writable = this.getWritable();
			writable.__highlightType = highlightType;
			return writable;
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
		updateFromJSON(serializedNode) {
			return super.updateFromJSON(serializedNode).setHighlightType(serializedNode.highlightType);
		}
		exportJSON() {
			return {
				...super.exportJSON(),
				highlightType: this.getHighlightType()
			};
		}
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

	class CodeNode extends ui_lexical_core.ElementNode {
		__language = 'lexical-hack';
		$config() {
			return this.config('code', {
				extends: ui_lexical_core.ElementNode
			});
		}
		isUnformatted() {
			return true;
		}
		isEscapableBlock() {
			return true;
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
					if (isGitHubCodeTable(table)) {
						return {
							conversion: convertTableElement,
							priority: 3
						};
					}
					return null;
				},
				td: node => {
					const td = node;
					const table = td.closest('table');
					if (isGitHubCodeCell(td)) {
						return {
							conversion: convertTableCellElement,
							priority: 3
						};
					}
					if (table && isGitHubCodeTable(table)) {
						return {
							conversion: convertCodeNoop,
							priority: 3
						};
					}
					return null;
				},
				tr: node => {
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
			const {
				anchor,
				focus
			} = selection;
			const firstPoint = anchor.isBefore(focus) ? anchor : focus;
			const firstSelectionNode = firstPoint.getNode();
			if (ui_lexical_core.$isTextNode(firstSelectionNode)) {
				let node = getFirstCodeNodeOfLine(firstSelectionNode);
				const insertNodes = [];
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
				} = anchor;
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
		const cell = domNode;
		return {
			after: childLexicalNodes => {
				if (cell.parentNode && cell.parentNode.nextSibling) {
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
		return main_core.Dom.hasClass(cell, 'js-file-line');
	}
	function isGitHubCodeTable(table) {
		return main_core.Dom.hasClass(table, 'js-file-line-container');
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

	const FORMAT_CODE_COMMAND = ui_lexical_core.createCommand('FORMAT_CODE_COMMAND');
	const TOGGLE_CODE_COMMAND = ui_lexical_core.createCommand('TOGGLE_CODE_COMMAND');
	const INSERT_CODE_COMMAND = ui_lexical_core.createCommand('INSERT_CODE_COMMAND');
	const HIGHLIGHT_SIZE_LIMIT = 50000;
	const HIGHLIGHT_LINE_LIMIT = 2000;
	const TAB_PART = Object.freeze({
		kind: 'tab',
		text: '\t'
	});
	const LINE_BREAK_PART = Object.freeze({
		kind: 'linebreak',
		text: '\n'
	});
	class CodePlugin extends BasePlugin {
		#nodesCurrentlyHighlighting = new Set();
		#codeParser = new ui_codeParser.CodeParser();
		#lastHighlight = null;
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
								const content = childLexicalNodes.map(childNode => childNode.getTextContent()).join('');
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
						node: createBBCodeElement(scheme, {
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
			this.getEditor().registerNodeTransform(CodeNode, this.#handleCodeNodeTransform.bind(this)), this.getEditor().registerNodeTransform(ui_lexical_core.TextNode, handleTextNodeTransform), this.getEditor().registerNodeTransform(CodeTokenNode, handleTextNodeTransform), this.getEditor().registerCommand(ui_lexical_core.FORMAT_TEXT_COMMAND, () => {
				const selection = ui_lexical_core.$getSelection();
				if (!ui_lexical_core.$isRangeSelection(selection)) {
					return false;
				}
				const node = getSelectedNode(selection);
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
				if (!ui_lexical_core.$isRangeSelection(selection) || !ui_lexical_utils.objectKlassEquals(event, ClipboardEvent) || event.clipboardData === null) {
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
					codeNode.append(...$createNodesFromParts(this.#getCodeParts(payload.content)));
					ui_lexical_utils.$insertNodeToNearestRoot(codeNode);
					this.#lastHighlight = {
						nodeKey: codeNode.getKey(),
						text: codeNode.getTextContent()
					};
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
			this.getEditor().update(() => {
				const currentNode = ui_lexical_core.$getNodeByKey(nodeKey);
				if (!$isCodeNode(currentNode) || !currentNode.isAttached()) {
					return;
				}
				const code = currentNode.getTextContent();
				if (this.#isHighlightUpToDate(nodeKey, code)) {
					return;
				}
				updateAndRetainSelection(nodeKey, () => {
					const parts = this.#getCodeParts(code);
					const {
						from,
						to,
						partsForReplacement
					} = getDiffRange(currentNode.getChildren(), parts);
					if (from !== to || partsForReplacement.length > 0) {
						node.splice(from, to - from, $createNodesFromParts(partsForReplacement));
						return true;
					}
					return false;
				});
				this.#lastHighlight = {
					nodeKey,
					text: code
				};
			}, {
				onUpdate: () => {
					this.#nodesCurrentlyHighlighting.delete(nodeKey);
				},
				skipTransforms: true
			});
		}
		#isHighlightUpToDate(nodeKey, code) {
			return this.#lastHighlight?.nodeKey === nodeKey && this.#lastHighlight.text === code;
		}
		#getCodeParts(code) {
			return isOversized(code) ? getPlainCodeParts(code) : getCodeParts(this.#codeParser.parse(code));
		}
		#handleTextNodeTransform(node) {
			const parentNode = node.getParent();
			if ($isCodeNode(parentNode)) {
				if (!$isCodeTokenNode(node)) {
					this.#lastHighlight = null;
				}
				this.#handleCodeNodeTransform(parentNode);
			} else if ($isCodeTokenNode(node)) {
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
			const codeLines = $getCodeLines(selection);
			if (codeLines.length > 1) {
				return indentOrOutdent;
			}
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
			return tabOrOutdent;
		}
		#handleMultilineIndent(type) {
			const selection = ui_lexical_core.$getSelection();
			if (!ui_lexical_core.$isRangeSelection(selection) || !$isSelectionInCode(selection)) {
				return false;
			}
			const codeLines = $getCodeLines(selection);
			const codeLinesLength = codeLines.length;
			if (codeLines.length > 1) {
				for (let i = 0; i < codeLinesLength; i++) {
					const line = codeLines[i];
					if (line.length > 0) {
						let firstOfLine = line[0];
						if (i === 0) {
							firstOfLine = getFirstCodeNodeOfLine(firstOfLine);
						}
						if (firstOfLine !== null) {
							if (type === ui_lexical_core.INDENT_CONTENT_COMMAND) {
								firstOfLine.insertBefore(ui_lexical_core.$createTabNode());
							} else if (ui_lexical_core.$isTabNode(firstOfLine)) {
								firstOfLine.remove();
							}
						}
					}
				}
				return true;
			}
			const selectionNodes = selection.getNodes();
			const firstNode = selectionNodes[0];
			if ($isCodeNode(firstNode)) {
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
	function getDiffRange(prevNodes, nextParts) {
		let leadingMatch = 0;
		while (leadingMatch < prevNodes.length) {
			if (!nodeMatchesPart(prevNodes[leadingMatch], nextParts[leadingMatch])) {
				break;
			}
			leadingMatch++;
		}
		const prevNodesLength = prevNodes.length;
		const nextPartsLength = nextParts.length;
		const maxTrailingMatch = Math.min(prevNodesLength, nextPartsLength) - leadingMatch;
		let trailingMatch = 0;
		while (trailingMatch < maxTrailingMatch) {
			trailingMatch++;
			if (!nodeMatchesPart(prevNodes[prevNodesLength - trailingMatch], nextParts[nextPartsLength - trailingMatch])) {
				trailingMatch--;
				break;
			}
		}
		return {
			from: leadingMatch,
			partsForReplacement: nextParts.slice(leadingMatch, nextPartsLength - trailingMatch),
			to: prevNodesLength - trailingMatch
		};
	}
	function nodeMatchesPart(node, part) {
		if (node === undefined || part === undefined) {
			return false;
		}
		if (part.kind === 'tab') {
			return ui_lexical_core.$isTabNode(node);
		}
		if (part.kind === 'linebreak') {
			return ui_lexical_core.$isLineBreakNode(node);
		}
		return $isCodeTokenNode(node) && node.__text === part.text && node.__highlightType === part.highlightType;
	}
	function getCodeParts(tokens) {
		const parts = [];
		tokens.forEach(token => {
			ui_lexical_core.tokenizeRawText(token.content, {
				linebreak: () => {
					parts.push(LINE_BREAK_PART);
				},
				tab: () => {
					parts.push(TAB_PART);
				},
				text: text => {
					parts.push({
						kind: 'token',
						text,
						highlightType: token.type
					});
				}
			});
		});
		return parts;
	}
	function isOversized(code) {
		return code.length > HIGHLIGHT_SIZE_LIMIT || countLines(code) > HIGHLIGHT_LINE_LIMIT;
	}
	function countLines(code) {
		let lines = 1;
		for (let index = code.indexOf('\n'); index !== -1; index = code.indexOf('\n', index + 1)) {
			lines++;
		}
		return lines;
	}
	function getPlainCodeParts(code) {
		const parts = [];
		ui_lexical_core.tokenizeRawText(code, {
			linebreak: () => {
				parts.push(LINE_BREAK_PART);
			},
			tab: () => {
				parts.push(TAB_PART);
			},
			text: text => {
				parts.push({
					kind: 'token',
					text
				});
			}
		});
		return parts;
	}
	function $createNodesFromParts(parts) {
		return parts.map(part => {
			if (part.kind === 'tab') {
				return ui_lexical_core.$createTabNode();
			}
			if (part.kind === 'linebreak') {
				return ui_lexical_core.$createLineBreakNode();
			}
			return $createCodeTokenNode(part.text, part.highlightType);
		});
	}
	function updateAndRetainSelection(nodeKey, updateFn) {
		const node = ui_lexical_core.$getNodeByKey(nodeKey);
		if (!$isCodeNode(node) || !node.isAttached()) {
			return;
		}
		const selection = ui_lexical_core.$getSelection();
		if (!ui_lexical_core.$isRangeSelection(selection)) {
			updateFn();
			return;
		}
		const anchor = selection.anchor;
		const anchorNode = anchor.getNode();
		if (!node.is(anchorNode) && !node.isParentOf(anchorNode)) {
			updateFn();
			return;
		}
		const anchorOffset = anchor.offset;
		const isNewLineAnchor = anchor.type === 'element' && ui_lexical_core.$isLineBreakNode(node.getChildAtIndex(anchor.offset - 1));
		let textOffset = 0;
		if (!isNewLineAnchor) {
			textOffset = anchorOffset;
			for (let sibling = anchorNode.getPreviousSibling(); sibling !== null; sibling = sibling.getPreviousSibling()) {
				textOffset += sibling.getTextContentSize();
			}
		}
		const hasChanges = updateFn();
		if (!hasChanges) {
			return;
		}
		if (isNewLineAnchor) {
			anchor.getNode().select(anchorOffset, anchorOffset);
			return;
		}
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

	var Code = Object.freeze({
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
			destroy: () => {
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
		}
		destroy() {
			this.#nodeSelection.destroy();
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
		#onPointerDownHandler = this.#handlePointerDown.bind(this);
		#onPointerMoveHandler = this.#handlePointerMove.bind(this);
		#onPointerUpHandler = this.#handlePointerUp.bind(this);
		#container = null;
		#target = null;
		#editor = null;
		#maxWidth = 'none';
		#minWidth = 16;
		#minHeight = 16;
		#resizeEndTimeoutId = null;
		#maxContainerWidth = 0;
		#boundsObserver = null;
		constructor({
			target,
			editor,
			originalWidth,
			originalHeight,
			minWidth,
			minHeight,
			maxWidth,
			events,
			freeTransform
		}) {
			super();
			this.setEventNamespace('BX.UI.TextEditor.FigureResizer');
			this.#target = target;
			this.#editor = editor;
			this.#minWidth = Math.min(Math.max(this.#minWidth, main_core.Type.isNumber(minWidth) ? minWidth : this.#minWidth), main_core.Type.isNumber(originalWidth) ? originalWidth : Infinity);
			this.#minHeight = Math.min(Math.max(this.#minHeight, main_core.Type.isNumber(minHeight) ? minHeight : this.#minHeight), main_core.Type.isNumber(originalHeight) ? originalHeight : Infinity);
			this.setMaxWidth(maxWidth ?? 'none');
			this.#freeTransform = freeTransform === true;
			this.subscribeFromOptions(events ?? {});
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
		setMaxWidth(maxWidth) {
			this.#maxWidth = main_core.Type.isNumber(maxWidth) ? maxWidth : 'none';
		}
		isResizing() {
			return this.#positioning.isResizing;
		}
		destroy() {
			if (this.getEditor().isDestroying()) {
				this.#cancelDeferredResizeEnd();
			} else {
				this.#flushDeferredResizeEnd();
			}
			this.#positioning.isResizing = false;
			this.#unwatchEditorBounds();
			main_core.Event.unbind(document, 'pointermove', this.#onPointerMoveHandler);
			main_core.Event.unbind(document, 'pointerup', this.#onPointerUpHandler);
			this.unsubscribeAll();
		}
		#handlePointerDown(event) {
			if (!this.getEditor().isEditable()) {
				return;
			}
			this.#cancelDeferredResizeEnd();
			event.preventDefault();
			const direction = Number(event.target.dataset.direction);
			const target = this.getTarget();
			const {
				width,
				height
			} = target.getBoundingClientRect();
			this.#maxContainerWidth = this.#measureMaxContainerWidth();
			this.#positioning.startWidth = width;
			this.#positioning.startHeight = height;
			this.#positioning.ratio = width / height;
			this.#positioning.currentWidth = width;
			this.#positioning.currentHeight = height;
			this.#positioning.startX = event.clientX;
			this.#positioning.startY = event.clientY;
			this.#positioning.isResizing = true;
			this.#positioning.direction = direction;
			this.emit('onResizeStart');
			main_core.Dom.addClass(this.getContainer(), '--resizing');
			main_core.Dom.style(target, {
				width: `${width}px`,
				height: `${height}px`
			});
			main_core.Event.bind(document, 'pointermove', this.#onPointerMoveHandler);
			main_core.Event.bind(document, 'pointerup', this.#onPointerUpHandler);
			this.#watchEditorBounds();
		}
		#watchEditorBounds() {
			this.#unwatchEditorBounds();
			const editorRootElement = this.getEditor().getRootElement();
			if (editorRootElement === null) {
				return;
			}
			this.#boundsObserver = new ResizeObserver(() => {
				this.#maxContainerWidth = this.#measureMaxContainerWidth();
			});
			this.#boundsObserver.observe(editorRootElement);
		}
		#unwatchEditorBounds() {
			if (this.#boundsObserver !== null) {
				this.#boundsObserver.disconnect();
				this.#boundsObserver = null;
			}
		}
		#handlePointerMove(event) {
			const target = this.getTarget();
			const isHorizontal = this.#positioning.direction & (Direction$1.EAST | Direction$1.WEST);
			const isVertical = this.#positioning.direction & (Direction$1.SOUTH | Direction$1.NORTH);
			if (this.#positioning.isResizing) {
				if (isHorizontal && isVertical) {
					let diff = Math.floor(this.#positioning.startX - event.clientX);
					diff = this.#positioning.direction & Direction$1.EAST ? -diff : diff;
					const width = Math.round(clamp(this.#positioning.startWidth + diff, this.#minWidth, this.#maxContainerWidth));
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
					const height = Math.round(Math.max(this.#positioning.startHeight + diff, this.#minHeight));
					main_core.Dom.style(target, 'height', `${height}px`);
					this.emit('onResize', {
						width: this.#positioning.currentWidth,
						height
					});
					this.#positioning.currentHeight = height;
				} else {
					let diff = Math.floor(this.#positioning.startX - event.clientX);
					diff = this.#positioning.direction & Direction$1.EAST ? -diff : diff;
					const width = Math.round(clamp(this.#positioning.startWidth + diff, this.#minWidth, this.#maxContainerWidth));
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
			this.#unwatchEditorBounds();
			if (this.#positioning.isResizing) {
				this.#resizeEndTimeoutId = setTimeout(() => {
					this.#resizeEndTimeoutId = null;
					this.#finishResize();
				}, 200);
			}
		}
		#finishResize() {
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
			main_core.Event.unbind(document, 'pointermove', this.#onPointerMoveHandler);
			main_core.Event.unbind(document, 'pointerup', this.#onPointerUpHandler);
		}
		#flushDeferredResizeEnd() {
			if (this.#resizeEndTimeoutId !== null) {
				clearTimeout(this.#resizeEndTimeoutId);
				this.#resizeEndTimeoutId = null;
				this.#finishResize();
			}
		}
		#cancelDeferredResizeEnd() {
			if (this.#resizeEndTimeoutId !== null) {
				clearTimeout(this.#resizeEndTimeoutId);
				this.#resizeEndTimeoutId = null;
			}
		}
		#measureMaxContainerWidth() {
			const maxWidth = main_core.Type.isNumber(this.#maxWidth) ? this.#maxWidth : Infinity;
			const editorRootElement = this.getEditor().getRootElement();
			if (editorRootElement !== null) {
				return Math.min(editorRootElement.getBoundingClientRect().width - 20, maxWidth);
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
		destroy() {
			this.#figureResizer.destroy();
			super.destroy();
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
			this.getImage().alt = options.alt ?? '';
			main_core.Dom.style(this.getImage(), {
				width,
				height: 'auto',
				aspectRatio
			});
		}
	}

	function getDefaultAlt(info) {
		return main_core.Type.isStringFilled(info?.name) ? info.name.trim() : '';
	}
	class FileImageNode extends ui_lexical_core.DecoratorNode {
		__serverFileId;
		__info;
		__alt;
		__width;
		__height;
		constructor(serverFileId = '', info = {}, width, height, alt, key) {
			super(key);
			this.__serverFileId = serverFileId;
			this.__info = main_core.Type.isPlainObject(info) ? info : {};
			this.__alt = main_core.Type.isString(alt) ? alt.trim() : getDefaultAlt(this.__info);
			this.__width = main_core.Type.isNumber(width) && width > 0 ? Math.round(width) : this.__info.previewWidth;
			this.__height = main_core.Type.isNumber(height) && height > 0 ? Math.round(height) : this.__info.previewHeight;
		}
		static useDecoratorComponent = true;
		$config() {
			return this.config('file-image', {
				extends: ui_lexical_core.DecoratorNode
			});
		}
		afterCloneFrom(prevNode) {
			super.afterCloneFrom(prevNode);
			this.__serverFileId = prevNode.__serverFileId;
			this.__info = prevNode.__info;
			this.__alt = prevNode.__alt;
			this.__width = prevNode.__width;
			this.__height = prevNode.__height;
		}
		updateFromJSON(serializedNode) {
			const {
				serverFileId,
				info,
				alt,
				width,
				height
			} = serializedNode;
			const writable = super.updateFromJSON(serializedNode).getWritable();
			writable.__serverFileId = serverFileId;
			writable.__info = main_core.Type.isPlainObject(info) ? info : {};
			writable.__alt = main_core.Type.isString(alt) ? alt.trim() : getDefaultAlt(writable.__info);
			writable.__width = main_core.Type.isNumber(width) && width > 0 ? Math.round(width) : writable.__info.previewWidth;
			writable.__height = main_core.Type.isNumber(height) && height > 0 ? Math.round(height) : writable.__info.previewHeight;
			return writable;
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
		getAlt() {
			const self = this.getLatest();
			return self.__alt;
		}
		setAlt(alt) {
			const writable = this.getWritable();
			writable.__alt = main_core.Type.isString(alt) ? alt.trim() : '';
			return writable;
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
							const alt = img.hasAttribute('alt') ? img.alt : null;
							const node = $createFileImageNode(fileImageId, info, null, null, alt);
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
				...super.exportJSON(),
				info: this.__info,
				serverFileId: this.__serverFileId,
				alt: this.getAlt(),
				width: this.getWidth(),
				height: this.getHeight()
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
					alt: this.getAlt(),
					width: this.getWidth(),
					height: this.getHeight(),
					maxWidth: this.getWidth(),
					maxHeight: this.getHeight(),
					config: config
				}
			};
		}
		isInline() {
			return true;
		}
	}
	function $createFileImageNode(serverFileId, info = {}, width = null, height = null, alt = null) {
		return new FileImageNode(serverFileId, info, width, height, alt);
	}
	function $isFileImageNode(node) {
		return node instanceof FileImageNode;
	}

	class FileNode extends ui_lexical_core.TextNode {
		__serverFileId;
		__info;
		constructor(serverFileId = '', info = {}, key) {
			const fileInfo = main_core.Type.isPlainObject(info) ? info : {};
			super(fileInfo.name || '', key);
			this.__serverFileId = serverFileId;
			this.__info = fileInfo;
		}
		$config() {
			return this.config('file', {
				extends: ui_lexical_core.TextNode
			});
		}
		afterCloneFrom(prevNode) {
			super.afterCloneFrom(prevNode);
			this.__serverFileId = prevNode.__serverFileId;
			this.__info = prevNode.__info;
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
		setServerFileId(serverFileId) {
			const writable = this.getWritable();
			writable.__serverFileId = serverFileId;
			return writable;
		}
		setInfo(info) {
			const writable = this.getWritable();
			writable.__info = main_core.Type.isPlainObject(info) ? info : {};
			return writable;
		}
		updateFromJSON(serializedNode) {
			return super.updateFromJSON(serializedNode).setServerFileId(serializedNode.serverFileId).setInfo(serializedNode.info);
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
				serverFileId: this.__serverFileId
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
		const useOriginalSize = ratio > 1;
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
		destroy() {
			this.#figureResizer.destroy();
			super.destroy();
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

	class FileVideoNode extends ui_lexical_core.DecoratorNode {
		__serverFileId;
		__info;
		__width = 0;
		__height = 0;
		constructor(serverFileId = '', info = {}, width, height, key) {
			super(key);
			this.__serverFileId = serverFileId;
			this.__info = main_core.Type.isPlainObject(info) ? info : {};
			this.__width = main_core.Type.isNumber(width) && width > 0 ? Math.round(width) : this.__info.previewWidth > 0 ? this.__info.previewWidth : this.__width;
			this.__height = main_core.Type.isNumber(height) && height > 0 ? Math.round(height) : this.__info.previewHeight > 0 ? this.__info.previewHeight : this.__height;
		}
		static useDecoratorComponent = true;
		$config() {
			return this.config('file-video', {
				extends: ui_lexical_core.DecoratorNode
			});
		}
		afterCloneFrom(prevNode) {
			super.afterCloneFrom(prevNode);
			this.__serverFileId = prevNode.__serverFileId;
			this.__info = prevNode.__info;
			this.__width = prevNode.__width;
			this.__height = prevNode.__height;
		}
		updateFromJSON(serializedNode) {
			const {
				serverFileId,
				info,
				width,
				height
			} = serializedNode;
			const writable = super.updateFromJSON(serializedNode).getWritable();
			writable.__serverFileId = serverFileId;
			writable.__info = main_core.Type.isPlainObject(info) ? info : {};
			writable.__width = main_core.Type.isNumber(width) && width > 0 ? Math.round(width) : writable.__info.previewWidth > 0 ? writable.__info.previewWidth : writable.__width;
			writable.__height = main_core.Type.isNumber(height) && height > 0 ? Math.round(height) : writable.__info.previewHeight > 0 ? writable.__info.previewHeight : writable.__height;
			return writable;
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
				...super.exportJSON(),
				info: this.__info,
				serverFileId: this.__serverFileId,
				width: this.getWidth(),
				height: this.getHeight()
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
					config: config
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
		if (document.caretRangeFromPoint) {
			return document.caretRangeFromPoint(event.clientX, event.clientY);
		}
		if (document.caretPositionFromPoint) {
			const position = document.caretPositionFromPoint(event.clientX, event.clientY);
			if (position !== null) {
				const range = document.createRange();
				range.setStart(position.offsetNode, position.offset);
				range.collapse(true);
				return range;
			}
		}
		const domSelection = (targetWindow || window).getSelection();
		if (event.rangeParent && domSelection !== null) {
			domSelection.collapse(event.rangeParent, event.rangeOffset || 0);
			return domSelection.getRangeAt(0);
		}
		throw new Error('Cannot get the selection when dragging');
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
	const TRANSPARENT_IMAGE = main_core.Tag.render`<img src="${TRANSPARENT_GIF_SRC}">`;
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
		const selectors = ['code'];
		const imageContainer = editor.getThemeClasses().image?.container;
		if (main_core.Type.isStringFilled(imageContainer)) {
			selectors.push(`.${imageContainer.trim().split(/\s+/).join('.')}`);
		}
		return target instanceof HTMLElement && target.closest(selectors.join(',')) === null && editor.getEditableContainer().contains(target.parentElement);
	}

	const FileType = {
		FILE: 'file',
		IMAGE: 'image',
		VIDEO: 'video'
	};
	const ADD_FILE_COMMAND = ui_lexical_core.createCommand('ADD_FILE_COMMAND');
	const ADD_FILES_COMMAND = ui_lexical_core.createCommand('ADD_FILES_COMMAND');
	const INSERT_FILE_COMMAND = ui_lexical_core.createCommand('INSERT_FILE_COMMAND');
	const REMOVE_FILE_COMMAND = ui_lexical_core.createCommand('REMOVE_FILE_COMMAND');
	const GET_INSERTED_FILES_COMMAND = ui_lexical_core.createCommand('GET_INSERTED_FILES_COMMAND');
	class FilePlugin extends BasePlugin {
		#enabled = false;
		#mode = 'file';
		#files = new Map();
		constructor(editor) {
			super(editor);
			const mode = editor.getOption('file.mode');
			if (mode !== 'file' && mode !== 'disk') {
				return;
			}
			this.#enabled = true;
			this.#mode = mode;
			this.addFiles(editor.getOption('file.files', []));
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
		static getDefaultOptions() {
			return {
				file: {
					files: []
				}
			};
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
						node: createBBCodeElement(scheme, {
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
					const node = createBBCodeElement(scheme, {
						name: this.getMode(),
						attributes,
						inline: false
					});
					if (lexicalNode.getWidth() > 0 && lexicalNode.getHeight() > 0) {
						node.setAttribute('width', lexicalNode.getWidth());
						node.setAttribute('height', lexicalNode.getHeight());
					}
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
					const node = createBBCodeElement(scheme, {
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
		#createNodeForFile(payload) {
			const fileType = this.getFileType(payload.info);
			const previewWidth = payload.info.previewWidth;
			const previewHeight = payload.info.previewHeight;
			const renderWidth = payload.width;
			const renderHeight = payload.height;
			if (fileType === FileType.IMAGE) {
				const [width, height] = calcImageSize(previewWidth, previewHeight, renderWidth, renderHeight);
				const alt = payload.alt ?? null;
				return $createFileImageNode(payload.serverFileId, payload.info, width, height, alt);
			}
			if (fileType === FileType.VIDEO) {
				let width = 0;
				let height = 0;
				if (previewWidth > 0 && previewHeight > 0) {
					[width, height] = calcImageSize(previewWidth, previewHeight, renderWidth, renderHeight);
				}
				return $createFileVideoNode(payload.serverFileId, payload.info, width, height);
			}
			return $createFileNode(payload.serverFileId, payload.info);
		}
		#insertFile(payload) {
			if (!main_core.Type.isPlainObject(payload) || !main_core.Type.isPlainObject(payload.info) || !main_core.Type.isNumber(payload.serverFileId) && !main_core.Type.isStringFilled(payload.serverFileId)) {
				return false;
			}
			this.addFile(payload.info);
			const fileType = this.getFileType(payload.info);
			const node = this.#createNodeForFile(payload);
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
		}
		#registerListeners() {
			this.cleanUpRegister(this.getEditor().registerCommand(INSERT_FILE_COMMAND, this.#insertFile.bind(this), ui_lexical_core.COMMAND_PRIORITY_EDITOR), this.getEditor().registerCommand(REMOVE_FILE_COMMAND, payload => {
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

	var File = Object.freeze({
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

	function normalizeMaxWidth(maxWidth) {
		return main_core.Type.isNumber(maxWidth) ? maxWidth : 'none';
	}
	class ImageComponent extends DecoratorComponent {
		#refs = new main_core_cache.MemoryCache();
		#figureResizer = null;
		#maxWidth = 'none';
		constructor(options) {
			super(options);
			this.#maxWidth = normalizeMaxWidth(this.getOption('maxWidth'));
			this.#figureResizer = new FigureResizer({
				target: this.getImage(),
				editor: this.getEditor(),
				originalWidth: this.getOption('width'),
				originalHeight: this.getOption('height'),
				maxWidth: this.#maxWidth,
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
		destroy() {
			this.#figureResizer.destroy();
			super.destroy();
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
					img.src = TRANSPARENT_GIF_SRC;
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
			const hasSize = options.width > 0 && options.height > 0;
			const aspectRatio = hasSize ? `${options.width} / ${options.height}` : 'auto';
			this.#maxWidth = normalizeMaxWidth(options.maxWidth);
			this.#figureResizer.setMaxWidth(this.#maxWidth);
			this.getImage().alt = options.alt ?? '';
			main_core.Dom.style(this.getImage(), {
				width,
				height: 'auto',
				aspectRatio
			});
		}
	}

	function normalizeSize(size) {
		if (main_core.Type.isNumber(size)) {
			const rounded = Math.round(size);
			return rounded > 0 ? rounded : null;
		}
		return size === 'inherit' ? 'inherit' : null;
	}
	class ImageNode extends ui_lexical_core.DecoratorNode {
		__src;
		__alt = '';
		__width = 'inherit';
		__height = 'inherit';
		__maxWidth = 'none';
		constructor(src = '', width, height, maxWidth, alt, key) {
			super(key);
			if (validateImageUrl(src)) {
				this.__src = src;
			} else {
				this.__src = TRANSPARENT_GIF_SRC;
			}
			if (main_core.Type.isString(alt)) {
				this.__alt = alt.trim();
			}
			const normalizedWidth = normalizeSize(width);
			if (normalizedWidth !== null) {
				this.__width = normalizedWidth;
			}
			const normalizedHeight = normalizeSize(height);
			if (normalizedHeight !== null) {
				this.__height = normalizedHeight;
			}
			if (main_core.Type.isNumber(maxWidth)) {
				this.__maxWidth = Math.round(maxWidth);
			}
		}
		static useDecoratorComponent = true;
		$config() {
			return this.config('image', {
				extends: ui_lexical_core.DecoratorNode
			});
		}
		afterCloneFrom(prevNode) {
			super.afterCloneFrom(prevNode);
			this.__src = prevNode.__src;
			this.__alt = prevNode.__alt;
			this.__width = prevNode.__width;
			this.__height = prevNode.__height;
			this.__maxWidth = prevNode.__maxWidth;
		}
		updateFromJSON(serializedNode) {
			const node = super.updateFromJSON(serializedNode).setSrc(serializedNode.src).setAlt(serializedNode.alt ?? '');
			node.setWidthAndHeight(serializedNode.width ?? 'inherit', serializedNode.height ?? 'inherit');
			node.setMaxWidth(serializedNode.maxWidth ?? 'none');
			return node;
		}
		exportDOM() {
			const element = document.createElement('img');
			element.setAttribute('src', this.__src);
			element.setAttribute('alt', this.__alt);
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
								alt,
								width,
								height
							} = domNode;
							const imageNode = $createImageNode({
								src,
								alt,
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
				...super.exportJSON(),
				src: this.getSrc(),
				alt: this.getAlt(),
				width: this.getWidth(),
				height: this.getHeight(),
				maxWidth: this.getMaxWidth()
			};
		}
		setSrc(src) {
			const writable = this.getWritable();
			writable.__src = validateImageUrl(src) ? src : TRANSPARENT_GIF_SRC;
			return writable;
		}
		setAlt(alt) {
			const writable = this.getWritable();
			writable.__alt = main_core.Type.isString(alt) ? alt.trim() : '';
			return writable;
		}
		setWidthAndHeight(width, height) {
			const writable = this.getWritable();
			const normalizedWidth = normalizeSize(width);
			if (normalizedWidth !== null) {
				writable.__width = normalizedWidth;
			}
			const normalizedHeight = normalizeSize(height);
			if (normalizedHeight !== null) {
				writable.__height = normalizedHeight;
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
		getAlt() {
			const self = this.getLatest();
			return self.__alt;
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
					alt: this.getAlt(),
					width: this.getWidth(),
					height: this.getHeight(),
					maxWidth: this.getMaxWidth(),
					config: config
				}
			};
		}
		isInline() {
			return true;
		}
	}
	function $createImageNode({
		src,
		alt,
		width,
		height,
		maxWidth,
		key
	}) {
		return ui_lexical_core.$applyNodeReplacement(new ImageNode(src, width, height, maxWidth, alt, key));
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

	function getPopupOffsetLeft(editor, scrollerRect, left, popupWidth) {
		let offsetLeft = popupWidth / 2;
		const editorPaddings = getEditorPaddings(editor);
		if (left - offsetLeft < scrollerRect.left) {
			const overflow = scrollerRect.left - (left - offsetLeft);
			offsetLeft -= overflow + editorPaddings.left;
		} else if (scrollerRect.right < left + popupWidth - offsetLeft) {
			offsetLeft += left + popupWidth - offsetLeft - scrollerRect.right + editorPaddings.right;
		}
		return offsetLeft;
	}

	function $getSelectionPosition(editor, selection, scrollerContainer) {
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
		const offsetLeft = getPopupOffsetLeft(editor, scrollerRect, left, popupRect.width);
		popup.setOffset({
			offsetLeft: -offsetLeft
		});
		if (bottom < scrollerRect.top || top > scrollerRect.bottom) {
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
				position: position,
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

	class RememberedSelection {
		#selection = null;
		remember(selection) {
			this.#selection = selection.clone();
		}
		forget() {
			this.#selection = null;
		}
		restore() {
			const success = $restoreSelection(this.#selection);
			if (success) {
				this.#selection = null;
			}
			return success;
		}
	}

	function returnFocusToEditor(editor) {
		if (ui_a11y.FocusMonitor.Instance.getLastInputModality() !== 'keyboard') {
			return;
		}
		editor.focus();
	}

	class DialogPlugin extends BasePlugin {
		#dialog = null;
		#lastSelection = new RememberedSelection();
		#positionFrameRequested = false;
		#onEditorScroll = this.#handleEditorScroll.bind(this);
		getDialog() {
			return this.#dialog;
		}
		setDialog(dialog) {
			this.#dialog = dialog;
		}
		isDialogShown() {
			return this.#dialog !== null && this.#dialog.isShown();
		}
		rememberSelection(selection) {
			this.#lastSelection.remember(selection);
		}
		forgetSelection() {
			this.#lastSelection.forget();
		}
		restoreSelection() {
			return this.#lastSelection.restore();
		}
		attachDialogToSelection() {
			if ($adjustDialogPosition(this.#dialog.getPopup(), this.getEditor())) {
				main_core.Event.bind(this.getEditor().getScrollerContainer(), 'scroll', this.#onEditorScroll, {
					signal: this.getAbortSignal()
				});
				this.getEditor().highlightSelection();
			}
		}
		registerDialogCommands(sender) {
			return ui_lexical_utils.mergeRegister(this.getEditor().registerCommand(HIDE_DIALOG_COMMAND, payload => {
				if (payload?.sender === sender) {
					return false;
				}
				this.forgetSelection();
				this.getDialog()?.destroy();
				return false;
			}, ui_lexical_core.COMMAND_PRIORITY_LOW), this.getEditor().registerCommand(DIALOG_VISIBILITY_COMMAND, () => {
				return this.isDialogShown();
			}, ui_lexical_core.COMMAND_PRIORITY_LOW));
		}
		handleDialogDestroy() {
			if (this.#dialog === null) {
				return;
			}
			this.#dialog = null;
			main_core.Event.unbind(this.getEditor().getScrollerContainer(), 'scroll', this.#onEditorScroll);
			this.getEditor().resetHighlightSelection();
			if (this.isDestroyed()) {
				return;
			}
			this.getEditor().update(() => {
				this.restoreSelection();
				returnFocusToEditor(this.getEditor());
			});
		}
		destroy() {
			super.destroy();
			this.#dialog?.destroy();
		}
		#handleEditorScroll() {
			if (this.#positionFrameRequested) {
				return;
			}
			this.#positionFrameRequested = true;
			this.registerAnimationFrame(() => {
				this.#positionFrameRequested = false;
				if (this.#dialog === null) {
					return;
				}
				this.getEditor().getEditorState().read(() => {
					$adjustDialogPosition(this.#dialog.getPopup(), this.getEditor());
				});
			});
		}
	}

	function getAriaMessage(messageId, replacements = null) {
		const message = main_core.Loc.getMessage(messageId, replacements);
		return main_core.Type.isStringFilled(message) ? message : null;
	}

	function renderDialogButton(options) {
		const button = main_core.Tag.render`
		<button
			type="button"
			class="${options.className}"
			onclick="${options.onClick}"
			data-testid="${options.testId}"
		>
			<span class="ui-icon-set --${options.icon}"></span>
		</button>
	`;
		main_core.Dom.attr(button, 'aria-label', options.ariaLabel);
		return button;
	}

	const ATTRIBUTE_WHITESPACES = /[\u0000-\u0020\u00A0\u1680\u180E\u2000-\u2029\u205F\u3000]/g;
	const SAFE_URL = /^(?:(?:https?|ftps?|mailto):|[^a-z]|[+.a-z-]+(?:[^+.:a-z-]|$))/i;
	function sanitizeUrl(url) {
		if (!main_core.Type.isStringFilled(url)) {
			return '';
		}
		const normalizedUrl = url.replaceAll(ATTRIBUTE_WHITESPACES, '');
		return SAFE_URL.test(normalizedUrl) ? normalizedUrl : '';
	}

	const DIALOG_FOCUS_TRAP = {
		initialFocus: 'first-tabbable',
		restoreFocus: false
	};

	class BaseDialog extends main_core_events.EventEmitter {
		#popup = null;
		#targetContainer = null;
		#refs = new main_core_cache.MemoryCache();
		constructor(eventNamespace, dialogOptions) {
			super();
			this.setEventNamespace(eventNamespace);
			const options = main_core.Type.isPlainObject(dialogOptions) ? dialogOptions : {};
			this.setTargetContainer(options.targetContainer);
			this.subscribeFromOptions(options.events ?? {});
		}
		show(showOptions = {}) {
			const target = showOptions.target ?? undefined;
			const targetOptions = main_core.Type.isPlainObject(showOptions.targetOptions) ? showOptions.targetOptions : {};
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
			this.#popup?.close();
		}
		adjustPosition() {
			this.#popup?.adjustPosition();
		}
		isShown() {
			return this.#popup !== null && this.#popup.isShown();
		}
		destroy() {
			this.#popup?.destroy();
		}
		setTargetContainer(container) {
			if (main_core.Type.isElementNode(container)) {
				this.#targetContainer = container;
			}
		}
		getTargetContainer() {
			return this.#targetContainer;
		}
		getRefs() {
			return this.#refs;
		}
		getPopup() {
			if (this.#popup === null) {
				this.#popup = new main_popup.Popup({
					autoHide: true,
					padding: 0,
					closeByEsc: true,
					focusTrap: DIALOG_FOCUS_TRAP,
					targetContainer: this.getTargetContainer() ?? undefined,
					...this.getPopupOptions(),
					events: {
						onFirstShow: () => {
							this.emit('onFirstShow');
						},
						onShow: () => {
							this.emit('onShow');
						},
						onAfterShow: () => {
							this.emit('onAfterShow');
						},
						onClose: () => {
							this.emit('onClose');
						},
						onDestroy: () => {
							this.#popup = null;
							this.emit('onDestroy');
						}
					}
				});
			}
			return this.#popup;
		}
		getPopupOptions() {
			return {};
		}
	}

	const BUTTON_CLASS$2 = 'ui-text-editor-image-dialog-button';
	class ImageDialog extends BaseDialog {
		#imageUrl = '';
		#imageAlt = '';
		#textBoxId = `ui-text-editor-image-url-${main_core.Text.getRandom(8)}`;
		#altBoxId = `ui-text-editor-image-alt-${main_core.Text.getRandom(8)}`;
		#altHintId = `ui-text-editor-image-alt-hint-${main_core.Text.getRandom(8)}`;
		constructor(options) {
			super('BX.UI.TextEditor.ImageDialog', options);
			this.subscribe('onAfterShow', () => {
				this.getUrlTextBox().focus();
			});
		}
		setImageUrl(url) {
			if (main_core.Type.isString(url)) {
				this.#imageUrl = sanitizeUrl(url);
			}
		}
		getImageUrl() {
			return this.#imageUrl;
		}
		setImageAlt(alt) {
			if (main_core.Type.isString(alt)) {
				this.#imageAlt = alt.trim();
			}
		}
		getImageAlt() {
			return this.#imageAlt;
		}
		getPopupOptions() {
			return {
				cacheable: false,
				ariaLabel: getAriaMessage('TEXT_EDITOR_DIALOG_IMAGE_ARIA') ?? undefined,
				content: this.getContainer()
			};
		}
		getContainer() {
			return this.getRefs().remember('container', () => {
				return main_core.Tag.render`
				<div class="ui-text-editor-image-dialog">
					<div class="ui-text-editor-image-dialog-form">
						<div class="ui-ctl ui-ctl-textbox ui-ctl-s ui-ctl-inline ui-ctl-w100">
							<label class="ui-ctl-tag" for="${this.#textBoxId}">
								${main_core.Loc.getMessage('TEXT_EDITOR_IMAGE_URL')}
							</label>
							${this.getUrlTextBox()}
						</div>
						<div class="ui-ctl ui-ctl-textbox ui-ctl-s ui-ctl-inline ui-ctl-w100">
							<label class="ui-ctl-tag" for="${this.#altBoxId}">
								${main_core.Loc.getMessage('TEXT_EDITOR_IMAGE_ALT')}
							</label>
							${this.getAltTextBox()}
						</div>
						${this.getAltHint()}
					</div>
					<div class="ui-text-editor-image-dialog-actions">
						${renderDialogButton({
				className: BUTTON_CLASS$2,
				icon: ui_iconSet_api_core.Outline.CHECK_L,
				ariaLabel: getAriaMessage('TEXT_EDITOR_BTN_SAVE_ARIA'),
				testId: 'image-dialog-save-btn',
				onClick: this.#handleSaveBtnClick.bind(this)
			})}
						${renderDialogButton({
				className: BUTTON_CLASS$2,
				icon: ui_iconSet_api_core.Outline.CROSS_L,
				ariaLabel: getAriaMessage('TEXT_EDITOR_BTN_CANCEL_ARIA'),
				testId: 'image-dialog-cancel-btn',
				onClick: this.#handleCancelBtnClick.bind(this)
			})}
					</div>
				</div>
			`;
			});
		}
		getUrlTextBox() {
			return this.getRefs().remember('url-textbox', () => {
				return main_core.Tag.render`
				<input
					type="text"
					id="${this.#textBoxId}"
					class="ui-ctl-element"
					placeholder="https://example.com/image.jpeg"
					value="${this.getImageUrl()}"
					onkeydown="${this.#handleTextBoxKeyDown.bind(this)}"
					data-testid="image-dialog-textbox"
				>
			`;
			});
		}
		getAltTextBox() {
			return this.getRefs().remember('alt-textbox', () => {
				return main_core.Tag.render`
				<input
					type="text"
					id="${this.#altBoxId}"
					class="ui-ctl-element"
					value="${main_core.Text.encode(this.getImageAlt())}"
					aria-describedby="${this.#altHintId}"
					onkeydown="${this.#handleTextBoxKeyDown.bind(this)}"
					data-testid="image-dialog-alt-textbox"
				>
			`;
			});
		}
		getAltHint() {
			return this.getRefs().remember('alt-hint', () => {
				return main_core.Tag.render`
				<div
					class="ui-text-editor-image-dialog-hint"
					id="${this.#altHintId}"
				>${main_core.Loc.getMessage('TEXT_EDITOR_IMAGE_ALT_HINT')}</div>
			`;
			});
		}
		#handleSaveBtnClick() {
			const url = this.getUrlTextBox().value.trim();
			if (url.length > 0) {
				this.setImageUrl(url);
				this.setImageAlt(this.getAltTextBox().value);
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
	class ImagePlugin extends DialogPlugin {
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
						node: createBBCodeElement(scheme, {
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
				this.rememberSelection(selection);
				this.getDialog()?.destroy();
				this.getEditor().dispatchCommand(HIDE_DIALOG_COMMAND, {
					sender: 'image-dialog'
				});
				this.setDialog(this.#createDialog());
				this.getDialog().show();
				return true;
			}, ui_lexical_core.COMMAND_PRIORITY_LOW), this.registerDialogCommands('image-dialog'));
		}
		#createDialog() {
			return new ImageDialog({
				targetContainer: document.body,
				events: {
					onSave: () => {
						const url = this.getDialog().getImageUrl();
						if (!main_core.Type.isStringFilled(url)) {
							this.getDialog().hide();
							return;
						}
						this.getEditor().dispatchCommand(INSERT_IMAGE_COMMAND, {
							src: url,
							alt: this.getDialog().getImageAlt()
						});
						this.getDialog().hide();
					},
					onCancel: () => {
						this.getDialog().hide();
					},
					onClose: () => {
						this.handleDialogDestroy();
					},
					onDestroy: () => {
						this.handleDialogDestroy();
					},
					onShow: () => {
						this.attachDialogToSelection();
					}
				}
			});
		}
		#registerComponents() {
			this.getEditor().getComponentRegistry().register('image', () => {
				const button = new Button();
				button.setIcon(ui_iconSet_api_core.Outline.IMAGE);
				button.setTooltip(main_core.Loc.getMessage('TEXT_EDITOR_BTN_IMAGE'));
				button.setHasPopup('dialog');
				button.disableInsideUnformatted();
				button.subscribe('onClick', () => {
					if (this.isDialogShown()) {
						return;
					}
					this.getEditor().focus(() => {
						this.getEditor().dispatchCommand(INSERT_IMAGE_DIALOG_COMMAND);
					});
				});
				return button;
			});
		}
	}

	var Image = Object.freeze({
		__proto__: null,
		$createImageNode: $createImageNode,
		$isImageNode: $isImageNode,
		INSERT_IMAGE_COMMAND: INSERT_IMAGE_COMMAND,
		INSERT_IMAGE_DIALOG_COMMAND: INSERT_IMAGE_DIALOG_COMMAND,
		ImageNode: ImageNode,
		ImagePlugin: ImagePlugin
	});

	class MentionNode extends ui_lexical_core.ElementNode {
		__id;
		__entityId;
		constructor(entityId = '', id = '', key) {
			super(key);
			this.__entityId = entityId;
			this.__id = id;
		}
		$config() {
			return this.config('mention', {
				extends: ui_lexical_core.ElementNode
			});
		}
		afterCloneFrom(prevNode) {
			super.afterCloneFrom(prevNode);
			this.__entityId = prevNode.__entityId;
			this.__id = prevNode.__id;
		}
		updateFromJSON(serializedNode) {
			return super.updateFromJSON(serializedNode).setEntityId(serializedNode.entityId).setId(serializedNode.id);
		}
		getId() {
			const self = this.getLatest();
			return self.__id;
		}
		setId(id) {
			const writable = this.getWritable();
			writable.__id = id;
			return writable;
		}
		getEntityId() {
			const self = this.getLatest();
			return self.__entityId;
		}
		setEntityId(entityId) {
			const writable = this.getWritable();
			writable.__entityId = entityId;
			return writable;
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
				id: this.__id
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
	const VALID_CHARS = `[^${TRIGGERS}${PUNCTUATION}\\s]`;
	const VALID_JOINS = '(?:' + '\\.[ |$]|'
	+ ' |'
	+ `[${PUNCTUATION}]|`
	+ ')';
	const LENGTH_LIMIT = 25;
	const mentionRegex = new RegExp(`(^|\\s|\\()([${TRIGGERS}]((?:${VALID_CHARS}${VALID_JOINS}){0,${LENGTH_LIMIT}}))$`);
	const INSERT_MENTION_COMMAND = ui_lexical_core.createCommand('INSERT_MENTION_COMMAND');
	const INSERT_MENTION_DIALOG_COMMAND = ui_lexical_core.createCommand('INSERT_MENTION_DIALOG_COMMAND');
	class MentionPlugin extends BasePlugin {
		#dialog = null;
		#dialogLoading = false;
		#lastQueryMatch = null;
		#mentionListening = false;
		#removeKeyboardCommandsLock = null;
		#removeUpdateListener = null;
		#onEditorScroll = this.#handleEditorScroll.bind(this);
		#triggerByAtSign = false;
		#dialogOptions = null;
		#entities = new Set();
		constructor(editor) {
			super(editor);
			const entities = editor.getOption('mention.entities');
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
		static getDefaultOptions() {
			return {
				mention: {
					entities: []
				}
			};
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
						node: createBBCodeElement(scheme, {
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
		#insertMention(payload) {
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
		}
		#registerCommands() {
			this.cleanUpRegister(this.getEditor().registerCommand(INSERT_MENTION_COMMAND, this.#insertMention.bind(this), ui_lexical_core.COMMAND_PRIORITY_EDITOR), this.getEditor().registerCommand(INSERT_MENTION_DIALOG_COMMAND, payload => {
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
					this.#registerTextContentListener();
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
				if (this.#openDialogForQueryAtCaret()) {
					return;
				}
				this.#lastQueryMatch = null;
				this.#hideDialog();
				if (!this.#mentionListening) {
					this.#unregisterTextContentListener();
				}
			});
		}
		#openDialogForQueryAtCaret() {
			const selection = ui_lexical_core.$getSelection();
			const match = this.#getQueryMatch(selection);
			if (match === null || this.#isSelectionOnEntityBoundary(match.leadOffset)) {
				return false;
			}
			this.#openDialog(match);
			return true;
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
				if (this.#dialogLoading) {
					return;
				}
				this.#dialogLoading = true;
				const dialogOptions = main_core.Type.isPlainObject(this.#dialogOptions) ? {
					...this.#dialogOptions
				} : {};
				const userEvents = dialogOptions.events;
				main_core.Runtime.loadExtension('ui.entity-selector').then(exports => {
					this.#dialogLoading = false;
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
								main_core.Event.bind(this.getEditor().getScrollerContainer(), 'scroll', this.#onEditorScroll, {
									signal: this.getAbortSignal()
								});
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
					this.#dialog.subscribeFromOptions(userEvents);
					this.#showDialog();
				}).catch(error => {
					this.#dialogLoading = false;
					console.error('TextEditor: MentionPlugin: cannot load "ui.entity-selector"', error);
				});
			} else {
				this.#showDialog();
			}
		}
		#showDialog() {
			const queryMatch = this.#lastQueryMatch;
			if (queryMatch === null) {
				return;
			}
			this.getEditor().dispatchCommand(HIDE_DIALOG_COMMAND, {
				sender: 'mention'
			});
			this.#dialog.show();
			this.#dialog.search(queryMatch.matchingString);
			this.#adjustDialogPosition();
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
			if (this.#dialog !== null) {
				this.#dialog.destroy();
			}
			this.#unregisterTextContentListener();
			this.#unlockKeyboardCommands();
		}
	}

	var Mention = Object.freeze({
		__proto__: null,
		$createMentionNode: $createMentionNode,
		$isMentionNode: $isMentionNode,
		INSERT_MENTION_COMMAND: INSERT_MENTION_COMMAND,
		INSERT_MENTION_DIALOG_COMMAND: INSERT_MENTION_DIALOG_COMMAND,
		MentionNode: MentionNode,
		MentionPlugin: MentionPlugin
	});

	function $isUnformatted(node) {
		const candidate = node;
		if (candidate?.isUnformatted?.() === true) {
			return true;
		}
		return ((candidate?.__flags ?? 0) & UNFORMATTED) !== 0;
	}
	function $isInsideUnformatted(node) {
		return ui_lexical_utils.$findMatchingParent(node, $isUnformatted) !== null;
	}

	function centerPopupOnTarget(popup, targetWidth, popupWidth) {
		const angleLeftOffset = main_popup.Popup.getOption('angleLeftOffset');
		const angleShift = angleLeftOffset - main_popup.Popup.getOption('angleMinTop');
		const offsetLeft = targetWidth / 2 - popupWidth / 2;
		popup.setAngle({
			offset: popupWidth / 2 - angleShift
		});
		popup.setOffset({
			offsetLeft: offsetLeft + angleLeftOffset
		});
	}

	const POPUP_WIDTH = 332;
	class SmileyDialog extends BaseDialog {
		#targetNode = null;
		#targetNodeWidth = 0;
		#onlyEmoji = false;
		#app = null;
		#destroyed = false;
		constructor(dialogOptions) {
			super('BX.UI.TextEditor.SmileyDialog', dialogOptions);
			const options = main_core.Type.isPlainObject(dialogOptions) ? dialogOptions : {};
			this.setTargetNode(options.targetNode);
			this.#onlyEmoji = options.onlyEmoji === true;
			this.subscribe('onFirstShow', () => {
				this.#mountSmiles();
			});
			this.subscribe('onShow', () => {
				centerPopupOnTarget(this.getPopup(), this.#targetNodeWidth, POPUP_WIDTH);
			});
		}
		destroy() {
			this.#destroyed = true;
			this.#app?.unmount();
			this.#app = null;
			super.destroy();
		}
		setTargetNode(container) {
			if (main_core.Type.isElementNode(container)) {
				this.#targetNode = container;
			}
		}
		getTargetNode() {
			return this.#targetNode;
		}
		getPopupOptions() {
			this.#targetNodeWidth = this.getTargetNode().getBoundingClientRect().width;
			return {
				background: '#F7F9FA',
				ariaLabel: getAriaMessage('TEXT_EDITOR_DIALOG_SMILEYS_ARIA') ?? undefined,
				width: POPUP_WIDTH,
				height: 360,
				bindElement: this.getTargetNode() ?? undefined
			};
		}
		#mountSmiles() {
			const emitSelect = text => {
				this.emit('onSelect', {
					smiley: text.trim()
				});
			};
			const onlyEmoji = this.#onlyEmoji;
			main_core.Runtime.loadExtension('ui.vue3', 'ui.vue3.components.smiles').then(exports => {
				if (this.#destroyed) {
					return;
				}
				const {
					BitrixVue,
					Smiles
				} = exports;
				const app = BitrixVue.createApp({
					data() {
						return {
							onlyEmoji
						};
					},
					methods: {
						handleSelect(text) {
							emitSelect(text);
						}
					},
					components: {
						Smiles
					},
					template: '<Smiles :isOnlyEmoji="onlyEmoji" @selectSmile="handleSelect($event.text)"/>'
				});
				this.#app = app;
				app.mount(this.getPopup().getContentContainer());
			}).catch(() => {
				this.hide();
			});
		}
	}

	class SmileyNode extends ui_lexical_core.DecoratorNode {
		__src;
		__typing;
		__width = null;
		__height = null;
		constructor(src = '', typing = '', width, height, key) {
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
		$config() {
			return this.config('smiley', {
				extends: ui_lexical_core.DecoratorNode
			});
		}
		afterCloneFrom(prevNode) {
			super.afterCloneFrom(prevNode);
			this.__src = prevNode.__src;
			this.__typing = prevNode.__typing;
			this.__width = prevNode.__width;
			this.__height = prevNode.__height;
		}
		updateFromJSON(serializedNode) {
			const writable = super.updateFromJSON(serializedNode).getWritable();
			writable.__src = serializedNode.src;
			writable.__typing = serializedNode.typing;
			writable.__width = main_core.Type.isNumber(serializedNode.width) ? serializedNode.width : null;
			writable.__height = main_core.Type.isNumber(serializedNode.height) ? serializedNode.height : null;
			return writable;
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
		exportDOM() {
			const span = document.createElement('span');
			span.textContent = this.getTyping();
			return {
				element: span
			};
		}
		exportJSON() {
			return {
				...super.exportJSON(),
				src: this.getSrc(),
				typing: this.getTyping(),
				width: this.getWidth(),
				height: this.getHeight()
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
		return ui_lexical_core.$applyNodeReplacement(node);
	}

	const INSERT_SMILEY_COMMAND = ui_lexical_core.createCommand('INSERT_SMILEY_COMMAND');
	const INSERT_SMILEY_DIALOG_COMMAND = ui_lexical_core.createCommand('INSERT_SMILEY_DIALOG_COMMAND');
	class SmileyPlugin extends BasePlugin {
		#smileyParser = null;
		#smileyDialog = null;
		constructor(editor) {
			super(editor);
			if (ui_smiley.SmileyManager.getSize() > 0) {
				this.#smileyParser = new ui_smiley.SmileyParser(ui_smiley.SmileyManager.getAll());
				this.#registerTypingTransform();
			}
			this.#registerListeners();
			this.#registerInsertSmileyCommand();
			this.#registerComponents();
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
		#registerTypingTransform() {
			const handledTextNodes = new Set();
			this.cleanUpRegister(this.getEditor().registerNodeTransform(ui_lexical_core.TextNode, node => {
				if (!node.isSimpleText() || handledTextNodes.has(node.getKey())) {
					return;
				}
				if ($isInsideUnformatted(node)) {
					return;
				}
				const splits = this.#smileyParser.parse(node.getTextContent());
				if (splits.length > 0) {
					const splitOffsets = splits.reduce((acc, smiley) => {
						acc.push(smiley.start, smiley.end);
						return acc;
					}, []);
					const textNodes = node.splitText(...splitOffsets);
					for (const textNode of textNodes) {
						const smiley = ui_smiley.SmileyManager.get(textNode.getTextContent()) || null;
						if (smiley) {
							const smileyNode = $createSmileyNode(smiley.getImage(), smiley.getTyping(), smiley.getWidth(), smiley.getHeight());
							textNode.replace(smileyNode);
						} else {
							handledTextNodes.add(textNode.getKey());
						}
					}
				}
			}), this.getEditor().registerUpdateListener(() => {
				handledTextNodes.clear();
			}));
		}
		#registerListeners() {
			this.cleanUpRegister(
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
		#insertFromDialog(selected) {
			if (ui_smiley.SmileyManager.get(selected) !== null) {
				this.getEditor().dispatchCommand(INSERT_SMILEY_COMMAND, selected);
				return;
			}
			this.getEditor().update(() => {
				const selection = ui_lexical_core.$getSelection();
				if (ui_lexical_core.$isRangeSelection(selection)) {
					selection.insertText(selected);
				}
			});
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
					onlyEmoji: ui_smiley.SmileyManager.getSize() === 0,
					events: {
						onSelect: event => {
							this.#insertFromDialog(event.getData().smiley);
							this.#smileyDialog.hide();
						},
						onClose: () => {
							returnFocusToEditor(this.getEditor());
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
				button.setHasPopup('dialog');
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

	var Smiley = Object.freeze({
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
		destroy() {
			this.#figureResizer.destroy();
			super.destroy();
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
										const video = event.target;
										const [width, height] = calcImageSize(video.videoWidth, video.videoHeight, 600, 600);
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

	function resolveVideoProvider(src) {
		const url = /^https?:/.test(src) ? src : `https://${src.replace(/^\/\//, '')}`;
		const uri = new main_core.Uri(url);
		const videoService = ui_videoService.VideoService.createByHost(uri.getHost());
		return videoService ? videoService.getId() : null;
	}
	class VideoNode extends ui_lexical_core.DecoratorNode {
		__src;
		__width = 560;
		__height = 315;
		__provider = null;
		constructor(src = '', width, height, key) {
			super(key);
			this.__src = src;
			if (main_core.Type.isNumber(width)) {
				this.__width = Math.round(width);
			}
			if (main_core.Type.isNumber(height)) {
				this.__height = Math.round(height);
			}
			this.__provider = resolveVideoProvider(src);
		}
		static useDecoratorComponent = true;
		$config() {
			return this.config('video', {
				extends: ui_lexical_core.DecoratorNode
			});
		}
		afterCloneFrom(prevNode) {
			super.afterCloneFrom(prevNode);
			this.__src = prevNode.__src;
			this.__width = prevNode.__width;
			this.__height = prevNode.__height;
			this.__provider = prevNode.__provider;
		}
		updateFromJSON(serializedNode) {
			const node = super.updateFromJSON(serializedNode).setSrc(serializedNode.src);
			if (main_core.Type.isNumber(serializedNode.width)) {
				node.setWidthAndHeight(serializedNode.width, node.getHeight());
			}
			if (main_core.Type.isNumber(serializedNode.height)) {
				node.setWidthAndHeight(node.getWidth(), serializedNode.height);
			}
			return node;
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
				...super.exportJSON(),
				src: this.getSrc(),
				width: this.getWidth(),
				height: this.getHeight()
			};
		}
		setSrc(src) {
			const writable = this.getWritable();
			writable.__src = src;
			writable.__provider = resolveVideoProvider(src);
			return writable;
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
					config: config
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

	function validateVideoUrl(url) {
		return /^(http:|https:|\/)/i.test(url);
	}

	const BUTTON_CLASS$1 = 'ui-text-editor-video-dialog-button';
	class VideoDialog extends BaseDialog {
		#videoUrl = '';
		#textBoxId = `ui-text-editor-video-url-${main_core.Text.getRandom(8)}`;
		#statusId = `ui-text-editor-video-status-${main_core.Text.getRandom(8)}`;
		constructor(options) {
			super('BX.UI.TextEditor.VideoDialog', options);
			this.subscribe('onAfterShow', () => {
				this.getUrlTextBox().focus();
			});
		}
		setVideoUrl(url) {
			if (main_core.Type.isString(url)) {
				this.#videoUrl = sanitizeUrl(url);
			}
		}
		getVideoUrl() {
			return this.#videoUrl;
		}
		getPopupOptions() {
			return {
				cacheable: false,
				ariaLabel: getAriaMessage('TEXT_EDITOR_DIALOG_VIDEO_ARIA') ?? undefined,
				content: this.getContainer()
			};
		}
		getContainer() {
			return this.getRefs().remember('container', () => {
				return main_core.Tag.render`
				<div class="ui-text-editor-video-dialog">
					<div class="ui-text-editor-video-dialog-form">
						<div class="ui-ctl ui-ctl-textbox ui-ctl-s ui-ctl-inline ui-ctl-w100 ui-text-editor-video-dialog-textbox">
							<label class="ui-ctl-tag" for="${this.#textBoxId}">
								${main_core.Loc.getMessage('TEXT_EDITOR_VIDEO_INSERT_TITLE')}
							</label>
							${this.getUrlTextBox()}
						</div>
						${renderDialogButton({
				className: BUTTON_CLASS$1,
				icon: ui_iconSet_api_core.Outline.CHECK_L,
				ariaLabel: getAriaMessage('TEXT_EDITOR_BTN_SAVE_ARIA'),
				testId: 'video-dialog-save-btn',
				onClick: this.#handleSaveBtnClick.bind(this)
			})}
						${renderDialogButton({
				className: BUTTON_CLASS$1,
				icon: ui_iconSet_api_core.Outline.CROSS_L,
				ariaLabel: getAriaMessage('TEXT_EDITOR_BTN_CANCEL_ARIA'),
				testId: 'video-dialog-cancel-btn',
				onClick: this.#handleCancelBtnClick.bind(this)
			})}
					</div>
					${this.getStatusContainer()}
				</div>
			`;
			});
		}
		getUrlTextBox() {
			return this.getRefs().remember('url-textbox', () => {
				return main_core.Tag.render`
				<input
					type="text"
					id="${this.#textBoxId}"
					class="ui-ctl-element"
					placeholder="https://"
					value="${this.getVideoUrl()}"
					aria-describedby="${this.#statusId}"
					onkeydown="${this.#handleTextBoxKeyDown.bind(this)}"
					oninput="${this.#handleTextBoxInput.bind(this)}"
					data-testid="video-dialog-textbox"
				>
			`;
			});
		}
		getStatusContainer() {
			return this.getRefs().remember('status', () => {
				return main_core.Tag.render`
				<div
					class="ui-text-editor-video-dialog-status"
					id="${this.#statusId}"
					role="status"
				>${main_core.Loc.getMessage('TEXT_EDITOR_VIDEO_INSERT_HINT')}</div>
			`;
			});
		}
		showError(error) {
			main_core.Dom.addClass(this.getStatusContainer(), '--error');
			main_core.Dom.addClass(this.getUrlTextBox().parentNode, 'ui-ctl-warning');
			main_core.Dom.attr(this.getUrlTextBox(), 'aria-invalid', 'true');
			if (main_core.Type.isStringFilled(error)) {
				this.getStatusContainer().textContent = error;
			}
		}
		clearError() {
			main_core.Dom.removeClass(this.getStatusContainer(), '--error');
			main_core.Dom.removeClass(this.getUrlTextBox().parentNode, 'ui-ctl-warning');
			main_core.Dom.attr(this.getUrlTextBox(), 'aria-invalid', null);
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

	const INSERT_VIDEO_COMMAND = ui_lexical_core.createCommand('INSERT_VIDEO_COMMAND');
	const INSERT_VIDEO_DIALOG_COMMAND = ui_lexical_core.createCommand('INSERT_VIDEO_DIALOG_COMMAND');
	class VideoPlugin extends DialogPlugin {
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
						node: createBBCodeElement(scheme, {
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
		#showVideoDialog() {
			this.getDialog()?.destroy();
			this.getEditor().dispatchCommand(HIDE_DIALOG_COMMAND, {
				sender: 'video-dialog'
			});
			this.setDialog(new VideoDialog({
				targetContainer: document.body,
				events: {
					onSave: () => {
						const url = this.getDialog().getVideoUrl();
						if (!main_core.Type.isStringFilled(url)) {
							this.getDialog().hide();
							return;
						}
						if (!validateVideoUrl(url)) {
							this.getDialog().showError(main_core.Loc.getMessage('TEXT_EDITOR_INVALID_URL'));
							return;
						}
						this.getEditor().dispatchCommand(INSERT_VIDEO_COMMAND, {
							src: url
						});
						this.getDialog().hide();
					},
					onInput: () => {
						this.getDialog().clearError();
					},
					onCancel: () => {
						this.getDialog().hide();
					},
					onShow: () => {
						this.attachDialogToSelection();
					},
					onClose: () => {
						this.handleDialogDestroy();
					},
					onDestroy: () => {
						this.handleDialogDestroy();
					}
				}
			}));
			this.getDialog().show();
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
				this.rememberSelection(selection);
				this.#showVideoDialog();
				return true;
			}, ui_lexical_core.COMMAND_PRIORITY_LOW), this.registerDialogCommands('video-dialog'));
		}
		#registerComponents() {
			this.getEditor().getComponentRegistry().register('video', () => {
				const button = new Button();
				button.setIcon(ui_iconSet_api_core.Outline.RECORD_VIDEO);
				button.disableInsideUnformatted();
				button.setHasPopup('dialog');
				button.setTooltip(main_core.Loc.getMessage('TEXT_EDITOR_BTN_VIDEO'));
				button.subscribe('onClick', () => {
					if (this.isDialogShown()) {
						return;
					}
					this.getEditor().focus(() => {
						this.getEditor().dispatchCommand(INSERT_VIDEO_DIALOG_COMMAND);
					});
				});
				return button;
			});
		}
	}

	var Video = Object.freeze({
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
			return `{ ${codeTokenNode.getHighlightType()}: "${normalize(codeTokenNode.getTextContent())}" }`;
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
		return Object.entries(NON_SINGLE_WIDTH_CHARS_REPLACEMENT).reduce((acc, [key, value]) => acc.replaceAll(new RegExp(key, 'g'), String(value)), text);
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
		const nodeKeys = selection.getNodes().map(node => node.getKey());
		return `: node\n  └ [${nodeKeys.join(', ')}]`;
	}

	function printRangeSelection(selection) {
		let res = '';
		const formatText = printFormatProperties(selection);
		const formatPart = formatText === '' ? '' : `{ ${formatText} }`;
		const stylePart = selection.style === '' ? '' : `{ style: ${selection.style} } `;
		res += `: range ${formatPart} ${stylePart}`;
		const anchor = selection.anchor;
		const focus = selection.focus;
		const anchorOffset = anchor.offset;
		const focusOffset = focus.offset;
		res += `\n  ├ anchor { key: ${anchor.key}, offset: ${anchorOffset === null ? 'null' : anchorOffset}, type: ${anchor.type} }`;
		res += `\n  └ focus { key: ${focus.key}, offset: ${focusOffset === null ? 'null' : focusOffset}, type: ${focus.type} }`;
		return res;
	}

	function printTableSelection(selection) {
		return `: table\n  └ { table: ${selection.tableKey}, ` + `anchorCell: ${selection.anchor.key}, focusCell: ${selection.focus.key} }`;
	}

	function visitTree(currentNode, visitor, indent = []) {
		const childNodes = currentNode.getChildren();
		const childNodesLength = childNodes.length;
		childNodes.forEach((childNode, i) => {
			const isLastChild = i === childNodesLength - 1;
			visitor(childNode, [...indent, isLastChild ? SYMBOLS.isLastChild : SYMBOLS.hasNextSibling]);
			if (ui_lexical_core.$isElementNode(childNode)) {
				visitTree(childNode, visitor, [...indent, isLastChild ? SYMBOLS.ancestorIsLastChild : SYMBOLS.ancestorHasNextSibling]);
			}
		});
	}

	function generateContent(editor) {
		const editorState = editor.getEditorState();
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
		if (!ui_lexical_core.$isTextNode(node) || !ui_lexical_core.$isRangeSelection(selection) || !isSelected || ui_lexical_core.$isElementNode(node)) {
			return '';
		}
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
		const paddingLength = typeDisplay.length + 3;
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
				[start, end] = [0, textLength];
			}
		}
		const numNonSingleWidthCharBeforeSelection = (textContent.slice(0, start).match(NON_SINGLE_WIDTH_CHARS_REGEX) || []).length;
		const numNonSingleWidthCharInSelection = (textContent.slice(start, end).match(NON_SINGLE_WIDTH_CHARS_REGEX) || []).length;
		return [start + numNonSingleWidthCharBeforeSelection, end + numNonSingleWidthCharBeforeSelection + numNonSingleWidthCharInSelection];
	}

	function validateUrl(url, allowDomainRelativeUrl = true) {
		if (allowDomainRelativeUrl) {
			return /^(http:|https:|mailto:|tel:|sms:|\/)/i.test(url);
		}
		return /^(http:|https:|mailto:|tel:|sms:)/i.test(url);
	}
	const URL_REGEX = /^((https?:\/\/(www\.)?)|(www\.))[\w#%+.:=@~-]{1,256}\.[\d()A-Za-z]{1,6}\b([\w#%&()+./:=?@[\]~-]*)(?<![%()+.:\]-])$/;

	function isApplePlatform() {
		return main_core.Browser.isMac() || main_core.Browser.isIPad() || main_core.Browser.isIPhone();
	}
	function getKeystrokeCaption(keystroke) {
		return isApplePlatform() ? keystroke.mac : keystroke.other;
	}
	function hasCommandModifier(event) {
		return event.ctrlKey || event.metaKey;
	}

	class CustomLinkNode extends ui_lexical_link.LinkNode {
		$config() {
			return this.config('custom-link', {
				extends: ui_lexical_link.LinkNode
			});
		}
		getToolbarBlockType() {
			return 'link';
		}
		createDOM(config) {
			const element = super.createDOM(config);
			element.setAttribute(SLIDER_IGNORE_AUTOBINDING_ATTRIBUTE, 'true');
			return element;
		}
	}
	function $createCustomLinkNode(url = '', attributes = {}) {
		return ui_lexical_core.$applyNodeReplacement(new CustomLinkNode(url, attributes));
	}

	const BUTTON_CLASS = 'ui-text-editor-link-form-button';
	class LinkEditor extends BaseDialog {
		#editMode = null;
		#autoLinkMode = null;
		#linkUrl = '';
		#textBoxId = `ui-text-editor-link-url-${main_core.Text.getRandom(8)}`;
		constructor(options) {
			super('BX.UI.TextEditor.LinkEditor', options);
			const linkEditorOptions = main_core.Type.isPlainObject(options) ? options : {};
			this.setLinkUrl(linkEditorOptions.linkUrl);
			if (main_core.Type.isBoolean(linkEditorOptions.editMode)) {
				this.setEditMode(linkEditorOptions.editMode);
			} else {
				this.setEditMode(this.#linkUrl === '');
			}
			this.setAutoLinkMode(options.autoLinkMode);
			this.subscribe('onAfterShow', () => {
				if (this.#editMode) {
					this.getLinkTextBox().focus();
				}
			});
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
			this.adjustPosition();
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
			this.adjustPosition();
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
		getPopupOptions() {
			return {
				cacheable: false,
				ariaLabel: getAriaMessage('TEXT_EDITOR_DIALOG_LINK_ARIA') ?? undefined,
				content: this.getContainer()
			};
		}
		getContainer() {
			return this.getRefs().remember('container', () => {
				return main_core.Tag.render`
				<div class="ui-text-editor-link-editor" data-testid="link-editor">
					<div class="ui-text-editor-link-form">
						<div class="ui-ctl ui-ctl-textbox ui-ctl-s ui-ctl-inline ui-ctl-w100 ui-text-editor-link-textbox">
							<label class="ui-ctl-tag" for="${this.#textBoxId}">
								${main_core.Loc.getMessage('TEXT_EDITOR_LINK_URL')}
							</label>
							${this.getLinkTextBox()}
						</div>
						${renderDialogButton({
				className: BUTTON_CLASS,
				icon: ui_iconSet_api_core.Outline.CHECK_L,
				ariaLabel: getAriaMessage('TEXT_EDITOR_BTN_SAVE_ARIA'),
				testId: 'save-link-btn',
				onClick: this.#handleSaveBtnClick.bind(this)
			})}
						${renderDialogButton({
				className: BUTTON_CLASS,
				icon: ui_iconSet_api_core.Outline.CROSS_L,
				ariaLabel: getAriaMessage('TEXT_EDITOR_BTN_CANCEL_ARIA'),
				testId: 'cancel-link-btn',
				onClick: this.#handleCancelBtnClick.bind(this)
			})}
					</div>
					<div class="ui-text-editor-link-preview">
						${this.getLinkLabel()}
						${renderDialogButton({
				className: BUTTON_CLASS,
				icon: ui_iconSet_api_core.Outline.EDIT_L,
				ariaLabel: getAriaMessage('TEXT_EDITOR_BTN_EDIT_LINK_ARIA'),
				testId: 'edit-link-btn',
				onClick: this.#handleEditBtnClick.bind(this)
			})}
						${renderDialogButton({
				className: `${BUTTON_CLASS} ui-text-editor-link-form-delete-btn`,
				icon: ui_iconSet_api_core.Outline.UNLINK,
				ariaLabel: getAriaMessage('TEXT_EDITOR_BTN_UNLINK_ARIA'),
				testId: 'unlink-btn',
				onClick: this.#handleUnlinkBtnClick.bind(this)
			})}
					</div>
				</div>
			`;
			});
		}
		getLinkTextBox() {
			return this.getRefs().remember('link-textbox', () => {
				return main_core.Tag.render`
				<input
					type="text"
					id="${this.#textBoxId}"
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
			return this.getRefs().remember('link-label', () => {
				return main_core.Tag.render`
				<a href="" target="_blank" class="ui-text-editor-link-label" data-testid="link-label"></a>
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

	const INSERT_LINK_DIALOG_COMMAND = ui_lexical_core.createCommand('INSERT_LINK_DIALOG_COMMAND');
	class LinkPlugin extends DialogPlugin {
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
				withKlass: CustomLinkNode
			}];
		}
		importBBCode() {
			return {
				url: () => ({
					conversion: node => {
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
				'custom-link': lexicalNode => {
					return exportLinkNode(lexicalNode, this.getEditor());
				}
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
			this.cleanUpRegister(this.#registerToggleLinkCommand(), this.#registerInsertLinkCommand(), this.#registerKeyDownCommand(), this.#registerPasteCommand());
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
		#handleInsertLinkDialog(payload) {
			const selection = ui_lexical_core.$getSelection();
			if (!ui_lexical_core.$isRangeSelection(selection) || !this.getEditor().isEditable()) {
				return false;
			}
			this.rememberSelection(selection);
			this.getDialog()?.destroy();
			let lineNode = null;
			let linkUrl = null;
			if (ui_lexical_link.$isLinkNode(payload)) {
				lineNode = payload;
				linkUrl = lineNode.getURL();
			} else {
				if ($isInsideUnformatted(selection.anchor.getNode())) {
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
			this.setDialog(this.#createLinkEditor(lineNode, linkUrl));
			this.getDialog().show();
			return true;
		}
		#createLinkEditor(lineNode, linkUrl) {
			return new LinkEditor({
				linkUrl: linkUrl,
				autoLinkMode: ui_lexical_link.$isAutoLinkNode(lineNode),
				targetContainer: document.body,
				events: {
					onSave: event => {
						this.#handleLinkEditorSave(event, lineNode);
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
									lineNode.insertBefore(child);
								}
								lineNode.remove();
							});
						}
						const linkEditor = event.getTarget();
						linkEditor.hide();
					},
					onShow: () => {
						this.attachDialogToSelection();
					},
					onClose: () => {
						this.handleDialogDestroy();
					},
					onDestroy: () => {
						this.handleDialogDestroy();
					}
				}
			});
		}
		#handleLinkEditorSave(event, lineNode) {
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
					this.restoreSelection();
					this.getEditor().dispatchCommand(ui_lexical_link.TOGGLE_LINK_COMMAND, {
						url,
						originalUrl,
						rel: null
					});
					linkEditor.setEditMode(false);
					const currentSelection = ui_lexical_core.$getSelection();
					if (ui_lexical_core.$isRangeSelection(currentSelection)) {
						this.rememberSelection(currentSelection);
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
		}
		#registerInsertLinkCommand() {
			return ui_lexical_utils.mergeRegister(this.getEditor().registerCommand(INSERT_LINK_DIALOG_COMMAND, this.#handleInsertLinkDialog.bind(this), ui_lexical_core.COMMAND_PRIORITY_LOW), this.registerDialogCommands('link-dialog'));
		}
		#registerKeyDownCommand() {
			return this.getEditor().registerCommand(ui_lexical_core.KEY_DOWN_COMMAND, event => {
				if (!hasCommandModifier(event)) {
					return false;
				}
				if (!isApplePlatform() && ui_lexical_core.isExactShortcutMatch(event, 'k', {
					ctrlKey: true
				}) || ui_lexical_core.isExactShortcutMatch(event, 'k', {
					metaKey: true
				})) {
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
				if (!ui_lexical_core.$isRangeSelection(selection) || !ui_lexical_utils.objectKlassEquals(event, ClipboardEvent) || event.clipboardData === null) {
					return false;
				}
				const clipboardText = event.clipboardData.getData('text');
				if (!URL_REGEX.test(clipboardText)) {
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
				button.setBlockType('link');
				button.setHasPopup('dialog');
				button.disableInsideUnformatted();
				button.setTooltip(main_core.Loc.getMessage('TEXT_EDITOR_BTN_LINK', {
					'#keystroke#': getKeystrokeCaption({
						mac: '⌘K',
						other: 'Ctrl+K'
					})
				}));
				button.subscribe('onClick', () => {
					if (this.isDialogShown()) {
						return;
					}
					this.getEditor().focus(() => {
						this.getEditor().dispatchCommand(INSERT_LINK_DIALOG_COMMAND);
					});
				});
				return button;
			});
		}
	}
	function exportLinkNode(lexicalNode, editor) {
		const url = lexicalNode.getURL();
		const children = lexicalNode.getChildren();
		const isSimpleText = children.length === 1 && ui_lexical_core.$isTextNode(children[0]) && children[0].getFormat() === 0;
		const scheme = editor.getBBCodeScheme();
		if (isSimpleText && children[0].getTextContent() === url) {
			return {
				node: createBBCodeElement(scheme, {
					name: 'url'
				})
			};
		}
		return {
			node: createBBCodeElement(scheme, {
				name: 'url',
				value: url
			})
		};
	}

	var Link = Object.freeze({
		__proto__: null,
		INSERT_LINK_DIALOG_COMMAND: INSERT_LINK_DIALOG_COMMAND,
		LinkPlugin: LinkPlugin,
		exportLinkNode: exportLinkNode
	});

	class CustomAutoLinkNode extends ui_lexical_link.AutoLinkNode {
		$config() {
			return this.config('custom-autolink', {
				extends: ui_lexical_link.AutoLinkNode
			});
		}
		getToolbarBlockType() {
			return 'link';
		}
		createDOM(config) {
			const element = super.createDOM(config);
			element.setAttribute(SLIDER_IGNORE_AUTOBINDING_ATTRIBUTE, 'true');
			return element;
		}
	}
	function $createCustomAutoLinkNode(url = '', attributes = {}) {
		return ui_lexical_core.$applyNodeReplacement(new CustomAutoLinkNode(url, attributes));
	}

	const MATCHERS = [ui_lexical_link.autoLinkUrlMatcher, ui_lexical_link.autoLinkEmailMatcher].map(matcher => openingInNewTab(matcher));
	const SEPARATOR = /[\s(),.;[\]]/;
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
				withKlass: CustomAutoLinkNode
			}];
		}
		exportBBCode() {
			return {
				autolink: lexicalNode => {
					return exportLinkNode(lexicalNode, this.getEditor());
				},
				'custom-autolink': lexicalNode => {
					return exportLinkNode(lexicalNode, this.getEditor());
				}
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
			this.cleanUpRegister(ui_lexical_link.registerAutoLink(this.getEditor().getLexicalEditor(), {
				matchers: MATCHERS,
				changeHandlers: [],
				excludeParents: [$isInsideUnformatted],
				separatorRegex: SEPARATOR
			}));
		}
	}
	function openingInNewTab(matcher) {
		return text => {
			const match = matcher(text);
			if (match === null) {
				return null;
			}
			const attributes = {
				...match.attributes
			};
			if (!main_core.Type.isStringFilled(attributes.target)) {
				attributes.target = '_blank';
			}
			return {
				...match,
				attributes
			};
		};
	}

	var AutoLink = Object.freeze({
		__proto__: null,
		AutoLinkPlugin: AutoLinkPlugin
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
		#bodyDragDropHandler = this.#handleBodyDrop.bind(this);
		#bodyDragOverHandler = this.#handleBodyDragOver.bind(this);
		constructor(editor) {
			super(editor);
			this.cleanUpRegister(this.#registerEvents(), this.#registerListeners(), () => {
				this.#unbindBodyDragHandlers();
			});
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
			const signal = this.getAbortSignal();
			main_core.Event.bind(scroller, 'mousemove', onMouseMove, {
				signal
			});
			main_core.Event.bind(scroller, 'mouseleave', onMouseLeave, {
				signal
			});
			return () => {
				main_core.Event.unbind(scroller, 'mousemove', onMouseMove);
				main_core.Event.unbind(scroller, 'mouseleave', onMouseLeave);
			};
		}
		#registerListeners() {
			return ui_lexical_utils.mergeRegister(this.getEditor().registerCommand(ui_lexical_core.DRAGOVER_COMMAND, this.#handleDragOver.bind(this), ui_lexical_core.COMMAND_PRIORITY_LOW), this.getEditor().registerCommand(ui_lexical_core.DROP_COMMAND, this.#handleDragDrop.bind(this), ui_lexical_core.COMMAND_PRIORITY_HIGH),
			this.getEditor().registerUpdateListener(({
				dirtyElements,
				dirtyLeaves
			}) => {
				if (dirtyElements.size === 0 && dirtyLeaves.size === 0) {
					return;
				}
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
			this.#bindBodyDragHandlers();
		}
		#handleDragEnd(event) {
			this.#isDragging = false;
			this.#hideDropLine();
			this.#unbindBodyDragHandlers();
		}
		#handleBodyDrop(event) {
			this.getEditor().dispatchCommand(ui_lexical_core.DROP_COMMAND, event);
		}
		#handleBodyDragOver(event) {
			event.preventDefault();
		}
		#bindBodyDragHandlers() {
			const signal = this.getAbortSignal();
			main_core.Event.bind(document.body, 'drop', this.#bodyDragDropHandler, {
				signal
			});
			main_core.Event.bind(document.body, 'dragover', this.#bodyDragOverHandler, {
				signal
			});
		}
		#unbindBodyDragHandlers() {
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
			this.#unbindBodyDragHandlers();
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

	var BlockToolbar = Object.freeze({
		__proto__: null,
		BlockToolbarPlugin: BlockToolbarPlugin
	});

	class TextFormatPlugin extends BasePlugin {
		constructor(editor) {
			super(editor);
			this.#registerComponents();
			this.#registerShortcut();
		}
		static getFormatConfig() {
			throw new Error('getFormatConfig must be implemented in a child class');
		}
		static getName() {
			return this.getFormatConfig().name;
		}
		getFormatConfig() {
			return this.constructor.getFormatConfig();
		}
		importBBCode() {
			const conversion = () => ({
				conversion: convertTextFormatElement,
				priority: 0
			});
			return Object.fromEntries(this.getFormatConfig().importTags.map(tag => [tag, conversion]));
		}
		exportBBCode() {
			const {
				format,
				exportTag
			} = this.getFormatConfig();
			return {
				[`text:${format}`]: (lexicalNode, node) => {
					if (lexicalNode.hasFormat(format)) {
						return wrapNodeWith(node, exportTag, this.getEditor());
					}
					return null;
				}
			};
		}
		#registerComponents() {
			const {
				format,
				icon,
				tooltipMessage,
				keystroke
			} = this.getFormatConfig();
			this.getEditor().getComponentRegistry().register(format, () => {
				const button = new Button();
				button.setIcon(icon);
				button.setFormat(format);
				button.disableInsideUnformatted();
				button.setTooltip(main_core.Loc.getMessage(tooltipMessage, {
					'#keystroke#': getKeystrokeCaption(keystroke)
				}));
				button.subscribe('onClick', () => {
					this.getEditor().focus();
					this.getEditor().update(() => {
						this.getEditor().dispatchCommand(ui_lexical_core.FORMAT_TEXT_COMMAND, format);
					});
				});
				return button;
			});
		}
		#registerShortcut() {
			const {
				format,
				shortcut
			} = this.getFormatConfig();
			if (shortcut === undefined) {
				return;
			}
			this.cleanUpRegister(this.getEditor().registerCommand(ui_lexical_core.KEY_DOWN_COMMAND, event => {
				if (!hasCommandModifier(event)) {
					return false;
				}
				if (ui_lexical_core.isExactShortcutMatch(event, shortcut.key, {
					ctrlKey: true,
					shiftKey: shortcut.shiftKey
				}) || ui_lexical_core.isExactShortcutMatch(event, shortcut.key, {
					metaKey: true,
					shiftKey: shortcut.shiftKey
				})) {
					event.preventDefault();
					this.getEditor().dispatchCommand(ui_lexical_core.FORMAT_TEXT_COMMAND, format);
					return true;
				}
				return false;
			}, ui_lexical_core.COMMAND_PRIORITY_NORMAL));
		}
	}

	class BoldPlugin extends TextFormatPlugin {
		static getFormatConfig() {
			return {
				name: 'Bold',
				format: 'bold',
				icon: ui_iconSet_api_core.Outline.BOLD,
				tooltipMessage: 'TEXT_EDITOR_BTN_BOLD',
				keystroke: {
					mac: '⌘B',
					other: 'Ctrl+B'
				},
				importTags: ['b', 'color', 'background', 'size'],
				exportTag: 'b'
			};
		}
	}

	var Bold = Object.freeze({
		__proto__: null,
		BoldPlugin: BoldPlugin
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

	function normalizeName(name) {
		return String(name).toLowerCase();
	}
	class ComponentRegistry {
		#components = new Map();
		register(name, factory) {
			this.#components.set(normalizeName(name), factory);
		}
		create(name) {
			const factory = this.#components.get(normalizeName(name));
			return factory === undefined ? null : factory();
		}
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
				if (topBlock.getIndent() !== 0) {
					return false;
				}
				const topBlockChildren = topBlock.getChildren();
				const topBlockChildrenLength = topBlockChildren.length;
				for (let s = 0; s < topBlockChildrenLength; s++) {
					const child = topBlockChildren[s];
					if (!ui_lexical_core.$isTextNode(child)) {
						return false;
					}
				}
			}
		}
		return true;
	}

	function mergeOptions(base, overrides) {
		const result = {
			...base
		};
		for (const [key, overrideValue] of Object.entries(overrides ?? {})) {
			if (overrideValue === undefined) {
				continue;
			}
			const baseValue = result[key];
			if (main_core.Type.isPlainObject(baseValue) && main_core.Type.isPlainObject(overrideValue)) {
				result[key] = {
					...baseValue,
					...overrideValue
				};
			} else {
				result[key] = overrideValue;
			}
		}
		return result;
	}

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
					if (ui_lexical_core.$isTextNode(node)) {
						let textNode = node;
						if (idx === 0 && anchor.offset !== 0) {
							textNode = textNode.splitText(anchor.offset)[1] || textNode;
						}
						if (idx === nodes.length - 1) {
							textNode = textNode.splitText(focus.offset)[0] || textNode;
						}
						const extractedTextNode = extractedNodes[0];
						if (nodes.length === 1 && ui_lexical_core.$isTextNode(extractedTextNode)) {
							textNode = extractedTextNode;
						}
						if (textNode.getStyle() !== '') {
							textNode.setStyle('');
						}
						if (textNode.getFormat() !== 0) {
							textNode.setFormat(0);
							ui_lexical_utils.$getNearestBlockElementAncestorOrThrow(textNode).setFormat('');
						}
					}
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

	class ClipboardPlainTableNode extends ui_lexical_core.ElementNode {
		$config() {
			return this.config('plain-table-node', {
				extends: ui_lexical_core.ElementNode
			});
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

	let Toolbar$1 = class Toolbar {
		#textEditor = null;
		#testId = '';
		#items = [];
		#rendered = false;
		#moreBtn = null;
		#refs = new main_core_cache.MemoryCache();
		#resizeObserver = null;
		#focusZone = null;
		#focusZoneRefreshed = false;
		#destroyed = false;
		#resetItemsAnimation = null;
		constructor(textEditor, options, testId) {
			this.#textEditor = textEditor;
			this.#testId = testId;
			const toolbarOptions = main_core.Type.isArray(options) ? options : [];
			this.#fillFromOptions(toolbarOptions);
			if (this.#items.length > 0) {
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
				this.#focusZone = new ui_a11y.FocusZone(this.getContainer(), {
					bindKeys: ui_a11y.FocusKeys.ArrowHorizontal | ui_a11y.FocusKeys.HomeAndEnd,
					focusOutBehavior: 'wrap'
				});
				this.#focusZone.activate();
				this.#rendered = true;
			}
		}
		isEmpty() {
			return this.#items.length === 0;
		}
		getContainer() {
			return this.#refs.remember('container', () => {
				const container = main_core.Tag.render`
				<div
					class="ui-text-editor-toolbar-container"
					role="toolbar"
					data-testid="${this.#testId}"
				>
					${this.getItemsContainer()}
					${this.getMoreBtnContainer()}
				</div>
			`;
				main_core.Dom.attr(container, 'aria-label', getAriaMessage('TEXT_EDITOR_TOOLBAR_ARIA'));
				return container;
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
				const resetAnimation = event => {
					if (this.#destroyed || event.target !== this.getItemsContainer()) {
						return;
					}
					this.#unbindItemsAnimation();
					main_core.Dom.style(this.getItemsContainer(), 'height', null);
					main_core.Dom.removeClass(this.getItemsContainer(), '--animating');
					this.#syncClippedItems();
				};
				this.#resetItemsAnimation = resetAnimation;
				this.#moreBtn = new Button();
				this.#moreBtn.setContent('<span class="ui-text-editor-toolbar-more-btn-icon"></span>');
				this.#moreBtn.setTooltip(getAriaMessage('TEXT_EDITOR_TOOLBAR_MORE'));
				this.#moreBtn.setExpanded(false);
				this.#moreBtn.subscribe('onClick', () => {
					this.#unbindItemsAnimation();
					const willExpand = !main_core.Dom.hasClass(this.getContainer(), '--expanded');
					this.getMoreBtn().setExpanded(willExpand);
					if (main_core.Dom.hasClass(this.getContainer(), '--expanded')) {
						main_core.Dom.style(this.getItemsContainer(), {
							height: `${this.getItemsContainer().scrollHeight}px`
						});
						requestAnimationFrame(() => {
							if (this.#destroyed) {
								return;
							}
							main_core.Dom.removeClass(this.getContainer(), '--expanded');
							main_core.Dom.addClass(this.getItemsContainer(), '--animating');
							main_core.Dom.style(this.getItemsContainer(), 'height', null);
						});
					} else {
						main_core.Dom.addClass(this.getItemsContainer(), '--animating');
						main_core.Dom.style(this.getItemsContainer(), {
							height: `${this.getItemsContainer().scrollHeight}px`
						});
						main_core.Dom.addClass(this.getContainer(), '--expanded');
						this.#syncClippedItems();
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
		#unbindItemsAnimation() {
			if (this.#resetItemsAnimation !== null && this.isRendered()) {
				main_core.Event.unbind(this.getItemsContainer(), 'transitionend', this.#resetItemsAnimation);
			}
		}
		destroy() {
			this.#unbindItemsAnimation();
			this.#resetItemsAnimation = null;
			this.#destroyed = true;
			if (this.#resizeObserver !== null) {
				this.#resizeObserver.disconnect();
				this.#resizeObserver = null;
			}
			if (this.#focusZone !== null) {
				this.#focusZone.deactivate();
				this.#focusZone = null;
			}
			if (this.isRendered()) {
				main_core.Dom.remove(this.getContainer());
			}
			this.#items.forEach(item => {
				item.destroy();
			});
			if (this.#moreBtn !== null) {
				this.#moreBtn.destroy();
			}
			this.#items = null;
			this.#refs = null;
		}
		#fillFromOptions(options) {
			options.forEach(item => {
				if (item === '|') {
					this.#items.push(new Separator());
				} else {
					const toolbarItem = this.#textEditor.getComponentRegistry().create(item);
					if (toolbarItem === null) {
						console.warn(`TextEditor Toolbar: "${item}" component doesn't exist.`);
					} else {
						toolbarItem.getContainer().dataset.testid = `${this.#testId}-${item}`;
						this.#items.push(toolbarItem);
						if (toolbarItem instanceof Button) {
							this.#bindReactiveState(toolbarItem);
						}
					}
				}
			});
		}
		#bindReactiveState(item) {
			const state = this.#textEditor.getSelectionState();
			const disabled = this.#resolveDisabledSignal(item, state);
			const format = item.getFormat();
			const blockType = item.getBlockType();
			let active = null;
			if (format !== null) {
				active = state.formatActive(format);
			} else if (blockType !== null) {
				active = state.blockTypeActive(blockType);
			}
			if (active !== null) {
				const source = active;
				item.bindActive(ui_lexical_extension.computed(() => !disabled.value && source.value));
			}
		}
		update() {
			this.#textEditor.getSelectionState().invalidate();
		}
		#resolveDisabledSignal(item, state) {
			if (item.hasReactiveDisabled()) {
				return item.getDisabledSignal();
			}
			if (item.hasOwnDisableCallback()) {
				const disabled = ui_lexical_extension.computed(() => {
					void state.getRevisionSignal().value;
					void this.#textEditor.getEditableSignal().value;
					return this.#textEditor.getEditorState().read(() => item.invokeDisableCallback());
				});
				item.bindDisabled(disabled);
				return disabled;
			}
			const disabled = state.disabled(item.shouldDisableInsideUnformatted());
			item.bindDisabled(disabled);
			return disabled;
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
				this.getMoreBtn().setExpanded(false);
			}
			this.#syncClippedItems();
			if (!this.#focusZoneRefreshed && this.#focusZone !== null) {
				this.#focusZoneRefreshed = true;
				this.#focusZone.refreshElements();
			}
		}
		#syncClippedItems() {
			const itemsContainer = this.getItemsContainer();
			const visibleHeight = itemsContainer.clientHeight;
			const isCollapsed = main_core.Dom.hasClass(this.getContainer(), '--overflowed') && !main_core.Dom.hasClass(this.getContainer(), '--expanded');
			const clipped = this.#items.map(item => {
				return isCollapsed && item.getContainer().offsetTop >= visibleHeight;
			});
			this.#items.forEach((item, index) => {
				const element = item.getContainer();
				if (clipped[index] === element.hasAttribute('inert')) {
					return;
				}
				main_core.Dom.attr(element, 'inert', clipped[index] ? '' : null);
			});
		}
	};

	class FloatingToolbarPlugin extends BasePlugin {
		#popup = null;
		#toolbar = null;
		#showDebounced = null;
		#onEditorScroll = this.#handleEditorScroll.bind(this);
		#positionFrameRequested = false;
		constructor(editor) {
			super(editor);
			this.#showDebounced = main_core.Runtime.debounce(() => {
				if (this.isDestroyed()) {
					return;
				}
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
		static getDefaultOptions() {
			return {
				floatingToolbar: []
			};
		}
		afterInit() {
			const toolbarOptions = this.getEditor().getOption('floatingToolbar', []);
			this.#toolbar = new Toolbar$1(this.getEditor(), toolbarOptions, 'ui-text-editor-floating-toolbar');
			if (!this.#toolbar.isEmpty()) {
				this.cleanUpRegister(this.#registerListeners());
			}
			return () => {
				this.#toolbar.destroy();
				this.#toolbar = null;
			};
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
			if (this.#positionFrameRequested) {
				return;
			}
			this.#positionFrameRequested = true;
			this.registerAnimationFrame(() => {
				this.#positionFrameRequested = false;
				this.getEditor().getEditorState().read(() => {
					this.#adjustDialogPosition();
				});
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
			if ($isInsideUnformatted(selection.anchor.getNode())) {
				return false;
			}
			if (selection.getTextContent().replaceAll('\n', '') === '') {
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
					ariaLabel: getAriaMessage('TEXT_EDITOR_DIALOG_FORMATTING_ARIA') ?? undefined,
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
								main_core.Event.bind(this.getEditor().getScrollerContainer(), 'scroll', this.#onEditorScroll, {
									signal: this.getAbortSignal()
								});
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
		}
	}

	var FloatingToolbar = Object.freeze({
		__proto__: null,
		FloatingToolbarPlugin: FloatingToolbarPlugin
	});

	class HashtagNode extends ui_lexical_core.TextNode {
		$config() {
			return this.config('hashtag', {
				extends: ui_lexical_core.TextNode
			});
		}
		createDOM(config) {
			const element = super.createDOM(config);
			if (main_core.Type.isStringFilled(config?.theme?.hashtag)) {
				main_core.Dom.addClass(element, config.theme.hashtag);
			}
			return element;
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
				hashtag: lexicalNode => {
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

	var Hashtag = Object.freeze({
		__proto__: null,
		$createHashtagNode: $createHashtagNode,
		$isHashtagNode: $isHashtagNode,
		HashtagNode: HashtagNode,
		HashtagPlugin: HashtagPlugin
	});

	const MERGE_DELAY = 1000;
	class HistoryPlugin extends BasePlugin {
		#canUndo = ui_lexical_extension.signal(false);
		#canRedo = ui_lexical_extension.signal(false);
		#undoDisabled = ui_lexical_extension.computed(() => {
			return !this.#canUndo.value || !this.getEditor().getEditableSignal().value;
		});
		#redoDisabled = ui_lexical_extension.computed(() => {
			return !this.#canRedo.value || !this.getEditor().getEditableSignal().value;
		});
		constructor(editor) {
			super(editor);
			const historyState = ui_lexical_history.createEmptyHistoryState();
			this.cleanUpRegister(ui_lexical_history.registerHistory(editor.getLexicalEditor(), historyState, MERGE_DELAY, undefined, state => {
				ui_lexical_extension.batch(() => {
					this.#canUndo.value = state.undoStack.length > 0;
					this.#canRedo.value = state.redoStack.length > 0;
				});
			}));
			this.#registerComponents();
		}
		static getName() {
			return 'History';
		}
		#registerComponents() {
			this.getEditor().getComponentRegistry().register('undo', () => {
				return this.#createButton({
					icon: ui_iconSet_api_core.Outline.UNDO,
					tooltip: main_core.Loc.getMessage('TEXT_EDITOR_BTN_UNDO', {
						'#keystroke#': getKeystrokeCaption({
							mac: '⌘Z',
							other: 'Ctrl+Z'
						})
					}),
					disabled: this.#undoDisabled,
					command: ui_lexical_core.UNDO_COMMAND
				});
			});
			this.getEditor().getComponentRegistry().register('redo', () => {
				return this.#createButton({
					icon: ui_iconSet_api_core.Outline.REDO,
					tooltip: main_core.Loc.getMessage('TEXT_EDITOR_BTN_REDO', {
						'#keystroke#': getKeystrokeCaption({
							mac: '⌘⇧Z',
							other: 'Ctrl+Y'
						})
					}),
					disabled: this.#redoDisabled,
					command: ui_lexical_core.REDO_COMMAND
				});
			});
		}
		#createButton(options) {
			const button = new Button();
			button.setIcon(options.icon);
			button.setTooltip(options.tooltip);
			button.bindDisabled(options.disabled);
			button.subscribe('onClick', () => {
				this.getEditor().dispatchCommand(options.command);
			});
			return button;
		}
	}

	var History = Object.freeze({
		__proto__: null,
		HistoryPlugin: HistoryPlugin
	});

	class ItalicPlugin extends TextFormatPlugin {
		static getFormatConfig() {
			return {
				name: 'Italic',
				format: 'italic',
				icon: ui_iconSet_api_core.Outline.ITALIC,
				tooltipMessage: 'TEXT_EDITOR_BTN_ITALIC',
				keystroke: {
					mac: '⌘I',
					other: 'Ctrl+I'
				},
				importTags: ['i'],
				exportTag: 'i'
			};
		}
	}

	var Italic = Object.freeze({
		__proto__: null,
		ItalicPlugin: ItalicPlugin
	});

	const DEFAULT_MAX_INDENT = 5;
	class ListPlugin extends BasePlugin {
		#maxIndent;
		constructor(editor) {
			super(editor);
			this.#maxIndent = editor.getOption('list.maxIndent', DEFAULT_MAX_INDENT);
			this.#registerListeners();
			this.#registerComponents();
		}
		static getName() {
			return 'List';
		}
		static getDefaultOptions() {
			return {
				list: {
					maxIndent: DEFAULT_MAX_INDENT
				}
			};
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
		#registerListeners() {
			this.cleanUpRegister(this.getEditor().registerCommand(ui_lexical_list.INSERT_ORDERED_LIST_COMMAND, () => {
				ui_lexical_list.$insertList('number');
				return true;
			}, ui_lexical_core.COMMAND_PRIORITY_LOW), this.getEditor().registerCommand(ui_lexical_list.INSERT_UNORDERED_LIST_COMMAND, () => {
				ui_lexical_list.$insertList('bullet');
				return true;
			}, ui_lexical_core.COMMAND_PRIORITY_LOW), this.getEditor().registerCommand(ui_lexical_list.REMOVE_LIST_COMMAND, () => {
				ui_lexical_list.$removeList();
				return true;
			}, ui_lexical_core.COMMAND_PRIORITY_LOW), this.getEditor().registerCommand(ui_lexical_core.INSERT_PARAGRAPH_COMMAND, () => {
				return ui_lexical_list.$handleListInsertParagraph();
			}, ui_lexical_core.COMMAND_PRIORITY_LOW), this.getEditor().registerCommand(ui_lexical_core.INDENT_CONTENT_COMMAND, () => {
				const totalDepth = this.#getTotalListDepth();
				if (totalDepth > 0) {
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

	var List = Object.freeze({
		__proto__: null,
		ListPlugin: ListPlugin
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
				<div class="ui-text-editor-placeholder" aria-hidden="true">${main_core.Text.encode(this.#placeholder)}</div>
			`;
				main_core.Dom.append(this.#placeholderNode, this.getEditor().getScrollerContainer());
				main_core.Dom.attr(this.getEditor().getEditableContainer(), 'aria-placeholder', this.#placeholder);
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
				if (main_core.Type.isStringFilled(paragraphPlaceholder) && paragraphPlaceholder !== 'auto') {
					this.#paragraphPlaceholder = paragraphPlaceholder;
					this.#registerParagraphListeners();
				}
			}
		}
		static getName() {
			return 'Placeholder';
		}
		static getPeerDependencies() {
			return ['Copilot', 'Mention'];
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
			}, ui_lexical_core.COMMAND_PRIORITY_CRITICAL), this.getEditor().registerCommand(ui_lexical_core.BLUR_COMMAND, () => {
				resetParagraphPlaceholder();
				this.#togglePlaceholder();
				return false;
			}, ui_lexical_core.COMMAND_PRIORITY_CRITICAL));
		}
	}

	const COMPOSITION_ONLY_OPTIONS = new Set(['plugins', 'extraPlugins', 'removePlugins']);
	class PluginCollection {
		#pluginConstructors = new Map();
		#plugins = new Map();
		constructor(builtinPlugins = [], plugins = [], pluginsToRemove = []) {
			const availablePlugins = new Map();
			for (const pluginConstructor of builtinPlugins) {
				if (pluginConstructor.getName()) {
					availablePlugins.set(pluginConstructor.getName(), pluginConstructor);
				}
			}
			for (const plugin of plugins) {
				if (main_core.Type.isFunction(plugin) && plugin.getName() && !availablePlugins.has(plugin.getName())) {
					availablePlugins.set(plugin.getName(), plugin);
				}
			}
			const pluginsToLoad = plugins.filter(plugin => {
				if (pluginsToRemove.includes(plugin)) {
					return false;
				}
				if (main_core.Type.isFunction(plugin) && pluginsToRemove.includes(plugin.getName())) {
					return false;
				}
				return !pluginsToRemove.includes(availablePlugins.get(plugin));
			});
			pluginsToLoad.map(plugin => {
				return main_core.Type.isFunction(plugin) ? plugin : availablePlugins.get(plugin);
			}).forEach(pluginConstructor => {
				if (main_core.Type.isFunction(pluginConstructor)) {
					const name = pluginConstructor.getName();
					const registered = this.#pluginConstructors.get(name);
					if (registered !== undefined && registered !== pluginConstructor) {
						console.warn(`TextEditor: plugin name collision: "${name}" is registered by more than one constructor, the last one wins.`);
					}
					this.#pluginConstructors.set(name, pluginConstructor);
				}
			});
			this.#includeDependencies(pluginsToRemove);
			this.#sortByDependencies();
		}
		#includeDependencies(pluginsToRemove) {
			const removedNames = new Set(pluginsToRemove.map(plugin => {
				return main_core.Type.isFunction(plugin) ? plugin.getName() : plugin;
			}));
			const queue = [...this.#pluginConstructors.values()];
			for (let index = 0; index < queue.length; index++) {
				const pluginConstructor = queue[index];
				const dependencies = pluginConstructor.getDependencies?.() ?? [];
				for (const dependency of dependencies) {
					const name = dependency.getName();
					if (removedNames.has(name)) {
						throw new TypeError(`TextEditor: plugin "${pluginConstructor.getName()}" requires plugin "${name}", removed via removePlugins.`);
					}
					if (!this.#pluginConstructors.has(name)) {
						this.#pluginConstructors.set(name, dependency);
						queue.push(dependency);
					}
				}
			}
		}
		#sortByDependencies() {
			const names = [...this.#pluginConstructors.keys()];
			let sortedNames = this.#sortStably(names, this.#collectPrerequisites(true));
			if (sortedNames.length < names.length) {
				sortedNames = this.#sortStably(names, this.#collectPrerequisites(false));
			}
			if (sortedNames.length < names.length) {
				const resolved = new Set(sortedNames);
				const unresolvedNames = names.filter(name => !resolved.has(name));
				throw new TypeError(`TextEditor: unresolvable dependency order between plugins: ${unresolvedNames.join(', ')}.`);
			}
			const sorted = new Map();
			for (const name of sortedNames) {
				sorted.set(name, this.#pluginConstructors.get(name));
			}
			this.#pluginConstructors = sorted;
		}
		#collectPrerequisites(withPeers) {
			const prerequisites = new Map();
			for (const [name, pluginConstructor] of this.#pluginConstructors) {
				const prerequisiteNames = new Set();
				for (const dependency of pluginConstructor.getDependencies?.() ?? []) {
					prerequisiteNames.add(dependency.getName());
				}
				if (withPeers) {
					for (const peerName of pluginConstructor.getPeerDependencies?.() ?? []) {
						prerequisiteNames.add(peerName);
					}
				}
				prerequisiteNames.delete(name);
				prerequisites.set(name, [...prerequisiteNames]);
			}
			return prerequisites;
		}
		#sortStably(names, prerequisites) {
			const sortedNames = [];
			const visited = new Set();
			let progress = true;
			while (sortedNames.length < names.length && progress) {
				progress = false;
				for (const name of names) {
					if (visited.has(name)) {
						continue;
					}
					const ready = prerequisites.get(name).every(prerequisite => {
						return visited.has(prerequisite) || !this.#pluginConstructors.has(prerequisite);
					});
					if (ready) {
						visited.add(name);
						sortedNames.push(name);
						progress = true;
						break;
					}
				}
			}
			return sortedNames;
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
				const cleanup = instance.afterInit();
				if (main_core.Type.isFunction(cleanup)) {
					instance.setAfterInitCleanup(cleanup);
				}
			});
		}
		getConstructors() {
			return [...this.#pluginConstructors.values()];
		}
		getDefaultOptions() {
			const collected = {};
			const owners = new Map();
			for (const [name, pluginConstructor] of this.#pluginConstructors) {
				const defaults = pluginConstructor.getDefaultOptions?.() ?? {};
				for (const [key, value] of Object.entries(defaults)) {
					if (COMPOSITION_ONLY_OPTIONS.has(key)) {
						console.warn(`TextEditor: plugin "${name}" declares a default for option "${key}", which is applied ` + 'before plugin defaults are collected, so the default is ignored.');
						continue;
					}
					const owner = owners.get(key);
					if (owner !== undefined) {
						console.warn(`TextEditor: plugins "${owner}" and "${name}" both declare a default for option "${key}", "${owner}" wins.`);
						continue;
					}
					owners.set(key, name);
					if (value !== undefined) {
						collected[key] = value;
					}
				}
			}
			return collected;
		}
		getPlugins() {
			return this.#plugins;
		}
		destroy() {
			for (const plugin of [...this.#plugins.values()].reverse()) {
				try {
					plugin.destroy();
				} catch (error) {
					console.error(`TextEditor: plugin "${plugin.getName()}" threw while being destroyed.`, error);
				}
			}
			this.#plugins.clear();
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

	class QuoteNode extends ui_lexical_core.ElementNode {
		$config() {
			return this.config('quote', {
				extends: ui_lexical_core.ElementNode
			});
		}
		isEscapableBlock() {
			return true;
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
			$removeQuote(this);
			return true;
		}
		canBeEmpty() {
			return false;
		}
		isShadowRoot() {
			return true;
		}
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

	const INSERT_QUOTE_COMMAND = ui_lexical_core.createCommand('INSERT_QUOTE_COMMAND');
	const FORMAT_QUOTE_COMMAND = ui_lexical_core.createCommand('FORMAT_QUOTE_COMMAND');
	const REMOVE_QUOTE_COMMAND = ui_lexical_core.createCommand('REMOVE_QUOTE_COMMAND');
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

	var Quote = Object.freeze({
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

	class RichTextPlugin extends BasePlugin {
		constructor(editor) {
			super(editor);
			this.cleanUpRegister(ui_lexical_richText.registerRichText(editor.getLexicalEditor()));
		}
		static getName() {
			return 'RichText';
		}
	}

	function convertSpoilerContentElement(domNode) {
		const node = $createSpoilerContentNode();
		return {
			node
		};
	}
	class SpoilerContentNode extends ui_lexical_core.ElementNode {
		$config() {
			return this.config('spoiler-content', {
				extends: ui_lexical_core.ElementNode
			});
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
		exportDOM() {
			const element = document.createElement('div');
			element.setAttribute('data-spoiler-content', 'true');
			return {
				element
			};
		}
		exportJSON() {
			return super.exportJSON();
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

	class SpoilerTitleTextNode extends ui_lexical_core.TextNode {
		$config() {
			return this.config('spoiler-title-text', {
				extends: ui_lexical_core.TextNode
			});
		}
		createDOM(config) {
			return super.createDOM(config);
		}
	}
	function $createSpoilerTitleTextNode(text = '') {
		return ui_lexical_core.$applyNodeReplacement(new SpoilerTitleTextNode(text));
	}
	function $isSpoilerTitleTextNode(node) {
		return node instanceof SpoilerTitleTextNode;
	}

	const INSERT_SPOILER_COMMAND = ui_lexical_core.createCommand('INSERT_SPOILER_COMMAND');
	const REMOVE_SPOILER_COMMAND = ui_lexical_core.createCommand('REMOVE_SPOILER_COMMAND');
	const TOGGLE_SPOILER_COMMAND = ui_lexical_core.createCommand('TOGGLE_SPOILER_COMMAND');
	class SpoilerPlugin extends BasePlugin {
		constructor(editor) {
			super(editor);
			this.#registerNodeTransforms();
			this.#registerCommands();
			this.#registerComponents();
			this.#registerEditableListener();
		}
		#registerEditableListener() {
			this.cleanUpRegister(this.getEditor().registerEditableListener(isEditable => {
				const rootElement = this.getEditor().getRootElement();
				if (rootElement === null) {
					return;
				}
				for (const title of rootElement.querySelectorAll('summary')) {
					title.tabIndex = isEditable ? -1 : 0;
				}
			}));
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
						node: createBBCodeElement(scheme, {
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
			this.getEditor().registerCommand(ui_lexical_core.DELETE_CHARACTER_COMMAND, this.#handleDeleteCharacter.bind(this), ui_lexical_core.COMMAND_PRIORITY_LOW), this.getEditor().registerCommand(ui_lexical_core.KEY_ENTER_COMMAND, this.#handleEnter.bind(this), ui_lexical_core.COMMAND_PRIORITY_NORMAL), this.getEditor().registerCommand(ui_lexical_core.KEY_SPACE_COMMAND, this.#handleSpace.bind(this), ui_lexical_core.COMMAND_PRIORITY_NORMAL), this.getEditor().registerCommand(ui_lexical_core.INSERT_PARAGRAPH_COMMAND, this.#handleInsertParagraph.bind(this), ui_lexical_core.COMMAND_PRIORITY_LOW), this.getEditor().registerCommand(ui_lexical_core.PASTE_COMMAND, this.#handlePaste.bind(this), ui_lexical_core.COMMAND_PRIORITY_NORMAL), this.getEditor().registerCommand(INSERT_SPOILER_COMMAND, payload => {
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
		#handleInsertParagraph() {
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
		}
		#handleEnter(event) {
			if (event && hasCommandModifier(event)) {
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
				return false;
			}
			if (event === null || !ui_lexical_core.isModifierMatch(event, {}) || !this.#isSummaryKeyEventInTitle(event)) {
				return false;
			}
			event.preventDefault();
			return this.#handleInsertParagraph();
		}
		#isSummaryKeyEventInTitle(event) {
			if (!(event.target instanceof HTMLElement) || event.target.tagName !== 'SUMMARY') {
				return false;
			}
			const selection = ui_lexical_core.$getSelection();
			if (!ui_lexical_core.$isRangeSelection(selection)) {
				return false;
			}
			return ui_lexical_utils.$findMatchingParent(selection.anchor.getNode(), node => $isSpoilerTitleNode(node)) !== null;
		}
		#handleSpace(event) {
			if (event === null || !this.#isSummaryKeyEventInTitle(event)) {
				return false;
			}
			const selection = ui_lexical_core.$getSelection();
			if (!ui_lexical_core.$isRangeSelection(selection)) {
				return false;
			}
			event.preventDefault();
			if (!ui_lexical_core.isModifierMatch(event, {
				shiftKey: 'any'
			})) {
				return false;
			}
			selection.insertText(' ');
			return true;
		}
		#handlePaste(event) {
			const selection = ui_lexical_core.$getSelection();
			if (!ui_lexical_core.$isRangeSelection(selection) || !ui_lexical_utils.objectKlassEquals(event, ClipboardEvent) || event.clipboardData === null) {
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
			handled.add(node.getKey());
		}
		return spoiler;
	}
	function trimSpoilerTitle(title) {
		return title.trim().replaceAll(/\r?\n|\t/gm, '').replace('\r', '').replaceAll(/\s+/g, ' ');
	}

	function convertSummaryElement(domNode) {
		const node = $createSpoilerTitleNode();
		return {
			node
		};
	}
	class SpoilerTitleNode extends ui_lexical_core.ElementNode {
		__language = 'hack';
		$config() {
			return this.config('spoiler-title', {
				extends: ui_lexical_core.ElementNode
			});
		}
		isUnformatted() {
			return true;
		}
		createDOM(config, editor) {
			const dom = document.createElement('summary');
			dom.tabIndex = editor.isEditable() ? -1 : 0;
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
		exportDOM() {
			const element = document.createElement('summary');
			return {
				element
			};
		}
		exportJSON() {
			return super.exportJSON();
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

	class SpoilerNode extends ui_lexical_core.ElementNode {
		__open;
		constructor(open = false, key) {
			super(key);
			this.__open = open;
		}
		$config() {
			return this.config('spoiler', {
				extends: ui_lexical_core.ElementNode
			});
		}
		isEscapableBlock() {
			return true;
		}
		afterCloneFrom(prevNode) {
			super.afterCloneFrom(prevNode);
			this.__open = prevNode.__open;
		}
		updateFromJSON(serializedNode) {
			const node = super.updateFromJSON(serializedNode);
			node.setOpen(serializedNode.open);
			return node;
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
				open: this.__open
			};
		}
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

	var Spoiler = Object.freeze({
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

	class StrikethroughPlugin extends TextFormatPlugin {
		static getFormatConfig() {
			return {
				name: 'Strikethrough',
				format: 'strikethrough',
				icon: ui_iconSet_api_core.Outline.STRIKETHROUGH,
				tooltipMessage: 'TEXT_EDITOR_BTN_STRIKETHROUGH',
				keystroke: {
					mac: '⌘⇧X',
					other: 'Ctrl+Shift+X'
				},
				importTags: ['s', 'del'],
				exportTag: 's',
				shortcut: {
					key: 'x',
					shiftKey: true
				}
			};
		}
	}

	var Strikethrough = Object.freeze({
		__proto__: null,
		StrikethroughPlugin: StrikethroughPlugin
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
				if ($isSelectionInList(selection)) {
					event.preventDefault();
				}
				const command = event.shiftKey ? ui_lexical_core.OUTDENT_CONTENT_COMMAND : ui_lexical_core.INDENT_CONTENT_COMMAND;
				return this.getEditor().dispatchCommand(command);
			}, ui_lexical_core.COMMAND_PRIORITY_EDITOR),
			this.getEditor().registerCommand(ui_lexical_core.INDENT_CONTENT_COMMAND, () => {
				const selection = ui_lexical_core.$getSelection();
				return !$isSelectionInList(selection);
			}, ui_lexical_core.COMMAND_PRIORITY_LOW), this.getEditor().registerCommand(ui_lexical_core.OUTDENT_CONTENT_COMMAND, () => {
				const selection = ui_lexical_core.$getSelection();
				return !$isSelectionInList(selection);
			}, ui_lexical_core.COMMAND_PRIORITY_LOW));
		}
	}
	function $isNodeInList(node) {
		if (ui_lexical_list.$isListItemNode(node)) {
			return true;
		}
		const parentNode = ui_lexical_utils.$findMatchingParent(node, parent => ui_lexical_core.$isElementNode(parent) && !parent.isInline());
		return ui_lexical_list.$isListItemNode(parentNode);
	}
	function $isSelectionInList(selection) {
		if (!ui_lexical_core.$isRangeSelection(selection)) {
			return false;
		}
		return selection.getNodes().some(node => $isNodeInList(node));
	}

	var TabIndent = Object.freeze({
		__proto__: null,
		TabIndentPlugin: TabIndentPlugin
	});

	const GRID_ROWS = 10;
	const GRID_COLUMNS = 10;
	const BOX_SELECTOR = '.ui-text-editor-table-dialog-box';
	class TableDialog extends BaseDialog {
		#targetNode = null;
		#targetNodeWidth = 0;
		#lastSelectedBox = null;
		#rovingBox = null;
		constructor(dialogOptions) {
			super('BX.UI.TextEditor.TableDialog', dialogOptions);
			const options = main_core.Type.isPlainObject(dialogOptions) ? dialogOptions : {};
			this.setTargetNode(options.targetNode);
			this.subscribe('onShow', () => {
				const popup = this.getPopup();
				centerPopupOnTarget(popup, this.#targetNodeWidth, popup.getPopupContainer().offsetWidth);
				this.#lastSelectedBox = null;
				this.#highlightBoxes(1, 1);
				this.#setRovingBox(this.#getBox(1, 1));
			});
			this.subscribe('onAfterShow', () => {
				this.#rovingBox?.focus();
			});
		}
		setTargetNode(container) {
			if (main_core.Type.isElementNode(container)) {
				this.#targetNode = container;
			}
		}
		getTargetNode() {
			return this.#targetNode;
		}
		getPopupOptions() {
			this.#targetNodeWidth = this.getTargetNode().getBoundingClientRect().width;
			return {
				ariaLabel: getAriaMessage('TEXT_EDITOR_DIALOG_TABLE_ARIA') ?? undefined,
				bindElement: this.getTargetNode() ?? undefined,
				content: main_core.Tag.render`
				<div class="ui-text-editor-table-dialog" onclick="${this.#handleClick.bind(this)}">
					${this.getGridContainer()}
					${this.getCaptionContainer()}
				</div>
			`
			};
		}
		getGridContainer() {
			return this.getRefs().remember('grid', () => {
				const rows = [];
				for (let row = 1; row <= GRID_ROWS; row++) {
					const cells = [];
					for (let column = 1; column <= GRID_COLUMNS; column++) {
						const isFirst = row === 1 && column === 1;
						const box = main_core.Tag.render`
						<button
							type="button"
							class="ui-text-editor-table-dialog-box"
							tabindex="${isFirst ? '0' : '-1'}"
							data-column="${column}"
							data-row="${row}"
						></button>
					`;
						main_core.Dom.attr(box, 'aria-label', this.#getBoxLabel(row, column));
						cells.push(main_core.Tag.render`
						<div class="ui-text-editor-table-dialog-cell" role="gridcell" aria-selected="false">
							${box}
						</div>
					`);
					}
					rows.push(main_core.Tag.render`
					<div class="ui-text-editor-table-dialog-row" role="row">${cells}</div>
				`);
				}
				const grid = main_core.Tag.render`
				<div
					class="ui-text-editor-table-dialog-grid"
					role="grid"
					onmousemove="${this.#handleMouseMove.bind(this)}"
					onkeydown="${this.#handleKeyDown.bind(this)}"
				>${rows}</div>
			`;
				main_core.Dom.attr(grid, 'aria-label', getAriaMessage('TEXT_EDITOR_DIALOG_TABLE_ARIA'));
				return grid;
			});
		}
		getCaptionContainer() {
			return this.getRefs().remember('caption', () => {
				return main_core.Tag.render`<div class="ui-text-editor-table-dialog-caption" role="status"></div>`;
			});
		}
		#handleMouseMove(event) {
			if (main_core.Dom.hasClass(event.target, 'ui-text-editor-table-dialog-box')) {
				this.#selectBox(event.target);
			}
		}
		#handleKeyDown(event) {
			const box = event.target.closest(BOX_SELECTOR);
			if (box === null) {
				return;
			}
			const row = main_core.Text.toNumber(box.dataset.row);
			const column = main_core.Text.toNumber(box.dataset.column);
			let nextRow = row;
			let nextColumn = column;
			switch (event.key) {
				case 'ArrowRight':
					nextColumn = Math.min(column + 1, GRID_COLUMNS);
					break;
				case 'ArrowLeft':
					nextColumn = Math.max(column - 1, 1);
					break;
				case 'ArrowDown':
					nextRow = Math.min(row + 1, GRID_ROWS);
					break;
				case 'ArrowUp':
					nextRow = Math.max(row - 1, 1);
					break;
				case 'Home':
					nextColumn = 1;
					nextRow = event.ctrlKey ? 1 : row;
					break;
				case 'End':
					nextColumn = GRID_COLUMNS;
					nextRow = event.ctrlKey ? GRID_ROWS : row;
					break;
				default:
					return;
			}
			event.preventDefault();
			this.#focusBox(nextRow, nextColumn);
		}
		#handleClick(event) {
			const clickedBox = event.target.closest(BOX_SELECTOR);
			const selectedBox = clickedBox ?? this.#lastSelectedBox;
			if (selectedBox) {
				const {
					row,
					column
				} = selectedBox.dataset;
				this.emit('onSelect', {
					rows: row,
					columns: column
				});
			}
		}
		#getBoxes() {
			return [...this.getGridContainer().querySelectorAll(BOX_SELECTOR)];
		}
		#getBox(row, column) {
			return this.getGridContainer().querySelector(`[data-row="${row}"][data-column="${column}"]`);
		}
		#getBoxLabel(rows, columns) {
			return getAriaMessage('TEXT_EDITOR_TABLE_SIZE_ARIA', {
				'#ROWS#': String(rows),
				'#COLUMNS#': String(columns)
			});
		}
		#focusBox(row, column) {
			const box = this.#getBox(row, column);
			if (box === null) {
				return;
			}
			this.#setRovingBox(box);
			this.#selectBox(box);
			box.focus();
		}
		#setRovingBox(box) {
			if (box === null || this.#rovingBox === box) {
				return;
			}
			if (this.#rovingBox !== null) {
				main_core.Dom.attr(this.#rovingBox, 'tabindex', '-1');
			}
			main_core.Dom.attr(box, 'tabindex', '0');
			this.#rovingBox = box;
		}
		#selectBox(box) {
			if (this.#lastSelectedBox === box) {
				return;
			}
			this.#lastSelectedBox = box;
			this.#highlightBoxes(main_core.Text.toNumber(box.dataset.row), main_core.Text.toNumber(box.dataset.column));
		}
		#highlightBoxes(rows, columns) {
			let index = 0;
			for (const box of this.#getBoxes()) {
				const boxRow = Math.floor(index / GRID_COLUMNS);
				const boxColumn = index % GRID_COLUMNS;
				const selected = boxRow < rows && boxColumn < columns;
				if (selected) {
					main_core.Dom.addClass(box, '--selected');
				} else {
					main_core.Dom.removeClass(box, '--selected');
				}
				main_core.Dom.attr(box.parentElement, 'aria-selected', selected ? 'true' : 'false');
				index++;
			}
			this.getCaptionContainer().textContent = rows && columns ? `${rows} x ${columns}` : '';
		}
	}

	const INSERT_TABLE_DIALOG_COMMAND = ui_lexical_core.createCommand('INSERT_TABLE_DIALOG_COMMAND');
	class TablePlugin extends BasePlugin {
		#tableDialog = null;
		constructor(editor) {
			super(editor);
			ui_lexical_table.setScrollableTablesActive(this.getLexicalEditor(), true);
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
				button.setHasPopup('dialog');
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
						onClose: () => {
							returnFocusToEditor(this.getEditor());
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
			this.cleanUpRegister(ui_lexical_table.registerTableSelectionObserver(this.getLexicalEditor(), true));
		}
		destroy() {
			super.destroy();
			if (this.#tableDialog !== null) {
				this.#tableDialog.destroy();
			}
		}
	}

	var Table = Object.freeze({
		__proto__: null,
		INSERT_TABLE_DIALOG_COMMAND: INSERT_TABLE_DIALOG_COMMAND,
		TablePlugin: TablePlugin
	});

	const TOGGLE_TOOLBAR_COMMAND = ui_lexical_core.createCommand('TOGGLE_TOOLBAR_COMMAND');
	const SHOW_TOOLBAR_COMMAND = ui_lexical_core.createCommand('SHOW_TOOLBAR_COMMAND');
	const HIDE_TOOLBAR_COMMAND = ui_lexical_core.createCommand('HIDE_TOOLBAR_COMMAND');
	class ToolbarPlugin extends BasePlugin {
		#toolbar = null;
		static getName() {
			return 'Toolbar';
		}
		static getDefaultOptions() {
			return {
				hideToolbar: false
			};
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
			this.#toolbar = new Toolbar$1(this.getEditor(), this.getEditor().getOption('toolbar', []), 'ui-text-editor-toolbar');
			if (!this.#toolbar.isEmpty()) {
				this.#registerCommands();
				this.#toolbar.renderTo(this.getEditor().getToolbarContainer());
				const hideToolbar = this.getEditor().getOption('hideToolbar');
				if (hideToolbar) {
					this.hide();
				}
			}
			return () => {
				this.#toolbar.destroy();
			};
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

	var Toolbar = Object.freeze({
		__proto__: null,
		HIDE_TOOLBAR_COMMAND: HIDE_TOOLBAR_COMMAND,
		SHOW_TOOLBAR_COMMAND: SHOW_TOOLBAR_COMMAND,
		TOGGLE_TOOLBAR_COMMAND: TOGGLE_TOOLBAR_COMMAND,
		ToolbarPlugin: ToolbarPlugin
	});

	class UnderlinePlugin extends TextFormatPlugin {
		static getFormatConfig() {
			return {
				name: 'Underline',
				format: 'underline',
				icon: ui_iconSet_api_core.Outline.UNDERLINE,
				tooltipMessage: 'TEXT_EDITOR_BTN_UNDERLINE',
				keystroke: {
					mac: '⌘U',
					other: 'Ctrl+U'
				},
				importTags: ['u'],
				exportTag: 'u'
			};
		}
	}

	var Underline = Object.freeze({
		__proto__: null,
		UnderlinePlugin: UnderlinePlugin
	});

	function isInlineNode(node) {
		return ui_lexical_core.$isTextNode(node) || ui_lexical_core.$isElementNode(node) && node.isInline();
	}
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
			if (parentCode === undefined) {
				console.warn(`TextEditor: parent node (${parent.getType()}) doesn't have a bbcode tag.`);
			}
			if (childCode === undefined) {
				console.warn(`TextEditor: child node (${child.getType()}) doesn't have a bbcode tag.`);
			}
			if (parentCode === undefined || childCode === undefined) {
				return false;
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
			const declarations = [];
			for (const [pluginName, plugin] of this.#editor.getPlugins()) {
				const validation = plugin.validateScheme();
				if (!main_core.Type.isPlainObject(validation)) {
					continue;
				}
				if (main_core.Type.isPlainObject(validation.bbcodeMap)) {
					for (const [nodeType, bbcodeTag] of Object.entries(validation.bbcodeMap)) {
						this.#nodeTypeToBBCodeType.set(nodeType, bbcodeTag);
					}
				}
				if (main_core.Type.isArrayFilled(validation.nodes)) {
					declarations.push([pluginName, validation.nodes]);
				}
			}
			this.#assertTransformNodesAreMapped(declarations);
			const handleNodeTransform = this.#handleNodeTransform.bind(this);
			const validatorOwners = new Map();
			for (const [pluginName, nodes] of declarations) {
				nodes.forEach(nodeValidation => {
					const nodeClass = nodeValidation.nodeClass;
					this.#editor.registerNodeTransform(nodeClass, handleNodeTransform);
					if (!main_core.Type.isFunction(nodeValidation.validate)) {
						return;
					}
					const nodeType = nodeClass.getType();
					const owner = validatorOwners.get(nodeType);
					if (owner !== undefined) {
						console.warn(`TextEditor: plugins "${owner}" and "${pluginName}" both declare a validator ` + `for node type "${nodeType}", "${pluginName}" wins.`);
					}
					validatorOwners.set(nodeType, pluginName);
					this.#nodeValidation.set(nodeType, {
						validate: nodeValidation.validate
					});
				});
			}
		}
		#assertTransformNodesAreMapped(declarations) {
			const unmapped = [];
			for (const [pluginName, nodes] of declarations) {
				for (const nodeValidation of nodes) {
					const nodeType = nodeValidation.nodeClass.getType();
					if (!this.#nodeTypeToBBCodeType.has(nodeType)) {
						unmapped.push(`"${nodeType}" (plugin "${pluginName}")`);
					}
				}
			}
			if (unmapped.length > 0) {
				throw new TypeError(`TextEditor: node types validated against the bbcode scheme without a bbcodeMap entry: ${unmapped.join(', ')}.`);
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
				if (ui_lexical_core.$isRootNode(node.getParent()) && isInlineNode(node)) {
					const paragraph = ui_lexical_core.$createParagraphNode();
					node.replace(paragraph);
					paragraph.append(node);
					return true;
				}
				if (removeOnFail) {
					node.remove();
				}
				return false;
			}
			if (ui_lexical_core.$isRootNode(targetNode.getParent()) && isInlineNode(node)) {
				targetNode.insertBefore(ui_lexical_core.$createParagraphNode().append(node));
				return true;
			}
			targetNode.insertBefore(node);
			return true;
		}
	}

	const defaultTheme = {
		blockCursor: 'ui-text-editor__block-cursor',
		indent: 'ui-text-editor__indent',
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
		tableCellSelected: 'ui-text-editor__table-cell-selected',
		tableSelection: 'ui-typography-table-selection',
		tableScrollableWrapper: 'ui-text-editor__table-scrollable-wrapper',
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

	const BLUR_GRACE_PERIOD = 400;
	class SelectionState {
		#editor = null;
		#revision = ui_lexical_extension.signal(0);
		#selectionVisible = ui_lexical_extension.signal(true);
		#requestedFormats = new Set();
		#formatSignals = new Map();
		#blockTypeSignals = new Map();
		#disabledSignals = new Map();
		#timeoutId = null;
		#removeListeners = () => {};
		#snapshot;
		constructor(editor) {
			this.#editor = editor;
			this.#snapshot = ui_lexical_extension.computed(() => {
				void this.#revision.value;
				return this.#editor.getEditorState().read(() => this.#derive());
			});
			this.#removeListeners = this.#registerListeners();
		}
		getRevisionSignal() {
			return this.#revision;
		}
		invalidate() {
			this.#revision.value += 1;
		}
		formatActive(format) {
			let existing = this.#formatSignals.get(format);
			if (existing === undefined) {
				this.#requestedFormats.add(format);
				this.#revision.value += 1;
				existing = ui_lexical_extension.computed(() => {
					return this.#selectionVisible.value && this.#snapshot.value.formats.has(format);
				});
				this.#formatSignals.set(format, existing);
			}
			return existing;
		}
		blockTypeActive(type) {
			let existing = this.#blockTypeSignals.get(type);
			if (existing === undefined) {
				existing = ui_lexical_extension.computed(() => {
					return this.#selectionVisible.value && this.#snapshot.value.blockTypes.has(type);
				});
				this.#blockTypeSignals.set(type, existing);
			}
			return existing;
		}
		disabled(insideUnformattedMatters) {
			const key = String(insideUnformattedMatters);
			let existing = this.#disabledSignals.get(key);
			if (existing === undefined) {
				existing = ui_lexical_extension.computed(() => {
					if (!this.#editor.getEditableSignal().value) {
						return true;
					}
					return insideUnformattedMatters && this.#snapshot.value.insideUnformatted;
				});
				this.#disabledSignals.set(key, existing);
			}
			return existing;
		}
		destroy() {
			this.#removeListeners();
			if (this.#timeoutId !== null) {
				clearTimeout(this.#timeoutId);
				this.#timeoutId = null;
			}
		}
		#registerListeners() {
			return ui_lexical_utils.mergeRegister(this.#editor.registerCommand(ui_lexical_core.SELECTION_CHANGE_COMMAND, () => {
				this.#selectionVisible.value = true;
				return false;
			}, ui_lexical_core.COMMAND_PRIORITY_CRITICAL), this.#editor.registerCommand(ui_lexical_core.FOCUS_COMMAND, () => {
				if (this.#timeoutId !== null) {
					clearTimeout(this.#timeoutId);
					this.#timeoutId = null;
				}
				this.#selectionVisible.value = true;
				return false;
			}, ui_lexical_core.COMMAND_PRIORITY_CRITICAL), this.#editor.registerCommand(ui_lexical_core.BLUR_COMMAND, () => {
				if (this.#timeoutId !== null) {
					clearTimeout(this.#timeoutId);
				}
				this.#timeoutId = setTimeout(() => {
					this.#timeoutId = null;
					const activeElement = document.activeElement;
					const editorRoot = this.#editor.getRootContainer();
					if (activeElement === null || !editorRoot.contains(activeElement)) {
						this.#selectionVisible.value = false;
					}
				}, BLUR_GRACE_PERIOD);
				return false;
			}, ui_lexical_core.COMMAND_PRIORITY_CRITICAL), this.#editor.registerUpdateListener(() => {
				ui_lexical_extension.batch(() => {
					this.#selectionVisible.value = true;
					this.#revision.value += 1;
				});
			}));
		}
		#derive() {
			const selection = ui_lexical_core.$getSelection();
			if (!ui_lexical_core.$isRangeSelection(selection)) {
				return {
					insideUnformatted: false,
					formats: new Set(),
					blockTypes: new Set()
				};
			}
			const rangeSelection = selection;
			const formats = new Set();
			this.#requestedFormats.forEach(format => {
				if (rangeSelection.hasFormat(format)) {
					formats.add(format);
				}
			});
			const blockTypes = new Set();
			let insideUnformatted = false;
			const root = ui_lexical_core.$getRoot();
			let currentNode = rangeSelection.anchor.getNode();
			while (currentNode !== root && currentNode !== null) {
				blockTypes.add(this.#getBlockType(currentNode));
				if ($isUnformatted(currentNode)) {
					insideUnformatted = true;
				}
				currentNode = currentNode.getParent();
			}
			return {
				insideUnformatted,
				formats,
				blockTypes
			};
		}
		#getBlockType(node) {
			const declared = node.getToolbarBlockType?.();
			if (declared !== undefined) {
				return declared;
			}
			return ui_lexical_list.$isListNode(node) ? node.getListType() : node.getType();
		}
	}

	const CollapsingState = {
		COLLAPSED: 'collapsed',
		COLLAPSING: 'collapsing',
		EXPANDED: 'expanded',
		EXPANDING: 'expanding'
	};
	class TextEditor extends main_core_events.EventEmitter {
		#lexicalEditor = null;
		#editable = null;
		#appliedAriaLabel = null;
		#selectionState = null;
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
			const presetDefaults = this.constructor.getDefaultOptions();
			const options = main_core.Type.isPlainObject(editorOptions) ? editorOptions : {};
			const resolvedOptions = mergeOptions(presetDefaults, options);
			const builtinPlugins = [...this.constructor.getBuiltinPlugins()];
			const plugins = resolvedOptions.plugins ?? builtinPlugins;
			const extraPlugins = resolvedOptions.extraPlugins ?? [];
			const pluginsToRemove = resolvedOptions.removePlugins ?? [];
			this.#themeClasses = defaultTheme;
			this.#plugins = new PluginCollection(builtinPlugins, [...plugins, ...extraPlugins], pluginsToRemove);
			this.#options = new main_core_collections.SettingsCollection(mergeOptions(mergeOptions(this.#plugins.getDefaultOptions(), presetDefaults), options));
			const newLineMode = this.#options.get('newLineMode');
			if ([NewLineMode.LINE_BREAK, NewLineMode.PARAGRAPH].includes(newLineMode)) {
				this.#newLineMode = newLineMode;
			}
			const constructors = this.#plugins.getConstructors();
			const nodes = constructors.map(pluginConstructor => {
				return pluginConstructor.getNodes(this);
			});
			const namespace = this.#options.get('namespace');
			this.#lexicalEditor = ui_lexical_core.createEditor({
				namespace: main_core.Type.isStringFilled(namespace) ? namespace : this.#createNamespace(constructors),
				nodes: nodes.flat(),
				onError: error => {
					console.error(error);
				},
				theme: this.#themeClasses,
				editable: this.#options.get('editable') !== false
			});
			this.#editable = ui_lexical_extension.signal(this.#lexicalEditor.isEditable());
			this.setMinHeight(this.#options.get('minHeight'));
			this.setMaxHeight(this.#options.get('maxHeight'));
			this.setAutoFocus(this.#options.get('autoFocus'));
			this.setVisualOptions(this.#options.get('visualOptions'));
			this.#selectionState = new SelectionState(this);
			this.#removeListeners = ui_lexical_utils.mergeRegister(this.#registerCommands(), this.#registerStateListeners(), this.#initDecorateNodes(nodes.flat()));
			this.#plugins.init(this);
			this.#bbcodeImportMap = this.#initBBCodeImportMap();
			this.#bbcodeExportMap = this.#initBBCodeExportMap();
			this.#bbcodeScheme = this.#initBBCodeScheme();
			this.#schemeValidation = new SchemeValidation(this);
			this.subscribeFromOptions(options.events ?? {});
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
								this.#decoratorNodes.delete(key);
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
					try {
						this.#mountDecoratorComponent(nodeKey, decorators[nodeKey]);
					} catch (error) {
						console.error(`TextEditor: the decorator component of node "${nodeKey}" threw while mounting.`, error);
					}
				});
				this.#decoratorNodes.clear();
			});
			removeListeners.push(removeListener);
			return ui_lexical_utils.mergeRegister(...removeListeners);
		}
		#mountDecoratorComponent(nodeKey, decorator) {
			if (decorator === undefined) {
				return;
			}
			const {
				componentClass: DecoratorClass,
				options: decoratorOptions
			} = decorator;
			const component = this.#decoratorComponents.get(nodeKey);
			const htmlElement = this.#lexicalEditor.getElementByKey(nodeKey);
			if (component && component.getTarget() === htmlElement) {
				component.update(decoratorOptions);
				return;
			}
			if (htmlElement === null) {
				return;
			}
			if (component) {
				component.destroy();
				this.#decoratorComponents.delete(nodeKey);
			}
			this.#decoratorComponents.set(nodeKey, new DecoratorClass({
				textEditor: this,
				target: htmlElement,
				nodeKey,
				options: decoratorOptions
			}));
		}
		#registerCommands() {
			return ui_lexical_utils.mergeRegister(this.registerCommand(ui_lexical_core.FOCUS_COMMAND, () => {
				if (this.isCollapsingModeEnabled() && this.#collapsingState === CollapsingState.COLLAPSED && this.isEmpty(false)) {
					this.expand();
					return true;
				}
				this.emit('onFocus');
				return false;
			}, ui_lexical_core.COMMAND_PRIORITY_CRITICAL), this.registerCommand(ui_lexical_core.BLUR_COMMAND, () => {
				const isCollapsingAnimation = this.isCollapsingModeEnabled() && (this.#collapsingState === CollapsingState.COLLAPSING || this.#collapsingState === CollapsingState.EXPANDING);
				if (!isCollapsingAnimation) {
					this.emit('onBlur');
				}
				return false;
			}, ui_lexical_core.COMMAND_PRIORITY_CRITICAL), this.registerCommand(ui_lexical_core.KEY_ENTER_COMMAND, event => {
				if (event === null) {
					return false;
				}
				const {
					ctrlKey,
					metaKey
				} = event;
				if (main_core.Browser.isMac() && metaKey || ctrlKey) {
					this.emit('onMetaEnter');
					return true;
				}
				return false;
			}, ui_lexical_core.COMMAND_PRIORITY_LOW),
			this.registerCommand(ui_lexical_core.KEY_ESCAPE_COMMAND, () => {
				this.emit('onEscape');
				return false;
			}, ui_lexical_core.COMMAND_PRIORITY_EDITOR));
		}
		#registerStateListeners() {
			return ui_lexical_utils.mergeRegister(this.registerUpdateListener(({
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
			}), this.registerEditableListener(isEditable => {
				this.#editable.value = isEditable;
				this.getEditableContainer().contentEditable = isEditable;
				this.syncEditableSemantics(this.getEditableContainer(), isEditable);
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
			const filePlugin = this.getPlugin(FilePlugin);
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
		isDestroying() {
			return this.#destroying;
		}
		isCollapsed() {
			return this.#collapsingState === CollapsingState.COLLAPSED;
		}
		#registerAnimationFrame(handler) {
			requestAnimationFrame(() => {
				if (this.#destroying) {
					return;
				}
				handler();
			});
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
				this.blur();
				const currentHeight = this.getRootContainer().offsetHeight;
				main_core.Dom.removeClass(this.getRootContainer(), ['--collapsed', '--collapsing']);
				main_core.Dom.style(this.getRootContainer(), {
					height: `${currentHeight}px`,
					overflow: 'hidden'
				});
				main_core.Dom.style(this.getInnerContainer(), {
					opacity: 0
				});
				this.#registerAnimationFrame(() => {
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
				this.#registerAnimationFrame(() => {
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
		#handleCollapsingTransition(event) {
			if (event.target !== this.getRootContainer()) {
				return;
			}
			main_core.Event.unbind(this.getRootContainer(), 'transitionend', this.#collapsingTransitionEnd);
			main_core.Dom.style(this.getRootContainer(), 'height', null);
			main_core.Dom.style(this.getRootContainer(), 'overflow', null);
			main_core.Dom.style(this.getInnerContainer(), 'opacity', null);
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
			return this.#editable.value;
		}
		getEditableSignal() {
			return this.#editable;
		}
		getSelectionState() {
			return this.#selectionState;
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
		registerMutationListener(klass, listener, options = {}) {
			return this.#lexicalEditor.registerMutationListener(klass, listener, {
				...options,
				skipInitialization: options.skipInitialization ?? true
			});
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
			const rootElement = this.getRootElement();
			return rootElement !== null && rootElement.contains(document.activeElement);
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
				const container = main_core.Tag.render`
				<div
					class="ui-text-editor-editable"
					contenteditable="${this.isEditable() ? 'true' : 'false'}"
					spellcheck="true"
				></div>
			`;
				this.syncEditableSemantics(container, this.isEditable());
				return container;
			});
		}
		getAriaLabel() {
			const ariaLabel = this.getOption('ariaLabel');
			if (main_core.Type.isStringFilled(ariaLabel)) {
				return ariaLabel;
			}
			return getAriaMessage('TEXT_EDITOR_LABEL_ARIA');
		}
		syncEditableSemantics(container, isEditable) {
			main_core.Dom.attr(container, {
				role: isEditable ? 'textbox' : null,
				'aria-multiline': isEditable ? 'true' : null
			});
			const currentName = container.getAttribute('aria-label');
			if (currentName !== null && currentName !== this.#appliedAriaLabel) {
				return;
			}
			this.#appliedAriaLabel = isEditable ? this.getAriaLabel() : null;
			main_core.Dom.attr(container, 'aria-label', this.#appliedAriaLabel);
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
			this.#plugins.destroy();
			for (const [nodeKey, component] of this.#decoratorComponents) {
				try {
					component.destroy();
				} catch (error) {
					console.error(`TextEditor: the decorator component of node "${nodeKey}" threw while being destroyed.`, error);
				}
			}
			this.#decoratorComponents.clear();
			this.#removeListeners();
			this.#selectionState.destroy();
			if (this.isRendered()) {
				this.#resizeObserver.disconnect();
				this.setRootElement(null);
				main_core.Dom.remove(this.getRootContainer());
			}
			this.#resizeObserver = null;
			this.#plugins = null;
			this.#lexicalEditor = null;
			this.#refs = null;
			this.#schemeValidation = null;
			this.#bbcodeImportMap = null;
			this.#bbcodeExportMap = null;
			this.#decoratorNodes = null;
			this.#decoratorComponents = null;
			Object.setPrototypeOf(this, null);
		}
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
		#lastSelection = new RememberedSelection();
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
		static getDefaultOptions() {
			return {
				copilot: {
					triggerBySpace: false
				}
			};
		}
		#registerListeners() {
			this.#triggerBySpace = this.getEditor().getOption('copilot.triggerBySpace') === true;
			this.cleanUpRegister(this.getEditor().registerCommand(INSERT_COPILOT_DIALOG_COMMAND, payload => {
				const options = main_core.Type.isPlainObject(payload) ? payload : {};
				this.show(options);
				return true;
			}, ui_lexical_core.COMMAND_PRIORITY_EDITOR), this.getEditor().registerCommand(HIDE_DIALOG_COMMAND, payload => {
				if (payload?.sender === 'copilot') {
					return false;
				}
				this.#lastSelection.forget();
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
					<span
						class="ui-icon-set ${copilotIconClass}"
						style="--ui-icon-set__icon-color: var(--ui-color-copilot-primary)"
					></span>
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
						this.registerTimeout(() => {
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
			return TextEditor.getGlobalOption('copilot.name', main_core.Loc.getMessage('TEXT_EDITOR_BTN_COPILOT') ?? '');
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
				this.#setBusy(true);
				this.#createCopilot().then(() => {
					this.#setBusy(false);
					this.#show({
						onShow
					});
				}).catch(() => {
					if (this.isDestroyed()) {
						return;
					}
					this.#setBusy(false);
					const failureMessage = getAriaMessage('TEXT_EDITOR_COPILOT_ERROR');
					if (failureMessage !== null) {
						ui_a11y.LiveAnnouncer.announce(failureMessage, 'assertive');
					}
					if (main_core.Type.isFunction(onError)) {
						onError();
					}
				});
			}
		}
		#setBusy(busy) {
			main_core.Dom.attr(this.getEditor().getEditableContainer(), 'aria-busy', busy ? 'true' : null);
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
				this.#lastSelection.remember(selection);
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
				main_core.Event.bind(this.getEditor().getScrollerContainer(), 'scroll', this.#onEditorScroll, {
					signal: this.getAbortSignal()
				});
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
					this.#copilotStatus = CopilotStatus.INIT;
					reject();
				});
			});
		}
		#resetLoader() {
			if (this.#targetParagraph) {
				main_core.Dom.removeClass(this.#targetParagraph, 'ui-text-editor-loading-ellipsis');
			}
		}
		#adjustDialogPosition() {
			this.getEditor().update(() => {
				this.#restoreSelection();
				const selection = ui_lexical_core.$getSelection();
				if (!ui_lexical_core.$isRangeSelection(selection)) {
					return;
				}
				this.#lastSelection.remember(selection);
				const selectionPosition = $getSelectionPosition(this.getEditor(), selection, document.body);
				if (selectionPosition === null) {
					return;
				}
				const {
					top,
					left,
					bottom
				} = selectionPosition;
				const scrollerRect = main_core.Dom.getPosition(this.getEditor().getScrollerContainer());
				const popupWidth = Math.min(scrollerRect.width, 600);
				const offsetLeft = getPopupOffsetLeft(this.getEditor(), scrollerRect, left, popupWidth);
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
			return this.#lastSelection.restore();
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

	var Copilot = Object.freeze({
		__proto__: null,
		CopilotPlugin: CopilotPlugin,
		INSERT_COPILOT_DIALOG_COMMAND: INSERT_COPILOT_DIALOG_COMMAND
	});

	class BasicEditor extends TextEditor {
		static getDefaultOptions() {
			return {
				plugins: [RichTextPlugin, ParagraphPlugin, ClipboardPlugin, BoldPlugin, UnderlinePlugin, ItalicPlugin, StrikethroughPlugin, TabIndentPlugin, ListPlugin, MentionPlugin, LinkPlugin, AutoLinkPlugin, ImagePlugin, CopilotPlugin, HistoryPlugin, BlockToolbarPlugin, FloatingToolbarPlugin, ToolbarPlugin, PlaceholderPlugin, FilePlugin],
				toolbar: ['bold', 'italic', 'underline', 'strikethrough', '|', 'numbered-list', 'bulleted-list', '|', 'link', 'copilot'],
				newLineMode: NewLineMode.MIXED
			};
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

	const BasicEditorComponent = {
		name: 'BasicEditorComponent',
		extends: TextEditorComponent,
		setup() {
			return {
				editorClass: BasicEditor
			};
		}
	};

	class RichText extends TextEditor {
		static getDefaultOptions() {
			return {
				plugins: [RichTextPlugin, ParagraphPlugin, ClipboardPlugin, BoldPlugin, ItalicPlugin, UnderlinePlugin, StrikethroughPlugin, ListPlugin, LinkPlugin, AutoLinkPlugin, ImagePlugin, VideoPlugin, SmileyPlugin, CopilotPlugin, ClearFormatPlugin, HistoryPlugin, ToolbarPlugin, PlaceholderPlugin],
				toolbar: ['bold', 'italic', 'underline', 'strikethrough', '|', 'numbered-list', 'bulleted-list', '|', 'link', 'image', 'video', 'smileys', '|', 'clear-format'],
				newLineMode: NewLineMode.MIXED
			};
		}
	}

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
	const Commands = {
		...AllCommands
	};
	const Constants = {
		...AllConstants
	};
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
	exports.RichText = RichText;
	exports.TextEditor = TextEditor;
	exports.TextEditorComponent = TextEditorComponent;

})(this.BX.UI.TextEditor = this.BX.UI.TextEditor || {}, window, window, BX, window, BX.UI.Lexical.Core, BX.UI.Lexical.Table, BX, BX.UI.Lexical.Link, BX.UI.CodeParser, BX.UI.IconSet, BX.UI.Lexical.Clipboard, BX.UI.Lexical.Selection, BX.UI.Lexical.Utils, BX.UI.BBCode, BX.UI.BBCode, BX.UI.Lexical.Extension, BX.Event, BX.Cache, BX.UI.Accessibility, BX.Main, BX.UI.Smiley, BX.UI.VideoService, BX.UI.Lexical.Html, BX.Collections, BX.UI.Lexical.Text, BX.UI.Lexical.History, BX.UI.Lexical.List, BX.UI.Lexical.RichText);
//# sourceMappingURL=text-editor.bundle.js.map
