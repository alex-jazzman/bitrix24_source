/**
 * Attention!
 * This file is generated automatically from the extension `ui.bbcode.parser`.
 * Any manual changes to this file are not allowed.
 *
 * If you need to make some changes, then make edits to the `ui.bbcode.parser`
 * and run the build using 'bitrix build'.
 * During the build, the code will be automatically ported to `bbcode/parser'.
 */

/** @module bbcode/parser */
jn.define('bbcode/parser', (require, exports, module) => {
	const {Type} = jn.require('type');
	const Model = jn.require('bbcode/model');
	const {BBCodeEncoder} = jn.require('bbcode/encoder');
	const {AstProcessor} = jn.require('bbcode/ast-processor');
	const {Linkify} = jn.require('linkify');

	function getByIndex(array, index) {
	  if (!Type.isArray(array)) {
	    throw new TypeError('array is not a array');
	  }
	  if (!Type.isInteger(index)) {
	    throw new TypeError('index is not a integer');
	  }
	  const preparedIndex = index < 0 ? array.length + index : index;
	  return array[preparedIndex];
	}

	class ParserScheme extends Model.BBCodeScheme {
	  getTagScheme(tagName) {
	    return new Model.BBCodeTagScheme({
	      name: 'any'
	    });
	  }
	  isAllowedTag(tagName) {
	    return true;
	  }
	  isChildAllowed(parent, child) {
	    return true;
	  }
	}

	const TAG_REGEX_GS = /\[(\/)?(\w+|\*)(.*?)]/gs;
	const LF = '\n';
	const CRLF = '\r\n';
	const TAB = '\t';
	const isLinebreak = symbol => {
	  return [LF, CRLF].includes(symbol);
	};
	const isTab = symbol => {
	  return symbol === TAB;
	};
	class BBCodeTokenizer {
	  static trimQuotes(value) {
	    const source = String(value);
	    if (/^["'].*["']$/g.test(source)) {
	      return source.slice(1, -1);
	    }
	    return value;
	  }
	  static toLowerCase(value) {
	    if (Type.isStringFilled(value)) {
	      return value.toLowerCase();
	    }
	    return value;
	  }
	  tokenize(bbcode) {
	    const tokens = [];
	    const listNestingLevels = [];
	    let lastIndex = 0;
	    bbcode.replace(TAG_REGEX_GS, (fullTag, slash, tagName, attrs, index) => {
	      if (index > lastIndex) {
	        const textBetween = bbcode.slice(lastIndex, index);
	        tokens.push(...this.parseText(textBetween));
	      }
	      const isOpeningTag = Boolean(slash) === false;
	      const startIndex = fullTag.length + index;
	      const attributes = this.parseAttributes(attrs);
	      const lowerCaseTagName = BBCodeTokenizer.toLowerCase(tagName);
	      if (lowerCaseTagName === 'list' && isOpeningTag) {
	        listNestingLevels.push(false);
	        tokens.push({
	          type: 'OPEN_TAG',
	          name: lowerCaseTagName,
	          value: attributes.value,
	          attributes: Object.fromEntries(attributes.attributes)
	        });
	      } else if (lowerCaseTagName === 'list' && !isOpeningTag) {
	        if (listNestingLevels.length > 0) {
	          if (listNestingLevels[listNestingLevels.length - 1]) {
	            tokens.push({
	              type: 'CLOSE_TAG',
	              name: '*'
	            });
	            listNestingLevels[listNestingLevels.length - 1] = false;
	          }
	          listNestingLevels.pop();
	        }
	        tokens.push({
	          type: 'CLOSE_TAG',
	          name: lowerCaseTagName
	        });
	      } else if (lowerCaseTagName === '*' && isOpeningTag) {
	        if (listNestingLevels.length > 0) {
	          if (listNestingLevels[listNestingLevels.length - 1]) {
	            tokens.push({
	              type: 'CLOSE_TAG',
	              name: '*'
	            });
	          }
	          listNestingLevels[listNestingLevels.length - 1] = true;
	        }
	        tokens.push({
	          type: 'OPEN_TAG',
	          name: lowerCaseTagName,
	          value: attributes.value,
	          attributes: Object.fromEntries(attributes.attributes)
	        });
	      } else if (isOpeningTag) {
	        const nextContent = bbcode.slice(startIndex);
	        const unclosed = !nextContent.includes(`[/${tagName}]`);
	        tokens.push({
	          type: 'OPEN_TAG',
	          name: lowerCaseTagName,
	          value: attributes.value,
	          attributes: Object.fromEntries(attributes.attributes),
	          unclosed
	        });
	      } else {
	        tokens.push({
	          type: 'CLOSE_TAG',
	          name: lowerCaseTagName
	        });
	      }
	      lastIndex = startIndex;
	    });
	    if (lastIndex < bbcode.length) {
	      const remainingText = bbcode.slice(lastIndex);
	      tokens.push(...this.parseText(remainingText));
	    }
	    for (let i = listNestingLevels.length - 1; i >= 0; i--) {
	      if (listNestingLevels[i]) {
	        tokens.push({
	          type: 'CLOSE_TAG',
	          name: '*'
	        });
	        listNestingLevels[i] = false;
	      }
	    }
	    return tokens;
	  }
	  parseText(text) {
	    const tokens = [];
	    if (Type.isStringFilled(text)) {
	      const regex = /\\r\\n|\\n|\\t|\\.|.|\r\n|\n|\t/g;
	      const matches = [...text.matchAll(regex)];
	      let textBuffer = '';
	      for (const match of matches) {
	        const char = match[0];
	        if (isLinebreak(char)) {
	          if (textBuffer) {
	            tokens.push({
	              type: 'TEXT',
	              content: textBuffer
	            });
	            textBuffer = '';
	          }
	          tokens.push({
	            type: 'LINEBREAK'
	          });
	        } else if (isTab(char)) {
	          if (textBuffer) {
	            tokens.push({
	              type: 'TEXT',
	              content: textBuffer
	            });
	            textBuffer = '';
	          }
	          tokens.push({
	            type: 'TAB'
	          });
	        } else {
	          textBuffer += char;
	        }
	      }
	      if (textBuffer) {
	        tokens.push({
	          type: 'TEXT',
	          content: textBuffer
	        });
	      }
	    }
	    return tokens;
	  }
	  parseAttributes(sourceAttributes) {
	    const result = {
	      value: '',
	      attributes: []
	    };
	    if (Type.isStringFilled(sourceAttributes)) {
	      if (sourceAttributes.startsWith('=')) {
	        result.value = BBCodeTokenizer.trimQuotes(sourceAttributes.slice(1));
	        return result;
	      }
	      return sourceAttributes.trim().split(' ').filter(Boolean).reduce((acc, item) => {
	        const [key, value = ''] = item.split('=');
	        acc.attributes.push([BBCodeTokenizer.toLowerCase(key), BBCodeTokenizer.trimQuotes(value)]);
	        return acc;
	      }, result);
	    }
	    return result;
	  }
	}

	const parserScheme = new ParserScheme();
	class BBCodeParser {
	  constructor(options = {}) {
	    this.allowedLinkify = true;
	    if (options.scheme) {
	      this.setScheme(options.scheme);
	    } else {
	      this.setScheme(new Model.DefaultBBCodeScheme());
	    }
	    if (Type.isFunction(options.onUnknown)) {
	      this.setOnUnknown(options.onUnknown);
	    } else {
	      this.setOnUnknown(BBCodeParser.defaultOnUnknownHandler);
	    }
	    if (options.encoder instanceof BBCodeEncoder) {
	      this.setEncoder(options.encoder);
	    } else {
	      this.setEncoder(new BBCodeEncoder());
	    }
	    if (Type.isBoolean(options.linkify)) {
	      this.setIsAllowedLinkify(options.linkify);
	    }
	  }
	  setScheme(scheme) {
	    this.scheme = scheme;
	  }
	  getScheme() {
	    return this.scheme;
	  }
	  setOnUnknown(handler) {
	    if (!Type.isFunction(handler)) {
	      throw new TypeError('handler is not a function');
	    }
	    this.onUnknownHandler = handler;
	  }
	  getOnUnknownHandler() {
	    return this.onUnknownHandler;
	  }
	  setEncoder(encoder) {
	    if (encoder instanceof BBCodeEncoder) {
	      this.encoder = encoder;
	    } else {
	      throw new TypeError('encoder is not BBCodeEncoder instance');
	    }
	  }
	  getEncoder() {
	    return this.encoder;
	  }
	  setIsAllowedLinkify(value) {
	    this.allowedLinkify = Boolean(value);
	  }
	  isAllowedLinkify() {
	    return this.allowedLinkify;
	  }
	  canBeLinkified(node) {
	    if (node.getName() === '#text') {
	      const notAllowedNodeNames = ['url', 'img', 'video', 'code'];
	      const inNotAllowedNode = notAllowedNodeNames.some(name => {
	        return Boolean(AstProcessor.findParentNodeByName(node, name));
	      });
	      return !inNotAllowedNode;
	    }
	    return false;
	  }
	  static defaultOnUnknownHandler(node, scheme) {
	    if (node.getType() === Model.BBCodeNode.ELEMENT_NODE) {
	      const nodeName = node.getName();
	      if (['left', 'center', 'right', 'justify'].includes(nodeName)) {
	        const newNode = scheme.createElement({
	          name: 'p'
	        });
	        node.replace(newNode);
	        newNode.setChildren(node.getChildren());
	      } else if (['background', 'color', 'size'].includes(nodeName)) {
	        const newNode = scheme.createElement({
	          name: 'b'
	        });
	        node.replace(newNode);
	        newNode.setChildren(node.getChildren());
	      } else if (['span', 'font'].includes(nodeName)) {
	        const fragment = scheme.createFragment({
	          children: node.getChildren()
	        });
	        node.replace(fragment);
	      } else {
	        const openingTag = node.getOpeningTag();
	        const closingTag = node.getClosingTag();
	        node.replace(scheme.createText(openingTag), ...node.getChildren(), scheme.createText(closingTag));
	      }
	    }
	  }
	  decodeAttributes(sourceAttributes) {
	    if (Type.isArrayFilled(sourceAttributes)) {
	      return sourceAttributes.map(([key, value]) => {
	        return [key, this.getEncoder().decodeAttribute(value)];
	      });
	    }
	    return sourceAttributes;
	  }
	  parse(bbcode) {
	    const tokenizer = new BBCodeTokenizer();
	    const tokens = tokenizer.tokenize(bbcode);
	    const result = parserScheme.createRoot();
	    const stack = [result];
	    const wasOpened = [];
	    let level = 0;
	    tokens.forEach(token => {
	      const parent = stack[level];
	      switch (token.type) {
	        case 'OPEN_TAG':
	          {
	            const tagScheme = this.getScheme().getTagScheme(token.name);
	            const isVoidTag = tagScheme && tagScheme.isVoid();
	            if (isVoidTag) {
	              const voidNode = parserScheme.createElement({
	                name: token.name,
	                value: this.getEncoder().decodeAttribute(token.value),
	                attributes: this.decodeAttributes(token.attributes)
	              });
	              voidNode.setScheme(this.getScheme());
	              parent.appendChild(voidNode);
	            } else if (token.unclosed) {
	              parent.appendChild(parserScheme.createText(`[${token.name}]`));
	            } else {
	              const currentNode = parserScheme.createElement({
	                name: token.name,
	                value: this.getEncoder().decodeAttribute(token.value),
	                attributes: this.decodeAttributes(token.attributes)
	              });
	              parent.appendChild(currentNode);
	              wasOpened.push(token.name);
	              stack.push(currentNode);
	              level++;
	            }
	            break;
	          }
	        case 'CLOSE_TAG':
	          {
	            if (wasOpened.includes(token.name)) {
	              const openedTagIndex = wasOpened.indexOf(token.name);
	              wasOpened.splice(openedTagIndex, 1);
	              stack.pop();
	              level--;
	            } else {
	              parent.appendChild(parserScheme.createText(`[/${token.name}]`));
	            }
	            break;
	          }
	        case 'TEXT':
	          {
	            parent.appendChild(parserScheme.createText({
	              content: this.getEncoder().decodeText(token.content)
	            }));
	            break;
	          }
	        case 'LINEBREAK':
	          {
	            parent.appendChild(parserScheme.createNewLine());
	            break;
	          }
	        case 'TAB':
	          {
	            parent.appendChild(parserScheme.createTab());
	            break;
	          }
	        default:
	          {
	            break;
	          }
	      }
	    });
	    const getFinalLineBreaksIndexes = node => {
	      let skip = false;
	      return node.getChildren().reduceRight((acc, child, index) => {
	        if (!skip && child.getName() === '#linebreak') {
	          acc.push(index);
	        } else if (!skip && child.getName() !== '#tab') {
	          skip = true;
	        }
	        return acc;
	      }, []);
	    };
	    Model.BBCodeNode.flattenAst(result).forEach(node => {
	      if (node.getName() === '*') {
	        const finalLinebreaksIndexes = getFinalLineBreaksIndexes(node);
	        if (finalLinebreaksIndexes.length === 1) {
	          node.setChildren(node.getChildren().slice(0, getByIndex(finalLinebreaksIndexes, 0)));
	        }
	        if (finalLinebreaksIndexes.length > 1 && (finalLinebreaksIndexes & 2) === 0) {
	          node.setChildren(node.getChildren().slice(0, getByIndex(finalLinebreaksIndexes, 0)));
	        }
	      }
	      if (this.isAllowedLinkify() && this.canBeLinkified(node)) {
	        const content = node.toString({
	          encode: false
	        });
	        const MultiTokens = Linkify.tokenize(content);
	        const nodes = MultiTokens.map(token => {
	          if (token.t === 'url') {
	            return parserScheme.createElement({
	              name: 'url',
	              value: token.toHref().replace(/^http:\/\//, 'https://'),
	              children: [parserScheme.createText(token.toString())]
	            });
	          }
	          if (token.t === 'email') {
	            return parserScheme.createElement({
	              name: 'url',
	              value: token.toHref(),
	              children: [parserScheme.createText(token.toString())]
	            });
	          }
	          return parserScheme.createText(token.toString());
	        });
	        node.replace(...nodes);
	      }
	    });
	    Model.BBCodeNode.flattenAst(result).forEach(node => {
	      const tagScheme = this.getScheme().getTagScheme(node);
	      if (tagScheme) {
	        tagScheme.runOnParseHandler(node);
	      }
	    });
	    result.setScheme(this.getScheme(), this.getOnUnknownHandler());
	    return result;
	  }
	}

	exports.BBCodeParser = BBCodeParser;

});