/* eslint-disable */
this.BX = this.BX || {};
this.BX.UI = this.BX.UI || {};
(function (exports,ui_bbcode_parser,ui_textEditor,main_core_collections,ui_bbcode_model,ui_lexical_richText,ui_lexical_selection,ui_lexical_clipboard,ui_lexical_table,main_core_events,ui_lexical_history,main_popup,main_core_cache,ui_iconSet_editor,ui_lexical_list,ui_lexical_link,ui_lexical_text,ui_lexical_core,ui_lexical_utils,main_core) {
	'use strict';

	const HIDE_DIALOG_COMMAND = ui_lexical_core.createCommand('HIDE_DIALOG_COMMAND');
	const DIALOG_VISIBILITY_COMMAND = ui_lexical_core.createCommand('DIALOG_VISIBILITY_COMMAND');
	const DRAG_START_COMMAND = ui_lexical_core.createCommand('DRAG_START_COMMAND');
	const DRAG_END_COMMAND = ui_lexical_core.createCommand('DRAG_END_COMMAND');

	var AllCommands = /*#__PURE__*/Object.freeze({
		HIDE_DIALOG_COMMAND: HIDE_DIALOG_COMMAND,
		DIALOG_VISIBILITY_COMMAND: DIALOG_VISIBILITY_COMMAND,
		DRAG_START_COMMAND: DRAG_START_COMMAND,
		DRAG_END_COMMAND: DRAG_END_COMMAND
	});

	// Node flags
	const UNFORMATTED = 1;
	const NewLineMode = {
	  LINE_BREAK: 'line-break',
	  PARAGRAPH: 'paragraph',
	  MIXED: 'mixed'
	};

	var AllConstants = /*#__PURE__*/Object.freeze({
		UNFORMATTED: UNFORMATTED,
		NewLineMode: NewLineMode
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

	function $importFromBBCode(bbcode, editor, normalize = true) {
	  const scheme = editor.getBBCodeScheme();
	  const parser = new ui_bbcode_parser.BBCodeParser({
	    scheme
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
	  return normalize ? $normalizeTextNodes(lexicalNodes, editor) : lexicalNodes;
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
	function $normalizeTextNodes(lexicalNodes, editor) {
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
	  if (textNode.getParent().getName() !== 'code') {
	    textContent = textContent.replaceAll(/\s+/g, ' ');
	  }
	  if (textContent === '') {
	    return {
	      node: null
	    };
	  }
	  return {
	    node: ui_lexical_core.$createTextNode(textContent)
	  };
	}

	function trimLineBreaks(nodes) {
	  const trimmedNodes = [...nodes];
	  const firstNode = trimmedNodes[0];
	  const lastNode = trimmedNodes[trimmedNodes.length - 1];
	  if (ui_lexical_core.$isLineBreakNode(firstNode) || ui_lexical_core.$isParagraphNode(firstNode) && firstNode.isEmpty()) {
	    trimmedNodes.splice(0, 1);
	  }
	  if (ui_lexical_core.$isLineBreakNode(lastNode) || ui_lexical_core.$isParagraphNode(lastNode) && lastNode.isEmpty()) {
	    trimmedNodes.splice(-1, 1);
	  }
	  return trimmedNodes;
	}

	/* eslint-disable @bitrix24/bitrix24-rules/no-native-dom-methods */
	function $exportToBBCode(lexicalNode, editor) {
	  const scheme = editor.getBBCodeScheme();
	  const root = scheme.createRoot();
	  const topLevelChildren = trimLineBreaks(lexicalNode.getChildren());
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

	var _textEditor = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("textEditor");
	var _destroyed = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("destroyed");
	var _removeListeners = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("removeListeners");
	/**
	 * @memberof BX.UI.TextEditor
	 */
	class BasePlugin {
	  constructor(textEditor) {
	    Object.defineProperty(this, _textEditor, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _destroyed, {
	      writable: true,
	      value: false
	    });
	    Object.defineProperty(this, _removeListeners, {
	      writable: true,
	      value: () => {}
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _textEditor)[_textEditor] = textEditor;
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
	    return babelHelpers.classPrivateFieldLooseBase(this, _textEditor)[_textEditor];
	  }
	  getLexicalEditor() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _textEditor)[_textEditor].getLexicalEditor();
	  }
	  cleanUpRegister(...func) {
	    babelHelpers.classPrivateFieldLooseBase(this, _removeListeners)[_removeListeners] = ui_lexical_utils.mergeRegister(babelHelpers.classPrivateFieldLooseBase(this, _removeListeners)[_removeListeners], ...func);
	  }
	  isDestroyed() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _destroyed)[_destroyed];
	  }
	  destroy() {
	    babelHelpers.classPrivateFieldLooseBase(this, _destroyed)[_destroyed] = true;
	    babelHelpers.classPrivateFieldLooseBase(this, _removeListeners)[_removeListeners]();
	    babelHelpers.classPrivateFieldLooseBase(this, _removeListeners)[_removeListeners] = null;
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

	let _ = t => t,
	  _t;

	/**
	 * @memberof BX.UI.TextEditor
	 */
	var _format = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("format");
	var _blockType = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("blockType");
	var _active = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("active");
	var _disabled = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("disabled");
	var _disableInsideUnformatted = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("disableInsideUnformatted");
	var _disableCallback = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("disableCallback");
	var _container = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("container");
	var _handleClick = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleClick");
	class Button extends ToolbarItem {
	  constructor(...args) {
	    super(...args);
	    Object.defineProperty(this, _handleClick, {
	      value: _handleClick2
	    });
	    Object.defineProperty(this, _format, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _blockType, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _active, {
	      writable: true,
	      value: false
	    });
	    Object.defineProperty(this, _disabled, {
	      writable: true,
	      value: false
	    });
	    Object.defineProperty(this, _disableInsideUnformatted, {
	      writable: true,
	      value: false
	    });
	    Object.defineProperty(this, _disableCallback, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _container, {
	      writable: true,
	      value: null
	    });
	  }
	  setContent(content) {
	    if (main_core.Type.isString(content)) {
	      this.getContainer().innerHTML = content;
	    } else if (main_core.Type.isElementNode(content)) {
	      this.getContainer().append(content);
	    }
	  }
	  setFormat(format) {
	    babelHelpers.classPrivateFieldLooseBase(this, _format)[_format] = format;
	  }
	  getFormat() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _format)[_format];
	  }
	  hasFormat() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _format)[_format];
	  }
	  setBlockType(type) {
	    babelHelpers.classPrivateFieldLooseBase(this, _blockType)[_blockType] = type;
	  }
	  getBlockType() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _blockType)[_blockType];
	  }
	  setTooltip(tooltip) {
	    if (main_core.Type.isStringFilled(tooltip)) {
	      main_core.Dom.attr(this.getContainer(), 'title', main_core.Text.encode(tooltip));
	    } else if (tooltip === null) {
	      main_core.Dom.attr(this.getContainer(), 'title', null);
	    }
	  }
	  disableInsideUnformatted() {
	    babelHelpers.classPrivateFieldLooseBase(this, _disableInsideUnformatted)[_disableInsideUnformatted] = true;
	  }
	  enableInsideUnformatted() {
	    babelHelpers.classPrivateFieldLooseBase(this, _disableInsideUnformatted)[_disableInsideUnformatted] = false;
	  }
	  shouldDisableInsideUnformatted() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _disableInsideUnformatted)[_disableInsideUnformatted];
	  }
	  setActive(active = true) {
	    if (active === babelHelpers.classPrivateFieldLooseBase(this, _active)[_active]) {
	      return;
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _active)[_active] = active;
	    if (active) {
	      main_core.Dom.addClass(this.getContainer(), '--active');
	    } else {
	      main_core.Dom.removeClass(this.getContainer(), '--active');
	    }
	  }
	  isActive() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _active)[_active];
	  }
	  setDisabled(disabled = true) {
	    if (disabled === babelHelpers.classPrivateFieldLooseBase(this, _disabled)[_disabled]) {
	      return;
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _disabled)[_disabled] = disabled;
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
	    return babelHelpers.classPrivateFieldLooseBase(this, _disabled)[_disabled];
	  }
	  hasOwnDisableCallback() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _disableCallback)[_disableCallback] !== null;
	  }
	  setDisableCallback(fn) {
	    if (main_core.Type.isFunction(fn)) {
	      babelHelpers.classPrivateFieldLooseBase(this, _disableCallback)[_disableCallback] = fn;
	    }
	  }
	  invokeDisableCallback() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _disableCallback)[_disableCallback]();
	  }
	  getContainer() {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _container)[_container] === null) {
	      babelHelpers.classPrivateFieldLooseBase(this, _container)[_container] = main_core.Tag.render(_t || (_t = _`
				<button 
					type="button" 
					class="ui-text-editor-toolbar-button"
					onclick="${0}"
				>
				</button>
			`), babelHelpers.classPrivateFieldLooseBase(this, _handleClick)[_handleClick].bind(this));
	    }
	    return babelHelpers.classPrivateFieldLooseBase(this, _container)[_container];
	  }
	  render() {
	    return this.getContainer();
	  }
	}
	function _handleClick2() {
	  this.emit('onClick');
	}

	/* eslint-disable no-underscore-dangle, @bitrix24/bitrix24-rules/no-pseudo-private */
	class CustomParagraphNode extends ui_lexical_core.ParagraphNode {
	  constructor(__mode, key) {
	    super(key);
	    this.__mode = NewLineMode.MIXED;
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
	var _registerCommands = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("registerCommands");
	var _registerListeners = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("registerListeners");
	class ParagraphPlugin extends BasePlugin {
	  constructor(editor) {
	    super(editor);
	    Object.defineProperty(this, _registerListeners, {
	      value: _registerListeners2
	    });
	    Object.defineProperty(this, _registerCommands, {
	      value: _registerCommands2
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _registerCommands)[_registerCommands]();
	    babelHelpers.classPrivateFieldLooseBase(this, _registerListeners)[_registerListeners]();
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
	        conversion: node => convertParagraphNode(node),
	        priority: 0
	      }),
	      left: () => ({
	        conversion: node => convertParagraphNode(node),
	        priority: 0
	      }),
	      right: () => ({
	        conversion: node => convertParagraphNode(node),
	        priority: 0
	      }),
	      center: () => ({
	        conversion: node => convertParagraphNode(node),
	        priority: 0
	      }),
	      justify: () => ({
	        conversion: node => convertParagraphNode(node),
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
	}
	function _registerCommands2() {
	  this.cleanUpRegister(this.getEditor().registerCommand(FORMAT_PARAGRAPH_COMMAND, () => {
	    const selection = ui_lexical_core.$getSelection();
	    if (ui_lexical_core.$isRangeSelection(selection)) {
	      ui_lexical_selection.$setBlocksType(selection, () => ui_lexical_core.$createParagraphNode());
	    }
	    return true;
	  }, ui_lexical_core.COMMAND_PRIORITY_EDITOR));
	}
	function _registerListeners2() {
	  this.cleanUpRegister(this.getEditor().registerNodeTransform(ui_lexical_core.RootNode, root => {
	    const lastChild = root.getLastChild();
	    if (!ui_lexical_core.$isParagraphNode(lastChild)) {
	      root.append(ui_lexical_core.$createParagraphNode());
	    }
	  }));
	}
	function convertParagraphNode(bbcodeNode) {
	  return {
	    node: ui_lexical_core.$createParagraphNode(),
	    after: childLexicalNodes => {
	      return trimLineBreaks(childLexicalNodes);
	    }
	  };
	}



	var Paragraph = /*#__PURE__*/Object.freeze({
		FORMAT_PARAGRAPH_COMMAND: FORMAT_PARAGRAPH_COMMAND,
		ParagraphPlugin: ParagraphPlugin
	});

	/* eslint-disable no-underscore-dangle, @bitrix24/bitrix24-rules/no-pseudo-private */
	class CodeTokenNode extends ui_lexical_core.TextNode {
	  /** @internal */

	  constructor(text, highlightType, key) {
	    super(text, key);
	    this.__flags = UNFORMATTED;
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
	  constructor(...args) {
	    super(...args);
	    this.__language = 'lexical-hack';
	    this.__flags = UNFORMATTED;
	  }
	  static getType() {
	    return 'code';
	  }
	  static clone(node) {
	    return new CodeNode(node.__key);
	  }
	  createDOM(config, editor) {
	    var _config$theme;
	    const element = document.createElement('code');
	    element.setAttribute('spellcheck', 'false');
	    if (main_core.Type.isStringFilled(config == null ? void 0 : (_config$theme = config.theme) == null ? void 0 : _config$theme.code)) {
	      main_core.Dom.addClass(element, config.theme.code);
	    }
	    return element;
	  }
	  updateDOM(prevNode, anchor, config) {
	    return false;
	  }
	  exportDOM(editor) {
	    var _editor$_config, _editor$_config$theme;
	    const element = document.createElement('pre');
	    element.setAttribute('spellcheck', 'false');
	    if (main_core.Type.isStringFilled((_editor$_config = editor._config) == null ? void 0 : (_editor$_config$theme = _editor$_config.theme) == null ? void 0 : _editor$_config$theme.code)) {
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
	        var _split$getNextSibling;
	        (_split$getNextSibling = split.getNextSibling()) == null ? void 0 : _split$getNextSibling.selectNext(0, 0);
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

	const TokenType = {
	  WHITESPACE: 'whitespace',
	  // LINE_BREAK: 'line-break',
	  // TAB: 'tab',
	  SEMICOLON: 'semicolon',
	  OPERATOR: 'operator',
	  BRACE: 'brace',
	  BRACKET: 'bracket',
	  PARENTHESES: 'parentheses',
	  WORD: 'word',
	  REGEX: 'regex',
	  STRING_DOUBLE: 'string-double',
	  STRING_SINGLE: 'string-single',
	  STRING_TEMPLATE: 'string-template',
	  XML_COMMENT: 'comment-xml',
	  COMMENT_MULTILINE: 'comment-multiline',
	  COMMENT_SLASH: 'comment-slash',
	  COMMENT_HASH: 'comment-hash'
	};
	const CommentTokenTypes = new Set([TokenType.XML_COMMENT, TokenType.COMMENT_MULTILINE, TokenType.COMMENT_SLASH, TokenType.COMMENT_HASH]);
	const StringTokenTypes = new Set([TokenType.STRING_SINGLE, TokenType.STRING_DOUBLE, TokenType.STRING_TEMPLATE]);
	const keywords = new Set(['abstract', 'alias', 'and', 'arguments', 'array', 'asm', 'assert', 'auto', 'base', 'begin', 'bool', 'boolean', 'break', 'byte', 'case', 'catch', 'char', 'checked', 'class', 'clone', 'compl', 'const', 'continue', 'debugger', 'decimal', 'declare', 'def', 'default', 'defer', 'deinit', 'del', 'delegate', 'delete', 'do', 'double', 'echo', 'elif', 'else', 'elseif', 'elsif', 'end', 'ensure', 'enum', 'event', 'except', 'exec', 'explicit', 'export', 'extends', 'extension', 'extern', 'fallthrough', 'false', 'final', 'finally', 'fixed', 'float', 'for', 'foreach', 'friend', 'from', 'func', 'function', 'global', 'goto', 'guard', 'if', 'implements', 'implicit', 'import', 'include', 'include_once', 'init', 'inline', 'inout', 'instanceof', 'int', 'interface', 'internal', 'is', 'lambda', 'let', 'lock', 'long', 'module', 'mutable', 'namespace', 'NaN', 'native', 'new', 'next', 'nil', 'none', 'not', 'null', 'object', 'operator', 'or', 'out', 'override', 'package', 'params', 'pass', 'private', 'protected', 'protocol', 'public', 'raise', 'readonly', 'redo', 'ref', 'register', 'repeat', 'require', 'require_once', 'rescue', 'restrict', 'retry', 'return', 'sbyte', 'sealed', 'self', 'short', 'signed', 'sizeof', 'static', 'string', 'struct', 'subscript', 'super', 'switch', 'synchronized', 'template', 'then', 'this', 'throw', 'throws', 'transient', 'true', 'try', 'typealias', 'typedef', 'typeid', 'typename', 'typeof', 'unchecked', 'undef', 'undefined', 'union', 'unless', 'unsigned', 'until', 'use', 'using', 'var', 'virtual', 'void', 'volatile', 'wchar_t', 'when', 'where', 'while', 'with', 'xor', 'yield']);
	function normalizeTokenType(type, content) {
	  if (CommentTokenTypes.has(type)) {
	    return 'comment';
	  }
	  if (StringTokenTypes.has(type)) {
	    return 'string';
	  }
	  if (type === TokenType.WORD) {
	    if (keywords.has(content)) {
	      return 'keyword';
	    }
	    if (/\d+/.test(content)) {
	      return 'number';
	    }
	  }
	  return type;
	}
	const WORD_REGEX = /[\p{L}\p{N}0-9_$]/u;
	// const NON_WHITESPACE_REGEX = /[^\v\f \u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF]/;

	const parse = (text, merge = true) => {
	  let currentPosition = 0;
	  let nextChar = text[0];
	  let currentChar = 1;
	  let prevChar = null;
	  let beforePrevChar = null;
	  let tokenContent = '';
	  let tokenType = null;
	  let lastTokenType = null;
	  let isMultiChar = null;
	  const result = [];
	  const shouldFinalizeToken = () => {
	    if (!currentChar) {
	      // end of content
	      return true;
	    }
	    switch (tokenType) {
	      // case TokenType.LINE_BREAK:
	      // 	if (prevChar === '\r' && currentChar === '\n')
	      // 	{
	      // 		return false;
	      // 	}
	      //
	      // 	return true;
	      // case TokenType.TAB:
	      // 	return true;
	      case TokenType.WHITESPACE:
	        return /\S/.test(currentChar);
	      // return NON_WHITESPACE_REGEX.test(currentChar);
	      case TokenType.OPERATOR:
	      case TokenType.SEMICOLON:
	      case TokenType.BRACKET:
	      case TokenType.BRACE:
	      case TokenType.PARENTHESES:
	        return true;
	      case TokenType.WORD:
	        return !WORD_REGEX.test(currentChar);
	      case TokenType.REGEX:
	        return (prevChar === '/' || prevChar === '\n') && isMultiChar;
	      case TokenType.STRING_DOUBLE:
	        return prevChar === '"' && isMultiChar;
	      case TokenType.STRING_SINGLE:
	        return prevChar === '\'' && isMultiChar;
	      case TokenType.STRING_TEMPLATE:
	        return prevChar === '`' && isMultiChar;
	      case TokenType.XML_COMMENT:
	        return text[currentPosition - 4] + beforePrevChar + prevChar === '-->';
	      case TokenType.COMMENT_MULTILINE:
	        return beforePrevChar + prevChar === '*/';
	      case TokenType.COMMENT_SLASH:
	      case TokenType.COMMENT_HASH:
	        return currentChar === '\n';
	      default:
	        return false;
	    }
	  };
	  const getTokenType = () => {
	    if (currentChar === '#') {
	      return TokenType.COMMENT_HASH;
	    }
	    if (currentChar + nextChar === '//') {
	      return TokenType.COMMENT_SLASH;
	    }
	    if (currentChar + nextChar === '/*') {
	      return TokenType.COMMENT_MULTILINE;
	    }
	    if (currentChar + nextChar + text[currentPosition + 1] + text[currentPosition + 2] === '<!--') {
	      return TokenType.XML_COMMENT;
	    }
	    if (currentChar === '`') {
	      return TokenType.STRING_TEMPLATE;
	    }
	    if (currentChar === '\'') {
	      return TokenType.STRING_SINGLE;
	    }
	    if (currentChar === '"') {
	      return TokenType.STRING_DOUBLE;
	    }
	    if (currentChar === '/' && [TokenType.WHITESPACE, TokenType.OPERATOR].includes(lastTokenType) && prevChar !== '<') {
	      return TokenType.REGEX;
	    }
	    if (currentChar === '(' || currentChar === ')') {
	      return TokenType.PARENTHESES;
	    }
	    if (currentChar === '[' || currentChar === ']') {
	      return TokenType.BRACKET;
	    }
	    if (currentChar === '{' || currentChar === '}') {
	      return TokenType.BRACE;
	    }
	    if (WORD_REGEX.test(currentChar)) {
	      return TokenType.WORD;
	    }

	    // if (currentChar === '\n' || (currentChar === '\r' && nextChar === '\n'))
	    // {
	    // 	return TokenType.LINE_BREAK;
	    // }
	    //
	    // if (currentChar === '\t')
	    // {
	    // 	return TokenType.TAB;
	    // }

	    if (currentChar === ';') {
	      return TokenType.SEMICOLON;
	    }
	    if (/[!&*+,./:;<=>?@\\|~-]/.test(currentChar)) {
	      return TokenType.OPERATOR;
	    }
	    return TokenType.WHITESPACE;
	  };
	  while (prevChar = !CommentTokenTypes.has(tokenType) && prevChar === '\\' ? true : currentChar) {
	    currentChar = nextChar;
	    nextChar = text[++currentPosition];
	    isMultiChar = tokenContent.length > 1;
	    if (tokenType === null) {
	      tokenType = getTokenType();
	    }
	    if (shouldFinalizeToken()) {
	      if (tokenContent) {
	        result.push({
	          content: tokenContent,
	          type: normalizeTokenType(tokenType, tokenContent)
	        });
	      }
	      if (tokenType !== TokenType.WHITESPACE && !CommentTokenTypes.has(tokenType)) {
	        lastTokenType = tokenType;
	      }
	      tokenContent = '';
	      tokenType = getTokenType();
	    }
	    tokenContent += currentChar;
	    beforePrevChar = prevChar;
	  }
	  return merge ? mergeTokens(result) : result;
	};
	const mergeTokens = tokens => {
	  const result = [];
	  let prevToken = null;
	  tokens.forEach(token => {
	    // Merge sibling words into one word token
	    if ((token.type === 'whitespace' || token.type === 'word') && prevToken !== null && (prevToken.type === 'whitespace' || prevToken.type === 'word')) {
	      prevToken.type = 'word';
	      prevToken.content += token.content;
	      return;
	    }

	    // Merge operator like '===' or '++' into one token
	    if (token.type === 'operator' && prevToken !== null && prevToken.type === 'operator') {
	      prevToken.content += token.content;
	      return;
	    }
	    prevToken = token;
	    result.push(token);
	  });
	  return result;
	};

	/* eslint-disable no-underscore-dangle */
	const FORMAT_CODE_COMMAND = ui_lexical_core.createCommand('FORMAT_CODE_COMMAND');
	const INSERT_CODE_COMMAND = ui_lexical_core.createCommand('INSERT_CODE_COMMAND');
	var _nodesCurrentlyHighlighting = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("nodesCurrentlyHighlighting");
	var _registerComponents = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("registerComponents");
	var _registerListeners$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("registerListeners");
	var _registerCommands$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("registerCommands");
	var _handleCodeNodeTransform = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleCodeNodeTransform");
	var _handleTextNodeTransform = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleTextNodeTransform");
	var _handleTab = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleTab");
	var _handleMultilineIndent = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleMultilineIndent");
	class CodePlugin extends BasePlugin {
	  constructor(editor) {
	    super(editor);
	    Object.defineProperty(this, _handleMultilineIndent, {
	      value: _handleMultilineIndent2
	    });
	    Object.defineProperty(this, _handleTab, {
	      value: _handleTab2
	    });
	    Object.defineProperty(this, _handleTextNodeTransform, {
	      value: _handleTextNodeTransform2
	    });
	    Object.defineProperty(this, _handleCodeNodeTransform, {
	      value: _handleCodeNodeTransform2
	    });
	    Object.defineProperty(this, _registerCommands$1, {
	      value: _registerCommands2$1
	    });
	    Object.defineProperty(this, _registerListeners$1, {
	      value: _registerListeners2$1
	    });
	    Object.defineProperty(this, _registerComponents, {
	      value: _registerComponents2
	    });
	    Object.defineProperty(this, _nodesCurrentlyHighlighting, {
	      writable: true,
	      value: new Set()
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _registerCommands$1)[_registerCommands$1]();
	    babelHelpers.classPrivateFieldLooseBase(this, _registerComponents)[_registerComponents]();
	    babelHelpers.classPrivateFieldLooseBase(this, _registerListeners$1)[_registerListeners$1]();
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
	              const childNodes = trimLineBreaks(childLexicalNodes);
	              const content = childNodes.map(childNode => childNode.getTextContent()).join('');

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
	}
	function _registerComponents2() {
	  this.getEditor().getComponentRegistry().register('code', () => {
	    const button = new Button();
	    button.setContent('<span class="ui-icon-set --enclose-text-in-code-tag"></span>');
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
	function _registerListeners2$1() {
	  const handleTextNodeTransform = babelHelpers.classPrivateFieldLooseBase(this, _handleTextNodeTransform)[_handleTextNodeTransform].bind(this);
	  this.cleanUpRegister(
	  // Prevent formatting
	  this.getEditor().registerNodeTransform(CodeNode, babelHelpers.classPrivateFieldLooseBase(this, _handleCodeNodeTransform)[_handleCodeNodeTransform].bind(this)), this.getEditor().registerNodeTransform(ui_lexical_core.TextNode, handleTextNodeTransform), this.getEditor().registerNodeTransform(CodeTokenNode, handleTextNodeTransform), this.getEditor().registerCommand(ui_lexical_core.FORMAT_TEXT_COMMAND, () => {
	    const selection = ui_lexical_core.$getSelection();
	    if (!ui_lexical_core.$isRangeSelection(selection)) {
	      return false;
	    }
	    const node = getSelectedNode(selection);
	    // const parent = node.getParent();

	    return $isCodeTokenNode(node) || $isCodeNode(node);
	  }, ui_lexical_core.COMMAND_PRIORITY_HIGH), this.getEditor().registerCommand(ui_lexical_core.KEY_TAB_COMMAND, event => {
	    const command = babelHelpers.classPrivateFieldLooseBase(this, _handleTab)[_handleTab](event.shiftKey);
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
	  }, ui_lexical_core.COMMAND_PRIORITY_LOW), this.getEditor().registerCommand(ui_lexical_core.INDENT_CONTENT_COMMAND, payload => babelHelpers.classPrivateFieldLooseBase(this, _handleMultilineIndent)[_handleMultilineIndent](ui_lexical_core.INDENT_CONTENT_COMMAND), ui_lexical_core.COMMAND_PRIORITY_NORMAL), this.getEditor().registerCommand(ui_lexical_core.OUTDENT_CONTENT_COMMAND, payload => babelHelpers.classPrivateFieldLooseBase(this, _handleMultilineIndent)[_handleMultilineIndent](ui_lexical_core.OUTDENT_CONTENT_COMMAND), ui_lexical_core.COMMAND_PRIORITY_NORMAL), this.getEditor().registerCommand(ui_lexical_core.PASTE_COMMAND, event => {
	    const selection = ui_lexical_core.$getSelection();
	    if (!ui_lexical_core.$isRangeSelection(selection) || !(event instanceof ClipboardEvent) || event.clipboardData === null) {
	      return false;
	    }
	    const codeNode = ui_lexical_utils.$findMatchingParent(selection.anchor.getNode(), node => $isCodeNode(node));
	    if (codeNode) {
	      ui_lexical_clipboard.$insertDataTransferForPlainText(event.clipboardData, selection);
	      return true;
	    }
	    return false;
	  }, ui_lexical_core.COMMAND_PRIORITY_LOW));
	}
	function _registerCommands2$1() {
	  this.cleanUpRegister(this.getEditor().registerCommand(INSERT_CODE_COMMAND, payload => {
	    const codeNode = $createCodeNode();
	    if (main_core.Type.isPlainObject(payload) && main_core.Type.isStringFilled(payload.content)) {
	      const tokenNodes = getCodeTokenNodes(parse(payload.content));
	      codeNode.append(...tokenNodes);
	      ui_lexical_utils.$insertNodeToNearestRoot(codeNode);
	    } else {
	      ui_lexical_utils.$insertNodeToNearestRoot(codeNode);
	      codeNode.selectEnd();
	    }
	    return true;
	  }, ui_lexical_core.COMMAND_PRIORITY_EDITOR), this.getEditor().registerCommand(FORMAT_CODE_COMMAND, () => {
	    const selection = ui_lexical_core.$getSelection();
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
	  }, ui_lexical_core.COMMAND_PRIORITY_EDITOR));
	}
	function _handleCodeNodeTransform2(node) {
	  const nodeKey = node.getKey();
	  if (babelHelpers.classPrivateFieldLooseBase(this, _nodesCurrentlyHighlighting)[_nodesCurrentlyHighlighting].has(nodeKey)) {
	    return;
	  }
	  babelHelpers.classPrivateFieldLooseBase(this, _nodesCurrentlyHighlighting)[_nodesCurrentlyHighlighting].add(nodeKey);

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
	      const codeTokenNodes = getCodeTokenNodes(parse(code));
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
	      babelHelpers.classPrivateFieldLooseBase(this, _nodesCurrentlyHighlighting)[_nodesCurrentlyHighlighting].delete(nodeKey);
	    },
	    skipTransforms: true
	  });
	}
	function _handleTextNodeTransform2(node) {
	  // Since CodeNode has flat children structure we only need to check
	  // if node's parent is a code node and run highlighting if so
	  const parentNode = node.getParent();
	  if ($isCodeNode(parentNode)) {
	    babelHelpers.classPrivateFieldLooseBase(this, _handleCodeNodeTransform)[_handleCodeNodeTransform](parentNode);
	  } else if ($isCodeTokenNode(node)) {
	    // When code block converted into paragraph or other element
	    // code token nodes converted back to normal text
	    node.replace(ui_lexical_core.$createTextNode(node.__text));
	  }
	}
	function _handleTab2(shiftKey) {
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
	function _handleMultilineIndent2(type) {
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
		FORMAT_CODE_COMMAND: FORMAT_CODE_COMMAND,
		INSERT_CODE_COMMAND: INSERT_CODE_COMMAND,
		CodePlugin: CodePlugin,
		getFirstCodeNodeOfLine: getFirstCodeNodeOfLine,
		getLastCodeNodeOfLine: getLastCodeNodeOfLine,
		CodeNode: CodeNode,
		$createCodeNode: $createCodeNode,
		$isCodeNode: $isCodeNode,
		CodeTokenNode: CodeTokenNode,
		$createCodeTokenNode: $createCodeTokenNode,
		$isCodeTokenNode: $isCodeTokenNode
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
	  const unregisterListener = editor.registerUpdateListener(() => {
	    isSelected = isNodeSelected(editor, key);
	    for (const subscribeFunc of subscribers) {
	      subscribeFunc(isSelected);
	    }
	  });
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

	var _textEditor$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("textEditor");
	var _target = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("target");
	var _nodeKey = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("nodeKey");
	var _options = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("options");
	var _nodeSelection = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("nodeSelection");
	var _unregisterCommands = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("unregisterCommands");
	var _registerCommands$2 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("registerCommands");
	var _handleDelete = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleDelete");
	class DecoratorComponent {
	  constructor(componentOptions) {
	    Object.defineProperty(this, _handleDelete, {
	      value: _handleDelete2
	    });
	    Object.defineProperty(this, _registerCommands$2, {
	      value: _registerCommands2$2
	    });
	    Object.defineProperty(this, _textEditor$1, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _target, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _nodeKey, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _options, {
	      writable: true,
	      value: {}
	    });
	    Object.defineProperty(this, _nodeSelection, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _unregisterCommands, {
	      writable: true,
	      value: null
	    });
	    const {
	      textEditor,
	      target,
	      nodeKey,
	      options
	    } = componentOptions;
	    babelHelpers.classPrivateFieldLooseBase(this, _textEditor$1)[_textEditor$1] = textEditor;
	    babelHelpers.classPrivateFieldLooseBase(this, _target)[_target] = target;
	    babelHelpers.classPrivateFieldLooseBase(this, _nodeKey)[_nodeKey] = nodeKey;
	    babelHelpers.classPrivateFieldLooseBase(this, _options)[_options] = options;
	    babelHelpers.classPrivateFieldLooseBase(this, _nodeSelection)[_nodeSelection] = createNodeSelection(this.getEditor(), this.getNodeKey());
	    babelHelpers.classPrivateFieldLooseBase(this, _nodeSelection)[_nodeSelection].onSelect(selected => {
	      if (selected) {
	        main_core.Dom.addClass(this.getTarget(), '--selected');
	      } else {
	        main_core.Dom.removeClass(this.getTarget(), '--selected');
	      }
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _unregisterCommands)[_unregisterCommands] = babelHelpers.classPrivateFieldLooseBase(this, _registerCommands$2)[_registerCommands$2]();
	  }
	  update(options) {
	    // update
	  }
	  destroy() {
	    babelHelpers.classPrivateFieldLooseBase(this, _nodeSelection)[_nodeSelection].dispose();
	    babelHelpers.classPrivateFieldLooseBase(this, _unregisterCommands)[_unregisterCommands]();
	  }
	  getEditor() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _textEditor$1)[_textEditor$1];
	  }
	  getNodeKey() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _nodeKey)[_nodeKey];
	  }
	  getTarget() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _target)[_target];
	  }
	  getNodeSelection() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _nodeSelection)[_nodeSelection];
	  }
	  isSelected() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _nodeSelection)[_nodeSelection].isSelected();
	  }
	  setSelected(selected) {
	    babelHelpers.classPrivateFieldLooseBase(this, _nodeSelection)[_nodeSelection].setSelected(selected);
	  }
	  getOptions() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _options)[_options];
	  }
	  getOption(option, defaultValue) {
	    if (!main_core.Type.isUndefined(babelHelpers.classPrivateFieldLooseBase(this, _options)[_options][option])) {
	      return babelHelpers.classPrivateFieldLooseBase(this, _options)[_options][option];
	    }
	    if (!main_core.Type.isUndefined(defaultValue)) {
	      return defaultValue;
	    }
	    return null;
	  }
	}
	function _registerCommands2$2() {
	  return ui_lexical_utils.mergeRegister(this.getEditor().registerCommand(ui_lexical_core.CLICK_COMMAND, event => {
	    if (this.getTarget().contains(event.target)) {
	      if (event.shiftKey) {
	        babelHelpers.classPrivateFieldLooseBase(this, _nodeSelection)[_nodeSelection].setSelected(!babelHelpers.classPrivateFieldLooseBase(this, _nodeSelection)[_nodeSelection].isSelected());
	      } else {
	        babelHelpers.classPrivateFieldLooseBase(this, _nodeSelection)[_nodeSelection].clearSelection();
	        babelHelpers.classPrivateFieldLooseBase(this, _nodeSelection)[_nodeSelection].setSelected(true);
	      }
	      return true;
	    }
	    return false;
	  }, ui_lexical_core.COMMAND_PRIORITY_LOW), this.getEditor().registerCommand(ui_lexical_core.KEY_DELETE_COMMAND, babelHelpers.classPrivateFieldLooseBase(this, _handleDelete)[_handleDelete].bind(this), ui_lexical_core.COMMAND_PRIORITY_LOW), this.getEditor().registerCommand(ui_lexical_core.KEY_BACKSPACE_COMMAND, babelHelpers.classPrivateFieldLooseBase(this, _handleDelete)[_handleDelete].bind(this), ui_lexical_core.COMMAND_PRIORITY_LOW));
	}
	function _handleDelete2(event) {
	  if (babelHelpers.classPrivateFieldLooseBase(this, _nodeSelection)[_nodeSelection].isSelected() && ui_lexical_core.$isNodeSelection(ui_lexical_core.$getSelection())) {
	    event.preventDefault();
	    const node = ui_lexical_core.$getNodeByKey(this.getNodeKey());
	    babelHelpers.classPrivateFieldLooseBase(this, _nodeSelection)[_nodeSelection].setSelected(false);
	    if (node) {
	      node.remove();
	      return true;
	    }
	  }
	  return false;
	}

	let _$1 = t => t,
	  _t$1,
	  _t2;
	function clamp(value, min, max) {
	  return Math.min(Math.max(value, min), max);
	}
	const Direction = {
	  EAST: 1,
	  SOUTH: 2,
	  WEST: 4,
	  NORTH: 8
	};
	var _positioning = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("positioning");
	var _freeTransform = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("freeTransform");
	var _onPointerDownHandler = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onPointerDownHandler");
	var _onPointerMoveHandler = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onPointerMoveHandler");
	var _onPointerUpHandler = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onPointerUpHandler");
	var _container$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("container");
	var _target$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("target");
	var _editor = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("editor");
	var _maxWidth = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("maxWidth");
	var _maxHeight = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("maxHeight");
	var _minWidth = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("minWidth");
	var _minHeight = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("minHeight");
	var _handlePointerDown = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handlePointerDown");
	var _handlePointerMove = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handlePointerMove");
	var _handlePointerUp = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handlePointerUp");
	var _getMaxContainerWidth = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getMaxContainerWidth");
	var _getMaxContainerHeight = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getMaxContainerHeight");
	class FigureResizer extends main_core_events.EventEmitter {
	  constructor({
	    target: _target2,
	    editor,
	    minWidth,
	    minHeight,
	    maxWidth: _maxWidth2,
	    maxHeight,
	    events,
	    freeTransform
	  }) {
	    super();
	    Object.defineProperty(this, _getMaxContainerHeight, {
	      value: _getMaxContainerHeight2
	    });
	    Object.defineProperty(this, _getMaxContainerWidth, {
	      value: _getMaxContainerWidth2
	    });
	    Object.defineProperty(this, _handlePointerUp, {
	      value: _handlePointerUp2
	    });
	    Object.defineProperty(this, _handlePointerMove, {
	      value: _handlePointerMove2
	    });
	    Object.defineProperty(this, _handlePointerDown, {
	      value: _handlePointerDown2
	    });
	    Object.defineProperty(this, _positioning, {
	      writable: true,
	      value: {
	        currentHeight: 0,
	        currentWidth: 0,
	        direction: 0,
	        isResizing: false,
	        ratio: 0,
	        startHeight: 0,
	        startWidth: 0,
	        startX: 0,
	        startY: 0
	      }
	    });
	    Object.defineProperty(this, _freeTransform, {
	      writable: true,
	      value: false
	    });
	    Object.defineProperty(this, _onPointerDownHandler, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _onPointerMoveHandler, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _onPointerUpHandler, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _container$1, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _target$1, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _editor, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _maxWidth, {
	      writable: true,
	      value: 'none'
	    });
	    Object.defineProperty(this, _maxHeight, {
	      writable: true,
	      value: 'none'
	    });
	    Object.defineProperty(this, _minWidth, {
	      writable: true,
	      value: 100
	    });
	    Object.defineProperty(this, _minHeight, {
	      writable: true,
	      value: 100
	    });
	    this.setEventNamespace('BX.UI.TextEditor.FigureResizer');
	    babelHelpers.classPrivateFieldLooseBase(this, _target$1)[_target$1] = _target2;
	    babelHelpers.classPrivateFieldLooseBase(this, _editor)[_editor] = editor;
	    babelHelpers.classPrivateFieldLooseBase(this, _minWidth)[_minWidth] = Math.min(babelHelpers.classPrivateFieldLooseBase(this, _minWidth)[_minWidth], main_core.Type.isNumber(minWidth) ? minWidth : Infinity);
	    babelHelpers.classPrivateFieldLooseBase(this, _minHeight)[_minHeight] = Math.min(babelHelpers.classPrivateFieldLooseBase(this, _minHeight)[_minHeight], main_core.Type.isNumber(minHeight) ? minHeight : Infinity);
	    babelHelpers.classPrivateFieldLooseBase(this, _maxWidth)[_maxWidth] = main_core.Type.isNumber(_maxWidth2) ? _maxWidth2 : 'none';
	    babelHelpers.classPrivateFieldLooseBase(this, _maxHeight)[_maxHeight] = main_core.Type.isNumber(maxHeight) ? maxHeight : 'none';
	    babelHelpers.classPrivateFieldLooseBase(this, _freeTransform)[_freeTransform] = freeTransform === true;
	    babelHelpers.classPrivateFieldLooseBase(this, _onPointerDownHandler)[_onPointerDownHandler] = babelHelpers.classPrivateFieldLooseBase(this, _handlePointerDown)[_handlePointerDown].bind(this);
	    babelHelpers.classPrivateFieldLooseBase(this, _onPointerMoveHandler)[_onPointerMoveHandler] = babelHelpers.classPrivateFieldLooseBase(this, _handlePointerMove)[_handlePointerMove].bind(this);
	    babelHelpers.classPrivateFieldLooseBase(this, _onPointerUpHandler)[_onPointerUpHandler] = babelHelpers.classPrivateFieldLooseBase(this, _handlePointerUp)[_handlePointerUp].bind(this);
	    this.subscribeFromOptions(events);
	  }
	  show() {
	    main_core.Dom.addClass(this.getContainer(), '--shown');
	  }
	  hide() {
	    main_core.Dom.removeClass(this.getContainer(), '--shown');
	  }
	  getContainer() {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _container$1)[_container$1] === null) {
	      const freeTransform = main_core.Tag.render(_t$1 || (_t$1 = _$1`
				<div
					class="ui-text-editor-figure-resizer-handle --north"
					data-direction="${0}"
					onpointerdown="${0}"
					></div>
				<div
					class="ui-text-editor-figure-resizer-handle --east"
					data-direction="${0}"
					onpointerdown="${0}"
					></div>
				<div
					class="ui-text-editor-figure-resizer-handle --south"
					data-direction="${0}"
					onpointerdown="${0}"
					></div>
				<div
					class="ui-text-editor-figure-resizer-handle --west"
					data-direction="${0}"
					onpointerdown="${0}"
					></div>
			`), Direction.NORTH, babelHelpers.classPrivateFieldLooseBase(this, _onPointerDownHandler)[_onPointerDownHandler], Direction.EAST, babelHelpers.classPrivateFieldLooseBase(this, _onPointerDownHandler)[_onPointerDownHandler], Direction.SOUTH, babelHelpers.classPrivateFieldLooseBase(this, _onPointerDownHandler)[_onPointerDownHandler], Direction.WEST, babelHelpers.classPrivateFieldLooseBase(this, _onPointerDownHandler)[_onPointerDownHandler]);
	      babelHelpers.classPrivateFieldLooseBase(this, _container$1)[_container$1] = main_core.Tag.render(_t2 || (_t2 = _$1`
				<div class="ui-text-editor-figure-resizer">
					<div
						class="ui-text-editor-figure-resizer-handle --north-east"
						data-direction="${0}" 
						onpointerdown="${0}"
					></div>
					<div
						class="ui-text-editor-figure-resizer-handle --south-east"
						data-direction="${0}" 
						onpointerdown="${0}"
						></div>
					<div
						class="ui-text-editor-figure-resizer-handle --south-west"
						data-direction="${0}" 
						onpointerdown="${0}"
						></div>
					<div 
						class="ui-text-editor-figure-resizer-handle --north-west"
						data-direction="${0}" 
						onpointerdown="${0}"
						></div>
					${0}
				</div>
			`), Direction.NORTH | Direction.EAST, babelHelpers.classPrivateFieldLooseBase(this, _onPointerDownHandler)[_onPointerDownHandler], Direction.SOUTH | Direction.EAST, babelHelpers.classPrivateFieldLooseBase(this, _onPointerDownHandler)[_onPointerDownHandler], Direction.SOUTH | Direction.WEST, babelHelpers.classPrivateFieldLooseBase(this, _onPointerDownHandler)[_onPointerDownHandler], Direction.NORTH | Direction.WEST, babelHelpers.classPrivateFieldLooseBase(this, _onPointerDownHandler)[_onPointerDownHandler], babelHelpers.classPrivateFieldLooseBase(this, _freeTransform)[_freeTransform] ? freeTransform : null);
	    }
	    return babelHelpers.classPrivateFieldLooseBase(this, _container$1)[_container$1];
	  }
	  getTarget() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _target$1)[_target$1];
	  }
	  setTarget(target) {
	    babelHelpers.classPrivateFieldLooseBase(this, _target$1)[_target$1] = target;
	  }
	  getEditor() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _editor)[_editor];
	  }
	  isResizing() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _positioning)[_positioning].isResizing;
	  }
	}
	function _handlePointerDown2(event) {
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
	  babelHelpers.classPrivateFieldLooseBase(this, _positioning)[_positioning].startWidth = width;
	  babelHelpers.classPrivateFieldLooseBase(this, _positioning)[_positioning].startHeight = height;
	  babelHelpers.classPrivateFieldLooseBase(this, _positioning)[_positioning].ratio = width / height;
	  babelHelpers.classPrivateFieldLooseBase(this, _positioning)[_positioning].currentWidth = width;
	  babelHelpers.classPrivateFieldLooseBase(this, _positioning)[_positioning].currentHeight = height;
	  babelHelpers.classPrivateFieldLooseBase(this, _positioning)[_positioning].startX = event.clientX;
	  babelHelpers.classPrivateFieldLooseBase(this, _positioning)[_positioning].startY = event.clientY;
	  babelHelpers.classPrivateFieldLooseBase(this, _positioning)[_positioning].isResizing = true;
	  babelHelpers.classPrivateFieldLooseBase(this, _positioning)[_positioning].direction = direction;

	  // setStartCursor(direction);
	  this.emit('onResizeStart');
	  main_core.Dom.addClass(this.getContainer(), '--resizing');
	  main_core.Dom.style(target, {
	    width: `${width}px`,
	    height: `${height}px`
	  });
	  main_core.Event.bind(document, 'pointermove', babelHelpers.classPrivateFieldLooseBase(this, _onPointerMoveHandler)[_onPointerMoveHandler]);
	  main_core.Event.bind(document, 'pointerup', babelHelpers.classPrivateFieldLooseBase(this, _onPointerUpHandler)[_onPointerUpHandler]);
	}
	function _handlePointerMove2(event) {
	  const target = this.getTarget();
	  const isHorizontal = babelHelpers.classPrivateFieldLooseBase(this, _positioning)[_positioning].direction & (Direction.EAST | Direction.WEST);
	  const isVertical = babelHelpers.classPrivateFieldLooseBase(this, _positioning)[_positioning].direction & (Direction.SOUTH | Direction.NORTH);
	  if (babelHelpers.classPrivateFieldLooseBase(this, _positioning)[_positioning].isResizing) {
	    // Corner cursor
	    if (isHorizontal && isVertical) {
	      let diff = Math.floor(babelHelpers.classPrivateFieldLooseBase(this, _positioning)[_positioning].startX - event.clientX);
	      diff = babelHelpers.classPrivateFieldLooseBase(this, _positioning)[_positioning].direction & Direction.EAST ? -diff : diff;
	      const width = Math.round(clamp(babelHelpers.classPrivateFieldLooseBase(this, _positioning)[_positioning].startWidth + diff, babelHelpers.classPrivateFieldLooseBase(this, _minWidth)[_minWidth], babelHelpers.classPrivateFieldLooseBase(this, _getMaxContainerWidth)[_getMaxContainerWidth]()));
	      const height = Math.ceil(width / babelHelpers.classPrivateFieldLooseBase(this, _positioning)[_positioning].ratio);
	      main_core.Dom.style(target, {
	        width: `${width}px`,
	        height: `${height}px`
	      });
	      this.emit('onResize', {
	        width,
	        height
	      });
	      babelHelpers.classPrivateFieldLooseBase(this, _positioning)[_positioning].currentHeight = height;
	      babelHelpers.classPrivateFieldLooseBase(this, _positioning)[_positioning].currentWidth = width;
	    } else if (isVertical) {
	      let diff = Math.floor(babelHelpers.classPrivateFieldLooseBase(this, _positioning)[_positioning].startY - event.clientY);
	      diff = babelHelpers.classPrivateFieldLooseBase(this, _positioning)[_positioning].direction & Direction.SOUTH ? -diff : diff;
	      const height = Math.round(clamp(babelHelpers.classPrivateFieldLooseBase(this, _positioning)[_positioning].startHeight + diff, babelHelpers.classPrivateFieldLooseBase(this, _minHeight)[_minHeight], babelHelpers.classPrivateFieldLooseBase(this, _getMaxContainerHeight)[_getMaxContainerHeight]()));
	      main_core.Dom.style(target, 'height', `${height}px`);
	      this.emit('onResize', {
	        width: babelHelpers.classPrivateFieldLooseBase(this, _positioning)[_positioning].currentWidth,
	        height
	      });
	      babelHelpers.classPrivateFieldLooseBase(this, _positioning)[_positioning].currentHeight = height;
	    } else {
	      let diff = Math.floor(babelHelpers.classPrivateFieldLooseBase(this, _positioning)[_positioning].startX - event.clientX);
	      diff = babelHelpers.classPrivateFieldLooseBase(this, _positioning)[_positioning].direction & Direction.EAST ? -diff : diff;
	      const width = Math.round(clamp(babelHelpers.classPrivateFieldLooseBase(this, _positioning)[_positioning].startWidth + diff, babelHelpers.classPrivateFieldLooseBase(this, _minWidth)[_minWidth], babelHelpers.classPrivateFieldLooseBase(this, _getMaxContainerWidth)[_getMaxContainerWidth]()));
	      main_core.Dom.style(target, 'width', `${width}px`);
	      this.emit('onResize', {
	        width,
	        height: babelHelpers.classPrivateFieldLooseBase(this, _positioning)[_positioning].currentHeight
	      });
	      babelHelpers.classPrivateFieldLooseBase(this, _positioning)[_positioning].currentWidth = width;
	    }
	  }
	}
	function _handlePointerUp2() {
	  if (babelHelpers.classPrivateFieldLooseBase(this, _positioning)[_positioning].isResizing) {
	    setTimeout(() => {
	      const width = babelHelpers.classPrivateFieldLooseBase(this, _positioning)[_positioning].currentWidth;
	      const height = babelHelpers.classPrivateFieldLooseBase(this, _positioning)[_positioning].currentHeight;
	      babelHelpers.classPrivateFieldLooseBase(this, _positioning)[_positioning].startWidth = 0;
	      babelHelpers.classPrivateFieldLooseBase(this, _positioning)[_positioning].startHeight = 0;
	      babelHelpers.classPrivateFieldLooseBase(this, _positioning)[_positioning].ratio = 0;
	      babelHelpers.classPrivateFieldLooseBase(this, _positioning)[_positioning].startX = 0;
	      babelHelpers.classPrivateFieldLooseBase(this, _positioning)[_positioning].startY = 0;
	      babelHelpers.classPrivateFieldLooseBase(this, _positioning)[_positioning].currentWidth = 0;
	      babelHelpers.classPrivateFieldLooseBase(this, _positioning)[_positioning].currentHeight = 0;
	      babelHelpers.classPrivateFieldLooseBase(this, _positioning)[_positioning].isResizing = false;
	      main_core.Dom.removeClass(this.getContainer(), '--resizing');
	      this.emit('onResizeEnd', {
	        width,
	        height
	      });
	      // setEndCursor();

	      main_core.Event.unbind(document, 'pointermove', babelHelpers.classPrivateFieldLooseBase(this, _onPointerMoveHandler)[_onPointerMoveHandler]);
	      main_core.Event.unbind(document, 'pointerup', babelHelpers.classPrivateFieldLooseBase(this, _onPointerUpHandler)[_onPointerUpHandler]);
	    }, 200);
	  }
	}
	function _getMaxContainerWidth2() {
	  const maxWidth = main_core.Type.isNumber(babelHelpers.classPrivateFieldLooseBase(this, _maxWidth)[_maxWidth]) ? babelHelpers.classPrivateFieldLooseBase(this, _maxWidth)[_maxWidth] : Infinity;
	  const editorRootElement = this.getEditor().getRootElement();
	  if (editorRootElement !== null) {
	    return Math.min(editorRootElement.getBoundingClientRect().width - 20, maxWidth);
	  }
	  return 100;
	}
	function _getMaxContainerHeight2() {
	  if (main_core.Type.isNumber(babelHelpers.classPrivateFieldLooseBase(this, _maxHeight)[_maxHeight])) {
	    return babelHelpers.classPrivateFieldLooseBase(this, _maxHeight)[_maxHeight];
	  }
	  const editorRootElement = this.getEditor().getRootElement();
	  if (editorRootElement !== null) {
	    return editorRootElement.getBoundingClientRect().height - 20;
	  }
	  return 100;
	}

	let _$2 = t => t,
	  _t$2,
	  _t2$1;
	var _refs = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("refs");
	var _figureResizer = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("figureResizer");
	var _render = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("render");
	var _getContainer = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getContainer");
	var _getImageContainer = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getImageContainer");
	var _setDraggable = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("setDraggable");
	var _handleResizeStart = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleResizeStart");
	var _handleResizeEnd = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleResizeEnd");
	class FileImageComponent extends DecoratorComponent {
	  constructor(options) {
	    super(options);
	    Object.defineProperty(this, _handleResizeEnd, {
	      value: _handleResizeEnd2
	    });
	    Object.defineProperty(this, _handleResizeStart, {
	      value: _handleResizeStart2
	    });
	    Object.defineProperty(this, _setDraggable, {
	      value: _setDraggable2
	    });
	    Object.defineProperty(this, _getImageContainer, {
	      value: _getImageContainer2
	    });
	    Object.defineProperty(this, _getContainer, {
	      value: _getContainer2
	    });
	    Object.defineProperty(this, _render, {
	      value: _render2
	    });
	    Object.defineProperty(this, _refs, {
	      writable: true,
	      value: new main_core_cache.MemoryCache()
	    });
	    Object.defineProperty(this, _figureResizer, {
	      writable: true,
	      value: null
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _figureResizer)[_figureResizer] = new FigureResizer({
	      target: this.getImage(),
	      editor: this.getEditor(),
	      minWidth: this.getOption('width'),
	      minHeight: this.getOption('height'),
	      maxWidth: this.getOption('maxWidth'),
	      maxHeight: this.getOption('maxHeight'),
	      events: {
	        onResizeStart: babelHelpers.classPrivateFieldLooseBase(this, _handleResizeStart)[_handleResizeStart].bind(this),
	        onResizeEnd: babelHelpers.classPrivateFieldLooseBase(this, _handleResizeEnd)[_handleResizeEnd].bind(this)
	      }
	    });
	    this.getNodeSelection().onSelect(selected => {
	      if (selected || babelHelpers.classPrivateFieldLooseBase(this, _figureResizer)[_figureResizer].isResizing()) {
	        main_core.Dom.addClass(babelHelpers.classPrivateFieldLooseBase(this, _getContainer)[_getContainer](), '--selected');
	        babelHelpers.classPrivateFieldLooseBase(this, _figureResizer)[_figureResizer].show();
	      } else {
	        main_core.Dom.removeClass(babelHelpers.classPrivateFieldLooseBase(this, _getContainer)[_getContainer](), '--selected');
	        babelHelpers.classPrivateFieldLooseBase(this, _figureResizer)[_figureResizer].hide();
	      }
	      const draggable = selected && !babelHelpers.classPrivateFieldLooseBase(this, _figureResizer)[_figureResizer].isResizing();
	      babelHelpers.classPrivateFieldLooseBase(this, _setDraggable)[_setDraggable](draggable);
	    });
	    this.update(this.getOptions());
	    babelHelpers.classPrivateFieldLooseBase(this, _render)[_render]();
	  }
	  getImage() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _refs)[_refs].remember('image', () => {
	      const img = document.createElement('img');
	      img.draggable = false;
	      img.src = this.getOption('src');
	      return img;
	    });
	  }
	  update(options) {
	    const width = `${options.width}px`;
	    // const height = `${options.height}px`;
	    // const maxWidth = `${options.maxWidth}px`;
	    // const maxHeight = `${options.maxHeight}px`;

	    main_core.Dom.style(this.getImage(), {
	      width,
	      height: 'auto'
	    });
	  }
	}
	function _render2() {
	  main_core.Dom.append(babelHelpers.classPrivateFieldLooseBase(this, _getContainer)[_getContainer](), this.getTarget());
	}
	function _getContainer2() {
	  return babelHelpers.classPrivateFieldLooseBase(this, _refs)[_refs].remember('container', () => {
	    const figureResizer = babelHelpers.classPrivateFieldLooseBase(this, _figureResizer)[_figureResizer].getContainer();
	    return main_core.Tag.render(_t$2 || (_t$2 = _$2`
				<div class="ui-text-editor-file-image-component">
					${0}
					${0}
				</div>
			`), babelHelpers.classPrivateFieldLooseBase(this, _getImageContainer)[_getImageContainer](), figureResizer);
	  });
	}
	function _getImageContainer2() {
	  return babelHelpers.classPrivateFieldLooseBase(this, _refs)[_refs].remember('image-container', () => {
	    return main_core.Tag.render(_t2$1 || (_t2$1 = _$2`
				<div class="ui-text-editor-file-image-container">
					${0}
				</div>
			`), this.getImage());
	  });
	}
	function _setDraggable2(draggable) {
	  main_core.Dom.attr(babelHelpers.classPrivateFieldLooseBase(this, _getImageContainer)[_getImageContainer](), {
	    draggable
	  });
	  if (draggable) {
	    main_core.Dom.addClass(babelHelpers.classPrivateFieldLooseBase(this, _getContainer)[_getContainer](), '--draggable');
	  } else {
	    main_core.Dom.removeClass(babelHelpers.classPrivateFieldLooseBase(this, _getContainer)[_getContainer](), '--draggable');
	  }
	}
	function _handleResizeStart2(event) {
	  babelHelpers.classPrivateFieldLooseBase(this, _setDraggable)[_setDraggable](false);
	  this.setSelected(true);
	}
	function _handleResizeEnd2(event) {
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
	    var _config$theme, _config$theme$file;
	    const span = document.createElement('span');
	    if (main_core.Type.isStringFilled(config == null ? void 0 : (_config$theme = config.theme) == null ? void 0 : (_config$theme$file = _config$theme.file) == null ? void 0 : _config$theme$file.image)) {
	      main_core.Dom.addClass(span, config.theme.file.image);
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
	        maxHeight: this.getHeight()
	        // maxWidth: this.__info.previewWidth,
	        // maxHeight: this.__info.previewHeight,
	      }
	    };
	  }

	  isInline() {
	    return true;
	  }
	}
	FileImageNode.useDecoratorComponent = true;
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
	    var _config$theme, _config$theme$file;
	    const span = document.createElement('span');
	    if (main_core.Type.isStringFilled(config == null ? void 0 : (_config$theme = config.theme) == null ? void 0 : (_config$theme$file = _config$theme.file) == null ? void 0 : _config$theme$file.file)) {
	      main_core.Dom.addClass(span, config.theme.file.file);
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

	let _$3 = t => t,
	  _t$3,
	  _t2$2;
	var _refs$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("refs");
	var _render$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("render");
	var _getContainer$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getContainer");
	var _getVideoContainer = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getVideoContainer");
	var _setDraggable$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("setDraggable");
	class FileVideoComponent extends DecoratorComponent {
	  constructor(options) {
	    super(options);
	    Object.defineProperty(this, _setDraggable$1, {
	      value: _setDraggable2$1
	    });
	    Object.defineProperty(this, _getVideoContainer, {
	      value: _getVideoContainer2
	    });
	    Object.defineProperty(this, _getContainer$1, {
	      value: _getContainer2$1
	    });
	    Object.defineProperty(this, _render$1, {
	      value: _render2$1
	    });
	    Object.defineProperty(this, _refs$1, {
	      writable: true,
	      value: new main_core_cache.MemoryCache()
	    });
	    this.getNodeSelection().onSelect(selected => {
	      if (selected) {
	        main_core.Dom.addClass(babelHelpers.classPrivateFieldLooseBase(this, _getContainer$1)[_getContainer$1](), '--selected');
	      } else {
	        main_core.Dom.removeClass(babelHelpers.classPrivateFieldLooseBase(this, _getContainer$1)[_getContainer$1](), '--selected');
	      }
	      babelHelpers.classPrivateFieldLooseBase(this, _setDraggable$1)[_setDraggable$1](selected);
	    });
	    this.update(this.getOptions());
	    babelHelpers.classPrivateFieldLooseBase(this, _render$1)[_render$1]();
	  }
	  update(options) {
	    // void
	  }
	}
	function _render2$1() {
	  main_core.Dom.append(babelHelpers.classPrivateFieldLooseBase(this, _getContainer$1)[_getContainer$1](), this.getTarget());
	}
	function _getContainer2$1() {
	  return babelHelpers.classPrivateFieldLooseBase(this, _refs$1)[_refs$1].remember('container', () => {
	    return main_core.Tag.render(_t$3 || (_t$3 = _$3`
				<div class="ui-text-editor-file-video-component">
					${0}
				</div>
			`), babelHelpers.classPrivateFieldLooseBase(this, _getVideoContainer)[_getVideoContainer]());
	  });
	}
	function _getVideoContainer2() {
	  return babelHelpers.classPrivateFieldLooseBase(this, _refs$1)[_refs$1].remember('video-container', () => {
	    return main_core.Tag.render(_t2$2 || (_t2$2 = _$3`
				<div class="ui-text-editor-file-video-container"></div>
			`));
	  });
	}
	function _setDraggable2$1(draggable) {
	  main_core.Dom.attr(babelHelpers.classPrivateFieldLooseBase(this, _getVideoContainer)[_getVideoContainer](), {
	    draggable
	  });
	  if (draggable) {
	    main_core.Dom.addClass(babelHelpers.classPrivateFieldLooseBase(this, _getContainer$1)[_getContainer$1](), '--draggable');
	  } else {
	    main_core.Dom.removeClass(babelHelpers.classPrivateFieldLooseBase(this, _getContainer$1)[_getContainer$1](), '--draggable');
	  }
	}

	/* eslint-disable no-underscore-dangle, @bitrix24/bitrix24-rules/no-pseudo-private */

	/** @memberof BX.UI.TextEditor.Plugins.File */
	class FileVideoNode extends ui_lexical_core.DecoratorNode {
	  constructor(serverFileId, info, key) {
	    super(key);
	    this.__serverFileId = serverFileId;
	    this.__info = main_core.Type.isPlainObject(info) ? info : {};
	  }
	  static getType() {
	    return 'file-video';
	  }
	  static clone(node) {
	    return new FileVideoNode(node.__serverFileId, node.__info, node.__key);
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
	  static importJSON(serializedNode) {
	    return $createFileVideoNode(serializedNode.serverFileId, serializedNode.info);
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
	      type: 'file-video',
	      version: 1
	    };
	  }
	  createDOM(config, editor) {
	    var _config$theme, _config$theme$file;
	    const div = document.createElement('span');
	    if (main_core.Type.isStringFilled(config == null ? void 0 : (_config$theme = config.theme) == null ? void 0 : (_config$theme$file = _config$theme.file) == null ? void 0 : _config$theme$file.video)) {
	      main_core.Dom.addClass(div, config.theme.file.video);
	    }
	    return div;
	  }
	  updateDOM(prevNode, anchor, config) {
	    return false;
	  }
	  decorate(editor, config) {
	    return {
	      componentClass: FileVideoComponent,
	      options: {}
	    };
	  }
	  isInline() {
	    return true;
	  }
	}
	FileVideoNode.useDecoratorComponent = true;
	function $createFileVideoNode(serverFileId, info = {}) {
	  const node = new FileVideoNode(serverFileId, info);
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

	let _$4 = t => t,
	  _t$4;
	const DRAG_DATA_FORMAT = 'application/x-lexical-drag-image';
	const TRANSPARENT_IMAGE = main_core.Tag.render(_t$4 || (_t$4 = _$4`<img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7">`));
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
	  dataTransfer.setData(DRAG_DATA_FORMAT, JSON.stringify({
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
	  var _event$dataTransfer;
	  const dragData = (_event$dataTransfer = event.dataTransfer) == null ? void 0 : _event$dataTransfer.getData(DRAG_DATA_FORMAT);
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
	var _enabled = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("enabled");
	var _mode = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("mode");
	var _files = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("files");
	var _registerListeners$2 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("registerListeners");
	class FilePlugin extends BasePlugin {
	  constructor(editor) {
	    super(editor);
	    Object.defineProperty(this, _registerListeners$2, {
	      value: _registerListeners2$2
	    });
	    Object.defineProperty(this, _enabled, {
	      writable: true,
	      value: false
	    });
	    Object.defineProperty(this, _mode, {
	      writable: true,
	      value: 'file'
	    });
	    Object.defineProperty(this, _files, {
	      writable: true,
	      value: new Map()
	    });
	    const modeOption = editor.getOption('file.mode');
	    babelHelpers.classPrivateFieldLooseBase(this, _enabled)[_enabled] = ['file', 'disk'].includes(modeOption);
	    if (!babelHelpers.classPrivateFieldLooseBase(this, _enabled)[_enabled]) {
	      return;
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _mode)[_mode] = modeOption;
	    const _files2 = editor.getOption('file.files', []);
	    this.addFiles(_files2);
	    babelHelpers.classPrivateFieldLooseBase(this, _registerListeners$2)[_registerListeners$2]();
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
	          const serverFileId = node.getAttribute('id');
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
	          const fileType = this.getFileType(info);
	          if (fileType === FileType.IMAGE) {
	            const width = main_core.Text.toInteger(node.getAttribute('width'));
	            const height = main_core.Text.toInteger(node.getAttribute('height'));
	            return {
	              node: $createFileImageNode(serverFileId, info, width, height)
	            };
	          }
	          if (fileType === FileType.VIDEO) {
	            return {
	              node: $createFileVideoNode(serverFileId, info)
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
	        return {
	          node: scheme.createElement({
	            name: this.getMode(),
	            attributes,
	            inline: false
	          })
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
	    return babelHelpers.classPrivateFieldLooseBase(this, _enabled)[_enabled];
	  }
	  getMode() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _mode)[_mode];
	  }
	  addFile(file) {
	    if (main_core.Type.isPlainObject(file) && (main_core.Type.isStringFilled(file.serverFileId) || main_core.Type.isNumber(file.serverFileId))) {
	      const serverFileId = file.serverFileId.toString();
	      if (!babelHelpers.classPrivateFieldLooseBase(this, _files)[_files].has(serverFileId)) {
	        babelHelpers.classPrivateFieldLooseBase(this, _files)[_files].set(file.serverFileId.toString(), file);
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
	      return babelHelpers.classPrivateFieldLooseBase(this, _files)[_files].get(serverFileId.toString()) || null;
	    }
	    return null;
	  }
	  getFileType(file) {
	    if (file != null && file.isImage) {
	      return FileType.IMAGE;
	    }
	    if (file != null && file.isVideo) {
	      return FileType.VIDEO;
	    }
	    return FileType.FILE;
	  }
	  removeFile(serverFileId, skipHistoryStack = true) {
	    if (main_core.Type.isStringFilled(serverFileId) || main_core.Type.isNumber(serverFileId)) {
	      babelHelpers.classPrivateFieldLooseBase(this, _files)[_files].delete(serverFileId.toString());
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
	}
	function _registerListeners2$2() {
	  this.cleanUpRegister(this.getEditor().registerCommand(INSERT_FILE_COMMAND, payload => {
	    if (!main_core.Type.isPlainObject(payload) || !main_core.Type.isPlainObject(payload.info) || !main_core.Type.isNumber(payload.serverFileId) && !main_core.Type.isStringFilled(payload.serverFileId)) {
	      return false;
	    }
	    this.addFile(payload.info);
	    const fileType = this.getFileType(payload.info);
	    let node = null;
	    if (fileType === FileType.IMAGE) {
	      const previewWidth = payload.info.previewWidth;
	      const previewHeight = payload.info.previewHeight;
	      const renderWidth = payload.width;
	      const renderHeight = payload.height;
	      const ratioWidth = renderWidth / previewWidth;
	      const ratioHeight = renderHeight / previewHeight;
	      const ratio = Math.min(ratioWidth, ratioHeight);
	      const useOriginalSize = ratio > 1; // image is too small
	      const width = useOriginalSize ? previewWidth : previewWidth * ratio;
	      const height = useOriginalSize ? previewHeight : previewHeight * ratio;
	      node = $createFileImageNode(payload.serverFileId, payload.info, width, height);
	    } else if (fileType === FileType.VIDEO) {
	      node = $createFileVideoNode(payload.serverFileId, payload.info);
	    } else {
	      node = $createFileNode(payload.serverFileId, payload.info);
	    }

	    // const selection: RangeSelection = $getSelection();
	    // if ($isRangeSelection(selection) && fileType !== FileType.FILE && payload.inline !== true)
	    // {
	    // 	const focus: PointType = selection.focus;
	    // 	const focusNode: TextNode | ElementNode = focus.getNode();
	    // 	if (!selection.isCollapsed())
	    // 	{
	    // 		focusNode.selectEnd();
	    // 	}
	    //
	    // 	const parentNode: ParagraphNode = $findMatchingParent(
	    // 		focusNode,
	    // 		(parent: ElementNode) => $isParagraphNode(parent),
	    // 	);
	    //
	    // 	if (parentNode === null)
	    // 	{
	    // 		$insertNodes([node]);
	    // 		if ($isRootOrShadowRoot(node.getParentOrThrow()))
	    // 		{
	    // 			$wrapNodeInElement(node, $createParagraphNode).selectEnd();
	    // 		}
	    // 	}
	    // 	else if (parentNode.isEmpty())
	    // 	{
	    // 		parentNode.append(node);
	    // 		node.selectEnd();
	    // 	}
	    // 	else
	    // 	{
	    // 		// const paragraph = $createParagraphNode();
	    // 		// paragraph.append(node);
	    // 		// parentNode.insertAfter(paragraph);
	    // 		parentNode.append($createLineBreakNode());
	    // 		parentNode.append(node);
	    // 		node.selectEnd();
	    // 	}
	    // }
	    // else
	    // {
	    // 	$insertNodes([node]);
	    // 	if ($isRootOrShadowRoot(node.getParentOrThrow()))
	    // 	{
	    // 		$wrapNodeInElement(node, $createParagraphNode).selectEnd();
	    // 	}
	    // }

	    ui_lexical_core.$insertNodes([node]);
	    if (ui_lexical_core.$isRootOrShadowRoot(node.getParentOrThrow())) {
	      ui_lexical_utils.$wrapNodeInElement(node, ui_lexical_core.$createParagraphNode).selectEnd();
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



	var File = /*#__PURE__*/Object.freeze({
		FileImageNode: FileImageNode,
		$createFileImageNode: $createFileImageNode,
		$isFileImageNode: $isFileImageNode,
		FileImageComponent: FileImageComponent,
		FileNode: FileNode,
		$createFileNode: $createFileNode,
		$isFileNode: $isFileNode,
		FileVideoNode: FileVideoNode,
		$createFileVideoNode: $createFileVideoNode,
		$isFileVideoNode: $isFileVideoNode,
		FileType: FileType,
		ADD_FILE_COMMAND: ADD_FILE_COMMAND,
		ADD_FILES_COMMAND: ADD_FILES_COMMAND,
		INSERT_FILE_COMMAND: INSERT_FILE_COMMAND,
		REMOVE_FILE_COMMAND: REMOVE_FILE_COMMAND,
		GET_INSERTED_FILES_COMMAND: GET_INSERTED_FILES_COMMAND,
		FilePlugin: FilePlugin
	});

	function validateImageUrl(url) {
	  return /^(http:|https:|ftp:|blob:|\/)/i.test(url);
	}

	let _$5 = t => t,
	  _t$5,
	  _t2$3;
	var _refs$2 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("refs");
	var _figureResizer$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("figureResizer");
	var _maxWidth$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("maxWidth");
	var _render$2 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("render");
	var _getContainer$2 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getContainer");
	var _getImageContainer$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getImageContainer");
	var _setDraggable$2 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("setDraggable");
	var _handleResizeStart$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleResizeStart");
	var _handleResizeEnd$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleResizeEnd");
	class ImageComponent extends DecoratorComponent {
	  constructor(options) {
	    super(options);
	    Object.defineProperty(this, _handleResizeEnd$1, {
	      value: _handleResizeEnd2$1
	    });
	    Object.defineProperty(this, _handleResizeStart$1, {
	      value: _handleResizeStart2$1
	    });
	    Object.defineProperty(this, _setDraggable$2, {
	      value: _setDraggable2$2
	    });
	    Object.defineProperty(this, _getImageContainer$1, {
	      value: _getImageContainer2$1
	    });
	    Object.defineProperty(this, _getContainer$2, {
	      value: _getContainer2$2
	    });
	    Object.defineProperty(this, _render$2, {
	      value: _render2$2
	    });
	    Object.defineProperty(this, _refs$2, {
	      writable: true,
	      value: new main_core_cache.MemoryCache()
	    });
	    Object.defineProperty(this, _figureResizer$1, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _maxWidth$1, {
	      writable: true,
	      value: 'none'
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _figureResizer$1)[_figureResizer$1] = new FigureResizer({
	      target: this.getImage(),
	      editor: this.getEditor(),
	      maxWidth: this.getMaxWidth(),
	      events: {
	        onResizeStart: babelHelpers.classPrivateFieldLooseBase(this, _handleResizeStart$1)[_handleResizeStart$1].bind(this),
	        onResizeEnd: babelHelpers.classPrivateFieldLooseBase(this, _handleResizeEnd$1)[_handleResizeEnd$1].bind(this)
	      }
	    });
	    this.getNodeSelection().onSelect(selected => {
	      if (selected || babelHelpers.classPrivateFieldLooseBase(this, _figureResizer$1)[_figureResizer$1].isResizing()) {
	        main_core.Dom.addClass(babelHelpers.classPrivateFieldLooseBase(this, _getContainer$2)[_getContainer$2](), '--selected');
	        babelHelpers.classPrivateFieldLooseBase(this, _figureResizer$1)[_figureResizer$1].show();
	      } else {
	        main_core.Dom.removeClass(babelHelpers.classPrivateFieldLooseBase(this, _getContainer$2)[_getContainer$2](), '--selected');
	        babelHelpers.classPrivateFieldLooseBase(this, _figureResizer$1)[_figureResizer$1].hide();
	      }
	      const draggable = selected && !babelHelpers.classPrivateFieldLooseBase(this, _figureResizer$1)[_figureResizer$1].isResizing();
	      babelHelpers.classPrivateFieldLooseBase(this, _setDraggable$2)[_setDraggable$2](draggable);
	    });
	    this.update(this.getOptions());
	    babelHelpers.classPrivateFieldLooseBase(this, _render$2)[_render$2]();
	  }
	  getImage() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _refs$2)[_refs$2].remember('image', () => {
	      const img = document.createElement('img');
	      img.draggable = false;
	      img.src = this.getOption('src');
	      return img;
	    });
	  }
	  getMaxWidth() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _maxWidth$1)[_maxWidth$1];
	  }
	  update(options) {
	    const width = main_core.Type.isNumber(options.width) ? `${options.width}px` : 'inherit';
	    const height = main_core.Type.isNumber(options.height) ? `${options.height}px` : 'inherit';
	    const maxWidth = main_core.Type.isNumber(options.maxWidth) ? `${options.maxWidth}px` : null;
	    babelHelpers.classPrivateFieldLooseBase(this, _maxWidth$1)[_maxWidth$1] = options.maxWidth;
	    main_core.Dom.style(this.getImage(), {
	      width,
	      height,
	      maxWidth
	    });
	  }
	}
	function _render2$2() {
	  main_core.Dom.append(babelHelpers.classPrivateFieldLooseBase(this, _getContainer$2)[_getContainer$2](), this.getTarget());
	}
	function _getContainer2$2() {
	  return babelHelpers.classPrivateFieldLooseBase(this, _refs$2)[_refs$2].remember('container', () => {
	    const figureResizer = babelHelpers.classPrivateFieldLooseBase(this, _figureResizer$1)[_figureResizer$1].getContainer();
	    return main_core.Tag.render(_t$5 || (_t$5 = _$5`
				<div class="ui-text-editor-image-component">
					${0}
					${0}
				</div>
			`), babelHelpers.classPrivateFieldLooseBase(this, _getImageContainer$1)[_getImageContainer$1](), figureResizer);
	  });
	}
	function _getImageContainer2$1() {
	  return babelHelpers.classPrivateFieldLooseBase(this, _refs$2)[_refs$2].remember('image-container', () => {
	    return main_core.Tag.render(_t2$3 || (_t2$3 = _$5`
				<div class="ui-text-editor-image-container">
					${0}
				</div>
			`), this.getImage());
	  });
	}
	function _setDraggable2$2(draggable) {
	  main_core.Dom.attr(babelHelpers.classPrivateFieldLooseBase(this, _getImageContainer$1)[_getImageContainer$1](), {
	    draggable
	  });
	  if (draggable) {
	    main_core.Dom.addClass(babelHelpers.classPrivateFieldLooseBase(this, _getContainer$2)[_getContainer$2](), '--draggable');
	  } else {
	    main_core.Dom.removeClass(babelHelpers.classPrivateFieldLooseBase(this, _getContainer$2)[_getContainer$2](), '--draggable');
	  }
	}
	function _handleResizeStart2$1(event) {
	  babelHelpers.classPrivateFieldLooseBase(this, _setDraggable$2)[_setDraggable$2](false);
	  this.setSelected(true);
	}
	function _handleResizeEnd2$1(event) {
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

	/* eslint-disable no-underscore-dangle, @bitrix24/bitrix24-rules/no-pseudo-private */
	class ImageNode extends ui_lexical_core.DecoratorNode {
	  constructor(src, width, height, maxWidth, key) {
	    super(key);
	    this.__width = 'inherit';
	    this.__height = 'inherit';
	    this.__maxWidth = 'none';
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
	    const className = theme.image;
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
	        maxWidth: this.getMaxWidth()
	      }
	    };
	  }
	  isInline() {
	    return true;
	  }
	}
	ImageNode.useDecoratorComponent = true;
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
	const editorPadding = 16;
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

	  // Try to fit a popup within a scroll area
	  if (left - offsetLeft < scrollerRect.left) {
	    // Left boundary
	    const overflow = scrollerRect.left - (left - offsetLeft);
	    offsetLeft -= overflow + editorPadding;
	  } else if (scrollerRect.right < left + popupWidth - offsetLeft) {
	    // Right boundary
	    offsetLeft += left + popupWidth - offsetLeft - scrollerRect.right + editorPadding;
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

	let _$6 = t => t,
	  _t$6,
	  _t2$4;
	var _popup = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("popup");
	var _imageUrl = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("imageUrl");
	var _targetContainer = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("targetContainer");
	var _refs$3 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("refs");
	var _handleSaveBtnClick = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleSaveBtnClick");
	var _handleTextBoxKeyDown = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleTextBoxKeyDown");
	var _handleCancelBtnClick = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleCancelBtnClick");
	class ImageDialog extends main_core_events.EventEmitter {
	  constructor(options) {
	    super();
	    Object.defineProperty(this, _handleCancelBtnClick, {
	      value: _handleCancelBtnClick2
	    });
	    Object.defineProperty(this, _handleTextBoxKeyDown, {
	      value: _handleTextBoxKeyDown2
	    });
	    Object.defineProperty(this, _handleSaveBtnClick, {
	      value: _handleSaveBtnClick2
	    });
	    Object.defineProperty(this, _popup, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _imageUrl, {
	      writable: true,
	      value: ''
	    });
	    Object.defineProperty(this, _targetContainer, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _refs$3, {
	      writable: true,
	      value: new main_core_cache.MemoryCache()
	    });
	    this.setEventNamespace('BX.UI.TextEditor.ImageDialog');
	    const imageDialogOptions = main_core.Type.isPlainObject(options) ? options : {};
	    this.setTargetContainer(imageDialogOptions.targetContainer);
	    this.subscribeFromOptions(imageDialogOptions.events);
	  }
	  show(options = {}) {
	    var _options$target;
	    const target = (_options$target = options.target) != null ? _options$target : undefined;
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
	    return babelHelpers.classPrivateFieldLooseBase(this, _popup)[_popup] !== null && babelHelpers.classPrivateFieldLooseBase(this, _popup)[_popup].isShown();
	  }
	  destroy() {
	    this.getPopup().destroy();
	  }
	  setImageUrl(url) {
	    if (main_core.Type.isString(url)) {
	      babelHelpers.classPrivateFieldLooseBase(this, _imageUrl)[_imageUrl] = sanitizeUrl(url);
	    }
	  }
	  getImageUrl() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _imageUrl)[_imageUrl];
	  }
	  setTargetContainer(container) {
	    if (main_core.Type.isElementNode(container)) {
	      babelHelpers.classPrivateFieldLooseBase(this, _targetContainer)[_targetContainer] = container;
	    }
	  }
	  getTargetContainer() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _targetContainer)[_targetContainer];
	  }
	  getPopup() {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _popup)[_popup] === null) {
	      babelHelpers.classPrivateFieldLooseBase(this, _popup)[_popup] = new main_popup.Popup({
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
	    return babelHelpers.classPrivateFieldLooseBase(this, _popup)[_popup];
	  }
	  getContainer() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _refs$3)[_refs$3].remember('container', () => {
	      return main_core.Tag.render(_t$6 || (_t$6 = _$6`
				<div class="ui-text-editor-image-dialog">
					<div class="ui-text-editor-image-dialog-form">
						<div class="ui-ctl ui-ctl-textbox ui-ctl-s ui-ctl-inline ui-ctl-w100 ui-text-editor-image-dialog-textbox">
							<div class="ui-ctl-tag">${0}</div>
							${0}
						</div>
						<button type="button" 
							class="ui-text-editor-image-dialog-button" 
							onclick="${0}"
						>
							<span class="ui-icon-set --check"></span>
						</button>
						<button 
							type="button" 
							class="ui-text-editor-image-dialog-button"
							onclick="${0}"
						>
							<span class="ui-icon-set --cross-60"></span>
						</button>
					</div>
				</div>
			`), main_core.Loc.getMessage('TEXT_EDITOR_IMAGE_URL'), this.getUrlTextBox(), babelHelpers.classPrivateFieldLooseBase(this, _handleSaveBtnClick)[_handleSaveBtnClick].bind(this), babelHelpers.classPrivateFieldLooseBase(this, _handleCancelBtnClick)[_handleCancelBtnClick].bind(this));
	    });
	  }
	  getUrlTextBox() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _refs$3)[_refs$3].remember('url-textbox', () => {
	      return main_core.Tag.render(_t2$4 || (_t2$4 = _$6`
				<input 
					type="text"
					class="ui-ctl-element"
					placeholder="https://example.com/image.jpeg"
					value="${0}"
					onkeydown="${0}"
				>
			`), this.getImageUrl(), babelHelpers.classPrivateFieldLooseBase(this, _handleTextBoxKeyDown)[_handleTextBoxKeyDown].bind(this));
	    });
	  }
	}
	function _handleSaveBtnClick2() {
	  const url = this.getUrlTextBox().value.trim();
	  if (url.length > 0) {
	    this.setImageUrl(url);
	    this.emit('onSave');
	  } else {
	    this.getUrlTextBox().focus();
	  }
	}
	function _handleTextBoxKeyDown2(event) {
	  if (event.key === 'Enter') {
	    event.preventDefault();
	    babelHelpers.classPrivateFieldLooseBase(this, _handleSaveBtnClick)[_handleSaveBtnClick]();
	  }
	}
	function _handleCancelBtnClick2() {
	  this.emit('onCancel');
	}

	const INSERT_IMAGE_COMMAND = ui_lexical_core.createCommand('INSERT_IMAGE_COMMAND');
	const INSERT_IMAGE_DIALOG_COMMAND = ui_lexical_core.createCommand('INSERT_IMAGE_DIALOG_COMMAND');
	var _imageDialog = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("imageDialog");
	var _onEditorScroll = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onEditorScroll");
	var _lastSelection = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("lastSelection");
	var _registerCommands$3 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("registerCommands");
	var _restoreSelection = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("restoreSelection");
	var _handleDialogDestroy = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleDialogDestroy");
	var _handleEditorScroll = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleEditorScroll");
	var _registerComponents$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("registerComponents");
	class ImagePlugin extends BasePlugin {
	  constructor(editor) {
	    super(editor);
	    Object.defineProperty(this, _registerComponents$1, {
	      value: _registerComponents2$1
	    });
	    Object.defineProperty(this, _handleEditorScroll, {
	      value: _handleEditorScroll2
	    });
	    Object.defineProperty(this, _handleDialogDestroy, {
	      value: _handleDialogDestroy2
	    });
	    Object.defineProperty(this, _restoreSelection, {
	      value: _restoreSelection2
	    });
	    Object.defineProperty(this, _registerCommands$3, {
	      value: _registerCommands2$3
	    });
	    Object.defineProperty(this, _imageDialog, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _onEditorScroll, {
	      writable: true,
	      value: babelHelpers.classPrivateFieldLooseBase(this, _handleEditorScroll)[_handleEditorScroll].bind(this)
	    });
	    Object.defineProperty(this, _lastSelection, {
	      writable: true,
	      value: null
	    });
	    this.cleanUpRegister(babelHelpers.classPrivateFieldLooseBase(this, _registerCommands$3)[_registerCommands$3](), registerDraggableNode(this.getEditor(), ImageNode, data => {
	      this.getEditor().dispatchCommand(INSERT_IMAGE_COMMAND, data);
	    }));
	    babelHelpers.classPrivateFieldLooseBase(this, _registerComponents$1)[_registerComponents$1]();
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
	  destroy() {
	    super.destroy();
	    if (babelHelpers.classPrivateFieldLooseBase(this, _imageDialog)[_imageDialog] !== null) {
	      babelHelpers.classPrivateFieldLooseBase(this, _imageDialog)[_imageDialog].destroy();
	    }
	  }
	}
	function _registerCommands2$3() {
	  return ui_lexical_utils.mergeRegister(this.getEditor().registerCommand(INSERT_IMAGE_COMMAND, payload => {
	    if (!validateImageUrl(payload == null ? void 0 : payload.src)) {
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
	    babelHelpers.classPrivateFieldLooseBase(this, _lastSelection)[_lastSelection] = selection.clone();
	    if (babelHelpers.classPrivateFieldLooseBase(this, _imageDialog)[_imageDialog] !== null) {
	      babelHelpers.classPrivateFieldLooseBase(this, _imageDialog)[_imageDialog].destroy();
	    }
	    this.getEditor().dispatchCommand(HIDE_DIALOG_COMMAND);
	    babelHelpers.classPrivateFieldLooseBase(this, _imageDialog)[_imageDialog] = new ImageDialog({
	      // for an embedded popup: document.body -> this.getEditor().getScrollerContainer()
	      targetContainer: document.body,
	      events: {
	        onSave: () => {
	          const url = babelHelpers.classPrivateFieldLooseBase(this, _imageDialog)[_imageDialog].getImageUrl();
	          if (!main_core.Type.isStringFilled(url)) {
	            babelHelpers.classPrivateFieldLooseBase(this, _imageDialog)[_imageDialog].hide();
	            return;
	          }
	          this.getEditor().dispatchCommand(INSERT_IMAGE_COMMAND, {
	            src: url
	          });
	          babelHelpers.classPrivateFieldLooseBase(this, _imageDialog)[_imageDialog].hide();
	        },
	        onCancel: () => {
	          babelHelpers.classPrivateFieldLooseBase(this, _imageDialog)[_imageDialog].hide();
	        },
	        onClose: () => {
	          babelHelpers.classPrivateFieldLooseBase(this, _handleDialogDestroy)[_handleDialogDestroy]();
	        },
	        onDestroy: () => {
	          babelHelpers.classPrivateFieldLooseBase(this, _handleDialogDestroy)[_handleDialogDestroy]();
	        },
	        onShow: () => {
	          if ($adjustDialogPosition(babelHelpers.classPrivateFieldLooseBase(this, _imageDialog)[_imageDialog].getPopup(), this.getEditor())) {
	            main_core.Event.bind(this.getEditor().getScrollerContainer(), 'scroll', babelHelpers.classPrivateFieldLooseBase(this, _onEditorScroll)[_onEditorScroll]);
	            this.getEditor().highlightSelection();
	          }
	        },
	        onAfterShow: () => {
	          babelHelpers.classPrivateFieldLooseBase(this, _imageDialog)[_imageDialog].getUrlTextBox().focus();
	        }
	      }
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _imageDialog)[_imageDialog].show();
	    return true;
	  }, ui_lexical_core.COMMAND_PRIORITY_LOW), this.getEditor().registerCommand(HIDE_DIALOG_COMMAND, () => {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _imageDialog)[_imageDialog] !== null) {
	      babelHelpers.classPrivateFieldLooseBase(this, _imageDialog)[_imageDialog].destroy();
	    }
	    return false;
	  }, ui_lexical_core.COMMAND_PRIORITY_LOW), this.getEditor().registerCommand(DIALOG_VISIBILITY_COMMAND, () => {
	    return babelHelpers.classPrivateFieldLooseBase(this, _imageDialog)[_imageDialog] !== null && babelHelpers.classPrivateFieldLooseBase(this, _imageDialog)[_imageDialog].isShown();
	  }, ui_lexical_core.COMMAND_PRIORITY_LOW));
	}
	function _restoreSelection2() {
	  const selection = ui_lexical_core.$getSelection();
	  if (!ui_lexical_core.$isRangeSelection(selection) && babelHelpers.classPrivateFieldLooseBase(this, _lastSelection)[_lastSelection] !== null) {
	    ui_lexical_core.$setSelection(babelHelpers.classPrivateFieldLooseBase(this, _lastSelection)[_lastSelection]);
	    babelHelpers.classPrivateFieldLooseBase(this, _lastSelection)[_lastSelection] = null;
	    return true;
	  }
	  return false;
	}
	function _handleDialogDestroy2() {
	  babelHelpers.classPrivateFieldLooseBase(this, _imageDialog)[_imageDialog] = null;
	  main_core.Event.unbind(this.getEditor().getScrollerContainer(), 'scroll', babelHelpers.classPrivateFieldLooseBase(this, _onEditorScroll)[_onEditorScroll]);
	  this.getEditor().resetHighlightSelection();
	  this.getEditor().update(() => {
	    if (!babelHelpers.classPrivateFieldLooseBase(this, _restoreSelection)[_restoreSelection]()) {
	      this.getEditor().focus();
	    }
	  });
	}
	function _handleEditorScroll2() {
	  this.getEditor().update(() => {
	    $adjustDialogPosition(babelHelpers.classPrivateFieldLooseBase(this, _imageDialog)[_imageDialog].getPopup(), this.getEditor());
	  });
	}
	function _registerComponents2$1() {
	  this.getEditor().getComponentRegistry().register('image', () => {
	    const button = new Button();
	    button.setContent('<span class="ui-icon-set --incert-image"></span>');
	    button.setTooltip(main_core.Loc.getMessage('TEXT_EDITOR_BTN_IMAGE'));
	    button.disableInsideUnformatted();
	    button.subscribe('onClick', () => {
	      if (babelHelpers.classPrivateFieldLooseBase(this, _imageDialog)[_imageDialog] !== null && babelHelpers.classPrivateFieldLooseBase(this, _imageDialog)[_imageDialog].isShown()) {
	        return;
	      }
	      this.getEditor().focus(() => {
	        this.getEditor().dispatchCommand(INSERT_IMAGE_DIALOG_COMMAND);
	      });
	    });
	    return button;
	  });
	}



	var Image = /*#__PURE__*/Object.freeze({
		ImageNode: ImageNode,
		$createImageNode: $createImageNode,
		$isImageNode: $isImageNode,
		INSERT_IMAGE_COMMAND: INSERT_IMAGE_COMMAND,
		INSERT_IMAGE_DIALOG_COMMAND: INSERT_IMAGE_DIALOG_COMMAND,
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
	    var _config$theme;
	    const element = document.createElement('span');
	    if (main_core.Type.isStringFilled(config == null ? void 0 : (_config$theme = config.theme) == null ? void 0 : _config$theme.mention)) {
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
	var _dialog = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("dialog");
	var _lastQueryMatch = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("lastQueryMatch");
	var _mentionListening = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("mentionListening");
	var _removeKeyboardCommandsLock = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("removeKeyboardCommandsLock");
	var _removeUpdateListener = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("removeUpdateListener");
	var _onEditorScroll$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onEditorScroll");
	var _lastPosition = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("lastPosition");
	var _timeoutId = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("timeoutId");
	var _triggerByAtSign = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("triggerByAtSign");
	var _dialogOptions = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("dialogOptions");
	var _entities = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("entities");
	var _registerCommands$4 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("registerCommands");
	var _registerComponents$2 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("registerComponents");
	var _convertMentionElement = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("convertMentionElement");
	var _registerKeyDownListener = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("registerKeyDownListener");
	var _registerTextContentListener = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("registerTextContentListener");
	var _unregisterTextContentListener = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("unregisterTextContentListener");
	var _textContentListener = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("textContentListener");
	var _startMentionListening = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("startMentionListening");
	var _stopMentionListening = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("stopMentionListening");
	var _getQueryMatch = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getQueryMatch");
	var _getTextUpToAnchor = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getTextUpToAnchor");
	var _isSelectionOnEntityBoundary = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isSelectionOnEntityBoundary");
	var _matchMention = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("matchMention");
	var _splitNodeContainingQuery = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("splitNodeContainingQuery");
	var _getFullMatchOffset = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getFullMatchOffset");
	var _openDialog = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("openDialog");
	var _adjustDialogPosition = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("adjustDialogPosition");
	var _handleEditorScroll$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleEditorScroll");
	var _handleHideOrDestroy = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleHideOrDestroy");
	var _hideDialog = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("hideDialog");
	var _lockKeyboardCommands = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("lockKeyboardCommands");
	var _unlockKeyboardCommands = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("unlockKeyboardCommands");
	class MentionPlugin extends BasePlugin {
	  constructor(editor) {
	    super(editor);
	    Object.defineProperty(this, _unlockKeyboardCommands, {
	      value: _unlockKeyboardCommands2
	    });
	    Object.defineProperty(this, _lockKeyboardCommands, {
	      value: _lockKeyboardCommands2
	    });
	    Object.defineProperty(this, _hideDialog, {
	      value: _hideDialog2
	    });
	    Object.defineProperty(this, _handleHideOrDestroy, {
	      value: _handleHideOrDestroy2
	    });
	    Object.defineProperty(this, _handleEditorScroll$1, {
	      value: _handleEditorScroll2$1
	    });
	    Object.defineProperty(this, _adjustDialogPosition, {
	      value: _adjustDialogPosition2
	    });
	    Object.defineProperty(this, _openDialog, {
	      value: _openDialog2
	    });
	    Object.defineProperty(this, _getFullMatchOffset, {
	      value: _getFullMatchOffset2
	    });
	    Object.defineProperty(this, _splitNodeContainingQuery, {
	      value: _splitNodeContainingQuery2
	    });
	    Object.defineProperty(this, _matchMention, {
	      value: _matchMention2
	    });
	    Object.defineProperty(this, _isSelectionOnEntityBoundary, {
	      value: _isSelectionOnEntityBoundary2
	    });
	    Object.defineProperty(this, _getTextUpToAnchor, {
	      value: _getTextUpToAnchor2
	    });
	    Object.defineProperty(this, _getQueryMatch, {
	      value: _getQueryMatch2
	    });
	    Object.defineProperty(this, _stopMentionListening, {
	      value: _stopMentionListening2
	    });
	    Object.defineProperty(this, _startMentionListening, {
	      value: _startMentionListening2
	    });
	    Object.defineProperty(this, _textContentListener, {
	      value: _textContentListener2
	    });
	    Object.defineProperty(this, _unregisterTextContentListener, {
	      value: _unregisterTextContentListener2
	    });
	    Object.defineProperty(this, _registerTextContentListener, {
	      value: _registerTextContentListener2
	    });
	    Object.defineProperty(this, _registerKeyDownListener, {
	      value: _registerKeyDownListener2
	    });
	    Object.defineProperty(this, _convertMentionElement, {
	      value: _convertMentionElement2
	    });
	    Object.defineProperty(this, _registerComponents$2, {
	      value: _registerComponents2$2
	    });
	    Object.defineProperty(this, _registerCommands$4, {
	      value: _registerCommands2$4
	    });
	    Object.defineProperty(this, _dialog, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _lastQueryMatch, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _mentionListening, {
	      writable: true,
	      value: false
	    });
	    Object.defineProperty(this, _removeKeyboardCommandsLock, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _removeUpdateListener, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _onEditorScroll$1, {
	      writable: true,
	      value: babelHelpers.classPrivateFieldLooseBase(this, _handleEditorScroll$1)[_handleEditorScroll$1].bind(this)
	    });
	    Object.defineProperty(this, _lastPosition, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _timeoutId, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _triggerByAtSign, {
	      writable: true,
	      value: false
	    });
	    Object.defineProperty(this, _dialogOptions, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _entities, {
	      writable: true,
	      value: new Set()
	    });
	    const entities = editor.getOption('mention.entities', []);
	    babelHelpers.classPrivateFieldLooseBase(this, _entities)[_entities] = main_core.Type.isArrayFilled(entities) ? new Set(entities) : new Set();
	    const _dialogOptions2 = editor.getOption('mention.dialogOptions');
	    if (main_core.Type.isPlainObject(_dialogOptions2)) {
	      babelHelpers.classPrivateFieldLooseBase(this, _dialogOptions)[_dialogOptions] = _dialogOptions2;
	      if (main_core.Type.isArrayFilled(babelHelpers.classPrivateFieldLooseBase(this, _dialogOptions)[_dialogOptions].entities)) {
	        for (const entity of babelHelpers.classPrivateFieldLooseBase(this, _dialogOptions)[_dialogOptions].entities) {
	          if (main_core.Type.isPlainObject(entity) && main_core.Type.isStringFilled(entity.id)) {
	            babelHelpers.classPrivateFieldLooseBase(this, _entities)[_entities].add(entity.id);
	          }
	        }
	      }
	      babelHelpers.classPrivateFieldLooseBase(this, _registerKeyDownListener)[_registerKeyDownListener]();
	    }
	    if (babelHelpers.classPrivateFieldLooseBase(this, _entities)[_entities].size > 0) {
	      babelHelpers.classPrivateFieldLooseBase(this, _registerCommands$4)[_registerCommands$4]();
	      babelHelpers.classPrivateFieldLooseBase(this, _registerComponents$2)[_registerComponents$2]();
	    }
	  }
	  static getName() {
	    return 'Mention';
	  }
	  static getNodes(editor) {
	    return [MentionNode];
	  }
	  importBBCode() {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _entities)[_entities].size > 0) {
	      const map = {};
	      for (const entityId of babelHelpers.classPrivateFieldLooseBase(this, _entities)[_entities]) {
	        map[entityId] = () => ({
	          conversion: babelHelpers.classPrivateFieldLooseBase(this, _convertMentionElement)[_convertMentionElement],
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
	    return babelHelpers.classPrivateFieldLooseBase(this, _triggerByAtSign)[_triggerByAtSign];
	  }
	  isDialogVisible() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _dialog)[_dialog] !== null && babelHelpers.classPrivateFieldLooseBase(this, _dialog)[_dialog].isRendered() && babelHelpers.classPrivateFieldLooseBase(this, _dialog)[_dialog].getPopup().isShown();
	  }
	  destroy() {
	    super.destroy();
	    if (babelHelpers.classPrivateFieldLooseBase(this, _timeoutId)[_timeoutId] !== null) {
	      clearTimeout(babelHelpers.classPrivateFieldLooseBase(this, _timeoutId)[_timeoutId]);
	      babelHelpers.classPrivateFieldLooseBase(this, _timeoutId)[_timeoutId] = null;
	    }
	    if (babelHelpers.classPrivateFieldLooseBase(this, _dialog)[_dialog] !== null) {
	      babelHelpers.classPrivateFieldLooseBase(this, _dialog)[_dialog].destroy();
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _unregisterTextContentListener)[_unregisterTextContentListener]();
	    babelHelpers.classPrivateFieldLooseBase(this, _unlockKeyboardCommands)[_unlockKeyboardCommands]();
	  }
	}
	function _registerCommands2$4() {
	  this.cleanUpRegister(this.getEditor().registerCommand(INSERT_MENTION_COMMAND, payload => {
	    if (!main_core.Type.isPlainObject(payload) || !main_core.Type.isStringFilled(payload.entityId) || !main_core.Type.isStringFilled(payload.text) || !main_core.Type.isStringFilled(payload.id) && !main_core.Type.isNumber(payload.id)) {
	      return false;
	    }
	    if (!babelHelpers.classPrivateFieldLooseBase(this, _entities)[_entities].has(payload.entityId)) {
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
	      const currentText = babelHelpers.classPrivateFieldLooseBase(this, _getTextUpToAnchor)[_getTextUpToAnchor](selection);
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
	          const match = babelHelpers.classPrivateFieldLooseBase(this, _getQueryMatch)[_getQueryMatch](ui_lexical_core.$getSelection());
	          if (match !== null && !babelHelpers.classPrivateFieldLooseBase(this, _isSelectionOnEntityBoundary)[_isSelectionOnEntityBoundary](match.leadOffset)) {
	            babelHelpers.classPrivateFieldLooseBase(this, _openDialog)[_openDialog](match);
	          }
	        });
	      }
	    });
	    return true;
	  }, ui_lexical_core.COMMAND_PRIORITY_LOW), this.getEditor().registerCommand(HIDE_DIALOG_COMMAND, payload => {
	    if (!payload || payload.sender !== 'mention') {
	      babelHelpers.classPrivateFieldLooseBase(this, _hideDialog)[_hideDialog]();
	    }
	    return false;
	  }, ui_lexical_core.COMMAND_PRIORITY_LOW), this.getEditor().registerCommand(DIALOG_VISIBILITY_COMMAND, () => {
	    return this.isDialogVisible();
	  }, ui_lexical_core.COMMAND_PRIORITY_LOW));
	}
	function _registerComponents2$2() {
	  this.getEditor().getComponentRegistry().register('mention', () => {
	    const button = new Button();
	    button.setContent('<span class="ui-icon-set --mention"></span>');
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
	function _convertMentionElement2(node) {
	  return {
	    node: $createMentionNode(node.getName(), node.getValue())
	  };
	}
	function _registerKeyDownListener2() {
	  babelHelpers.classPrivateFieldLooseBase(this, _triggerByAtSign)[_triggerByAtSign] = true;
	  const keyDownListener = event => {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _mentionListening)[_mentionListening]) {
	      if (event.key === 'Escape' || event.key === 'Enter') {
	        babelHelpers.classPrivateFieldLooseBase(this, _stopMentionListening)[_stopMentionListening]();
	      }
	    } else if (!babelHelpers.classPrivateFieldLooseBase(this, _mentionListening)[_mentionListening] && (event.key === '+' || event.key === '@')) {
	      babelHelpers.classPrivateFieldLooseBase(this, _timeoutId)[_timeoutId] = setTimeout(() => {
	        this.getEditor().update(() => {
	          const selection = ui_lexical_core.$getSelection();
	          const match = babelHelpers.classPrivateFieldLooseBase(this, _getQueryMatch)[_getQueryMatch](selection);
	          if (match !== null && !babelHelpers.classPrivateFieldLooseBase(this, _isSelectionOnEntityBoundary)[_isSelectionOnEntityBoundary](match.leadOffset)) {
	            babelHelpers.classPrivateFieldLooseBase(this, _openDialog)[_openDialog](match);
	          }
	        });
	      }, 300);
	    }
	    return false;
	  };
	  this.cleanUpRegister(this.getEditor().registerCommand(ui_lexical_core.KEY_DOWN_COMMAND, keyDownListener, ui_lexical_core.COMMAND_PRIORITY_LOW));
	}
	function _registerTextContentListener2() {
	  babelHelpers.classPrivateFieldLooseBase(this, _unregisterTextContentListener)[_unregisterTextContentListener]();
	  babelHelpers.classPrivateFieldLooseBase(this, _removeUpdateListener)[_removeUpdateListener] = this.getEditor().registerTextContentListener(babelHelpers.classPrivateFieldLooseBase(this, _textContentListener)[_textContentListener].bind(this));
	}
	function _unregisterTextContentListener2() {
	  if (babelHelpers.classPrivateFieldLooseBase(this, _removeUpdateListener)[_removeUpdateListener] !== null) {
	    babelHelpers.classPrivateFieldLooseBase(this, _removeUpdateListener)[_removeUpdateListener]();
	    babelHelpers.classPrivateFieldLooseBase(this, _removeUpdateListener)[_removeUpdateListener] = null;
	  }
	}
	function _textContentListener2() {
	  this.getEditor().getEditorState().read(() => {
	    const selection = ui_lexical_core.$getSelection();
	    const match = babelHelpers.classPrivateFieldLooseBase(this, _getQueryMatch)[_getQueryMatch](selection);
	    if (match !== null && !babelHelpers.classPrivateFieldLooseBase(this, _isSelectionOnEntityBoundary)[_isSelectionOnEntityBoundary](match.leadOffset)) {
	      babelHelpers.classPrivateFieldLooseBase(this, _openDialog)[_openDialog](match);
	    } else {
	      babelHelpers.classPrivateFieldLooseBase(this, _hideDialog)[_hideDialog]();
	    }
	  });
	}
	function _startMentionListening2() {
	  babelHelpers.classPrivateFieldLooseBase(this, _mentionListening)[_mentionListening] = true;
	  babelHelpers.classPrivateFieldLooseBase(this, _registerTextContentListener)[_registerTextContentListener]();
	}
	function _stopMentionListening2() {
	  babelHelpers.classPrivateFieldLooseBase(this, _mentionListening)[_mentionListening] = false;
	  babelHelpers.classPrivateFieldLooseBase(this, _unregisterTextContentListener)[_unregisterTextContentListener]();
	}
	function _getQueryMatch2(selection, minMatchLength = 0) {
	  if (!ui_lexical_core.$isRangeSelection(selection) || !selection.isCollapsed()) {
	    return null;
	  }
	  const anchor = selection.anchor;
	  const anchorNode = anchor.getNode();
	  if (!ui_lexical_core.$isTextNode(anchorNode) || !anchorNode.isSimpleText()) {
	    return null;
	  }
	  const text = babelHelpers.classPrivateFieldLooseBase(this, _getTextUpToAnchor)[_getTextUpToAnchor](selection);

	  // console.log("text:", text);

	  if (!main_core.Type.isStringFilled(text)) {
	    return null;
	  }
	  return babelHelpers.classPrivateFieldLooseBase(this, _matchMention)[_matchMention](text, minMatchLength);
	}
	function _getTextUpToAnchor2(selection) {
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
	function _isSelectionOnEntityBoundary2(offset) {
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
	function _matchMention2(text, minMatchLength) {
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
	function _splitNodeContainingQuery2(match) {
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
	  const queryOffset = babelHelpers.classPrivateFieldLooseBase(this, _getFullMatchOffset)[_getFullMatchOffset](textContent, match.matchingString, characterOffset);
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
	function _getFullMatchOffset2(documentText, entryText, offset) {
	  let triggerOffset = offset;
	  for (let i = triggerOffset; i <= entryText.length; i++) {
	    if (documentText.slice(-i) === entryText.slice(0, Math.max(0, i))) {
	      triggerOffset = i;
	    }
	  }
	  return triggerOffset;
	}
	function _openDialog2(queryMatch) {
	  if (this.isDestroyed()) {
	    return;
	  }
	  babelHelpers.classPrivateFieldLooseBase(this, _lastQueryMatch)[_lastQueryMatch] = queryMatch;
	  if (babelHelpers.classPrivateFieldLooseBase(this, _dialog)[_dialog] === null) {
	    const dialogOptions = main_core.Type.isPlainObject(babelHelpers.classPrivateFieldLooseBase(this, _dialogOptions)[_dialogOptions]) ? {
	      ...babelHelpers.classPrivateFieldLooseBase(this, _dialogOptions)[_dialogOptions]
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
	            babelHelpers.classPrivateFieldLooseBase(this, _lockKeyboardCommands)[_lockKeyboardCommands]();
	            babelHelpers.classPrivateFieldLooseBase(this, _startMentionListening)[_startMentionListening]();
	            main_core.Event.bind(this.getEditor().getScrollerContainer(), 'scroll', babelHelpers.classPrivateFieldLooseBase(this, _onEditorScroll$1)[_onEditorScroll$1]);
	          },
	          onHide: () => {
	            babelHelpers.classPrivateFieldLooseBase(this, _handleHideOrDestroy)[_handleHideOrDestroy]();
	          },
	          onDestroy: () => {
	            babelHelpers.classPrivateFieldLooseBase(this, _handleHideOrDestroy)[_handleHideOrDestroy]();
	          },
	          'Item:onBeforeSelect': event => {
	            const selectedItem = event.getData().item;
	            event.preventDefault();
	            this.getEditor().update(() => {
	              const nodeToReplace = babelHelpers.classPrivateFieldLooseBase(this, _splitNodeContainingQuery)[_splitNodeContainingQuery](babelHelpers.classPrivateFieldLooseBase(this, _lastQueryMatch)[_lastQueryMatch]);
	              const mentionNode = $createMentionNode(selectedItem.getEntityId(), selectedItem.getId());
	              mentionNode.append(ui_lexical_core.$createTextNode(selectedItem.getTitle()));
	              if (nodeToReplace) {
	                nodeToReplace.replace(mentionNode);
	                mentionNode.select();
	              }
	              babelHelpers.classPrivateFieldLooseBase(this, _hideDialog)[_hideDialog]();
	            });
	          }
	        }
	      };
	      babelHelpers.classPrivateFieldLooseBase(this, _dialog)[_dialog] = new Dialog(entitySelectorOptions);
	      this.getEditor().dispatchCommand(HIDE_DIALOG_COMMAND, {
	        sender: 'mention'
	      });
	      babelHelpers.classPrivateFieldLooseBase(this, _dialog)[_dialog].subscribeFromOptions(userEvents);
	      babelHelpers.classPrivateFieldLooseBase(this, _dialog)[_dialog].show();
	      babelHelpers.classPrivateFieldLooseBase(this, _dialog)[_dialog].search(queryMatch.matchingString);
	      babelHelpers.classPrivateFieldLooseBase(this, _adjustDialogPosition)[_adjustDialogPosition]();
	    }).catch(error => {
	      console.error('TextEditor: MentionPlugin: cannot load "ui.entity-selector"', error);
	    });
	  } else {
	    this.getEditor().dispatchCommand(HIDE_DIALOG_COMMAND, {
	      sender: 'mention'
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _dialog)[_dialog].show();
	    babelHelpers.classPrivateFieldLooseBase(this, _dialog)[_dialog].search(queryMatch.matchingString);
	    babelHelpers.classPrivateFieldLooseBase(this, _adjustDialogPosition)[_adjustDialogPosition]();
	  }
	}
	function _adjustDialogPosition2() {
	  this.getEditor().update(() => {
	    const selectionPosition = $getSelectionPosition(this.getEditor(), ui_lexical_core.$getSelection(), document.body);
	    if (selectionPosition === null) {
	      return;
	    }
	    const {
	      top,
	      left,
	      bottom
	    } = selectionPosition;
	    const scrollerRect = main_core.Dom.getPosition(this.getEditor().getScrollerContainer());
	    const popupWidth = 400;
	    let offsetLeft = 10;
	    if (left - offsetLeft < scrollerRect.left) {
	      // Left boundary
	      const overflow = scrollerRect.left - (left - offsetLeft);
	      offsetLeft -= overflow + 16;
	    } else if (scrollerRect.right < left + popupWidth - offsetLeft) {
	      // Right boundary
	      offsetLeft += left + popupWidth - offsetLeft - scrollerRect.right + 16;
	    }
	    if (bottom < scrollerRect.top || top > scrollerRect.bottom) {
	      main_core.Dom.addClass(babelHelpers.classPrivateFieldLooseBase(this, _dialog)[_dialog].getPopup().getPopupContainer(), 'ui-text-editor-mention-popup__hidden');
	    } else {
	      main_core.Dom.removeClass(babelHelpers.classPrivateFieldLooseBase(this, _dialog)[_dialog].getPopup().getPopupContainer(), 'ui-text-editor-mention-popup__hidden');
	      babelHelpers.classPrivateFieldLooseBase(this, _dialog)[_dialog].show();
	      if (babelHelpers.classPrivateFieldLooseBase(this, _lastPosition)[_lastPosition] === null || babelHelpers.classPrivateFieldLooseBase(this, _lastPosition)[_lastPosition].top !== bottom) {
	        babelHelpers.classPrivateFieldLooseBase(this, _lastPosition)[_lastPosition] = {
	          left: left - offsetLeft,
	          top: bottom
	        };
	      }
	      babelHelpers.classPrivateFieldLooseBase(this, _dialog)[_dialog].getPopup().setBindElement(babelHelpers.classPrivateFieldLooseBase(this, _lastPosition)[_lastPosition]);
	      babelHelpers.classPrivateFieldLooseBase(this, _dialog)[_dialog].getPopup().adjustPosition({
	        forceBindPosition: true,
	        forceTop: true
	      });
	    }
	  });
	}
	function _handleEditorScroll2$1() {
	  babelHelpers.classPrivateFieldLooseBase(this, _adjustDialogPosition)[_adjustDialogPosition]();
	}
	function _handleHideOrDestroy2() {
	  babelHelpers.classPrivateFieldLooseBase(this, _lastPosition)[_lastPosition] = null;
	  babelHelpers.classPrivateFieldLooseBase(this, _unlockKeyboardCommands)[_unlockKeyboardCommands]();
	  babelHelpers.classPrivateFieldLooseBase(this, _stopMentionListening)[_stopMentionListening]();
	  main_core.Event.unbind(this.getEditor().getScrollerContainer(), 'scroll', babelHelpers.classPrivateFieldLooseBase(this, _onEditorScroll$1)[_onEditorScroll$1]);
	}
	function _hideDialog2() {
	  if (babelHelpers.classPrivateFieldLooseBase(this, _dialog)[_dialog] !== null) {
	    babelHelpers.classPrivateFieldLooseBase(this, _dialog)[_dialog].hide();
	  }
	}
	function _lockKeyboardCommands2() {
	  if (babelHelpers.classPrivateFieldLooseBase(this, _removeKeyboardCommandsLock)[_removeKeyboardCommandsLock] === null) {
	    babelHelpers.classPrivateFieldLooseBase(this, _removeKeyboardCommandsLock)[_removeKeyboardCommandsLock] = ui_lexical_utils.mergeRegister(this.getEditor().registerCommand(ui_lexical_core.KEY_ARROW_DOWN_COMMAND, () => true, ui_lexical_core.COMMAND_PRIORITY_LOW), this.getEditor().registerCommand(ui_lexical_core.KEY_ARROW_UP_COMMAND, () => true, ui_lexical_core.COMMAND_PRIORITY_LOW), this.getEditor().registerCommand(ui_lexical_core.KEY_ESCAPE_COMMAND, () => true, ui_lexical_core.COMMAND_PRIORITY_LOW), this.getEditor().registerCommand(ui_lexical_core.KEY_TAB_COMMAND, () => true, ui_lexical_core.COMMAND_PRIORITY_LOW), this.getEditor().registerCommand(ui_lexical_core.KEY_ENTER_COMMAND, () => true, ui_lexical_core.COMMAND_PRIORITY_LOW));
	  }
	}
	function _unlockKeyboardCommands2() {
	  if (babelHelpers.classPrivateFieldLooseBase(this, _removeKeyboardCommandsLock)[_removeKeyboardCommandsLock] !== null) {
	    babelHelpers.classPrivateFieldLooseBase(this, _removeKeyboardCommandsLock)[_removeKeyboardCommandsLock]();
	    babelHelpers.classPrivateFieldLooseBase(this, _removeKeyboardCommandsLock)[_removeKeyboardCommandsLock] = null;
	  }
	}



	var Mention = /*#__PURE__*/Object.freeze({
		INSERT_MENTION_COMMAND: INSERT_MENTION_COMMAND,
		INSERT_MENTION_DIALOG_COMMAND: INSERT_MENTION_DIALOG_COMMAND,
		MentionPlugin: MentionPlugin,
		MentionNode: MentionNode,
		$createMentionNode: $createMentionNode,
		$isMentionNode: $isMentionNode
	});

	/* eslint-disable no-underscore-dangle,@bitrix24/bitrix24-rules/no-pseudo-private */
	class SmileyNode extends ui_lexical_core.DecoratorNode {
	  static getType() {
	    return 'smiley';
	  }
	  static clone(node) {
	    return new SmileyNode(node.__src, node.__typing, node.__width, node.__height, node.__key);
	  }
	  constructor(src, typing, width, height, key) {
	    super(key);
	    this.__width = null;
	    this.__height = null;
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
	    var _config$theme;
	    const img = document.createElement('img');
	    img.src = encodeURI(this.__src);
	    if (this.getWidth() > 0 && this.getHeight() > 0) {
	      main_core.Dom.style(img, {
	        width: `${this.getWidth()}px`,
	        height: `${this.getHeight()}px`
	      });
	    }
	    if (main_core.Type.isStringFilled(config == null ? void 0 : (_config$theme = config.theme) == null ? void 0 : _config$theme.smiley)) {
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

	var _name = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("name");
	var _image = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("image");
	var _typing = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("typing");
	var _width = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("width");
	var _height = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("height");
	class Smiley {
	  constructor(smileyOptions) {
	    Object.defineProperty(this, _name, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _image, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _typing, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _width, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _height, {
	      writable: true,
	      value: void 0
	    });
	    const options = main_core.Type.isPlainObject(smileyOptions) ? smileyOptions : {};
	    this.setName(options.name);
	    this.setImage(options.image);
	    this.setTyping(options.typing);
	    this.setWidth(options.width);
	    this.setHeight(options.height);
	  }
	  getName() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _name)[_name];
	  }
	  setName(value) {
	    babelHelpers.classPrivateFieldLooseBase(this, _name)[_name] = value;
	  }
	  getImage() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _image)[_image];
	  }
	  setImage(value) {
	    babelHelpers.classPrivateFieldLooseBase(this, _image)[_image] = value;
	  }
	  getTyping() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _typing)[_typing];
	  }
	  setTyping(value) {
	    babelHelpers.classPrivateFieldLooseBase(this, _typing)[_typing] = value;
	  }
	  getWidth() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _width)[_width];
	  }
	  setWidth(value) {
	    babelHelpers.classPrivateFieldLooseBase(this, _width)[_width] = value;
	  }
	  getHeight() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _height)[_height];
	  }
	  setHeight(value) {
	    babelHelpers.classPrivateFieldLooseBase(this, _height)[_height] = value;
	  }
	}

	var _popup$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("popup");
	var _targetNode = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("targetNode");
	class SmileyDialog extends main_core_events.EventEmitter {
	  constructor(dialogOptions) {
	    super();
	    Object.defineProperty(this, _popup$1, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _targetNode, {
	      writable: true,
	      value: null
	    });
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
	    return babelHelpers.classPrivateFieldLooseBase(this, _popup$1)[_popup$1] !== null && babelHelpers.classPrivateFieldLooseBase(this, _popup$1)[_popup$1].isShown();
	  }
	  destroy() {
	    this.getPopup().destroy();
	  }
	  setTargetNode(container) {
	    if (main_core.Type.isElementNode(container)) {
	      babelHelpers.classPrivateFieldLooseBase(this, _targetNode)[_targetNode] = container;
	    }
	  }
	  getTargetNode() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _targetNode)[_targetNode];
	  }
	  getPopup() {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _popup$1)[_popup$1] === null) {
	      const popupWidth = 360;
	      const targetNode = this.getTargetNode();
	      const rect = targetNode.getBoundingClientRect();
	      const targetNodeWidth = rect.width;
	      babelHelpers.classPrivateFieldLooseBase(this, _popup$1)[_popup$1] = new main_popup.Popup({
	        autoHide: true,
	        padding: 0,
	        closeByEsc: true,
	        width: popupWidth,
	        height: 250,
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
	              app.mount(babelHelpers.classPrivateFieldLooseBase(this, _popup$1)[_popup$1].getContentContainer());
	            }).catch(() => {
	              babelHelpers.classPrivateFieldLooseBase(this, _popup$1)[_popup$1].close();
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
	    return babelHelpers.classPrivateFieldLooseBase(this, _popup$1)[_popup$1];
	  }
	}

	const CodePoint = {
	  TAB: 9,
	  SPACE: 32,
	  NBSP: 160,
	  NEW_LINE: 10,
	  // \n
	  RETURN: 13,
	  // \r
	  LINE_FEED: 12,
	  // \f
	  EXCLAMATION: 33,
	  // !
	  DOUBLE_QUOTE: 34,
	  HASH: 35,
	  // #
	  SINGLE_QUOTE: 39,
	  ASTERISK: 42,
	  COMMA: 44,
	  DOT: 46,
	  COLON: 58,
	  SEMI_COLON: 59,
	  QUESTION: 63,
	  ROUND_BRACKET_OPEN: 40,
	  ROUND_BRACKET_CLOSE: 41,
	  SQUARE_BRACKET_OPEN: 91,
	  SQUARE_BRACKET_CLOSE: 93,
	  CURLY_BRACKET_OPEN: 123,
	  PIPE: 124,
	  CURLY_BRACKET_CLOSE: 125,
	  HYPHEN: 45
	};

	var _currentPosition = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("currentPosition");
	var _text = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("text");
	var _textStart = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("textStart");
	var _textEnd = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("textEnd");
	var _moveNext = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("moveNext");
	class TextParser {
	  constructor(text, position = 0) {
	    Object.defineProperty(this, _moveNext, {
	      value: _moveNext2
	    });
	    Object.defineProperty(this, _currentPosition, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _text, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _textStart, {
	      writable: true,
	      value: -1
	    });
	    Object.defineProperty(this, _textEnd, {
	      writable: true,
	      value: -1
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _text)[_text] = text;
	    babelHelpers.classPrivateFieldLooseBase(this, _currentPosition)[_currentPosition] = position;
	  }
	  getCurrentPosition() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _currentPosition)[_currentPosition];
	  }
	  tryChangePosition(fn) {
	    const currentPosition = babelHelpers.classPrivateFieldLooseBase(this, _currentPosition)[_currentPosition];
	    const success = fn();
	    if (!success) {
	      babelHelpers.classPrivateFieldLooseBase(this, _currentPosition)[_currentPosition] = currentPosition;
	    }
	    return success;
	  }
	  peek() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _text)[_text].codePointAt(babelHelpers.classPrivateFieldLooseBase(this, _currentPosition)[_currentPosition]);
	  }
	  moveNext() {
	    return this.hasNext() ? babelHelpers.classPrivateFieldLooseBase(this, _moveNext)[_moveNext](this.peek()) : NaN;
	  }
	  peekPrevious() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _text)[_text].codePointAt(babelHelpers.classPrivateFieldLooseBase(this, _currentPosition)[_currentPosition] - 1);
	  }
	  hasNext() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _currentPosition)[_currentPosition] < babelHelpers.classPrivateFieldLooseBase(this, _text)[_text].length;
	  }
	  hasPendingText() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _textStart)[_textStart] !== babelHelpers.classPrivateFieldLooseBase(this, _textEnd)[_textEnd];
	  }
	  flushText() {
	    if (this.hasPendingText()) {
	      babelHelpers.classPrivateFieldLooseBase(this, _textStart)[_textStart] = -1;
	      babelHelpers.classPrivateFieldLooseBase(this, _textEnd)[_textEnd] = -1;
	    }
	  }
	  consume(match) {
	    const codePoint = this.peek();
	    const success = main_core.Type.isFunction(match) ? match(codePoint) : codePoint === match;
	    if (success) {
	      this.moveNext(codePoint);
	    }
	    return success;
	  }
	  consumeWhile(match) {
	    const start = babelHelpers.classPrivateFieldLooseBase(this, _currentPosition)[_currentPosition];
	    while (this.hasNext() && this.consume(match)) {
	      /* */
	    }
	    return babelHelpers.classPrivateFieldLooseBase(this, _currentPosition)[_currentPosition] !== start;
	  }
	  consumePoints(codePoints) {
	    const currentPosition = babelHelpers.classPrivateFieldLooseBase(this, _currentPosition)[_currentPosition];
	    for (const codePoint of codePoints) {
	      const currentCodePoint = this.moveNext();
	      if (codePoint !== currentCodePoint) {
	        babelHelpers.classPrivateFieldLooseBase(this, _currentPosition)[_currentPosition] = currentPosition;
	        return false;
	      }
	    }
	    return true;
	  }
	  consumeTree(treeIndex) {
	    const currentPosition = babelHelpers.classPrivateFieldLooseBase(this, _currentPosition)[_currentPosition];
	    let node = treeIndex;
	    while (this.hasNext()) {
	      const codePoint = this.moveNext();
	      const index = node.get(codePoint);
	      if (main_core.Type.isUndefined(index)) {
	        break;
	      }
	      const [isLeaf, entry] = index;
	      if (isLeaf === true) {
	        this.consumeTree(entry);
	        return true;
	      }
	      node = entry;
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _currentPosition)[_currentPosition] = currentPosition;
	    return false;
	  }
	  consumeText() {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _textStart)[_textStart] === -1) {
	      babelHelpers.classPrivateFieldLooseBase(this, _textStart)[_textStart] = babelHelpers.classPrivateFieldLooseBase(this, _currentPosition)[_currentPosition];
	      babelHelpers.classPrivateFieldLooseBase(this, _textEnd)[_textEnd] = babelHelpers.classPrivateFieldLooseBase(this, _currentPosition)[_currentPosition];
	    }
	    this.moveNext();
	    babelHelpers.classPrivateFieldLooseBase(this, _textEnd)[_textEnd] = babelHelpers.classPrivateFieldLooseBase(this, _currentPosition)[_currentPosition];
	    return true;
	  }
	  isWordBoundary() {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _currentPosition)[_currentPosition] === 0) {
	      return true;
	    }
	    if (this.hasPendingText()) {
	      return isDelimiter(this.peekPrevious());
	    }
	    return false;
	  }
	}

	// [.,;:!?#-*|[](){}]
	function _moveNext2(code) {
	  babelHelpers.classPrivateFieldLooseBase(this, _currentPosition)[_currentPosition] += code > 0xFFFF ? 2 : 1;
	  return code;
	}
	const wordBoundaries = new Set([CodePoint.DOT, CodePoint.COMMA, CodePoint.SEMI_COLON, CodePoint.COLON, CodePoint.EXCLAMATION, CodePoint.QUESTION, CodePoint.HASH, CodePoint.HYPHEN, CodePoint.ASTERISK, CodePoint.PIPE, CodePoint.ROUND_BRACKET_OPEN, CodePoint.ROUND_BRACKET_CLOSE, CodePoint.SQUARE_BRACKET_OPEN, CodePoint.SQUARE_BRACKET_CLOSE, CodePoint.CURLY_BRACKET_OPEN, CodePoint.CURLY_BRACKET_CLOSE]);
	function isWordBoundary(ch) {
	  return wordBoundaries.has(ch);
	}
	function isTextBound(codePoint) {
	  return main_core.Type.isUndefined(codePoint) || Number.isNaN(codePoint) || isNewLine(codePoint) || isWhitespace(codePoint);
	}
	function isDelimiter(codePoint) {
	  return isTextBound(codePoint) || isWordBoundary(codePoint);
	}
	function isWhitespace(codePoint) {
	  return codePoint === CodePoint.SPACE || codePoint === CodePoint.TAB || codePoint === CodePoint.NBSP;
	}
	function isNewLine(codePoint) {
	  return codePoint === CodePoint.NEW_LINE || codePoint === CodePoint.RETURN || codePoint === CodePoint.LINE_FEED;
	}

	var _index = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("index");
	class TokenTree {
	  constructor() {
	    Object.defineProperty(this, _index, {
	      writable: true,
	      value: new Map()
	    });
	  }
	  getTreeIndex() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _index)[_index];
	  }
	  addToken(token) {
	    if (!main_core.Type.isStringFilled(token)) {
	      return;
	    }
	    let index = babelHelpers.classPrivateFieldLooseBase(this, _index)[_index];
	    for (let i = 0; i < token.length; i++) {
	      const codePoint = token.codePointAt(i);
	      if (i === token.length - 1) {
	        if (index.has(codePoint)) {
	          index.get(codePoint)[0] = true;
	        } else {
	          index.set(codePoint, [true, new Map()]);
	        }
	      } else {
	        if (!index.has(codePoint)) {
	          index.set(codePoint, [false, new Map()]);
	        }
	        [, index] = index.get(codePoint);
	      }
	    }
	  }
	}

	var _splitOffsets = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("splitOffsets");
	var _tokenTree = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("tokenTree");
	var _textParser = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("textParser");
	var _parseSmileys = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("parseSmileys");
	var _consumeSmiley = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("consumeSmiley");
	var _isWordBoundary = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isWordBoundary");
	var _isNextWordBoundary = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isNextWordBoundary");
	var _parseEmoji = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("parseEmoji");
	class SmileyParser {
	  constructor(smileys) {
	    Object.defineProperty(this, _parseEmoji, {
	      value: _parseEmoji2
	    });
	    Object.defineProperty(this, _isNextWordBoundary, {
	      value: _isNextWordBoundary2
	    });
	    Object.defineProperty(this, _isWordBoundary, {
	      value: _isWordBoundary2
	    });
	    Object.defineProperty(this, _consumeSmiley, {
	      value: _consumeSmiley2
	    });
	    Object.defineProperty(this, _parseSmileys, {
	      value: _parseSmileys2
	    });
	    Object.defineProperty(this, _splitOffsets, {
	      writable: true,
	      value: []
	    });
	    Object.defineProperty(this, _tokenTree, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _textParser, {
	      writable: true,
	      value: null
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _tokenTree)[_tokenTree] = new TokenTree();
	    smileys.forEach(smiley => {
	      babelHelpers.classPrivateFieldLooseBase(this, _tokenTree)[_tokenTree].addToken(smiley.getTyping());
	    });
	  }
	  parse(text) {
	    babelHelpers.classPrivateFieldLooseBase(this, _splitOffsets)[_splitOffsets] = [];
	    babelHelpers.classPrivateFieldLooseBase(this, _textParser)[_textParser] = new TextParser(text);
	    while (babelHelpers.classPrivateFieldLooseBase(this, _textParser)[_textParser].hasNext()) {
	      let success = false;
	      success = success || babelHelpers.classPrivateFieldLooseBase(this, _parseEmoji)[_parseEmoji]();
	      success = success || babelHelpers.classPrivateFieldLooseBase(this, _parseSmileys)[_parseSmileys]();
	      success = success || babelHelpers.classPrivateFieldLooseBase(this, _textParser)[_textParser].consumeText();
	    }
	    return babelHelpers.classPrivateFieldLooseBase(this, _splitOffsets)[_splitOffsets];
	  }
	}
	function _parseSmileys2() {
	  if (babelHelpers.classPrivateFieldLooseBase(this, _isWordBoundary)[_isWordBoundary]()) {
	    return babelHelpers.classPrivateFieldLooseBase(this, _textParser)[_textParser].tryChangePosition(() => {
	      const currentPosition = babelHelpers.classPrivateFieldLooseBase(this, _textParser)[_textParser].getCurrentPosition();
	      if (babelHelpers.classPrivateFieldLooseBase(this, _consumeSmiley)[_consumeSmiley]() && babelHelpers.classPrivateFieldLooseBase(this, _isNextWordBoundary)[_isNextWordBoundary]()) {
	        babelHelpers.classPrivateFieldLooseBase(this, _splitOffsets)[_splitOffsets].push({
	          start: currentPosition,
	          end: babelHelpers.classPrivateFieldLooseBase(this, _textParser)[_textParser].getCurrentPosition()
	        });
	        babelHelpers.classPrivateFieldLooseBase(this, _textParser)[_textParser].flushText();
	        return true;
	      }
	      return false;
	    });
	  }
	  return false;
	}
	function _consumeSmiley2() {
	  return babelHelpers.classPrivateFieldLooseBase(this, _textParser)[_textParser].consumeTree(babelHelpers.classPrivateFieldLooseBase(this, _tokenTree)[_tokenTree].getTreeIndex());
	}
	function _isWordBoundary2() {
	  if (!babelHelpers.classPrivateFieldLooseBase(this, _textParser)[_textParser].hasPendingText()) {
	    const last = babelHelpers.classPrivateFieldLooseBase(this, _splitOffsets)[_splitOffsets].at(-1);
	    if (last && last.end === babelHelpers.classPrivateFieldLooseBase(this, _textParser)[_textParser].getCurrentPosition()) {
	      return true;
	    }
	  }
	  return babelHelpers.classPrivateFieldLooseBase(this, _textParser)[_textParser].isWordBoundary();
	}
	function _isNextWordBoundary2() {
	  let isSmileyNext = false;
	  babelHelpers.classPrivateFieldLooseBase(this, _textParser)[_textParser].tryChangePosition(() => {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _consumeSmiley)[_consumeSmiley]()) {
	      isSmileyNext = true;
	    }
	    return false;
	  });
	  if (isSmileyNext) {
	    return true;
	  }
	  return isDelimiter(babelHelpers.classPrivateFieldLooseBase(this, _textParser)[_textParser].peek());
	}
	function _parseEmoji2() {
	  return false;
	}

	/* eslint-disable no-underscore-dangle */
	const INSERT_SMILEY_COMMAND = ui_lexical_core.createCommand('INSERT_SMILEY_COMMAND');
	const INSERT_SMILEY_DIALOG_COMMAND = ui_lexical_core.createCommand('INSERT_SMILEY_DIALOG_COMMAND');
	var _smileys = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("smileys");
	var _smileyParser = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("smileyParser");
	var _smileyDialog = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("smileyDialog");
	var _registerListeners$3 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("registerListeners");
	var _registerInsertSmileyCommand = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("registerInsertSmileyCommand");
	var _registerComponents$3 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("registerComponents");
	class SmileyPlugin extends BasePlugin {
	  constructor(editor) {
	    super(editor);
	    Object.defineProperty(this, _registerComponents$3, {
	      value: _registerComponents2$3
	    });
	    Object.defineProperty(this, _registerInsertSmileyCommand, {
	      value: _registerInsertSmileyCommand2
	    });
	    Object.defineProperty(this, _registerListeners$3, {
	      value: _registerListeners2$3
	    });
	    Object.defineProperty(this, _smileys, {
	      writable: true,
	      value: new Map()
	    });
	    Object.defineProperty(this, _smileyParser, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _smileyDialog, {
	      writable: true,
	      value: null
	    });
	    const settings = main_core.Extension.getSettings('ui.text-editor');
	    const smileys = settings.get('smileys', []);
	    for (const smiley of smileys) {
	      babelHelpers.classPrivateFieldLooseBase(this, _smileys)[_smileys].set(smiley.typing, new Smiley(smiley));
	    }
	    if (babelHelpers.classPrivateFieldLooseBase(this, _smileys)[_smileys].size > 0) {
	      babelHelpers.classPrivateFieldLooseBase(this, _smileyParser)[_smileyParser] = new SmileyParser([...babelHelpers.classPrivateFieldLooseBase(this, _smileys)[_smileys].values()]);
	      babelHelpers.classPrivateFieldLooseBase(this, _registerListeners$3)[_registerListeners$3]();
	      babelHelpers.classPrivateFieldLooseBase(this, _registerInsertSmileyCommand)[_registerInsertSmileyCommand]();
	      babelHelpers.classPrivateFieldLooseBase(this, _registerComponents$3)[_registerComponents$3]();
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
	  destroy() {
	    super.destroy();
	    if (babelHelpers.classPrivateFieldLooseBase(this, _smileyDialog)[_smileyDialog] !== null) {
	      babelHelpers.classPrivateFieldLooseBase(this, _smileyDialog)[_smileyDialog].destroy();
	    }
	  }
	}
	function _registerListeners2$3() {
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
	    const splits = babelHelpers.classPrivateFieldLooseBase(this, _smileyParser)[_smileyParser].parse(node.getTextContent());
	    if (splits.length > 0) {
	      const splitOffsets = splits.reduce((acc, smiley) => {
	        acc.push(smiley.start, smiley.end);
	        return acc;
	      }, []);
	      const textNodes = node.splitText(...splitOffsets);
	      // console.log("textNodes", splitOffsets, textNodes);

	      for (const textNode of textNodes) {
	        const smiley = babelHelpers.classPrivateFieldLooseBase(this, _smileys)[_smileys].get(textNode.getTextContent()) || null;
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
	    if (babelHelpers.classPrivateFieldLooseBase(this, _smileyDialog)[_smileyDialog] !== null) {
	      babelHelpers.classPrivateFieldLooseBase(this, _smileyDialog)[_smileyDialog].hide();
	    }
	    return false;
	  }, ui_lexical_core.COMMAND_PRIORITY_LOW), this.getEditor().registerCommand(DIALOG_VISIBILITY_COMMAND, () => {
	    return babelHelpers.classPrivateFieldLooseBase(this, _smileyDialog)[_smileyDialog] !== null && babelHelpers.classPrivateFieldLooseBase(this, _smileyDialog)[_smileyDialog].isShown();
	  }, ui_lexical_core.COMMAND_PRIORITY_LOW));
	}
	function _registerInsertSmileyCommand2() {
	  this.cleanUpRegister(this.getEditor().registerCommand(INSERT_SMILEY_COMMAND, payload => {
	    const smiley = babelHelpers.classPrivateFieldLooseBase(this, _smileys)[_smileys].get(payload) || null;
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
	    if (babelHelpers.classPrivateFieldLooseBase(this, _smileyDialog)[_smileyDialog] !== null) {
	      if (babelHelpers.classPrivateFieldLooseBase(this, _smileyDialog)[_smileyDialog].getTargetNode() === payload.targetNode) {
	        babelHelpers.classPrivateFieldLooseBase(this, _smileyDialog)[_smileyDialog].show();
	        return true;
	      }
	      babelHelpers.classPrivateFieldLooseBase(this, _smileyDialog)[_smileyDialog].destroy();
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _smileyDialog)[_smileyDialog] = new SmileyDialog({
	      targetNode: payload.targetNode,
	      events: {
	        onSelect: event => {
	          this.getEditor().dispatchCommand(INSERT_SMILEY_COMMAND, event.getData().smiley);
	        },
	        onDestroy: () => {
	          babelHelpers.classPrivateFieldLooseBase(this, _smileyDialog)[_smileyDialog] = null;
	        }
	      }
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _smileyDialog)[_smileyDialog].show();
	    return true;
	  }, ui_lexical_core.COMMAND_PRIORITY_LOW));
	}
	function _registerComponents2$3() {
	  this.getEditor().getComponentRegistry().register('smileys', () => {
	    const button = new Button();
	    button.setContent('<span class="ui-icon-set --insert-emoji"></span>');
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



	var Smiley$1 = /*#__PURE__*/Object.freeze({
		INSERT_SMILEY_COMMAND: INSERT_SMILEY_COMMAND,
		INSERT_SMILEY_DIALOG_COMMAND: INSERT_SMILEY_DIALOG_COMMAND,
		SmileyPlugin: SmileyPlugin,
		SmileyNode: SmileyNode,
		$isSmileyNode: $isSmileyNode,
		$createSmileyNode: $createSmileyNode,
		SmileyParser: SmileyParser,
		SmileyDialog: SmileyDialog
	});

	let _$7 = t => t,
	  _t$7,
	  _t2$5,
	  _t3,
	  _t4;
	var _refs$4 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("refs");
	var _figureResizer$2 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("figureResizer");
	var _trusted = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("trusted");
	var _render$3 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("render");
	var _getContainer$3 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getContainer");
	var _getVideoStub = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getVideoStub");
	var _getIframeContainer = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getIframeContainer");
	var _getIframe = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getIframe");
	var _handleResize = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleResize");
	var _handleResizeEnd$2 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleResizeEnd");
	class VideoComponent extends DecoratorComponent {
	  constructor(options) {
	    super(options);
	    Object.defineProperty(this, _handleResizeEnd$2, {
	      value: _handleResizeEnd2$2
	    });
	    Object.defineProperty(this, _handleResize, {
	      value: _handleResize2
	    });
	    Object.defineProperty(this, _getIframe, {
	      value: _getIframe2
	    });
	    Object.defineProperty(this, _getIframeContainer, {
	      value: _getIframeContainer2
	    });
	    Object.defineProperty(this, _getVideoStub, {
	      value: _getVideoStub2
	    });
	    Object.defineProperty(this, _getContainer$3, {
	      value: _getContainer2$3
	    });
	    Object.defineProperty(this, _render$3, {
	      value: _render2$3
	    });
	    Object.defineProperty(this, _refs$4, {
	      writable: true,
	      value: new main_core_cache.MemoryCache()
	    });
	    Object.defineProperty(this, _figureResizer$2, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _trusted, {
	      writable: true,
	      value: false
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _figureResizer$2)[_figureResizer$2] = new FigureResizer({
	      editor: this.getEditor(),
	      freeTransform: true,
	      events: {
	        onResize: babelHelpers.classPrivateFieldLooseBase(this, _handleResize)[_handleResize].bind(this),
	        onResizeEnd: babelHelpers.classPrivateFieldLooseBase(this, _handleResizeEnd$2)[_handleResizeEnd$2].bind(this)
	      }
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _trusted)[_trusted] = main_core.Type.isStringFilled(this.getOption('provider'));
	    babelHelpers.classPrivateFieldLooseBase(this, _figureResizer$2)[_figureResizer$2].setTarget(babelHelpers.classPrivateFieldLooseBase(this, _getContainer$3)[_getContainer$3]());
	    this.getNodeSelection().onSelect(selected => {
	      if (selected || babelHelpers.classPrivateFieldLooseBase(this, _figureResizer$2)[_figureResizer$2].isResizing()) {
	        main_core.Dom.addClass(babelHelpers.classPrivateFieldLooseBase(this, _getContainer$3)[_getContainer$3](), '--selected');
	        babelHelpers.classPrivateFieldLooseBase(this, _figureResizer$2)[_figureResizer$2].show();
	      } else {
	        main_core.Dom.removeClass(babelHelpers.classPrivateFieldLooseBase(this, _getContainer$3)[_getContainer$3](), '--selected');
	        babelHelpers.classPrivateFieldLooseBase(this, _figureResizer$2)[_figureResizer$2].hide();
	      }
	    });
	    this.update(this.getOptions());
	    babelHelpers.classPrivateFieldLooseBase(this, _render$3)[_render$3]();
	  }
	  update(options) {
	    // const width = Type.isNumber(options.width) ? `${options.width}px` : 'inherit';
	    // const height = Type.isNumber(options.height) ? `${options.height}px` : 'inherit';

	    const iframeWidth = main_core.Type.isNumber(options.width) ? options.width : '100%';
	    const iframeHeight = main_core.Type.isNumber(options.height) ? options.height : '100%';
	    main_core.Dom.style(babelHelpers.classPrivateFieldLooseBase(this, _getContainer$3)[_getContainer$3](), {
	      width: null,
	      height: null
	    });
	    main_core.Dom.attr(babelHelpers.classPrivateFieldLooseBase(this, _getIframe)[_getIframe](), {
	      width: iframeWidth,
	      height: iframeHeight
	    });
	  }
	}
	function _render2$3() {
	  main_core.Dom.append(babelHelpers.classPrivateFieldLooseBase(this, _getContainer$3)[_getContainer$3](), this.getTarget());
	}
	function _getContainer2$3() {
	  return babelHelpers.classPrivateFieldLooseBase(this, _refs$4)[_refs$4].remember('container', () => {
	    const uri = new main_core.Uri(this.getOption('src'));
	    const isVideoFile = uri.getPath().match(/\.(mp4|webm|mov)$/);
	    return main_core.Tag.render(_t$7 || (_t$7 = _$7`
				<div class="ui-text-editor-video-component">
					${0}
					${0}
				</div>
			`), babelHelpers.classPrivateFieldLooseBase(this, _trusted)[_trusted] || isVideoFile ? babelHelpers.classPrivateFieldLooseBase(this, _getIframeContainer)[_getIframeContainer]() : babelHelpers.classPrivateFieldLooseBase(this, _getVideoStub)[_getVideoStub](), babelHelpers.classPrivateFieldLooseBase(this, _figureResizer$2)[_figureResizer$2].getContainer());
	  });
	}
	function _getVideoStub2() {
	  return babelHelpers.classPrivateFieldLooseBase(this, _refs$4)[_refs$4].remember('video-stub', () => {
	    return main_core.Tag.render(_t2$5 || (_t2$5 = _$7`
				<div class="ui-text-editor-video-stub"></div>
			`));
	  });
	}
	function _getIframeContainer2() {
	  return babelHelpers.classPrivateFieldLooseBase(this, _refs$4)[_refs$4].remember('iframe-container', () => {
	    return main_core.Tag.render(_t3 || (_t3 = _$7`
				<div class="ui-text-editor-video-iframe-container">
					${0}
				</div>
			`), babelHelpers.classPrivateFieldLooseBase(this, _getIframe)[_getIframe]());
	  });
	}
	function _getIframe2() {
	  return babelHelpers.classPrivateFieldLooseBase(this, _refs$4)[_refs$4].remember('iframe', () => {
	    const iframe = main_core.Tag.render(_t4 || (_t4 = _$7`
				<iframe
					class="ui-text-editor-video-iframe"
					frameborder="0"
					src="about:blank"
					draggable="false"
				></iframe>
			`));
	    iframe.src = this.getOption('src');
	    if (!babelHelpers.classPrivateFieldLooseBase(this, _trusted)[_trusted]) {
	      iframe.sandbox = '';
	    }
	    return iframe;
	  });
	}
	function _handleResize2(event) {
	  this.update(event.getData());
	}
	function _handleResizeEnd2$2(event) {
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

	var _url = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("url");
	class BaseService {
	  constructor(url) {
	    Object.defineProperty(this, _url, {
	      writable: true,
	      value: null
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _url)[_url] = url;
	  }
	  static matchByUrl(url) {
	    return false;
	  }
	  static getDomains() {
	    return [];
	  }
	  getId() {
	    return null;
	  }
	  getMatcher() {
	    return /^$/;
	  }
	  getMatcherReplacement() {
	    return null;
	  }
	  getEmbeddedUrl() {
	    const replacement = this.getMatcherReplacement();
	    if (main_core.Type.isStringFilled(replacement) || main_core.Type.isFunction(replacement)) {
	      return this.getUrl().replace(this.getMatcher(), replacement);
	    }
	    return '';
	  }
	  getUrl() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _url)[_url];
	  }
	}

	const YOUTUBE_MATCHER = /^((?:https?:)?\/\/)?((?:www|m)\.)?(youtube(-nocookie)?\.com|youtu\.be)(\/(?:[\w-]+\?v=|embed\/|shorts\/|live\/|v\/)?)(?<id>[\w-]+)(\S+)?$/;
	const YOUTUBE_EMBEDDED = 'https://www.youtube-nocookie.com/embed/$<id>';
	class Youtube extends BaseService {
	  static matchByUrl(url) {
	    return YOUTUBE_MATCHER.test(url);
	  }
	  static getDomains() {
	    return ['youtube.com', 'youtu.be', 'youtube-nocookie.com', 'www.youtube-nocookie.com'];
	  }
	  getId() {
	    return 'youtube';
	  }
	  getMatcher() {
	    return YOUTUBE_MATCHER;
	  }
	  getMatcherReplacement() {
	    return YOUTUBE_EMBEDDED;
	  }
	}

	const FACEBOOK_MATCHER = /^(?:(?:https?:)?\/\/)?(?:www.)?facebook\.com.*\/(videos?|watch)(\.php|\/|\?).+$/;
	class Facebook extends BaseService {
	  static matchByUrl(url) {
	    return FACEBOOK_MATCHER.test(url);
	  }
	  static getDomains() {
	    return ['facebook.com', 'www.facebook.com'];
	  }
	  getId() {
	    return 'facebook';
	  }
	  getMatcher() {
	    return FACEBOOK_MATCHER;
	  }
	  getEmbeddedUrl() {
	    const encodedUrl = encodeURIComponent(this.getUrl().replace(/\/$/, ''));
	    return `https://www.facebook.com/plugins/video.php?href=${encodedUrl}`;
	  }
	}

	const VIMEO_MATCHER = /^(?:(?:https?:)?\/\/)?(?:www.)?vimeo.com\/(.*\/)?(?<id>\d+)(.*)?/;
	const VIMEO_EMBEDDED = 'https://player.vimeo.com/video/$<id>';
	class Vimeo extends BaseService {
	  static matchByUrl(url) {
	    return VIMEO_MATCHER.test(url);
	  }
	  static getDomains() {
	    return ['vimeo.com', 'player.vimeo.com'];
	  }
	  getId() {
	    return 'vimeo';
	  }
	  getMatcher() {
	    return VIMEO_MATCHER;
	  }
	  getMatcherReplacement() {
	    return VIMEO_EMBEDDED;
	  }
	}

	const INSTAGRAM_MATCHER = /(?:(?:https?:)?\/\/)?(?:www.)?(instagr\.am|instagram\.com)\/p\/(?<id>[\w-]+)\/?/;
	const INSTAGRAM_EMBEDDED = 'https://instagram.com/p/$<id>/embed/captioned';
	class Instagram extends BaseService {
	  static matchByUrl(url) {
	    return INSTAGRAM_MATCHER.test(url);
	  }
	  static getDomains() {
	    return ['www.instagram.com', 'instagram.com', 'instagr.am'];
	  }
	  getId() {
	    return 'instagram';
	  }
	  getMatcher() {
	    return INSTAGRAM_MATCHER;
	  }
	  getMatcherReplacement() {
	    return INSTAGRAM_EMBEDDED;
	  }
	}

	const VK_MATCHER = /(?:(?:https?:)?\/\/)?(?:www.)?vk\.(com|ru)\/.*(video|clip)((?<oid>-?\d+)_(?<id>\d+))\/?/;
	const VK_EMBEDDED = 'https://vk.com/video_ext.php?oid=$<oid>&id=$<id>&hd=2';
	class VK extends BaseService {
	  static matchByUrl(url) {
	    return VK_MATCHER.test(url);
	  }
	  static getDomains() {
	    return ['vk.com', 'vk.ru'];
	  }
	  getId() {
	    return 'vk';
	  }
	  getDomains() {
	    return ['vk.com'];
	  }
	  getMatcher() {
	    return VK_MATCHER;
	  }
	  getMatcherReplacement() {
	    return VK_EMBEDDED;
	  }
	}

	const RUTUBE_MATCHER = /(?:(?:https?:)?\/\/)?(?:www.)?rutube\.ru\/video\/(private\/)?(?<id>[\dA-Za-z]+)\/?/;
	const RUTUBE_EMBEDDED = 'https://rutube.ru/play/embed/$<id>';
	class Rutube extends BaseService {
	  static matchByUrl(url) {
	    return RUTUBE_MATCHER.test(url);
	  }
	  static getDomains() {
	    return ['rutube.ru', 'www.rutube.ru'];
	  }
	  getId() {
	    return 'rutube';
	  }
	  getMatcher() {
	    return RUTUBE_MATCHER;
	  }
	  getMatcherReplacement() {
	    return RUTUBE_EMBEDDED;
	  }
	}

	var _services = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("services");
	class VideoService {
	  static createByUrl(url) {
	    for (const ServiceClass of babelHelpers.classPrivateFieldLooseBase(this, _services)[_services]) {
	      if (ServiceClass.matchByUrl(url)) {
	        return new ServiceClass(url);
	      }
	    }
	    return null;
	  }
	  static createByHost(host) {
	    for (const ServiceClass of babelHelpers.classPrivateFieldLooseBase(this, _services)[_services]) {
	      if (ServiceClass.getDomains().includes(host)) {
	        return new ServiceClass(host);
	      }
	    }
	    return null;
	  }
	  static getEmbeddedUrl(url) {
	    const videoService = this.createByUrl(url);
	    if (videoService) {
	      return videoService.getEmbeddedUrl();
	    }
	    return null;
	  }
	}
	Object.defineProperty(VideoService, _services, {
	  writable: true,
	  value: [Youtube, Facebook, Vimeo, Instagram, VK, Rutube]
	});

	/* eslint-disable no-underscore-dangle, @bitrix24/bitrix24-rules/no-pseudo-private */
	class VideoNode extends ui_lexical_core.DecoratorNode {
	  constructor(src, width, height, key) {
	    super(key);
	    this.__width = 560;
	    this.__height = 315;
	    this.__provider = null;
	    this.__src = src;
	    if (main_core.Type.isNumber(width)) {
	      this.__width = Math.round(width);
	    }
	    if (main_core.Type.isNumber(height)) {
	      this.__height = Math.round(height);
	    }
	    const url = /^https?:/.test(src) ? src : `https://${src.replace(/^\/\//, '')}`;
	    const uri = new main_core.Uri(url);
	    const videoService = VideoService.createByHost(uri.getHost());
	    if (videoService) {
	      this.__provider = videoService.getId();
	    }
	  }
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
	    const className = theme.video;
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
	        provider: this.getProvider()
	      }
	    };
	  }
	  isInline() {
	    return true;
	  }
	}
	VideoNode.useDecoratorComponent = true;
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

	let _$8 = t => t,
	  _t$8,
	  _t2$6,
	  _t3$1;
	var _popup$2 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("popup");
	var _videoUrl = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("videoUrl");
	var _targetContainer$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("targetContainer");
	var _refs$5 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("refs");
	var _handleSaveBtnClick$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleSaveBtnClick");
	var _handleTextBoxKeyDown$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleTextBoxKeyDown");
	var _handleTextBoxInput = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleTextBoxInput");
	var _handleCancelBtnClick$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleCancelBtnClick");
	class VideoDialog extends main_core_events.EventEmitter {
	  constructor(options) {
	    super();
	    Object.defineProperty(this, _handleCancelBtnClick$1, {
	      value: _handleCancelBtnClick2$1
	    });
	    Object.defineProperty(this, _handleTextBoxInput, {
	      value: _handleTextBoxInput2
	    });
	    Object.defineProperty(this, _handleTextBoxKeyDown$1, {
	      value: _handleTextBoxKeyDown2$1
	    });
	    Object.defineProperty(this, _handleSaveBtnClick$1, {
	      value: _handleSaveBtnClick2$1
	    });
	    Object.defineProperty(this, _popup$2, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _videoUrl, {
	      writable: true,
	      value: ''
	    });
	    Object.defineProperty(this, _targetContainer$1, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _refs$5, {
	      writable: true,
	      value: new main_core_cache.MemoryCache()
	    });
	    this.setEventNamespace('BX.UI.TextEditor.VideoDialog');
	    const videoDialogOptions = main_core.Type.isPlainObject(options) ? options : {};
	    this.setTargetContainer(videoDialogOptions.targetContainer);
	    this.subscribeFromOptions(videoDialogOptions.events);
	  }
	  show(options = {}) {
	    var _options$target;
	    const target = (_options$target = options.target) != null ? _options$target : undefined;
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
	    return babelHelpers.classPrivateFieldLooseBase(this, _popup$2)[_popup$2] !== null && babelHelpers.classPrivateFieldLooseBase(this, _popup$2)[_popup$2].isShown();
	  }
	  destroy() {
	    this.getPopup().destroy();
	  }
	  setVideoUrl(url) {
	    if (main_core.Type.isString(url)) {
	      babelHelpers.classPrivateFieldLooseBase(this, _videoUrl)[_videoUrl] = sanitizeUrl(url);
	    }
	  }
	  getVideoUrl() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _videoUrl)[_videoUrl];
	  }
	  setTargetContainer(container) {
	    if (main_core.Type.isElementNode(container)) {
	      babelHelpers.classPrivateFieldLooseBase(this, _targetContainer$1)[_targetContainer$1] = container;
	    }
	  }
	  getTargetContainer() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _targetContainer$1)[_targetContainer$1];
	  }
	  getPopup() {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _popup$2)[_popup$2] === null) {
	      babelHelpers.classPrivateFieldLooseBase(this, _popup$2)[_popup$2] = new main_popup.Popup({
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
	    return babelHelpers.classPrivateFieldLooseBase(this, _popup$2)[_popup$2];
	  }
	  getContainer() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _refs$5)[_refs$5].remember('container', () => {
	      return main_core.Tag.render(_t$8 || (_t$8 = _$8`
				<div class="ui-text-editor-video-dialog">
					<div class="ui-text-editor-video-dialog-form">
						<div class="ui-ctl ui-ctl-textbox ui-ctl-s ui-ctl-inline ui-ctl-w100 ui-text-editor-video-dialog-textbox">
							<div class="ui-ctl-tag">${0}</div>
							${0}
						</div>
						<button type="button" 
							class="ui-text-editor-video-dialog-button" 
							onclick="${0}"
						>
							<span class="ui-icon-set --check"></span>
						</button>
						<button 
							type="button" 
							class="ui-text-editor-video-dialog-button"
							onclick="${0}"
						>
							<span class="ui-icon-set --cross-60"></span>
						</button>
					</div>
					${0}
				</div>
			`), main_core.Loc.getMessage('TEXT_EDITOR_VIDEO_INSERT_TITLE'), this.getUrlTextBox(), babelHelpers.classPrivateFieldLooseBase(this, _handleSaveBtnClick$1)[_handleSaveBtnClick$1].bind(this), babelHelpers.classPrivateFieldLooseBase(this, _handleCancelBtnClick$1)[_handleCancelBtnClick$1].bind(this), this.getStatusContainer());
	    });
	  }
	  getUrlTextBox() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _refs$5)[_refs$5].remember('url-textbox', () => {
	      return main_core.Tag.render(_t2$6 || (_t2$6 = _$8`
				<input 
					type="text"
					class="ui-ctl-element"
					placeholder="https://"
					value="${0}"
					onkeydown="${0}"
					oninput="${0}"
				>
			`), this.getVideoUrl(), babelHelpers.classPrivateFieldLooseBase(this, _handleTextBoxKeyDown$1)[_handleTextBoxKeyDown$1].bind(this), babelHelpers.classPrivateFieldLooseBase(this, _handleTextBoxInput)[_handleTextBoxInput].bind(this));
	    });
	  }
	  getStatusContainer() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _refs$5)[_refs$5].remember('status', () => {
	      return main_core.Tag.render(_t3$1 || (_t3$1 = _$8`
				<div class="ui-text-editor-video-dialog-status">${0}</div>
			`), main_core.Loc.getMessage('TEXT_EDITOR_VIDEO_INSERT_HINT'));
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
	}
	function _handleSaveBtnClick2$1() {
	  const url = this.getUrlTextBox().value.trim();
	  if (url.length > 0) {
	    this.setVideoUrl(url);
	    this.emit('onSave');
	  } else {
	    this.getUrlTextBox().focus();
	  }
	}
	function _handleTextBoxKeyDown2$1(event) {
	  if (event.key === 'Enter') {
	    event.preventDefault();
	    babelHelpers.classPrivateFieldLooseBase(this, _handleSaveBtnClick$1)[_handleSaveBtnClick$1]();
	  }
	}
	function _handleTextBoxInput2(event) {
	  this.emit('onInput');
	}
	function _handleCancelBtnClick2$1() {
	  this.emit('onCancel');
	}

	function validateVideoUrl(url) {
	  return /^(http:|https:|\/)/i.test(url);
	}

	/** @memberof BX.UI.TextEditor.Plugins.Video */
	const INSERT_VIDEO_COMMAND = ui_lexical_core.createCommand('INSERT_VIDEO_COMMAND');

	/** @memberof BX.UI.TextEditor.Plugins.Video */
	const INSERT_VIDEO_DIALOG_COMMAND = ui_lexical_core.createCommand('INSERT_VIDEO_DIALOG_COMMAND');
	var _videoDialog = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("videoDialog");
	var _onEditorScroll$2 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onEditorScroll");
	var _lastSelection$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("lastSelection");
	var _registerCommands$5 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("registerCommands");
	var _restoreSelection$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("restoreSelection");
	var _handleDialogDestroy$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleDialogDestroy");
	var _handleEditorScroll$2 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleEditorScroll");
	var _registerComponents$4 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("registerComponents");
	class VideoPlugin extends BasePlugin {
	  constructor(editor) {
	    super(editor);
	    Object.defineProperty(this, _registerComponents$4, {
	      value: _registerComponents2$4
	    });
	    Object.defineProperty(this, _handleEditorScroll$2, {
	      value: _handleEditorScroll2$2
	    });
	    Object.defineProperty(this, _handleDialogDestroy$1, {
	      value: _handleDialogDestroy2$1
	    });
	    Object.defineProperty(this, _restoreSelection$1, {
	      value: _restoreSelection2$1
	    });
	    Object.defineProperty(this, _registerCommands$5, {
	      value: _registerCommands2$5
	    });
	    Object.defineProperty(this, _videoDialog, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _onEditorScroll$2, {
	      writable: true,
	      value: babelHelpers.classPrivateFieldLooseBase(this, _handleEditorScroll$2)[_handleEditorScroll$2].bind(this)
	    });
	    Object.defineProperty(this, _lastSelection$1, {
	      writable: true,
	      value: null
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _registerCommands$5)[_registerCommands$5]();
	    babelHelpers.classPrivateFieldLooseBase(this, _registerComponents$4)[_registerComponents$4]();
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
	  destroy() {
	    super.destroy();
	    if (babelHelpers.classPrivateFieldLooseBase(this, _videoDialog)[_videoDialog] !== null) {
	      babelHelpers.classPrivateFieldLooseBase(this, _videoDialog)[_videoDialog].destroy();
	    }
	  }
	}
	function _registerCommands2$5() {
	  this.cleanUpRegister(this.getEditor().registerCommand(INSERT_VIDEO_COMMAND, payload => {
	    if (main_core.Type.isPlainObject(payload) && validateVideoUrl(payload.src)) {
	      const videoNode = $createVideoNode({
	        src: VideoService.getEmbeddedUrl(payload.src) || payload.src,
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
	    babelHelpers.classPrivateFieldLooseBase(this, _lastSelection$1)[_lastSelection$1] = selection.clone();
	    if (babelHelpers.classPrivateFieldLooseBase(this, _videoDialog)[_videoDialog] !== null) {
	      babelHelpers.classPrivateFieldLooseBase(this, _videoDialog)[_videoDialog].destroy();
	    }
	    this.getEditor().dispatchCommand(HIDE_DIALOG_COMMAND);
	    babelHelpers.classPrivateFieldLooseBase(this, _videoDialog)[_videoDialog] = new VideoDialog({
	      // for an embedded popup: document.body -> this.getEditor().getScrollerContainer()
	      targetContainer: document.body,
	      events: {
	        onSave: () => {
	          const url = babelHelpers.classPrivateFieldLooseBase(this, _videoDialog)[_videoDialog].getVideoUrl();
	          if (!main_core.Type.isStringFilled(url)) {
	            babelHelpers.classPrivateFieldLooseBase(this, _videoDialog)[_videoDialog].hide();
	            return;
	          }
	          if (!validateVideoUrl(url)) {
	            babelHelpers.classPrivateFieldLooseBase(this, _videoDialog)[_videoDialog].showError(main_core.Loc.getMessage('TEXT_EDITOR_INVALID_URL'));
	            return;
	          }
	          this.getEditor().dispatchCommand(INSERT_VIDEO_COMMAND, {
	            src: url
	          });
	          babelHelpers.classPrivateFieldLooseBase(this, _videoDialog)[_videoDialog].hide();
	        },
	        onInput: () => {
	          babelHelpers.classPrivateFieldLooseBase(this, _videoDialog)[_videoDialog].clearError();
	        },
	        onCancel: () => {
	          babelHelpers.classPrivateFieldLooseBase(this, _videoDialog)[_videoDialog].hide();
	        },
	        onShow: () => {
	          if ($adjustDialogPosition(babelHelpers.classPrivateFieldLooseBase(this, _videoDialog)[_videoDialog].getPopup(), this.getEditor())) {
	            main_core.Event.bind(this.getEditor().getScrollerContainer(), 'scroll', babelHelpers.classPrivateFieldLooseBase(this, _onEditorScroll$2)[_onEditorScroll$2]);
	            this.getEditor().highlightSelection();
	          }
	        },
	        onClose: () => {
	          babelHelpers.classPrivateFieldLooseBase(this, _handleDialogDestroy$1)[_handleDialogDestroy$1]();
	        },
	        onDestroy: () => {
	          babelHelpers.classPrivateFieldLooseBase(this, _handleDialogDestroy$1)[_handleDialogDestroy$1]();
	        }
	      }
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _videoDialog)[_videoDialog].show();
	    return true;
	  }, ui_lexical_core.COMMAND_PRIORITY_LOW), this.getEditor().registerCommand(HIDE_DIALOG_COMMAND, () => {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _videoDialog)[_videoDialog] !== null) {
	      babelHelpers.classPrivateFieldLooseBase(this, _videoDialog)[_videoDialog].hide();
	    }
	    return false;
	  }, ui_lexical_core.COMMAND_PRIORITY_LOW), this.getEditor().registerCommand(DIALOG_VISIBILITY_COMMAND, () => {
	    return babelHelpers.classPrivateFieldLooseBase(this, _videoDialog)[_videoDialog] !== null && babelHelpers.classPrivateFieldLooseBase(this, _videoDialog)[_videoDialog].isShown();
	  }, ui_lexical_core.COMMAND_PRIORITY_LOW));
	}
	function _restoreSelection2$1() {
	  const selection = ui_lexical_core.$getSelection();
	  if (!ui_lexical_core.$isRangeSelection(selection) && babelHelpers.classPrivateFieldLooseBase(this, _lastSelection$1)[_lastSelection$1] !== null) {
	    ui_lexical_core.$setSelection(babelHelpers.classPrivateFieldLooseBase(this, _lastSelection$1)[_lastSelection$1]);
	    babelHelpers.classPrivateFieldLooseBase(this, _lastSelection$1)[_lastSelection$1] = null;
	    return true;
	  }
	  return false;
	}
	function _handleDialogDestroy2$1() {
	  babelHelpers.classPrivateFieldLooseBase(this, _videoDialog)[_videoDialog] = null;
	  main_core.Event.unbind(this.getEditor().getScrollerContainer(), 'scroll', babelHelpers.classPrivateFieldLooseBase(this, _onEditorScroll$2)[_onEditorScroll$2]);
	  this.getEditor().resetHighlightSelection();
	  this.getEditor().update(() => {
	    if (!babelHelpers.classPrivateFieldLooseBase(this, _restoreSelection$1)[_restoreSelection$1]()) {
	      this.getEditor().focus();
	    }
	  });
	}
	function _handleEditorScroll2$2() {
	  this.getEditor().update(() => {
	    $adjustDialogPosition(babelHelpers.classPrivateFieldLooseBase(this, _videoDialog)[_videoDialog].getPopup(), this.getEditor());
	  });
	}
	function _registerComponents2$4() {
	  this.getEditor().getComponentRegistry().register('video', () => {
	    const button = new Button();
	    button.setContent('<span class="ui-icon-set --insert-video"></span>');
	    button.disableInsideUnformatted();
	    button.setTooltip(main_core.Loc.getMessage('TEXT_EDITOR_BTN_VIDEO'));
	    button.subscribe('onClick', () => {
	      if (babelHelpers.classPrivateFieldLooseBase(this, _videoDialog)[_videoDialog] !== null && babelHelpers.classPrivateFieldLooseBase(this, _videoDialog)[_videoDialog].isShown()) {
	        return;
	      }
	      this.getEditor().focus(() => {
	        this.getEditor().dispatchCommand(INSERT_VIDEO_DIALOG_COMMAND);
	      });
	    });
	    return button;
	  });
	}



	var Video = /*#__PURE__*/Object.freeze({
		VideoNode: VideoNode,
		$createVideoNode: $createVideoNode,
		$isVideoNode: $isVideoNode,
		INSERT_VIDEO_COMMAND: INSERT_VIDEO_COMMAND,
		INSERT_VIDEO_DIALOG_COMMAND: INSERT_VIDEO_DIALOG_COMMAND,
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
	  hashtag: 'ui-text-editor__hashtag',
	  heading: {
	    h1: 'ui-text-editor__h1',
	    h2: 'ui-text-editor__h2',
	    h3: 'ui-text-editor__h3',
	    h4: 'ui-text-editor__h4',
	    h5: 'ui-text-editor__h5',
	    h6: 'ui-text-editor__h6'
	  },
	  image: 'ui-text-editor__image',
	  indent: 'ui-text-editor__indent',
	  link: 'ui-text-editor__link',
	  list: {
	    listitem: 'ui-text-editor__listItem',
	    listitemChecked: 'ui-text-editor__listItemChecked',
	    listitemUnchecked: 'ui-text-editor__listItemUnchecked',
	    nested: {
	      listitem: 'ui-text-editor__nestedListItem'
	    },
	    olDepth: ['ui-text-editor__ol1', 'ui-text-editor__ol2', 'ui-text-editor__ol3', 'ui-text-editor__ol4', 'ui-text-editor__ol5'],
	    ul: 'ui-text-editor__ul'
	  },
	  ltr: 'ui-text-editor__ltr',
	  paragraph: 'ui-text-editor__paragraph',
	  quote: 'ui-text-editor__quote',
	  rtl: 'ui-text-editor__rtl',
	  text: {
	    bold: 'ui-text-editor__text-bold',
	    code: 'ui-text-editor__text-code',
	    italic: 'ui-text-editor__text-italic',
	    strikethrough: 'ui-text-editor__text-strikethrough',
	    subscript: 'ui-text-editor__text-subscript',
	    superscript: 'ui-text-editor__text-superscript',
	    underline: 'ui-text-editor__text-underline',
	    underlineStrikethrough: 'ui-text-editor__text-underline-strikethrough'
	  },
	  mention: 'ui-text-editor__mention',
	  code: 'ui-text-editor__code',
	  spoiler: {
	    container: 'ui-text-editor__spoiler',
	    title: 'ui-text-editor__spoiler-title',
	    content: 'ui-text-editor__spoiler-content'
	  },
	  smiley: 'ui-text-editor__smiley',
	  codeHighlight: {
	    operator: 'ui-text-editor__token-operator',
	    punctuation: 'ui-text-editor__token-punctuation',
	    comment: 'ui-text-editor__token-comment',
	    word: 'ui-text-editor__token-word',
	    keyword: 'ui-text-editor__token-keyword',
	    boolean: 'ui-text-editor__token-boolean',
	    regex: 'ui-text-editor__token-regex',
	    string: 'ui-text-editor__token-string',
	    number: 'ui-text-editor__token-number',
	    semicolon: 'ui-text-editor__token-semicolon',
	    bracket: 'ui-text-editor__token-bracket',
	    brace: 'ui-text-editor__token-brace',
	    parentheses: 'ui-text-editor__token-parentheses'
	  },
	  video: 'ui-text-editor__video',
	  table: 'ui-text-editor__table',
	  tableRow: 'ui-text-editor__table-row',
	  tableCell: 'ui-text-editor__table-cell',
	  tableCellHeader: 'ui-text-editor__table-cell-header',
	  tableSelection: 'ui-text-editor__table-selection',
	  file: {
	    file: 'ui-text-editor__file',
	    image: 'ui-text-editor__file-image',
	    video: 'ui-text-editor__file-video'
	  }
	};

	let _Symbol$iterator;
	var _pluginConstructors = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("pluginConstructors");
	var _plugins = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("plugins");
	var _availablePlugins = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("availablePlugins");
	_Symbol$iterator = Symbol.iterator;
	class PluginCollection {
	  constructor(builtinPlugins = [], plugins = [], pluginsToRemove = []) {
	    Object.defineProperty(this, _pluginConstructors, {
	      writable: true,
	      value: new Map()
	    });
	    Object.defineProperty(this, _plugins, {
	      writable: true,
	      value: new Map()
	    });
	    Object.defineProperty(this, _availablePlugins, {
	      writable: true,
	      value: new Map()
	    });
	    for (const pluginConstructor of builtinPlugins) {
	      if (pluginConstructor.getName()) {
	        babelHelpers.classPrivateFieldLooseBase(this, _availablePlugins)[_availablePlugins].set(pluginConstructor.getName(), pluginConstructor);
	      }
	    }
	    for (const plugin of plugins) {
	      if (main_core.Type.isFunction(plugin) && plugin.getName() && !babelHelpers.classPrivateFieldLooseBase(this, _availablePlugins)[_availablePlugins].has(plugin.getName())) {
	        babelHelpers.classPrivateFieldLooseBase(this, _availablePlugins)[_availablePlugins].set(plugin.getName(), plugin);
	      }
	    }
	    const pluginsToLoad = plugins.filter(plugin => {
	      if (pluginsToRemove.includes(plugin)) {
	        return false;
	      }
	      if (main_core.Type.isFunction(plugin) && pluginsToRemove.includes(plugin.getName())) {
	        return false;
	      }
	      return !pluginsToRemove.includes(babelHelpers.classPrivateFieldLooseBase(this, _availablePlugins)[_availablePlugins].get(plugin));
	    });
	    pluginsToLoad.map(plugin => {
	      return main_core.Type.isFunction(plugin) ? plugin : babelHelpers.classPrivateFieldLooseBase(this, _availablePlugins)[_availablePlugins].get(plugin);
	    }).forEach(pluginConstructor => {
	      if (main_core.Type.isFunction(pluginConstructor)) {
	        babelHelpers.classPrivateFieldLooseBase(this, _pluginConstructors)[_pluginConstructors].set(pluginConstructor.getName(), pluginConstructor);
	      }
	    });
	  }
	  init(textEditor) {
	    const instances = [];
	    for (const [, PluginConstruct] of babelHelpers.classPrivateFieldLooseBase(this, _pluginConstructors)[_pluginConstructors]) {
	      const plugin = new PluginConstruct(textEditor);
	      if (!(plugin instanceof BasePlugin)) {
	        throw new TypeError('TextEditor: a plugin must be an instance of TextEditor.BasePlugin.');
	      }
	      babelHelpers.classPrivateFieldLooseBase(this, _plugins)[_plugins].set(PluginConstruct.getName(), plugin);
	      instances.push(plugin);
	    }
	    instances.forEach(instance => {
	      instance.afterInit();
	    });
	  }
	  getConstructors() {
	    return [...babelHelpers.classPrivateFieldLooseBase(this, _pluginConstructors)[_pluginConstructors].values()];
	  }
	  getPlugins() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _plugins)[_plugins];
	  }
	  [_Symbol$iterator]() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _plugins)[_plugins][Symbol.iterator]();
	  }
	  get(key) {
	    const name = main_core.Type.isFunction(key) ? key.getName() : key;
	    return babelHelpers.classPrivateFieldLooseBase(this, _plugins)[_plugins].get(name) || null;
	  }
	  has(key) {
	    const name = main_core.Type.isFunction(key) ? key.getName() : key;
	    return babelHelpers.classPrivateFieldLooseBase(this, _plugins)[_plugins].has(name);
	  }
	}

	var _components = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("components");
	var _normalizeName = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("normalizeName");
	class ComponentRegistry {
	  constructor() {
	    Object.defineProperty(this, _components, {
	      writable: true,
	      value: new Map()
	    });
	  }
	  register(name, callback) {
	    babelHelpers.classPrivateFieldLooseBase(this, _components)[_components].set(babelHelpers.classPrivateFieldLooseBase(this.constructor, _normalizeName)[_normalizeName](name), {
	      callback
	    });
	  }
	  create(name) {
	    const component = babelHelpers.classPrivateFieldLooseBase(this, _components)[_components].get(babelHelpers.classPrivateFieldLooseBase(this.constructor, _normalizeName)[_normalizeName](name));
	    return component ? component.callback() : null;
	  }
	}
	function _normalizeName2(name) {
	  return String(name).toLowerCase();
	}
	Object.defineProperty(ComponentRegistry, _normalizeName, {
	  value: _normalizeName2
	});

	/* eslint-disable @bitrix24/bitrix24-rules/no-native-dom-methods */
	var _editor$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("editor");
	var _nodeTypeToBBCodeType = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("nodeTypeToBBCodeType");
	var _nodeValidation = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("nodeValidation");
	var _initNodeValidation = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("initNodeValidation");
	var _handleNodeTransform = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleNodeTransform");
	class SchemeValidation {
	  constructor(editor) {
	    Object.defineProperty(this, _handleNodeTransform, {
	      value: _handleNodeTransform2
	    });
	    Object.defineProperty(this, _initNodeValidation, {
	      value: _initNodeValidation2
	    });
	    Object.defineProperty(this, _editor$1, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _nodeTypeToBBCodeType, {
	      writable: true,
	      value: new Map()
	    });
	    Object.defineProperty(this, _nodeValidation, {
	      writable: true,
	      value: new Map()
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _editor$1)[_editor$1] = editor;
	    babelHelpers.classPrivateFieldLooseBase(this, _initNodeValidation)[_initNodeValidation]();
	  }
	  isNodeAllowed(parent, child) {
	    const parentCode = main_core.Type.isString(parent) ? parent : babelHelpers.classPrivateFieldLooseBase(this, _nodeTypeToBBCodeType)[_nodeTypeToBBCodeType].get(parent.getType());
	    const childCode = main_core.Type.isString(child) ? child : babelHelpers.classPrivateFieldLooseBase(this, _nodeTypeToBBCodeType)[_nodeTypeToBBCodeType].get(child.getType());
	    if (!parentCode) {
	      // eslint-disable-next-line no-console
	      console.warn(`TextEditor: parent node (${parent.getType()}) doesn't have a bbcode tag.`);
	    }
	    if (!childCode) {
	      // eslint-disable-next-line no-console
	      console.warn(`TextEditor: child node (${child.getType()}) doesn't have a bbcode tag.`);
	    }
	    return babelHelpers.classPrivateFieldLooseBase(this, _editor$1)[_editor$1].getBBCodeScheme().isChildAllowed(parentCode, childCode);
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
	function _initNodeValidation2() {
	  const handleNodeTransform = babelHelpers.classPrivateFieldLooseBase(this, _handleNodeTransform)[_handleNodeTransform].bind(this);
	  for (const [, plugin] of babelHelpers.classPrivateFieldLooseBase(this, _editor$1)[_editor$1].getPlugins()) {
	    const validation = plugin.validateScheme();
	    if (!main_core.Type.isPlainObject(validation)) {
	      continue;
	    }
	    if (main_core.Type.isArrayFilled(validation.nodes)) {
	      validation.nodes.forEach(nodeValidation => {
	        babelHelpers.classPrivateFieldLooseBase(this, _editor$1)[_editor$1].registerNodeTransform(nodeValidation.nodeClass, handleNodeTransform);
	        if (main_core.Type.isFunction(nodeValidation.validate)) {
	          babelHelpers.classPrivateFieldLooseBase(this, _nodeValidation)[_nodeValidation].set(nodeValidation.nodeClass.getType(), {
	            validate: nodeValidation.validate
	          });
	        }
	      });
	    }
	    if (main_core.Type.isPlainObject(validation.bbcodeMap)) {
	      for (const [nodeType, bbcodeTag] of Object.entries(validation.bbcodeMap)) {
	        babelHelpers.classPrivateFieldLooseBase(this, _nodeTypeToBBCodeType)[_nodeTypeToBBCodeType].set(nodeType, bbcodeTag);
	      }
	    }
	  }
	}
	function _handleNodeTransform2(node) {
	  const {
	    validate = null
	  } = babelHelpers.classPrivateFieldLooseBase(this, _nodeValidation)[_nodeValidation].get(node.getType()) || {};
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

	class RichTextPlugin extends BasePlugin {
	  constructor(editor) {
	    super(editor);
	    this.cleanUpRegister(ui_lexical_richText.registerRichText(editor.getLexicalEditor()));
	  }
	  static getName() {
	    return 'RichText';
	  }
	}

	var _registerComponents$5 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("registerComponents");
	class BoldPlugin extends BasePlugin {
	  constructor(editor) {
	    super(editor);
	    Object.defineProperty(this, _registerComponents$5, {
	      value: _registerComponents2$5
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _registerComponents$5)[_registerComponents$5]();
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
	}
	function _registerComponents2$5() {
	  this.getEditor().getComponentRegistry().register('bold', () => {
	    const button = new Button();
	    button.setContent('<span class="ui-icon-set --bold"></span>');
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



	var Bold = /*#__PURE__*/Object.freeze({
		BoldPlugin: BoldPlugin
	});

	var _registerComponents$6 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("registerComponents");
	class ItalicPlugin extends BasePlugin {
	  constructor(editor) {
	    super(editor);
	    Object.defineProperty(this, _registerComponents$6, {
	      value: _registerComponents2$6
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _registerComponents$6)[_registerComponents$6]();
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
	}
	function _registerComponents2$6() {
	  this.getEditor().getComponentRegistry().register('italic', () => {
	    const button = new Button();
	    button.setContent('<span class="ui-icon-set --italic"></span>');
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



	var Italic = /*#__PURE__*/Object.freeze({
		ItalicPlugin: ItalicPlugin
	});

	var _registerKeyModifierCommand = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("registerKeyModifierCommand");
	var _registerComponents$7 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("registerComponents");
	class StrikethroughPlugin extends BasePlugin {
	  constructor(editor) {
	    super(editor);
	    Object.defineProperty(this, _registerComponents$7, {
	      value: _registerComponents2$7
	    });
	    Object.defineProperty(this, _registerKeyModifierCommand, {
	      value: _registerKeyModifierCommand2
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _registerComponents$7)[_registerComponents$7]();
	    babelHelpers.classPrivateFieldLooseBase(this, _registerKeyModifierCommand)[_registerKeyModifierCommand]();
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
	}
	function _registerKeyModifierCommand2() {
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
	function _registerComponents2$7() {
	  this.getEditor().getComponentRegistry().register('strikethrough', () => {
	    const button = new Button();
	    button.setContent('<span class="ui-icon-set --strikethrough"></span>');
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



	var Strikethrough = /*#__PURE__*/Object.freeze({
		StrikethroughPlugin: StrikethroughPlugin
	});

	var _registerComponents$8 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("registerComponents");
	class UnderlinePlugin extends BasePlugin {
	  constructor(editor) {
	    super(editor);
	    Object.defineProperty(this, _registerComponents$8, {
	      value: _registerComponents2$8
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _registerComponents$8)[_registerComponents$8]();
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
	}
	function _registerComponents2$8() {
	  this.getEditor().getComponentRegistry().register('underline', () => {
	    const button = new Button();
	    button.setContent('<span class="ui-icon-set --underline"></span>');
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



	var Underline = /*#__PURE__*/Object.freeze({
		UnderlinePlugin: UnderlinePlugin
	});

	/* eslint-disable no-underscore-dangle */
	class QuoteNode extends ui_lexical_core.ElementNode {
	  static getType() {
	    return 'quote';
	  }
	  static clone(node) {
	    return new QuoteNode(node.__key);
	  }
	  createDOM(config, editor) {
	    var _config$theme;
	    const element = document.createElement('blockquote');
	    element.setAttribute('spellcheck', 'false');
	    if (main_core.Type.isStringFilled(config == null ? void 0 : (_config$theme = config.theme) == null ? void 0 : _config$theme.quote)) {
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
	    selection.insertLineBreak();
	    return null;
	  }
	}
	function $createQuoteNode() {
	  return ui_lexical_core.$applyNodeReplacement(new QuoteNode());
	}
	function $isQuoteNode(node) {
	  return node instanceof QuoteNode;
	}

	/** @memberof BX.UI.TextEditor.Plugins.Quote */
	const INSERT_QUOTE_COMMAND = ui_lexical_core.createCommand('INSERT_QUOTE_COMMAND');

	/** @memberof BX.UI.TextEditor.Plugins.Quote */
	const FORMAT_QUOTE_COMMAND = ui_lexical_core.createCommand('FORMAT_QUOTE_COMMAND');
	var _registerCommands$6 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("registerCommands");
	var _registerComponents$9 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("registerComponents");
	class QuotePlugin extends BasePlugin {
	  constructor(editor) {
	    super(editor);
	    Object.defineProperty(this, _registerComponents$9, {
	      value: _registerComponents2$9
	    });
	    Object.defineProperty(this, _registerCommands$6, {
	      value: _registerCommands2$6
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _registerCommands$6)[_registerCommands$6]();
	    babelHelpers.classPrivateFieldLooseBase(this, _registerComponents$9)[_registerComponents$9]();
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
	              return trimLineBreaks(childLexicalNodes);
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
	        nodeClass: QuoteNode
	      }],
	      bbcodeMap: {
	        quote: 'quote'
	      }
	    };
	  }
	}
	function _registerCommands2$6() {
	  this.cleanUpRegister(this.getEditor().registerCommand(INSERT_QUOTE_COMMAND, payload => {
	    const quoteNode = $createQuoteNode();
	    if (main_core.Type.isPlainObject(payload) && main_core.Type.isStringFilled(payload.content)) {
	      const nodes = $importFromBBCode(payload.content, this.getEditor(), false);
	      quoteNode.append(...nodes);
	      ui_lexical_utils.$insertNodeToNearestRoot(quoteNode);
	    } else {
	      ui_lexical_utils.$insertNodeToNearestRoot(quoteNode);
	      quoteNode.selectEnd();
	    }
	    return true;
	  }, ui_lexical_core.COMMAND_PRIORITY_EDITOR), this.getEditor().registerCommand(FORMAT_QUOTE_COMMAND, () => {
	    const selection = ui_lexical_core.$getSelection();
	    if (ui_lexical_core.$isRangeSelection(selection)) {
	      ui_lexical_selection.$setBlocksType(selection, () => $createQuoteNode());
	    }
	    return true;
	  }, ui_lexical_core.COMMAND_PRIORITY_EDITOR));
	}
	function _registerComponents2$9() {
	  this.getEditor().getComponentRegistry().register('quote', () => {
	    const button = new Button();
	    button.setContent('<span class="ui-icon-set --quote"></span>');
	    button.setBlockType('quote');
	    button.setTooltip(main_core.Loc.getMessage('TEXT_EDITOR_BTN_QUOTE'));
	    button.subscribe('onClick', () => {
	      this.getEditor().focus();
	      this.getEditor().update(() => {
	        if (button.isActive()) {
	          this.getEditor().dispatchCommand(FORMAT_PARAGRAPH_COMMAND);
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



	var Quote = /*#__PURE__*/Object.freeze({
		QuoteNode: QuoteNode,
		$createQuoteNode: $createQuoteNode,
		$isQuoteNode: $isQuoteNode,
		INSERT_QUOTE_COMMAND: INSERT_QUOTE_COMMAND,
		FORMAT_QUOTE_COMMAND: FORMAT_QUOTE_COMMAND,
		QuotePlugin: QuotePlugin
	});

	let _$9 = t => t,
	  _t$9,
	  _t2$7,
	  _t3$2;
	var _popup$3 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("popup");
	var _editMode = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("editMode");
	var _autoLinkMode = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("autoLinkMode");
	var _linkUrl = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("linkUrl");
	var _targetContainer$2 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("targetContainer");
	var _refs$6 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("refs");
	var _handleSaveBtnClick$2 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleSaveBtnClick");
	var _handleLinkTextBoxKeyDown = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleLinkTextBoxKeyDown");
	var _handleCancelBtnClick$2 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleCancelBtnClick");
	var _handleEditBtnClick = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleEditBtnClick");
	var _handleUnlinkBtnClick = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleUnlinkBtnClick");
	class LinkEditor extends main_core_events.EventEmitter {
	  constructor(options) {
	    super();
	    Object.defineProperty(this, _handleUnlinkBtnClick, {
	      value: _handleUnlinkBtnClick2
	    });
	    Object.defineProperty(this, _handleEditBtnClick, {
	      value: _handleEditBtnClick2
	    });
	    Object.defineProperty(this, _handleCancelBtnClick$2, {
	      value: _handleCancelBtnClick2$2
	    });
	    Object.defineProperty(this, _handleLinkTextBoxKeyDown, {
	      value: _handleLinkTextBoxKeyDown2
	    });
	    Object.defineProperty(this, _handleSaveBtnClick$2, {
	      value: _handleSaveBtnClick2$2
	    });
	    Object.defineProperty(this, _popup$3, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _editMode, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _autoLinkMode, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _linkUrl, {
	      writable: true,
	      value: ''
	    });
	    Object.defineProperty(this, _targetContainer$2, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _refs$6, {
	      writable: true,
	      value: new main_core_cache.MemoryCache()
	    });
	    this.setEventNamespace('BX.UI.TextEditor.LinkEditor');
	    const linkEditorOptions = main_core.Type.isPlainObject(options) ? options : {};
	    this.setTargetContainer(linkEditorOptions.targetContainer);
	    this.setLinkUrl(linkEditorOptions.linkUrl);
	    if (main_core.Type.isBoolean(linkEditorOptions.editMode)) {
	      this.setEditMode(linkEditorOptions.editMode);
	    } else {
	      this.setEditMode(babelHelpers.classPrivateFieldLooseBase(this, _linkUrl)[_linkUrl] === '');
	    }
	    this.setAutoLinkMode(options.autoLinkMode);
	    this.subscribeFromOptions(linkEditorOptions.events);
	  }
	  show(options = {}) {
	    var _options$target;
	    const target = (_options$target = options.target) != null ? _options$target : undefined;
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
	    return babelHelpers.classPrivateFieldLooseBase(this, _popup$3)[_popup$3] !== null && babelHelpers.classPrivateFieldLooseBase(this, _popup$3)[_popup$3].isShown();
	  }
	  hide() {
	    this.getPopup().close();
	  }
	  destroy() {
	    this.getPopup().destroy();
	  }
	  setAutoLinkMode(autoLinkMode = true) {
	    if (autoLinkMode === babelHelpers.classPrivateFieldLooseBase(this, _autoLinkMode)[_autoLinkMode]) {
	      return;
	    }
	    if (autoLinkMode) {
	      main_core.Dom.addClass(this.getContainer(), '--auto-link-mode');
	    } else {
	      main_core.Dom.removeClass(this.getContainer(), '--auto-link-mode');
	    }
	    if (babelHelpers.classPrivateFieldLooseBase(this, _popup$3)[_popup$3] !== null) {
	      babelHelpers.classPrivateFieldLooseBase(this, _popup$3)[_popup$3].adjustPosition();
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _autoLinkMode)[_autoLinkMode] = autoLinkMode;
	  }
	  setEditMode(editMode = true) {
	    if (editMode === babelHelpers.classPrivateFieldLooseBase(this, _editMode)[_editMode]) {
	      return;
	    }
	    if (editMode) {
	      main_core.Dom.addClass(this.getContainer(), '--edit-mode');
	    } else {
	      main_core.Dom.removeClass(this.getContainer(), '--edit-mode');
	    }
	    if (babelHelpers.classPrivateFieldLooseBase(this, _popup$3)[_popup$3] !== null) {
	      babelHelpers.classPrivateFieldLooseBase(this, _popup$3)[_popup$3].adjustPosition();
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _editMode)[_editMode] = editMode;
	  }
	  setLinkUrl(url) {
	    if (main_core.Type.isString(url)) {
	      babelHelpers.classPrivateFieldLooseBase(this, _linkUrl)[_linkUrl] = sanitizeUrl(url);
	      this.getLinkTextBox().value = babelHelpers.classPrivateFieldLooseBase(this, _linkUrl)[_linkUrl];
	      this.getLinkLabel().textContent = babelHelpers.classPrivateFieldLooseBase(this, _linkUrl)[_linkUrl];
	      this.getLinkLabel().href = babelHelpers.classPrivateFieldLooseBase(this, _linkUrl)[_linkUrl];
	    }
	  }
	  getLinkUrl() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _linkUrl)[_linkUrl];
	  }
	  setTargetContainer(container) {
	    if (main_core.Type.isElementNode(container)) {
	      babelHelpers.classPrivateFieldLooseBase(this, _targetContainer$2)[_targetContainer$2] = container;
	    }
	  }
	  getTargetContainer() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _targetContainer$2)[_targetContainer$2];
	  }
	  getPopup() {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _popup$3)[_popup$3] === null) {
	      babelHelpers.classPrivateFieldLooseBase(this, _popup$3)[_popup$3] = new main_popup.Popup({
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
	            if (babelHelpers.classPrivateFieldLooseBase(this, _editMode)[_editMode]) {
	              this.getLinkTextBox().focus();
	            }
	          }
	        }
	      });
	    }
	    return babelHelpers.classPrivateFieldLooseBase(this, _popup$3)[_popup$3];
	  }
	  getContainer() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _refs$6)[_refs$6].remember('container', () => {
	      return main_core.Tag.render(_t$9 || (_t$9 = _$9`
				<div class="ui-text-editor-link-editor">
					<div class="ui-text-editor-link-form">
						<div class="ui-ctl ui-ctl-textbox ui-ctl-s ui-ctl-inline ui-ctl-w100 ui-text-editor-link-textbox">
							<div class="ui-ctl-tag">${0}</div>
							${0}
						</div>
						<button type="button" 
							class="ui-text-editor-link-form-button" 
							onclick="${0}"
						>
							<span class="ui-icon-set --check"></span>
						</button>
						<button 
							type="button" 
							class="ui-text-editor-link-form-button"
							onclick="${0}"
						>
							<span class="ui-icon-set --cross-60"></span>
						</button>
					</div>
					<div class="ui-text-editor-link-preview">
						${0}
						<button 
							type="button" 
							class="ui-text-editor-link-form-button"
							onclick="${0}"
						>
							<span class="ui-icon-set --pencil-60"></span>
						</button>
						<button 
							type="button" 
							class="ui-text-editor-link-form-button ui-text-editor-link-form-delete-btn"
							onclick="${0}"
						>
							<span class="ui-icon-set --delete-hyperlink"></span>
						</button>
					</div>
				</div>
			`), main_core.Loc.getMessage('TEXT_EDITOR_LINK_URL'), this.getLinkTextBox(), babelHelpers.classPrivateFieldLooseBase(this, _handleSaveBtnClick$2)[_handleSaveBtnClick$2].bind(this), babelHelpers.classPrivateFieldLooseBase(this, _handleCancelBtnClick$2)[_handleCancelBtnClick$2].bind(this), this.getLinkLabel(), babelHelpers.classPrivateFieldLooseBase(this, _handleEditBtnClick)[_handleEditBtnClick].bind(this), babelHelpers.classPrivateFieldLooseBase(this, _handleUnlinkBtnClick)[_handleUnlinkBtnClick].bind(this));
	    });
	  }
	  getLinkTextBox() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _refs$6)[_refs$6].remember('link-textbox', () => {
	      return main_core.Tag.render(_t2$7 || (_t2$7 = _$9`
				<input 
					type="text"
					class="ui-ctl-element"
					placeholder="https://"
					value="${0}"
					onkeydown="${0}"
				>
			`), this.getLinkUrl(), babelHelpers.classPrivateFieldLooseBase(this, _handleLinkTextBoxKeyDown)[_handleLinkTextBoxKeyDown].bind(this));
	    });
	  }
	  getLinkLabel() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _refs$6)[_refs$6].remember('link-label', () => {
	      return main_core.Tag.render(_t3$2 || (_t3$2 = _$9`
				<a href="" target="_blank" class="ui-text-editor-link-label"></a>
			`));
	    });
	  }
	}
	function _handleSaveBtnClick2$2() {
	  const url = this.getLinkTextBox().value.trim();
	  if (url.length > 0) {
	    this.setLinkUrl(url);
	    this.emit('onSave');
	  } else {
	    this.getLinkTextBox().focus();
	  }
	}
	function _handleLinkTextBoxKeyDown2(event) {
	  if (event.key === 'Enter') {
	    event.preventDefault();
	    babelHelpers.classPrivateFieldLooseBase(this, _handleSaveBtnClick$2)[_handleSaveBtnClick$2]();
	  }
	}
	function _handleCancelBtnClick2$2() {
	  this.emit('onCancel');
	}
	function _handleEditBtnClick2() {
	  this.setEditMode(true);
	  this.getLinkTextBox().focus();
	  this.getLinkTextBox().select();
	}
	function _handleUnlinkBtnClick2() {
	  this.emit('onUnlink');
	}

	function validateUrl(url) {
	  return /^(http:|https:|mailto:|tel:|sms:)/i.test(url);
	}

	/* eslint-disable no-underscore-dangle */
	const INSERT_LINK_DIALOG_COMMAND = ui_lexical_core.createCommand('INSERT_LINK_DIALOG_COMMAND');
	var _linkEditor = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("linkEditor");
	var _onEditorScroll$3 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onEditorScroll");
	var _lastSelection$2 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("lastSelection");
	var _registerListeners$4 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("registerListeners");
	var _registerCommands$7 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("registerCommands");
	var _registerToggleLinkCommand = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("registerToggleLinkCommand");
	var _registerInsertLinkCommand = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("registerInsertLinkCommand");
	var _restoreSelection$2 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("restoreSelection");
	var _handleDialogDestroy$2 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleDialogDestroy");
	var _handleEditorScroll$3 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleEditorScroll");
	var _registerKeyModifierCommand$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("registerKeyModifierCommand");
	var _registerPasteCommand = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("registerPasteCommand");
	var _insertLink = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("insertLink");
	var _isLinkSelected = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isLinkSelected");
	var _convertAutoLinkToLink = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("convertAutoLinkToLink");
	var _registerComponents$a = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("registerComponents");
	class LinkPlugin extends BasePlugin {
	  constructor(editor) {
	    super(editor);
	    Object.defineProperty(this, _registerComponents$a, {
	      value: _registerComponents2$a
	    });
	    Object.defineProperty(this, _convertAutoLinkToLink, {
	      value: _convertAutoLinkToLink2
	    });
	    Object.defineProperty(this, _isLinkSelected, {
	      value: _isLinkSelected2
	    });
	    Object.defineProperty(this, _insertLink, {
	      value: _insertLink2
	    });
	    Object.defineProperty(this, _registerPasteCommand, {
	      value: _registerPasteCommand2
	    });
	    Object.defineProperty(this, _registerKeyModifierCommand$1, {
	      value: _registerKeyModifierCommand2$1
	    });
	    Object.defineProperty(this, _handleEditorScroll$3, {
	      value: _handleEditorScroll2$3
	    });
	    Object.defineProperty(this, _handleDialogDestroy$2, {
	      value: _handleDialogDestroy2$2
	    });
	    Object.defineProperty(this, _restoreSelection$2, {
	      value: _restoreSelection2$2
	    });
	    Object.defineProperty(this, _registerInsertLinkCommand, {
	      value: _registerInsertLinkCommand2
	    });
	    Object.defineProperty(this, _registerToggleLinkCommand, {
	      value: _registerToggleLinkCommand2
	    });
	    Object.defineProperty(this, _registerCommands$7, {
	      value: _registerCommands2$7
	    });
	    Object.defineProperty(this, _registerListeners$4, {
	      value: _registerListeners2$4
	    });
	    Object.defineProperty(this, _linkEditor, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _onEditorScroll$3, {
	      writable: true,
	      value: babelHelpers.classPrivateFieldLooseBase(this, _handleEditorScroll$3)[_handleEditorScroll$3].bind(this)
	    });
	    Object.defineProperty(this, _lastSelection$2, {
	      writable: true,
	      value: null
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _registerCommands$7)[_registerCommands$7]();
	    babelHelpers.classPrivateFieldLooseBase(this, _registerListeners$4)[_registerListeners$4]();
	    babelHelpers.classPrivateFieldLooseBase(this, _registerComponents$a)[_registerComponents$a]();
	  }
	  static getName() {
	    return 'Link';
	  }
	  static getNodes(editor) {
	    return [ui_lexical_link.LinkNode];
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
	      link: lexicalNode => {
	        const url = lexicalNode.getURL();
	        const children = lexicalNode.getChildren();
	        const isSimpleText = children.length === 1 && ui_lexical_core.$isTextNode(children[0]) && children[0].getFormat() === 0;
	        const scheme = this.getEditor().getBBCodeScheme();
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
	    };
	  }
	  validateScheme() {
	    return {
	      nodes: [{
	        nodeClass: ui_lexical_link.LinkNode
	      }],
	      bbcodeMap: {
	        link: 'url'
	      }
	    };
	  }
	  destroy() {
	    super.destroy();
	    if (babelHelpers.classPrivateFieldLooseBase(this, _linkEditor)[_linkEditor] !== null) {
	      babelHelpers.classPrivateFieldLooseBase(this, _linkEditor)[_linkEditor].destroy();
	    }
	  }
	}
	function _registerListeners2$4() {
	  this.cleanUpRegister(this.getEditor().registerEventListener(ui_lexical_link.LinkNode, 'click', (event, nodeKey) => {
	    const linkNode = ui_lexical_core.$getNodeByKey(nodeKey);
	    if (ui_lexical_link.$isLinkNode(linkNode)) {
	      this.getEditor().dispatchCommand(INSERT_LINK_DIALOG_COMMAND, linkNode);
	    }
	  }));
	}
	function _registerCommands2$7() {
	  this.cleanUpRegister(babelHelpers.classPrivateFieldLooseBase(this, _registerToggleLinkCommand)[_registerToggleLinkCommand](), babelHelpers.classPrivateFieldLooseBase(this, _registerInsertLinkCommand)[_registerInsertLinkCommand](), babelHelpers.classPrivateFieldLooseBase(this, _registerKeyModifierCommand$1)[_registerKeyModifierCommand$1](), babelHelpers.classPrivateFieldLooseBase(this, _registerPasteCommand)[_registerPasteCommand]());
	}
	function _registerToggleLinkCommand2() {
	  return this.getEditor().registerCommand(ui_lexical_link.TOGGLE_LINK_COMMAND, payload => {
	    if (payload === null) {
	      ui_lexical_link.toggleLink(payload);
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
	        if (selection.isCollapsed() && !babelHelpers.classPrivateFieldLooseBase(this, _isLinkSelected)[_isLinkSelected](selection)) {
	          babelHelpers.classPrivateFieldLooseBase(this, _insertLink)[_insertLink](selection, url, attributes, originalUrl);
	        } else {
	          ui_lexical_link.toggleLink(url, attributes);
	        }
	        return true;
	      }
	      return false;
	    }
	    return false;
	  }, ui_lexical_core.COMMAND_PRIORITY_LOW);
	}
	function _registerInsertLinkCommand2() {
	  return ui_lexical_utils.mergeRegister(this.getEditor().registerCommand(INSERT_LINK_DIALOG_COMMAND, payload => {
	    const selection = ui_lexical_core.$getSelection();
	    if (!ui_lexical_core.$isRangeSelection(selection) || !this.getEditor().isEditable()) {
	      return false;
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _lastSelection$2)[_lastSelection$2] = selection.clone();
	    if (babelHelpers.classPrivateFieldLooseBase(this, _linkEditor)[_linkEditor] !== null) {
	      babelHelpers.classPrivateFieldLooseBase(this, _linkEditor)[_linkEditor].destroy();
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
	    this.getEditor().dispatchCommand(HIDE_DIALOG_COMMAND);
	    babelHelpers.classPrivateFieldLooseBase(this, _linkEditor)[_linkEditor] = new LinkEditor({
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
	              babelHelpers.classPrivateFieldLooseBase(this, _restoreSelection$2)[_restoreSelection$2]();
	              this.getEditor().dispatchCommand(ui_lexical_link.TOGGLE_LINK_COMMAND, {
	                url,
	                originalUrl
	              });
	              linkEditor.setEditMode(false);
	              const currentSelection = ui_lexical_core.$getSelection();
	              if (ui_lexical_core.$isRangeSelection(currentSelection)) {
	                babelHelpers.classPrivateFieldLooseBase(this, _lastSelection$2)[_lastSelection$2] = currentSelection.clone();
	              }
	              if (!ui_lexical_core.$isRangeSelection(currentSelection) || currentSelection.isCollapsed()) {
	                linkEditor.hide();
	              }
	              babelHelpers.classPrivateFieldLooseBase(this, _convertAutoLinkToLink)[_convertAutoLinkToLink](currentSelection);
	            });
	          } else {
	            this.getEditor().update(() => {
	              lineNode.setURL(url);
	              babelHelpers.classPrivateFieldLooseBase(this, _convertAutoLinkToLink)[_convertAutoLinkToLink](ui_lexical_core.$getSelection());
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
	          if ($adjustDialogPosition(babelHelpers.classPrivateFieldLooseBase(this, _linkEditor)[_linkEditor].getPopup(), this.getEditor())) {
	            main_core.Event.bind(this.getEditor().getScrollerContainer(), 'scroll', babelHelpers.classPrivateFieldLooseBase(this, _onEditorScroll$3)[_onEditorScroll$3]);
	            this.getEditor().highlightSelection();
	          }
	        },
	        onClose: () => {
	          babelHelpers.classPrivateFieldLooseBase(this, _handleDialogDestroy$2)[_handleDialogDestroy$2]();
	        },
	        onDestroy: () => {
	          babelHelpers.classPrivateFieldLooseBase(this, _handleDialogDestroy$2)[_handleDialogDestroy$2]();
	        }
	      }
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _linkEditor)[_linkEditor].show();
	    return true;
	  }, ui_lexical_core.COMMAND_PRIORITY_LOW), this.getEditor().registerCommand(HIDE_DIALOG_COMMAND, () => {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _linkEditor)[_linkEditor] !== null) {
	      babelHelpers.classPrivateFieldLooseBase(this, _linkEditor)[_linkEditor].destroy();
	    }
	    return false;
	  }, ui_lexical_core.COMMAND_PRIORITY_LOW), this.getEditor().registerCommand(DIALOG_VISIBILITY_COMMAND, () => {
	    return babelHelpers.classPrivateFieldLooseBase(this, _linkEditor)[_linkEditor] !== null && babelHelpers.classPrivateFieldLooseBase(this, _linkEditor)[_linkEditor].isShown();
	  }, ui_lexical_core.COMMAND_PRIORITY_LOW));
	}
	function _restoreSelection2$2() {
	  const selection = ui_lexical_core.$getSelection();
	  if (!ui_lexical_core.$isRangeSelection(selection) && babelHelpers.classPrivateFieldLooseBase(this, _lastSelection$2)[_lastSelection$2] !== null) {
	    ui_lexical_core.$setSelection(babelHelpers.classPrivateFieldLooseBase(this, _lastSelection$2)[_lastSelection$2]);
	    babelHelpers.classPrivateFieldLooseBase(this, _lastSelection$2)[_lastSelection$2] = null;
	    return true;
	  }
	  return false;
	}
	function _handleDialogDestroy2$2() {
	  babelHelpers.classPrivateFieldLooseBase(this, _linkEditor)[_linkEditor] = null;
	  main_core.Event.unbind(this.getEditor().getScrollerContainer(), 'scroll', babelHelpers.classPrivateFieldLooseBase(this, _onEditorScroll$3)[_onEditorScroll$3]);
	  this.getEditor().resetHighlightSelection();
	  this.getEditor().update(() => {
	    if (!babelHelpers.classPrivateFieldLooseBase(this, _restoreSelection$2)[_restoreSelection$2]()) {
	      this.getEditor().focus();
	    }
	  });
	}
	function _handleEditorScroll2$3() {
	  this.getEditor().update(() => {
	    $adjustDialogPosition(babelHelpers.classPrivateFieldLooseBase(this, _linkEditor)[_linkEditor].getPopup(), this.getEditor());
	  });
	}
	function _registerKeyModifierCommand2$1() {
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
	function _registerPasteCommand2() {
	  return this.getEditor().registerCommand(ui_lexical_core.PASTE_COMMAND, event => {
	    const selection = ui_lexical_core.$getSelection();
	    if (!ui_lexical_core.$isRangeSelection(selection) || selection.isCollapsed() || !(event instanceof ClipboardEvent) || event.clipboardData === null) {
	      return false;
	    }
	    const clipboardText = event.clipboardData.getData('text');
	    if (!validateUrl(clipboardText)) {
	      return false;
	    }

	    // If we select nodes that are elements then avoid applying the link.
	    if (!selection.getNodes().some(node => ui_lexical_core.$isElementNode(node))) {
	      ui_lexical_link.toggleLink(clipboardText);
	      event.preventDefault();
	      return true;
	    }
	    return false;
	  }, ui_lexical_core.COMMAND_PRIORITY_LOW);
	}
	function _insertLink2(selection, url, attributes, originalUrl) {
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
	function _isLinkSelected2(selection) {
	  const node = getSelectedNode(selection);
	  const parent = node.getParent();
	  return ui_lexical_link.$isLinkNode(parent) || ui_lexical_link.$isLinkNode(node);
	}
	function _convertAutoLinkToLink2(selection) {
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
	function _registerComponents2$a() {
	  this.getEditor().getComponentRegistry().register('link', () => {
	    const button = new Button();
	    button.setContent('<span class="ui-icon-set --link-3"></span>');
	    button.setTooltip(main_core.Loc.getMessage('TEXT_EDITOR_BTN_LINK'));
	    button.setBlockType('link');
	    button.disableInsideUnformatted();
	    button.setTooltip(main_core.Loc.getMessage('TEXT_EDITOR_BTN_LINK', {
	      '#keystroke#': main_core.Browser.isMac() ? '⌘K' : 'Ctrl+K'
	    }));
	    button.subscribe('onClick', () => {
	      if (babelHelpers.classPrivateFieldLooseBase(this, _linkEditor)[_linkEditor] !== null && babelHelpers.classPrivateFieldLooseBase(this, _linkEditor)[_linkEditor].isShown()) {
	        return;
	      }
	      this.getEditor().focus(() => {
	        this.getEditor().dispatchCommand(INSERT_LINK_DIALOG_COMMAND);
	      });
	    });
	    return button;
	  });
	}



	var Link = /*#__PURE__*/Object.freeze({
		INSERT_LINK_DIALOG_COMMAND: INSERT_LINK_DIALOG_COMMAND,
		LinkPlugin: LinkPlugin
	});

	const URL_REGEX = /((https?:\/\/(www\.)?)|(www\.))[\w#%+.:=@~-]{1,256}\.[\d()A-Za-z]{1,6}\b([\w#%&()+./:=?@~-]*)/;
	const EMAIL_REGEX = /(([^\s"(),.:;<>@[\\\]]+(\.[^\s"(),.:;<>@[\\\]]+)*)|(".+"))@((\[(?:\d{1,3}\.){3}\d{1,3}])|(([\dA-Za-z-]+\.)+[A-Za-z]{2,}))/;
	const MATCHERS = [createLinkMatcherWithRegExp(URL_REGEX, text => {
	  return text.startsWith('http') ? text : `https://${text}`;
	}), createLinkMatcherWithRegExp(EMAIL_REGEX, text => {
	  return `mailto:${text}`;
	})];
	var _registerListeners$5 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("registerListeners");
	class AutoLinkPlugin extends BasePlugin {
	  constructor(editor) {
	    super(editor);
	    Object.defineProperty(this, _registerListeners$5, {
	      value: _registerListeners2$5
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _registerListeners$5)[_registerListeners$5]();
	  }
	  static getName() {
	    return 'AutoLink';
	  }
	  static getNodes(editor) {
	    return [ui_lexical_link.AutoLinkNode];
	  }
	  validateScheme() {
	    return {
	      nodes: [{
	        nodeClass: ui_lexical_link.AutoLinkNode
	      }],
	      bbcodeMap: {
	        autolink: 'url'
	      }
	    };
	  }
	}
	function _registerListeners2$5() {
	  const onChange = (url, prevUrl) => {};
	  this.cleanUpRegister(this.getEditor().registerNodeTransform(ui_lexical_core.TextNode, textNode => {
	    const parent = textNode.getParentOrThrow();
	    const previous = textNode.getPreviousSibling();
	    if (ui_lexical_link.$isAutoLinkNode(parent)) {
	      handleLinkEdit(parent, MATCHERS, onChange);
	    } else if (!ui_lexical_link.$isLinkNode(parent)) {
	      if (textNode.isSimpleText() && (startsWithSeparator(textNode.getTextContent()) || !ui_lexical_link.$isAutoLinkNode(previous))) {
	        handleLinkCreation(textNode, MATCHERS, onChange);
	      }
	      handleBadNeighbors(textNode, MATCHERS, onChange);
	    }
	  }));
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
	  if (ui_lexical_link.$isAutoLinkNode(previousSibling) && !startsWithSeparator(text)) {
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
		AutoLinkPlugin: AutoLinkPlugin
	});

	var _registerListeners$6 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("registerListeners");
	class TabIndentPlugin extends BasePlugin {
	  constructor(editor) {
	    super(editor);
	    Object.defineProperty(this, _registerListeners$6, {
	      value: _registerListeners2$6
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _registerListeners$6)[_registerListeners$6]();
	  }
	  static getName() {
	    return 'TabIndent';
	  }
	}
	function _registerListeners2$6() {
	  this.cleanUpRegister(this.getEditor().registerCommand(ui_lexical_core.KEY_TAB_COMMAND, event => {
	    const selection = ui_lexical_core.$getSelection();
	    if (!ui_lexical_core.$isRangeSelection(selection)) {
	      return false;
	    }
	    event.preventDefault();
	    return this.getEditor().dispatchCommand(event.shiftKey ? ui_lexical_core.OUTDENT_CONTENT_COMMAND : ui_lexical_core.INDENT_CONTENT_COMMAND);
	  }, ui_lexical_core.COMMAND_PRIORITY_EDITOR),
	  // Turn off RichText built-in indents
	  this.getEditor().registerCommand(ui_lexical_core.INDENT_CONTENT_COMMAND, event => {
	    const selection = ui_lexical_core.$getSelection();
	    return !$isSelectionInList(selection);
	  }, ui_lexical_core.COMMAND_PRIORITY_LOW), this.getEditor().registerCommand(ui_lexical_core.OUTDENT_CONTENT_COMMAND, event => {
	    const selection = ui_lexical_core.$getSelection();
	    return !$isSelectionInList(selection);
	  }, ui_lexical_core.COMMAND_PRIORITY_LOW));
	}
	function $isSelectionInList(selection) {
	  if (!ui_lexical_core.$isRangeSelection(selection)) {
	    return false;
	  }
	  const isBackward = selection.isBackward();
	  const firstPoint = isBackward ? selection.focus : selection.anchor;
	  const firstNode = firstPoint.getNode();
	  if (ui_lexical_list.$isListItemNode(firstNode) && firstPoint.offset === 0) {
	    return true;
	  }
	  const parentNode = ui_lexical_utils.$findMatchingParent(firstNode, node => ui_lexical_core.$isElementNode(node) && !node.isInline());
	  return ui_lexical_list.$isListItemNode(parentNode) && firstPoint.offset === 0;
	}



	var TabIndent = /*#__PURE__*/Object.freeze({
		TabIndentPlugin: TabIndentPlugin
	});

	var _registerListeners$7 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("registerListeners");
	var _registerComponents$b = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("registerComponents");
	var _isIndentPermitted = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isIndentPermitted");
	var _getElementNodesInSelection = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getElementNodesInSelection");
	class ListPlugin extends BasePlugin {
	  constructor(editor) {
	    super(editor);
	    Object.defineProperty(this, _getElementNodesInSelection, {
	      value: _getElementNodesInSelection2
	    });
	    Object.defineProperty(this, _isIndentPermitted, {
	      value: _isIndentPermitted2
	    });
	    Object.defineProperty(this, _registerComponents$b, {
	      value: _registerComponents2$b
	    });
	    Object.defineProperty(this, _registerListeners$7, {
	      value: _registerListeners2$7
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _registerListeners$7)[_registerListeners$7]();
	    babelHelpers.classPrivateFieldLooseBase(this, _registerComponents$b)[_registerComponents$b]();
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
	}
	function _registerListeners2$7() {
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
	  }, ui_lexical_core.COMMAND_PRIORITY_LOW), this.getEditor().registerCommand(ui_lexical_core.INDENT_CONTENT_COMMAND, () => !babelHelpers.classPrivateFieldLooseBase(this, _isIndentPermitted)[_isIndentPermitted](1), ui_lexical_core.COMMAND_PRIORITY_CRITICAL));
	}
	function _registerComponents2$b() {
	  this.getEditor().getComponentRegistry().register('bulleted-list', () => {
	    const button = new Button();
	    button.setContent('<span class="ui-icon-set --bulleted-list"></span>');
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
	    button.setContent('<span class="ui-icon-set --numbered-list"></span>');
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
	function _isIndentPermitted2(maxDepth) {
	  const selection = ui_lexical_core.$getSelection();
	  if (!ui_lexical_core.$isRangeSelection(selection)) {
	    return false;
	  }
	  const elementNodesInSelection = babelHelpers.classPrivateFieldLooseBase(this, _getElementNodesInSelection)[_getElementNodesInSelection](selection);
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
	  return totalDepth <= maxDepth;
	}
	function _getElementNodesInSelection2(selection) {
	  const nodesInSelection = selection.getNodes();
	  const predicate = node => ui_lexical_core.$isElementNode(node) && !node.isInline();
	  if (nodesInSelection.length === 0) {
	    return new Set([ui_lexical_utils.$findMatchingParent(selection.anchor.getNode(), predicate), ui_lexical_utils.$findMatchingParent(selection.focus.getNode(), predicate)]);
	  }
	  return new Set(nodesInSelection.map(n => ui_lexical_core.$isElementNode(n) ? n : ui_lexical_utils.$findMatchingParent(n, predicate)));
	}



	var List = /*#__PURE__*/Object.freeze({
		ListPlugin: ListPlugin
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
	    var _config$theme, _config$theme$spoiler;
	    const dom = document.createElement('div');
	    if (main_core.Type.isStringFilled(config == null ? void 0 : (_config$theme = config.theme) == null ? void 0 : (_config$theme$spoiler = _config$theme.spoiler) == null ? void 0 : _config$theme$spoiler.content)) {
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
	        if (!domNode.hasAttribute('data-lexical-spoiler-content')) {
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
	    element.setAttribute('data-lexical-spoiler-content', 'true');
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
	    } else {
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
	const INSERT_SPOILER_COMMAND = ui_lexical_core.createCommand('INSERT_SPOILER_COMMAND');
	const REMOVE_SPOILER_COMMAND = ui_lexical_core.createCommand('REMOVE_SPOILER_COMMAND');
	var _registerComponents$c = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("registerComponents");
	var _registerCommands$8 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("registerCommands");
	var _registerNodeTransforms = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("registerNodeTransforms");
	var _handleDeleteCharacter = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleDeleteCharacter");
	var _handleEnter = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleEnter");
	var _handleEscapeUp = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleEscapeUp");
	var _handleEscapeDown = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleEscapeDown");
	var _handlePaste = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handlePaste");
	class SpoilerPlugin extends BasePlugin {
	  constructor(editor) {
	    super(editor);
	    Object.defineProperty(this, _handlePaste, {
	      value: _handlePaste2
	    });
	    Object.defineProperty(this, _handleEscapeDown, {
	      value: _handleEscapeDown2
	    });
	    Object.defineProperty(this, _handleEscapeUp, {
	      value: _handleEscapeUp2
	    });
	    Object.defineProperty(this, _handleEnter, {
	      value: _handleEnter2
	    });
	    Object.defineProperty(this, _handleDeleteCharacter, {
	      value: _handleDeleteCharacter2
	    });
	    Object.defineProperty(this, _registerNodeTransforms, {
	      value: _registerNodeTransforms2
	    });
	    Object.defineProperty(this, _registerCommands$8, {
	      value: _registerCommands2$8
	    });
	    Object.defineProperty(this, _registerComponents$c, {
	      value: _registerComponents2$c
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _registerNodeTransforms)[_registerNodeTransforms]();
	    babelHelpers.classPrivateFieldLooseBase(this, _registerCommands$8)[_registerCommands$8]();
	    babelHelpers.classPrivateFieldLooseBase(this, _registerComponents$c)[_registerComponents$c]();
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
	              return [$createSpoilerTitleNode().append($createSpoilerTitleTextNode(title)), $createSpoilerContentNode().append(...$normalizeTextNodes(childLexicalNodes, this.getEditor()))];
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
	        spoiler: 'spoiler',
	        'spoiler-content': 'spoiler'
	      }
	    };
	  }
	}
	function _registerComponents2$c() {
	  this.getEditor().getComponentRegistry().register('spoiler', () => {
	    const button = new Button();
	    button.setContent('<span class="ui-icon-set --insert-spoiler"></span>');
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
	function _registerCommands2$8() {
	  this.cleanUpRegister(
	  // This handles the case when container is collapsed and we delete its previous sibling
	  // into it, it would cause collapsed content deleted (since it's display: none, and selection
	  // swallows it when deletes single char). Instead we expand container, which is although
	  // not perfect, but avoids bigger problem
	  this.getEditor().registerCommand(ui_lexical_core.DELETE_CHARACTER_COMMAND, babelHelpers.classPrivateFieldLooseBase(this, _handleDeleteCharacter)[_handleDeleteCharacter].bind(this), ui_lexical_core.COMMAND_PRIORITY_LOW),
	  // When spoiler is the last child pressing down/right arrow will insert paragraph
	  // below it to allow adding more content. It's similar what $insertBlockNode
	  // (mainly for decorators), except it'll always be possible to continue adding
	  // new content even if trailing paragraph is accidentally deleted
	  this.getEditor().registerCommand(ui_lexical_core.KEY_ARROW_DOWN_COMMAND, babelHelpers.classPrivateFieldLooseBase(this, _handleEscapeDown)[_handleEscapeDown].bind(this), ui_lexical_core.COMMAND_PRIORITY_LOW), this.getEditor().registerCommand(ui_lexical_core.KEY_ARROW_RIGHT_COMMAND, babelHelpers.classPrivateFieldLooseBase(this, _handleEscapeDown)[_handleEscapeDown].bind(this), ui_lexical_core.COMMAND_PRIORITY_LOW),
	  // When spoiler is the first child pressing up/left arrow will insert paragraph
	  // above it to allow adding more content. It's similar what $insertBlockNode
	  // (mainly for decorators), except it'll always be possible to continue adding
	  // new content even if leading paragraph is accidentally deleted
	  this.getEditor().registerCommand(ui_lexical_core.KEY_ARROW_UP_COMMAND, babelHelpers.classPrivateFieldLooseBase(this, _handleEscapeUp)[_handleEscapeUp].bind(this), ui_lexical_core.COMMAND_PRIORITY_LOW), this.getEditor().registerCommand(ui_lexical_core.KEY_ARROW_LEFT_COMMAND, babelHelpers.classPrivateFieldLooseBase(this, _handleEscapeUp)[_handleEscapeUp].bind(this), ui_lexical_core.COMMAND_PRIORITY_LOW), this.getEditor().registerCommand(ui_lexical_core.KEY_ENTER_COMMAND, babelHelpers.classPrivateFieldLooseBase(this, _handleEnter)[_handleEnter].bind(this), ui_lexical_core.COMMAND_PRIORITY_NORMAL), this.getEditor().registerCommand(ui_lexical_core.INSERT_PARAGRAPH_COMMAND, event => {
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
	  }, ui_lexical_core.COMMAND_PRIORITY_LOW), this.getEditor().registerCommand(ui_lexical_core.PASTE_COMMAND, babelHelpers.classPrivateFieldLooseBase(this, _handlePaste)[_handlePaste].bind(this), ui_lexical_core.COMMAND_PRIORITY_LOW), this.getEditor().registerCommand(INSERT_SPOILER_COMMAND, payload => {
	    this.getEditor().update(() => {
	      const title = main_core.Type.isPlainObject(payload) && main_core.Type.isStringFilled(payload.title) ? payload.title : undefined;
	      const selection = ui_lexical_core.$getSelection();
	      const spoiler = insertSpoiler(selection, title);
	      spoiler.getTitleNode().select();
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
	  }, ui_lexical_core.COMMAND_PRIORITY_LOW));
	}
	function _registerNodeTransforms2() {
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
	function _handleDeleteCharacter2() {
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
	function _handleEnter2(event) {
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
	function _handleEscapeUp2() {
	  const selection = ui_lexical_core.$getSelection();
	  if (ui_lexical_core.$isRangeSelection(selection) && selection.isCollapsed() && selection.anchor.offset === 0) {
	    const container = ui_lexical_utils.$findMatchingParent(selection.anchor.getNode(), $isSpoilerNode);
	    if ($isSpoilerNode(container)) {
	      var _container$getFirstDe;
	      const parent = container.getParent();
	      if (parent !== null && parent.getFirstChild() === container && selection.anchor.key === ((_container$getFirstDe = container.getFirstDescendant()) == null ? void 0 : _container$getFirstDe.getKey())) {
	        container.insertBefore(ui_lexical_core.$createParagraphNode());
	      }
	    }
	  }
	  return false;
	}
	function _handleEscapeDown2() {
	  const selection = ui_lexical_core.$getSelection();
	  if (ui_lexical_core.$isRangeSelection(selection) && selection.isCollapsed()) {
	    const container = ui_lexical_utils.$findMatchingParent(selection.anchor.getNode(), $isSpoilerNode);
	    if ($isSpoilerNode(container)) {
	      const parent = container.getParent();
	      if (parent !== null && parent.getLastChild() === container) {
	        const titleParagraph = container.getFirstDescendant();
	        const contentParagraph = container.getLastDescendant();
	        if (contentParagraph !== null && selection.anchor.key === contentParagraph.getKey() && selection.anchor.offset === contentParagraph.getTextContentSize() || titleParagraph !== null && selection.anchor.key === titleParagraph.getKey() && selection.anchor.offset === titleParagraph.getTextContentSize()) {
	          container.insertAfter(ui_lexical_core.$createParagraphNode());
	        }
	      }
	    }
	  }
	  return false;
	}
	function _handlePaste2(event) {
	  const selection = ui_lexical_core.$getSelection();
	  if (!ui_lexical_core.$isRangeSelection(selection) || !(event instanceof ClipboardEvent) || event.clipboardData === null) {
	    return false;
	  }
	  const spoilerTitleNode = ui_lexical_utils.$findMatchingParent(selection.anchor.getNode(), node => $isSpoilerTitleNode(node));
	  if (spoilerTitleNode) {
	    ui_lexical_clipboard.$insertDataTransferForPlainText(event.clipboardData, selection);
	    return true;
	  }
	  return false;
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
	  const firstSelectedBlock = $getAncestor(selection.anchor.getNode(), $isBlock);
	  if (firstSelectedBlock && !nodes.includes(firstSelectedBlock)) {
	    nodes.unshift(firstSelectedBlock);
	  }
	  handled.add(spoiler.getKey());
	  handled.add(spoiler.getTitleNode().getKey());
	  handled.add(spoiler.getContentNode().getKey());
	  let firstNode = true;
	  for (const node of nodes) {
	    if (!$isBlock(node) || handled.has(node.getKey())) {
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
	function $isBlock(node) {
	  return (ui_lexical_core.$isElementNode(node) || ui_lexical_core.$isDecoratorNode(node)) && !node.isInline() && !node.isParentRequired();
	}
	function $getAncestor(node, predicate) {
	  let parent = node;
	  while (parent !== null && parent.getParent() !== null && !predicate(parent)) {
	    parent = parent.getParentOrThrow();
	  }
	  return predicate(parent) ? parent : null;
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
	  constructor(...args) {
	    super(...args);
	    this.__language = 'hack';
	    this.__flags = UNFORMATTED;
	  }
	  static getType() {
	    return 'spoiler-title';
	  }
	  static clone(node) {
	    return new SpoilerTitleNode(node.__key);
	  }
	  createDOM(config, editor) {
	    var _config$theme, _config$theme$spoiler;
	    const dom = document.createElement('summary');
	    if (main_core.Type.isStringFilled(config == null ? void 0 : (_config$theme = config.theme) == null ? void 0 : (_config$theme$spoiler = _config$theme.spoiler) == null ? void 0 : _config$theme$spoiler.title)) {
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
	    var _config$theme, _config$theme$spoiler;
	    const details = document.createElement('details');
	    if (main_core.Type.isStringFilled(config == null ? void 0 : (_config$theme = config.theme) == null ? void 0 : (_config$theme$spoiler = _config$theme.spoiler) == null ? void 0 : _config$theme$spoiler.container)) {
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
	  isShadowRoot() {
	    return true;
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



	var Spoiler = /*#__PURE__*/Object.freeze({
		SpoilerNode: SpoilerNode,
		$createSpoiler: $createSpoiler,
		$createSpoilerNode: $createSpoilerNode,
		$isSpoilerNode: $isSpoilerNode,
		convertSummaryElement: convertSummaryElement,
		SpoilerTitleNode: SpoilerTitleNode,
		$createSpoilerTitleNode: $createSpoilerTitleNode,
		$isSpoilerTitleNode: $isSpoilerTitleNode,
		$removeSpoiler: $removeSpoiler,
		convertSpoilerContentElement: convertSpoilerContentElement,
		SpoilerContentNode: SpoilerContentNode,
		$createSpoilerContentNode: $createSpoilerContentNode,
		$isSpoilerContentNode: $isSpoilerContentNode,
		INSERT_SPOILER_COMMAND: INSERT_SPOILER_COMMAND,
		REMOVE_SPOILER_COMMAND: REMOVE_SPOILER_COMMAND,
		SpoilerPlugin: SpoilerPlugin,
		insertSpoiler: insertSpoiler,
		$getAncestor: $getAncestor,
		trimSpoilerTitle: trimSpoilerTitle
	});

	let _$a = t => t,
	  _t$a,
	  _t2$8,
	  _t3$3,
	  _t4$1;
	var _popup$4 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("popup");
	var _targetNode$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("targetNode");
	var _refs$7 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("refs");
	var _lastSelectedBox = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("lastSelectedBox");
	var _handleMouseMove = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleMouseMove");
	var _handleClick$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleClick");
	var _highlightBoxes = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("highlightBoxes");
	class TableDialog extends main_core_events.EventEmitter {
	  constructor(dialogOptions) {
	    super();
	    Object.defineProperty(this, _highlightBoxes, {
	      value: _highlightBoxes2
	    });
	    Object.defineProperty(this, _handleClick$1, {
	      value: _handleClick2$1
	    });
	    Object.defineProperty(this, _handleMouseMove, {
	      value: _handleMouseMove2
	    });
	    Object.defineProperty(this, _popup$4, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _targetNode$1, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _refs$7, {
	      writable: true,
	      value: new main_core_cache.MemoryCache()
	    });
	    Object.defineProperty(this, _lastSelectedBox, {
	      writable: true,
	      value: null
	    });
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
	    return babelHelpers.classPrivateFieldLooseBase(this, _popup$4)[_popup$4] !== null && babelHelpers.classPrivateFieldLooseBase(this, _popup$4)[_popup$4].isShown();
	  }
	  destroy() {
	    this.getPopup().destroy();
	  }
	  setTargetNode(container) {
	    if (main_core.Type.isElementNode(container)) {
	      babelHelpers.classPrivateFieldLooseBase(this, _targetNode$1)[_targetNode$1] = container;
	    }
	  }
	  getTargetNode() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _targetNode$1)[_targetNode$1];
	  }
	  getPopup() {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _popup$4)[_popup$4] === null) {
	      const targetNode = this.getTargetNode();
	      const rect = targetNode.getBoundingClientRect();
	      const targetNodeWidth = rect.width;
	      babelHelpers.classPrivateFieldLooseBase(this, _popup$4)[_popup$4] = new main_popup.Popup({
	        autoHide: true,
	        closeByEsc: true,
	        padding: 0,
	        content: main_core.Tag.render(_t$a || (_t$a = _$a`
					<div class="ui-text-editor-table-dialog" onclick="${0}">
						${0}
						${0}
					</div>
				`), babelHelpers.classPrivateFieldLooseBase(this, _handleClick$1)[_handleClick$1].bind(this), this.getGridContainer(), this.getCaptionContainer()),
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
	            babelHelpers.classPrivateFieldLooseBase(this, _lastSelectedBox)[_lastSelectedBox] = null;
	            babelHelpers.classPrivateFieldLooseBase(this, _highlightBoxes)[_highlightBoxes](1, 1);
	          }
	        }
	      });
	    }
	    return babelHelpers.classPrivateFieldLooseBase(this, _popup$4)[_popup$4];
	  }
	  getGridContainer() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _refs$7)[_refs$7].remember('grid', () => {
	      const buttons = [];
	      for (let index = 0; index < 100; index++) {
	        const row = Math.floor(index / 10);
	        const column = index % 10;
	        buttons.push(main_core.Tag.render(_t2$8 || (_t2$8 = _$a`
					<button
						class="ui-text-editor-table-dialog-box"
						data-column="${0}"
						data-row="${0}"
					></button>
				`), column + 1, row + 1));
	      }
	      return main_core.Tag.render(_t3$3 || (_t3$3 = _$a`
				<div 
					class="ui-text-editor-table-dialog-grid" 
					onmousemove="${0}"
				>${0}</div>
			`), babelHelpers.classPrivateFieldLooseBase(this, _handleMouseMove)[_handleMouseMove].bind(this), buttons);
	    });
	  }
	  getCaptionContainer() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _refs$7)[_refs$7].remember('caption', () => {
	      return main_core.Tag.render(_t4$1 || (_t4$1 = _$a`<div class="ui-text-editor-table-dialog-caption"></div>`));
	    });
	  }
	}
	function _handleMouseMove2(event) {
	  if (babelHelpers.classPrivateFieldLooseBase(this, _lastSelectedBox)[_lastSelectedBox] !== event.target && main_core.Dom.hasClass(event.target, 'ui-text-editor-table-dialog-box')) {
	    const {
	      row,
	      column
	    } = event.target.dataset;
	    babelHelpers.classPrivateFieldLooseBase(this, _highlightBoxes)[_highlightBoxes](row, column);
	    babelHelpers.classPrivateFieldLooseBase(this, _lastSelectedBox)[_lastSelectedBox] = event.target;
	  }
	}
	function _handleClick2$1(event) {
	  if (babelHelpers.classPrivateFieldLooseBase(this, _lastSelectedBox)[_lastSelectedBox]) {
	    const {
	      row,
	      column
	    } = babelHelpers.classPrivateFieldLooseBase(this, _lastSelectedBox)[_lastSelectedBox].dataset;
	    this.emit('onSelect', {
	      rows: row,
	      columns: column
	    });
	  }
	}
	function _highlightBoxes2(rows, columns) {
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

	/* eslint-disable @bitrix24/bitrix24-rules/no-native-dom-methods */
	const INSERT_TABLE_DIALOG_COMMAND = ui_lexical_core.createCommand('INSERT_TABLE_DIALOG_COMMAND');
	var _tableDialog = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("tableDialog");
	var _registerComponents$d = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("registerComponents");
	var _registerCommands$9 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("registerCommands");
	var _registerListeners$8 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("registerListeners");
	class TablePlugin extends BasePlugin {
	  constructor(editor) {
	    super(editor);
	    Object.defineProperty(this, _registerListeners$8, {
	      value: _registerListeners2$8
	    });
	    Object.defineProperty(this, _registerCommands$9, {
	      value: _registerCommands2$9
	    });
	    Object.defineProperty(this, _registerComponents$d, {
	      value: _registerComponents2$d
	    });
	    Object.defineProperty(this, _tableDialog, {
	      writable: true,
	      value: null
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _registerCommands$9)[_registerCommands$9]();
	    babelHelpers.classPrivateFieldLooseBase(this, _registerListeners$8)[_registerListeners$8]();
	    babelHelpers.classPrivateFieldLooseBase(this, _registerComponents$d)[_registerComponents$d]();
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
	              return $normalizeTextNodes(childLexicalNodes, this.getEditor());
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
	              return $normalizeTextNodes(childLexicalNodes, this.getEditor());
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
	  destroy() {
	    super.destroy();
	    if (babelHelpers.classPrivateFieldLooseBase(this, _tableDialog)[_tableDialog] !== null) {
	      babelHelpers.classPrivateFieldLooseBase(this, _tableDialog)[_tableDialog].destroy();
	    }
	  }
	}
	function _registerComponents2$d() {
	  this.getEditor().getComponentRegistry().register('table', () => {
	    const button = new Button();
	    button.setContent('<span class="ui-icon-set --table-editor"></span>');
	    button.setTooltip(main_core.Loc.getMessage('TEXT_EDITOR_BTN_TABLE'));
	    button.subscribe('onClick', () => {
	      this.getEditor().dispatchCommand(INSERT_TABLE_DIALOG_COMMAND, {
	        targetNode: button.getContainer()
	      });
	    });
	    return button;
	  });
	}
	function _registerCommands2$9() {
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
	    if (babelHelpers.classPrivateFieldLooseBase(this, _tableDialog)[_tableDialog] !== null) {
	      if (babelHelpers.classPrivateFieldLooseBase(this, _tableDialog)[_tableDialog].getTargetNode() === payload.targetNode) {
	        babelHelpers.classPrivateFieldLooseBase(this, _tableDialog)[_tableDialog].show();
	        return true;
	      }
	      babelHelpers.classPrivateFieldLooseBase(this, _tableDialog)[_tableDialog].destroy();
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _tableDialog)[_tableDialog] = new TableDialog({
	      targetNode: payload.targetNode,
	      events: {
	        onSelect: event => {
	          this.getEditor().dispatchCommand(ui_lexical_table.INSERT_TABLE_COMMAND, event.getData());
	          babelHelpers.classPrivateFieldLooseBase(this, _tableDialog)[_tableDialog].hide();
	        },
	        onDestroy: () => {
	          babelHelpers.classPrivateFieldLooseBase(this, _tableDialog)[_tableDialog] = null;
	        }
	      }
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _tableDialog)[_tableDialog].show();
	    return true;
	  }, ui_lexical_core.COMMAND_PRIORITY_LOW), this.getEditor().registerCommand(HIDE_DIALOG_COMMAND, () => {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _tableDialog)[_tableDialog] !== null) {
	      babelHelpers.classPrivateFieldLooseBase(this, _tableDialog)[_tableDialog].hide();
	    }
	    return false;
	  }, ui_lexical_core.COMMAND_PRIORITY_LOW), this.getEditor().registerCommand(DIALOG_VISIBILITY_COMMAND, () => {
	    return babelHelpers.classPrivateFieldLooseBase(this, _tableDialog)[_tableDialog] !== null && babelHelpers.classPrivateFieldLooseBase(this, _tableDialog)[_tableDialog].isShown();
	  }, ui_lexical_core.COMMAND_PRIORITY_LOW));
	}
	function _registerListeners2$8() {
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



	var Table = /*#__PURE__*/Object.freeze({
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
	    var _config$theme;
	    const element = super.createDOM(config);
	    if (main_core.Type.isStringFilled(config == null ? void 0 : (_config$theme = config.theme) == null ? void 0 : _config$theme.hashtag)) {
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

	var _registerListeners$9 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("registerListeners");
	class HashtagPlugin extends BasePlugin {
	  constructor(editor) {
	    super(editor);
	    Object.defineProperty(this, _registerListeners$9, {
	      value: _registerListeners2$9
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _registerListeners$9)[_registerListeners$9]();
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
	}
	function _registerListeners2$9() {
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



	var Hashtag = /*#__PURE__*/Object.freeze({
		HashtagNode: HashtagNode,
		$createHashtagNode: $createHashtagNode,
		$isHashtagNode: $isHashtagNode,
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

	let _$b = t => t,
	  _t$b;
	const INSERT_COPILOT_DIALOG_COMMAND = ui_lexical_core.createCommand('INSERT_COPILOT_DIALOG_COMMAND');
	const CopilotStatus = {
	  INIT: 'init',
	  LOADING: 'loading',
	  LOADED: 'loaded'
	};
	var _copilot = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("copilot");
	var _copilotStatus = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("copilotStatus");
	var _copilotOptions = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("copilotOptions");
	var _targetParagraph = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("targetParagraph");
	var _lastSelection$3 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("lastSelection");
	var _onEditorScroll$4 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onEditorScroll");
	var _triggerBySpace = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("triggerBySpace");
	var _registerListeners$a = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("registerListeners");
	var _registerParagraphNodeTransform = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("registerParagraphNodeTransform");
	var _registerComponents$e = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("registerComponents");
	var _show = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("show");
	var _hide = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("hide");
	var _createCopilot = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("createCopilot");
	var _resetLoader = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("resetLoader");
	var _adjustDialogPosition$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("adjustDialogPosition");
	var _handleEditorScroll$4 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleEditorScroll");
	var _restoreSelection$3 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("restoreSelection");
	var _handleCopilotSave = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleCopilotSave");
	var _handleCopilotAddBelow = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleCopilotAddBelow");
	var _handleCopilotHide = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleCopilotHide");
	class CopilotPlugin extends BasePlugin {
	  constructor(editor) {
	    super(editor);
	    Object.defineProperty(this, _handleCopilotHide, {
	      value: _handleCopilotHide2
	    });
	    Object.defineProperty(this, _handleCopilotAddBelow, {
	      value: _handleCopilotAddBelow2
	    });
	    Object.defineProperty(this, _handleCopilotSave, {
	      value: _handleCopilotSave2
	    });
	    Object.defineProperty(this, _restoreSelection$3, {
	      value: _restoreSelection2$3
	    });
	    Object.defineProperty(this, _handleEditorScroll$4, {
	      value: _handleEditorScroll2$4
	    });
	    Object.defineProperty(this, _adjustDialogPosition$1, {
	      value: _adjustDialogPosition2$1
	    });
	    Object.defineProperty(this, _resetLoader, {
	      value: _resetLoader2
	    });
	    Object.defineProperty(this, _createCopilot, {
	      value: _createCopilot2
	    });
	    Object.defineProperty(this, _hide, {
	      value: _hide2
	    });
	    Object.defineProperty(this, _show, {
	      value: _show2
	    });
	    Object.defineProperty(this, _registerComponents$e, {
	      value: _registerComponents2$e
	    });
	    Object.defineProperty(this, _registerParagraphNodeTransform, {
	      value: _registerParagraphNodeTransform2
	    });
	    Object.defineProperty(this, _registerListeners$a, {
	      value: _registerListeners2$a
	    });
	    Object.defineProperty(this, _copilot, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _copilotStatus, {
	      writable: true,
	      value: CopilotStatus.INIT
	    });
	    Object.defineProperty(this, _copilotOptions, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _targetParagraph, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _lastSelection$3, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _onEditorScroll$4, {
	      writable: true,
	      value: babelHelpers.classPrivateFieldLooseBase(this, _handleEditorScroll$4)[_handleEditorScroll$4].bind(this)
	    });
	    Object.defineProperty(this, _triggerBySpace, {
	      writable: true,
	      value: false
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _copilotOptions)[_copilotOptions] = editor.getOption('copilot.copilotOptions');
	    if (main_core.Type.isPlainObject(babelHelpers.classPrivateFieldLooseBase(this, _copilotOptions)[_copilotOptions])) {
	      babelHelpers.classPrivateFieldLooseBase(this, _registerListeners$a)[_registerListeners$a]();
	      babelHelpers.classPrivateFieldLooseBase(this, _registerComponents$e)[_registerComponents$e]();
	    }
	  }
	  static getName() {
	    return 'Copilot';
	  }
	  shouldTriggerBySpace() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _triggerBySpace)[_triggerBySpace];
	  }
	  isCopilotLoaded() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _copilotStatus)[_copilotStatus] === CopilotStatus.LOADED;
	  }
	  isCopilotLoading() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _copilotStatus)[_copilotStatus] === CopilotStatus.LOADING;
	  }
	  isCopilotShown() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _copilot)[_copilot] !== null && babelHelpers.classPrivateFieldLooseBase(this, _copilot)[_copilot].isShown();
	  }
	  show({
	    onShow,
	    onError
	  } = {}) {
	    if (this.isCopilotLoaded()) {
	      babelHelpers.classPrivateFieldLooseBase(this, _show)[_show]({
	        onShow
	      });
	    } else if (!this.isCopilotLoading()) {
	      babelHelpers.classPrivateFieldLooseBase(this, _createCopilot)[_createCopilot]().then(() => {
	        babelHelpers.classPrivateFieldLooseBase(this, _show)[_show]({
	          onShow
	        });
	      }).catch(() => {
	        if (main_core.Type.isFunction(onError)) {
	          onError();
	        }
	      });
	    }
	  }
	  destroy() {
	    super.destroy();
	    if (babelHelpers.classPrivateFieldLooseBase(this, _copilot)[_copilot] !== null) {
	      babelHelpers.classPrivateFieldLooseBase(this, _copilot)[_copilot].hide();
	      babelHelpers.classPrivateFieldLooseBase(this, _copilot)[_copilot] = null;
	    }
	  }
	}
	function _registerListeners2$a() {
	  babelHelpers.classPrivateFieldLooseBase(this, _triggerBySpace)[_triggerBySpace] = this.getEditor().getOption('copilot.triggerBySpace', false);
	  this.cleanUpRegister(this.getEditor().registerCommand(INSERT_COPILOT_DIALOG_COMMAND, payload => {
	    const options = main_core.Type.isPlainObject(payload) ? payload : {};
	    this.show(options);
	    return true;
	  }, ui_lexical_core.COMMAND_PRIORITY_EDITOR), this.getEditor().registerCommand(HIDE_DIALOG_COMMAND, () => {
	    babelHelpers.classPrivateFieldLooseBase(this, _hide)[_hide]();
	    return false;
	  }, ui_lexical_core.COMMAND_PRIORITY_LOW), this.getEditor().registerCommand(DIALOG_VISIBILITY_COMMAND, () => {
	    return this.isCopilotShown();
	  }, ui_lexical_core.COMMAND_PRIORITY_LOW), babelHelpers.classPrivateFieldLooseBase(this, _triggerBySpace)[_triggerBySpace] ? babelHelpers.classPrivateFieldLooseBase(this, _registerParagraphNodeTransform)[_registerParagraphNodeTransform]() : () => {});
	}
	function _registerParagraphNodeTransform2() {
	  return this.getEditor().registerNodeTransform(CustomParagraphNode, node => {
	    if (node.getChildrenSize() !== 1 || !ui_lexical_core.$isRootNode(node.getParent())) {
	      return;
	    }
	    if (!ui_lexical_core.$isTextNode(node.getFirstChild()) || node.getFirstChild().getTextContent() !== ' ') {
	      babelHelpers.classPrivateFieldLooseBase(this, _resetLoader)[_resetLoader]();
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
	      babelHelpers.classPrivateFieldLooseBase(this, _resetLoader)[_resetLoader]();
	      babelHelpers.classPrivateFieldLooseBase(this, _targetParagraph)[_targetParagraph] = this.getEditor().getElementByKey(node.getKey());
	      if (babelHelpers.classPrivateFieldLooseBase(this, _targetParagraph)[_targetParagraph]) {
	        main_core.Dom.addClass(babelHelpers.classPrivateFieldLooseBase(this, _targetParagraph)[_targetParagraph], 'ui-text-editor-loading-ellipsis');
	      }
	    }
	    node.getFirstChild().remove();
	    node.select();
	    this.show({
	      onShow: () => babelHelpers.classPrivateFieldLooseBase(this, _resetLoader)[_resetLoader](),
	      onError: () => babelHelpers.classPrivateFieldLooseBase(this, _resetLoader)[_resetLoader]()
	    });
	  });
	}
	function _registerComponents2$e() {
	  this.getEditor().getComponentRegistry().register('copilot', () => {
	    const button = new Button();
	    const copilotIconClass = '--copilot-ai';
	    const refreshIconClass = '--refresh-5 ui-text-editor-copilot-loading';
	    const icon = main_core.Tag.render(_t$b || (_t$b = _$b`
				<span class="ui-icon-set ${0}" style="--ui-icon-set__icon-color: #8e52ec"></span>
			`), copilotIconClass);
	    button.setContent(icon);
	    button.setTooltip(main_core.Loc.getMessage('TEXT_EDITOR_BTN_COPILOT'));
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
	function _show2({
	  onShow
	} = {}) {
	  this.getEditor().update(() => {
	    const selection = ui_lexical_core.$getSelection();
	    if (!ui_lexical_core.$isRangeSelection(selection) || !this.getEditor().isEditable()) {
	      return;
	    }
	    this.getEditor().dispatchCommand(HIDE_DIALOG_COMMAND);
	    const selectionText = selection.getTextContent();
	    const selectedText = selectionText.trim().length > 0 ? selectionText : ui_lexical_core.$getRoot().getTextContent();
	    const editorPosition = main_core.Dom.getPosition(this.getEditor().getScrollerContainer());
	    const width = Math.min(editorPosition.width, 600);
	    babelHelpers.classPrivateFieldLooseBase(this, _lastSelection$3)[_lastSelection$3] = selection.clone();
	    babelHelpers.classPrivateFieldLooseBase(this, _copilot)[_copilot].setSelectedText(selectedText);
	    babelHelpers.classPrivateFieldLooseBase(this, _copilot)[_copilot].show({
	      width
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _adjustDialogPosition$1)[_adjustDialogPosition$1]();
	    main_core.Event.bind(this.getEditor().getScrollerContainer(), 'scroll', babelHelpers.classPrivateFieldLooseBase(this, _onEditorScroll$4)[_onEditorScroll$4]);
	    if (!selection.isCollapsed()) {
	      this.getEditor().highlightSelection();
	    }
	    if (main_core.Type.isFunction(onShow)) {
	      onShow();
	    }
	  });
	}
	function _hide2() {
	  if (this.isCopilotLoaded() && babelHelpers.classPrivateFieldLooseBase(this, _copilot)[_copilot].isShown()) {
	    babelHelpers.classPrivateFieldLooseBase(this, _copilot)[_copilot].hide();
	  }
	}
	function _createCopilot2() {
	  if (this.isDestroyed()) {
	    return Promise.reject(new Error('Copilot plugin was destroyed.'));
	  }
	  babelHelpers.classPrivateFieldLooseBase(this, _copilotStatus)[_copilotStatus] = CopilotStatus.LOADING;
	  return new Promise((resolve, reject) => {
	    main_core.Runtime.loadExtension('ai.copilot').then(({
	      Copilot
	    }) => {
	      if (this.isDestroyed()) {
	        reject(new Error('Copilot plugin was destroyed.'));
	        return;
	      }
	      babelHelpers.classPrivateFieldLooseBase(this, _copilot)[_copilot] = new Copilot({
	        ...babelHelpers.classPrivateFieldLooseBase(this, _copilotOptions)[_copilotOptions],
	        autoHide: true
	      });
	      babelHelpers.classPrivateFieldLooseBase(this, _copilot)[_copilot].subscribe('finish-init', () => {
	        if (this.isDestroyed()) {
	          reject(new Error('Copilot plugin was destroyed.'));
	          return;
	        }
	        babelHelpers.classPrivateFieldLooseBase(this, _copilotStatus)[_copilotStatus] = CopilotStatus.LOADED;
	        resolve();
	      });
	      babelHelpers.classPrivateFieldLooseBase(this, _copilot)[_copilot].subscribe('save', babelHelpers.classPrivateFieldLooseBase(this, _handleCopilotSave)[_handleCopilotSave].bind(this));
	      babelHelpers.classPrivateFieldLooseBase(this, _copilot)[_copilot].subscribe('add_below', babelHelpers.classPrivateFieldLooseBase(this, _handleCopilotAddBelow)[_handleCopilotAddBelow].bind(this));
	      babelHelpers.classPrivateFieldLooseBase(this, _copilot)[_copilot].subscribe('hide', babelHelpers.classPrivateFieldLooseBase(this, _handleCopilotHide)[_handleCopilotHide].bind(this));
	      babelHelpers.classPrivateFieldLooseBase(this, _copilot)[_copilot].init();
	    }).catch(() => {
	      reject();
	    });
	  });
	}
	function _resetLoader2() {
	  if (babelHelpers.classPrivateFieldLooseBase(this, _targetParagraph)[_targetParagraph]) {
	    main_core.Dom.removeClass(babelHelpers.classPrivateFieldLooseBase(this, _targetParagraph)[_targetParagraph], 'ui-text-editor-loading-ellipsis');
	  }
	}
	function _adjustDialogPosition2$1() {
	  this.getEditor().update(() => {
	    babelHelpers.classPrivateFieldLooseBase(this, _restoreSelection$3)[_restoreSelection$3]();
	    const selectionPosition = $getSelectionPosition(this.getEditor(), ui_lexical_core.$getSelection(), document.body);
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
	    let offsetLeft = popupWidth / 2;
	    if (left - offsetLeft < scrollerRect.left) {
	      // Left boundary
	      const overflow = scrollerRect.left - (left - offsetLeft);
	      offsetLeft -= overflow + 16;
	    } else if (scrollerRect.right < left + popupWidth - offsetLeft) {
	      // Right boundary
	      offsetLeft += left + popupWidth - offsetLeft - scrollerRect.right + 16;
	    }
	    if (bottom < scrollerRect.top || top > scrollerRect.bottom) {
	      babelHelpers.classPrivateFieldLooseBase(this, _copilot)[_copilot].adjust({
	        hide: true
	      });
	    } else {
	      babelHelpers.classPrivateFieldLooseBase(this, _copilot)[_copilot].adjust({
	        hide: false,
	        position: {
	          left: left - offsetLeft,
	          top: bottom
	        }
	      });
	    }
	  });
	}
	function _handleEditorScroll2$4() {
	  babelHelpers.classPrivateFieldLooseBase(this, _adjustDialogPosition$1)[_adjustDialogPosition$1]();
	}
	function _restoreSelection2$3() {
	  const selection = ui_lexical_core.$getSelection();
	  if (!ui_lexical_core.$isRangeSelection(selection) && babelHelpers.classPrivateFieldLooseBase(this, _lastSelection$3)[_lastSelection$3] !== null) {
	    ui_lexical_core.$setSelection(babelHelpers.classPrivateFieldLooseBase(this, _lastSelection$3)[_lastSelection$3]);
	    babelHelpers.classPrivateFieldLooseBase(this, _lastSelection$3)[_lastSelection$3] = null;
	    return true;
	  }
	  return false;
	}
	function _handleCopilotSave2(event) {
	  const {
	    result
	  } = event.getData();
	  this.getEditor().update(() => {
	    babelHelpers.classPrivateFieldLooseBase(this, _restoreSelection$3)[_restoreSelection$3]();
	    const selection = ui_lexical_core.$getSelection();
	    if (ui_lexical_core.$isRangeSelection(selection)) {
	      selection.insertRawText(result);
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _hide)[_hide]();
	  });
	}
	function _handleCopilotAddBelow2(event) {
	  const {
	    result
	  } = event.getData();
	  this.getEditor().update(() => {
	    babelHelpers.classPrivateFieldLooseBase(this, _restoreSelection$3)[_restoreSelection$3]();
	    const selection = ui_lexical_core.$getSelection();
	    if (ui_lexical_core.$isRangeSelection(selection)) {
	      const focus = selection.focus;
	      const focusNode = focus.getNode();
	      if (!selection.isCollapsed()) {
	        focusNode.selectEnd();
	      }
	      const parentNode = focusNode.getParent();
	      if (ui_lexical_core.$isParagraphNode(parentNode)) {
	        const paragraph = ui_lexical_core.$createParagraphNode();
	        paragraph.append(...$createNodesFromText(result));
	        parentNode.insertAfter(paragraph);
	      } else {
	        selection.insertLineBreak();
	        selection.insertRawText(result);
	      }
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _hide)[_hide]();
	  });
	}
	function _handleCopilotHide2() {
	  main_core.Event.unbind(this.getEditor().getScrollerContainer(), 'scroll', babelHelpers.classPrivateFieldLooseBase(this, _onEditorScroll$4)[_onEditorScroll$4]);
	  this.getEditor().resetHighlightSelection();
	  this.getEditor().update(() => {
	    if (!babelHelpers.classPrivateFieldLooseBase(this, _restoreSelection$3)[_restoreSelection$3]()) {
	      this.getEditor().focus();
	    }
	  });
	}

	var _registerComponents$f = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("registerComponents");
	class HistoryPlugin extends BasePlugin {
	  constructor(editor) {
	    super(editor);
	    Object.defineProperty(this, _registerComponents$f, {
	      value: _registerComponents2$f
	    });
	    const historyState = ui_lexical_history.createEmptyHistoryState();
	    this.cleanUpRegister(ui_lexical_history.registerHistory(editor.getLexicalEditor(), historyState, 1000));
	    babelHelpers.classPrivateFieldLooseBase(this, _registerComponents$f)[_registerComponents$f]();
	  }
	  static getName() {
	    return 'History';
	  }
	}
	function _registerComponents2$f() {
	  let canUndo = false;
	  this.getEditor().getComponentRegistry().register('undo', () => {
	    const button = new Button();
	    button.setContent('<span class="ui-icon-set --undo"></span>');
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
	    button.setContent('<span class="ui-icon-set --redo"></span>');
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



	var History = /*#__PURE__*/Object.freeze({
		HistoryPlugin: HistoryPlugin
	});

	let _$c = t => t,
	  _t$c,
	  _t2$9;
	const Direction$1 = {
	  DOWNWARD: 1,
	  UPWARD: -1,
	  INDETERMINATE: 0
	};
	const DRAG_DATA_FORMAT$1 = 'application/x-ui-text-editor-drag-block';
	var _draggableBlockElement = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("draggableBlockElement");
	var _lastBlockElementIndex = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("lastBlockElementIndex");
	var _lastTargetElement = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("lastTargetElement");
	var _container$2 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("container");
	var _dropLine = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("dropLine");
	var _isDragging = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isDragging");
	var _bodyDragDropHandler = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("bodyDragDropHandler");
	var _bodyDragOverHandler = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("bodyDragOverHandler");
	var _registerEvents = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("registerEvents");
	var _registerListeners$b = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("registerListeners");
	var _handleMouseMove$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleMouseMove");
	var _handleMouseLeave = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleMouseLeave");
	var _findBlockElement = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("findBlockElement");
	var _getCurrentIndex = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getCurrentIndex");
	var _updatePosition = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("updatePosition");
	var _setDraggableBlockElement = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("setDraggableBlockElement");
	var _handleDragStart = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleDragStart");
	var _handleDragEnd = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleDragEnd");
	var _handleDragOver = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleDragOver");
	var _handleDragDrop = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleDragDrop");
	var _showDropLine = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("showDropLine");
	var _hideDropLine = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("hideDropLine");
	class BlockToolbarPlugin extends BasePlugin {
	  constructor(editor) {
	    super(editor);
	    Object.defineProperty(this, _hideDropLine, {
	      value: _hideDropLine2
	    });
	    Object.defineProperty(this, _showDropLine, {
	      value: _showDropLine2
	    });
	    Object.defineProperty(this, _handleDragDrop, {
	      value: _handleDragDrop2
	    });
	    Object.defineProperty(this, _handleDragOver, {
	      value: _handleDragOver2
	    });
	    Object.defineProperty(this, _handleDragEnd, {
	      value: _handleDragEnd2
	    });
	    Object.defineProperty(this, _handleDragStart, {
	      value: _handleDragStart2
	    });
	    Object.defineProperty(this, _setDraggableBlockElement, {
	      value: _setDraggableBlockElement2
	    });
	    Object.defineProperty(this, _updatePosition, {
	      value: _updatePosition2
	    });
	    Object.defineProperty(this, _getCurrentIndex, {
	      value: _getCurrentIndex2
	    });
	    Object.defineProperty(this, _findBlockElement, {
	      value: _findBlockElement2
	    });
	    Object.defineProperty(this, _handleMouseLeave, {
	      value: _handleMouseLeave2
	    });
	    Object.defineProperty(this, _handleMouseMove$1, {
	      value: _handleMouseMove2$1
	    });
	    Object.defineProperty(this, _registerListeners$b, {
	      value: _registerListeners2$b
	    });
	    Object.defineProperty(this, _registerEvents, {
	      value: _registerEvents2
	    });
	    Object.defineProperty(this, _draggableBlockElement, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _lastBlockElementIndex, {
	      writable: true,
	      value: Infinity
	    });
	    Object.defineProperty(this, _lastTargetElement, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _container$2, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _dropLine, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _isDragging, {
	      writable: true,
	      value: false
	    });
	    Object.defineProperty(this, _bodyDragDropHandler, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _bodyDragOverHandler, {
	      writable: true,
	      value: null
	    });
	    this.cleanUpRegister(babelHelpers.classPrivateFieldLooseBase(this, _registerEvents)[_registerEvents](), babelHelpers.classPrivateFieldLooseBase(this, _registerListeners$b)[_registerListeners$b]());
	    babelHelpers.classPrivateFieldLooseBase(this, _bodyDragDropHandler)[_bodyDragDropHandler] = event => {
	      this.getEditor().dispatchCommand(ui_lexical_core.DROP_COMMAND, event);
	    };
	    babelHelpers.classPrivateFieldLooseBase(this, _bodyDragOverHandler)[_bodyDragOverHandler] = event => {
	      // prevent default to allow drop
	      event.preventDefault();
	    };
	    main_core.Dom.append(this.getContainer(), this.getEditor().getScrollerContainer());
	    main_core.Dom.append(this.getDropLine(), this.getEditor().getScrollerContainer());
	  }
	  static getName() {
	    return 'BlockToolbar';
	  }
	  getContainer() {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _container$2)[_container$2] === null) {
	      babelHelpers.classPrivateFieldLooseBase(this, _container$2)[_container$2] = main_core.Tag.render(_t$c || (_t$c = _$c`
				<div class="ui-text-editor-block-toolbar">
					<div 
						class="ui-text-editor-block-drag-icon" 
						draggable="true"
						ondragstart="${0}" 
						ondragend="${0}"
					>
						<div 
							class="ui-icon-set --more-points" 
							style="--ui-icon-set__icon-size: 24px; margin-left: -4px"
						></div>
					</div>
				</div>
			`), babelHelpers.classPrivateFieldLooseBase(this, _handleDragStart)[_handleDragStart].bind(this), babelHelpers.classPrivateFieldLooseBase(this, _handleDragEnd)[_handleDragEnd].bind(this));
	    }
	    return babelHelpers.classPrivateFieldLooseBase(this, _container$2)[_container$2];
	  }
	  getDropLine() {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _dropLine)[_dropLine] === null) {
	      babelHelpers.classPrivateFieldLooseBase(this, _dropLine)[_dropLine] = main_core.Tag.render(_t2$9 || (_t2$9 = _$c`
				<div class="ui-text-editor-block-drop-line"></div>
			`));
	    }
	    return babelHelpers.classPrivateFieldLooseBase(this, _dropLine)[_dropLine];
	  }
	  destroy() {
	    super.destroy();
	    main_core.Dom.remove(this.getContainer());
	    main_core.Dom.remove(this.getDropLine());
	  }
	}
	function _registerEvents2() {
	  const scroller = this.getEditor().getScrollerContainer();
	  const onMouseMove = babelHelpers.classPrivateFieldLooseBase(this, _handleMouseMove$1)[_handleMouseMove$1].bind(this);
	  const onMouseLeave = babelHelpers.classPrivateFieldLooseBase(this, _handleMouseLeave)[_handleMouseLeave].bind(this);
	  main_core.Event.bind(scroller, 'mousemove', onMouseMove);
	  main_core.Event.bind(scroller, 'mouseleave', onMouseLeave);
	  return () => {
	    main_core.Event.unbind(scroller, 'mousemove', onMouseMove);
	    main_core.Event.unbind(scroller, 'mouseleave', onMouseLeave);
	  };
	}
	function _registerListeners2$b() {
	  return ui_lexical_utils.mergeRegister(this.getEditor().registerCommand(ui_lexical_core.DRAGOVER_COMMAND, babelHelpers.classPrivateFieldLooseBase(this, _handleDragOver)[_handleDragOver].bind(this), ui_lexical_core.COMMAND_PRIORITY_LOW), this.getEditor().registerCommand(ui_lexical_core.DROP_COMMAND, babelHelpers.classPrivateFieldLooseBase(this, _handleDragDrop)[_handleDragDrop].bind(this), ui_lexical_core.COMMAND_PRIORITY_HIGH), this.getEditor().registerTextContentListener(() => {
	    babelHelpers.classPrivateFieldLooseBase(this, _setDraggableBlockElement)[_setDraggableBlockElement](null);
	    babelHelpers.classPrivateFieldLooseBase(this, _updatePosition)[_updatePosition]();
	  }));
	}
	function _handleMouseMove2$1(event) {
	  if (!this.getEditor().isEditable()) {
	    return;
	  }
	  const target = event.target;
	  if (!(target instanceof HTMLElement)) {
	    babelHelpers.classPrivateFieldLooseBase(this, _setDraggableBlockElement)[_setDraggableBlockElement](null);
	    return;
	  }
	  if (target.closest('.ui-text-editor-block-toolbar') !== null) {
	    return;
	  }
	  const element = babelHelpers.classPrivateFieldLooseBase(this, _findBlockElement)[_findBlockElement](event);
	  babelHelpers.classPrivateFieldLooseBase(this, _setDraggableBlockElement)[_setDraggableBlockElement](element);
	}
	function _handleMouseLeave2() {
	  babelHelpers.classPrivateFieldLooseBase(this, _setDraggableBlockElement)[_setDraggableBlockElement](null);
	}
	function _findBlockElement2(event) {
	  const scroller = this.getEditor().getScrollerContainer();
	  const anchorElementRect = scroller.getBoundingClientRect();
	  let blockElem = null;
	  this.getEditor().getEditorState().read(() => {
	    const root = ui_lexical_core.$getRoot();
	    const topLevelNodeKeys = root.getChildrenKeys();
	    let index = babelHelpers.classPrivateFieldLooseBase(this, _getCurrentIndex)[_getCurrentIndex](topLevelNodeKeys.length);
	    let direction = Direction$1.INDETERMINATE;
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
	        babelHelpers.classPrivateFieldLooseBase(this, _lastBlockElementIndex)[_lastBlockElementIndex] = index;
	        break;
	      }
	      if (direction === Direction$1.INDETERMINATE) {
	        if (isOnTopSide) {
	          direction = Direction$1.UPWARD;
	        } else if (isOnBottomSide) {
	          direction = Direction$1.DOWNWARD;
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
	function _getCurrentIndex2(keysLength) {
	  if (keysLength === 0) {
	    return Infinity;
	  }
	  if (babelHelpers.classPrivateFieldLooseBase(this, _lastBlockElementIndex)[_lastBlockElementIndex] >= 0 && babelHelpers.classPrivateFieldLooseBase(this, _lastBlockElementIndex)[_lastBlockElementIndex] < keysLength) {
	    return babelHelpers.classPrivateFieldLooseBase(this, _lastBlockElementIndex)[_lastBlockElementIndex];
	  }
	  return Math.floor(keysLength / 2);
	}
	function _updatePosition2() {
	  if (babelHelpers.classPrivateFieldLooseBase(this, _draggableBlockElement)[_draggableBlockElement] === null) {
	    main_core.Dom.style(this.getContainer(), {
	      opacity: 0,
	      transform: 'translateY(-10000px)'
	    });
	  } else {
	    // const styles: CSSStyleDeclaration = window.getComputedStyle(this.#draggableBlockElement);
	    // const lineHeight: number = Text.toNumber(styles.lineHeight);
	    // const toolbarHeight: number = this.getContainer().offsetHeight;
	    // const offset = lineHeight > 0 ? (lineHeight - toolbarHeight) / 2 : 3;

	    const offset = main_core.Text.toNumber(main_core.Dom.style(babelHelpers.classPrivateFieldLooseBase(this, _draggableBlockElement)[_draggableBlockElement], 'margin-top'));
	    const top = babelHelpers.classPrivateFieldLooseBase(this, _draggableBlockElement)[_draggableBlockElement].offsetTop + offset;
	    main_core.Dom.style(this.getContainer(), {
	      opacity: 1,
	      transform: `translateY(${top}px)`
	    });
	  }
	}
	function _setDraggableBlockElement2(element) {
	  const changed = babelHelpers.classPrivateFieldLooseBase(this, _draggableBlockElement)[_draggableBlockElement] !== element;
	  babelHelpers.classPrivateFieldLooseBase(this, _draggableBlockElement)[_draggableBlockElement] = element;
	  if (changed) {
	    babelHelpers.classPrivateFieldLooseBase(this, _updatePosition)[_updatePosition]();
	  }
	}
	function _handleDragStart2(event) {
	  const dataTransfer = event.dataTransfer;
	  if (!dataTransfer || babelHelpers.classPrivateFieldLooseBase(this, _draggableBlockElement)[_draggableBlockElement] === null) {
	    return;
	  }
	  this.getEditor().dispatchCommand(HIDE_DIALOG_COMMAND);
	  dataTransfer.setDragImage(babelHelpers.classPrivateFieldLooseBase(this, _draggableBlockElement)[_draggableBlockElement], 0, 0);
	  let nodeKey = '';
	  this.getEditor().update(() => {
	    const node = ui_lexical_core.$getNearestNodeFromDOMNode(babelHelpers.classPrivateFieldLooseBase(this, _draggableBlockElement)[_draggableBlockElement]);
	    if (node) {
	      nodeKey = node.getKey();
	    }
	  });
	  dataTransfer.setData(DRAG_DATA_FORMAT$1, nodeKey);
	  babelHelpers.classPrivateFieldLooseBase(this, _isDragging)[_isDragging] = true;
	  main_core.Event.bind(document.body, 'drop', babelHelpers.classPrivateFieldLooseBase(this, _bodyDragDropHandler)[_bodyDragDropHandler]);
	  main_core.Event.bind(document.body, 'dragover', babelHelpers.classPrivateFieldLooseBase(this, _bodyDragOverHandler)[_bodyDragOverHandler]);
	}
	function _handleDragEnd2(event) {
	  babelHelpers.classPrivateFieldLooseBase(this, _isDragging)[_isDragging] = false;
	  babelHelpers.classPrivateFieldLooseBase(this, _hideDropLine)[_hideDropLine]();
	  main_core.Event.unbind(document.body, 'drop', babelHelpers.classPrivateFieldLooseBase(this, _bodyDragDropHandler)[_bodyDragDropHandler]);
	  main_core.Event.unbind(document.body, 'dragover', babelHelpers.classPrivateFieldLooseBase(this, _bodyDragOverHandler)[_bodyDragOverHandler]);
	}
	function _handleDragOver2(event) {
	  if (babelHelpers.classPrivateFieldLooseBase(this, _isDragging)[_isDragging] === false) {
	    return false;
	  }
	  const hasFiles = event.dataTransfer.types.includes('Files');
	  if (hasFiles || !(event.target instanceof HTMLElement)) {
	    return false;
	  }
	  const targetBlockElement = babelHelpers.classPrivateFieldLooseBase(this, _findBlockElement)[_findBlockElement](event);
	  if (targetBlockElement === null) {
	    return false;
	  }
	  babelHelpers.classPrivateFieldLooseBase(this, _lastTargetElement)[_lastTargetElement] = targetBlockElement;
	  babelHelpers.classPrivateFieldLooseBase(this, _showDropLine)[_showDropLine](targetBlockElement, event);
	  event.preventDefault();
	  return true;
	}
	function _handleDragDrop2(event) {
	  var _event$dataTransfer;
	  if (babelHelpers.classPrivateFieldLooseBase(this, _isDragging)[_isDragging] === false) {
	    return false;
	  }
	  const hasFiles = event.dataTransfer.types.includes('Files');
	  const dragData = ((_event$dataTransfer = event.dataTransfer) == null ? void 0 : _event$dataTransfer.getData(DRAG_DATA_FORMAT$1)) || '';
	  if (hasFiles || !(event.target instanceof HTMLElement) || !main_core.Type.isStringFilled(dragData)) {
	    return false;
	  }
	  const draggedNode = ui_lexical_core.$getNodeByKey(dragData);
	  if (!draggedNode || !(event.target instanceof HTMLElement)) {
	    return false;
	  }
	  const targetBlockElement = babelHelpers.classPrivateFieldLooseBase(this, _findBlockElement)[_findBlockElement](event) || babelHelpers.classPrivateFieldLooseBase(this, _lastTargetElement)[_lastTargetElement];
	  if (!targetBlockElement) {
	    return false;
	  }
	  const targetNode = ui_lexical_core.$getNearestNodeFromDOMNode(targetBlockElement);
	  if (!targetNode) {
	    return false;
	  }
	  main_core.Event.unbind(document.body, 'drop', babelHelpers.classPrivateFieldLooseBase(this, _bodyDragDropHandler)[_bodyDragDropHandler]);
	  main_core.Event.unbind(document.body, 'dragover', babelHelpers.classPrivateFieldLooseBase(this, _bodyDragOverHandler)[_bodyDragOverHandler]);
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
	  babelHelpers.classPrivateFieldLooseBase(this, _setDraggableBlockElement)[_setDraggableBlockElement](null);
	  return true;
	}
	function _showDropLine2(targetBlockElement, event) {
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
	function _hideDropLine2() {
	  main_core.Dom.style(this.getDropLine(), {
	    opacity: 0,
	    transform: 'translate(-10000px, -10000px)'
	  });
	}



	var BlockToolbar = /*#__PURE__*/Object.freeze({
		BlockToolbarPlugin: BlockToolbarPlugin
	});

	let _$d = t => t,
	  _t$d;
	var _container$3 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("container");
	class Separator extends ToolbarItem {
	  constructor(...args) {
	    super(...args);
	    Object.defineProperty(this, _container$3, {
	      writable: true,
	      value: null
	    });
	  }
	  getContainer() {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _container$3)[_container$3] === null) {
	      babelHelpers.classPrivateFieldLooseBase(this, _container$3)[_container$3] = main_core.Tag.render(_t$d || (_t$d = _$d`<span class="ui-text-editor-toolbar-separator"></span>`));
	    }
	    return babelHelpers.classPrivateFieldLooseBase(this, _container$3)[_container$3];
	  }
	  render() {
	    return this.getContainer();
	  }
	}

	let _$e = t => t,
	  _t$e,
	  _t2$a,
	  _t3$4;
	var _textEditor$2 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("textEditor");
	var _items = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("items");
	var _rendered = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("rendered");
	var _moreBtn = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("moreBtn");
	var _refs$8 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("refs");
	var _resizeObserver = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("resizeObserver");
	var _timeoutId$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("timeoutId");
	var _removeListeners$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("removeListeners");
	var _registerListeners$c = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("registerListeners");
	var _fillFromOptions = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("fillFromOptions");
	var _handleResize$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleResize");
	var _getSelectionBlockTypes = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getSelectionBlockTypes");
	var _getBlockType = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getBlockType");
	class Toolbar {
	  constructor(textEditor, _options) {
	    Object.defineProperty(this, _getBlockType, {
	      value: _getBlockType2
	    });
	    Object.defineProperty(this, _getSelectionBlockTypes, {
	      value: _getSelectionBlockTypes2
	    });
	    Object.defineProperty(this, _handleResize$1, {
	      value: _handleResize2$1
	    });
	    Object.defineProperty(this, _fillFromOptions, {
	      value: _fillFromOptions2
	    });
	    Object.defineProperty(this, _registerListeners$c, {
	      value: _registerListeners2$c
	    });
	    Object.defineProperty(this, _textEditor$2, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _items, {
	      writable: true,
	      value: []
	    });
	    Object.defineProperty(this, _rendered, {
	      writable: true,
	      value: false
	    });
	    Object.defineProperty(this, _moreBtn, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _refs$8, {
	      writable: true,
	      value: new main_core_cache.MemoryCache()
	    });
	    Object.defineProperty(this, _resizeObserver, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _timeoutId$1, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _removeListeners$1, {
	      writable: true,
	      value: null
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _textEditor$2)[_textEditor$2] = textEditor;
	    const toolbarOptions = main_core.Type.isArray(_options) ? _options : [];
	    babelHelpers.classPrivateFieldLooseBase(this, _fillFromOptions)[_fillFromOptions](toolbarOptions);
	    if (babelHelpers.classPrivateFieldLooseBase(this, _items)[_items].length > 0) {
	      babelHelpers.classPrivateFieldLooseBase(this, _removeListeners$1)[_removeListeners$1] = babelHelpers.classPrivateFieldLooseBase(this, _registerListeners$c)[_registerListeners$c]();
	      babelHelpers.classPrivateFieldLooseBase(this, _resizeObserver)[_resizeObserver] = new ResizeObserver(babelHelpers.classPrivateFieldLooseBase(this, _handleResize$1)[_handleResize$1].bind(this));
	    }
	  }
	  renderTo(container) {
	    if (this.isRendered()) {
	      return;
	    }
	    if (main_core.Type.isElementNode(container)) {
	      babelHelpers.classPrivateFieldLooseBase(this, _items)[_items].forEach(item => {
	        main_core.Dom.append(item.render(), this.getItemsContainer());
	      });
	      main_core.Dom.append(this.getContainer(), container);
	      if (babelHelpers.classPrivateFieldLooseBase(this, _resizeObserver)[_resizeObserver] !== null) {
	        babelHelpers.classPrivateFieldLooseBase(this, _resizeObserver)[_resizeObserver].observe(this.getContainer());
	      }
	      babelHelpers.classPrivateFieldLooseBase(this, _rendered)[_rendered] = true;
	    }
	  }
	  isEmpty() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _items)[_items].length === 0;
	  }
	  getContainer() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _refs$8)[_refs$8].remember('container', () => {
	      return main_core.Tag.render(_t$e || (_t$e = _$e`
				<div class="ui-text-editor-toolbar-container">
					${0}
					${0}
				</div>
			`), this.getItemsContainer(), this.getMoreBtnContainer());
	    });
	  }
	  getItemsContainer() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _refs$8)[_refs$8].remember('items-container', () => {
	      return main_core.Tag.render(_t2$a || (_t2$a = _$e`
				<div class="ui-text-editor-toolbar-items"></div>
			`));
	    });
	  }
	  getMoreBtnContainer() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _refs$8)[_refs$8].remember('more-btn-container', () => {
	      return main_core.Tag.render(_t3$4 || (_t3$4 = _$e`
				<div class="ui-text-editor-toolbar-more-btn">
				${0}
				</div>
			`), this.getMoreBtn().render());
	    });
	  }
	  getMoreBtn() {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _moreBtn)[_moreBtn] === null) {
	      const resetAnimation = () => {
	        main_core.Event.unbind(this.getItemsContainer(), 'transitionend', resetAnimation);
	        main_core.Dom.style(this.getItemsContainer(), {
	          height: null
	        });
	        main_core.Dom.removeClass(this.getItemsContainer(), '--animating');
	      };
	      babelHelpers.classPrivateFieldLooseBase(this, _moreBtn)[_moreBtn] = new Button();
	      babelHelpers.classPrivateFieldLooseBase(this, _moreBtn)[_moreBtn].setContent('<span class="ui-text-editor-toolbar-more-btn-icon"></span>');
	      babelHelpers.classPrivateFieldLooseBase(this, _moreBtn)[_moreBtn].subscribe('onClick', () => {
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
	    return babelHelpers.classPrivateFieldLooseBase(this, _moreBtn)[_moreBtn];
	  }
	  getItems() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _items)[_items];
	  }
	  isRendered() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _rendered)[_rendered];
	  }
	  destroy() {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _removeListeners$1)[_removeListeners$1] !== null) {
	      babelHelpers.classPrivateFieldLooseBase(this, _removeListeners$1)[_removeListeners$1]();
	    }
	    if (babelHelpers.classPrivateFieldLooseBase(this, _resizeObserver)[_resizeObserver] !== null) {
	      babelHelpers.classPrivateFieldLooseBase(this, _resizeObserver)[_resizeObserver].disconnect();
	      babelHelpers.classPrivateFieldLooseBase(this, _resizeObserver)[_resizeObserver] = null;
	    }
	    if (this.isRendered()) {
	      main_core.Dom.remove(this.getContainer());
	    }
	    if (babelHelpers.classPrivateFieldLooseBase(this, _timeoutId$1)[_timeoutId$1]) {
	      clearTimeout(babelHelpers.classPrivateFieldLooseBase(this, _timeoutId$1)[_timeoutId$1]);
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _items)[_items] = null;
	    babelHelpers.classPrivateFieldLooseBase(this, _refs$8)[_refs$8] = null;
	  }
	  update() {
	    babelHelpers.classPrivateFieldLooseBase(this, _textEditor$2)[_textEditor$2].getEditorState().read(() => {
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
	      const blockTypes = selection === null ? new Set() : babelHelpers.classPrivateFieldLooseBase(this, _getSelectionBlockTypes)[_getSelectionBlockTypes](selection);
	      const isReadOnly = !babelHelpers.classPrivateFieldLooseBase(this, _textEditor$2)[_textEditor$2].isEditable();
	      babelHelpers.classPrivateFieldLooseBase(this, _items)[_items].forEach(item => {
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
	    babelHelpers.classPrivateFieldLooseBase(this, _items)[_items].forEach(item => {
	      if (item instanceof Button) {
	        item.setActive(false);
	      }
	    });
	  }
	}
	function _registerListeners2$c() {
	  return ui_lexical_utils.mergeRegister(babelHelpers.classPrivateFieldLooseBase(this, _textEditor$2)[_textEditor$2].registerCommand(ui_lexical_core.SELECTION_CHANGE_COMMAND, () => {
	    this.update();
	    return false;
	  }, ui_lexical_core.COMMAND_PRIORITY_CRITICAL), babelHelpers.classPrivateFieldLooseBase(this, _textEditor$2)[_textEditor$2].registerCommand(ui_lexical_core.FOCUS_COMMAND, () => {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _timeoutId$1)[_timeoutId$1]) {
	      clearTimeout(babelHelpers.classPrivateFieldLooseBase(this, _timeoutId$1)[_timeoutId$1]);
	      babelHelpers.classPrivateFieldLooseBase(this, _timeoutId$1)[_timeoutId$1] = null;
	    }
	    return false;
	  }, ui_lexical_core.COMMAND_PRIORITY_CRITICAL), babelHelpers.classPrivateFieldLooseBase(this, _textEditor$2)[_textEditor$2].registerCommand(ui_lexical_core.BLUR_COMMAND, () => {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _timeoutId$1)[_timeoutId$1]) {
	      clearTimeout(babelHelpers.classPrivateFieldLooseBase(this, _timeoutId$1)[_timeoutId$1]);
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _timeoutId$1)[_timeoutId$1] = setTimeout(() => {
	      const activeElement = document.activeElement;
	      const rootElement = babelHelpers.classPrivateFieldLooseBase(this, _textEditor$2)[_textEditor$2].getScrollerContainer();
	      if (activeElement === null || !rootElement.contains(activeElement)) {
	        this.reset();
	      }
	    }, 400);
	    return false;
	  }, ui_lexical_core.COMMAND_PRIORITY_CRITICAL), babelHelpers.classPrivateFieldLooseBase(this, _textEditor$2)[_textEditor$2].registerUpdateListener(() => {
	    this.update();
	  }), babelHelpers.classPrivateFieldLooseBase(this, _textEditor$2)[_textEditor$2].registerEditableListener(() => {
	    this.update();
	  }));
	}
	function _fillFromOptions2(options) {
	  options.forEach(item => {
	    if (item === '|') {
	      babelHelpers.classPrivateFieldLooseBase(this, _items)[_items].push(new Separator());
	    } else {
	      const component = babelHelpers.classPrivateFieldLooseBase(this, _textEditor$2)[_textEditor$2].getComponentRegistry().create(item);
	      if (component === null) {
	        // eslint-disable-next-line no-console
	        console.warn(`TextEditor Toolbar: "${item}" component doesn't exist.`);
	      } else {
	        babelHelpers.classPrivateFieldLooseBase(this, _items)[_items].push(component);
	      }
	    }
	  });
	}
	function _handleResize2$1(entries) {
	  if (this.getContainer().offsetWidth === 0 || main_core.Dom.hasClass(this.getItemsContainer(), '--animating')) {
	    return;
	  }
	  const lastItem = babelHelpers.classPrivateFieldLooseBase(this, _items)[_items].at(-1);
	  if (!lastItem || lastItem.getContainer().offsetTop >= lastItem.getContainer().offsetHeight) {
	    main_core.Dom.addClass(this.getContainer(), '--overflowed');
	  } else {
	    main_core.Dom.removeClass(this.getContainer(), ['--overflowed', '--expanded']);
	  }
	}
	function _getSelectionBlockTypes2(selection) {
	  const anchorNode = selection.anchor.getNode();
	  const blockTypes = new Set();
	  let currentNode = anchorNode;
	  while (currentNode !== ui_lexical_core.$getRoot() && currentNode !== null) {
	    const blockType = babelHelpers.classPrivateFieldLooseBase(this, _getBlockType)[_getBlockType](currentNode);
	    blockTypes.add(blockType);
	    currentNode = currentNode.getParent();
	  }
	  return blockTypes;
	}
	function _getBlockType2(node) {
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

	let _$f = t => t,
	  _t$f;
	var _popup$5 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("popup");
	var _toolbar = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("toolbar");
	var _showDebounced = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("showDebounced");
	var _onEditorScroll$5 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onEditorScroll");
	var _registerListeners$d = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("registerListeners");
	var _show$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("show");
	var _adjustDialogPosition$2 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("adjustDialogPosition");
	var _initDialogPosition = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("initDialogPosition");
	var _handleEditorScroll$5 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleEditorScroll");
	var _shouldShowDialog = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("shouldShowDialog");
	class FloatingToolbarPlugin extends BasePlugin {
	  constructor(editor) {
	    super(editor);
	    Object.defineProperty(this, _shouldShowDialog, {
	      value: _shouldShowDialog2
	    });
	    Object.defineProperty(this, _handleEditorScroll$5, {
	      value: _handleEditorScroll2$5
	    });
	    Object.defineProperty(this, _initDialogPosition, {
	      value: _initDialogPosition2
	    });
	    Object.defineProperty(this, _adjustDialogPosition$2, {
	      value: _adjustDialogPosition2$2
	    });
	    Object.defineProperty(this, _show$1, {
	      value: _show2$1
	    });
	    Object.defineProperty(this, _registerListeners$d, {
	      value: _registerListeners2$d
	    });
	    Object.defineProperty(this, _popup$5, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _toolbar, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _showDebounced, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _onEditorScroll$5, {
	      writable: true,
	      value: babelHelpers.classPrivateFieldLooseBase(this, _handleEditorScroll$5)[_handleEditorScroll$5].bind(this)
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _showDebounced)[_showDebounced] = main_core.Runtime.debounce(() => {
	      this.getEditor().update(() => {
	        if (babelHelpers.classPrivateFieldLooseBase(this, _shouldShowDialog)[_shouldShowDialog]()) {
	          babelHelpers.classPrivateFieldLooseBase(this, _show$1)[_show$1]();
	        }
	      });
	    }, 700);
	  }
	  static getName() {
	    return 'FloatingToolbar';
	  }
	  afterInit() {
	    const toolbarOptions = this.getEditor().getOption('floatingToolbar', []);
	    babelHelpers.classPrivateFieldLooseBase(this, _toolbar)[_toolbar] = new Toolbar(this.getEditor(), toolbarOptions);
	    if (!babelHelpers.classPrivateFieldLooseBase(this, _toolbar)[_toolbar].isEmpty()) {
	      this.cleanUpRegister(babelHelpers.classPrivateFieldLooseBase(this, _registerListeners$d)[_registerListeners$d]());
	    }
	  }
	  update() {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _shouldShowDialog)[_shouldShowDialog]()) {
	      if (this.getPopup().isShown()) {
	        babelHelpers.classPrivateFieldLooseBase(this, _show$1)[_show$1]();
	      } else {
	        babelHelpers.classPrivateFieldLooseBase(this, _showDebounced)[_showDebounced]();
	      }
	    } else {
	      this.getPopup().close();
	    }
	  }
	  getPopup() {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _popup$5)[_popup$5] === null) {
	      const container = main_core.Tag.render(_t$f || (_t$f = _$f`<div class="ui-text-editor-floating-toolbar"></div>`));
	      babelHelpers.classPrivateFieldLooseBase(this, _popup$5)[_popup$5] = new main_popup.Popup({
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
	            if (babelHelpers.classPrivateFieldLooseBase(this, _adjustDialogPosition$2)[_adjustDialogPosition$2]()) {
	              main_core.Event.bind(this.getEditor().getScrollerContainer(), 'scroll', babelHelpers.classPrivateFieldLooseBase(this, _onEditorScroll$5)[_onEditorScroll$5]);
	            }
	          },
	          onClose: () => {
	            main_core.Event.unbind(this.getEditor().getScrollerContainer(), 'scroll', babelHelpers.classPrivateFieldLooseBase(this, _onEditorScroll$5)[_onEditorScroll$5]);
	            clearDialogPosition(this.getPopup());
	          }
	        }
	      });
	      babelHelpers.classPrivateFieldLooseBase(this, _toolbar)[_toolbar].renderTo(container);
	    }
	    return babelHelpers.classPrivateFieldLooseBase(this, _popup$5)[_popup$5];
	  }
	  hide() {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _popup$5)[_popup$5] === null) {
	      return;
	    }
	    this.getPopup().close();
	  }
	  destroy() {
	    super.destroy();
	    if (babelHelpers.classPrivateFieldLooseBase(this, _popup$5)[_popup$5] !== null) {
	      babelHelpers.classPrivateFieldLooseBase(this, _popup$5)[_popup$5].destroy();
	      babelHelpers.classPrivateFieldLooseBase(this, _popup$5)[_popup$5] = null;
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _toolbar)[_toolbar].destroy();
	    babelHelpers.classPrivateFieldLooseBase(this, _toolbar)[_toolbar] = null;
	  }
	}
	function _registerListeners2$d() {
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
	function _show2$1() {
	  this.getPopup().show();
	  clearDialogPosition(this.getPopup());
	  babelHelpers.classPrivateFieldLooseBase(this, _adjustDialogPosition$2)[_adjustDialogPosition$2]();
	}
	function _adjustDialogPosition2$2() {
	  return $adjustDialogPosition(this.getPopup(), this.getEditor(), babelHelpers.classPrivateFieldLooseBase(this, _initDialogPosition)[_initDialogPosition]);
	}
	function _initDialogPosition2(selectionPosition) {
	  const {
	    isBackward,
	    isMultiline
	  } = selectionPosition;
	  return isBackward || !isMultiline ? 'top' : 'bottom';
	}
	function _handleEditorScroll2$5() {
	  this.getEditor().update(() => {
	    babelHelpers.classPrivateFieldLooseBase(this, _adjustDialogPosition$2)[_adjustDialogPosition$2]();
	  });
	}
	function _shouldShowDialog2() {
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
	  const node = getSelectedNode(selection);
	  const parent = node.getParent();
	  if (ui_lexical_link.$isLinkNode(parent) || ui_lexical_link.$isLinkNode(node)) {
	    return false;
	  }
	  const isSomeDialogVisible = this.getEditor().dispatchCommand(DIALOG_VISIBILITY_COMMAND);
	  if (isSomeDialogVisible) {
	    return false;
	  }
	  return ui_lexical_core.$isTextNode(node);
	}



	var FloatingToolbar = /*#__PURE__*/Object.freeze({
		FloatingToolbarPlugin: FloatingToolbarPlugin
	});

	var _toolbar$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("toolbar");
	class ToolbarPlugin extends BasePlugin {
	  constructor(...args) {
	    super(...args);
	    Object.defineProperty(this, _toolbar$1, {
	      writable: true,
	      value: null
	    });
	  }
	  static getName() {
	    return 'Toolbar';
	  }
	  getToolbar() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _toolbar$1)[_toolbar$1];
	  }
	  afterInit() {
	    babelHelpers.classPrivateFieldLooseBase(this, _toolbar$1)[_toolbar$1] = new Toolbar(this.getEditor(), this.getEditor().getOption('toolbar'));
	    if (!babelHelpers.classPrivateFieldLooseBase(this, _toolbar$1)[_toolbar$1].isEmpty()) {
	      babelHelpers.classPrivateFieldLooseBase(this, _toolbar$1)[_toolbar$1].renderTo(this.getEditor().getToolbarContainer());
	    }
	  }
	  destroy() {
	    super.destroy();
	    babelHelpers.classPrivateFieldLooseBase(this, _toolbar$1)[_toolbar$1].destroy();
	  }
	}



	var Toolbar$1 = /*#__PURE__*/Object.freeze({
		ToolbarPlugin: ToolbarPlugin
	});

	let _$g = t => t,
	  _t$g;
	var _placeholder = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("placeholder");
	var _placeholderNode = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("placeholderNode");
	var _paragraphPlaceholder = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("paragraphPlaceholder");
	var _registerPlaceholderListeners = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("registerPlaceholderListeners");
	var _togglePlaceholder = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("togglePlaceholder");
	var _hasFocus = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("hasFocus");
	var _hidePlaceholder = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("hidePlaceholder");
	var _registerParagraphListeners = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("registerParagraphListeners");
	class PlaceholderPlugin extends BasePlugin {
	  constructor(...args) {
	    super(...args);
	    Object.defineProperty(this, _registerParagraphListeners, {
	      value: _registerParagraphListeners2
	    });
	    Object.defineProperty(this, _hidePlaceholder, {
	      value: _hidePlaceholder2
	    });
	    Object.defineProperty(this, _hasFocus, {
	      value: _hasFocus2
	    });
	    Object.defineProperty(this, _togglePlaceholder, {
	      value: _togglePlaceholder2
	    });
	    Object.defineProperty(this, _registerPlaceholderListeners, {
	      value: _registerPlaceholderListeners2
	    });
	    Object.defineProperty(this, _placeholder, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _placeholderNode, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _paragraphPlaceholder, {
	      writable: true,
	      value: null
	    });
	  }
	  afterInit() {
	    const placeholder = this.getEditor().getOption('placeholder');
	    if (main_core.Type.isStringFilled(placeholder)) {
	      babelHelpers.classPrivateFieldLooseBase(this, _placeholder)[_placeholder] = placeholder;
	      babelHelpers.classPrivateFieldLooseBase(this, _placeholderNode)[_placeholderNode] = main_core.Tag.render(_t$g || (_t$g = _$g`
				<div class="ui-text-editor-placeholder">${0}</div>
			`), main_core.Text.encode(babelHelpers.classPrivateFieldLooseBase(this, _placeholder)[_placeholder]));
	      main_core.Dom.append(babelHelpers.classPrivateFieldLooseBase(this, _placeholderNode)[_placeholderNode], this.getEditor().getScrollerContainer());
	      babelHelpers.classPrivateFieldLooseBase(this, _registerPlaceholderListeners)[_registerPlaceholderListeners]();
	    }
	    let paragraphPlaceholder = this.getEditor().getOption('paragraphPlaceholder');
	    if (main_core.Type.isStringFilled(paragraphPlaceholder)) {
	      if (paragraphPlaceholder === 'auto') {
	        const copilotPlugin = this.getEditor().getPlugin('Copilot');
	        const copilotEnabled = copilotPlugin !== null && copilotPlugin.shouldTriggerBySpace();
	        const mentionPlugin = this.getEditor().getPlugin('Mention');
	        const mentionEnabled = mentionPlugin !== null && mentionPlugin.shouldTriggerByAtSign();
	        if (copilotEnabled && mentionEnabled) {
	          paragraphPlaceholder = main_core.Loc.getMessage('TEXT_EDITOR_PLACEHOLDER_MENTION_COPILOT');
	        } else if (copilotEnabled) {
	          paragraphPlaceholder = main_core.Loc.getMessage('TEXT_EDITOR_PLACEHOLDER_COPILOT');
	        } else if (mentionEnabled) {
	          paragraphPlaceholder = main_core.Loc.getMessage('TEXT_EDITOR_PLACEHOLDER_MENTION');
	        }
	      }
	      babelHelpers.classPrivateFieldLooseBase(this, _paragraphPlaceholder)[_paragraphPlaceholder] = paragraphPlaceholder;
	      babelHelpers.classPrivateFieldLooseBase(this, _registerParagraphListeners)[_registerParagraphListeners]();
	    }
	  }
	  static getName() {
	    return 'Placeholder';
	  }
	}
	function _registerPlaceholderListeners2() {
	  this.cleanUpRegister(this.getEditor().registerUpdateListener(() => {
	    this.getEditor().getEditorState().read(() => {
	      babelHelpers.classPrivateFieldLooseBase(this, _togglePlaceholder)[_togglePlaceholder]();
	    });
	  }));
	}
	function _togglePlaceholder2() {
	  if (babelHelpers.classPrivateFieldLooseBase(this, _placeholder)[_placeholder] === null) {
	    return;
	  }
	  let canShowPlaceholder = ui_lexical_text.$canShowPlaceholder(this.getLexicalEditor().isComposing());
	  if (canShowPlaceholder && babelHelpers.classPrivateFieldLooseBase(this, _paragraphPlaceholder)[_paragraphPlaceholder] !== null && babelHelpers.classPrivateFieldLooseBase(this, _hasFocus)[_hasFocus]()) {
	    canShowPlaceholder = false;
	  }
	  if (canShowPlaceholder) {
	    main_core.Dom.addClass(babelHelpers.classPrivateFieldLooseBase(this, _placeholderNode)[_placeholderNode], '--shown');
	  } else {
	    main_core.Dom.removeClass(babelHelpers.classPrivateFieldLooseBase(this, _placeholderNode)[_placeholderNode], '--shown');
	  }
	}
	function _hasFocus2() {
	  const activeElement = document.activeElement;
	  const rootElement = this.getEditor().getRootElement();
	  return rootElement !== null && activeElement !== null && rootElement.contains(activeElement);
	}
	function _hidePlaceholder2() {
	  if (babelHelpers.classPrivateFieldLooseBase(this, _placeholderNode)[_placeholderNode] !== null) {
	    main_core.Dom.removeClass(babelHelpers.classPrivateFieldLooseBase(this, _placeholderNode)[_placeholderNode], '--shown');
	  }
	}
	function _registerParagraphListeners2() {
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
	        if (htmlElement && babelHelpers.classPrivateFieldLooseBase(this, _hasFocus)[_hasFocus]()) {
	          htmlElement.dataset.placeholder = babelHelpers.classPrivateFieldLooseBase(this, _paragraphPlaceholder)[_paragraphPlaceholder];
	          currentParagraph = node;
	          babelHelpers.classPrivateFieldLooseBase(this, _hidePlaceholder)[_hidePlaceholder]();
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
	    babelHelpers.classPrivateFieldLooseBase(this, _togglePlaceholder)[_togglePlaceholder]();
	    return false;
	  }, ui_lexical_core.COMMAND_PRIORITY_CRITICAL));
	}

	let _$h = t => t,
	  _t$h,
	  _t2$b,
	  _t3$5,
	  _t4$2,
	  _t5,
	  _t6,
	  _t7,
	  _t8,
	  _t9,
	  _t10;
	const CollapsingState = {
	  COLLAPSED: 'collapsed',
	  COLLAPSING: 'collapsing',
	  EXPANDED: 'expanded',
	  EXPANDING: 'expanding'
	};

	/**
	 * @memberof BX.UI.TextEditor
	 */
	var _lexicalEditor = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("lexicalEditor");
	var _componentRegistry = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("componentRegistry");
	var _refs$9 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("refs");
	var _options$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("options");
	var _plugins$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("plugins");
	var _newLineMode = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("newLineMode");
	var _bbcodeScheme = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("bbcodeScheme");
	var _schemeValidation = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("schemeValidation");
	var _bbcodeImportMap = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("bbcodeImportMap");
	var _bbcodeExportMap = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("bbcodeExportMap");
	var _themeClasses = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("themeClasses");
	var _decoratorNodes = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("decoratorNodes");
	var _decoratorComponents = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("decoratorComponents");
	var _removeListeners$2 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("removeListeners");
	var _highlightContainer = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("highlightContainer");
	var _autoFocus = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("autoFocus");
	var _minHeight$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("minHeight");
	var _maxHeight$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("maxHeight");
	var _collapsingMode = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("collapsingMode");
	var _collapsingState = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("collapsingState");
	var _collapsingTransitionEnd = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("collapsingTransitionEnd");
	var _paragraphHeight = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("paragraphHeight");
	var _resizeObserver$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("resizeObserver");
	var _destroying = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("destroying");
	var _rendered$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("rendered");
	var _prevEmptyStatus = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("prevEmptyStatus");
	var _initEditorState = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("initEditorState");
	var _initDecorateNodes = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("initDecorateNodes");
	var _registerCommands$a = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("registerCommands");
	var _initBBCodeImportMap = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("initBBCodeImportMap");
	var _initBBCodeExportMap = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("initBBCodeExportMap");
	var _initBBCodeScheme = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("initBBCodeScheme");
	var _initCollapsingMode = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("initCollapsingMode");
	var _handleCollapsingTransition = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleCollapsingTransition");
	class TextEditor extends main_core_events.EventEmitter {
	  constructor(editorOptions) {
	    super();
	    Object.defineProperty(this, _handleCollapsingTransition, {
	      value: _handleCollapsingTransition2
	    });
	    Object.defineProperty(this, _initCollapsingMode, {
	      value: _initCollapsingMode2
	    });
	    Object.defineProperty(this, _initBBCodeScheme, {
	      value: _initBBCodeScheme2
	    });
	    Object.defineProperty(this, _initBBCodeExportMap, {
	      value: _initBBCodeExportMap2
	    });
	    Object.defineProperty(this, _initBBCodeImportMap, {
	      value: _initBBCodeImportMap2
	    });
	    Object.defineProperty(this, _registerCommands$a, {
	      value: _registerCommands2$a
	    });
	    Object.defineProperty(this, _initDecorateNodes, {
	      value: _initDecorateNodes2
	    });
	    Object.defineProperty(this, _initEditorState, {
	      value: _initEditorState2
	    });
	    Object.defineProperty(this, _lexicalEditor, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _componentRegistry, {
	      writable: true,
	      value: new ComponentRegistry()
	    });
	    Object.defineProperty(this, _refs$9, {
	      writable: true,
	      value: new main_core.Cache.MemoryCache()
	    });
	    Object.defineProperty(this, _options$1, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _plugins$1, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _newLineMode, {
	      writable: true,
	      value: NewLineMode.MIXED
	    });
	    Object.defineProperty(this, _bbcodeScheme, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _schemeValidation, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _bbcodeImportMap, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _bbcodeExportMap, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _themeClasses, {
	      writable: true,
	      value: {}
	    });
	    Object.defineProperty(this, _decoratorNodes, {
	      writable: true,
	      value: new Set()
	    });
	    Object.defineProperty(this, _decoratorComponents, {
	      writable: true,
	      value: new Map()
	    });
	    Object.defineProperty(this, _removeListeners$2, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _highlightContainer, {
	      writable: true,
	      value: main_core.Tag.render(_t$h || (_t$h = _$h`<div class="ui-text-editor-selection-highlighting"></div>`))
	    });
	    Object.defineProperty(this, _autoFocus, {
	      writable: true,
	      value: false
	    });
	    Object.defineProperty(this, _minHeight$1, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _maxHeight$1, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _collapsingMode, {
	      writable: true,
	      value: false
	    });
	    Object.defineProperty(this, _collapsingState, {
	      writable: true,
	      value: CollapsingState.EXPANDED
	    });
	    Object.defineProperty(this, _collapsingTransitionEnd, {
	      writable: true,
	      value: babelHelpers.classPrivateFieldLooseBase(this, _handleCollapsingTransition)[_handleCollapsingTransition].bind(this)
	    });
	    Object.defineProperty(this, _paragraphHeight, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _resizeObserver$1, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _destroying, {
	      writable: true,
	      value: false
	    });
	    Object.defineProperty(this, _rendered$1, {
	      writable: true,
	      value: false
	    });
	    Object.defineProperty(this, _prevEmptyStatus, {
	      writable: true,
	      value: true
	    });
	    this.setEventNamespace('BX.UI.TextEditor.Editor');
	    const _options2 = main_core.Type.isPlainObject(editorOptions) ? editorOptions : {};
	    babelHelpers.classPrivateFieldLooseBase(this, _options$1)[_options$1] = new main_core_collections.SettingsCollection(_options2);
	    const builtinPlugins = this.constructor.getBuiltinPlugins();
	    const plugins = babelHelpers.classPrivateFieldLooseBase(this, _options$1)[_options$1].get('plugins', builtinPlugins);
	    const extraPlugins = babelHelpers.classPrivateFieldLooseBase(this, _options$1)[_options$1].get('extraPlugins', []);
	    const pluginsToRemove = babelHelpers.classPrivateFieldLooseBase(this, _options$1)[_options$1].get('removePlugins', []);
	    const newLineMode = babelHelpers.classPrivateFieldLooseBase(this, _options$1)[_options$1].get('newLineMode');
	    if ([NewLineMode.LINE_BREAK, NewLineMode.PARAGRAPH].includes(newLineMode)) {
	      babelHelpers.classPrivateFieldLooseBase(this, _newLineMode)[_newLineMode] = newLineMode;
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _themeClasses)[_themeClasses] = defaultTheme;
	    babelHelpers.classPrivateFieldLooseBase(this, _plugins$1)[_plugins$1] = new PluginCollection(builtinPlugins, [...plugins, ...extraPlugins], pluginsToRemove);
	    const _nodes = babelHelpers.classPrivateFieldLooseBase(this, _plugins$1)[_plugins$1].getConstructors().map(pluginConstructor => {
	      return pluginConstructor.getNodes(this);
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _lexicalEditor)[_lexicalEditor] = ui_lexical_core.createEditor({
	      namespace: 'TextEditor',
	      // uses when you copy-paste from one to another editor
	      nodes: _nodes.flat(),
	      onError: error => {
	        console.error(error);
	      },
	      theme: babelHelpers.classPrivateFieldLooseBase(this, _themeClasses)[_themeClasses],
	      editable: babelHelpers.classPrivateFieldLooseBase(this, _options$1)[_options$1].get('editable') !== false
	    });
	    this.setMinHeight(_options2.minHeight);
	    this.setMaxHeight(_options2.maxHeight);
	    this.setAutoFocus(_options2.autoFocus);
	    babelHelpers.classPrivateFieldLooseBase(this, _removeListeners$2)[_removeListeners$2] = ui_lexical_utils.mergeRegister(babelHelpers.classPrivateFieldLooseBase(this, _registerCommands$a)[_registerCommands$a](), babelHelpers.classPrivateFieldLooseBase(this, _initDecorateNodes)[_initDecorateNodes](_nodes.flat()));
	    babelHelpers.classPrivateFieldLooseBase(this, _plugins$1)[_plugins$1].init(this);
	    babelHelpers.classPrivateFieldLooseBase(this, _bbcodeImportMap)[_bbcodeImportMap] = babelHelpers.classPrivateFieldLooseBase(this, _initBBCodeImportMap)[_initBBCodeImportMap]();
	    babelHelpers.classPrivateFieldLooseBase(this, _bbcodeExportMap)[_bbcodeExportMap] = babelHelpers.classPrivateFieldLooseBase(this, _initBBCodeExportMap)[_initBBCodeExportMap]();
	    babelHelpers.classPrivateFieldLooseBase(this, _bbcodeScheme)[_bbcodeScheme] = babelHelpers.classPrivateFieldLooseBase(this, _initBBCodeScheme)[_initBBCodeScheme]();
	    babelHelpers.classPrivateFieldLooseBase(this, _schemeValidation)[_schemeValidation] = new SchemeValidation(this);
	    this.subscribeFromOptions(_options2.events);
	  }
	  static getBuiltinPlugins() {
	    return [RichTextPlugin, ParagraphPlugin, BoldPlugin, UnderlinePlugin, ItalicPlugin, StrikethroughPlugin, TabIndentPlugin, CodePlugin, QuotePlugin, ListPlugin, MentionPlugin, LinkPlugin, AutoLinkPlugin, ImagePlugin, VideoPlugin, SmileyPlugin, SpoilerPlugin, TablePlugin, HashtagPlugin, CopilotPlugin, HistoryPlugin, BlockToolbarPlugin, FloatingToolbarPlugin, ToolbarPlugin, PlaceholderPlugin, FilePlugin];
	  }
	  static getDefaultOptions() {
	    return {
	      plugins: []
	    };
	  }
	  getComponentRegistry() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _componentRegistry)[_componentRegistry];
	  }
	  getOptions() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _options$1)[_options$1];
	  }
	  getOption(path, defaultValue = null) {
	    return babelHelpers.classPrivateFieldLooseBase(this, _options$1)[_options$1].get(path, defaultValue);
	  }
	  getThemeClasses() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _themeClasses)[_themeClasses];
	  }
	  getThemeClass(tagName) {
	    const className = babelHelpers.classPrivateFieldLooseBase(this, _themeClasses)[_themeClasses][tagName];
	    if (className !== undefined) {
	      return className;
	    }
	    return '';
	  }
	  getNewLineMode() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _newLineMode)[_newLineMode];
	  }
	  getBBCodeScheme() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _bbcodeScheme)[_bbcodeScheme];
	  }
	  getSchemeValidation() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _schemeValidation)[_schemeValidation];
	  }
	  setText(text, options) {
	    if (main_core.Type.isString(text)) {
	      const updateOptions = {
	        discrete: main_core.Type.isPlainObject(options) && options.discrete === true
	      };
	      babelHelpers.classPrivateFieldLooseBase(this, _lexicalEditor)[_lexicalEditor].update(() => {
	        const lexicalNodes = $importFromBBCode(text, this);
	        const root = ui_lexical_core.$getRoot();
	        root.clear();
	        root.append(...lexicalNodes);
	        ui_lexical_core.$setSelection(null);
	      }, updateOptions);
	    }
	  }
	  clear(options) {
	    const updateOptions = {
	      discrete: main_core.Type.isPlainObject(options) && options.discrete === true
	    };
	    babelHelpers.classPrivateFieldLooseBase(this, _lexicalEditor)[_lexicalEditor].update(() => {
	      const root = ui_lexical_core.$getRoot();
	      const paragraph = ui_lexical_core.$createParagraphNode();
	      root.clear();
	      root.append(paragraph);

	      // const selection = $getSelection();
	      // if (selection !== null)
	      // {
	      // 	paragraph.select();
	      // }

	      ui_lexical_core.$setSelection(null);
	    }, updateOptions);
	  }
	  clearHistory() {
	    this.dispatchCommand(ui_lexical_core.CLEAR_HISTORY_COMMAND);
	  }
	  getText() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _lexicalEditor)[_lexicalEditor].getEditorState().read(() => {
	      const bbCodeAst = $exportToBBCode(ui_lexical_core.$getRoot(), this);

	      // console.log("bbCodeAst", bbCodeAst);

	      return bbCodeAst.toString();
	    });
	  }
	  isEmpty(trim = true) {
	    return babelHelpers.classPrivateFieldLooseBase(this, _lexicalEditor)[_lexicalEditor].getEditorState().read(() => {
	      return $isRootEmpty(trim);
	    });
	  }
	  setAutoFocus(flag) {
	    if (main_core.Type.isBoolean(flag)) {
	      babelHelpers.classPrivateFieldLooseBase(this, _autoFocus)[_autoFocus] = flag;
	    }
	  }
	  hasAutoFocus() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _autoFocus)[_autoFocus];
	  }
	  setMinHeight(minHeight) {
	    if (main_core.Type.isNumber(minHeight) && minHeight > 0 || minHeight === null) {
	      const changed = babelHelpers.classPrivateFieldLooseBase(this, _minHeight$1)[_minHeight$1] !== minHeight;
	      babelHelpers.classPrivateFieldLooseBase(this, _minHeight$1)[_minHeight$1] = minHeight;
	      if (changed) {
	        main_core.Dom.style(this.getScrollerContainer(), '--ui-text-editor-min-height', minHeight > 0 ? `${minHeight}px` : null);
	      }
	    }
	  }
	  getMinHeight() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _minHeight$1)[_minHeight$1];
	  }
	  setMaxHeight(maxHeight) {
	    if (main_core.Type.isNumber(maxHeight) && maxHeight > 0 || maxHeight === null) {
	      const changed = babelHelpers.classPrivateFieldLooseBase(this, _maxHeight$1)[_maxHeight$1] !== maxHeight;
	      babelHelpers.classPrivateFieldLooseBase(this, _maxHeight$1)[_maxHeight$1] = maxHeight;
	      if (changed) {
	        main_core.Dom.style(this.getScrollerContainer(), '--ui-text-editor-max-height', maxHeight > 0 ? `${maxHeight}px` : null);
	      }
	    }
	  }
	  getMaxHeight() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _maxHeight$1)[_maxHeight$1];
	  }
	  isCollapsingModeEnabled() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _collapsingMode)[_collapsingMode];
	  }
	  isCollapsed() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _collapsingState)[_collapsingState] === CollapsingState.COLLAPSED;
	  }
	  toggleCollapsing() {
	    if (!this.isCollapsingModeEnabled()) {
	      return;
	    }
	    main_core.Event.unbind(this.getRootContainer(), 'transitionend', babelHelpers.classPrivateFieldLooseBase(this, _collapsingTransitionEnd)[_collapsingTransitionEnd]);
	    if (babelHelpers.classPrivateFieldLooseBase(this, _collapsingState)[_collapsingState] === CollapsingState.COLLAPSED || babelHelpers.classPrivateFieldLooseBase(this, _collapsingState)[_collapsingState] === CollapsingState.COLLAPSING) {
	      babelHelpers.classPrivateFieldLooseBase(this, _collapsingState)[_collapsingState] = CollapsingState.EXPANDING;
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
	      babelHelpers.classPrivateFieldLooseBase(this, _collapsingState)[_collapsingState] = CollapsingState.COLLAPSING;
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
	    main_core.Event.bind(this.getRootContainer(), 'transitionend', babelHelpers.classPrivateFieldLooseBase(this, _collapsingTransitionEnd)[_collapsingTransitionEnd]);
	  }
	  getParagraphHeight() {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _paragraphHeight)[_paragraphHeight] !== null) {
	      return babelHelpers.classPrivateFieldLooseBase(this, _paragraphHeight)[_paragraphHeight];
	    }
	    const className = this.getThemeClasses().paragraph || '';
	    const paragraph = main_core.Tag.render(_t2$b || (_t2$b = _$h`<p class="${0}"><br /></p>`), className);
	    main_core.Dom.style(paragraph, {
	      position: 'absolute',
	      transform: 'translateY(-1000px)'
	    });
	    main_core.Dom.append(paragraph, this.getScrollerContainer());
	    babelHelpers.classPrivateFieldLooseBase(this, _paragraphHeight)[_paragraphHeight] = paragraph.offsetHeight + main_core.Text.toNumber(main_core.Dom.style(paragraph, 'margin-top')) + main_core.Text.toNumber(main_core.Dom.style(paragraph, 'margin-bottom'));
	    main_core.Dom.remove(paragraph);
	    return babelHelpers.classPrivateFieldLooseBase(this, _paragraphHeight)[_paragraphHeight];
	  }
	  getLexicalEditor() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _lexicalEditor)[_lexicalEditor];
	  }
	  setRootElement(contentEditableElement) {
	    if (main_core.Type.isElementNode(contentEditableElement) || contentEditableElement === null) {
	      babelHelpers.classPrivateFieldLooseBase(this, _lexicalEditor)[_lexicalEditor].setRootElement(contentEditableElement);
	    }
	  }
	  getBBCodeExportMap() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _bbcodeExportMap)[_bbcodeExportMap];
	  }
	  getBBCodeImportMap() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _bbcodeImportMap)[_bbcodeImportMap];
	  }
	  getEditorState() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _lexicalEditor)[_lexicalEditor].getEditorState();
	  }
	  getPlugins() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _plugins$1)[_plugins$1];
	  }
	  getPlugin(key) {
	    return babelHelpers.classPrivateFieldLooseBase(this, _plugins$1)[_plugins$1].get(key);
	  }
	  getElementByKey(key) {
	    return babelHelpers.classPrivateFieldLooseBase(this, _lexicalEditor)[_lexicalEditor].getElementByKey(key);
	  }
	  setEditorState(editorState, options) {
	    babelHelpers.classPrivateFieldLooseBase(this, _lexicalEditor)[_lexicalEditor].setEditorState(editorState, options);
	  }
	  setEditable(editable) {
	    if (main_core.Type.isBoolean(editable)) {
	      this.dispatchCommand(HIDE_DIALOG_COMMAND);
	      if (!editable) {
	        this.blur();
	      }
	      babelHelpers.classPrivateFieldLooseBase(this, _lexicalEditor)[_lexicalEditor].setEditable(editable);
	    }
	  }
	  isEditable() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _lexicalEditor)[_lexicalEditor].isEditable();
	  }
	  registerUpdateListener(listener) {
	    return babelHelpers.classPrivateFieldLooseBase(this, _lexicalEditor)[_lexicalEditor].registerUpdateListener(listener);
	  }
	  registerEditableListener(listener) {
	    return babelHelpers.classPrivateFieldLooseBase(this, _lexicalEditor)[_lexicalEditor].registerEditableListener(listener);
	  }
	  registerCommand(command, listener, priority) {
	    return babelHelpers.classPrivateFieldLooseBase(this, _lexicalEditor)[_lexicalEditor].registerCommand(command, listener, priority);
	  }
	  dispatchCommand(type, payload) {
	    return babelHelpers.classPrivateFieldLooseBase(this, _lexicalEditor)[_lexicalEditor].dispatchCommand(type, payload);
	  }
	  registerMutationListener(klass, listener) {
	    return babelHelpers.classPrivateFieldLooseBase(this, _lexicalEditor)[_lexicalEditor].registerMutationListener(klass, listener);
	  }
	  registerNodeTransform(klass, listener) {
	    return babelHelpers.classPrivateFieldLooseBase(this, _lexicalEditor)[_lexicalEditor].registerNodeTransform(klass, listener);
	  }
	  registerTextContentListener(listener) {
	    return babelHelpers.classPrivateFieldLooseBase(this, _lexicalEditor)[_lexicalEditor].registerTextContentListener(listener);
	  }
	  registerDecoratorListener(listener) {
	    return babelHelpers.classPrivateFieldLooseBase(this, _lexicalEditor)[_lexicalEditor].registerDecoratorListener(listener);
	  }
	  registerRootListener(listener) {
	    return babelHelpers.classPrivateFieldLooseBase(this, _lexicalEditor)[_lexicalEditor].registerRootListener(listener);
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
	    babelHelpers.classPrivateFieldLooseBase(this, _lexicalEditor)[_lexicalEditor].update(updateFn, options);
	  }
	  focus(callbackFn, options) {
	    if (!document.hasFocus()) {
	      window.focus();
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _lexicalEditor)[_lexicalEditor].focus(main_core.Type.isFunction(callbackFn) ? callbackFn : null, main_core.Type.isPlainObject(options) ? options : undefined);
	  }
	  hasFocus() {
	    return this.getRootElement().contains(document.activeElement);
	  }
	  blur() {
	    babelHelpers.classPrivateFieldLooseBase(this, _lexicalEditor)[_lexicalEditor].blur();
	  }
	  isComposing() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _lexicalEditor)[_lexicalEditor].isComposing();
	  }
	  getRootElement() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _lexicalEditor)[_lexicalEditor].getRootElement();
	  }
	  hasNodes(nodes) {
	    return babelHelpers.classPrivateFieldLooseBase(this, _lexicalEditor)[_lexicalEditor].hasNodes(nodes);
	  }
	  getRootContainer() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _refs$9)[_refs$9].remember('root', () => {
	      const classes = [this.isEditable() ? '--editable' : '--read-only'];
	      return main_core.Tag.render(_t3$5 || (_t3$5 = _$h`
				<div class="ui-text-editor ${0}">
					${0}
				</div>
			`), classes.join(' '), this.getInnerContainer());
	    });
	  }
	  getInnerContainer() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _refs$9)[_refs$9].remember('inner', () => {
	      return main_core.Tag.render(_t4$2 || (_t4$2 = _$h`
				<div class="ui-text-editor-inner">
					${0}
					${0}
					${0}
					${0}
				</div>
			`), this.getHeaderContainer(), this.getToolbarContainer(), this.getScrollerContainer(), this.getFooterContainer());
	    });
	  }
	  getToolbarContainer() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _refs$9)[_refs$9].remember('toolbar', () => {
	      return main_core.Tag.render(_t5 || (_t5 = _$h`
				<div class="ui-text-editor-toolbar" tabindex="-1"></div>
			`));
	    });
	  }
	  getScrollerContainer() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _refs$9)[_refs$9].remember('scroller', () => {
	      return main_core.Tag.render(_t6 || (_t6 = _$h`
				<div class="ui-text-editor-scroller">
					${0}
				</div>
			`), this.getEditableContainer());
	    });
	  }
	  getEditableContainer() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _refs$9)[_refs$9].remember('editable', () => {
	      return main_core.Tag.render(_t7 || (_t7 = _$h`
				<div 
					class="ui-text-editor-editable" 
					contenteditable="${0}" 
					spellcheck="true"
				></div>
			`), this.isEditable() ? 'true' : 'false');
	    });
	  }
	  getFooterContainer() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _refs$9)[_refs$9].remember('footer', () => {
	      return main_core.Tag.render(_t8 || (_t8 = _$h`
				<div class="ui-text-editor-slot ui-text-editor-footer" tabindex="-1"></div>
			`));
	    });
	  }
	  getHeaderContainer() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _refs$9)[_refs$9].remember('header', () => {
	      return main_core.Tag.render(_t9 || (_t9 = _$h`
				<div class="ui-text-editor-slot ui-text-editor-header" tabindex="-1"></div>
			`));
	    });
	  }
	  renderTo(container, replaceNode = false) {
	    if (!main_core.Type.isElementNode(container)) {
	      return;
	    }
	    if (!this.isRendered()) {
	      if (main_core.Type.isStringFilled(babelHelpers.classPrivateFieldLooseBase(this, _options$1)[_options$1].get('content'))) {
	        this.setText(babelHelpers.classPrivateFieldLooseBase(this, _options$1)[_options$1].get('content'));
	      } else {
	        babelHelpers.classPrivateFieldLooseBase(this, _initEditorState)[_initEditorState](babelHelpers.classPrivateFieldLooseBase(this, _options$1)[_options$1].get('editorState'));
	      }
	    }
	    if (replaceNode) {
	      main_core.Dom.replace(container, this.getRootContainer());
	    } else {
	      main_core.Dom.append(this.getRootContainer(), container);
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _lexicalEditor)[_lexicalEditor].setRootElement(this.getEditableContainer());
	    if (this.hasAutoFocus()) {
	      this.focus(null, {
	        defaultSelection: 'rootStart'
	      });
	    }
	    if (!babelHelpers.classPrivateFieldLooseBase(this, _rendered$1)[_rendered$1]) {
	      babelHelpers.classPrivateFieldLooseBase(this, _resizeObserver$1)[_resizeObserver$1] = new ResizeObserver(() => {
	        this.emit('onResize');
	        this.dispatchCommand(HIDE_DIALOG_COMMAND, {
	          context: 'resize'
	        });
	      });
	      babelHelpers.classPrivateFieldLooseBase(this, _resizeObserver$1)[_resizeObserver$1].observe(this.getScrollerContainer());
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _rendered$1)[_rendered$1] = true;
	  }
	  isRendered() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _rendered$1)[_rendered$1];
	  }
	  highlightSelection() {
	    this.getEditorState().read(() => {
	      const selection = ui_lexical_core.$getSelection();
	      if (!ui_lexical_core.$isRangeSelection(selection) || selection.isCollapsed()) {
	        return;
	      }
	      const anchor = selection.anchor;
	      const focus = selection.focus;
	      const range = ui_lexical_selection.createDOMRange(babelHelpers.classPrivateFieldLooseBase(this, _lexicalEditor)[_lexicalEditor], anchor.getNode(), anchor.offset, focus.getNode(), focus.offset);
	      if (range !== null) {
	        const scrollerContainer = this.getScrollerContainer();
	        const scrollerRect = scrollerContainer.getBoundingClientRect();
	        const selectionRects = ui_lexical_selection.createRectsFromDOMRange(babelHelpers.classPrivateFieldLooseBase(this, _lexicalEditor)[_lexicalEditor], range);
	        const selectionRectsLength = selectionRects.length;
	        babelHelpers.classPrivateFieldLooseBase(this, _highlightContainer)[_highlightContainer].innerHTML = '';
	        for (let i = 0; i < selectionRectsLength; i++) {
	          const selectionRect = selectionRects[i];
	          const elem = main_core.Tag.render(_t10 || (_t10 = _$h`<span class="ui-text-editor-selection-part"></span>`));
	          const top = selectionRect.top - scrollerRect.top + scrollerContainer.scrollTop;
	          const left = selectionRect.left - scrollerRect.left + scrollerContainer.scrollLeft;
	          main_core.Dom.style(elem, {
	            top: `${top}px`,
	            left: `${left}px`,
	            height: `${selectionRect.height}px`,
	            width: `${selectionRect.width}px`
	          });
	          main_core.Dom.append(elem, babelHelpers.classPrivateFieldLooseBase(this, _highlightContainer)[_highlightContainer]);
	        }
	        main_core.Dom.append(babelHelpers.classPrivateFieldLooseBase(this, _highlightContainer)[_highlightContainer], this.getScrollerContainer());
	      }
	    });
	  }
	  resetHighlightSelection() {
	    main_core.Dom.remove(babelHelpers.classPrivateFieldLooseBase(this, _highlightContainer)[_highlightContainer]);
	  }
	  destroy() {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _destroying)[_destroying]) {
	      return;
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _destroying)[_destroying] = true;
	    this.emit('onDestroy');
	    for (const [, plugin] of babelHelpers.classPrivateFieldLooseBase(this, _plugins$1)[_plugins$1]) {
	      plugin.destroy();
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _removeListeners$2)[_removeListeners$2]();
	    if (this.isRendered()) {
	      babelHelpers.classPrivateFieldLooseBase(this, _resizeObserver$1)[_resizeObserver$1].disconnect();
	      this.setRootElement(null);
	      main_core.Dom.remove(this.getRootContainer());
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _resizeObserver$1)[_resizeObserver$1] = null;
	    babelHelpers.classPrivateFieldLooseBase(this, _plugins$1)[_plugins$1] = null;
	    babelHelpers.classPrivateFieldLooseBase(this, _lexicalEditor)[_lexicalEditor] = null;
	    this.$refs = null;
	    babelHelpers.classPrivateFieldLooseBase(this, _schemeValidation)[_schemeValidation] = null;
	    babelHelpers.classPrivateFieldLooseBase(this, _bbcodeImportMap)[_bbcodeImportMap] = null;
	    babelHelpers.classPrivateFieldLooseBase(this, _bbcodeExportMap)[_bbcodeExportMap] = null;
	    babelHelpers.classPrivateFieldLooseBase(this, _decoratorNodes)[_decoratorNodes] = null;
	    babelHelpers.classPrivateFieldLooseBase(this, _decoratorComponents)[_decoratorComponents] = null;
	    Object.setPrototypeOf(this, null);
	  }
	}
	function _initEditorState2(initialEditorState, options) {
	  if (main_core.Type.isNil(initialEditorState)) {
	    babelHelpers.classPrivateFieldLooseBase(this, _lexicalEditor)[_lexicalEditor].update(() => {
	      const root = ui_lexical_core.$getRoot();
	      if (root.isEmpty()) {
	        const paragraph = ui_lexical_core.$createParagraphNode();
	        root.append(paragraph);
	      }
	    }, options);
	  } else if (main_core.Type.isPlainObject(initialEditorState) || main_core.Type.isStringFilled(initialEditorState)) {
	    const parsedEditorState = babelHelpers.classPrivateFieldLooseBase(this, _lexicalEditor)[_lexicalEditor].parseEditorState(initialEditorState);
	    babelHelpers.classPrivateFieldLooseBase(this, _lexicalEditor)[_lexicalEditor].setEditorState(parsedEditorState);
	  } else if (main_core.Type.isFunction(initialEditorState)) {
	    babelHelpers.classPrivateFieldLooseBase(this, _lexicalEditor)[_lexicalEditor].update(() => {
	      const root = ui_lexical_core.$getRoot();
	      if (root.isEmpty()) {
	        initialEditorState(babelHelpers.classPrivateFieldLooseBase(this, _lexicalEditor)[_lexicalEditor]);
	      }
	    }, options);
	  }
	}
	function _initDecorateNodes2(editorNodes) {
	  const removeListeners = [];
	  editorNodes.forEach(nodeClass => {
	    if (nodeClass.useDecoratorComponent) {
	      const removeListener = this.registerMutationListener(nodeClass, (nodes, payload) => {
	        for (const [key, val] of nodes) {
	          if (val === 'destroyed') {
	            const component = babelHelpers.classPrivateFieldLooseBase(this, _decoratorComponents)[_decoratorComponents].get(key);
	            if (component) {
	              component.destroy();
	            }
	            babelHelpers.classPrivateFieldLooseBase(this, _decoratorComponents)[_decoratorComponents].delete(key);
	          } else {
	            babelHelpers.classPrivateFieldLooseBase(this, _decoratorNodes)[_decoratorNodes].add(key);
	          }
	        }
	      });
	      removeListeners.push(removeListener);
	    }
	  });
	  const removeListener = babelHelpers.classPrivateFieldLooseBase(this, _lexicalEditor)[_lexicalEditor].registerDecoratorListener(decorators => {
	    babelHelpers.classPrivateFieldLooseBase(this, _decoratorNodes)[_decoratorNodes].forEach(nodeKey => {
	      const decorator = decorators[nodeKey];
	      const {
	        componentClass: DecoratorClass,
	        options: decoratorOptions
	      } = decorator;
	      const component = babelHelpers.classPrivateFieldLooseBase(this, _decoratorComponents)[_decoratorComponents].get(nodeKey);
	      const htmlElement = babelHelpers.classPrivateFieldLooseBase(this, _lexicalEditor)[_lexicalEditor].getElementByKey(nodeKey);
	      if (htmlElement != null && htmlElement.innerHTML && component) {
	        component.update(decoratorOptions);
	      } else if (htmlElement) {
	        babelHelpers.classPrivateFieldLooseBase(this, _decoratorComponents)[_decoratorComponents].set(nodeKey, new DecoratorClass({
	          textEditor: this,
	          target: htmlElement,
	          nodeKey,
	          options: decoratorOptions
	        }));
	      }
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _decoratorNodes)[_decoratorNodes].clear();
	  });
	  removeListeners.push(removeListener);
	  return ui_lexical_utils.mergeRegister(...removeListeners);
	}
	function _registerCommands2$a() {
	  return ui_lexical_utils.mergeRegister(this.registerCommand(ui_lexical_core.FOCUS_COMMAND, () => {
	    if (this.isCollapsingModeEnabled() && babelHelpers.classPrivateFieldLooseBase(this, _collapsingState)[_collapsingState] === CollapsingState.COLLAPSED && this.isEmpty(false)) {
	      this.toggleCollapsing();
	      return true;
	    }
	    this.emit('onFocus');
	    return false;
	  }, ui_lexical_core.COMMAND_PRIORITY_CRITICAL), this.registerCommand(ui_lexical_core.BLUR_COMMAND, event => {
	    if (this.isCollapsingModeEnabled() && (babelHelpers.classPrivateFieldLooseBase(this, _collapsingState)[_collapsingState] === CollapsingState.COLLAPSING || babelHelpers.classPrivateFieldLooseBase(this, _collapsingState)[_collapsingState] === CollapsingState.EXPANDING)) {
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
	    if (isInitialChange && babelHelpers.classPrivateFieldLooseBase(this, _options$1)[_options$1].get('collapsingMode') === true) {
	      babelHelpers.classPrivateFieldLooseBase(this, _initCollapsingMode)[_initCollapsingMode]();
	    }
	    if (!isInitialChange && tags.has('history-merge')) {
	      return;
	    }
	    this.emit('onChange', {
	      isInitialChange,
	      tags
	    });
	    const isEmpty = this.isEmpty();
	    if (babelHelpers.classPrivateFieldLooseBase(this, _prevEmptyStatus)[_prevEmptyStatus] !== isEmpty) {
	      babelHelpers.classPrivateFieldLooseBase(this, _prevEmptyStatus)[_prevEmptyStatus] = isEmpty;
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
	function _initBBCodeImportMap2() {
	  const importMap = new Map();
	  for (const [, plugin] of babelHelpers.classPrivateFieldLooseBase(this, _plugins$1)[_plugins$1]) {
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
	function _initBBCodeExportMap2() {
	  const exportMap = new Map();
	  for (const [, plugin] of babelHelpers.classPrivateFieldLooseBase(this, _plugins$1)[_plugins$1]) {
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
	function _initBBCodeScheme2() {
	  const filePlugin = this.getPlugin('File');
	  const fileTag = filePlugin != null && filePlugin.isEnabled() ? filePlugin.getMode() : 'none';
	  return new ui_bbcode_model.DefaultBBCodeScheme({
	    fileTag
	  });
	}
	function _initCollapsingMode2() {
	  babelHelpers.classPrivateFieldLooseBase(this, _collapsingMode)[_collapsingMode] = true;
	  if (this.isEmpty()) {
	    babelHelpers.classPrivateFieldLooseBase(this, _collapsingState)[_collapsingState] = CollapsingState.COLLAPSED;
	    main_core.Dom.addClass(this.getRootContainer(), '--collapsed');
	    this.emit('onCollapsingToggle', {
	      isOpen: false
	    });
	  } else {
	    babelHelpers.classPrivateFieldLooseBase(this, _collapsingState)[_collapsingState] = CollapsingState.EXPANDED;
	    main_core.Dom.removeClass(this.getRootContainer(), '--collapsed');
	    this.emit('onCollapsingToggle', {
	      isOpen: true
	    });
	  }
	}
	function _handleCollapsingTransition2() {
	  main_core.Event.unbind(this.getRootContainer(), 'transitionend', babelHelpers.classPrivateFieldLooseBase(this, _collapsingTransitionEnd)[_collapsingTransitionEnd]);
	  main_core.Dom.style(this.getRootContainer(), {
	    height: null,
	    overflow: null
	  });
	  main_core.Dom.style(this.getInnerContainer(), {
	    opacity: null
	  });
	  main_core.Dom.removeClass(this.getRootContainer(), ['--expanding', '--collapsing']);
	  if (babelHelpers.classPrivateFieldLooseBase(this, _collapsingState)[_collapsingState] === CollapsingState.COLLAPSING) {
	    main_core.Dom.addClass(this.getRootContainer(), '--collapsed');
	    babelHelpers.classPrivateFieldLooseBase(this, _collapsingState)[_collapsingState] = CollapsingState.COLLAPSED;
	    this.clear();
	    this.clearHistory();
	    this.blur();
	  } else {
	    this.focus();
	    babelHelpers.classPrivateFieldLooseBase(this, _collapsingState)[_collapsingState] = CollapsingState.EXPANDED;
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
	  provide() {
	    return {
	      editor: this.editor
	    };
	  },
	  beforeCreate() {
	    if (this.editorInstance === null) {
	      this.hasOwnEditor = true;
	      this.editor = new TextEditor(this.editorOptions);
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
	  Toolbar: Toolbar$1,
	  Underline,
	  Video,
	  Spoiler,
	  Smiley: Smiley$1,
	  Table,
	  Hashtag,
	  File
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

	exports.TextEditor = TextEditor;
	exports.TextEditorComponent = TextEditorComponent;
	exports.BasePlugin = BasePlugin;
	exports.Button = Button;
	exports.Plugins = Plugins;
	exports.Commands = Commands;
	exports.Constants = Constants;
	exports.Debug = Debug;

}((this.BX.UI.TextEditor = this.BX.UI.TextEditor || {}),BX.UI.BBCode,BX.UI.TextEditor,BX.Collections,BX.UI.BBCode,BX.UI.Lexical.RichText,BX.UI.Lexical.Selection,BX.UI.Lexical.Clipboard,BX.UI.Lexical.Table,BX.Event,BX.UI.Lexical.History,BX.Main,BX.Cache,BX,BX.UI.Lexical.List,BX.UI.Lexical.Link,BX.UI.Lexical.Text,BX.UI.Lexical.Core,BX.UI.Lexical.Utils,BX));
//# sourceMappingURL=text-editor.bundle.js.map
